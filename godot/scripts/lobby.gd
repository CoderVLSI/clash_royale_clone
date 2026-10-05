class_name Lobby
extends Control
## Lobby: Shop / Decks / Battle / Social / Events tabs, header, chest slots and modals.
## Ported from the MainLobby / DeckTab / BattleTab / ShopTab / SocialTab / EventsTab / ChestOpeningModal /
## FriendlyBattleModal / HamburgerMenu components in App.js.

signal start_battle
signal start_friendly

const TABS := ["Shop", "Decks", "Battle", "Social", "Events"]
const TOWERS := [
	{"id": "princess", "name": "Princess Tower", "desc": "Fires arrows"},
	{"id": "dagger_duchess", "name": "Dagger Duchess", "desc": "Fast daggers, 8 ammo"},
	{"id": "royal_chef", "name": "Royal Chef", "desc": "Melee, cooks pancakes"},
	{"id": "cannoneer", "name": "Cannoneer", "desc": "Splash bombs"},
]

var save: SaveData
var tab := 2
var _coll_gen := 0
var content: Control
var nav_buttons: Array = []
var modal_layer: Control
var header_gold: Label
var header_gems: Label
# deck tab state
var filter_rarity := "all"
var sort_cost := false
var search_text := ""
var chat: Array = [
	{"user": "KingSlayer", "text": "Good game everyone!", "role": "Elder", "time": "2h ago"},
	{"user": "PrincessLover", "text": "Can someone donate Wizards?", "role": "Member", "time": "1h ago"},
	{"user": "System", "text": "Trainer Cheddar joined the clan.", "role": "System", "time": "30m ago"},
]

func setup(s: SaveData) -> void:
	save = s
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_build_shell()
	_show_tab(2)

# ----------------------------------------------------------------------------- shell

func _build_shell() -> void:
	var art_bg := load("res://assets/art/ui/lobby_bg.jpg") if ResourceLoader.exists("res://assets/art/ui/lobby_bg.jpg") else null
	if art_bg != null:
		var pic := TextureRect.new()
		pic.texture = art_bg
		pic.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		pic.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(pic)
		var veil := ColorRect.new()
		veil.color = Color(0.03, 0.05, 0.16, 0.38)
		veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		veil.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(veil)
	var bg := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.colors = PackedColorArray([Color("1a3a7a"), Color("2b5fb8"), Color("163066")])
	g.offsets = PackedFloat32Array([0.0, 0.45, 1.0])
	gt.gradient = g
	gt.fill_from = Vector2(0.5, 0.0)
	gt.fill_to = Vector2(0.5, 1.0)
	gt.width = 8
	gt.height = 256
	bg.texture = gt
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.stretch_mode = TextureRect.STRETCH_SCALE
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if art_bg == null:
		add_child(bg)
	var col := VBoxContainer.new()
	col.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	col.add_theme_constant_override("separation", 0)
	add_child(col)
	col.add_child(_build_header())
	content = Control.new()
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.clip_contents = true
	col.add_child(content)
	col.add_child(_build_nav())
	modal_layer = Control.new()
	modal_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(modal_layer)

func _build_header() -> Control:
	var p := PanelContainer.new()
	p.custom_minimum_size = Vector2(0, 64)
	p.add_theme_stylebox_override("panel", UI.style(Color(0.04, 0.08, 0.2, 0.9), 0))
	var row := UI.hbox(6)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	p.add_child(row)
	var menu := UI.button("=", Color("34495e"), _open_menu, Vector2(40, 40), 22)
	row.add_child(menu)
	var lvl := UI.panel(Color("2e86de"), 8, Color("f5c518"), 2)
	lvl.custom_minimum_size = Vector2(40, 40)
	var lv := UI.label("13", 22)
	lv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	lv.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lv.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lvl.add_child(lv)
	row.add_child(lvl)
	var ident := UI.vbox(2)
	ident.add_child(UI.label("You", 16))
	var xp := UI.panel(Color(0, 0, 0, 0.5), 4)
	xp.custom_minimum_size = Vector2(70, 8)
	var xf := UI.panel(Color("6bff9a"), 4)
	xf.size = Vector2(46, 8)
	xp.add_child(xf)
	ident.add_child(xp)
	row.add_child(ident)
	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(sp)
	row.add_child(_currency("coin", Color("f5c518"), "gold"))
	row.add_child(_currency("gem", Color("48dbfb"), "gems"))
	return p

func _currency(kind: String, color: Color, field: String) -> Control:
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", UI.style(Color(0, 0, 0, 0.45), 10))
	pc.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var h := UI.hbox(3)
	pc.add_child(h)
	h.add_child(UI.icon(kind, color, Vector2(18, 18)))
	var l := UI.label(str(save.get(field)), 13)
	h.add_child(l)
	if field == "gold":
		header_gold = l
	else:
		header_gems = l
	return pc

func _refresh_header() -> void:
	header_gold.text = str(save.gold)
	header_gems.text = str(save.gems)

