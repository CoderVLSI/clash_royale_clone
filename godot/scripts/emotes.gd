class_name Emotes
extends Control
## In-battle emotes: the chat button opens a picker; the chosen emote pops up above your king tower as a speech bubble.
## The AI opponent answers sometimes and reacts when towers fall.

const LIST := [["laugh", "Hee hee!"], ["thumb", "Good game"], ["wow", "Wow!"], ["love", "Thanks!"], ["oops", "Oops"], ["cry", "Waaah"], ["angry", "Grrr!"], ["sleepy", "Zzz..."]]
const COOLDOWN := 2.0

var battle: Node
var cam: Camera3D
var sim: Sim
var picker: Control
var cooldown_left := 0.0
var react_t := 0.0
var last_tower_hp := {}
var ai_pending := -1.0

class Face extends Control:
	var kind := "laugh"
	func _draw() -> void:
		var c := size / 2.0
		var r := minf(size.x, size.y) * 0.46
		draw_circle(c, r, Color("ffd23f"))
		draw_arc(c, r, 0, TAU, 32, Color("b8860b"), 2.5)
		var ey := c.y - r * 0.18
		var ex := r * 0.38
		match kind:
			"laugh":
				draw_arc(Vector2(c.x - ex, ey), r * 0.16, PI, TAU, 8, Color("3b2a10"), 3.0)
				draw_arc(Vector2(c.x + ex, ey), r * 0.16, PI, TAU, 8, Color("3b2a10"), 3.0)
				draw_colored_polygon(PackedVector2Array([Vector2(c.x - r * 0.55, c.y + r * 0.12), Vector2(c.x + r * 0.55, c.y + r * 0.12), Vector2(c.x + r * 0.3, c.y + r * 0.62), Vector2(c.x - r * 0.3, c.y + r * 0.62)]), Color("5a1a1a"))
				draw_rect(Rect2(c.x - r * 0.45, c.y + r * 0.12, r * 0.9, r * 0.14), Color.WHITE)
			"thumb":
				draw_arc(Vector2(c.x - ex, ey), r * 0.14, PI, TAU, 8, Color("3b2a10"), 3.0)
				draw_arc(Vector2(c.x + ex, ey), r * 0.14, PI, TAU, 8, Color("3b2a10"), 3.0)
				draw_arc(Vector2(c.x, c.y + r * 0.1), r * 0.5, 0.2, PI - 0.2, 12, Color("3b2a10"), 3.0)
				draw_rect(Rect2(c.x + r * 0.55, c.y + r * 0.1, r * 0.3, r * 0.5), Color("ffb347"))
			"wow":
				draw_circle(Vector2(c.x - ex, ey), r * 0.2, Color.WHITE)
				draw_circle(Vector2(c.x + ex, ey), r * 0.2, Color.WHITE)
				draw_circle(Vector2(c.x - ex, ey), r * 0.09, Color("3b2a10"))
				draw_circle(Vector2(c.x + ex, ey), r * 0.09, Color("3b2a10"))
				draw_circle(Vector2(c.x, c.y + r * 0.42), r * 0.2, Color("5a1a1a"))
			"love":
				for sx in [-1.0, 1.0]:
					draw_circle(Vector2(c.x + sx * ex * 0.7, ey - r * 0.02), r * 0.15, Color("e8336d"))
					draw_circle(Vector2(c.x + sx * ex * 1.3, ey - r * 0.02), r * 0.15, Color("e8336d"))
					draw_colored_polygon(PackedVector2Array([Vector2(c.x + sx * ex * 0.7 - r * 0.28, ey + r * 0.02), Vector2(c.x + sx * ex * 1.3 + r * 0.28, ey + r * 0.02), Vector2(c.x + sx * ex, ey + r * 0.34)]), Color("e8336d")) if false else null
				draw_arc(Vector2(c.x, c.y + r * 0.1), r * 0.5, 0.2, PI - 0.2, 12, Color("3b2a10"), 3.0)
			"oops":
				draw_circle(Vector2(c.x - ex, ey), r * 0.13, Color("3b2a10"))
				draw_circle(Vector2(c.x + ex, ey), r * 0.13, Color("3b2a10"))
				draw_polyline(PackedVector2Array([Vector2(c.x - r * 0.4, c.y + r * 0.45), Vector2(c.x - r * 0.15, c.y + r * 0.35), Vector2(c.x + r * 0.1, c.y + r * 0.5), Vector2(c.x + r * 0.4, c.y + r * 0.38)]), Color("3b2a10"), 3.0)
				draw_circle(Vector2(c.x + r * 0.78, c.y - r * 0.5), r * 0.12, Color("5fb8ff"))
			"cry":
				draw_arc(Vector2(c.x - ex, ey), r * 0.16, PI, TAU, 8, Color("3b2a10"), 3.0)
				draw_arc(Vector2(c.x + ex, ey), r * 0.16, PI, TAU, 8, Color("3b2a10"), 3.0)
				draw_arc(Vector2(c.x, c.y + r * 0.7), r * 0.4, PI + 0.3, TAU - 0.3, 12, Color("3b2a10"), 3.0)
				draw_rect(Rect2(c.x - ex - 3, ey + 4, 6, r * 0.7), Color("5fb8ff"))
				draw_rect(Rect2(c.x + ex - 3, ey + 4, 6, r * 0.7), Color("5fb8ff"))
			"angry":
				draw_circle(Vector2(c.x - ex, ey + 3), r * 0.1, Color("3b2a10"))
				draw_circle(Vector2(c.x + ex, ey + 3), r * 0.1, Color("3b2a10"))
				draw_line(Vector2(c.x - ex - r * 0.25, ey - r * 0.25), Vector2(c.x - ex + r * 0.2, ey - r * 0.05), Color("7a1a1a"), 4.0)
				draw_line(Vector2(c.x + ex + r * 0.25, ey - r * 0.25), Vector2(c.x + ex - r * 0.2, ey - r * 0.05), Color("7a1a1a"), 4.0)
				draw_arc(Vector2(c.x, c.y + r * 0.75), r * 0.4, PI + 0.3, TAU - 0.3, 12, Color("3b2a10"), 3.5)
			"sleepy":
				draw_line(Vector2(c.x - ex - r * 0.2, ey), Vector2(c.x - ex + r * 0.2, ey), Color("3b2a10"), 3.0)
				draw_line(Vector2(c.x + ex - r * 0.2, ey), Vector2(c.x + ex + r * 0.2, ey), Color("3b2a10"), 3.0)
				draw_circle(Vector2(c.x, c.y + r * 0.45), r * 0.12, Color("5a1a1a"))

