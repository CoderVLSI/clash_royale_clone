extends Node
## Entry point. Phase 1/2: boots straight into a battle; the lobby (Phase 4) will sit in front of this.

func _ready() -> void:
	var b := Battle.new()
	add_child(b)
	b.start()
