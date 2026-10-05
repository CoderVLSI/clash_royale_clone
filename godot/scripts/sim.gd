class_name Sim
extends RefCounted
## Pure battle simulation, ported from the App.js game loop (no rendering).
## Coordinates are the original 2D pixel space (W x H, y grows DOWN, player at the bottom);
## the 3D view maps x -> X and y -> Z. Time is in milliseconds and the sim steps at the
## original fixed ~15 Hz tick (66 ms). Unit/tower/projectile state is kept in Dictionaries
## that copy the card's original field names so card data and mechanics stay 1:1 with App.js.

const W := 390.0
const H := 844.0
const RIVER_Y := 422.0
const BRIDGE_L := 95.0
const BRIDGE_R := 295.0
const TICK_MS := 66.0

const KING_RANGE := 180.0
const TOWER_RANGE := 150.0
const FIRE_RATE_PRINCESS := 800.0
const FIRE_RATE_KING := 1000.0
const PROJECTILE_SPEED_ARROW := 12.0
const PROJECTILE_SPEED_CANNON := 8.0
const TOWER_DECAY_RATE := 50.0
const SPELL_TOWER_FACTOR := 0.3   # spells deal 30% to towers (App.js zap/lightning)
const CHARGE_TILE_PX := 20.0      # TILE_SIZE; charge.threshold is expressed in tiles

const TOWER_TYPES := {
	"princess": {"hp": 2500, "damage": 125, "fireRate": 800, "projectile": "arrow", "speed": 15, "splash": false},
	"cannoneer": {"hp": 1800, "damage": 200, "fireRate": 1600, "projectile": "bomb", "speed": 10, "splash": true, "splashRadius": 40},
	"royal_chef": {"hp": 3918, "damage": 158, "fireRate": 1000, "projectile": "melee", "speed": 0, "splash": false, "range": 50, "pancakeCookTime": 28000},
	"dagger_duchess": {"hp": 2768, "damage": 110, "fireRate": 350, "projectile": "dagger", "speed": 12, "splash": false, "maxAmmo": 8, "reloadTime": 1200},
}

var rng := RandomNumberGenerator.new()
var now: float = 0.0
var towers: Array = []
var units: Array = []
var projectiles: Array = []
var zones: Array = []          # persistent area effects (poison, rage, ...)
var fx: Array = []             # one-shot events for the 3D view / audio, drained by the view
var next_id: int = 100

var players: Array = []        # [0] = human (bottom), [1] = AI (top)
var ai_enabled: Array = [false, true]
var ai_interval: float = 1500.0

var time_left: int = 180
var second_acc: float = 0.0
var is_double := false
var is_overtime := false
var is_decay := false
var game_over: String = ""     # "", "VICTORY", "DEFEAT", "DRAW"
var score: Array = [0, 0]      # [opponent towers destroyed, player towers destroyed]

var mech: Mechanics

func _init(player_deck: Array, enemy_deck: Array, player_tower: String = "princess", seed_value: int = -1) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()
	players = [_make_player(player_deck), _make_player(enemy_deck)]
	_build_towers(player_tower)
	mech = Mechanics.new(self)

static func _v(d: Dictionary, k: String, dv: Variant = 0) -> Variant:
	var x = d.get(k)
	return dv if x == null else x

func _make_player(deck: Array) -> Dictionary:
	var d := deck.duplicate()
	return {
		"elixir": 5.0, "deck": d, "hand": d.slice(0, 4), "next": d[4], "queue": d.slice(5, 8),
		"last_played": {}, "cycles": {}, "evo_slots": [], "hero_slot": null,
	}

func _build_towers(player_tower: String) -> void:
	var pt: Dictionary = TOWER_TYPES.get(player_tower, TOWER_TYPES["princess"])
	towers = [
		_tower(0, "king", true, "king", 4000, W / 2, 80, KING_RANGE, {}),
		_tower(1, "princess", true, "princess", 2500, 70, 150, TOWER_RANGE, TOWER_TYPES["princess"]),
		_tower(2, "princess", true, "princess", 2500, W - 70, 150, TOWER_RANGE, TOWER_TYPES["princess"]),
		_tower(3, "king", false, "king", 4000, W / 2, H - 80, KING_RANGE, {}),
		_tower(4, "princess", false, player_tower, pt["hp"], 70, H - 150, TOWER_RANGE, pt),
		_tower(5, "princess", false, player_tower, pt["hp"], W - 70, H - 150, TOWER_RANGE, pt),
	]

func _tower(id: int, type: String, opp: bool, sub: String, hp: float, x: float, y: float, rng_px: float, stats: Dictionary) -> Dictionary:
	var t := {
		"id": id, "type": type, "towerSubType": sub, "opp": opp, "hp": hp, "maxHp": hp, "x": x, "y": y,
		"range": stats.get("range", rng_px), "lastShot": 0.0, "lockedTarget": -1,
		"damage": stats.get("damage", 125), "fireRate": stats.get("fireRate", FIRE_RATE_KING if type == "king" else FIRE_RATE_PRINCESS),
		"projectileType": stats.get("projectile", "cannon" if type == "king" else "arrow"),
		"projectileSpeed": stats.get("speed", PROJECTILE_SPEED_CANNON if type == "king" else PROJECTILE_SPEED_ARROW),
		"splash": stats.get("splash", false), "splashRadius": stats.get("splashRadius", 0),
		"stunUntil": 0.0, "isTower": true,
	}
	if stats.has("maxAmmo"):
		t["maxAmmo"] = stats["maxAmmo"]
		t["currentAmmo"] = stats["maxAmmo"]
		t["reloadTime"] = stats["reloadTime"]
		t["lastReload"] = 0.0
	return t