func _build_nav() -> Control:
	var p := PanelContainer.new()
	p.custom_minimum_size = Vector2(0, 72)
	p.add_theme_stylebox_override("panel", UI.style(Color(0.05, 0.08, 0.18, 0.96), 0))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 0)
	p.add_child(row)
	nav_buttons = []
	for i in TABS.size():
		var b := Button.new()
		b.text = TABS[i]
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.add_theme_font_size_override("font_size", 13)
		var ic := UI.ui_tex(["shop", "decks", "battle", "social", "events"][i])
		if ic != null:
			b.icon = ic
			b.expand_icon = true
			b.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
			b.vertical_icon_alignment = VERTICAL_ALIGNMENT_TOP
			b.add_theme_constant_override("icon_max_width", 34)
			b.add_theme_constant_override("h_separation", 0)
		b.pressed.connect(_show_tab.bind(i))
		row.add_child(b)
		nav_buttons.append(b)
	return p

func _style_nav() -> void:
	for i in nav_buttons.size():
		var b: Button = nav_buttons[i]
		var active := i == tab
		b.add_theme_stylebox_override("normal", UI.style(Color("2e86de") if active else Color(0, 0, 0, 0), 0))
		b.add_theme_stylebox_override("hover", UI.style(Color("2e86de") if active else Color(1, 1, 1, 0.08), 0))
		b.add_theme_stylebox_override("pressed", UI.style(Color("1b5fa8"), 0))
		b.add_theme_color_override("font_color", Color.WHITE if active else Color("9bb2d6"))
		b.add_theme_color_override("font_hover_color", Color.WHITE)
		b.add_theme_color_override("font_pressed_color", Color.WHITE)

func _show_tab(i: int) -> void:
	var _t0 := Time.get_ticks_msec()
	tab = i
	_style_nav()
	UI.clear(content)
	var view: Control
	match i:
		0: view = _build_shop()
		1: view = _build_decks()
		2: view = _build_battle()
		3: view = _build_social()
		_: view = _build_events()
	view.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	content.add_child(view)
	_refresh_header()
	if OS.get_cmdline_user_args().has("--prof"):
		print("TAB ", i, " built in ", Time.get_ticks_msec() - _t0, " ms")

# ----------------------------------------------------------------------------- BATTLE tab

func _build_battle() -> Control:
	var root := UI.vbox(10)
	root.add_theme_constant_override("separation", 10)
	var margin := MarginContainer.new()
	for k in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, 12)
	margin.add_child(root)
	# crown chest bar
	var bar := PanelContainer.new()
	bar.add_theme_stylebox_override("panel", UI.style(Color(0, 0, 0, 0.4), 14))
	var br := UI.hbox(10)
	bar.add_child(br)
	br.add_child(UI.icon("crown", Color("f5c518"), Vector2(30, 26)))
	var track := UI.panel(Color(0, 0, 0, 0.55), 6)
	track.custom_minimum_size = Vector2(0, 14)
	track.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	br.add_child(track)
	var fill := UI.panel(Color("f5c518"), 6)
	fill.size = Vector2(170, 14)
	track.add_child(fill)
	br.add_child(UI.label("6/10", 14))
	var cb := ChestView.new()
	br.add_child(cb)
	cb.setup("CROWN", Vector2(44, 36))
	root.add_child(bar)
	# arena title + trophy road
	var title := UI.label("ARENA 11", 28, Color("ffe08a"))
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(title)
	var sub := UI.label("Electro Valley", 15, Color("b9d6ff"))
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(sub)
	var road := PanelContainer.new()
	road.add_theme_stylebox_override("panel", UI.style(Color(0, 0, 0, 0.35), 10))
	var rr := UI.hbox(8)
	road.add_child(rr)
	var rt := UI.panel(Color(0, 0, 0, 0.55), 6)
	rt.custom_minimum_size = Vector2(0, 14)
	rt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rr.add_child(rt)
	var rf := UI.panel(Color("2ecc71"), 6)
	rf.size = Vector2(230, 14)
	rt.add_child(rf)
	rr.add_child(UI.icon("trophy", Color("f5c518"), Vector2(22, 22)))
	rr.add_child(UI.label(str(save.trophies), 16))
	root.add_child(road)
	# 3D arena diorama
	root.add_child(_arena_preview())
	# actions
	var act := UI.hbox(12)
	act.alignment = BoxContainer.ALIGNMENT_CENTER
	act.add_child(UI.button("Friend", Color("2e86de"), func(): _open_friendly(), Vector2(76, 64), 15))
	var battle := UI.button("BATTLE", Color("f39c12"), func(): start_battle.emit(), Vector2(190, 74), 34)
	act.add_child(battle)
	act.add_child(UI.button("2v2", Color("2e86de"), func(): _toast("2v2 mode is not available yet"), Vector2(76, 64), 15))
	root.add_child(act)
	# chests
	root.add_child(_chest_slots())
	return margin

