extends SceneTree
## Chaos v2 test: every modifier of every card is applied to a private copy of its card, deployed/cast in a live sim against a dummy enemy
## and stepped for a few seconds; plus full AI-vs-AI chaos matches. Prints "CHAOS BAD:" with anything that errored or did nothing.
func _init() -> void:
	CardDB.ensure()
	Chaos.ensure()
	var bad: Array = []
	var base_ids: Array = []
	for c in CardDB.all:
		if c.get("isToken", false) or c.get("isMirror", false) or str(c["id"]).begins_with("hero_") or str(c["id"]).begins_with("evolved_"):
			continue
		if not (c["id"] in base_ids):
			base_ids.append(c["id"])
	for id in base_ids:
		if not Chaos.DATA.has(id) or Chaos.DATA[id].size() != 3:
			bad.append(id + ":no-mods")
	print("cards with mods: ", Chaos.DATA.size(), " / ", base_ids.size())
	var spawned_total := 0
	for id in Chaos.DATA:
		for m in Chaos.DATA[id]:
			var deck := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
			var deck2 := CardDB.deck_by_ids(["pekka", "hog_rider", "musketeer", "baby_dragon", "fireball", "mini_pekka", "goblin_barrel", "bomber"])
			var sim := Sim.new(deck, deck2, "princess", 7)
			sim.make_decks_private()
			sim.chaos = Chaos.new(sim)
			var card: Dictionary = CardDB.get_card(id).duplicate(true)
			var before: Dictionary = card.duplicate(true)
			Chaos.apply(card, m)
			if card.hash() == before.hash():
				bad.append("%s/%s: apply changed nothing" % [id, m["tier"]])
			# enemy dummies in front of the deploy point
			for i in 3:
				sim.units.append(sim.make_unit(CardDB.get_card("knight"), 150.0 + i * 40.0, 330.0, true, "LEFT"))
			var n0: int = sim.units.size()
			sim.now = 5000.0
			sim.deploy_card(card, 195.0, 420.0, false)
			var u0 := sim.units.size()
			for i in 140:
				sim.step()
				if sim.game_over != "":
					break
			spawned_total += sim.units.size() - n0
			# attack hooks on a hit-point-bearing unit are exercised implicitly by the steps above
			if u0 == n0 and card["type"] != "spell":
				bad.append("%s/%s: nothing deployed" % [id, m["tier"]])
	print("spawned across all modifier runs: ", spawned_total)
	# full AI-vs-AI matches with random picks for both sides
	for seed_i in 3:
		var deck := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
		var deck2 := CardDB.deck_by_ids(["pekka", "hog_rider", "musketeer", "baby_dragon", "fireball", "mini_pekka", "goblin_barrel", "bomber"])
		var sim := Sim.new(deck, deck2)
		sim.ai_enabled = [true, true]
		sim.make_decks_private()
		sim.chaos = Chaos.new(sim)
		sim.chaos.next_at = 8.0
		sim.chaos.update_clock()
		var guard := 0
		while sim.game_over == "" and guard < 4000:
			sim.step()
			guard += 1
			if sim.chaos.update_clock():
				sim.chaos.choose(0, sim.chaos.options[randi() % sim.chaos.options.size()])
				sim.chaos.waiting = false
		print("MATCH ", seed_i, " ticks=", guard, " picks=", sim.chaos.picks, " mods=", sim.chaos.upgraded)
	print("CHAOS BAD: ", bad)
	quit(0)