# --------------------------------------------------------------------------- main step

func step() -> void:
	if game_over != "":
		return
	now += TICK_MS
	_tick_clock()
	if game_over != "":
		return
	_tick_elixir()
	_check_crowns_and_decay()
	if game_over != "":
		return
	mech.pre_update()
	var dmg: Array = []        # queued unit damage events {id, dmg, attacker}
	var splash: Array = []     # queued area events
	_update_towers(dmg)
	for u in units.duplicate():
		if u["hp"] > 0:
			_update_unit(u, dmg, splash)
	_update_projectiles(dmg, splash)
	_update_zones(dmg, splash)
	for s in splash:
		_apply_splash(s, dmg)
	_apply_damage(dmg)
	_reap_dead()
	mech.post_update()
	_tick_ai()

func _tick_clock() -> void:
	second_acc += TICK_MS
	while second_acc >= 1000.0 and game_over == "":
		second_acc -= 1000.0
		time_left -= 1
		if time_left == 60 and not is_double and not is_overtime:
			is_double = true
			fx.append({"t": "alert", "msg": "DOUBLE ELIXIR!"})
		if time_left <= 0 and time_left > -1000:
			_clock_expired()

func _clock_expired() -> void:
	var p_stand := 0
	var o_stand := 0
	var p_dead := 0
	var o_dead := 0
	for t in towers:
		if t["opp"]:
			if t["hp"] > 0: o_stand += 1
			else: o_dead += 1
		else:
			if t["hp"] > 0: p_stand += 1
			else: p_dead += 1
	if not is_overtime and not is_decay:
		if p_stand == o_stand and p_dead == 0 and o_dead == 0:
			is_overtime = true
			time_left = 60
			fx.append({"t": "alert", "msg": "OVERTIME!"})
			return
	elif is_overtime and not is_decay:
		if p_stand == o_stand and p_dead == o_dead:
			is_decay = true
			time_left = -1
			fx.append({"t": "alert", "msg": "TOWER DECAY!"})
			return
	if is_decay:
		return
	_finish_by_hp()

func _finish_by_hp() -> void:
	var p_hp := 0.0
	var o_hp := 0.0
	for t in towers:
		if t["opp"]: o_hp += maxf(0.0, t["hp"])
		else: p_hp += maxf(0.0, t["hp"])
	game_over = "VICTORY" if p_hp > o_hp else ("DEFEAT" if o_hp > p_hp else "DRAW")

func _tick_elixir() -> void:
	var gain := (0.0007 if is_double else 0.00035) * TICK_MS
	for p in players:
		p["elixir"] = minf(10.0, p["elixir"] + gain)

func _check_crowns_and_decay() -> void:
	var od := 0
	var pd := 0
	for t in towers:
		if t["hp"] <= 0:
			if t["opp"]: od += 1
			else: pd += 1
	if towers[3]["hp"] <= 0:
		game_over = "DEFEAT"
		return
	if towers[0]["hp"] <= 0:
		game_over = "VICTORY"
		return
	if is_overtime and not is_decay:
		if od > score[0]:
			game_over = "VICTORY"
			return
		if pd > score[1]:
			game_over = "DEFEAT"
			return
	score = [od, pd]
	if is_decay:
		for t in towers:
			if t["hp"] > 0:
				t["hp"] = maxf(0.0, t["hp"] - TOWER_DECAY_RATE)
				if t["hp"] == 0.0:
					game_over = "VICTORY" if t["opp"] else "DEFEAT"
					return

# --------------------------------------------------------------------------- helpers

static func dist(ax: float, ay: float, bx: float, by: float) -> float:
	return sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by))

func unit_by_id(id: int) -> Variant:
	for u in units:
		if u["id"] == id:
			return u
	return null

func tower_by_id(id: int) -> Variant:
	if id >= 0 and id < 6:
		return towers[id]
	return null

func target_by_id(id: int) -> Variant:
	if id < 6:
		return tower_by_id(id)
	return unit_by_id(id)

func enemy_king_exposed(opp: bool) -> bool:
	# King becomes targetable once either princess tower on that side is destroyed.
	if opp:
		return towers[4]["hp"] <= 0 or towers[5]["hp"] <= 0
	return towers[1]["hp"] <= 0 or towers[2]["hp"] <= 0

func _new_id() -> int:
	next_id += 1
	return next_id

# --------------------------------------------------------------------------- deploy

func can_deploy(card: Dictionary, x: float, y: float, opp: bool = false) -> bool:
	if card["type"] == "spell" or _v(card, "deployAnywhere", false):
		return true
	var boundary := RIVER_Y - 100.0
	if card["id"] == "hog_rider" or card["type"] == "flying":
		boundary = RIVER_Y - 120.0
	if opp:
		return y < H - boundary
	if y > boundary:
		return true
	var left := x < W / 2
	if left and towers[1]["hp"] <= 0:
		return true
	if not left and towers[2]["hp"] <= 0:
		return true
	return false

func play_card(pi: int, hand_idx: int, x: float, y: float) -> bool:
	## Human/AI plays hand slot hand_idx at (x, y). Returns true when the card was played.
	var p: Dictionary = players[pi]
	var card: Dictionary = p["hand"][hand_idx]
	var opp := pi == 1
	if game_over != "":
		return false
	if not opp and not can_deploy(card, x, y):
		return false
	var actual := mech.resolve_card(pi, card)
	if actual.is_empty():
		return false
	var cost: float = actual["cost"]
	if actual.get("dualForm", false):
		cost = 6.0 if p["elixir"] >= 6.0 else 3.0
	if p["elixir"] < cost:
		return false
	p["elixir"] -= cost
	p["last_played"] = card
	# cycle
	var q: Array = p["queue"]
	p["hand"][hand_idx] = p["next"]
	p["next"] = q.pop_front()
	q.append(card)
	p["cycles"][card["id"]] = p["cycles"].get(card["id"], 0) + 1
	deploy_card(actual, x, y, opp)
	fx.append({"t": "play", "card": actual["id"], "opp": opp})
	return true

