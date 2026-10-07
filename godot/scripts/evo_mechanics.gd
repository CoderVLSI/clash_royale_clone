class_name EvoMechanics
extends RefCounted
## Evolution-specific behaviour (the evolved_* cards). Numbers come straight from the card data in
## cards.json (the same keys App.js reads); behaviours follow the app's implementations and the
## wiki specs referenced by its commits.

var sim: Sim
var mech: Mechanics

func _init(s: Sim, m: Mechanics) -> void:
	sim = s
	mech = m

static func _v(d: Dictionary, k: String, dv: Variant = 0) -> Variant:
	return Sim._v(d, k, dv)

func _delayed_zone(kind: String, x: float, y: float, opp: bool, delay: float, extra: Dictionary) -> void:
	var z := {"kind": kind, "x": x, "y": y, "opp": opp, "card": {}, "end": sim.now + delay, "interval": 999999.0, "last": sim.now, "r": 30.0}
	z.merge(extra, true)
	sim.zones.append(z)

# ---- spawn -----------------------------------------------------------------------------------
func on_spawn(u: Dictionary) -> void:
	# Evolved Cannon: bomb rain on deploy
	var rain: int = int(_v(u, "deployBombRainCount", 0))
	if rain > 0:
		for i in rain:
			var a := sim.rng.randf() * TAU
			var r := sqrt(sim.rng.randf()) * 80.0
			_delayed_zone("bomb", u["x"] + cos(a) * r, u["y"] + sin(a) * r, u["opp"], 300.0 + i * 90.0,
				{"r": float(_v(u, "deployBombRainRadius", 40)), "dmg": float(_v(u, "deployBombRainDamage", 100))})
	# Evolved Skeleton Army: one tougher general among the skeletons
	if _v(u, "skeletonGeneral", false) and not sim.get_meta("general_spawned_%d" % int(sim.now), false):
		sim.set_meta("general_spawned_%d" % int(sim.now), true)
		u["hp"] = float(_v(u, "skeletonGeneralHp", 650))
		u["maxHp"] = u["hp"]
		u["isSkeletonGeneral"] = true
	# Evolved Goblin Giant etc: remember spawn position for path-progress effects
	u["spawnY"] = u["y"]
	if str(u["spriteId"]) == "evolved_skeleton_barrel":
		u["barrelDropped"] = false
	if str(u["spriteId"]) == "goblinstein":
		_link_monster(u)

func _link_monster(u: Dictionary) -> void:
	var mc := CardDB.get_card("goblinstein_monster")
	if mc.is_empty():
		return
	var off := 60.0 if u["opp"] else -60.0
	var m := sim.make_unit(mc, u["x"], u["y"] + off, u["opp"], u["lane"])
	m["isMonster"] = true
	m["doctorId"] = u["id"]
	u["monsterId"] = m["id"]
	sim.units.append(m)

