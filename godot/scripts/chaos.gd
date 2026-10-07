class_name Chaos
extends RefCounted
## CHAOS mode (our take on Clash Royale's C.H.A.O.S. event): every ~45 s of battle time the game pauses and both sides pick one of three
## offers - two card MODIFIERS (common -> rare -> epic as the match goes on, one upgrade per card) or a one-shot POWER (our own twist).
## Modifiers mutate the battle-local copy of the card; behavioural ones set fields that tick() / the sim hooks read.

const INTERVAL := 45.0
const FIRST_AT := 30.0
const MAX_PICKS := 5

# id -> [tier, name, description]
const MODS := {
	"swift": ["common", "Swift", "+30% move and attack speed"],
	"sturdy": ["common", "Sturdy", "+40% hitpoints"],
	"sharp": ["common", "Sharp", "+35% damage"],
	"longshot": ["common", "Longshot", "+30% range"],
	"cheap": ["common", "Cheap", "Costs 1 less elixir"],
	"swarm": ["common", "Swarm", "Deploys one extra unit"],
	"wide": ["common", "Wide Blast", "+30% spell radius, +20% damage"],
	"shielded": ["rare", "Shielded", "Starts with a 450 HP shield"],
	"vampiric": ["rare", "Vampiric", "Heals 35% of the damage it deals"],
	"frost": ["rare", "Frostbite", "Attacks slow targets by 30%"],
	"splash": ["rare", "Splash Zone", "Attacks hit nearby enemies too"],
	"twin": ["rare", "Twin Deploy", "Deploys twice as many units"],
	"overload": ["rare", "Overload", "+60% spell damage and a stun"],
	"titan": ["epic", "Titan", "Bigger: +90% HP and +50% damage"],
	"phoenix": ["epic", "Phoenix Soul", "Revives once with half HP"],
	"chain": ["epic", "Chain Zap", "Each attack zaps 2 nearby enemies"],
	"explosive": ["epic", "Explosive", "Detonates when destroyed"],
	"cloner": ["epic", "Cloner", "Spawns a half-strength clone every 8 s"],
	"blink": ["epic", "Blink", "Teleports ahead every 6 s"],
	"magnet": ["epic", "Magnetic", "Pulls nearby enemies in every 5 s"],
}
# our own twist: one-shot powers (active round buttons)
const POWERS := {
	"meteor": ["Meteor Shower", "Three meteors rain on the densest enemy cluster"],
	"surge": ["Elixir Surge", "Instantly gain 4 elixir"],
	"freeze": ["Deep Freeze", "Freezes every enemy troop for 3 s"],
	"rally": ["Rally Cry", "Your troops go into a 6 s attack-speed frenzy"],
	"aegis": ["Aegis", "Every friendly troop gains a 300 HP shield"],
	"overclock": ["Overclock", "Double elixir regeneration for 10 s"],
}

var sim: Sim
var picks := [0, 0]
var upgraded: Array = [{}, {}]      # per player: card id -> mod id
var powers: Array = [[], []]        # per player: owned power ids (each is single use)
var next_at := FIRST_AT
var options: Array = []             # current offers for the human
var waiting := false
var elapsed := 0.0                  # battle seconds (advances only while the sim runs)

func _init(s: Sim) -> void:
	sim = s

