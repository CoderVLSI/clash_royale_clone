class_name Abilities
extends RefCounted
## Champion and hero active abilities (App.js "CHAMPION / HERO ABILITIES" block).
## Player units use them via Sim.request_ability(unit_id) (HUD button); AI units trigger automatically
## whenever off cooldown and their owner has enough elixir.

var sim: Sim

func _init(s: Sim) -> void:
	sim = s

static func _v(d: Dictionary, k: String, dv: Variant = 0) -> Variant:
	return Sim._v(d, k, dv)

func has_ability(u: Dictionary) -> bool:
	return float(_v(u, "abilityCooldown", 0)) > 0.0

func ready_at(u: Dictionary) -> float:
	if _v(u, "abilityOnce", false):
		# heroes: one use per deployment, available a moment after landing
		return INF if _v(u, "abilityUsed", false) else float(_v(u, "spawnTime", 0.0)) + 1000.0
	return float(_v(u, "lastAbilityTime", 0.0)) + float(_v(u, "abilityCooldown", 0))

func is_ready(u: Dictionary) -> bool:
	return has_ability(u) and sim.now >= ready_at(u)

func tick(u: Dictionary) -> void:
	if not has_ability(u):
		return
	_tick_effects(u)
	if sim.now < ready_at(u):
		return
	var pi := 1 if u["opp"] else 0
	var cost: float = float(_v(u, "abilityCost", 0))
	if sim.players[pi]["elixir"] < cost:
		return
	var requested: bool = u["opp"] or _v(u, "abilityActiveRequest", false)
	if not requested:
		return
	if _use(u):
		sim.players[pi]["elixir"] -= cost
		u["abilityActiveRequest"] = false

func _tick_effects(u: Dictionary) -> void:
	var now := sim.now
	# Hero Wizard: Fiery Flight
	if u.has("heroFlightUntil") and u["heroFlightUntil"] > 0.0 and now >= u["heroFlightUntil"]:
		u["type"] = _v(u, "baseType", "ground")
		u["speed"] = u["baseSpeed"]
		u["heroFlightUntil"] = 0.0
		u["heroFlightShotsRemaining"] = 0
	# Hero Magic Archer triple-shot window
	if _v(u, "heroTripleShotReady", false) and now >= float(_v(u, "heroTripleShotExpiresAt", 0)):
		u["heroTripleShotReady"] = false
	# pending delayed actions
	var act = u.get("pendingAbility")
	if act is Dictionary and now >= act["at"]:
		u.erase("pendingAbility")
		_finish(u, act)
	# Monk reflect
	if _v(u, "isReflecting", false) and now >= float(_v(u, "reflectEndTime", 0)):
		u["isReflecting"] = false
	# Archer Queen cloak end
	var h = u.get("hidden")
	if h is Dictionary and h.has("until") and now >= h["until"]:
		h["active"] = false
		h.erase("until")
	# Goblinstein lightning link
	if _v(u, "lightningLinkActive", false):
		var monster: Variant = sim.unit_by_id(int(_v(u, "monsterId", -1)))
		if monster != null and monster["hp"] > 0 and now < float(_v(u, "lightningLinkEndTime", 0)):
			u["lightningDamageBuff"] = 0.5
			monster["lightningDamageBuff"] = 0.5
		else:
			u["lightningLinkActive"] = false
			u["lightningDamageBuff"] = 0.0
			if monster != null:
				monster["lightningDamageBuff"] = 0.0
	# Hero Electro Wizard: Surging Strikes beams (every 0.5 s, hits the nearest targets in range)
	if float(_v(u, "surgeUntil", 0.0)) > now and now >= float(_v(u, "surgeNext", 0.0)):
		u["surgeNext"] = now + 500.0
		var rr: float = float(_v(u, "heroSurgeRadius", 75))
		var cands: Array = []
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= rr:
				cands.append(e)
		for t in sim.towers:
			if t["opp"] != u["opp"] and t["hp"] > 0 and Sim.dist(t["x"], t["y"], u["x"], u["y"]) <= rr + 25.0:
				cands.append(t)
		cands.sort_custom(func(a, b): return Sim.dist(a["x"], a["y"], u["x"], u["y"]) < Sim.dist(b["x"], b["y"], u["x"], u["y"]))
		var per_tick: float = float(_v(u, "heroSurgeDps", 308)) * 0.5
		for e in cands.slice(0, int(_v(u, "heroSurgeTargets", 2))):
			var dmg: float = per_tick * (float(_v(u, "heroSurgeTowerMult", 0.5)) if e.get("isTower", false) else 1.0)
			if e.get("isTower", false):
				e["hp"] -= dmg
			else:
				sim._apply_damage([{"id": e["id"], "dmg": dmg, "attacker": u["id"]}])
			sim.fx.append({"t": "bolt", "x": e["x"], "y": e["y"]})
	_tick_hero(u)
	# Golden Knight dash chain: one hop per sim tick
	if _v(u, "dashChainActive", false):
		_dash_step(u)