# ---- per-tick --------------------------------------------------------------------------------
func update(u: Dictionary) -> void:
	var now := sim.now
	# Evolved Minion Horde (~): the bigger the surviving swarm, the faster each minion attacks
	var swarm: float = float(_v(u, "swarmBonus", 0.0))
	if swarm > 0.0:
		if not u.has("baseAttackSpeed"):
			u["baseAttackSpeed"] = float(u["attackSpeed"])
		var mates := 0
		for m in sim.units:
			if m["opp"] == u["opp"] and m["hp"] > 0 and m["cid"] == u["cid"]:
				mates += 1
		u["attackSpeed"] = float(u["baseAttackSpeed"]) * maxf(0.65, 1.0 - swarm * float(mates - 1))
	# Evolved Electro Giant (~): chain lightning to the nearest enemies every few seconds
	var chain_every: float = float(_v(u, "chainEvery", 0.0))
	if chain_every > 0.0 and now - float(_v(u, "lastChain", 0.0)) >= chain_every:
		var near: Array = []
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= 95.0:
				near.append(e)
		if not near.is_empty():
			u["lastChain"] = now
			near.sort_custom(func(a, b): return Sim.dist(a["x"], a["y"], u["x"], u["y"]) < Sim.dist(b["x"], b["y"], u["x"], u["y"]))
			for e in near.slice(0, int(_v(u, "chainTargets", 3))):
				sim._apply_damage([{"id": e["id"], "dmg": float(_v(u, "chainDamage", 150)), "attacker": u["id"]}])
				e["stunUntil"] = maxf(e["stunUntil"], now + float(_v(u, "chainStun", 0.5)) * 1000.0)
				sim.fx.append({"t": "bolt", "x": e["x"], "y": e["y"]})
	# Evolved Goblin Giant: spawns goblins when low on HP
	var thr: float = float(_v(u, "lowHpSpawnThreshold", 0))
	if thr > 0.0 and u["hp"] < u["maxHp"] * thr and now - float(_v(u, "lastLowSpawn", 0.0)) >= float(_v(u, "lowHpSpawnInterval", 2000)):
		u["lastLowSpawn"] = now
		var gc := CardDB.get_card(str(u["lowHpSpawnCardId"]))
		if not gc.is_empty():
			var back := -float(_v(u, "lowHpSpawnOffset", 40)) if not u["opp"] else float(_v(u, "lowHpSpawnOffset", 40))
			sim.units.append(sim.make_unit(gc, u["x"], u["y"] - back, u["opp"], u["lane"]))
			sim.mech.on_spawn(sim.units[sim.units.size() - 1])
	# Evolved Baby Dragon: draft aura (allies speed up, enemies slow down)
	var dr: float = float(_v(u, "draftRadius", 0))
	if dr > 0.0:
		_draft(u["x"], u["y"], dr, u["opp"], float(_v(u, "draftAllySpeedBoost", 0.35)), float(_v(u, "draftEnemySlow", 0.35)))
	# Evolved Goblin Cage: drag enemy troops toward the cage
	if _v(u, "dragTroopsIntoCage", false):
		var rad: float = float(_v(u, "dragRadius", 40))
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and e["type"] == "ground" and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= rad * 2.0:
				var d := Sim.dist(e["x"], e["y"], u["x"], u["y"])
				if d > 6.0:
					e["x"] += (u["x"] - e["x"]) / d * float(_v(u, "dragStrength", 5)) * 0.3
					e["y"] += (u["y"] - e["y"]) / d * float(_v(u, "dragStrength", 5)) * 0.3
	# Evolved Skeleton Barrel: drops skeletons at 75% of the way
	if str(u["spriteId"]) == "evolved_skeleton_barrel" and not u["barrelDropped"]:
		var total := absf((Sim.H - u["spawnY"]) if not u["opp"] else u["spawnY"])
		var gone := absf(u["y"] - u["spawnY"])
		if total > 0.0 and gone / maxf(1.0, Sim.H * 0.7) >= 0.5:
			u["barrelDropped"] = true
			mech._spawn_group(CardDB.get_card("skeletons"), 3, u["x"], u["y"], u["opp"])
	# Baby draft aura lingering after death handled in on_death
	# Hero decoy expiry
	if _v(u, "isHeroDecoy", false) and now >= float(_v(u, "decoyExpireAt", INF)):
		u["hp"] = 0.0

func _draft(x: float, y: float, r: float, opp: bool, ally_boost: float, enemy_slow: float) -> void:
	for e in sim.units:
		if e["hp"] <= 0 or Sim.dist(e["x"], e["y"], x, y) > r:
			continue
		if e["opp"] == opp:
			e["rageUntil"] = maxf(float(_v(e, "rageUntil", 0.0)), sim.now + 250.0)
			e["rageBoost"] = maxf(float(_v(e, "rageBoost", 0.0)), ally_boost)
		else:
			e["slowUntil"] = maxf(e["slowUntil"], sim.now + 250.0)
			e["slowAmount"] = maxf(e["slowAmount"], enemy_slow)

# ---- damage dealt ----------------------------------------------------------------------------
func modify_damage(u: Dictionary, _target: Dictionary, damage: float, tdist: float) -> float:
	var d := damage
	if float(_v(u, "closeRangeDamageMultiplier", 0)) > 0.0 and tdist <= float(_v(u, "closeRangeThreshold", 0)):
		d = floorf(d * float(u["closeRangeDamageMultiplier"]))
	if _v(u, "barrelExploded", false) and float(_v(u, "runningDamageMultiplier", 0)) > 0.0:
		d = floorf(float(u["damage"]) * float(u["runningDamageMultiplier"]))
	var fs: float = float(_v(u, "fourthStageAfter", 0))
	if fs > 0.0 and (sim.now - float(_v(u, "lastRampTime", sim.now))) >= fs:
		d = floorf(d * float(_v(u, "fourthStageMultiplier", 2)))
	if float(_v(u, "lightningDamageBuff", 0)) > 0.0:
		d = floorf(d * (1.0 + float(u["lightningDamageBuff"])))
	return d