func deploy_card(card: Dictionary, x: float, y: float, opp: bool) -> void:
	if card["type"] == "spell":
		mech.cast_spell(card, x, y, opp)
		return
	var lane := "LEFT" if x < W / 2 else "RIGHT"
	var count: int = int(_v(card, "count", 1))
	for i in count:
		var ox := 0.0
		var oy := 0.0
		if count > 1:
			ox = rng.randf_range(-10.0, 10.0)
			oy = rng.randf_range(-10.0, 10.0)
		if _v(card, "splitSpawn", false) and count > 1:
			ox = (float(i) / float(count - 1)) * 120.0 - 60.0
			oy = rng.randf_range(-20.0, 20.0)
		var sx := x + ox
		var sy := y + oy
		var lane_center := BRIDGE_L if lane == "LEFT" else BRIDGE_R
		sx -= (sx - lane_center) * 0.3
		var u_lane := lane
		var tx := x + ox
		var ty := y + oy
		if card["id"] == "miner" or card["id"] == "goblin_drill":
			sy = H * 0.1 if opp else H * 0.9
			sx = x
		if card["id"] == "three_musketeers" and count == 3 and i == 2:
			u_lane = "RIGHT" if lane == "LEFT" else "LEFT"
			sx = (70.0 if u_lane == "LEFT" else W - 70.0) + ox
		var u := make_unit(card, sx, sy, opp, u_lane)
		if _v(card, "burrows", false):
			u["burrowing"] = {"active": true, "targetX": tx, "targetY": ty}
		units.append(u)
		mech.on_spawn(u)

func make_unit(card: Dictionary, x: float, y: float, opp: bool, lane: String) -> Dictionary:
	var u: Dictionary = card.duplicate(true)
	u["cid"] = card["id"]
	u["id"] = _new_id()
	u["spriteId"] = _v(card, "spawnUnitId", card["id"])
	u["x"] = x
	u["y"] = y
	u["opp"] = opp
	u["lane"] = lane
	u["hp"] = float(_v(card, "hp", 1))
	u["maxHp"] = u["hp"]
	u["lastAttack"] = -99999.0
	u["lockedTarget"] = -1
	u["stunUntil"] = 0.0
	u["slowUntil"] = 0.0
	u["slowAmount"] = 0.35
	u["spawnTime"] = now
	u["spawnDelayMs"] = float(_v(card, "spawnDelay", 0))
	u["baseSpeed"] = float(_v(card, "speed", 0))
	u["currentShieldHp"] = float(_v(card, "shieldHp", 0))
	u["lastSpawn"] = now
	u["isUnit"] = true
	if _v(card, "charge", false):
		u["charge"] = {"active": false, "distance": 0.0, "threshold": 2.0 * CHARGE_TILE_PX}
	return u

# --------------------------------------------------------------------------- towers

func _update_towers(dmg: Array) -> void:
	for t in towers:
		if t["hp"] <= 0:
			continue
		if t["stunUntil"] > now:
			continue
		if t["type"] == "king" and _king_asleep(t):
			continue
		if now - t["lastShot"] < t["fireRate"]:
			continue
		var target: Variant = null
		if t["lockedTarget"] != -1:
			var lt = unit_by_id(t["lockedTarget"])
			if lt != null and lt["hp"] > 0 and not _is_hidden(lt) and dist(lt["x"], lt["y"], t["x"], t["y"]) <= t["range"]:
				target = lt
			else:
				t["lockedTarget"] = -1
		if target == null:
			var best := INF
			for u in units:
				if u["opp"] == t["opp"] or u["hp"] <= 0 or _is_hidden(u) or _v(u, "isZone", false):
					continue
				var d := dist(u["x"], u["y"], t["x"], t["y"])
				if d <= t["range"] and d < best:
					best = d
					target = u
			if target != null:
				t["lockedTarget"] = target["id"]
		if target == null:
			continue
		if t.has("maxAmmo"):
			if t["currentAmmo"] <= 0:
				if t["lastReload"] > 0.0 and now - t["lastReload"] < t["reloadTime"]:
					continue
				t["lastReload"] = now
				t["currentAmmo"] = 1
			t["currentAmmo"] -= 1
		projectiles.append({
			"id": _new_id(), "x": t["x"], "y": t["y"], "targetId": target["id"], "targetX": target["x"], "targetY": target["y"],
			"speed": t["projectileSpeed"], "damage": t["damage"], "type": t["projectileType"], "splash": t["splash"],
			"splashRadius": t["splashRadius"], "attackerId": t["id"], "opp": t["opp"], "fromTower": true,
		})
		t["lastShot"] = now

func _king_asleep(k: Dictionary) -> bool:
	# The King only wakes once it is damaged or one of its princess towers has fallen.
	if k["hp"] < k["maxHp"]:
		return false
	for t in towers:
		if t["opp"] == k["opp"] and t["type"] == "princess" and t["hp"] <= 0:
			return false
	return true

func _is_hidden(u: Dictionary) -> bool:
	var h = u.get("hidden")
	return h is Dictionary and h.get("active", false)

# --------------------------------------------------------------------------- units

