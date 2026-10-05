class_name ArenaView
extends Node3D
## Renders a Sim in 3D: builds the arena once, then mirrors units/towers/projectiles/effects every frame.
## Sim space (x, y in px, y down, player at bottom) -> world: X = (x - W/2)*S, Z = (y - H/2)*S.

const S := 0.05
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
	return Vector3((x - Sim.W / 2.0) * S, h, (y - Sim.H / 2.0) * S)

static func from3(p: Vector3) -> Vector2:
	return Vector2(p.x / S + Sim.W / 2.0, p.z / S + Sim.H / 2.0)

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

func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("2b6cb0")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("fff4e0")
	env.ambient_light_energy = 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-58), deg_to_rad(-25), 0)
	sun.light_energy = 0.7
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 70.0
	sun.light_color = Color("fff1d6")
	add_child(sun)

func _build_arena() -> void:
	var half_w := Sim.W * S / 2.0
	var half_l := Sim.H * S / 2.0
	var river_half := 30.0 * S
	# outer platform
	add_child(ModelFactory.box(Vector3(half_w * 2 + 8, 1.0, half_l * 2 + 8), Color("5d6d7e"), Vector3(0, -0.62, 0)))
	# checkered grass, each half
	var tile := 1.0
	var g1 := Color("7cc04f")
	var g2 := Color("72b548")
	var xs := int(ceil(half_w * 2 / tile))
	var zs_half := int(ceil((half_l - river_half) / tile))
	var grass := _tile_batch(g1, g2, xs, zs_half, tile, half_w, half_l, river_half)
	add_child(grass)
	# river
	river_mat = ModelFactory.mat(Color("2f9bf0"), 0.25, 0.0)
	var river := ModelFactory.box(Vector3(half_w * 2, 0.1, river_half * 2), Color("3aa0e8"), Vector3(0, -0.04, 0), Vector3.ZERO, 0.2)
	river.material_override = river_mat
	add_child(river)
	# river banks
	for sz in [-1, 1]:
		add_child(ModelFactory.box(Vector3(half_w * 2, 0.35, 0.35), Color("a1887f"), Vector3(0, 0.0, sz * (river_half + 0.1))))
	# bridges
	for bx in [Sim.BRIDGE_L, Sim.BRIDGE_R]:
		var wx: float = (bx - Sim.W / 2.0) * S
		var bridge := Node3D.new()
		bridge.position = Vector3(wx, 0.0, 0)
		bridge.add_child(ModelFactory.box(Vector3(2.8, 0.25, river_half * 2 + 1.2), Color("a9784a"), Vector3(0, 0.1, 0)))
		for i in 7:
			bridge.add_child(ModelFactory.box(Vector3(2.7, 0.06, 0.28), Color("8d6238"), Vector3(0, 0.26, -river_half + 0.45 + i * (river_half * 2 - 0.3) / 6.0)))
		for sx in [-1, 1]:
			bridge.add_child(ModelFactory.box(Vector3(0.15, 0.5, river_half * 2 + 1.2), Color("7a5530"), Vector3(sx * 1.4, 0.45, 0)))
		add_child(bridge)
	# arena rim walls
	var wall_c := Color("8d99a6")
	add_child(ModelFactory.box(Vector3(0.5, 0.6, half_l * 2 + 1.0), wall_c, Vector3(-half_w - 0.25, 0.2, 0)))
	add_child(ModelFactory.box(Vector3(0.5, 0.6, half_l * 2 + 1.0), wall_c, Vector3(half_w + 0.25, 0.2, 0)))
	add_child(ModelFactory.box(Vector3(half_w * 2 + 1.0, 0.6, 0.5), wall_c, Vector3(0, 0.2, -half_l - 0.25)))
	add_child(ModelFactory.box(Vector3(half_w * 2 + 1.0, 0.6, 0.5), wall_c, Vector3(0, 0.2, half_l + 0.25)))
	# tower plazas (darker tile under each tower) and team-tinted base pads
	for t in sim.towers:
		var kind: bool = t["type"] == "king"
		var pad := ModelFactory.box(Vector3(5.2 if kind else 4.2, 0.08, 5.2 if kind else 4.2), Color(ModelFactory.team_color(t["opp"]), 1.0).lerp(Color("c9c2b3"), 0.7), to3(t["x"], t["y"], 0.02))
		add_child(pad)
	# scenery trees outside the arena
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	for i in 14:
		var side := -1 if i % 2 == 0 else 1
		var z := rng.randf_range(-half_l, half_l)
		_tree(Vector3(side * (half_w + 2.2 + rng.randf() * 1.5), 0, z), rng.randf_range(0.8, 1.3))
	# placement overlay (shown while dragging a card): translucent red over the area you cannot deploy in
	place_overlay = ModelFactory.box(Vector3(half_w * 2, 0.05, 1.0), Color(1, 0.15, 0.15, 0.32), Vector3(0, 0.07, 0))
	place_overlay.material_override = ModelFactory.mat(Color(1, 0.15, 0.15, 0.32), 1.0, 0.0, true)
	place_overlay.visible = false
	add_child(place_overlay)