# ---- eligibility / application ---------------------------------------------------------------
static func eligible(card: Dictionary, id: String) -> bool:
	var t := str(card.get("type", "ground"))
	var spell := t == "spell"
	var troop := t == "ground" or t == "flying"
	var has_dmg := float(Sim._v(card, "damage", 0)) > 0.0
	if card.get("isMirror", false) or card.get("isToken", false):
		return false
	match id:
		"swift": return troop and float(Sim._v(card, "speed", 0)) > 0.0
		"sturdy": return (troop or t == "building") and float(Sim._v(card, "hp", 0)) > 0.0
		"sharp": return has_dmg
		"longshot": return troop and float(Sim._v(card, "range", 0)) >= 50.0
		"cheap": return int(card.get("cost", 0)) >= 2
		"swarm": return troop and int(Sim._v(card, "count", 1)) >= 2
		"wide": return spell and card.get("radius") != null
		"shielded": return troop and float(Sim._v(card, "hp", 0)) > 0.0
		"vampiric", "frost": return troop and has_dmg
		"splash": return troop and has_dmg and not card.get("splash", false)
		"twin": return troop and int(Sim._v(card, "count", 1)) <= 3
		"overload": return spell and has_dmg
		"titan": return troop and float(Sim._v(card, "hp", 0)) > 0.0 and has_dmg
		"phoenix": return troop and float(Sim._v(card, "hp", 0)) > 0.0
		"chain": return troop and has_dmg
		"explosive": return troop and float(Sim._v(card, "hp", 0)) > 0.0 and has_dmg
		"cloner", "magnet": return troop and float(Sim._v(card, "hp", 0)) > 0.0 and has_dmg
		"blink": return t == "ground" and float(Sim._v(card, "speed", 0)) > 0.0 and has_dmg
	return false

static func apply(card: Dictionary, id: String) -> void:
	var hp := float(Sim._v(card, "hp", 0))
	var dmg := float(Sim._v(card, "damage", 0))
	match id:
		"swift":
			card["speed"] = float(card["speed"]) * 1.3
			if card.get("attackSpeed") != null:
				card["attackSpeed"] = float(card["attackSpeed"]) * 0.77
		"sturdy": card["hp"] = floorf(hp * 1.4)
		"sharp":
			card["damage"] = floorf(dmg * 1.35)
			if card.get("spawnDamage") != null:
				card["spawnDamage"] = floorf(float(card["spawnDamage"]) * 1.35)
		"longshot": card["range"] = float(card["range"]) * 1.3
		"cheap": card["cost"] = int(card["cost"]) - 1
		"swarm": card["count"] = int(card["count"]) + 1
		"wide":
			card["radius"] = float(card["radius"]) * 1.3
			card["damage"] = floorf(dmg * 1.2)
		"shielded":
			card["hasShield"] = true
			card["shieldHp"] = float(Sim._v(card, "shieldHp", 0)) + 450.0
		"vampiric": card["lifesteal"] = 0.35
		"frost":
			card["slow"] = 0.3
			card["slowDuration"] = 2.0
		"splash":
			card["splash"] = true
			card["splashRadius"] = 35.0
		"twin": card["count"] = int(Sim._v(card, "count", 1)) * 2
		"overload":
			card["damage"] = floorf(dmg * 1.6)
			card["stun"] = 0.5
		"titan":
			card["hp"] = floorf(hp * 1.9)
			card["damage"] = floorf(dmg * 1.5)
			card["chaosScale"] = 1.35
		"phoenix": card["reviveOnce"] = true
		"chain": card["zapOnHit"] = true
		"explosive":
			card["deathDamage"] = maxf(150.0, floorf(dmg * 1.8))
			card["deathRadius"] = 55.0
		"cloner": card["cloneEvery"] = 8000.0
		"blink": card["blinkEvery"] = 6000.0
		"magnet": card["magnetEvery"] = 5000.0
	var lst: Array = card.get("chaosMods", [])
	lst.append(id)
	card["chaosMods"] = lst

# ---- offers ----------------------------------------------------------------------------------
func tier_for(pick_index: int) -> String:
	return "common" if pick_index < 2 else ("rare" if pick_index < 4 else "epic")

