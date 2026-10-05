class_name Battle
extends Node3D
## Battle controller: owns the Sim, the 3D ArenaView, the camera and the battle HUD (drag-to-deploy).

signal finished(result: String)

const DEFAULT_DECK := ["mother_witch", "elixir_golem", "ice_golem", "ice_spirit", "skeletons", "fireball", "zap", "hog_rider"]
const TRAY_H := 150.0

var sim: Sim
var view: ArenaView
var cam: Camera3D
var hud: CanvasLayer
var acc := 0.0
var speed := 1.0
var paused := false
var intro_left := 0.0
var intro_panel: Control

# hud refs
var timer_lbl: Label
var crowns_player: Label
var crowns_enemy: Label
var elixir_fill: ColorRect
var elixir_lbl: Label
var alert_lbl: Label
var slot_panels: Array = []
var next_panel: Control
var over_panel: Control
var ghost: Control
var drag_idx := -1
var drag_card: Dictionary = {}
var shake_t := 0.0
var cam_base := Transform3D()

# debug / automation (used by headless + screenshot runs)
var auto_play := false
var shot_path := ""
var shot_time := -1.0
var shot_taken := false

func start(player_deck_ids: Array = DEFAULT_DECK, player_tower: String = "princess", evo_ids: Array = [], hero_id: String = "", low_perf: bool = false) -> void:
	var enemy := _random_deck()
	sim = Sim.new(CardDB.deck_by_ids(player_deck_ids), enemy, player_tower)
	sim.players[0]["evo_slots"] = evo_ids
	sim.players[0]["hero_slot"] = hero_id if hero_id != "" else null
	if low_perf:
		speed = 1.0
	var args := OS.get_cmdline_user_args()
	for a in args:
		if a == "--autoplay":
			auto_play = true
		elif a.begins_with("--shot="):
			shot_path = a.substr(7)
		elif a.begins_with("--shot-time="):
			shot_time = float(a.substr(12))
		elif a.begins_with("--speed="):
			speed = float(a.substr(8))
		elif a.begins_with("--deck="):
			sim = Sim.new(CardDB.deck_by_ids(a.substr(7).split(",")), enemy, player_tower)
	if auto_play:
		sim.ai_enabled = [true, true]
	else:
		intro_left = 2.2
	view = ArenaView.new()
	add_child(view)
	view.setup(sim)
	_build_camera()
	_build_hud()
	if intro_left > 0.0:
		_build_intro()
	for a2 in OS.get_cmdline_user_args():
		if a2 == "--selftest":
			call_deferred("_selftest")

func _selftest() -> void:
	# round-trip: sim point -> screen -> sim point (validates drag-to-deploy picking)
	var ok := true
	for pt in [Vector2(95, 600), Vector2(295, 700), Vector2(195, 500), Vector2(70, 430)]:
		var scr := cam.unproject_position(ArenaView.to3(pt.x, pt.y))
		var back: Variant = screen_to_sim(scr)
		var err := (back as Vector2).distance_to(pt)
		print("SELFTEST ", pt, " -> screen ", scr.round(), " -> ", (back as Vector2).round(), " err=", snappedf(err, 0.01))
		if err > 1.0:
			ok = false
	print("SELFTEST ", "PASS" if ok else "FAIL")

func _random_deck() -> Array:
	CardDB.ensure()
	var pool := CardDB.all.filter(func(c): return not c.get("isToken", false) and not c.get("evolution", false) and c.get("cost", 0) > 0)
	pool.shuffle()
	return pool.slice(0, 8)

func _build_intro() -> void:
	intro_panel = Control.new()
	intro_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var dim := ColorRect.new()
	dim.color = Color(0.03, 0.06, 0.16, 0.92)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	intro_panel.add_child(dim)
	var me := UI.label("bigbangsidzrox", 30, Color("6bb6ff"))
	me.position = Vector2(0, 250)
	me.size = Vector2(390, 40)
	me.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	intro_panel.add_child(me)
	var vs := UI.label("VS", 64, Color("ffe08a"), 10)
	vs.position = Vector2(0, 340)
	vs.size = Vector2(390, 80)
	vs.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	intro_panel.add_child(vs)
	var foe := UI.label("HEB", 30, Color("ff6b6b"))
	foe.position = Vector2(0, 450)
	foe.size = Vector2(390, 40)
	foe.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	intro_panel.add_child(foe)
	hud.add_child(intro_panel)

