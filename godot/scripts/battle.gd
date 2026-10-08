class_name Battle
extends Node3D
## Battle controller: owns the Sim, the 3D ArenaView, the camera and the battle HUD (drag-to-deploy).

signal finished(result: String)

const DEFAULT_DECK := ["mother_witch", "elixir_golem", "ice_golem", "ice_spirit", "skeletons", "fireball", "zap", "hog_rider"]
const TRAY_H := 150.0

var sim: Sim
var view: ArenaView
var cam: Camera3D
var emotes: Emotes
var chaos_ui: ChaosUI
var chaos_on := false
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
var ability_row: HBoxContainer
var ability_btns: Dictionary = {}
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

func start(player_deck_ids: Array = DEFAULT_DECK, player_tower: String = "princess", evo_ids: Array = [], hero_id: String = "", low_perf: bool = false, chaos_mode: bool = false, enemy_ids: Array = []) -> void:
	var enemy := CardDB.deck_by_ids(enemy_ids) if enemy_ids.size() == 8 else _random_deck()
	var pdeck := CardDB.deck_by_ids(player_deck_ids)
	pdeck.shuffle()                      # App.js resetGame shuffles the player's deck each battle
	sim = Sim.new(pdeck, enemy, player_tower)
	sim.players[0]["evo_slots"] = evo_ids
	sim.start_evolutions(0)
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
		elif a == "--force-over":
			sim.score = [2, 1]
			sim.game_over = "VICTORY"
		elif a.begins_with("--evo="):
			sim.players[0]["evo_slots"] = Array(a.substr(6).split(","))
			sim.start_evolutions(0)
		elif a.begins_with("--speed="):
			speed = float(a.substr(8))
		elif a.begins_with("--deck="):
			sim = Sim.new(CardDB.deck_by_ids(a.substr(7).split(",")), enemy, player_tower)
			sim.players[0]["evo_slots"] = evo_ids
			sim.start_evolutions(0)
			sim.players[0]["hero_slot"] = hero_id if hero_id != "" else null
	for a3 in OS.get_cmdline_user_args():
		if a3 == "--chaos":
			chaos_mode = true
	if chaos_mode:
		chaos_on = true
		sim.make_decks_private()
		sim.chaos = Chaos.new(sim)
		for a4 in OS.get_cmdline_user_args():
			if a4.begins_with("--chaos-at="):
				sim.chaos.next_at = float(a4.substr(11))
			if a4.begins_with("--chaos-pick="):          # debug: --chaos-pick=knight:epic,giant:rare applies those modifiers up front
				for pk in a4.substr(13).split(","):
					var parts := pk.split(":")
					sim.chaos.choose(0, {"card": parts[0], "tier": parts[1], "name": parts[0]})
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
		Sfx.play("battle_start")
	Sfx.music("music_battle")
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
	cam.fov = 38.0
	cam.near = 0.5
	cam.far = 200.0
	add_child(cam)
	var target := Vector3(0, 0, 2.4)
	var pitch := deg_to_rad(74.0)
	var dist := 33.5
	cam.position = target + Vector3(0, sin(pitch) * dist, cos(pitch) * dist)
	cam.look_at(target, Vector3.UP)
	cam_base = cam.transform
	cam.current = true

# ----------------------------------------------------------------------------- HUD

var icons: CardIcons
var evo_ready_seen: Dictionary = {}
var enemy_crowns: Array = []
var player_crowns: Array = []