func make_offers(pi: int) -> Array:
	var tier := tier_for(int(picks[pi]))
	var deck: Array = sim.players[pi]["deck"]
	var out: Array = []
	var pool: Array = []
	for c in deck:
		if upgraded[pi].has(c["id"]):
			continue
		for id in MODS:
			if MODS[id][0] == tier and eligible(c, id):
				pool.append([c["id"], id])
	pool.shuffle()
	var used_cards := {}
	for entry in pool:
		if used_cards.has(entry[0]):
			continue
		used_cards[entry[0]] = true
		out.append({"kind": "mod", "card": entry[0], "mod": entry[1]})
		if out.size() >= 2:
			break
	# fall back to other tiers if this tier has too few offers
	if out.size() < 2:
		for t2 in ["common", "rare", "epic"]:
			for c in deck:
				if out.size() >= 2:
					break
				if upgraded[pi].has(c["id"]) or used_cards.has(c["id"]):
					continue
				for id in MODS:
					if MODS[id][0] == t2 and eligible(c, id):
						used_cards[c["id"]] = true
						out.append({"kind": "mod", "card": c["id"], "mod": id})
						break
	var ps := POWERS.keys()
	ps.shuffle()
	out.append({"kind": "power", "power": ps[0]})
	return out

func choose(pi: int, offer: Dictionary) -> void:
	if offer["kind"] == "mod":
		for c in sim.players[pi]["deck"]:
			if c["id"] == offer["card"]:
				apply(c, offer["mod"])
				upgraded[pi][c["id"]] = offer["mod"]
		sim.fx.append({"t": "alert", "msg": "%s: %s" % [("YOU" if pi == 0 else "ENEMY"), MODS[offer["mod"]][1].to_upper()]})
	else:
		powers[pi].append(offer["power"])
		if pi == 1:
			use_power(1, offer["power"])
	picks[pi] += 1

func ai_pick() -> void:
	var offers := make_offers(1)
	choose(1, offers[randi() % offers.size()])

## Called every frame by the battle with the real delta; returns true when the human must choose.
func update_clock() -> bool:
	elapsed = sim.now / 1000.0
	if not waiting and elapsed >= next_at and int(picks[0]) < MAX_PICKS and sim.game_over == "":
		waiting = true
		next_at += INTERVAL
		ai_pick()
		options = make_offers(0)
		return true
	return false

# ---- powers ----------------------------------------------------------------------------------
func use_power(pi: int, id: String) -> bool:
	if not (id in powers[pi]):
		return false
	powers[pi].erase(id)
	var now := sim.now
	var opp := pi == 1
	match id:
		"meteor":
			var best: Variant = null
			var best_n := -1
			for e in sim.units:
				if e["opp"] == opp or e["hp"] <= 0:
					continue
				var n := 0
				for f in sim.units:
					if f["opp"] == e["opp"] and f["hp"] > 0 and Sim.dist(f["x"], f["y"], e["x"], e["y"]) < 60.0:
						n += 1
				if n > best_n:
					best_n = n
					best = e
			var cx: float = W_HALF
			var cy: float = 150.0 if not opp else Sim.H - 150.0
			if best != null:
				cx = best["x"]
				cy = best["y"]
			for i in 3:
				var ox := (i - 1) * 28.0
				var oy := (i % 2) * 20.0 - 10.0
				sim.zones.append({"kind": "bomb", "x": cx + ox, "y": cy + oy, "opp": opp, "card": {}, "r": 45.0, "dmg": 420.0, "end": now + 500.0 + i * 280.0, "interval": 999999.0, "last": now})
				sim.fx.append({"t": "zone", "x": cx + ox, "y": cy + oy, "r": 45.0, "kind": "bomb", "dur": 0.5 + i * 0.28})
		"surge": sim.players[pi]["elixir"] = minf(10.0, sim.players[pi]["elixir"] + 4.0)
		"freeze":
			for e in sim.units:
				if e["opp"] != opp and e["hp"] > 0 and e["type"] != "building":
					e["stunUntil"] = maxf(e["stunUntil"], now + 3000.0)
					e["frozenUntil"] = now + 3000.0
			sim.fx.append({"t": "alert", "msg": "DEEP FREEZE!"})
		"rally":
			for u in sim.units:
				if u["opp"] == opp and u["hp"] > 0:
					u["rageUntil"] = now + 6000.0
		"aegis":
			for u in sim.units:
				if u["opp"] == opp and u["hp"] > 0 and u["type"] != "building":
					u["currentShieldHp"] = float(u["currentShieldHp"]) + 300.0
		"overclock": sim.players[pi]["elixirBoostUntil"] = now + 10000.0
	return true