func _build_camera() -> void:
	cam = Camera3D.new()
	cam.keep_aspect = Camera3D.KEEP_WIDTH
	cam.fov = 44.0
	cam.near = 0.5
	cam.far = 200.0
	add_child(cam)
	var target := Vector3(0, 0, 4.2)
	var pitch := deg_to_rad(62.0)
	var dist := 36.0
	cam.position = target + Vector3(0, sin(pitch) * dist, cos(pitch) * dist)
	cam.look_at(target, Vector3.UP)
	cam_base = cam.transform
	cam.current = true

# ----------------------------------------------------------------------------- HUD

func _build_hud() -> void:
	hud = CanvasLayer.new()
	add_child(hud)
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(root)
	# top bar
	var top := PanelContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.custom_minimum_size = Vector2(0, 56)
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.05, 0.1, 0.2, 0.72)
	sb.corner_radius_bottom_left = 18
	sb.corner_radius_bottom_right = 18
	top.add_theme_stylebox_override("panel", sb)
	root.add_child(top)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 24)
	top.add_child(row)
	crowns_enemy = _label("0", 26, Color("ff6b6b"))
	var crown_e := _label("♛", 26, Color("ff6b6b"))
	timer_lbl = _label("3:00", 30, Color.WHITE)
	var crown_p := _label("♛", 26, Color("6bb6ff"))
	crowns_player = _label("0", 26, Color("6bb6ff"))
	for n in [crowns_enemy, crown_e, timer_lbl, crown_p, crowns_player]:
		row.add_child(n)
	alert_lbl = _label("", 44, Color("ffe08a"))
	alert_lbl.set_anchors_preset(Control.PRESET_CENTER_TOP)
	alert_lbl.position = Vector2(0, 90)
	alert_lbl.size = Vector2(390, 60)
	alert_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	alert_lbl.anchor_left = 0.0
	alert_lbl.anchor_right = 1.0
	alert_lbl.offset_left = 0
	alert_lbl.offset_right = 0
	root.add_child(alert_lbl)
	# bottom tray
	var tray := Panel.new()
	tray.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	tray.offset_top = -TRAY_H
	tray.mouse_filter = Control.MOUSE_FILTER_STOP
	var tsb := StyleBoxFlat.new()
	tsb.bg_color = Color(0.1, 0.12, 0.2, 0.92)
	tsb.corner_radius_top_left = 20
	tsb.corner_radius_top_right = 20
	tray.add_theme_stylebox_override("panel", tsb)
	root.add_child(tray)
	# elixir bar
	var bar_bg := ColorRect.new()
	bar_bg.color = Color(0.06, 0.04, 0.12)
	bar_bg.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bar_bg.offset_top = -30
	bar_bg.offset_bottom = -8
	bar_bg.offset_left = 14
	bar_bg.offset_right = -14
	root.add_child(bar_bg)
	elixir_fill = ColorRect.new()
	elixir_fill.color = Color("c43bd9")
	elixir_fill.size = Vector2(100, 22)
	bar_bg.add_child(elixir_fill)
	for i in range(1, 10):
		var tick := ColorRect.new()
		tick.color = Color(0, 0, 0, 0.45)
		tick.position = Vector2(i * 36.2, 0)
		tick.size = Vector2(2, 22)
		bar_bg.add_child(tick)
	elixir_lbl = _label("5", 18, Color.WHITE)
	elixir_lbl.position = Vector2(6, -1)
	bar_bg.add_child(elixir_lbl)
	# hand
	var hand_row := Control.new()
	hand_row.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	hand_row.offset_top = -TRAY_H + 8
	hand_row.offset_bottom = -34
	hand_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(hand_row)
	next_panel = _card_widget(Vector2(52, 68))
	next_panel.position = Vector2(8, 20)
	next_panel.modulate = Color(1, 1, 1, 0.75)
	hand_row.add_child(next_panel)
	var nxt := _label("NEXT", 10, Color("b0b8d0"))
	nxt.position = Vector2(14, 2)
	hand_row.add_child(nxt)
	for i in 4:
		var w := _card_widget(Vector2(70, 94))
		w.position = Vector2(68 + i * 78, 8)
		w.gui_input.connect(_on_slot_input.bind(i))
		hand_row.add_child(w)
		slot_panels.append(w)
	# ghost shown under the finger while dragging
	ghost = _card_widget(Vector2(70, 94))
	ghost.visible = false
	ghost.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(ghost)
	# game over
	over_panel = PanelContainer.new()
	over_panel.visible = false
	over_panel.set_anchors_preset(Control.PRESET_CENTER)
	over_panel.custom_minimum_size = Vector2(300, 220)
	over_panel.position = Vector2(45, 260)
	var osb := StyleBoxFlat.new()
	osb.bg_color = Color(0.08, 0.1, 0.2, 0.96)
	osb.set_corner_radius_all(24)
	osb.border_color = Color("f5c518")
	osb.set_border_width_all(4)
	over_panel.add_theme_stylebox_override("panel", osb)
	root.add_child(over_panel)

