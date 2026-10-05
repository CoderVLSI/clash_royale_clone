class_name SaveData
extends RefCounted
## Persistent player profile (decks, evolution/hero slots, tower, chests, currency). Stored at
## user://save.json. Mirrors the useState defaults in App.js.

const PATH := "user://save.json"
const DEFAULT_DECKS := [
	["mother_witch", "elixir_golem", "ice_golem", "ice_spirit", "skeletons", "fireball", "zap", "hog_rider"],
	["goblin_barrel", "princess", "knight", "dart_goblin", "inferno_tower", "rocket", "arrows", "skeletons"],
	["pekka", "bandit", "battle_ram", "electro_wizard", "magic_archer", "zap", "poison", "royal_ghost"],
	["golem", "night_witch", "baby_dragon", "mega_minion", "lightning", "zap", "elite_barbarians", "mini_pekka"],
	["giant", "prince", "archers", "spear_goblins", "fireball", "zap", "minions", "valkyrie"],
]

var decks: Array = []
var evo_slots: Array = []       # per deck: [id|"", id|""]
var hero_slots: Array = []      # per deck: id|""
var selected_deck := 0
var tower := "princess"
var gold := 5420
var gems := 150
var trophies := 3400
var chests: Array = []
var low_perf := false
var sound := true

func _init() -> void:
	reset_defaults()
	load_file()

func reset_defaults() -> void:
	decks = []
	for d in DEFAULT_DECKS:
		var ids: Array = []
		for id in d:
			ids.append(id)
		decks.append(ids)
	evo_slots = []
	hero_slots = []
	for i in decks.size():
		evo_slots.append(["", ""])
		hero_slots.append("")
	chests = [
		{"id": "chest_0", "slot": 0, "type": "SUPER MAGICAL"},
		{"id": "chest_1", "slot": 1, "type": "GOLD"},
		{"id": "chest_2", "slot": 2, "type": "GIANT"},
		{"id": "chest_3", "slot": 3, "type": "MAGICAL"},
	]

func load_file() -> void:
	if not FileAccess.file_exists(PATH):
		return
	var f := FileAccess.open(PATH, FileAccess.READ)
	var d = JSON.parse_string(f.get_as_text())
	if not (d is Dictionary):
		return
	decks = d.get("decks", decks)
	evo_slots = d.get("evo_slots", evo_slots)
	hero_slots = d.get("hero_slots", hero_slots)
	selected_deck = int(d.get("selected_deck", 0))
	tower = str(d.get("tower", "princess"))
	gold = int(d.get("gold", gold))
	gems = int(d.get("gems", gems))
	trophies = int(d.get("trophies", trophies))
	chests = d.get("chests", chests)
	low_perf = bool(d.get("low_perf", false))
	sound = bool(d.get("sound", true))

func save_file() -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify({"decks": decks, "evo_slots": evo_slots, "hero_slots": hero_slots, "selected_deck": selected_deck,
		"tower": tower, "gold": gold, "gems": gems, "trophies": trophies, "chests": chests, "low_perf": low_perf, "sound": sound}))

func current_deck_ids() -> Array:
	return decks[selected_deck]

func add_victory_chest() -> void:
	var used := {}
	for c in chests:
		used[int(c["slot"])] = true
	for i in 4:
		if not used.has(i):
			var types := ["SILVER", "SILVER", "SILVER", "GOLD", "GIANT", "MAGICAL"]
			chests.append({"id": "chest_%d" % Time.get_ticks_msec(), "slot": i, "type": types[randi() % types.size()]})
			return