func _build_hud() -> void:
	if CardIcons.inst != null:
		icons = CardIcons.inst
	else:
		icons = CardIcons.new()
		add_child(icons)
	hud = CanvasLayer.new()
	add_child(hud)
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(root)
	# opponent cluster (top-left): flag shield, name, clan, trophies
	var flag := UI.panel(Color("e8ecf2"), 6, Color("8fa0b8"), 3)
	flag.position = Vector2(8, 8)
	flag.size = Vector2(40, 46)
	flag.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var f2 := ColorRect.new()
	f2.color = Color("2f5fc4")
	f2.position = Vector2(3, 15)
	f2.size = Vector2(34, 13)
	flag.add_child(f2)
	var f3 := ColorRect.new()
	f3.color = Color("d9382c")
	f3.position = Vector2(3, 28)
	f3.size = Vector2(34, 15)
	flag.add_child(f3)
	root.add_child(flag)
	var oname := _label("HEB", 21, Color("ff7aa8"))
	oname.position = Vector2(56, 4)
	root.add_child(oname)
	var clan := _label("Training Camp", 14, Color("f1f1f1"))
	clan.position = Vector2(56, 28)
	root.add_child(clan)
	var tro := UI.icon("trophy", Color("f5c518"), Vector2(22, 24))
	tro.position = Vector2(10, 62)
	root.add_child(tro)
	var tr := _label("10366", 18, Color.WHITE)
	tr.position = Vector2(36, 59)
	root.add_child(tr)
	# time panel (top-right)
	var tp := UI.panel(Color(0.08, 0.08, 0.1, 0.78), 10, Color(0.25, 0.25, 0.3, 0.9), 2)
	tp.position = Vector2(256, 8)
	tp.size = Vector2(128, 62)
	tp.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(tp)
	var tl := _label("Time left:", 14, Color("f0e6a8"))
	tl.position = Vector2(0, 2)
	tl.size = Vector2(128, 20)
	tl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tp.add_child(tl)
	timer_lbl = _label("3:00", 34, Color.WHITE)
	timer_lbl.position = Vector2(0, 18)
	timer_lbl.size = Vector2(128, 40)
	timer_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tp.add_child(timer_lbl)
	# crown counters on the left edge (enemy crowns top, yours bottom)
	enemy_crowns = _crown_column(root, 150, Color("e0413a"))
	player_crowns = _crown_column(root, 470, Color("2f7de1"))
	alert_lbl = _label("", 40, Color("ffe08a"))
	alert_lbl.position = Vector2(0, 100)
	alert_lbl.size = Vector2(390, 60)
	alert_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(alert_lbl)
	# bottom tray
	var tray := UI.panel(Color("1c4aa6"), 0, Color("3b78e0"), 4)
	tray.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	tray.offset_top = -TRAY_H
	tray.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(tray)
	var tray_hi := ColorRect.new()
	tray_hi.color = Color(0.45, 0.65, 1.0, 0.25)
	tray_hi.set_anchors_preset(Control.PRESET_TOP_WIDE)
	tray_hi.offset_bottom = 34
	tray_hi.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tray.add_child(tray_hi)
	# chat button + Next card (left column)
	var chat := UI.panel(Color("2d4f9e"), 18, Color("7fa6ff"), 3)
	chat.position = Vector2(12, 14)
	chat.size = Vector2(56, 46)
	chat.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var chat_ic := UI.ui_tex("chat")
	if chat_ic != null:
		var ct := TextureRect.new()
		ct.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		ct.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		ct.texture = chat_ic
		ct.position = Vector2(6, 2)
		ct.size = Vector2(44, 42)
		ct.mouse_filter = Control.MOUSE_FILTER_IGNORE
		chat.add_child(ct)
	else:
		for i in 3:
			var dot := ColorRect.new()
			dot.color = Color("2a2a30")
			dot.position = Vector2(12 + i * 13, 20)
			dot.size = Vector2(8, 8)
			chat.add_child(dot)
	tray.add_child(chat)
	var chat_hit := Button.new()
	chat_hit.flat = true
	chat_hit.position = chat.position
	chat_hit.size = chat.size
	chat_hit.pressed.connect(func(): if emotes != null: emotes.toggle_picker())
	tray.add_child(chat_hit)
	var nxt := _label("Next:", 15, Color.WHITE)
	nxt.position = Vector2(14, 62)
	tray.add_child(nxt)
	next_panel = _card_widget(Vector2(48, 62))
	next_panel.position = Vector2(16, 82)
	tray.add_child(next_panel)
	# hand: four portrait cards
	for i in 4:
		var w := _card_widget(Vector2(72, 94))
		w.position = Vector2(80 + i * 76, 10)
		w.gui_input.connect(_on_slot_input.bind(i))
		tray.add_child(w)
		slot_panels.append(w)
	# elixir bar with the big number in a drop
	var track := UI.panel(Color("2a1840"), 6, Color("120a22"), 2)
	track.position = Vector2(104, TRAY_H - 34)
	track.size = Vector2(278, 22)
	track.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tray.add_child(track)
	elixir_fill = ColorRect.new()
	elixir_fill.color = Color("d23be0")
	elixir_fill.position = Vector2(2, 2)
	elixir_fill.size = Vector2(100, 18)
	track.add_child(elixir_fill)
	for i in range(1, 10):
		var tick := ColorRect.new()
		tick.color = Color(0, 0, 0, 0.4)
		tick.position = Vector2(2 + i * 27.4, 2)
		tick.size = Vector2(2, 18)
		track.add_child(tick)
	var drop := UI.icon("drop", Color("e23bd6"), Vector2(40, 50))
	drop.position = Vector2(82, TRAY_H - 56)
	tray.add_child(drop)
	elixir_lbl = _label("5", 24, Color.WHITE, 7)
	elixir_lbl.position = Vector2(82, TRAY_H - 46)
	elixir_lbl.size = Vector2(40, 36)
	elixir_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tray.add_child(elixir_lbl)
	var mx := _label("Max: 10", 11, Color("f3d9ff"), 4)
	mx.position = Vector2(80, TRAY_H - 18)
	tray.add_child(mx)
	ability_row = HBoxContainer.new()
	ability_row.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	ability_row.offset_top = -TRAY_H - 96
	ability_row.offset_bottom = -TRAY_H - 8
	ability_row.alignment = BoxContainer.ALIGNMENT_BEGIN     # left edge, right above the hand (like real CR)
	ability_row.offset_left = 6
	ability_row.add_theme_constant_override("separation", 2)
	ability_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(ability_row)
	# ghost shown under the finger while dragging
	ghost = _card_widget(Vector2(72, 94))
	ghost.visible = false
	ghost.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(ghost)
	# game over
	over_panel = PanelContainer.new()
	over_panel.visible = false
	over_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var osb := StyleBoxFlat.new()
	osb.bg_color = Color(0, 0, 0, 0.8)
	over_panel.add_theme_stylebox_override("panel", osb)
	root.add_child(over_panel)
	emotes = Emotes.new()
	hud.add_child(emotes)
	emotes.setup(self, cam, sim)
	if chaos_on:
		chaos_ui = ChaosUI.new()
		hud.add_child(chaos_ui)
		chaos_ui.setup(sim.chaos)
		chaos_ui.picked.connect(func(offer: Dictionary):
			sim.chaos.choose(0, offer)
			sim.chaos.waiting = false
			chaos_ui.close()
			paused = false)
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--spawn-hero="):
			for hid in a.substr(13).split(","):
				var hu := sim.make_unit(CardDB.get_card(hid), 120 + 70 * sim.units.size(), 600, false, "LEFT")
				sim.units.append(hu)
				sim.mech.on_spawn(hu)
		if a == "--picker":
			emotes.toggle_picker()
		elif a.begins_with("--emote="):
			emotes.show_emote(false, a.substr(8))
			emotes.show_emote(true, "angry")