func _use(u: Dictionary) -> bool:
	var now := sim.now
	var id := str(u["spriteId"])
	u["lastAbilityTime"] = now
	if _v(u, "abilityOnce", false):
		u["abilityUsed"] = true
	sim.fx.append({"t": "ability", "opp": u["opp"]})
	if _v(u, "heroFieryFlightAbility", false):
		var cast: float = float(_v(u, "heroCastDelay", 1000))
		u["stunUntil"] = maxf(u["stunUntil"], now + cast)
		u["pendingAbility"] = {"at": now + cast, "kind": "flight"}
		u["lastAbilityTime"] = now + cast + float(_v(u, "heroFlightDuration", 5000))
		sim.fx.append({"t": "zone", "x": u["x"], "y": u["y"], "r": 32.0, "kind": "cast", "dur": cast / 1000.0})
		return true
	if _v(u, "heroTauntAbility", false):
		u["currentShieldHp"] = float(_v(u, "heroShield", 819))
		u["shieldUntil"] = now + float(_v(u, "heroTauntDuration", 5000))
		for e in _enemies_in(u, float(_v(u, "heroTauntRadius", 163))):
			e["tauntUntil"] = now + float(_v(u, "heroTauntDuration", 5000))
			e["tauntedBy"] = u["id"]
		sim.fx.append({"t": "zone", "x": u["x"], "y": u["y"], "r": float(_v(u, "heroTauntRadius", 163)), "kind": "cast", "dur": 0.6})
		return true
	if _v(u, "heroHurlAbility", false):
		var best: Variant = null
		for e in _enemies_in(u, float(_v(u, "heroHurlRadius", 45))):
			if e["type"] != "building" and (best == null or e["hp"] > best["hp"]):
				best = e
		if best == null:
			u["abilityUsed"] = false
			u["lastAbilityTime"] = now - 99999.0
			return false
		best["x"] = Sim.W - best["x"]
		best["lane"] = "RIGHT" if best["lane"] == "LEFT" else "LEFT"
		best["lockedTarget"] = -1
		best["stunUntil"] = maxf(best["stunUntil"], now + 800.0)
		sim._apply_damage([{"id": best["id"], "dmg": float(_v(u, "heroHurlDamage", 250)), "attacker": u["id"]}])
		sim.fx.append({"t": "spell", "x": best["x"], "y": best["y"], "r": 40.0, "kind": "fireball"})
		return true
	if _v(u, "heroBreakfastAbility", false):
		var meters := mini(3, int((now - float(u["spawnTime"])) / float(_v(u, "heroPancakeInterval", 5000))))
		var levels := 1 + meters + (1 if meters >= 3 else 0)
		var f := pow(1.0 + float(_v(u, "heroLevelBoost", 0.1)), levels)
		var old_max: float = u["maxHp"]
		u["maxHp"] = floorf(old_max * f)
		u["hp"] = minf(u["maxHp"], u["hp"] * f + u["maxHp"] * float(_v(u, "heroBreakfastHeal", 0.3)))
		u["damage"] = floorf(float(u["damage"]) * f)
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 35.0, "kind": "clone"})
		return true
	if _v(u, "heroTurretAbility", false):
		var tc := CardDB.get_card("hero_turret")
		var off := 40.0 if u["opp"] else -40.0
		var tu := sim.make_unit(tc, u["x"], u["y"] + off, u["opp"], u["lane"])
		sim.units.append(tu)
		sim.mech.on_spawn(tu)
		return true
	if _v(u, "heroSnowstormAbility", false):
		u["stormUntil"] = now + float(_v(u, "heroSnowDuration", 5000))
		u["stormNext"] = now
		sim.fx.append({"t": "zone", "x": u["x"], "y": u["y"], "r": float(_v(u, "heroSnowRadius", 95)), "kind": "vines", "dur": float(_v(u, "heroSnowDuration", 5000)) / 1000.0})
		return true
	if _v(u, "heroBannerAbility", false):
		var alive := 0
		for e in sim.units:
			if e["opp"] == u["opp"] and e["hp"] > 0 and e["cid"] == u["cid"]:
				alive += 1
		if alive > 1:
			u["abilityUsed"] = false      # only the last goblin standing can call the banner
			return false
		var gc := CardDB.get_card("sword_goblins")
		for i in int(_v(u, "heroBannerCount", 4)):
			var a := TAU * i / 4.0
			var g := sim.make_unit(gc, u["x"] + cos(a) * 30.0, u["y"] + sin(a) * 30.0, u["opp"], u["lane"])
			sim.units.append(g)
			sim.mech.on_spawn(g)
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 40.0, "kind": "graveyard"})
		return true
	if _v(u, "heroWarpAbility", false):
		var tgt: Variant = null
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and e["type"] != "building" and (tgt == null or e["hp"] < tgt["hp"]):
				tgt = e
		if tgt == null:
			for t in sim.towers:
				if t["opp"] != u["opp"] and t["hp"] > 0 and (tgt == null or t["hp"] < tgt["hp"]):
					tgt = t
		if tgt == null:
			u["abilityUsed"] = false
			return false
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 30.0, "kind": "freeze"})
		u["x"] = tgt["x"]
		u["y"] = tgt["y"] + (30.0 if u["opp"] else -30.0)
		u["lockedTarget"] = tgt["id"]
		_hit(u, tgt, float(_v(u, "heroWarpDamage", 468)))
		sim.fx.append({"t": "spell", "x": tgt["x"], "y": tgt["y"], "r": 35.0, "kind": "zap"})
		return true
	if _v(u, "heroSwishAbility", false):
		u["range"] = float(_v(u, "heroSwishRange", 250))
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 40.0, "kind": "clone"})
		return true
	if _v(u, "heroRevivalAbility", false):
		var qc := CardDB.get_card("tomb_queen")
		var q := sim.make_unit(qc, u["x"], u["y"], u["opp"], u["lane"])
		u["hp"] = 0.0
		sim.units.append(q)
		sim.mech.on_spawn(q)
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 55.0, "kind": "graveyard"})
		return true
	if _v(u, "heroCoffinAbility", false):
		var sk := CardDB.get_card("skeletons")
		for i in 3:
			var a2 := TAU * i / 3.0
			var s2 := sim.make_unit(sk, u["x"] + cos(a2) * 25.0, u["y"] + sin(a2) * 25.0, u["opp"], u["lane"])
			sim.units.append(s2)
			sim.mech.on_spawn(s2)
		sim.zones.append({"kind": "bomb", "x": u["x"], "y": u["y"], "opp": u["opp"], "card": {}, "r": 60.0, "dmg": float(_v(u, "heroCoffinDamage", 300)), "end": now + 400.0, "interval": 999999.0, "last": now})
		return true
	if _v(u, "heroDismountAbility", false):
		var rr: float = float(_v(u, "heroDismountRadius", 70))
		sim.zones.append({"kind": "bomb", "x": u["x"], "y": u["y"], "opp": u["opp"], "card": {}, "r": rr, "dmg": float(_v(u, "heroDismountDamage", 400)), "end": now + 300.0, "interval": 999999.0, "last": now})
		for e in _enemies_in(u, rr):
			e["stunUntil"] = maxf(e["stunUntil"], now + 1000.0)
		u["damage"] = float(u["damage"]) * 1.3
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": rr, "kind": "fireball"})
		return true
	if _v(u, "heroWhirlwindAbility", false):
		u["whirlUntil"] = now + float(_v(u, "heroWhirlDuration", 3500))
		u["whirlNext"] = now
		u["damageReduction"] = 0.15
		u["speed"] = float(u["baseSpeed"]) * 1.6
		return true
	if _v(u, "heroSavageAbility", false):
		u["savageUntil"] = now + float(_v(u, "heroSavageDuration", 4000))
		u["unkillableUntil"] = u["savageUntil"]
		u["speed"] = float(u["baseSpeed"]) * 1.5
		u["attackSpeed"] = float(u["attackSpeed"]) / 3.0
		u["damage"] = float(u["damage"]) * 1.64
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 40.0, "kind": "rage"})
		return true
	if _v(u, "heroRerollAbility", false):
		var lc := {"id": "hero_roll", "damage": float(_v(u, "heroRerollDamage", 243)), "radius": 30, "knockback": 10}
		sim.mech._start_log(lc, u["x"], u["y"], u["opp"], 180.0, 250.0)
		return true
	if _v(u, "heroFrostyAbility", false):
		var fc := CardDB.get_card("frosty_snowman")
		var off2 := 35.0 if u["opp"] else -35.0
		var sn := sim.make_unit(fc, u["x"], u["y"] + off2, u["opp"], u["lane"])
		sn["hp"] = float(_v(u, "heroFrostyHp", 425))
		sn["maxHp"] = sn["hp"]
		sim.units.append(sn)
		sim.mech.on_spawn(sn)
		u["snowmanId"] = sn["id"]
		u["snowmanEnd"] = now + float(_v(u, "heroFrostyDuration", 7000))
		for e in _enemies_in(sn, float(_v(u, "heroFrostyRadius", 55))):
			_hit(u, e, float(_v(u, "heroFrostyDamage", 89)))
		sim.fx.append({"t": "spell", "x": sn["x"], "y": sn["y"], "r": 55.0, "kind": "freeze"})
		return true
	if _v(u, "heroSurgingAbility", false):
		# Surging Strikes: stun everything nearby, then twin lightning beams for the duration
		var dur: float = float(_v(u, "heroSurgeDuration", 3000))
		u["surgeUntil"] = now + dur
		u["surgeNext"] = now
		var r: float = float(_v(u, "heroSurgeRadius", 75))
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= r:
				e["stunUntil"] = maxf(e["stunUntil"], now + float(_v(u, "heroSurgeStun", 0.5)) * 1000.0)
		sim.fx.append({"t": "zone", "x": u["x"], "y": u["y"], "r": r, "kind": "cast", "dur": 0.5})
		return true
	if _v(u, "heroTripleThreatAbility", false):
		var cast2: float = float(_v(u, "heroCastDelay", 1000))
		u["stunUntil"] = maxf(u["stunUntil"], now + cast2)
		u["pendingAbility"] = {"at": now + cast2, "kind": "triple", "ox": u["x"], "oy": u["y"]}
		u["lastAbilityTime"] = now + cast2 + float(_v(u, "heroTripleShotDuration", 7000))
		sim.fx.append({"t": "zone", "x": u["x"], "y": u["y"], "r": 30.0, "kind": "cast", "dur": cast2 / 1000.0})
		return true
	if _v(u, "collectsSouls", false):
		var n := mini(6 + int(_v(u, "souls", 0)), 16)
		var sk := CardDB.get_card("skeletons")
		for i in n:
			var a := (TAU * i) / n
			var s := sim.make_unit(sk, u["x"] + cos(a) * 30.0, u["y"] + sin(a) * 30.0, u["opp"], u["lane"])
			sim.units.append(s)
			sim.mech.on_spawn(s)
		u["souls"] = 0
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 60.0, "kind": "graveyard"})
		return true
	if _v(u, "stealthAbility", false):
		u["hidden"] = {"active": true, "until": now + 3000.0}
		u["rageUntil"] = now + 3000.0
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 40.0, "kind": "freeze"})
		return true
	if _v(u, "reflectAbility", false):
		u["isReflecting"] = true
		u["reflectEndTime"] = now + 4000.0
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 50.0, "kind": "clone"})
		return true
	if _v(u, "dashChain", false):
		var enemies: Array = sim.units.filter(func(e): return e["opp"] != u["opp"] and e["hp"] > 0 and e["id"] != u["lockedTarget"] and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= 100.0)
		enemies.sort_custom(func(a, b): return Sim.dist(a["x"], a["y"], u["x"], u["y"]) < Sim.dist(b["x"], b["y"], u["x"], u["y"]))
		u["dashTargets"] = enemies.slice(0, 9).map(func(e): return e["id"])
		u["dashChainActive"] = true
		u["isDashing"] = true
		return true
	if _v(u, "escapeAbility", false):
		sim.zones.append({"kind": "bomb", "x": u["x"], "y": u["y"], "opp": u["opp"], "card": {}, "r": 60.0, "dmg": 300.0, "end": now + 300.0, "interval": 999999.0, "last": now})
		u["x"] = Sim.W - u["x"]
		u["lane"] = "RIGHT" if u["lane"] == "LEFT" else "LEFT"
		u["lockedTarget"] = -1
		return true
	if _v(u, "guardianAbility", false):
		var g := CardDB.get_card("guardian")
		if not g.is_empty():
			var off := 40.0 if u["opp"] else -40.0
			var gu := sim.make_unit(g, u["x"], u["y"] + off, u["opp"], u["lane"])
			sim.units.append(gu)
			sim.mech.on_spawn(gu)
		return true
	if _v(u, "getawayAbility", false):
		u["pendingAbility"] = {"at": now + 300.0, "kind": "getaway"}
		sim.fx.append({"t": "zone", "x": u["x"], "y": u["y"], "r": 30.0, "kind": "cast", "dur": 0.3})
		return true
	if _v(u, "monsterAbility", false):
		u["lightningLinkActive"] = true
		u["lightningLinkEndTime"] = now + 4000.0
		return true
	u["lastAbilityTime"] = float(_v(u, "lastAbilityTime", 0.0)) - 0.0
	return false

