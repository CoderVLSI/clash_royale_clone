class_name Mechanics
extends RefCounted
## Card-specific behaviour layered on top of Sim's generic engine. Each hook mirrors a place in the
## App.js game loop where per-card special cases lived (spells, cloaking, ramp, chain, death effects ...).
## Batch A (this file): all spell cards + the most common unit flags. Evolutions / heroes / champions follow.

var sim: Sim

func _init(s: Sim) -> void:
	sim = s

static func _v(d: Dictionary, k: String, dv: Variant = 0) -> Variant:
	return Sim._v(d, k, dv)

# ---- card resolution (evolution / hero variants / mirror) -------------------------------
func evolution_progress(pi: int, card: Dictionary) -> Dictionary:
	## {current, required, ready} for a card sitting in an evolution slot, else {}.
	var p: Dictionary = sim.players[pi]
	if card.get("evolvesTo") == null or not (card["id"] in p["evo_slots"]):
		return {}
	var cur: int = int(p["cycles"].get(card["id"], 0))
	var req: int = int(_v(card, "evolutionCycles", 2))
	return {"current": cur, "required": req, "ready": cur >= req}

func resolve_card(pi: int, card: Dictionary) -> Dictionary:
	if pi == 0 and not _v(card, "isMirror", false):
		var prog := evolution_progress(pi, card)
		if not prog.is_empty() and prog["ready"]:
			var evo := CardDB.get_card(str(card["evolvesTo"]))
			if not evo.is_empty():
				return evo
		var hero_id = sim.players[pi]["hero_slot"]
		if card.get("heroVariantId") != null and hero_id == card["id"]:
			var hv := CardDB.get_card(str(card["heroVariantId"]))
			if not hv.is_empty():
				return hv
	if _v(card, "isMirror", false):
		var last: Dictionary = sim.players[pi]["last_played"]
		if last.is_empty() or _v(last, "isMirror", false):
			return {}
		var m: Dictionary = last.duplicate(true)
		var bonus := 1.0 + (12 - 11) * 0.1   # tournament standard 11 -> mirror plays at +1 level
		m["cost"] = int(last["cost"]) + 1
		if m.has("hp") and m["hp"] != null:
			m["hp"] = floorf(float(m["hp"]) * bonus)
		if m.has("damage") and m["damage"] != null:
			m["damage"] = floorf(float(m["damage"]) * bonus)
		return m
	return card

