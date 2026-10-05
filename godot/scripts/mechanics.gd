class_name Mechanics
extends RefCounted
## Card-specific behaviour layered on top of Sim's generic engine. Each hook mirrors a place in the
## App.js game loop where per-card special cases lived. Phase 2 provides spells + the hook surface;
## the per-card mechanics (evolutions, heroes, champions, ~250 flags) are ported here in Phase 3.

var sim: Sim

func _init(s: Sim) -> void:
	sim = s

static func _v(d: Dictionary, k: String, dv: Variant = 0) -> Variant:
	return Sim._v(d, k, dv)

# ---- card resolution (evolution / hero variants / mirror) -------------------------------
func resolve_card(_pi: int, card: Dictionary) -> Dictionary:
	return card

# ---- spells ------------------------------------------------------------------------------
func cast_spell(card: Dictionary, x: float, y: float, opp: bool) -> void:
	var start_y := 0.0 if opp else Sim.H
	sim.projectiles.append({
		"id": sim._new_id(), "x": Sim.W / 2.0, "y": start_y, "targetId": -1, "targetX": x, "targetY": y,
		"speed": 15.0, "isSpell": true, "card": card, "opp": opp, "type": "spell_" + str(card["id"]),
	})

func spell_land(p: Dictionary) -> void:
	var card: Dictionary = p["card"]
	var opp: bool = p["opp"]
	var x: float = p["targetX"]
	var y: float = p["targetY"]
	var r: float = float(_v(card, "radius", 40))
	var dmg: float = float(_v(card, "damage", 0))
	var duration: float = float(_v(card, "duration", 0))
	var ground_only: bool = _v(card, "groundOnly", false) or card["id"] == "the_log"
	if duration > 0.0:
		sim.zones.append({"x": x, "y": y, "r": r, "dmg": dmg, "opp": opp, "last": sim.now - 1000.0, "interval": 1000.0,
			"end": sim.now + duration * 1000.0, "slow": float(_v(card, "slow", 0)), "kind": card["id"]})
		sim.fx.append({"t": "zone", "x": x, "y": y, "r": r, "kind": card["id"], "dur": duration})
		return
	var events: Array = []
	sim._apply_splash({"x": x, "y": y, "r": r, "dmg": dmg, "opp": opp, "skip_id": -1, "tower_factor": Sim.SPELL_TOWER_FACTOR,
		"attacker": -1, "ground_only": ground_only, "slow": float(_v(card, "slow", 0)), "stun": float(_v(card, "stun", 0)),
		"knockback": float(_v(card, "knockback", 0)), "tower_hit": true}, events)
	for e in events:
		e["slowDuration"] = float(_v(card, "slowDuration", 2.5))
	sim._apply_damage(events)
	sim.fx.append({"t": "spell", "x": x, "y": y, "r": r, "kind": card["id"]})

# ---- hooks (no-ops until Phase 3) ---------------------------------------------------------
func pre_update() -> void:
	pass

func post_update() -> void:
	pass

func update_unit_pre(_u: Dictionary, _dmg: Array, _splash: Array) -> void:
	pass

func modify_damage(_u: Dictionary, _target: Dictionary, base_damage: float, _tdist: float) -> float:
	return base_damage

func on_attack(_u: Dictionary, _target: Dictionary, _damage: float, _dmg: Array, _splash: Array) -> void:
	pass

func on_ranged_attack(_u: Dictionary, _target: Dictionary, _damage: float, _proj: Dictionary) -> void:
	pass

func on_projectile_hit(_p: Dictionary, _tgt: Variant, _dmg: Array, _splash: Array) -> void:
	pass

func on_spawn(_u: Dictionary) -> void:
	pass

func on_death(_d: Dictionary) -> void:
	pass

func is_raged(u: Dictionary) -> bool:
	return float(_v(u, "rageUntil", 0.0)) > sim.now or _v(u, "permRage", false)

func damage_unit(u: Dictionary, e: Dictionary) -> void:
	sim.damage_unit_basic(u, e)
