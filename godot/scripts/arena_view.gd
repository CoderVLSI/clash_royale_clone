class_name ArenaView
extends Node3D
## Renders a Sim in 3D: builds the arena once, then mirrors units/towers/projectiles/effects every frame.
## Sim space (x, y in px, y down, player at bottom) -> world: X = (x - W/2)*S, Z = (y - H/2)*S.

const S := 0.05          # metres per sim px along X (and for radii)
const SZ := 0.04         # metres per sim px along Z: the arena is compressed lengthwise to real Clash Royale proportions
const ZR := SZ / S
const HP_W := 1.5

var sim: Sim
var unit_nodes: Dictionary = {}      # unit id -> {node, target, hp_fg, hp_root, last_pos}
var tower_nodes: Dictionary = {}     # tower id -> {node, fg, label}
var proj_nodes: Dictionary = {}      # projectile id -> Node3D
var fx_root: Node3D
var units_root: Node3D
var proj_root: Node3D
var place_overlay: MeshInstance3D
var river_mat: StandardMaterial3D
var _time := 0.0
var shake := 0.0

static func to3(x: float, y: float, h: float = 0.0) -> Vector3:
	return Vector3((x - Sim.W / 2.0) * S, h, (y - Sim.H / 2.0) * SZ)

static func from3(p: Vector3) -> Vector2:
	return Vector2(p.x / S + Sim.W / 2.0, p.z / SZ + Sim.H / 2.0)

func setup(s: Sim) -> void:
	sim = s
	_build_environment()
	_build_arena()
	units_root = Node3D.new()
	add_child(units_root)
	proj_root = Node3D.new()
	add_child(proj_root)
	fx_root = Node3D.new()
	add_child(fx_root)
	_build_towers()

# ----------------------------------------------------------------------------- environment
const FOREST := Color("2f6a3b")
const PLAZA_A := Color("d6d0bd")
const PLAZA_B := Color("cec8b3")
const PLAZA_C := Color("dcd7c6")
const STONE := Color("c2bca6")
const STONE_D := Color("a29c86")
const HEART := Color("bbb59f")
const RIVER_SHADER := """
shader_type spatial;
uniform vec3 col1 = vec3(0.42, 0.10, 0.66);
uniform vec3 col2 = vec3(0.78, 0.34, 0.98);
varying vec3 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	float t = TIME;
	float a = sin(wpos.x * 0.6 + t * 0.3) * 0.5 + 0.5;
	float b = sin(wpos.x * 0.35 - wpos.z * 1.2 - t * 0.4) * 0.5 + 0.5;
	float crack = smoothstep(0.97, 1.0, sin(wpos.x * 1.1 + sin(wpos.z * 1.6 + t * 0.7) * 0.5) * 0.5 + 0.5) * 0.7;
	vec3 c = mix(col1, col2, a * b * 0.3);
	ALBEDO = c + crack * vec3(0.45, 0.25, 0.65);
	EMISSION = c * 0.55 + crack * vec3(0.55, 0.35, 0.8);
	ROUGHNESS = 0.25;
}
"""

func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = FOREST.darkened(0.3)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("f2f0ea")
	env.ambient_light_energy = 0.3
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-62), deg_to_rad(-30), 0)
	sun.light_energy = 0.42
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 80.0
	sun.light_color = Color("fff8ee")
	add_child(sun)

static func heart_mesh() -> ArrayMesh:
	# flat heart polygon (parametric heart curve), ~1 m wide, lying in the XZ plane
	var pts := PackedVector2Array()
	for i in 40:
		var t := TAU * i / 40.0
		pts.append(Vector2(16.0 * pow(sin(t), 3), 13.0 * cos(t) - 5.0 * cos(2 * t) - 2.0 * cos(3 * t) - cos(4 * t)) / 32.0)
	var verts := PackedVector3Array()
	var idx := PackedInt32Array()
	verts.append(Vector3(0, 0, -0.05))
	for p in pts:
		verts.append(Vector3(p.x, 0, -p.y))
	for i in pts.size():
		idx.append_array([0, 1 + (i + 1) % pts.size(), 1 + i])
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = verts
	arr[Mesh.ARRAY_INDEX] = idx
	var normals := PackedVector3Array()
	normals.resize(verts.size())
	normals.fill(Vector3.UP)
	arr[Mesh.ARRAY_NORMAL] = normals
	var m := ArrayMesh.new()
	m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	return m

