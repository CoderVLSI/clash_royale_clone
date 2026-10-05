extends Node
## Entry point / screen flow: loading screen -> lobby -> battle -> lobby (App.js inLobby/inGame state).
## Debug flags (after `--`): --autoplay (straight into an AI-vs-AI battle), --tab=N --lobby-shot=path.

var save: SaveData
var current: Node

func _ready() -> void:
	save = SaveData.new()
	var sfx := Sfx.new()
	add_child(sfx)
	add_child(CardIcons.new())
	sfx.enabled = save.sound
	get_tree().node_added.connect(func(n: Node):
		if n is BaseButton and not n.has_meta("sfx_hooked"):
			n.set_meta("sfx_hooked", true)
			(n as BaseButton).pressed.connect(func(): Sfx.play("ui_click", -4.0, 40)))
	var args := OS.get_cmdline_user_args()
	var direct_battle := false
	for a in args:
		if a == "--autoplay" or a == "--battle":
			direct_battle = true
	if direct_battle:
		_start_battle(false)
	else:
		_show_loading()

func _swap(n: Node) -> void:
	if current:
		current.queue_free()
	current = n
	add_child(n)

func _show_loading() -> void:
	var ml := LoadingScreen.new()
	ml.done.connect(_show_lobby)
	_swap(ml)

func _show_lobby() -> void:
	Sfx.music("music_lobby")
	var lobby := Lobby.new()
	_swap(lobby)
	lobby.setup(save)
	var tab := -1
	var shot := ""
	var detail := ""
	var detail_page := 0
	var detail_mode := ""
	var chest_taps := -1
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--detail="):
			detail = a.substr(9)
		if a.begins_with("--chest-taps="):
			chest_taps = int(a.substr(13))
		if a.begins_with("--detail-mode="):
			detail_mode = a.substr(14)
		if a.begins_with("--detail-page="):
			detail_page = int(a.substr(14))
		if a.begins_with("--tab="):
			tab = int(a.substr(6))
		elif a.begins_with("--lobby-shot="):
			shot = a.substr(13)
	if tab >= 0:
		lobby._show_tab(tab)
	lobby.start_battle.connect(_start_battle.bind(false))
	lobby.start_friendly.connect(_start_battle.bind(true))
	if detail != "":
		lobby._show_tab(1)
		lobby._open_card_detail(CardDB.get_card(detail))
		var cd := lobby.modal_layer.get_child(lobby.modal_layer.get_child_count() - 1) as CardDetail
		if detail_mode != "":
			cd._switch_mode(detail_mode)
		cd._show_page(detail_page)
	if chest_taps >= 0:
		lobby._open_chest(save.chests[int(save.chests.size() / 2)])
		var ov := lobby.modal_layer.get_child(lobby.modal_layer.get_child_count() - 1) as ChestOpening
		for i in chest_taps:
			ov._tap()
			await get_tree().create_timer(2.2).timeout
	if shot != "":
		await get_tree().create_timer(2.5 if detail != "" else 1.2).timeout
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(shot)
		print("SCREENSHOT saved ", shot)
		get_tree().quit()

func _start_battle(_friendly: bool) -> void:
	Sfx.play("ui_confirm")
	Sfx.stop_music()
	var b := Battle.new()
	_swap(b)
	var ids: Array = save.current_deck_ids()
	var evo: Array = save.evo_slots[save.selected_deck].filter(func(x): return x != "")
	var hero: String = save.hero_slots[save.selected_deck]
	b.start(ids, save.tower, evo, hero, save.low_perf)
	b.finished.connect(_on_battle_finished)

func _on_battle_finished(result: String) -> void:
	if result == "VICTORY":
		save.add_victory_chest()
		save.trophies += 30
	elif result == "DEFEAT":
		save.trophies = maxi(0, save.trophies - 20)
	save.save_file()
	_show_lobby()