func _label(text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color.BLACK)
	l.add_theme_constant_override("outline_size", 6)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _card_widget(size: Vector2) -> Control:
	var p := Panel.new()
	p.custom_minimum_size = size
	p.size = size
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("3a3f55")
	sb.set_corner_radius_all(10)
	sb.set_border_width_all(3)
	sb.border_color = Color("7f8c8d")
	p.add_theme_stylebox_override("panel", sb)
	var name_l := _label("", 11, Color.WHITE)
	name_l.name = "Name"
	name_l.position = Vector2(2, size.y - 24)
	name_l.size = Vector2(size.x - 4, 20)
	name_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	p.add_child(name_l)
	var swatch := ColorRect.new()
	swatch.name = "Swatch"
	swatch.position = Vector2(size.x * 0.2, size.y * 0.12)
	swatch.size = Vector2(size.x * 0.6, size.y * 0.5)
	swatch.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(swatch)
	var cost := _label("", 16, Color.WHITE)
	cost.name = "Cost"
	cost.position = Vector2(-2, -4)
	cost.size = Vector2(26, 26)
	cost.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var cb := Panel.new()
	cb.name = "CostBg"
	cb.position = Vector2(-4, -6)
	cb.size = Vector2(28, 28)
	var csb := StyleBoxFlat.new()
	csb.bg_color = Color("c43bd9")
	csb.set_corner_radius_all(14)
	csb.set_border_width_all(2)
	csb.border_color = Color("f3c6ff")
	cb.add_theme_stylebox_override("panel", csb)
	cb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(cb)
	cb.add_child(cost)
	cost.position = Vector2(0, 1)
	return p

func _evo_badge(w: Control, card: Dictionary) -> void:
	var tag: Label = w.get_node_or_null("EvoTag")
	if tag == null:
		tag = _label("", 11, Color("e0b3ff"))
		tag.name = "EvoTag"
		tag.position = Vector2(34, 2)
		w.add_child(tag)
	var prog := sim.mech.evolution_progress(0, card)
	if not prog.is_empty():
		tag.text = "EVO!" if prog["ready"] else "%d/%d" % [prog["current"], prog["required"]]
		tag.add_theme_color_override("font_color", Color("ffe08a") if prog["ready"] else Color("e0b3ff"))
	elif card.get("heroVariantId") != null and sim.players[0]["hero_slot"] == card["id"]:
		tag.text = "HERO"
		tag.add_theme_color_override("font_color", Color("6ee7ff"))
	else:
		tag.text = ""

func _fill_card(w: Control, card: Dictionary, affordable: bool = true) -> void:
	if card.is_empty():
		w.visible = false
		return
	w.visible = true
	w.get_node("Name").text = str(card["name"])
	w.get_node("Swatch").color = Color(str(card["color"]))
	w.get_node("CostBg/Cost").text = str(int(card["cost"]))
	var sb: StyleBoxFlat = w.get_theme_stylebox("panel")
	sb.border_color = Color(str(RARITY_COLORS.get(str(card.get("rarity", "common")), "#7f8c8d")))
	w.modulate = Color.WHITE if affordable else Color(0.55, 0.55, 0.6, 1.0)

const RARITY_COLORS := {"common": "#7f8c8d", "rare": "#f39c12", "epic": "#9b59b6", "legendary": "#2ecc71", "champion": "#f1c40f", "hero": "#00bcd4"}

# ----------------------------------------------------------------------------- input / drag

func _on_slot_input(ev: InputEvent, idx: int) -> void:
	if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed and sim.game_over == "":
		drag_idx = idx
		drag_card = sim.players[0]["hand"][idx]
		ghost.visible = true
		_fill_card(ghost, drag_card, true)
		ghost.position = ev.global_position - ghost.size / 2.0
		view.show_placement(not drag_card.get("type", "") == "spell" and not Sim._v(drag_card, "deployAnywhere", false))

func _input(ev: InputEvent) -> void:
	if drag_idx == -1:
		return
	if ev is InputEventMouseMotion:
		ghost.position = ev.position - ghost.size / 2.0 - Vector2(0, 40)
	elif ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and not ev.pressed:
		_release_drag(ev.position)

