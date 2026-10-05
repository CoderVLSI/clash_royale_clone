extends SceneTree
## Spawns every hero next to enemy units, fires its ability and checks it ran without errors.
func _init() -> void:
	CardDB.ensure()
	var bad: Array = []
	var ids: Array = CardDB.all.filter(func(c): return str(c.get("rarity", "")) == "hero" and c.get("abilityCost") != null).map(func(c): return c["id"])
	for hid in ids:
		var deck := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
		var sim := Sim.new(deck, deck)
		sim.ai_enabled = [false, false]
		var hc := CardDB.get_card(hid)
		var h := sim.make_unit(hc, 195, 600, false, "LEFT")
		sim.units.append(h)
		sim.mech.on_spawn(h)
		for i in 3:
			var e := sim.make_unit(CardDB.get_card("knight"), 195 + i * 8, 588, true, "LEFT")
			e["damage"] = 0.0
			e["speed"] = 0.0
			e["hp"] = 5000.0
			e["maxHp"] = 5000.0
			sim.units.append(e)
		sim.players[0]["elixir"] = 10.0
		for i in 17:
			sim.step()
		if not sim.request_ability(h["id"]):
			bad.append(hid + ":not-ready")
			continue
		for i in 80:
			sim.step()
		if not h.get("abilityUsed", false):
			bad.append(hid + ":unused")
	print("HEROES ", ids.size(), " BAD: ", bad)
	quit(0)