func on_attack(u: Dictionary, target: Dictionary, damage: float, dmg: Array, splash: Array) -> void:
	var now := sim.now
	# Evolved Barbarians: attack boost
	if _v(u, "boostOnAttack", false):
		u["rageUntil"] = now + float(_v(u, "boostDuration", 3000))
		u["rageBoost"] = float(_v(u, "boostAmount", 0.35))
	# Evolved Bats: self-heal on hit (can overheal)
	var sh: float = float(_v(u, "selfHealOnAttack", 0))
	if sh > 0.0:
		u["hp"] = minf(float(_v(u, "overhealMaxHp", u["maxHp"])), u["hp"] + sh)
	# Evolved Royal Giant: recoil blast
	if _v(u, "recoilBlastOnAttack", false):
		splash.append({"x": u["x"], "y": u["y"], "r": float(_v(u, "recoilBlastRadius", 40)), "dmg": float(_v(u, "recoilBlastDamage", 80)), "opp": u["opp"],
			"skip_id": -1, "tower_factor": 1.0, "attacker": u["id"], "ground_only": true, "knockback": float(_v(u, "recoilBlastKnockback", 16))})
	# Evolved Mortar: spawns a goblin where the shell lands
	if u.get("spawnOnAttackCardId") != null:
		var gc := CardDB.get_card(str(u["spawnOnAttackCardId"]))
		_delayed_zone("spawn_at", target["x"], target["y"], u["opp"], float(_v(u, "spawnOnAttackDelay", 700)), {"spawn_card": gc, "count": int(_v(u, "spawnOnAttackCount", 1))})
	# Evolved Valkyrie: tornado on every spin
	if _v(u, "tornadoOnAttack", false):
		sim.zones.append({"kind": "tornado", "x": u["x"], "y": u["y"], "opp": u["opp"],
			"card": {"duration": float(_v(u, "tornadoDuration", 500)) / 1000.0, "damage": float(_v(u, "tornadoDamage", 44))},
			"r": float(_v(u, "tornadoRadius", 88)), "end": now + float(_v(u, "tornadoDuration", 500)), "interval": 170.0, "last": now})
	# Evolved Mega Knight: uppercut
	if float(_v(u, "uppercutKnockback", 0)) > 0.0 and not target.has("isTower"):
		splash.append({"x": target["x"], "y": target["y"], "r": 18.0, "dmg": 0.0, "opp": u["opp"], "skip_id": -1, "tower_factor": 0.0, "attacker": u["id"],
			"ground_only": true, "knockback": float(u["uppercutKnockback"])})
	# Evolved Hunter: root the target
	if float(_v(u, "rootOnAttackDuration", 0)) > 0.0 and not target.has("isTower") and now - float(_v(u, "lastRootTime", -99999.0)) >= float(_v(u, "rootOnAttackCooldown", 5000)):
		u["lastRootTime"] = now
		target["rootUntil"] = now + float(u["rootOnAttackDuration"])
	# Evolved Royal Hogs: fall damage on first landing
	if _v(u, "flyingSpawn", false) and not _v(u, "hasFallen", false):
		u["hasFallen"] = true
		splash.append({"x": u["x"], "y": u["y"], "r": float(_v(u, "fallDamageRadius", 30)), "dmg": float(_v(u, "fallDamageAmount", 100)), "opp": u["opp"],
			"skip_id": -1, "tower_factor": 1.0, "attacker": u["id"], "ground_only": true, "stun": float(_v(u, "fallStunDuration", 0.3)), "tower_hit": true})
	# Evolved Skeletons: each hit may add another skeleton (capped)
	var cap: int = int(_v(u, "spawnOnHitCap", 0))
	if cap > 0 and int(_v(u, "spawnedOnHit", 0)) < cap:
		u["spawnedOnHit"] = int(_v(u, "spawnedOnHit", 0)) + 1
		var sk := CardDB.get_card("skeletons")
		var s := sim.make_unit(sk, u["x"] + sim.rng.randf_range(-12.0, 12.0), u["y"] + sim.rng.randf_range(-12.0, 12.0), u["opp"], u["lane"])
		s["hp"] = 1.0
		s["maxHp"] = 1.0
		sim.units.append(s)
	# Evolved Ice Spirit: big freeze now + delayed second freeze
	if float(_v(u, "freezeRadius", 0)) > 0.0 and u["hp"] <= 0.0:
		_freeze_area(target["x"], target["y"], float(u["freezeRadius"]), float(_v(u, "freezeDuration", 1)) * 1000.0, u["opp"])
		_delayed_zone("freeze_at", target["x"], target["y"], u["opp"], float(_v(u, "delayedFreezeDelay", 3000)),
			{"r": float(_v(u, "delayedFreezeRadius", 32)), "dur": float(_v(u, "delayedFreezeDuration", 1100))})
	# Evolved Goblin Giant: extra spear volleys
	var extra: int = int(_v(u, "extraProjectiles", 0))
	if extra > 0:
		var sp := CardDB.get_card("spear_goblins")
		for i in extra:
			sim.projectiles.append({"id": sim._new_id(), "x": u["x"] - 20.0 + i * 40.0, "y": u["y"] - 10.0, "targetId": target["id"], "targetX": target["x"], "targetY": target["y"],
				"speed": 12.0, "damage": float(_v(sp, "damage", 81)), "type": "spear", "splash": false, "attackerId": u["id"], "opp": u["opp"]})
	# Evolved Wall Breakers: first blast is a small barrel explosion, then they run on
	if _v(u, "barrelExplosionFirst", false) and not _v(u, "barrelExploded", false):
		u["barrelExploded"] = true
		u["hp"] = maxf(u["hp"], 1.0)
		splash.append({"x": u["x"], "y": u["y"], "r": float(_v(u, "barrelExplosionRadius", 30)), "dmg": float(_v(u, "barrelExplosionDamage", 150)), "opp": u["opp"],
			"skip_id": -1, "tower_factor": 1.0, "attacker": u["id"], "ground_only": false, "tower_hit": true})
		u["lastAttack"] = now
	# Evolved Battle Ram: knockback on charge hit
	if float(_v(u, "chargeKnockback", 0)) > 0.0 and not target.has("isTower"):
		splash.append({"x": target["x"], "y": target["y"], "r": 20.0, "dmg": 0.0, "opp": u["opp"], "skip_id": -1, "tower_factor": 0.0, "attacker": u["id"],
			"ground_only": true, "knockback": float(u["chargeKnockback"])})
	# Evolved Dart Goblin: poison stacks
	if _v(u, "poisonEffect", false) and not target.has("isTower"):
		target["poisonStacks"] = int(_v(target, "poisonStacks", 0)) + 1
		var st: int = target["poisonStacks"]
		var level := 1
		if st >= int(_v(u, "poisonStackLevel3", 7)):
			level = 3
		elif st >= int(_v(u, "poisonStackLevel2", 4)):
			level = 2
		if level > 1:
			dmg.append({"id": target["id"], "dmg": float(_v(u, "poisonTrailDamage", 50)) * (level - 1), "attacker": u["id"]})
	# Evolved Bomber: bounce bombs
	var bounces: int = int(_v(u, "bounceBombCount", 0))
	if bounces > 0:
		var ang := atan2(target["y"] - u["y"], target["x"] - u["x"])
		for i in range(1, bounces + 1):
			_delayed_zone("bomb", target["x"] + cos(ang) * float(_v(u, "bounceSpacing", 40)) * i, target["y"] + sin(ang) * float(_v(u, "bounceSpacing", 40)) * i, u["opp"],
				220.0 * i, {"r": float(_v(u, "bounceRadius", 40)), "dmg": damage})

