class_name CardDetail
extends Control
## Clash-Royale style card popup: a live rotating 3D model above a panel with the card frame,
## rarity/type chips and three swipeable pages (battlefield preview / stats / description).

signal closed
signal use_pressed(mode: String)

const PAGES := 4
var card: Dictionary
var in_deck := false
var page := 0
var stage_vp: SubViewport
var stage_pivot: Node3D
var field_vp: SubViewport
var field_unit: Node3D
var field_t := 0.0
var pager: Control
var page_nodes: Array = []
var dots: Array = []
var drag_start := -1.0
var use_btn: Button
var sim_stub: Sim
var base: Dictionary
var mode := "card"   # card | evo | hero  (tabs along the bottom, like the real game)
var tab_bar: Control

func setup(c: Dictionary, deck_has: bool) -> void:
	card = c
	base = c
	in_deck = deck_has
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	sim_stub = CardIcons.inst.placeholder_sim if CardIcons.inst != null else null
	_build()
	_build_tabs()

func _variant(m: String) -> Dictionary:
	if m == "evo" and base.get("evolvesTo") != null:
		return CardDB.get_card(str(base["evolvesTo"]))
	if m == "hero" and base.get("heroVariantId") != null:
		return CardDB.get_card(str(base["heroVariantId"]))
	return base

func _switch_mode(m: String) -> void:
	var v := _variant(m)
	if v.is_empty() or m == mode:
		return
	mode = m
	card = v
	for c in get_children():
		c.queue_free()
	page_nodes = []
	dots = []
	stage_pivot = null
	field_unit = null
	page = 0
	_build()
	_build_tabs()

func _build_tabs() -> void:
	var has_evo := base.get("evolvesTo") != null
	var has_hero := base.get("heroVariantId") != null
	if not has_evo and not has_hero:
		return
	tab_bar = HBoxContainer.new()
	(tab_bar as HBoxContainer).add_theme_constant_override("separation", 10)
	tab_bar.position = Vector2(14, 804)
	tab_bar.size = Vector2(362, 36)
	var entries: Array = [["card", "Card", Color("2e86de")]]
	if has_evo:
		entries.append(["evo", "Evolution", Color("8e44ad")])
	if has_hero:
		entries.append(["hero", "Hero", Color("e08a00")])
	for e in entries:
		var active: bool = e[0] == mode
		var b := UI.button(str(e[1]), (e[2] as Color) if active else Color("34405f"), _switch_mode.bind(str(e[0])), Vector2(0, 36), 15)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tab_bar.add_child(b)
	add_child(tab_bar)

# ---------------------------------------------------------------------------------------- build

func _rarity_col() -> Color:
	return Color(UI.rarity_color(str(card.get("rarity", "common"))))

func _build() -> void:
	var dim := ColorRect.new()
	dim.color = Color(0.02, 0.04, 0.12, 0.93)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	# glow behind the model
	var glow := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	var rc := _rarity_col()
	g.colors = PackedColorArray([Color(rc, 0.55), Color(rc, 0.0)])
	gt.gradient = g
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5)
	gt.fill_to = Vector2(0.5, 0.0)
	gt.width = 256
	gt.height = 256
	glow.texture = gt
	glow.position = Vector2(-20, 10)
	glow.size = Vector2(430, 330)
	glow.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	glow.stretch_mode = TextureRect.STRETCH_SCALE
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(glow)
	_build_stage()
	_build_panel()

func _make_env_viewport(sz: Vector2i) -> SubViewport:
	var vp := SubViewport.new()
	vp.size = sz
	vp.transparent_bg = true
	vp.own_world_3d = true
	vp.msaa_3d = Viewport.MSAA_2X
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("fff4e0")
	env.ambient_light_energy = 0.75
	var we := WorldEnvironment.new()
	we.environment = env
	vp.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-45), deg_to_rad(30), 0)
	sun.light_energy = 1.0
	vp.add_child(sun)
	return vp

func _build_model(count_cap: int = 3) -> Node3D:
	var root := Node3D.new()
	if str(card.get("type", "")) == "spell":
		var p := ModelFactory.build_projectile({"type": "", "isSpell": true, "card": card})
		p.scale = Vector3.ONE * 2.2
		root.add_child(p)
		return root
	if sim_stub == null:
		return root
	var n := mini(int(card.get("count", 1)), count_cap)
	for i in n:
		var u := sim_stub.make_unit(card, 0, 0, false, "LEFT")
		var m := ModelFactory.build_unit(u)
		m.get_node("Model").position.y = 0.0 if str(card["type"]) != "flying" else 1.2
		if m.get_child_count() > 1:
			m.get_child(1).visible = false
		var ang := TAU * i / maxf(1.0, n)
		m.position = Vector3(cos(ang), 0, sin(ang)) * (0.0 if n == 1 else 0.9)
		root.add_child(m)
	return root