func _targets_for(u: Dictionary, actual_range: float) -> Array:
	var targets: Array = []
	for t in towers:
		if t["opp"] != u["opp"] and t["hp"] > 0 and t["type"] == "princess":
			targets.append(t)
	if enemy_king_exposed(u["opp"]):
		var king: Dictionary = towers[3] if u["opp"] else towers[0]
		if king["hp"] > 0:
			targets.append(king)
	var near := units.filter(func(o): return o["opp"] != u["opp"] and o["hp"] > 0 and absf(o["x"] - u["x"]) < maxf(actual_range + 160.0, 220.0) and absf(o["y"] - u["y"]) < maxf(actual_range + 160.0, 220.0))
	for o in near:
		if o["type"] == "building" and not _is_hidden(o):
			targets.append(o)
	if _v(u, "targetType", "") != "buildings":
		var has_building_in_range := false
		for t in targets:
			if dist(t["x"], t["y"], u["x"], u["y"]) <= actual_range + 25.0:
				has_building_in_range = true
				break
		if not has_building_in_range:
			for o in near:
				if o["type"] == "building" or _is_hidden(o) or _v(o, "isZone", false):
					continue
				var can_hit_air: bool = u["type"] == "flying" or (u.get("projectile") != null and u["spriteId"] != "x_bow" and not _v(u, "groundOnly", false))
				if can_hit_air or o["type"] != "flying":
					targets.append(o)
	return targets

func _closest(u: Dictionary, targets: Array) -> Variant:
	var best: Variant = null
	var bd := INF
	for t in targets:
		var d := dist(t["x"], t["y"], u["x"], u["y"])
		if d < bd:
			bd = d
			best = t
	return best

func _update_unit(u: Dictionary, dmg: Array, splash: Array) -> void:
	# deployment delay (Golem/Golemite style)
	if u["spawnDelayMs"] > 0.0 and now - u["spawnTime"] < u["spawnDelayMs"]:
		return
	# building lifetime: lose max HP evenly over its lifetime
	var lifetime: float = float(_v(u, "lifetime", 0))
	if lifetime > 0.0 and u["type"] == "building":
		u["hp"] -= (u["maxHp"] / lifetime) * (TICK_MS / 1000.0)
		if u["hp"] <= 0.0:
			return
	mech.update_unit_pre(u, dmg, splash)
	if u["hp"] <= 0:
		return
	# periodic spawner (Witch, Tombstone, Hut ...)
	var spawn_rate: float = float(_v(u, "spawnRate", 0))
	if spawn_rate > 0.0 and u.get("spawns") != null and now - u["lastSpawn"] >= spawn_rate * 1000.0:
		u["lastSpawn"] = now
		var sc := CardDB.get_card(str(u["spawns"]))
		if not sc.is_empty():
			for i in int(_v(u, "spawnCount", 1)):
				var off := Vector2(rng.randf_range(-15.0, 15.0), 25.0 if u["opp"] == false else -25.0)
				var s := make_unit(sc, u["x"] + off.x + (i * 6.0 - 6.0), u["y"] + off.y, u["opp"], u["lane"])
				units.append(s)
				mech.on_spawn(s)
	if u["stunUntil"] > now:
		return
	if (u["spriteId"] == "tesla" or u["spriteId"] == "evolved_tesla") and _is_hidden(u):
		return
	var actual_range: float = float(_v(u, "range", 0))
	var actual_damage: float = float(_v(u, "damage", 0))
	var rage := mech.is_raged(u)
	# charge (Prince): double damage once the charge threshold distance is travelled
	if u.has("charge"):
		var ch: Dictionary = u["charge"]
		var only_unshielded: bool = _v(u, "chargeOnlyWithoutShield", false)
		if only_unshielded and u["currentShieldHp"] > 0.0:
			ch["distance"] = 0.0
			ch["active"] = false
		elif ch["distance"] >= ch["threshold"] and not ch["active"]:
			ch["active"] = true
		if ch["active"]:
			actual_damage = float(u["damage"]) * 2.0
	if actual_range <= 0.0 and float(_v(u, "damage", 0)) <= 0.0 and float(_v(u, "speed", 0)) <= 0.0:
		return
	var targets := _targets_for(u, actual_range)
	# locked target with aggro switching
	var locked: int = u["lockedTarget"]
	if locked != -1:
		var found: Variant = null
		for t in targets:
			if t["id"] == locked:
				found = t
				break
		if found == null or _v(u, "wasPushed", false):
			u["lockedTarget"] = -1
			u["wasPushed"] = false
		else:
			var d_locked := dist(found["x"], found["y"], u["x"], u["y"])
			var c = _closest(u, targets)
			if c != null and c["id"] != locked:
				var dc := dist(c["x"], c["y"], u["x"], u["y"])
				if dc < d_locked - (actual_range + 100.0):
					u["lockedTarget"] = c["id"]
			targets = targets.filter(func(t): return t["id"] == u["lockedTarget"])
	var closest = _closest(u, targets)
	var min_dist := INF
	if closest != null:
		min_dist = dist(closest["x"], closest["y"], u["x"], u["y"])
	if closest != null and min_dist <= actual_range + 25.0:
		if u["lockedTarget"] == -1:
			u["lockedTarget"] = closest["id"]
		var atk_speed: float = float(_v(u, "attackSpeed", 1000))
		if u["slowUntil"] > now:
			atk_speed /= (1.0 - u["slowAmount"])
		if rage:
			atk_speed /= 1.35
		if atk_speed > 0.0 and now - u["lastAttack"] > atk_speed and actual_damage > 0.0:
			u["lastAttack"] = now
			_attack(u, closest, actual_damage, min_dist, dmg, splash)
			if u["hp"] <= 0:
				return
		if not _moves_while_attacking(u):
			return
	_move_unit(u, closest, min_dist, actual_range, rage)