func _freeze_area(x: float, y: float, r: float, dur: float, opp: bool) -> void:
	for e in sim.units:
		if e["opp"] != opp and e["hp"] > 0 and Sim.dist(e["x"], e["y"], x, y) <= r:
			e["stunUntil"] = maxf(e["stunUntil"], sim.now + dur)
			e["frozenUntil"] = sim.now + dur
	for t in sim.towers:
		if t["opp"] != opp and t["hp"] > 0 and Sim.dist(t["x"], t["y"], x, y) <= r + 30.0:
			t["stunUntil"] = sim.now + dur
	sim.fx.append({"t": "spell", "x": x, "y": y, "r": r, "kind": "freeze"})

# ---- projectile modifiers --------------------------------------------------------------------
func on_ranged_attack(u: Dictionary, target: Dictionary, damage: float, proj: Dictionary) -> void:
	# Evolved Princess: icy arrow on the first attack and after every third one (slows the target)
	var icy: int = int(_v(u, "icyArrowEvery", 0))
	if icy > 0:
		var cnt: int = int(_v(u, "icyCount", 0))
		if cnt % icy == 0:
			proj["slow"] = 0.35
			proj["slowDuration"] = 3.0
			proj["icy"] = true
		u["icyCount"] = cnt + 1
	# Evolved Elite Barbarians: rage-tipped spear leaves an enraging patch where it lands
	if _v(u, "rageSpear", false):
		proj["rageTrail"] = true
	proj["chain"] = int(_v(u, "chain", 0))
	proj["infiniteChain"] = _v(u, "infiniteChain", false)
	proj["chainDecay"] = float(_v(u, "chainDecay", 0.4))
	proj["chainRange"] = float(_v(u, "chainRange", 60))
	# Executioner-style boomerang: travels through enemies and returns
	if _v(u, "boomerang", false):
		var ang := atan2(target["y"] - u["y"], target["x"] - u["x"])
		var reach := float(_v(u, "range", 70)) + 30.0
		proj["boomerang"] = true
		proj["originX"] = u["x"]
		proj["originY"] = u["y"]
		proj["returning"] = false
		proj["hitIds"] = {}
		proj["targetId"] = -1
		proj["targetX"] = u["x"] + cos(ang) * reach
		proj["targetY"] = u["y"] + sin(ang) * reach
		proj["splash"] = false
		proj["pierce"] = true
		proj["knockback"] = float(_v(u, "closeRangeKnockback", 0)) if float(_v(u, "closeRangeDamageMultiplier", 0)) > 0.0 and Sim.dist(u["x"], u["y"], target["x"], target["y"]) <= float(_v(u, "closeRangeThreshold", 0)) else 0.0
	# Hero Magic Archer: 3 piercing arrows while triple shot is armed
	if _v(u, "heroTripleShotReady", false):
		var base := atan2(target["y"] - u["y"], target["x"] - u["x"])
		var n: int = int(_v(u, "heroTripleShotCount", 3))
		var travel: float = float(_v(u, "heroTripleShotTravelDistance", 310))
		sim.projectiles.erase(proj)
		for i in n:
			var off := 0.0 if n == 1 else -0.12 + 0.24 * i / (n - 1)
			var pj := proj.duplicate()
			pj["id"] = sim._new_id()
			pj["targetId"] = -1
			pj["targetX"] = u["x"] + cos(base + off) * travel
			pj["targetY"] = u["y"] + sin(base + off) * travel
			pj["damage"] = maxf(1.0, floorf(damage / n))
			pj["pierce"] = true
			pj["hitIds"] = {}
			pj["splash"] = false
			sim.projectiles.append(pj)
		u["heroTripleShotReady"] = false
	# Hero Wizard flight shots: small tornado along the flight
	if int(_v(u, "heroFlightShotsRemaining", 0)) > 0 and str(u.get("projectile", "")) == "fireball_small":
		u["heroFlightShotsRemaining"] = int(u["heroFlightShotsRemaining"]) - 1
		sim.zones.append({"kind": "tornado", "x": target["x"], "y": target["y"], "opp": u["opp"],
			"card": {"duration": float(_v(u, "heroFlightTornadoDuration", 0.5)), "damage": float(_v(u, "heroFlightTornadoTroopTickDamage", 43)) * 3.0},
			"r": float(_v(u, "heroFlightTornadoRadius", 40)), "end": sim.now + float(_v(u, "heroFlightTornadoDuration", 0.5)) * 1000.0, "interval": 170.0, "last": sim.now})
	# Evolved Musketeer: two follow-up sniper shots
	if int(_v(u, "sniperShots", 0)) > 1:
		for i in range(1, int(u["sniperShots"])):
			_delayed_zone("snipe", target["x"], target["y"], u["opp"], float(_v(u, "sniperShotDelay", 0.4)) * 1000.0 * i,
				{"target_id": target["id"], "dmg": float(_v(u, "sniperDamage", damage)), "attacker": u["id"]})
	# Evolved Firecracker: spread of rockets + recoil + poison trail
	if int(_v(u, "spreadCount", 0)) > 0:
		sim.projectiles.erase(proj)
		var n2: int = int(u["spreadCount"])
		var arc: float = float(_v(u, "spreadArc", 0.5))
		var base2 := atan2(target["y"] - u["y"], target["x"] - u["x"])
		for i in n2:
			var a := base2 - arc / 2.0 + arc * i / maxf(1.0, n2 - 1.0)
			var pj2 := proj.duplicate()
			pj2["id"] = sim._new_id()
			pj2["targetId"] = -1
			pj2["targetX"] = u["x"] + cos(a) * 200.0
			pj2["targetY"] = u["y"] + sin(a) * 200.0
			pj2["damage"] = floorf(damage / n2)
			pj2["splash"] = true
			pj2["splashRadius"] = 25.0
			sim.projectiles.append(pj2)
	if float(_v(u, "recoil", 0)) > 0.0:
		var back := atan2(u["y"] - target["y"], u["x"] - target["x"])
		var nx: float = u["x"] + cos(back) * float(u["recoil"])
		var ny: float = u["y"] + sin(back) * float(u["recoil"])
		if absf(ny - Sim.RIVER_Y) < 25.0 and not (absf(nx - Sim.BRIDGE_L) < 30.0 or absf(nx - Sim.BRIDGE_R) < 30.0):
			ny = Sim.RIVER_Y + (-25.0 if u["y"] < Sim.RIVER_Y else 25.0)
		u["x"] = clampf(nx, 10.0, Sim.W - 10.0)
		u["y"] = clampf(ny, 10.0, Sim.H - 10.0)

