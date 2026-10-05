extends SceneTree
## Orthographic contact sheet of unit models (3 columns). Run under xvfb:
##   godot --path godot --rendering-driver opengl3 --resolution 900x900 -s tests/model_sheet.gd -- out.png id1,id2,...
func _init() -> void:
	CardDB.ensure()
	var args := OS.get_cmdline_user_args()
	var ids: PackedStringArray = args[1].split(",")
	var sim := Sim.new(CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"]), CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"]))
	var root := Node3D.new()
	get_root().add_child(root)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("8fb3d9")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("fff4e0")
	env.ambient_light_energy = 0.7
	var we := WorldEnvironment.new()
	we.environment = env
	root.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-35), deg_to_rad(20), 0)
	sun.light_energy = 0.9
	root.add_child(sun)
	var n := 0
	for id in ids:
		var c := CardDB.get_card(id)
		var u := sim.make_unit(c, 0, 0, false, "LEFT")
		var m := ModelFactory.build_unit(u)
		m.get_node("Model").position.y = maxf(m.get_node("Model").position.y - 1.2, 0.0)   # drop flyers to the floor row
		m.position = Vector3((n % 3) * 6.0 - 6.0, -(n / 3) * 5.6 + 5.6, 0)
		m.rotation.y = PI + 0.5
		root.add_child(m)
		n += 1
	var cam := Camera3D.new()
	root.add_child(cam)
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = 16.0
	cam.transform = Transform3D(Basis.looking_at(Vector3(0, -0.12, -1), Vector3.UP), Vector3(0, 3.2, 20))
	cam.current = true
	await create_timer(1.0).timeout
	await RenderingServer.frame_post_draw
	get_root().get_viewport().get_texture().get_image().save_png(args[0])
	print("SHEET saved ", args[0])
	quit(0)
