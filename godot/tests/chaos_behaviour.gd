extends SceneTree
## Spot checks that behavioural Chaos modifiers really change the battle.
func _sim() -> Sim:
	var d := CardDB.deck_by_ids(["knight", "giant", "archers", "minions", "skeletons", "zap", "cannon", "valkyrie"])
	var s := Sim.new(d, d, "princess", 3)
	s.make_decks_private()
	s.chaos = Chaos.new(s)
	s.now = 5000.0
	return s
func _mod(card: String, tier: String) -> Dictionary:
	var c: Dictionary = CardDB.get_card(card).duplicate(true)
	Chaos.apply(c, Chaos.mod_for(card, tier))
	return c
func _count(s: Sim, cid: String, opp: bool) -> int:
	var n := 0
	for u in s.units:
		if u["cid"] == cid and u["opp"] == opp and u["hp"] > 0:
			n += 1
	return n
func _dummies(s: Sim, y: float = 300.0) -> void:
	for i in 3:
		var k := s.make_unit(CardDB.get_card("giant"), 160.0 + i * 35.0, y, true, "LEFT")
		k["hp"] = 99999.0
		k["maxHp"] = 99999.0
		k["speed"] = 0.0
		k["baseSpeed"] = 0.0
		s.units.append(k)
func _init() -> void:
	CardDB.ensure()
	var fails: Array = []
	# Knight epic -> Mega Knight alongside
	var s := _sim()
	s.deploy_card(_mod("knight", "epic"), 195, 450, false)
	if _count(s, "mega_knight", false) != 1: fails.append("knight epic mega knight")
	# Giant rare charges
	if not bool(_mod("giant", "rare").get("charge", false)): fails.append("giant charge")
	# Zap rare also casts Lightning (damages a big target for more than plain zap)
	s = _sim(); _dummies(s)
	var hp0: float = s.units[0]["hp"]
	s.mech.cast_spell(_mod("zap", "rare"), 175.0, 300.0, false)
	for i in 20: s.step()
	var plain := _sim(); _dummies(plain)
	plain.mech.cast_spell(CardDB.get_card("zap").duplicate(true), 175.0, 300.0, false)
	for i in 20: plain.step()
	if not (s.units[0]["hp"] < plain.units[0]["hp"]): fails.append("zap+lightning no extra damage %s vs %s" % [s.units[0]["hp"], plain.units[0]["hp"]])
	# Fireball epic -> second fireball after delay
	s = _sim(); _dummies(s)
	s.mech.cast_spell(_mod("fireball", "epic"), 175.0, 300.0, false)
	for i in 70: s.step()
	plain = _sim(); _dummies(plain)
	plain.mech.cast_spell(CardDB.get_card("fireball").duplicate(true), 175.0, 300.0, false)
	for i in 70: plain.step()
	if not (s.units[0]["hp"] < plain.units[0]["hp"] - 100.0): fails.append("fireball twin")
	# Baby dragon epic spawns another baby dragon on death
	s = _sim()
	s.deploy_card(_mod("baby_dragon", "epic"), 195, 450, false)
	for u in s.units: if u["cid"] == "baby_dragon": u["hp"] = 0.0
	s.step()
	if _count(s, "baby_dragon", false) < 1: fails.append("baby dragon respawn")
	# Phoenix epic revives
	s = _sim()
	s.deploy_card(_mod("phoenix", "epic"), 195, 450, false)
	for u in s.units: if u["cid"] == "phoenix": u["hp"] = 0.0
	s.step()
	if _count(s, "phoenix", false) != 1: fails.append("phoenix revive")
	# Golem rare stuns neighbours
	s = _sim()
	s.deploy_card(_mod("golem", "rare"), 175, 470, false)
	var gx: float = s.units[s.units.size() - 1]["x"]
	for i in 3:
		var k := s.make_unit(CardDB.get_card("giant"), gx + (i - 1) * 25.0, 455.0, true, "LEFT")
		k["hp"] = 99999.0; k["maxHp"] = 99999.0; k["speed"] = 0.0; k["baseSpeed"] = 0.0
		s.units.append(k)
	for u in s.units:
		if u["cid"] == "golem": u["speed"] = 0.0; u["baseSpeed"] = 0.0
	for i in 100: s.step()
	var stunned := false
	for u in s.units: if u["opp"] and u["stunUntil"] > 0.0: stunned = true
	if not stunned: fails.append("golem stomp")
	# Witch epic: periodic skeleton army
	s = _sim()
	s.deploy_card(_mod("witch", "epic"), 195, 600, false)
	for u in s.units: if u["cid"] == "witch": u["speed"] = 0.0; u["baseSpeed"] = 0.0
	var peak := 0
	for i in 260:
		s.step()
		peak = maxi(peak, _count(s, "skeleton_army", false))
	if peak < 15: fails.append("witch army %d" % peak)
	# Elixir golem common: elixir on death
	s = _sim()
	s.deploy_card(_mod("elixir_golem", "common"), 195, 450, false)
	var e0: float = s.players[0]["elixir"]
	for u in s.units: if u["cid"] == "elixir_golem": u["hp"] = 0.0
	s.step()
	if not (s.players[0]["elixir"] > e0 + 0.9): fails.append("elixir golem")
	# Wizard rare fires fireballs every 5th hit
	s = _sim()
	s.deploy_card(_mod("wizard", "rare"), 195, 450, false)
	var wz: Dictionary = s.units[s.units.size() - 1]
	wz["speed"] = 0.0; wz["baseSpeed"] = 0.0
	var tk := s.make_unit(CardDB.get_card("giant"), wz["x"], wz["y"] - 40.0, true, "LEFT")
	tk["hp"] = 99999.0; tk["maxHp"] = 99999.0; tk["speed"] = 0.0; tk["baseSpeed"] = 0.0
	s.units.append(tk)
	var wd: float = wz["damage"]
	for i in 300: s.step()
	var taken: float = 99999.0 - float(tk["hp"])
	var shots := 300.0 * 66.0 / float(wz["attackSpeed"])
	if not (taken > shots * wd * 1.05): fails.append("wizard fireball hit taken=%s plain=%s" % [taken, shots * wd])
	# Wall breakers rare: bigger blast fields changed
	var wb := _mod("wall_breakers", "rare")
	if not (wb["damage"] > CardDB.get_card("wall_breakers")["damage"]): fails.append("wb dmg")
	# Cheaper clone
	if _mod("clone", "rare")["cost"] != 2: fails.append("clone cost")
	# Evolution slot keeps chaos mod
	s = _sim()
	s.players[0]["evo_slots"] = ["knight"]
	s.start_evolutions(0)
	for c in s.players[0]["deck"]:
		if c["id"] == "knight": Chaos.apply(c, Chaos.mod_for("knight", "common"))
	for i in 4:
		if s.players[0]["hand"][i]["id"] == "knight":
			s.players[0]["elixir"] = 10.0
			s.play_card(0, i, 195, 450)
			break
	var found := false
	for u in s.units:
		if u["cid"] == "evolved_knight" and u.has("chaosTier"): found = true
	if not found: fails.append("evolved knight lost chaos mod")
	print("BEHAVIOUR FAILS: ", fails)
	quit(0)