func _frame_camera(cam: Camera3D, target: Node3D, pitch: float, margin: float) -> void:
	var acc: Array = []
	_bounds(target, acc)
	var box: AABB = acc[0] if not acc.is_empty() else AABB(Vector3(-1, 0, -1), Vector3(2, 2, 2))
	var center := box.get_center()
	var size := maxf(box.size.y, box.size.x) * margin
	var dist := size / (2.0 * tan(deg_to_rad(cam.fov / 2.0))) + box.size.z * 0.5 + 0.4
	var cpos := center + Vector3(0, dist * sin(pitch), dist * cos(pitch))
	cam.transform = Transform3D(Basis.looking_at(center - cpos, Vector3.UP), cpos)

func _bounds(n: Node, acc: Array) -> void:
	if n is MeshInstance3D and (n as MeshInstance3D).mesh != null and n.visible:
		var mi := n as MeshInstance3D
		var a := mi.global_transform * mi.get_aabb()
		if acc.is_empty():
			acc.append(a)
		else:
			acc[0] = acc[0].merge(a)
	for c in n.get_children():
		_bounds(c, acc)

func _build_stage() -> void:
	stage_vp = _make_env_viewport(Vector2i(390, 320))
	stage_pivot = Node3D.new()
	stage_vp.add_child(stage_pivot)
	var model := _build_model(3)
	stage_pivot.add_child(model)
	if mode != "card" or str(card.get("rarity", "")) == "hero":
		_add_aura(stage_pivot)
	var cam := Camera3D.new()
	cam.fov = 32.0
	stage_vp.add_child(cam)
	cam.current = true
	var svc := SubViewportContainer.new()
	svc.stretch = true
	svc.position = Vector2(0, 0)
	svc.size = Vector2(390, 320)
	svc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	svc.add_child(stage_vp)
	add_child(svc)
	# frame after the model has entered the tree so global AABBs are valid
	call_deferred("_frame_stage", cam)

func _add_aura(parent: Node3D) -> void:
	## Glowing ring + orbiting sparks under evolution / hero models.
	var col := Color(str(card.get("evolutionAuraColor", "#00d4ff" if mode == "hero" else "#b66cff")))
	var ring := MeshInstance3D.new()
	var tm := TorusMesh.new()
	tm.inner_radius = 1.55
	tm.outer_radius = 1.75
	ring.mesh = tm
	ring.position.y = 0.05
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.emission_enabled = true
	mat.emission = col
	mat.emission_energy_multiplier = 2.0
	ring.material_override = mat
	parent.add_child(ring)
	for i in 6:
		var spark := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.1
		sm.height = 0.2
		spark.mesh = sm
		spark.material_override = mat
		var a := TAU * i / 6.0
		spark.position = Vector3(cos(a) * 1.65, 0.4 + (i % 3) * 0.9, sin(a) * 1.65)
		parent.add_child(spark)

func _frame_stage(cam: Camera3D) -> void:
	await get_tree().process_frame
	if not is_instance_valid(cam) or not is_instance_valid(stage_pivot) or cam.is_queued_for_deletion():
		return
	_frame_camera(cam, stage_pivot, deg_to_rad(12), 1.35)

