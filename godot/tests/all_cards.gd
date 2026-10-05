extends SceneTree
## Smoke test: deploy every card (player side) against an enemy knight/giant/archers and simulate.
## Reports cards whose simulation leaves NaN state or throws. Run:
##   godot --headless --path godot -s tests/all_cards.gd
func _init() -> void:
	CardDB.ensure()
	var deck := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
	var bad: Array = []
	var n := 0
	for c in CardDB.all:
		n += 1
		var sim := Sim.new(deck, deck, "princess", 11)
		sim.ai_enabled = [false, true]
		sim.players[1]["elixir"] = 10.0
		sim.deploy_card(c, 195.0, 600.0, false)
		# opposing units to interact with
		sim.deploy_card(CardDB.get_card("knight"), 150.0, 380.0, true)
		sim.deploy_card(CardDB.get_card("minions"), 240.0, 360.0, true)
		for t in 600:
			sim.step()
			sim.fx.clear()
		var ok := true
		for u in sim.units:
			if is_nan(u["x"]) or is_nan(u["y"]) or is_nan(u["hp"]):
				ok = false
		for t in sim.towers:
			if is_nan(t["hp"]):
				ok = false
		if not ok:
			bad.append(c["id"])
	print("CARDS TESTED: ", n, "  BAD: ", bad)
	quit(0)
