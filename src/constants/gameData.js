export const KING_TOWER_SIZE = 65;
export const PRINCESS_TOWER_SIZE = 50;
export const TOWER_RANGE = 150;
export const KING_RANGE = 180;
export const UNIT_ATTACK_RANGE = 40;
export const UNIT_DAMAGE = 10;
export const UNIT_ATTACK_SPEED = 1000;

export const PROJECTILE_SPEED_ARROW = 12;
export const PROJECTILE_SPEED_CANNON = 8;
export const FIRE_RATE_PRINCESS = 800;
export const FIRE_RATE_KING = 1000;

export const RARITY_COLORS = {
    common: '#7f8c8d',    // Gray
    rare: '#f39c12',      // Orange
    epic: '#9b59b6',      // Purple
    legendary: '#2ecc71'  // Emerald/Rainbow substitute
};

export const CARDS = [
    // Original 8 cards
    { id: 'knight', name: 'Knight', cost: 3, color: '#f1c40f', hp: 1766, speed: 1.5, type: 'ground', range: 20, damage: 202, attackSpeed: 1200, projectile: null, count: 1, rarity: 'common' },
    { id: 'archers', name: 'Archers', cost: 3, color: '#e67e22', hp: 304, speed: 2, type: 'ground', range: 80, damage: 107, attackSpeed: 900, projectile: 'arrow', count: 2, rarity: 'common' },
    { id: 'giant', name: 'Giant', cost: 5, color: '#e74c3c', hp: 4091, speed: 1, type: 'ground', range: 20, damage: 254, attackSpeed: 1500, projectile: null, count: 1, targetType: 'buildings', rarity: 'rare' },
    { id: 'mini_pekka', name: 'Mini P', cost: 4, color: '#9b59b6', hp: 1361, speed: 2.5, type: 'ground', range: 25, damage: 720, attackSpeed: 1600, projectile: null, count: 1, rarity: 'rare' },
    { id: 'spear_goblins', name: 'Spear Gobs', cost: 2, color: '#2ecc71', hp: 133, speed: 3, type: 'ground', range: 110, damage: 81, attackSpeed: 1700, projectile: 'spear', count: 3, rarity: 'common' },
    { id: 'musketeer', name: 'Musket', cost: 4, color: '#34495e', hp: 720, speed: 1.5, type: 'ground', range: 100, damage: 218, attackSpeed: 1100, projectile: 'bullet', count: 1, rarity: 'rare' },
    { id: 'baby_dragon', name: 'Baby D', cost: 4, color: '#27ae60', hp: 1152, speed: 2, type: 'flying', range: 80, damage: 160, attackSpeed: 1500, projectile: 'dragon_fire', count: 1, splash: true, rarity: 'epic' },
    { id: 'fireball', name: 'Fireball', cost: 4, color: '#ff4500', type: 'spell', damage: 689, radius: 60, count: 1, rarity: 'rare', knockback: 30 },
    { id: 'the_log', name: 'The Log', cost: 2, color: '#8B4513', type: 'spell', damage: 240, radius: 40, count: 1, rarity: 'legendary', knockback: 20 },

    // New cards
    { id: 'cannon', name: 'Cannon', cost: 3, color: '#8B4513', hp: 896, speed: 0, type: 'building', range: 90, damage: 212, attackSpeed: 900, projectile: 'cannonball', count: 1, lifetime: 30, rarity: 'common' },
    { id: 'barbarians', name: 'Barbarians', cost: 5, color: '#CD853F', hp: 670, speed: 1.5, type: 'ground', range: 30, damage: 192, attackSpeed: 1300, projectile: null, count: 5, rarity: 'common' },
    { id: 'arrows', name: 'Arrows', cost: 3, color: '#2ecc71', type: 'spell', damage: 366, radius: 40, count: 1, rarity: 'common' },
    { id: 'zap', name: 'Zap', cost: 2, color: '#3498db', type: 'spell', damage: 192, radius: 35, count: 1, stun: 0.5, rarity: 'common' },
    { id: 'minions', name: 'Minions', cost: 3, color: '#9b59b6', hp: 230, speed: 3, type: 'flying', range: 50, damage: 102, attackSpeed: 1000, projectile: 'dark_ball', count: 3, rarity: 'common' },
    { id: 'skeleton_army', name: 'Skeleton Army', cost: 3, color: '#ecf0f1', hp: 81, speed: 2, type: 'ground', range: 25, damage: 81, attackSpeed: 1000, projectile: null, count: 15, rarity: 'epic' },
    { id: 'skeletons', name: 'Skelly', cost: 1, color: '#bdc3c7', hp: 81, speed: 2, type: 'ground', range: 25, damage: 81, attackSpeed: 1000, projectile: null, count: 3, rarity: 'common' },
    { id: 'valkyrie', name: 'Valkyrie', cost: 4, color: '#e74c3c', hp: 1908, speed: 1.5, type: 'ground', range: 25, damage: 267, attackSpeed: 1500, projectile: null, count: 1, splash: true, rarity: 'rare' },
    { id: 'poison', name: 'Poison', cost: 4, color: '#27ae60', type: 'spell', damage: 91, radius: 50, count: 1, duration: 8, rarity: 'epic' },
    { id: 'minion_horde', name: 'Minion H', cost: 5, color: '#8e44ad', hp: 230, speed: 3, type: 'flying', range: 50, damage: 102, attackSpeed: 1000, projectile: 'dark_ball', count: 6, rarity: 'common' },
    { id: 'witch', name: 'Witch', cost: 5, color: '#9b59b6', hp: 838, speed: 1.5, type: 'ground', range: 55, damage: 134, attackSpeed: 1100, projectile: 'witch_projectile', count: 1, splash: true, spawns: 'skeletons', spawnRate: 5, spawnCount: 3, rarity: 'epic' },
    { id: 'hog_rider', name: 'Hog', cost: 4, color: '#e67e22', hp: 1696, speed: 3.5, type: 'ground', range: 25, damage: 318, attackSpeed: 1600, projectile: null, count: 1, targetType: 'buildings', jumps: true, rarity: 'rare' },
    { id: 'prince', name: 'Prince', cost: 5, color: '#f39c12', hp: 1920, speed: 2, type: 'ground', range: 30, damage: 392, attackSpeed: 1400, projectile: null, count: 1, charge: true, rarity: 'epic' },
    { id: 'tesla', name: 'Tesla', cost: 4, color: '#f1c40f', hp: 1152, speed: 0, type: 'building', range: 55, damage: 230, attackSpeed: 1100, projectile: 'tesla_lightning', count: 1, lifetime: 35, hidden: true, rarity: 'common' },
    { id: 'wizard', name: 'Wizard', cost: 5, color: '#9b59b6', hp: 720, speed: 1.5, type: 'ground', range: 60, damage: 281, attackSpeed: 1400, projectile: 'fireball_small', count: 1, splash: true, rarity: 'rare' },
    { id: 'tombstone', name: 'Tombstone', cost: 3, color: '#95a5a6', hp: 534, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 40, spawns: 'skeletons', spawnRate: 3.1, spawnCount: 2, deathSpawnCount: 4, rarity: 'rare' },
    { id: 'sword_goblins', name: 'Sword Gobs', cost: 3, color: '#2ecc71', hp: 202, speed: 3, type: 'ground', range: 25, damage: 120, attackSpeed: 1100, projectile: null, count: 3, rarity: 'common' },
    { id: 'spear_goblins_rare', name: 'Spear Gobs', cost: 3, color: '#2ecc71', hp: 180, speed: 3, type: 'ground', range: 50, damage: 62, attackSpeed: 1100, projectile: 'spear', count: 3, rarity: 'rare' }, // Renamed ID to avoid conflict if any, but App.js has dupe 'spear_goblins' ID at line 54. I should preserve it AS IS or fix it? App.js has TWO 'spear_goblins'?
    { id: 'ice_wizard', name: 'Ice Wiz', cost: 3, color: '#3498db', hp: 688, speed: 1.5, type: 'ground', range: 55, damage: 91, attackSpeed: 1700, projectile: 'ice_shard', count: 1, splash: true, rarity: 'legendary', slow: 0.35, spawnDamage: 91 },

    // Lava Hound & Lava Pups
    { id: 'lava_hound', name: 'Lava Hound', cost: 7, color: '#c0392b', hp: 3664, speed: 1, type: 'flying', range: 25, damage: 53, attackSpeed: 1300, projectile: null, count: 1, targetType: 'buildings', rarity: 'legendary', deathSpawns: 'lava_pups', deathSpawnCount: 6 },
    { id: 'lava_pups', name: 'Lava Pups', cost: 0, color: '#e74c3c', hp: 216, speed: 2, type: 'flying', range: 50, damage: 53, attackSpeed: 1000, projectile: 'lava_shot', count: 1, rarity: 'common', isToken: true },
    { id: 'cursed_hog', name: 'Cursed Hog', cost: 0, color: '#ff9ff3', hp: 520, speed: 3.5, type: 'ground', range: 25, damage: 52, attackSpeed: 1000, projectile: null, count: 1, targetType: 'buildings', rarity: 'common', isToken: true },

    // New cards to implement
    { id: 'royal_hogs', name: 'Royal Hogs', cost: 5, color: '#e67e22', hp: 1260, speed: 3.5, type: 'ground', range: 25, damage: 240, attackSpeed: 1600, projectile: null, count: 4, targetType: 'buildings', jumps: true, rarity: 'common' },
    { id: 'miner', name: 'Miner', cost: 3, color: '#f39c12', hp: 1600, speed: 1.5, type: 'ground', range: 25, damage: 160, attackSpeed: 1100, projectile: null, count: 1, rarity: 'legendary', burrows: true, deployAnywhere: true },
    { id: 'goblin_cage', name: 'Goblin Cage', cost: 5, color: '#95a5a6', hp: 880, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 30, spawns: null, spawnRate: 0, spawnCount: 0, rarity: 'rare', deathSpawns: 'goblin_bruteth', deathSpawnCount: 1 },
    { id: 'goblin_bruteth', name: 'Goblin B', cost: 0, color: '#c0392b', hp: 660, speed: 2, type: 'ground', range: 25, damage: 158, attackSpeed: 1300, projectile: null, count: 1, rarity: 'common', isToken: true },
    { id: 'goblin_giant', name: 'Goblin Giant', cost: 6, color: '#27ae60', hp: 2628, speed: 1, type: 'ground', range: 25, damage: 211, attackSpeed: 1500, projectile: null, count: 1, targetType: 'buildings', rarity: 'epic', deathSpawns: 'spear_goblins', deathSpawnCount: 2, extraProjectiles: 2 },

    // Super easy additions
    { id: 'three_musketeers', name: '3 Musketeers', cost: 9, color: '#34495e', hp: 720, speed: 1.5, type: 'ground', range: 100, damage: 218, attackSpeed: 1100, projectile: 'bullet', count: 3, rarity: 'rare' },
    { id: 'royal_giant', name: 'Royal Giant', cost: 6, color: '#e67e22', hp: 3072, speed: 1.2, type: 'ground', range: 90, damage: 307, attackSpeed: 1700, projectile: 'cannonball', count: 1, targetType: 'buildings', rarity: 'rare' },
    { id: 'rocket', name: 'Rocket', cost: 6, color: '#ff4500', type: 'spell', damage: 1484, radius: 30, count: 1, rarity: 'rare' },

    // Medium easy additions
    { id: 'dark_prince', name: 'Dark Prince', cost: 4, color: '#2c3e50', hp: 1200, shieldHp: 240, speed: 2, type: 'ground', range: 30, damage: 248, attackSpeed: 1300, projectile: null, count: 1, splash: true, frontalSplash: true, charge: true, rarity: 'epic', hasShield: true },
    { id: 'elite_barbarians', name: 'Elite Barbs', cost: 6, color: '#c0392b', hp: 1341, speed: 3, type: 'ground', range: 30, damage: 384, attackSpeed: 1400, projectile: null, count: 2, rarity: 'epic' },
    { id: 'golem', name: 'Golem', cost: 8, color: '#7f8c8d', hp: 5120, speed: 0.9, type: 'ground', range: 20, damage: 312, attackSpeed: 2500, projectile: null, count: 1, targetType: 'buildings', rarity: 'epic', deathDamage: 312, deathSpawns: 'golemite', deathSpawnCount: 2 },
    { id: 'golemite', name: 'Golemite', cost: 0, color: '#95a5a6', hp: 1040, speed: 1, type: 'ground', range: 20, damage: 66, attackSpeed: 2500, projectile: null, count: 1, targetType: 'buildings', rarity: 'common', isToken: true, deathDamage: 66 },

    // Next set of additions
    { id: 'pekka', name: 'P.E.K.K.A', cost: 7, color: '#8e44ad', hp: 3760, speed: 1, type: 'ground', range: 25, damage: 816, attackSpeed: 1800, projectile: null, count: 1, rarity: 'epic' },
    { id: 'mega_knight', name: 'Mega Knight', cost: 7, color: '#e67e22', hp: 3993, speed: 1.5, type: 'ground', range: 25, damage: 268, attackSpeed: 1700, projectile: null, count: 1, splash: true, spawnDamage: 536, jumps: true, rarity: 'legendary' },
    { id: 'electro_wizard', name: 'Electro Wiz', cost: 4, color: '#3498db', hp: 713, speed: 1.5, type: 'ground', range: 55, damage: 231, attackSpeed: 1800, projectile: 'electric_bolt', count: 1, splash: false, stun: 0.5, rarity: 'legendary', spawnDamage: 192 },
    { id: 'lightning', name: 'Lightning', cost: 6, color: '#f1c40f', type: 'spell', damage: 1056, radius: 70, count: 1, rarity: 'epic' },
    { id: 'x_bow', name: 'X-Bow', cost: 6, color: '#95a5a6', hp: 1600, speed: 0, type: 'building', range: 230, damage: 30, attackSpeed: 250, projectile: 'arrow', count: 1, lifetime: 30, rarity: 'epic', spawnDelay: 3500 },
    { id: 'mirror', name: 'Mirror', cost: 1, color: '#ecf0f1', type: 'spell', isMirror: true, rarity: 'epic' },

    // Spirit Cards
    { id: 'fire_spirit', name: 'Fire Spirit', cost: 1, color: '#e74c3c', hp: 230, speed: 4, type: 'ground', range: 25, damage: 207, attackSpeed: 1000, projectile: null, count: 1, splash: true, rarity: 'common', kamikaze: true },
    { id: 'ice_spirit', name: 'Ice Spirit', cost: 1, color: '#E8F4F8', hp: 230, speed: 4, type: 'ground', range: 25, damage: 110, attackSpeed: 1000, projectile: null, count: 1, splash: true, stun: 0.5, rarity: 'common', kamikaze: true },
    { id: 'electro_spirit', name: 'Electro Spirit', cost: 1, color: '#9b59b6', hp: 230, speed: 4, type: 'ground', range: 25, damage: 99, attackSpeed: 1000, projectile: null, count: 1, chain: 9, stun: 0.5, rarity: 'common', kamikaze: true },
    { id: 'heal_spirit', name: 'Heal Spirit', cost: 1, color: '#FFD700', hp: 450, speed: 5, type: 'ground', range: 25, damage: 0, attackSpeed: 1000, projectile: null, count: 1, splash: true, rarity: 'rare', kamikaze: true, healsOnAttack: 700, healRadius: 60 },

    // Additional cards
    { id: 'bomber', name: 'Bomber', cost: 2, color: '#e67e22', hp: 398, speed: 2, type: 'ground', range: 55, damage: 222, attackSpeed: 1800, projectile: 'bomb', count: 1, splash: true, rarity: 'common' },
    { id: 'goblin_barrel', name: 'Goblin B', cost: 3, color: '#2ecc71', type: 'spell', damage: 0, radius: 20, count: 3, spawns: 'sword_goblins', spawnCount: 3, rarity: 'epic' },
    { id: 'elixir_collector', name: 'Elixir G', cost: 6, color: '#9b59b6', hp: 1070, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 70, rarity: 'rare', generatesElixir: true },
    { id: 'goblin_hut', name: 'Goblin Hut', cost: 5, color: '#2ecc71', hp: 1293, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 60, spawns: 'spear_goblins', spawnRate: 4.5, spawnCount: 1, rarity: 'rare' },
    { id: 'furnace', name: 'Furnace', cost: 4, color: '#e74c3c', hp: 1003, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 50, spawns: 'fire_spirit', spawnRate: 7, spawnCount: 1, rarity: 'rare' },
    { id: 'earthquake', name: 'Earthquake', cost: 3, color: '#7f8c8d', type: 'spell', damage: 81, radius: 70, count: 1, slow: 0.35, rarity: 'rare' },
    { id: 'graveyard', name: 'Graveyard', cost: 5, color: '#2c3e50', type: 'spell', damage: 0, radius: 80, count: 20, spawns: 'skeletons', spawnCount: 20, rarity: 'legendary' },
    { id: 'lumberjack', name: 'Lumberjack', cost: 4, color: '#e67e22', hp: 1232, speed: 2.5, type: 'ground', range: 25, damage: 240, attackSpeed: 800, projectile: null, count: 1, splash: true, deathRage: true, rarity: 'legendary' },

    // 5 Easy New Cards
    { id: 'guards', name: 'Guards', cost: 3, color: '#95a5a6', hp: 108, shieldHp: 240, speed: 2, type: 'ground', range: 25, damage: 108, attackSpeed: 1100, projectile: null, count: 3, rarity: 'common', hasShield: true },
    { id: 'bats', name: 'Bats', cost: 2, color: '#8e44ad', hp: 81, speed: 3.5, type: 'flying', range: 50, damage: 81, attackSpeed: 1300, projectile: null, count: 5, rarity: 'common' },
    { id: 'ram_rider', name: 'Ram Rider', cost: 5, color: '#3498db', hp: 1717, speed: 2, type: 'ground', range: 25, damage: 266, attackSpeed: 1800, projectile: null, count: 1, targetType: 'buildings', stun: 1.0, charge: true, rarity: 'rare' },
    { id: 'battle_healer', name: 'Battle Healer', cost: 4, color: '#e74c3c', hp: 1717, speed: 1.5, type: 'ground', range: 25, damage: 148, attackSpeed: 1500, projectile: null, count: 1, splash: true, healsOnAttack: 48, healRadius: 50, passiveHeal: 48, rarity: 'rare' },
    { id: 'skeleton_barrel', name: 'Skeleton B', cost: 3, color: '#bdc3c8', hp: 636, speed: 6, type: 'flying', range: 0, radius: 25, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 20, targetType: 'buildings', rarity: 'epic', deathSpawns: 'skeletons', deathSpawnCount: 8, deathDamage: 133, deathRadius: 40 },

    // New Cards
    { id: 'ice_golem', name: 'Ice Golem', cost: 2, color: '#E8F4F8', hp: 1197, speed: 1.5, type: 'ground', range: 20, damage: 84, attackSpeed: 2500, projectile: null, count: 1, targetType: 'buildings', rarity: 'rare', deathDamage: 84, deathRadius: 60, deathSlow: 1.0 },
    { id: 'mega_minion', name: 'Mega Minion', cost: 3, color: '#8e44ad', hp: 830, speed: 2, type: 'flying', range: 45, damage: 300, attackSpeed: 1600, projectile: 'dark_ball_big', count: 1, rarity: 'rare' },
    { id: 'dart_goblin', name: 'Dart Goblin', cost: 3, color: '#2ecc71', hp: 260, speed: 3.5, type: 'ground', range: 100, damage: 131, attackSpeed: 700, projectile: 'dart', count: 1, rarity: 'rare' },
    { id: 'princess', name: 'Princess', cost: 3, color: '#e67e22', hp: 261, speed: 2, type: 'ground', range: 180, damage: 250, attackSpeed: 3000, projectile: 'fire_arrows', count: 1, splash: true, rarity: 'legendary' },
    { id: 'barbarian_hut', name: 'Barb Hut', cost: 7, color: '#e67e22', hp: 1300, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 40, spawns: 'barbarians', spawnRate: 8, spawnCount: 2, deathSpawns: 'barbarians', deathSpawnCount: 2, rarity: 'rare' },

    // 5 New Cards
    { id: 'bandit', name: 'Bandit', cost: 3, color: '#e67e22', hp: 600, speed: 4, type: 'ground', range: 25, damage: 320, attackSpeed: 1100, projectile: null, count: 1, rarity: 'legendary', dashInvincible: true, dashRange: 80 },
    { id: 'battle_ram', name: 'Battle Ram', cost: 4, color: '#e67e22', hp: 756, speed: 4, type: 'ground', range: 25, damage: 246, attackSpeed: 100, projectile: null, count: 1, targetType: 'buildings', charge: true, rarity: 'rare', deathSpawns: 'barbarians', deathSpawnCount: 2, kamikaze: true },
    { id: 'inferno_tower', name: 'Inferno', cost: 5, color: '#e74c3c', hp: 1100, speed: 0, type: 'building', range: 70, damage: 30, attackSpeed: 400, projectile: null, count: 1, lifetime: 35, rarity: 'rare', damageRamp: true },
    { id: 'balloon', name: 'Balloon', cost: 5, color: '#e74c3c', hp: 1500, speed: 2, type: 'flying', range: 5, damage: 400, attackSpeed: 2000, projectile: null, count: 1, targetType: 'buildings', rarity: 'epic', bombDrops: true, deathDamage: 400, deathRadius: 60, deathBombDelay: 3000 },
    { id: 'hunter', name: 'Hunter', cost: 4, color: '#95a5a6', hp: 1050, speed: 2, type: 'ground', range: 75, damage: 180, attackSpeed: 1500, projectile: 'shotgun_blast', count: 1, splash: true, shotgunSpread: true, rarity: 'epic' },

    // 5 More NEW Cards
    { id: 'electro_giant', name: 'Electro Giant', cost: 7, color: '#3498db', hp: 2800, speed: 1, type: 'ground', range: 25, damage: 200, attackSpeed: 1400, projectile: null, count: 1, shockOnHit: true, shockRadius: 50, shockDamage: 100, shockStun: 0.5, rarity: 'epic' },
    { id: 'night_witch', name: 'Night Witch', cost: 4, color: '#2c3e50', hp: 750, speed: 2, type: 'ground', range: 25, damage: 220, attackSpeed: 1500, projectile: null, count: 1, spawns: 'bats', spawnRate: 5, spawnCount: 2, rarity: 'legendary', deathSpawns: 'bats', deathSpawnCount: 3 },
    { id: 'inferno_dragon', name: 'Inferno Dragon', cost: 4, color: '#e74c3c', hp: 950, speed: 2.5, type: 'flying', range: 40, damage: 30, attackSpeed: 100, projectile: null, count: 1, damageRamp: true, rarity: 'epic' },
    { id: 'elixir_golem', name: 'Elixir Golem', cost: 3, color: '#D442F5', hp: 1600, speed: 1.5, type: 'ground', range: 25, damage: 100, attackSpeed: 1500, projectile: null, count: 1, targetType: 'buildings', deathSpawns: 'elixir_golemite', deathSpawnCount: 2, givesOpponentElixir: true, rarity: 'epic' },
    { id: 'elixir_golemite', name: 'Elixir Golemite', cost: 0, color: '#D442F5', hp: 800, speed: 1.5, type: 'ground', range: 25, damage: 50, attackSpeed: 1500, projectile: null, count: 1, targetType: 'buildings', deathSpawns: 'elixir_blob', deathSpawnCount: 2, givesOpponentElixir: true, rarity: 'rare', isToken: true },
    { id: 'elixir_blob', name: 'Elixir Blob', cost: 0, color: '#D442F5', hp: 400, speed: 1.5, type: 'ground', range: 25, damage: 25, attackSpeed: 1500, projectile: null, count: 1, targetType: 'buildings', givesOpponentElixir: true, rarity: 'common', isToken: true },
    { id: 'firecracker', name: 'Firecracker', cost: 3, color: '#e67e22', hp: 240, speed: 3, type: 'ground', range: 100, damage: 180, attackSpeed: 2500, projectile: 'firecracker_burst', count: 1, splash: true, stun: 0.5, recoil: 60, spreadCount: 8, spreadArc: 0.5, rarity: 'common' },

    // 5 More NEW Cards
    { id: 'giant_skeleton', name: 'Giant Skel', cost: 6, color: '#bdc3c7', hp: 2800, speed: 1.5, type: 'ground', range: 25, damage: 170, attackSpeed: 1500, projectile: null, count: 1, rarity: 'epic', deathDamage: 1000, deathRadius: 100, deathBombDelay: 3000 },
    { id: 'electro_dragon', name: 'Electro D', cost: 5, color: '#3498db', hp: 1000, speed: 2, type: 'flying', range: 70, damage: 160, attackSpeed: 2100, projectile: 'electric_bolt', count: 1, rarity: 'epic', chain: 3, stun: 0.5 },
    { id: 'magic_archer', name: 'Magic Arch', cost: 4, color: '#27ae60', hp: 440, speed: 2, type: 'ground', range: 140, damage: 111, attackSpeed: 1100, projectile: 'magic_arrow', count: 1, rarity: 'legendary', pierce: true },
    { id: 'royal_ghost', name: 'Royal Ghost', cost: 3, color: '#ecf0f1', hp: 1000, speed: 2, type: 'ground', range: 25, damage: 216, attackSpeed: 1800, projectile: null, count: 1, rarity: 'legendary', splash: true, hidden: true },
    { id: 'hunter', name: 'Hunter', cost: 4, color: '#2c3e50', hp: 700, speed: 2, type: 'ground', range: 80, damage: 700, attackSpeed: 2200, projectile: 'shotgun_blast', count: 1, rarity: 'epic', shotgunSpread: true },

    // 141-163 range
    { id: 'sparky', name: 'Sparky', cost: 6, color: '#e74c3c', hp: 1750, speed: 0.7, type: 'ground', range: 55, damage: 1135, attackSpeed: 5000, projectile: 'electric_blast', count: 1, splash: true, splashRadius: 50, chargeTime: 5000, recoil: 40, stopsToAttack: true, rarity: 'legendary' },
    { id: 'mother_witch', name: 'Mother Witch', cost: 4, color: '#9b59b6', hp: 720, speed: 1.5, type: 'ground', range: 55, damage: 159, attackSpeed: 1400, projectile: 'witch_projectile', count: 1, splash: false, turnsToPig: true, pigDuration: 5000, rarity: 'legendary' },
    { id: 'bomb_tower', name: 'Bomb Tower', cost: 4, color: '#7f8c8d', hp: 1400, speed: 0, type: 'building', range: 55, damage: 200, attackSpeed: 1500, projectile: 'bomb', count: 1, lifetime: 40, deathDamage: 500, deathRadius: 60, deathBombDelay: 1000, rarity: 'rare' },
    { id: 'mortar', name: 'Mortar', cost: 4, color: '#95a5a6', hp: 340, speed: 0, type: 'building', range: 200, damage: 228, attackSpeed: 3000, projectile: 'mortar_shell', count: 1, lifetime: 25, chargeTime: 3000, stopsToAttack: true, rarity: 'common', splashRadius: 45 },
    { id: 'clone', name: 'Clone', cost: 3, color: '#3498db', type: 'spell', damage: 0, radius: 35, count: 1, cloneUnits: true, cloneDuration: 10, rarity: 'epic' },
    { id: 'freeze', name: 'Freeze', cost: 4, color: '#87CEEB', type: 'spell', damage: 91, radius: 50, count: 1, freezeDuration: 4, rarity: 'epic' },
    { id: 'rage', name: 'Rage', cost: 2, color: '#9b59b6', type: 'spell', damage: 0, radius: 60, count: 1, rageDuration: 7, rageBoost: 0.35, rarity: 'epic' },
    { id: 'snowball', name: 'Snowball', cost: 2, color: '#E8F4F8', type: 'spell', damage: 159, radius: 35, count: 1, knockback: 15, slow: 0.35, slowDuration: 2.5, rarity: 'common' },
    { id: 'barb_barrel', name: 'Barb Barrel', cost: 2, color: '#8B4513', type: 'spell', damage: 243, radius: 30, count: 1, spawns: 'barbarian_single', spawnCount: 1, knockback: 10, rarity: 'epic' },
    { id: 'barbarian_single', name: 'Barbarian', cost: 0, color: '#CD853F', hp: 670, speed: 1.5, type: 'ground', range: 30, damage: 192, attackSpeed: 1300, projectile: null, count: 1, rarity: 'common', isToken: true },
    { id: 'royal_delivery', name: 'Royal Delivery', cost: 3, color: '#3498db', type: 'spell', damage: 362, radius: 45, count: 1, spawns: 'royal_recruit_single', spawnCount: 1, spawnDelay: 3000, rarity: 'common' },
    { id: 'royal_recruit_single', name: 'Royal Recruit', cost: 0, color: '#3498db', hp: 1281, shieldHp: 240, speed: 1.5, type: 'ground', range: 30, damage: 190, attackSpeed: 1200, projectile: null, count: 1, rarity: 'common', isToken: true, hasShield: true },
    { id: 'tornado', name: 'Tornado', cost: 3, color: '#7f8c8d', type: 'spell', damage: 44, radius: 60, count: 1, duration: 1, pullStrength: 100, rarity: 'epic' },

    // Troops - Easy / Medium
    { id: 'flying_machine', name: 'Flying Machine', cost: 4, color: '#f1c40f', hp: 510, speed: 2, type: 'flying', range: 100, damage: 152, attackSpeed: 1100, projectile: 'bullet', count: 1, rarity: 'rare' },
    { id: 'wall_breakers', name: 'Wall Breakers', cost: 2, color: '#bdc3c7', hp: 332, speed: 4, type: 'ground', range: 5, damage: 446, attackSpeed: 1000, projectile: null, count: 2, targetType: 'buildings', kamikaze: true, splash: true, splashRadius: 40, rarity: 'epic' },
    { id: 'skeleton_dragons', name: 'Skel Dragons', cost: 4, color: '#27ae60', hp: 596, speed: 2, type: 'flying', range: 55, damage: 106, attackSpeed: 1800, projectile: 'dragon_fire', count: 2, splash: true, rarity: 'common' },
    { id: 'bowler', name: 'Bowler', cost: 5, color: '#3498db', hp: 2350, speed: 1.5, type: 'ground', range: 50, damage: 290, attackSpeed: 2500, projectile: 'boulder', count: 1, splash: true, knockback: 25, pierce: true, rarity: 'epic' },
    { id: 'executioner', name: 'Executioner', cost: 5, color: '#2c3e50', hp: 1150, speed: 1.5, type: 'ground', range: 70, damage: 210, attackSpeed: 2400, projectile: 'axe_boomerang', count: 1, splash: true, boomerang: true, rarity: 'epic' },
    { id: 'zappies', name: 'Zappies', cost: 4, color: '#f1c40f', hp: 440, speed: 1.5, type: 'ground', range: 55, damage: 85, attackSpeed: 2100, projectile: 'electric_zap', count: 3, stun: 0.5, rarity: 'rare' },
    { id: 'rascals', name: 'Rascals', cost: 5, color: '#e67e22', hp: 1281, speed: 1.5, type: 'ground', range: 25, damage: 182, attackSpeed: 1200, projectile: null, count: 1, rarity: 'common', spawnsExtra: 'rascal_girls', extraCount: 2 },
    { id: 'rascal_girls', name: 'Rascal Girls', cost: 0, color: '#e67e22', hp: 300, speed: 2.5, type: 'ground', range: 100, damage: 107, attackSpeed: 1100, projectile: 'slingshot', count: 1, rarity: 'common', isToken: true },
    { id: 'royal_recruits', name: 'Royal Recruits', cost: 7, color: '#3498db', hp: 630, shieldHp: 200, speed: 1.5, type: 'ground', range: 30, damage: 125, attackSpeed: 1200, projectile: null, count: 7, rarity: 'common', hasShield: true, splitSpawn: true },
    { id: 'cannon_cart', name: 'Cannon Cart', cost: 5, color: '#7f8c8d', hp: 696, shieldHp: 590, speed: 2.5, type: 'ground', range: 70, damage: 202, attackSpeed: 1200, projectile: 'cannonball', count: 1, rarity: 'epic', hasShield: true, transformsToBuilding: true },
    { id: 'goblin_drill', name: 'Goblin Drill', cost: 4, color: '#2ecc71', hp: 1200, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 9, spawns: 'sword_goblins', spawnRate: 1.1, spawnCount: 1, rarity: 'epic', deployAnywhere: true },
    { id: 'phoenix', name: 'Phoenix', cost: 4, color: '#e74c3c', hp: 1000, speed: 2.5, type: 'flying', range: 50, damage: 200, attackSpeed: 1600, projectile: 'phoenix_fire', count: 1, splash: true, rarity: 'legendary', revivesAsEgg: true, eggHp: 800, eggDuration: 3000 },
    { id: 'phoenix_egg', name: 'Phoenix Egg', cost: 0, color: '#f39c12', hp: 800, speed: 0, type: 'ground', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, rarity: 'legendary', isToken: true, hatchesInto: 'phoenix', hatchDuration: 3000 }
];
