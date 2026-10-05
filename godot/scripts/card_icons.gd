class_name CardIcons
extends Node
## Renders card portraits from the 3D models (SubViewport -> ImageTexture), cached per card.
## texture(card) returns the cached texture or null and queues it; icons appear a few frames later.

signal updated

var vp: SubViewport
var scene_root: Node3D
var cam: Camera3D
var cache: Dictionary = {}
var queue: Array = []
var busy := false
var placeholder_sim: Sim

func _ready() -> void:
	CardDB.ensure()
	vp = SubViewport.new()
	vp.size = Vector2i(160, 160)
	vp.transparent_bg = true
	vp.own_world_3d = true
	vp.render_target_update_mode = SubViewport.UPDATE_DISABLED
	add_child(vp)
	scene_root = Node3D.new()
	vp.add_child(scene_root)
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("fff4e0")
	env.ambient_light_energy = 0.7
	var we := WorldEnvironment.new()
	we.environment = env
	vp.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-40), deg_to_rad(25), 0)
	sun.light_energy = 0.9
	vp.add_child(sun)
	cam = Camera3D.new()
	cam.fov = 30.0
	vp.add_child(cam)
	cam.current = true
	placeholder_sim = Sim.new(CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"]), CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"]))

func texture(card: Dictionary) -> Texture2D:
	var id := str(card["id"])
	if cache.has(id):
		return cache[id]
	if not queue.has(card):
		queue.append(card)
	return null

func _process(_d: float) -> void:
	if busy or queue.is_empty() or vp == null:
		return
	busy = true
	var card: Dictionary = queue.pop_front()
	await _render(card)
	busy = false

func _bounds(n: Node, acc: Array) -> void:
	if n is MeshInstance3D and (n as MeshInstance3D).mesh != null and n.visible:
		var mi := n as MeshInstance3D
		var a := mi.global_transform * mi.get_aabb()
		if acc.is_empty():
			acc.append(a)
		else:
			acc[0] = acc[0].merge(a)
	for c in n.get_children():
		_bounds(c, acc)

func _render(card: Dictionary) -> void:
	for c in scene_root.get_children():
		c.free()
	var models: Array = []
	if str(card.get("type", "")) == "spell":
		var p := ModelFactory.build_projectile({"type": "", "isSpell": true, "card": card})
		p.scale = Vector3.ONE * 2.2
		models.append(p)
	else:
		var n := mini(int(card.get("count", 1)), 3)
		for i in n:
			var u := placeholder_sim.make_unit(card, 0, 0, false, "LEFT")
			var m := ModelFactory.build_unit(u)
			m.get_node("Model").position.y = 0.0 if str(card["type"]) != "flying" else 1.2
			# hide the team ring + status clutter for a clean portrait
			if m.get_child_count() > 1:
				m.get_child(1).visible = false
			m.position = Vector3((i - (n - 1) / 2.0) * 1.1, 0, -float(i % 2) * 0.5)
			m.rotation.y = deg_to_rad(-20)
			models.append(m)
	for m in models:
		scene_root.add_child(m)
	await get_tree().process_frame
	var acc: Array = []
	_bounds(scene_root, acc)
	var box: AABB = acc[0] if not acc.is_empty() else AABB(Vector3(-1, 0, -1), Vector3(2, 2, 2))
	var center := box.get_center()
	var size := maxf(box.size.y * 1.15, box.size.x * 0.9)
	var dist := size / (2.0 * tan(deg_to_rad(cam.fov / 2.0))) + box.size.z * 0.5 + 0.5
	var cpos := center + Vector3(0, size * 0.18, dist)
	cam.transform = Transform3D(Basis.looking_at(center - cpos, Vector3.UP), cpos)
	vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	var img := vp.get_texture().get_image()
	cache[str(card["id"])] = ImageTexture.create_from_image(img)
	updated.emit()