func _crown_column(root: Control, y: float, color: Color) -> Array:
	var arr: Array = []
	for i in 3:
		var c := UI.icon("crown", Color(color, 0.25), Vector2(26, 22))
		c.position = Vector2(6, y + i * 26)
		root.add_child(c)
		arr.append(c)
	return arr

func _label(text: String, size: int, color: Color, outline: int = 6) -> Label:
	return UI.label(text, size, color, outline)

func _card_widget(size: Vector2) -> Control:
	var p := Panel.new()
	p.custom_minimum_size = size
	p.size = size
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("2b3550")
	sb.set_corner_radius_all(9)
	sb.set_border_width_all(3)
	sb.border_color = Color("7f8c8d")
	p.add_theme_stylebox_override("panel", sb)
	var hex := UI.HexFrame.new()
	hex.name = "Hex"
	hex.size = size
	hex.visible = false
	hex.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(hex)
	var art := TextureRect.new()
	art.name = "Icon"
	art.position = Vector2(3, 3)
	art.size = size - Vector2(6, 14)
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	art.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(art)
	var tag := _label("", 11, Color("e0b3ff"))
	tag.name = "EvoTag"
	tag.position = Vector2(2, 2)
	tag.size = Vector2(size.x - 4, 16)
	tag.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	p.add_child(tag)
	var cost_icon := UI.icon("drop", Color("d23be0"), Vector2(30, 34))
	cost_icon.name = "CostIcon"
	cost_icon.position = Vector2(size.x / 2.0 - 15, size.y - 22)
	p.add_child(cost_icon)
	var cost := _label("", 17, Color.WHITE, 6)
	cost.name = "Cost"
	cost.position = Vector2(size.x / 2.0 - 15, size.y - 15)
	cost.size = Vector2(30, 24)
	cost.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	p.add_child(cost)
	return p