func _arena_preview() -> Control:
	var holder := SubViewportContainer.new()
	holder.stretch = true
	holder.custom_minimum_size = Vector2(0, 190)
	holder.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var vp := SubViewport.new()
	vp.own_world_3d = true
	vp.transparent_bg = true
	vp.size = Vector2i(366, 190)
	holder.add_child(vp)
	var world := Node3D.new()
	vp.add_child(world)
	var cam := Camera3D.new()
	cam.fov = 40.0
	world.add_child(cam)
	cam.transform = Transform3D().looking_at(Vector3(0, 1.2, 0) - Vector3(0, 9.0, 13.5), Vector3.UP)
	cam.position = Vector3(0, 9.0, 13.5)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-50), deg_to_rad(-30), 0)
	sun.light_energy = 0.9
	world.add_child(sun)
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("fff4e0")
	env.ambient_light_energy = 0.6
	var we := WorldEnvironment.new()
	we.environment = env
	world.add_child(we)
	var spin := Node3D.new()
	world.add_child(spin)
	spin.add_child(ModelFactory.box(Vector3(14, 0.8, 11), Color("7cc04f"), Vector3(0, -0.4, 0)))
	spin.add_child(ModelFactory.box(Vector3(14, 0.1, 2.2), Color("3aa0e8"), Vector3(0, 0.02, 0)))
	spin.add_child(ModelFactory.box(Vector3(2.4, 0.2, 2.6), Color("a9784a"), Vector3(-3.5, 0.12, 0)))
	var k := ModelFactory.build_tower(true, false)
	k.position = Vector3(0, 0, 3.6)
	k.scale = Vector3.ONE * 0.8
	spin.add_child(k)
	for sx in [-4.5, 4.5]:
		var t := ModelFactory.build_tower(false, false, save.tower)
		t.position = Vector3(sx, 0, 2.4)
		t.scale = Vector3.ONE * 0.75
		spin.add_child(t)
		var te := ModelFactory.build_tower(false, true)
		te.position = Vector3(sx, 0, -3.4)
		te.scale = Vector3.ONE * 0.75
		spin.add_child(te)
	var ek := ModelFactory.build_tower(true, true)
	ek.position = Vector3(0, 0, -4.6)
	ek.scale = Vector3.ONE * 0.8
	spin.add_child(ek)
	holder.tree_entered.connect(func():
		var tw := create_tween().set_loops()
		tw.tween_property(spin, "rotation:y", deg_to_rad(14), 5.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		tw.tween_property(spin, "rotation:y", deg_to_rad(-14), 5.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT))
	return holder

func _chest_color(t: String) -> Color:
	match t:
		"SILVER": return Color("bdc3c7")
		"GOLD": return Color("f1c40f")
		"GIANT": return Color("e67e22")
		"MAGICAL": return Color("9b59b6")
		"SUPER MAGICAL": return Color("3498db")
	return Color("bdc3c7")

func _chest_slots() -> Control:
	var box := UI.vbox(4)
	var t := UI.label("CHESTS", 14, Color("b9d6ff"))
	box.add_child(t)
	var row := UI.hbox(6)
	box.add_child(row)
	for i in 4:
		var chest: Variant = null
		for c in save.chests:
			if int(c["slot"]) == i:
				chest = c
		var slot := Button.new()
		slot.custom_minimum_size = Vector2(0, 92)
		slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		slot.add_theme_font_size_override("font_size", 12)
		if chest == null:
			slot.text = "Empty Slot"
			slot.disabled = true
			slot.add_theme_stylebox_override("disabled", UI.style(Color(0, 0, 0, 0.35), 10, Color(1, 1, 1, 0.12), 2))
		else:
			var cc := _chest_color(str(chest["type"]))
			slot.text = "\n\n\n%s" % str(chest["type"]).substr(0, 5)
			slot.add_theme_font_size_override("font_size", 11)
			slot.add_theme_color_override("font_color", cc)
			var cv := ChestView.new()
			slot.add_child(cv)
			cv.setup(str(chest["type"]), Vector2(84, 62))
			cv.position = Vector2(2, 2)
			slot.add_theme_stylebox_override("normal", UI.style(Color(0.08, 0.1, 0.2, 0.9), 10, cc, 2))
			slot.add_theme_stylebox_override("hover", UI.style(Color(0.12, 0.15, 0.28, 0.95), 10, cc, 2))
			slot.add_theme_stylebox_override("pressed", UI.style(Color(0.05, 0.07, 0.15), 10, cc, 2))
			slot.pressed.connect(_open_chest.bind(chest))
		row.add_child(slot)
	return box

# ----------------------------------------------------------------------------- DECKS tab

func _deck_cards() -> Array:
	return CardDB.deck_by_ids(save.current_deck_ids())

func _build_decks() -> Control:
	var margin := MarginContainer.new()
	for k in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, 10)
	var root := UI.vbox(8)
	margin.add_child(root)
	# header: title + deck dots
	var top := UI.hbox(8)
	top.add_child(UI.label("Battle Deck", 22))
	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(sp)
	for i in save.decks.size():
		var d := UI.button(str(i + 1), Color("f5c518") if i == save.selected_deck else Color("34495e"), _select_deck.bind(i), Vector2(34, 34), 15)
		top.add_child(d)
	root.add_child(top)
	var cards := _deck_cards()
	# 8 deck slots (2 rows of 4)
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	for i in cards.size():
		var c: Dictionary = cards[i]
		var holder := Control.new()
		holder.custom_minimum_size = Vector2(80, 98)
		var w := UI.card_widget(c, Vector2(78, 96))
		holder.add_child(w)
		var hit := Button.new()
		hit.flat = true
		hit.size = Vector2(78, 96)
		hit.pressed.connect(_deck_card_tap.bind(i))
		holder.add_child(hit)
		# evolution / hero badges
		if _is_evo_slot(c["id"]):
			var pb := Panel.new()
			pb.size = Vector2(78, 96)
			pb.mouse_filter = Control.MOUSE_FILTER_IGNORE
			pb.add_theme_stylebox_override("panel", UI.style(Color(0, 0, 0, 0), 10, Color("c04dff"), 5))
			holder.add_child(pb)
			var b := UI.label("EVO", 11, Color("e0b3ff"))
			b.position = Vector2(46, 2)
			holder.add_child(b)
		if save.hero_slots[save.selected_deck] == c["id"]:
			var hb := UI.label("HERO", 11, Color("6ee7ff"))
			hb.position = Vector2(40, 2)
			holder.add_child(hb)
		grid.add_child(holder)
	root.add_child(grid)
	# avg elixir + tower
	var info := UI.hbox(10)
	var avg := 0.0
	for c in cards:
		avg += float(c["cost"])
	info.add_child(UI.icon("drop", Color("c43bd9"), Vector2(18, 22)))
	info.add_child(UI.label("Avg. Elixir: %.1f" % (avg / maxf(1.0, cards.size())), 15))
	var sp2 := Control.new()
	sp2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_child(sp2)
	var tname := "Princess Tower"
	for t in TOWERS:
		if t["id"] == save.tower:
			tname = t["name"]
	info.add_child(UI.button(tname + " v", Color("2e86de"), _open_tower_select, Vector2(0, 36), 13))
	root.add_child(info)
	# evolution + hero slots
	var slots := UI.hbox(10)
	slots.add_child(UI.label("EVO", 13, Color("e0b3ff")))
	for si in 2:
		slots.add_child(_slot_button(save.evo_slots[save.selected_deck][si], func(): _open_evo_select(si), "evo"))
	slots.add_child(UI.label("HERO", 13, Color("6ee7ff")))
	slots.add_child(_slot_button(save.hero_slots[save.selected_deck], func(): _open_hero_select(), "hero"))
	var sp3 := Control.new()
	sp3.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slots.add_child(sp3)
	slots.add_child(UI.button("Randomize", Color("8e44ad"), _randomize_deck, Vector2(0, 40), 13))
	root.add_child(slots)
	# collection controls
	var ctl := UI.hbox(6)
	ctl.add_child(UI.label("Collection", 16))
	var search := LineEdit.new()
	search.placeholder_text = "Search"
	search.text = search_text
	search.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	search.text_changed.connect(func(t: String): search_text = t; _refresh_collection())
	ctl.add_child(search)
	ctl.add_child(UI.button("Sort: " + ("Cost" if sort_cost else "-"), Color("34495e"), func(): sort_cost = not sort_cost; _show_tab(1), Vector2(0, 38), 12))
	root.add_child(ctl)
	var rar := UI.hbox(4)
	for r in ["all", "common", "rare", "epic", "legendary", "champion", "hero"]:
		var rb := UI.button(r.substr(0, 4).capitalize() if r != "all" else "All", Color("f5c518") if filter_rarity == r else Color("34495e"), func(): filter_rarity = r; _show_tab(1), Vector2(0, 30), 11)
		rb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		rar.add_child(rb)
	root.add_child(rar)
	var coll := GridContainer.new()
	coll.name = "Collection"
	coll.columns = 4
	coll.add_theme_constant_override("h_separation", 8)
	coll.add_theme_constant_override("v_separation", 12)
	var sc := UI.scroll(coll)
	root.add_child(sc)
	_fill_collection(coll)
	return margin