func _tile_batch(c1: Color, c2: Color, xs: int, zs_half: int, tile: float, half_w: float, half_l: float, river_half: float) -> Node3D:
	# One BoxMesh + MultiMesh per colour keeps the checkerboard cheap on mobile.
	var root := Node3D.new()
	var mm1 := MultiMesh.new()
	var mm2 := MultiMesh.new()
	for mm in [mm1, mm2]:
		var bm := BoxMesh.new()
		bm.size = Vector3(tile, 0.1, tile)
		mm.mesh = bm
		mm.transform_format = MultiMesh.TRANSFORM_3D
	var list1: Array = []
	var list2: Array = []
	var depth := half_l - river_half
	for side in [-1, 1]:
		var n := int(ceil(depth / tile))
		for iz in n:
			for ix in xs:
				var x := -half_w + tile * 0.5 + ix * tile
				var z: float = side * (river_half + tile * 0.5 + iz * tile)
				if absf(z) > half_l:
					continue
				var tr := Transform3D(Basis(), Vector3(x, -0.05, z))
				if (ix + iz) % 2 == 0:
					list1.append(tr)
				else:
					list2.append(tr)
	mm1.instance_count = list1.size()
	mm2.instance_count = list2.size()
	for i in list1.size():
		mm1.set_instance_transform(i, list1[i])
	for i in list2.size():
		mm2.set_instance_transform(i, list2[i])
	for pair in [[mm1, c1], [mm2, c2]]:
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = pair[0]
		mmi.material_override = ModelFactory.mat(pair[1], 0.95)
		root.add_child(mmi)
	return root

func _tree(pos: Vector3, sc: float) -> void:
	var t := Node3D.new()
	t.position = pos
	t.scale = Vector3.ONE * sc
	t.add_child(ModelFactory.cyl(0.18, 0.25, 1.2, Color("7b5a3a"), Vector3(0, 0.6, 0), 8))
	t.add_child(ModelFactory.cone(1.0, 1.6, Color("2e8b3d"), Vector3(0, 1.8, 0), 8))
	t.add_child(ModelFactory.cone(0.8, 1.3, Color("34a047"), Vector3(0, 2.6, 0), 8))
	add_child(t)

# ----------------------------------------------------------------------------- towers