# ---- spells ------------------------------------------------------------------------------
func cast_spell(card: Dictionary, x: float, y: float, opp: bool) -> void:
	var id := str(card["id"])
	var own_edge := 0.0 if opp else Sim.H
	match id:
		"lightning":
			_cast_lightning(card, x, y, opp)
		"zap", "evolved_zap":
			_cast_zap(card, x, y, opp)
		"the_log":
			_start_log(card, x, y, opp, 150.0, 15.0)
		"barb_barrel":
			_start_log(card, x, y, opp, 100.0, 12.0)
		"poison":
			sim.zones.append(_zone(card, "poison", x, y, opp, {"interval": 1000.0, "last": sim.now - 1000.0, "dmg": float(_v(card, "damage", 0))}))
			sim.fx.append({"t": "zone", "x": x, "y": y, "r": float(_v(card, "radius", 50)), "kind": "poison", "dur": float(_v(card, "duration", 8))})
		"earthquake":
			_aoe(card, x, y, opp, {"slow": float(_v(card, "slow", 0.35)), "slowDuration": 3.0})
			sim.fx.append({"t": "spell", "x": x, "y": y, "r": float(_v(card, "radius", 70)), "kind": id})
		"graveyard":
			sim.zones.append(_zone(card, "graveyard", x, y, opp, {"interval": 500.0, "last": sim.now, "left": int(_v(card, "spawnCount", 20)), "dur": 10.0}))
			sim.fx.append({"t": "zone", "x": x, "y": y, "r": float(_v(card, "radius", 80)), "kind": "graveyard", "dur": 10.0})
		"clone":
			_cast_clone(card, x, y, opp)
		"freeze":
			_cast_freeze(card, x, y, opp)
		"rage":
			_cast_rage(card, x, y, opp)
		"goblin_curse":
			sim.zones.append(_zone(card, "curse", x, y, opp, {"interval": 200.0, "last": sim.now}))
			sim.fx.append({"t": "zone", "x": x, "y": y, "r": float(_v(card, "radius", 50)), "kind": "curse", "dur": float(_v(card, "duration", 6))})
		"void":
			sim.zones.append(_zone(card, "void", x, y, opp, {"interval": 1500.0, "last": sim.now}))
			sim.fx.append({"t": "zone", "x": x, "y": y, "r": float(_v(card, "radius", 50)), "kind": "void", "dur": float(_v(card, "duration", 5))})
		"vines":
			sim.zones.append(_zone(card, "vines", x, y, opp, {"interval": 100.0, "last": sim.now}))
			sim.fx.append({"t": "zone", "x": x, "y": y, "r": float(_v(card, "radius", 45)), "kind": "vines", "dur": float(_v(card, "duration", 4))})
		"tornado":
			sim.zones.append(_zone(card, "tornado", x, y, opp, {"interval": 170.0, "last": sim.now}))
			sim.fx.append({"t": "zone", "x": x, "y": y, "r": float(_v(card, "radius", 60)), "kind": "tornado", "dur": float(_v(card, "duration", 1))})
		"royal_delivery":
			sim.zones.append({"kind": "delivery", "x": x, "y": y, "opp": opp, "card": card, "end": sim.now + float(_v(card, "spawnDelay", 3000)),
				"r": float(_v(card, "radius", 45)), "interval": 999999.0, "last": sim.now})
			sim.fx.append({"t": "zone", "x": x, "y": y, "r": float(_v(card, "radius", 45)), "kind": "delivery", "dur": 3.0})
		"goblin_barrel", "evolved_goblin_barrel":
			_throw_barrel(card, x, y, opp, own_edge, false)
			if id == "evolved_goblin_barrel":
				var zd := {"kind": "decoy_barrel", "x": x, "y": y, "opp": opp, "card": card, "end": sim.now + float(_v(card, "decoyBarrelDelay", 0.5)) * 1000.0,
					"r": 20.0, "interval": 999999.0, "last": sim.now}
				sim.zones.append(zd)
		_:
			var speed := 12.0 if id == "rocket" else 15.0
			sim.projectiles.append({
				"id": sim._new_id(), "x": Sim.W / 2.0, "y": own_edge, "targetId": -1, "targetX": x, "targetY": y,
				"speed": speed, "isSpell": true, "card": card, "opp": opp, "type": "spell_" + id,
			})

func _zone(card: Dictionary, kind: String, x: float, y: float, opp: bool, extra: Dictionary) -> Dictionary:
	var z := {"kind": kind, "x": x, "y": y, "opp": opp, "card": card, "r": float(_v(card, "radius", 50)),
		"end": sim.now + float(_v(card, "duration", 1)) * 1000.0, "interval": 100.0, "last": sim.now}
	z.merge(extra, true)
	return z

func spell_land(p: Dictionary) -> void:
	var card: Dictionary = p["card"]
	var id := str(card["id"])
	var x: float = p["targetX"]
	var y: float = p["targetY"]
	var opp: bool = p["opp"]
	if id == "goblin_barrel" or id == "evolved_goblin_barrel":
		_spawn_group(CardDB.get_card(str(card.get("spawns", "sword_goblins"))), int(_v(card, "spawnCount", 3)), x, y, opp)
		sim.fx.append({"t": "impact", "x": x, "y": y, "kind": "barrel"})
		return
	var extra := {}
	if float(_v(card, "slow", 0)) > 0.0:
		extra["slowDuration"] = float(_v(card, "slowDuration", 2.5))
	_aoe(card, x, y, opp, extra)
	sim.fx.append({"t": "spell", "x": x, "y": y, "r": float(_v(card, "radius", 40)), "kind": id})