func _refresh_collection() -> void:
	var coll := content.find_child("Collection", true, false)
	if coll:
		UI.clear(coll)
		_fill_collection(coll)

func _fill_collection(coll: Node) -> void:
	var list: Array = CardDB.all.filter(func(c): return not c.get("isToken", false))
	if filter_rarity != "all":
		list = list.filter(func(c): return str(c.get("rarity", "common")) == filter_rarity)
	if search_text != "":
		list = list.filter(func(c): return str(c["name"]).to_lower().contains(search_text.to_lower()))
	if sort_cost:
		list.sort_custom(func(a, b): return a["cost"] < b["cost"])
	var deck_ids := save.current_deck_ids()
	_coll_gen += 1
	var gen := _coll_gen
	var n := 0
	for c in list:
		# build a few widgets per frame so switching to the Decks tab never freezes the game
		n += 1
		if n % 8 == 0:
			await get_tree().process_frame
		if gen != _coll_gen or not is_instance_valid(coll):
			return
		var holder := Control.new()
		holder.custom_minimum_size = Vector2(80, 98)
		var w := UI.card_widget(c, Vector2(78, 96), c["id"] in deck_ids)
		holder.add_child(w)
		var hit := Button.new()
		hit.flat = true
		hit.size = Vector2(78, 96)
		hit.pressed.connect(_collection_card_tap.bind(c))
		holder.add_child(hit)
		coll.add_child(holder)

func _slot_button(id: String, cb: Callable, kind: String) -> Control:
	var card := CardDB.get_card(id) if id != "" else {}
	var b := Button.new()
	b.custom_minimum_size = Vector2(54, 40)
	b.add_theme_font_size_override("font_size", 11)
	var col := Color("9b59b6") if kind == "evo" else Color("00bcd4")
	if card.is_empty():
		b.text = "+"
		b.add_theme_stylebox_override("normal", UI.style(Color(0, 0, 0, 0.4), 8, col, 2))
	else:
		b.text = str(card["name"]).substr(0, 7)
		b.add_theme_stylebox_override("normal", UI.style(col.darkened(0.4), 8, col, 2))
	b.pressed.connect(cb)
	return b

