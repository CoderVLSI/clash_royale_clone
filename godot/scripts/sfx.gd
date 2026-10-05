class_name Sfx
extends Node
## Sound effects + music (ElevenLabs-generated, assets/audio/*.mp3). Static facade: Sfx.play("card_deploy").

static var inst: Sfx
var pool: Array = []
var music_player: AudioStreamPlayer
var enabled := true
var last: Dictionary = {}
var streams: Dictionary = {}
var current_music := ""

func _ready() -> void:
	inst = self
	for i in 12:
		var p := AudioStreamPlayer.new()
		add_child(p)
		pool.append(p)
	music_player = AudioStreamPlayer.new()
	music_player.volume_db = -9.0
	add_child(music_player)

func _stream(name: String) -> AudioStream:
	if streams.has(name):
		return streams[name]
	var path := "res://assets/audio/%s.mp3" % name
	var s: AudioStream = load(path) if ResourceLoader.exists(path) else null
	streams[name] = s
	return s

static func play(name: String, vol_db: float = 0.0, min_gap_ms: int = 0, pitch_jitter: float = 0.06) -> void:
	if inst == null or not inst.enabled:
		return
	var now := Time.get_ticks_msec()
	if min_gap_ms > 0 and now - int(inst.last.get(name, -99999)) < min_gap_ms:
		return
	inst.last[name] = now
	var s := inst._stream(name)
	if s == null:
		return
	for p in inst.pool:
		if not p.playing:
			p.stream = s
			p.volume_db = vol_db
			p.pitch_scale = 1.0 + randf_range(-pitch_jitter, pitch_jitter)
			p.play()
			return

static func music(name: String) -> void:
	if inst == null:
		return
	if inst.current_music == name and inst.music_player.playing:
		return
	inst.current_music = name
	var s := inst._stream(name)
	if s == null:
		inst.music_player.stop()
		return
	if s is AudioStreamMP3:
		(s as AudioStreamMP3).loop = true
	inst.music_player.stream = s
	inst.music_player.volume_db = -9.0
	if inst.enabled:
		inst.music_player.play()

static func stop_music() -> void:
	if inst != null:
		inst.current_music = ""
		inst.music_player.stop()

static func set_enabled(on: bool) -> void:
	if inst == null:
		return
	inst.enabled = on
	if not on:
		inst.music_player.stop()
	elif inst.current_music != "":
		var n := inst.current_music
		inst.current_music = ""
		music(n)