func _aoe(card: Dictionary, x: float, y: float, opp: bool, extra: Dictionary) -> void:
	var events: Array = []
	var ev := {"x": x, "y": y, "r": float(_v(card, "radius", 40)), "dmg": float(_v(card, "damage", 0)), "opp": opp, "skip_id": -1,
		"tower_factor": Sim.SPELL_TOWER_FACTOR, "attacker": -1, "ground_only": _v(card, "groundOnly", false),
		"slow": float(_v(card, "slow", 0)), "stun": float(_v(card, "stun", 0)), "knockback": float(_v(card, "knockback", 0)), "tower_hit": true}
	ev.merge(extra, true)
	sim._apply_splash(ev, events)
	for e in events:
		for k in ["slowDuration"]:
			if extra.has(k):
				e[k] = extra[k]
	sim._apply_damage(events)

func _cast_zap(card: Dictionary, x: float, y: float, opp: bool) -> void:
	_aoe(card, x, y, opp, {})
	sim.fx.append({"t": "spell", "x": x, "y": y, "r": float(_v(card, "radius", 35)), "kind": "zap"})

func _cast_lightning(card: Dictionary, x: float, y: float, opp: bool) -> void:
	var r: float = float(_v(card, "radius", 70))
	var cands: Array = []
	for u in sim.units:
		if u["opp"] != opp and u["hp"] > 0 and Sim.dist(u["x"], u["y"], x, y) <= r and not sim._is_hidden(u):
			cands.append(u)
	for t in sim.towers:
		if t["opp"] != opp and t["hp"] > 0 and Sim.dist(t["x"], t["y"], x, y) <= r:
			cands.append(t)
	cands.sort_custom(func(a, b): return a["hp"] > b["hp"])
	var dmg: float = float(_v(card, "damage", 0))
	for i in mini(3, cands.size()):
		var t: Dictionary = cands[i]
		if t.has("isTower"):
			t["hp"] -= floorf(dmg * Sim.SPELL_TOWER_FACTOR)
			t["stunUntil"] = sim.now + 500.0
		else:
			sim._apply_damage([{"id": t["id"], "dmg": dmg, "attacker": -1, "stun": 0.5}])
		sim.fx.append({"t": "bolt", "x": t["x"], "y": t["y"]})
	sim.fx.append({"t": "spell", "x": x, "y": y, "r": r, "kind": "lightning"})

func _cast_clone(card: Dictionary, x: float, y: float, opp: bool) -> void:
	var r: float = float(_v(card, "radius", 35))
	var added: Array = []
	for u in sim.units:
		if u["opp"] == opp and u["hp"] > 0 and u["type"] != "building" and not _v(u, "isClone", false) and Sim.dist(u["x"], u["y"], x, y) <= r:
			var c: Dictionary = u.duplicate(true)
			c["id"] = sim._new_id()
			c["hp"] = 1.0
			c["maxHp"] = 1.0
			c["isClone"] = true
			c["cloneEndTime"] = sim.now + float(_v(card, "cloneDuration", 10)) * 1000.0
			c["x"] = u["x"] + 8.0
			c["y"] = u["y"] + 8.0
			c["currentShieldHp"] = 0.0
			added.append(c)
	sim.units.append_array(added)
	sim.fx.append({"t": "spell", "x": x, "y": y, "r": r, "kind": "clone"})

func _cast_freeze(card: Dictionary, x: float, y: float, opp: bool) -> void:
	var r: float = float(_v(card, "radius", 50))
	var dur: float = float(_v(card, "freezeDuration", 4)) * 1000.0
	var d: float = float(_v(card, "damage", 0))
	for u in sim.units:
		if u["opp"] != opp and u["hp"] > 0 and Sim.dist(u["x"], u["y"], x, y) <= r:
			u["hp"] -= d
			u["stunUntil"] = maxf(u["stunUntil"], sim.now + dur)
			u["frozenUntil"] = sim.now + dur
	for t in sim.towers:
		if t["opp"] != opp and t["hp"] > 0 and Sim.dist(t["x"], t["y"], x, y) <= r + 30.0:
			t["hp"] -= floorf(d * Sim.SPELL_TOWER_FACTOR)
			t["stunUntil"] = sim.now + dur
	sim.fx.append({"t": "spell", "x": x, "y": y, "r": r, "kind": "freeze"})