func _release_drag(pos: Vector2) -> void:
	var idx := drag_idx
	drag_idx = -1
	ghost.visible = false
	view.show_placement(false)
	var vp := get_viewport().get_visible_rect().size
	if pos.y > vp.y - TRAY_H:
		return
	var sp: Variant = screen_to_sim(pos - Vector2(0, 40))
	if sp != null:
		sim.play_card(0, idx, sp.x, sp.y)

func screen_to_sim(pos: Vector2) -> Variant:
	var o := cam.project_ray_origin(pos)
	var d := cam.project_ray_normal(pos)
	if absf(d.y) < 0.0001:
		return null
	var t := -o.y / d.y
	if t < 0:
		return null
	var p := o + d * t
	var s := ArenaView.from3(p)
	return Vector2(clampf(s.x, 0.0, Sim.W), clampf(s.y, 0.0, Sim.H))

# ----------------------------------------------------------------------------- loop

func _process(delta: float) -> void:
	if sim == null:
		return
	if intro_left > 0.0:
		intro_left -= delta
		if intro_left <= 0.0 and intro_panel:
			intro_panel.queue_free()
	if not paused and sim.game_over == "" and intro_left <= 0.0:
		acc += delta * 1000.0 * speed
		var guard := 0
		while acc >= Sim.TICK_MS and guard < 8 and sim.game_over == "":
			acc -= Sim.TICK_MS
			sim.step()
			guard += 1
			_scan_alerts()
	_update_hud()
	_update_camera(delta)
	if sim.game_over != "" and not over_panel.visible:
		_show_game_over()
	if shot_path != "" and not shot_taken and shot_time >= 0.0 and sim.now / 1000.0 >= shot_time:
		_take_screenshot()

func _scan_alerts() -> void:
	for e in sim.fx:
		if e["t"] == "alert":
			alert_lbl.text = e["msg"]
			alert_lbl.modulate.a = 1.0
			var tw := create_tween()
			tw.tween_interval(2.0)
			tw.tween_property(alert_lbl, "modulate:a", 0.0, 0.8)

func _update_hud() -> void:
	var p: Dictionary = sim.players[0]
	var secs := sim.time_left
	if sim.is_decay:
		timer_lbl.text = "DECAY"
	else:
		timer_lbl.text = "%d:%02d" % [maxi(secs, 0) / 60, maxi(secs, 0) % 60]
	timer_lbl.add_theme_color_override("font_color", Color("ffb347") if (sim.is_double or sim.is_overtime) else Color.WHITE)
	crowns_player.text = str(sim.score[0])
	crowns_enemy.text = str(sim.score[1])
	var el: float = p["elixir"]
	elixir_fill.size.x = (362.0) * el / 10.0
	elixir_lbl.text = str(int(el))
	elixir_fill.color = Color("e056f5") if sim.is_double else Color("c43bd9")
	for i in 4:
		var c: Dictionary = p["hand"][i]
		if drag_idx == i:
			slot_panels[i].modulate = Color(1, 1, 1, 0.35)
			continue
		_fill_card(slot_panels[i], c, c["cost"] <= el)
		_evo_badge(slot_panels[i], c)
	_fill_card(next_panel, p["next"], true)
	next_panel.modulate.a = 0.75

func _update_camera(delta: float) -> void:
	if view.shake > 0.0:
		view.shake = maxf(0.0, view.shake - delta * 2.5)
		var off := Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * view.shake * 0.35
		cam.transform = Transform3D(cam_base.basis, cam_base.origin + off)
	else:
		cam.transform = cam_base

func _show_game_over() -> void:
	over_panel.visible = true
	for c in over_panel.get_children():
		c.queue_free()
	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 14)
	over_panel.add_child(box)
	var res: String = sim.game_over
	var col: Color = {"VICTORY": Color("6bff9a"), "DEFEAT": Color("ff6b6b"), "DRAW": Color("ffe08a")}.get(res, Color.WHITE)
	var title := _label(res, 44, col)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)
	var sc := _label("%d  -  %d" % [sim.score[0], sim.score[1]], 32, Color.WHITE)
	sc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(sc)
	var btn := Button.new()
	btn.text = "Back to lobby"
	btn.custom_minimum_size = Vector2(200, 54)
	btn.add_theme_font_size_override("font_size", 22)
	btn.pressed.connect(func(): finished.emit(res))
	box.add_child(btn)

func _take_screenshot() -> void:
	shot_taken = true
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	img.save_png(shot_path)
	print("SCREENSHOT saved ", shot_path, " size=", img.get_size())
	get_tree().quit()
