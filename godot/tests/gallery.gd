extends SceneTree
## Renders a close-up row of unit models for visual QA. Run under xvfb:
##   godot --path godot --rendering-driver opengl3 --resolution 780x520 -s tests/gallery.gd -- /tmp/shots/gallery.png
func _init() -> void:
	CardDB.ensure()
	var ids := ["knight", "hog_rider", "wizard", "pekka", "bandit", "battle_ram", "dart_goblin", "electro_wizard", "elixir_golem", "golem", "ice_golem", "ice_spirit", "inferno_tower", "magic_archer", "mother_witch", "princess", "royal_ghost", "skeletons", "sword_goblins", "tesla", "tombstone"]
	var sub := OS.get_cmdline_user_args()[1] if OS.get_cmdline_user_args().size() > 1 else ""
	if sub != "":
		ids = sub.split(",")
	var sim := Sim.new(CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"]), CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"]))
	var root := Node3D.new()
	get_root().add_child(root)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("6fb04a")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("fff4e0")
	env.ambient_light_energy = 0.55
	var we := WorldEnvironment.new()
	we.environment = env
	root.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation = Vector3(deg_to_rad(-55), deg_to_rad(-25), 0)
	sun.light_energy = 0.8
	root.add_child(sun)
	var n := 0
	for id in ids:
		var c := CardDB.get_card(id)
		var u := sim.make_unit(c, 0, 0, false, "LEFT")
		var m := ModelFactory.build_unit(u)
		m.position = Vector3((n % 3) * 5.4 - 5.4, 0, (n / 3) * 5.6 - 3.0)
		m.rotation.y = PI + 0.3
		root.add_child(m)
		n += 1
	var cam := Camera3D.new()
	root.add_child(cam)
	var cpos := Vector3(0, 13.0, 19.0)
	cam.transform = Transform3D(Basis.looking_at(Vector3(0, 0.8, -1.5) - cpos, Vector3.UP), cpos)
	cam.fov = 45
	cam.current = true
	await create_timer(1.0).timeout
	await RenderingServer.frame_post_draw
	var path := OS.get_cmdline_user_args()[0] if OS.get_cmdline_user_args().size() > 0 else "/tmp/shots/gallery.png"
	get_root().get_viewport().get_texture().get_image().save_png(path)
	print("GALLERY saved ", path)
	quit(0)