func on_projectile_hit(p: Dictionary, tgt: Variant, dmg: Array, _splash: Array) -> void:
	if p.get("rageTrail", false):
		var cx: float = float(p.get("targetX", 0.0))
		var cy: float = float(p.get("targetY", 0.0))
		if tgt != null:
			cx = tgt["x"]
			cy = tgt["y"]
		sim.zones.append({"kind": "rage", "x": cx, "y": cy, "opp": p["opp"], "card": {}, "r": 34.0, "end": sim.now + 3500.0, "boost": 0.35, "interval": 100.0, "last": sim.now})
		sim.fx.append({"t": "zone", "x": cx, "y": cy, "r": 34.0, "kind": "rage", "dur": 3.5})
	# Chain lightning (Electro Dragon & evolved infinite chain)
	var chain := int(p.get("chain", 0))
	if chain > 0 and tgt != null and not tgt.has("isTower") and p.get("attackerId", -1) != -1:
		var infinite: bool = p.get("infiniteChain", false)
		var count: int = 999 if infinite else mini(chain - 1, 3)
		var cur_dmg: float = p["damage"]
		var chained: Array = [tgt]
		var rng_px: float = float(p.get("chainRange", 60)) if infinite else 80.0
		while count > 0 and cur_dmg > 10.0:
			var last: Dictionary = chained[chained.size() - 1]
			var best: Variant = null
			var bd := INF
			for e in sim.units:
				if e["opp"] == p["opp"] or e["hp"] <= 0 or chained.has(e):
					continue
				var d := Sim.dist(e["x"], e["y"], last["x"], last["y"])
				if d < bd and d < rng_px:
					bd = d
					best = e
			if best == null:
				break
			chained.append(best)
			count -= 1
			if infinite:
				cur_dmg = floorf(cur_dmg * float(p.get("chainDecay", 0.4)))
		var hop: float = float(p["damage"])
		for i in range(1, chained.size()):
			if infinite and i > 1:
				hop = floorf(hop * float(p.get("chainDecay", 0.4)))
			if hop > 0:
				dmg.append({"id": chained[i]["id"], "dmg": hop, "attacker": p["attackerId"], "stun": float(p.get("stun", 0.0))})
			sim.fx.append({"t": "bolt", "x": chained[i]["x"], "y": chained[i]["y"]})
	# Evolved Snowball: pull enemies toward the impact
	var card = p.get("card")
	if card is Dictionary and float(_v(card, "pullDistance", 0)) > 0.0:
		pass

