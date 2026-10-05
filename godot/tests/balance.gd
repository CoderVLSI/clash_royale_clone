extends SceneTree
## Side-bias check: identical decks on both sides, AI controlling both. Expect ~50/50.
func _init() -> void:
	var deck := ["giant", "prince", "archers", "spear_goblins", "fireball", "zap", "minions", "valkyrie"]
	var wins := {"VICTORY": 0, "DEFEAT": 0, "DRAW": 0}
	for sd in range(1, 31):
		var sim := Sim.new(CardDB.deck_by_ids(deck), CardDB.deck_by_ids(deck), "princess", sd)
		sim.ai_enabled = [true, true]
		var t := 0
		while sim.game_over == "" and t < 20000:
			sim.step()
			sim.fx.clear()
			t += 1
		wins[sim.game_over] += 1
	print("BALANCE (player-side wins / top-side wins / draws): ", wins)
	quit(0)