func _finish(u: Dictionary, act: Dictionary) -> void:
	if u["hp"] <= 0:
		return
	match act["kind"]:
		"flight":
			u["baseType"] = u["type"]
			u["speed"] = float(u["baseSpeed"]) * (1.0 + float(_v(u, "heroFlightMoveBoost", 0.5)))
			u["type"] = "flying"
			u["heroFlightUntil"] = sim.now + float(_v(u, "heroFlightDuration", 5000))
			u["heroFlightShotsRemaining"] = int(_v(u, "heroFlightShots", 3))
		"triple":
			var retreat: float = float(_v(u, "heroRetreatDistance", 165))
			u["y"] = clampf(u["y"] + (-retreat if u["opp"] else retreat), 20.0, Sim.H - 20.0)
			u["lockedTarget"] = -1
			u["heroTripleShotReady"] = true
			u["heroTripleShotExpiresAt"] = sim.now + float(_v(u, "heroTripleShotDuration", 7000))
			var decoy_card := CardDB.get_card("magic_archer")
			var d := sim.make_unit(decoy_card, act["ox"], act["oy"], u["opp"], u["lane"])
			d["hp"] = floorf(u["maxHp"] * float(_v(u, "heroDecoyHpMultiplier", 1.185)))
			d["maxHp"] = d["hp"]
			d["speed"] = 0.0
			d["range"] = 0.0
			d["damage"] = 0.0
			d["projectile"] = null
			d["isHeroDecoy"] = true
			d["decoyExpireAt"] = sim.now + float(_v(u, "heroDecoyDuration", 7000))
			sim.units.append(d)
		"getaway":
			var dist_back := -200.0 if u["opp"] else 200.0
			u["y"] = clampf(u["y"] + dist_back, 10.0, Sim.H - 10.0)
			u["hidden"] = {"active": true, "until": sim.now + 1000.0}
			sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 30.0, "kind": "freeze"})