const W_HALF := 195.0

# ---- per-tick behaviours ---------------------------------------------------------------------
func tick() -> void:
	var now := sim.now
	for u in sim.units.duplicate():
		if u["hp"] <= 0:
			continue
		if float(Sim._v(u, "cloneEvery", 0.0)) > 0.0 and now - float(Sim._v(u, "lastClone", u["spawnTime"])) >= float(u["cloneEvery"]) and not u.get("chaosClone", false):
			u["lastClone"] = now
			var c: Dictionary = u.duplicate(true)
			c["id"] = str(u["cid"])
			c["cloneEvery"] = 0.0
			var cu := sim.make_unit(c, u["x"] + 18.0, u["y"], u["opp"], u["lane"])
			cu["hp"] = floorf(float(u["maxHp"]) * 0.5)
			cu["maxHp"] = cu["hp"]
			cu["damage"] = float(u["damage"]) * 0.5
			cu["chaosClone"] = true
			cu["lifetimeEnd"] = now + 10000.0
			sim.units.append(cu)
			sim.mech.on_spawn(cu)
		if float(Sim._v(u, "blinkEvery", 0.0)) > 0.0 and now - float(Sim._v(u, "lastBlink", u["spawnTime"])) >= float(u["blinkEvery"]):
			u["lastBlink"] = now
			var fwd := 70.0 if u["opp"] else -70.0
			sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 30.0, "kind": "freeze"})
			u["y"] = clampf(u["y"] + fwd, 30.0, Sim.H - 30.0)
			sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 30.0, "kind": "zap"})
		if float(Sim._v(u, "magnetEvery", 0.0)) > 0.0 and now - float(Sim._v(u, "lastMagnet", u["spawnTime"])) >= float(u["magnetEvery"]):
			u["lastMagnet"] = now
			for e in sim.units:
				if e["opp"] != u["opp"] and e["hp"] > 0 and e["type"] != "building" and Sim.dist(e["x"], e["y"], u["x"], u["y"]) <= 65.0:
					var a := atan2(u["y"] - e["y"], u["x"] - e["x"])
					e["x"] += cos(a) * 28.0
					e["y"] += sin(a) * 28.0
			sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 60.0, "kind": "tornado"})
		if float(Sim._v(u, "lifetimeEnd", 0.0)) > 0.0 and now >= float(u["lifetimeEnd"]):
			u["hp"] = 0.0
	# temporary clones fade; Phoenix Soul handled in revive()

## Called by Sim before dead units are removed: Phoenix Soul revives once.
func revive(u: Dictionary) -> bool:
	if u.get("reviveOnce", false) and not u.get("revived", false):
		u["revived"] = true
		u["hp"] = floorf(float(u["maxHp"]) * 0.5)
		u["stunUntil"] = maxf(u["stunUntil"], sim.now + 600.0)
		sim.fx.append({"t": "spell", "x": u["x"], "y": u["y"], "r": 40.0, "kind": "fireball"})
		return true
	return false

## Chain Zap / Vampiric: called from the attack hook.
func on_attack(u: Dictionary, target: Dictionary, damage: float) -> void:
	var ls := float(Sim._v(u, "lifesteal", 0.0))
	if ls > 0.0:
		u["hp"] = minf(float(u["maxHp"]), u["hp"] + damage * ls)
	if u.get("zapOnHit", false):
		var others: Array = []
		for e in sim.units:
			if e["opp"] != u["opp"] and e["hp"] > 0 and e["id"] != target.get("id", -1) and Sim.dist(e["x"], e["y"], target["x"], target["y"]) <= 60.0:
				others.append(e)
		for e in others.slice(0, 2):
			sim._apply_damage([{"id": e["id"], "dmg": damage * 0.45, "attacker": u["id"]}])
			sim.fx.append({"t": "bolt", "x": e["x"], "y": e["y"]})