func _cast_rage(card: Dictionary, x: float, y: float, opp: bool) -> void:
	var dur: float = float(_v(card, "rageDuration", 7))
	var r: float = float(_v(card, "radius", 60))
	var z := _zone(card, "rage", x, y, opp, {"end": sim.now + dur * 1000.0, "boost": float(_v(card, "rageBoost", 0.35)), "interval": 100.0})
	sim.zones.append(z)
	_tick_rage(z)
	sim.fx.append({"t": "zone", "x": x, "y": y, "r": r, "kind": "rage", "dur": dur})

func _start_log(card: Dictionary, x: float, y: float, opp: bool, distance: float, speed: float) -> void:
	var dir := 1.0 if opp else -1.0
	sim.zones.append({"kind": "log", "x": x, "y": y, "opp": opp, "card": card, "dir": dir, "end_y": y + dir * distance, "speed": speed,
		"r": float(_v(card, "radius", 40)), "hit": {}, "interval": 0.0, "last": sim.now, "end": sim.now + 20000.0, "spawn_end": card.get("spawns") != null})

func _throw_barrel(card: Dictionary, x: float, y: float, opp: bool, edge: float, _decoy: bool) -> void:
	sim.projectiles.append({
		"id": sim._new_id(), "x": x, "y": edge, "targetId": -1, "targetX": x, "targetY": y,
		"speed": 25.0, "isSpell": true, "card": card, "opp": opp, "type": "spell_goblin_barrel",
	})

func _spawn_group(card: Dictionary, count: int, x: float, y: float, opp: bool) -> void:
	if card.is_empty():
		return
	var lane := "LEFT" if x < Sim.W / 2.0 else "RIGHT"
	for i in count:
		var a := (TAU * i) / maxf(1.0, count)
		var off := Vector2(cos(a), sin(a)) * (0.0 if count == 1 else 18.0)
		var u := sim.make_unit(card, clampf(x + off.x, 20.0, Sim.W - 20.0), clampf(y + off.y, 20.0, Sim.H - 20.0), opp, lane)
		sim.units.append(u)
		on_spawn(u)

# ---- zones -------------------------------------------------------------------------------
func update_zones(dmg: Array, splash: Array) -> void:
	var keep: Array = []
	for z in sim.zones:
		if _tick_zone(z, dmg, splash):
			keep.append(z)
	sim.zones = keep

func _in_r(u: Dictionary, z: Dictionary, extra: float = 0.0) -> bool:
	return Sim.dist(u["x"], u["y"], z["x"], z["y"]) <= z["r"] + extra