func _build_panel() -> void:
	var rc := _rarity_col()
	var panel := UI.panel(Color("203a6e"), 18, Color("0d1b3a"), 3)
	panel.position = Vector2(14, 300)
	panel.size = Vector2(362, 500)
	add_child(panel)
	# card frame (left) with elixir cost
	var cw := UI.card_widget(card, Vector2(96, 120))
	cw.position = Vector2(14, -8)
	panel.add_child(cw)
	var title := UI.label(str(card["name"]), 26 if str(card["name"]).length() <= 13 else (21 if str(card["name"]).length() <= 18 else 17))
	title.position = Vector2(124, 10)
	title.size = Vector2(226, 36)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.clip_text = true
	panel.add_child(title)
	var sub := UI.label(str(card.get("rarity", "common")).capitalize(), 17, rc.lightened(0.3))
	sub.position = Vector2(124, 46)
	sub.size = Vector2(226, 26)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(sub)
	# rarity / type chips
	_chip(panel, "RARITY", str(card.get("rarity", "common")).capitalize(), Vector2(124, 80), rc)
	_chip(panel, "TYPE", _type_label(), Vector2(244, 80), Color("2ecc71"))
	# close button
	var x := UI.button("X", Color("e74c3c"), func(): closed.emit(), Vector2(34, 34), 18)
	x.position = Vector2(322, -14)
	panel.add_child(x)
	# pager
	pager = Control.new()
	pager.position = Vector2(12, 134)
	pager.size = Vector2(338, 290)
	pager.clip_contents = true
	pager.gui_input.connect(_pager_input)
	var pbg := UI.panel(Color("e4e9f2"), 14, Color("9fb0cc"), 3)
	pbg.size = pager.size
	pbg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	pager.add_child(pbg)
	panel.add_child(pager)
	_build_field_page()
	_build_stats_page()
	_build_desc_page()
	_build_chaos_page()
	for i in PAGES:
		var d := Panel.new()
		d.size = Vector2(16, 16)
		d.position = Vector2(169 - 36 + i * 24, 410)
		d.mouse_filter = Control.MOUSE_FILTER_IGNORE
		panel.add_child(d)
		dots.append(d)
	# buttons
	var already := in_deck and mode == "card"
	var use_text := "In deck" if already else ("Use" if mode == "card" else ("Evolve" if mode == "evo" else "Hero"))
	use_btn = UI.button(use_text, Color("f5a623") if not already else Color("6b7a99"), func(): use_pressed.emit(mode), Vector2(150, 54), 24)
	use_btn.position = Vector2(190, 436)
	use_btn.size = Vector2(150, 54)
	use_btn.disabled = already
	panel.add_child(use_btn)
	var cost_pill := UI.panel(Color("27ae60"), 12, Color("1e8449"), 2)
	cost_pill.position = Vector2(22, 436)
	cost_pill.size = Vector2(150, 54)
	panel.add_child(cost_pill)
	var el := UI.hbox(6)
	el.position = Vector2(30, 8)
	el.add_child(UI.icon("drop", Color("d23be0"), Vector2(26, 32)))
	el.add_child(UI.label("%d Elixir" % int(card.get("cost", 0)), 20))
	cost_pill.add_child(el)
	_show_page(0)

func _chip(parent: Control, head: String, value: String, pos: Vector2, col: Color) -> void:
	var c := UI.panel(Color("142a55"), 10, Color("0d1b3a"), 2)
	c.position = pos
	c.size = Vector2(112, 44)
	var h := UI.label(head, 11, Color("8be8c1"), 2)
	h.position = Vector2(0, 1)
	h.size = Vector2(112, 16)
	h.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	c.add_child(h)
	var v := UI.label(value, 15, col.lightened(0.35), 3)
	v.position = Vector2(0, 17)
	v.size = Vector2(112, 22)
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	c.add_child(v)
	parent.add_child(c)

func _type_label() -> String:
	var t := str(card.get("type", "ground"))
	if t == "spell":
		return "Spell"
	if t == "building":
		return "Building"
	return "Troop"

# ----------------------------------------------------------------------------------------- pages

func _build_field_page() -> void:
	var holder := Control.new()
	holder.size = pager.size
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	field_vp = _make_env_viewport(Vector2i(330, 280))
	# arena patch: grass, a path, a river with a bridge, and a tower
	var grass := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(14, 14)
	grass.mesh = pm
	var gm := StandardMaterial3D.new()
	gm.albedo_color = Color("7fb35a")
	gm.roughness = 1.0
	grass.material_override = gm
	field_vp.add_child(grass)
	var river := MeshInstance3D.new()
	var rm := PlaneMesh.new()
	rm.size = Vector2(14, 1.6)
	river.mesh = rm
	river.position = Vector3(0, 0.02, -4.2)
	var wm := StandardMaterial3D.new()
	wm.albedo_color = Color("3fa9e8")
	river.material_override = wm
	field_vp.add_child(river)
	var bridge := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(1.7, 0.12, 2.0)
	bridge.mesh = bm
	bridge.position = Vector3(-2.2, 0.08, -4.2)
	var bmat := StandardMaterial3D.new()
	bmat.albedo_color = Color("9a6b3c")
	bridge.material_override = bmat
	field_vp.add_child(bridge)
	var path := MeshInstance3D.new()
	var pam := BoxMesh.new()
	pam.size = Vector3(1.5, 0.03, 9.0)
	path.mesh = pam
	path.position = Vector3(-2.2, 0.03, 0.2)
	var pmat := StandardMaterial3D.new()
	pmat.albedo_color = Color("d9c28f")
	path.material_override = pmat
	field_vp.add_child(path)
	field_unit = _build_model(2)
	field_unit.position = Vector3(-2.2, 0, 2.5)
	field_vp.add_child(field_unit)
	var cam := Camera3D.new()
	cam.fov = 38.0
	field_vp.add_child(cam)
	cam.current = true
	cam.position = Vector3(-0.5, 9.5, 8.5)
	cam.basis = Basis.looking_at(Vector3(-1.2, 0, -1.2) - cam.position, Vector3.UP)
	var svc := SubViewportContainer.new()
	svc.stretch = true
	svc.position = Vector2(4, 5)
	svc.size = Vector2(330, 280)
	svc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	svc.add_child(field_vp)
	holder.add_child(svc)
	pager.add_child(holder)
	page_nodes.append(holder)

