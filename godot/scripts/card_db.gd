class_name CardDB
extends RefCounted
## Card database. cards.json is extracted verbatim from the original App.js CARDS array
## (181 entries) so every stat/flag keeps its original name. Static, lazily loaded.

static var all: Array = []
static var by_id: Dictionary = {}
static var _loaded := false

static func ensure() -> void:
	if _loaded:
		return
	_loaded = true
	var f := FileAccess.open("res://data/cards.json", FileAccess.READ)
	var parsed = JSON.parse_string(f.get_as_text())
	for c in parsed:
		all.append(c)
		by_id[c["id"]] = c

static func get_card(id: String) -> Dictionary:
	ensure()
	return by_id.get(id, {})

static func deck_by_ids(ids: Array) -> Array:
	ensure()
	var out: Array = []
	for i in ids:
		var c := get_card(i)
		if not c.is_empty():
			out.append(c)
	return out

static func playable() -> Array:
	ensure()
	return all.filter(func(c): return not c.get("isToken", false) and c.get("cost", 0) > 0)
