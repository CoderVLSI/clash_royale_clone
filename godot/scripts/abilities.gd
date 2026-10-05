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
	# Golden Knight dash chain: one hop per sim tick
	if _v(u, "dashChainActive", false):
		_dash_step(u)

func _use(u: Dictionary) -> bool:
	var now := sim.now
	var id := str(u["spriteId"])
	u["lastAbilityTime"] = now
	sim.fx.append({"t": "ability", "opp": u["opp"]})
	if _v(u, "heroFieryFlightAbility", false):
		var cast: float = float(_v(u, "heroCastDelay", 1000))
		u["stunUntil"] = maxf(u["stunUntil"], now + cast)
		u["pendingAbility"] = {"at": now + cast, "kind": "flight"}
		u["lastAbilityTime"] = now + cast + float(_v(u, "heroFlightDuration", 5000))
		sim.fx.append({"t": "zone", "x": u["x"], "y": u["y"], "r": 32.0, "kind": "cast", "dur": cast / 1000.0})
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