func _evo_badge(w: Control, card: Dictionary) -> void:
	var tag: Label = w.get_node_or_null("EvoTag")
	if tag == null:
		return
	var prog := sim.mech.evolution_progress(0, card)
	if not prog.is_empty():
		tag.text = "EVO!" if prog["ready"] else "%d/%d" % [prog["current"], prog["required"]]
		tag.add_theme_color_override("font_color", Color("ffe08a") if prog["ready"] else Color("e0b3ff"))
	elif card.get("heroVariantId") != null and sim.players[0]["hero_slot"] == card["id"]:
		tag.text = "HERO"
		tag.add_theme_color_override("font_color", Color("6ee7ff"))
	elif card.has("chaosTier"):
		tag.text = "CHAOS"
		tag.add_theme_color_override("font_color", {"common": Color("b8c2c4"), "rare": Color("ffb347"), "epic": Color("d9a6ff")}[str(card["chaosTier"])])
	else:
		tag.text = ""

func _fill_card(w: Control, card: Dictionary, affordable: bool = true) -> void:
	if card.is_empty():
		w.visible = false
		return
	w.visible = true
	# this runs every frame for the hand: only rebuild when the card / evolution state changed
	var prog0 := sim.mech.evolution_progress(0, card)
	var fkey := "%s|%s|%s" % [card["id"], str(prog0.get("ready", "-")) + str(prog0.get("current", "")), str(card.get("chaosTier", ""))]
	if w.get_meta("fk", "") == fkey:
		w.modulate = Color.WHITE if affordable else Color(0.62, 0.62, 0.7, 1.0)
		return
	w.set_meta("fk", fkey)
	var rc := Color(str(RARITY_COLORS.get(str(card.get("rarity", "common")), "#7f8c8d")))
	var sb: StyleBoxFlat = w.get_theme_stylebox("panel")
	sb.border_color = rc
	sb.bg_color = Color(card["color"]).darkened(0.55).lerp(Color("2b3550"), 0.5)
	var art := CardArt.texture(card)
	var ic: TextureRect = w.get_node("Icon")
	# evolution cards: purple border when the evolution is charged, dim purple while it recharges
	var evo_prog := sim.mech.evolution_progress(0, card)
	if not evo_prog.is_empty():
		sb.set_border_width_all(6 if evo_prog["ready"] else 4)
		sb.border_color = Color("c04dff") if evo_prog["ready"] else Color("6f3f8f")
		w.modulate = Color.WHITE if affordable else Color(0.62, 0.62, 0.7, 1.0)
	else:
		sb.set_border_width_all(3)
	var hex: UI.HexFrame = w.get_node("Hex")
	var shaped := UI.is_shaped(card)
	hex.visible = shaped
	if shaped:
		# legendary / champion / hero cards use the hexagon frame (art is drawn into the polygon)
		sb.bg_color = Color(0, 0, 0, 0)
		sb.border_color = Color(0, 0, 0, 0)
		hex.col = Color("c04dff") if (not evo_prog.is_empty() and evo_prog["ready"]) else rc
		hex.tex = art
		hex.gem = str(card.get("rarity", "")) == "hero"
		hex.queue_redraw()
	else:
		sb.bg_color = Color(card["color"]).darkened(0.55).lerp(Color("2b3550"), 0.5)
	if art != null and shaped:
		ic.texture = null
	elif art != null:
		ic.texture = art
		ic.position = Vector2(3, 3)
		ic.size = w.size - Vector2(6, 6)
		ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	else:
		ic.texture = icons.texture(card)
		ic.position = Vector2(3, 3)
		ic.size = w.size - Vector2(6, 14)
		ic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	w.get_node("Cost").text = str(int(card["cost"]))
	w.modulate = Color.WHITE if affordable else Color(0.62, 0.62, 0.7, 1.0)

const RARITY_COLORS := {"common": "#7f8c8d", "rare": "#f39c12", "epic": "#9b59b6", "legendary": "#2ecc71", "champion": "#f1c40f", "hero": "#ffb020"}

# ----------------------------------------------------------------------------- input / drag