func _multi(mesh: Mesh, material: Material, xforms: Array, shadows: bool = false) -> MultiMeshInstance3D:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = xforms.size()
	for i in xforms.size():
		mm.set_instance_transform(i, xforms[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	if material != null:
		mmi.material_override = material
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mmi

func _build_arena() -> void:
	var half_w := Sim.W * S / 2.0
	var half_l := Sim.H * SZ / 2.0
	var river_half := 1.3
	var princess_z := absf(to3(0, 150).z)
	var rng := RandomNumberGenerator.new()
	rng.seed = 11
	# forest floor
	add_child(ModelFactory.box(Vector3(90, 0.6, 100), FOREST, Vector3(0, -0.75, 0)))
	for i in 18:
		add_child(ModelFactory.box(Vector3(rng.randf_range(3, 8), 0.05, rng.randf_range(3, 8)), FOREST.lightened(rng.randf_range(0.04, 0.1)),
			Vector3(rng.randf_range(-24, 24), -0.44, rng.randf_range(-30, 30))))
	# stone frame (plaza border)
	var fw := 1.3
	add_child(ModelFactory.box(Vector3(half_w * 2 + fw * 2, 0.5, half_l * 2 + fw * 2), STONE, Vector3(0, -0.28, 0)))
	# plaza tiles: 1 m grid, three shades, per half
	var shades := [[], [], []]
	var nx := int(ceil(half_w * 2))
	var nz_half := int(ceil((half_l - river_half)))
	for side in [-1, 1]:
		for iz in nz_half:
			for ix in nx:
				var x := -half_w + 0.5 + ix
				var z: float = side * (river_half + 0.5 + iz)
				if absf(z) > half_l:
					continue
				var k := rng.randi() % 3
				shades[k].append(Transform3D(Basis(), Vector3(x, -0.04, z)))
	var tile := BoxMesh.new()
	tile.size = Vector3(0.97, 0.12, 0.97)
	var cols := [PLAZA_A, PLAZA_B, PLAZA_C]
	for k in 3:
		add_child(_multi(tile, ModelFactory.mat(cols[k], 0.95), shades[k]))
	# paved lanes (lighter) with curbs, from each princess pad to the river banks
	for lx in [-5.0, 5.0]:
		for side in [-1, 1]:
			var z0: float = side * (river_half + 0.1)
			var z1: float = side * princess_z
			var zc := (z0 + z1) / 2.0
			var zl := absf(z1 - z0)
			add_child(ModelFactory.box(Vector3(3.5, 0.1, zl), Color("f1ead3"), Vector3(lx, 0.02, zc), Vector3.ZERO, 0.95))
			for cx in [-1.9, 1.9]:
				add_child(ModelFactory.box(Vector3(0.28, 0.2, zl), Color("cfc6a8"), Vector3(lx + cx, 0.08, zc), Vector3.ZERO, 0.95))
	# tower pads + soft purple shadow blobs
	for t in sim.towers:
		var king: bool = t["type"] == "king"
		var p := to3(t["x"], t["y"])
		var ps := 6.0 if king else 4.6
		add_child(ModelFactory.box(Vector3(ps, 0.16, ps), Color("d4cdb8"), Vector3(p.x, 0.03, p.z), Vector3.ZERO, 0.9))
		add_child(ModelFactory.box(Vector3(ps - 0.7, 0.18, ps - 0.7), Color("e3dcc6"), Vector3(p.x, 0.04, p.z), Vector3.ZERO, 0.9))
		var sh := ModelFactory.cyl(ps * 0.5, ps * 0.5, 0.02, Color(0.35, 0.28, 0.6, 0.45), Vector3(p.x - 0.9, 0.2, p.z + 0.7), 14)
		sh.material_override = ModelFactory.mat(Color(0.35, 0.28, 0.6, 0.45), 1.0, 0.0, true)
		add_child(sh)
	# heart tiles scattered across the plaza
	var hm := heart_mesh()
	var hx: Array = []
	for i in 80:
		var x := rng.randf_range(-half_w + 1.0, half_w - 1.0)
		var z := rng.randf_range(-half_l + 1.0, half_l - 1.0)
		if absf(z) < river_half + 1.0:
			continue
		var bad := false
		for t in sim.towers:
			var tp := to3(t["x"], t["y"])
			if Vector2(x - tp.x, z - tp.z).length() < 3.2:
				bad = true
		if bad:
			continue
		var sc := rng.randf_range(0.45, 0.8)
		hx.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * sc), Vector3(x, 0.025, z)))
	add_child(_multi(hm, ModelFactory.mat(HEART, 0.95), hx))
	# river (animated purple) running out through the frame on both sides
	var rmat := ShaderMaterial.new()
	var rs := Shader.new()
	rs.code = RIVER_SHADER
	rmat.shader = rs
	var river := MeshInstance3D.new()
	var rq := BoxMesh.new()
	rq.size = Vector3(half_w * 2 + 14, 0.1, river_half * 2)
	river.mesh = rq
	river.material_override = rmat
	river.position = Vector3(0, -0.02, 0)
	add_child(river)
	# river banks + gate blocks with hearts at both ends
	for sz in [-1, 1]:
		add_child(ModelFactory.box(Vector3(half_w * 2, 0.3, 0.3), STONE_D, Vector3(0, 0.02, sz * (river_half + 0.12))))
	for sx in [-1, 1]:
		var gate := ModelFactory.box(Vector3(2.2, 0.9, river_half * 2 + 3.2), STONE, Vector3(sx * (half_w + 0.5), 0.35, 0))
		add_child(gate)
		var gh := MeshInstance3D.new()
		gh.mesh = hm
		gh.material_override = ModelFactory.mat(Color("e9e1c7"), 0.9)
		gh.position = Vector3(sx * (half_w + 0.5), 0.82, 0)
		gh.scale = Vector3.ONE * 1.4
		add_child(gh)
	# frame walls (low), leaving the river gap
	for sx in [-1, 1]:
		for sz in [-1, 1]:
			var len_z := half_l - river_half - 1.2
			add_child(ModelFactory.box(Vector3(1.1, 0.7, len_z), STONE, Vector3(sx * (half_w + 0.65), 0.1, sz * (river_half + 1.6 + len_z / 2.0))))
	for sz in [-1, 1]:
		add_child(ModelFactory.box(Vector3(half_w * 2 + 2.4, 0.7, 1.1), STONE, Vector3(0, 0.1, sz * (half_l + 0.65))))
	# bridges: three planks + heart inlay
	for bx in [Sim.BRIDGE_L, Sim.BRIDGE_R]:
		var wx: float = (bx - Sim.W / 2.0) * S
		var bridge := Node3D.new()
		bridge.position = Vector3(wx, 0.0, 0)
		var blen := river_half * 2 + 1.4
		for i in 3:
			bridge.add_child(ModelFactory.box(Vector3(0.95, 0.3, blen), Color("b07a43") if i != 1 else Color("bd8850"), Vector3((i - 1) * 1.0, 0.12, 0), Vector3.ZERO, 0.9))
			bridge.add_child(ModelFactory.box(Vector3(0.06, 0.34, blen), Color("6f4824"), Vector3((i - 1) * 1.0 + 0.5, 0.12, 0), Vector3.ZERO, 0.9))
		var bh := MeshInstance3D.new()
		bh.mesh = hm
		bh.material_override = ModelFactory.mat(Color("e8b95c"), 0.8)
		bh.position = Vector3(0, 0.3, 0)
		bh.scale = Vector3.ONE * 1.5
		bridge.add_child(bh)
		bridge.add_child(ModelFactory.box(Vector3(3.3, 0.18, 0.4), Color("8a5a2d"), Vector3(0, 0.1, blen / 2.0 - 0.1)))
		bridge.add_child(ModelFactory.box(Vector3(3.3, 0.18, 0.4), Color("8a5a2d"), Vector3(0, 0.1, -blen / 2.0 + 0.1)))
		add_child(bridge)
	# forest: pines (multimesh), rocks, logs
	var pine_mesh: Mesh = ModelFactory.glb_mesh("pine")
	if pine_mesh != null:
		var px: Array = []
		var tries := 0
		while px.size() < 120 and tries < 1200:
			tries += 1
			var x := rng.randf_range(-27.0, 27.0)
			var z := rng.randf_range(-33.0, 33.0)
			if absf(x) < half_w + 3.4 and absf(z) < half_l + 3.4:
				continue
			var sc := rng.randf_range(0.75, 1.5)
			px.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc * rng.randf_range(0.9, 1.3), sc)), Vector3(x, -0.4, z)))
		add_child(_multi(pine_mesh, null, px, true))
	var rock_mesh: Mesh = ModelFactory.glb_mesh("rock")
	if rock_mesh != null:
		var rx: Array = []
		for i in 26:
			var x := rng.randf_range(-24.0, 24.0)
			var z := rng.randf_range(-31.0, 31.0)
			if absf(x) < half_w + 2.2 and absf(z) < half_l + 2.2:
				continue
			var sc := rng.randf_range(0.5, 1.5)
			rx.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3.ONE * sc), Vector3(x, -0.3, z)))
		add_child(_multi(rock_mesh, null, rx, true))
	var log_mesh: Mesh = ModelFactory.glb_mesh("log")
	if log_mesh != null:
		var lx2: Array = [Transform3D(Basis(Vector3.UP, 0.4), Vector3(4.5, -0.1, half_l + 3.0)), Transform3D(Basis(Vector3.UP, -0.2).scaled(Vector3.ONE * 0.8), Vector3(-7.5, -0.1, half_l + 4.2))]
		add_child(_multi(log_mesh, null, lx2, true))
	# placement overlay (shown while dragging a card): translucent red over the area you cannot deploy in
	place_overlay = ModelFactory.box(Vector3(half_w * 2, 0.05, 1.0), Color(1, 0.15, 0.15, 0.32), Vector3(0, 0.07, 0))
	place_overlay.material_override = ModelFactory.mat(Color(1, 0.15, 0.15, 0.32), 1.0, 0.0, true)
	place_overlay.visible = false
	add_child(place_overlay)

