class_name ModelFactory
extends RefCounted
## Procedural low-poly 3D models for towers, units, buildings and projectiles.
## (Phase 5 swaps archetypes for Blender-authored GLBs where available; see assets/models/.)

const TEAM_BLUE := Color("2f7de1")
const TEAM_RED := Color("e0413a")

static var _mats: Dictionary = {}
static var _meshes: Dictionary = {}

static func mat(c: Color, rough: float = 0.85, emissive: float = 0.0, unshaded: bool = false) -> StandardMaterial3D:
	var key := "%s_%s_%s_%s" % [c.to_html(true), rough, emissive, unshaded]
	if _mats.has(key):
		return _mats[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	if emissive > 0.0:
		m.emission_enabled = true
		m.emission = c
		m.emission_energy_multiplier = emissive
	if unshaded:
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	if c.a < 1.0:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_mats[key] = m
	return m

static func _mi(mesh: Mesh, material: Material, pos: Vector3 = Vector3.ZERO, rot: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = material
	mi.position = pos
	mi.rotation = rot
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mi

static func box(size: Vector3, color: Color, pos: Vector3 = Vector3.ZERO, rot: Vector3 = Vector3.ZERO, rough: float = 0.85) -> MeshInstance3D:
	var m := BoxMesh.new()
	m.size = size
	return _mi(m, mat(color, rough), pos, rot)

static func cyl(r_top: float, r_bot: float, h: float, color: Color, pos: Vector3 = Vector3.ZERO, seg: int = 12, rough: float = 0.85) -> MeshInstance3D:
	var m := CylinderMesh.new()
	m.top_radius = r_top
	m.bottom_radius = r_bot
	m.height = h
	m.radial_segments = seg
	m.rings = 1
	return _mi(m, mat(color, rough), pos)

static func sphere(r: float, color: Color, pos: Vector3 = Vector3.ZERO, emissive: float = 0.0, squash: float = 1.0) -> MeshInstance3D:
	var m := SphereMesh.new()
	m.radius = r
	m.height = r * 2.0 * squash
	m.radial_segments = 12
	m.rings = 6
	return _mi(m, mat(color, 0.7, emissive), pos)

static func capsule(r: float, h: float, color: Color, pos: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var m := CapsuleMesh.new()
	m.radius = r
	m.height = h
	m.radial_segments = 12
	m.rings = 4
	return _mi(m, mat(color), pos)

static func cone(r: float, h: float, color: Color, pos: Vector3 = Vector3.ZERO, seg: int = 8) -> MeshInstance3D:
	return cyl(0.0, r, h, color, pos, seg)

static func team_color(opp: bool) -> Color:
	return TEAM_RED if opp else TEAM_BLUE

# ----------------------------------------------------------------------------- Blender-authored GLB models
# Authored by tools/blender/make_models.py (Blender MCP). Material slots named TINT / TEAM are recoloured here.
static var _scenes: Dictionary = {}

static func glb(name: String, tint: Color, team: Color) -> Node3D:
	var path := "res://assets/models/%s.glb" % name
	if not _scenes.has(name):
		_scenes[name] = load(path) if ResourceLoader.exists(path) else null
	var ps: PackedScene = _scenes[name]
	if ps == null:
		return null
	var root := ps.instantiate() as Node3D
	_recolor(root, tint, team)
	return root

const CARD_SCALE := {"elixir_golem": 0.8, "golem": 0.78, "ice_golem": 0.85, "magic_archer": 0.9, "pekka": 1.1, "hog_rider": 1.25, "ice_spirit": 1.2,
	"inferno_tower": 1.0, "tesla": 1.0, "tombstone": 1.0, "royal_ghost": 1.4, "battle_ram": 1.2}

static func card_model(card_id: String, team: Color) -> Node3D:
	## Unique Blender model matched to the card's generated portrait (assets/models/cards/<id>.glb).
	var path := "res://assets/models/cards/%s.glb" % card_id
	if not _scenes.has(path):
		_scenes[path] = load(path) if ResourceLoader.exists(path) else null
	var ps: PackedScene = _scenes[path]
	if ps == null:
		return null
	var root := ps.instantiate() as Node3D
	_recolor(root, Color.WHITE, team)
	return root

static func glb_mesh(name: String) -> Mesh:
	## First mesh of a GLB (keeps its authored materials) - used for MultiMesh scenery.
	var path := "res://assets/models/%s.glb" % name
	if not ResourceLoader.exists(path):
		return null
	var root := (load(path) as PackedScene).instantiate()
	var found: Mesh = null
	var stack: Array = [root]
	while not stack.is_empty() and found == null:
		var n: Node = stack.pop_back()
		if n is MeshInstance3D:
			found = (n as MeshInstance3D).mesh
		stack.append_array(n.get_children())
	root.free()
	return found

static func _recolor(n: Node, tint: Color, team: Color) -> void:
	if n is MeshInstance3D:
		var mi := n as MeshInstance3D
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		for i in mi.mesh.get_surface_count():
			var sm: Material = mi.mesh.surface_get_material(i)
			var nm := sm.resource_name if sm != null else ""
			if nm == "TINT":
				mi.set_surface_override_material(i, mat(tint, 0.8))
			elif nm == "TEAM":
				mi.set_surface_override_material(i, mat(team, 0.7, 0.15))
	for c in n.get_children():
		_recolor(c, tint, team)

static func archetype(u: Dictionary) -> String:
	var id := str(u["spriteId"])
	var typ := str(u["type"])
	var hp := float(Sim._v(u, "hp", 300))
	if typ == "building":
		return "building"
	if typ == "flying":
		return "flyer"
	if Sim._v(u, "kamikaze", false) and hp < 500.0 and float(Sim._v(u, "speed", 0)) >= 4.0 and "ram" not in id and "wall" not in id:
		return "spirit"
	for k in ["hog", "ram"]:
		if id.contains(k):
			return "beast"
	if id.contains("skeleton") and hp < 700.0:
		return "skeleton"
	if id.contains("goblin") and hp < 1500.0:
		return "goblin"
	for k in ["musketeer", "hunter", "firecracker", "bomber", "cannon_cart", "sparky"]:
		if id.contains(k):
			return "gunner"
	for k in ["wizard", "witch", "mage", "executioner", "prince"]:
		if id.contains(k) and not id.contains("little") and not id.contains("dark"):
			return "mage"
	for k in ["archer", "dart", "princess", "queen", "ranger", "bandit"]:
		if id.contains(k):
			return "ranger"
	if hp >= 2200.0:
		return "brute"
	return "warrior"

# ----------------------------------------------------------------------------- towers

static func build_tower(king: bool, opp: bool, sub: String = "princess") -> Node3D:
	var model := glb("tower_king" if king else "tower_princess", Color("b9b2a4"), team_color(opp))
	if model != null:
		var holder := Node3D.new()
		holder.add_child(model)
		if opp:
			model.rotation.y = PI          # cannon/face points toward the arena centre
		if not king:
			match sub:
				"cannoneer":
					var b := cyl(0.3, 0.3, 1.3, Color("2d2d2d"), Vector3(0, 3.6, 1.1 * (1.0 if opp else -1.0)), 10)
					b.rotation.x = deg_to_rad(90)
					holder.add_child(b)
				"royal_chef":
					holder.add_child(cyl(0.55, 0.5, 0.5, Color("f4f1ea"), Vector3(0, 4.4, 0), 10))
				"dagger_duchess":
					holder.add_child(box(Vector3(0.12, 0.9, 0.12), Color("cfd8dc"), Vector3(0.0, 4.2, 0.0), Vector3(deg_to_rad(20), 0, deg_to_rad(15))))
		return holder
	var root := Node3D.new()
	var team := team_color(opp)
	var stone := Color("b9b2a4")
	var dark := Color("8b8578")
	var s := 1.45 if king else 1.0
	# base block + body
	root.add_child(box(Vector3(3.6 * s, 0.5, 3.6 * s), dark, Vector3(0, 0.25, 0)))
	root.add_child(cyl(1.35 * s, 1.55 * s, 2.6 * s, stone, Vector3(0, 1.8, 0), 10))
	# battlements
	var top_y := 3.3 * s
	root.add_child(cyl(1.75 * s, 1.45 * s, 0.5, dark, Vector3(0, top_y, 0), 10))
	for i in 8:
		var a := TAU * i / 8.0
		root.add_child(box(Vector3(0.5, 0.55, 0.5), stone, Vector3(cos(a) * 1.55 * s, top_y + 0.5, sin(a) * 1.55 * s), Vector3(0, -a, 0)))
	# team banner / roof
	if king:
		root.add_child(cone(1.35, 1.6, team, Vector3(0, top_y + 1.1, 0), 8))
		root.add_child(box(Vector3(0.9, 0.45, 0.4), Color("f5c518"), Vector3(0, top_y + 2.2, 0)))
		root.add_child(sphere(0.28, Color("f5c518"), Vector3(0, top_y + 2.6, 0), 0.6))
		# cannon barrel
		var barrel := cyl(0.32, 0.32, 1.7, Color("3d3d3d"), Vector3(0, top_y + 0.35, 1.2 * (1.0 if opp else -1.0)), 10)
		barrel.rotation.x = deg_to_rad(90)
		root.add_child(barrel)
	else:
		root.add_child(cone(1.25, 1.3, team, Vector3(0, top_y + 0.95, 0), 8))
		root.add_child(box(Vector3(0.1, 1.0, 0.1), Color("3d3d3d"), Vector3(0, top_y + 1.9, 0)))
		var flag := box(Vector3(0.7, 0.4, 0.05), team, Vector3(0.35, top_y + 2.2, 0))
		root.add_child(flag)
		match sub:
			"cannoneer":
				var b := cyl(0.3, 0.3, 1.3, Color("2d2d2d"), Vector3(0, top_y + 0.45, 1.1 * (1.0 if opp else -1.0)), 10)
				b.rotation.x = deg_to_rad(90)
				root.add_child(b)
			"royal_chef":
				root.add_child(cyl(0.55, 0.5, 0.5, Color("f4f1ea"), Vector3(0, top_y + 2.45, 0), 10))
			"dagger_duchess":
				root.add_child(box(Vector3(0.12, 0.9, 0.12), Color("cfd8dc"), Vector3(0.0, top_y + 0.9, 0.0), Vector3(deg_to_rad(20), 0, deg_to_rad(15))))
	return root

# ----------------------------------------------------------------------------- units

static func unit_scale(card: Dictionary) -> float:
	var hp := float(Sim._v(card, "hp", 300))
	var t := clampf((hp - 80.0) / 3600.0, 0.0, 1.0)
	return lerpf(0.9, 2.1, sqrt(t))

static func build_unit(u: Dictionary) -> Node3D:
	var opp: bool = u["opp"]
	var col := Color(str(Sim._v(u, "color", "#cccccc")))
	var typ := str(u["type"])
	var root := Node3D.new()
	var s := unit_scale(u)
	var team := team_color(opp)
	var proj = u.get("projectile")
	var model := Node3D.new()
	model.name = "Model"
	root.add_child(model)
	var base_r := 0.55 * s
	var arch := archetype(u)
	var cid := CardArt.art_id({"id": str(u.get("cid", u["spriteId"]))})
	var glb_model := card_model(cid, team)
	var unique := glb_model != null
	if glb_model == null:
		glb_model = glb(arch, col, team)
	# team ring on the ground
	var ring := cyl(base_r * 1.15, base_r * 1.15, 0.04, team, Vector3(0, 0.03, 0), 16)
	ring.material_override = mat(Color(team, 0.85), 0.9, 0.0)
	root.add_child(ring)
	if unique:
		glb_model.scale = Vector3.ONE * float(CARD_SCALE.get(cid, 1.6))
		if typ == "flying":
			model.position.y = 2.2
		model.add_child(glb_model)
	elif glb_model != null:
		var gs := s
		if arch == "brute":
			gs = s * 0.75
		elif arch == "building":
			gs = maxf(s, 0.9)
		elif arch == "flyer":
			gs = s * 0.9
			model.position.y = 2.2
			var shadow := cyl(0.45 * s, 0.45 * s, 0.02, Color(0, 0, 0, 0.35), Vector3(0, -2.2 + 0.04, 0), 12)
			shadow.material_override = mat(Color(0, 0, 0, 0.35), 1.0, 0.0, true)
			model.add_child(shadow)
		glb_model.scale = Vector3.ONE * gs * 1.45
		model.add_child(glb_model)
	elif typ == "building":
		_build_building(model, u, col, s, opp)
	elif typ == "flying":
		_build_flyer(model, u, col, s, opp)
	else:
		_build_walker(model, u, col, s, opp, proj)
	# evolution / hero aura
	if Sim._v(u, "evolution", false):
		var aura := Color(str(Sim._v(u, "evolutionAuraColor", "#b66cff")))
		var halo := cyl(base_r * 1.5, base_r * 1.5, 0.05, Color(aura, 0.55), Vector3(0, 0.06, 0), 20)
		halo.material_override = mat(Color(aura, 0.55), 0.5, 1.2)
		root.add_child(halo)
	return root

static func _build_walker(model: Node3D, u: Dictionary, col: Color, s: float, opp: bool, proj: Variant) -> void:
	var skin := Color("f0c8a0")
	var dark := col.darkened(0.35)
	var body_h := 0.9 * s
	# legs
	model.add_child(box(Vector3(0.22 * s, 0.5 * s, 0.24 * s), dark, Vector3(-0.17 * s, 0.25 * s, 0)))
	model.add_child(box(Vector3(0.22 * s, 0.5 * s, 0.24 * s), dark, Vector3(0.17 * s, 0.25 * s, 0)))
	# torso
	model.add_child(capsule(0.34 * s, body_h, col, Vector3(0, 0.5 * s + body_h * 0.5, 0)))
	# belt in team color
	model.add_child(cyl(0.36 * s, 0.36 * s, 0.1 * s, team_color(opp), Vector3(0, 0.62 * s, 0), 10))
	# head
	var head_y := 0.5 * s + body_h + 0.22 * s
	model.add_child(sphere(0.26 * s, skin, Vector3(0, head_y, 0)))
	# helmet / hat by card id
	var id := str(u["spriteId"])
	if id.contains("wizard") or id.contains("witch"):
		model.add_child(cone(0.3 * s, 0.55 * s, col.darkened(0.2), Vector3(0, head_y + 0.38 * s, 0), 8))
	elif id.contains("knight") or id.contains("prince") or id.contains("valkyrie") or id.contains("pekka") or id.contains("guard"):
		model.add_child(cyl(0.29 * s, 0.31 * s, 0.22 * s, Color("c0c6cf"), Vector3(0, head_y + 0.13 * s, 0), 10))
		model.add_child(box(Vector3(0.08 * s, 0.22 * s, 0.08 * s), team_color(opp), Vector3(0, head_y + 0.35 * s, 0)))
	elif id.contains("goblin"):
		model.add_child(sphere(0.2 * s, Color("5fbf4a"), Vector3(0, head_y, 0)))
		model.add_child(box(Vector3(0.5 * s, 0.06 * s, 0.12 * s), Color("5fbf4a"), Vector3(0, head_y + 0.02 * s, 0.0)))
	elif id.contains("skeleton"):
		model.add_child(sphere(0.27 * s, Color("ecf0f1"), Vector3(0, head_y, 0)))
	else:
		model.add_child(cyl(0.27 * s, 0.28 * s, 0.1 * s, col.lightened(0.15), Vector3(0, head_y + 0.15 * s, 0), 10))
	# arms + weapon
	model.add_child(box(Vector3(0.14 * s, 0.14 * s, 0.5 * s), skin, Vector3(0.36 * s, 0.5 * s + body_h * 0.7, -0.18 * s)))
	if proj == null:
		# melee: sword/club
		var blade := box(Vector3(0.08 * s, 0.08 * s, 0.9 * s), Color("d5dbe1"), Vector3(0.36 * s, 0.5 * s + body_h * 0.7, -0.65 * s))
		model.add_child(blade)
		model.add_child(box(Vector3(0.28 * s, 0.07 * s, 0.07 * s), Color("8a6a3b"), Vector3(0.36 * s, 0.5 * s + body_h * 0.7, -0.28 * s)))
		if float(Sim._v(u, "hp", 0)) > 1500.0:
			model.add_child(box(Vector3(0.5 * s, 0.7 * s, 0.1 * s), col.lightened(0.25), Vector3(-0.38 * s, 0.5 * s + body_h * 0.55, -0.1 * s)))
	else:
		var p := str(proj)
		var tip := Color("ffb347")
		if p.contains("ice"): tip = Color("8fd8ff")
		elif p.contains("dark") or p.contains("witch"): tip = Color("b66cff")
		elif p.contains("arrow") or p.contains("spear") or p.contains("dart"): tip = Color("e8d9a0")
		elif p.contains("bullet") or p.contains("cannon"): tip = Color("ffd54f")
		if p.contains("arrow") or p.contains("dart") or p.contains("spear"):
			var bow := cyl(0.03 * s, 0.03 * s, 0.9 * s, Color("8a6a3b"), Vector3(0.38 * s, 0.5 * s + body_h * 0.7, -0.35 * s))
			model.add_child(bow)
		else:
			var staff := cyl(0.04 * s, 0.04 * s, 1.5 * s, Color("6b4a2a"), Vector3(0.4 * s, 0.9 * s, -0.25 * s))
			model.add_child(staff)
			model.add_child(sphere(0.12 * s, tip, Vector3(0.4 * s, 1.68 * s, -0.25 * s), 1.2))

static func _build_flyer(model: Node3D, u: Dictionary, col: Color, s: float, opp: bool) -> void:
	var hover := 2.2
	model.position.y = hover
	var body := sphere(0.5 * s, col, Vector3(0, 0, 0), 0.0, 0.85)
	model.add_child(body)
	model.add_child(sphere(0.3 * s, col.lightened(0.2), Vector3(0, 0.12 * s, -0.5 * s)))
	model.add_child(cone(0.12 * s, 0.35 * s, Color("ffe08a"), Vector3(0, 0.05 * s, -0.78 * s)))
	model.get_child(model.get_child_count() - 1).rotation.x = deg_to_rad(-90)
	var wl := box(Vector3(1.1 * s, 0.05, 0.55 * s), col.darkened(0.15), Vector3(-0.85 * s, 0.1 * s, 0.05 * s))
	var wr := box(Vector3(1.1 * s, 0.05, 0.55 * s), col.darkened(0.15), Vector3(0.85 * s, 0.1 * s, 0.05 * s))
	wl.name = "WingL"
	wr.name = "WingR"
	model.add_child(wl)
	model.add_child(wr)
	model.add_child(box(Vector3(0.14, 0.14, 0.14), team_color(opp), Vector3(0, 0.55 * s, 0.1 * s)))
	# ground shadow marker
	var sh := cyl(0.45 * s, 0.45 * s, 0.02, Color(0, 0, 0, 0.35), Vector3(0, -hover + 0.04, 0), 12)
	sh.material_override = mat(Color(0, 0, 0, 0.35), 1.0, 0.0, true)
	model.add_child(sh)

static func _build_building(model: Node3D, u: Dictionary, col: Color, s: float, opp: bool) -> void:
	var w := 1.5 * maxf(s, 0.8)
	model.add_child(box(Vector3(w, 1.2 * s + 0.3, w), col.darkened(0.15), Vector3(0, (1.2 * s + 0.3) * 0.5, 0)))
	var roof := cone(w * 0.85, 0.9 * s + 0.2, team_color(opp), Vector3(0, 1.2 * s + 0.3 + 0.35, 0), 4)
	roof.rotation.y = deg_to_rad(45)
	model.add_child(roof)
	var id := str(u["spriteId"])
	if u.get("projectile") != null:
		var barrel := cyl(0.2, 0.2, 1.1, Color("2d2d2d"), Vector3(0, 1.0 * s + 0.4, -0.8), 10)
		barrel.rotation.x = deg_to_rad(90)
		model.add_child(barrel)
	if id == "elixir_collector":
		model.add_child(sphere(0.4, Color("d94bd9"), Vector3(0, 1.8, 0), 1.0))

# ----------------------------------------------------------------------------- projectiles

static func build_projectile(p: Dictionary) -> Node3D:
	var t := str(p.get("type", ""))
	var root := Node3D.new()
	var c := Color("ffe08a")
	var r := 0.14
	var emissive := 1.0
	if p.get("isSpell", false):
		var sm := card_model(str(p["card"]["id"]), Color.WHITE)
		if sm != null:
			sm.scale = Vector3.ONE * (1.4 if str(p["card"]["id"]) != "arrows" else 1.0)
			root.add_child(sm)
			return root
		c = Color("ff7a1a")
		r = 0.7
		emissive = 1.6
		var id := str(p["card"]["id"])
		if id in ["arrows", "zap", "lightning", "rocket"]:
			c = Color("fff176") if id != "arrows" else Color("c8e6c9")
		elif id in ["poison"]:
			c = Color("7ed957")
		elif id in ["freeze", "snowball"]:
			c = Color("8fd8ff")
	elif t.contains("fire") or t.contains("lava") or t.contains("bomb"):
		c = Color("ff7a1a")
		r = 0.2
	elif t.contains("ice"):
		c = Color("8fd8ff")
	elif t.contains("dark") or t.contains("witch"):
		c = Color("b66cff")
	elif t.contains("arrow") or t.contains("spear") or t.contains("dagger") or t.contains("dart"):
		c = Color("f3e9c6")
		var shaft := box(Vector3(0.05, 0.05, 0.7), c, Vector3.ZERO)
		root.add_child(shaft)
		return root
	elif t.contains("cannon"):
		c = Color("333333")
		r = 0.28
		emissive = 0.0
	root.add_child(sphere(r, c, Vector3.ZERO, emissive))
	return root