func _moves_while_attacking(u: Dictionary) -> bool:
	return false

func _attack(u: Dictionary, target: Dictionary, base_damage: float, tdist: float, dmg: Array, splash: Array) -> void:
	var damage := mech.modify_damage(u, target, base_damage, tdist)
	u["isAttacking"] = true
	fx.append({"t": "attack", "id": u["id"], "x": u["x"], "y": u["y"], "tx": target["x"], "ty": target["y"]})
	if u.get("projectile") != null:
		var ptype := str(u["projectile"])
		var spd := 12.0
		if u["spriteId"] == "tesla":
			spd = 100.0
		elif u["spriteId"] == "x_bow":
			spd = 50.0
		projectiles.append({
			"id": _new_id(), "x": u["x"], "y": u["y"], "targetId": target["id"], "targetX": target["x"], "targetY": target["y"],
			"speed": spd, "damage": damage, "type": ptype, "splash": _v(u, "splash", false), "splashRadius": float(_v(u, "splashRadius", 50)),
			"slow": float(_v(u, "slow", 0)), "stun": float(_v(u, "stun", 0)), "attackerId": u["id"], "opp": u["opp"],
			"knockback": float(_v(u, "knockback", 0)), "groundOnly": _v(u, "groundOnly", false),
		})
		if _v(u, "pierce", false):
			var pj: Dictionary = projectiles[projectiles.size() - 1]
			var ang := atan2(target["y"] - u["y"], target["x"] - u["x"])
			var travel: float = float(_v(u, "projectileTravelDistance", 200))
			pj["pierce"] = true
			pj["hitIds"] = {}
			pj["targetId"] = -1
			pj["targetX"] = u["x"] + cos(ang) * travel
			pj["targetY"] = u["y"] + sin(ang) * travel
			pj["splash"] = false
		mech.on_ranged_attack(u, target, damage, projectiles[projectiles.size() - 1])
	else:
		# melee: apply to tower directly, to unit via queued event
		if target.has("isTower"):
			target["hp"] -= damage
			fx.append({"t": "hit", "x": target["x"], "y": target["y"], "dmg": damage})
		else:
			dmg.append({"id": target["id"], "dmg": damage, "attacker": u["id"]})
		if _v(u, "splash", false) or _v(u, "frontalSplash", false):
			splash.append({"x": target["x"], "y": target["y"], "r": float(_v(u, "splashRadius", 40)), "dmg": damage,
				"opp": u["opp"], "skip_id": target["id"], "tower_factor": 1.0, "attacker": u["id"], "ground_only": _v(u, "groundOnly", false)})
		if _v(u, "kamikaze", false):
			u["hp"] = 0.0
	mech.on_attack(u, target, damage, dmg, splash)

func _move_unit(u: Dictionary, closest: Variant, min_dist: float, actual_range: float, rage: bool) -> void:
	var speed: float = float(_v(u, "speed", 0))
	if speed <= 0.0:
		return
	var eff := speed
	if u.has("charge") and u["charge"]["active"]:
		eff *= 2.0
	if rage:
		eff *= 1.35
	if u["slowUntil"] > now:
		eff *= (1.0 - u["slowAmount"])
	if _v(u, "rootUntil", 0.0) > now:
		return
	var nx: float = u["x"]
	var ny: float = u["y"]
	var burrow = u.get("burrowing")
	if burrow is Dictionary and burrow.get("active", false):
		var d := dist(u["x"], u["y"], burrow["targetX"], burrow["targetY"])
		if d > 5.0:
			var a := atan2(burrow["targetY"] - u["y"], burrow["targetX"] - u["x"])
			nx += cos(a) * eff
			ny += sin(a) * eff
		else:
			burrow["active"] = false
		u["x"] = clampf(nx, 10.0, W - 10.0)
		u["y"] = clampf(ny, 10.0, H - 10.0)
		return
	if _v(u, "stopsToAttack", false) and closest != null and min_dist <= float(_v(u, "range", 25)) + 15.0:
		return
	var flying_or_jump: bool = u["type"] == "flying" or _v(u, "jumps", false)
	if flying_or_jump and closest != null:
		var a2 := atan2(closest["y"] - u["y"], closest["x"] - u["x"])
		nx += cos(a2) * eff
		ny += sin(a2) * eff
	elif _v(u, "targetType", "") == "buildings" and closest != null:
		var a3 := atan2(closest["y"] - u["y"], closest["x"] - u["x"])
		nx += cos(a3) * eff
		ny += sin(a3) * eff
	else:
		ny += eff if u["opp"] else -eff
	if u.has("charge") and not u["charge"]["active"]:
		u["charge"]["distance"] += dist(nx, ny, u["x"], u["y"])
	if not flying_or_jump or closest == null:
		_steer_ground(u, nx, ny, eff)
		return
	u["x"] = clampf(nx, 10.0, W - 10.0)
	u["y"] = clampf(ny, 10.0, H - 10.0)