# ---- death -----------------------------------------------------------------------------------
func on_death(d: Dictionary) -> void:
	# Evolved Lumberjack: a damaging ghost lingers
	if _v(d, "deathSpawnsGhost", false):
		sim.zones.append({"kind": "poison", "x": d["x"], "y": d["y"], "opp": d["opp"], "card": {}, "r": 55.0, "dmg": float(_v(d, "ghostDps", 80)),
			"end": sim.now + float(_v(d, "ghostDuration", 8)) * 1000.0, "interval": 1000.0, "last": sim.now})
		sim.fx.append({"t": "zone", "x": d["x"], "y": d["y"], "r": 55.0, "kind": "curse", "dur": float(_v(d, "ghostDuration", 8))})
	# Evolved Baby Dragon: draft lingers
	if float(_v(d, "draftLingerDuration", 0)) > 0.0:
		sim.zones.append({"kind": "draft", "x": d["x"], "y": d["y"], "opp": d["opp"], "card": {}, "r": float(_v(d, "draftRadius", 72)),
			"boost": float(_v(d, "draftAllySpeedBoost", 0.35)), "slow": float(_v(d, "draftEnemySlow", 0.35)),
			"end": sim.now + float(d["draftLingerDuration"]) * 1000.0, "interval": 100.0, "last": sim.now})
	# Evolved Witch: heal when her summons die
	if d.get("summonerId") != null:
		var w: Variant = sim.unit_by_id(int(d["summonerId"]))
		if w != null and w["hp"] > 0 and float(_v(w, "healFromSummonsDeath", 0)) > 0.0:
			w["hp"] = minf(float(_v(w, "overhealMaxHp", w["maxHp"])), w["hp"] + float(w["healFromSummonsDeath"]))
	# Evolved PEKKA / healOnKill
	if d.get("lastHitBy") != null:
		var k: Variant = sim.unit_by_id(int(d["lastHitBy"]))
		if k != null and k["hp"] > 0 and float(_v(k, "healOnKillRatio", 0)) > 0.0:
			var heal := maxf(1.0, floorf(float(_v(d, "maxHp", 1)) * float(k["healOnKillRatio"])))
			k["hp"] = minf(float(_v(k, "overhealMaxHp", k["maxHp"])), k["hp"] + heal)
	# Skeleton King collects souls from every death
	for e in sim.units:
		if _v(e, "collectsSouls", false) and e["hp"] > 0 and e["id"] != d["id"]:
			e["souls"] = mini(int(_v(e, "souls", 0)) + 1, 10)

