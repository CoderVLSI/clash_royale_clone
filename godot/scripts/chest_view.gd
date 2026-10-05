class_name ChestView
extends SubViewportContainer
## A 3D chest (assets/models/chests/<TYPE>.glb: Body + Lid nodes) in its own SubViewport.
## Static mode renders one frame (cheap, used for lobby slots / shop); live mode idles and can shake + open.

signal opened

const TYPES := ["SILVER", "GOLD", "GIANT", "MAGICAL", "SUPER_MAGICAL", "CROWN"]
static var _scenes: Dictionary = {}

var vp: SubViewport
var pivot: Node3D
var lid: Node3D
var glow: OmniLight3D
var sparks: CPUParticles3D
var live := false
var idle_t := 0.0
var is_open := false
var chest_type := "SILVER"

static func model_key(t: String) -> String:
	return t.replace(" ", "_")

func setup(type: String, px: Vector2, is_live: bool = false) -> void:
	chest_type = model_key(type)
	live = is_live
	stretch = true
	custom_minimum_size = px
	size = px
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	vp = SubViewport.new()
	vp.size = Vector2i(px)
	vp.transparent_bg = true
	vp.own_world_3d = true
	vp.msaa_3d = Viewport.MSAA_2X if live else Viewport.MSAA_DISABLED
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(vp)
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("fff1d8")
	env.ambient_light_energy = 0.55
	var we := WorldEnvironment.new()
	we.environment = env
	vp.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-40), deg_to_rad(-25), 0)
	sun.light_energy = 0.75
	vp.add_child(sun)
	glow = OmniLight3D.new()
	glow.light_color = Color("ffe28a")
	glow.light_energy = 0.0
	glow.omni_range = 6.0
	glow.position = Vector3(0, 1.4, 0)
	vp.add_child(glow)
	pivot = Node3D.new()
	vp.add_child(pivot)
	var path := "res://assets/models/chests/%s.glb" % chest_type
	if not _scenes.has(path):
		_scenes[path] = load(path) if ResourceLoader.exists(path) else null
	var ps: PackedScene = _scenes[path]
	if ps != null:
		var root := ps.instantiate() as Node3D
		pivot.add_child(root)
		lid = root.find_child("Lid", true, false) as Node3D
	pivot.rotation.y = deg_to_rad(-28)
	var cam := Camera3D.new()
	cam.fov = 32.0
	cam.transform = Transform3D(Basis.looking_at(Vector3(0, -0.45, -1.0).normalized() * 0 + (Vector3(0, 1.5, 0) - Vector3(0, 3.4, 7.6)), Vector3.UP), Vector3(0, 3.4, 7.6))
	vp.add_child(cam)
	cam.current = true
	_make_sparks()
	if not live:
		_freeze_soon()

func _make_sparks() -> void:
	sparks = CPUParticles3D.new()
	sparks.emitting = false
	sparks.amount = 60
	sparks.one_shot = true
	sparks.explosiveness = 0.9
	sparks.lifetime = 1.2
	sparks.direction = Vector3(0, 1, 0)
	sparks.spread = 50.0
	sparks.initial_velocity_min = 3.0
	sparks.initial_velocity_max = 6.0
	sparks.gravity = Vector3(0, -6, 0)
	var m := SphereMesh.new()
	m.radius = 0.07
	m.height = 0.14
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("ffe28a")
	mat.emission_enabled = true
	mat.emission = Color("ffd34d")
	mat.emission_energy_multiplier = 2.5
	m.material = mat
	sparks.mesh = m
	sparks.position = Vector3(0, 1.0, 0)
	pivot.add_child(sparks)

func _freeze_soon() -> void:
	if not is_inside_tree():
		await tree_entered
	await get_tree().process_frame
	await get_tree().process_frame
	if is_instance_valid(vp):
		vp.render_target_update_mode = SubViewport.UPDATE_ONCE

func _process(delta: float) -> void:
	if live and not is_open:
		idle_t += delta
		pivot.rotation.y = deg_to_rad(-28) + sin(idle_t * 0.9) * 0.18
		pivot.position.y = sin(idle_t * 1.6) * 0.04

func shake() -> void:
	var tw := create_tween()
	for i in 4:
		tw.tween_property(pivot, "rotation:z", 0.12, 0.05)
		tw.tween_property(pivot, "rotation:z", -0.12, 0.05)
	tw.tween_property(pivot, "rotation:z", 0.0, 0.05)

func open() -> void:
	if is_open or lid == null:
		opened.emit()
		return
	is_open = true
	pivot.rotation.y = deg_to_rad(-12)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(lid, "rotation:x", deg_to_rad(115), 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(glow, "light_energy", 6.0, 0.4)
	sparks.restart()
	sparks.emitting = true
	tw.chain().tween_callback(func(): opened.emit())
