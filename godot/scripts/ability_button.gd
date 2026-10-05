class_name AbilityButton
extends Control
## Round hero / champion ability button: generated icon in a gold ring, elixir cost drop, ready pulse.

signal pressed

var tex: Texture2D
var cost := 1
var enabled := true
var ready_t := 0.0
var drop: Texture2D
var caption := ""

func setup(icon: Texture2D, c: int, name_txt: String) -> void:
	tex = icon
	cost = c
	caption = name_txt
	custom_minimum_size = Vector2(76, 84)
	size = Vector2(76, 84)
	drop = UI.ui_tex("drop")
	mouse_filter = Control.MOUSE_FILTER_STOP

func set_state(can_use: bool, c: int) -> void:
	if can_use != enabled or c != cost:
		enabled = can_use
		cost = c
		queue_redraw()

func _process(delta: float) -> void:
	if enabled:
		ready_t += delta
		queue_redraw()

func _gui_input(ev: InputEvent) -> void:
	if enabled and ((ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT) or (ev is InputEventScreenTouch and ev.pressed)):
		pressed.emit()

func _circle(center: Vector2, r: float, uv_r: float = 0.0) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in 40:
		var a := TAU * i / 40.0
		pts.append(center + Vector2(cos(a), sin(a)) * r)
	return pts

func _draw() -> void:
	var c := Vector2(38, 36)
	var r := 31.0
	var pulse := 0.5 + 0.5 * sin(ready_t * 6.0)
	if enabled:
		draw_circle(c, r + 5.0 + pulse * 3.0, Color(1.0, 0.85, 0.3, 0.25 + 0.25 * pulse))
	draw_circle(c, r + 2.5, Color("f5c518") if enabled else Color("6b6b78"))
	var pts := _circle(c, r)
	if tex != null:
		var uvs := PackedVector2Array()
		for p in pts:
			uvs.append(Vector2(0.5, 0.5) + (p - c) / r * 0.47)
		draw_colored_polygon(pts, Color.WHITE if enabled else Color(0.45, 0.45, 0.5), uvs, tex)
	else:
		draw_colored_polygon(pts, Color("8e44ad") if enabled else Color("40304a"))
	# elixir cost drop
	var dp := Vector2(58, 60)
	if drop != null:
		draw_texture_rect(drop, Rect2(dp - Vector2(15, 18), Vector2(30, 36)), false, Color.WHITE if enabled else Color(0.6, 0.6, 0.6))
	else:
		draw_circle(dp, 13, Color("c43bd9"))
	var font := ThemeDB.fallback_font
	draw_string(font, dp + Vector2(-5, 8), str(cost), HORIZONTAL_ALIGNMENT_CENTER, 12, 20, Color.WHITE)
	draw_string_outline(font, dp + Vector2(-5, 8), str(cost), HORIZONTAL_ALIGNMENT_CENTER, 12, 20, 4, Color(0, 0, 0, 0.8))
	draw_string(font, dp + Vector2(-5, 8), str(cost), HORIZONTAL_ALIGNMENT_CENTER, 12, 20, Color.WHITE)
	if caption != "":
		draw_string_outline(font, Vector2(0, 80), caption, HORIZONTAL_ALIGNMENT_CENTER, 76, 11, 4, Color(0, 0, 0, 0.9))
		draw_string(font, Vector2(0, 80), caption, HORIZONTAL_ALIGNMENT_CENTER, 76, 11, Color.WHITE)