# ---- zones ------------------------------------------------------------------------------------
func tick_zone(z: Dictionary) -> bool:
	## Returns true when it handled the zone kind (and whether to keep it via z["keep"]).
	var now := sim.now
	match z["kind"]:
		"spawn_at":
			if now < z["end"]:
				z["keep"] = true
			else:
				mech._spawn_group(z["spawn_card"], int(z["count"]), z["x"], z["y"], z["opp"])
				z["keep"] = false
			return true
		"freeze_at":
			if now < z["end"]:
				z["keep"] = true
			else:
				_freeze_area(z["x"], z["y"], z["r"], z["dur"], z["opp"])
				z["keep"] = false
			return true
		"snipe":
			if now < z["end"]:
				z["keep"] = true
			else:
				var t: Variant = sim.target_by_id(int(z["target_id"]))
				if t != null and t["hp"] > 0:
					if t.has("isTower"):
						t["hp"] -= z["dmg"]
					else:
						sim._apply_damage([{"id": t["id"], "dmg": z["dmg"], "attacker": z["attacker"]}])
					sim.fx.append({"t": "impact", "x": t["x"], "y": t["y"], "kind": "bullet"})
				z["keep"] = false
			return true
		"draft":
			if now >= z["end"]:
				z["keep"] = false
			else:
				_draft(z["x"], z["y"], z["r"], z["opp"], z["boost"], z["slow"])
				z["keep"] = true
			return true
	return false