func _tick_zone(z: Dictionary, _dmg: Array, splash: Array) -> bool:
	var kind: String = z["kind"]
	var now: float = sim.now
	if kind == "log":
		return _tick_log(z)
	if kind == "delivery":
		if now < z["end"]:
			return true
		var card: Dictionary = z["card"]
		splash.append({"x": z["x"], "y": z["y"], "r": z["r"], "dmg": float(_v(card, "damage", 0)), "opp": z["opp"], "skip_id": -1,
			"tower_factor": Sim.SPELL_TOWER_FACTOR, "attacker": -1, "ground_only": false, "tower_hit": true, "knockback": 15.0})
		_spawn_group(CardDB.get_card(str(card.get("spawns", "royal_recruit_single"))), 1, z["x"], z["y"], z["opp"])
		sim.fx.append({"t": "spell", "x": z["x"], "y": z["y"], "r": z["r"], "kind": "royal_delivery"})
		return false
	if kind == "decoy_barrel":
		if now < z["end"]:
			return true
		_throw_barrel(z["card"], z["x"], z["y"], z["opp"], 0.0 if z["opp"] else Sim.H, true)
		return false
	if kind == "bomb":
		if now < z["end"]:
			return true
		splash.append({"x": z["x"], "y": z["y"], "r": z["r"], "dmg": z["dmg"], "opp": z["opp"], "skip_id": -1, "tower_factor": 1.0,
			"attacker": -1, "ground_only": false, "tower_hit": true})
		sim.fx.append({"t": "spell", "x": z["x"], "y": z["y"], "r": z["r"], "kind": "fireball"})
		return false
	if now >= z["end"]:
		return false
	if now - z["last"] < z["interval"]:
		return true
	z["last"] = now
	match kind:
		"poison":
			splash.append({"x": z["x"], "y": z["y"], "r": z["r"], "dmg": z["dmg"], "opp": z["opp"], "skip_id": -1,
				"tower_factor": Sim.SPELL_TOWER_FACTOR, "attacker": -1, "ground_only": false, "tower_hit": true})
		"rage":
			_tick_rage(z)
		"vines":
			for u in sim.units:
				if u["opp"] != z["opp"] and u["hp"] > 0 and _in_r(u, z):
					u["rootUntil"] = now + 200.0
		"curse":
			for u in sim.units:
				if u["opp"] != z["opp"] and u["hp"] > 0 and _in_r(u, z) and not sim._is_hidden(u):
					u["cursedUntil"] = now + 800.0
					u["cursedBySide"] = z["opp"]
		"void":
			var targets := sim.units.filter(func(u): return u["opp"] != z["opp"] and u["hp"] > 0 and not sim._is_hidden(u) and _in_r(u, z))
			if targets.size() > 0:
				var d := 20.0
				if targets.size() == 1:
					d = 250.0
				elif targets.size() <= 4:
					d = 80.0
				for u in targets:
					sim._apply_damage([{"id": u["id"], "dmg": d, "attacker": -1}])
				sim.fx.append({"t": "splash", "x": z["x"], "y": z["y"], "r": z["r"]})
		"tornado":
			var card: Dictionary = z["card"]
			var ticks := maxf(1.0, float(_v(card, "duration", 1)) * 1000.0 / 170.0)
			var per_tick := float(_v(card, "damage", 0)) / ticks
			for u in sim.units:
				if u["opp"] != z["opp"] and u["hp"] > 0 and _in_r(u, z) and u["type"] != "building":
					var d2 := Sim.dist(u["x"], u["y"], z["x"], z["y"])
					if d2 > 5.0:
						u["x"] += (z["x"] - u["x"]) / d2 * 6.0
						u["y"] += (z["y"] - u["y"]) / d2 * 6.0
					sim._apply_damage([{"id": u["id"], "dmg": per_tick, "attacker": -1}])
			for t in sim.towers:
				if t["opp"] != z["opp"] and t["hp"] > 0 and Sim.dist(t["x"], t["y"], z["x"], z["y"]) <= z["r"] + 20.0:
					t["hp"] -= per_tick * 0.35
		"graveyard":
			if z["left"] > 0:
				z["left"] -= 1
				var a := sim.rng.randf() * TAU
				var rr: float = sqrt(sim.rng.randf()) * float(z["r"])
				_spawn_group(CardDB.get_card(str(z["card"].get("spawns", "skeletons"))), 1, z["x"] + cos(a) * rr, z["y"] + sin(a) * rr, z["opp"])
	return true

func _tick_rage(z: Dictionary) -> void:
	var remaining: float = z["end"] - sim.now
	for u in sim.units:
		if u["opp"] == z["opp"] and u["hp"] > 0 and _in_r(u, z):
			u["rageUntil"] = maxf(float(_v(u, "rageUntil", 0.0)), sim.now + minf(remaining + 500.0, 2000.0))
			u["rageBoost"] = z["boost"]

