class_name ChaosUI
extends Control
## The "choose your chaos" overlay (pauses the battle) plus the small CHAOS countdown label.

signal picked(offer: Dictionary)

var panel: Control
var label: Label
var chaos: Chaos

func setup(c: Chaos) -> void:
	chaos = c
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	label = UI.label("", 14, Color("e0b3ff"), 4)
	label.position = Vector2(135, 70)
	label.size = Vector2(120, 20)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(label)

func _process(_d: float) -> void:
	if chaos == null or label == null:
		return
	var left := maxf(0.0, chaos.next_at - chaos.elapsed)
	if int(chaos.picks[0]) >= Chaos.MAX_PICKS:
		label.text = "CHAOS MAXED"
	else:
		label.text = "CHAOS %ds  %d/%d" % [int(ceil(left)), int(chaos.picks[0]), Chaos.MAX_PICKS]

func show_offers(offers: Array) -> void:
	if panel != null:
		panel.queue_free()
	panel = Control.new()
	panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(panel)
	var dim := ColorRect.new()
	dim.color = Color(0.06, 0.02, 0.14, 0.9)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	panel.add_child(dim)
	var title := UI.label("CHAOS!", 44, Color("e0b3ff"), 8)
	title.position = Vector2(0, 30)
	title.size = Vector2(390, 56)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(title)
	var tier := chaos.tier_for(int(chaos.picks[0]))
	var sub := UI.label("Pick one modifier  -  %s tier" % tier.capitalize(), 18, Color("ffe08a"), 4)
	sub.position = Vector2(0, 88)
	sub.size = Vector2(390, 26)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	panel.add_child(sub)
	var y := 130.0
	for o in offers:
		panel.add_child(_offer_row(o, y))
		y += 200.0

func _offer_row(o: Dictionary, y: float) -> Control:
	var col: Color = {"common": Color("7f8c8d"), "rare": Color("f39c12"), "epic": Color("9b59b6")}[str(o["tier"])]
	var btn := Button.new()
	btn.position = Vector2(20, y)
	btn.size = Vector2(350, 184)
	btn.add_theme_stylebox_override("normal", UI.style(Color(0.12, 0.1, 0.25, 0.95), 16, col, 4))
	btn.add_theme_stylebox_override("hover", UI.style(Color(0.2, 0.16, 0.4, 0.98), 16, col.lightened(0.3), 4))
	btn.add_theme_stylebox_override("pressed", UI.style(Color(0.07, 0.06, 0.18), 16, col, 4))
	btn.pressed.connect(func(): picked.emit(o))
	var card: Dictionary = CardDB.get_card(str(o["card"]))
	var cw := UI.card_widget(card, Vector2(110, 140))
	cw.position = Vector2(20, 22)
	cw.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(cw)
	var chip := UI.label("%s  -  %s" % [str(card.get("name", "")).to_upper(), str(o["tier"]).to_upper()], 12, col.lightened(0.4), 3)
	chip.position = Vector2(145, 10)
	chip.size = Vector2(195, 18)
	chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(chip)
	var nm := UI.label(str(o["name"]), 24, Color.WHITE, 4)
	nm.position = Vector2(145, 30)
	nm.size = Vector2(195, 34)
	nm.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(nm)
	var ds := UI.label(_wrap(str(o["desc"]), 24), 15, Color("d7dff5"), 0)
	ds.position = Vector2(145, 70)
	ds.size = Vector2(195, 106)
	ds.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ds.custom_minimum_size = Vector2(190, 0)
	ds.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(ds)
	return btn

func close() -> void:
	if panel != null:
		panel.queue_free()
		panel = null

static func _wrap(t: String, width: int) -> String:
	var out := ""
	var line := ""
	for w in t.split(" "):
		if line.length() + w.length() + 1 > width and line != "":
			out += line + "\n"
			line = w
		else:
			line = w if line == "" else line + " " + w
	return out + line
