#!/usr/bin/env python3
"""Generates godot/data/chaos_mods.json: three CHAOS modifiers (Common / Rare / Epic) for every base card.

Each modifier is a name + a bag of effect primitives ("fx"); descriptions are generated from the fx so they can never
disagree with what the engine does (godot/scripts/chaos.gd implements every primitive).
Entries marked _s=1 mirror modifiers reported by public Chaos guides (Knight, Giant, Musketeer, Baby Dragon, ...);
everything else is our own design in the same style.  Run:  python3 tools/chaos/gen_chaos_mods.py
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
CARDS = {c["id"]: c for c in json.load(open(os.path.join(ROOT, "godot/data/cards.json")))}

MODS = {}
def card(cid, c, r, e):
    MODS[cid] = [("common",) + c, ("rare",) + r, ("epic",) + e]
def M(name, **fx):
    return (name, fx)

# ------------------------------------------------------------------------------------------------ ground troops
card("knight",
     M("Iron Plating", hp=3.0, speed=0.8, _s=1), M("Shield Bash", stun=0.9, _s=1), M("Mega Summons", spawnDeploy=[["mega_knight", 1]], _s=1))
card("archers",
     M("Weakening Shots", weaken=[0.2, 4], _s=1), M("Piercing Arrows", pierce=1, dmg=1.15), M("Archer Company", count=2, hit=1.2))
card("giant",
     M("Sprint Giant", speed=3.5, _s=1), M("Charging Giant", charge=1, _s=1), M("Giant Barrel", castDeploy=[["barb_barrel", 2.0, 1.6]], _s=1))
card("mini_pekka",
     M("Pancake Rush", hit=1.35, speed=1.15), M("Heavy Metal", hp=1.6, noKB=1), M("Pekka Twins", spawnDeploy=[["mini_pekka", 1]]))
card("spear_goblins",
     M("Quick Gobs", speed=1.3, range=1.25), M("Poison Spears", slow=[0.3, 2.5], dmg=1.2), M("Gob Horde", count=3, hit=1.2))
card("musketeer",
     M("Spread Shot", splash=30, _s=1), M("Heavy Rounds", dmg=2.0, _s=1), M("Elite Squad", spawnDeploy=[["musketeer", 2]], _s=1))
card("barbarians",
     M("Berserk Rush", speed=1.3, hit=1.3), M("Barbarian Chiefs", hp=1.5, dmg=1.4, scale=1.2), M("Barbarian Horde", count=4, rageSelf=6))
card("skeleton_army",
     M("Bone Sprint", speed=1.35), M("Bone Armor", shield=90), M("Skeleton Legion", count=12))
card("skeletons",
     M("Fast Bones", speed=1.4), M("Skeleton Pack", count=3), M("Necro Surge", spawnHit=["skeletons", 2, 3]))
card("valkyrie",
     M("Whirlwind", radius=1.4, hit=1.2), M("Spin Stun", stun=0.6, hp=1.2), M("Valkyrie Sisters", spawnDeploy=[["valkyrie", 1]]))
card("witch",
     M("Skeleton Surge", rate=1.8), M("Hex", weaken=[0.25, 5], dmg=1.25), M("Army Caller", spawnEvery=["skeleton_army", 1, 14]))
card("hog_rider",
     M("Hog Sprint", speed=1.3, hp=1.2), M("Battering Ram", kb=35, stun=0.4), M("Hog Squad", spawnDeploy=[["hog_rider", 1]]))
card("prince",
     M("Royal Charge", speed=1.25, dmg=1.2), M("Lancer's Resolve", hp=1.5, noKB=1), M("Prince Alliance", spawnDeploy=[["dark_prince", 1]]))
card("wizard",
     M("Arcane Focus", range=1.25, hit=1.2), M("Flame Burst", castHit=["fireball", 5, 0.35, 0.6]), M("Archmage", castDeploy=[["fireball", 0.6, 1.0]], dmg=1.5, splash=45))
card("sword_goblins",
     M("Sharp Swords", dmg=1.3, speed=1.2), M("Goblin Mob", count=2), M("Brawler Backup", spawnDeploy=[["goblin_brawler", 2]]))
card("ice_wizard",
     M("Chill Aura", slow=[0.45, 3]), M("Frostbite", weaken=[0.2, 4], stun=0.3), M("Blizzard", pulse=["slow", 4, 80, 0.4]))
card("royal_hogs",
     M("Royal Rush", speed=1.25, hp=1.2), M("Royal Squad", count=2), M("Mini Hog Riders", spawnDeploy=[["hog_rider", 2]], _s=1))
card("miner",
     M("Deep Digger", speed=1.4, hp=1.2), M("Tunnel Blast", blast=[60, 200, 0.6, 25]), M("Mining Crew", spawnDeploy=[["miner", 1]]))
card("goblin_giant",
     M("Heavy Backpack", hp=1.35), M("Goblin Platoon", spawnDeploy=[["spear_goblins", 3]]), M("Gobbo Colossus", scale=1.3, hp=1.5, spawnDeath=[["sword_goblins", 3]]))
card("three_musketeers",
     M("Triple Barrel", hit=1.25, range=1.15), M("Rapid Reload", dmg=1.35, cost=-1), M("Squad Reinforcements", spawnDeploy=[["musketeer", 2]]))
card("royal_giant",
     M("Long Cannon", range=1.4), M("Cannon Shells", splash=35, dmg=1.2), M("Royal Barrage", castHit=["fireball", 4, 0.5, 0.7]))
card("dark_prince",
     M("Quick Charge", speed=1.25), M("Shield Renewal", pulse=["shield", 5, 25, 250], _s=1), M("Bat Prince", spawnHit=["bats", 2, 2], _s=1))
card("elite_barbarians",
     M("Elite Speed", speed=1.25, hit=1.2), M("Elite Armor", hp=1.5, shield=200), M("Elite Warband", spawnDeploy=[["barbarians", 1]]))
card("golem",
     M("Rocky Road", hp=1.35, speed=1.15), M("Earthquake Stomp", pulse=["stun", 6, 60, 0.5]), M("Golem Brood", spawnEvery=["golemite", 1, 7]))
card("pekka",
     M("Heavy Hits", dmg=1.3), M("Pekka Armor", hp=1.4, noKB=1), M("Pancake Storm", spawnHit=["mini_pekka", 1, 4]))
card("mega_knight",
     M("Bigger Leap", jumps=1, radius=1.3), M("Landing Quake", blast=[90, 500, 1.0, 40]), M("Mega Rebirth", revive=0.6, scale=1.15))
card("electro_wizard",
     M("Electro Spirits", spawnDeploy=[["electro_spirit", 2]], _s=1), M("Electro Pentachain", zap=[4, 0.9], _s=1), M("Electro Storm", zap=[8, 0.8], hit=1.2, _s=1))
card("fire_spirit",
     M("Spirit Swarm", count=2), M("Wide Burn", dmg=1.3, radius=1.4), M("Inferno Spirits", castDeath=[["fireball", 0.5, 0.8]]))
card("ice_spirit",
     M("Longer Freeze", freeze=1.0), M("Spirit Pair", count=1), M("Blizzard Spirit", castDeath=[["freeze", 1.0, 0.45]]))
card("electro_spirit",
     M("Long Chain", zap=[3, 1.0]), M("Spirit Pair", count=1), M("Overload", zap=[6, 1.0], stun=0.8))
card("heal_spirit",
     M("Quick Heal", radius=1.4), M("Jump Strike", blast=[40, 150, 0, 0], _s=1), M("Heal Spirit Trio", count=2, _s=1))
card("bomber",
     M("Long Fuse", range=1.3), M("Bomb Cluster", splash=50, dmg=1.3), M("Bomb Barrage", castHit=["fireball", 3, 0.35, 0.5]))
card("furnace",
     M("Hot Coals", rate=1.5), M("Fire Fortress", hp=1.5, shield=200), M("Lava Spirits", spawnEvery=["fire_spirit", 2, 6]))
card("spirit_empress",
     M("Soul Boost", speed=1.2, hit=1.2), M("Spirit Guard", shield=300, hp=1.2), M("Empress Court", spawnDeploy=[["fire_spirit", 1], ["ice_spirit", 1], ["electro_spirit", 1]]))
card("lumberjack",
     M("Axe Fury", hit=1.3), M("Stump Rage", pulse=["rage", 5, 60, 1]), M("Double Axe", spawnDeploy=[["lumberjack", 1]]))
card("guards",
     M("Guard Shields", shield=120), M("Rapid Spears", hit=1.4, range=1.15), M("Royal Guard", spawnDeploy=[["guards", 1]]))
card("ram_rider",
     M("Faster Ram", speed=1.25), M("Bola Snare", slow=[0.5, 2.5], stun=0.3), M("Double Ram", spawnDeploy=[["battle_ram", 1]]))
card("battle_healer",
     M("Healing Aura", pulse=["heal", 3, 70, 150]), M("Holy Armor", shield=250, hp=1.25), M("Revival Pulse", pulse=["heal", 2, 90, 300], revive=0.5))
card("ice_golem",
     M("Cold Snap", slow=[0.5, 3], hp=1.2), M("Frozen Blast", blast=[60, 120, 0.8, 0]), M("Glacier Core", castDeath=[["freeze", 1.0, 0.55]]))
card("dart_goblin",
     M("Double Darts", hit=2.0, _s=1), M("Magic Darts", pierce=1, dmg=1.3, _s=1), M("Sparky Darts", dmg=4.0, hit=0.5, splash=50, _s=1))
card("princess",
     M("Long Shot", range=1.3), M("Fire Arrows", castHit=["arrows", 3, 0.5, 0.6]), M("Princess Barrage", pierce=1, splash=55, hit=1.3))
card("bandit",
     M("Dash Strike", speed=1.2), M("Heist", dmg=1.5, lifesteal=0.25), M("Ghost Dash", hidden=1, dmg=1.6))
card("battle_ram",
     M("Ram Boost", speed=1.3), M("Ram Impact", blast=[70, 350, 0.8, 30]), M("Barbarian Ram", spawnDeploy=[["barbarians", 1]]))
card("hunter",
     M("Wider Spread", range=1.2, dmg=1.2), M("Hunter's Mark", weaken=[0.3, 5]), M("Hunter Salvo", hit=1.6, dmg=1.3))
card("electro_giant",
     M("Wider Shock", shock=1.6, _s=1), M("Spirit Escort", spawnDeploy=[["electro_spirit", 2]], _s=1), M("Tornado Pull", pulse=["pull", 4, 100, 40], _s=1))
card("night_witch",
     M("Dark Swarm", spawnHit=["bats", 2, 3]), M("Night Stalker", hp=1.4, hidden=1), M("Bat Legion", spawnEvery=["bats", 4, 8]))
card("elixir_golem",
     M("Elixir Refund", elixirDeath=1), M("Golem Split", spawnDeath=[["elixir_golemite", 2]]), M("Elixir Surge", elixirDeploy=2, hp=1.3))
card("firecracker",
     M("Knockback Sparks", kb=35, _s=1), M("Split Shot", splash=55, dmg=1.2, _s=1), M("Firecracker Clones", spawnHit=["firecracker", 1, 8], _s=1))
card("giant_skeleton",
     M("Bone Bomb", boom=[3.0, 90]), M("Giant Bones", hp=1.5, scale=1.2), M("Skeleton Burst", spawnDeath=[["skeleton_army", 1]]))
card("magic_archer",
     M("Magic Pierce", range=1.2, dmg=1.2), M("Magic Chain", zap=[2, 0.8]), M("Arcane Barrage", hit=1.5, pierce=1))
card("royal_ghost",
     M("Ghost Speed", speed=1.25), M("Spectral Blade", dmg=1.4, lifesteal=0.3), M("Ghost Squad", spawnDeploy=[["bats", 3]]))
card("sparky",
     M("Double Health", hp=2.0, _s=1), M("Fast Recharge", hit=1.6, _s=1), M("Piercing Shot", pierce=1, dmg=1.2, _s=1))
card("mother_witch",
     M("Curse Boost", range=1.2, hit=1.2), M("Hog Curse", spawnHit=["cursed_hog", 1, 4]), M("Witch Coven", spawnDeploy=[["witch", 1]]))
card("wall_breakers",
     M("Faster Breakers", speed=1.3), M("Big Blast", dmg=1.5, radius=1.4), M("Wall Breaker Squad", count=2))
card("bowler",
     M("Longer Throw", range=1.3, hit=1.3, _s=1), M("Chain Boulders", zap=[3, 0.9], _s=1), M("Explosive Boulders", splash=55, dmg=1.35, stun=0.4, _s=1))
card("executioner",
     M("Long Handle", range=1.25), M("Boomerang Edge", dmg=1.3, pierce=1), M("Executioner's Verdict", dmg=1.5, hit=1.3))
card("zappies",
     M("Static Zap", stun=0.6), M("Zappy Quartet", count=1), M("Zappies Surge", zap=[3, 0.8], hit=1.2))
card("rascals",
     M("Boy Buff", hp=1.3), M("Girl Volley", count=2), M("Rascal Squad", spawnDeploy=[["goblin_gang", 1]]))
card("royal_recruits",
     M("Recruit Shields", shield=150), M("Recruit Charge", speed=1.25, hp=1.2), M("Recruit Squad", count=2))
card("cannon_cart",
     M("Cart Armor", hp=1.4), M("Mobile Cannon", range=1.3, dmg=1.3), M("Cannon Convoy", spawnDeploy=[["cannon", 1]]))
card("goblin_drill",
     M("Rapid Drill", rate=1.5), M("Drill Quake", blast=[70, 250, 0.7, 30]), M("Goblin Quarry", spawnEvery=["goblin_brawler", 1, 5]))
card("fisherman",
     M("Thick Line", hp=1.4, _s=1), M("Steel Hook", dmg=1.4, slow=[0.4, 2]), M("Endless Hook", range=2.0, _s=1))
card("goblin_gang",
     M("Gang Speed", speed=1.25), M("Spear Support", count=2), M("Brawler Boss", spawnDeploy=[["goblin_brawler", 2]]))
card("goblin_demolisher",
     M("Reinforced Fuse", hp=1.3), M("Blast Radius", radius=1.4, dmg=1.2), M("Demolition Crew", castDeath=[["fireball", 1.0, 1.0]]))
card("goblin_machine",
     M("Reinforced Frame", hp=1.35), M("Mini Rockets", castHit=["rocket", 4, 0.15, 0.5], _s=1), M("Fireball Charge", charge=1, castHit=["fireball", 3, 0.5, 0.7], _s=1))
card("rune_giant",
     M("Rune Armor", hp=1.35), M("Enchant Boost", dmg=1.4), M("Rune Surge", pulse=["rage", 6, 80, 1]))
card("suspicious_bush",
     M("Thick Bush", hp=1.5), M("Prickly Bush", blast=[50, 150, 0.5, 20]), M("Goblin Ambush", spawnDeploy=[["goblin_gang", 1]]))
card("berserker",
     M("Frenzy", hit=1.3), M("Blood Rage", lifesteal=0.35), M("Berserker Duo", spawnDeploy=[["berserker", 1]]))
card("golden_knight",
     M("Gilded Armor", hp=1.3), M("Golden Dash", dmg=1.3, speed=1.15), M("Dash Quake", blast=[70, 300, 0.6, 30]))
card("skeleton_king",
     M("Royal Bones", hp=1.3), M("Soul Harvest", spawnHit=["skeletons", 3, 3]), M("Undead Court", spawnDeploy=[["skeleton_army", 1]]))
card("archer_queen",
     M("Quick Draw", hit=1.3), M("Crossbow Pierce", pierce=1, dmg=1.25), M("Royal Barrage", castHit=["arrows", 4, 0.7, 0.7]))
card("monk",
     M("Monk Armor", hp=1.35), M("Palm Strike", kb=30, dmg=1.3), M("Inner Peace", pulse=["heal", 4, 100, 250], shield=200))
card("mighty_miner",
     M("Drill Power", dmg=1.35), M("Bomb Drop", castHit=["fireball", 4, 0.35, 0.5]), M("Mine Collapse", blast=[80, 450, 0.8, 35]))
card("little_prince",
     M("Royal Guardian", hp=1.3), M("Quick Shot", hit=1.35), M("Prince's Guard", spawnDeploy=[["knight", 1]]))
card("boss_bandit",
     M("Heavy Loot", hp=1.3), M("Ghost Dash", hidden=1, dmg=1.35), M("Bandit Gang", spawnDeploy=[["bandit", 1]]))
card("goblinstein",
     M("Monster Mash", hp=1.3), M("Lightning Rod", zap=[3, 0.8]), M("Doctor's Orders", spawnDeploy=[["goblin_brawler", 2]], shield=300))
card("ronin",
     M("Sharp Katana", dmg=1.3), M("Iron Resolve", hp=1.3, noKB=1), M("Ronin's Duel", lifesteal=0.3, dmg=1.4))

# ------------------------------------------------------------------------------------------------ air troops
card("baby_dragon",
     M("Fast Wings", speed=1.35, _s=1), M("Fireball Breath", castHit=["fireball", 5, 0.5, 0.6], _s=1), M("Dragon Egg", spawnDeath=[["baby_dragon", 1]], _s=1))
card("minions",
     M("Swarm Speed", speed=1.25), M("Minion Pack", count=1), M("Minion Legion", count=3, hp=1.2))
card("minion_horde",
     M("Horde Rush", speed=1.25), M("Horde Bolts", dmg=1.3), M("Minion Tide", count=3))
card("lava_hound",
     M("Molten Hide", hp=1.4), M("Pup Pack", spawnDeath=[["lava_pups", 4]]), M("Lava Rain", castEvery=["fireball", 6, 0.3, 0.5]))
card("bats",
     M("Bat Boost", speed=1.3), M("Bat Wave", count=2), M("Vampire Bats", lifesteal=0.5, count=2))
card("skeleton_barrel",
     M("Barrel Armor", hp=1.4), M("Skeleton Drop", spawnDeath=[["skeleton_army", 1]]), M("Barrel Blast", boom=[2.0, 80]))
card("mega_minion",
     M("Cloaked Minion", hidden=1, _s=1), M("Frost Strike", slow=[0.35, 2.5], _s=1), M("Mega Squad", spawnDeploy=[["mega_minion", 3]], _s=1))
card("balloon",
     M("Fast Balloon", speed=1.3, splash=50, _s=1), M("Heavy Payload", dmg=1.3, boom=[1.5, 70]), M("Double Bomb", dmg=2.0, _s=1))
card("inferno_dragon",
     M("Inferno Heat", dmg=1.3), M("Dragon Scorch", range=1.2, hp=1.2), M("Twin Inferno", spawnDeploy=[["inferno_dragon", 1]]))
card("electro_dragon",
     M("Static Wings", speed=1.2, hp=1.2), M("Longer Chain", zap=[3, 0.9]), M("Thunder Dragon", zap=[6, 0.9], stun=0.5))
card("flying_machine",
     M("Light Frame", speed=1.25, hp=1.2), M("Gatling Shots", hit=1.4), M("Machine Squadron", spawnDeploy=[["flying_machine", 1]]))
card("skeleton_dragons",
     M("Dragon Dash", speed=1.25), M("Bone Fire", dmg=1.35), M("Dragon Hoard", count=1, spawnDeath=[["skeletons", 4]]))
card("phoenix",
     M("Quick Hatch", egg=0.55, _s=1), M("Twin Eggs", spawnDeath=[["phoenix", 1]], _s=1), M("Rebirth", revive=0.8, _s=1))
card("minion_giant",
     M("Giant Wings", hp=1.3), M("Minion Escort", spawnDeploy=[["minions", 1]]), M("Dive Bomb", boom=[3.0, 80]))

# ------------------------------------------------------------------------------------------------ buildings
card("cannon",
     M("Long Barrel", range=1.3, _s=1), M("Splash Shells", splash=50, _s=1), M("Mini Cannon Cart", spawnDeath=[["cannon_cart", 1]], _s=1))
card("tesla",
     M("Super Charge", dmg=1.3), M("Coil Storm", zap=[3, 0.8]), M("Thunder Tower", range=1.2, hit=1.5, zap=[5, 0.7]))
card("tombstone",
     M("Longer Life", dur=1.5), M("Skeleton Spawn", rate=1.5), M("Skeleton Horde", spawnDeath=[["skeleton_army", 1]]))
card("goblin_cage",
     M("Cage Armor", hp=1.5), M("Reinforced Bars", shield=300), M("Brawler Pair", spawnDeath=[["goblin_brawler", 2]]))
card("x_bow",
     M("Longer Draw", range=1.2), M("Rapid Fire", hit=1.5), M("Bolt Storm", pierce=1, dmg=1.5))
card("elixir_collector",
     M("Fast Pump", elixirEvery=[1, 6]), M("Fortified Pump", hp=1.5, dur=1.4), M("Double Pump", elixirEvery=[2, 6]))
card("goblin_hut",
     M("Fast Huts", rate=1.4), M("Spear Barrage", spawnEvery=["spear_goblins", 1, 8]), M("Hut Fortress", hp=1.6, spawnDeath=[["goblin_gang", 1]]))
card("barbarian_hut",
     M("Fast Camp", rate=1.4), M("Barbarian Brothers", spawnEvery=["barbarians", 1, 18]), M("Barracks", hp=1.5, spawnDeath=[["barbarians", 1]]))
card("inferno_tower",
     M("Hotter Beam", dmg=1.3), M("Beam Reach", range=1.25, hp=1.2), M("Twin Beams", hit=1.5, dmg=1.3))
card("bomb_tower",
     M("Heavy Bombs", dmg=1.3), M("Cluster Bombs", radius=1.4), M("Bomb Barrage", castHit=["fireball", 4, 0.4, 0.5], boom=[2.0, 80]))
card("mortar",
     M("Long Range", range=1.25), M("Big Shells", dmg=1.3, radius=1.3), M("Mortar Volley", hit=1.5, castHit=["fireball", 5, 0.4, 0.6]))

# ------------------------------------------------------------------------------------------------ spells
card("fireball",
     M("Bigger Blast", radius=1.3), M("Burning Ground", castAlso=[["poison", 0.5, 0.6, 0.2]]), M("Twin Meteors", castAlso=[["fireball", 0.7, 0.9, 0.8]]))
card("the_log",
     M("Rolling Thunder", dmg=1.3, kb=20), M("Log Tornado", castAlso=[["tornado", 1.0, 0.8, 0.0]]), M("Double Log", castAlso=[["the_log", 1.0, 1.0, 0.9]]))
card("arrows",
     M("Wide Volley", radius=1.3), M("Poison Tips", castAlso=[["poison", 0.5, 0.7, 0.1]]), M("Arrow Storm", castAlso=[["arrows", 1.0, 1.0, 0.7]]))
card("zap",
     M("Weakening Zap", weaken=[0.25, 5], _s=1), M("Zap + Lightning", castAlso=[["lightning", 0.5, 1.0, 0.5]], _s=1), M("Chain Zap", stun=1.0, radius=1.4, castAlso=[["zap", 1.0, 1.0, 0.5]]))
card("poison",
     M("Longer Poison", dur=1.4), M("Toxic Cloud", radius=1.3, dmg=1.25), M("Plague", castAlso=[["poison", 0.8, 1.0, 3.0]]))
card("rocket",
     M("Heavier Rocket", dmg=1.3), M("Blast Radius", radius=1.4, kb=30), M("Twin Rockets", castAlso=[["rocket", 0.6, 0.8, 1.0]]))
card("lightning",
     M("Voltage Boost", dmg=1.3), M("Wide Bolt", radius=1.4), M("Thunderstorm", castAlso=[["lightning", 0.6, 1.0, 1.2]]))
card("goblin_barrel",
     M("Extra Gobs", count=2), M("Barrel Blast", castAlso=[["zap", 0.8, 0.8, 0.0]]), M("Brawler Barrel", spawnDeploy=[["goblin_brawler", 3]], _s=1))
card("earthquake",
     M("Wider Quake", radius=1.3), M("Deep Quake", dmg=1.5), M("Aftershock", castAlso=[["earthquake", 0.8, 1.0, 1.5]]))
card("graveyard",
     M("Fast Graves", count=10), M("Bigger Graveyard", radius=1.3, count=5), M("Grave King", spawnDeploy=[["skeleton_king", 1]]))
card("clone",
     M("Wider Clone", radius=1.3), M("Quick Clone", cost=-1), M("Triple Clone", castAlso=[["clone", 1.0, 1.0, 0.6]]))
card("freeze",
     M("Longer Freeze", dur=1.3), M("Wide Freeze", radius=1.35), M("Freeze + Zap", castAlso=[["zap", 1.0, 1.2, 0.0]]))
card("rage",
     M("Longer Rage", dur=1.4), M("Stronger Rage", radius=1.3, cost=-1), M("Rage Storm", castAlso=[["rage", 1.0, 1.0, 3.0]]))
card("snowball",
     M("Bigger Ball", radius=1.3), M("Cold Snap", slow=[0.7, 3.5]), M("Triple Snow", castAlso=[["snowball", 1.0, 1.0, 0.6]]))
card("barb_barrel",
     M("Heavy Barrel", dmg=1.3), M("Barbarian Drop", spawnDeploy=[["barbarians", 1]]), M("Triple Barrel", castAlso=[["barb_barrel", 1.0, 1.0, 0.5]]))
card("royal_delivery",
     M("Big Delivery", radius=1.3), M("Heavy Delivery", dmg=1.6), M("Royal Backup", spawnDeploy=[["royal_recruits", 1]]))
card("tornado",
     M("Long Tornado", dur=1.5, _s=1), M("Bigger Pull", radius=1.3, _s=1), M("Roaming Tornado", castAlso=[["tornado", 1.0, 1.0, 1.0, -50], ["tornado", 1.0, 1.0, 2.0, -100]], _s=1))
card("goblin_curse",
     M("Longer Curse", dur=1.4), M("Wider Curse", radius=1.3), M("Curse Echo", castAlso=[["goblin_curse", 1.0, 1.0, 2.5]]))
card("void",
     M("Bigger Void", radius=1.3), M("Lasting Void", dur=1.5), M("Void Echo", castAlso=[["void", 0.8, 1.0, 2.5]]))
card("vines",
     M("Longer Vines", dur=1.4), M("Tight Grip", radius=1.3), M("Vines Echo", castAlso=[["vines", 1.0, 1.0, 3.0]]))

# ------------------------------------------------------------------------------------------------ validation + output
def fields_ok(c, fx):
    """Returns the list of fx keys that would do nothing on this card."""
    bad = []
    t = c["type"]
    dmg = (c.get("damage") or 0) > 0
    for k in fx:
        ok = True
        if k == "_s":
            continue
        if k == "hp": ok = (c.get("hp") or 0) > 0
        elif k == "dmg": ok = dmg
        elif k == "range": ok = (c.get("range") or 0) > 0 and t != "spell"
        elif k == "speed": ok = (c.get("speed") or 0) > 0
        elif k == "hit": ok = (c.get("attackSpeed") or 0) > 0
        elif k == "rate": ok = c.get("spawnRate") is not None
        elif k in ("kb", "stun", "slow", "splash", "lifesteal", "weaken", "zap"): ok = dmg or (k == "weaken" and t == "spell")
        elif k == "pierce": ok = c.get("projectile") is not None
        elif k == "charge": ok = t == "ground" and dmg
        elif k in ("hidden", "jumps", "noKB"): ok = t in ("ground", "flying")
        elif k == "boom": ok = (c.get("hp") or 0) > 0
        elif k == "shock": ok = c.get("shockOnHit")
        elif k == "egg": ok = c.get("eggDuration") is not None
        elif k == "freeze": ok = c.get("freezeDuration") is not None
        elif k == "dur": ok = t == "spell" or c.get("lifetime") is not None
        elif k == "count": ok = t in ("ground", "flying") or c.get("spawnCount") is not None
        elif k == "radius": ok = any(c.get(f) for f in ("radius", "splashRadius", "deathRadius", "spawnDamageRadius", "healRadius")) or c.get("splash")
        elif k == "shield": ok = t != "spell"
        elif k == "scale": ok = t in ("ground", "flying")
        elif k == "castHit": ok = dmg
        elif k == "spawnHit": ok = dmg
        elif k in ("pulse", "blink", "rageSelf", "revive"): ok = t != "spell"
        elif k in ("elixirEvery", "elixirDeploy", "elixirDeath"): ok = t != "spell"
        elif k in ("spawnDeploy", "castDeploy", "castAlso", "cost", "spawnDeath", "castDeath", "spawnEvery", "castEvery", "blast"): ok = True
        else:
            print("UNKNOWN fx key", k); ok = False
        if not ok:
            bad.append(k)
    return bad

def describe(fx, cid=""):
    out = []
    pct = lambda v: "%+d%%" % round((v - 1) * 100)
    nm = lambda i: CARDS[i]["name"]
    for k, v in fx.items():
        if k == "_s": continue
        if k == "hp": out.append(pct(v) + " hitpoints")
        elif k == "dmg": out.append(pct(v) + " damage")
        elif k == "range": out.append(pct(v) + " range")
        elif k == "speed": out.append(pct(v) + " movement speed")
        elif k == "hit": out.append(("%+d%% hit speed" % round((v - 1) * 100)))
        elif k == "cost": out.append("%+d elixir cost" % v)
        elif k == "count": out.append("+%d units" % v)
        elif k == "radius": out.append(pct(v) + " radius")
        elif k == "dur": out.append(pct(v) + " duration")
        elif k == "rate": out.append(pct(v) + " spawn speed")
        elif k == "shield": out.append("+%d shield" % v)
        elif k == "scale": out.append("grows bigger")
        elif k == "kb": out.append("knocks enemies back")
        elif k == "stun": out.append("stuns for %.1fs" % v)
        elif k == "slow": out.append("slows %d%% for %.1fs" % (round(v[0] * 100), v[1]))
        elif k == "splash": out.append("splash damage")
        elif k == "charge": out.append("charges up for a huge hit")
        elif k == "noKB": out.append("can't be knocked back")
        elif k == "lifesteal": out.append("heals %d%% of damage dealt" % round(v * 100))
        elif k == "hidden": out.append("invisible until it strikes")
        elif k == "jumps": out.append("leaps onto enemies")
        elif k == "pierce": out.append("piercing shots")
        elif k == "boom": out.append("explodes when destroyed")
        elif k == "shock": out.append(pct(v) + " shock power")
        elif k == "egg": out.append("hatches %d%% faster" % round((1 - v) * 100))
        elif k == "freeze": out.append("+%.1fs freeze" % v)
        elif k == "weaken": out.append("hits weaken enemies %d%% for %ds" % (round(v[0] * 100), v[1]))
        elif k == "zap": out.append("chains to %d more enemies" % v[0])
        elif k == "revive": out.append("returns once with %d%% HP" % round(v * 100))
        elif k == "spawnDeploy": out.append("deploys with " + ", ".join("%dx %s" % (n, nm(i)) for i, n in v))
        elif k == "spawnDeath": out.append("on destroyed: " + ", ".join("%dx %s" % (n, nm(i)) for i, n in v))
        elif k == "spawnHit": out.append("every %s attack spawns %dx %s" % (_ord(v[2]), v[1], nm(v[0])))
        elif k == "spawnEvery": out.append("every %ds spawns %dx %s" % (v[2], v[1], nm(v[0])))
        elif k == "castDeploy": out.append("casts " + ", ".join("%s (%d%% power)" % (nm(i), round(ds * 100)) for i, ds, _ in v) + " on deploy")
        elif k == "castDeath": out.append("casts " + ", ".join("%s (%d%% power)" % (nm(i), round(ds * 100)) for i, ds, _ in v) + " when destroyed")
        elif k == "castHit": out.append("every %s attack casts %s (%d%% power)" % (_ord(v[1]), nm(v[0]), round(v[2] * 100)))
        elif k == "castEvery": out.append("every %ds casts %s (%d%% power)" % (v[1], nm(v[0]), round(v[2] * 100)))
        elif k == "castAlso" and len(v) > 1 and all(a[0] == cid for a in v):
            out.append("%d more %ss sweep forward after it" % (len(v), nm(cid)))
        elif k == "castAlso":
            out.append("; ".join(("a second %s %.1fs later" % (nm(a[0]), a[3]) if a[0] == cid else "also casts %s (%d%% power)" % (nm(a[0]), round(a[1] * 100))) for a in v))
        elif k == "elixirDeploy": out.append("+%d elixir on deploy" % v)
        elif k == "elixirDeath": out.append("+%d elixir when destroyed" % v)
        elif k == "elixirEvery": out.append("+%d elixir every %ds" % (v[0], v[1]))
        elif k == "blast": out.append("deploy shockwave (%d dmg%s)" % (v[1], ", stun" if v[2] > 0 else ""))
        elif k == "pulse":
            kind = {"pull": "pulls enemies in", "slow": "slows nearby enemies", "stun": "stuns nearby enemies", "heal": "heals nearby allies",
                    "rage": "enrages nearby allies", "shield": "shields nearby allies", "dmg": "damages nearby enemies"}[v[0]]
            out.append("every %ds %s" % (v[1], kind))
        elif k == "blink": out.append("teleports forward every %ds" % v[0])
        elif k == "rageSelf": out.append("enraged for %ds on deploy" % v)
        else: out.append(k)
    s = ", ".join(out)
    return s[:1].upper() + s[1:]

def _ord(n):
    return {1: "", 2: "2nd", 3: "3rd"}.get(n, "%dth" % n)

def main():
    base = {}
    for cid, c in CARDS.items():
        if c.get("isToken") or c.get("isMirror") or cid.startswith(("hero_", "evolved_")):
            continue
        base[cid] = c
    missing = sorted(set(base) - set(MODS))
    extra = sorted(set(MODS) - set(base))
    errors = []
    if missing: errors.append("cards without modifiers: %s" % missing)
    if extra: errors.append("modifiers for unknown cards: %s" % extra)
    out = {}
    for cid, tiers in MODS.items():
        if cid not in CARDS:
            continue
        c = CARDS[cid]
        lst = []
        for tier, name, fx in tiers:
            bad = fields_ok(c, fx)
            if bad:
                errors.append("%s/%s '%s': no effect for %s" % (cid, tier, name, bad))
            for k in ("spawnDeploy", "spawnDeath"):
                for i, n in fx.get(k, []):
                    if i not in CARDS: errors.append("%s: unknown spawn card %s" % (cid, i))
            for k in ("castDeploy", "castDeath"):
                for a in fx.get(k, []):
                    if a[0] not in CARDS: errors.append("%s: unknown spell %s" % (cid, a[0]))
            for k in ("castAlso",):
                for a in fx.get(k, []):
                    if a[0] not in CARDS: errors.append("%s: unknown spell %s" % (cid, a[0]))
            for k in ("spawnHit", "spawnEvery", "castHit", "castEvery"):
                if k in fx and fx[k][0] not in CARDS: errors.append("%s: unknown id in %s" % (cid, k))
            src = bool(fx.pop("_s", 0))
            lst.append({"tier": tier, "name": name, "desc": describe(fx, cid), "fx": fx, "src": src})
        out[cid] = lst
    if errors:
        print("\n".join(errors))
        sys.exit(1)
    path = os.path.join(ROOT, "godot/data/chaos_mods.json")
    json.dump(out, open(path, "w"), indent=1)
    n_src = sum(1 for v in out.values() for m in v if m["src"])
    print("wrote %s: %d cards, %d modifiers (%d inspired by published guides)" % (path, len(out), sum(len(v) for v in out.values()), n_src))

main()