func _is_evo_slot(id: String) -> bool:
	return id in save.evo_slots[save.selected_deck]

func _select_deck(i: int) -> void:
	save.selected_deck = i
	save.save_file()
	_show_tab(1)

func _randomize_deck() -> void:
	var pool: Array = CardDB.all.filter(func(c): return not c.get("isToken", false))
	pool.shuffle()
	var ids: Array = []
	for c in pool.slice(0, 8):
		ids.append(c["id"])
	save.decks[save.selected_deck] = ids
	save.evo_slots[save.selected_deck] = ["", ""]
	save.hero_slots[save.selected_deck] = ""
	save.save_file()
	_show_tab(1)

func _card_info_text(c: Dictionary) -> String:
	var lines: Array = []
	lines.append("%s %s" % [str(c.get("rarity", "")).to_upper(), str(c.get("type", "")).to_upper()])
	for k in [["hp", "HP"], ["damage", "Damage"], ["range", "Range"], ["speed", "Speed"], ["attackSpeed", "Attack speed"], ["radius", "Radius"], ["count", "Count"], ["lifetime", "Lifetime"]]:
		if c.get(k[0]) != null:
			lines.append("%s: %s" % [k[1], str(c[k[0]])])
	return "\n".join(lines)

func _open_card_detail(c: Dictionary, swap_idx: int = -1) -> void:
	var d := CardDetail.new()
	d.setup(c, c["id"] in save.current_deck_ids())
	modal_layer.mouse_filter = Control.MOUSE_FILTER_PASS
	modal_layer.add_child(d)
	var shut := func():
		if is_instance_valid(d):
			d.queue_free()
		modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	d.closed.connect(shut)
	d.use_pressed.connect(func(mode: String):
		shut.call()
		if mode != "card":
			_use_variant(c, mode)
		elif swap_idx >= 0:
			_open_slot_swap(swap_idx)
		else:
			_open_add_to_slot(c))

func _use_variant(c: Dictionary, mode: String) -> void:
	if not (c["id"] in save.current_deck_ids()):
		_toast("Add %s to your deck first" % c["name"])
		return
	if mode == "evo":
		var slots: Array = save.evo_slots[save.selected_deck]
		if c["id"] in slots:
			_toast("%s already has an evolution slot" % c["name"])
			return
		var free := slots.find("")
		slots[free if free >= 0 else 0] = c["id"]
		_toast("%s evolution slotted" % c["name"])
	else:
		save.hero_slots[save.selected_deck] = c["id"]
		_toast("%s hero slotted" % c["name"])
	save.save_file()
	_show_tab(1)

func _deck_card_tap(idx: int) -> void:
	var c: Dictionary = _deck_cards()[idx]
	_open_card_detail(c, idx)

func _collection_card_tap(c: Dictionary) -> void:
	_open_card_detail(c)

func _open_add_to_slot(card: Dictionary) -> void:
	var m := _modal("Replace which card with %s?" % card["name"])
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	m["body"].add_child(grid)
	var cards := _deck_cards()
	for i in cards.size():
		var holder := Control.new()
		holder.custom_minimum_size = Vector2(72, 92)
		holder.add_child(UI.card_widget(cards[i], Vector2(70, 90)))
		var hit := Button.new()
		hit.flat = true
		hit.size = Vector2(70, 90)
		hit.pressed.connect(func(): _swap_into_slot(i, card["id"]); _close_modal(m))
		holder.add_child(hit)
		grid.add_child(holder)

func _open_slot_swap(idx: int) -> void:
	var m := _modal("Swap with which card?")
	var coll := GridContainer.new()
	coll.columns = 4
	coll.add_theme_constant_override("h_separation", 6)
	coll.add_theme_constant_override("v_separation", 8)
	var sc := UI.scroll(coll)
	sc.custom_minimum_size = Vector2(0, 380)
	m["body"].add_child(sc)
	var ids := save.current_deck_ids()
	for c in CardDB.all.filter(func(x): return not x.get("isToken", false) and not (x["id"] in ids)):
		var holder := Control.new()
		holder.custom_minimum_size = Vector2(72, 92)
		holder.add_child(UI.card_widget(c, Vector2(70, 90)))
		var hit := Button.new()
		hit.flat = true
		hit.size = Vector2(70, 90)
		hit.pressed.connect(func(): _swap_into_slot(idx, c["id"]); _close_modal(m))
		holder.add_child(hit)
		coll.add_child(holder)

func _swap_into_slot(idx: int, new_id: String) -> void:
	var old: String = save.decks[save.selected_deck][idx]
	save.decks[save.selected_deck][idx] = new_id
	var evo: Array = save.evo_slots[save.selected_deck]
	for i in evo.size():
		if evo[i] == old:
			evo[i] = ""
	if save.hero_slots[save.selected_deck] == old:
		save.hero_slots[save.selected_deck] = ""
	save.save_file()
	_show_tab(1)