func _on_slot_input(ev: InputEvent, idx: int) -> void:
	if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT and ev.pressed and sim.game_over == "":
		drag_idx = idx
		Sfx.play("card_pick")
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
		if chaos_on and sim.game_over == "" and sim.chaos.update_clock():
			paused = true                       # CHAOS pick: the battle freezes until you choose
			chaos_ui.show_offers(sim.chaos.options)
	_update_hud()
	_update_abilities()
	_update_camera(delta)
	if sim.game_over != "" and not over_panel.visible:
		_show_game_over()
	if shot_path != "" and not shot_taken and shot_time >= 0.0 and (sim.now / 1000.0 >= shot_time or over_panel.visible or (chaos_ui != null and chaos_ui.panel != null)):
		_take_screenshot()

func _scan_alerts() -> void:
	for e in sim.fx:
		if e["t"] == "alert":
			alert_lbl.text = e["msg"]
			alert_lbl.modulate.a = 1.0
			Sfx.play("elixir_double" if str(e["msg"]).begins_with("DOUBLE") else "overtime")
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
	for i in 3:
		player_crowns[i].col = Color("f5c518") if i < sim.score[0] else Color(Color("2f7de1"), 0.25)
		player_crowns[i].queue_redraw()
		enemy_crowns[i].col = Color("f5c518") if i < sim.score[1] else Color(Color("e0413a"), 0.25)
		enemy_crowns[i].queue_redraw()
	var el: float = p["elixir"]
	elixir_fill.size.x = 274.0 * el / 10.0
	elixir_lbl.text = str(int(el))
	elixir_fill.color = Color("ee5af2") if sim.is_double else Color("d23be0")
	for i in 4:
		var c: Dictionary = p["hand"][i]
		if drag_idx == i:
			slot_panels[i].modulate = Color(1, 1, 1, 0.35)
			continue
		_fill_card(slot_panels[i], c, c["cost"] <= el)
		_evo_badge(slot_panels[i], c)
		var pg := sim.mech.evolution_progress(0, c)
		if not pg.is_empty() and pg["ready"] and not evo_ready_seen.has(c["id"]):
			evo_ready_seen[c["id"]] = true
			Sfx.play("evolution_ready")
		elif not pg.is_empty() and not pg["ready"]:
			evo_ready_seen.erase(c["id"])
	_fill_card(next_panel, p["next"], true)
	next_panel.modulate.a = 0.75

const ABILITY_NAMES := {"hero_knight": "Taunt", "hero_giant": "Hurl", "hero_mini_pekka": "Breakfast", "hero_musketeer": "Turret", "hero_ice_golem": "Snowstorm", "hero_goblins": "Banner",
	"hero_mega_minion": "Warp", "hero_barbarian_single": "Reroll", "hero_bowler": "Swish", "hero_tombstone": "Revival", "hero_balloon": "Coffin", "hero_dark_prince": "Dismount",
	"hero_valkyrie": "Whirlwind", "hero_berserker": "Savage", "hero_ice_wizard": "Frosty", "hero_wizard": "Flight", "hero_magic_archer": "Triple", "hero_electro_wizard": "Surge",
	"golden_knight": "Dash", "skeleton_king": "Souls", "archer_queen": "Cloak", "monk": "Shield", "mighty_miner": "Escape", "little_prince": "Rescue", "boss_bandit": "Getaway", "goblinstein": "Link"}

func _update_abilities() -> void:
	var seen := {}
	for u in sim.units:
		if u["opp"] or u["hp"] <= 0 or not sim.mech.abilities.has_ability(u):
			continue
		if u.get("isHeroDecoy", false) or u.get("abilityUsed", false):
			continue
		seen[u["id"]] = true
		var btn: AbilityButton = ability_btns.get(u["id"])
		if btn == null:
			btn = AbilityButton.new()
			var icon_path := "res://assets/art/abilities/%s.jpg" % str(u.get("cid", u["id"]))
			var icon: Texture2D = load(icon_path) if ResourceLoader.exists(icon_path) else null
			btn.setup(icon, int(Sim._v(u, "abilityCost", 0)), str(ABILITY_NAMES.get(str(u.get("cid", "")), "")))
			var uid: int = u["id"]
			btn.pressed.connect(func(): sim.request_ability(uid))
			ability_row.add_child(btn)
			ability_btns[u["id"]] = btn
		var cost := int(Sim._v(u, "abilityCost", 0))
		var left := (sim.mech.abilities.ready_at(u) - sim.now) / 1000.0
		btn.set_state(left <= 0.0 and sim.players[0]["elixir"] >= cost, cost)
	for id in ability_btns.keys():
		if not seen.has(id):
			ability_btns[id].queue_free()
			ability_btns.erase(id)

