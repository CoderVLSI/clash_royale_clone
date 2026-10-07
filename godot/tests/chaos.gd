extends SceneTree
## Plays AI-vs-AI chaos matches (random picks for both sides) and applies every modifier / power once.
func _init() -> void:
	CardDB.ensure()
	var bad: Array = []
	for seed_i in 3:
		var deck := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
		var deck2 := CardDB.deck_by_ids(["pekka", "hog_rider", "musketeer", "baby_dragon", "fireball", "mini_pekka", "goblin_barrel", "bomber"])
		var sim := Sim.new(deck, deck2)
		sim.ai_enabled = [true, true]
		sim.make_decks_private()
		sim.chaos = Chaos.new(sim)
		sim.chaos.next_at = 8.0
		var guard := 0
		while sim.game_over == "" and guard < 3000:
			sim.step()
			guard += 1
			if sim.chaos.update_clock():
				var offers: Array = sim.chaos.options
				var o: Dictionary = offers[randi() % offers.size()]
				sim.chaos.choose(0, o)
				sim.chaos.waiting = false
				for pid in sim.chaos.powers[0].duplicate():
					sim.chaos.use_power(0, pid)
		print("MATCH ", seed_i, " ticks=", guard, " picks=", sim.chaos.picks, " mods=", sim.chaos.upgraded)
	# every modifier on a fitting card
	for id in Chaos.MODS:
		var found := false
		for c in CardDB.all:
			if not c.get("isToken", false) and Chaos.eligible(c, id):
				print("MOD ", id, " on ", c["id"])
				var cc: Dictionary = c.duplicate(true)
				Chaos.apply(cc, id)
				var d2 := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
				var sim2 := Sim.new(d2, d2)
				sim2.make_decks_private()
				sim2.chaos = Chaos.new(sim2)
				var u := sim2.make_unit(cc, 195, 500, false, "LEFT") if cc["type"] != "spell" else {}
				if not u.is_empty():
					sim2.units.append(u)
					for i in 200:
						sim2.step()
				found = true
				break
		if not found:
			bad.append(id + ":no-card")
	for pid in Chaos.POWERS:
		var d3 := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
		var sim3 := Sim.new(d3, d3)
		sim3.chaos = Chaos.new(sim3)
		sim3.units.append(sim3.make_unit(CardDB.get_card("knight"), 195, 300, true, "LEFT"))
		sim3.chaos.powers[0].append(pid)
		if not sim3.chaos.use_power(0, pid):
			bad.append(pid + ":power")
		for i in 40:
			sim3.step()
	print("CHAOS BAD: ", bad)
	quit(0)