func _tick_log(z: Dictionary) -> bool:
	z["y"] += z["dir"] * z["speed"]
	var done: bool = (z["dir"] < 0 and z["y"] <= z["end_y"]) or (z["dir"] > 0 and z["y"] >= z["end_y"])
	var card: Dictionary = z["card"]
	var ev: Array = []
	for u in sim.units:
		if u["opp"] == z["opp"] or u["hp"] <= 0 or u["type"] != "ground" or z["hit"].has(u["id"]):
			continue
		if absf(u["x"] - z["x"]) <= z["r"] and absf(u["y"] - z["y"]) <= 20.0:
			z["hit"][u["id"]] = true
			ev.append({"id": u["id"], "dmg": float(_v(card, "damage", 0)), "attacker": -1, "knockback": float(_v(card, "knockback", 0)),
				"from_x": z["x"], "from_y": z["y"] - z["dir"] * 20.0, "stun": float(_v(card, "stun", 0))})
	sim._apply_damage(ev)
	if done:
		if z["spawn_end"]:
			_spawn_group(CardDB.get_card(str(card.get("spawns", ""))), int(_v(card, "spawnCount", 1)), z["x"], z["y"], z["opp"])
		return false
	return true

# ---- per-tick hooks ----------------------------------------------------------------------
func pre_update() -> void:
	pass

func post_update() -> void:
	pass

func on_spawn(u: Dictionary) -> void:
	if _v(u, "hidden", false) == true:
		u["hidden"] = {"active": true, "lastCombatTime": sim.now}
	if _v(u, "generatesElixir", false):
		u["elixirGenerationTime"] = sim.now
	var sd: float = float(_v(u, "spawnDamage", 0))
	if sd > 0.0:
		var r: float = float(_v(u, "spawnDamageRadius", 50))
		var s := {"x": u["x"], "y": u["y"], "r": r, "dmg": sd, "opp": u["opp"], "skip_id": -1, "tower_factor": 1.0, "attacker": u["id"],
			"ground_only": false, "tower_hit": true, "stun": float(_v(u, "spawnPulseStun", 0)), "knockback": 20.0}
		var ev: Array = []
		sim._apply_splash(s, ev)
		sim._apply_damage(ev)

func update_unit_pre(u: Dictionary, _dmg: Array, _splash: Array) -> void:
	var now := sim.now
	# clones expire
	if _v(u, "isClone", false) and now >= u["cloneEndTime"]:
		u["hp"] = 0.0
		return
	# curse: dying while cursed spawns a Cursed Hog for the curser (handled in on_death)
	# passive healing (Battle Healer)
	var ph: float = float(_v(u, "passiveHeal", 0))
	if ph > 0.0 and now - float(_v(u, "lastPassiveHeal", u["spawnTime"])) >= 1000.0:
		u["hp"] = minf(u["maxHp"], u["hp"] + ph)
		u["lastPassiveHeal"] = now
	# elixir collector
	if _v(u, "generatesElixir", false) and now - float(_v(u, "elixirGenerationTime", now)) >= 10500.0:
		u["elixirGenerationTime"] = now
		var pi := 1 if u["opp"] else 0
		sim.players[pi]["elixir"] = minf(10.0, sim.players[pi]["elixir"] + 1.0)
		sim.fx.append({"t": "elixir", "x": u["x"], "y": u["y"]})
	# cloaking (Tesla / Royal Ghost / timed hidden)
	var h = u.get("hidden")
	if h is Dictionary:
		_update_hidden(u, h)

func _update_hidden(u: Dictionary, h: Dictionary) -> void:
	var now := sim.now
	var id := str(u["spriteId"])
	if id == "tesla" or id == "evolved_tesla":
		var det := float(_v(u, "range", 55)) * 1.2
		var near := false
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= det:
				near = true
				break
		if near:
			h["lastCombatTime"] = now
			if h["active"]:
				h["wakeTime"] = now
			h["active"] = false
		elif (now - h.get("lastCombatTime", now)) / 1000.0 > 3.0:
			h["active"] = true
	elif id == "royal_ghost" or id == "evolved_royal_ghost":
		var rng_px := float(_v(u, "range", 25)) + 50.0
		var enemy_in := false
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and e["type"] == "ground" and not sim._is_hidden(e) and Sim.dist(e["x"], e["y"], u["x"], u["y"]) < rng_px:
				enemy_in = true
				break
		var tower_in := false
		for t in sim.towers:
			if t["opp"] != u["opp"] and t["hp"] > 0 and Sim.dist(t["x"], t["y"], u["x"], u["y"]) < rng_px:
				tower_in = true
				break
		if h["active"]:
			if enemy_in or tower_in:
				h["active"] = false
		else:
			var far := true
			for e in sim.units:
				if e["opp"] != u["opp"] and e["hp"] > 0 and e["type"] != "flying" and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= 100.0:
					far = false
					break
			if far:
				for t in sim.towers:
					if t["opp"] != u["opp"] and t["hp"] > 0 and Sim.dist(t["x"], t["y"], u["x"], u["y"]) <= 100.0:
						far = false
						break
			if far:
				h["active"] = true