func _open_tower_select() -> void:
	var m := _modal("Choose Tower Troop")
	for t in TOWERS:
		var tid: String = t["id"]
		var b := UI.button("%s   %s%s" % [t["name"], t["desc"], "   [selected]" if tid == save.tower else ""], Color("2e86de") if tid != save.tower else Color("27ae60"),
			func(): save.tower = tid; save.save_file(); _close_modal(m); _show_tab(1), Vector2(0, 46), 13)
		m["body"].add_child(b)

func _open_evo_select(slot: int) -> void:
	var m := _modal("Evolution slot %d" % (slot + 1))
	var options := _deck_cards().filter(func(c): return c.get("evolvesTo") != null)
	if options.is_empty():
		m["body"].add_child(UI.label("No cards in this deck can evolve.", 14))
	for c in options:
		m["body"].add_child(UI.button("%s  ->  %s" % [c["name"], str(c["evolvesTo"]).replace("_", " ")], Color("8e44ad"),
			func(): save.evo_slots[save.selected_deck][slot] = c["id"]; save.save_file(); _close_modal(m); _show_tab(1), Vector2(0, 44), 13))
	m["body"].add_child(UI.button("Clear slot", Color("c0392b"), func(): save.evo_slots[save.selected_deck][slot] = ""; save.save_file(); _close_modal(m); _show_tab(1), Vector2(0, 40), 13))

func _open_hero_select() -> void:
	var m := _modal("Hero slot")
	var options := _deck_cards().filter(func(c): return c.get("heroVariantId") != null)
	if options.is_empty():
		m["body"].add_child(UI.label("No hero cards in this deck.", 14))
	for c in options:
		m["body"].add_child(UI.button("%s  ->  hero" % c["name"], Color("00838f"),
			func(): save.hero_slots[save.selected_deck] = c["id"]; save.save_file(); _close_modal(m); _show_tab(1), Vector2(0, 44), 13))
	m["body"].add_child(UI.button("Clear slot", Color("c0392b"), func(): save.hero_slots[save.selected_deck] = ""; save.save_file(); _close_modal(m); _show_tab(1), Vector2(0, 40), 13))

# ----------------------------------------------------------------------------- SHOP tab

func _build_shop() -> Control:
	var margin := MarginContainer.new()
	for k in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, 10)
	var root := UI.vbox(10)
	var sc := UI.scroll(root)
	margin.add_child(sc)
	var offer := PanelContainer.new()
	offer.add_theme_stylebox_override("panel", UI.style(Color("8e44ad"), 16, Color("f5c518"), 3))
	var ov := UI.vbox(6)
	offer.add_child(ov)
	ov.add_child(UI.label("BEST VALUE!", 13, Color("ffe08a")))
	ov.add_child(UI.label("SUPER MAGICAL BUNDLE", 22))
	var icons := UI.hbox(14)
	icons.add_child(UI.icon("chest", Color("c39b4a"), Vector2(42, 42)))
	icons.add_child(UI.icon("coin", Color("f5c518"), Vector2(42, 42)))
	icons.add_child(UI.icon("gem", Color("48dbfb"), Vector2(42, 42)))
	ov.add_child(icons)
	ov.add_child(UI.button("$9.99", Color("27ae60"), func(): _toast("Purchases are disabled in this build"), Vector2(140, 44), 20))
	root.add_child(offer)
	var head := UI.hbox(8)
	head.add_child(UI.label("DAILY DEALS", 18))
	head.add_child(UI.label("4h 20m", 14, Color("b9d6ff")))
	root.add_child(head)
	var deals := [
		["knight", 50, 500, "GOLD"], ["musketeer", 20, 1000, "GOLD"], ["baby_dragon", 2, 2000, "GOLD"],
		["archers", 50, 0, "FREE"], ["hog_rider", 20, 1000, "GOLD"], ["witch", 2, 100, "GEM"],
	]
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	root.add_child(grid)
	for d in deals:
		var card := CardDB.get_card(str(d[0]))
		var box := UI.vbox(4)
		var pc := PanelContainer.new()
		pc.add_theme_stylebox_override("panel", UI.style(Color(0, 0, 0, 0.4), 12, UI.rarity_color(str(card.get("rarity", "common"))), 2))
		pc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		pc.add_child(box)
		box.add_child(UI.label("FREE" if d[3] == "FREE" else "x%d" % d[1], 14, Color("ffe08a")))
		box.add_child(UI.card_widget(card, Vector2(78, 90)))
		var price := ("CLAIM" if d[3] == "FREE" else "%d %s" % [d[2], "G" if d[3] == "GOLD" else "gems"])
		box.add_child(UI.button(price, Color("27ae60") if d[3] == "FREE" else Color("2e86de"), _buy.bind(d), Vector2(0, 34), 12))
		grid.add_child(pc)
	root.add_child(UI.label("CHESTS", 18))
	var ch := UI.hbox(8)
	for entry in [["Silver Chest", "SILVER", 100], ["Golden Chest", "GOLD", 500], ["Magical Chest", "MAGICAL", 1500]]:
		var pc2 := PanelContainer.new()
		pc2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		pc2.add_theme_stylebox_override("panel", UI.style(Color(0, 0, 0, 0.4), 12, _chest_color(entry[1]), 2))
		var bx := UI.vbox(4)
		pc2.add_child(bx)
		var cv2 := ChestView.new()
		bx.add_child(cv2)
		cv2.setup(str(entry[1]), Vector2(64, 50))
		bx.add_child(UI.label(entry[0], 12))
		bx.add_child(UI.button("%d gems" % (entry[2] / 20), Color("2e86de"), _buy_chest.bind(entry), Vector2(0, 32), 12))
		ch.add_child(pc2)
	root.add_child(ch)
	return margin

