class_name CardArt
extends RefCounted
## Generated card portraits (tools/art/gen_card_art.py). Evolved / hero variants reuse the base card's art.

static var _base_of: Dictionary = {}
static var _cache: Dictionary = {}
static var _ready_map := false

static func _build_map() -> void:
	if _ready_map:
		return
	_ready_map = true
	CardDB.ensure()
	for c in CardDB.all:
		if c.get("evolvesTo") != null:
			_base_of[str(c["evolvesTo"])] = str(c["id"])
		if c.get("heroVariantId") != null:
			_base_of[str(c["heroVariantId"])] = str(c["id"])

static func base_id(card: Dictionary) -> String:
	## Base card of an evolution / hero variant (used to find the 3D model).
	_build_map()
	var id := str(card["id"])
	return _base_of.get(id, id)

static func art_id(card: Dictionary) -> String:
	_build_map()
	var id := str(card["id"])
	# evolutions / heroes use their own generated portrait when one exists
	if ResourceLoader.exists("res://assets/art/cards/%s.jpg" % id):
		return id
	return _base_of.get(id, id)

static func texture(card: Dictionary) -> Texture2D:
	var id := art_id(card)
	if _cache.has(id):
		return _cache[id]
	var path := "res://assets/art/cards/%s.jpg" % id
	var tex: Texture2D = load(path) if ResourceLoader.exists(path) else null
	_cache[id] = tex
	return tex