func modify_damage(u: Dictionary, target: Dictionary, base_damage: float, tdist: float) -> float:
	var d := base_damage
	if _v(u, "damageRamp", false):
		if int(_v(u, "lastRampTarget", -1)) != int(target["id"]):
			u["lastRampTarget"] = target["id"]
			u["lastRampTime"] = sim.now
		var secs := (sim.now - float(_v(u, "lastRampTime", sim.now))) / 1000.0
		d = floorf(base_damage + minf(350.0, secs * 60.0))
	if float(_v(u, "powerShotMultiplier", 0)) > 0.0 and tdist >= float(_v(u, "powerShotMinRange", 0)) and tdist <= float(_v(u, "powerShotMaxRange", INF)):
		d = floorf(d * float(u["powerShotMultiplier"]))
	if _v(u, "shotgunSpread", false):
		d = floorf(base_damage * maxf(0.3, 1.0 - tdist / 150.0))
	return d

func on_attack(u: Dictionary, target: Dictionary, damage: float, dmg: Array, splash: Array) -> void:
	# Heal Spirit: heals friendly units around it on its explosion
	var heal: float = float(_v(u, "healsOnAttack", 0))
	if heal > 0.0:
		var r: float = float(_v(u, "healRadius", 60))
		for a in sim.units:
			if a["opp"] == u["opp"] and a["hp"] > 0 and a["id"] != u["id"] and Sim.dist(a["x"], a["y"], u["x"], u["y"]) <= r:
				a["hp"] = minf(float(_v(a, "overhealMaxHp", a["maxHp"])), a["hp"] + heal)
		sim.fx.append({"t": "splash", "x": u["x"], "y": u["y"], "r": r})
	# Ice Spirit: freezes everything it explodes on
	var fz: float = float(_v(u, "freezeDuration", 0))
	if fz > 0.0 and u["hp"] <= 0.0:
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and Sim.dist(e["x"], e["y"], target["x"], target["y"]) <= float(_v(u, "splashRadius", 40)):
				e["stunUntil"] = maxf(e["stunUntil"], sim.now + fz * 1000.0)
				e["frozenUntil"] = sim.now + fz * 1000.0
		sim.fx.append({"t": "spell", "x": target["x"], "y": target["y"], "r": 40.0, "kind": "freeze"})
	# Chain lightning (Electro Spirit)
	var chain: int = int(_v(u, "chain", 0))
	if chain > 0 and not target.has("isTower"):
		_chain(u, target, damage, mini(chain - 1, 3), float(_v(u, "stun", 0)), dmg)
	if _v(u, "kamikaze", false) and str(u["spriteId"]) != "battle_ram":
		sim.fx.append({"t": "spell", "x": target["x"], "y": target["y"], "r": 38.0, "kind": "fireball" if _v(u, "splash", false) and fz <= 0.0 else "zap"})

