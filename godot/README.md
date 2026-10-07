# Clash Royale 3D (Godot 4.3 port)

A 3D port of the React Native game in the repo root. The simulation is a direct port of the `App.js` game loop;
the 2D sprites were replaced with 3D models authored in Blender.

* **Engine**: Godot 4.3, GL Compatibility renderer, portrait, Android arm64.
* **Data**: `data/cards.json` is extracted verbatim from `App.js` (181 cards, original field names).
* **Sim** (`scripts/sim.gd`, `mechanics.gd`, `abilities.gd`, `evo_mechanics.gd`): fixed 15 Hz tick; elixir,
  double elixir, overtime, tower decay, deck cycling, evolution cycles, hero slot, deploy rules, targeting + aggro,
  lane/bridge/river steering, projectiles, splash, spells (all 24), death spawns, champion/hero abilities,
  ~35 evolution mechanics, enemy AI.
* **3D** (`arena_view.gd`, `model_factory.gd`, `assets/models/*.glb`): arena, towers, units, projectiles, effects.
  Models come from `../tools/blender/make_models.py` (run through the Blender MCP).
* **UI** (`lobby.gd`, `battle.gd`, `loading_screen.gd`): loading screen, 5-tab lobby, deck builder with
  evolution/hero slots, shop, chests, social, events; battle HUD with drag-to-deploy and ability buttons.

## Run / test
    godot --path godot                              # play
    godot --headless --path godot -s tests/all_cards.gd      # smoke-test all 181 cards
    godot --headless --path godot -s tests/headless_sim.gd -- 1   # AI-vs-AI full match
    godot --headless --path godot -s tests/balance.gd        # side-bias check
    ./tools/build_apk.sh                            # signed debug APK -> release/

## Intentional differences from the 2D app
* **Symmetric arena.** The 2D layout was skewed by the on-screen card tray (player towers sat much closer to the
  river than the enemy's). The 3D arena mirrors the enemy half onto the player's, like real Clash Royale.
* **Hand cycling replaces the played slot** (like the real game) instead of shifting the hand.
* Charge distance threshold is 2 tiles (40 px); the 2D app's `threshold: 2` was effectively 2 px.
* Friendly battle has no network play yet (the repo's `server.js` is socket.io); the modal starts a local match.
* Some multi-part evolution mechanics are approximations of the wiki behaviour (Skeleton Army general,
  Goblin Drill rotation, Snowball pull, Skeleton Barrel drops). See `evo_mechanics.gd`.

## Generated art & audio
* **Card portraits** - `tools/art/gen_card_art.py` (OpenRouter, `google/gemini-3.1-flash(-lite)-image`) writes
  `assets/art/cards/<id>.jpg`. Evolved/hero variants reuse their base card's art; cards without art fall back to a
  live-rendered portrait of their 3D model. The script is resumable (`OPENROUTER_API_KEY` from the environment) and
  has a `--max-spend` guard. Only 27 of 123 cards have art so far (the account ran out of credit); re-run it after
  topping up to fill in the rest.
* **Sound** - `tools/art/gen_sfx.py` (ElevenLabs sound generation, `ELEVENLABS_API_KEY` from the environment) writes
  30 effects + 2 music loops to `assets/audio/`. Played through `scripts/sfx.gd`; Menu -> Sound toggles it.
  (ElevenLabs free-tier output is not licensed for commercial use.)

## Unique card models, icons and lobby art (Blender)
* `tools/blender/make_card_models.py` builds 27 unique models matched to the generated card portraits
  (`assets/models/cards/<card id>.glb`: 21 units/buildings + 6 spell visuals). Only the `TEAM` material slot is
  recoloured at runtime; evolved/hero variants reuse their base card's model. Cards without a model use the shared
  archetypes from `make_models.py`.
* `tools/blender/make_ui_art.py` renders the 12 UI icons (coin, gem, trophy, crown, chest, drop, tab icons, chat) and the
  castle for the lobby background; `tools/art/compose_lobby_bg.py` composites it over a painted dusk sky.
  (OpenRouter refuses image output below a $1 balance, so these were rendered in Blender instead of generated.)

## Card art prompts (lesson learned)
Early portraits were generated from only the card name + type, so the model guessed (Hog Rider became a boar-man, Ice
Spirit a monster). `tools/art/card_descriptions.py` now holds an accurate visual description for every card, and
`gen_card_art.py` uses it, defaults to the cheapest model, generates sequentially, and refuses to run unless the
OpenRouter balance clears the $1 image floor plus the planned spend. The wrong portraits (Hog Rider, Ice Spirit,
Battle Ram, Magic Archer, Princess) were removed; those cards use their corrected 3D models until regenerated.

## Research pass (Oct 2026) - added from public sources
* Cards: **Ronin** (Jul 2026; Parry blocks a melee hit every 3.5 s, reflects 2x) and **Minion Giant** (Sep 2026; flying, buildings only, ranged toxin, no knockback).
* Evolutions that the 2D app lacked: Evo **Princess**, **Minion Horde**, **Elite Barbarians**, **Electro Giant** (effects for Minion Horde / Electro Giant are approximations - sources gave no numbers).
* Heroes: all 18 (see `tools/heroes/gen_heroes.py`), one use per deployment, round ability buttons beside the hand.
* Still not implemented: real online friendly battles (local mock only), card levels / upgrades / gold-spend collection progress, the AI opponent using heroes, evolution slots for the AI.

## CHAOS mode (our own take)
Lobby -> battle tab -> **CHAOS** button. Every 45 s of battle time (first at 30 s) the battle pauses and you pick 1 of 3 offers: two **card modifiers**
(common -> rare -> epic as the match goes on, one upgrade per card, max 5) or a one-shot **power** (our twist): Meteor Shower, Elixir Surge, Deep Freeze, Rally Cry, Aegis, Overclock.
The AI picks too. 20 modifiers in `scripts/chaos.gd` (Swift, Sturdy, Sharp, Longshot, Cheap, Swarm, Wide Blast, Shielded, Vampiric, Frostbite, Splash Zone, Twin Deploy, Overload,
Titan, Phoenix Soul, Chain Zap, Explosive, Cloner, Blink, Magnetic) are generic and apply by card traits - the real event has hand-made modifiers per card (not copied).
Tests: `godot --headless --path godot -s tests/chaos.gd`.