# ----------------------------------------------------------------------------- towers

static var _badge_tex: ImageTexture

static func badge_texture() -> ImageTexture:
	if _badge_tex != null:
		return _badge_tex
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:
			var d := Vector2(x - 32, y - 32).length()
			var c := Color(0, 0, 0, 0)
			if d < 30.0:
				c = Color("f5c518") if d < 25.0 else Color("8a5a00")
				if d < 25.0 and y < 24:
					c = c.lightened(0.18)
			img.set_pixel(x, y, c)
	_badge_tex = ImageTexture.create_from_image(img)
	return _badge_tex

func _build_towers() -> void:
	for t in sim.towers:
		var king: bool = t["type"] == "king"
		var node := ModelFactory.build_tower(king, t["opp"], t["towerSubType"])
		node.position = to3(t["x"], t["y"])
		add_child(node)
		var plate := _make_tower_plate(king, t["opp"], 14 if t["opp"] else 15)
		var p := to3(t["x"], t["y"])
		if king and not t["opp"]:
			plate["root"].position = Vector3(p.x, 1.4, p.z + 3.6)
		else:
			plate["root"].position = Vector3(p.x, 7.4 if king else 5.0, p.z)
		add_child(plate["root"])
		plate["dead"] = false
		plate["node"] = node
		tower_nodes[t["id"]] = plate