func _chain(u: Dictionary, primary: Dictionary, damage: float, count: int, stun: float, dmg: Array) -> void:
	var chained: Array = [primary]
	var remaining := count
	while remaining > 0:
		var last: Dictionary = chained[chained.size() - 1]
		var best: Variant = null
		var bd := INF
		for e in sim.units:
			if e["opp"] == u["opp"] or e["hp"] <= 0 or _v(e, "isZone", false) or chained.has(e):
				continue
			var d := Sim.dist(e["x"], e["y"], last["x"], last["y"])
			if d < bd and d < 80.0:
				bd = d
				best = e
		if best == null:
			break
		chained.append(best)
		remaining -= 1
	for i in range(1, chained.size()):
		dmg.append({"id": chained[i]["id"], "dmg": damage, "attacker": u["id"], "stun": stun})
		sim.fx.append({"t": "bolt", "x": chained[i]["x"], "y": chained[i]["y"]})

func on_ranged_attack(_u: Dictionary, _target: Dictionary, _damage: float, _proj: Dictionary) -> void:
	pass

func on_projectile_hit(_p: Dictionary, _tgt: Variant, _dmg: Array, _splash: Array) -> void:
	pass

func on_death(d: Dictionary) -> void:
	var now := sim.now
	var opp: bool = d["opp"]
	# elixir golem family hands the opponent elixir
	if _v(d, "givesOpponentElixir", false):
		var pi := 0 if opp else 1
		sim.players[pi]["elixir"] = minf(10.0, sim.players[pi]["elixir"] + 1.0)
		sim.fx.append({"t": "elixir", "x": d["x"], "y": d["y"]})
	# Lumberjack drops a Rage puddle
	if _v(d, "deathRage", false):
		var rz := {"kind": "rage", "x": d["x"], "y": d["y"], "opp": opp, "card": {}, "r": 50.0, "end": now + 6000.0, "boost": 0.35, "interval": 100.0, "last": now}
		sim.zones.append(rz)
		sim.fx.append({"t": "zone", "x": d["x"], "y": d["y"], "r": 50.0, "kind": "rage", "dur": 6.0})
	# Cursed units become Cursed Hogs for the curser
	if float(_v(d, "cursedUntil", 0.0)) > now and d["type"] != "building":
		var hog := CardDB.get_card("cursed_hog")
		if not hog.is_empty():
			var side: bool = _v(d, "cursedBySide", opp)
			var hu := sim.make_unit(hog, d["x"], d["y"], side, "LEFT" if d["x"] < Sim.W / 2.0 else "RIGHT")
			sim.units.append(hu)
			on_spawn(hu)
	# Delayed death bombs (Balloon, Giant Skeleton) or slow novas (Ice Golem)
	if float(_v(d, "deathBombDelay", 0)) > 0.0 and float(_v(d, "deathDamage", 0)) > 0.0:
		sim.zones.append({"kind": "bomb", "x": d["x"], "y": d["y"], "opp": opp, "card": {}, "r": float(_v(d, "deathRadius", 60)),
			"dmg": float(_v(d, "deathDamage", 0)), "end": now + float(d["deathBombDelay"]), "interval": 999999.0, "last": now})
		sim.fx.append({"t": "zone", "x": d["x"], "y": d["y"], "r": float(_v(d, "deathRadius", 60)), "kind": "bomb", "dur": float(d["deathBombDelay"]) / 1000.0})

func is_raged(u: Dictionary) -> bool:
	return float(_v(u, "rageUntil", 0.0)) > sim.now or _v(u, "permRage", false)

func damage_unit(u: Dictionary, e: Dictionary) -> void:
	sim.damage_unit_basic(u, e)
	# Electro Giant: shocks (damages + stuns) melee attackers
	if _v(u, "shockOnHit", false) and e.get("attacker", -1) != -1:
		var a: Variant = sim.unit_by_id(int(e["attacker"]))
		if a != null and a["hp"] > 0 and a["opp"] != u["opp"] and a.get("projectile") == null and Sim.dist(a["x"], a["y"], u["x"], u["y"]) <= float(_v(u, "shockRadius", 50)) + 20.0:
			a["hp"] -= float(_v(u, "shockDamage", 100))
			a["stunUntil"] = maxf(a["stunUntil"], sim.now + float(_v(u, "shockStun", 0.5)) * 1000.0)
			sim.fx.append({"t": "bolt", "x": a["x"], "y": a["y"]})
