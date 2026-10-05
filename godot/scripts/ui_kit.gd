class_name UI
extends RefCounted
## Small UI helper kit shared by the lobby and battle HUD (code-built Controls, no emoji glyphs so it
## renders identically on Android).

const RARITY := {"common": "#7f8c8d", "rare": "#f39c12", "epic": "#9b59b6", "legendary": "#2ecc71", "champion": "#f1c40f", "hero": "#00bcd4"}

static func rarity_color(r: String) -> Color:
	return Color(str(RARITY.get(r, "#7f8c8d")))

static func style(bg: Color, radius: int = 12, border: Color = Color(0, 0, 0, 0), bw: int = 0) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(radius)
	if bw > 0:
		sb.set_border_width_all(bw)
		sb.border_color = border
	return sb

static func label(text: String, size: int = 16, color: Color = Color.WHITE, outline: int = 5) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	if outline > 0:
		l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.9))
		l.add_theme_constant_override("outline_size", outline)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

static func panel(bg: Color, radius: int = 12, border: Color = Color(0, 0, 0, 0), bw: int = 0) -> Panel:
	var p := Panel.new()
	p.add_theme_stylebox_override("panel", style(bg, radius, border, bw))
	return p

static func button(text: String, bg: Color, cb: Callable, size: Vector2 = Vector2(120, 44), fsize: int = 18) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = size
	b.add_theme_font_size_override("font_size", fsize)
	b.add_theme_color_override("font_color", Color.WHITE)
	b.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	b.add_theme_constant_override("outline_size", 4)
	b.add_theme_stylebox_override("normal", style(bg, 12, bg.lightened(0.35), 2))
	b.add_theme_stylebox_override("hover", style(bg.lightened(0.1), 12, bg.lightened(0.45), 2))
	b.add_theme_stylebox_override("pressed", style(bg.darkened(0.2), 12, bg.lightened(0.2), 2))
	b.add_theme_stylebox_override("disabled", style(bg.darkened(0.5), 12))
	b.pressed.connect(cb)
	return b

static func vbox(sep: int = 8) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", sep)
	return v

static func hbox(sep: int = 8) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", sep)
	return h

static func scroll(content: Control) -> ScrollContainer:
	var s := ScrollContainer.new()
	s.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	s.size_flags_vertical = Control.SIZE_EXPAND_FILL
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.add_child(content)
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return s

static func ui_tex(name: String) -> Texture2D:
	var path := "res://assets/art/ui/%s.png" % name
	return load(path) if ResourceLoader.exists(path) else null

static func clear(node: Node) -> void:
	for c in node.get_children():
		node.remove_child(c)
		c.queue_free()

# --- drawn icons -------------------------------------------------------------------------
class Icon extends Control:
	var kind := "crown"
	var col := Color("f5c518")
	var tex: Texture2D
	func _draw() -> void:
		var s := size
		if tex != null:
			# Blender-rendered icon (assets/art/ui/<kind>.png); the colour's alpha dims it (crown counters)
			draw_texture_rect(tex, Rect2(Vector2.ZERO, s), false, Color(1, 1, 1, col.a))
			return
		match kind:
			"crown":
				var pts := PackedVector2Array([Vector2(s.x * 0.08, s.y * 0.85), Vector2(s.x * 0.04, s.y * 0.25), Vector2(s.x * 0.3, s.y * 0.55), Vector2(s.x * 0.5, s.y * 0.1),
					Vector2(s.x * 0.7, s.y * 0.55), Vector2(s.x * 0.96, s.y * 0.25), Vector2(s.x * 0.92, s.y * 0.85)])
				draw_colored_polygon(pts, col)
				draw_polyline(pts + PackedVector2Array([pts[0]]), col.darkened(0.5), 2.0)
			"drop":
				var c := Vector2(s.x * 0.5, s.y * 0.64)
				draw_circle(c, s.x * 0.34, col)
				draw_colored_polygon(PackedVector2Array([Vector2(s.x * 0.5, s.y * 0.04), Vector2(s.x * 0.17, s.y * 0.55), Vector2(s.x * 0.83, s.y * 0.55)]), col)
			"coin":
				draw_circle(s / 2.0, s.x * 0.45, col)
				draw_circle(s / 2.0, s.x * 0.32, col.darkened(0.2))
			"gem":
				draw_colored_polygon(PackedVector2Array([Vector2(s.x * 0.5, s.y * 0.95), Vector2(s.x * 0.05, s.y * 0.35), Vector2(s.x * 0.25, s.y * 0.08), Vector2(s.x * 0.75, s.y * 0.08), Vector2(s.x * 0.95, s.y * 0.35)]), col)
			"trophy":
				draw_rect(Rect2(s.x * 0.25, s.y * 0.05, s.x * 0.5, s.y * 0.5), col)
				draw_rect(Rect2(s.x * 0.45, s.y * 0.55, s.x * 0.1, s.y * 0.25), col.darkened(0.2))
				draw_rect(Rect2(s.x * 0.3, s.y * 0.8, s.x * 0.4, s.y * 0.12), col.darkened(0.3))
			"chest":
				draw_rect(Rect2(s.x * 0.08, s.y * 0.4, s.x * 0.84, s.y * 0.5), col.darkened(0.2))
				draw_rect(Rect2(s.x * 0.08, s.y * 0.2, s.x * 0.84, s.y * 0.28), col)
				draw_rect(Rect2(s.x * 0.44, s.y * 0.38, s.x * 0.12, s.y * 0.2), Color("f5c518"))

static func icon(kind: String, color: Color, size: Vector2 = Vector2(24, 24)) -> Icon:
	var i := Icon.new()
	i.kind = kind
	i.col = color
	var path := "res://assets/art/ui/%s.png" % kind
	if ResourceLoader.exists(path):
		i.tex = load(path)
	i.custom_minimum_size = size
	i.size = size
	i.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	i.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	i.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return i

