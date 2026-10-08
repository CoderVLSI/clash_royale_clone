class_name ChaosDraft
extends Control
## CHAOS DRAFT: eight rounds, each shows four random cards; you take one, the opponent takes one of the remaining three. The two drafted
## decks then play a normal Chaos match (every drafted card has its three Chaos modifiers).

signal finished(player_ids: Array, enemy_ids: Array)
signal cancelled

const ROUNDS := 8
const CHOICES := 4

var pool: Array = []
var mine: Array = []
var theirs: Array = []
var choices: Array = []
var round_i := 0
var locked := false
var title: Label
var info: Label
var grid: Control
var mine_row: Control
var rng := RandomNumberGenerator.new()

func setup() -> void:
	rng.randomize()
	CardDB.ensure()
	Chaos.ensure()
	var seen := {}
	for c in CardDB.all:
		var id := str(c["id"])
		if seen.has(id) or c.get("isToken", false) or c.get("isMirror", false) or int(c.get("cost", 0)) <= 0:
			continue
		if id.begins_with("hero_") or id.begins_with("evolved_") or not Chaos.DATA.has(id):
			continue
		seen[id] = true
		pool.append(id)
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = Color("1b0f33")
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	title = UI.label("CHAOS DRAFT", 36, Color("e0b3ff"), 6)
	title.position = Vector2(0, 26)
	title.size = Vector2(390, 48)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)
	info = UI.label("", 17, Color("ffe08a"), 3)
	info.position = Vector2(0, 78)
	info.size = Vector2(390, 48)
	info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(info)
	grid = Control.new()
	add_child(grid)
	mine_row = Control.new()
	mine_row.position = Vector2(0, 642)
	add_child(mine_row)
	var lbl := UI.label("YOUR DECK", 14, Color("b9d6ff"), 2)
	lbl.position = Vector2(0, 620)
	lbl.size = Vector2(390, 20)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(lbl)
	var back := UI.button("Cancel", Color("7f8c8d"), func(): cancelled.emit(), Vector2(110, 34), 14)
	back.position = Vector2(140, 804)
	add_child(back)
	_next_round()

func _next_round() -> void:
	if round_i >= ROUNDS:
		title.text = "DECKS READY!"
		info.text = "Chaos begins..."
		for c in grid.get_children():
			c.queue_free()
		get_tree().create_timer(1.0).timeout.connect(func(): finished.emit(mine.duplicate(), theirs.duplicate()))
		return
	locked = false
	var avail := pool.filter(func(id): return not (id in mine) and not (id in theirs))
	avail.shuffle()
	choices = avail.slice(0, CHOICES)
	title.text = "DRAFT  %d / %d" % [round_i + 1, ROUNDS]
	info.text = "Pick a card - your opponent takes one of the rest" if theirs.is_empty() else "Opponent took %s" % str(CardDB.get_card(theirs[theirs.size() - 1]).get("name", ""))
	for c in grid.get_children():
		c.queue_free()
	for i in choices.size():
		var card: Dictionary = CardDB.get_card(choices[i])
		var b := Button.new()
		b.size = Vector2(160, 214)
		b.position = Vector2(25 + (i % 2) * 180, 140 + (i / 2) * 235)
		var col := Color("9b59b6")
		b.add_theme_stylebox_override("normal", UI.style(Color(0.12, 0.1, 0.25, 0.95), 16, col, 3))
		b.add_theme_stylebox_override("hover", UI.style(Color(0.22, 0.17, 0.42, 0.98), 16, col.lightened(0.3), 4))
		b.add_theme_stylebox_override("pressed", UI.style(Color(0.07, 0.06, 0.18), 16, col, 4))
		var cw := UI.card_widget(card, Vector2(110, 140))
		cw.position = Vector2(25, 12)
		cw.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(cw)
		var nm := UI.label(str(card["name"]), 15, Color.WHITE, 3)
		nm.position = Vector2(0, 158)
		nm.size = Vector2(160, 22)
		nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		nm.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(nm)
		var t := UI.label(_type_text(card), 12, Color("b9d6ff"), 2)
		t.position = Vector2(0, 182)
		t.size = Vector2(160, 18)
		t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		t.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(t)
		b.pressed.connect(_pick.bind(i))
		grid.add_child(b)

static func _type_text(c: Dictionary) -> String:
	match str(c.get("type", "ground")):
		"spell": return "Spell"
		"building": return "Building"
		"flying": return "Air troop"
	return "Troop"

func _pick(i: int) -> void:
	if locked:
		return
	locked = true
	Sfx.play("ui_confirm")
	var id: String = choices[i]
	mine.append(id)
	var rest := choices.filter(func(x): return x != id)
	theirs.append(ai_choose(rest))
	round_i += 1
	_refresh_mine()
	_next_round()

## The opponent prefers a mix: it takes the card whose type it has the fewest of, ties broken randomly.
func ai_choose(rest: Array) -> String:
	var counts := {}
	for id in theirs:
		var t := str(CardDB.get_card(id).get("type", "ground"))
		counts[t] = int(counts.get(t, 0)) + 1
	rest = rest.duplicate()
	rest.shuffle()
	var best: String = rest[0]
	var best_n := 99
	for id in rest:
		var n := int(counts.get(str(CardDB.get_card(id).get("type", "ground")), 0))
		if str(CardDB.get_card(id).get("type", "")) == "spell":
			n += 2 * maxi(0, int(counts.get("spell", 0)) - 1)
		if n < best_n:
			best_n = n
			best = id
	return best

func _refresh_mine() -> void:
	for c in mine_row.get_children():
		c.queue_free()
	for i in mine.size():
		var cw := UI.card_widget(CardDB.get_card(mine[i]), Vector2(62, 78))
		cw.position = Vector2(51 + (i % 4) * 72, (i / 4) * 84)
		mine_row.add_child(cw)