func _stat_rows() -> Array:
	var c := card
	var rows: Array = []
	if c.get("hp") != null:
		rows.append(["Hitpoints", str(int(c["hp"])), "ff4d6d"])
	if c.get("damage") != null and float(c["damage"]) > 0.0:
		var cnt := int(c.get("count", 1))
		var dmg_txt := str(int(c["damage"]))
		if str(c.get("type")) != "spell" and cnt > 1:
			dmg_txt += " x%d" % cnt
		rows.append(["Damage", dmg_txt, "ff9f43"])
	if c.get("spawnDamage") != null:
		rows.append(["Spawn Damage", str(int(c["spawnDamage"])), "ff9f43"])
	if c.get("deathDamage") != null:
		rows.append(["Death Damage", str(int(c["deathDamage"])), "ff9f43"])
	if c.get("attackSpeed") != null:
		rows.append(["Hit Speed", "%.1fsec" % (float(c["attackSpeed"]) / 1000.0), "dfe6f5"])
	if c.get("speed") != null:
		var sp := float(c["speed"])
		var st := "Slow" if sp <= 1.0 else ("Medium" if sp <= 1.5 else ("Fast" if sp <= 2.0 else "Very Fast"))
		rows.append(["Speed", st, "dfe6f5"])
	if c.get("range") != null and str(c.get("type")) != "spell":
		var r := float(c["range"])
		rows.append(["Range", "Melee" if r <= 30.0 else "%.1f" % (round(r / 21.7 * 2.0) / 2.0), "dfe6f5"])
	if str(c.get("type")) != "spell" and c.get("hp") != null:
		var tt := str(c.get("targetType", "all"))
		var tl := "Buildings" if tt == "buildings" else ("Ground" if tt == "ground" else "Air & Ground")
		rows.append(["Targets", tl, "dfe6f5"])
	if c.get("radius") != null:
		rows.append(["Radius", "%.1f" % (float(c["radius"]) / 21.7), "dfe6f5"])
	if c.get("splashRadius") != null:
		rows.append(["Splash Radius", "%.1f" % (float(c["splashRadius"]) / 21.7), "dfe6f5"])
	if c.get("lifetime") != null:
		rows.append(["Lifetime", "%.0fsec" % float(c["lifetime"]), "dfe6f5"])
	if c.get("duration") != null:
		rows.append(["Duration", "%.1fsec" % (float(c["duration"])), "dfe6f5"])
	if c.get("stun") != null:
		rows.append(["Stun", "%.1fsec" % (float(c["stun"])), "7fd6ff"])
	if c.get("freezeDuration") != null:
		rows.append(["Freeze", "%.1fsec" % (float(c["freezeDuration"])), "7fd6ff"])
	if c.get("shieldHp") != null:
		rows.append(["Shield", str(int(c["shieldHp"])), "7fd6ff"])
	if c.get("spawns") != null:
		rows.append(["Spawns", str(c["spawns"]).replace("_", " ").capitalize(), "dfe6f5"])
	if int(c.get("count", 1)) > 1 and str(c.get("type")) != "spell":
		rows.append(["Units", "x%d" % int(c["count"]), "dfe6f5"])
	return rows