func _update_camera(delta: float) -> void:
	if view.shake > 0.0:
		view.shake = maxf(0.0, view.shake - delta * 2.5)
		var off := Vector3(randf_range(-1, 1), randf_range(-1, 1), 0) * view.shake * 0.35
		cam.transform = Transform3D(cam_base.basis, cam_base.origin + off)
	else:
		cam.transform = cam_base

func _crown_row(count: int, bg: Color, border: Color) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 10)
	for i in 3:
		var slot := UI.panel(bg, 20, border, 2)
		slot.custom_minimum_size = Vector2(60, 40)
		if count >= i + 1:
			var ic := UI.icon("crown", Color("ffd34d"), Vector2(30, 30))
			ic.position = Vector2(15, 5)
			slot.add_child(ic)
		row.add_child(slot)
	return row

func _name_plate(who: String, bg: Color, border: Color) -> Control:
	var p := UI.panel(bg, 5, border, 2)
	p.custom_minimum_size = Vector2(340, 62)
	var v := VBoxContainer.new()
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	var n := _label(who, 20, Color.WHITE, 2)
	n.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var sub := _label("Maestro" if who == "YOU" else "Training Camp", 12, Color(1, 1, 1, 0.8), 0)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(n)
	v.add_child(sub)
	p.add_child(v)
	return p

## Layout follows App.js GameOverScreen: winner block (red), VS, loser block (blue), reward, OK.
func _show_game_over() -> void:
	Sfx.stop_music()
	var res: String = sim.game_over
	var victory := res == "VICTORY"
	Sfx.play("victory" if victory else "defeat")
	over_panel.visible = true
	for c in over_panel.get_children():
		c.queue_free()
	var box := VBoxContainer.new()
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 6)
	over_panel.add_child(box)
	var title := _label("WINNER!" if victory else "DEFEAT", 48, Color.WHITE, 10)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)
	var pc: int = sim.score[0]
	var oc: int = sim.score[1]
	var top_who := "YOU" if victory else "OPPONENT"
	var bot_who := "OPPONENT" if victory else "YOU"
	var win_row := _crown_row(pc if victory else oc, Color("c0392b"), Color("e74c3c"))
	box.add_child(win_row)
	var plate1 := _name_plate(top_who, Color("e74c3c"), Color("c0392b"))
	plate1.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	box.add_child(plate1)
	var vs := _label("VS", 24, Color.WHITE, 4)
	vs.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(vs)
	var plate2 := _name_plate(bot_who, Color("3498db"), Color("2980b9"))
	plate2.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	box.add_child(plate2)
	box.add_child(_crown_row(oc if victory else pc, Color("2980b9"), Color("3498db")))
	if victory:
		var rw := UI.panel(Color("f1c40f"), 10, Color("f39c12"), 3)
		rw.custom_minimum_size = Vector2(240, 84)
		rw.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		var rv := VBoxContainer.new()
		rv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		rv.alignment = BoxContainer.ALIGNMENT_CENTER
		var rl := _label("REWARD", 14, Color("8e44ad"), 0)
		rl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		rv.add_child(rl)
		var rr := HBoxContainer.new()
		rr.alignment = BoxContainer.ALIGNMENT_CENTER
		rr.add_child(UI.icon("trophy", Color("8e44ad"), Vector2(28, 30)))
		rr.add_child(_label(" +30", 26, Color.BLACK, 0))
		rv.add_child(rr)
		rw.add_child(rv)
		var gap := Control.new()
		gap.custom_minimum_size = Vector2(0, 24)
		box.add_child(gap)
		box.add_child(rw)
	var ok := UI.button("OK", Color("2ecc71"), func(): finished.emit(res), Vector2(200, 56), 22)
	ok.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var gap2 := Control.new()
	gap2.custom_minimum_size = Vector2(0, 20)
	box.add_child(gap2)
	box.add_child(ok)

func _take_screenshot() -> void:
	shot_taken = true
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	img.save_png(shot_path)
	print("SCREENSHOT saved ", shot_path, " size=", img.get_size())
	get_tree().quit()