func _dash_step(u: Dictionary) -> void:
	var targets: Array = u["dashTargets"]
	while targets.size() > 0:
		var t: Variant = sim.unit_by_id(int(targets[0]))
		targets.pop_front()
		if t == null or t["hp"] <= 0:
			continue
		u["x"] = t["x"]
		u["y"] = t["y"]
		sim._apply_damage([{"id": t["id"], "dmg": float(_v(u, "damage", 0)) * 2.0, "attacker": u["id"]}])
		sim.fx.append({"t": "bolt", "x": t["x"], "y": t["y"]})
		return
	u["dashChainActive"] = false
	u["isDashing"] = false


## Ongoing effects of the hero abilities (shields, whirlwind ticks, storms, buffs ...).
func _enemies_in(u: Dictionary, r: float, towers: bool = false) -> Array:
	var out: Array = []
	for e in sim.units:
		if e["opp"] != u["opp"] and e["hp"] > 0 and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= r:
			out.append(e)
	if towers:
		for t in sim.towers:
			if t["opp"] != u["opp"] and t["hp"] > 0 and Sim.dist(t["x"], t["y"], u["x"], u["y"]) <= r + 25.0:
				out.append(t)
	return out

func _hit(u: Dictionary, e: Dictionary, dmg: float) -> void:
	if e.get("isTower", false):
		e["hp"] -= dmg
	else:
		sim._apply_damage([{"id": e["id"], "dmg": dmg, "attacker": u["id"]}])