func setup(b: Node, camera: Camera3D, s: Sim) -> void:
	battle = b
	cam = camera
	sim = s
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _process(delta: float) -> void:
	if sim == null:
		return
	cooldown_left = maxf(0.0, cooldown_left - delta)
	if ai_pending >= 0.0:
		ai_pending -= delta
		if ai_pending < 0.0:
			var kinds := ["wow", "love", "laugh", "oops", "angry", "thumb"]
			show_emote(true, kinds[randi() % kinds.size()])
	react_t += delta
	if react_t >= 0.5:
		react_t = 0.0
		_watch_towers()

func _watch_towers() -> void:
	for t in sim.towers:
		var id := str(t["id"])
		var alive: bool = t["hp"] > 0
		if last_tower_hp.has(id) and last_tower_hp[id] and not alive and t["type"] != "king":
			# a princess tower fell: the side that took it gloats / the loser reacts
			if randf() < 0.6:
				if t["opp"]:
					show_emote(true, ["cry", "angry", "oops"][randi() % 3] if randf() < 0.9 else "sleepy")
				else:
					show_emote(true, ["laugh", "wow"][randi() % 2])
		last_tower_hp[id] = alive

func toggle_picker() -> void:
	if picker != null and is_instance_valid(picker):
		picker.queue_free()
		picker = null
		return
	picker = Control.new()
	picker.mouse_filter = Control.MOUSE_FILTER_STOP
	picker.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	picker.gui_input.connect(func(ev: InputEvent):
		if ev is InputEventMouseButton and ev.pressed:
			toggle_picker())
	add_child(picker)
	var panel := UI.panel(Color(0.08, 0.14, 0.32, 0.97), 16, Color("7fa6ff"), 3)
	panel.position = Vector2(14, 560)
	panel.size = Vector2(362, 128)
	picker.add_child(panel)
	var grid := GridContainer.new()
	grid.columns = 4
	grid.position = Vector2(8, 8)
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 4)
	panel.add_child(grid)
	for e in LIST:
		var cell := Button.new()
		cell.custom_minimum_size = Vector2(84, 54)
		cell.flat = true
		var f := Face.new()
		f.kind = e[0]
		f.position = Vector2(23, 0)
		f.size = Vector2(38, 38)
		f.mouse_filter = Control.MOUSE_FILTER_IGNORE
		cell.add_child(f)
		var l := UI.label(e[1], 11, Color.WHITE, 3)
		l.position = Vector2(0, 38)
		l.size = Vector2(84, 16)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		cell.add_child(l)
		var kind: String = e[0]
		cell.pressed.connect(func():
			toggle_picker()
			if cooldown_left <= 0.0:
				cooldown_left = COOLDOWN
				show_emote(false, kind)
				if randf() < 0.55:
					ai_pending = randf_range(1.0, 2.2))
		grid.add_child(cell)

func show_emote(opp: bool, kind: String) -> void:
	var label := "Hee hee!"
	for e in LIST:
		if e[0] == kind:
			label = e[1]
	Sfx.play("ui_confirm", -4.0)
	var wpos := ArenaView.to3(195.0, 80.0 if opp else 764.0, 5.2)
	var sp := cam.unproject_position(wpos)
	var b := Control.new()
	b.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var bg := UI.panel(Color.WHITE if not opp else Color("fff0f0"), 16, Color("3a3a50"), 3)
	bg.size = Vector2(112, 68)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(bg)
	var f := Face.new()
	f.kind = kind
	f.position = Vector2(34, 2)
	f.size = Vector2(44, 44)
	f.mouse_filter = Control.MOUSE_FILTER_IGNORE
	b.add_child(f)
	var l := UI.label(label, 13, Color("2a2a40"), 0)
	l.position = Vector2(0, 46)
	l.size = Vector2(112, 20)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	b.add_child(l)
	b.position = sp - Vector2(56, 100 if not opp else 20)
	b.pivot_offset = Vector2(56, 34)
	b.scale = Vector2(0.2, 0.2)
	add_child(b)
	var tw := create_tween()
	tw.tween_property(b, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(1.9)
	tw.tween_property(b, "modulate:a", 0.0, 0.3)
	tw.tween_callback(b.queue_free)