# --- shaped (hexagon / shield) frame for legendary, champion and hero cards ---------------
class HexFrame extends Control:
	var col := Color("f1c40f")
	var tex: Texture2D
	var dark := Color("2a2f45")
	static func shape(sz: Vector2, inset: float) -> PackedVector2Array:
		var w := sz.x
		var h := sz.y
		var i := inset
		return PackedVector2Array([Vector2(i, h * 0.15 + i * 0.5), Vector2(w * 0.5, i), Vector2(w - i, h * 0.15 + i * 0.5),
			Vector2(w - i, h * 0.9 - i * 0.3), Vector2(w * 0.88 - i * 0.3, h - i), Vector2(w * 0.12 + i * 0.3, h - i), Vector2(i, h * 0.9 - i * 0.3)])
	func _draw() -> void:
		draw_colored_polygon(shape(size, 0.0), col)
		var inner := shape(size, 3.5)
		if tex != null:
			var ts := tex.get_size()
			var box := Rect2(Vector2(3, 3), size - Vector2(6, 6))
			var sc := maxf(box.size.x / ts.x, box.size.y / ts.y)
			var crop := box.size / sc
			var off := (ts - crop) * 0.5
			var uvs := PackedVector2Array()
			for pt in inner:
				uvs.append((off + (pt - box.position) / sc) / ts)
			draw_colored_polygon(inner, Color.WHITE, uvs, tex)
		else:
			draw_colored_polygon(inner, dark)
		# gem on the top apex
		var c := Vector2(size.x * 0.5, 1.0)
		draw_colored_polygon(PackedVector2Array([c + Vector2(0, -3), c + Vector2(7, 4), c + Vector2(0, 11), c + Vector2(-7, 4)]), col.lightened(0.35))
		draw_polyline(PackedVector2Array([c + Vector2(0, -3), c + Vector2(7, 4), c + Vector2(0, 11), c + Vector2(-7, 4), c + Vector2(0, -3)]), col.darkened(0.45), 1.5)

static func is_shaped(card: Dictionary) -> bool:
	return str(card.get("rarity", "common")) in ["legendary", "champion", "hero"]

# --- card widgets ------------------------------------------------------------------------
static func card_widget(card: Dictionary, size: Vector2 = Vector2(72, 92), dim: bool = false) -> Control:
	var p := Panel.new()
	p.custom_minimum_size = size
	p.size = size
	var shaped := is_shaped(card)
	var art := CardArt.texture(card)
	if shaped:
		p.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
		var hf := HexFrame.new()
		hf.col = Color(rarity_color(str(card.get("rarity", "common"))))
		hf.tex = art
		hf.size = size
		hf.mouse_filter = Control.MOUSE_FILTER_IGNORE
		p.add_child(hf)
	else:
		p.add_theme_stylebox_override("panel", style(Color("353b52"), 10, rarity_color(str(card.get("rarity", "common"))), 3))
	if art != null:
		if not shaped:
			var tr := TextureRect.new()
			tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
			tr.texture = art
			tr.position = Vector2(3, 3)
			tr.size = size - Vector2(6, 6)
			tr.mouse_filter = Control.MOUSE_FILTER_IGNORE
			p.add_child(tr)
		var shade := ColorRect.new()
		shade.color = Color(0, 0, 0, 0.45)
		var sh_in := 10.0 if shaped else 3.0
		shade.position = Vector2(sh_in, size.y - 28 - (3.0 if shaped else 0.0))
		shade.size = Vector2(size.x - sh_in * 2.0, 25)
		shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
		p.add_child(shade)
		if (card.get("evolution", false) or card.get("rarity", "") == "hero") and not shaped:
			var tint := ColorRect.new()
			tint.color = Color(Color(str(card.get("evolutionAuraColor", "#00bcd4"))), 0.22)
			tint.position = Vector2(3, 3)
			tint.size = size - Vector2(6, 6)
			tint.mouse_filter = Control.MOUSE_FILTER_IGNORE
			p.add_child(tint)
	elif CardIcons.inst != null:
		# no generated portrait yet: show a live render of the card's 3D model
		var fb := TextureRect.new()
		fb.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		fb.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		fb.position = Vector2(3, 3)
		fb.size = Vector2(size.x - 6, size.y - 22)
		fb.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var tex := CardIcons.inst.texture(card)
		if tex != null:
			fb.texture = tex
		else:
			CardIcons.waiting.append([fb, card])
		p.add_child(fb)
	else:
		var sw := ColorRect.new()
		sw.color = Color(str(card.get("color", "#888888")))
		sw.position = Vector2(size.x * 0.18, size.y * 0.1)
		sw.size = Vector2(size.x * 0.64, size.y * 0.5)
		sw.mouse_filter = Control.MOUSE_FILTER_IGNORE
		p.add_child(sw)
	var tlabel := label(str(card.get("name", "?")), 11 if size.x < 80 else 13, Color.WHITE, 4)
	tlabel.position = Vector2(2, size.y - 26)
	tlabel.size = Vector2(size.x - 4, 22)
	tlabel.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tlabel.clip_text = true
	p.add_child(tlabel)
	var cb := panel(Color("c43bd9"), 14, Color("f3c6ff"), 2)
	cb.position = Vector2(-5, -6)
	cb.size = Vector2(28, 28)
	cb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(cb)
	var cl := label(str(int(card.get("cost", 0))), 16, Color.WHITE, 4)
	cl.position = Vector2(0, 1)
	cl.size = Vector2(28, 26)
	cl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cb.add_child(cl)
	if dim:
		p.modulate = Color(0.55, 0.55, 0.6)
	return p