func _build_stats_page() -> void:
	var holder := Control.new()
	holder.size = pager.size
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var grid := GridContainer.new()
	grid.columns = 2
	grid.position = Vector2(8, 8)
	grid.size = Vector2(322, 270)
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	grid.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var i := 0
	for r in _stat_rows():
		var cell := UI.panel(Color("33c46b") if i < 2 else Color("c9d3e6"), 8, Color("1e8449") if i < 2 else Color("aab6cc"), 2)
		cell.custom_minimum_size = Vector2(158, 50)
		cell.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var head := UI.label(r[0], 12, Color("1b2a4a") if i >= 2 else Color.WHITE, 0)
		head.position = Vector2(10, 3)
		cell.add_child(head)
		var val := UI.label(r[1], 18, Color.WHITE if i < 2 else Color("1b2a4a"), 3 if i < 2 else 0)
		val.position = Vector2(10, 20)
		val.size = Vector2(146, 26)
		val.clip_text = true
		cell.add_child(val)
		grid.add_child(cell)
		i += 1
	holder.add_child(grid)
	pager.add_child(holder)
	page_nodes.append(holder)

const HERO_ABILITIES := {
	"heroFieryFlightAbility": ["Fiery Flight", "Flies for 5s with a speed boost, raining fireballs and tornados."],
	"heroTripleThreatAbility": ["Triple Threat", "Leaps back leaving a decoy; the next shot is a triple shot."],
	"heroSurgingAbility": ["Surging Strikes", "Stuns nearby enemies, then twin beams of lightning for 3s."],
	"heroTauntAbility": ["Triumphant Taunt", "Gains a shield and taunts nearby enemies into attacking him for 5s."],
	"heroHurlAbility": ["Heroic Hurl", "Grabs the highest-HP enemy troop nearby and throws it across the arena."],
	"heroBreakfastAbility": ["Breakfast Boost", "Eats all cooked pancakes: gains levels and heals 30%."],
	"heroTurretAbility": ["Trusty Turret", "Spawns a rapid-fire auto-turret in front of him for 10s."],
	"heroSnowstormAbility": ["Snowstorm", "Whips up a snowstorm that slows and chills everything around."],
	"heroBannerAbility": ["Banner Brigade", "When the last Goblin stands, a banner calls in 4 more Goblins."],
	"heroWarpAbility": ["Wounding Warp", "Warps to the lowest-HP enemy, hitting for 468 on arrival."],
	"heroSwishAbility": ["Stone Swish", "Plants his feet and lobs boulders from Mortar range."],
	"heroRevivalAbility": ["Regal Revival", "Destroys the Tombstone and raises Tomb Queen."],
	"heroCoffinAbility": ["Coffin Cadet", "Drops cadet skeletons and a bomb on the spot."],
	"heroDismountAbility": ["Destructive Dismount", "Slams the ground, stunning and damaging nearby enemies."],
	"heroWhirlwindAbility": ["Wild Whirlwind", "Spins for 3.5s hitting everything around her (takes 15% less damage)."],
	"heroSavageAbility": ["Savage Survival", "Goes berserk for 4s: faster, stronger and unkillable."],
	"heroFrostyAbility": ["Frosty Fella", "Summons a snowman that freezes nearby enemies until it falls."],
	"heroRerollAbility": ["Rowdy Reroll", "Barrels down the lane a second time."],
}

func description_text() -> String:
	var c := card
	var t := str(c.get("type", "ground"))
	var parts: Array = []
	for k in HERO_ABILITIES:
		if c.get(k, false):
			var ab: Array = HERO_ABILITIES[k]
			return "%s (%d elixir)\n\n%s\nOne use per deployment." % [ab[0], int(c.get("abilityCost", 1)), ab[1]]
	var n := int(c.get("count", 1))
	var nm := str(c["name"])
	if t == "spell":
		parts.append("Casts %s on the target area." % nm)
		if c.get("damage") != null and float(c["damage"]) > 0.0:
			parts.append("Deals %d damage to everything in the radius." % int(c["damage"]))
		if c.get("stun") != null or c.get("freezeDuration") != null:
			parts.append("Stuns or freezes whatever it hits.")
		if c.get("knockback") != null:
			parts.append("Knocks enemies back.")
	elif t == "building":
		parts.append("A defensive building that lasts %d seconds." % int(float(c.get("lifetime", 30))))
		if c.get("spawns") != null:
			parts.append("Spawns %s over time." % str(c["spawns"]).replace("_", " "))
		if c.get("damage") != null and float(c["damage"]) > 0.0:
			parts.append("Attacks enemies in range for %d damage." % int(c["damage"]))
	else:
		parts.append("%s %s%s." % ["Deploys %d" % n if n > 1 else "Deploys a", nm, "s" if n > 1 else ""])
		if t == "flying":
			parts.append("It flies, so only air-targeting troops can hit it.")
		if str(c.get("targetType", "")) == "buildings":
			parts.append("Only attacks buildings.")
		if c.get("splash", false):
			parts.append("Attacks hit several enemies at once.")
		if c.get("range") != null and float(c["range"]) > 40.0:
			parts.append("Attacks from a distance.")
		if c.get("charge", false):
			parts.append("Charges up for a powerful first hit.")
		if c.get("jumps", false):
			parts.append("Jumps over the river and lands with a shockwave.")
		if c.get("deathSpawns") != null:
			parts.append("Leaves %s behind when destroyed." % str(c["deathSpawns"]).replace("_", " "))
		if c.get("hasShield", false):
			parts.append("Protected by a shield.")
		if c.get("kamikaze", false):
			parts.append("Explodes on impact.")
		if c.get("evolution", false):
			parts.append("Evolved form with an extra ability.")
		if c.get("abilityCooldown") != null:
			parts.append("Has an active ability you trigger during battle.")
	return " ".join(parts)

