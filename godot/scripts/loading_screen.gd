class_name LoadingScreen
extends Control
## Splash/loading screen (MainMenu in App.js): logo, random tip, progress bar, then auto-continues.

signal done

const TIPS := [
	"Tip: Destroying enemy towers grants Crowns!",
	"Tip: Join a Clan to request cards and friendly battle!",
	"Tip: Don't spend all your Elixir at once!",
	"Tip: Lure enemy troops to the center to activate your King Tower.",
	"Tip: Use spells to damage multiple units at once.",
	"Tip: Balance your deck with ground and air units.",
]
var progress := 0.0
var fill: ColorRect
var pct: Label

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.colors = PackedColorArray([Color("0f1f4d"), Color("2a63c4"), Color("0b1636")])
	g.offsets = PackedFloat32Array([0.0, 0.5, 1.0])
	gt.gradient = g
	gt.fill_from = Vector2(0.5, 0.0)
	gt.fill_to = Vector2(0.5, 1.0)
	gt.width = 8
	gt.height = 256
	bg.texture = gt
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.stretch_mode = TextureRect.STRETCH_SCALE
	add_child(bg)
	if ResourceLoader.exists("res://assets/art/ui/lobby_bg.jpg"):
		var pic := TextureRect.new()
		pic.texture = load("res://assets/art/ui/lobby_bg.jpg")
		pic.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		add_child(pic)
	# 3D logo crown tower spinning
	var holder := SubViewportContainer.new()
	holder.stretch = true
	holder.position = Vector2(55, 90)
	holder.size = Vector2(280, 260)
	var vp := SubViewport.new()
	vp.own_world_3d = true
	vp.transparent_bg = true
	vp.size = Vector2i(280, 260)
	holder.add_child(vp)
	var w := Node3D.new()
	vp.add_child(w)
	var cam := Camera3D.new()
	w.add_child(cam)
	cam.transform = Transform3D().looking_at(Vector3(0, 3.0, 0) - Vector3(0, 5.5, 11), Vector3.UP)
	cam.position = Vector3(0, 5.5, 11)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-45), deg_to_rad(-35), 0)
	w.add_child(sun)
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color.WHITE
	env.ambient_light_energy = 0.7
	var we := WorldEnvironment.new()
	we.environment = env
	w.add_child(we)
	var tower := ModelFactory.build_tower(true, false)
	tower.scale = Vector3.ONE * 1.1
	w.add_child(tower)
	add_child(holder)
	var tw := create_tween().set_loops()
	tw.tween_property(tower, "rotation:y", TAU, 8.0).from(0.0)
	var clash := UI.label("CLASH", 64, Color("ffe08a"), 12)
	clash.position = Vector2(0, 28)
	clash.size = Vector2(390, 80)
	clash.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(clash)
	var roy := UI.label("ROYALE", 54, Color("ffffff"), 12)
	roy.position = Vector2(0, 340)
	roy.size = Vector2(390, 70)
	roy.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(roy)
	var tip := UI.label(TIPS[randi() % TIPS.size()], 14, Color("d6e4ff"), 3)
	tip.position = Vector2(20, 690)
	tip.size = Vector2(350, 40)
	tip.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tip.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(tip)
	var track := UI.panel(Color(0, 0, 0, 0.6), 8, Color("f5c518"), 2)
	track.position = Vector2(60, 750)
	track.size = Vector2(290, 22)
	add_child(track)
	fill = ColorRect.new()
	fill.color = Color("f5c518")
	fill.position = Vector2(3, 3)
	fill.size = Vector2(0, 16)
	track.add_child(fill)
	pct = UI.label("0%", 16)
	pct.position = Vector2(14, 748)
	add_child(pct)
	var st := UI.label("Updating Arena...", 13, Color("b9d6ff"), 3)
	st.position = Vector2(0, 782)
	st.size = Vector2(390, 20)
	st.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(st)
	var sc := UI.label("SUPERCELL", 12, Color(1, 1, 1, 0.5), 2)
	sc.position = Vector2(0, 810)
	sc.size = Vector2(390, 20)
	sc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(sc)

func _process(delta: float) -> void:
	if progress >= 100.0:
		return
	progress = minf(100.0, progress + delta * 66.0)   # ~1.5 s, same 2%/30ms feel as the original
	fill.size.x = 284.0 * progress / 100.0
	pct.text = "%d%%" % int(progress)
	if progress >= 100.0:
		await get_tree().create_timer(0.4).timeout
		done.emit()