func _tick_hero(u: Dictionary) -> void:
	var now := sim.now
	# Hero Knight: shield + taunt end after 5 s or when the shield breaks
	if float(_v(u, "shieldUntil", 0.0)) > 0.0 and (now >= float(u["shieldUntil"]) or u["currentShieldHp"] <= 0.0):
		u["shieldUntil"] = 0.0
		u["currentShieldHp"] = 0.0
		for e in sim.units:
			if int(_v(e, "tauntedBy", -1)) == u["id"]:
				e["tauntUntil"] = 0.0
	# Hero Valkyrie: Wild Whirlwind - 4 ticks per second around her
	if float(_v(u, "whirlUntil", 0.0)) > 0.0:
		if now >= float(u["whirlUntil"]):
			u["whirlUntil"] = 0.0
			u["damageReduction"] = 0.0
			u["speed"] = u["baseSpeed"]
		elif now >= float(_v(u, "whirlNext", 0.0)):
			u["whirlNext"] = now + 250.0
			for e in _enemies_in(u, float(_v(u, "heroWhirlRadius", 55)), true):
				_hit(u, e, float(_v(u, "heroWhirlTowerDamage", 47)) if e.get("isTower", false) else float(_v(u, "heroWhirlDamage", 97)))
			sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": float(_v(u, "heroWhirlRadius", 55)), "kind": "zap"})
	# Hero Berserker: Savage Survival ends -> restore stats
	if float(_v(u, "savageUntil", 0.0)) > 0.0 and now >= float(u["savageUntil"]):
		u["savageUntil"] = 0.0
		u["unkillableUntil"] = 0.0
		u["speed"] = u["baseSpeed"]
		u["attackSpeed"] = float(u["attackSpeed"]) * 3.0
		u["damage"] = float(u["damage"]) / 1.64
	# Hero Ice Golem: Snowstorm slows + chips everything around
	if float(_v(u, "stormUntil", 0.0)) > 0.0:
		if now >= float(u["stormUntil"]):
			u["stormUntil"] = 0.0
		elif now >= float(_v(u, "stormNext", 0.0)):
			u["stormNext"] = now + 500.0
			for e in _enemies_in(u, float(_v(u, "heroSnowRadius", 95)), true):
				if not e.get("isTower", false):
					e["slowUntil"] = now + 900.0
					e["slowAmount"] = float(_v(u, "heroSnowSlow", 0.4))
				_hit(u, e, float(_v(u, "heroSnowDps", 60)) * 0.5)
	# Hero Ice Wizard: Frosty Fella freezes everything near the snowman until it is destroyed
	if int(_v(u, "snowmanId", -1)) != -1:
		var sm: Variant = sim.unit_by_id(int(u["snowmanId"]))
		if sm == null or sm["hp"] <= 0 or now >= float(_v(u, "snowmanEnd", 0.0)):
			u["snowmanId"] = -1
		else:
			for e in _enemies_in(sm, float(_v(u, "heroFrostyRadius", 55))):
				e["stunUntil"] = maxf(e["stunUntil"], now + 400.0)
				e["frozenUntil"] = now + 400.0

## Called by the Mechanics damage path: the Monk reflects projectiles back at their shooter.
func reflect_projectile(p: Dictionary, target: Dictionary) -> bool:
	if not _v(target, "isReflecting", false) or sim.now >= float(_v(target, "reflectEndTime", 0)) or p.get("reflected", false):
		return false
	var r: Dictionary = p.duplicate(true)
	r["id"] = sim._new_id()
	r["targetId"] = int(p.get("attackerId", -1))
	r["attackerId"] = target["id"]
	r["opp"] = target["opp"]
	r["x"] = target["x"]
	r["y"] = target["y"]
	r["reflected"] = true
	var src: Variant = sim.target_by_id(int(r["targetId"]))
	if src == null:
		return true
	r["targetX"] = src["x"]
	r["targetY"] = src["y"]
	sim.projectiles.append(r)
	sim.fx.append({"t": "spell", "x": target["x"], "y": target["y"], "r": 30.0, "kind": "clone"})
	return true
