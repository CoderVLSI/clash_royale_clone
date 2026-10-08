extends SceneTree
## Plays a whole Chaos draft (always taking the first card), then an AI-vs-AI Chaos match with the drafted decks.
func _init() -> void:
	var d := ChaosDraft.new()
	root.add_child(d)
	await process_frame
	d.setup()
	var result: Array = []
	d.finished.connect(func(m: Array, t: Array): result.append(m); result.append(t))
	for i in 8:
		d._pick(0)
	await create_timer(1.3).timeout
	var bad: Array = []
	if result.is_empty():
		bad.append("draft never finished")
	else:
		var all: Array = result[0] + result[1]
		var uniq := {}
		for id in all:
			uniq[id] = true
		if result[0].size() != 8 or result[1].size() != 8 or uniq.size() != 16:
			bad.append("draft decks wrong: %s" % str(result))
		var sim := Sim.new(CardDB.deck_by_ids(result[0]), CardDB.deck_by_ids(result[1]))
		sim.ai_enabled = [true, true]
		sim.make_decks_private()
		sim.chaos = Chaos.new(sim)
		sim.chaos.next_at = 8.0
		var g := 0
		while sim.game_over == "" and g < 3000:
			sim.step()
			g += 1
			if sim.chaos.update_clock():
				sim.chaos.choose(0, sim.chaos.options[0])
				sim.chaos.waiting = false
		print("DRAFT ", result[0], " vs ", result[1], " ticks=", g, " picks=", sim.chaos.picks)
	print("DRAFT BAD: ", bad)
	quit(0)
