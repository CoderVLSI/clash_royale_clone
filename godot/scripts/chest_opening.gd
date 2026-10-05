class_name ChestOpening
extends Control
## Clash-Royale style chest opening: 3D chest shakes and bursts open, then every reward is revealed one by one
## (card faces with their art + "xN" counts, gold, gems), finishing with a summary and COLLECT.

signal collected

var chest_type := "SILVER"
var rewards: Array = []
var step := "closed"
var idx := -1
var chest: ChestView
var stage: Control
var hint: Label
var counter: Label
var flash: ColorRect
var rays: TextureRect

func setup(type: String, reward_list: Array) -> void:
	chest_type = type
	rewards = reward_list
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var dim := ColorRect.new()
	dim.color = Color(0.02, 0.03, 0.1, 0.985)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	rays = TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.colors = PackedColorArray([Color(1, 0.85, 0.4, 0.5), Color(1, 0.85, 0.4, 0.0)])
	gt.gradient = g
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5)
	gt.fill_to = Vector2(0.5, 0.0)
	gt.width = 256
	gt.height = 256
	rays.texture = gt
	rays.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	rays.position = Vector2(-60, 120)
	rays.size = Vector2(510, 510)
	rays.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rays.modulate.a = 0.0
	add_child(rays)
	var title := UI.label(chest_type.replace("_", " ") + " CHEST", 28, Color("ffe08a"))
	title.position = Vector2(0, 40)
	title.size = Vector2(390, 40)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)
	chest = ChestView.new()
	add_child(chest)
	chest.setup(chest_type, Vector2(380, 340), true)
	chest.position = Vector2(5, 150)
	stage = Control.new()
	stage.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(stage)
	hint = UI.label("TAP TO OPEN!", 30, Color.WHITE)
	hint.position = Vector2(0, 660)
	hint.size = Vector2(390, 44)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(hint)
	var pulse := create_tween().set_loops()
	pulse.tween_property(hint, "modulate:a", 0.35, 0.6)
	pulse.tween_property(hint, "modulate:a", 1.0, 0.6)
	counter = UI.label("", 22, Color.WHITE)
	counter.position = Vector2(300, 90)
	counter.size = Vector2(70, 40)
	counter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(counter)
	flash = ColorRect.new()
	flash.color = Color(1, 1, 1, 0)
	flash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(flash)

func _gui_input(ev: InputEvent) -> void:
	if (ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT) or (ev is InputEventScreenTouch and ev.pressed):
		_tap()

func _process(delta: float) -> void:
	rays.pivot_offset = rays.size / 2.0
	rays.rotation += delta * 0.4

func _tap() -> void:
	match step:
		"closed":
			step = "opening"
			hint.visible = false
			Sfx.play("chest_open")
			chest.shake()
			await get_tree().create_timer(0.55).timeout
			chest.open()
			var f := create_tween()
			f.tween_property(flash, "color:a", 0.85, 0.08)
			f.tween_property(flash, "color:a", 0.0, 0.5)
			create_tween().tween_property(rays, "modulate:a", 1.0, 0.4)
			await get_tree().create_timer(0.9).timeout
			step = "reveal"
			_next_reward()
		"reveal":
			_next_reward()
		"summary":
			pass

func _clear_stage() -> void:
	for c in stage.get_children():
		c.queue_free()

func _next_reward() -> void:
	idx += 1
	_clear_stage()
	if idx >= rewards.size():
		_summary()
		return
	# the chest slides up and shrinks while rewards are shown
	var tw := create_tween().set_parallel(true)
	tw.tween_property(chest, "position", Vector2(125, 70), 0.35)
	tw.tween_property(chest, "scale", Vector2(0.4, 0.4), 0.35)
	counter.text = "%d" % (rewards.size() - idx - 1) if rewards.size() - idx - 1 > 0 else ""
	var r: Dictionary = rewards[idx]
	var holder := Control.new()
	holder.position = Vector2(195, 380)
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage.add_child(holder)
	var name_txt := ""
	if r["type"] == "CARD":
		var card: Dictionary = r["card"]
		var cw := UI.card_widget(card, Vector2(190, 240))
		cw.position = Vector2(-95, -140)
		holder.add_child(cw)
		var cnt := UI.panel(Color("27ae60"), 14, Color("1e8449"), 3)
		cnt.position = Vector2(30, 70)
		cnt.size = Vector2(80, 40)
		var cl := UI.label("x%d" % int(r["value"]), 24)
		cl.position = Vector2(0, 4)
		cl.size = Vector2(80, 32)
		cl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cnt.add_child(cl)
		holder.add_child(cnt)
		name_txt = "%s  (%s)" % [card["name"], str(card.get("rarity", "common")).capitalize()]
	else:
		var kind := "coin" if r["type"] == "GOLD" else "gem"
		var ic := UI.icon(kind, Color.WHITE, Vector2(150, 150))
		ic.position = Vector2(-75, -120)
		holder.add_child(ic)
		var v := UI.label("+%d" % int(r["value"]), 44, Color("ffe08a"))
		v.position = Vector2(-120, 40)
		v.size = Vector2(240, 56)
		v.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		holder.add_child(v)
		name_txt = "Gold" if r["type"] == "GOLD" else "Gems"
	var nl := UI.label(name_txt, 22, Color.WHITE)
	nl.position = Vector2(-150, 130)
	nl.size = Vector2(300, 32)
	nl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	holder.add_child(nl)
	holder.scale = Vector2(0.2, 0.2)
	holder.modulate.a = 0.0
	var pop := create_tween().set_parallel(true)
	pop.tween_property(holder, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	pop.tween_property(holder, "modulate:a", 1.0, 0.15)
	Sfx.play("ui_confirm")
	hint.text = "TAP TO CONTINUE"
	hint.visible = true

func _summary() -> void:
	step = "summary"
	chest.visible = false
	rays.modulate.a = 0.4
	counter.text = ""
	hint.visible = false
	var t := UI.label("REWARDS", 30, Color("ffe08a"))
	t.position = Vector2(0, 100)
	t.size = Vector2(390, 40)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stage.add_child(t)
	var grid := GridContainer.new()
	grid.columns = 3
	grid.position = Vector2(20, 160)
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 14)
	stage.add_child(grid)
	for r in rewards:
		var cell := Control.new()
		cell.custom_minimum_size = Vector2(106, 140)
		if r["type"] == "CARD":
			var cw := UI.card_widget(r["card"], Vector2(100, 128))
			cell.add_child(cw)
			var cl := UI.label("x%d" % int(r["value"]), 16, Color("8bff9a"))
			cl.position = Vector2(54, 106)
			cell.add_child(cl)
		else:
			var kind := "coin" if r["type"] == "GOLD" else "gem"
			var ic := UI.icon(kind, Color.WHITE, Vector2(70, 70))
			ic.position = Vector2(18, 16)
			cell.add_child(ic)
			var vl := UI.label("+%d" % int(r["value"]), 20, Color("ffe08a"))
			vl.position = Vector2(8, 92)
			vl.size = Vector2(90, 28)
			vl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			cell.add_child(vl)
		grid.add_child(cell)
	var btn := UI.button("COLLECT", Color("27ae60"), func(): Sfx.play("coins"); collected.emit(), Vector2(220, 62), 26)
	btn.position = Vector2(85, 700)
	btn.size = Vector2(220, 62)
	stage.add_child(btn)
	btn.mouse_filter = Control.MOUSE_FILTER_STOP