func _buy(d: Array) -> void:
	if d[3] == "FREE":
		_toast("Claimed %d x %s" % [d[1], CardDB.get_card(str(d[0]))["name"]])
		return
	if d[3] == "GOLD":
		if save.gold < d[2]:
			_toast("Not enough gold")
			return
		save.gold -= d[2]
	else:
		if save.gems < d[2]:
			_toast("Not enough gems")
			return
		save.gems -= d[2]
	save.save_file()
	_refresh_header()
	_toast("Bought %d x %s" % [d[1], CardDB.get_card(str(d[0]))["name"]])

func _buy_chest(entry: Array) -> void:
	var price: int = int(entry[2] / 20)
	if save.gems < price:
		_toast("Not enough gems")
		return
	var used := {}
	for c in save.chests:
		used[int(c["slot"])] = true
	for i in 4:
		if not used.has(i):
			save.gems -= price
			save.chests.append({"id": "chest_%d" % Time.get_ticks_msec(), "slot": i, "type": entry[1]})
			save.save_file()
			_refresh_header()
			_toast("Chest added to slot %d" % (i + 1))
			return
	_toast("All chest slots are full")

# ----------------------------------------------------------------------------- SOCIAL / EVENTS

func _build_social() -> Control:
	var margin := MarginContainer.new()
	for k in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, 10)
	var root := UI.vbox(8)
	margin.add_child(root)
	root.add_child(UI.label("Clan Chat", 22))
	var box := UI.vbox(8)
	var sc := UI.scroll(box)
	root.add_child(sc)
	for m in chat:
		if m["role"] == "System":
			var s := UI.label(str(m["text"]), 13, Color("b9d6ff"), 2)
			s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			box.add_child(s)
		else:
			var me: bool = m["user"] == "You"
			var pc := PanelContainer.new()
			pc.add_theme_stylebox_override("panel", UI.style(Color("2e86de") if me else Color(0, 0, 0, 0.4), 12))
			var v := UI.vbox(2)
			pc.add_child(v)
			if not me:
				v.add_child(UI.label(str(m["user"]), 13, Color("f1c40f") if m["role"] == "Elder" else Color("5dade2"), 2))
			v.add_child(UI.label(str(m["text"]), 15, Color.WHITE, 0))
			v.add_child(UI.label(str(m["time"]), 10, Color("b9d6ff"), 0))
			pc.size_flags_horizontal = Control.SIZE_SHRINK_END if me else Control.SIZE_SHRINK_BEGIN
			box.add_child(pc)
	var row := UI.hbox(6)
	var le := LineEdit.new()
	le.placeholder_text = "Type a message..."
	le.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(le)
	var send := func():
		if le.text.strip_edges() != "":
			chat.append({"user": "You", "text": le.text, "role": "Leader", "time": "Just now"})
			_show_tab(3)
	le.text_submitted.connect(func(_t: String): send.call())
	row.add_child(UI.button("Send", Color("2e86de"), send, Vector2(80, 40), 15))
	root.add_child(row)
	return margin

func _build_events() -> Control:
	var margin := MarginContainer.new()
	for k in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, 10)
	var root := UI.vbox(12)
	margin.add_child(UI.scroll(root))
	root.add_child(_event_card(Color("8e44ad"), "CHALLENGE", "MEGA KNIGHT CHALLENGE", "Win to unlock the Mega Knight!", "1000 gold   x10 cards   Free", "JOIN NOW"))
	root.add_child(_event_card(Color("2980b9"), "TOURNAMENT", "GLOBAL TOURNAMENT", "Competing for the top spot!", "Wins: 0     Losses: 0/3", "ENTER"))
	return margin

func _event_card(col: Color, badge: String, title: String, sub: String, stats: String, btn: String) -> Control:
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", UI.style(col, 18, col.lightened(0.4), 3))
	var v := UI.vbox(8)
	pc.add_child(v)
	v.add_child(UI.label(badge, 12, Color("ffe08a")))
	v.add_child(UI.label(title, 22))
	v.add_child(UI.label(sub, 14, Color("e8eefc"), 2))
	v.add_child(UI.label(stats, 14, Color("ffe08a"), 2))
	v.add_child(UI.button(btn, Color("f39c12"), func(): start_battle.emit(), Vector2(0, 46), 20))
	return pc

# ----------------------------------------------------------------------------- modals

func _modal(title: String) -> Dictionary:
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.62)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	modal_layer.add_child(dim)
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", UI.style(Color("1d2b4a"), 20, Color("f5c518"), 3))
	pc.set_anchors_preset(Control.PRESET_CENTER)
	pc.custom_minimum_size = Vector2(340, 0)
	dim.add_child(pc)
	var body := UI.vbox(10)
	pc.add_child(body)
	var t := UI.label(title, 20)
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	t.custom_minimum_size = Vector2(300, 0)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.add_child(t)
	pc.position = Vector2(25, 120)
	return {"dim": dim, "body": body, "panel": pc}