func _plate_mat(c: Color, tex: Texture2D = null, prio: int = 6) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	if tex != null:
		m.albedo_texture = tex
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.no_depth_test = true
	m.render_priority = prio
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	return m

func _quad(size: Vector2, mat: Material, pos: Vector3) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = size
	mi.mesh = q
	mi.material_override = mat
	mi.position = pos
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi

func _make_tower_plate(king: bool, opp: bool, level: int) -> Dictionary:
	# Level badge + HP bar with the number, like the reference arena.
	var root := Node3D.new()
	var w := 3.4 if king else 3.0
	var team := ModelFactory.team_color(opp).lightened(0.08)
	root.add_child(_quad(Vector2(w + 0.12, 0.62), _plate_mat(Color(0.05, 0.05, 0.1, 0.9), null, 5), Vector3(0.35, 0, 0)))
	var fg := _quad(Vector2(w, 0.5), _plate_mat(team, null, 6), Vector3(0.35, 0, 0.001))
	root.add_child(fg)
	root.add_child(_quad(Vector2(0.95, 0.95), _plate_mat(Color.WHITE, badge_texture(), 7), Vector3(-w / 2.0 - 0.15, 0.02, 0.002)))
	var lv := Label3D.new()
	lv.text = str(level)
	lv.font_size = 52
	lv.pixel_size = 0.0125
	lv.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	lv.no_depth_test = true
	lv.outline_size = 10
	lv.modulate = Color("fff3b0")
	lv.render_priority = 9
	lv.position = Vector3(-w / 2.0 - 0.15, 0.04, 0.01)
	root.add_child(lv)
	var hp := Label3D.new()
	hp.font_size = 48
	hp.pixel_size = 0.0125
	hp.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	hp.no_depth_test = true
	hp.outline_size = 12
	hp.render_priority = 9
	hp.position = Vector3(0.45, 0.03, 0.01)
	root.add_child(hp)
	return {"root": root, "fg": fg, "w": w, "label": hp, "cx": 0.35}

func _make_hp_bar(w: float, opp: bool) -> Dictionary:
	var root := Node3D.new()
	var bg := MeshInstance3D.new()
	var qm := QuadMesh.new()
	qm.size = Vector2(w + 0.1, 0.3)
	bg.mesh = qm
	bg.material_override = _bar_mat(Color(0.05, 0.05, 0.08, 0.85))
	root.add_child(bg)
	var fg := MeshInstance3D.new()
	var qf := QuadMesh.new()
	qf.size = Vector2(w, 0.2)
	fg.mesh = qf
	fg.material_override = _bar_mat(ModelFactory.team_color(opp).lightened(0.1))
	fg.position.z = 0.01
	root.add_child(fg)
	return {"root": root, "fg": fg, "w": w}