func _steer_ground(u: Dictionary, nx: float, ny: float, eff: float) -> void:
	# Ground pathing from App.js: lane centering, tower avoidance, strict river blocking, bridge steering.
	var lane_target := false
	var avoid_x := 0.0
	var enemy_king = towers[3] if u["opp"] else towers[0]
	var lane_princess = null
	for t in towers:
		if t["type"] == "princess" and t["opp"] != u["opp"] and ((u["lane"] == "LEFT" and t["x"] < W / 2) or (u["lane"] == "RIGHT" and t["x"] > W / 2)):
			lane_princess = t
	var princess_destroyed: bool = lane_princess == null or lane_princess["hp"] <= 0
	var princess_y: float = (H - 150.0 - 80.0) if u["opp"] else 150.0
	var past_princess: bool = (ny > princess_y + 30.0) if u["opp"] else (ny < princess_y - 30.0)
	if princess_destroyed and past_princess and enemy_king["hp"] > 0:
		var dx: float = enemy_king["x"] - nx
		if absf(dx) > 5.0:
			nx += signf(dx) * minf(2.0, absf(dx) * 0.1)
	var lane_center := BRIDGE_L if u["lane"] == "LEFT" else BRIDGE_R
	if absf(nx - lane_center) > 20.0 and eff > 0.0:
		avoid_x += signf(lane_center - nx) * 2.0
	var collision := false
	for t in towers:
		if t["hp"] <= 0:
			continue
		var min_d := 45.0 if t["type"] == "king" else 35.0
		if dist(t["x"], t["y"], nx, ny) < min_d:
			collision = true
			avoid_x += -2.0 if nx < t["x"] else 2.0
			break
	var dist_river := absf(ny - RIVER_Y)
	if collision:
		nx += avoid_x
		ny = u["y"] + (eff * 0.5 if u["opp"] else -eff * 0.5)
	else:
		var on_bridge := absf(nx - BRIDGE_L) < 25.0 or absf(nx - BRIDGE_R) < 25.0
		if dist_river < 30.0 and not on_bridge:
			var toward_river: bool = (u["y"] < RIVER_Y and ny > u["y"]) or (u["y"] > RIVER_Y and ny < u["y"])
			if toward_river:
				ny = u["y"]
			var bx := lane_center
			var dxb := bx - nx
			nx += signf(dxb) * minf(absf(dxb), eff * 1.5)
		elif dist_river < 120.0 and not on_bridge:
			var dxb2 := lane_center - nx
			if absf(dxb2) > 2.0:
				nx += signf(dxb2) * 2.0
		else:
			nx += avoid_x * 0.5
	u["x"] = clampf(nx, 10.0, W - 10.0)
	u["y"] = clampf(ny, 10.0, H - 10.0)

# --------------------------------------------------------------------------- projectiles / damage

func _update_projectiles(dmg: Array, splash: Array) -> void:
	var keep: Array = []
	for p in projectiles:
		if p.get("done", false):
			continue
		var tid: int = int(p.get("targetId", -1))
		var tgt = target_by_id(tid) if tid != -1 else null
		if tgt != null and tgt["hp"] > 0:
			p["targetX"] = tgt["x"]
			p["targetY"] = tgt["y"]
		if p.get("pierce", false):
			_pierce_hits(p, dmg)
		var d := dist(p["x"], p["y"], p["targetX"], p["targetY"])
		var spd: float = p["speed"]
		if d <= spd and p.get("pierce", false):
			continue
		if d <= spd:
			_projectile_hit(p, tgt, dmg, splash)
			continue
		var a := atan2(p["targetY"] - p["y"], p["targetX"] - p["x"])
		p["x"] += cos(a) * spd
		p["y"] += sin(a) * spd
		keep.append(p)
	projectiles = keep

func _pierce_hits(p: Dictionary, dmg: Array) -> void:
	for u in units:
		if u["opp"] == p["opp"] or u["hp"] <= 0 or p["hitIds"].has(u["id"]) or _is_hidden(u):
			continue
		if dist(u["x"], u["y"], p["x"], p["y"]) <= 22.0:
			p["hitIds"][u["id"]] = true
			dmg.append({"id": u["id"], "dmg": p["damage"], "attacker": p.get("attackerId", -1), "knockback": p.get("knockback", 0.0),
				"from_x": p["x"], "from_y": p["y"], "stun": p.get("stun", 0.0), "slow": p.get("slow", 0.0)})
	for t in towers:
		if t["opp"] != p["opp"] and t["hp"] > 0 and not p["hitIds"].has(t["id"]) and dist(t["x"], t["y"], p["x"], p["y"]) <= 30.0:
			p["hitIds"][t["id"]] = true
			t["hp"] -= p["damage"]
			fx.append({"t": "hit", "x": t["x"], "y": t["y"], "dmg": p["damage"]})

func _projectile_hit(p: Dictionary, tgt: Variant, dmg: Array, splash: Array) -> void:
	if p.get("isSpell", false):
		mech.spell_land(p)
		return
	if p.get("splash", false):
		splash.append({"x": p["targetX"], "y": p["targetY"], "r": float(p.get("splashRadius", 50)), "dmg": p["damage"], "opp": p["opp"],
			"skip_id": -1, "tower_factor": 1.0, "attacker": p.get("attackerId", -1), "ground_only": p.get("groundOnly", false),
			"slow": p.get("slow", 0.0), "stun": p.get("stun", 0.0), "knockback": p.get("knockback", 0.0), "tower_hit": true})
	elif tgt != null and tgt["hp"] > 0:
		if tgt.has("isTower"):
			tgt["hp"] -= p["damage"]
			fx.append({"t": "hit", "x": tgt["x"], "y": tgt["y"], "dmg": p["damage"]})
		else:
			dmg.append({"id": tgt["id"], "dmg": p["damage"], "attacker": p.get("attackerId", -1), "slow": p.get("slow", 0.0), "stun": p.get("stun", 0.0)})
	fx.append({"t": "impact", "x": p["targetX"], "y": p["targetY"], "kind": p.get("type", "")})
	mech.on_projectile_hit(p, tgt, dmg, splash)