func _build_towers() -> void:
	for t in sim.towers:
		var node := ModelFactory.build_tower(t["type"] == "king", t["opp"], t["towerSubType"])
		node.position = to3(t["x"], t["y"])
		add_child(node)
		var bar := _make_hp_bar(2.6 if t["type"] == "king" else 2.2, t["opp"])
		bar["root"].position = to3(t["x"], t["y"], 6.4 if t["type"] == "king" else 5.2)
		add_child(bar["root"])
		var lbl := Label3D.new()
		lbl.text = str(int(t["hp"]))
		lbl.font_size = 56
		lbl.pixel_size = 0.012
		lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		lbl.no_depth_test = true
		lbl.outline_size = 14
		lbl.position = Vector3(0, 0.28, 0)
		bar["root"].add_child(lbl)
		tower_nodes[t["id"]] = {"node": node, "fg": bar["fg"], "w": bar["w"], "label": lbl, "root": bar["root"], "dead": false}

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
		tn["fg"].position.x = -(1.0 - ratio) * tn["w"] / 2.0
		tn["label"].text = str(maxi(0, int(ceil(t["hp"]))))
		if t["hp"] <= 0 and not tn["dead"]:
			tn["dead"] = true
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
		# bob walk animation
		var model: Node3D = node.get_node("Model")
		var moving := mv.length() > 0.004
		var ph: float = rec["phase"]
		if u["type"] == "flying":
			model.position.y = 2.2 + sin(_time * 3.0 + ph) * 0.18
			var wl = model.get_node_or_null("WingL")
			var wr = model.get_node_or_null("WingR")
			if wl:
				wl.rotation.z = sin(_time * 14.0 + ph) * 0.5
				wr.rotation.z = -sin(_time * 14.0 + ph) * 0.5
		elif u["type"] != "building":
			model.position.y = absf(sin(_time * 9.0 + ph)) * 0.1 if moving else 0.0
		# stun / slow tint via scale wobble
		if u["stunUntil"] > sim.now:
			model.rotation.z = sin(_time * 30.0) * 0.12
		else:
			model.rotation.z = lerpf(model.rotation.z, 0.0, 0.3)
		# attack lunge
		if rec["lunge"] > 0.0:
			rec["lunge"] = maxf(0.0, rec["lunge"] - delta * 4.0)
			var f := Vector3(0, 0, -1).rotated(Vector3.UP, node.rotation.y)
			model.position += f * sin(rec["lunge"] * PI) * 0.45 * 0.0
			model.scale = Vector3.ONE * (1.0 + sin(rec["lunge"] * PI) * 0.18)
		else:
			model.scale = Vector3.ONE
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
			rec["node"].queue_free()
			unit_nodes.erase(id)

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
	return {"node": node, "fg": bar["fg"], "w": w, "bar": bar["root"], "phase": randf() * TAU, "lunge": 0.0, "first": true, "face_to": null, "status": status}

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

func _drain_fx() -> void:
	for e in sim.fx:
		match e["t"]:
			"attack":
				var rec: Variant = unit_nodes.get(e["id"])
				if rec != null:
					rec["lunge"] = 1.0
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
				_zone(to3(e["x"], e["y"], 0.1), e["r"] * S, Color("7ed957"), e["dur"])
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
	tw.tween_property(m, "scale", Vector3.ONE, 0.18).set_ease(Tween.EASE_OUT)
	tw.tween_property(m, "transparency", 1.0, 0.35)
	tw.tween_callback(m.queue_free)
	_ring(Vector3(pos.x, 0.12, pos.z), r, color)

func _ring(pos: Vector3, r: float, color: Color) -> void:
	var m := ModelFactory.cyl(r, r, 0.04, color, pos, 24)
	m.material_override = ModelFactory.mat(Color(color, 0.45), 0.9, 1.0, true)
	fx_root.add_child(m)
	var tw := create_tween()
	tw.tween_property(m, "scale", Vector3(1.15, 1, 1.15), 0.4)
	tw.parallel().tween_property(m, "transparency", 1.0, 0.4)
	tw.tween_callback(m.queue_free)

func _zone(pos: Vector3, r: float, color: Color, dur: float) -> void:
	var m := ModelFactory.cyl(r, r, 0.05, color, pos, 24)
	m.material_override = ModelFactory.mat(Color(color, 0.35), 0.9, 0.8, true)
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
		var z0: float = (0.0 - Sim.H / 2.0) * S
		var z1: float = (boundary - Sim.H / 2.0) * S
		place_overlay.scale = Vector3(1, 1, (z1 - z0))
		place_overlay.position = Vector3(0, 0.12, (z0 + z1) / 2.0)
	place_overlay.visible = active