func _build_desc_page() -> void:
	var holder := Control.new()
	holder.size = pager.size
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var l := UI.label(description_text(), 18, Color("46526e"), 0)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.position = Vector2(20, 30)
	l.size = Vector2(300, 230)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	holder.add_child(l)
	pager.add_child(holder)
	page_nodes.append(holder)

## Last page: the card's three CHAOS modifiers (Common / Rare / Epic).
func _build_chaos_page() -> void:
	var holder := Control.new()
	holder.size = pager.size
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var head := UI.label("CHAOS MODIFIERS", 17, Color("7d3cb0"), 0)
	head.position = Vector2(0, 8)
	head.size = Vector2(pager.size.x, 24)
	head.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	holder.add_child(head)
	Chaos.ensure()
	var mods: Array = Chaos.DATA.get(str(card.get("id", "")).trim_prefix("evolved_").trim_prefix("hero_"), [])
	var cols := {"common": Color("7f8c8d"), "rare": Color("e08e0b"), "epic": Color("8e44ad")}
	var y := 32.0
	for m in mods:
		var row := UI.panel(Color("f3f5fa"), 10, cols[str(m["tier"])], 3)
		row.position = Vector2(10, y)
		row.size = Vector2(pager.size.x - 20, 76)
		row.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var tl := UI.label(str(m["tier"]).to_upper(), 11, cols[str(m["tier"])], 0)
		tl.position = Vector2(10, 4)
		tl.size = Vector2(80, 16)
		row.add_child(tl)
		var nl := UI.label(str(m["name"]), 17, Color("2a3550"), 0)
		nl.position = Vector2(10, 18)
		nl.size = Vector2(row.size.x - 20, 22)
		row.add_child(nl)
		var dl := UI.label(ChaosUI._wrap(str(m["desc"]), 40), 12, Color("46526e"), 0)
		dl.position = Vector2(10, 38)
		dl.size = Vector2(row.size.x - 20, 34)
		dl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(dl)
		holder.add_child(row)
		y += 82.0
	if mods.is_empty():
		var none := UI.label("No Chaos modifiers for this card.", 16, Color("46526e"), 0)
		none.position = Vector2(20, 120)
		none.size = Vector2(300, 40)
		none.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		holder.add_child(none)
	pager.add_child(holder)
	page_nodes.append(holder)

# --------------------------------------------------------------------------------------- paging

func _show_page(i: int) -> void:
	page = clampi(i, 0, PAGES - 1)
	for k in page_nodes.size():
		(page_nodes[k] as Control).visible = k == page
	for k in dots.size():
		var d: Panel = dots[k]
		d.add_theme_stylebox_override("panel", UI.style(Color("f5a623") if k == page else Color("8895b3"), 8, Color("1b2a4a"), 2))

func _pager_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT:
		if ev.pressed:
			drag_start = ev.position.x
		elif drag_start >= 0.0:
			var dx: float = ev.position.x - drag_start
			drag_start = -1.0
			if dx < -40.0:
				_show_page(page + 1)
			elif dx > 40.0:
				_show_page(page - 1)
			else:
				_show_page((page + 1) % PAGES)

func _process(delta: float) -> void:
	if stage_pivot != null:
		stage_pivot.rotation.y += delta * 0.9
	if field_unit != null and visible and page == 0:
		field_t += delta
		var z := 2.5 - fmod(field_t * 1.1, 8.0)
		field_unit.position.z = z
		if z < -4.5:
			field_t = 0.0