func _apply_splash(s: Dictionary, dmg: Array) -> void:
	var r: float = s["r"]
	for u in units:
		if u["opp"] == s["opp"] or u["hp"] <= 0 or u["id"] == s.get("skip_id", -1):
			continue
		if _is_hidden(u) or _v(u, "isZone", false):
			continue
		if s.get("ground_only", false) and u["type"] == "flying":
			continue
		if dist(u["x"], u["y"], s["x"], s["y"]) <= r:
			dmg.append({"id": u["id"], "dmg": s["dmg"], "attacker": s.get("attacker", -1), "slow": s.get("slow", 0.0), "stun": s.get("stun", 0.0), "knockback": s.get("knockback", 0.0), "from_x": s["x"], "from_y": s["y"]})
	if s.get("tower_hit", false):
		for t in towers:
			if t["opp"] != s["opp"] and t["hp"] > 0 and dist(t["x"], t["y"], s["x"], s["y"]) <= r + 30.0:
				t["hp"] -= s["dmg"] * s.get("tower_factor", 1.0)
				if s.get("stun", 0.0) > 0.0:
					t["stunUntil"] = now + s["stun"] * 1000.0
	fx.append({"t": "splash", "x": s["x"], "y": s["y"], "r": r})

func _apply_damage(events: Array) -> void:
	for e in events:
		var u = unit_by_id(e["id"])
		if u == null or u["hp"] <= 0:
			continue
		mech.damage_unit(u, e)

func damage_unit_basic(u: Dictionary, e: Dictionary) -> void:
	var amount: float = e["dmg"]
	var red: float = float(_v(u, "damageReduction", 0))
	if red > 0.0:
		amount *= (1.0 - red)
	if u["currentShieldHp"] > 0.0:
		var absorbed := minf(u["currentShieldHp"], amount)
		u["currentShieldHp"] -= absorbed
		amount -= absorbed
	u["hp"] -= amount
	u["lastHitTime"] = now
	if e.get("stun", 0.0) > 0.0:
		u["stunUntil"] = maxf(u["stunUntil"], now + e["stun"] * 1000.0)
	if e.get("slow", 0.0) > 0.0:
		u["slowUntil"] = now + float(_v(e, "slowDuration", 2.5)) * 1000.0
		u["slowAmount"] = e["slow"]
	if e.get("knockback", 0.0) > 0.0 and u["type"] != "building":
		var a := atan2(u["y"] - e.get("from_y", u["y"]), u["x"] - e.get("from_x", u["x"]))
		u["x"] = clampf(u["x"] + cos(a) * e["knockback"], 10.0, W - 10.0)
		u["y"] = clampf(u["y"] + sin(a) * e["knockback"], 10.0, H - 10.0)
		u["wasPushed"] = true
	if u.has("charge") and e["dmg"] > 0.0:
		u["charge"]["distance"] = 0.0
		u["charge"]["active"] = false

func _reap_dead() -> void:
	var dead: Array = units.filter(func(u): return u["hp"] <= 0)
	if dead.is_empty():
		return
	units = units.filter(func(u): return u["hp"] > 0)
	for d in dead:
		fx.append({"t": "death", "x": d["x"], "y": d["y"], "id": d["id"], "sprite": d["spriteId"], "opp": d["opp"]})
		_on_death(d)

func _on_death(d: Dictionary) -> void:
	var sid = d.get("deathSpawns")
	if sid != null or d["spriteId"] == "tombstone":
		var sc := CardDB.get_card(str(sid if sid != null else "skeletons"))
		if not sc.is_empty():
			var n := int(_v(d, "deathSpawnCount", 4))
			for i in n:
				var ang := (TAU * i) / maxf(1.0, n) + rng.randf() * 0.5
				var dd := 15.0 + rng.randf() * 20.0
				var s := make_unit(sc, clampf(d["x"] + cos(ang) * dd, 80.0, W - 80.0), clampf(d["y"] + sin(ang) * dd, 80.0, H - 80.0), d["opp"], d["lane"])
				units.append(s)
				mech.on_spawn(s)
	var dmg_amt: float = float(_v(d, "deathDamage", 0))
	if dmg_amt > 0.0 and float(_v(d, "deathBombDelay", 0)) <= 0.0:
		var ev := {"x": d["x"], "y": d["y"], "r": float(_v(d, "deathRadius", 60)), "dmg": dmg_amt, "opp": d["opp"], "skip_id": -1,
			"tower_factor": 1.0, "attacker": d["id"], "ground_only": false, "tower_hit": true}
		if _v(d, "deathSlow", 0) != 0:
			ev["slow"] = 0.35
			ev["slowDuration"] = 2.0
		var extra: Array = []
		_apply_splash(ev, extra)
		for e in extra:
			if ev.has("slowDuration"):
				e["slowDuration"] = ev["slowDuration"]
		_apply_damage(extra)
	mech.on_death(d)

func _update_zones(dmg: Array, splash: Array) -> void:
	mech.update_zones(dmg, splash)

# --------------------------------------------------------------------------- enemy AI (port of the App.js AI interval)

func _tick_ai() -> void:
	for pi in 2:
		if not ai_enabled[pi]:
			continue
		_ai_acc[pi] += TICK_MS
		if _ai_acc[pi] >= ai_interval:
			_ai_acc[pi] = 0.0
			_ai_think(pi)

var _ai_acc := [0.0, 0.0]

