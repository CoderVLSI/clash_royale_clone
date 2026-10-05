extends SceneTree
## Headless smoke test: AI vs AI for a full match. Run:
##   godot --headless --path godot -s tests/headless_sim.gd -- [seed]
func _init() -> void:
	var args := OS.get_cmdline_user_args()
	var seed_v := int(args[0]) if args.size() > 0 else 1
	var da := ["giant", "prince", "archers", "spear_goblins", "fireball", "zap", "minions", "valkyrie"]
	var db := ["golem", "night_witch", "baby_dragon", "mega_minion", "lightning", "zap", "elite_barbarians", "mini_pekka"]
	var sim := Sim.new(CardDB.deck_by_ids(da), CardDB.deck_by_ids(db), "princess", seed_v)
	sim.ai_enabled = [true, true]
	var ticks := 0
	var max_t := 20000
	while sim.game_over == "" and ticks < max_t:
		sim.step()
		sim.fx.clear()
		ticks += 1
		if ticks % 300 == 0:
			print("t=%ds units=%d proj=%d towers=%s elixir=%.1f/%.1f" % [int(sim.now / 1000), sim.units.size(), sim.projectiles.size(),
				sim.towers.map(func(t): return int(t["hp"])), sim.players[0]["elixir"], sim.players[1]["elixir"]])
	print("RESULT: ", sim.game_over, " ticks=", ticks, " score=", sim.score, " overtime=", sim.is_overtime, " decay=", sim.is_decay)
	quit(0)