func _bar_mat(c: Color) -> StandardMaterial3D:
	var key := "bar_" + c.to_html(true)
	if ModelFactory._mats.has(key):
		return ModelFactory._mats[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.no_depth_test = true
	m.render_priority = 5
	if c.a < 1.0:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	ModelFactory._mats[key] = m
	return m

# ----------------------------------------------------------------------------- per-frame sync

func _process(delta: float) -> void:
	if sim == null:
		return
	_time += delta
	if river_mat:
		river_mat.uv1_offset.x = _time * 0.05
	_sync_towers()
	_sync_units(delta)
	_sync_projectiles(delta)
	_drain_fx()

func _sync_towers() -> void:
	for t in sim.towers:
		var tn: Dictionary = tower_nodes[t["id"]]
		var ratio := clampf(t["hp"] / t["maxHp"], 0.0, 1.0)
		tn["fg"].scale.x = maxf(ratio, 0.001)
		tn["fg"].position.x = tn["cx"] - (1.0 - ratio) * tn["w"] / 2.0
		tn["label"].text = str(maxi(0, int(ceil(t["hp"]))))
		if t["hp"] <= 0 and not tn["dead"]:
			tn["dead"] = true
			Sfx.play("king_tower_fall" if t["type"] == "king" else "tower_destroyed")
			tn["root"].visible = false
			_explode(to3(t["x"], t["y"], 2.0), 3.5, Color("ff9a3c"))
			_sink_tower(tn["node"])
			shake = 0.6

func _sink_tower(node: Node3D) -> void:
	var tw := create_tween()
	tw.tween_property(node, "scale", Vector3(1, 0.25, 1), 0.6).set_trans(Tween.TRANS_BOUNCE)
	tw.parallel().tween_property(node, "position:y", -0.3, 0.6)

func _sync_units(delta: float) -> void:
	var alive := {}
	for u in sim.units:
		var id: int = u["id"]
		alive[id] = true
		var rec: Variant = unit_nodes.get(id)
		if rec == null:
			rec = _make_unit_node(u)
			unit_nodes[id] = rec
		var target := to3(u["x"], u["y"])
		var node: Node3D = rec["node"]
		var prev := node.position
		node.position = prev.lerp(target, 1.0 - exp(-18.0 * delta))
		var mv := target - prev
		mv.y = 0
		if mv.length() > 0.004:
			var yaw := atan2(-mv.x, -mv.z)
			node.rotation.y = lerp_angle(node.rotation.y, yaw, 1.0 - exp(-14.0 * delta))
		elif rec.get("face_to") != null:
			node.rotation.y = lerp_angle(node.rotation.y, rec["face_to"], 1.0 - exp(-14.0 * delta))
		elif rec["first"]:
			node.rotation.y = 0.0 if not u["opp"] else PI
			rec["first"] = false
		# ---- procedural animation (legs / arms / wings via shader; body bob, lean, lunge, hover on the node) ----
		var model: Node3D = node.get_node("Model")
		var spd: float = mv.length() / maxf(delta, 0.001)            # world units / s
		rec["spd"] = lerpf(rec["spd"], spd, 1.0 - exp(-10.0 * delta))
		var moving: bool = rec["spd"] > 0.25
		var ph: float = rec["phase"]
		var flying_u: bool = u["type"] == "flying"
		var charging: bool = rec["spd"] > 7.0
		rec["walk"] = lerpf(rec["walk"], 1.0 if moving else 0.0, 1.0 - exp(-12.0 * delta))
		var freq := clampf(5.0 + rec["spd"] * 1.1, 5.0, 17.0)
		_anim_param(rec, "walk", snappedf(rec["walk"] if not flying_u else 0.0, 0.05))
		_anim_param(rec, "freq", snappedf(freq, 0.5))
		_anim_param(rec, "flap", 15.0 if flying_u else 0.0)
		# attack swing (arm strike) + body lunge, triggered by the sim's attack events
		var swing := 0.0
		var lunge_fwd := 0.0
		if rec["swing_t"] < 1.0:
			rec["swing_t"] = minf(1.0, rec["swing_t"] + delta / 0.3)
			swing = sin(rec["swing_t"] * PI)
			lunge_fwd = swing
		_anim_param(rec, "swing", snappedf(swing, 0.05))
		var fwd := Vector3(0, 0, -1)   # model forward (node is yawed toward its target)
		var hover := 0.0
		var lean := 0.0
		var roll := 0.0
		var squash := 1.0
		if flying_u:
			hover = 2.2 + sin(_time * 3.0 + ph) * 0.2 + (0.15 if moving else 0.0)
			lean = -0.16 if moving else 0.0          # pitch into the direction of travel
			roll = sin(_time * 2.2 + ph) * (0.1 if moving else 0.05)
		elif u["type"] != "building":
			var bobf := 2.0 if charging else 1.0
			var bob: float = absf(sin(_time * freq * 0.5 + ph)) * (0.14 if charging else 0.09) * rec["walk"]
			hover = bob
			lean = -(0.38 if charging else 0.1) * rec["walk"]
			roll = sin(_time * freq * 0.5 + ph) * 0.06 * rec["walk"] * bobf
			# idle breathing
			squash = 1.0 + sin(_time * 2.4 + ph) * 0.02 * (1.0 - rec["walk"])
		else:
			squash = 1.0 + (swing * -0.06)           # towers / buildings recoil when firing
		model.position = Vector3(0, hover, 0) + fwd * lunge_fwd * 0.55 * (0.0 if u["type"] == "building" else 1.0)
		model.rotation.x = lean - lunge_fwd * 0.28
		if u["stunUntil"] > sim.now:
			model.rotation.z = sin(_time * 30.0) * 0.12
		else:
			model.rotation.z = lerpf(model.rotation.z, roll, 0.3)
		model.scale = Vector3(1.0 + lunge_fwd * 0.05, squash - lunge_fwd * 0.1, 1.0 + lunge_fwd * 0.12)
		# shadow: flyers cast a darker, smaller shadow the higher they hover
		var shd: Variant = rec.get("shadow")
		if shd != null:
			var hh: float = 1.0 if not flying_u else clampf(1.15 - (hover - 2.0) * 0.5, 0.7, 1.15)
			(shd as Node3D).scale = Vector3(hh, 1.0, hh)
		# status markers + cloaking
		var st: Node3D = rec["status"]
		st.get_node("Ice").visible = u["stunUntil"] > sim.now and float(u.get("frozenUntil", 0.0)) > sim.now
		st.get_node("Rage").visible = float(u.get("rageUntil", 0.0)) > sim.now
		st.get_node("Shield").visible = u["currentShieldHp"] > 0.0
		st.get_node("Curse").visible = float(u.get("cursedUntil", 0.0)) > sim.now
		var hid: Variant = u.get("hidden")
		var cloaked: bool = hid is Dictionary and hid.get("active", false)
		node.visible = true
		model.visible = not cloaked or str(u["spriteId"]).contains("tesla") == false
		if cloaked and str(u["spriteId"]).contains("tesla"):
			node.position.y = -1.6
		elif u.get("isClone", false):
			model.scale = Vector3.ONE * 0.85
		rec["bar"].visible = rec["bar"].visible and not cloaked
		# hp bar
		var ratio := clampf(u["hp"] / u["maxHp"], 0.0, 1.0)
		rec["fg"].scale.x = maxf(ratio, 0.001)
		rec["fg"].position.x = -(1.0 - ratio) * rec["w"] / 2.0
		rec["bar"].visible = ratio < 0.999 or u["type"] == "building"
		if u["currentShieldHp"] > 0.0:
			rec["fg"].material_override = _bar_mat(Color("c0c6cf"))
	for id in unit_nodes.keys():
		if not alive.has(id):
			var rec: Dictionary = unit_nodes[id]
			var dn: Node3D = rec["node"]
			rec["bar"].visible = false
			unit_nodes.erase(id)
			# death animation: topple back, shrink and sink, then free
			var mdl := dn.get_node_or_null("Model") as Node3D
			var tw := create_tween().set_parallel(true)
			if mdl != null:
				tw.tween_property(mdl, "rotation:x", 1.2, 0.35).set_ease(Tween.EASE_IN)
			tw.tween_property(dn, "scale", Vector3(1.2, 0.05, 1.2), 0.38).set_ease(Tween.EASE_IN)
			tw.chain().tween_callback(dn.queue_free)

func _make_unit_node(u: Dictionary) -> Dictionary:
	var node := ModelFactory.build_unit(u)
	node.position = to3(u["x"], u["y"])
	units_root.add_child(node)
	var s := ModelFactory.unit_scale(u)
	var w := 0.9 + 0.5 * s
	var bar := _make_hp_bar(w, u["opp"])
	bar["root"].position = Vector3(0, 2.0 * s + 0.9 + (2.2 if u["type"] == "flying" else 0.0), 0)
	node.add_child(bar["root"])
	# spawn pop animation
	node.scale = Vector3.ONE * 0.2
	var tw := create_tween()
	tw.tween_property(node, "scale", Vector3.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	var status := _make_status(s, u["type"] == "flying")
	node.add_child(status)
	var rec := {"node": node, "fg": bar["fg"], "w": w, "bar": bar["root"], "phase": randf() * TAU, "lunge": 0.0, "first": true, "face_to": null, "status": status,
		"meshes": [], "walk": 0.0, "swing_t": 1.0, "last_pos": node.position, "spd": 0.0, "anim_cache": {}}
	_setup_anim(rec, node, u)
	# ground shadow: dark blob under every walker, bigger + sharper under flyers so they read as airborne
	if u["type"] != "building":
		var fly: bool = u["type"] == "flying"
		var rad := (0.5 + 0.45 * s) * (1.1 if fly else 0.8)
		var sh := ModelFactory.cyl(rad, rad, 0.02, Color.BLACK, Vector3(0, 0.035, 0), 20)
		sh.material_override = ModelFactory.mat(Color(0, 0, 0, 0.5 if fly else 0.28), 1.0, 0.0, true)
		sh.name = "Shadow"
		node.add_child(sh)
		rec["shadow"] = sh
		rec["shadow_r"] = rad
	return rec

func _setup_anim(rec: Dictionary, node: Node3D, u: Dictionary) -> void:
	var meshes: Array = []
	var stack: Array = [node.get_node("Model")]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		if n is MeshInstance3D and (n as MeshInstance3D).mesh != null and not (n.name in ["Shadow", "Ice", "Rage", "Shield", "Curse"]):
			var mat_ok := false
			for i in (n as MeshInstance3D).mesh.get_surface_count():
				if (n as MeshInstance3D).get_surface_override_material(i) is ShaderMaterial:
					mat_ok = true
			if mat_ok:
				meshes.append(n)
		stack.append_array(n.get_children())
	rec["meshes"] = meshes
	if meshes.is_empty():
		return
	var box: AABB = (meshes[0] as MeshInstance3D).get_aabb()
	for m in meshes:
		box = box.merge((m as MeshInstance3D).get_aabb())
	var flying: bool = u["type"] == "flying"
	var h := box.size.y
	var wide := maxf(box.size.x, box.size.z)
	var upright := h > 0.9 * wide
	var leg_h := h * (0.3 if upright else 0.45)
	var arms := 1.0 if (upright and not flying and u["type"] != "building") else 0.0
	var mats: Array = []
	for m in meshes:
		var mi := m as MeshInstance3D
		for i in mi.mesh.get_surface_count():
			var sm := mi.get_surface_override_material(i) as ShaderMaterial
			if sm != null:
				var dup := sm.duplicate() as ShaderMaterial
				mi.set_surface_override_material(i, dup)
				mats.append(dup)
	rec["mats"] = mats
	for dm in mats:
		(dm as ShaderMaterial).set_shader_parameter("phase", rec["phase"])
		(dm as ShaderMaterial).set_shader_parameter("leg_h", leg_h)
		(dm as ShaderMaterial).set_shader_parameter("arm_x", maxf(box.size.x * 0.28, 0.2))
		(dm as ShaderMaterial).set_shader_parameter("arms", arms)

func _anim_param(rec: Dictionary, name: String, v: float) -> void:
	var cache: Dictionary = rec["anim_cache"]
	if cache.get(name, -999.0) == v:
		return
	cache[name] = v
	for dm in rec.get("mats", []):
		(dm as ShaderMaterial).set_shader_parameter(name, v)

func _make_status(s: float, flying: bool) -> Node3D:
	var root := Node3D.new()
	root.position.y = 2.2 if flying else 0.0
	var ice := ModelFactory.box(Vector3(1.4 * s, 2.0 * s, 1.4 * s), Color("9fe3ff"), Vector3(0, 1.0 * s, 0))
	ice.material_override = ModelFactory.mat(Color(0.6, 0.9, 1.0, 0.55), 0.2, 0.4)
	ice.name = "Ice"
	ice.visible = false
	root.add_child(ice)
	var rage := ModelFactory.cyl(0.9 * s, 0.9 * s, 0.05, Color("ff3b3b"), Vector3(0, 0.1, 0), 16)
	rage.material_override = ModelFactory.mat(Color(1, 0.2, 0.2, 0.5), 0.9, 0.9, true)
	rage.name = "Rage"
	rage.visible = false
	root.add_child(rage)
	var shield := ModelFactory.sphere(0.95 * s, Color("c0d4ff"), Vector3(0, 0.9 * s, 0))
	shield.material_override = ModelFactory.mat(Color(0.7, 0.8, 1.0, 0.35), 0.2, 0.3)
	shield.name = "Shield"
	shield.visible = false
	root.add_child(shield)
	var curse := ModelFactory.cyl(0.7 * s, 0.7 * s, 0.05, Color("b66cff"), Vector3(0, 0.12, 0), 16)
	curse.material_override = ModelFactory.mat(Color(0.7, 0.4, 1.0, 0.6), 0.9, 1.0, true)
	curse.name = "Curse"
	curse.visible = false
	root.add_child(curse)
	return root

func _sync_projectiles(delta: float) -> void:
	var alive := {}
	for p in sim.projectiles:
		var id: int = p["id"]
		alive[id] = true
		var node: Node3D = proj_nodes.get(id)
		var height: float = 1.4 + (0.5 if float(p.get("speed", 12.0)) < 20.0 else 0.0)
		if p.get("isSpell", false):
			height = 5.0 * clampf(dist2(p) / 400.0, 0.0, 1.0) + 0.5
		if node == null:
			node = ModelFactory.build_projectile(p)
			proj_root.add_child(node)
			proj_nodes[id] = node
		var pos := to3(p["x"], p["y"], height)
		var look := to3(p["targetX"], p["targetY"], height)
		node.position = pos
		if pos.distance_to(look) > 0.05:
			node.look_at(look, Vector3.UP)
		if p.get("isSpell", false):
			node.rotation.z += delta * 8.0
	for id in proj_nodes.keys():
		if not alive.has(id):
			proj_nodes[id].queue_free()
			proj_nodes.erase(id)

func dist2(p: Dictionary) -> float:
	return Sim.dist(p["x"], p["y"], p["targetX"], p["targetY"])

# ----------------------------------------------------------------------------- effects

func _fx_sound(e: Dictionary) -> void:
	match e["t"]:
		"play":
			if e["card"] in ["fireball", "rocket", "zap", "lightning", "arrows", "poison", "freeze", "rage", "tornado", "the_log", "snowball"]:
				return
			Sfx.play("card_deploy", -3.0 if not e["opp"] else -9.0, 60)
		"attack":
			var p := str(e.get("p", ""))
			if p == "":
				Sfx.play("sword_hit", -9.0, 90)
			elif p.contains("arrow") or p.contains("spear") or p.contains("dart") or p.contains("dagger"):
				Sfx.play("arrow_shot", -9.0, 90)
			elif p.contains("cannon") or p.contains("bomb") or p.contains("mortar") or p.contains("bullet") or p.contains("boulder"):
				Sfx.play("cannon_boom", -9.0, 120)
			else:
				Sfx.play("magic_bolt", -9.0, 100)
		"hit":
			Sfx.play("tower_hit", -7.0, 140)
		"death":
			Sfx.play("unit_death", -8.0, 80)
		"bolt":
			Sfx.play("spell_zap", -8.0, 120)
		"elixir":
			Sfx.play("coins", -12.0, 300)
		"ability":
			Sfx.play("ability_activate", -2.0)
		"spell":
			match str(e["kind"]):
				"fireball", "rocket": Sfx.play("spell_fireball", -2.0)
				"zap", "lightning": Sfx.play("spell_zap", -2.0)
				"arrows": Sfx.play("spell_arrows", -2.0)
				"freeze": Sfx.play("spell_freeze", -3.0)
				"clone": Sfx.play("spell_heal", -4.0)
				"rage": Sfx.play("spell_rage", -3.0)
				_: Sfx.play("spell_fireball", -8.0, 150)
		"zone":
			match str(e["kind"]):
				"poison": Sfx.play("spell_poison", -3.0)
				"rage": Sfx.play("spell_rage", -3.0)
				"graveyard", "curse", "void": Sfx.play("spell_poison", -6.0)
				"freeze": Sfx.play("spell_freeze", -3.0)

func _drain_fx() -> void:
	for e in sim.fx:
		_fx_sound(e)
		match e["t"]:
			"attack":
				var rec: Variant = unit_nodes.get(e["id"])
				if rec != null:
					rec["lunge"] = 1.0
					rec["swing_t"] = 0.0
					var dir := to3(e["tx"], e["ty"]) - to3(e["x"], e["y"])
					rec["face_to"] = atan2(-dir.x, -dir.z)
			"hit":
				_float_text(to3(e["x"], e["y"], 2.2), str(int(e["dmg"])), Color("ffffff"))
			"impact":
				_burst(to3(e["x"], e["y"], 1.0), 0.6, Color("ffe08a"))
			"splash":
				_ring(to3(e["x"], e["y"], 0.15), e["r"] * S, Color("ffb347"))
			"spell":
				_explode(to3(e["x"], e["y"], 0.8), e["r"] * S * 1.1, Color("ff7a1a") if e["kind"] in ["fireball", "rocket"] else Color("a5d6ff"))
				shake = maxf(shake, 0.25)
			"zone":
				_zone(to3(e["x"], e["y"], 0.1), e["r"] * S, Color("7ed957"), e["dur"], str(e["kind"]))
			"death":
				_burst(to3(e["x"], e["y"], 0.8), 1.0, Color("ffffff"))
			"alert":
				pass
	sim.fx.clear()

func _float_text(pos: Vector3, text: String, color: Color) -> void:
	var l := Label3D.new()
	l.text = text
	l.font_size = 44
	l.pixel_size = 0.012
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.no_depth_test = true
	l.modulate = color
	l.outline_size = 12
	l.position = pos
	fx_root.add_child(l)
	var tw := create_tween()
	tw.tween_property(l, "position:y", pos.y + 1.6, 0.7)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.7)
	tw.tween_callback(l.queue_free)

func _burst(pos: Vector3, r: float, color: Color) -> void:
	var m := ModelFactory.sphere(r * 0.4, color, pos, 1.5)
	m.material_override = ModelFactory.mat(Color(color, 0.8), 0.5, 1.5)
	fx_root.add_child(m)
	var tw := create_tween()
	tw.tween_property(m, "scale", Vector3.ONE * 2.2, 0.25)
	tw.parallel().tween_property(m, "transparency", 1.0, 0.25)
	tw.tween_callback(m.queue_free)

func _explode(pos: Vector3, r: float, color: Color) -> void:
	var m := ModelFactory.sphere(r, color, pos, 1.6)
	m.material_override = ModelFactory.mat(Color(color, 0.6), 0.5, 1.6)
	m.scale = Vector3.ONE * 0.2
	fx_root.add_child(m)
	var tw := create_tween()
	tw.tween_property(m, "scale", Vector3(1, 1, ZR), 0.18).set_ease(Tween.EASE_OUT)
	tw.tween_property(m, "transparency", 1.0, 0.35)
	tw.tween_callback(m.queue_free)
	_ring(Vector3(pos.x, 0.12, pos.z), r, color)

func _ring(pos: Vector3, r: float, color: Color) -> void:
	var m := ModelFactory.cyl(r, r, 0.04, color, pos, 24)
	m.material_override = ModelFactory.mat(Color(color, 0.45), 0.9, 1.0, true)
	m.scale.z = ZR
	fx_root.add_child(m)
	var tw := create_tween()
	tw.tween_property(m, "scale", Vector3(1.15, 1, 1.15 * ZR), 0.4)
	tw.parallel().tween_property(m, "transparency", 1.0, 0.4)
	tw.tween_callback(m.queue_free)

func _zone(pos: Vector3, r: float, color: Color, dur: float, kind: String = "") -> void:
	if kind == "poison":
		var pm := ModelFactory.card_model("poison", Color.WHITE)
		if pm != null:
			pm.position = Vector3(pos.x, 0.0, pos.z)
			pm.scale = Vector3(r / 0.95, 0.9, r / 0.95 * ZR)
			fx_root.add_child(pm)
			var ptw := create_tween()
			ptw.tween_interval(maxf(0.1, dur - 0.4))
			ptw.tween_property(pm, "scale", Vector3.ZERO, 0.4)
			ptw.tween_callback(pm.queue_free)
	var m := ModelFactory.cyl(r, r, 0.05, color, pos, 24)
	m.material_override = ModelFactory.mat(Color(color, 0.35), 0.9, 0.8, true)
	m.scale.z = ZR
	fx_root.add_child(m)
	var tw := create_tween()
	tw.tween_interval(maxf(0.1, dur - 0.5))
	tw.tween_property(m, "transparency", 1.0, 0.5)
	tw.tween_callback(m.queue_free)

# ----------------------------------------------------------------------------- placement helper

func show_placement(active: bool) -> void:
	if active:
		# red overlay across the area (enemy side, minus the 100px tolerance) where the player cannot deploy
		var boundary := Sim.RIVER_Y - 100.0
		var z0: float = (0.0 - Sim.H / 2.0) * SZ
		var z1: float = (boundary - Sim.H / 2.0) * SZ
		place_overlay.scale = Vector3(1, 1, (z1 - z0))
		place_overlay.position = Vector3(0, 0.12, (z0 + z1) / 2.0)
	place_overlay.visible = active