func _ai_think(pi: int) -> void:
	var opp := pi == 1
	var p: Dictionary = players[pi]
	var hand: Array = p["hand"]
	if hand.is_empty():
		return
	var elixir: float = p["elixir"]
	var foes := units.filter(func(u): return u["opp"] != opp and u["hp"] > 0)
	var own_towers := towers.filter(func(t): return t["opp"] == opp and t["hp"] > 0)
	var foe_princess := towers.filter(func(t): return t["opp"] != opp and t["hp"] > 0 and t["type"] == "princess")
	# mirror helper: AI logic is written for the top side; the human-side AI mirrors y
	var fy := func(y: float) -> float: return y if opp else H - y
	var half_line: float = H / 2.0 + 100.0 if opp else H / 2.0 - 100.0
	var under_attack := false
	for u in foes:
		if (opp and u["y"] < half_line) or ((not opp) and u["y"] > half_line):
			under_attack = true
			break
	var threshold := 3.0 if under_attack else 5.0
	if elixir >= 8.0 and not under_attack:
		threshold = 0.0
	if elixir < threshold:
		return
	var card_idx := -1
	var tx := W / 2
	var ty: float = fy.call(100.0)
	# 1. proactive win condition push
	if not under_attack and elixir >= 7.0:
		var wins := ["golem", "giant", "pekka", "prince", "balloon", "royal_giant", "goblin_barrel", "x_bow", "mortal"]
		for i in hand.size():
			if hand[i]["id"] in wins and hand[i]["cost"] <= elixir:
				card_idx = i
				break
		if card_idx != -1:
			var cid: String = hand[card_idx]["id"]
			if cid in ["golem", "giant", "pekka"]:
				tx = 70.0 if rng.randf() < 0.5 else W - 70.0
				ty = fy.call(50.0)
			elif cid == "goblin_barrel":
				if foe_princess.size() > 0:
					var tt = foe_princess[rng.randi() % foe_princess.size()]
					tx = tt["x"]
					ty = tt["y"]
				else:
					card_idx = -1
			elif cid == "royal_giant":
				if foe_princess.size() > 0:
					var tt2 = foe_princess[rng.randi() % foe_princess.size()]
					tx = tt2["x"]
				ty = fy.call(H / 2.0 - 80.0)
			elif cid == "x_bow":
				tx = W / 2 - 30.0 if rng.randf() < 0.5 else W / 2 + 30.0
				ty = fy.call(H / 2.0 - 60.0)
			else:
				tx = 95.0 if rng.randf() < 0.5 else W - 95.0
				ty = fy.call(H / 2.0 - 40.0)
	# 2. reactive spell on swarms
	if card_idx == -1:
		var swarm_ids := ["skeleton_army", "minions", "minion_horde", "skeletons", "bats", "goblin_gang"]
		var swarm := foes.filter(func(u): return u["spriteId"] in swarm_ids)
		if swarm.size() >= 3:
			for i in hand.size():
				if hand[i]["type"] == "spell" and hand[i]["id"] in ["arrows", "zap", "fireball", "poison", "log"] and hand[i]["cost"] <= elixir:
					var target = swarm[swarm.size() / 2]
					var splash_r := 50.0 if hand[i]["id"] in ["fireball", "poison"] else 30.0
					var hits_own := false
					for t in own_towers:
						if dist(t["x"], t["y"], target["x"], target["y"]) < splash_r:
							hits_own = true
					if not hits_own:
						card_idx = i
						tx = target["x"]
						ty = target["y"]
					break
	# 3. reactive defense vs big threats
	if card_idx == -1 and under_attack:
		var big := ["golem", "giant", "pekka", "prince", "baby_dragon", "hunter"]
		var threats := foes.filter(func(u): return u["spriteId"] in big)
		if threats.size() > 0:
			for i in hand.size():
				var c: Dictionary = hand[i]
				if c["cost"] > elixir:
					continue
				if c["type"] == "building" or c["id"] in ["minipekka", "inferno_tower", "inferno_dragon"]:
					card_idx = i
					break
			if card_idx != -1:
				var th = threats[0]
				tx = th["x"]
				var th_far: bool = (th["y"] > H / 2.0) if opp else (th["y"] < H / 2.0)
				ty = fy.call(150.0 if th_far else 180.0)
	# 4. general play
	if card_idx == -1:
		var aff: Array = []
		for i in hand.size():
			if hand[i]["cost"] <= elixir:
				aff.append(i)
		if aff.size() > 0:
			aff.sort_custom(func(a, b):
				var ca: Dictionary = hand[a]
				var cb: Dictionary = hand[b]
				if ca["type"] == "building" and cb["type"] != "building": return true
				if cb["type"] == "building" and ca["type"] != "building": return false
				if ca["type"] == "spell" and cb["type"] != "spell": return true
				if cb["type"] == "spell" and ca["type"] != "spell": return false
				return ca["cost"] < cb["cost"])
			card_idx = aff[0]
			var cc: Dictionary = hand[card_idx]
			if cc["type"] == "building":
				tx = 90.0 if rng.randf() < 0.5 else W - 90.0
				ty = fy.call(120.0)
			elif cc["type"] == "spell":
				if foes.size() > 0:
					var tg = foes[rng.randi() % foes.size()]
					tx = tg["x"]
					ty = tg["y"]
				else:
					tx = W / 2 + rng.randf_range(-50.0, 50.0)
					ty = fy.call(H / 2.0 - 100.0)
			else:
				var is_tank: bool = float(_v(cc, "hp", 0)) > 1500.0
				var is_ranged := false
				for key in ["archer", "magic_archer", "musketeer", "wizard", "witch"]:
					if str(cc["id"]).contains(key):
						is_ranged = true
				if is_tank:
					tx = 70.0 if rng.randf() < 0.5 else W - 70.0
					ty = fy.call(50.0)
				elif is_ranged:
					tx = 100.0 if rng.randf() < 0.5 else W - 100.0
					ty = fy.call(100.0)
				else:
					tx = 95.0 if rng.randf() < 0.5 else W - 95.0
					ty = fy.call(H / 2.0 - 40.0)
	if card_idx != -1:
		play_card(pi, card_idx, tx, ty)