func _close_modal(m: Dictionary) -> void:
	if is_instance_valid(m["dim"]):
		m["dim"].queue_free()
	# the layer must not swallow taps once no modal is open (it used to block the nav bar)
	modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE

func _toast(msg: String) -> void:
	var l := UI.label(msg, 16)
	l.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	l.position = Vector2(30, 690)
	l.size = Vector2(330, 30)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	modal_layer.add_child(l)
	var tw := create_tween()
	tw.tween_interval(1.4)
	tw.tween_property(l, "modulate:a", 0.0, 0.5)
	tw.tween_callback(l.queue_free)

func _open_menu() -> void:
	var m := _modal("Menu")
	for entry in ["Profile", "Inventory", "Achievements", "Leaderboard"]:
		m["body"].add_child(UI.button(entry, Color("2e86de"), func(): _toast(entry + " is coming soon"), Vector2(0, 42), 16))
	m["body"].add_child(UI.button("Low performance mode: " + ("ON" if save.low_perf else "OFF"), Color("8e44ad"),
		func(): save.low_perf = not save.low_perf; save.save_file(); _close_modal(m); _open_menu(), Vector2(0, 42), 14))
	m["body"].add_child(UI.button("Sound: " + ("ON" if save.sound else "OFF"), Color("16a085"),
		func(): save.sound = not save.sound; save.save_file(); Sfx.set_enabled(save.sound); _close_modal(m); _open_menu(), Vector2(0, 42), 14))
	m["body"].add_child(UI.button("Close", Color("7f8c8d"), func(): _close_modal(m), Vector2(0, 40), 16))

func _open_friendly() -> void:
	var m := _modal("FRIENDLY BATTLE")
	var code := "%04d" % (randi() % 10000)
	var status := UI.label("Create a room or join a friend's room code.", 14, Color("b9d6ff"), 2)
	status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status.custom_minimum_size = Vector2(300, 0)
	m["body"].add_child(status)
	m["body"].add_child(UI.button("CREATE ROOM", Color("27ae60"), func():
		status.text = "Share this code with your friend:  %s\nWaiting for opponent..." % code
		get_tree().create_timer(2.0).timeout.connect(func():
			if is_instance_valid(m["dim"]):
				_close_modal(m)
				start_friendly.emit()), Vector2(0, 46), 18))
	var le := LineEdit.new()
	le.placeholder_text = "Room code"
	m["body"].add_child(le)
	m["body"].add_child(UI.button("JOIN BATTLE", Color("2e86de"), func():
		if le.text.strip_edges().length() < 4:
			status.text = "Enter a 4-digit room code."
		else:
			_close_modal(m)
			start_friendly.emit(), Vector2(0, 46), 18))
	m["body"].add_child(UI.button("Cancel", Color("7f8c8d"), func(): _close_modal(m), Vector2(0, 40), 16))

# --- chest opening -------------------------------------------------------------------------

func _open_chest(chest: Dictionary) -> void:
	var rewards := _gen_rewards(str(chest["type"]))
	var ov := ChestOpening.new()
	ov.setup(str(chest["type"]), rewards)
	modal_layer.mouse_filter = Control.MOUSE_FILTER_PASS
	modal_layer.add_child(ov)
	ov.collected.connect(func():
		for r in rewards:
			if r["type"] == "GOLD":
				save.gold += int(r["value"])
			elif r["type"] == "GEM":
				save.gems += int(r["value"])
		save.chests = save.chests.filter(func(c): return c["id"] != chest["id"])
		save.save_file()
		ov.queue_free()
		modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_show_tab(tab))

func _gen_rewards(type: String) -> Array:
	var gold := 100
	var gems := 0
	var total := 10
	match type:
		"SILVER": gold = 50; total = 5
		"GOLD": gold = 200; gems = 2; total = 15
		"GIANT": gold = 1000; total = 50
		"MAGICAL": gold = 500; gems = 10; total = 20
		"SUPER MAGICAL": gold = 5000; gems = 50; total = 100
	var out: Array = []
	if gold > 0:
		out.append({"type": "GOLD", "value": gold, "label": "Gold"})
	if gems > 0:
		out.append({"type": "GEM", "value": gems, "label": "Gems"})
	var pick := func(rarity: String, count: int):
		if count <= 0:
			return
		var pool: Array = CardDB.all.filter(func(c): return not c.get("isToken", false) and str(c.get("rarity", "")) == rarity)
		if pool.size() > 0:
			var c: Dictionary = pool[randi() % pool.size()]
			out.append({"type": "CARD", "value": count, "label": str(c["name"]), "card": c})
	match type:
		"SILVER": pick.call("common", total)
		"GOLD":
			pick.call("common", total - 3)
			pick.call("rare", 3)
		"GIANT":
			pick.call("common", int(total * 0.8))
			pick.call("rare", int(total * 0.2))
		"MAGICAL":
			pick.call("common", total - 6)
			pick.call("rare", 4)
			pick.call("epic", 2)
		"SUPER MAGICAL":
			pick.call("common", 60)
			pick.call("rare", 25)
			pick.call("epic", 10)
			pick.call("legendary", 5)
		_: pick.call("common", total)
	return out
