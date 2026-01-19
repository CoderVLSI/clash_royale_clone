import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, PanResponder, Animated, Image, ImageBackground, ScrollView, Modal, TextInput, KeyboardAvoidingView, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import Svg, { Circle, Rect, Path, G, Defs, LinearGradient, Stop, Polygon, Ellipse, Text as SvgText, Line } from 'react-native-svg';
import { io } from "socket.io-client";

const { width, height } = Dimensions.get('window');

// --- Constants ---
const KING_TOWER_SIZE = 65;
const PRINCESS_TOWER_SIZE = 50;
const TOWER_RANGE = 150;
const KING_RANGE = 180;
const UNIT_ATTACK_RANGE = 40;
const UNIT_DAMAGE = 10;
const UNIT_ATTACK_SPEED = 1000;

const PROJECTILE_SPEED_ARROW = 12;
const PROJECTILE_SPEED_CANNON = 8;
const FIRE_RATE_PRINCESS = 800;
const FIRE_RATE_KING = 1000;

// Card Definitions & Unit Stats
const CARDS = [
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
  { id: 'spear_goblins', name: 'Spear Gobs', cost: 3, color: '#2ecc71', hp: 180, speed: 3, type: 'ground', range: 50, damage: 62, attackSpeed: 1100, projectile: 'spear', count: 3, rarity: 'rare' },
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

  // Spirit Cards - All cost 1 Elixir and die when they attack
  { id: 'fire_spirit', name: 'Fire Spirit', cost: 1, color: '#e74c3c', hp: 230, speed: 4, type: 'ground', range: 25, damage: 207, attackSpeed: 1000, projectile: null, count: 1, splash: true, rarity: 'common', kamikaze: true },
  { id: 'ice_spirit', name: 'Ice Spirit', cost: 1, color: '#E8F4F8', hp: 230, speed: 4, type: 'ground', range: 25, damage: 110, attackSpeed: 1000, projectile: null, count: 1, splash: true, stun: 0.5, rarity: 'common', kamikaze: true },
  { id: 'electro_spirit', name: 'Electro Spirit', cost: 1, color: '#9b59b6', hp: 230, speed: 4, type: 'ground', range: 25, damage: 99, attackSpeed: 1000, projectile: null, count: 1, chain: 9, stun: 0.5, rarity: 'common', kamikaze: true },
  { id: 'heal_spirit', name: 'Heal Spirit', cost: 1, color: '#FFD700', hp: 450, speed: 5, type: 'ground', range: 25, damage: 0, attackSpeed: 1000, projectile: null, count: 1, splash: true, rarity: 'rare', kamikaze: true, healsOnAttack: 700, healRadius: 60 },

  // Additional cards for new decks
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

  // New Cards (Ice Golem, Mega Minion, Dart Goblin, Princess, Barbarian Hut)
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

  // 5 More NEW Cards (not duplicates!)
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

  // 5 NEW REQUESTED CARDS
  { id: 'sparky', name: 'Sparky', cost: 6, color: '#e74c3c', hp: 1750, speed: 0.7, type: 'ground', range: 55, damage: 1135, attackSpeed: 5000, projectile: 'electric_blast', count: 1, splash: true, splashRadius: 50, chargeTime: 5000, recoil: 40, stopsToAttack: true, rarity: 'legendary' },
  { id: 'mother_witch', name: 'Mother Witch', cost: 4, color: '#9b59b6', hp: 720, speed: 1.5, type: 'ground', range: 55, damage: 159, attackSpeed: 1400, projectile: 'witch_projectile', count: 1, splash: false, turnsToPig: true, pigDuration: 5000, rarity: 'legendary' },
  { id: 'bomb_tower', name: 'Bomb Tower', cost: 4, color: '#7f8c8d', hp: 1400, speed: 0, type: 'building', range: 55, damage: 200, attackSpeed: 1500, projectile: 'bomb', count: 1, lifetime: 40, deathDamage: 500, deathRadius: 60, deathBombDelay: 1000, rarity: 'rare' },
  { id: 'mortar', name: 'Mortar', cost: 4, color: '#95a5a6', hp: 340, speed: 0, type: 'building', range: 200, damage: 228, attackSpeed: 3000, projectile: 'mortar_shell', count: 1, lifetime: 25, chargeTime: 3000, stopsToAttack: true, rarity: 'common', splashRadius: 45 },
  { id: 'clone', name: 'Clone', cost: 3, color: '#3498db', type: 'spell', damage: 0, radius: 35, count: 1, cloneUnits: true, cloneDuration: 10, rarity: 'epic' },

  // REMAINING MISSING CARDS (Non-Champions)
  // Spells
  { id: 'freeze', name: 'Freeze', cost: 4, color: '#87CEEB', type: 'spell', damage: 91, radius: 50, count: 1, freezeDuration: 4, rarity: 'epic' },
  { id: 'rage', name: 'Rage', cost: 2, color: '#9b59b6', type: 'spell', damage: 0, radius: 60, count: 1, rageDuration: 7, rageBoost: 0.35, rarity: 'epic' },
  { id: 'snowball', name: 'Snowball', cost: 2, color: '#E8F4F8', type: 'spell', damage: 159, radius: 35, count: 1, knockback: 15, slow: 0.35, slowDuration: 2.5, rarity: 'common' },
  { id: 'barb_barrel', name: 'Barb Barrel', cost: 2, color: '#8B4513', type: 'spell', damage: 243, radius: 30, count: 1, spawns: 'barbarian_single', spawnCount: 1, knockback: 10, rarity: 'epic' },
  { id: 'barbarian_single', name: 'Barbarian', cost: 0, color: '#CD853F', hp: 670, speed: 1.5, type: 'ground', range: 30, damage: 192, attackSpeed: 1300, projectile: null, count: 1, rarity: 'common', isToken: true },
  { id: 'royal_delivery', name: 'Royal Delivery', cost: 3, color: '#3498db', type: 'spell', damage: 362, radius: 45, count: 1, spawns: 'royal_recruit_single', spawnCount: 1, spawnDelay: 3000, rarity: 'common' },
  { id: 'royal_recruit_single', name: 'Royal Recruit', cost: 0, color: '#3498db', hp: 1281, shieldHp: 240, speed: 1.5, type: 'ground', range: 30, damage: 190, attackSpeed: 1200, projectile: null, count: 1, rarity: 'common', isToken: true, hasShield: true },
  { id: 'tornado', name: 'Tornado', cost: 3, color: '#7f8c8d', type: 'spell', damage: 44, radius: 60, count: 1, duration: 1, pullStrength: 100, rarity: 'epic' },

  // Troops - Easy
  { id: 'flying_machine', name: 'Flying Machine', cost: 4, color: '#f1c40f', hp: 510, speed: 2, type: 'flying', range: 100, damage: 152, attackSpeed: 1100, projectile: 'bullet', count: 1, rarity: 'rare' },
  { id: 'wall_breakers', name: 'Wall Breakers', cost: 2, color: '#bdc3c7', hp: 332, speed: 4, type: 'ground', range: 5, damage: 446, attackSpeed: 1000, projectile: null, count: 2, targetType: 'buildings', kamikaze: true, splash: true, splashRadius: 40, rarity: 'epic' },
  { id: 'skeleton_dragons', name: 'Skel Dragons', cost: 4, color: '#27ae60', hp: 596, speed: 2, type: 'flying', range: 55, damage: 106, attackSpeed: 1800, projectile: 'dragon_fire', count: 2, splash: true, rarity: 'common' },

  // Troops - Medium
  { id: 'bowler', name: 'Bowler', cost: 5, color: '#3498db', hp: 2350, speed: 1.5, type: 'ground', range: 50, damage: 290, attackSpeed: 2500, projectile: 'boulder', count: 1, splash: true, knockback: 25, pierce: true, rarity: 'epic' },
  { id: 'executioner', name: 'Executioner', cost: 5, color: '#2c3e50', hp: 1150, speed: 1.5, type: 'ground', range: 70, damage: 210, attackSpeed: 2400, projectile: 'axe_boomerang', count: 1, splash: true, boomerang: true, rarity: 'epic' },
  { id: 'zappies', name: 'Zappies', cost: 4, color: '#f1c40f', hp: 440, speed: 1.5, type: 'ground', range: 55, damage: 85, attackSpeed: 2100, projectile: 'electric_zap', count: 3, stun: 0.5, rarity: 'rare' },
  { id: 'rascals', name: 'Rascals', cost: 5, color: '#e67e22', hp: 1281, speed: 1.5, type: 'ground', range: 25, damage: 182, attackSpeed: 1200, projectile: null, count: 1, rarity: 'common', spawnsExtra: 'rascal_girls', extraCount: 2 },
  { id: 'rascal_girls', name: 'Rascal Girls', cost: 0, color: '#e67e22', hp: 300, speed: 2.5, type: 'ground', range: 100, damage: 107, attackSpeed: 1100, projectile: 'slingshot', count: 1, rarity: 'common', isToken: true },
  { id: 'royal_recruits', name: 'Royal Recruits', cost: 7, color: '#3498db', hp: 630, shieldHp: 200, speed: 1.5, type: 'ground', range: 30, damage: 125, attackSpeed: 1200, projectile: null, count: 7, rarity: 'common', hasShield: true, splitSpawn: true },

  // Troops/Buildings - Hard
  { id: 'cannon_cart', name: 'Cannon Cart', cost: 5, color: '#7f8c8d', hp: 696, shieldHp: 590, speed: 2.5, type: 'ground', range: 70, damage: 202, attackSpeed: 1200, projectile: 'cannonball', count: 1, rarity: 'epic', hasShield: true, transformsToBuilding: true },
  { id: 'goblin_drill', name: 'Goblin Drill', cost: 4, color: '#2ecc71', hp: 1200, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 9, spawns: 'sword_goblins', spawnRate: 1.1, spawnCount: 1, rarity: 'epic', deployAnywhere: true },
  { id: 'phoenix', name: 'Phoenix', cost: 4, color: '#e74c3c', hp: 1000, speed: 2.5, type: 'flying', range: 50, damage: 200, attackSpeed: 1600, projectile: 'phoenix_fire', count: 1, splash: true, rarity: 'legendary', revivesAsEgg: true, eggHp: 800, eggDuration: 3000 },
  { id: 'phoenix_egg', name: 'Phoenix Egg', cost: 0, color: '#f39c12', hp: 800, speed: 0, type: 'ground', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, rarity: 'legendary', isToken: true, hatchesInto: 'phoenix', hatchDuration: 3000 }
];

const RARITY_COLORS = {
  common: '#7f8c8d',    // Gray
  rare: '#f39c12',      // Orange
  epic: '#9b59b6',      // Purple
  legendary: '#2ecc71'  // Emerald/Rainbow substitute
};

// --- Main Menu Component ---
const MainMenu = ({ onStart }) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const TIPS = [
    "Tip: Destroying enemy towers grants Crowns!",
    "Tip: Join a Clan to request cards and friendly battle!",
    "Tip: Don't spend all your Elixir at once!",
    "Tip: Lure enemy troops to the center to activate your King Tower.",
    "Tip: Use spells to damage multiple units at once.",
    "Tip: Balance your deck with ground and air units."
  ];

  useEffect(() => {
    // Pick a random tip on mount
    setTipIndex(Math.floor(Math.random() * TIPS.length));

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoaded(true);
          return 100;
        }
        return prev + 2; // Slower load for effect
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Auto-start when loaded
  useEffect(() => {
    if (loaded) {
      // Small delay before transition
      const timer = setTimeout(onStart, 500);
      return () => clearTimeout(timer);
    }
  }, [loaded, onStart]);

  return (
    <ImageBackground source={require('./background.jpg')} style={styles.menuContainer}>
      <View style={styles.menuOverlay}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextClash}>CLASH</Text>
          <Text style={styles.logoTextRoyale}>ROYALE</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.loadingBottomContainer}>
          <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>

          <View style={styles.loadingBarRow}>
            <Text style={styles.loadingPercentage}>{progress}%</Text>
            <View style={styles.loadingBarTrack}>
              <View style={[styles.loadingBarFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <Text style={styles.loadingStateText}>Updating Arena...</Text>
        </View>

        <Text style={styles.copyrightText}>SUPERCELL</Text>
      </View>
    </ImageBackground>
  );
};

// --- Game Over Component ---
const GameOverScreen = ({ result, onRestart }) => {
  const isVictory = result === 'VICTORY';
  return (
    <View style={styles.gameOverContainer}>
      <Text style={[styles.gameOverTitle, { color: isVictory ? '#F1C40F' : '#E74C3C' }]}>
        {result}!
      </Text>
      <TouchableOpacity style={styles.restartButton} onPress={() => onRestart('lobby')}>
        <Text style={styles.restartButtonText}>RETURN TO LOBBY</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- SVG Sprites ---
const TowerSprite = ({ type, isOpponent, size }) => {
  const color = isOpponent ? '#E74C3C' : '#3498DB';
  const secondary = isOpponent ? '#C0392B' : '#2980B9';

  if (type === 'king') {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Rect x="10" y="40" width="80" height="50" rx="5" fill="#7f8c8d" stroke="black" strokeWidth="2" />
        <Rect x="20" y="20" width="60" height="40" fill={color} stroke="black" strokeWidth="2" />
        <Rect x="15" y="10" width="15" height="15" fill={secondary} stroke="black" strokeWidth="1" />
        <Rect x="42.5" y="10" width="15" height="15" fill={secondary} stroke="black" strokeWidth="1" />
        <Rect x="70" y="10" width="15" height="15" fill={secondary} stroke="black" strokeWidth="1" />
        <Circle cx="50" cy="65" r="10" fill="black" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="20" y="30" width="60" height="60" rx="5" fill="#95a5a6" stroke="black" strokeWidth="2" />
      <Rect x="15" y="10" width="70" height="25" fill={color} stroke="black" strokeWidth="2" />
      <Rect x="40" y="50" width="20" height="30" rx="10" fill="black" />
    </Svg>
  );
};

const UnitSprite = ({ id, isOpponent, size = 30, unit }) => {
  const color = isOpponent ? '#E74C3C' : '#3498DB';
  const isHidden = unit?.hidden?.active;

  // Check if unit is flying to add shadow
  const card = CARDS.find(c => c.id === id);
  const isFlying = card?.type === 'flying';

  switch (id) {
    case 'knight':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M50 20 L50 80 M30 35 L70 35" stroke="white" strokeWidth="8" strokeLinecap="round" />
        </Svg>
      );
    case 'archers':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M30 20 Q70 50 30 80" stroke="white" strokeWidth="5" fill="none" />
          <Path d="M30 20 L30 80" stroke="white" strokeWidth="2" />
        </Svg>
      );
    case 'giant':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="48" fill={color} stroke="white" strokeWidth="2" />
          <Circle cx="50" cy="50" r="25" fill="#e67e22" stroke="white" strokeWidth="2" />
        </Svg>
      );
    case 'goblins':
    case 'spear_goblins':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M20 50 L50 80 L80 50 L50 20 Z" fill="#2ecc71" stroke="white" strokeWidth="2" />
          {/* Spear */}
          <Path d="M50 15 L50 45" stroke="#8B4513" strokeWidth="4" />
          <Path d="M45 15 L50 5 L55 15" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="1" />
        </Svg>
      );
    case 'baby_dragon':
      const babyDragonSprite = (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M20 40 Q50 10 80 40" stroke="#27ae60" strokeWidth="5" fill="none" />
          <Circle cx="50" cy="50" r="20" fill="#27ae60" />
        </Svg>
      );
      return (
        <View style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute',
            left: size * 0.1,
            top: size * 0.7,
            width: size * 0.8,
            height: size * 0.2,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: size * 0.15
          }} />
          {babyDragonSprite}
        </View>
      );
    case 'musketeer':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M20 50 Q50 10 80 50" fill="#8e44ad" stroke="black" strokeWidth="2" />
          <Rect x="45" y="40" width="10" height="40" fill="#95a5a6" />
        </Svg>
      );
    case 'mini_pekka':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M20 30 L40 50 L60 50 L80 30" stroke="#2c3e50" strokeWidth="5" fill="none" />
          <Circle cx="50" cy="60" r="10" fill="#3498db" />
        </Svg>
      );
    case 'fireball':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#e74c3c" stroke="orange" strokeWidth="2" />
          <Path d="M50 10 Q80 50 50 90 Q20 50 50 10" fill="orange" />
        </Svg>
      );
    case 'cannon':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x="20" y="60" width="60" height="20" fill="#5D4037" />
          <Circle cx="70" cy="70" r="10" fill="#3E2723" />
          <Rect x="30" y="30" width="40" height="40" fill="#2c3e50" rx="5" transform="rotate(-30 50 50)" />
        </Svg>
      );
    case 'barbarians':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Rect x="30" y="25" width="40" height="20" fill="#f1c40f" />
          <Path d="M40 60 L60 60 L50 80 Z" fill="#f1c40f" />
        </Svg>
      );
    case 'arrows':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d="M20 80 L80 20 M30 85 L85 30 M15 70 L70 15" stroke={color} strokeWidth="3" />
          <Path d="M80 20 L70 20 L80 30 M85 30 L75 30 L85 40 M70 15 L60 15 L70 25" stroke={color} strokeWidth="3" fill="none" />
        </Svg>
      );
    case 'zap':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d="M60 10 L30 50 L50 50 L40 90 L80 40 L60 40 Z" fill="#3498db" stroke="white" strokeWidth="2" />
        </Svg>
      );
    case 'minions':
    case 'minion_horde':
      const minionSprite = (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="30" fill={color} />
          <Path d="M25 40 Q10 20 25 10 M75 40 Q90 20 75 10" stroke="#95a5a6" strokeWidth="3" fill="none" />
          <Circle cx="42" cy="45" r="4" fill="white" />
          <Circle cx="58" cy="45" r="4" fill="white" />
        </Svg>
      );
      return (
        <View style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute',
            left: size * 0.2,
            top: size * 0.65,
            width: size * 0.6,
            height: size * 0.15,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: size * 0.08
          }} />
          {minionSprite}
        </View>
      );
    case 'skeletons':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="45" r="20" fill="#ecf0f1" stroke="black" strokeWidth="1" />
          <Rect x="48" y="65" width="4" height="20" fill="#ecf0f1" />
          <Circle cx="43" cy="40" r="3" fill="black" />
          <Circle cx="57" cy="40" r="3" fill="black" />
        </Svg>
      );
    case 'skeleton_army':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Skeleton 1 (Left) */}
          <G transform="translate(-15, 10) scale(0.8)">
            <Circle cx="50" cy="45" r="20" fill="#ecf0f1" stroke="black" strokeWidth="1" />
            <Rect x="48" y="65" width="4" height="20" fill="#ecf0f1" />
            <Circle cx="43" cy="40" r="3" fill="black" />
            <Circle cx="57" cy="40" r="3" fill="black" />
          </G>
          {/* Skeleton 2 (Right) */}
          <G transform="translate(35, 10) scale(0.8)">
            <Circle cx="50" cy="45" r="20" fill="#ecf0f1" stroke="black" strokeWidth="1" />
            <Rect x="48" y="65" width="4" height="20" fill="#ecf0f1" />
            <Circle cx="43" cy="40" r="3" fill="black" />
            <Circle cx="57" cy="40" r="3" fill="black" />
          </G>
          {/* Skeleton 3 (Center Front) */}
          <G transform="translate(10, -5) scale(0.9)">
            <Circle cx="50" cy="45" r="20" fill="#ecf0f1" stroke="black" strokeWidth="1" />
            <Rect x="48" y="65" width="4" height="20" fill="#ecf0f1" />
            <Circle cx="43" cy="40" r="3" fill="black" />
            <Circle cx="57" cy="40" r="3" fill="black" />
          </G>
        </Svg>
      );
    case 'barbarians':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Angry face */}
          <Circle cx="40" cy="45" r="3" fill="white" />
          <Circle cx="60" cy="45" r="3" fill="white" />
          <Circle cx="40" cy="45" r="1.5" fill="black" />
          <Circle cx="60" cy="45" r="1.5" fill="black" />
          {/* Viking helmet with horns */}
          <Path d="M30 35 L20 20 L35 32" stroke="#bdc3c7" strokeWidth="3" fill="none" />
          <Path d="M70 35 L80 20 L65 32" stroke="#bdc3c7" strokeWidth="3" fill="none" />
          <Rect x="35" y="30" width="30" height="15" fill="#95a5a6" rx="3" />
          {/* Sword */}
          <Rect x="70" y="40" width="5" height="35" fill="#bdc3c7" />
          <Path d="M70 40 L72 32 L75 40" fill="#f39c12" />
        </Svg>
      );
    case 'valkyrie':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M25 20 L75 20 L50 90 Z" fill="#e67e22" opacity="0.8" />
          <Rect x="45" y="10" width="10" height="80" fill="#7f8c8d" />
        </Svg>
      );
    case 'poison':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="rgba(255, 140, 0, 0.4)" stroke="#FF8C00" strokeWidth="2" />
          {/* Skeletons/Skulls */}
          <Circle cx="35" cy="40" r="6" fill="white" />
          <Circle cx="33" cy="40" r="1.5" fill="black" />
          <Circle cx="37" cy="40" r="1.5" fill="black" />

          <Circle cx="65" cy="60" r="6" fill="white" />
          <Circle cx="63" cy="60" r="1.5" fill="black" />
          <Circle cx="67" cy="60" r="1.5" fill="black" />

          <Circle cx="50" cy="30" r="5" fill="white" />
          <Circle cx="48" cy="30" r="1.5" fill="black" />
          <Circle cx="52" cy="30" r="1.5" fill="black" />
        </Svg>
      );
    case 'witch':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} />
          <Path d="M20 20 L80 20 L50 50 Z" fill="#9b59b6" />
          <Circle cx="50" cy="40" r="15" fill="#f1c40f" />
        </Svg>
      );
    case 'hog_rider':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} />
          <Rect x="40" y="20" width="20" height="30" fill="#34495e" />
          <Rect x="20" y="40" width="60" height="10" fill="#8B4513" />
        </Svg>
      );
    case 'cursed_hog':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="55" r="40" fill="#ff9ff3" stroke="#f368e0" strokeWidth="2" />
          {/* Snout */}
          <Ellipse cx="50" cy="65" rx="15" ry="10" fill="#feca57" />
          <Circle cx="45" cy="65" r="2" fill="#000" />
          <Circle cx="55" cy="65" r="2" fill="#000" />
          {/* Eyes */}
          <Circle cx="35" cy="45" r="4" fill="#000" />
          <Circle cx="65" cy="45" r="4" fill="#000" />
          {/* Ears */}
          <Path d="M20 35 Q15 20 30 25" fill="#ff9ff3" stroke="#f368e0" strokeWidth="1" />
          <Path d="M80 35 Q85 20 70 25" fill="#ff9ff3" stroke="#f368e0" strokeWidth="1" />
        </Svg>
      );
    case 'royal_hogs':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="55" r="40" fill={color} />
          {/* Crown */}
          <Rect x="35" y="10" width="30" height="15" fill="#f1c40f" />
          <Circle cx="40" cy="10" r="5" fill="#e74c3c" />
          <Circle cx="50" cy="8" r="5" fill="#e74c3c" />
          <Circle cx="60" cy="10" r="5" fill="#e74c3c" />
          {/* Snout */}
          <Ellipse cx="50" cy="65" rx="15" ry="10" fill="#feca57" />
          <Circle cx="45" cy="63" r="2" fill="#000" />
          <Circle cx="55" cy="63" r="2" fill="#000" />
        </Svg>
      );
    case 'miner':
      const minerOpacity = unit?.burrowing?.active ? 0.3 : 1;
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" opacity={minerOpacity}>
          <Circle cx="50" cy="50" r="45" fill={color} />
          {/* Helmet with light */}
          <Rect x="35" y="25" width="30" height="20" fill="#f39c12" rx="5" />
          <Circle cx="50" cy="35" r="8" fill="#fff9c4" />
          {/* Pickaxe */}
          <Path d="M70 30 L90 60" stroke="#8B4513" strokeWidth="4" />
          <Path d="M88 30 L90 60" stroke="#8B4513" strokeWidth="3" />
          <Rect x="85" y="25" width="10" height="8" fill="#7f8c8d" />
        </Svg>
      );
    case 'goblin_cage':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Cage structure */}
          <Rect x="20" y="30" width="60" height="55" fill="none" stroke={color} strokeWidth="4" rx="5" />
          {/* Bars */}
          <Path d="M25 30 L25 85" stroke={color} strokeWidth="3" />
          <Path d="M35 30 L35 85" stroke={color} strokeWidth="3" />
          <Path d="M45 30 L45 85" stroke={color} strokeWidth="3" />
          <Path d="M55 30 L55 85" stroke={color} strokeWidth="3" />
          <Path d="M65 30 L65 85" stroke={color} strokeWidth="3" />
          <Path d="M75 30 L75 85" stroke={color} strokeWidth="3" />
          {/* Roof */}
          <Path d="M15 30 L50 5 L85 30" fill={color} />
          {/* Goblin silhouette inside */}
          <Circle cx="50" cy="60" r="15" fill="#2ecc71" opacity="0.5" />
        </Svg>
      );
    case 'goblin_bruteth':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="55" r="43" fill={color} stroke="#c0392b" strokeWidth="3" />
          {/* Angry eyebrows */}
          <Path d="M30 40 L40 35" stroke="#c0392b" strokeWidth="3" />
          <Path d="M70 40 L60 35" stroke="#c0392b" strokeWidth="3" />
          {/* Eyes */}
          <Circle cx="38" cy="45" r="5" fill="#fff" />
          <Circle cx="62" cy="45" r="5" fill="#fff" />
          <Circle cx="38" cy="45" r="3" fill="#000" />
          <Circle cx="62" cy="45" r="3" fill="#000" />
          {/* Snout ring */}
          <Circle cx="50" cy="65" r="12" fill="none" stroke="#f39c12" strokeWidth="2" />
        </Svg>
      );
    case 'goblin_giant':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Giant body */}
          <Circle cx="50" cy="55" r="45" fill={color} stroke="#1e8449" strokeWidth="4" />
          {/* Belt */}
          <Rect x="20" y="75" width="60" height="10" fill="#8B4513" />
          {/* Spear goblins on back */}
          <Circle cx="25" cy="30" r="12" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <Circle cx="75" cy="30" r="12" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          {/* Their spears */}
          <Path d="M25 30 L10 10" stroke="#8B4513" strokeWidth="2" />
          <Path d="M75 30 L90 10" stroke="#8B4513" strokeWidth="2" />
          {/* Giant face */}
          <Circle cx="50" cy="50" r="15" fill="#1e8449" />
          <Circle cx="42" cy="48" r="4" fill="#fff" />
          <Circle cx="58" cy="48" r="4" fill="#fff" />
          <Circle cx="42" cy="48" r="2" fill="#000" />
          <Circle cx="58" cy="48" r="2" fill="#000" />
        </Svg>
      );
    case 'prince':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {unit?.charge?.active && <Circle cx="50" cy="50" r="48" fill="rgba(255, 255, 0, 0.6)" stroke="orange" strokeWidth="2" />}
          <Circle cx="50" cy="50" r="45" fill={color} />
          <Rect x="45" y="10" width="10" height="70" fill="#95a5a6" />
          <Path d="M30 40 L50 10 L70 40" fill="#f1c40f" />
        </Svg>
      );
    case 'tesla':
      const opacity = isHidden ? 0.2 : 1; // Faint when underground
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
          {isHidden && <Rect x="35" y="75" width="30" height="5" fill="#7f8c8d" rx="2" />}
          <Rect x="30" y="60" width="40" height="30" fill="#95a5a6" />
          <Rect x="45" y="20" width="10" height="40" fill="#3498db" />
          <Circle cx="50" cy="20" r="10" fill="#f1c40f" />
        </Svg>
      );
    case 'wizard':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} />
          <Path d="M20 20 L50 5 L80 20" fill="#3498db" />
          <Circle cx="70" cy="60" r="10" fill="#e74c3c" />
        </Svg>
      );
    case 'ice_wizard':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="#3498db" strokeWidth="2" />
          <Path d="M20 40 Q50 5 80 40" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="2" />
          <Circle cx="50" cy="50" r="20" fill="#3498db" />
          <Circle cx="40" cy="48" r="3" fill="white" />
          <Circle cx="60" cy="48" r="3" fill="white" />
        </Svg>
      );
    case 'tombstone':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x="30" y="25" width="40" height="65" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="3" rx="5" />
          <Path d="M35 25 L50 5 L65 25" stroke="#7f8c8d" strokeWidth="4" fill="none" />
          <Rect x="38" y="50" width="24" height="4" fill="#2c3e50" rx="2" />
          <Rect x="38" y="58" width="24" height="4" fill="#2c3e50" rx="2" />
          <Rect x="44" y="66" width="12" height="4" fill="#2c3e50" rx="2" />
          <Circle cx="40" cy="82" r="3" fill="#34495e" />
          <Circle cx="60" cy="82" r="3" fill="#34495e" />
        </Svg>
      );
    case 'sword_goblins':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Goblin Head */}
          <Circle cx="50" cy="50" r="30" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          {/* Pointy Ears */}
          <Path d="M20 50 L10 40 L25 40 Z" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
          <Path d="M80 50 L90 40 L75 40 Z" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
          {/* Dagger */}
          <Rect x="60" y="40" width="8" height="30" fill="#bdc3c7" transform="rotate(-45 64 55)" />
          <Path d="M60 40 L64 30 L68 40 Z" fill="#bdc3c7" transform="rotate(-45 64 55)" />
          {/* Eyes */}
          <Circle cx="40" cy="45" r="4" fill="black" />
          <Circle cx="60" cy="45" r="4" fill="black" />
        </Svg>
      );
    case 'lava_hound':
      const lavaHoundSprite = (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Outer glow */}
          <Circle cx="50" cy="50" r="48" fill="rgba(231, 76, 60, 0.3)" />
          {/* Main body */}
          <Circle cx="50" cy="55" r="40" fill="#c0392b" stroke="#e74c3c" strokeWidth="3" />
          {/* Lava cracks/veins */}
          <Path d="M30 45 Q50 35 70 45" stroke="#f39c12" strokeWidth="3" fill="none" />
          <Path d="M35 60 Q50 50 65 60" stroke="#f39c12" strokeWidth="2" fill="none" />
          {/* Glowing eyes */}
          <Circle cx="38" cy="50" r="6" fill="#f1c40f" />
          <Circle cx="62" cy="50" r="6" fill="#f1c40f" />
          <Circle cx="38" cy="50" r="3" fill="#e74c3c" />
          <Circle cx="62" cy="50" r="3" fill="#e74c3c" />
          {/* Small wings */}
          <Path d="M15 35 Q5 25 20 20 Q25 30 25 40" fill="#8e44ad" opacity="0.6" />
          <Path d="M85 35 Q95 25 80 20 Q75 30 75 40" fill="#8e44ad" opacity="0.6" />
          {/* Horns */}
          <Path d="M35 25 L30 10 L40 20" fill="#7f8c8d" />
          <Path d="M65 25 L70 10 L60 20" fill="#7f8c8d" />
        </Svg>
      );
      return (
        <View style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute',
            left: size * 0.05,
            top: size * 0.65,
            width: size * 0.9,
            height: size * 0.25,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderRadius: size * 0.2
          }} />
          {lavaHoundSprite}
        </View>
      );
    case 'lava_pups':
      const lavaPupSprite = (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Glow */}
          <Circle cx="50" cy="50" r="42" fill="rgba(231, 76, 60, 0.2)" />
          {/* Body */}
          <Circle cx="50" cy="55" r="30" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          {/* Lava pattern */}
          <Path d="M35 50 Q50 40 65 50" stroke="#f39c12" strokeWidth="2" fill="none" />
          {/* Eyes */}
          <Circle cx="40" cy="50" r="5" fill="#f1c40f" />
          <Circle cx="60" cy="50" r="5" fill="#f1c40f" />
          <Circle cx="40" cy="50" r="2" fill="black" />
          <Circle cx="60" cy="50" r="2" fill="black" />
          {/* Tiny wings */}
          <Path d="M25 40 Q15 30 25 25" stroke="#c0392b" strokeWidth="2" fill="none" />
          <Path d="M75 40 Q85 30 75 25" stroke="#c0392b" strokeWidth="2" fill="none" />
        </Svg>
      );
      return (
        <View style={{ position: 'relative' }}>
          <View style={{
            position: 'absolute',
            left: size * 0.2,
            top: size * 0.65,
            width: size * 0.6,
            height: size * 0.15,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderRadius: size * 0.08
          }} />
          {lavaPupSprite}
        </View>
      );
    case 'three_musketeers':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Background circle */}
          <Circle cx="50" cy="50" r="45" fill="#34495e" stroke="white" strokeWidth="2" />
          {/* Three musketeers - using same design as Musketeer card */}
          {/* Left musketeer */}
          <G transform="translate(15, 20) scale(0.7)">
            <Circle cx="25" cy="50" r="20" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" />
            <Path d="M10 50 Q25 30 40 50" fill="#8e44ad" />
            <Rect x="22" y="45" width="6" height="25" fill="#95a5a6" />
          </G>
          {/* Center musketeer (larger) */}
          <G transform="translate(25, 15) scale(0.85)">
            <Circle cx="25" cy="50" r="20" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" />
            <Path d="M10 50 Q25 30 40 50" fill="#8e44ad" />
            <Rect x="22" y="45" width="6" height="25" fill="#95a5a6" />
          </G>
          {/* Right musketeer */}
          <G transform="translate(35, 20) scale(0.7)">
            <Circle cx="25" cy="50" r="20" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" />
            <Path d="M10 50 Q25 30 40 50" fill="#8e44ad" />
            <Rect x="22" y="45" width="6" height="25" fill="#95a5a6" />
          </G>
        </Svg>
      );
    case 'royal_giant':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Royal crown */}
          <Circle cx="50" cy="50" r="45" fill="#e67e22" stroke="#f39c12" strokeWidth="3" />
          {/* Crown points */}
          <Path d="M25 40 L35 25 L50 35 L65 25 L75 40" fill="#f1c40f" stroke="#e74c3c" strokeWidth="2" />
          {/* Crown base */}
          <Rect x="25" y="40" width="50" height="10" fill="#f1c40f" stroke="#e74c3c" strokeWidth="2" />
          {/* Jewels */}
          <Circle cx="50" cy="30" r="4" fill="#e74c3c" />
          <Circle cx="35" cy="32" r="3" fill="#3498db" />
          <Circle cx="65" cy="32" r="3" fill="#3498db" />
          {/* Giant face */}
          <Circle cx="50" cy="65" r="20" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="2" />
          {/* Eyes */}
          <Circle cx="43" cy="62" r="4" fill="#2c3e50" />
          <Circle cx="57" cy="62" r="4" fill="#2c3e50" />
          <Circle cx="44" cy="61" r="1.5" fill="white" />
          <Circle cx="58" cy="61" r="1.5" fill="white" />
          {/* Mustache */}
          <Path d="M38 70 Q50 75 62 70" stroke="#5d4e37" strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'rocket':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Explosion background */}
          <Circle cx="50" cy="50" r="45" fill="#ff4500" stroke="#e74c3c" strokeWidth="2" />
          {/* Explosion rays */}
          <Path d="M50 5 L50 20 M50 80 L50 95 M5 50 L20 50 M80 50 L95 50" stroke="#f39c12" strokeWidth="4" />
          <Path d="M15 15 L25 25 M75 75 L85 85 M85 15 L75 25 M15 85 L25 75" stroke="#f39c12" strokeWidth="4" />
          {/* Rocket body */}
          <Rect x="42" y="30" width="16" height="45" fill="#7f8c8d" stroke="#2c3e50" strokeWidth="2" rx="3" />
          {/* Red nose cone */}
          <Path d="M42 30 L50 15 L58 30" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          {/* Fins */}
          <Path d="M42 60 L35 75 L42 70" fill="#c0392b" />
          <Path d="M58 60 L65 75 L58 70" fill="#c0392b" />
          {/* Window */}
          <Circle cx="50" cy="45" r="5" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
          <Circle cx="50" cy="45" r="2" fill="#ecf0f1" />
          {/* Flame */}
          <Path d="M45 75 Q50 90 55 75 Q50 82 45 75" fill="#f39c12" />
          <Path d="M47 75 Q50 85 53 75 Q50 80 47 75" fill="#e74c3c" />
        </Svg>
      );
    case 'dark_prince':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Charge aura - like Prince */}
          {unit?.charge?.active && <Circle cx="50" cy="50" r="48" fill="rgba(50, 50, 50, 0.6)" stroke="#2c3e50" strokeWidth="2" />}
          {/* Base design same as Prince, just dark colors */}
          <Circle cx="50" cy="50" r="45" fill="#2c3e50" stroke="#34495e" strokeWidth="2" />
          {/* Dark lance (like Prince's silver lance) */}
          <Rect x="45" y="10" width="10" height="70" fill="#34495e" />
          {/* Dark helmet (like Prince's gold helmet) */}
          <Path d="M30 40 L50 10 L70 40" fill="#2c3e50" stroke="#34495e" strokeWidth="2" />
          {/* Shield (unique to Dark Prince) */}
          <Circle cx="72" cy="55" r="12" fill="#7f8c8d" stroke="#2c3e50" strokeWidth="2" />
          <Path d="M62 45 L82 65" stroke="#2c3e50" strokeWidth="2" />
          <Path d="M82 45 L62 65" stroke="#2c3e50" strokeWidth="2" />
          {/* Red eyes to show it's dark */}
          <Circle cx="45" cy="35" r="3" fill="#e74c3c" />
          <Circle cx="55" cy="35" r="3" fill="#e74c3c" />
        </Svg>
      );
    case 'elite_barbarians':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Background */}
          <Circle cx="50" cy="50" r="45" fill="#c0392b" stroke="#e74c3c" strokeWidth="3" />
          {/* Left elite barbarian - same design as regular Barbarians */}
          <G transform="translate(10, 15) scale(0.8)">
            <Circle cx="25" cy="40" r="15" fill="#CD853F" stroke="#e74c3c" strokeWidth="2" />
            {/* Angry eyes */}
            <Circle cx="20" cy="38" r="2.5" fill="white" />
            <Circle cx="30" cy="38" r="2.5" fill="white" />
            <Circle cx="20" cy="38" r="1" fill="black" />
            <Circle cx="30" cy="38" r="1" fill="black" />
            {/* Viking helmet horns - like regular Barbarians */}
            <Path d="M12 32 L5 20 L18 28" stroke="#bdc3c7" strokeWidth="2" fill="none" />
            <Path d="M38 32 L45 20 L32 28" stroke="#bdc3c7" strokeWidth="2" fill="none" />
            <Rect x="15" y="28" width="20" height="10" fill="#95a5a6" rx="2" />
            {/* Sword */}
            <Rect x="38" y="35" width="4" height="25" fill="#bdc3c7" />
            <Path d="M38 35 L40 28 L43 35" fill="#f39c12" />
          </G>
          {/* Right elite barbarian - same design, larger */}
          <G transform="translate(35, 10) scale(0.85)">
            <Circle cx="25" cy="40" r="15" fill="#CD853F" stroke="#e74c3c" strokeWidth="2" />
            {/* Angry eyes */}
            <Circle cx="20" cy="38" r="2.5" fill="white" />
            <Circle cx="30" cy="38" r="2.5" fill="white" />
            <Circle cx="20" cy="38" r="1" fill="black" />
            <Circle cx="30" cy="38" r="1" fill="black" />
            {/* Viking helmet horns */}
            <Path d="M12 32 L5 20 L18 28" stroke="#bdc3c7" strokeWidth="2" fill="none" />
            <Path d="M38 32 L45 20 L32 28" stroke="#bdc3c7" strokeWidth="2" fill="none" />
            <Rect x="15" y="28" width="20" height="10" fill="#95a5a6" rx="2" />
            {/* Sword */}
            <Rect x="38" y="35" width="4" height="25" fill="#bdc3c7" />
            <Path d="M38 35 L40 28 L43 35" fill="#f39c12" />
          </G>
        </Svg>
      );
    case 'golem':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Rocky aura */}
          <Circle cx="50" cy="50" r="48" fill="rgba(127, 140, 148, 0.3)" />
          {/* Main body - rock formation */}
          <Circle cx="50" cy="55" r="42" fill="#7f8c8d" stroke="#95a5a6" strokeWidth="3" />
          {/* Rock cracks */}
          <Path d="M30 40 L40 50 L35 65" stroke="#5d6d7e" strokeWidth="2" fill="none" />
          <Path d="M65 45 L55 55 L60 70" stroke="#5d6d7e" strokeWidth="2" fill="none" />
          <Path d="M45 30 L50 40 L55 30" stroke="#5d6d7e" strokeWidth="2" fill="none" />
          {/* Glowing eyes */}
          <Circle cx="40" cy="50" r="6" fill="#e74c3c" />
          <Circle cx="60" cy="50" r="6" fill="#e74c3c" />
          <Circle cx="40" cy="50" r="3" fill="#f1c40f" />
          <Circle cx="60" cy="50" r="3" fill="#f1c40f" />
          {/* Rocky protrusions */}
          <Circle cx="25" cy="50" r="8" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
          <Circle cx="75" cy="50" r="8" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
          <Circle cx="35" cy="25" r="6" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
          <Circle cx="65" cy="25" r="6" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
          {/* Mouth */}
          <Rect x="43" y="65" width="14" height="6" fill="#2c3e50" rx="3" />
        </Svg>
      );
    case 'golemite':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Smaller rocky aura */}
          <Circle cx="50" cy="50" r="42" fill="rgba(149, 165, 166, 0.2)" />
          {/* Smaller body */}
          <Circle cx="50" cy="55" r="35" fill="#95a5a6" stroke="#bdc3c7" strokeWidth="2" />
          {/* Rock cracks */}
          <Path d="M35 45 L40 55 L38 65" stroke="#7f8c8d" strokeWidth="2" fill="none" />
          <Path d="M60 48 L55 58 L62 68" stroke="#7f8c8d" strokeWidth="2" fill="none" />
          {/* Eyes */}
          <Circle cx="42" cy="50" r="5" fill="#e74c3c" />
          <Circle cx="58" cy="50" r="5" fill="#e74c3c" />
          <Circle cx="42" cy="50" r="2" fill="#f1c40f" />
          <Circle cx="58" cy="50" r="2" fill="#f1c40f" />
          {/* Small rocky protrusions */}
          <Circle cx="30" cy="50" r="6" fill="#bdc3c7" stroke="#95a5a6" strokeWidth="1" />
          <Circle cx="70" cy="50" r="6" fill="#bdc3c7" stroke="#95a5a6" strokeWidth="1" />
          {/* Mouth */}
          <Rect x="45" y="62" width="10" height="5" fill="#2c3e50" rx="2" />
        </Svg>
      );
    case 'pekka':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Main body - armored robot */}
          <Circle cx="50" cy="50" r="45" fill="#8e44ad" stroke="#9b59b6" strokeWidth="3" />
          {/* Dark armor plates */}
          <Path d="M25 30 L50 20 L75 30" fill="#2c3e50" stroke="#34495e" strokeWidth="2" />
          <Rect x="30" y="35" width="40" height="30" fill="#34495e" rx="5" stroke="#2c3e50" strokeWidth="2" />
          {/* Glowing red eyes */}
          <Circle cx="40" cy="50" r="5" fill="#e74c3c" />
          <Circle cx="60" cy="50" r="5" fill="#e74c3c" />
          <Circle cx="40" cy="50" r="2" fill="#f1c40f" opacity="0.8" />
          <Circle cx="60" cy="50" r="2" fill="#f1c40f" opacity="0.8" />
          {/* Huge scythe */}
          <Path d="M75 40 L95 60" stroke="#bdc3c7" strokeWidth="4" strokeLinecap="round" />
          <Path d="M85 30 L90 40 L95 60 L85 50 Z" fill="#95a5a6" />
          {/* Spikes on armor */}
          <Path d="M30 35 L25 25 M70 35 L75 25" stroke="#7f8c8d" strokeWidth="3" />
        </Svg>
      );
    case 'mega_knight':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Big muscular body */}
          <Circle cx="50" cy="50" r="45" fill="#e67e22" stroke="#d35400" strokeWidth="3" />
          {/* Armor/abs */}
          <Path d="M30 40 L35 30 L45 35 L50 30 L55 35 L65 30 L70 40" fill="#34495e" strokeWidth="3" stroke="none" />
          <Rect x="30" y="40" width="40" height="25" fill="#2c3e50" rx="3" />
          {/* Furious eyes */}
          <Circle cx="38" cy="48" r="5" fill="#e74c3c" />
          <Circle cx="62" cy="48" r="5" fill="#e74c3c" />
          <Circle cx="38" cy="48" r="2" fill="#f1c40f" />
          <Circle cx="62" cy="48" r="2" fill="#f1c40f" />
          {/* Mighty eyebrows */}
          <Path d="M30 40 L38 42 M70 40 L62 42" stroke="#2c3e50" strokeWidth="3" />
          {/* Gold belt */}
          <Rect x="35" y="60" width="30" height="8" fill="#f1c40f" stroke="#e74c3c" strokeWidth="2" />
        </Svg>
      );
    case 'electro_wizard':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Base like Wizard, electric colors */}
          <Circle cx="50" cy="50" r="45" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
          {/* Lightning hat instead of fire hat */}
          <Path d="M20 20 L50 5 L80 20" fill="#f1c40f" stroke="#f39c12" strokeWidth="2" />
          {/* Lightning bolt on hat */}
          <Path d="M45 15 L55 15 L50 25 Z" fill="#3498db" stroke="#2980b9" strokeWidth="1" />
          {/* Electric staff */}
          <Rect x="47" y="35" width="6" height="50" fill="#34495e" />
          {/* Sparks flying from staff */}
          <Circle cx="42" cy="40" r="3" fill="#f1c40f" />
          <Circle cx="58" cy="40" r="3" fill="#f1c40f" />
          <Circle cx="50" cy="38" r="2" fill="#f39c12" />
        </Svg>
      );
    case 'lightning':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Storm cloud background */}
          <Circle cx="50" cy="50" r="45" fill="#34495e" stroke="#2c3e50" strokeWidth="2" />
          {/* Main lightning bolt */}
          <Path d="M60 10 L35 50 L55 50 L40 90 L70 50 L50 50 Z" fill="#f1c40f" stroke="#f39c12" strokeWidth="2" />
          {/* Secondary bolt */}
          <Path d="M25 30 L35 40 L30 50" stroke="#f39c12" strokeWidth="2" fill="none" opacity="0.7" />
          {/* Electric aura */}
          <Circle cx="50" cy="50" r="40" fill="none" stroke="#f1c40f" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
        </Svg>
      );
    case 'x_bow':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Base like Cannon but X-Bow design */}
          <Rect x="20" y="50" width="60" height="30" fill="#7f8c8d" stroke="#95a5a6" strokeWidth="2" rx="3" />
          {/* X-shaped bow arms */}
          <Path d="M30 50 L45 30 M70 50 L55 30" stroke="#2c3e50" strokeWidth="4" />
          <Path d="M30 50 L55 70 M70 50 L45 70" stroke="#2c3e50" strokeWidth="4" />
          {/* Crossbow body */}
          <Circle cx="50" cy="50" r="12" fill="#34495e" stroke="#2c3e50" strokeWidth="2" />
          {/* Arrow loaded */}
          <Path d="M50 50 L50 20" stroke="#8B4513" strokeWidth="3" />
          <Path d="M50 20 L47 15 L50 10 L53 15" fill="#95a5a6" />
          {/* Wheels/stand */}
          <Circle cx="30" cy="70" r="5" fill="#2c3e50" />
          <Circle cx="70" cy="70" r="5" fill="#2c3e50" />
        </Svg>
      );
    case 'mirror':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Mirror frame */}
          <Circle cx="50" cy="50" r="45" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="3" />
          {/* Glass surface with reflection */}
          <Circle cx="50" cy="50" r="35" fill="#e8f4f8" stroke="#bdc3c7" strokeWidth="2" />
          {/* Reflection shimmer */}
          <Path d="M35 40 L50 35 L65 40" stroke="white" strokeWidth="2" opacity="0.6" fill="none" />
          {/* Magic sparkles */}
          <Circle cx="40" cy="35" r="2" fill="#f1c40f" />
          <Circle cx="60" cy="40" r="2" fill="#f1c40f" />
          <Circle cx="50" cy="55" r="2" fill="#3498db" />
          {/* Handle */}
          <Rect x="47" y="90" width="6" height="8" fill="#95a5a6" rx="2" />
        </Svg>
      );
    case 'fire_spirit':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Flaming body - coal with fire */}
          <Circle cx="50" cy="50" r="30" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          <Circle cx="50" cy="50" r="25" fill="#f39c12" stroke="#e67e22" strokeWidth="2" />
          {/* Glowing eyes */}
          <Circle cx="42" cy="45" r="4" fill="#f1c40f" />
          <Circle cx="58" cy="45" r="4" fill="#f1c40f" />
          <Circle cx="42" cy="45" r="2" fill="#e74c3c" />
          <Circle cx="58" cy="45" r="2" fill="#e74c3c" />
          {/* Small hands and feet */}
          <Circle cx="30" cy="50" r="5" fill="#e74c3c" />
          <Circle cx="70" cy="50" r="5" fill="#e74c3c" />
          <Circle cx="40" cy="75" r="5" fill="#e74c3c" />
          <Circle cx="60" cy="75" r="5" fill="#e74c3c" />
          {/* Flame aura */}
          <Path d="M25 25 Q30 15 35 25 Q40 10 45 25 Q50 5 55 25 Q60 10 65 25 Q70 15 75 25" stroke="#f1c40f" strokeWidth="3" fill="none" opacity="0.8" />
        </Svg>
      );
    case 'ice_spirit':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Ice cube/snowball body */}
          <Rect x="30" y="30" width="40" height="40" rx="8" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
          {/* Ice crystal facets */}
          <Path d="M30 30 L70 70 M50 30 L50 70 M30 50 L70 50" stroke="#85c1e9" strokeWidth="1" opacity="0.5" />
          {/* Glowing eyes */}
          <Circle cx="42" cy="45" r="4" fill="white" />
          <Circle cx="58" cy="45" r="4" fill="white" />
          <Circle cx="42" cy="45" r="2" fill="#3498db" />
          <Circle cx="58" cy="45" r="2" fill="#3498db" />
          {/* Small hands and feet */}
          <Circle cx="25" cy="50" r="5" fill="#3498db" stroke="#2980b9" strokeWidth="1" />
          <Circle cx="75" cy="50" r="5" fill="#3498db" stroke="#2980b9" strokeWidth="1" />
          <Circle cx="40" cy="75" r="5" fill="#3498db" stroke="#2980b9" strokeWidth="1" />
          <Circle cx="60" cy="75" r="5" fill="#3498db" stroke="#2980b9" strokeWidth="1" />
          {/* Frost aura */}
          <Circle cx="50" cy="50" r="45" fill="none" stroke="#85c1e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        </Svg>
      );
    case 'electro_spirit':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Electric body */}
          <Circle cx="50" cy="50" r="30" fill="#9b59b6" stroke="#8e44ad" strokeWidth="2" />
          {/* Lightning bolt mustache */}
          <Path d="M30 55 L45 50 L40 60 L50 45 L55 55 L70 50" stroke="#f1c40f" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Glowing eyes */}
          <Circle cx="42" cy="40" r="4" fill="#3498db" />
          <Circle cx="58" cy="40" r="4" fill="#3498db" />
          <Circle cx="42" cy="40" r="2" fill="white" />
          <Circle cx="58" cy="40" r="2" fill="white" />
          {/* Small hands and feet */}
          <Circle cx="25" cy="50" r="5" fill="#9b59b6" stroke="#8e44ad" strokeWidth="1" />
          <Circle cx="75" cy="50" r="5" fill="#9b59b6" stroke="#8e44ad" strokeWidth="1" />
          <Circle cx="40" cy="75" r="5" fill="#9b59b6" stroke="#8e44ad" strokeWidth="1" />
          <Circle cx="60" cy="75" r="5" fill="#9b59b6" stroke="#8e44ad" strokeWidth="1" />
          {/* Electric sparks */}
          <Path d="M20 20 L25 30 M80 20 L75 30 M20 80 L25 70 M80 80 L75 70" stroke="#f1c40f" strokeWidth="2" opacity="0.8" />
        </Svg>
      );
    case 'heal_spirit':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Gold/yellow glowing body */}
          <Rect x="32" y="32" width="36" height="36" rx="8" fill="#FFD700" stroke="#FFA500" strokeWidth="3" />
          {/* Glowing white eyes */}
          <Circle cx="43" cy="45" r="4" fill="white" />
          <Circle cx="57" cy="45" r="4" fill="white" />
          <Circle cx="43" cy="45" r="2" fill="#FFA500" />
          <Circle cx="57" cy="45" r="2" fill="#FFA500" />
          {/* Small hands and feet - gold */}
          <Circle cx="25" cy="50" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <Circle cx="75" cy="50" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <Circle cx="40" cy="75" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <Circle cx="60" cy="75" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          {/* Healing cross symbol - white with gold glow */}
          <Rect x="47" y="35" width="6" height="14" fill="white" rx="1" />
          <Rect x="43" y="39" width="14" height="6" fill="white" rx="1" />
          {/* Strong golden healing aura */}
          <Circle cx="50" cy="50" r="45" fill="none" stroke="#FFD700" strokeWidth="2" strokeDasharray="5 5" opacity="0.8" />
          <Circle cx="50" cy="50" r="48" fill="none" stroke="#FFA500" strokeWidth="1" opacity="0.5" />
          {/* Inner glow */}
          <Circle cx="50" cy="50" r="38" fill="rgba(255, 215, 0, 0.2)" />
        </Svg>
      );
    case 'bomber':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Bomb in hand */}
          <Circle cx="50" cy="60" r="12" fill="#2c3e50" stroke="#34495e" strokeWidth="2" />
          <Path d="M50 48 L50 72" stroke="#e74c3c" strokeWidth="4" />
          <Circle cx="50" cy="60" r="4" fill="#e74c3c" />
          {/* Fuse */}
          <Path d="M55 50 Q65 45 70 35" stroke="#f39c12" strokeWidth="2" />
          {/* Spark */}
          <Circle cx="70" cy="35" r="2" fill="#f1c40f" />
        </Svg>
      );
    case 'goblin_barrel':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Barrel */}
          <Rect x="30" y="40" width="40" height="40" fill="#8B4513" stroke="#654321" strokeWidth="2" rx="5" />
          <Rect x="35" y="35" width="30" height="10" fill="#654321" />
          <Rect x="40" y="30" width="20" height="10" fill="#8B4513" />
          {/* Metal bands */}
          <Rect x="28" y="50" width="44" height="5" fill="#95a5a6" />
          <Rect x="28" y="65" width="44" height="5" fill="#95a5a6" />
          {/* Goblin face peeking out */}
          <Circle cx="50" cy="55" r="8" fill="#2ecc71" />
          <Circle cx="47" cy="53" r="2" fill="black" />
          <Circle cx="53" cy="53" r="2" fill="black" />
        </Svg>
      );
    case 'elixir_collector':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Base - Larger */}
          <Rect x="10" y="55" width="80" height="35" fill="#f39c12" stroke="#e67e22" strokeWidth="2" rx="4" />
          {/* Elixir vial - Larger */}
          <Rect x="35" y="25" width="30" height="50" fill="#3498db" stroke="#2980b9" strokeWidth="2" rx="4" />
          <Rect x="40" y="15" width="20" height="15" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
          {/* Elixir liquid */}
          <Rect x="38" y="35" width="24" height="35" fill="#9b59b6" opacity="0.7" />
          {/* Collector wheels */}
          <Circle cx="15" cy="85" r="8" fill="#7f8c8d" />
          <Circle cx="85" cy="85" r="8" fill="#7f8c8d" />
        </Svg>
      );
    case 'goblin_hut':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Hut structure - Larger */}
          <Rect x="10" y="45" width="80" height="50" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          {/* Roof - Larger */}
          <Path d="M5 45 L50 10 L95 45 Z" fill="#A0522D" stroke="#654321" strokeWidth="2" />
          {/* Door - Larger */}
          <Rect x="38" y="65" width="24" height="30" fill="#654321" />
          {/* Window */}
          <Circle cx="25" cy="60" r="8" fill="#f1c40f" opacity="0.8" />
          <Circle cx="75" cy="60" r="8" fill="#f1c40f" opacity="0.8" />
        </Svg>
      );
    case 'furnace':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Furnace body */}
          <Rect x="25" y="40" width="50" height="45" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" rx="3" />
          {/* Top opening */}
          <Rect x="35" y="35" width="30" height="10" fill="#2c3e50" />
          {/* Fire inside */}
          <Circle cx="50" cy="60" r="15" fill="#f39c12" opacity="0.8" />
          <Circle cx="50" cy="60" r="8" fill="#e74c3c" />
          {/* Smoke vents */}
          <Rect x="30" y="30" width="8" height="8" fill="#7f8c8d" />
          <Rect x="62" y="30" width="8" height="8" fill="#7f8c8d" />
        </Svg>
      );
    case 'earthquake':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#7f8c8d" stroke="#95a5a6" strokeWidth="3" />
          {/* Cracked ground */}
          <Path d="M20 50 L35 40 L45 55 L60 35 L80 50" stroke="#2c3e50" strokeWidth="4" fill="none" />
          <Path d="M25 60 L40 50 L50 65 L70 45" stroke="#2c3e50" strokeWidth="3" fill="none" />
          {/* Tremor waves */}
          <Circle cx="50" cy="50" r="30" fill="none" stroke="#7f8c8d" strokeWidth="2" strokeDasharray="5 3" />
          <Circle cx="50" cy="50" r="20" fill="none" stroke="#7f8c8d" strokeWidth="2" strokeDasharray="5 3" />
        </Svg>
      );
    case 'graveyard':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#2c3e50" stroke="#34495e" strokeWidth="3" />
          {/* Tombstone */}
          <Rect x="35" y="40" width="30" height="35" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" rx="5" />
          {/* RIP text */}
          <Text x="50" y="60" fill="#2c3e50" fontSize="12" fontWeight="bold" textAnchor="middle">RIP</Text>
          {/* Skeleton hands */}
          <Circle cx="30" cy="70" r="4" fill="#ecf0f1" />
          <Circle cx="70" cy="70" r="4" fill="#ecf0f1" />
          {/* Eerie glow */}
          <Circle cx="50" cy="50" r="40" fill="none" stroke="#2ecc71" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        </Svg>
      );
    case 'lumberjack':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Hard hat */}
          <Rect x="30" y="20" width="40" height="15" fill="#f1c40f" stroke="#e67e22" strokeWidth="2" rx="3" />
          {/* Axe */}
          <Rect x="70" y="35" width="8" height="40" fill="#8B4513" transform="rotate(20 74 55)" />
          <Path d="M70 35 L78 30 L82 40 Z" fill="#95a5a6" transform="rotate(20 74 55)" />
          {/* Face */}
          <Circle cx="45" cy="45" r="3" fill="black" />
          <Circle cx="55" cy="45" r="3" fill="black" />
          {/* Beard */}
          <Path d="M35 55 Q50 75 65 55" fill="#e67e22" />
        </Svg>
      );
    case 'goblin_barrel_spell':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Wooden barrel falling from sky */}
          <Circle cx="50" cy="50" r="40" fill="#8B4513" stroke="#654321" strokeWidth="3" />
          {/* Barrel metal bands */}
          <Rect x="10" y="35" width="80" height="8" fill="#2c3e50" />
          <Rect x="10" y="55" width="80" height="8" fill="#2c3e50" />
          {/* Barrel wood grain */}
          <Path d="M20 30 L20 70 M35 25 L35 75 M50 20 L50 80 M65 25 L65 75 M80 30 L80 70" stroke="#654321" strokeWidth="2" opacity="0.5" />
          {/* Goblin face peeking out */}
          <Circle cx="35" cy="45" r="3" fill="#2ecc71" />
          <Circle cx="65" cy="45" r="3" fill="#2ecc71" />
          {/* Motion lines (falling effect) */}
          <Path d="M30 10 L25 5 M50 5 L50 0 M70 10 L75 5" stroke="#bdc3c7" strokeWidth="2" opacity="0.6" />
        </Svg>
      );
    case 'graveyard_zone':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Authentic CR Graveyard: Purple/Teal mystical zone */}
          <Circle cx="50" cy="50" r="50" fill="rgba(106, 13, 173, 0.3)" stroke="#9b59b6" strokeWidth="2" />
          {/* Inner mystical glow */}
          <Circle cx="50" cy="50" r="40" fill="none" stroke="#2ecc71" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          {/* Skull symbol in center */}
          <G opacity="0.8">
            <Circle cx="50" cy="48" r="18" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="2" />
            <Circle cx="43" cy="45" r="4" fill="#2c3e50" />
            <Circle cx="57" cy="45" r="4" fill="#2c3e50" />
            <Path d="M50 50 L47 55 L53 55 Z" fill="#2c3e50" />
            <Rect x="35" y="58" width="30" height="4" fill="#ecf0f1" transform="rotate(-30, 50, 60)" rx="2" />
            <Rect x="35" y="58" width="30" height="4" fill="#ecf0f1" transform="rotate(30, 50, 60)" rx="2" />
          </G>
          {/* Mystical particles */}
          <Circle cx="25" cy="30" r="2" fill="#fff" opacity="0.8" />
          <Circle cx="75" cy="35" r="2" fill="#fff" opacity="0.8" />
          <Circle cx="30" cy="70" r="2" fill="#9b59b6" opacity="0.8" />
          <Circle cx="70" cy="65" r="2" fill="#9b59b6" opacity="0.8" />
        </Svg>
      );
    case 'guards':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Shield */}
          <Rect x="35" y="35" width="30" height="35" fill="#34495e" stroke="#2c3e50" strokeWidth="2" rx="3" />
          <Circle cx="50" cy="50" r="8" fill="#bdc3c7" stroke="#95a5a6" strokeWidth="2" />
          {/* Eyes */}
          <Circle cx="45" cy="45" r="2" fill="black" />
          <Circle cx="55" cy="45" r="2" fill="black" />
        </Svg>
      );
    case 'bats':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Bat body */}
          <Circle cx="50" cy="55" r="20" fill={color} stroke="black" strokeWidth="1" />
          {/* Bat wings */}
          <Path d="M30 50 Q10 35 15 55 Q10 65 30 55" fill={color} stroke="black" strokeWidth="1" />
          <Path d="M70 50 Q90 35 85 55 Q90 65 70 55" fill={color} stroke="black" strokeWidth="1" />
          {/* Eyes */}
          <Circle cx="43" cy="52" r="3" fill="#e74c3c" />
          <Circle cx="57" cy="52" r="3" fill="#e74c3c" />
          <Circle cx="43" cy="52" r="1" fill="white" />
          <Circle cx="57" cy="52" r="1" fill="white" />
          {/* Ears */}
          <Path d="M38 40 L42 30 L46 40" fill={color} stroke="black" strokeWidth="1" />
          <Path d="M54 40 L58 30 L62 40" fill={color} stroke="black" strokeWidth="1" />
        </Svg>
      );
    case 'ram_rider':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Ram horns */}
          <Path d="M25 35 Q15 20 20 40" stroke="#f1c40f" strokeWidth="4" fill="none" />
          <Path d="M75 35 Q85 20 80 40" stroke="#f1c40f" strokeWidth="4" fill="none" />
          {/* Body armor */}
          <Rect x="35" y="45" width="30" height="25" fill="#34495e" rx="5" />
          {/* Face */}
          <Circle cx="45" cy="40" r="3" fill="black" />
          <Circle cx="55" cy="40" r="3" fill="black" />
          {/* Lance */}
          <Rect x="75" y="30" width="4" height="50" fill="#95a5a6" transform="rotate(15 77 55)" />
          <Circle cx="80" cy="25" r="5" fill="#e74c3c" transform="rotate(15 77 55)" />
        </Svg>
      );
    case 'battle_healer':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Healer wings/halo */}
          <Circle cx="50" cy="20" r="12" fill="#f1c40f" opacity="0.6" />
          {/* Cross symbol */}
          <Rect x="47" y="12" width="6" height="16" fill="white" rx="2" />
          <Rect x="42" y="17" width="16" height="6" fill="white" rx="2" />
          {/* Healer dress */}
          <Path d="M35 60 L30 90 L70 90 L65 60" fill="#c0392b" />
          {/* Face */}
          <Circle cx="45" cy="40" r="3" fill="black" />
          <Circle cx="55" cy="40" r="3" fill="black" />
          {/* Staff */}
          <Rect x="75" y="25" width="4" height="60" fill="#f1c40f" />
          <Circle cx="77" cy="20" r="8" fill="#f39c12" />
        </Svg>
      );
    case 'skeleton_barrel':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Barrel blimp body */}
          <Rect x="25" y="35" width="50" height="35" fill="#8B4513" stroke="#654321" strokeWidth="3" rx="8" />
          {/* Barrel metal bands */}
          <Rect x="23" y="42" width="54" height="4" fill="#2c3e50" />
          <Rect x="23" y="55" width="54" height="4" fill="#2c3e50" />
          {/* Skull and crossbones on barrel */}
          <Circle cx="50" cy="52" r="8" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="2" />
          <Circle cx="47" cy="50" r="2" fill="#2c3e50" />
          <Circle cx="53" cy="50" r="2" fill="#2c3e50" />
          <Path d="M48 54 L50 56 L52 54" fill="#2c3e50" />
          {/* Big wings on sides */}
          <Path d="M25 45 Q10 40 15 50 Q10 55 25 52" fill="#bdc3c7" stroke="#95a5a6" strokeWidth="2" />
          <Path d="M75 45 Q90 40 85 50 Q90 55 75 52" fill="#bdc3c7" stroke="#95a5a6" strokeWidth="2" />
          {/* Small propeller at back */}
          <Circle cx="80" cy="52" r="3" fill="#7f8c8d" />
          <Rect x="78" y="47" width="4" height="10" fill="#95a5a6" opacity="0.7" />
        </Svg>
      );
    case 'battle_ram':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Barbarian 1 (Rear) */}
          <Circle cx="30" cy="65" r="10" fill="#f1c40f" />
          <Circle cx="30" cy="65" r="3" fill="#e67e22" />
          {/* Ram Log */}
          <Rect x="20" y="40" width="60" height="20" fill="#8B4513" stroke="#654321" strokeWidth="2" rx="5" />
          <Rect x="25" y="40" width="5" height="20" fill="#A0522D" />
          <Rect x="70" y="40" width="5" height="20" fill="#A0522D" />
          {/* Barbarian 2 (Front - behind log visually but logically holding front) */}
          {/* Actually draw Front Barb head peaking over or in front? Front barb is mostly hidden by log or in front. */}
          {/* Let's draw Front Barb at 70, 65 */}
          <Circle cx="70" cy="65" r="10" fill="#f1c40f" />
          <Circle cx="70" cy="65" r="3" fill="#e67e22" />
        </Svg>
      );
    case 'ice_golem':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#E8F4F8" stroke="#BDC3C7" strokeWidth="2" />
          <Circle cx="40" cy="45" r="4" fill="#2c3e50" />
          <Circle cx="60" cy="45" r="4" fill="#2c3e50" />
          <Path d="M45 55 L55 55" stroke="#2c3e50" strokeWidth="2" />
          <Path d="M25 25 Q50 15 75 25" stroke="#BDC3C7" strokeWidth="3" fill="none" opacity="0.6" />
        </Svg>
      );
    case 'mega_minion':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Armored body */}
          <Circle cx="50" cy="50" r="40" fill="#8e44ad" stroke="#2c3e50" strokeWidth="3" />
          {/* Armor plates */}
          <Path d="M20 40 Q50 20 80 40" fill="#7f8c8d" stroke="#2c3e50" strokeWidth="2" />
          <Rect x="40" y="60" width="20" height="20" fill="#7f8c8d" stroke="#2c3e50" strokeWidth="2" />
          {/* Horns */}
          <Path d="M30 30 L20 15 L35 25" fill="#2c3e50" />
          <Path d="M70 30 L80 15 L65 25" fill="#2c3e50" />
          {/* Glowing eyes */}
          <Circle cx="40" cy="50" r="5" fill="#f1c40f" />
          <Circle cx="60" cy="50" r="5" fill="#f1c40f" />
        </Svg>
      );
    case 'dart_goblin':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          {/* Wooden mask */}
          <Path d="M30 30 L70 30 L60 80 L40 80 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          <Circle cx="40" cy="45" r="3" fill="black" />
          <Circle cx="60" cy="45" r="3" fill="black" />
          {/* Blowdart */}
          <Rect x="45" y="55" width="10" height="40" fill="#A0522D" />
          {/* Leaf */}
          <Path d="M50 15 Q60 5 60 25 Q50 35 40 25 Q40 5 50 15" fill="#27ae60" />
        </Svg>
      );
    case 'princess':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="#f1c40f" stroke="#e67e22" strokeWidth="2" />
          {/* Hood */}
          <Path d="M20 50 Q50 10 80 50 L80 80 L20 80 Z" fill="#e67e22" />
          <Circle cx="50" cy="50" r="25" fill="#ffe0b2" />
          {/* Face */}
          <Circle cx="40" cy="48" r="3" fill="black" />
          <Circle cx="60" cy="48" r="3" fill="black" />
          {/* Bow */}
          <Path d="M20 60 Q50 90 80 60" stroke="#8B4513" strokeWidth="3" fill="none" />
          {/* Fire arrow tip */}
          <Circle cx="50" cy="75" r="4" fill="#e74c3c" />
        </Svg>
      );
    case 'barbarian_hut':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Hut Base */}
          <Rect x="15" y="40" width="70" height="50" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          {/* Roof */}
          <Path d="M10 40 L50 10 L90 40 Z" fill="#e67e22" stroke="#d35400" strokeWidth="2" />
          {/* Door */}
          <Rect x="40" y="60" width="20" height="30" fill="#2c3e50" />
          {/* Crossed swords symbol */}
          <Path d="M45 25 L55 35 M55 25 L45 35" stroke="#f1c40f" strokeWidth="3" />
        </Svg>
      );
    case 'bandit':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M20 45 Q50 35 80 45 Q80 65 50 70 Q20 65 20 45 Z" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          <Circle cx="40" cy="50" r="4" fill="white" />
          <Circle cx="60" cy="50" r="4" fill="white" />
          <Circle cx="40" cy="50" r="2" fill="black" />
          <Circle cx="60" cy="50" r="2" fill="black" />
          <Rect x="70" y="30" width="6" height="35" fill="#bdc3c7" transform="rotate(45 73 47)" />
          <Path d="M68 30 L73 22 L78 30 Z" fill="#f1c40f" transform="rotate(45 73 47)" />
        </Svg>
      );
    case 'battle_ram':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x="10" y="40" width="80" height="20" fill="#8B4513" stroke="#654321" strokeWidth="2" rx="10" />
          <Circle cx="10" cy="50" r="18" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="3" />
          <Circle cx="10" cy="50" r="12" fill="#bdc3c7" />
          <Path d="M10 38 L15 25 M10 50 L0 50 M10 62 L15 75" stroke="#7f8c8d" strokeWidth="3" />
          <Circle cx="30" cy="70" r="8" fill="#7f8c8d" />
          <Circle cx="70" cy="70" r="8" fill="#7f8c8d" />
          <Circle cx="40" cy="35" r="10" fill="#e67e22" stroke="#d35400" strokeWidth="1" />
          <Circle cx="60" cy="35" r="10" fill="#e67e22" stroke="#d35400" strokeWidth="1" />
        </Svg>
      );
    case 'inferno_tower':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x="25" y="30" width="50" height="65" fill="#2c3e50" stroke="#1a1a2e" strokeWidth="2" rx="5" />
          <Circle cx="50" cy="50" r="18" fill="#1a1a2e" stroke="#000" strokeWidth="2" />
          <Circle cx="50" cy="50" r="15" fill="#e74c3c" opacity="0.8" />
          <Circle cx="50" cy="50" r="10" fill="#f39c12" opacity="0.9" />
          <Path d="M50 35 L45 25 L50 30 L55 25 Z" fill="#e74c3c" />
          <Path d="M50 65 L45 75 L50 70 L55 75 Z" fill="#e74c3c" />
          <Path d="M35 50 L25 45 L30 50 L25 55 Z" fill="#e74c3c" />
          <Path d="M65 50 L75 45 L70 50 L75 55 Z" fill="#e74c3c" />
          <Rect x="22" y="25" width="56" height="8" fill="#c0392b" rx="2" />
        </Svg>
      );
    case 'balloon':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="35" r="30" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          <Path d="M30 35 Q50 25 70 35" stroke="#c0392b" strokeWidth="2" fill="none" />
          <Path d="M25 45 Q50 55 75 45" stroke="#c0392b" strokeWidth="2" fill="none" />
          <Rect x="40" y="65" width="20" height="15" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          <Circle cx="50" cy="75" r="8" fill="#2c3e50" />
          <Circle cx="50" cy="75" r="5" fill="#e74c3c" />
          <Path d="M50 67 L50 60" stroke="#f1c40f" strokeWidth="2" />
          <Path d="M40 65 L30 35" stroke="#8B4513" strokeWidth="1" />
          <Path d="M60 65 L70 35" stroke="#8B4513" strokeWidth="1" />
        </Svg>
      );
    case 'hunter':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Path d="M25 45 L50 20 L75 45 Z" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          <Circle cx="50" cy="45" r="15" fill="#ffe0b2" />
          <Path d="M35 55 Q50 75 65 55" fill="#8B4513" />
          <Circle cx="43" cy="43" r="3" fill="black" />
          <Circle cx="57" cy="43" r="3" fill="black" />
          <Rect x="65" y="35" width="30" height="8" fill="#2c3e50" rx="2" />
          <Rect x="85" y="32" width="12" height="14" fill="#5D4E37" />
          <Rect x="92" y="36" width="8" height="6" fill="#7f8c8d" />
        </Svg>
      );
    // 5 More Cards Sprites
    case 'mega_minion':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Wings */}
          <Path d="M20 50 L5 30 L25 45" fill="#2980b9" stroke="#1a5276" strokeWidth="2" />
          <Path d="M80 50 L95 30 L75 45" fill="#2980b9" stroke="#1a5276" strokeWidth="2" />
          {/* Body */}
          <Circle cx="50" cy="50" r="25" fill="#3498db" />
          {/* Eyes */}
          <Circle cx="43" cy="45" r="5" fill="white" />
          <Circle cx="57" cy="45" r="5" fill="white" />
          <Circle cx="43" cy="45" r="2.5" fill="black" />
          <Circle cx="57" cy="45" r="2.5" fill="black" />
          {/* Angry brows */}
          <Path d="M38 40 L48 43" stroke="black" strokeWidth="2" />
          <Path d="M62 40 L52 43" stroke="black" strokeWidth="2" />
        </Svg>
      );
    case 'electro_giant':
      return (
        <View style={{ position: 'relative' }}>
          {/* Constant blue aura around Electro Giant - BIGGER */}
          <View style={{
            position: 'absolute',
            left: -size * 0.8,
            top: -size * 0.8,
            width: size * 2.6,
            height: size * 2.6,
            borderRadius: size * 1.3,
            backgroundColor: 'rgba(52, 152, 219, 0.25)',
            borderWidth: 3,
            borderColor: 'rgba(52, 152, 219, 0.5)',
            zIndex: -1
          }} />
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} stroke="#f1c40f" strokeWidth="3" />
            {/* Lightning bolts on body */}
            <Path d="M30 30 L40 40 L35 40 L45 55" stroke="#f1c40f" strokeWidth="3" fill="none" />
            <Path d="M70 30 L60 40 L65 40 L55 55" stroke="#f1c40f" strokeWidth="3" fill="none" />
            <Path d="M40 70 L50 60 L45 60 L55 45" stroke="#f1c40f" strokeWidth="3" fill="none" />
            <Path d="M60 70 L50 60 L55 60 L45 45" stroke="#f1c40f" strokeWidth="3" fill="none" />
            {/* Face */}
            <Circle cx="50" cy="50" r="20" fill="#2980b9" />
            <Circle cx="43" cy="47" r="4" fill="white" />
            <Circle cx="57" cy="47" r="4" fill="white" />
            <Circle cx="43" cy="47" r="2" fill="black" />
            <Circle cx="57" cy="47" r="2" fill="black" />
            {/* Electric crown */}
            <Path d="M35 25 L50 15 L65 25 L50 35 Z" fill="#f1c40f" stroke="#f39c12" strokeWidth="2" />
          </Svg>
        </View>
      );
    case 'royal_giant':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Royal crown */}
          <Path d="M30 25 L35 40 L50 30 L65 40 L70 25 L50 35 Z" fill="#f1c40f" stroke="#f39c12" strokeWidth="2" />
          <Circle cx="50" cy="25" r="5" fill="#e74c3c" />
          <Circle cx="35" cy="30" r="3" fill="#3498db" />
          <Circle cx="65" cy="30" r="3" fill="#3498db" />
          {/* Face */}
          <Circle cx="50" cy="55" r="20" fill="#ffe0b2" />
          <Circle cx="43" cy="52" r="4" fill="black" />
          <Circle cx="57" cy="52" r="4" fill="black" />
          <Path d="M40 65 Q50 60 60 65" stroke="#8B4513" strokeWidth="2" fill="none" />
          {/* Cannon on shoulder */}
          <Rect x="70" y="40" width="25" height="12" fill="#2c3e50" rx="2" />
          <Circle cx="95" cy="46" r="8" fill="#34495e" />
        </Svg>
      );
    case 'three_musketeers':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Musketeer 1 (Left) */}
          <G transform="translate(-15, 5) scale(0.85)">
            <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
            <Path d="M20 20 L50 35 L80 20 Z" fill="#e74c3c" />
            <Circle cx="50" cy="45" r="15" fill="#ffe0b2" />
            <Circle cx="43" cy="43" r="3" fill="black" />
            <Circle cx="57" cy="43" r="3" fill="black" />
            <Rect x="65" y="42" width="20" height="6" fill="#2c3e50" />
          </G>
          {/* Musketeer 2 (Right) */}
          <G transform="translate(25, 5) scale(0.85)">
            <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
            <Path d="M20 20 L50 35 L80 20 Z" fill="#e74c3c" />
            <Circle cx="50" cy="45" r="15" fill="#ffe0b2" />
            <Circle cx="43" cy="43" r="3" fill="black" />
            <Circle cx="57" cy="43" r="3" fill="black" />
            <Rect x="65" y="42" width="20" height="6" fill="#2c3e50" />
          </G>
          {/* Musketeer 3 (Center, slightly larger) */}
          <G transform="translate(5, -5) scale(0.9)">
            <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
            <Path d="M20 20 L50 35 L80 20 Z" fill="#e74c3c" />
            <Circle cx="50" cy="45" r="15" fill="#ffe0b2" />
            <Circle cx="43" cy="43" r="3" fill="black" />
            <Circle cx="57" cy="43" r="3" fill="black" />
            <Rect x="65" y="42" width="20" height="6" fill="#2c3e50" />
          </G>
        </Svg>
      );
    case 'lava_hound':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Cracked lava shell */}
          <Path d="M30 30 L40 25 L45 35 L50 25 L55 35 L60 25 L70 30" stroke="#c0392b" strokeWidth="2" fill="none" />
          <Path d="M25 50 L35 45 L40 55 L50 45 L55 55 L65 45 L75 50" stroke="#c0392b" strokeWidth="2" fill="none" />
          <Path d="M30 70 L40 65 L45 75 L50 65 L55 75 L60 65 L70 70" stroke="#c0392b" strokeWidth="2" fill="none" />
          {/* Glowing eyes */}
          <Circle cx="40" cy="45" r="8" fill="#f39c12" opacity="0.8" />
          <Circle cx="60" cy="45" r="8" fill="#f39c12" opacity="0.8" />
          <Circle cx="40" cy="45" r="4" fill="#e74c3c" />
          <Circle cx="60" cy="45" r="4" fill="#e74c3c" />
          {/* Mouth */}
          <Path d="M35 60 Q50 75 65 60" stroke="#c0392b" strokeWidth="3" fill="#7f8c8d" />
          {/* Lava drips */}
          <Circle cx="30" cy="80" r="3" fill="#e74c3c" opacity="0.6" />
          <Circle cx="70" cy="82" r="3" fill="#e74c3c" opacity="0.6" />
        </Svg>
      );
    case 'lava_pups':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="#e74c3c" strokeWidth="2" />
          {/* Small lava cracks */}
          <Path d="M35 35 L45 40 L40 45" stroke="#c0392b" strokeWidth="2" fill="none" />
          <Path d="M65 35 L55 40 L60 45" stroke="#c0392b" strokeWidth="2" fill="none" />
          {/* Big glowing eyes */}
          <Circle cx="40" cy="45" r="10" fill="#f39c12" opacity="0.8" />
          <Circle cx="60" cy="45" r="10" fill="#f39c12" opacity="0.8" />
          <Circle cx="40" cy="45" r="5" fill="#e74c3c" />
          <Circle cx="60" cy="45" r="5" fill="#e74c3c" />
          {/* Cute smile */}
          <Path d="M38 62 Q50 72 62 62" stroke="#c0392b" strokeWidth="2" fill="none" />
          {/* Small wings */}
          <Circle cx="25" cy="45" r="10" fill="#9b59b6" opacity="0.6" />
          <Circle cx="75" cy="45" r="10" fill="#9b59b6" opacity="0.6" />
        </Svg>
      );
    // NEW Cards Sprites
    case 'electro_giant':
      return (
        <View style={{ position: 'relative' }}>
          {/* Constant blue aura around Electro Giant - BIGGER */}
          <View style={{
            position: 'absolute',
            left: -size * 0.8,
            top: -size * 0.8,
            width: size * 2.6,
            height: size * 2.6,
            borderRadius: size * 1.3,
            backgroundColor: 'rgba(52, 152, 219, 0.25)',
            borderWidth: 3,
            borderColor: 'rgba(52, 152, 219, 0.5)',
            zIndex: -1
          }} />
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} stroke="#f1c40f" strokeWidth="3" />
            {/* Lightning bolts on body */}
            <Path d="M30 30 L40 40 L35 40 L45 55" stroke="#f1c40f" strokeWidth="3" fill="none" />
            <Path d="M70 30 L60 40 L65 40 L55 55" stroke="#f1c40f" strokeWidth="3" fill="none" />
            <Path d="M40 70 L50 60 L45 60 L55 45" stroke="#f1c40f" strokeWidth="3" fill="none" />
            <Path d="M60 70 L50 60 L55 60 L45 45" stroke="#f1c40f" strokeWidth="3" fill="none" />
            {/* Face */}
            <Circle cx="50" cy="50" r="20" fill="#2980b9" />
            <Circle cx="43" cy="47" r="4" fill="white" />
            <Circle cx="57" cy="47" r="4" fill="white" />
            <Circle cx="43" cy="47" r="2" fill="black" />
            <Circle cx="57" cy="47" r="2" fill="black" />
            {/* Electric crown */}
            <Path d="M35 25 L50 15 L65 25 L50 35 Z" fill="#f1c40f" stroke="#f39c12" strokeWidth="2" />
          </Svg>
        </View>
      );
    case 'night_witch':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="#e74c3c" strokeWidth="2" />
          {/* Witch hat */}
          <Path d="M30 40 L50 10 L70 40 Z" fill="#2c3e50" />
          <Ellipse cx="50" cy="40" rx="25" ry="8" fill="#2c3e50" />
          {/* Face */}
          <Circle cx="50" cy="55" r="15" fill="#1a1a1a" />
          <Circle cx="43" cy="52" r="4" fill="#e74c3c" />
          <Circle cx="57" cy="52" r="4" fill="#e74c3c" />
          {/* Scythe */}
          <Path d="M75 30 L85 70" stroke="#8B4513" strokeWidth="3" />
          <Path d="M75 30 L70 25 L80 25" stroke="#95a5a6" strokeWidth="2" />
        </Svg>
      );
    case 'inferno_dragon':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Wings */}
          <Path d="M20 40 L5 20 L25 35" fill="#c0392b" stroke="#922b21" strokeWidth="2" />
          <Path d="M80 40 L95 20 L75 35" fill="#c0392b" stroke="#922b21" strokeWidth="2" />
          {/* Body */}
          <Circle cx="50" cy="50" r="25" fill="#e74c3c" />
          {/* Glowing eyes */}
          <Circle cx="42" cy="45" r="6" fill="#f39c12" opacity="0.8" />
          <Circle cx="58" cy="45" r="6" fill="#f39c12" opacity="0.8" />
          <Circle cx="42" cy="45" r="3" fill="#e74c3c" />
          <Circle cx="58" cy="45" r="3" fill="#e74c3c" />
          {/* Fire breath */}
          <Path d="M35 60 Q50 75 65 60" fill="#f39c12" />
          <Circle cx="50" cy="70" r="5" fill="#e74c3c" opacity="0.6" />
          <Circle cx="45" cy="73" r="3" fill="#f39c12" opacity="0.4" />
          <Circle cx="55" cy="73" r="3" fill="#f39c12" opacity="0.4" />
        </Svg>
      );
    case 'elixir_golem':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#D442F5" stroke="#f1c40f" strokeWidth="3" />
          <Circle cx="50" cy="50" r="25" fill="#9b59b6" />
          <Circle cx="43" cy="47" r="5" fill="#f1c40f" />
          <Circle cx="57" cy="47" r="5" fill="#f1c40f" />
          <Path d="M40 62 Q50 68 60 62" stroke="#6c3483" strokeWidth="2" fill="none" />
        </Svg>
      );
    case 'elixir_golemite':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="35" fill="#D442F5" stroke="#fff" strokeWidth="2" />
          <Circle cx="50" cy="50" r="18" fill="#9b59b6" />
          <Circle cx="45" cy="48" r="3" fill="#fff" />
          <Circle cx="55" cy="48" r="3" fill="#fff" />
        </Svg>
      );
    case 'elixir_blob':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="25" fill="#D442F5" opacity="0.8" />
          <Circle cx="50" cy="50" r="15" fill="#D442F5" opacity="0.6" />
          <Circle cx="45" cy="45" r="2" fill="#fff" opacity="0.9" />
        </Svg>
      );
    case 'firecracker':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Firework hat */}
          <Circle cx="50" cy="20" r="12" fill="#e74c3c" />
          <Path d="M38 20 L30 10" stroke="#f1c40f" strokeWidth="2" />
          <Path d="M50 15 L50 5" stroke="#e74c3c" strokeWidth="2" />
          <Path d="M62 20 L70 10" stroke="#f39c12" strokeWidth="2" />
          {/* Face */}
          <Circle cx="50" cy="55" r="15" fill="#ffe0b2" />
          <Circle cx="43" cy="52" r="4" fill="black" />
          <Circle cx="57" cy="52" r="4" fill="black" />
          <Path d="M42 62 Q50 68 58 62" stroke="#e67e22" strokeWidth="2" fill="none" />
          {/* Gun */}
          <Rect x="70" y="45" width="25" height="8" fill="#2c3e50" rx="2" />
          <Circle cx="95" cy="49" r="6" fill="#e74c3c" />
        </Svg>
      );
    case 'giant_skeleton':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#bdc3c7" stroke="white" strokeWidth="2" />
          {/* Big Skull */}
          <Circle cx="50" cy="45" r="30" fill="white" stroke="#7f8c8d" strokeWidth="2" />
          <Circle cx="40" cy="40" r="6" fill="black" />
          <Circle cx="60" cy="40" r="6" fill="black" />
          <Rect x="40" y="55" width="20" height="8" fill="#7f8c8d" rx="2" />
          {/* Bomb on back */}
          <Circle cx="80" cy="70" r="15" fill="#2c3e50" />
          <Path d="M80 55 L80 50" stroke="#8B4513" strokeWidth="3" />
          {/* Fuzzy hat */}
          <Path d="M20 30 Q50 10 80 30" fill="#8B4513" />
        </Svg>
      );
    case 'electro_dragon':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#3498db" stroke="white" strokeWidth="2" />
          {/* Dragon snout */}
          <Path d="M30 60 Q50 85 70 60" fill="#2980b9" />
          {/* Electric eyes */}
          <Circle cx="40" cy="45" r="6" fill="#f1c40f" />
          <Circle cx="60" cy="45" r="6" fill="#f1c40f" />
          {/* Wings */}
          <Path d="M15 40 Q5 20 25 30" fill="#f1c40f" opacity="0.6" />
          <Path d="M85 40 Q95 20 75 30" fill="#f1c40f" opacity="0.6" />
          {/* Lightning symbol */}
          <Path d="M45 10 L55 20 L45 20 L55 30" stroke="#f1c40f" strokeWidth="3" fill="none" />
        </Svg>
      );
    case 'hunter':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Huge eyebrows */}
          <Path d="M30 35 Q40 25 50 35" stroke="black" strokeWidth="6" fill="none" />
          <Path d="M50 35 Q60 25 70 35" stroke="black" strokeWidth="6" fill="none" />
          {/* Mustache */}
          <Path d="M35 60 Q50 75 65 60" fill="black" />
          {/* Shotgun */}
          <Rect x="60" y="50" width="35" height="12" fill="#7f8c8d" rx="2" />
          <Rect x="65" y="52" width="25" height="4" fill="#2c3e50" />
        </Svg>
      );
    case 'magic_archer':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#27ae60" stroke="white" strokeWidth="2" />
          {/* Hood */}
          <Path d="M20 50 Q50 10 80 50 L80 80 L20 80 Z" fill="#1e8449" />
          {/* Face with white beard */}
          <Circle cx="50" cy="50" r="25" fill="#ffe0b2" />
          <Path d="M30 60 Q50 85 70 60" fill="white" />
          {/* Glowing blue eyes */}
          <Circle cx="42" cy="48" r="4" fill="#3498db" />
          <Circle cx="58" cy="48" r="4" fill="#3498db" />
          {/* Magic Bow */}
          <Path d="M20 60 Q50 90 80 60" stroke="#f1c40f" strokeWidth="3" fill="none" />
        </Svg>
      );
    case 'royal_ghost':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="rgba(236, 240, 241, 0.6)" stroke="white" strokeWidth="2" />
          {/* Ghostly hood */}
          <Path d="M25 40 Q50 10 75 40 Q75 80 50 90 Q25 80 25 40" fill="white" opacity="0.8" />
          {/* Hollow eyes */}
          <Circle cx="40" cy="45" r="5" fill="#34495e" />
          <Circle cx="60" cy="45" r="5" fill="#34495e" />
          {/* Crown */}
          <Path d="M40 20 L50 10 L60 20 Z" fill="#f1c40f" />
          {/* Ghostly Sword */}
          <Path d="M70 50 L90 30" stroke="#bdc3c7" strokeWidth="4" opacity="0.7" />
        </Svg>
      );
    case 'sparky':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Large Tesla coil */}
          <Rect x="35" y="20" width="30" height="50" fill="#7f8c8d" stroke="#2c3e50" strokeWidth="2" />
          {/* Electric rings */}
          <Circle cx="50" cy="45" r="25" fill="none" stroke="#f1c40f" strokeWidth="4" opacity="0.8" />
          <Circle cx="50" cy="45" r="15" fill="none" stroke="#f39c12" strokeWidth="3" opacity="0.6" />
          {/* Electric sparks */}
          <Path d="M30 35 L40 30 M70 35 L60 30 M35 60 L40 55 M65 60 L60 55" stroke="#f1c40f" strokeWidth="2" />
          <Circle cx="50" cy="45" r="8" fill="#f39c12" opacity="0.8" />
        </Svg>
      );
    case 'mother_witch':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          {/* Witch hat */}
          <Path d="M30 35 L50 10 L70 35 Z" fill="#2c3e50" stroke="#1a1a1a" strokeWidth="2" />
          <Ellipse cx="50" cy="38" rx="22" ry="5" fill="#2c3e50" />
          {/* Hat buckle */}
          <Rect x="45" y="35" width="10" height="8" fill="#f1c40f" rx="1" />
          {/* Pig magic glow */}
          <Circle cx="75" cy="30" r="10" fill="#f39c12" opacity="0.5" />
          <Circle cx="75" cy="30" r="5" fill="white" />
        </Svg>
      );
    case 'bomb_tower':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Tower base */}
          <Rect x="25" y="30" width="50" height="55" fill="#7f8c8d" stroke="#2c3e50" strokeWidth="2" />
          {/* Cannon opening */}
          <Circle cx="50" cy="35" r="12" fill="#2c3e50" stroke="#1a1a1a" strokeWidth="2" />
          <Circle cx="50" cy="35" r="8" fill="#000" />
          {/* Bomb on top */}
          <Circle cx="50" cy="75" r="15" fill="#2c3e50" stroke="#1a1a1a" strokeWidth="2" />
          <Path d="M50 60 L50 90" stroke="#1a1a1a" strokeWidth="2" />
          <Path d="M35 75 L65 75 M40 65 L60 85 M60 65 L40 85" stroke="#e74c3c" strokeWidth="2" />
          {/* Fuse spark */}
          <Circle cx="80" cy="65" r="3" fill="#f1c40f" opacity="1" />
        </Svg>
      );
    case 'mortar':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x="20" y="40" width="60" height="50" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
          {/* Mortar tube */}
          <Rect x="35" y="20" width="30" height="30" fill="#7f8c8d" stroke="#2c3e50" strokeWidth="2" rx="5" />
          <Circle cx="50" cy="20" r="10" fill="#2c3e50" stroke="#1a1a1a" strokeWidth="2" />
          {/* Base */}
          <Rect x="30" y="75" width="40" height="15" fill="#7f8c8d" rx="2" />
        </Svg>
      );
    case 'royal_hogs':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="55" r="40" fill={color} />
          {/* Crown */}
          <Rect x="35" y="10" width="30" height="15" fill="#f1c40f" />
          <Circle cx="40" cy="10" r="5" fill="#e74c3c" />
          <Circle cx="50" cy="8" r="5" fill="#e74c3c" />
          <Circle cx="60" cy="10" r="5" fill="#e74c3c" />
          {/* Snout */}
          <Ellipse cx="50" cy="65" rx="15" ry="10" fill="#feca57" />
          <Circle cx="45" cy="63" r="2" fill="#000" />
          <Circle cx="55" cy="63" r="2" fill="#000" />
        </Svg>
      );
    case 'miner':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} />
          {/* Helmet with light */}
          <Rect x="35" y="25" width="30" height="20" fill="#f39c12" rx="5" />
          <Circle cx="50" cy="35" r="8" fill="#fff9c4" />
          {/* Pickaxe */}
          <Path d="M70 30 L90 60" stroke="#8B4513" strokeWidth="4" />
          <Path d="M88 30 L90 60" stroke="#8B4513" strokeWidth="3" />
          <Rect x="85" y="25" width="10" height="8" fill="#7f8c8d" />
        </Svg>
      );
    case 'goblin_cage':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Cage structure */}
          <Rect x="20" y="30" width="60" height="55" fill="none" stroke={color} strokeWidth="4" rx="5" />
          {/* Bars */}
          <Path d="M25 30 L25 85" stroke={color} strokeWidth="3" />
          <Path d="M35 30 L35 85" stroke={color} strokeWidth="3" />
          <Path d="M45 30 L45 85" stroke={color} strokeWidth="3" />
          <Path d="M55 30 L55 85" stroke={color} strokeWidth="3" />
          <Path d="M65 30 L65 85" stroke={color} strokeWidth="3" />
          <Path d="M75 30 L75 85" stroke={color} strokeWidth="3" />
          {/* Roof */}
          <Path d="M15 30 L50 5 L85 30" fill={color} />
          {/* Goblin silhouette inside */}
          <Circle cx="50" cy="60" r="15" fill="#2ecc71" opacity="0.5" />
        </Svg>
      );
    case 'goblin_giant':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Giant body */}
          <Circle cx="50" cy="55" r="45" fill={color} stroke="#1e8449" strokeWidth="4" />
          {/* Belt */}
          <Rect x="20" y="75" width="60" height="10" fill="#8B4513" />
          {/* Spear goblins on back */}
          <Circle cx="25" cy="30" r="12" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <Circle cx="75" cy="30" r="12" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          {/* Their spears */}
          <Path d="M25 30 L10 10" stroke="#8B4513" strokeWidth="2" />
          <Path d="M75 30 L90 10" stroke="#8B4513" strokeWidth="2" />
          {/* Giant face */}
          <Circle cx="50" cy="50" r="15" fill="#1e8449" />
          <Circle cx="42" cy="48" r="4" fill="#fff" />
          <Circle cx="58" cy="48" r="4" fill="#fff" />
          <Circle cx="42" cy="48" r="2" fill="#000" />
          <Circle cx="58" cy="48" r="2" fill="#000" />
        </Svg>
      );
    case 'clone':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" opacity="0.5" />
          {/* Clone icon - two overlapping figures */}
          <Circle cx="35" cy="45" r="18" fill="#3498db" stroke="#2980b9" strokeWidth="2" opacity="0.7" />
          <Circle cx="65" cy="45" r="18" fill="#3498db" stroke="#2980b9" strokeWidth="2" opacity="0.9" />
          {/* Clone symbol */}
          <Path d="M30 70 L50 50 L70 70" fill="none" stroke="white" strokeWidth="3" />
        </Svg>
      );
    case 'the_log':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Wooden log trunk - horizontal */}
          <Rect x="5" y="35" width="90" height="30" rx="15" fill="#8B4513" stroke="#5D3A1A" strokeWidth="3" />
          {/* Wood grain lines */}
          <Line x1="20" y1="38" x2="20" y2="62" stroke="#654321" strokeWidth="2" opacity="0.6" />
          <Line x1="35" y1="36" x2="35" y2="64" stroke="#654321" strokeWidth="2" opacity="0.6" />
          <Line x1="50" y1="38" x2="50" y2="62" stroke="#654321" strokeWidth="2" opacity="0.6" />
          <Line x1="65" y1="36" x2="65" y2="64" stroke="#654321" strokeWidth="2" opacity="0.6" />
          <Line x1="80" y1="38" x2="80" y2="62" stroke="#654321" strokeWidth="2" opacity="0.6" />
          {/* Log end with tree rings (left side) */}
          <Circle cx="12" cy="50" r="13" fill="#A0522D" stroke="#654321" strokeWidth="2" />
          <Circle cx="12" cy="50" r="9" fill="none" stroke="#8B4513" strokeWidth="1.5" opacity="0.8" />
          <Circle cx="12" cy="50" r="5" fill="none" stroke="#8B4513" strokeWidth="1" opacity="0.6" />
          <Circle cx="12" cy="50" r="2" fill="#D2691E" />
          {/* Log end with tree rings (right side) */}
          <Circle cx="88" cy="50" r="13" fill="#A0522D" stroke="#654321" strokeWidth="2" />
          <Circle cx="88" cy="50" r="9" fill="none" stroke="#8B4513" strokeWidth="1.5" opacity="0.8" />
          <Circle cx="88" cy="50" r="5" fill="none" stroke="#8B4513" strokeWidth="1" opacity="0.6" />
          <Circle cx="88" cy="50" r="2" fill="#D2691E" />
          {/* Bark texture spots */}
          <Circle cx="28" cy="42" r="2" fill="#5D3A1A" opacity="0.5" />
          <Circle cx="45" cy="58" r="2" fill="#5D3A1A" opacity="0.5" />
          <Circle cx="58" cy="41" r="2" fill="#5D3A1A" opacity="0.5" />
          <Circle cx="72" cy="56" r="2" fill="#5D3A1A" opacity="0.5" />
          {/* Direction arrows showing it rolls */}
          <Path d="M40 75 L45 82 L50 75" fill="#f1c40f" opacity="0.8" />
          <Path d="M55 75 L60 82 L65 75" fill="#f1c40f" opacity="0.8" />
        </Svg>
      );
    // NEW CARD SPRITES
    case 'freeze':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#87CEEB" stroke="#5DADE2" strokeWidth="2" />
          <Path d="M50 15 L50 85" stroke="white" strokeWidth="3" />
          <Path d="M15 50 L85 50" stroke="white" strokeWidth="3" />
          <Path d="M25 25 L75 75" stroke="white" strokeWidth="2" />
          <Path d="M75 25 L25 75" stroke="white" strokeWidth="2" />
          <Circle cx="50" cy="50" r="10" fill="white" opacity="0.8" />
        </Svg>
      );
    case 'rage':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#9b59b6" stroke="#8e44ad" strokeWidth="2" />
          <Path d="M30 60 Q50 20 70 60" stroke="#f1c40f" strokeWidth="4" fill="none" />
          <Path d="M35 65 Q50 35 65 65" stroke="#e74c3c" strokeWidth="3" fill="none" />
          <Circle cx="50" cy="45" r="8" fill="#f1c40f" />
        </Svg>
      );
    case 'snowball':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="#E8F4F8" stroke="#bdc3c7" strokeWidth="2" />
          <Circle cx="40" cy="40" r="5" fill="white" opacity="0.8" />
          <Circle cx="60" cy="55" r="4" fill="white" opacity="0.7" />
          <Circle cx="45" cy="60" r="3" fill="white" opacity="0.6" />
          <Path d="M70 30 L80 20" stroke="#3498db" strokeWidth="2" />
        </Svg>
      );
    case 'barb_barrel':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x="20" y="35" width="60" height="30" rx="15" fill="#8B4513" stroke="#5D3A1A" strokeWidth="2" />
          <Circle cx="30" cy="50" r="10" fill="#A0522D" />
          <Circle cx="70" cy="50" r="10" fill="#A0522D" />
          <Circle cx="50" cy="50" r="8" fill="#CD853F" />
        </Svg>
      );
    case 'tornado':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#7f8c8d" stroke="#95a5a6" strokeWidth="2" />
          <Path d="M30 30 Q50 50 70 30 Q50 50 70 70 Q50 50 30 70 Q50 50 30 30" stroke="#ecf0f1" strokeWidth="3" fill="none" />
          <Circle cx="50" cy="50" r="10" fill="#34495e" />
        </Svg>
      );
    case 'flying_machine':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="#f1c40f" stroke="#e67e22" strokeWidth="2" />
          <Rect x="35" y="40" width="30" height="20" fill="#7f8c8d" rx="3" />
          <Circle cx="35" cy="50" r="8" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
          <Circle cx="65" cy="50" r="8" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
          <Rect x="45" y="25" width="10" height="15" fill="#e74c3c" />
        </Svg>
      );
    case 'wall_breakers':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="#bdc3c7" stroke="#95a5a6" strokeWidth="2" />
          <Circle cx="50" cy="45" r="15" fill="#ecf0f1" />
          <Circle cx="45" cy="42" r="3" fill="black" />
          <Circle cx="55" cy="42" r="3" fill="black" />
          <Rect x="40" y="60" width="20" height="25" fill="#e74c3c" rx="5" />
          <Path d="M45 58 L50 65 L55 58" fill="#f39c12" />
        </Svg>
      );
    case 'skeleton_dragons':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="35" cy="50" r="25" fill="#27ae60" stroke="#2ecc71" strokeWidth="2" />
          <Circle cx="65" cy="50" r="25" fill="#27ae60" stroke="#2ecc71" strokeWidth="2" />
          <Circle cx="30" cy="45" r="3" fill="white" />
          <Circle cx="40" cy="45" r="3" fill="white" />
          <Circle cx="60" cy="45" r="3" fill="white" />
          <Circle cx="70" cy="45" r="3" fill="white" />
        </Svg>
      );
    case 'bowler':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#3498db" stroke="#2980b9" strokeWidth="3" />
          <Circle cx="50" cy="55" r="25" fill="#2c3e50" />
          <Circle cx="42" cy="40" r="5" fill="white" />
          <Circle cx="58" cy="40" r="5" fill="white" />
          <Circle cx="42" cy="40" r="2" fill="black" />
          <Circle cx="58" cy="40" r="2" fill="black" />
          <Circle cx="75" cy="70" r="12" fill="#7f8c8d" stroke="#95a5a6" strokeWidth="2" />
        </Svg>
      );
    case 'executioner':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#2c3e50" stroke="#34495e" strokeWidth="2" />
          <Rect x="35" y="30" width="30" height="20" fill="#7f8c8d" rx="3" />
          <Circle cx="42" cy="40" r="3" fill="#e74c3c" />
          <Circle cx="58" cy="40" r="3" fill="#e74c3c" />
          <Path d="M70 30 L90 50 L70 70" stroke="#bdc3c7" strokeWidth="4" fill="none" />
          <Circle cx="80" cy="50" r="8" fill="#95a5a6" />
        </Svg>
      );
    case 'zappies':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="30" cy="50" r="20" fill="#f1c40f" stroke="#e67e22" strokeWidth="2" />
          <Circle cx="50" cy="35" r="20" fill="#f1c40f" stroke="#e67e22" strokeWidth="2" />
          <Circle cx="70" cy="50" r="20" fill="#f1c40f" stroke="#e67e22" strokeWidth="2" />
          <Path d="M28 45 L32 55 L28 55 L32 65" stroke="#3498db" strokeWidth="2" fill="none" />
          <Path d="M48 30 L52 40 L48 40 L52 50" stroke="#3498db" strokeWidth="2" fill="none" />
          <Path d="M68 45 L72 55 L68 55 L72 65" stroke="#3498db" strokeWidth="2" fill="none" />
        </Svg>
      );
    case 'rascals':
    case 'rascal_girls':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#e67e22" stroke="#d35400" strokeWidth="2" />
          <Circle cx="50" cy="40" r="15" fill="#ecf0f1" />
          <Circle cx="45" cy="38" r="3" fill="black" />
          <Circle cx="55" cy="38" r="3" fill="black" />
          <Path d="M45 48 Q50 52 55 48" stroke="black" strokeWidth="2" fill="none" />
          <Rect x="40" y="55" width="20" height="25" fill="#3498db" rx="3" />
        </Svg>
      );
    case 'royal_recruits':
    case 'royal_recruit_single':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
          <Rect x="30" y="35" width="40" height="30" fill="#7f8c8d" rx="5" />
          <Rect x="35" y="30" width="30" height="10" fill="#f1c40f" />
          <Circle cx="42" cy="50" r="4" fill="white" />
          <Circle cx="58" cy="50" r="4" fill="white" />
          <Rect x="25" y="45" width="10" height="25" fill="#95a5a6" rx="2" />
        </Svg>
      );
    case 'cannon_cart':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x="20" y="50" width="60" height="25" fill="#7f8c8d" rx="5" />
          <Circle cx="30" cy="75" r="10" fill="#2c3e50" />
          <Circle cx="70" cy="75" r="10" fill="#2c3e50" />
          <Rect x="35" y="30" width="30" height="25" fill="#5D4037" rx="3" />
          <Circle cx="50" cy="42" r="8" fill="#2c3e50" />
        </Svg>
      );
    case 'goblin_drill':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="40" fill="#2ecc71" stroke="#27ae60" strokeWidth="3" />
          <Path d="M50 20 L60 50 L50 45 L40 50 Z" fill="#7f8c8d" />
          <Circle cx="50" cy="60" r="15" fill="#95a5a6" />
          <Path d="M40 55 L50 70 L60 55" fill="#27ae60" />
        </Svg>
      );
    case 'phoenix':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#e74c3c" stroke="#c0392b" strokeWidth="2" />
          <Path d="M30 60 Q50 20 70 60" fill="#f39c12" />
          <Path d="M35 55 Q50 30 65 55" fill="#f1c40f" />
          <Circle cx="42" cy="45" r="4" fill="white" />
          <Circle cx="58" cy="45" r="4" fill="white" />
          <Circle cx="42" cy="45" r="2" fill="black" />
          <Circle cx="58" cy="45" r="2" fill="black" />
          <Path d="M25 30 L35 45 M75 30 L65 45" stroke="#f39c12" strokeWidth="3" />
        </Svg>
      );
    case 'phoenix_egg':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d="M50 15 Q80 50 50 85 Q20 50 50 15" fill="#f39c12" stroke="#e67e22" strokeWidth="3" />
          <Path d="M40 50 Q50 40 60 50" stroke="#f1c40f" strokeWidth="2" fill="none" />
          <Circle cx="50" cy="55" r="5" fill="#e74c3c" opacity="0.6" />
        </Svg>
      );
    case 'barbarian_single':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill="#CD853F" stroke="#8B4513" strokeWidth="2" />
          <Rect x="35" y="25" width="30" height="15" fill="#f1c40f" />
          <Path d="M30 30 L25 15 M70 30 L75 15" stroke="#bdc3c7" strokeWidth="3" />
          <Circle cx="42" cy="45" r="4" fill="white" />
          <Circle cx="58" cy="45" r="4" fill="white" />
          <Circle cx="42" cy="45" r="2" fill="black" />
          <Circle cx="58" cy="45" r="2" fill="black" />
          <Rect x="70" y="40" width="5" height="30" fill="#bdc3c7" />
        </Svg>
      );
    default:
      const sprite = (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="45" fill={color} stroke="white" strokeWidth="2" />
          <Rect x="42" y="40" width="16" height="20" fill="white" rx="3" />
          <Circle cx="50" cy="35" r="5" fill="white" />
        </Svg>
      );

      // Add shadow for flying units
      if (isFlying) {
        return (
          <View style={{ position: 'relative' }}>
            <View style={{
              position: 'absolute',
              left: size * 0.15,
              top: size * 0.75,
              width: size * 0.7,
              height: size * 0.15,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: size * 0.1
            }} />
            {sprite}
          </View>
        );
      }
      return sprite;
  }
};

const Card = memo(({ card, isNext, canAfford, onDragStart, onDragMove, onDragEnd, isDragging, lastPlayedCard }) => {
  // Guard against undefined card
  if (!card) {
    return null;
  }

  // Calculate display cost for Mirror card
  const displayCost = card.id === 'mirror' && lastPlayedCard
    ? lastPlayedCard.cost + 1
    : card.cost;

  // For Mirror card, get the card to mirror
  const cardToDisplay = card.id === 'mirror' && lastPlayedCard ? lastPlayedCard : card;
  const isMirror = card.id === 'mirror';

  const callbacksRef = useRef({ onDragStart, onDragMove, onDragEnd });
  const canAffordRef = useRef(canAfford);
  const isNextRef = useRef(isNext);

  // Update refs when props change
  useEffect(() => {
    callbacksRef.current = { onDragStart, onDragMove, onDragEnd };
    canAffordRef.current = canAfford;
    isNextRef.current = isNext;
  }, [onDragStart, onDragMove, onDragEnd, canAfford, isNext]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return true;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const currentCanAfford = canAffordRef.current;
        const currentIsNext = isNextRef.current;
        const { onDragStart } = callbacksRef.current;
        if (!currentIsNext && currentCanAfford && onDragStart) {
          onDragStart(card, gestureState);
        } else {
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { onDragMove } = callbacksRef.current;
        if (!isNextRef.current && canAffordRef.current && onDragMove) {
          onDragMove(gestureState);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { onDragEnd } = callbacksRef.current;
        if (!isNextRef.current && canAffordRef.current && onDragEnd) {
          onDragEnd(gestureState);
        }
      },
    })
  ).current;

  // Always attach panHandlers - we check canAfford inside the callbacks
  // This prevents the responder from being lost when elixir changes
  const handlers = !isNext ? panResponder.panHandlers : {};
  const isLegendary = cardToDisplay.rarity === 'legendary';

  return (
    <View
      style={[
        styles.card,
        !isLegendary && { borderColor: RARITY_COLORS[cardToDisplay.rarity] || '#000' },
        isLegendary && { backgroundColor: 'transparent', borderWidth: 0 },
        isNext && styles.nextCard,
        (!canAfford && !isNext) && styles.disabledCard,
        isDragging && styles.hiddenCard
      ]}
      {...handlers}
    >
      {isLegendary && (
        <Svg width={isNext ? "40" : "60"} height={isNext ? "50" : "75"} viewBox="0 0 60 75" style={{ position: 'absolute', top: 0, left: 0 }}>
          <Defs>
            <LinearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#ff0000" />
              <Stop offset="20%" stopColor="#ffff00" />
              <Stop offset="40%" stopColor="#00ff00" />
              <Stop offset="60%" stopColor="#00ffff" />
              <Stop offset="80%" stopColor="#0000ff" />
              <Stop offset="100%" stopColor="#ff00ff" />
            </LinearGradient>
          </Defs>
          <Polygon
            points="30,2 58,18 58,57 30,73 2,57 2,18"
            fill="#ecf0f1"
            stroke="url(#rainbow)"
            strokeWidth="3"
          />
        </Svg>
      )}
      <View style={styles.cardContent}>
        <UnitSprite id={cardToDisplay.id} isOpponent={false} size={isNext ? 30 : 40} />
        <Text style={styles.cardName}>{cardToDisplay.name}</Text>
        {isMirror && (
          <Text style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 14, fontWeight: 'bold', color: '#FFD700', textShadowColor: '#000', textShadowRadius: 2 }}>
            +1
          </Text>
        )}
      </View>

      <View style={{ position: 'absolute', top: -8, left: -8, zIndex: 10 }}>
        <ElixirDroplet size={24} value={displayCost} />
      </View>

      {isNext && <Text style={styles.nextLabel}>Next</Text>}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: return true (skip re-render) ONLY when canAfford is the same
  // If canAfford changed, return false to trigger re-render
  // Use optional chaining to handle undefined cards
  return prevProps.canAfford === nextProps.canAfford &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.card?.id === nextProps.card?.id;
});

const HealthBar = ({ current, max, isOpponent, hasShield, shieldHp, shieldMax }) => {
  if (current <= 0) return null;
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const shieldPercentage = hasShield && shieldHp > 0 ? Math.max(0, Math.min(100, (shieldHp / shieldMax) * 100)) : 0;

  return (
    <View style={{ position: 'absolute', top: -22, width: '120%', alignItems: 'center', zIndex: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 3, marginBottom: 1 }}>
        {current}
      </Text>

      {/* Shield bar (shown above HP bar if shield exists) */}
      {hasShield && shieldHp > 0 && (
        <View style={{ width: '100%', height: 6, backgroundColor: '#2c3e50', borderRadius: 3, borderWidth: 1, borderColor: '#000', overflow: 'hidden', marginBottom: 1 }}>
          <View
            style={{
              width: `${shieldPercentage}%`,
              height: '100%',
              backgroundColor: '#3498db'
            }}
          />
        </View>
      )}

      {/* HP bar */}
      <View style={{ width: '100%', height: 8, backgroundColor: '#333', borderRadius: 4, borderWidth: 1, borderColor: '#000', overflow: 'hidden' }}>
        <View
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: isOpponent ? '#e74c3c' : '#2ecc71'
          }}
        />
      </View>
    </View>
  );
};

const VisualEffects = ({ effects, setEffects }) => {
  const now = Date.now();

  // Clean up expired effects using useEffect with a timer (not every render)
  useEffect(() => {
    const cleanupTimer = setInterval(() => {
      const cleanupTime = Date.now();
      setEffects(prev => prev.filter(e => cleanupTime - e.startTime < e.duration));
    }, 500); // Clean up every 500ms instead of every render

    return () => clearInterval(cleanupTimer);
  }, [setEffects]);

  const activeEffects = effects.filter(e => now - e.startTime < e.duration);

  return (
    <>
      {activeEffects.map(effect => {
        const progress = (now - effect.startTime) / effect.duration; // 0 to 1
        const opacity = 1 - progress; // Fade out

        if (effect.type === 'fire_explosion') {
          // Fire explosion - expanding orange/red circle
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.3 + progress * 0.7)}
                  fill="#e74c3c"
                  opacity={0.6}
                />
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.5 + progress * 0.5)}
                  fill="#f39c12"
                  opacity={0.4}
                />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'ice_freeze') {
          // Ice freeze - blue expanding circle
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.3 + progress * 0.7)}
                  fill="#3498db"
                  opacity={0.5}
                />
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.5}
                  fill="white"
                  opacity={0.3}
                />
              </Svg>
              {/* Snowflake symbol - outside SVG */}
              <View style={{
                position: 'absolute',
                opacity: opacity
              }}>
                <Text style={{ fontSize: 24 }}>❄️</Text>
              </View>
            </View>
          );
        }

        if (effect.type === 'ice_nova') {
          // Ice Golem death - dramatic ice nova explosion
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Outer ice blast ring */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.3 + progress * 0.7)}
                  fill="rgba(135, 206, 250, 0.3)"
                  stroke="#87CEEB"
                  strokeWidth="4"
                  opacity={0.8}
                />
                {/* Inner frost core */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.4}
                  fill="white"
                  opacity={0.6}
                />
                {/* Ice crystals */}
                <Path d={`M${effect.radius * 0.5} ${effect.radius * 0.2} L${effect.radius * 0.5} ${effect.radius * 0.8}`} stroke="#E0FFFF" strokeWidth="3" opacity={0.9} />
                <Path d={`M${effect.radius * 0.2} ${effect.radius * 0.5} L${effect.radius * 0.8} ${effect.radius * 0.5}`} stroke="#E0FFFF" strokeWidth="3" opacity={0.9} />
                <Path d={`M${effect.radius * 0.3} ${effect.radius * 0.3} L${effect.radius * 0.7} ${effect.radius * 0.7}`} stroke="#E0FFFF" strokeWidth="2" opacity={0.7} />
                <Path d={`M${effect.radius * 0.7} ${effect.radius * 0.3} L${effect.radius * 0.3} ${effect.radius * 0.7}`} stroke="#E0FFFF" strokeWidth="2" opacity={0.7} />
              </Svg>
              {/* Snowflake emoji overlay */}
              <Text style={{
                position: 'absolute',
                fontSize: effect.radius * 0.8,
                opacity: 0.9
              }}>❄️</Text>
            </View>
          );
        }

        if (effect.type === 'clone_spell') {
          // Clone spell - blue aura radius circle
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Blue expanding aura */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.5 + progress * 0.5)}
                  fill="#3498db"
                  opacity={0.4}
                />
                {/* Inner brighter circle */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.6}
                  fill="white"
                  opacity={0.3}
                />
                {/* Clone symbol - two overlapping figures */}
                <Circle
                  cx={effect.radius - 10}
                  cy={effect.radius}
                  r={8}
                  fill="#3498db"
                  opacity={0.8}
                />
                <Circle
                  cx={effect.radius + 10}
                  cy={effect.radius}
                  r={8}
                  fill="#2980b9"
                  opacity={0.9}
                />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'zap_aura') {
          // Zap aura - blue flash with electric feel
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.2 + progress * 0.8)}
                  fill="rgba(52, 152, 219, 0.4)"
                  stroke="#3498db"
                  strokeWidth="3"
                />
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.4}
                  fill="rgba(236, 240, 241, 0.6)"
                />
                {/* Electric sparks */}
                <Circle cx={effect.radius * 0.5} cy={effect.radius * 0.5} r={4} fill="#f1c40f" opacity={0.8} />
                <Circle cx={effect.radius * 1.5} cy={effect.radius * 1.5} r={4} fill="#f1c40f" opacity={0.8} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'heal_glow') {
          // Heal glow - GOLD/YELLOW expanding circle with + symbols (Heal Spirit)
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Outer gold ring - expanding */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.3 + progress * 0.7)}
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="4"
                  opacity={0.8}
                />
                {/* Inner gold glow */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.2 + progress * 0.5)}
                  fill="#FFD700"
                  opacity={0.3}
                />
                {/* Orange accent */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.6}
                  fill="none"
                  stroke="#FFA500"
                  strokeWidth="2"
                  opacity={0.5}
                />
              </Svg>
              {/* Plus symbol - outside SVG */}
              <View style={{
                position: 'absolute',
                opacity: opacity
              }}>
                <Text style={{
                  fontSize: 32,
                  color: '#FFD700',
                  fontWeight: 'bold',
                  textShadowColor: '#FFA500',
                  textShadowRadius: 8
                }}>+</Text>
              </View>
            </View>
          );
        }

        if (effect.type === 'shield_break') {
          // Shield break - blue/gray shatter effect
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Expanding shattered circle */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.3 + progress * 0.7)}
                  fill="none"
                  stroke="#95a5a6"
                  strokeWidth="3"
                  strokeDasharray="10 5"
                  opacity={0.8}
                />
                {/* Inner shatter effect */}
                <Path
                  d={`M${effect.radius * 0.5} ${effect.radius * 0.5} L${effect.radius * 1.5} ${effect.radius * 1.5} M${effect.radius * 1.5} ${effect.radius * 0.5} L${effect.radius * 0.5} ${effect.radius * 1.5}`}
                  stroke="#bdc3c7"
                  strokeWidth="2"
                  opacity={0.6}
                />
                {/* Shield icon breaking */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.3}
                  fill="#3498db"
                  opacity={0.5 - progress * 0.5}
                />
              </Svg>
              {/* Shield break text */}
              <View style={{
                position: 'absolute',
                opacity: opacity
              }}>
                <Text style={{
                  fontSize: 16,
                  color: '#95a5a6',
                  fontWeight: 'bold',
                  textShadowColor: '#2c3e50',
                  textShadowRadius: 3
                }}>🛡️💥</Text>
              </View>
            </View>
          );
        }

        // FREEZE SPELL - Light blue icy circle with snowflake pattern
        if (effect.type === 'freeze_spell') {
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity * 0.8,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Outer freezing ring */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.95}
                  fill="rgba(135, 206, 235, 0.3)"
                  stroke="#87CEEB"
                  strokeWidth="4"
                />
                {/* Inner icy glow */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.6}
                  fill="rgba(255, 255, 255, 0.4)"
                />
                {/* Snowflake pattern - cross */}
                <Path
                  d={`M${effect.radius} ${effect.radius * 0.3} L${effect.radius} ${effect.radius * 1.7}`}
                  stroke="white"
                  strokeWidth="3"
                  opacity={0.8}
                />
                <Path
                  d={`M${effect.radius * 0.3} ${effect.radius} L${effect.radius * 1.7} ${effect.radius}`}
                  stroke="white"
                  strokeWidth="3"
                  opacity={0.8}
                />
                {/* Diagonal lines */}
                <Path
                  d={`M${effect.radius * 0.5} ${effect.radius * 0.5} L${effect.radius * 1.5} ${effect.radius * 1.5}`}
                  stroke="white"
                  strokeWidth="2"
                  opacity={0.6}
                />
                <Path
                  d={`M${effect.radius * 1.5} ${effect.radius * 0.5} L${effect.radius * 0.5} ${effect.radius * 1.5}`}
                  stroke="white"
                  strokeWidth="2"
                  opacity={0.6}
                />
              </Svg>
            </View>
          );
        }

        // RAGE SPELL - Purple pulsing circle with energy lines
        if (effect.type === 'rage_zone' || effect.type === 'rage_spell') {
          const pulseScale = 0.9 + Math.sin(progress * Math.PI * 4) * 0.1;
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity * 0.7,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Outer pulsing ring */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * pulseScale}
                  fill="rgba(155, 89, 182, 0.25)"
                  stroke="#9b59b6"
                  strokeWidth="3"
                />
                {/* Inner energy core */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.4}
                  fill="rgba(231, 76, 60, 0.4)"
                />
                {/* Energy arrows pointing up */}
                <Path
                  d={`M${effect.radius * 0.7} ${effect.radius * 0.8} L${effect.radius} ${effect.radius * 0.4} L${effect.radius * 1.3} ${effect.radius * 0.8}`}
                  stroke="#f1c40f"
                  strokeWidth="3"
                  fill="none"
                />
                <Path
                  d={`M${effect.radius * 0.8} ${effect.radius * 1.2} L${effect.radius} ${effect.radius * 0.8} L${effect.radius * 1.2} ${effect.radius * 1.2}`}
                  stroke="#e74c3c"
                  strokeWidth="2"
                  fill="none"
                />
              </Svg>
            </View>
          );
        }

        // SNOWBALL SPELL - White circle with snowflake particles
        if (effect.type === 'snowball_spell') {
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Expanding white circle */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.3 + progress * 0.7)}
                  fill="rgba(236, 240, 241, 0.5)"
                  stroke="#E8F4F8"
                  strokeWidth="3"
                />
                {/* Snow particles */}
                <Circle cx={effect.radius * 0.6} cy={effect.radius * 0.5} r={4} fill="white" opacity={0.9} />
                <Circle cx={effect.radius * 1.4} cy={effect.radius * 0.7} r={3} fill="white" opacity={0.8} />
                <Circle cx={effect.radius * 0.5} cy={effect.radius * 1.3} r={5} fill="white" opacity={0.7} />
                <Circle cx={effect.radius * 1.3} cy={effect.radius * 1.4} r={4} fill="white" opacity={0.8} />
                <Circle cx={effect.radius} cy={effect.radius * 0.3} r={3} fill="white" opacity={0.9} />
              </Svg>
            </View>
          );
        }

        // TORNADO - Swirling gray vortex with spiral
        if (effect.type === 'tornado_zone' || effect.type === 'tornado_spell') {
          const spinAngle = progress * 720; // Spin multiple times
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity * 0.8,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: `${spinAngle}deg` }]
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Outer vortex ring */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.9}
                  fill="none"
                  stroke="rgba(127, 140, 141, 0.5)"
                  strokeWidth="8"
                  strokeDasharray="20 10"
                />
                {/* Middle ring */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.6}
                  fill="none"
                  stroke="rgba(149, 165, 166, 0.6)"
                  strokeWidth="6"
                  strokeDasharray="15 8"
                />
                {/* Inner vortex */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.3}
                  fill="rgba(52, 73, 94, 0.6)"
                  stroke="#2c3e50"
                  strokeWidth="3"
                />
                {/* Spiral arms */}
                <Path
                  d={`M${effect.radius} ${effect.radius * 0.2} Q${effect.radius * 1.5} ${effect.radius * 0.5} ${effect.radius * 1.5} ${effect.radius}`}
                  stroke="#95a5a6"
                  strokeWidth="3"
                  fill="none"
                  opacity={0.7}
                />
                <Path
                  d={`M${effect.radius} ${effect.radius * 1.8} Q${effect.radius * 0.5} ${effect.radius * 1.5} ${effect.radius * 0.5} ${effect.radius}`}
                  stroke="#95a5a6"
                  strokeWidth="3"
                  fill="none"
                  opacity={0.7}
                />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'chain_lightning' && effect.targets && effect.targets.length > 1) {
          // Chain lightning - draw lines connecting all targets
          const lines = [];
          for (let i = 0; i < effect.targets.length - 1; i++) {
            const start = effect.targets[i];
            const end = effect.targets[i + 1];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Generate jagged lightning path
            const segments = Math.max(3, Math.floor(dist / 30));
            let pathD = `M${start.x} ${start.y}`;
            for (let j = 1; j < segments; j++) {
              const t = j / segments;
              const baseX = start.x + dx * t;
              const baseY = start.y + dy * t;
              const offset = (Math.random() - 0.5) * 15;
              const perpX = -dy / dist * offset;
              const perpY = dx / dist * offset;
              pathD += ` L${baseX + perpX} ${baseY + perpY}`;
            }
            pathD += ` L${end.x} ${end.y}`;

            lines.push(
              <Svg key={`${effect.id}-${i}`} style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                opacity: opacity
              }} viewBox={`0 0 ${width} ${height}`}>
                <Path
                  d={pathD}
                  stroke="#f1c40f"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={pathD}
                  stroke="#3498db"
                  strokeWidth="6"
                  fill="none"
                  opacity={0.5}
                  strokeLinecap="round"
                />
              </Svg>
            );
          }
          return <View key={effect.id}>{lines}</View>;
        }

        if (effect.type === 'heal_pulse') {
          // Heal pulse (Battle Healer & Heal Spirit attack) - STRONG gold/yellow aura
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Outer expanding ring */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.4 + progress * 0.6)}
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="3"
                  opacity={0.8}
                />
                {/* Inner gold glow */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.3 + progress * 0.4)}
                  fill="rgba(255, 215, 0, 0.4)"
                />
                {/* Orange accent ring */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * (0.2 + progress * 0.3)}
                  fill="none"
                  stroke="#FFA500"
                  strokeWidth="2"
                  opacity={0.6}
                />
                {/* Bright center */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.2}
                  fill="#FFF176"
                  opacity={0.8 - progress * 0.3}
                />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'fireball_explosion') {
          // Fireball impact - large explosion
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.5 + progress * 0.5)} fill="#e74c3c" opacity={0.7} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.3 + progress * 0.4)} fill="#f39c12" opacity={0.9} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.2} fill="#fff" opacity={1 - progress} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'zap_impact') {
          // Zap impact - electric spark
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.8} fill="#3498db" opacity={0.8} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.5} fill="#fff" opacity={0.9} />
                <Path d={`M${effect.radius * 0.3} ${effect.radius * 0.2} L${effect.radius * 0.5} ${effect.radius * 0.4}`} stroke="#fff" strokeWidth="2" />
                <Path d={`M${effect.radius * 0.7} ${effect.radius * 0.2} L${effect.radius * 0.5} ${effect.radius * 0.4}`} stroke="#fff" strokeWidth="2" />
                <Path d={`M${effect.radius * 0.3} ${effect.radius * 0.8} L${effect.radius * 0.5} ${effect.radius * 0.6}`} stroke="#fff" strokeWidth="2" />
                <Path d={`M${effect.radius * 0.7} ${effect.radius * 0.8} L${effect.radius * 0.5} ${effect.radius * 0.6}`} stroke="#fff" strokeWidth="2" />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'arrows_impact') {
          // Arrows impact - multiple arrows in ground
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.6} fill="#2ecc71" opacity={0.3} />
                <Path d="M20 40 L25 50 L30 40" stroke="#8B4513" strokeWidth="2" fill="none" transform={`rotate(${30}, ${effect.radius}, ${effect.radius})`} />
                <Path d="M40 20 L45 30 L50 20" stroke="#8B4513" strokeWidth="2" fill="none" transform={`rotate(${-15}, ${effect.radius}, ${effect.radius})`} />
                <Path d="M50 50 L55 60 L60 50" stroke="#8B4513" strokeWidth="2" fill="none" transform={`rotate(${60}, ${effect.radius}, ${effect.radius})`} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'elixir_popup') {
          // Floating Elixir text
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x,
              top: effect.y - (progress * 30), // Float up
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '900',
                color: '#D442F5', // Elixir Pink
                textShadowColor: 'black',
                textShadowRadius: 2,
                textShadowOffset: { width: 1, height: 1 }
              }}>
                {effect.value}
              </Text>
            </View>
          );
        }

        if (effect.type === 'goblin_barrel_spawn') {
          // Barrel break effect - wood particles
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - 20,
              top: effect.y - 20,
              width: 40,
              height: 40,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width="40" height="40" viewBox="0 0 40 40">
                <Path d="M20 20 L10 10 L15 5 Z" fill="#8B4513" transform={`translate(${progress * -10}, ${progress * -10}) rotate(${progress * 90})`} />
                <Path d="M20 20 L30 10 L35 5 Z" fill="#8B4513" transform={`translate(${progress * 10}, ${progress * -10}) rotate(${progress * -90})`} />
                <Path d="M20 20 L10 30 L5 35 Z" fill="#8B4513" transform={`translate(${progress * -10}, ${progress * 10}) rotate(${progress * -90})`} />
                <Path d="M20 20 L30 30 L35 35 Z" fill="#8B4513" transform={`translate(${progress * 10}, ${progress * 10}) rotate(${progress * 90})`} />
                <Circle cx="20" cy="20" r={10 * progress} fill="#95a5a6" opacity={0.5} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'poison_cloud') {
          // Poison spell - green cloud
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity * 0.7,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius} fill="#27ae60" opacity={0.4} />
                <Circle cx={effect.radius * 0.7} cy={effect.radius * 0.6} r={effect.radius * 0.25} fill="#2ecc71" opacity={0.6} />
                <Circle cx={effect.radius * 1.3} cy={effect.radius * 0.7} r={effect.radius * 0.2} fill="#2ecc71" opacity={0.6} />
                <Circle cx={effect.radius * 0.8} cy={effect.radius * 1.3} r={effect.radius * 0.22} fill="#2ecc71" opacity={0.6} />
                <Circle cx={effect.radius * 0.5} cy={effect.radius * 1.5} r={effect.radius * 0.1} fill="#a9dfbf" opacity={progress} />
                <Circle cx={effect.radius * 1.2} cy={effect.radius * 1.4} r={effect.radius * 0.12} fill="#a9dfbf" opacity={progress} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'rocket_explosion') {
          // Rocket impact - massive explosion
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius} fill="#7f8c8d" opacity={0.8} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.7} fill="#e74c3c" opacity={0.9} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.4} fill="#f39c12" opacity={1} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.15} fill="#fff" opacity={1 - progress} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'rage_aura') {
          // Rage spell - purple energy aura
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity * 0.6,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius} fill="none" stroke="#9b59b6" strokeWidth="3" strokeDasharray="10 5" />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.7} fill="none" stroke="#8e44ad" strokeWidth="2" opacity={0.7} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.4} fill="none" stroke="#9b59b6" strokeWidth="2" opacity={0.5} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'dust_cloud') {
          // Recoil dust cloud
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity * 0.8,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * progress} fill="#bdc3c7" opacity={0.5} />
                <Circle cx={effect.radius * 0.7} cy={effect.radius * 0.6} r={effect.radius * 0.2} fill="#95a5a6" opacity={0.6} />
                <Circle cx={effect.radius * 1.3} cy={effect.radius * 0.8} r={effect.radius * 0.15} fill="#95a5a6" opacity={0.6} />
                <Circle cx={effect.radius * 0.8} cy={effect.radius * 1.2} r={effect.radius * 0.18} fill="#7f8c8d" opacity={0.5} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'earthquake_crack') {
          // Earthquake - cracking ground effect
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Rect x="5" y="5" width={effect.radius * 2 - 10} height={effect.radius * 2 - 10} fill="#7f8c8d" stroke="#5d6d7e" strokeWidth="2" rx="5" opacity={0.9} />
                <Path d={`M${effect.radius} 5 L${effect.radius * 0.7} ${effect.radius * 0.5} L${effect.radius} ${effect.radius}`} stroke="#2c3e50" strokeWidth="3" fill="none" />
                <Path d={`M${effect.radius} 5 L${effect.radius * 1.3} ${effect.radius * 0.5} L${effect.radius} ${effect.radius}`} stroke="#2c3e50" strokeWidth="3" fill="none" />
                <Path d={`M5 ${effect.radius} L${effect.radius * 0.5} ${effect.radius * 0.7} L${effect.radius} ${effect.radius}`} stroke="#2c3e50" strokeWidth="2" fill="none" />
                <Path d={`M${effect.radius * 2} ${effect.radius} L${effect.radius * 1.5} ${effect.radius * 1.3} L${effect.radius} ${effect.radius}`} stroke="#2c3e50" strokeWidth="2" fill="none" />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'lightning_strike') {
          // Lightning spell - bolt from sky
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                <Path d={`M${effect.radius} 0 L${effect.radius * 0.7} ${effect.radius * 0.5} L${effect.radius * 1.2} ${effect.radius * 0.5} L${effect.radius * 0.5} ${effect.radius} L${effect.radius * 0.8} ${effect.radius} L${effect.radius} ${effect.radius * 2}`} stroke="#f1c40f" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <Path d={`M${effect.radius} 0 L${effect.radius * 0.7} ${effect.radius * 0.5} L${effect.radius * 1.2} ${effect.radius * 0.5} L${effect.radius * 0.5} ${effect.radius} L${effect.radius * 0.8} ${effect.radius} L${effect.radius} ${effect.radius * 2}`} stroke="#fff" strokeWidth="8" fill="none" opacity={0.5} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={effect.radius} cy={effect.radius * 1.8} r={effect.radius * 0.3} fill="#f1c40f" opacity={1 - progress} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'golem_death') {
          // Golem death - stone explosion
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Main stone burst */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.3 + progress * 0.7)} fill="#7f8c8d" opacity={0.8} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.5 + progress * 0.5)} fill="#95a5a6" opacity={0.6} />
                {/* Flying stone fragments */}
                <Circle cx={effect.radius * 0.3} cy={effect.radius * 0.3} r={effect.radius * 0.15 * (1 + progress)} fill="#7f8c8d" />
                <Circle cx={effect.radius * 1.7} cy={effect.radius * 0.4} r={effect.radius * 0.12 * (1 + progress)} fill="#95a5a6" />
                <Circle cx={effect.radius * 0.5} cy={effect.radius * 1.6} r={effect.radius * 0.18 * (1 + progress)} fill="#7f8c8d" />
                <Circle cx={effect.radius * 1.5} cy={effect.radius * 1.5} r={effect.radius * 0.1 * (1 + progress)} fill="#95a5a6" />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'lava_hound_death') {
          // Lava Hound death - fiery explosion
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Fiery explosion */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.4 + progress * 0.6)} fill="#c0392b" opacity={0.9} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.6 + progress * 0.4)} fill="#e74c3c" opacity={0.7} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.3} fill="#f39c12" opacity={1 - progress} />
                {/* Lava droplets */}
                <Circle cx={effect.radius * 0.2} cy={effect.radius * 0.3} r={effect.radius * 0.1} fill="#e74c3c" />
                <Circle cx={effect.radius * 1.8} cy={effect.radius * 0.5} r={effect.radius * 0.08} fill="#f39c12" />
                <Circle cx={effect.radius * 0.6} cy={effect.radius * 1.7} r={effect.radius * 0.12} fill="#e74c3c" />
                <Circle cx={effect.radius * 1.4} cy={effect.radius * 1.6} r={effect.radius * 0.09} fill="#f39c12" />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'building_destruction') {
          // Building destruction - debris and collapse
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Debris cloud */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.8} fill="#8B4513" opacity={0.6} />
                {/* Building fragments */}
                <Rect x={effect.radius * 0.2} y={effect.radius * 0.2} width={effect.radius * 0.2} height={effect.radius * 0.2} fill="#A0522D" transform={`rotate(${45}, ${effect.radius * 0.3}, ${effect.radius * 0.3})`} />
                <Rect x={effect.radius * 1.6} y={effect.radius * 0.4} width={effect.radius * 0.15} height={effect.radius * 0.15} fill="#8B4513" transform={`rotate(${-30}, ${effect.radius * 1.7}, ${effect.radius * 0.5})`} />
                <Rect x={effect.radius * 0.5} y={effect.radius * 1.6} width={effect.radius * 0.18} height={effect.radius * 0.18} fill="#A0522D" transform={`rotate(${60}, ${effect.radius * 0.6}, ${effect.radius * 1.7})`} />
                <Rect x={effect.radius * 1.3} y={effect.radius * 1.5} width={effect.radius * 0.12} height={effect.radius * 0.12} fill="#8B4513" transform={`rotate(${-45}, ${effect.radius * 1.4}, ${effect.radius * 1.6})`} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'lumberjack_rage') {
          // Lumberjack rage drop - energy burst
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Purple energy burst */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.5 + progress * 0.5)} fill="#9b59b6" opacity={0.8} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.3 + progress * 0.4)} fill="#8e44ad" opacity={0.9} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.2} fill="#fff" opacity={1 - progress} />
                {/* Energy waves */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.6} fill="none" stroke="#9b59b6" strokeWidth="2" opacity={1 - progress} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.8} fill="none" stroke="#8e44ad" strokeWidth="1.5" opacity={0.8 - progress * 0.8} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'mega_knight_slam') {
          // Mega Knight spawn slam - ground pound effect
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Expanding shockwave */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * progress * 0.9} fill="none" stroke="#e67e22" strokeWidth="4" opacity={0.9} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * progress * 0.6} fill="none" stroke="#d35400" strokeWidth="3" opacity={0.8} />
                {/* Ground impact */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.3} fill="#e67e22" opacity={1 - progress} />
                {/* Dust particles */}
                <Circle cx={effect.radius * 0.5} cy={effect.radius * 0.4} r={effect.radius * 0.1} fill="#a04000" opacity={1 - progress * 0.5} />
                <Circle cx={effect.radius * 1.5} cy={effect.radius * 0.6} r={effect.radius * 0.08} fill="#a04000" opacity={1 - progress * 0.5} />
                <Circle cx={effect.radius * 0.6} cy={effect.radius * 1.5} r={effect.radius * 0.12} fill="#a04000" opacity={1 - progress * 0.5} />
                <Circle cx={effect.radius * 1.4} cy={effect.radius * 1.4} r={effect.radius * 0.09} fill="#a04000" opacity={1 - progress * 0.5} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'tesla_reveal') {
          // Tesla reveal - electric emergence effect
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Electric burst */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.3 + progress * 0.7)} fill="none" stroke="#f1c40f" strokeWidth="3" opacity={0.9} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * (0.5 + progress * 0.5)} fill="none" stroke="#3498db" strokeWidth="2" opacity={0.7} />
                {/* Lightning bolts */}
                <Path d={`M${effect.radius * 0.5} ${effect.radius * 0.2} L${effect.radius * 0.5} ${effect.radius * 0.8}`} stroke="#f1c40f" strokeWidth="2" opacity={0.8} />
                <Path d={`M${effect.radius * 1.5} ${effect.radius * 0.2} L${effect.radius * 1.5} ${effect.radius * 0.8}`} stroke="#f1c40f" strokeWidth="2" opacity={0.8} />
                <Path d={`M${effect.radius * 0.2} ${effect.radius * 0.5} L${effect.radius * 0.8} ${effect.radius * 0.5}`} stroke="#f1c40f" strokeWidth="2" opacity={0.8} />
                <Path d={`M${effect.radius * 1.2} ${effect.radius * 0.5} L${effect.radius * 1.8} ${effect.radius * 0.5}`} stroke="#f1c40f" strokeWidth="2" opacity={0.8} />
                {/* Center glow */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.2} fill="#f1c40f" opacity={1 - progress * 0.5} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'tower_hit') {
          // Tower hit - simple flash effect
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - 40,
              top: effect.y - 40,
              width: 80,
              height: 80,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                <Circle cx="40" cy="40" r="35" fill="#fff" opacity={0.3 * opacity} />
                <Circle cx="40" cy="40" r="25" fill="#fff" opacity={0.5 * opacity} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'dash_trail') {
          // Bandit dash trail - orange speed lines
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Speed lines radiating outward */}
                <Path d={`M${effect.radius} ${effect.radius} L${effect.radius * 0.3} ${effect.radius * 0.5}`} stroke="#e67e22" strokeWidth="2" opacity={0.8} />
                <Path d={`M${effect.radius} ${effect.radius} L${effect.radius * 1.7} ${effect.radius * 0.5}`} stroke="#e67e22" strokeWidth="2" opacity={0.8} />
                <Path d={`M${effect.radius} ${effect.radius} L${effect.radius * 0.3} ${effect.radius * 1.5}`} stroke="#e67e22" strokeWidth="2" opacity={0.8} />
                <Path d={`M${effect.radius} ${effect.radius} L${effect.radius * 1.7} ${effect.radius * 1.5}`} stroke="#e67e22" strokeWidth="2" opacity={0.8} />
                {/* Center glow */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.4} fill="#e67e22" opacity={0.6} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.2} fill="#f39c12" opacity={0.8} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'inferno_beam') {
          // Inferno Tower fire beam - intensifying flame stream
          const intensity = effect.intensity || 0; // 0 to 1
          const beamWidth = 3 + intensity * 5; // 3px to 8px width
          const coreOpacity = 0.4 + intensity * 0.4; // 0.4 to 0.8 opacity
          const glowOpacity = 0.2 + intensity * 0.3; // 0.2 to 0.5 opacity

          // Calculate beam position and angle
          const dx = effect.endX - effect.startX;
          const dy = effect.endY - effect.startY;
          const beamLength = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;

          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: Math.min(effect.startX, effect.endX),
              top: Math.min(effect.startY, effect.endY),
              width: Math.abs(dx),
              height: Math.abs(dy),
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: `${angle}deg` }],
              zIndex: 50
            }}>
              <Svg width={Math.abs(dx)} height={Math.abs(dy)} viewBox={`0 0 ${Math.abs(dx)} ${Math.abs(dy)}`}>
                {/* Outer glow - widest part */}
                <Rect
                  x="0"
                  y={Math.abs(dy) / 2 - beamWidth * 2}
                  width={Math.abs(dx)}
                  height={beamWidth * 4}
                  fill="#e74c3c"
                  opacity={glowOpacity * 0.5}
                />
                {/* Middle glow */}
                <Rect
                  x="0"
                  y={Math.abs(dy) / 2 - beamWidth * 1.5}
                  width={Math.abs(dx)}
                  height={beamWidth * 3}
                  fill="#f39c12"
                  opacity={glowOpacity}
                />
                {/* Core beam - brightest part */}
                <Rect
                  x="0"
                  y={Math.abs(dy) / 2 - beamWidth}
                  width={Math.abs(dx)}
                  height={beamWidth * 2}
                  fill="#fff"
                  opacity={coreOpacity * 0.8}
                />
                {/* Hot center - white hot at high intensity */}
                <Rect
                  x="0"
                  y={Math.abs(dy) / 2 - beamWidth * 0.3}
                  width={Math.abs(dx)}
                  height={beamWidth * 0.6}
                  fill="#fff5cc"
                  opacity={coreOpacity * intensity}
                />
                {/* Animated flames along beam */}
                {Array.from({ length: Math.floor(3 + intensity * 5) }).map((_, i) => (
                  <Circle
                    key={i}
                    cx={Math.abs(dx) * (0.2 + (i * 0.15) % 0.8)}
                    cy={Math.abs(dy) / 2}
                    r={beamWidth * (0.5 + Math.sin(Date.now() / 100 + i) * 0.3)}
                    fill="#f39c12"
                    opacity={0.6 + Math.sin(Date.now() / 80 + i * 2) * 0.3}
                  />
                ))}
              </Svg>
            </View>
          );
        }

        if (effect.type === 'electro_aura') {
          // Electro Giant shock aura - blue transparent circle
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Outer glow circle */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.95}
                  fill="none"
                  stroke="#3498db"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  opacity={0.4}
                />
                {/* Inner fill - transparent blue */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.9}
                  fill="#3498db"
                  opacity={0.15}
                />
                {/* Electric particles */}
                <Circle cx={effect.radius * 0.3} cy={effect.radius * 0.3} r={3} fill="#f1c40f" opacity={0.6} />
                <Circle cx={effect.radius * 1.7} cy={effect.radius * 0.3} r={3} fill="#f1c40f" opacity={0.6} />
                <Circle cx={effect.radius * 0.5} cy={effect.radius * 1.7} r={3} fill="#f1c40f" opacity={0.6} />
                <Circle cx={effect.radius * 1.5} cy={effect.radius * 1.7} r={3} fill="#f1c40f" opacity={0.6} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'curse') {
          // Mother Witch curse - purple magical mark
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - 15,
              top: effect.y - 15,
              width: 30,
              height: 30,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width="30" height="30" viewBox="0 0 30 30">
                <Circle cx="15" cy="15" r="12" fill="#9b59b6" opacity={0.5} stroke="#8e44ad" strokeWidth="2" />
                <Circle cx="15" cy="15" r="6" fill="#e74c3c" opacity={0.8} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'curse_purple') {
          // Continuous purple circle above cursed units
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Purple glowing circle */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.8}
                  fill="none"
                  stroke="#9b59b6"
                  strokeWidth="3"
                  opacity={0.8}
                />
                {/* Inner glow */}
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.6}
                  fill="#9b59b6"
                  opacity={0.2}
                />
                {/* Purple particles/sparkles */}
                {[0, 1, 2, 3].map(i => {
                  const angle = (i / 4) * Math.PI * 2 + progress * Math.PI * 2;
                  const x = effect.radius + Math.cos(angle) * effect.radius * 0.7;
                  const y = effect.radius + Math.sin(angle) * effect.radius * 0.7;
                  return (
                    <Circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={3}
                      fill="#e056fd"
                      opacity={0.9}
                    />
                  );
                })}
              </Svg>
            </View>
          );
        }

        if (effect.type === 'miner_burrow') {
          // Miner going underground - dirt effect going down
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Dirt cloud expanding as he goes down */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.3 * progress} fill="#8B4513" opacity={0.8 - progress * 0.5} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.5 * progress} fill="#A0522D" opacity={0.6 - progress * 0.4} />
                {/* Dirt particles flying up */}
                {[0, 1, 2].map(i => {
                  const angle = (i / 3) * Math.PI * 2;
                  const x = effect.radius + Math.cos(angle) * effect.radius * 0.4 * progress;
                  const y = effect.radius - Math.sin(angle) * effect.radius * 0.3 * progress; // Upward movement
                  return (
                    <Circle key={i} cx={x} cy={y} r={3} fill="#8B4513" opacity={0.7} />
                  );
                })}
              </Svg>
            </View>
          );
        }

        if (effect.type === 'miner_popup') {
          // Miner popping up from ground - debris flying
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Expanding ring of dirt */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.8 * progress} fill="none" stroke="#8B4513" strokeWidth="3" opacity={1 - progress} />
                {/* Debris flying outward */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                  const angle = (i / 8) * Math.PI * 2;
                  const dist = effect.radius * 0.3 + effect.radius * 0.5 * progress;
                  const x = effect.radius + Math.cos(angle) * dist;
                  const y = effect.radius + Math.sin(angle) * dist;
                  const size = 2 + progress * 2;
                  return (
                    <Circle key={i} cx={x} cy={y} r={size} fill="#A0522D" opacity={1 - progress} />
                  );
                })}
                {/* Center glow where miner emerges */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.3} fill="#f39c12" opacity={0.5 * (1 - progress)} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'electro_giant_shock') {
          // Electro Giant shocking an attacker - electric burst
          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - effect.radius,
              top: effect.y - effect.radius,
              width: effect.radius * 2,
              height: effect.radius * 2,
              opacity: opacity,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Svg width={effect.radius * 2} height={effect.radius * 2} viewBox={`0 0 ${effect.radius * 2} ${effect.radius * 2}`}>
                {/* Electric burst */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.8 * progress} fill="none" stroke="#3498db" strokeWidth="3" opacity={0.9} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.5 * progress} fill="none" stroke="#f1c40f" strokeWidth="2" opacity={0.8} />
                {/* Lightning bolts radiating */}
                {[0, 1, 2, 3].map(i => {
                  const angle = (i / 4) * Math.PI * 2 + progress * Math.PI;
                  const x1 = effect.radius + Math.cos(angle) * effect.radius * 0.2;
                  const y1 = effect.radius + Math.sin(angle) * effect.radius * 0.2;
                  const x2 = effect.radius + Math.cos(angle) * effect.radius * 0.7;
                  const y2 = effect.radius + Math.sin(angle) * effect.radius * 0.7;
                  return (
                    <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#f1c40f" strokeWidth="2" opacity={0.9} />
                  );
                })}
                {/* Center glow */}
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.3} fill="#3498db" opacity={1 - progress * 0.5} />
                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.15} fill="#f1c40f" opacity={1} />
              </Svg>
            </View>
          );
        }

        if (effect.type === 'log_impact') {
          // The Log hitting - rectangular dirt trail
          const logWidth = 40;
          const trailLength = 150;

          return (
            <View key={effect.id} style={{
              position: 'absolute',
              left: effect.x - logWidth / 2,
              top: Math.min(effect.y, effect.y - trailLength),
              width: logWidth,
              height: trailLength,
              opacity: opacity,
            }}>
              <Svg width={logWidth} height={trailLength} viewBox={`0 0 ${logWidth} ${trailLength}`}>
                {/* Rectangular dirt trail */}
                <Rect
                  x="0"
                  y="0"
                  width={logWidth}
                  height={trailLength}
                  fill="#8B4513"
                  opacity={0.4 * (1 - progress)}
                />
                {/* Dirt particles along the trail - fixed positions */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                  const y = (i / 8) * trailLength + 10;
                  const offsets = [-8, -4, 4, 8, -6, 6, -3, 3];
                  const sizes = [4, 3, 5, 4, 3, 4, 5, 3];
                  return (
                    <Circle
                      key={i}
                      cx={logWidth / 2 + offsets[i]}
                      cy={y}
                      r={sizes[i] * (1 - progress * 0.5)}
                      fill="#A0522D"
                      opacity={1 - progress}
                    />
                  );
                })}
                {/* Motion lines showing direction */}
                <Line x1={logWidth * 0.3} y1="10" x2={logWidth * 0.3} y2={trailLength - 10} stroke="#5D3A1A" strokeWidth="2" opacity={0.3 * (1 - progress)} strokeDasharray="5,5" />
                <Line x1={logWidth * 0.7} y1="10" x2={logWidth * 0.7} y2={trailLength - 10} stroke="#5D3A1A" strokeWidth="2" opacity={0.3 * (1 - progress)} strokeDasharray="5,5" />
              </Svg>
            </View>
          );
        }

        return null;
      })}
    </>
  );
};

const Projectile = ({ type, position }) => {
  const angleDeg = (Math.atan2(position.targetY - position.y, position.targetX - position.x) * 180 / Math.PI);

  if (type === 'arrow' || type === 'spear') {
    return (
      <View style={[styles.arrowContainer, { left: position.x, top: position.y, transform: [{ rotate: `${angleDeg}deg` }] }]}>
        <View style={[styles.arrowShaft, type === 'spear' && { backgroundColor: '#2ecc71', height: 3 }]} />
        <View style={[styles.arrowHead, type === 'spear' && { borderLeftColor: '#2ecc71' }]} />
      </View>
    );
  }
  if (type === 'bullet') {
    return (
      <View style={[styles.bullet, { left: position.x, top: position.y }]} />
    );
  }
  if (type === 'witch_projectile') {
    // Small purple projectile for Witch
    return (
      <View style={[styles.witchProjectile, { left: position.x - 4, top: position.y - 4 }]} />
    );
  }
  if (type === 'dragon_fire') {
    // Green fire projectile for Baby Dragon
    return (
      <View style={[styles.dragonFire, { left: position.x - 6, top: position.y - 6 }]} />
    );
  }
  if (type === 'fireball_small') {
    return (
      <View style={[styles.fireballSmall, { left: position.x, top: position.y }]} />
    );
  }
  if (type === 'magic_arrow') {
    // Thin green glowing arrow
    return (
      <View style={{
        position: 'absolute',
        width: 30,
        height: 4,
        backgroundColor: '#2ecc71',
        borderRadius: 2,
        left: position.x - 15,
        top: position.y - 2,
        transform: [{ rotate: `${angleDeg}deg` }],
        shadowColor: '#2ecc71',
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5
      }}>
        <View style={{
          position: 'absolute',
          right: -5,
          top: -2,
          width: 8,
          height: 8,
          backgroundColor: '#fff',
          borderRadius: 4,
          opacity: 0.8
        }} />
      </View>
    );
  }
  if (type === 'ice_shard') {
    return (
      <View style={{
        position: 'absolute',
        width: 10,
        height: 10,
        backgroundColor: '#3498db',
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
        left: position.x - 5,
        top: position.y - 5
      }} />
    );
  }
  if (type === 'firecracker') {
    // Small firecracker rocket - orange with trail
    return (
      <View style={{
        position: 'absolute',
        left: position.x - 6,
        top: position.y - 6,
        width: 12,
        height: 12,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Svg width="12" height="12" viewBox="0 0 12 12">
          <Circle cx="6" cy="6" r="4" fill="#e67e22" opacity={0.9} />
          <Circle cx="6" cy="6" r="2" fill="#f39c12" opacity={1} />
        </Svg>
      </View>
    );
  }
  if (type === 'the_log') {
    // The Log - wooden trunk rolling forward
    const rotation = (Date.now() / 10) % 360; // Rolling animation

    return (
      <View style={{
        position: 'absolute',
        left: position.x - 20,
        top: position.y - 15,
        width: 40,
        height: 30,
        transform: [{ rotate: `${rotation}deg` }]
      }}>
        <Svg width="40" height="30" viewBox="0 0 40 30">
          {/* Main wooden log trunk */}
          <Rect
            x="0"
            y="5"
            width="40"
            height="20"
            rx="10"
            fill="#8B4513"
            stroke="#5D3A1A"
            strokeWidth="2"
          />
          {/* Wood grain texture - darker lines */}
          <Line x1="8" y1="8" x2="8" y2="22" stroke="#654321" strokeWidth="1.5" opacity="0.6" />
          <Line x1="16" y1="6" x2="16" y2="24" stroke="#654321" strokeWidth="1.5" opacity="0.6" />
          <Line x1="24" y1="8" x2="24" y2="22" stroke="#654321" strokeWidth="1.5" opacity="0.6" />
          <Line x1="32" y1="6" x2="32" y2="24" stroke="#654321" strokeWidth="1.5" opacity="0.6" />
          {/* Log end rings - tree rings */}
          <Circle cx="5" cy="15" r="8" fill="#A0522D" opacity="0.9" stroke="#654321" strokeWidth="1" />
          <Circle cx="5" cy="15" r="5" fill="none" stroke="#8B4513" strokeWidth="1" opacity="0.7" />
          <Circle cx="5" cy="15" r="2" fill="#D2691E" opacity="0.8" />
          {/* Bark texture - small darker spots */}
          <Circle cx="12" cy="12" r="1.5" fill="#5D3A1A" opacity="0.5" />
          <Circle cx="20" cy="18" r="1.5" fill="#5D3A1A" opacity="0.5" />
          <Circle cx="28" cy="10" r="1.5" fill="#5D3A1A" opacity="0.5" />
          <Circle cx="35" cy="16" r="1.5" fill="#5D3A1A" opacity="0.5" />
        </Svg>
      </View>
    );
  }
  if (type === 'barb_barrel') {
    // Barb Barrel - smaller wooden barrel rolling forward
    const rotation = (Date.now() / 8) % 360; // Rolling animation (faster than log)

    return (
      <View style={{
        position: 'absolute',
        left: position.x - 15,
        top: position.y - 12,
        width: 30,
        height: 24,
        transform: [{ rotate: `${rotation}deg` }]
      }}>
        <Svg width="30" height="24" viewBox="0 0 30 24">
          {/* Main barrel body */}
          <Rect
            x="2"
            y="3"
            width="26"
            height="18"
            rx="9"
            fill="#8B4513"
            stroke="#5D3A1A"
            strokeWidth="2"
          />
          {/* Metal bands on barrel */}
          <Rect x="6" y="3" width="3" height="18" fill="#7f8c8d" opacity="0.8" />
          <Rect x="21" y="3" width="3" height="18" fill="#7f8c8d" opacity="0.8" />
          {/* Wood plank lines */}
          <Line x1="12" y1="4" x2="12" y2="20" stroke="#654321" strokeWidth="1" opacity="0.6" />
          <Line x1="18" y1="4" x2="18" y2="20" stroke="#654321" strokeWidth="1" opacity="0.6" />
          {/* Barrel end caps */}
          <Circle cx="4" cy="12" r="7" fill="#A0522D" opacity="0.9" stroke="#654321" strokeWidth="1" />
          <Circle cx="4" cy="12" r="4" fill="none" stroke="#8B4513" strokeWidth="1" opacity="0.7" />
          <Circle cx="4" cy="12" r="2" fill="#CD853F" opacity="0.8" />
          {/* Barbarian icon hint - yellow helmet */}
          <Circle cx="15" cy="12" r="4" fill="#f1c40f" opacity="0.7" />
        </Svg>
      </View>
    );
  }
  if (type === 'royal_delivery_box') {
    // Royal Delivery - falling wooden crate
    // Calculate fall progress for visual scale/shadow
    // (Actual position is updated by game loop, this is just drawing the sprite)
    return (
      <View style={{
        position: 'absolute',
        left: position.x - 20,
        top: position.y - 20,
        width: 40,
        height: 40,
        zIndex: 100 // On top of everything
      }}>
        <Svg width="40" height="40" viewBox="0 0 40 40">
          {/* Shadow growing as it falls */}
          <Ellipse cx="20" cy="40" rx="15" ry="5" fill="black" opacity="0.3" />

          {/* Crate Body */}
          <Rect x="5" y="5" width="30" height="30" fill="#8B4513" stroke="#5D3A1A" strokeWidth="2" />
          {/* Cross bracing */}
          <Line x1="5" y1="5" x2="35" y2="35" stroke="#5D3A1A" strokeWidth="2" />
          <Line x1="35" y1="5" x2="5" y2="35" stroke="#5D3A1A" strokeWidth="2" />
          {/* Metal Corners */}
          <Path d="M5 5 L15 5 L5 15 Z" fill="#95a5a6" />
          <Path d="M35 5 L25 5 L35 15 Z" fill="#95a5a6" />
          <Path d="M5 35 L15 35 L5 25 Z" fill="#95a5a6" />
          <Path d="M35 35 L25 35 L35 25 Z" fill="#95a5a6" />
          {/* Royal Emblem/Crown in center */}
          <Circle cx="20" cy="20" r="6" fill="#f1c40f" stroke="#e67e22" strokeWidth="1" />
          <Path d="M17 20 L23 20 L20 16 Z" fill="#e67e22" />
        </Svg>
      </View>
    );
  }
  if (type === 'fireball_spell') {
    return (
      <View style={[styles.fireballSpell, { left: position.x, top: position.y }]} />
    );
  }
  if (type === 'rocket_spell') {
    // Rocket projectile - larger cylinder shape with flame trail
    return (
      <View style={{ position: 'absolute', left: position.x - 8, top: position.y - 15 }}>
        {/* Rocket body */}
        <View style={{
          width: 16,
          height: 30,
          backgroundColor: '#7f8c8d',
          borderRadius: 3,
          borderWidth: 2,
          borderColor: '#2c3e50',
          position: 'relative'
        }}>
          {/* Red nose cone */}
          <View style={{
            position: 'absolute',
            top: -8,
            left: 3,
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderBottomWidth: 10,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#e74c3c'
          }} />
          {/* Fins */}
          <View style={{
            position: 'absolute',
            bottom: -5,
            left: -4,
            width: 6,
            height: 12,
            backgroundColor: '#c0392b',
            transform: [{ rotate: '-20deg' }]
          }} />
          <View style={{
            position: 'absolute',
            bottom: -5,
            right: -4,
            width: 6,
            height: 12,
            backgroundColor: '#c0392b',
            transform: [{ rotate: '20deg' }]
          }} />
          {/* Flame trail */}
          <View style={{
            position: 'absolute',
            bottom: -15,
            left: 4,
            width: 8,
            height: 15,
            backgroundColor: '#f39c12',
            borderRadius: 4,
            opacity: 0.8
          }} />
        </View>
      </View>
    );
  }
  if (type === 'zap_spell') {
    // Lightning bolt effect for Zap
    return (
      <View style={[styles.zapSpell, { left: position.x - 25, top: position.y - 25 }]}>
        <View style={styles.lightningBolt} />
      </View>
    );
  }
  if (type === 'arrows_spell') {
    // Multiple arrows falling for Arrows
    return (
      <View style={[styles.arrowsSpell, { left: position.x - 20, top: position.y - 20 }]}>
        <View style={styles.arrowVolley} />
      </View>
    );
  }
  if (type === 'poison_spell' || type === 'rage_spell') {
    // Orange Graveyard-style spell for Poison, Purple for Rage
    const isRage = type === 'rage_spell';
    const mainColor = isRage ? "rgba(155, 89, 182, 0.4)" : "rgba(255, 140, 0, 0.4)";
    const strokeColor = isRage ? "#8e44ad" : "#FF8C00";

    // Use dynamic radius from spell data (default to 50 if undefined)
    const spellRadius = position.radius || 50;
    const diameter = spellRadius * 2;

    return (
      <View style={{ position: 'absolute', left: position.x - spellRadius, top: position.y - spellRadius, width: diameter, height: diameter }}>
        <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
          <Circle cx={spellRadius} cy={spellRadius} r={spellRadius - 2} fill={mainColor} stroke={strokeColor} strokeWidth="2" />

          {isRage ? (
            // Rage Spell Visuals - Anger symbol / Energy
            <>
              <Circle cx={spellRadius} cy={spellRadius} r={spellRadius * 0.7} fill="none" stroke="#9b59b6" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
            </>
          ) : (
            // Poison Spell Visuals - Skulls/Bubbles (scaled positions)
            <>
              <Circle cx={spellRadius * 0.7} cy={spellRadius * 0.8} r={spellRadius * 0.12} fill="white" opacity="0.8" />
              <Circle cx={spellRadius * 0.66} cy={spellRadius * 0.8} r={spellRadius * 0.03} fill="black" />
              <Circle cx={spellRadius * 0.74} cy={spellRadius * 0.8} r={spellRadius * 0.03} fill="black" />

              <Circle cx={spellRadius * 1.3} cy={spellRadius * 1.2} r={spellRadius * 0.12} fill="white" opacity="0.8" />
              <Circle cx={spellRadius * 1.26} cy={spellRadius * 1.2} r={spellRadius * 0.03} fill="black" />
              <Circle cx={spellRadius * 1.34} cy={spellRadius * 1.2} r={spellRadius * 0.03} fill="black" />

              <Circle cx={spellRadius} cy={spellRadius * 0.6} r={spellRadius * 0.1} fill="white" opacity="0.8" />
              <Circle cx={spellRadius * 0.96} cy={spellRadius * 0.6} r={spellRadius * 0.03} fill="black" />
              <Circle cx={spellRadius * 1.04} cy={spellRadius * 0.6} r={spellRadius * 0.03} fill="black" />
            </>
          )}
        </Svg>
        {isRage && (
          <Text style={{
            position: 'absolute',
            left: spellRadius * 0.5,
            top: spellRadius * 0.4,
            fontSize: spellRadius * 0.6,
            color: '#8e44ad',
            opacity: 0.8,
            textAlign: 'center'
          }}>😡</Text>
        )}
      </View>
    );
  }
  if (type === 'dark_ball') {
    return (
      <View style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2c3e50',
        left: position.x - 6,
        top: position.y - 6,
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3
      }} />
    );
  }
  if (type === 'dark_ball_big') {
    return (
      <View style={{
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#2c3e50',
        left: position.x - 8,
        top: position.y - 8,
        shadowColor: 'black',
        shadowOpacity: 0.7,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#8e44ad'
      }} />
    );
  }
  if (type === 'dart') {
    const angleDeg = (Math.atan2(position.targetY - position.y, position.targetX - position.x) * 180 / Math.PI);
    return (
      <View style={{
        position: 'absolute',
        width: 15,
        height: 4,
        backgroundColor: '#A0522D', // Wood
        left: position.x,
        top: position.y,
        transform: [{ rotate: `${angleDeg}deg` }]
      }}>
        <View style={{
          position: 'absolute',
          right: 0,
          width: 4,
          height: 4,
          backgroundColor: '#2ecc71', // Poison tip
          borderRadius: 2
        }} />
      </View>
    );
  }
  if (type === 'fire_arrows') {
    const angleDeg = (Math.atan2(position.targetY - position.y, position.targetX - position.x) * 180 / Math.PI);
    return (
      <View style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: [{ rotate: `${angleDeg}deg` }],
        width: 40,
        height: 20
      }}>
        <Svg width="40" height="20" viewBox="0 0 40 20">
          {/* Arrow 1 (Center) */}
          <Path d="M5 10 L35 10" stroke="#8B4513" strokeWidth="2" />
          <Path d="M35 10 L30 7 L30 13 Z" fill="#e74c3c" />
          <Circle cx="32" cy="10" r="3" fill="#f1c40f" opacity="0.8" />

          {/* Arrow 2 (Top) */}
          <Path d="M0 5 L30 5" stroke="#8B4513" strokeWidth="2" />
          <Path d="M30 5 L25 2 L25 8 Z" fill="#e74c3c" />
          <Circle cx="27" cy="5" r="3" fill="#f1c40f" opacity="0.8" />

          {/* Arrow 3 (Bottom) */}
          <Path d="M0 15 L30 15" stroke="#8B4513" strokeWidth="2" />
          <Path d="M30 15 L25 12 L25 18 Z" fill="#e74c3c" />
          <Circle cx="27" cy="15" r="3" fill="#f1c40f" opacity="0.8" />
        </Svg>
      </View>
    );
  }
  if (type === 'lava_shot') {
    // Small fiery projectile for Lava Pups
    return (
      <View style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#e74c3c',
        left: position.x - 5,
        top: position.y - 5,
        shadowColor: '#f39c12',
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f39c12'
      }} />
    );
  }
  if (type === 'tesla_lightning') {
    // Lightning bolt from Tesla to target
    return (
      <View style={{
        position: 'absolute',
        left: Math.min(position.x, position.targetX) - 5,
        top: Math.min(position.y, position.targetY) - 5,
        width: Math.abs(position.targetX - position.x) + 10,
        height: Math.abs(position.targetY - position.y) + 10,
      }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${Math.abs(position.targetX - position.x) + 10} ${Math.abs(position.targetY - position.y) + 10}`}>
          <Path
            d={`M${position.x > position.targetX ? 0 : Math.abs(position.targetX - position.x) + 10} 0 L${position.x > position.targetX ? Math.abs(position.targetX - position.x) + 10 : 0} ${Math.abs(position.targetY - position.y)}`}
            stroke="#00BFFF"
            strokeWidth="3"
            fill="none"
            opacity="0.8"
          />
          <Circle cx={position.x > position.targetX ? 0 : Math.abs(position.targetX - position.x) + 10} cy="0" r="5" fill="#00BFFF" opacity="0.6" />
        </Svg>
      </View>
    );
  }
  if (type === 'electric_bolt') {
    // Electric Wizard's lightning beam - multiple branching bolts
    const boltWidth = Math.abs(position.targetX - position.x) + 10;
    const boltHeight = Math.abs(position.targetY - position.y) + 10;
    const startX = position.x > position.targetX ? 0 : boltWidth;
    const startY = 0;
    const endX = position.x > position.targetX ? boltWidth : 0;
    const endY = boltHeight;

    // Generate jagged lightning path
    const segments = 5;
    let pathD = `M${startX} ${startY}`;
    for (let i = 1; i < segments; i++) {
      const x = startX + (endX - startX) * (i / segments) + (Math.random() - 0.5) * 10;
      const y = startY + (endY - startY) * (i / segments);
      pathD += ` L${x} ${y}`;
    }
    pathD += ` L${endX} ${endY}`;

    return (
      <View style={{
        position: 'absolute',
        left: Math.min(position.x, position.targetX) - 5,
        top: Math.min(position.y, position.targetY) - 5,
        width: boltWidth,
        height: boltHeight,
      }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${boltWidth} ${boltHeight}`}>
          {/* Main bolt - bright yellow/white */}
          <Path
            d={pathD}
            stroke="#FFFFFF"
            strokeWidth="4"
            fill="none"
            opacity="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Outer glow - blue */}
          <Path
            d={pathD}
            stroke="#00BFFF"
            strokeWidth="8"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />
          {/* Electric sparks branching off */}
          <Path
            d={`M${boltWidth / 2} ${boltHeight / 2} L${boltWidth / 2 + 15} ${boltHeight / 2 - 10}`}
            stroke="#FFFF00"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
          <Path
            d={`M${boltWidth / 2 + 15} ${boltHeight / 2 - 10} L${boltWidth / 2 + 20} ${boltHeight / 2 - 15}`}
            stroke="#FFFF00"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          <Path
            d={`M${boltWidth / 2 + 15} ${boltHeight / 2 - 10} L${boltWidth / 2 + 18} ${boltHeight / 2 - 5}`}
            stroke="#FFFF00"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          {/* Hit effect at target */}
          <Circle cx={endX} cy={endY} r="12" fill="#FFFF00" opacity="0.6" />
          <Circle cx={endX} cy={endY} r="8" fill="#FFFFFF" opacity="0.8" />
        </Svg>
      </View>
    );
  }
  if (type === 'bomb') {
    // Black round bomb for Bomber
    return (
      <View style={{
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#2c3e50',
        borderWidth: 2,
        borderColor: '#1a1a1a',
        left: position.x - 7,
        top: position.y - 7,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 3
      }}>
        {/* Fuse/spark */}
        <View style={{
          position: 'absolute',
          top: -2,
          left: 5,
          width: 4,
          height: 4,
          backgroundColor: '#e74c3c',
          borderRadius: 2
        }} />
      </View>
    );
  }
  if (type === 'goblin_barrel_spell') {
    // Wooden barrel falling from sky
    return (
      <View style={{
        position: 'absolute',
        left: position.x - 15,
        top: position.y - 15,
        width: 30,
        height: 30
      }}>
        <Svg width="30" height="30" viewBox="0 0 30 30">
          {/* Wooden barrel body */}
          <Circle cx="15" cy="15" r="12" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          {/* Barrel metal bands */}
          <Rect x="3" y="10" width="24" height="4" fill="#2c3e50" />
          <Rect x="3" y="16" width="24" height="4" fill="#2c3e50" />
          {/* Wood grain */}
          <Path d="M8 5 L8 25 M15 3 L15 27 M22 5 L22 25" stroke="#654321" strokeWidth="1" opacity="0.5" />
          {/* Goblin face peeking out */}
          <Circle cx="12" cy="12" r="2" fill="#2ecc71" />
          <Circle cx="18" cy="12" r="2" fill="#2ecc71" />
        </Svg>
      </View>
    );
  }
  if (type === 'earthquake_spell') {
    // Cracking ground effect for Earthquake
    return (
      <View style={{
        position: 'absolute',
        left: position.x - 40,
        top: position.y - 40,
        width: 80,
        height: 80
      }}>
        <Svg width="80" height="80" viewBox="0 0 80 80">
          {/* Cracked ground */}
          <Rect x="5" y="5" width="70" height="70" fill="#7f8c8d" stroke="#5d6d7e" strokeWidth="2" rx="5" opacity="0.8" />
          {/* Cracks radiating from center */}
          <Path d="M40 5 L35 30 L40 40" stroke="#2c3e50" strokeWidth="2" fill="none" />
          <Path d="M40 5 L45 30 L40 40" stroke="#2c3e50" strokeWidth="2" fill="none" />
          <Path d="M5 40 L30 35 L40 40" stroke="#2c3e50" strokeWidth="2" fill="none" />
          <Path d="M75 40 L50 45 L40 40" stroke="#2c3e50" strokeWidth="2" fill="none" />
          <Path d="M40 75 L35 50 L40 40" stroke="#2c3e50" strokeWidth="2" fill="none" />
          <Path d="M40 75 L45 50 L40 40" stroke="#2c3e50" strokeWidth="2" fill="none" />
          {/* Dust/debris particles */}
          <Circle cx="20" cy="20" r="3" fill="#95a5a6" opacity="0.7" />
          <Circle cx="60" cy="25" r="2" fill="#95a5a6" opacity="0.7" />
          <Circle cx="25" cy="60" r="2.5" fill="#95a5a6" opacity="0.7" />
          <Circle cx="55" cy="55" r="2" fill="#95a5a6" opacity="0.7" />
        </Svg>
      </View>
    );
  }
  if (type === 'lightning_bolt') {
    // Lightning spell effect - bolt striking from sky
    return (
      <View style={{
        position: 'absolute',
        left: position.x - 30,
        top: position.y - 30,
        width: 60,
        height: 60
      }}>
        <Svg width="60" height="60" viewBox="0 0 60 60">
          {/* Main lightning bolt from top */}
          <Path
            d="M30 0 L25 25 L35 25 L20 40 L30 40 L30 60"
            stroke="#f1c40f"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Glow */}
          <Path
            d="M30 0 L25 25 L35 25 L20 40 L30 40 L30 60"
            stroke="#fff"
            strokeWidth="6"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Impact flash */}
          <Circle cx="30" cy="60" r="8" fill="#f1c40f" opacity="0.8" />
          <Circle cx="30" cy="60" r="4" fill="#fff" opacity="0.9" />
        </Svg>
      </View>
    );
  }
  if (type === 'boulder') {
    // Bowler's boulder - large rock
    const rotation = (Date.now() / 20) % 360;
    return (
      <View style={{
        position: 'absolute',
        left: position.x - 12,
        top: position.y - 12,
        width: 24,
        height: 24,
        transform: [{ rotate: `${rotation}deg` }]
      }}>
        <Svg width="24" height="24" viewBox="0 0 24 24">
          {/* Main rock body */}
          <Circle cx="12" cy="12" r="10" fill="#7f8c8d" stroke="#5d6d7e" strokeWidth="2" />
          {/* Rock texture - darker patches */}
          <Circle cx="8" cy="8" r="3" fill="#5d6d7e" opacity="0.7" />
          <Circle cx="16" cy="14" r="2.5" fill="#5d6d7e" opacity="0.7" />
          <Circle cx="10" cy="16" r="2" fill="#5d6d7e" opacity="0.7" />
          {/* Highlight */}
          <Circle cx="14" cy="8" r="2" fill="#bdc3c7" opacity="0.5" />
        </Svg>
      </View>
    );
  }
  if (type === 'axe_boomerang') {
    // Executioner's axe - double-bladed throwing axe that spins
    const rotation = (Date.now() / 5) % 360;
    return (
      <View style={{
        position: 'absolute',
        left: position.x - 15,
        top: position.y - 15,
        width: 30,
        height: 30,
        transform: [{ rotate: `${rotation}deg` }]
      }}>
        <Svg width="30" height="30" viewBox="0 0 30 30">
          {/* Handle/grip */}
          <Rect x="13" y="12" width="4" height="6" fill="#8B4513" />
          {/* Center hub */}
          <Circle cx="15" cy="15" r="3" fill="#5D4037" stroke="#3E2723" strokeWidth="1" />
          {/* Left blade */}
          <Path d="M12 15 Q5 12 3 15 Q5 18 12 15" fill="#9E9E9E" stroke="#616161" strokeWidth="1" />
          <Path d="M8 13 L6 14 L7 16 Z" fill="#BDBDBD" />
          {/* Right blade */}
          <Path d="M18 15 Q25 12 27 15 Q25 18 18 15" fill="#9E9E9E" stroke="#616161" strokeWidth="1" />
          <Path d="M22 13 L24 14 L23 16 Z" fill="#BDBDBD" />
          {/* Sharp edges highlight */}
          <Path d="M3 15 L5 14 M27 15 L25 14" stroke="#E0E0E0" strokeWidth="1" />
        </Svg>
      </View>
    );
  }
  return <View style={[styles.cannonball, { left: position.x, top: position.y }]} />;
};

const Unit = ({ unit }) => {
  const spriteId = unit.spriteId || 'knight';
  const isEnemy = unit.isOpponent;
  const isSlowed = unit.slowUntil > Date.now();
  const isRaged = unit.rageUntil > Date.now();
  const isFrozen = unit.freezeUntil > Date.now();
  const isCursed = unit.cursedUntil > Date.now();

  // Use dynamic size for zones (radius * 2) or default to 30 for troops
  const unitSize = unit.radius ? (unit.radius * 2) : 30;

  // Check if unit is in spawn delay (Golem, Golemite)
  const isSpawning = Boolean((unit.spawnDelay > 0) && unit.spawnTime && (Date.now() - unit.spawnTime < unit.spawnDelay));
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSpawning) {
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 360,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotationAnim.setValue(0);
    }
  }, [isSpawning]);

  // Jumping Animation for Spirits
  useEffect(() => {
    if (unit.kamikaze && !unit.isJumpingAttack) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8, // Jump up
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0, // Land
            duration: 300,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      // Stop bouncing if attacking (handled by arc calculation below) or not a spirit
      bounceAnim.setValue(0);
      bounceAnim.stopAnimation();
    }
  }, [unit.kamikaze, unit.isJumpingAttack]);

  let verticalOffset = bounceAnim;

  // Calculate Attack Jump Arc (Parabola)
  if (unit.isJumpingAttack) {
    const jumpDuration = 300;
    const progress = Math.min(1, (Date.now() - unit.jumpStartTime) / jumpDuration);
    // Parabolic arc: 4 * height * x * (1 - x)
    const jumpHeight = 50;
    const currentHeight = -4 * jumpHeight * progress * (1 - progress);

    // We can't easily mix Animated.Value and raw numbers in style transform without `Animated.add` or similar.
    // But since this is a re-render loop, we can just use the value if we wrap it in an Animated.View that accepts non-animated values?
    // No, Animated.View expects Animated.Value or plain numbers.
    // Let's just use a plain number for the attack jump.
    verticalOffset = currentHeight;
  }

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const isStealthed = unit.hidden && unit.hidden.active;

  return (
    <View style={[
      styles.unit,
      { left: unit.x - unitSize / 2, top: unit.y - unitSize / 2, width: unitSize, height: unitSize },
      isStealthed && { opacity: 0.4 }
    ]}>
      {/* Range Indicator Circle - Only for Buildings and Units with Spawn Damage (e.g. Mega Knight) */}
      {Boolean(unit.range && unit.range > 0 && (unit.type === 'building' || unit.spawnDamage)) && (
        <View style={{
          position: 'absolute',
          left: unitSize / 2 - unit.range,
          top: unitSize / 2 - unit.range,
          width: unit.range * 2,
          height: unit.range * 2,
          borderRadius: unit.range,
          borderWidth: 1,
          borderColor: isEnemy ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)',
          backgroundColor: isEnemy ? 'rgba(231, 76, 60, 0.05)' : 'rgba(52, 152, 219, 0.05)',
          zIndex: -1
        }} />
      )}

      <Animated.View style={{ transform: [{ translateY: verticalOffset }] }}>
        <View style={unit.isClone ? {
          position: 'relative',
          width: unitSize,
          height: unitSize
        } : undefined}>
          {/* Clone blue tint overlay */}
          {unit.isClone && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: unitSize,
              height: unitSize,
              backgroundColor: 'rgba(52, 152, 219, 0.4)',
              borderRadius: unitSize / 2,
              zIndex: 1,
              opacity: 0.6
            }} />
          )}
          <View style={{ opacity: unit.isClone ? 0.7 : 1 }}>
            <UnitSprite id={spriteId} isOpponent={isEnemy} size={unitSize} unit={unit} />
          </View>
        </View>
      </Animated.View>

      {/* Spawn Delay Indicator (rotating swirl) */}
      {isSpawning && (
        <Animated.View style={{
          position: 'absolute',
          top: -8, left: -8, right: -8, bottom: -8,
          transform: [{ rotate: rotation }],
          zIndex: 5
        }}>
          <Svg width={unitSize + 16} height={unitSize + 16} viewBox="0 0 50 50">
            {/* Rotating swirl */}
            <Circle cx="25" cy="25" r="22" fill="none" stroke="#95a5a6" strokeWidth="2" strokeDasharray="8 4" opacity="0.6" />
            <Circle cx="25" cy="25" r="18" fill="none" stroke="#7f8c8d" strokeWidth="2" strokeDasharray="6 3" opacity="0.8" />
            {/* Inner circle */}
            <Circle cx="25" cy="25" r="12" fill="rgba(149, 165, 166, 0.3)" stroke="#bdc3c7" strokeWidth="1" />
          </Svg>
        </Animated.View>
      )}

      {/* Rage Effect Overlay */}
      {isRaged && (
        <View style={{
          position: 'absolute',
          top: -2, left: -2, right: -2, bottom: -2,
          backgroundColor: 'rgba(155, 89, 182, 0.3)',
          borderRadius: unitSize / 2,
          borderWidth: 2,
          borderColor: '#8e44ad',
          zIndex: 4
        }}>
          <Text style={{ position: 'absolute', top: -10, left: -10, fontSize: 10 }}>😡</Text>
        </View>
      )}

      {/* Ice/Slow Effect Overlay */}
      {isSlowed && (
        <View style={{
          position: 'absolute',
          top: -2, left: -2, right: -2, bottom: -2,
          backgroundColor: 'rgba(135, 206, 250, 0.4)',
          borderRadius: unitSize / 2,
          borderWidth: 1,
          borderColor: '#00BFFF',
          zIndex: 5
        }}>
          <Text style={{ position: 'absolute', top: -10, right: -10, fontSize: 10 }}>❄️</Text>
        </View>
      )}

      {/* FROZEN Effect Overlay - Thick Ice Border with Crystals */}
      {isFrozen && (
        <View style={{
          position: 'absolute',
          top: -4, left: -4, right: -4, bottom: -4,
          backgroundColor: 'rgba(135, 206, 235, 0.5)',
          borderRadius: unitSize / 2,
          borderWidth: 4,
          borderColor: '#87CEEB',
          zIndex: 7
        }}>
          {/* Multiple ice crystals around the unit */}
          <Text style={{ position: 'absolute', top: -15, left: '50%', marginLeft: -8, fontSize: 14 }}>❄️</Text>
          <Text style={{ position: 'absolute', bottom: -15, left: '50%', marginLeft: -8, fontSize: 12 }}>❄️</Text>
          <Text style={{ position: 'absolute', left: -15, top: '50%', marginTop: -8, fontSize: 12 }}>❄️</Text>
          <Text style={{ position: 'absolute', right: -15, top: '50%', marginTop: -8, fontSize: 12 }}>❄️</Text>
          {/* Inner ice pattern */}
          <Svg width={unitSize + 8} height={unitSize + 8} viewBox="0 0 40 40" style={{ position: 'absolute' }}>
            {/* Cross ice pattern */}
            <Path d="M20 5 L20 35" stroke="white" strokeWidth="2" opacity="0.6" />
            <Path d="M5 20 L35 20" stroke="white" strokeWidth="2" opacity="0.6" />
            <Path d="M10 10 L30 30" stroke="white" strokeWidth="1.5" opacity="0.4" />
            <Path d="M30 10 L10 30" stroke="white" strokeWidth="1.5" opacity="0.4" />
          </Svg>
        </View>
      )}

      {/* Stun Effect Overlay - Electric Zap */}
      {unit.stunUntil > Date.now() && (
        <View style={{
          position: 'absolute',
          top: -4, left: -4, right: -4, bottom: -4,
          backgroundColor: 'rgba(255, 255, 0, 0.3)',
          borderRadius: unitSize / 2,
          borderWidth: 2,
          borderColor: '#FFFF00',
          zIndex: 6
        }}>
          {/* Lightning icon */}
          <Text style={{ position: 'absolute', top: -12, right: -12, fontSize: 12 }}>⚡</Text>
          {/* Electric crackles */}
          <Svg width={unitSize + 8} height={unitSize + 8} viewBox="0 0 40 40" style={{ position: 'absolute' }}>
            <Path d="M10 5 L15 20 L5 20 L20 35" stroke="#FFFF00" strokeWidth="2" fill="none" opacity="0.8" />
            <Path d="M30 10 L25 25 L35 25 L20 40" stroke="#FFFF00" strokeWidth="2" fill="none" opacity="0.8" />
          </Svg>
        </View>
      )}

      {/* Sparky Charge Indicator */}
      {unit.chargeState && (
        <View style={{
          position: 'absolute',
          top: -6, left: -6, right: -6, bottom: -6,
          zIndex: 7
        }}>
          <Svg width={unitSize + 12} height={unitSize + 12} viewBox="0 0 50 50">
            {/* Charge progress ring */}
            <Circle
              cx="25"
              cy="25"
              r="23"
              fill="none"
              stroke={unit.chargeState.isCharged ? "#00BFFF" : "#f1c40f"}
              strokeWidth="3"
              strokeDasharray={unit.chargeState.isCharged ? "144" : `${Math.min(144, ((Date.now() - unit.chargeState.startTime) / unit.chargeState.duration) * 144)}`}
              opacity={unit.chargeState.isCharged ? 1 : 0.8}
            />
            {/* Electric sparks when charging */}
            {!unit.chargeState.isCharged && (
              <>
                <Circle cx="10" cy="15" r="2" fill="#f1c40f" opacity="0.9" />
                <Circle cx="40" cy="15" r="2" fill="#f1c40f" opacity="0.9" />
                <Circle cx="10" cy="35" r="2" fill="#f1c40f" opacity="0.9" />
                <Circle cx="40" cy="35" r="2" fill="#f1c40f" opacity="0.9" />
              </>
            )}
            {/* Charged indicator - bright glow */}
            {unit.chargeState.isCharged && (
              <Circle
                cx="25"
                cy="25"
                r="18"
                fill="#00BFFF"
                opacity="0.4"
              />
            )}
          </Svg>
          {/* Ready indicator when fully charged */}
          {unit.chargeState.isCharged && (
            <Text style={{
              position: 'absolute',
              top: -8,
              fontSize: 12
            }}>⚡</Text>
          )}
        </View>
      )}

      {isCursed && (
        <View style={{
          position: 'absolute',
          top: -15, right: -15,
          width: 20, height: 20,
          backgroundColor: 'rgba(155, 89, 182, 0.6)',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#8e44ad',
          zIndex: 8,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ fontSize: 10 }}>🔮</Text>
        </View>
      )}

      {/* Health Bars */}
      <View style={{ position: 'absolute', top: -12, width: unitSize, alignItems: 'center', zIndex: 10 }}>
        {/* Shield Bar (if active) */}
        {unit.currentShieldHp > 0 && (
          <View style={{ width: '100%', height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 1, overflow: 'hidden' }}>
            <View style={{ width: `${(unit.currentShieldHp / unit.shieldHp) * 100}%`, height: '100%', backgroundColor: '#8e44ad' }} />
          </View>
        )}
        {/* Main HP Bar */}
        <View style={{ width: '100%', height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ width: `${(unit.hp / unit.maxHp) * 100}%`, height: '100%', backgroundColor: '#ff4444' }} />
        </View>
      </View>
    </View>
  );
};

// --- Lobby Components ---

const LobbyHeader = () => (
  <View style={styles.lobbyHeader}>
    <View style={styles.lobbyHeaderLeft}>
      <View style={styles.xpLevelContainer}>
        <Text style={styles.xpLevelText}>13</Text>
      </View>
      <View style={styles.playerIdentity}>
        <Text style={styles.lobbyPlayerName}>You</Text>
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBarFill} />
        </View>
      </View>
    </View>
    <View style={styles.lobbyHeaderRight}>
      <View style={styles.currencyContainer}>
        <Text style={styles.currencyIcon}>💰</Text>
        <Text style={styles.currencyText}>5420</Text>
      </View>
      <View style={styles.currencyContainer}>
        <Text style={styles.currencyIcon}>💎</Text>
        <Text style={styles.currencyText}>150</Text>
      </View>
    </View>
  </View>
);

const ChestSlots = ({ chests, onUnlock, onOpen }) => {
  const getChestColor = (type) => {
    switch (type) {
      case 'SILVER': return '#bdc3c7';
      case 'GOLD': return '#f1c40f';
      case 'GIANT': return '#e67e22';
      case 'MAGICAL': return '#9b59b6';
      case 'SUPER MAGICAL': return '#3498db';
      default: return '#bdc3c7';
    }
  };

  const formatChestTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <View style={styles.chestSlotsContainer}>
      <Text style={styles.chestSlotsTitle}>CHESTS</Text>
      <View style={styles.chestRow}>
        {[0, 1, 2, 3].map(index => {
          const chest = chests.find(c => c.slotIndex === index);
          if (!chest) {
            return (
              <View key={index} style={styles.chestSlotEmpty}>
                <Text style={styles.chestTextEmpty}>Empty Slot</Text>
              </View>
            );
          }

          const isUnlocking = chest.state === 'UNLOCKING';
          const isUnlocked = chest.state === 'UNLOCKED';

          return (
            <TouchableOpacity
              key={index}
              style={[styles.chestSlot, { borderColor: getChestColor(chest.type), borderWidth: 2 }]}
              onPress={() => isUnlocked ? onOpen(chest) : onUnlock(chest)}
              disabled={isUnlocking}
            >
              <Text style={[styles.chestText, { color: getChestColor(chest.type) }]}>{chest.type}</Text>
              {isUnlocked ? (
                <Text style={styles.chestOpenText}>OPEN!</Text>
              ) : isUnlocking ? (
                <Text style={styles.chestTimer}>{formatChestTime(chest.timeLeft)}</Text>
              ) : (
                <Text style={styles.chestLockedText}>{formatChestTime(chest.unlockTime)}</Text>
              )}
              {isUnlocking && <Text style={{ fontSize: 10, color: '#f1c40f' }}>Unlocking...</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MiniCard = ({ card }) => (
  <View style={[styles.miniCard, { borderColor: RARITY_COLORS[card.rarity] || '#000' }]}>
    <UnitSprite id={card.id} isOpponent={false} size={35} />
    <Text style={styles.miniCardName}>{card.name}</Text>
    <View style={styles.miniCardCost}>
      <Text style={styles.miniCardCostText}>{card.cost}</Text>
    </View>
  </View>
);

const ShopTab = () => {
  const dailyDeals = [
    { id: 'knight', name: 'Knight', count: 50, cost: 500, currency: 'GOLD', rarity: 'common' },
    { id: 'musketeer', name: 'Musketeer', count: 20, cost: 1000, currency: 'GOLD', rarity: 'rare' },
    { id: 'baby_dragon', name: 'Baby Dragon', count: 2, cost: 2000, currency: 'GOLD', rarity: 'epic' },
    { id: 'archers', name: 'Archers', count: 50, cost: 0, currency: 'FREE', rarity: 'common' },
    { id: 'hog_rider', name: 'Hog Rider', count: 20, cost: 1000, currency: 'GOLD', rarity: 'rare' },
    { id: 'witch', name: 'Witch', count: 2, cost: 100, currency: 'GEM', rarity: 'epic' },
  ];

  return (
    <ScrollView style={styles.shopContainer} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Special Offer Banner */}
      <View style={styles.specialOfferBanner}>
        <LinearGradient colors={['#f39c12', '#e67e22']} style={styles.specialOfferGradient}>
          <View style={styles.offerContent}>
            <Text style={styles.offerTag}>BEST VALUE!</Text>
            <Text style={styles.offerTitle}>SUPER MAGICAL BUNDLE</Text>
            <View style={styles.offerImageRow}>
              <Text style={{ fontSize: 40 }}>🎁</Text>
              <Text style={{ fontSize: 40 }}>💰</Text>
              <Text style={{ fontSize: 40 }}>💎</Text>
            </View>
            <TouchableOpacity style={styles.offerButton}>
              <Text style={styles.offerButtonText}>$9.99</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.shopSectionHeader}>
        <Text style={styles.shopSectionTitle}>DAILY DEALS</Text>
        <Text style={styles.shopSectionTimer}>4h 20m</Text>
      </View>

      <View style={styles.dealsGrid}>
        {dailyDeals.map((deal, index) => (
          <View key={index} style={styles.dealCard}>
            <View style={[styles.dealRarityBar, { backgroundColor: RARITY_COLORS[deal.rarity] }]} />
            <Text style={styles.dealHeader}>{deal.currency === 'FREE' ? 'FREE' : 'x' + deal.count}</Text>
            <View style={styles.dealImageContainer}>
              <UnitSprite id={deal.id} size={45} />
            </View>
            <Text style={styles.dealName}>{deal.name}</Text>
            <TouchableOpacity style={[styles.buyButton, deal.currency === 'FREE' && styles.buyButtonFree]}>
              <Text style={styles.buyButtonText}>
                {deal.currency === 'FREE' ? 'CLAIM' : deal.cost} {deal.currency === 'GOLD' ? '💰' : deal.currency === 'GEM' ? '💎' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.shopSectionHeader}>
        <Text style={styles.shopSectionTitle}>CHESTS</Text>
      </View>
      <View style={styles.chestShopRow}>
        <TouchableOpacity style={styles.shopChestCard}>
          <Text style={{ fontSize: 40 }}>🥈</Text>
          <Text style={styles.shopChestName}>Silver Chest</Text>
          <View style={styles.shopChestPrice}><Text style={styles.shopChestPriceText}>50 💎</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shopChestCard}>
          <Text style={{ fontSize: 40 }}>🥇</Text>
          <Text style={styles.shopChestName}>Gold Chest</Text>
          <View style={styles.shopChestPrice}><Text style={styles.shopChestPriceText}>150 💎</Text></View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const EventsTab = () => (
  <ScrollView style={styles.eventsContainer} contentContainerStyle={{ paddingBottom: 100 }}>
    <View style={styles.eventCard}>
      <LinearGradient colors={['#8e44ad', '#2c3e50']} style={styles.eventGradient}>
        <View style={styles.eventBadge}><Text style={styles.eventBadgeText}>CHALLENGE</Text></View>
        <Text style={styles.eventTitle}>MEGA KNIGHT CHALLENGE</Text>
        <Text style={styles.eventSubtitle}>Win to unlock the Mega Knight!</Text>
        <View style={styles.eventRewards}>
          <View style={styles.rewardItem}><Text>💰</Text><Text style={styles.rewardValue}>1000</Text></View>
          <View style={styles.rewardItem}><Text>🃏</Text><Text style={styles.rewardValue}>x10</Text></View>
          <View style={styles.rewardItem}><Text>✨</Text><Text style={styles.rewardValue}>Free</Text></View>
        </View>
        <TouchableOpacity style={styles.eventButton}>
          <Text style={styles.eventButtonText}>JOIN NOW</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>

    <View style={styles.eventCard}>
      <LinearGradient colors={['#2980b9', '#34495e']} style={styles.eventGradient}>
        <View style={styles.eventBadge}><Text style={styles.eventBadgeText}>TOURNAMENT</Text></View>
        <Text style={styles.eventTitle}>GLOBAL TOURNAMENT</Text>
        <Text style={styles.eventSubtitle}>Competing for the top spot!</Text>
        <View style={styles.eventStatsRow}>
          <Text style={styles.eventStat}>Wins: 0</Text>
          <Text style={styles.eventStat}>Losses: 0/3</Text>
        </View>
        <TouchableOpacity style={[styles.eventButton, { backgroundColor: '#3498db' }]}>
          <Text style={styles.eventButtonText}>ENTER</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </ScrollView>
);

const ElixirDroplet = ({ size = 20, value, isDouble }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
      <Path
        d="M50 5 Q85 45 85 70 A35 35 0 1 1 15 70 Q15 45 50 5 Z"
        fill={isDouble ? '#FFD700' : '#D442F5'}
        stroke="white"
        strokeWidth="4"
      />
    </Svg>
    {value !== undefined && (
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.5, textShadowColor: 'black', textShadowRadius: 2 }}>
        {value}
      </Text>
    )}
  </View>
);

const DeckStats = ({ cards = [] }) => {
  const avgElixir = (cards.reduce((sum, c) => sum + (c?.cost || 0), 0) / (cards.length || 1)).toFixed(1);
  return (
    <View style={styles.deckStatsContainer}>
      <View style={styles.deckStatItem}>
        <Text style={styles.deckStatLabel}>Avg. Elixir</Text>
        <Text style={[styles.deckStatValue, { color: '#E74C3C' }]}>{avgElixir}</Text>
      </View>
      <View style={styles.deckStatDivider} />
      <View style={styles.deckStatItem}>
        <Text style={styles.deckStatLabel}>Tower Troop</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UnitSprite id="princess" isOpponent={false} size={20} />
          <Text style={styles.deckStatValue}>Princess</Text>
        </View>
      </View>
    </View>
  );
};

// Optimized Collection Card Component
const CollectionCard = memo(({ card, isInDeck, isDragging, onTap, onDragStart, onDragMove, onDragEnd, globalDragHandlers }) => {
  if (!card) return null;

  const isLegendary = card.rarity === 'legendary';
  const componentRef = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(card, gestureState, componentRef.current);
      },
      onPanResponderMove: (evt, gestureState) => {
        onDragMove(gestureState);
      },
      onPanResponderRelease: (evt, gestureState) => {
        onDragEnd(gestureState);
      },
      onPanResponderTerminate: () => {
        if (globalDragHandlers && globalDragHandlers.end) globalDragHandlers.end();
        onDragEnd({ moveX: 0, moveY: 0 }); // Reset state
      }
    })
  ).current;

  return (
    <View
      ref={componentRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={[
          styles.deckCard,
          !isLegendary && { borderColor: RARITY_COLORS[card.rarity] || '#000' },
          isLegendary && { backgroundColor: 'transparent', borderWidth: 0 },
          { opacity: isInDeck ? 0.5 : 1 }
        ]}
        onPress={() => onTap(card)}
        delayLongPress={200}
        activeOpacity={0.7}
      >
        {isLegendary && (
          <Svg width="70" height="85" viewBox="0 0 60 75" style={{ position: 'absolute', top: 0, left: 0 }}>
            <Defs>
              <LinearGradient id="rainbow_collection" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#ff0000" />
                <Stop offset="20%" stopColor="#ffff00" />
                <Stop offset="40%" stopColor="#00ff00" />
                <Stop offset="60%" stopColor="#00ffff" />
                <Stop offset="80%" stopColor="#0000ff" />
                <Stop offset="100%" stopColor="#ff00ff" />
              </LinearGradient>
            </Defs>
            <Polygon
              points="30,2 58,18 58,57 30,73 2,57 2,18"
              fill="rgba(255, 255, 255, 0.95)"
              stroke="url(#rainbow_collection)"
              strokeWidth="2"
            />
          </Svg>
        )}
        <UnitSprite id={card.id} isOpponent={false} size={40} />
        <Text style={styles.deckCardName}>{card.name || 'Card'}</Text>
        <View style={styles.deckCardCost}>
          <Text style={styles.deckCardCostText}>{card.cost || 0}</Text>
        </View>
        {isInDeck && (
          <View style={styles.deckCardBadge}>
            <Text style={styles.deckCardBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}, (prev, next) => {
  return prev.card.id === next.card.id &&
    prev.isInDeck === next.isInDeck &&
    prev.isDragging === next.isDragging;
});

// Card menu component (popup) - Memoized
const CardMenu = memo(({ card, onClose, onInfo, onSwap }) => {
  if (!card) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!card}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.cardMenuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.cardMenuContent}>
          {/* Card Preview */}
          <View style={styles.cardMenuPreview}>
            <UnitSprite id={card.id} isOpponent={false} size={60} />
            <View style={styles.cardMenuCostBadge}>
              <Text style={styles.cardMenuCostText}>{card.cost}</Text>
            </View>
            <Text style={styles.cardMenuName}>{card.name}</Text>
            <View style={styles.cardMenuRarityBadge}>
              <Text style={styles.cardMenuRarityText}>{card.rarity?.toUpperCase()}</Text>
            </View>
          </View>

          {/* Stats Preview */}
          <View style={styles.cardMenuStats}>
            {Boolean(card.hp) && <Text style={styles.cardMenuStat}>HP: {card.hp}</Text>}
            {Boolean(card.damage) && <Text style={styles.cardMenuStat}>DMG: {card.damage}</Text>}
            {Boolean(card.speed !== undefined && card.speed > 0) && <Text style={styles.cardMenuStat}>SPD: {card.speed}</Text>}
          </View>

          {/* Action Buttons */}
          <View style={styles.cardMenuButtons}>
            <TouchableOpacity
              style={[styles.cardMenuButton, styles.cardMenuButtonInfo]}
              onPress={() => onInfo(card)}
            >
              <Text style={styles.cardMenuButtonText}>📊 Info</Text>
            </TouchableOpacity>

            <Text style={styles.cardMenuOr}>OR</Text>

            <TouchableOpacity
              style={[styles.cardMenuButton, styles.cardMenuButtonSwap]}
              onPress={() => onSwap(card)}
            >
              <Text style={styles.cardMenuButtonText}>🔄 Swap</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cardMenuCancel}
            onPress={onClose}
          >
            <Text style={styles.cardMenuCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

// Deck slot selector - Memoized
const DeckSlotSelector = memo(({ visible, onClose, cards, onSwap }) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.cardMenuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.slotSelectorContent}>
          <Text style={styles.slotSelectorTitle}>Select slot to swap with {visible?.name || 'Card'}</Text>

          <View style={styles.slotSelectorDeck}>
            <View style={styles.slotSelectorSlotRow}>
              {(cards || []).slice(0, 4).map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.slotSelectorSlot}
                  onPress={() => onSwap(index)}
                >
                  <UnitSprite id={card.id} isOpponent={false} size={45} />
                  <Text style={styles.slotSelectorSlotName}>{card.name || 'Card'}</Text>
                  <View style={styles.slotSelectorSlotCost}>
                    <Text style={styles.slotSelectorSlotCostText}>{card.cost || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.slotSelectorSlotRow}>
              {(cards || []).slice(4, 8).map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.slotSelectorSlot}
                  onPress={() => onSwap(index + 4)}
                >
                  <UnitSprite id={card.id} isOpponent={false} size={45} />
                  <Text style={styles.slotSelectorSlotName}>{card.name || 'Card'}</Text>
                  <View style={styles.slotSelectorSlotCost}>
                    <Text style={styles.slotSelectorSlotCostText}>{card.cost || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.slotSelectorCancel}
            onPress={onClose}
          >
            <Text style={styles.slotSelectorCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const DeckTab = ({ cards = [], onSwapCards, dragHandlers, allDecks, selectedDeckIndex, setSelectedDeckIndex }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardMenuCard, setCardMenuCard] = useState(null);
  const [showSlotSelector, setShowSlotSelector] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterRarity, setFilterRarity] = useState('all');
  const [sortByElixir, setSortByElixir] = useState(false);

  const dropZones = useRef([]);
  const deckSlotRefs = useRef([]);
  const [localDraggingCard, setLocalDraggingCard] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = useMemo(() => {
    return CARDS.filter(card => !card.isToken).filter(card => {
      if (filterRarity === 'all') return true;
      return card.rarity === filterRarity;
    }).filter(card => {
      // Filter by search query (search in card name)
      if (!searchQuery || searchQuery.trim() === '') return true;
      const query = searchQuery.toLowerCase().trim();
      return card.name.toLowerCase().includes(query);
    }).sort((a, b) => sortByElixir ? a.cost - b.cost : 0);
  }, [filterRarity, sortByElixir, searchQuery]);

  const handleCollectionCardTap = useCallback((card) => setCardMenuCard(card), []);
  const handleDeckCardTap = useCallback((card) => setSelectedCard(card), []);

  const handleCardInfo = useCallback((card) => {
    setCardMenuCard(null);
    setSelectedCard(card);
  }, []);

  const handleCardSwapRequest = useCallback((card) => {
    setCardMenuCard(null);
    setShowSlotSelector(card);
  }, []);

  const handleSwapFromMenu = useCallback((deckIndex) => {
    const sourceCard = showSlotSelector || cardMenuCard;
    if (sourceCard) {
      const fromIndex = cards.findIndex(c => c.id === sourceCard.id);
      if (fromIndex !== -1) {
        if (fromIndex !== deckIndex) onSwapCards(fromIndex, deckIndex);
      } else onSwapCards(sourceCard, deckIndex);
      setCardMenuCard(null);
      setShowSlotSelector(null);
    }
  }, [showSlotSelector, cardMenuCard, cards, onSwapCards]);

  const handleDragStart = useCallback((card, gesture, componentRef) => {
    setScrollEnabled(false);
    setLocalDraggingCard(card);
    componentRef.measure((x, y, width, height, pageX, pageY) => {
      if (dragHandlers?.start) dragHandlers.start(card, pageX, pageY);
      deckSlotRefs.current.forEach((ref, index) => {
        if (ref) ref.measure((x, y, width, height, pageX, pageY) => {
          dropZones.current[index] = { x: pageX, y: pageY, width, height, index };
        });
      });
    });
  }, [dragHandlers]);

  const handleDragEnd = useCallback((gesture) => {
    const target = dropZones.current.find(zone =>
      gesture.moveX >= zone.x && gesture.moveX <= zone.x + zone.width &&
      gesture.moveY >= zone.y && gesture.moveY <= zone.y + zone.height
    );
    if (target) {
      const fromIndex = cards.findIndex(c => c.id === localDraggingCard?.id);
      if (fromIndex !== -1 && fromIndex !== target.index) onSwapCards(fromIndex, target.index);
    }
    if (dragHandlers?.end) dragHandlers.end();
    setLocalDraggingCard(null);
    setScrollEnabled(true);
  }, [cards, localDraggingCard, onSwapCards, dragHandlers]);

  const renderCollectionCard = useCallback(({ item }) => (
    <View style={{ margin: 3 }}>
      <CollectionCard
        card={item}
        isInDeck={cards.some(c => c?.id === item.id)}
        isDragging={localDraggingCard?.id === item.id}
        onTap={handleCollectionCardTap}
        onDragStart={handleDragStart}
        onDragMove={(g) => dragHandlers?.move?.(g.moveX, g.moveY)}
        onDragEnd={handleDragEnd}
        globalDragHandlers={dragHandlers}
      />
    </View>
  ), [cards, localDraggingCard, handleCollectionCardTap, handleDragStart, handleDragEnd, dragHandlers]);

  return (
    <View style={styles.deckTabContainer}>
      {/* Header Deck Grid (Persistent) */}
      <View style={styles.deckGridContainer}>
        <View style={styles.deckHeaderRow}>
          <Text style={styles.deckTabTitle}>Battle Deck</Text>
          <View style={styles.deckSelectorMini}>
            {allDecks.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedDeckIndex(i)} style={[styles.deckDot, selectedDeckIndex === i && styles.deckDotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.deckCardGrid}>
          <View style={styles.cardRowCompact}>
            {cards.slice(0, 4).map((card, i) => (
              <View key={card.id} ref={el => deckSlotRefs.current[i] = el} style={{ width: '23%', aspectRatio: 0.8 }}>
                {card.rarity === 'legendary' ? (
                  // Legendary hexagonal with rainbow border
                  <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {/* Rainbow hexagon border */}
                    <Svg width="100%" height="100%" viewBox="0 0 100 80" style={{ position: 'absolute' }}>
                      <Defs>
                        <LinearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#ff0000" stopColor="#ff0000" />
                          <Stop offset="20%" stopColor="#ff7f00" stopColor="#ff7f00" />
                          <Stop offset="40%" stopColor="#ffff00" stopColor="#ffff00" />
                          <Stop offset="60%" stopColor="#00ff00" stopColor="#00ff00" />
                          <Stop offset="80%" stopColor="#0000ff" stopColor="#0000ff" />
                          <Stop offset="100%" stopColor="#8b00ff" stopColor="#8b00ff" />
                        </LinearGradient>
                      </Defs>
                      {/* Hexagon shape - more angular like Clash Royale */}
                      <Polygon
                        points="20,2 80,2 98,40 80,78 20,78 2,40"
                        fill="white"
                        stroke="url(#rainbowGrad)"
                        strokeWidth="4"
                      />
                      {/* Inner glow */}
                      <Polygon
                        points="22,4 78,4 96,40 78,76 22,76 4,40"
                        fill="rgba(139, 0, 255, 0.1)"
                      />
                    </Svg>
                    {/* Card content */}
                    <TouchableOpacity
                      onPress={() => handleDeckCardTap(card)}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <UnitSprite id={card.id} size={35} />
                      <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Normal card
                  <TouchableOpacity
                    onPress={() => handleDeckCardTap(card)}
                    style={[
                      styles.deckCardCompact,
                      { borderColor: RARITY_COLORS[card.rarity] },
                      { width: '100%', height: '100%' }
                    ]}
                  >
                    <UnitSprite id={card.id} size={35} />
                    <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <View style={styles.cardRowCompact}>
            {cards.slice(4, 8).map((card, i) => (
              <View key={card.id} ref={el => deckSlotRefs.current[i + 4] = el} style={{ width: '23%', aspectRatio: 0.8 }}>
                {card.rarity === 'legendary' ? (
                  // Legendary hexagonal with rainbow border
                  <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {/* Rainbow hexagon border */}
                    <Svg width="100%" height="100%" viewBox="0 0 100 80" style={{ position: 'absolute' }}>
                      <Defs>
                        <LinearGradient id="rainbowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#ff0000" stopColor="#ff0000" />
                          <Stop offset="20%" stopColor="#ff7f00" stopColor="#ff7f00" />
                          <Stop offset="40%" stopColor="#ffff00" stopColor="#ffff00" />
                          <Stop offset="60%" stopColor="#00ff00" stopColor="#00ff00" />
                          <Stop offset="80%" stopColor="#0000ff" stopColor="#0000ff" />
                          <Stop offset="100%" stopColor="#8b00ff" stopColor="#8b00ff" />
                        </LinearGradient>
                      </Defs>
                      {/* Hexagon shape */}
                      <Polygon
                        points="12,3 88,3 97,40 88,77 12,77 3,40"
                        fill="white"
                        stroke="url(#rainbowGrad2)"
                        strokeWidth="4"
                      />
                      {/* Inner glow */}
                      <Polygon
                        points="15,6 85,6 94,40 85,74 15,74 6,40"
                        fill="rgba(139, 0, 255, 0.1)"
                      />
                    </Svg>
                    {/* Card content */}
                    <TouchableOpacity
                      onPress={() => handleDeckCardTap(card)}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <UnitSprite id={card.id} size={35} />
                      <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Normal card
                  <TouchableOpacity
                    onPress={() => handleDeckCardTap(card)}
                    style={[
                      styles.deckCardCompact,
                      { borderColor: RARITY_COLORS[card.rarity] },
                      { width: '100%', height: '100%' }
                    ]}
                  >
                    <UnitSprite id={card.id} size={35} />
                    <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.deckFooterRow}>
          <View style={styles.towerTroopSlot}>
            <UnitSprite id="princess" size={25} />
            <Text style={styles.towerTroopText}>Princess</Text>
          </View>
          <View style={styles.avgElixirContainer}>
            <Text style={styles.avgElixirText}>Avg. Elixir: {(cards.reduce((s, c) => s + c.cost, 0) / 8).toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Collection Section */}
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionTitle}>Collection</Text>
        <TouchableOpacity style={styles.filterButtonMini} onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterButtonText}>Sort By ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search cards..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.searchClearButton} onPress={() => setSearchQuery('')}>
            <Text style={styles.searchClearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCards}
        keyExtractor={item => item.id}
        numColumns={4}
        renderItem={renderCollectionCard}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />

      {/* Modals */}
      <CardMenu card={cardMenuCard} onClose={() => setCardMenuCard(null)} onInfo={handleCardInfo} onSwap={handleCardSwapRequest} />
      <DeckSlotSelector visible={showSlotSelector} onClose={() => setShowSlotSelector(null)} cards={cards} onSwap={handleSwapFromMenu} />
      <Modal animationType="fade" transparent visible={!!selectedCard} onRequestClose={() => setSelectedCard(null)}>
        <View style={styles.cardDetailModal}>
          <View style={[styles.cardDetailModalContent, { borderColor: RARITY_COLORS[selectedCard?.rarity] || '#F1C40F' }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCard(null)}><Text style={styles.closeButtonText}>✕</Text></TouchableOpacity>
            <View style={styles.cardDetailHeader}>
              <UnitSprite id={selectedCard?.id} size={80} />
              <Text style={styles.cardDetailNameBig}>{selectedCard?.name}</Text>
              <Text style={styles.cardDetailTypeBig}>{selectedCard?.rarity?.toUpperCase()} {selectedCard?.type?.toUpperCase()}</Text>
            </View>
            <View style={styles.cardDetailStatsBig}>
              {selectedCard?.hp && <View style={styles.statRow}><Text style={styles.statLabel}>HP</Text><Text style={styles.statValue}>{selectedCard.hp}</Text></View>}
              {selectedCard?.damage && <View style={styles.statRow}><Text style={styles.statLabel}>Damage</Text><Text style={styles.statValue}>{selectedCard.damage}</Text></View>}
              {selectedCard?.range && <View style={styles.statRow}><Text style={styles.statLabel}>Range</Text><Text style={styles.statValue}>{selectedCard.range}</Text></View>}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const BattleTab = ({ currentDeck, onStartBattle, chests, onUnlockChest, onOpenChest, onFriendlyBattle }) => (
  <View style={styles.battleTabContainer}>
    {/* Crown Chest / Pass Royale Bar */}
    <View style={styles.crownChestBar}>
      <View style={styles.passRoyaleIcon}>
        <Text style={{ fontSize: 16 }}>👑</Text>
      </View>
      <View style={styles.crownProgressContainer}>
        <View style={styles.crownProgressBar}>
          <View style={[styles.crownProgressFill, { width: '60%' }]} />
        </View>
        <Text style={styles.crownProgressText}>6/10</Text>
      </View>
      <View style={styles.crownChestReward}>
        <Text style={{ fontSize: 18 }}>🎁</Text>
      </View>
    </View>

    {/* Arena & Trophy Road Area */}
    <View style={styles.arenaMainView}>
      <View style={styles.trophyRoadHeader}>
        <Text style={styles.arenaTitle}>ARENA 11</Text>
        <Text style={styles.arenaSubtitle}>Electro Valley</Text>
      </View>

      <View style={styles.trophyRoadContainer}>
        <View style={styles.trorophyRoadTrack}>
          <View style={[styles.trophyRoadFill, { width: '75%' }]} />
          <View style={[styles.trophyMarker, { left: '75%' }]}>
            <Text style={styles.trophyMarkerText}>3400 🏆</Text>
          </View>
        </View>
      </View>

      <View style={styles.arenaVisualContainer}>
        <Svg width="200" height="150" viewBox="0 0 200 150">
          <Defs>
            <LinearGradient id="arenaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#3498db" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#2c3e50" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>
          <Path d="M20 130 L180 130 L160 20 L40 20 Z" fill="url(#arenaGrad)" stroke="#f1c40f" strokeWidth="2" />
          <Circle cx="100" cy="75" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        </Svg>
      </View>
    </View>

    {/* Action Buttons */}
    <View style={styles.battleActionsRow}>
      <TouchableOpacity style={styles.smallBlueButton} onPress={onFriendlyBattle}>
        <Text style={styles.smallButtonIcon}>👥</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.battleButton} onPress={onStartBattle}>
        <Text style={styles.battleButtonText}>BATTLE</Text>
        <View style={styles.battleButtonTrophyRow}>
          <Text style={styles.battleButtonTrophyText}>+30</Text>
          <Text style={{ fontSize: 10 }}>🏆</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.smallBlueButton}>
        <Text style={styles.smallButtonIcon}>🎮</Text>
      </TouchableOpacity>
    </View>

    {/* Chest Slots */}
    <ChestSlots chests={chests} onUnlock={onUnlockChest} onOpen={onOpenChest} />
  </View>
);

const SocialTab = () => {
  const [messages, setMessages] = useState([
    { id: '1', user: 'KingSlayer', text: 'Good game everyone!', role: 'Elder', time: '2h ago' },
    { id: '2', user: 'PrincessLover', text: 'Can someone donate Wizards?', role: 'Member', time: '1h ago' },
    { id: '3', user: 'System', text: 'Trainer Cheddar joined the clan.', role: 'System', time: '30m ago' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim().length === 0) return;
    const newMsg = { id: Date.now().toString(), user: 'You', text: inputText, role: 'Leader', time: 'Just now' };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const renderMessage = ({ item }) => {
    if (item.role === 'System') return <View style={styles.systemMessage}><Text style={styles.systemMessageText}>{item.text}</Text></View>;
    const isMe = item.user === 'You';
    return (
      <View style={[styles.chatRow, isMe ? styles.chatRowMe : styles.chatRowOther]}>
        <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
          {!isMe && <Text style={[styles.chatUser, { color: item.role === 'Elder' ? '#f1c40f' : '#3498db' }]}>{item.user}</Text>}
          <Text style={styles.chatText}>{item.text}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.clanTabContainer}>
      <View style={styles.socialHeader}>
        <View style={styles.clanMainInfo}>
          <View style={styles.clanBadgeLarge}><Text style={{ fontSize: 24 }}>🛡️</Text></View>
          <View>
            <Text style={styles.clanNameText}>Blue Kings</Text>
            <Text style={styles.clanStatusText}>48/50 Members • 🏆 4000+</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clanSettingsIcon}><Text style={{ fontSize: 18 }}>ℹ️</Text></TouchableOpacity>
      </View>

      <View style={styles.requestBanner}>
        <Text style={styles.requestText}>New card request available!</Text>
        <TouchableOpacity style={styles.requestButton}><Text style={styles.requestButtonText}>REQUEST</Text></TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.chatContainer} keyboardVerticalOffset={80}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 10 }}
        />
        <View style={styles.inputContainer}>
          <TextInput style={styles.chatInput} placeholder="Message..." placeholderTextColor="#888" value={inputText} onChangeText={setInputText} />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}><Text style={styles.sendButtonText}>S</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 0, name: 'Shop', icon: '🛒' },
    { id: 1, name: 'Decks', icon: '📚' },
    { id: 2, name: 'Battle', icon: '⚔️' },
    { id: 3, name: 'Social', icon: '👥' },
    { id: 4, name: 'Events', icon: '🏆' }
  ];

  return (
    <View style={styles.bottomNavigation}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={[styles.tabIcon, activeTab === tab.id && { transform: [{ scale: 1.2 }] }]}>{tab.icon}</Text>
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const MainLobby = ({
  activeTab, onTabChange, onStartGame, currentDeck, onSwapCards,
  dragHandlers, selectedDeckIndex, setSelectedDeckIndex, allDecks,
  chests, onUnlockChest, onOpenChest
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return <ShopTab />;
      case 1: return <DeckTab
        cards={currentDeck}
        onSwapCards={onSwapCards}
        dragHandlers={dragHandlers}
        selectedDeckIndex={selectedDeckIndex}
        setSelectedDeckIndex={setSelectedDeckIndex}
        allDecks={allDecks}
      />;
      case 2: return <BattleTab
        currentDeck={currentDeck}
        onStartBattle={onStartGame}
        chests={chests}
        onUnlockChest={onUnlockChest}
        onOpenChest={onOpenChest}
      />;
      case 3: return <SocialTab />;
      case 4: return <EventsTab />;
      default: return null;
    }
  };

  return (
    <ImageBackground source={require('./lobby-bg.jpg')} style={styles.lobbyContainer}>
      <View style={styles.lobbyOverlay}>
        <LobbyHeader />
        <View style={styles.tabContentArea}>
          {renderTabContent()}
        </View>
        <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </View>
    </ImageBackground>
  );
};

// --- Game Board Component (Extracted) ---
const GameBoard = ({
  towers, units, projectiles, visualEffects, setVisualEffects, screenShake, setScreenShake, timeLeft, gameOver,
  elixir, enemyElixir, hand, nextCard, draggingCard, dragPosition,
  handleDragStart, handleDragMove, handleDragEnd,
  spawnTestEnemy, formatTime, onRestart, score,
  isDoubleElixir, showDoubleElixirAlert,
  audioEnabled, setAudioEnabled, onConcede
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // Screen shake animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (screenShake) {
      const { intensity, duration } = screenShake;
      const shakes = 10;
      const shakeDuration = duration / shakes;

      const animations = [];
      for (let i = 0; i < shakes; i++) {
        animations.push(
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: intensity * 5 * (i % 2 === 0 ? 1 : -1),
              duration: shakeDuration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: shakeDuration / 2,
              useNativeDriver: true,
            }),
          ])
        );
      }

      Animated.sequence(animations).start(() => {
        setScreenShake(null);
      });
    }
  }, [screenShake, shakeAnim, setScreenShake]);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.gameBoard,
        screenShake && {
          transform: [{ translateX: shakeAnim }]
        }
      ]}>
        {/* Top Info Bar (Opponent) */}
        <View style={styles.topInfoBar}>
          <View style={styles.playerInfoContainer}>
            <Text style={styles.playerName}>Trainer Cheddar</Text>
            <Text style={styles.clanName}>Training Camp</Text>
          </View>
          {/* AI Elixir Bar - Small and subtle */}
          <View style={{ width: 80, height: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <View style={{ width: `${(enemyElixir / 10) * 100}%`, height: '100%', backgroundColor: '#D442F5', opacity: 0.7 }} />
          </View>            </View>
        {/* Score & Time Board */}
        <View style={styles.scoreBoard}>
          <View style={styles.crownContainer}>
            <Text style={styles.crownIcon}>👑</Text>
            <Text style={styles.scoreText}>{score[1]}</Text>
          </View>
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, timeLeft <= 10 && styles.timerTextRed]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
          <View style={styles.crownContainer}>
            <Text style={styles.scoreText}>{score[0]}</Text>
            <Text style={styles.crownIcon}>👑</Text>
          </View>
        </View>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>

        <Modal
          transparent={true}
          visible={showSettings}
          animationType="fade"
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 300, backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center', elevation: 5 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' }}>Settings</Text>

              <TouchableOpacity
                style={{ padding: 15, backgroundColor: audioEnabled ? '#2ecc71' : '#95a5a6', width: '100%', alignItems: 'center', borderRadius: 5, marginBottom: 10 }}
                onPress={() => setAudioEnabled(!audioEnabled)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Audio: {audioEnabled ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 15, backgroundColor: '#3498db', width: '100%', alignItems: 'center', borderRadius: 5, marginBottom: 10 }}
                onPress={() => { setShowSettings(false); onRestart('game'); }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Restart Game</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 15, backgroundColor: '#e74c3c', width: '100%', alignItems: 'center', borderRadius: 5, marginBottom: 10 }}
                onPress={() => { setShowSettings(false); onConcede(); }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Concede</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 10, marginTop: 5 }}
                onPress={() => setShowSettings(false)}
              >
                <Text style={{ color: '#7f8c8d', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {(towers || []).map(tower => {
          if (tower.hp <= 0) return null;
          const isPrincess = tower.type === 'princess';
          const size = isPrincess ? PRINCESS_TOWER_SIZE : KING_TOWER_SIZE;

          const styleObj = {
            left: tower.x - size / 2,
            top: tower.y - size / 2,
            width: size,
            height: size,
            zIndex: 10,
            position: 'absolute'
          };

          const isSlowed = tower.slowUntil > Date.now();
          const isStunned = tower.stunUntil > Date.now();

          return (
            <View key={tower.id} style={[styles.towerContainer, styleObj]}>
              <TowerSprite type={tower.type} isOpponent={tower.isOpponent} size={size} />
              {isSlowed && (
                <View style={{
                  position: 'absolute',
                  top: -5, left: -5, right: -5, bottom: -5,
                  backgroundColor: 'rgba(135, 206, 250, 0.4)',
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#00BFFF',
                  zIndex: 15,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 16 }}>❄️</Text>
                </View>
              )}
              {isStunned && (
                <View style={{
                  position: 'absolute',
                  top: -5, left: -5, right: -5, bottom: -5,
                  backgroundColor: 'rgba(255, 255, 0, 0.3)',
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#FFFF00',
                  zIndex: 16,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 16 }}>⚡</Text>
                </View>
              )}
              <HealthBar current={tower.hp} max={tower.maxHp} isOpponent={tower.isOpponent} />
            </View>
          );
        })}

        <View style={styles.river}>
          <View style={[styles.bridge, { left: 65 }]} />
          <View style={[styles.bridge, { right: 65 }]} />
        </View>

        {(units || []).map(u => <Unit key={u.id} unit={u} />)}
        {(projectiles || []).map(p => <Projectile key={p.id} type={p.type} position={p} />)}
        <VisualEffects effects={visualEffects} setEffects={setVisualEffects} />

        {/* Emote Button */}
        <TouchableOpacity style={styles.emoteButton}>
          <Text style={{ fontSize: 24 }}>😊</Text>
        </TouchableOpacity>

      </Animated.View>

      {/* Double Elixir Alert */}
      {showDoubleElixirAlert && (
        <View style={styles.doubleElixirAlert}>
          <View style={styles.doubleElixirAlertContent}>
            <Text style={styles.doubleElixirAlertTitle}>⚡ DOUBLE ELIXIR! ⚡</Text>
            <Text style={styles.doubleElixirAlertSubtitle}>Elixir generation 2x speed!</Text>
          </View>
        </View>
      )}

      <View style={styles.footerContainer}>
        <View style={styles.deckContainer}>
          <View style={styles.nextCardContainer}>
            <Text style={styles.nextLabel}>NEXT</Text>
            {nextCard && <Card card={nextCard} isNext={true} />}
          </View>

          <View style={styles.handContainer}>
            {(hand || []).map((card, index) => (
              <Card
                key={`${card.id}-${index}`}
                card={card}
                isNext={false}
                canAfford={elixir >= card.cost}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                isDragging={draggingCard && draggingCard.id === card.id}
              />
            ))}
          </View>
        </View>

        <View style={styles.elixirSection}>
          <View style={styles.elixirContainer}>
            <View style={{ marginRight: 5, zIndex: 10 }}>
              <ElixirDroplet size={40} value={Math.floor(elixir)} isDouble={isDoubleElixir} />
              {isDoubleElixir && (
                <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: 'black', borderRadius: 5, paddingHorizontal: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFD700' }}>2X</Text>
                </View>
              )}
            </View>
            <View style={styles.elixirBarBack}>
              <View style={[styles.elixirBarFill, isDoubleElixir && styles.elixirBarFillDouble, { width: `${(elixir / 10) * 100}%` }]} />
              {[...Array(9)].map((_, i) => (
                <View key={i} style={[styles.elixirTick, { left: `${(i + 1) * 10}%` }]} />
              ))}
            </View>
          </View>
          {/* Hidden debug button for testing */}
          <TouchableOpacity style={[styles.debugBtnSmall, { opacity: 0 }]} onPress={spawnTestEnemy}>
            <Text style={{ color: '#fff', fontSize: 10 }}>Enemy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {draggingCard && (
        <View style={{ position: 'absolute', left: dragPosition.x, top: dragPosition.y, zIndex: 9999, elevation: 100 }} pointerEvents="none">
          {/* Range/Radius Indicator - Only for Spells (radius), Buildings, or Units with Spawn Damage - NOT for The Log */}
          {Boolean((draggingCard.radius || (draggingCard.range && (draggingCard.type === 'building' || draggingCard.spawnDamage))) && draggingCard.id !== 'the_log') && (
            <View style={{
              position: 'absolute',
              left: -(draggingCard.radius || draggingCard.range),
              top: -(draggingCard.radius || draggingCard.range),
              width: (draggingCard.radius || draggingCard.range) * 2,
              height: (draggingCard.radius || draggingCard.range) * 2,
              borderRadius: (draggingCard.radius || draggingCard.range),
              backgroundColor: (draggingCard.id === 'zap' || draggingCard.id === 'clone') ? 'rgba(52, 152, 219, 0.3)' : (draggingCard.type === 'spell' ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
              borderColor: (draggingCard.id === 'zap' || draggingCard.id === 'clone') ? '#3498db' : (draggingCard.type === 'spell' ? '#FFFF00' : 'white'),
              borderWidth: 2,
              borderStyle: draggingCard.type === 'spell' ? 'solid' : 'dashed'
            }} />
          )}
          {Boolean(draggingCard.spawnDamage) && (
            <View style={{
              position: 'absolute',
              left: -50,
              top: -50,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(52, 152, 219, 0.3)',
              borderColor: '#3498db',
              borderWidth: 1
            }} />
          )}
          {/* THE LOG: Show rolling path FORWARD from deployment position */}
          {draggingCard.id === 'the_log' && (
            <View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: width,
              height: height,
              pointerEvents: 'none'
            }}>
              <Svg width={width} height={height} style={{ position: 'absolute' }}>
                {(() => {
                  // Log starts at deployment position and rolls forward 150 pixels
                  const startY = dragPosition.y + 37.5;
                  const logDistance = 150;
                  const endY = draggingCard.isOpponent ? startY + logDistance : startY - logDistance;
                  const logWidth = 40; // Width of the log's damage area

                  return (
                    <>
                      {/* Rectangular damage area showing the log's path */}
                      <Rect
                        x={dragPosition.x + 30 - logWidth / 2}
                        y={draggingCard.isOpponent ? startY : endY}
                        width={logWidth}
                        height={logDistance}
                        fill="rgba(139, 69, 19, 0.3)"
                        stroke="#8B4513"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                      {/* Direction arrow */}
                      <Path
                        d={`M${dragPosition.x + 30} ${startY + 20} L${dragPosition.x + 30} ${draggingCard.isOpponent ? startY + 60 : startY - 60}`}
                        stroke="#f1c40f"
                        strokeWidth="3"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                      {/* Start point (deployment position) */}
                      <Circle
                        cx={dragPosition.x + 30}
                        cy={startY}
                        r="8"
                        fill="#2ecc71"
                        opacity="0.9"
                      />
                      <SvgText
                        x={dragPosition.x + 30}
                        y={startY}
                        fontSize="10"
                        fill="white"
                        textAnchor="middle"
                        dy="3"
                        fontWeight="bold"
                      >▶</SvgText>
                    </>
                  );
                })()}
              </Svg>
            </View>
          )}
          <View style={[styles.dragProxy, { position: 'absolute', left: -30, top: -37.5, margin: 0 }]}>
            <UnitSprite id={draggingCard.id} isOpponent={false} size={50} />
            <View style={styles.dragProxyLabel}>
              <Text style={styles.cardName}>{draggingCard.name}</Text>
            </View>
          </View>
        </View>
      )}

      {gameOver && <GameOverScreen result={gameOver} onRestart={onRestart} />}

      <StatusBar style="auto" hidden />
    </View>
  );
};

// --- Chest Opening Modal Component ---
const ChestOpeningModal = ({ chest, onClose }) => {
  const [step, setStep] = useState('CLOSED'); // CLOSED -> OPENING -> REWARDS
  const [rewards, setRewards] = useState([]);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const generateRewards = () => {
    let gold = 0;
    let gems = 0;
    let totalCards = 0;

    switch (chest.type) {
      case 'SILVER': gold = 50; totalCards = 5; break;
      case 'GOLD': gold = 200; gems = 2; totalCards = 15; break;
      case 'GIANT': gold = 1000; totalCards = 50; break;
      case 'MAGICAL': gold = 500; gems = 10; totalCards = 20; break;
      case 'SUPER MAGICAL': gold = 5000; gems = 50; totalCards = 100; break;
      default: gold = 100; totalCards = 10;
    }

    const newRewards = [];
    if (gold > 0) newRewards.push({ type: 'GOLD', value: gold, icon: '💰', label: 'Gold' });
    if (gems > 0) newRewards.push({ type: 'GEM', value: gems, icon: '💎', label: 'Gems' });

    // --- TIERED CARD DISTRIBUTION ---
    const getCardsOfRarity = (rarity) => CARDS.filter(c => !c.isToken && c.rarity === rarity);

    const addCardReward = (rarity, count) => {
      if (count <= 0) return;
      const possible = getCardsOfRarity(rarity);
      if (possible.length === 0) return;
      const card = possible[Math.floor(Math.random() * possible.length)];
      newRewards.push({ type: 'CARD', value: count, icon: '🃏', label: card.name, card: card });
    };

    if (chest.type === 'SILVER') {
      addCardReward('common', totalCards);
    }
    else if (chest.type === 'GOLD') {
      addCardReward('common', totalCards - 3);
      addCardReward('rare', 3);
    }
    else if (chest.type === 'GIANT') {
      addCardReward('common', Math.floor(totalCards * 0.8));
      addCardReward('rare', Math.floor(totalCards * 0.2));
    }
    else if (chest.type === 'MAGICAL') {
      addCardReward('common', totalCards - 6);
      addCardReward('rare', 4);
      addCardReward('epic', 2);
    }
    else if (chest.type === 'SUPER MAGICAL') {
      addCardReward('common', 60);
      addCardReward('rare', 25);
      addCardReward('epic', 14);
      // 50% chance for a Legendary in Super Magical
      if (Math.random() > 0.5) addCardReward('legendary', 1);
    }

    setRewards(newRewards);
  };
  const handleTap = () => {
    if (step === 'CLOSED') {
      // Shake animation for first open
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => {
        setStep('OPENING');
        generateRewards();
        setRevealedIndex(0); // Show first reward
      });
    } else if (step === 'OPENING') {
      if (revealedIndex < rewards.length - 1) {
        setRevealedIndex(prev => prev + 1);
      } else {
        setStep('FINISHED');
      }
    }
  };

  const getChestColor = (type) => {
    switch (type) {
      case 'SILVER': return '#bdc3c7';
      case 'GOLD': return '#f1c40f';
      case 'GIANT': return '#e67e22';
      case 'MAGICAL': return '#9b59b6';
      default: return '#bdc3c7';
    }
  };

  const remainingCount = rewards.length - (revealedIndex + 1);
  const currentReward = rewards[revealedIndex];

  return (
    <TouchableOpacity
      style={styles.chestModalOverlay}
      activeOpacity={1}
      onPress={handleTap}
    >
      <View style={styles.chestModalContent}>
        <Text style={styles.chestModalTitle}>{chest.type} CHEST</Text>

        {step === 'CLOSED' && (
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={[
              styles.chestVisual,
              {
                borderColor: getChestColor(chest.type),
                transform: [{ translateX: shakeAnim }]
              }
            ]}>
              <Text style={{ fontSize: 50 }}>🔒</Text>
            </Animated.View>
            <Text style={styles.chestTapText}>Tap to Open!</Text>
          </View>
        )}

        {(step === 'OPENING' || step === 'FINISHED') && currentReward && (
          <View style={{ alignItems: 'center', width: '100%' }}>
            {/* Authentic CR Item Count Indicator */}
            {step === 'OPENING' && remainingCount > 0 && (
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{remainingCount}</Text>
              </View>
            )}

            {/* Current Reward Visual */}
            <Animated.View style={styles.rewardRevealContainer}>
              <View style={styles.rewardItemLarge}>
                {currentReward.type === 'CARD' ? (
                  <View style={{ alignItems: 'center' }}>
                    <UnitSprite id={currentReward.card.id} isOpponent={false} size={120} />
                    <Text style={styles.rewardValueLarge}>{currentReward.label}</Text>
                    <View style={styles.cardCountBadge}>
                      <Text style={styles.cardCountText}>x{currentReward.value}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.rewardIconLarge}>{currentReward.icon}</Text>
                    <Text style={styles.rewardValueLarge}>{currentReward.value}</Text>
                    <Text style={styles.rewardLabelLarge}>{currentReward.label}</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {step === 'FINISHED' && (
              <TouchableOpacity style={styles.closeChestButton} onPress={onClose}>
                <Text style={styles.closeChestButtonText}>COLLECT</Text>
              </TouchableOpacity>
            )}

            {step === 'OPENING' && (
              <Text style={styles.chestTapText}>Tap to reveal next!</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// --- Friendly Battle Modal Component ---
const FriendlyBattleModal = ({ visible, onClose, socket }) => {
  const [mode, setMode] = useState('MENU'); // MENU, CREATE, JOIN
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setMode('MENU');
      setRoomCode('');
      setJoinCode('');
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room_created', (roomId) => {
      setRoomCode(roomId);
    });

    socket.on('error', (msg) => {
      setError(msg);
      // Reset after 3s
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('room_created');
      socket.off('error');
    };
  }, [socket]);

  const handleCreate = () => {
    setMode('CREATE');
    // Generate random 4-digit code and request creation
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    // In reality, server should generate ID, but we'll request one for simplicity
    if (socket) socket.emit('create_room', code);
  };

  const handleJoin = () => {
    if (joinCode.length === 4) {
      if (socket) socket.emit('join_room', joinCode);
    } else {
      setError('Please enter a 4-digit room code');
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <TouchableOpacity style={styles.chestModalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.friendlyModalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.friendlyModalTitle}>FRIENDLY BATTLE</Text>

          {mode === 'MENU' && (
            <View style={styles.roomButtonsRow}>
              <TouchableOpacity style={styles.createRoomButton} onPress={handleCreate}>
                <Text style={styles.roomButtonText}>CREATE ROOM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.joinRoomButton} onPress={() => setMode('JOIN')}>
                <Text style={styles.roomButtonText}>JOIN ROOM</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'CREATE' && (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={styles.waitingText}>Share this code with your friend:</Text>
              <Text style={styles.roomCodeText}>{roomCode || '...'}</Text>
              <Text style={styles.waitingText}>Waiting for opponent...</Text>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          )}

          {mode === 'JOIN' && (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <TextInput
                style={styles.roomInput}
                placeholder="Enter Room Code"
                keyboardType="numeric"
                maxLength={4}
                value={joinCode}
                onChangeText={setJoinCode}
              />
              <TouchableOpacity style={styles.joinRoomButton} onPress={handleJoin}>
                <Text style={styles.roomButtonText}>JOIN BATTLE</Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? <Text style={{ color: 'red', marginTop: 10, fontWeight: 'bold' }}>{error}</Text> : null}

          <TouchableOpacity style={styles.cardMenuCancel} onPress={onClose}>
            <Text style={styles.cardMenuCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function App() {
  // Main App Entry Point
  const [inGame, setInGame] = useState(false);
  const [inLobby, setInLobby] = useState(false);
  const [openingChest, setOpeningChest] = useState(null); // Track chest being opened
  const [friendlyModalVisible, setFriendlyModalVisible] = useState(false); // Friendly battle modal
  const [activeTab, setActiveTab] = useState(2); // Default to Battle tab
  const [gameOver, setGameOver] = useState(null);
  const [timeLeft, setTimeLeft] = useState(180);
  const [score, setScore] = useState([0, 0]); // [Player, Opponent]
  const [isDoubleElixir, setIsDoubleElixir] = useState(false);
  const [showDoubleElixirAlert, setShowDoubleElixirAlert] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const doubleElixirTriggeredRef = useRef(false);
  const socketRef = useRef(null);

  // Initialize Socket
  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
    });

    socketRef.current.on("start_game", (data) => {
      setFriendlyModalVisible(false);
      resetGame();
      setInLobby(false);
      setInGame(true);
      // Here you would use data.startingPlayer to determine host/client
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Multiple deck slots - 5 decks of 8 cards each
  const getDeckByIds = (ids) => ids.map(id => CARDS.find(c => c.id === id)).filter(Boolean);

  const [allDecks, setAllDecks] = useState([
    getDeckByIds(['mother_witch', 'elixir_golem', 'ice_golem', 'ice_spirit', 'skeletons', 'fireball', 'zap', 'hog_rider']), // Test Deck
    getDeckByIds(['goblin_barrel', 'princess', 'knight', 'dart_goblin', 'inferno_tower', 'rocket', 'arrows', 'skeletons']), // Log Bait
    getDeckByIds(['pekka', 'bandit', 'battle_ram', 'electro_wizard', 'magic_archer', 'zap', 'poison', 'royal_ghost']), // Pekka Bridge Spam
    getDeckByIds(['golem', 'night_witch', 'baby_dragon', 'mega_minion', 'lightning', 'zap', 'elite_barbarians', 'mini_pekka']), // Golem Beatdown
    getDeckByIds(['giant', 'prince', 'archers', 'spear_goblins', 'fireball', 'zap', 'minions', 'valkyrie']) // Classic Giant
  ]);
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);

  // Force update Test Deck if Mother Witch is missing (handles HMR/Persistence issues)
  useEffect(() => {
    if (!allDecks[0].some(c => c.id === 'mother_witch')) {
      setAllDecks(prev => {
        const newDecks = [...prev];
        newDecks[0] = getDeckByIds(['mother_witch', 'elixir_golem', 'ice_golem', 'ice_spirit', 'skeletons', 'fireball', 'zap', 'hog_rider']);
        return newDecks;
      });
    }
  }, []);

  // Get currently selected deck
  const userCards = allDecks[selectedDeckIndex];

  // Global Drag State
  const [globalDraggingCard, setGlobalDraggingCard] = useState(null);
  const [globalDragPosition, setGlobalDragPosition] = useState({ x: 0, y: 0 });

  const [elixir, setElixir] = useState(5);
  const [hand, setHand] = useState([allDecks[0][0], allDecks[0][1], allDecks[0][2], allDecks[0][3]]);
  const [nextCard, setNextCard] = useState(allDecks[0][4]);
  const [deckQueue, setDeckQueue] = useState([allDecks[0][5], allDecks[0][6], allDecks[0][7]]);
  const [draggingCard, setDraggingCard] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [screenShake, setScreenShake] = useState(null);

  const handleSwapCards = (source, toIndex) => {
    // source can be index (deck swap) or card object (collection swap)
    // toIndex is always a deck slot (0-7)
    setAllDecks(prevDecks => {
      const newDecks = [...prevDecks];
      const currentDeck = [...newDecks[selectedDeckIndex]];

      if (typeof source === 'object' && source !== null) {
        // Swap with collection card object
        currentDeck[toIndex] = source;
      } else if (typeof source === 'number') {
        if (source >= 8) {
          // Legacy: Swap with collection card by index
          currentDeck[toIndex] = CARDS[source];
        } else {
          // Swap within deck (0-7)
          const temp = currentDeck[source];
          currentDeck[source] = currentDeck[toIndex];
          currentDeck[toIndex] = temp;
        }
      }

      newDecks[selectedDeckIndex] = currentDeck;
      return newDecks;
    });
  };

  const onGlobalDragStart = (card, x, y) => {
    setGlobalDraggingCard(card);
    setGlobalDragPosition({ x, y });
  };

  const onGlobalDragMove = (x, y) => {
    setGlobalDragPosition({ x, y });
  };

  const onGlobalDragEnd = () => {
    setGlobalDraggingCard(null);
  };

  // Enemy State
  const [enemyElixir, setEnemyElixir] = useState(5);
  const [enemyHand, setEnemyHand] = useState([allDecks[4][0], allDecks[4][1], allDecks[4][2], allDecks[4][3]]);
  const [enemyNextCard, setEnemyNextCard] = useState(allDecks[4][4]);
  const [enemyDeckQueue, setEnemyDeckQueue] = useState([allDecks[4][5], allDecks[4][6], allDecks[4][7]]);
  const [enemyDeckIndex, setEnemyDeckIndex] = useState(4);

  const [towers, setTowers] = useState([
    { id: 0, type: 'king', isOpponent: true, hp: 4000, maxHp: 4000, x: width / 2, y: 80, range: KING_RANGE, lastShot: 0 },
    { id: 1, type: 'princess', isOpponent: true, hp: 2500, maxHp: 2500, x: 70, y: 150, range: TOWER_RANGE, lastShot: 0 },
    { id: 2, type: 'princess', isOpponent: true, hp: 2500, maxHp: 2500, x: width - 70, y: 150, range: TOWER_RANGE, lastShot: 0 },
    { id: 3, type: 'king', isOpponent: false, hp: 4000, maxHp: 4000, x: width / 2, y: height - 200, range: KING_RANGE, lastShot: 0 },
    { id: 4, type: 'princess', isOpponent: false, hp: 2500, maxHp: 2500, x: 70, y: height - 270, range: TOWER_RANGE, lastShot: 0 },
    { id: 5, type: 'princess', isOpponent: false, hp: 2500, maxHp: 2500, x: width - 70, y: height - 270, range: TOWER_RANGE, lastShot: 0 },
  ]);

  const [units, setUnits] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [visualEffects, setVisualEffects] = useState([]); // Temporary visual effects (explosions, heals, etc.)
  const [lastPlayedCard, setLastPlayedCard] = useState(null);
  const [enemyLastPlayedCard, setEnemyLastPlayedCard] = useState(null);

  const towersRef = useRef(towers);
  const unitsRef = useRef(units);
  const projectilesRef = useRef(projectiles);
  const enemyElixirRef = useRef(enemyElixir);
  const enemyHandRef = useRef(enemyHand);
  const enemyNextCardRef = useRef(enemyNextCard);
  const enemyDeckQueueRef = useRef(enemyDeckQueue);
  const lastPlayedCardRef = useRef(lastPlayedCard);
  const enemyLastPlayedCardRef = useRef(enemyLastPlayedCard);

  useEffect(() => { towersRef.current = towers; }, [towers]);
  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
  useEffect(() => { enemyElixirRef.current = enemyElixir; }, [enemyElixir]);
  useEffect(() => { enemyHandRef.current = enemyHand; }, [enemyHand]);
  useEffect(() => { enemyNextCardRef.current = enemyNextCard; }, [enemyNextCard]);
  useEffect(() => { enemyDeckQueueRef.current = enemyDeckQueue; }, [enemyDeckQueue]);
  useEffect(() => { lastPlayedCardRef.current = lastPlayedCard; }, [lastPlayedCard]);
  useEffect(() => { enemyLastPlayedCardRef.current = enemyLastPlayedCard; }, [enemyLastPlayedCard]);

  const concedeGame = () => {
    setGameOver('LOSE');
  };

  const resetGame = (destination = 'game') => {
    setElixir(5);
    setScore([0, 0]);
    setIsDoubleElixir(false);
    setShowDoubleElixirAlert(false);
    doubleElixirTriggeredRef.current = false;

    // Player Deck Randomization
    const currentDeck = userCards || allDecks[0];
    const shuffledPlayerDeck = [...currentDeck].sort(() => Math.random() - 0.5);
    setHand([shuffledPlayerDeck[0], shuffledPlayerDeck[1], shuffledPlayerDeck[2], shuffledPlayerDeck[3]]);
    setNextCard(shuffledPlayerDeck[4]);
    setDeckQueue([shuffledPlayerDeck[5], shuffledPlayerDeck[6], shuffledPlayerDeck[7]]);

    // Enemy AI Deck Randomization
    setEnemyElixir(5);
    const randomEnemyDeckIndex = Math.floor(Math.random() * allDecks.length);
    setEnemyDeckIndex(randomEnemyDeckIndex);
    const enemyDeck = allDecks[randomEnemyDeckIndex];
    const shuffledEnemyDeck = [...enemyDeck].sort(() => Math.random() - 0.5);
    setEnemyHand([shuffledEnemyDeck[0], shuffledEnemyDeck[1], shuffledEnemyDeck[2], shuffledEnemyDeck[3]]);
    setEnemyNextCard(shuffledEnemyDeck[4]);
    setEnemyDeckQueue([shuffledEnemyDeck[5], shuffledEnemyDeck[6], shuffledEnemyDeck[7]]);

    setUnits([]);
    setProjectiles([]);
    setTimeLeft(180);
    setGameOver(null);
    setTowers([
      { id: 0, type: 'king', isOpponent: true, hp: 4000, maxHp: 4000, x: width / 2, y: 80, range: KING_RANGE, lastShot: 0 },
      { id: 1, type: 'princess', isOpponent: true, hp: 2500, maxHp: 2500, x: 70, y: 150, range: TOWER_RANGE, lastShot: 0 },
      { id: 2, type: 'princess', isOpponent: true, hp: 2500, maxHp: 2500, x: width - 70, y: 150, range: TOWER_RANGE, lastShot: 0 },
      { id: 3, type: 'king', isOpponent: false, hp: 4000, maxHp: 4000, x: width / 2, y: height - 200, range: KING_RANGE, lastShot: 0 },
      { id: 4, type: 'princess', isOpponent: false, hp: 2500, maxHp: 2500, x: 70, y: height - 270, range: TOWER_RANGE, lastShot: 0 },
      { id: 5, type: 'princess', isOpponent: false, hp: 2500, maxHp: 2500, x: width - 70, y: height - 270, range: TOWER_RANGE, lastShot: 0 },
    ]);

    if (destination === 'lobby') {
      setInLobby(true);
      setInGame(false);
    } else {
      setInGame(true);
    }
  };

  const handleDragStart = (card, gesture) => {
    setDraggingCard(card);
    setDragPosition({ x: gesture.x0, y: gesture.y0 });
  };

  const handleDragMove = (gesture) => {
    setDragPosition({ x: gesture.moveX, y: gesture.moveY });
  };

  const handleDragEnd = (gesture) => {
    if (gameOver) return;
    const dropX = gesture.moveX;
    const dropY = gesture.moveY;
    const card = draggingCard;


    setDraggingCard(null);

    if (!card) return;

    const footerHeight = 135;
    const gameAreaBottom = height - footerHeight;
    const riverY = height / 2;

    if (dropY < gameAreaBottom) {
      // Check if deployment is allowed based on tower status
      let canDeploy = false;

      if (card.type === 'spell') {
        // Spells can be deployed anywhere
        canDeploy = true;
      } else if (card.deployAnywhere) {
        // Miner can be deployed anywhere (even on enemy towers)
        canDeploy = true;
      } else {
        // For non-spells: check if opponent's princess tower on that side is destroyed
        const leftOpponentPrincess = towers.find(t => t.id === 1 && t.hp > 0);
        const rightOpponentPrincess = towers.find(t => t.id === 2 && t.hp > 0);

        const isLeftSide = dropX < width / 2;

        // Deployment tolerance - allow placing almost at the bridge
        // Standard river Y is height / 2.
        // We allow much higher (smaller Y) for better UX - can deploy near bridges
        let deploymentBoundary = riverY - 100; // Generous tolerance - almost touching bridge

        // Hog Rider (jumps) and Flying units can be deployed further forward (over river/bridge)
        if (card.id === 'hog_rider' || card.type === 'flying') {
          deploymentBoundary = riverY - 120;
        }

        // Allow deployment on own side (player's side)
        if (dropY > deploymentBoundary) {
          canDeploy = true;
        }
        // Allow deployment in enemy territory if that side's princess tower is destroyed
        // Can deploy anywhere in the enemy half (0 to riverY) when that side's tower is gone
        else if (isLeftSide && !leftOpponentPrincess) {
          // Left princess destroyed - can deploy anywhere on left side of enemy territory
          canDeploy = true;
        }
        else if (!isLeftSide && !rightOpponentPrincess) {
          // Right princess destroyed - can deploy anywhere on right side of enemy territory
          canDeploy = true;
        }
      }

      if (canDeploy) {
        spawnCard(card, dropX, dropY);
      } else {
      }
    } else {
    }
  };

  const spawnCard = (card, x, y, isOpponent = false) => {




    // Handle Mirror card - copy the last played card with +1 level

    let actualCard = card;

    let levelBoost = 0;

    if (card.id === 'mirror') {

      const lastCard = isOpponent ? enemyLastPlayedCardRef.current : lastPlayedCardRef.current;

      if (!lastCard) {


        return;

      }

      levelBoost = (lastCard.level || 11) + 1; // Tournament Standard 11 + 1

      actualCard = { ...lastCard };

      actualCard.cost = lastCard.cost + 1;

      actualCard.level = levelBoost;

      const levelBonus = 1 + (levelBoost - 11) * 0.1;

      actualCard.hp = Math.floor(lastCard.hp * levelBonus);

      actualCard.damage = Math.floor(lastCard.damage * levelBonus);

    }



    const setTargetElixir = isOpponent ? setEnemyElixir : setElixir;

    const setTargetHand = isOpponent ? setEnemyHand : setHand;

    const setTargetQueue = isOpponent ? setEnemyDeckQueue : setDeckQueue;

    const setTargetNext = isOpponent ? setEnemyNextCard : setNextCard;

    const nextCardToUse = isOpponent ? enemyNextCardRef.current : nextCard;



    setTargetElixir(currentElixir => {

      const costToUse = actualCard.cost;

      if (currentElixir < costToUse) return currentElixir;

      const newElixir = currentElixir - costToUse;



      if (actualCard.type === 'spell') {

        let spellType = 'fireball_spell';

        let spellSpeed = 15;

        let startX = width / 2;

        let startY = isOpponent ? 0 : height;



        if (actualCard.id === 'lightning') {

          spellType = 'lightning_bolt';

          spellSpeed = 100;

          const allTargets = [

            ...(unitsRef.current || []).filter(u => u.isOpponent !== isOpponent),

            ...(towersRef.current || []).filter(t => t.isOpponent !== isOpponent && t.hp > 0)

          ];

          const targetsInRange = allTargets.filter(t => {

            const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));

            return dist <= actualCard.radius;

          });

          const topTargets = targetsInRange.sort((a, b) => b.hp - a.hp).slice(0, 3);

          if (topTargets.length > 0) {

            const newProjectiles = topTargets.map((t, index) => ({

              id: Date.now() + index,

              x: t.x, y: t.y - 50, targetX: t.x, targetY: t.y,

              speed: 100, damage: actualCard.damage, type: 'lightning_bolt',

              isSpell: true, stun: 0.5, hit: true, spawnTime: Date.now(), isOpponent

            }));

            setProjectiles(prev => [...prev, ...newProjectiles]);

            setUnits(prev => prev.map(u => {

              if (topTargets.some(t => t.id === u.id)) {

                return { ...u, hp: u.hp - actualCard.damage, stunUntil: Date.now() + 500, wasStunned: true };

              }

              return u;

            }));

            setTowers(prev => prev.map(t => {

              if (topTargets.some(target => target.id === t.id)) {

                const towerDamage = Math.floor(actualCard.damage * 0.3);

                return { ...t, hp: t.hp - towerDamage };

              }

              return t;

            }));

          }

        } else if (actualCard.id === 'zap') {

          spellType = 'zap_spell';

          const zapRadius = actualCard.radius || 35;

          const zapDamage = actualCard.damage;

          const zapStun = (actualCard.stun || 0.5) * 1000;



          // Apply damage and stun immediately

          setUnits(prev => prev.map(u => {

            if (u.isOpponent !== isOpponent) {

              const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));

              if (dist <= zapRadius) {

                return { ...u, hp: u.hp - zapDamage, stunUntil: Date.now() + zapStun, wasStunned: true };

              }

            }

            return u;

          }));



          setTowers(prev => prev.map(t => {

            if (t.isOpponent !== isOpponent && t.hp > 0) {

              const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));

              if (dist <= zapRadius) {

                const towerDamage = Math.floor(zapDamage * 0.3);

                return { ...t, hp: t.hp - towerDamage, stunUntil: Date.now() + zapStun, wasStunned: true };

              }

            }

            return t;

          }));



          // Add visual effect

          setVisualEffects(prev => [...prev, {

            id: Date.now(),

            type: 'zap_aura',

            x, y,

            radius: zapRadius,

            startTime: Date.now(),

            duration: 500

          }]);



        } else if (actualCard.id === 'the_log') {

          spellType = 'the_log';

          // The Log starts WHERE you deploy it, then rolls FORWARD
          // Player (bottom): starts at deploy position, rolls UP (towards Y=0)
          // Opponent (top): starts at deploy position, rolls DOWN (towards Y=height)
          startX = x;
          startY = y;
          // Store the direction for damage calculation
          const logDirection = isOpponent ? 1 : -1; // 1 = down, -1 = up
          const logDistance = 150; // How far the log rolls

          // Calculate target position based on direction
          const targetY = y + (logDirection * logDistance);

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: startX, y: startY, targetX: x, targetY: targetY,

            speed: 15, damage: actualCard.damage, radius: actualCard.radius,

            type: spellType, isSpell: true, stun: actualCard.stun || 0,

            duration: actualCard.duration || 0, hit: false, spawnTime: Date.now(),

            isOpponent,

            knockback: actualCard.knockback || 0,

            splash: false, // Not splash, uses rectangular path damage

            isLog: true, // Special flag for log damage

            logStartY: startY,
            logEndY: targetY,

            y: startY

          }]);

        } else if (actualCard.id === 'poison') {

          spellType = 'poison_spell';

          spellSpeed = 100;

          startX = x; startY = y;

        } else if (actualCard.id === 'rocket') {

          spellType = 'rocket_spell';

          startY = isOpponent ? 0 : height;

          spellSpeed = 12;

        } else if (actualCard.id === 'goblin_barrel') {

          spellType = 'goblin_barrel_spell';

          spellSpeed = 25;

          startX = x; startY = isOpponent ? 0 : 0;

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: startX, y: startY, targetX: x, targetY: y,

            speed: spellSpeed, damage: 0, radius: actualCard.radius,

            type: spellType, isSpell: true, hit: false, spawnTime: Date.now(),

            isGoblinBarrel: true, spawns: actualCard.spawns, spawnCount: actualCard.spawnCount || 3, isOpponent

          }]);

        } else if (actualCard.id === 'earthquake') {

          spellType = 'earthquake_spell';

          spellSpeed = 100;

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: x, y: y, targetX: x, targetY: y,

            speed: spellSpeed, damage: actualCard.damage, radius: actualCard.radius,

            type: spellType, isSpell: true, stun: actualCard.stun || 0,

            duration: actualCard.duration || 0, hit: true, spawnTime: Date.now(),

            slow: actualCard.slow, isOpponent

          }]);

          setScreenShake({ intensity: 1.0, duration: 500 });

        } else if (actualCard.id === 'graveyard') {

          spellType = 'graveyard_spell';

          spellSpeed = 100;

          setUnits(prev => [...prev, {

            id: 'graveyard_' + Date.now(), x: x, y: y, hp: 9999, maxHp: 9999,

            isOpponent, speed: 0, lane: x < width / 2 ? 'LEFT' : 'RIGHT',

            lastAttack: 0, spriteId: 'graveyard_zone', type: 'graveyard_zone',

            range: 0, damage: 0, attackSpeed: 0, spawns: actualCard.spawns,

            spawnRate: 0.5, spawnCount: 1, lastSpawn: Date.now(), lifetimeDuration: 10,

            spawnTime: Date.now(), totalToSpawn: 20, spawnedSoFar: 0, isZone: true, radius: actualCard.radius

          }]);

        } else if (actualCard.id === 'clone') {

          // Clone spell - duplicate all units in radius
          const cloneRadius = actualCard.radius || 35;

          setUnits(prevUnits => {
            const newClones = prevUnits.filter(unit => {
              const dx = unit.x - x;
              const dy = unit.y - y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance <= cloneRadius && !unit.isOpponent && unit.type !== 'building';
            }).map(unit => ({
              ...unit,
              id: 'clone_' + Date.now() + '_' + Math.random(),
              x: unit.x + (Math.random() * 20 - 10),
              y: unit.y + (Math.random() * 20 - 10),
              hp: 1, // Clones have only 1 HP
              maxHp: 1,
              isClone: true,
              cloneEndTime: Date.now() + (actualCard.cloneDuration || 10) * 1000
            }));
            return [...prevUnits, ...newClones];
          });

          // Add visual effect
          setVisualEffects(prev => [...prev, {
            id: Date.now(),
            type: 'clone_spell',
            x, y,
            radius: cloneRadius,
            startTime: Date.now(),
            duration: 1000
          }]);

        } else if (actualCard.id === 'freeze') {
          // Freeze spell - freeze all enemies in radius for X seconds
          const freezeRadius = actualCard.radius || 50;
          const freezeDuration = (actualCard.freezeDuration || 4) * 1000;

          // Freeze all enemy units in radius
          setUnits(prev => prev.map(u => {
            if (u.isOpponent !== isOpponent) {
              const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));
              if (dist <= freezeRadius) {
                return { ...u, hp: u.hp - (actualCard.damage || 0), freezeUntil: Date.now() + freezeDuration };
              }
            }
            return u;
          }));

          // Freeze enemy towers in radius
          setTowers(prev => prev.map(t => {
            if (t.isOpponent !== isOpponent && t.hp > 0) {
              const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));
              if (dist <= freezeRadius + 30) {
                const towerDamage = Math.floor((actualCard.damage || 0) * 0.3);
                return { ...t, hp: t.hp - towerDamage, freezeUntil: Date.now() + freezeDuration };
              }
            }
            return t;
          }));

          // Add visual effect
          setVisualEffects(prev => [...prev, {
            id: Date.now(),
            type: 'freeze_spell',
            x, y,
            radius: freezeRadius,
            startTime: Date.now(),
            duration: freezeDuration
          }]);

        } else if (actualCard.id === 'rage') {
          // Rage spell - boost allies' speed and attack in radius
          const rageRadius = actualCard.radius || 60;
          const rageDuration = (actualCard.rageDuration || 7) * 1000;
          const rageBoost = actualCard.rageBoost || 0.35;

          // Apply rage to all friendly units in radius
          setUnits(prev => prev.map(u => {
            if (u.isOpponent === isOpponent) {
              const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));
              if (dist <= rageRadius) {
                return { ...u, rageUntil: Date.now() + rageDuration, rageBoost: rageBoost };
              }
            }
            return u;
          }));

          // Add visual rage zone effect (persists for duration)
          setProjectiles(prev => [...prev, {
            id: Date.now(), x: x, y: y, targetX: x, targetY: y,
            speed: 0, damage: 0, radius: rageRadius,
            type: 'rage_zone', isSpell: true, hit: true, spawnTime: Date.now(),
            isRage: true, duration: rageDuration / 1000, isOpponent, rageBoost: rageBoost
          }]);

          // NOTE: Snowball travels as projectile - damage handled in projectile hit code
          // No instant handler needed here

        } else if (actualCard.id === 'tornado') {
          // Tornado spell - pull enemies toward center
          const tornadoRadius = actualCard.radius || 60;
          const pullStrength = actualCard.pullStrength || 100;

          // Create tornado zone that persists and pulls enemies
          setProjectiles(prev => [...prev, {
            id: Date.now(), x: x, y: y, targetX: x, targetY: y,
            speed: 0, damage: actualCard.damage || 0, radius: tornadoRadius,
            type: 'tornado_zone', isSpell: true, hit: true, spawnTime: Date.now(),
            isTornado: true, duration: actualCard.duration || 1, isOpponent, pullStrength: pullStrength
          }]);

        } else if (actualCard.id === 'barb_barrel') {
          // Barb Barrel - rolls forward like The Log, spawns barbarian at end
          spellType = 'barb_barrel';

          // Same pattern as The Log but shorter distance and no knockback
          startX = x;
          startY = y;
          const logDirection = isOpponent ? 1 : -1; // 1 = down, -1 = up
          const rollDistance = 100; // Shorter than log's 150

          const targetY = y + (logDirection * rollDistance);

          setProjectiles(prev => [...prev, {
            id: Date.now(), x: startX, y: startY, targetX: x, targetY: targetY,
            speed: 12, damage: actualCard.damage, radius: actualCard.radius,
            type: 'barb_barrel', isSpell: true, stun: 0,
            duration: 0, hit: false, spawnTime: Date.now(),
            isOpponent,
            knockback: 0, // No knockback unlike The Log
            splash: false,
            isLog: true, // Use same damage processing as Log
            isBarrel: true, // Flag to spawn barbarian at end
            logStartY: startY,
            logEndY: targetY,
            spawns: 'barbarian_single',
            y: startY
          }]);

        } else if (actualCard.id === 'royal_delivery') {
          // Royal Delivery - Delayed falling box from King Tower
          const spawnDelay = actualCard.spawnDelay || 3000;

          // Start from King Tower
          const startX = width / 2;
          const startY = isOpponent ? 60 : height - 60;

          // Create projectile launching from King Tower
          setProjectiles(prev => [...prev, {
            id: Date.now(),
            x: startX,
            y: startY,
            startX: startX,
            startY: startY,
            targetX: x,
            targetY: y,
            speed: 0, // Custom movement logic
            damage: actualCard.damage,
            radius: actualCard.radius || 45,
            type: 'royal_delivery_box', isSpell: true,
            duration: spawnDelay / 1000,
            hit: false, spawnTime: Date.now(), isOpponent,
            isDelivery: true,
            spawns: 'royal_recruit_single',
            knockback: 15
          }]);

        }



        const isPoison = actualCard.id === 'poison';

        if (actualCard.id !== 'lightning' && actualCard.id !== 'goblin_barrel' && actualCard.id !== 'graveyard' && actualCard.id !== 'earthquake' && actualCard.id !== 'zap' && actualCard.id !== 'clone' && actualCard.id !== 'freeze' && actualCard.id !== 'rage' && actualCard.id !== 'tornado' && actualCard.id !== 'barb_barrel' && actualCard.id !== 'royal_delivery') {

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: startX, y: startY, targetX: x, targetY: y,

            speed: spellSpeed, damage: actualCard.damage, radius: actualCard.radius,

            type: spellType, isSpell: true, stun: actualCard.stun || 0,

            duration: actualCard.duration || 0, hit: isPoison, spawnTime: Date.now(),

            isPoison, isOpponent,

            knockback: actualCard.knockback || 0,

            splash: actualCard.id === 'fireball' || actualCard.id === 'the_log', // These spells do splash damage

            y: startY // Store starting Y for knockback calculation

          }]);

        }

      } else {

        const lane = x < width / 2 ? 'LEFT' : 'RIGHT';

        const count = actualCard.count || 1;

        const newUnits = [];

        for (let i = 0; i < count; i++) {

          let offsetX = count > 1 ? (Math.random() * 20 - 10) : 0;

          let offsetY = count > 1 ? (Math.random() * 20 - 10) : 0;

          // Royal Recruits - spread across the player's area horizontally
          if (actualCard.splitSpawn && count > 1) {
            // Spread horizontally across the player's side
            // 7 recruits spread from left to right
            const spreadWidth = 120; // Total spread width
            const horizontalPos = (i / (count - 1)) * spreadWidth - (spreadWidth / 2);
            offsetX = horizontalPos;
            // Small vertical offset for variety
            offsetY = (Math.random() * 40 - 20);
          }

          let unitLane = lane;

          let spawnX = x + offsetX;

          let spawnY = y + offsetY;

          // LANE CENTERING: Pull spawn position towards center of lane
          const laneCenter = lane === 'LEFT' ? 95 : width - 95;
          const distFromCenter = spawnX - laneCenter;
          spawnX -= distFromCenter * 0.3; // Pull 30% towards center

          // MINER: Starts at player's side, travels underground to deployment position
          let targetX = x + offsetX;
          let targetY = y + offsetY;

          if (actualCard.id === 'miner') {
            // Miner starts from behind player's towers
            spawnY = isOpponent ? height * 0.1 : height * 0.9; // Behind player's towers
            // Keep X in the same lane as deployment
            spawnX = x;
          }

          if (actualCard.id === 'three_musketeers' && count === 3) {

            if (i < 2) unitLane = lane;

            else {

              unitLane = lane === 'LEFT' ? 'RIGHT' : 'LEFT';

              spawnX = unitLane === 'LEFT' ? 70 + offsetX : width - 70 + offsetX;

            }

          }

          newUnits.push({

            id: Date.now() + i + (isOpponent ? 10000 : 0),

            x: spawnX, y: spawnY, hp: actualCard.hp, maxHp: actualCard.hp,

            isOpponent, speed: actualCard.speed, lane: unitLane,

            lastAttack: 0, spriteId: actualCard.id, type: actualCard.type,

            range: actualCard.range, damage: actualCard.damage,

            attackSpeed: actualCard.attackSpeed, projectile: actualCard.projectile,

            targetType: actualCard.targetType,

            charge: actualCard.charge ? { active: false, distance: 0, threshold: 2 } : undefined,

            chargeState: actualCard.chargeTime ? { startTime: Date.now(), duration: actualCard.chargeTime, isCharged: false } : undefined,

            hidden: actualCard.hidden ? { active: true, visibleHp: actualCard.hp } : undefined,

            burrowing: actualCard.burrows ? { active: true, startTime: Date.now(), targetX, targetY } : undefined,

            deployAnywhere: actualCard.deployAnywhere || false,

            splash: actualCard.splash || false,

            frontalSplash: actualCard.frontalSplash || false,

            spawnDamage: actualCard.spawnDamage || undefined,

            spawns: actualCard.spawns || undefined,

            spawnRate: actualCard.spawnRate || undefined,

            spawnCount: actualCard.spawnCount || undefined,

            deathSpawnCount: actualCard.deathSpawnCount || undefined,

            deathSpawns: actualCard.deathSpawns || undefined,

            lastSpawn: actualCard.spawnRate ? Date.now() : 0,

            lifetimeDuration: actualCard.lifetime || undefined,

            spawnTime: Date.now(),

            spawnDelay: actualCard.spawnDelay || 0,

            jumps: actualCard.jumps || false,

            slow: actualCard.slow || 0,

            slowUntil: 0, stunUntil: 0, baseDamage: actualCard.damage,

            lockedTarget: null, wasPushed: false, wasStunned: false,

            kamikaze: actualCard.kamikaze || false,

            chain: actualCard.chain || 0,

            healsOnAttack: actualCard.healsOnAttack || 0,

            healRadius: actualCard.healRadius || 0,

            passiveHeal: actualCard.passiveHeal || 0,

            deathRage: actualCard.deathRage || false,

            generatesElixir: actualCard.generatesElixir || false,

            elixirGenerationTime: 0,

            hasShield: actualCard.hasShield || false,

            currentShieldHp: actualCard.shieldHp || 0,

            shieldHp: actualCard.shieldHp || 0,

            deathDamage: actualCard.deathDamage || 0,

            deathRadius: actualCard.deathRadius || 0,

            deathSlow: actualCard.deathSlow || 0,

            dashInvincible: actualCard.dashInvincible || false,

            dashRange: actualCard.dashRange || 80,

            recoil: actualCard.recoil || 0,

            stopsToAttack: actualCard.stopsToAttack || false,

            turnsToPig: actualCard.turnsToPig || false,

            extraProjectiles: actualCard.extraProjectiles || 0,

            isDashing: false, dashEndTime: 0,

            damageRamp: actualCard.damageRamp || false,

            currentDamageBonus: 0, lastDamageRampTime: Date.now(),

            lastTargetId: null, bombDrops: actualCard.bombDrops || false,

            lastBombDrop: Date.now(), shotgunSpread: actualCard.shotgunSpread || false,

            pierce: actualCard.pierce || false,

            givesOpponentElixir: actualCard.givesOpponentElixir || false,

            spawnsExtra: actualCard.spawnsExtra || undefined,

            extraCount: actualCard.extraCount || 0,

            revivesAsEgg: actualCard.revivesAsEgg || false,

            eggHp: actualCard.eggHp || 0,

            eggDuration: actualCard.eggDuration || 3000,

            hatchTime: actualCard.hatchDuration ? Date.now() + actualCard.hatchDuration : undefined,

            hatchesInto: actualCard.hatchesInto || undefined

          });

        }

        if (actualCard.id === 'elixir_golem' || actualCard.deathSpawns) {
          console.log('[SPAWN]', actualCard.id, 'deathSpawns:', actualCard.deathSpawns, 'count:', actualCard.deathSpawnCount);
        }

        setUnits(prev => [...(prev || []), ...newUnits]);

        // Rascals - spawn girls instantly behind the boy
        if (actualCard.spawnsExtra && actualCard.extraCount > 0) {
          const extraCard = CARDS.find(c => c.id === actualCard.spawnsExtra);
          if (extraCard) {
            const extraUnits = [];
            // Girls spawn behind the boy (towards their own side)
            // Player's girls spawn below (positive Y offset), opponent's spawn above (negative Y offset)
            const behindOffset = isOpponent ? -30 : 30;

            for (let i = 0; i < actualCard.extraCount; i++) {
              // Spread girls horizontally behind the boy
              const horizontalOffset = (i === 0 ? -20 : 20); // Left girl and right girl
              extraUnits.push({
                id: 'rascal_girl_' + Date.now() + '_' + i,
                x: x + horizontalOffset,
                y: y + behindOffset,
                hp: extraCard.hp,
                maxHp: extraCard.hp,
                isOpponent: isOpponent,
                speed: extraCard.speed,
                lane: x < width / 2 ? 'LEFT' : 'RIGHT',
                lastAttack: 0,
                spriteId: extraCard.id,
                type: extraCard.type,
                range: extraCard.range,
                damage: extraCard.damage,
                attackSpeed: extraCard.attackSpeed,
                projectile: extraCard.projectile,
                spawnTime: Date.now() - 2000 // Already ready to attack
              });
            }
            setUnits(prev => [...(prev || []), ...extraUnits]);
          }
        }

        // Miner burrowing visual - dirt going into ground at spawn point (player's bridge)
        if (actualCard.id === 'miner') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'miner_burrow',
            x: spawnX,
            y: spawnY,
            radius: 50,
            startTime: Date.now(),
            duration: 1000
          }]);
        }

        if (actualCard.id === 'electro_wizard' || actualCard.id === 'mega_knight') {

          const spawnZapRange = actualCard.id === 'mega_knight' ? 80 : 60;

          const spawnZapDamage = actualCard.spawnDamage || actualCard.damage;

          const stunDuration = actualCard.stun || (actualCard.id === 'mega_knight' ? 0 : 0.5);

          const knockbackForce = actualCard.id === 'mega_knight' ? 40 : 0;

          setUnits(prevUnits => prevUnits.map(u => {

            if (u.isOpponent === isOpponent) return u;

            const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));

            if (dist <= spawnZapRange) {

              if (actualCard.id === 'electro_wizard') {

                setProjectiles(prevProjs => [...prevProjs, {

                  id: Date.now() + Math.random(), x, y, targetX: u.x, targetY: u.y,

                  speed: 50, damage: 0, type: 'electric_bolt', stun: stunDuration,

                  isSpell: true, hit: true, spawnZap: true, isOpponent

                }]);

              }

              let newX = u.x; let newY = u.y;

              if (knockbackForce > 0) {
                const angle = Math.atan2(u.y - y, u.x - x);
                let nX = u.x + Math.cos(angle) * knockbackForce;
                let nY = u.y + Math.sin(angle) * knockbackForce;

                // River collision during knockback
                const rY = height / 2;
                const distR = Math.abs(nY - rY);
                const bW = 60;
                const lBX = 95;
                const rBX = width - 95;
                const onB = (Math.abs(nX - lBX) < bW / 2) || (Math.abs(nX - rBX) < bW / 2);

                const isFlyingOrJumping = u.jumps || u.type === 'flying';
                if (distR < 25 && !onB && !isFlyingOrJumping) {
                  nY = rY + (u.y < rY ? -25 : 25);
                }

                newX = Math.max(10, Math.min(width - 10, nX));
                newY = Math.max(10, Math.min(height - 10, nY));
              }

              return { ...u, x: newX, y: newY, hp: u.hp - spawnZapDamage, stunUntil: stunDuration > 0 ? Date.now() + (stunDuration * 1000) : u.stunUntil, wasStunned: stunDuration > 0, wasPushed: knockbackForce > 0 };

            }

            return u;

          }));

        }

      }



      if (!isOpponent) setLastPlayedCard(actualCard);

      else setEnemyLastPlayedCard(actualCard);



      setTargetHand(currentHand => {

        const newHand = [...currentHand];

        const cardIndex = newHand.findIndex(c => c.id === card.id);

        if (cardIndex !== -1) newHand.splice(cardIndex, 1);

        newHand.push(nextCardToUse);

        return newHand;

      });



      setTargetQueue(currentQueue => {

        const newQueue = [...currentQueue];

        const newNext = newQueue.shift();

        if (card.id !== 'mirror') newQueue.push(card);

        setTargetNext(newNext);

        return newQueue;

      });



      return newElixir;

    });

  };

  const spawnTestEnemy = () => {
    if (gameOver) return;
    const lane = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    const laneX = lane === 'LEFT' ? 70 : width - 70;

    const types = ['knight', 'giant', 'spear_goblins', 'archers', 'musketeer'];
    const type = types[Math.floor(Math.random() * types.length)];
    const stats = CARDS.find(c => c.id === type) || CARDS[0];

    const count = stats.count || 1;
    const newUnits = [];

    for (let i = 0; i < count; i++) {
      const offsetX = count > 1 ? (Math.random() * 40 - 20) : 0;
      const offsetY = count > 1 ? (Math.random() * 40 - 20) : 0;

      newUnits.push({
        id: Date.now() + i,
        x: laneX + offsetX,
        y: 50 + offsetY,
        hp: stats.hp,
        maxHp: stats.hp,
        isOpponent: true,
        speed: stats.speed,
        lane: lane,
        lastAttack: 0,
        spriteId: type,
        range: stats.range,
        damage: stats.damage,
        attackSpeed: stats.attackSpeed,
        projectile: stats.projectile,
        targetType: stats.targetType,
        // Special properties
        charge: stats.charge ? { active: false, distance: 0, threshold: 4 } : undefined,
        hidden: stats.hidden ? { active: true, visibleHp: stats.hp } : undefined,
        splash: stats.splash || false,
        jumps: stats.jumps || false,  // Hog Rider can jump over river
        spawns: stats.spawns,
        spawnRate: stats.spawnRate,
        spawnCount: stats.spawnCount,
        deathSpawnCount: stats.deathSpawnCount,
        lastSpawn: stats.spawnRate ? Date.now() : 0,
        lifetimeDuration: stats.lifetime,  // Store lifetime duration in seconds
        spawnTime: Date.now(),  // Track when building was spawned for HP depreciation
        maxHp: stats.hp,  // Store initial max HP for depreciation calculation
        stunUntil: 0,
        baseDamage: stats.damage,
        lockedTarget: null,
        wasPushed: false,
        wasStunned: false
      });
    }
    setUnits(prev => [...(prev || []), ...newUnits]);
  };

  // Chest State
  const [chests, setChests] = useState([
    { id: 'chest_0', slotIndex: 0, type: 'SUPER MAGICAL', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
    { id: 'chest_1', slotIndex: 1, type: 'GOLD', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
    { id: 'chest_2', slotIndex: 2, type: 'GIANT', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
    { id: 'chest_3', slotIndex: 3, type: 'MAGICAL', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
  ]);

  // Chest Timer Logic - Disabled (All chests instant)
  useEffect(() => {
    // Chests are now instant, no timer needed
  }, []);

  const handleUnlockChest = (chestToUnlock) => {
    // All chests are already unlocked in this version
    setChests(prev => prev.map(c => {
      if (c.id === chestToUnlock.id) {
        return { ...c, state: 'UNLOCKED', timeLeft: 0 };
      }
      return c;
    }));
  };

  const handleOpenChest = (chestToOpen) => {
    setOpeningChest(chestToOpen);
  };

  const handleCollectRewards = () => {
    if (openingChest) {
      // Remove chest from slot
      setChests(prev => prev.filter(c => c.id !== openingChest.id));
      setOpeningChest(null);
    }
  };

  const handleFriendlyBattle = () => {
    setFriendlyModalVisible(true);
  };

  const startFriendlyMatch = () => {
    setFriendlyModalVisible(false);
    resetGame();
    setInLobby(false);
    setInGame(true);
    // In a real app, we would set a flag for friendly mode here
  };

  const checkWinner = () => {
    const playerTowers = towersRef.current.filter(t => !t.isOpponent && t.hp > 0).length;
    const opponentTowers = towersRef.current.filter(t => t.isOpponent && t.hp > 0).length;

    let result = 'DRAW';
    if (playerTowers > opponentTowers) result = 'VICTORY';
    else if (opponentTowers > playerTowers) result = 'DEFEAT';

    setGameOver(result);

    // Reward Chest on Victory
    if (result === 'VICTORY') {
      setChests(prev => {
        // Find first empty slot (0-3)
        const occupiedSlots = prev.map(c => c.slotIndex);
        let emptySlot = -1;
        for (let i = 0; i < 4; i++) {
          if (!occupiedSlots.includes(i)) {
            emptySlot = i;
            break;
          }
        }

        if (emptySlot !== -1) {
          const chestTypes = ['SILVER', 'SILVER', 'SILVER', 'GOLD', 'GIANT', 'MAGICAL'];
          const randomType = chestTypes[Math.floor(Math.random() * chestTypes.length)];
          let unlockTime = 3 * 60 * 60; // Silver default
          if (randomType === 'GOLD') unlockTime = 8 * 60 * 60;
          if (randomType === 'GIANT' || randomType === 'MAGICAL') unlockTime = 12 * 60 * 60;

          const newChest = {
            id: `chest_${Date.now()}`,
            slotIndex: emptySlot,
            type: randomType,
            state: 'UNLOCKED',
            unlockTime: 0,
            timeLeft: 0
          }; return [...prev, newChest];
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    if (!inGame || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          checkWinner();
          return 0;
        }
        // Check for double elixir activation at 60 seconds (2 minutes into match)
        if (prev === 60 && !doubleElixirTriggeredRef.current) {
          doubleElixirTriggeredRef.current = true;
          setIsDoubleElixir(true);
          setShowDoubleElixirAlert(true);
          // Hide alert after 3 seconds
          setTimeout(() => setShowDoubleElixirAlert(false), 3000);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [inGame, gameOver]);

  useEffect(() => {
    if (!inGame || gameOver) return;

    const loop = setInterval(() => {
      const now = Date.now();

      // Defensive check: ensure towersRef.current exists and is an array
      const currentTowers = towersRef.current || [];
      let nextTowers = [...currentTowers];

      const playerKing = nextTowers.find(t => !t.isOpponent && t.type === 'king');
      const opponentKing = nextTowers.find(t => t.isOpponent && t.type === 'king');

      if (playerKing && playerKing.hp <= 0) {
        setGameOver('DEFEAT');
        return;
      }
      if (opponentKing && opponentKing.hp <= 0) {
        setGameOver('VICTORY');
        return;
      }

      // Update Score
      const destroyedOpponentTowers = nextTowers.filter(t => t.isOpponent && t.hp <= 0).length;
      const destroyedPlayerTowers = nextTowers.filter(t => !t.isOpponent && t.hp <= 0).length;

      // Only set state if score changed (to avoid infinite loops) - though in this simple interval it might be fine, 
      // best to be safe if we were using refs for score. But here we use functional state updates elsewhere. 
      // Actually, we can just update it.
      setScore([destroyedOpponentTowers, destroyedPlayerTowers]);

      let nextProjectiles = [...projectilesRef.current];

      // Collect splash damage events to apply after unit updates
      let splashEvents = [];
      // Collect units to spawn (will be added at the end)
      let unitsToSpawn = [];
      let damageEvents = [];
      // Spirit card effects
      let healEvents = [];
      let chainEvents = [];

      let currentUnits = (unitsRef.current || []).map(u => {
        // Check if stunned
        const isCurrentlyStunned = u.stunUntil && now < u.stunUntil;
        const wasPreviouslyStunned = u.wasStunned || false;

        // Check if frozen
        const isCurrentlyFrozen = u.freezeUntil && now < u.freezeUntil;

        // If stun just ended, unlock target
        if (wasPreviouslyStunned && !isCurrentlyStunned) {
          u.lockedTarget = null;
          u.wasStunned = false;
        } else if (isCurrentlyStunned) {
          u.wasStunned = true;
          return u; // Can't move or attack while stunned
        }

        // If frozen, can't move or attack
        if (isCurrentlyFrozen) {
          return { ...u, isFrozen: true }; // Return but don't process movement/attacks
        } else if (u.isFrozen) {
          u.isFrozen = false; // Unfreeze when duration ends
        }

        // Check if raged - boost speed and attack
        const isRaged = u.rageUntil && now < u.rageUntil;
        const rageMultiplier = isRaged ? (1 + (u.rageBoost || 0.35)) : 1;
        u.currentRageMultiplier = rageMultiplier; // Store for attack speed calculation

        // Jump Attack Processing (Spirits)
        if (u.isJumpingAttack) {
          const jumpDuration = 300; // ms
          const progress = Math.min(1, (now - u.jumpStartTime) / jumpDuration);

          // Lerp position
          const newX = u.jumpStartX + (u.jumpTargetX - u.jumpStartX) * progress;
          const newY = u.jumpStartY + (u.jumpTargetY - u.jumpStartY) * progress;

          if (progress >= 1) {
            // Landed! Apply effects
            const target = (unitsRef.current || []).find(t => t.id === u.jumpTargetId) ||
              (nextTowers || []).find(t => t.id === u.jumpTargetId);

            // Even if target died, spirits often splash area. But let's assume we hit the location.
            const hitX = u.jumpTargetX;
            const hitY = u.jumpTargetY;
            const damage = u.damage;

            // Fire Spirit / Splash
            if (u.splash) {
              splashEvents.push({
                attacker: u,
                targetX: hitX,
                targetY: hitY,
                damage: damage,
                stun: u.stun || 0
              });
              // Visual - different for Ice Spirit vs Fire Spirit
              const visualType = u.spriteId === 'ice_spirit' ? 'ice_freeze' : 'fire_explosion';
              const visualRadius = u.spriteId === 'ice_spirit' ? 40 : 50;
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: visualType,
                x: hitX,
                y: hitY,
                radius: visualRadius,
                startTime: Date.now(),
                duration: 600
              }]);
            } else if (target) {
              // Single target damage if not splash (though most spirits are splash or special)
              // Ice Spirit is splash too? Actually Ice Spirit IS splash in CR.
              // My data says Ice Spirit splash: true. So handled above.
              // What about non-splash spirits? (None currently).
              // Just in case:
              if (target.id >= 100) { // Unit
                damageEvents.push({ targetId: target.id, damage: damage, attackerId: u.id });
              } else { // Tower
                // Modify tower directly in nextTowers? Can't do that easily here as we are iterating units.
                // We'll use damageEvents for units, but for towers we might need a separate queue or handle it in the tower loop.
                // Actually, existing damageEvents logic only handles units.
                // Let's add a `towerDamageEvents` or just apply it to `nextTowers` via a lookup later?
                // Easier: Add a special `projectile` style hit event that creates a "hit" that resolves immediately.
                // Or just find the tower in `nextTowers` index and update it.
                const tIndex = nextTowers.findIndex(t => t.id === target.id);
                if (tIndex !== -1) {
                  nextTowers[tIndex].hp -= damage;
                }
              }
            }

            // Ice Spirit Freeze (stun)
            if (u.stun && u.stun > 0) {
              // Apply to area if splash, or target
              const affectRadius = 50;
              const isIceSpirit = u.spriteId === 'ice_spirit';
              // Units
              currentUnits.forEach(unit => {
                if (unit.isOpponent !== u.isOpponent && unit.hp > 0) {
                  const dist = Math.sqrt(Math.pow(unit.x - hitX, 2) + Math.pow(unit.y - hitY, 2));
                  if (dist <= affectRadius) {
                    unit.stunUntil = now + (u.stun * 1000);
                    unit.wasStunned = true;
                    // Ice Spirit applies freeze visual (same as Freeze spell)
                    if (isIceSpirit) {
                      unit.freezeUntil = now + (u.stun * 1000);
                    }
                  }
                }
              });
              // Towers
              nextTowers.forEach(tower => {
                if (tower.isOpponent !== u.isOpponent && tower.hp > 0) {
                  const dist = Math.sqrt(Math.pow(tower.x - hitX, 2) + Math.pow(tower.y - hitY, 2));
                  if (dist <= affectRadius + 20) {
                    tower.stunUntil = now + (u.stun * 1000);
                    // Ice Spirit applies freeze visual to towers too
                    if (isIceSpirit) {
                      tower.freezeUntil = now + (u.stun * 1000);
                    }
                  }
                }
              });
              // Visual
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'ice_freeze',
                x: hitX,
                y: hitY,
                radius: 40,
                startTime: Date.now(),
                duration: 800
              }]);
            }

            // Heal Spirit
            if (u.healsOnAttack > 0) {
              healEvents.push({
                x: hitX,
                y: hitY,
                radius: u.healRadius,
                amount: u.healsOnAttack,
                isOpponent: u.isOpponent
              });
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'heal_glow',
                x: hitX,
                y: hitY,
                radius: u.healRadius,
                startTime: Date.now(),
                duration: 600
              }]);
            }

            // Electro Spirit Chain
            if (u.chain > 0 && target) {
              chainEvents.push({
                attackerId: u.id,
                primaryTarget: target,
                chainCount: Math.min(u.chain - 1, 3),
                damage: damage,
                stun: u.stun || 0,
                isOpponent: u.isOpponent,
                startX: hitX,
                startY: hitY
              });
            }

            return { ...u, x: newX, y: newY, hp: 0 }; // Die
          }

          return { ...u, x: newX, y: newY };
        }

        // Passive Healing (Battle Healer)
        if (u.passiveHeal && u.passiveHeal > 0) {
          const lastPassiveHeal = u.lastPassiveHeal || u.spawnTime;
          if (now - lastPassiveHeal >= 1000) {
            u.hp = Math.min(u.maxHp, u.hp + u.passiveHeal);
            u.lastPassiveHeal = now;

            // Visual effect for passive heal
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'heal_glow',
              x: u.x,
              y: u.y,
              radius: 20,
              startTime: Date.now(),
              duration: 400
            }]);
          }
        }

        // Check building lifetime - depreciate HP over time
        if (u.lifetimeDuration && u.spawnTime && u.maxHp) {
          const elapsedSeconds = (now - u.spawnTime) / 1000;
          const hpLostPerSecond = u.maxHp / u.lifetimeDuration;
          const hpLostTotal = Math.floor(elapsedSeconds * hpLostPerSecond);
          const currentHpFromDepreciation = Math.max(0, u.maxHp - hpLostTotal);
          // Use the lower of current HP or depreciation HP
          if (currentHpFromDepreciation < u.hp) {
            return { ...u, hp: currentHpFromDepreciation };
          }
        }

        // Handle Elixir generation (Elixir Collector)
        if (u.generatesElixir && u.elixirGenerationTime !== undefined) {
          const timeSinceLastGen = (now - u.elixirGenerationTime) / 1000;
          const elixirGenRate = 10.5; // Generate 1 elixir every 10.5 seconds (93s lifetime / 8 elixir)

          if (timeSinceLastGen >= elixirGenRate) {
            // Generate elixir for the owner
            if (u.isOpponent) {
              setEnemyElixir(prev => Math.min(10, prev + 1));
            } else {
              setElixir(prev => Math.min(10, prev + 1));
            }

            // Visual effect for elixir generation
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'elixir_popup',
              x: u.x,
              y: u.y - 20,
              value: '+1',
              startTime: Date.now(),
              duration: 800
            }]);

            return { ...u, elixirGenerationTime: now };
          }
        }

        // Handle periodic spawning (Tombstone spawns skeletons every spawnRate seconds)
        if (u.spawns && u.spawnRate && u.lastSpawn !== undefined) {
          // Check if we've reached the spawn limit (for graveyard)
          const maxSpawned = u.totalToSpawn || Infinity;
          const spawnedSoFar = u.spawnedSoFar || 0;

          if (spawnedSoFar < maxSpawned) {
            const timeSinceLastSpawn = (now - u.lastSpawn) / 1000; // Convert to seconds
            if (timeSinceLastSpawn >= u.spawnRate) {
              // Spawn the units
              const spawnCardId = u.spawns;
              const spawnCard = CARDS.find(c => c.id === spawnCardId);

              if (spawnCard) {
                const newSpawns = [];
                // Use unit's spawnCount if defined, otherwise fall back to spawn card's count
                let spawnCount = u.spawnCount || spawnCard.count || 1;

                // Limit spawn count to not exceed totalToSpawn
                if (spawnedSoFar + spawnCount > maxSpawned) {
                  spawnCount = maxSpawned - spawnedSoFar;
                }

                for (let i = 0; i < spawnCount; i++) {
                  // Calculate spawn position - ensure skeletons spawn AWAY from parent, not inside
                  // For buildings (speed === 0), spawn in direction toward enemy
                  // For moving units like Witch, spawn around them with minimum distance
                  let offsetX, offsetY;

                  if (u.type === 'graveyard_zone') {
                    // Graveyard: spawn randomly in a 4-tile radius circle (80 pixels)
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 80; // 0-80 pixels from center (4 tiles)
                    offsetX = Math.cos(angle) * distance;
                    offsetY = Math.sin(angle) * distance;
                  } else if (u.speed === 0) {
                    // Building (Tombstone) - spawn skeletons toward enemy side
                    const minOffset = 50;
                    const maxOffset = 80;
                    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45 to +45 degrees from forward
                    const distance = minOffset + Math.random() * (maxOffset - minOffset);
                    offsetX = Math.sin(angle) * distance;
                    // Spawn toward enemy: player buildings spawn up (-Y), opponent buildings spawn down (+Y)
                    offsetY = u.isOpponent ? distance * Math.cos(angle) : -distance * Math.cos(angle);
                  } else {
                    // Moving unit (Witch) - spawn around with minimum distance
                    const minOffset = 50;
                    const maxOffset = 80;
                    const angle = (i / spawnCount) * Math.PI * 2 + Math.random() * 0.5; // Spread evenly around
                    const distance = minOffset + Math.random() * (maxOffset - minOffset);
                    offsetX = Math.cos(angle) * distance;
                    offsetY = Math.sin(angle) * distance;
                  }

                  const spawnX = u.x + offsetX;
                  const spawnY = u.y + offsetY;

                  newSpawns.push({
                    id: Date.now() + Math.random() * 1000 + i,
                    x: spawnX,
                    y: spawnY,
                    hp: spawnCard.hp,
                    maxHp: spawnCard.hp,
                    isOpponent: u.isOpponent,
                    speed: spawnCard.speed,
                    lane: u.lane,
                    lastAttack: 0,
                    spriteId: spawnCard.id,
                    type: spawnCard.type,
                    range: spawnCard.range,
                    damage: spawnCard.damage,
                    attackSpeed: spawnCard.attackSpeed,
                    projectile: spawnCard.projectile,
                    lockedTarget: null,
                    wasPushed: false,
                    wasStunned: false,
                    stunUntil: 0,
                    baseDamage: spawnCard.damage,
                    // Copy special properties from spawnCard
                    kamikaze: spawnCard.kamikaze || false,
                    splash: spawnCard.splash || false,
                    frontalSplash: spawnCard.frontalSplash || false,
                    healsOnAttack: spawnCard.healsOnAttack || 0,
                    healRadius: spawnCard.healRadius || 0,
                    chain: spawnCard.chain || 0,
                    stun: spawnCard.stun || 0,
                    // Shield properties (Guards, Dark Prince)
                    hasShield: spawnCard.hasShield || false,
                    currentShieldHp: spawnCard.shieldHp || 0,
                    shieldHp: spawnCard.shieldHp || 0
                  });
                }

                // Add spawned units to collection (will be added at end of loop)
                unitsToSpawn.push(...newSpawns);

                // Update last spawn time and spawned count
                u.lastSpawn = now;
                u.spawnedSoFar = spawnedSoFar + spawnCount;
              }
            }
          }
        }

        // Handle spawn damage (one-time effect on spawn)
        if (u.spawnDamage && !u.spawnEffectProcessed) {
          u.spawnEffectProcessed = true;
          // Add splash event centered on unit
          splashEvents.push({
            attacker: u,
            targetX: u.x,
            targetY: u.y,
            damage: u.spawnDamage,
            slow: u.slow
          });

          // Mega Knight spawn slam visual effect
          if (u.spriteId === 'mega_knight') {
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'mega_knight_slam',
              x: u.x,
              y: u.y,
              radius: 70,
              startTime: Date.now(),
              duration: 600
            }]);
          }
        }

        // Handle Phoenix Egg hatching
        if (u.hatchesInto && u.hatchTime && now >= u.hatchTime) {
          // Only hatch if the egg is still alive
          if (u.hp > 0) {
            const hatchCard = CARDS.find(c => c.id === u.hatchesInto);
            if (hatchCard) {
              unitsToSpawn.push({
                id: 'phoenix_reborn_' + Date.now(),
                x: u.x,
                y: u.y,
                hp: hatchCard.hp,
                maxHp: hatchCard.hp,
                isOpponent: u.isOpponent,
                speed: hatchCard.speed,
                type: hatchCard.type,
                range: hatchCard.range,
                damage: hatchCard.damage,
                attackSpeed: hatchCard.attackSpeed,
                projectile: hatchCard.projectile,
                lane: u.lane,
                lastAttack: 0,
                spriteId: hatchCard.id,
                spawnTime: Date.now() - 2000,
                splash: hatchCard.splash,
                revivesAsEgg: true,
                eggHp: u.eggHp,
                eggDuration: u.eggDuration
              });
              // Hatch visual effect
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'fire_explosion',
                x: u.x,
                y: u.y,
                radius: 60,
                startTime: Date.now(),
                duration: 600
              }]);
            }
          }
          // Remove the egg (whether it hatched or died)
          return null;
        }

        // Handle Tesla hidden mechanic
        // In real CR: Tesla has full range/damage at all times
        // When hidden: cannot be targeted by enemies
        // When visible (enemies in range): attacks normally
        let actualDamage = u.damage;
        let actualRange = u.range;
        if (u.hidden) {
          if (u.spriteId === 'tesla') {
            // Tesla logic: Uncloak when enemies are near
            const detectionRange = u.range * 1.2;
            const hasEnemyInRange = (unitsRef.current || []).some(enemy =>
              enemy.isOpponent !== u.isOpponent && enemy.hp > 0 &&
              Math.sqrt(Math.pow(enemy.x - u.x, 2) + Math.pow(enemy.y - u.y, 2)) <= detectionRange
            );

            if (!u.hidden.lastCombatTime) u.hidden.lastCombatTime = now;

            if (hasEnemyInRange) {
              u.hidden.lastCombatTime = now;
              if (u.hidden.active) {
                u.hidden.wakeTime = now;
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'tesla_reveal',
                  x: u.x, y: u.y,
                  radius: 50, startTime: Date.now(), duration: 500
                }]);
              }
              u.hidden.active = false;
            } else {
              const timeSinceCombat = (now - u.hidden.lastCombatTime) / 1000;
              if (timeSinceCombat > 3) u.hidden.active = true;
            }
          } else if (u.spriteId === 'royal_ghost') {
            // Royal Ghost logic: Re-cloak 3s after last attack
            const timeSinceAttack = now - (u.hidden.lastAttackTime || 0);
            if (!u.hidden.active && timeSinceAttack > 3000) {
              u.hidden.active = true;
            }
          }
        }

        // Handle Prince charge
        if (u.charge) {
          // Activate charge after traveling 2 tiles
          if (u.charge.distance >= u.charge.threshold && !u.charge.active) {
            u.charge.active = true;
          }

          // If charging, double the damage
          if (u.charge.active) {
            actualDamage = u.damage * 2;
          }
        }

        // Handle spawn delay (Golem, Golemite) - unit cannot move or attack during spawn delay
        if (u.spawnDelay && u.spawnTime) {
          const timeSinceSpawn = now - u.spawnTime;
          if (timeSinceSpawn < u.spawnDelay) {
            // Still in spawn delay - skip all movement and attack logic
            return u;
          }
        }

        // GOBLIN GIANT: Independent spear goblin attacks from his back
        // These attack continuously with their own speed, separate from Giant's melee punch
        if (u.extraProjectiles > 0 && u.spriteId === 'goblin_giant') {
          const spearGoblinCard = CARDS.find(c => c.id === 'spear_goblins');
          if (spearGoblinCard) {
            const lastSpearAttack = u.lastSpearAttack || 0;
            const timeSinceSpearAttack = now - lastSpearAttack;

            // Spear goblins attack every 1100ms (their attack speed), independent of Giant
            if (timeSinceSpearAttack >= spearGoblinCard.attackSpeed) {
              // Find nearest enemy unit for spear goblins to target
              const spearTargets = (unitsRef.current || []).filter(t => t.isOpponent !== u.isOpponent && t.hp > 0 && t.type !== 'building');
              let closestSpearTarget = null;
              let minSpearDist = Infinity;
              spearTargets.forEach(t => {
                const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
                if (dist < minSpearDist && dist <= spearGoblinCard.range * 2) {
                  minSpearDist = dist;
                  closestSpearTarget = t;
                }
              });

              // Shoot extra projectiles (spear goblin attacks) - happens even while Giant is walking!
              if (closestSpearTarget) {
                const spearTarget = closestSpearTarget;
                for (let i = 0; i < u.extraProjectiles; i++) {
                  nextProjectiles.push({
                    id: now + Math.random() + i + spearTarget.id + 1000,
                    x: u.x - 20 + (i * 40), // Slightly offset positions
                    y: u.y - 10,
                    targetId: spearTarget.id,
                    targetX: spearTarget.x,
                    targetY: spearTarget.y,
                    speed: 12,
                    damage: spearGoblinCard.damage,
                    type: 'spear',
                    splash: false,
                    attackerId: u.id,
                    isOpponent: u.isOpponent
                  });
                }
                // Update last spear attack time
                u.lastSpearAttack = now;
              }
            }
          }
        }

        // Defensive check: ensure nextTowers is an array before filtering
        // Initial targets: Only Princess towers (King tower added conditionally below)
        // This applies to ALL units (Ground, Flying, Building-targeters)
        let targets = (nextTowers || []).filter(t =>
          t.isOpponent !== u.isOpponent &&
          t.hp > 0 &&
          t.type === 'princess'
        );

        // King tower becomes targetable when princess tower on that side is destroyed
        // Check if we should add king tower to targets
        const isOpponent = u.isOpponent;
        if (isOpponent) {
          // Opponent unit targeting player towers
          const leftPrincess = nextTowers.find(t => t.id === 4 && t.hp > 0);
          const rightPrincess = nextTowers.find(t => t.id === 5 && t.hp > 0);
          const king = nextTowers.find(t => t.id === 3 && t.hp > 0);

          // If either princess is destroyed, king becomes targetable from anywhere
          if (!leftPrincess || !rightPrincess) {
            if (king) {
              targets.push(king);
            }
          }
        } else {
          // Player unit targeting opponent towers
          const leftPrincess = nextTowers.find(t => t.id === 1 && t.hp > 0);
          const rightPrincess = nextTowers.find(t => t.id === 2 && t.hp > 0);
          const king = nextTowers.find(t => t.id === 0 && t.hp > 0);

          // If either princess is destroyed, king becomes targetable from anywhere
          if (!leftPrincess || !rightPrincess) {
            if (king) {
              targets.push(king);
            }
          }
        }

        // Units that target buildings ONLY (Giant, Hog) ignore other units
        if (u.targetType !== 'buildings') {
          // For other units: PRIORITIZE towers, only target units if no towers in range
          // Use unitsRef.current instead of currentUnits to avoid circular reference
          // Exclude hidden Teslas from targets (they're underground and untargetable)
          // Exclude zones (graveyard) from targets (they're untargetable)
          const unitTargets = (unitsRef.current || []).filter(targetUnit =>
            targetUnit.isOpponent !== u.isOpponent &&
            targetUnit.hp > 0 &&
            !targetUnit.hidden?.active && // Untargetable if hidden (Royal Ghost, Tesla)
            !targetUnit.isZone && // Cannot target zones (graveyard, etc.)
            // Ground melee units cannot target flying units, but ranged units can
            // EXCEPTION: X-Bow targets ground ONLY despite having projectile
            (u.type === 'flying' || (u.projectile && u.spriteId !== 'x_bow') || targetUnit.type !== 'flying')
          );

          // Check if any tower is in range
          const hasTowerInRange = targets.some(t => {
            const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
            return dist <= actualRange + 25;
          });

          // Only add unit targets if no towers are in range
          if (!hasTowerInRange) {
            targets = [...targets, ...unitTargets];
          }
        }

        // LOCKED TARGET MECHANIC
        // If unit has a locked target, check if it's still alive and valid
        if (u.lockedTarget) {
          // Check if locked target still exists and is alive
          const lockedTargetAlive = targets.some(t => t.id === u.lockedTarget);

          // Unlock if: target died or unit was pushed back
          if (!lockedTargetAlive || u.wasPushed) {
            u.lockedTarget = null;
            u.wasPushed = false;
          } else {
            // Keep locked target - filter to only include locked target
            targets = targets.filter(t => t.id === u.lockedTarget);
          }
        }

        let closestTarget = null;
        let minDist = Infinity;

        targets.forEach(t => {
          const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
          if (dist < minDist) {
            minDist = dist;
            closestTarget = t;
          }
        });

        // Electro Wizard split attack - find 2 closest targets
        let closestTarget2 = null;
        let minDist2 = Infinity;
        if (u.spriteId === 'electro_wizard') {
          targets.forEach(t => {
            if (t.id !== closestTarget?.id) {
              const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
              if (dist < minDist2) {
                minDist2 = dist;
                closestTarget2 = t;
              }
            }
          });
        }

        // Bandit Dash - activate dash when entering dash range while moving toward target
        if (u.dashInvincible && u.spriteId === 'bandit' && !u.isDashing && closestTarget && minDist <= (u.dashRange || 80) && minDist > u.range + 10) {
          // Activate dash when within dash range (but not too close)
          u.isDashing = true;
          u.dashEndTime = now + 750; // Dash lasts 750ms
          u.lockedTarget = closestTarget.id; // Lock onto target

          // Visual effect for dash
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'dash_trail',
            x: u.x,
            y: u.y,
            radius: 30,
            startTime: Date.now(),
            duration: 750
          }]);
        }

        if (closestTarget && minDist <= actualRange + 25) {
          // LOCK the target when starting to attack
          if (!u.lockedTarget) {
            u.lockedTarget = closestTarget.id;
          }

          // Inferno Tower & Inferno Dragon Continuous Beam Visual - show every frame while locked on target
          if (u.damageRamp && (u.spriteId === 'inferno_tower' || u.spriteId === 'inferno_dragon')) {
            const beamIntensity = Math.min(1, (u.currentDamageBonus || 0) / 400); // 0 = weak, 1 = max

            setVisualEffects(prev => {
              // Remove old beam from this tower
              const filtered = prev.filter(e => e.attackerId !== u.id || e.type !== 'inferno_beam');

              // Add updated beam
              return [...filtered, {
                id: Date.now() + Math.random(),
                type: 'inferno_beam',
                attackerId: u.id,
                startX: u.x,
                startY: u.y,
                endX: closestTarget.x,
                endY: closestTarget.y,
                intensity: beamIntensity,
                startTime: Date.now(),
                duration: 100 // Short duration, will be refreshed each frame
              }];
            });
          }

          // Electro Giant Shock Aura - show continuously while alive
          if (u.shockOnHit && u.spriteId === 'electro_giant') {
            const shockRadius = u.shockRadius || 50;

            setVisualEffects(prev => {
              // Remove old aura from this giant
              const filtered = prev.filter(e => e.attackerId !== u.id || e.type !== 'electro_aura');

              // Add updated aura
              return [...filtered, {
                id: Date.now() + Math.random(),
                type: 'electro_aura',
                attackerId: u.id,
                x: u.x,
                y: u.y,
                radius: shockRadius,
                startTime: Date.now(),
                duration: 100 // Short duration, will be refreshed each frame
              }];
            });
          }

          const isWakingUp = u.hidden && u.hidden.wakeTime && (now - u.hidden.wakeTime < 500);

          let currentAttackSpeed = u.attackSpeed;
          if (u.slowUntil > now) {
            currentAttackSpeed = u.attackSpeed / (1 - (u.slowAmount || 0.35));
          }
          if (u.rageUntil > now) {
            currentAttackSpeed = u.attackSpeed / 1.35; // 35% faster attack speed
          }

          // Sparky charge check - must be fully charged before attacking
          let canAttackNow = true;
          if (u.chargeState) {
            const timeCharging = now - u.chargeState.startTime;
            if (timeCharging < u.chargeState.duration) {
              canAttackNow = false; // Still charging
            } else if (!u.chargeState.isCharged) {
              // Just finished charging
              u.chargeState.isCharged = true;
            }
          }

          if (now - u.lastAttack > currentAttackSpeed && !isWakingUp && canAttackNow) {
            // Mark that this unit attacked this frame (for recoil mechanic)
            u.justAttacked = true;

            // Reset Sparky charge state after attacking
            if (u.chargeState && u.chargeState.isCharged) {
              u.chargeState.isCharged = false;
              u.chargeState.startTime = now;
            }

            // Calculate damage to deal
            let damageToDeal = actualDamage;

            // Uncloak if hidden (Royal Ghost)
            if (u.hidden && u.hidden.active) {
              u.hidden.active = false;
              u.hidden.lastAttackTime = now;
            }

            // Bandit Dash - deals 2x damage while dashing
            if (u.dashInvincible && u.isDashing && u.spriteId === 'bandit') {
              damageToDeal = actualDamage * 2; // Dash deals 2x damage
            }

            // Inferno Tower Damage Ramp - increases over time
            if (u.damageRamp) {
              const timeRamping = (now - u.lastDamageRampTime) / 1000;
              u.currentDamageBonus = Math.min(350, timeRamping * 60); // Slower ramp, cap at +350
              damageToDeal = actualDamage + u.currentDamageBonus;
            }

            // Hunter Shotgun Spread - damage falls off with distance
            if (u.shotgunSpread) {
              const distToTarget = Math.sqrt(Math.pow(closestTarget.x - u.x, 2) + Math.pow(closestTarget.y - u.y, 2));
              const falloff = Math.max(0.3, 1 - (distToTarget / 150)); // 30% min damage at max range
              damageToDeal = Math.floor(actualDamage * falloff);
            }

            // Note: Witch spawns skeletons via periodic spawn (spawnRate: 7), not attack spawn

            // Electro Wizard split attack - fire at 2 targets
            const targetsToAttack = [closestTarget];
            if (u.spriteId === 'electro_wizard' && closestTarget2 && minDist2 <= actualRange + 25) {
              targetsToAttack.push(closestTarget2);
            }

            if (u.projectile) {
              // Tesla uses lightning - special instant effect
              // X-Bow has very fast arrows
              const projectileType = (u.spriteId === 'tesla') ? 'tesla_lightning' : u.projectile;
              let projectileSpeed = 12; // Default speed
              if (u.spriteId === 'tesla') {
                projectileSpeed = 100; // Instant for Tesla
              } else if (u.spriteId === 'x_bow') {
                projectileSpeed = 50; // Very fast arrows for X-Bow
              }

              // Fire projectiles at all targets
              targetsToAttack.forEach(target => {
                if (u.shotgunSpread) {
                  // Hunter fires 10 bullets in a cone
                  const baseAngle = Math.atan2(target.y - u.y, target.x - u.x);
                  for (let i = -4; i <= 5; i++) {
                    const angle = baseAngle + (i * 0.15); // spread
                    const tX = u.x + Math.cos(angle) * 150;
                    const tY = u.y + Math.sin(angle) * 150;

                    nextProjectiles.push({
                      id: now + Math.random() + i,
                      x: u.x,
                      y: u.y,
                      targetId: null, // Shotgun bullets are location based
                      targetX: tX,
                      targetY: tY,
                      speed: 15,
                      damage: Math.floor(damageToDeal / 10), // Divide total damage by pellet count
                      type: 'bullet', // pellets
                      attackerId: u.id,
                      isOpponent: u.isOpponent
                    });
                  }
                } else if (u.spreadCount && u.spriteId === 'firecracker') {
                  // Firecracker fires 8 rockets in a forward spread pattern
                  const baseAngle = Math.atan2(target.y - u.y, target.x - u.x);
                  const spreadArc = u.spreadArc || 0.5; // Radians of spread
                  const pelletCount = u.spreadCount || 8;

                  for (let i = 0; i < pelletCount; i++) {
                    // Distribute pellets evenly across the arc
                    const angleOffset = -spreadArc / 2 + (spreadArc * i / (pelletCount - 1));
                    const angle = baseAngle + angleOffset;
                    const distance = 200; // Firecrackers shoot far forward
                    const tX = u.x + Math.cos(angle) * distance;
                    const tY = u.y + Math.sin(angle) * distance;

                    nextProjectiles.push({
                      id: now + Math.random() + i,
                      x: u.x,
                      y: u.y,
                      targetId: null, // Firecracker rockets are location based
                      targetX: tX,
                      targetY: tY,
                      speed: 12,
                      damage: Math.floor(damageToDeal / pelletCount), // Divide damage by rocket count
                      type: 'firecracker',
                      splash: true,
                      splashRadius: 25,
                      stun: u.stun || 0,
                      attackerId: u.id,
                      isOpponent: u.isOpponent
                    });
                  }
                } else {
                  nextProjectiles.push({
                    id: now + Math.random() + target.id,
                    x: u.x,
                    y: u.y,
                    targetId: target.id,
                    targetX: target.x,
                    targetY: target.y,
                    speed: projectileSpeed,
                    damage: damageToDeal,
                    type: projectileType,
                    splash: u.splash,
                    slow: u.slow,
                    stun: u.stun,
                    attackerId: u.id,
                    isOpponent: u.isOpponent,
                    pierce: u.pierce || false,
                    chain: u.chain || 0,
                    turnsToPig: u.turnsToPig || false
                  });

                  // Goblin Giant: Extra spear goblin attacks from his back
                  if (u.extraProjectiles > 0) {
                    const spearGoblinCard = CARDS.find(c => c.id === 'spear_goblins');
                    if (spearGoblinCard) {
                      // Find nearest enemy unit for spear goblins to target
                      const spearTargets = currentUnits.filter(t => t.isOpponent !== u.isOpponent && t.hp > 0 && t.type !== 'building');
                      let closestSpearTarget = null;
                      let minSpearDist = Infinity;
                      spearTargets.forEach(t => {
                        const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
                        if (dist < minSpearDist && dist <= spearGoblinCard.range * 2) {
                          minSpearDist = dist;
                          closestSpearTarget = t;
                        }
                      });

                      // Shoot extra projectiles (spear goblin attacks)
                      for (let i = 0; i < u.extraProjectiles; i++) {
                        const spearTarget = closestSpearTarget || target;
                        nextProjectiles.push({
                          id: now + Math.random() + i + target.id + 1000,
                          x: u.x - 20 + (i * 40), // Slightly offset positions
                          y: u.y - 10,
                          targetId: spearTarget.id,
                          targetX: spearTarget.x,
                          targetY: spearTarget.y,
                          speed: 12,
                          damage: spearGoblinCard.damage,
                          type: 'spear',
                          splash: false,
                          attackerId: u.id,
                          isOpponent: u.isOpponent
                        });
                      }
                    }
                  }
                }
              });
            }

            // Firecracker Recoil - push herself back when shooting (after attack logic)
            if (u.recoil && u.justAttacked && closestTarget) {
              const angle = Math.atan2(u.y - closestTarget.y, u.x - closestTarget.x); // Opposite direction
              const recoilDistance = u.recoil || 60;
              let nextRX = u.x + Math.cos(angle) * recoilDistance;
              let nextRY = u.y + Math.sin(angle) * recoilDistance;

              // River collision during recoil
              const rY = height / 2;
              const distR = Math.abs(nextRY - rY);
              const bW = 60;
              const lBX = 95;
              const rBX = width - 95;
              const onB = (Math.abs(nextRX - lBX) < bW / 2) || (Math.abs(nextRX - rBX) < bW / 2);

              const isFlyingOrJumping = u.jumps || u.type === 'flying';
              if (distR < 25 && !onB && !isFlyingOrJumping) {
                // Recoil would put unit into river - stop at edge
                nextRY = rY + (u.y < rY ? -25 : 25);
              }

              u.x = Math.max(10, Math.min(width - 10, nextRX));
              u.y = Math.max(10, Math.min(height - 10, nextRY));

              // Recoil visual
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'dust_cloud',
                x: u.x,
                y: u.y,
                radius: 25,
                startTime: Date.now(),
                duration: 400
              }]);
            }

            if (u.kamikaze && u.spriteId !== 'battle_ram') {
              // SPIRIT JUMP ATTACK INITIATION
              return {
                ...u,
                isJumpingAttack: true,
                jumpStartTime: now,
                jumpStartX: u.x,
                jumpStartY: u.y,
                jumpTargetX: closestTarget.x,
                jumpTargetY: closestTarget.y,
                jumpTargetId: closestTarget.id,
                lastAttack: now,
                hidden: u.hidden,
                charge: u.charge,
                lockedTarget: u.lockedTarget,
                wasPushed: false,
                wasStunned: u.wasStunned
              };
            } else {
              // Melee attack - apply damage directly
              // Check if target is a tower (id < 100) or a unit (id >= 100)
              if (closestTarget.id < 100) {
                // Target is a tower
                const targetIndex = nextTowers.findIndex(t => t.id === closestTarget.id);
                if (targetIndex !== -1) {
                  nextTowers[targetIndex] = {
                    ...nextTowers[targetIndex],
                    hp: nextTowers[targetIndex].hp - damageToDeal
                  };
                }
              } else {
                // Target is a unit - apply damage directly
                // Target is a unit - apply damage directly via event queue (cannot modify currentUnits inside map)
                damageEvents.push({
                  targetId: closestTarget.id,
                  damage: damageToDeal,
                  attackerId: u.id
                });

                // Reset charge if Prince gets attacked - handled in damage application
                /* Note: We handle charge reset when applying damage */
              }
              // Record splash damage event if attacker has splash
              if (u.splash) {
                splashEvents.push({
                  attacker: u,
                  attackerX: u.x,
                  attackerY: u.y,
                  targetX: closestTarget.x,
                  targetY: closestTarget.y,
                  damage: damageToDeal,
                  frontalSplash: u.frontalSplash || false,
                  turnsToPig: u.turnsToPig || false,
                  knockback: u.knockback || 0,
                  boomerang: u.boomerang || false
                });
              }

              // Electro Giant Shock - stun all enemies in radius when attacking
              if (u.shockOnHit && u.spriteId === 'electro_giant') {
                const shockRadius = u.shockRadius || 50;
                const shockStunDuration = (u.shockStun || 0.5) * 1000; // Convert to ms

                // Create stun events for all enemies in radius
                setUnits(prevUnits => {
                  return prevUnits.map(enemy => {
                    // Only affect enemy units within radius
                    if (enemy.isOpponent !== u.isOpponent && enemy.hp > 0) {
                      const dist = Math.sqrt(Math.pow(enemy.x - u.x, 2) + Math.pow(enemy.y - u.y, 2));
                      if (dist <= shockRadius) {
                        // Create lightning zap visual effect
                        setVisualEffects(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          type: 'lightning_strike',
                          x: enemy.x,
                          y: enemy.y,
                          radius: 30,
                          startTime: Date.now(),
                          duration: 300
                        }]);

                        // Apply stun
                        return { ...enemy, stunUntil: now + shockStunDuration };
                      }
                    }
                    return enemy;
                  });
                });

                // Also stun enemy towers in radius
                setTowers(prevTowers => {
                  return prevTowers.map(tower => {
                    if (tower.isOpponent !== u.isOpponent && tower.hp > 0) {
                      const dist = Math.sqrt(Math.pow(tower.x - u.x, 2) + Math.pow(tower.y - u.y, 2));
                      if (dist <= shockRadius) {
                        // Create lightning zap visual effect
                        setVisualEffects(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          type: 'lightning_strike',
                          x: tower.x,
                          y: tower.y,
                          radius: 30,
                          startTime: Date.now(),
                          duration: 300
                        }]);

                        // Apply stun (towers have stunUntil property)
                        return { ...tower, stunUntil: now + shockStunDuration };
                      }
                    }
                    return tower;
                  });
                });
              }

              // Heal on Attack (Battle Healer & Heal Spirit)
              if (u.healsOnAttack > 0) {
                healEvents.push({
                  x: u.x,
                  y: u.y,
                  radius: u.healRadius,
                  amount: u.healsOnAttack,
                  isOpponent: u.isOpponent
                });

                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'heal_pulse',
                  x: u.x,
                  y: u.y,
                  radius: u.healRadius,
                  startTime: Date.now(),
                  duration: 600
                }]);
              }

              // Spirit Cards special effects (AND Battle Ram impact)
              if (u.kamikaze) {
                // Add splash damage for units with splash (Wall Breakers, Fire Spirits)
                if (u.splash) {
                  splashEvents.push({
                    attacker: u,
                    targetX: closestTarget.x,
                    targetY: closestTarget.y,
                    damage: damageToDeal,
                    radius: u.splashRadius || 50
                  });
                }

                // Fire Spirit - explosion visual (has splash: true)
                if (u.splash) {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'fire_explosion',
                    x: closestTarget.x,
                    y: closestTarget.y,
                    radius: 50,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }

                // Battle Ram - wood break visual
                if (u.spriteId === 'battle_ram') {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'goblin_barrel_spawn', // Reuse wood effect
                    x: u.x,
                    y: u.y,
                    radius: 40,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }

                // Wall Breakers - building explosion visual
                if (u.spriteId === 'wall_breakers') {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'fire_explosion', // Building explosion
                    x: u.x,
                    y: u.y,
                    radius: 60,
                    startTime: Date.now(),
                    duration: 600
                  }]);
                }

                // Ice Spirit - freeze visual
                if (u.stun && u.stun > 0) {
                  damageEvents.push({
                    targetId: closestTarget.id,
                    damage: damageToDeal,
                    attackerId: u.id,
                    stun: u.stun
                  });
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'ice_freeze',
                    x: closestTarget.x,
                    y: closestTarget.y,
                    radius: 40,
                    startTime: Date.now(),
                    duration: 800
                  }]);
                }

                // Heal Spirit - logic moved out to handle Battle Healer too

                // Electro Spirit - chain visual
                if (u.chain > 0) {
                  chainEvents.push({
                    attackerId: u.id,
                    primaryTarget: closestTarget,
                    chainCount: Math.min(u.chain - 1, 3), // Max 3 additional targets (4 total)
                    damage: damageToDeal,
                    stun: u.stun || 0,
                    isOpponent: u.isOpponent,
                    startX: u.x,
                    startY: u.y
                  });
                }

                // Kamikaze - die after attacking
                return { ...u, lastAttack: now, hp: 0, hidden: u.hidden, charge: u.charge ? { ...u.charge, distance: 0, active: false } : u.charge, lockedTarget: u.lockedTarget, wasPushed: false, wasStunned: u.wasStunned };
              }
            }
            // Reset charge when Prince attacks (consumes charge)
            const updatedCharge = u.charge ? { ...u.charge, distance: 0, active: false } : u.charge;
            return {
              ...u,
              lastAttack: now,
              hidden: u.hidden,
              charge: updatedCharge,
              lockedTarget: u.lockedTarget,
              wasPushed: false,
              wasStunned: u.wasStunned,
              // Preserve new card properties
              dashRange: u.dashRange || 80,
              isDashing: u.isDashing || false,
              dashEndTime: u.dashEndTime || 0,
              currentDamageBonus: u.currentDamageBonus || 0,
              lastBombDrop: u.lastBombDrop || 0
            };
          }
          return {
            ...u,
            hidden: u.hidden,
            lockedTarget: u.lockedTarget,
            wasPushed: false,
            wasStunned: u.wasStunned,
            // Preserve new card properties
            dashRange: u.dashRange || 80,
            isDashing: u.isDashing || false,
            dashEndTime: u.dashEndTime || 0,
            currentDamageBonus: u.currentDamageBonus || 0,
            lastBombDrop: u.lastBombDrop || 0
          };
        } else if (u.spriteId === 'mega_knight' && closestTarget && !u.isJumping && minDist > 50 && minDist < 150) {
          // MEGA KNIGHT JUMP START
          // If target is out of melee range but in jump range (50-150)
          return { ...u, isJumping: true, jumpTargetId: closestTarget.id, hidden: u.hidden, charge: u.charge, lockedTarget: u.lockedTarget, wasPushed: false, wasStunned: u.wasStunned };
        } else {
          // Movement logic
          let nextY = u.y;
          let nextX = u.x;
          let isJumpingNow = u.isJumping;

          // Apply speed boost for charging Prince
          const speedMultiplier = (u.charge && u.charge.active) ? 2 : 1;
          let effectiveSpeed = u.speed * speedMultiplier;

          if (u.rageUntil > now) {
            effectiveSpeed *= 1.35; // 35% faster movement speed
          }

          // Mega Knight Jump Movement
          if (isJumpingNow) {
            const jumpTarget = targets.find(t => t.id === u.jumpTargetId);
            if (jumpTarget) {
              effectiveSpeed = 10; // High speed for jump
              const angle = Math.atan2(jumpTarget.y - u.y, jumpTarget.x - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;

              const distRemaining = Math.sqrt(Math.pow(jumpTarget.x - nextX, 2) + Math.pow(jumpTarget.y - nextY, 2));

              // Landing logic
              if (distRemaining < 20) {
                // LANDED
                isJumpingNow = false;
                // Deal big splash damage + Knockback
                const jumpDamage = u.baseDamage * 2; // Jump does 2x damage
                splashEvents.push({
                  attacker: u,
                  targetX: nextX,
                  targetY: nextY,
                  damage: jumpDamage,
                  knockback: 40 // Push units back
                });
              }
            } else {
              // Target died/gone while jumping - cancel jump
              isJumpingNow = false;
            }
          } else if (u.isDashing) {
            // BANDIT DASH MOVEMENT
            const dashTarget = (u.lockedTarget && targets.find(t => t.id === u.lockedTarget)) || closestTarget;

            if (dashTarget) {
              effectiveSpeed = 12; // Dash speed (very fast)
              const angle = Math.atan2(dashTarget.y - u.y, dashTarget.x - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;

              const distRemaining = Math.sqrt(Math.pow(dashTarget.x - nextX, 2) + Math.pow(dashTarget.y - nextY, 2));

              // End dash if close enough (attack range)
              if (distRemaining < 25) {
                u.isDashing = false;
                // Damage multiplier handled in attack logic
              }
            } else {
              u.isDashing = false; // Target lost
            }
          } else if (u.burrowing && u.burrowing.active && u.burrowing.targetX !== undefined) {
            // MINER BURROW MOVEMENT - travels underground to target location
            const targetX = u.burrowing.targetX;
            const targetY = u.burrowing.targetY;
            const distToTarget = Math.sqrt(Math.pow(targetX - u.x, 2) + Math.pow(targetY - u.y, 2));

            if (distToTarget > 5) {
              // Move toward burrow target
              const angle = Math.atan2(targetY - u.y, targetX - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;
            } else {
              // Reached target - stop burrowing and pop up
              u.burrowing.active = false;
              // Add popup visual
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'miner_popup',
                x: u.x,
                y: u.y,
                radius: 50,
                startTime: Date.now(),
                duration: 800
              }]);
            }
          } else {
            // Regular movement for non-miner, non-dashing units
            // Apply slow effect
            if (u.slowUntil > now) {
              effectiveSpeed *= (1 - (u.slowAmount || 0.35));
            }

            // Apply rage speed boost
            if (u.rageUntil > now) {
              effectiveSpeed *= (1 + (u.rageBoost || 0.35));
            }

            // Stop to attack - units like Sparky stop moving when in range
            if (u.stopsToAttack && closestTarget) {
              const distToTarget = Math.sqrt(Math.pow(closestTarget.x - u.x, 2) + Math.pow(closestTarget.y - u.y, 2));
              const attackRange = (u.range || 25) + 15; // Add buffer
              if (distToTarget <= attackRange) {
                effectiveSpeed = 0; // Stop moving to attack
              }
            }

            // Movement Calculation
            if ((u.jumps || u.type === 'flying') && closestTarget) {
              // Direct pathfinding for units that ignore terrain
              const angle = Math.atan2(closestTarget.y - u.y, closestTarget.x - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;

              // Skeleton Barrel - POP when reaching building!
              if (u.spriteId === 'skeleton_barrel') {
                const distToTarget = Math.sqrt(Math.pow(closestTarget.x - nextX, 2) + Math.pow(closestTarget.y - nextY, 2));
                // Pop if touching (30px buffer)
                if (distToTarget < 30) {
                  return { ...u, x: nextX, y: nextY, hp: 0 }; // Die immediately to trigger death spawn
                }
              }
            } else {
              // Standard vertical movement for ground units (bridges will handle steering)
              if (u.isOpponent) {
                nextY += effectiveSpeed;
              } else {
                nextY -= effectiveSpeed;
              }
            }

            // Track distance for charge
            if (u.charge && !u.charge.active) {
              const moveDist = Math.sqrt(Math.pow(nextX - u.x, 2) + Math.pow(nextY - u.y, 2));
              u.charge.distance = (u.charge.distance || 0) + moveDist;
            }

            // Defensive check: ensure nextTowers is an array
            const allTowers = (towersRef.current || []).filter(t => t.hp > 0);

            // Find the enemy King tower to redirect to after destroying princess tower
            const enemyKing = (towersRef.current || []).find(t => t.type === 'king' && t.isOpponent !== u.isOpponent && t.hp > 0);
            const kingCenterX = enemyKing ? enemyKing.x : width / 2;

            // Check if unit's lane princess tower is destroyed
            const lanePrincess = (towersRef.current || []).find(t =>
              t.type === 'princess' &&
              t.isOpponent !== u.isOpponent &&
              ((u.lane === 'LEFT' && t.x < width / 2) || (u.lane === 'RIGHT' && t.x > width / 2))
            );
            const princessDestroyed = !lanePrincess || lanePrincess.hp <= 0;

            // If princess tower is destroyed and unit is past the princess tower zone, steer toward King
            const princessY = u.isOpponent ? (height - 230) : 150;
            const pastPrincess = u.isOpponent ? (nextY > princessY + 30) : (nextY < princessY - 30);

            if (princessDestroyed && pastPrincess && enemyKing) {
              // Steer toward King tower center
              const diffX = kingCenterX - nextX;
              if (Math.abs(diffX) > 5) {
                const steerSpeed = Math.min(2, Math.abs(diffX) * 0.1);
                nextX += Math.sign(diffX) * steerSpeed;
              }
            }

            let collision = false;
            let avoidX = 0;

            // LANE CENTERING: Make units bunch up more in the center of their lane
            const laneCenterX = u.lane === 'LEFT' ? 95 : width - 95;
            const distToLaneCenter = Math.abs(nextX - laneCenterX);
            if (distToLaneCenter > 20 && effectiveSpeed > 0) {
              // Steer toward lane center
              const steerStrength = 2; // Strong steering to center
              avoidX += Math.sign(laneCenterX - nextX) * steerStrength;
            }

            for (let t of allTowers) {
              const distToTower = Math.sqrt(Math.pow(t.x - nextX, 2) + Math.pow(t.y - nextY, 2));
              const minDistance = (t.type === 'king' ? 45 : 35);

              if (distToTower < minDistance) {
                collision = true;
                if (nextX < t.x) {
                  avoidX += -2;
                } else {
                  avoidX += 2;
                }
                break;
              }
            }

            const riverY = height / 2;
            const distToRiver = Math.abs(nextY - riverY);

            // Flying units and jumpers move differently - they skip tower collision avoidance AND bridge logic
            const isFlyingOrJumping = u.jumps || u.type === 'flying';

            if (isFlyingOrJumping && effectiveSpeed > 0) {
              // Flying/jumping units just move straight toward target, no special avoidance
              // Movement already calculated above, do nothing extra
            } else if (collision && effectiveSpeed > 0) {
              nextX += avoidX;
              nextY = u.y + (u.isOpponent ? effectiveSpeed * 0.5 : -effectiveSpeed * 0.5);
            } else if (!collision && effectiveSpeed > 0) {
              // STRICT RIVER BLOCKING
              // Bridge zones: Left ~95, Right ~Width-95. Width ~40.
              const bridgeWidth = 50; // generous width
              const leftBridgeX = 95;
              const rightBridgeX = width - 95;

              const onLeftBridge = Math.abs(nextX - leftBridgeX) < bridgeWidth / 2;
              const onRightBridge = Math.abs(nextX - rightBridgeX) < bridgeWidth / 2;
              const onBridge = onLeftBridge || onRightBridge;

              if (distToRiver < 30 && !onBridge) {
                // BLOCKED BY RIVER
                // Allow moving AWAY from the river, but not towards it
                const isMovingTowardsRiver = (u.y < riverY && nextY > u.y) || (u.y > riverY && nextY < u.y);
                if (isMovingTowardsRiver) {
                  nextY = u.y;
                }

                // Slide towards nearest bridge
                const bridgeCenterX = u.lane === 'LEFT' ? leftBridgeX : rightBridgeX;
                const diffX = bridgeCenterX - nextX;
                // Move sideways to find bridge - slightly faster than normal speed
                nextX += Math.sign(diffX) * Math.min(Math.abs(diffX), effectiveSpeed * 1.5);
              } else if (distToRiver < 120 && !onBridge) {
                // Approaching river - steer towards bridge
                const bridgeCenterX = u.lane === 'LEFT' ? leftBridgeX : rightBridgeX;
                const diffX = bridgeCenterX - nextX;
                if (Math.abs(diffX) > 2) {
                  const steerSpeed = 2; // Stronger steering
                  nextX += Math.sign(diffX) * steerSpeed;
                }
              }
            }
          }

          // Update Bandit dash state - end dash when time is up
          let isDashingNow = u.isDashing || false;
          if (isDashingNow && now > (u.dashEndTime || 0)) {
            isDashingNow = false;
          }

          // Track Inferno Tower target for damage ramp reset
          if (u.damageRamp && u.lockedTarget && u.lastTargetId !== u.lockedTarget) {
            // Target changed, reset damage ramp
            u.lastDamageRampTime = now;
            u.currentDamageBonus = 0;
            u.lastTargetId = u.lockedTarget;
          } else if (u.damageRamp && !u.lockedTarget) {
            // No target, reset
            u.lastDamageRampTime = now;
            u.currentDamageBonus = 0;
          }

          return {
            ...u,
            x: nextX,
            y: nextY,
            hidden: u.hidden,
            charge: u.charge,
            lockedTarget: u.lockedTarget,
            wasPushed: u.wasPushed,
            wasStunned: u.wasStunned,
            isJumping: isJumpingNow,
            jumpTargetId: u.jumpTargetId,
            // Preserve new card properties
            dashRange: u.dashRange || 80,
            isDashing: isDashingNow,
            dashEndTime: u.dashEndTime || 0,
            currentDamageBonus: u.currentDamageBonus || 0,
            lastBombDrop: u.lastBombDrop || 0,
            lastTargetId: u.lastTargetId
          };
        }
      });

      // Filter out expired clones and out-of-bounds units
      // (Death filter and spawn processing moved to after all damage is applied)
      currentUnits = currentUnits.filter(u => {
        // Check if clone has expired
        if (u.isClone && u.cloneEndTime && Date.now() >= u.cloneEndTime) {
          return false;
        }
        // Remove out-of-bounds units
        if (u.y <= -50 || u.y >= height + 50) {
          return false;
        }
        return true;
      });

      // Apply collected splash damage events
      splashEvents.forEach(event => {
        const splashRadius = event.radius || 50;

        // For frontal splash (Dark Prince), calculate attack direction angle
        let attackAngle = 0;
        if (event.frontalSplash) {
          attackAngle = Math.atan2(event.targetY - event.attackerY, event.targetX - event.attackerX);
        }

        // Boomerang return damage (Executioner)
        if (event.boomerang) {
          // Schedule second splash damage when axe returns to Executioner
          setTimeout(() => {
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'fire_explosion', // Reuse explosion visual for axe return
              x: event.attackerX,
              y: event.attackerY,
              radius: 40,
              startTime: Date.now(),
              duration: 400
            }]);
            // Apply return damage to all enemies around Executioner
            setUnits(prevUnits => {
              return prevUnits.map(unit => {
                if (unit.isOpponent !== event.attacker.isOpponent && unit.hp > 0) {
                  const dist = Math.sqrt(Math.pow(unit.x - event.attackerX, 2) + Math.pow(unit.y - event.attackerY, 2));
                  if (dist <= splashRadius) {
                    const returnDamage = Math.floor(event.damage * 0.5); // Half damage on return
                    let remainingDamage = returnDamage;
                    let newShieldHp = unit.currentShieldHp || 0;
                    if (unit.hasShield && newShieldHp > 0) {
                      if (remainingDamage >= newShieldHp) {
                        remainingDamage -= newShieldHp;
                        newShieldHp = 0;
                      } else {
                        newShieldHp -= remainingDamage;
                        remainingDamage = 0;
                      }
                    }
                    return { ...unit, hp: unit.hp - remainingDamage, currentShieldHp: newShieldHp };
                  }
                }
                return unit;
              });
            });
          }, 600); // Axe returns after 600ms
        }

        // Damage all enemy units in splash radius
        currentUnits = currentUnits.map(unit => {
          if (unit.isOpponent !== event.attacker.isOpponent && unit.hp > 0) {
            const dist = Math.sqrt(Math.pow(unit.x - event.targetX, 2) + Math.pow(unit.y - event.targetY, 2));
            if (dist <= splashRadius) {
              // For frontal splash, check if unit is in front (within 180 degrees)
              if (event.frontalSplash) {
                const angleToUnit = Math.atan2(unit.y - event.attackerY, unit.x - event.attackerX);
                let angleDiff = angleToUnit - attackAngle;
                // Normalize angle to [-PI, PI]
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                // Only splash if unit is in front (within 90 degrees of attack direction)
                if (Math.abs(angleDiff) > Math.PI / 2) {
                  return unit; // Skip, unit is behind
                }
              }

              const damage = Math.floor(event.damage * 0.5);

              // Handle Shield
              let remainingDamage = damage;
              let newShieldHp = unit.currentShieldHp || 0;
              let shieldBroken = false;

              if (unit.hasShield && newShieldHp > 0) {
                if (remainingDamage >= newShieldHp) {
                  remainingDamage -= newShieldHp;
                  newShieldHp = 0;
                  shieldBroken = true;
                } else {
                  newShieldHp -= remainingDamage;
                  remainingDamage = 0;
                }
              }

              let updatedUnit = { ...unit, hp: unit.hp - remainingDamage, currentShieldHp: newShieldHp };

              // Shield Break Visual
              if (shieldBroken) {
                updatedUnit.hasShield = false;
                if (unit.spriteId === 'guards') updatedUnit.spriteId = 'skeletons';
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'shield_break',
                  x: unit.x,
                  y: unit.y,
                  radius: 35,
                  startTime: Date.now(),
                  duration: 500
                }]);
              }

              if (event.slow) {
                updatedUnit.slowUntil = Date.now() + 2000;
                updatedUnit.slowAmount = event.slow;
              }

              // Handle stun (Ice Spirit freeze)
              if (event.stun && event.stun > 0) {
                updatedUnit.stunUntil = Date.now() + (event.stun * 1000);
                updatedUnit.wasStunned = true;

                // Freeze visual effect
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'ice_freeze',
                  x: unit.x,
                  y: unit.y,
                  radius: 40,
                  startTime: Date.now(),
                  duration: 600
                }]);

                // Reset charge if Prince gets stunned
                if (unit.charge) {
                  updatedUnit.charge = { ...unit.charge, distance: 0, active: false };
                }
              }

              // Handle Knockback
              if (event.knockback) {
                const angle = Math.atan2(unit.y - event.targetY, unit.x - event.targetX);
                let knockX = updatedUnit.x + Math.cos(angle) * event.knockback;
                let knockY = updatedUnit.y + Math.sin(angle) * event.knockback;

                // River collision during knockback
                const rY = height / 2;
                const distR = Math.abs(knockY - rY);
                const bW = 60;
                const lBX = 95;
                const rBX = width - 95;
                const onB = (Math.abs(knockX - lBX) < bW / 2) || (Math.abs(knockX - rBX) < bW / 2);

                const isFlyingOrJumping = unit.jumps || unit.type === 'flying';
                if (distR < 25 && !onB && !isFlyingOrJumping) {
                  // Pushed into river - stop at edge
                  knockY = rY + (unit.y < rY ? -25 : 25);
                }

                updatedUnit.x = Math.max(10, Math.min(width - 10, knockX));
                updatedUnit.y = Math.max(10, Math.min(height - 10, knockY));
                updatedUnit.wasPushed = true;
              }

              // Mother Witch curse - marks enemy for 5 seconds
              if (event.turnsToPig && !unit.isPig && unit.type !== 'building') {
                updatedUnit.cursedUntil = Date.now() + 5000;
                updatedUnit.cursedByAttackerSide = event.attacker.isOpponent; // Track which side cursed them
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'curse',
                  x: unit.x,
                  y: unit.y,
                  startTime: Date.now(),
                  duration: 500
                }]);
              }
              return updatedUnit;
            }
          }
          return unit;
        });
        // Also splash towers
        nextTowers = nextTowers.map(tower => {
          if (tower.isOpponent !== event.attacker.isOpponent && tower.hp > 0) {
            const dist = Math.sqrt(Math.pow(tower.x - event.targetX, 2) + Math.pow(tower.y - event.targetY, 2));
            if (dist <= splashRadius + 20) {
              // For frontal splash, check if tower is in front
              if (event.frontalSplash) {
                const angleToTower = Math.atan2(tower.y - event.attackerY, tower.x - event.attackerX);
                let angleDiff = angleToTower - attackAngle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                if (Math.abs(angleDiff) > Math.PI / 2) {
                  return tower; // Skip, tower is behind
                }
              }

              const updatedTower = { ...tower, hp: tower.hp - Math.floor(event.damage * 0.5) };

              // Handle stun (Ice Spirit freeze)
              if (event.stun && event.stun > 0) {
                updatedTower.stunUntil = Date.now() + (event.stun * 1000);
                updatedTower.wasStunned = true;

                // Freeze visual effect for towers
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'ice_freeze',
                  x: tower.x,
                  y: tower.y,
                  radius: 40,
                  startTime: Date.now(),
                  duration: 600
                }]);
              }

              return updatedTower;
            }
          }
          return tower;
        });
      });

      // Apply heal events (Heal Spirit)
      healEvents.forEach(event => {
        // Heal all friendly units in radius
        currentUnits = currentUnits.map(unit => {
          if (unit.isOpponent === event.isOpponent && unit.hp > 0) {
            const dist = Math.sqrt(Math.pow(unit.x - event.x, 2) + Math.pow(unit.y - event.y, 2));
            if (dist <= event.radius) {
              return { ...unit, hp: Math.min(unit.maxHp || unit.hp + event.amount, unit.hp + event.amount) };
            }
          }
          return unit;
        });
        // Also heal friendly towers
        nextTowers = nextTowers.map(tower => {
          if (tower.isOpponent === event.isOpponent && tower.hp > 0) {
            const dist = Math.sqrt(Math.pow(tower.x - event.x, 2) + Math.pow(tower.y - event.y, 2));
            if (dist <= event.radius) {
              return { ...tower, hp: Math.min(tower.maxHp || tower.hp + event.amount, tower.hp + event.amount) };
            }
          }
          return tower;
        });
      });

      // Apply chain events (Electro Spirit)
      chainEvents.forEach(event => {
        const attacker = currentUnits.find(u => u.id === event.attackerId);
        if (!attacker) return; // Attacker died before chain could complete

        let chainedTargets = [event.primaryTarget];
        let remainingChains = event.chainCount;

        // Find additional targets to chain to
        while (remainingChains > 0) {
          let lastTarget = chainedTargets[chainedTargets.length - 1];
          let closestDist = Infinity;
          let closestTarget = null;

          // Find closest enemy unit to the last chained target
          currentUnits.forEach(unit => {
            if (unit.isOpponent !== event.isOpponent && unit.hp > 0 && !chainedTargets.find(t => t.id === unit.id) && !unit.isZone) {
              const dist = Math.sqrt(Math.pow(unit.x - lastTarget.x, 2) + Math.pow(unit.y - lastTarget.y, 2));
              if (dist < closestDist && dist < 80) { // Max chain distance: 80
                closestDist = dist;
                closestTarget = unit;
              }
            }
          });

          if (closestTarget) {
            chainedTargets.push(closestTarget);
            remainingChains--;
          } else {
            break; // No more targets in range
          }
        }

        // Apply damage and stun to all chained targets (except the first one which was already hit)
        chainedTargets.slice(1).forEach(target => {
          damageEvents.push({
            targetId: target.id,
            damage: event.damage,
            attackerId: event.attackerId
          });
          // Apply stun
          if (event.stun > 0) {
            const targetUnit = currentUnits.find(u => u.id === target.id);
            if (targetUnit) {
              targetUnit.stunUntil = Date.now() + (event.stun * 1000);
              targetUnit.wasStunned = true;
            }
          }
        });

        // Create visual effect for chain lightning
        if (chainedTargets.length > 1) {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'chain_lightning',
            targets: chainedTargets.map(t => ({ x: t.x, y: t.y })),
            startTime: Date.now(),
            duration: 400
          }]);
        }
      });

      let activeProjectiles = nextProjectiles.map(p => {
        let targetX = p.targetX;
        let targetY = p.targetY;

        if (!p.isSpell) {
          const isTargetTower = p.targetId < 100;
          if (isTargetTower) {
            const target = nextTowers.find(t => t.id === p.targetId);
            if (target) {
              targetX = target.x;
              targetY = target.y;
            }
          } else {
            const target = (unitsRef.current || []).find(u => u.id === p.targetId);
            if (target) {
              targetX = target.x;
              targetY = target.y;
            }
          }
        }

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (p.type === 'tesla_lightning') {
          return {
            ...p,
            targetX,
            targetY,
            hit: !p.damageDealt, // Only hit if not yet dealt damage
            keepVisual: true
          };
        }

        if (p.type === 'bomb_delayed') {
          if (Date.now() - p.spawnTime >= p.delay) {
            return { ...p, hit: true };
          }
          return p; // Keep waiting
        }

        // ROYAL DELIVERY: Handle falling movement and hit time
        // ROYAL DELIVERY: Handle arcing movement from King Tower
        if (p.isDelivery) {
          const progress = (Date.now() - p.spawnTime) / (p.duration * 1000);
          if (progress >= 1) {
            return { ...p, hit: true, x: p.targetX, y: p.targetY };
          }

          // Interpolate Ground Position (startX -> targetX, startY -> targetY)
          const startX = p.startX || p.targetX;
          const startY = p.startY || (p.targetY - 300);

          const currentGroundX = startX + (p.targetX - startX) * progress;
          const currentGroundY = startY + (p.targetY - startY) * progress;

          // Arc Height (Parabola): Peaks in middle
          // Height offset (visual Y) = -1 * (4 * maxHeight * progress * (1 - progress))
          // But Royal Delivery goes High and drops. Let's stick to standard arc.
          const arcHeight = 350; // Higher arc for delivery
          const heightOffset = 4 * arcHeight * progress * (1 - progress);

          // Visual Y = GroundY - HeightOffset
          return {
            ...p,
            x: currentGroundX,
            y: currentGroundY - heightOffset
          };
        }

        // MAGIC ARCHER PIERCE LOGIC
        if (p.pierce) {
          const angle = Math.atan2(dy, dx);
          const nextX = p.x + Math.cos(angle) * p.speed;
          const nextY = p.y + Math.sin(angle) * p.speed;
          const hitIds = p.hitIds || [];
          const maxHits = 5; // Maximum number of targets to pierce through

          // Check if projectile has traveled past its target by significant distance
          const distTraveled = Math.sqrt(Math.pow(nextX - p.x, 2) + Math.pow(nextY - p.y, 2));
          const totalDistTraveled = (p.totalDistTraveled || 0) + distTraveled;
          const distToTarget = Math.sqrt(Math.pow(p.targetX - p.x, 2) + Math.pow(p.targetY - p.y, 2));

          // Check for collisions
          const targets = [
            ...(unitsRef.current || []).filter(u => u.isOpponent !== p.isOpponent && u.hp > 0),
            ...(nextTowers || []).filter(t => t.isOpponent !== p.isOpponent && t.hp > 0)
          ];

          targets.forEach(t => {
            if (!hitIds.includes(t.id)) {
              const distToProj = Math.sqrt(Math.pow(t.x - nextX, 2) + Math.pow(t.y - nextY, 2));
              if (distToProj < 30) {
                // HIT!
                hitIds.push(t.id);
                // Apply damage immediately (since we want to hit multiple targets in one frame possibly)
                if (t.id < 100) {
                  const tIndex = nextTowers.findIndex(tow => tow.id === t.id);
                  if (tIndex !== -1) nextTowers[tIndex].hp -= p.damage;
                } else {
                  damageEvents.push({ targetId: t.id, damage: p.damage, attackerId: p.attackerId });
                }
              }
            }
          });

          // Remove projectile if:
          // 1. Hit max number of targets
          // 2. Traveled 100 pixels past target
          // 3. Out of bounds
          if (hitIds.length >= maxHits || (distToTarget < 100 && totalDistTraveled > distToTarget + 100) ||
            nextX < -50 || nextX > width + 50 || nextY < -50 || nextY > height + 50) {
            return { ...p, damageDealt: true, hit: true }; // Mark for removal
          }

          return { ...p, x: nextX, y: nextY, hitIds, totalDistTraveled };
        }

        if (dist < p.speed + 10) {
          return { ...p, hit: true };
        }

        const angle = Math.atan2(dy, dx);
        return {
          ...p,
          x: p.x + Math.cos(angle) * p.speed,
          y: p.y + Math.sin(angle) * p.speed,
          targetX,
          targetY
        };
      });

      const hits = activeProjectiles.filter(p => (p.hit && !p.damageDealt) || p.isPoison);
      if (hits.length > 0) {

        hits.forEach(h => {
          if (!h.isPoison) {
            h.damageDealt = true;
          }

          // Handle Log-type projectiles (The Log, Barb Barrel) BEFORE spell split
          if (h.isLog) {
            const logWidth = 40;
            const logStartY = h.logStartY || h.y;
            const logEndY = h.logEndY || h.targetY;
            const minX = h.x - logWidth / 2;
            const maxX = h.x + logWidth / 2;
            const minY = Math.min(logStartY, logEndY);
            const maxY = Math.max(logStartY, logEndY);

            currentUnits = currentUnits.map(u => {
              if (u.hp > 0) {
                const isEnemy = h.isOpponent !== undefined ? !h.isOpponent : u.isOpponent;
                if (isEnemy && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
                  let updatedUnit = { ...u, hp: u.hp - h.damage };
                  if (h.knockback && h.knockback > 0 && u.type !== 'building') {
                    const logDirection = logEndY > logStartY ? 1 : -1;
                    updatedUnit.y = u.y + (h.knockback * logDirection);
                    updatedUnit.y = Math.max(10, Math.min(height - 10, updatedUnit.y));
                    updatedUnit.wasPushed = true;
                  }
                  return updatedUnit;
                }
              }
              return u;
            });

            // Barb Barrel: spawn barbarian
            if (h.isBarrel && h.spawns) {
              const barbCard = CARDS.find(c => c.id === h.spawns);
              if (barbCard) {
                unitsToSpawn.push({
                  id: 'barb_from_barrel_' + Date.now(),
                  x: h.targetX,
                  y: h.targetY,
                  hp: barbCard.hp,
                  maxHp: barbCard.hp,
                  isOpponent: h.isOpponent,
                  speed: barbCard.speed,
                  lane: h.targetX < width / 2 ? 'LEFT' : 'RIGHT',
                  lastAttack: 0,
                  spriteId: barbCard.id,
                  type: barbCard.type,
                  range: barbCard.range,
                  damage: barbCard.damage,
                  attackSpeed: barbCard.attackSpeed,
                  spawnTime: Date.now()
                });
              }
            }
          } else if (h.isSpell) {
            // Handle spell effects (Fireball, Arrows, Zap, Poison)
            if (h.isPoison) {
              // Poison is special - stays on battlefield and ticks continuously
              // Check if poison has expired
              const poisonAge = (now - h.spawnTime) / 1000; // in seconds
              if (poisonAge < h.duration) {
                // Deal damage every second
                const lastTick = h.lastDamageTick || h.spawnTime;
                const timeSinceTick = (now - lastTick) / 1000;
                if (timeSinceTick >= 1) {
                  // Deal damage to all units in radius
                  currentUnits = currentUnits.map(u => {
                    const isEnemy = u.isOpponent !== (h.isOpponent || false);
                    const dist = Math.sqrt(Math.pow(u.x - h.x, 2) + Math.pow(u.y - h.y, 2));
                    if (isEnemy && dist < h.radius) {
                      return { ...u, hp: u.hp - h.damage };
                    }
                    return u;
                  });
                  // Deal damage to towers in radius
                  nextTowers = nextTowers.map(t => {
                    const isEnemy = t.isOpponent !== (h.isOpponent || false);
                    const dist = Math.sqrt(Math.pow(t.x - h.x, 2) + Math.pow(t.y - h.y, 2));
                    if (isEnemy && dist < h.radius + 30) {
                      const towerDamage = Math.floor(h.damage * 0.3); // 30% Crown Tower damage
                      return { ...t, hp: t.hp - towerDamage };
                    }
                    return t;
                  });                  // Update last tick time by modifying the projectile
                  h.lastDamageTick = now;
                }
              }
              // Poison will be filtered out after duration
            } else if (h.isRage) {
              // Rage Spell Logic
              const rageAge = (now - h.spawnTime) / 1000;
              if (rageAge < h.duration) {
                // Refresh rage effect on units in radius
                // Rage updates constantly (every tick)
                currentUnits = currentUnits.map(u => {
                  const isFriendly = u.isOpponent === (h.isOpponent || false);
                  const dist = Math.sqrt(Math.pow(u.x - h.x, 2) + Math.pow(u.y - h.y, 2));
                  if (isFriendly && dist < h.radius) {
                    return { ...u, rageUntil: now + 200 }; // Buffer of 200ms
                  }
                  return u;
                });
                // Rage towers
                nextTowers = nextTowers.map(t => {
                  const isFriendly = t.isOpponent === (h.isOpponent || false);
                  const dist = Math.sqrt(Math.pow(t.x - h.x, 2) + Math.pow(t.y - h.y, 2));
                  if (isFriendly && dist < h.radius + 30) {
                    return { ...t, rageUntil: now + 200 };
                  }
                  return t;
                });

                // Create persistent rage visual effect (recreated every frame to show continuous effect)
                if (!h.rageEffectCreated) {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'rage_aura',
                    x: h.x,
                    y: h.y,
                    radius: h.radius || 50,
                    startTime: Date.now(),
                    duration: h.duration * 1000
                  }]);
                  h.rageEffectCreated = true;
                }
              }
            } else if (h.isGoblinBarrel) {
              // Goblin Barrel hits - spawn goblins around impact point
              const spawnCardId = h.spawns;
              const spawnCard = CARDS.find(c => c.id === spawnCardId);
              const spawnCount = h.spawnCount || 3;


              if (spawnCard) {
                const newGoblins = [];
                const lane = h.targetX < width / 2 ? 'LEFT' : 'RIGHT';

                for (let i = 0; i < spawnCount; i++) {
                  // Spawn goblins in a circle around the impact point
                  const angle = (i / spawnCount) * Math.PI * 2;
                  const distance = 30 + Math.random() * 20; // 30-50 pixels from center
                  const offsetX = Math.cos(angle) * distance;
                  const offsetY = Math.sin(angle) * distance;

                  newGoblins.push({
                    id: Date.now() + i,
                    x: h.targetX + offsetX,
                    y: h.targetY + offsetY,
                    hp: spawnCard.hp,
                    maxHp: spawnCard.hp,
                    isOpponent: h.isOpponent || false,
                    speed: spawnCard.speed,
                    lane: lane,
                    lastAttack: 0,
                    spriteId: spawnCard.id,
                    type: spawnCard.type,
                    range: spawnCard.range,
                    damage: spawnCard.damage,
                    attackSpeed: spawnCard.attackSpeed,
                    projectile: spawnCard.projectile,
                    lockedTarget: null,
                    wasPushed: false,
                    wasStunned: false,
                    stunUntil: 0,
                    baseDamage: spawnCard.damage
                  });
                }

                // Add goblins to queue (don't setUnits directly to avoid overwrite)
                unitsToSpawn.push(...newGoblins);

                // Visual effect for barrel break
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'goblin_barrel_spawn',
                  x: h.targetX,
                  y: h.targetY,
                  radius: 20,
                  startTime: Date.now(),
                  duration: 500
                }]);
              }
            } else {
              // Other spells (Fireball, Arrows, Zap, Earthquake) - one-time damage
              currentUnits = currentUnits.map(u => {
                const isEnemy = u.isOpponent !== (h.isOpponent || false);
                const dist = Math.sqrt(Math.pow(u.x - h.targetX, 2) + Math.pow(u.y - h.targetY, 2));
                if (isEnemy && dist < h.radius) {
                  let damageToDeal = h.damage;

                  // Earthquake: 3.5x damage to buildings (speed === 0 means building)
                  if (h.type === 'earthquake_spell' && u.speed === 0) {
                    damageToDeal = Math.floor(h.damage * 3.5);
                  }

                  // Handle Shield
                  let remainingDamage = damageToDeal;
                  let newShieldHp = u.currentShieldHp || 0;
                  let shieldBroken = false;

                  if (u.hasShield && newShieldHp > 0) {
                    if (remainingDamage >= newShieldHp) {
                      remainingDamage -= newShieldHp;
                      newShieldHp = 0;
                      shieldBroken = true;
                    } else {
                      newShieldHp -= remainingDamage;
                      remainingDamage = 0;
                    }
                  }

                  let updatedUnit = { ...u, hp: u.hp - remainingDamage, currentShieldHp: newShieldHp };

                  // Shield Break Visual
                  if (shieldBroken) {
                    updatedUnit.hasShield = false;
                    if (u.spriteId === 'guards') updatedUnit.spriteId = 'skeletons';
                    setVisualEffects(prev => [...prev, {
                      id: Date.now() + Math.random(),
                      type: 'shield_break',
                      x: u.x,
                      y: u.y,
                      radius: 35,
                      startTime: Date.now(),
                      duration: 500
                    }]);
                  }

                  // Zap stun effect - resets charge ONLY when stunned
                  if (h.stun && h.stun > 0) {
                    updatedUnit.stunUntil = now + (h.stun * 1000);
                    // Reset charge if Prince gets stunned
                    if (u.charge) {
                      updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                    }
                  }

                  // Apply slow effect (Earthquake, Ice Wizard)
                  if (h.slow && h.slow > 0) {
                    updatedUnit.slowUntil = now + 2000; // Slow lasts 2s
                    updatedUnit.slowAmount = h.slow;
                  }

                  return updatedUnit;
                }
                return u;
              });
              nextTowers = nextTowers.map(t => {
                const isEnemy = t.isOpponent !== (h.isOpponent || false);
                const dist = Math.sqrt(Math.pow(t.x - h.targetX, 2) + Math.pow(t.y - h.targetY, 2));
                if (isEnemy && dist < h.radius + 30) {
                  let damageToDeal = Math.floor(h.damage * 0.3); // 30% Crown Tower damage

                  // Earthquake exception: higher relative tower damage
                  if (h.type === 'earthquake_spell') {
                    damageToDeal = Math.floor(h.damage * 0.35);
                  }

                  return { ...t, hp: t.hp - damageToDeal };
                }
                return t;
              });
              // Create visual effects for spells
              if (h.type === 'fireball_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'fireball_explosion',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 60,
                  startTime: Date.now(),
                  duration: 600
                }]);
              } else if (h.type === 'zap_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'zap_impact',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 35,
                  startTime: Date.now(),
                  duration: 400
                }]);
              } else if (h.type === 'arrows_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'arrows_impact',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 40,
                  startTime: Date.now(),
                  duration: 500
                }]);
              } else if (h.type === 'poison_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'poison_cloud',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 50,
                  startTime: Date.now(),
                  duration: 5000
                }]);
              } else if (h.type === 'rocket_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'rocket_explosion',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 30,
                  startTime: Date.now(),
                  duration: 800
                }]);
              } else if (h.type === 'earthquake_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'earthquake_crack',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 70,
                  startTime: Date.now(),
                  duration: 1000
                }]);
              } else if (h.type === 'lightning_bolt') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'lightning_strike',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 50,
                  startTime: Date.now(),
                  duration: 500
                }]);
              } else if (h.type === 'bomb_delayed') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'fire_explosion', // Bomb explosion
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 60,
                  startTime: Date.now(),
                  duration: 600
                }]);
              } else if (h.type === 'the_log') {
                // The Log impact - dirt trail and impact effect
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'log_impact',
                  x: h.targetX,
                  y: h.targetY,
                  radius: 40,
                  startTime: Date.now(),
                  duration: 600
                }]);
              } else if (h.isDelivery) {
                // ROYAL DELIVERY: Splash damage (hits AIR too) + Spawn Recruit
                // Deal splash damage to all enemies in radius
                currentUnits = currentUnits.map(u => {
                  if (u.isOpponent !== h.isOpponent && u.hp > 0) {
                    const dist = Math.sqrt(Math.pow(u.x - h.x, 2) + Math.pow(u.y - h.y, 2));
                    if (dist <= (h.radius || 45)) {
                      // Knockback away from impact center
                      let newX = u.x;
                      let newY = u.y;
                      if (h.knockback && u.type !== 'building') {
                        const angle = Math.atan2(u.y - h.y, u.x - h.x);
                        newX = u.x + Math.cos(angle) * h.knockback;
                        newY = u.y + Math.sin(angle) * h.knockback;
                      }
                      return {
                        ...u,
                        hp: u.hp - h.damage,
                        x: newX,
                        y: newY,
                        wasPushed: true
                      };
                    }
                  }
                  return u;
                });

                // Apply damage to towers
                nextTowers = nextTowers.map(t => {
                  if (t.isOpponent !== h.isOpponent && t.hp > 0) {
                    const dist = Math.sqrt(Math.pow(t.x - h.x, 2) + Math.pow(t.y - h.y, 2));
                    if (dist <= (h.radius || 45)) {
                      return { ...t, hp: t.hp - h.damage };
                    }
                  }
                  return t;
                });

                // Visual effect for impact
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'royal_delivery',
                  x: h.x,
                  y: h.y,
                  radius: h.radius || 45,
                  startTime: Date.now(),
                  duration: 500
                }]);

                // Spawn Royal Recruit
                if (h.spawns) {
                  const recruitCard = CARDS.find(c => c.id === h.spawns) || CARDS.find(c => c.id === 'knight');
                  if (recruitCard) {
                    unitsToSpawn.push({
                      id: 'royal_recruit_' + Date.now() + '_' + Math.random(),
                      x: h.x,
                      y: h.y,
                      hp: recruitCard.hp,
                      maxHp: recruitCard.hp,
                      shieldHp: recruitCard.shieldHp,
                      maxShieldHp: recruitCard.shieldHp,
                      isOpponent: h.isOpponent,
                      speed: recruitCard.speed,
                      lane: h.x < width / 2 ? 'LEFT' : 'RIGHT',
                      lastAttack: 0,
                      spriteId: h.spawns,
                      type: recruitCard.type,
                      range: recruitCard.range,
                      damage: recruitCard.damage,
                      attackSpeed: recruitCard.attackSpeed,
                      hasShield: recruitCard.hasShield,
                      spawnTime: Date.now() - 2000
                    });
                  }
                }
              }
            }

          } else {
            // Handle projectile hits (arrows, bullets, fireballs)
            const hitX = h.targetX;
            const hitY = h.targetY;

            // ELECTRO DRAGON CHAIN LOGIC
            if (h.chain > 0) {
              const target = (unitsRef.current || []).find(u => u.id === h.targetId) ||
                (nextTowers || []).find(t => t.id === h.targetId);
              if (target) {
                chainEvents.push({
                  attackerId: h.attackerId,
                  primaryTarget: target,
                  chainCount: Math.min(h.chain - 1, 3), // Max 3 more
                  damage: h.damage,
                  stun: h.stun || 0,
                  isOpponent: h.isOpponent,
                  startX: h.x,
                  startY: h.y
                });
              }
            }


            // Damage the primary target
            currentUnits = currentUnits.map(u => {
              if (u.id === h.targetId) {
                // Handle Shield
                let remainingDamage = h.damage;
                let newShieldHp = u.currentShieldHp || 0;
                let shieldBroken = false;

                if (u.hasShield && newShieldHp > 0) {
                  if (remainingDamage >= newShieldHp) {
                    remainingDamage -= newShieldHp;
                    newShieldHp = 0;
                    shieldBroken = true;
                  } else {
                    newShieldHp -= remainingDamage;
                    remainingDamage = 0;
                  }
                }

                let updatedUnit = { ...u, hp: u.hp - remainingDamage, currentShieldHp: newShieldHp };

                // Shield Break Visual
                if (shieldBroken) {
                  updatedUnit.hasShield = false;
                  if (u.spriteId === 'guards') updatedUnit.spriteId = 'skeletons';
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'shield_break',
                    x: u.x,
                    y: u.y,
                    radius: 35,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }

                // Apply stun effect (Electro Wizard)
                if (h.stun && h.stun > 0) {
                  updatedUnit.stunUntil = now + (h.stun * 1000);
                  // Reset charge if Prince gets stunned
                  if (u.charge) {
                    updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                  }
                }

                // Apply slow effect (Ice Wizard)
                if (h.slow && h.slow > 0) {
                  updatedUnit.slowUntil = now + 2000;
                  updatedUnit.slowAmount = h.slow;
                }

                // Electro Giant Shock Aura - if attacker is in Electro Giant's aura, shock them
                if (h.attackerId) {
                  // Find all Electro Giants and check if attacker is in their aura
                  const electroGiants = currentUnits.filter(eg =>
                    eg.spriteId === 'electro_giant' &&
                    eg.hp > 0 &&
                    eg.isOpponent !== u.isOpponent // Enemy Electro Giant
                  );

                  electroGiants.forEach(eg => {
                    const distToGiant = Math.sqrt(Math.pow(u.x - eg.x, 2) + Math.pow(u.y - eg.y, 2));
                    const shockRadius = eg.shockRadius || 50;

                    if (distToGiant <= shockRadius) {
                      // Attacker is in Electro Giant's aura - shock them!
                      updatedUnit.hp -= (eg.shockDamage || 100);
                      updatedUnit.stunUntil = now + ((eg.shockStun || 0.5) * 1000);

                      // Reset charge if Prince gets shocked
                      if (u.charge) {
                        updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                      }

                      // Sparking visual effect
                      setVisualEffects(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        type: 'electro_giant_shock',
                        x: u.x,
                        y: u.y,
                        radius: 40,
                        startTime: Date.now(),
                        duration: 500
                      }]);
                    }
                  });
                }

                // Mother Witch curse - marks enemy for 5 seconds
                if (h.turnsToPig && !u.isPig && u.type !== 'building') {
                  updatedUnit.cursedUntil = now + 5000;
                  updatedUnit.cursedByAttackerSide = h.isOpponent; // Track which side cursed them
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'curse',
                    x: u.x,
                    y: u.y,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }
                return updatedUnit;
              }
              return u;
            });

            // Apply splash damage if projectile has splash
            if (h.splash) {
              const splashRadius = h.splashRadius || 50; // Use projectile's splashRadius or default 50
              currentUnits = currentUnits.map(u => {
                if (u.id !== h.targetId && u.hp > 0) {
                  const isEnemy = h.isOpponent !== undefined ? !h.isOpponent : u.isOpponent;
                  if (isEnemy) {
                    const dist = Math.sqrt(Math.pow(u.x - hitX, 2) + Math.pow(u.y - hitY, 2));
                    if (dist <= splashRadius) {
                      let updatedUnit = { ...u, hp: u.hp - Math.floor(h.damage * 0.5) };

                      // Apply knockback (Fireball)
                      if (h.knockback && h.knockback > 0 && u.type !== 'building') {
                        const angle = Math.atan2(u.y - h.y || hitY, u.x - h.x || hitX);
                        let newX = u.x + Math.cos(angle) * h.knockback;
                        let newY = u.y + Math.sin(angle) * h.knockback;

                        // River collision during knockback
                        const rY = height / 2;
                        const distR = Math.abs(newY - rY);
                        const bW = 60;
                        const lBX = 95;
                        const rBX = width - 95;
                        const onB = (Math.abs(newX - lBX) < bW / 2) || (Math.abs(newX - rBX) < bW / 2);

                        const isFlyingOrJumping = u.jumps || u.type === 'flying';
                        if (distR < 25 && !onB && !isFlyingOrJumping) {
                          newY = rY + (u.y < rY ? -25 : 25);
                        }

                        updatedUnit.x = Math.max(10, Math.min(width - 10, newX));
                        updatedUnit.y = Math.max(10, Math.min(height - 10, newY));
                        updatedUnit.wasPushed = true;
                      }

                      // Apply stun effect (Electro Wizard)
                      if (h.stun && h.stun > 0) {
                        updatedUnit.stunUntil = now + (h.stun * 1000);
                        // Reset charge if Prince gets stunned
                        if (u.charge) {
                          updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                        }
                      }

                      // Apply slow effect (Ice Wizard)
                      if (h.slow && h.slow > 0) {
                        updatedUnit.slowUntil = now + 2000;
                        updatedUnit.slowAmount = h.slow;
                      }

                      // Mother Witch curse - marks enemy for 5 seconds
                      if (h.turnsToPig && !u.isPig && u.type !== 'building') {
                        updatedUnit.cursedUntil = now + 5000;
                        updatedUnit.cursedByAttackerSide = h.isOpponent;
                        setVisualEffects(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          type: 'curse',
                          x: u.x,
                          y: u.y,
                          startTime: Date.now(),
                          duration: 500
                        }]);
                      }
                      return updatedUnit;
                    }
                  }
                }
                return u;
              });
            }

            // Also damage towers (primary target)
            if (h.targetId < 100) {
              const tIndex = nextTowers.findIndex(t => t.id === h.targetId);
              if (tIndex !== -1) {
                const tower = nextTowers[tIndex];
                let damageToDeal = h.damage;
                if (h.isSpell) damageToDeal = Math.floor(damageToDeal * 0.3); // 30% for spells

                let updatedTower = { ...tower, hp: tower.hp - damageToDeal };

                // Tower hit visual effect for significant damage
                if (damageToDeal > 15) {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'tower_hit',
                    x: tower.x,
                    y: tower.y,
                    radius: 40,
                    startTime: Date.now(),
                    duration: 200
                  }]);
                }

                // Apply stun effect (Electro Wizard) to towers
                if (h.stun && h.stun > 0) {
                  updatedTower.stunUntil = now + (h.stun * 1000);
                }

                // Apply slow effect (Ice Wizard) to towers
                if (h.slow && h.slow > 0) {
                  updatedTower.slowUntil = now + 2000;
                  updatedTower.slowAmount = h.slow;
                }

                nextTowers[tIndex] = updatedTower;
              }

              // Apply splash damage to OTHER towers (not primary target)
              if (h.splash) {
                const splashRadius = h.splashRadius || 50;
                nextTowers = nextTowers.map(tower => {
                  if (tower.id !== h.targetId && tower.hp > 0) {
                    const isEnemy = h.isOpponent !== undefined ? !h.isOpponent : tower.isOpponent;
                    if (isEnemy) {
                      const dist = Math.sqrt(Math.pow(tower.x - hitX, 2) + Math.pow(tower.y - hitY, 2));
                      if (dist <= splashRadius + 30) { // +30 for tower size
                        let damageToDeal = Math.floor(h.damage * 0.5);
                        if (h.isSpell) damageToDeal = Math.floor(damageToDeal * 0.3); // 30% reduction for spells

                        let updatedTower = { ...tower, hp: tower.hp - damageToDeal };

                        // Apply stun effect to towers
                        if (h.stun && h.stun > 0) {
                          updatedTower.stunUntil = now + (h.stun * 1000);
                        }

                        // Apply slow effect to towers
                        if (h.slow && h.slow > 0) {
                          updatedTower.slowUntil = now + 2000;
                          updatedTower.slowAmount = h.slow;
                        }

                        return updatedTower;
                      }
                    }
                  }
                  return tower;
                });
              }
            }
          }
        });

        // Remove hit projectiles, but keep poison, rage, and tornado visual-only projectiles
        activeProjectiles = activeProjectiles.filter(p => {
          if (p.keepVisual && p.type === 'tesla_lightning') {
            return (now - Math.floor(p.id)) < 150;
          }
          if (p.isPoison || p.isRage || p.isTornado) {
            return ((now - p.spawnTime) / 1000 < p.duration);
          }
          return !p.hit;
        });

        // Process tornado pull effect on enemies
        activeProjectiles.filter(p => p.isTornado && (now - p.spawnTime) / 1000 < p.duration).forEach(tornado => {
          const pullRadius = tornado.radius || 60;
          const pullStrengthPerTick = 2; // Fixed pull strength per tick (not using delta)

          // Pull enemy units toward tornado center
          currentUnits = currentUnits.map(unit => {
            if (unit.isOpponent !== tornado.isOpponent && unit.hp > 0) {
              const dx = unit.x - tornado.x;
              const dy = unit.y - tornado.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist <= pullRadius && dist > 5) {
                // Pull toward center
                const pullX = -dx / dist * pullStrengthPerTick;
                const pullY = -dy / dist * pullStrengthPerTick;
                return {
                  ...unit,
                  x: unit.x + pullX,
                  y: unit.y + pullY,
                  hp: unit.hp - 1 // Small fixed damage per tick
                };
              }
            }
            return unit;
          });
        });

        // Process rage zone continuous refresh - units inside get rageUntil refreshed
        activeProjectiles.filter(p => p.isRage && (now - p.spawnTime) / 1000 < p.duration).forEach(rageZone => {
          const rageRadius = rageZone.radius || 60;
          const remainingDuration = (rageZone.duration * 1000) - (now - rageZone.spawnTime);
          const rageBoost = rageZone.rageBoost || 0.35;

          // Refresh rage for all friendly units in radius
          currentUnits = currentUnits.map(unit => {
            if (unit.isOpponent === rageZone.isOpponent && unit.hp > 0) {
              const dx = unit.x - rageZone.x;
              const dy = unit.y - rageZone.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist <= rageRadius) {
                // Refresh rage - extend rageUntil to remaining zone duration + buffer
                const newRageUntil = now + Math.min(remainingDuration + 500, 2000);
                return {
                  ...unit,
                  rageUntil: Math.max(unit.rageUntil || 0, newRageUntil),
                  rageBoost: rageBoost
                };
              }
            }
            return unit;
          });
        });
      }

      activeProjectiles = activeProjectiles.filter(p =>
        p.x > -50 && p.x < width + 50 && p.y > -50 && p.y < height + 50
      );

      nextTowers = nextTowers.map(tower => {
        if (tower.hp <= 0) return tower;

        let isActive = true;
        if (tower.type === 'king') {
          const isDamaged = tower.hp < tower.maxHp;
          const mySideTowers = nextTowers.filter(t => t.isOpponent === tower.isOpponent && t.type === 'princess');
          const lostPrincess = mySideTowers.some(t => t.hp <= 0);
          if (!isDamaged && !lostPrincess) {
            isActive = false;
          }
        }
        if (!isActive) return tower;

        // Check if tower is stunned - can't attack while stunned
        const isStunned = tower.stunUntil && now < tower.stunUntil;
        if (isStunned) return tower;

        if (now - tower.lastShot < (tower.type === 'king' ? FIRE_RATE_KING : FIRE_RATE_PRINCESS)) return tower;

        const targets = currentUnits.filter(u => u.isOpponent !== tower.isOpponent);
        let closestTarget = null;
        let minDist = Infinity;

        targets.forEach(u => {
          const dist = Math.sqrt(Math.pow(u.x - tower.x, 2) + Math.pow(u.y - tower.y, 2));
          if (dist <= tower.range && dist < minDist) {
            minDist = dist;
            closestTarget = u;
          }
        });

        if (closestTarget) {
          activeProjectiles.push({
            id: now + Math.random(),
            x: tower.x,
            y: tower.y,
            targetId: closestTarget.id,
            targetX: closestTarget.x,
            targetY: closestTarget.y,
            speed: tower.type === 'king' ? PROJECTILE_SPEED_CANNON : PROJECTILE_SPEED_ARROW,
            damage: 125,
            type: tower.type === 'king' ? 'cannon' : 'arrow'
          });
          return { ...tower, lastShot: now };
        }
        return tower;
      });



      // Apply unit-vs-unit damage events
      if (damageEvents.length > 0) {
        currentUnits = currentUnits.map(u => {
          const events = damageEvents.filter(e => e.targetId === u.id);
          if (events.length > 0) {
            const totalDamage = events.reduce((sum, e) => sum + e.damage, 0);
            // Also reset charge if taking damage
            const updatedCharge = u.charge ? { ...u.charge, distance: 0, active: false } : u.charge;

            // Handle shield absorption (Guards, Dark Prince)
            let remainingDamage = totalDamage;
            let newShieldHp = u.currentShieldHp || 0;
            let shieldBroken = false;

            if (u.hasShield && newShieldHp > 0) {
              if (remainingDamage >= newShieldHp) {
                remainingDamage -= newShieldHp;
                newShieldHp = 0;
                shieldBroken = true;
              } else {
                newShieldHp -= remainingDamage;
                remainingDamage = 0;
              }
            }

            // Bandit dash invincibility - no damage while dashing
            if (u.dashInvincible && u.isDashing) {
              remainingDamage = 0;
            }

            // Royal Ghost hidden invincibility - no damage while invisible
            if (u.hidden && u.hidden.active) {
              remainingDamage = 0;
            }

            // Miner burrowing invincibility - no damage while burrowing
            if (u.burrowing && u.burrowing.active) {
              remainingDamage = 0;
            }

            const updatedUnit = {
              ...u,
              hp: u.hp - remainingDamage,
              currentShieldHp: newShieldHp,
              charge: updatedCharge
            };

            // If shield just broke, Guards transform to skeletons (Dark Prince just loses shield)
            if (shieldBroken) {
              updatedUnit.hasShield = false;

              // Guards transform to regular skeletons when shield breaks
              if (u.spriteId === 'guards') {
                updatedUnit.spriteId = 'skeletons';
              }

              // Trigger shield break visual effect
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'shield_break',
                x: u.x,
                y: u.y,
                radius: 35,
                startTime: Date.now(),
                duration: 500
              }]);
            }

            return updatedUnit;
          }
          return u;
        });
      }

      // Filter dead units and process death spawns (after ALL damage has been applied)
      const unitsThatDied = [];
      currentUnits = currentUnits.filter(u => {
        if (u.hp <= 0) {
          unitsThatDied.push(u);
          return false;
        }
        return true;
      });

      // Handle death spawns
      unitsThatDied.forEach(deadUnit => {
        console.log('[DEATH]', deadUnit.spriteId, 'deathSpawns:', deadUnit.deathSpawns);

        // Goblin Hut death spawn - 3 Spear Goblins
        if (deadUnit.spriteId === 'goblin_hut' && deadUnit.isOpponent === false) {
          const spawnCard = CARDS.find(c => c.id === 'spear_goblins');
          if (spawnCard) {
            const newGoblins = [];
            for (let i = 0; i < 3; i++) {
              const angle = (i / 3) * Math.PI * 2;
              const distance = 30 + Math.random() * 20;
              const offsetX = Math.cos(angle) * distance;
              const offsetY = Math.sin(angle) * distance;

              newGoblins.push({
                id: Date.now() + Math.random() * 1000 + i,
                x: deadUnit.x + offsetX,
                y: deadUnit.y + offsetY,
                hp: spawnCard.hp,
                maxHp: spawnCard.hp,
                isOpponent: deadUnit.isOpponent,
                speed: spawnCard.speed,
                lane: deadUnit.lane,
                lastAttack: now,
                spriteId: spawnCard.id,
                type: spawnCard.type,
                range: spawnCard.range,
                damage: spawnCard.damage,
                attackSpeed: spawnCard.attackSpeed,
                projectile: spawnCard.projectile,
                lockedTarget: null,
                wasPushed: false,
                wasStunned: false,
                stunUntil: 0,
                baseDamage: spawnCard.damage
              });
            }
            unitsToSpawn.push(...newGoblins);

            // Goblin Hut destruction visual effect
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'building_destruction',
              x: deadUnit.x,
              y: deadUnit.y,
              radius: 60,
              startTime: Date.now(),
              duration: 800
            }]);
          }
        }

        // Lumberjack death - drops Rage spell
        if (deadUnit.deathRage && deadUnit.spriteId === 'lumberjack') {
          setProjectiles(prev => [...prev, {
            id: Date.now() + Math.random(),
            x: deadUnit.x,
            y: deadUnit.y,
            targetX: deadUnit.x,
            targetY: deadUnit.y,
            speed: 0,
            damage: 0,
            radius: 50,
            type: 'rage_spell',
            isSpell: true,
            isRage: true,
            hit: true,
            spawnTime: now,
            duration: 6,
            isOpponent: deadUnit.isOpponent
          }]);
        }

        // Generic Death Spawns (Skeleton Barrel, Tombstone, Lava Hound, Golem, Elixir Golem)
        if (deadUnit.spriteId === 'tombstone' || deadUnit.deathSpawns) {
          let spawnId = deadUnit.deathSpawns || 'skeletons';
          const spawnCard = CARDS.find(c => c.id === spawnId);

          console.log('[DEATH SPAWN]', deadUnit.spriteId, '→', spawnId, 'x', deadUnit.deathSpawnCount);

          if (spawnCard) {
            const deathSpawnCount = deadUnit.deathSpawnCount || 4;
            for (let i = 0; i < deathSpawnCount; i++) {
              const angle = (i / deathSpawnCount) * Math.PI * 2 + Math.random() * 0.5;
              const distance = 15 + Math.random() * 20;
              const offsetX = Math.cos(angle) * distance;
              const offsetY = Math.sin(angle) * distance;

              unitsToSpawn.push({
                id: Date.now() + Math.random() * 1000 + i,
                x: deadUnit.x + offsetX,
                y: deadUnit.y + offsetY,
                hp: spawnCard.hp,
                maxHp: spawnCard.hp,
                isOpponent: deadUnit.isOpponent,
                speed: spawnCard.speed,
                lane: deadUnit.lane,
                lastAttack: 0,
                spriteId: spawnCard.id,
                type: spawnCard.type,
                range: spawnCard.range,
                damage: spawnCard.damage,
                attackSpeed: spawnCard.attackSpeed,
                projectile: spawnCard.projectile,
                targetType: spawnCard.targetType,
                lockedTarget: null,
                wasPushed: false,
                wasStunned: false,
                stunUntil: 0,
                baseDamage: spawnCard.damage,
                spawnTime: Date.now(),
                spawnDelay: spawnCard.spawnDelay || 0,
                splash: spawnCard.splash || false,
                frontalSplash: spawnCard.frontalSplash || false,
                hasShield: spawnCard.hasShield || false,
                currentShieldHp: spawnCard.shieldHp || 0,
                shieldHp: spawnCard.shieldHp || 0,
                deathSpawns: spawnCard.deathSpawns,
                deathSpawnCount: spawnCard.deathSpawnCount,
                deathDamage: spawnCard.deathDamage,
                deathRadius: spawnCard.deathRadius,
                deathSlow: spawnCard.deathSlow,
                givesOpponentElixir: spawnCard.givesOpponentElixir || false,
                bombDrops: spawnCard.bombDrops || false,
                turnsToPig: spawnCard.turnsToPig || false
              });
            }
          }
        }

        // Phoenix - revive as egg on death
        if (deadUnit.revivesAsEgg && deadUnit.eggHp > 0) {
          const eggCard = CARDS.find(c => c.id === 'phoenix_egg');
          if (eggCard) {
            const hatchTime = Date.now() + (deadUnit.eggDuration || 3000);
            unitsToSpawn.push({
              id: 'phoenix_egg_' + Date.now(),
              x: deadUnit.x,
              y: deadUnit.y,
              hp: deadUnit.eggHp,
              maxHp: deadUnit.eggHp,
              isOpponent: deadUnit.isOpponent,
              speed: 0,
              type: 'ground',
              range: 0,
              damage: 0,
              attackSpeed: 0,
              projectile: null,
              lane: deadUnit.lane,
              lastAttack: 0,
              spriteId: 'phoenix_egg',
              isToken: true,
              spawnTime: Date.now(),
              hatchTime: hatchTime,
              hatchesInto: 'phoenix',
              hatchDuration: deadUnit.eggDuration || 3000,
              revivesAsEgg: false
            });
          }
        }

        // Death visual effects
        if (deadUnit.spriteId === 'golem' || deadUnit.spriteId === 'golemite' || deadUnit.spriteId === 'elixir_golem' || deadUnit.spriteId === 'elixir_golemite') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'golem_death',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: deadUnit.spriteId.includes('elixir') ? 60 : 80,
            startTime: Date.now(),
            duration: 1000
          }]);
        } else if (deadUnit.spriteId === 'lava_hound') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'lava_hound_death',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: 100,
            startTime: Date.now(),
            duration: 1500
          }]);
        } else if (deadUnit.spriteId === 'tombstone') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'building_destruction',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: 50,
            startTime: Date.now(),
            duration: 800
          }]);
        } else if (deadUnit.spriteId === 'skeleton_barrel') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'goblin_barrel_spawn',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: 40,
            startTime: Date.now(),
            duration: 500
          }]);
        }

        // Death Damage (Ice Golem, Golem)
        if (deadUnit.deathDamage || deadUnit.spriteId === 'ice_golem') {
          const cardDef = CARDS.find(c => c.id === deadUnit.spriteId);

          if (cardDef && (cardDef.deathDamage || cardDef.deathSlow)) {
            if (cardDef.deathBombDelay) {
              // Delayed Death Bomb (Balloon, Giant Skeleton)
              setProjectiles(prev => [...prev, {
                id: Date.now() + Math.random(),
                x: deadUnit.x,
                y: deadUnit.y,
                targetX: deadUnit.x,
                targetY: deadUnit.y,
                speed: 0,
                damage: cardDef.deathDamage || 0,
                radius: cardDef.deathRadius || 60,
                type: 'bomb_delayed',
                visualType: 'bomb',
                isSpell: true,
                hit: false,
                spawnTime: Date.now(),
                delay: cardDef.deathBombDelay,
                isOpponent: deadUnit.isOpponent
              }]);

              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'bomb_drop',
                x: deadUnit.x,
                y: deadUnit.y,
                radius: 20,
                startTime: Date.now(),
                duration: 500
              }]);
            } else {
              // Instant Death Damage (Ice Golem, Golem)
              splashEvents.push({
                attacker: deadUnit,
                targetX: deadUnit.x,
                targetY: deadUnit.y,
                damage: cardDef.deathDamage || 0,
                slow: cardDef.deathSlow
              });

              let effectType = 'fire_explosion';
              let effectRadius = cardDef.deathRadius || 40;

              if (deadUnit.spriteId === 'ice_golem') {
                effectType = 'ice_nova';
                effectRadius = 80;
              }

              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: effectType,
                x: deadUnit.x,
                y: deadUnit.y,
                radius: effectRadius,
                startTime: Date.now(),
                duration: 800
              }]);
            }
          }
        }

        // Elixir Return (Elixir Golem chain)
        if (deadUnit.givesOpponentElixir) {
          if (deadUnit.isOpponent) {
            setElixir(prev => Math.min(10, prev + 1));
          } else {
            setEnemyElixir(prev => Math.min(10, prev + 1));
          }

          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'elixir_popup',
            x: deadUnit.x,
            y: deadUnit.y - 20,
            value: '+1',
            startTime: Date.now(),
            duration: 800
          }]);
        }

        // Mother Witch: If cursed unit dies, spawn Hog for the attacker
        if (deadUnit.cursedUntil && Date.now() < deadUnit.cursedUntil && deadUnit.type !== 'building') {
          const hogCard = CARDS.find(c => c.id === 'cursed_hog');
          if (hogCard) {
            const hogIsOpponent = deadUnit.cursedByAttackerSide;

            unitsToSpawn.push({
              id: 'hog_' + Date.now() + '_' + Math.random(),
              spriteId: 'cursed_hog',
              x: deadUnit.x,
              y: deadUnit.y,
              hp: hogCard.hp,
              maxHp: hogCard.hp,
              damage: hogCard.damage,
              speed: hogCard.speed,
              range: hogCard.range,
              attackSpeed: hogCard.attackSpeed,
              lastAttack: 0,
              type: 'ground',
              targetable: true,
              isOpponent: hogIsOpponent,
              lane: deadUnit.lane,
              spawnedPig: true
            });

            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'transformation',
              x: deadUnit.x,
              y: deadUnit.y,
              startTime: Date.now(),
              duration: 500
            }]);
          }
        }
      });

      // Show purple circle visual above all currently cursed units
      currentUnits.forEach(unit => {
        if (unit.cursedUntil && Date.now() < unit.cursedUntil && !unit.isPig && unit.type !== 'building') {
          // Create/update purple circle visual for this cursed unit
          // We use a unique ID based on unit ID to avoid duplicates
          const curseVisualId = `curse_${unit.id}`;
          // Only add if not already present (check existing visuals)
          setVisualEffects(prev => {
            // Filter out old curse visuals for this unit
            const filtered = prev.filter(v => v.id !== curseVisualId);
            // Add new curse visual that will last 100ms (refreshed each frame)
            return [...filtered, {
              id: curseVisualId,
              type: 'curse_purple',
              x: unit.x,
              y: unit.y - 20,
              radius: 25,
              startTime: Date.now(),
              duration: 100
            }];
          });
        }
      });

      // Update state
      const allUnits = [...currentUnits, ...unitsToSpawn];
      setUnits(allUnits);
      setProjectiles(activeProjectiles);
      setTowers(nextTowers);

    }, 50);

    return () => clearInterval(loop);
  }, [inGame, gameOver]);

  useEffect(() => {
    if (!inGame || gameOver) return;
    const interval = setInterval(() => {
      setElixir(prev => Math.min(prev + (isDoubleElixir ? 0.07 : 0.035), 10));
    }, 100);
    return () => clearInterval(interval);
  }, [inGame, gameOver, isDoubleElixir]);

  // Enemy Elixir Generation
  useEffect(() => {
    if (!inGame || gameOver) return;
    const interval = setInterval(() => {
      setEnemyElixir(prev => Math.min(prev + (isDoubleElixir ? 0.07 : 0.035), 10));
    }, 100);
    return () => clearInterval(interval);
  }, [inGame, gameOver, isDoubleElixir]);

  // Enemy AI - Play Cards Automatically
  useEffect(() => {
    if (!inGame || gameOver) return;

    const aiInterval = setInterval(() => {
      const currentElixir = enemyElixirRef.current;
      const currentHand = enemyHandRef.current || [];
      const allUnits = unitsRef.current || [];
      const playerUnits = allUnits.filter(u => !u.isOpponent && u.hp > 0);
      const enemyUnits = allUnits.filter(u => u.isOpponent && u.hp > 0);
      const enemyTowers = towersRef.current.filter(t => t.isOpponent && t.hp > 0);
      const playerTowers = towersRef.current.filter(t => !t.isOpponent && t.hp > 0);

      if (!currentHand.length) return;

      // --- DECK STRATEGY SETTINGS ---
      const deckType = enemyDeckIndex; // 0: Hog, 1: Bait, 2: BridgeSpam, 3: Golem, 4: Giant
      let elixirThreshold = 5; // Default: play cards at 5 elixir

      if (deckType === 3) elixirThreshold = 9.5; // Golem AI waits for max elixir
      if (deckType === 2) elixirThreshold = 7;   // Bridge Spam waits for decent elixir
      if (deckType === 0) elixirThreshold = 4;   // Hog Cycle plays fast

      // Always defend if under attack
      const isUnderAttack = playerUnits.some(u => u.y < height / 2 + 100);
      if (isUnderAttack) elixirThreshold = Math.min(elixirThreshold, 3);

      if (currentElixir < elixirThreshold) return;

      // --- CARD SELECTION ---
      let cardToPlay = null;
      let targetX = width / 2;
      let targetY = 100;

      // 1. Spell Countering (Reactive)
      const swarmUnits = playerUnits.filter(u => ['skeleton_army', 'minions', 'minion_horde', 'skeletons', 'bats'].includes(u.spriteId));
      if (swarmUnits.length >= 3) {
        const spellIdx = currentHand.findIndex(c => c.type === 'spell' && ['arrows', 'zap', 'fireball', 'poison'].includes(c.id));
        if (spellIdx !== -1) {
          cardToPlay = currentHand[spellIdx];
          const target = swarmUnits[Math.floor(swarmUnits.length / 2)];
          targetX = target.x; targetY = target.y;
        }
      }

      // 2. Win Condition / Deck Strategy (Proactive)
      if (!cardToPlay) {
        if (deckType === 3 && currentElixir >= 9.5) {
          // Golem: Spawn in back
          const golemIdx = currentHand.findIndex(c => c.id === 'golem');
          if (golemIdx !== -1) {
            cardToPlay = currentHand[golemIdx];
            targetX = Math.random() < 0.5 ? 70 : width - 70;
            targetY = 50; // Deep back
          }
        } else if (deckType === 0) {
          // Hog: Play at bridge
          const hogIdx = currentHand.findIndex(c => c.id === 'hog_rider');
          if (hogIdx !== -1) {
            cardToPlay = currentHand[hogIdx];
            targetX = Math.random() < 0.5 ? 95 : width - 95;
            targetY = height / 2 - 40; // Bridge
          }
        } else if (deckType === 1) {
          // Bait: Goblin Barrel on tower
          const barrelIdx = currentHand.findIndex(c => c.id === 'goblin_barrel');
          if (barrelIdx !== -1 && playerTowers.length > 0) {
            cardToPlay = currentHand[barrelIdx];
            const targetTower = playerTowers[Math.floor(Math.random() * playerTowers.length)];
            targetX = targetTower.x; targetY = targetTower.y;
          }
        }
      }

      // 3. Fallback: Defend or Cycle
      if (!cardToPlay) {
        // Find best affordable card
        const affordable = currentHand.filter(c => c.cost <= currentElixir);
        if (affordable.length > 0) {
          // Sort: prefer cheap cards if defending, expensive if building push
          affordable.sort((a, b) => isUnderAttack ? (a.cost - b.cost) : (b.cost - a.cost));
          cardToPlay = affordable[0];

          if (isUnderAttack) {
            // Deploy defensively
            targetX = playerUnits[0].x + (Math.random() * 20 - 10);
            targetY = 150; // In front of towers
          } else {
            // Deploy at bridge or back based on type
            const isTank = cardToPlay.hp > 1500;
            targetX = Math.random() < 0.5 ? 70 : width - 70;
            targetY = isTank ? 50 : 120;
          }
        }
      }

      if (cardToPlay) {
        spawnCard(cardToPlay, targetX, targetY, true);
      }
    }, 1800); // Faster decision making (1.8s)

    return () => clearInterval(aiInterval);
  }, [inGame, gameOver, enemyDeckIndex]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartBattle = () => {
    resetGame();
    setInLobby(false);
    setInGame(true);
  };

  // Render based on navigation state
  if (!inGame && !inLobby) {
    return <MainMenu onStart={() => setInLobby(true)} />;
  }

  if (!inGame && inLobby) {
    return (
      <>
        <MainLobby
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStartGame={handleStartBattle}
          currentDeck={userCards}
          onSwapCards={handleSwapCards}
          dragHandlers={{ start: onGlobalDragStart, move: onGlobalDragMove, end: onGlobalDragEnd }}
          selectedDeckIndex={selectedDeckIndex}
          setSelectedDeckIndex={setSelectedDeckIndex}
          allDecks={allDecks}
          chests={chests}
          onUnlockChest={handleUnlockChest}
          onOpenChest={handleOpenChest}
          onFriendlyBattle={handleFriendlyBattle}
        />
        {openingChest && (
          <ChestOpeningModal
            chest={openingChest}
            onClose={handleCollectRewards}
          />
        )}
        <FriendlyBattleModal
          visible={friendlyModalVisible}
          onClose={() => setFriendlyModalVisible(false)}
          socket={socketRef.current}
        />
      </>
    );
  }

  return (
    <>
      <GameBoard
        towers={towers}
        units={units}
        projectiles={projectiles}
        visualEffects={visualEffects}
        setVisualEffects={setVisualEffects}
        screenShake={screenShake}
        setScreenShake={setScreenShake}
        timeLeft={timeLeft}
        gameOver={gameOver}
        elixir={elixir}
        enemyElixir={enemyElixir}
        hand={hand}
        nextCard={nextCard}
        draggingCard={draggingCard}
        dragPosition={dragPosition}
        handleDragStart={handleDragStart}
        handleDragMove={handleDragMove}
        handleDragEnd={handleDragEnd}
        spawnTestEnemy={spawnTestEnemy}
        formatTime={formatTime}
        onRestart={(dest) => resetGame(dest)}
        score={score}
        isDoubleElixir={isDoubleElixir}
        showDoubleElixirAlert={showDoubleElixirAlert}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onConcede={concedeGame}
      />      {globalDraggingCard && (
        <View style={[styles.dragProxy, {
          position: 'absolute',
          left: globalDragPosition.x - 30,
          top: globalDragPosition.y - 37.5,
          zIndex: 9999,
          elevation: 100,
          backgroundColor: 'transparent'
        }]}>
          <UnitSprite id={globalDraggingCard.id} isOpponent={false} size={50} />
          <View style={styles.dragProxyLabel}>
            <Text style={styles.cardName}>{globalDraggingCard.name}</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // --- New Battle Tab Styles ---
  crownChestBar: {
    width: '95%',
    height: 45,
    backgroundColor: '#34495e',
    borderRadius: 22.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#2c3e50',
    elevation: 5,
  },
  passRoyaleIcon: {
    width: 35,
    height: 35,
    backgroundColor: '#f1c40f',
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  crownProgressContainer: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  crownProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  crownProgressFill: {
    height: '100%',
    backgroundColor: '#f1c40f',
  },
  crownProgressText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  crownChestReward: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arenaMainView: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyRoadContainer: {
    width: '80%',
    height: 20,
    marginTop: 10,
  },
  trophyRoadTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#2c3e50',
    borderRadius: 4,
    position: 'relative',
  },
  trophyRoadFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  trophyMarker: {
    position: 'absolute',
    top: -15,
    alignItems: 'center',
  },
  trophyMarkerText: {
    color: '#f1c40f',
    fontSize: 10,
    fontWeight: 'bold',
  },
  arenaVisualContainer: {
    marginVertical: 20,
    elevation: 10,
  },
  battleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  smallBlueButton: {
    width: 50,
    height: 50,
    backgroundColor: '#3498db',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2980b9',
    borderBottomWidth: 5,
    borderBottomColor: '#1f618d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButtonIcon: {
    fontSize: 24,
  },
  battleButtonTrophyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
  },
  battleButtonTrophyText: {
    color: '#5D4037',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 2,
  },

  // --- New Deck Tab Styles ---
  deckGridContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#f1c40f',
  },
  deckSelectorMini: {
    flexDirection: 'row',
    gap: 5,
  },
  deckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
  },
  deckDotActive: {
    backgroundColor: '#f1c40f',
  },
  deckCardGrid: {
    marginVertical: 10,
  },
  cardRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deckCardCompact: {
    width: '23%',
    aspectRatio: 0.8,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardCostSmall: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cardCostSmallText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deckFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  towerTroopSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  towerTroopText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avgElixirText: {
    color: '#f1c40f',
    fontSize: 12,
    fontWeight: 'bold',
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  collectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterButtonMini: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#34495e',
    borderRadius: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34495e',
  },
  searchInput: {
    flex: 1,
    padding: 10,
    color: '#fff',
    fontSize: 14,
    minHeight: 40,
  },
  searchClearButton: {
    padding: 8,
    marginRight: 5,
  },
  searchClearButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- New Shop Styles ---
  specialOfferBanner: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 8,
  },
  specialOfferGradient: {
    flex: 1,
    padding: 15,
  },
  offerTag: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  offerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  offerImageRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 15,
  },
  offerButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignSelf: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#27ae60',
  },
  offerButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  dealRarityBar: {
    width: '100%',
    height: 4,
    position: 'absolute',
    top: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  chestShopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  shopChestCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 5,
  },
  shopChestName: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  shopChestPrice: {
    backgroundColor: '#34495e',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  shopChestPriceText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // --- New Social Styles ---
  socialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#2c3e50',
    borderBottomWidth: 3,
    borderBottomColor: '#f1c40f',
  },
  clanMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  clanBadgeLarge: {
    width: 50,
    height: 55,
    backgroundColor: '#3498db',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  clanNameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  clanStatusText: {
    color: '#bdc3c7',
    fontSize: 12,
  },
  requestBanner: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  requestText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  requestButton: {
    backgroundColor: '#f1c40f',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  requestButtonText: {
    fontWeight: '900',
    fontSize: 12,
  },

  // --- New Events Tab Styles ---
  eventsContainer: {
    flex: 1,
    padding: 10,
  },
  eventCard: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 5,
  },
  eventGradient: {
    padding: 20,
  },
  eventBadge: {
    backgroundColor: '#f1c40f',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  eventBadgeText: {
    fontWeight: '900',
    fontSize: 10,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  eventSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 15,
  },
  eventRewards: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  rewardValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  eventButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#27ae60',
  },
  eventButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  eventStatsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  eventStat: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // --- Existing Styles (Optimized) ---
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  menuContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackgroundImage: {
    resizeMode: 'cover',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Lighter overlay for better bg visibility
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  logoTextClash: {
    fontSize: 50,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    fontFamily: 'sans-serif-condensed', // Attempt to match font
    marginBottom: -10, // Stack them
  },
  logoTextRoyale: {
    fontSize: 50,
    fontWeight: '900',
    color: '#FFD700', // Gold
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    fontFamily: 'sans-serif-condensed',
  },
  loadingBottomContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  loadingPercentage: {
    color: '#D442F5', // Pink/Purple text
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    width: 50,
    textAlign: 'right',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  loadingBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    backgroundColor: '#D442F5', // Purple loading bar
  },
  loadingStateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  copyrightText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 10,
  },
  // Legacy styles (kept if needed by other components, though mostly replaced)
  headerContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  bottomContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 50,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: '#8B4500',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    marginBottom: 0,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
    marginBottom: 0,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 25,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBarBg: {
    width: '100%',
    height: 30,
    backgroundColor: '#333',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#BDC3C7', // Silver border
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F39C12', // Orange base
    borderRightWidth: 4,
    borderRightColor: '#F1C40F', // Highlight edge
  },
  battleButton: {
    backgroundColor: '#F1C40F', // Main Gold Color
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F39C12', // Darker Gold Border
    borderBottomWidth: 6,
    borderBottomColor: '#C27C0E', // Shadow/3D effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 20, // Add space at bottom
  },
  battleButtonText: {
    color: '#5D4037', // Dark Brown Text
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
    fontFamily: 'sans-serif-condensed', // Match CR font style
  },
  battleButtonSubtext: {
    color: '#5D4037',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: -2,
  },
  friendlyButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2980b9',
    borderBottomWidth: 4,
    borderBottomColor: '#1f618d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 20,
  },
  friendlyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  // Friendly Battle Modal
  friendlyModalContent: {
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 350,
    borderWidth: 4,
    borderColor: '#3498db',
    alignItems: 'center',
  },
  friendlyModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  roomInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#bdc3c7',
    marginBottom: 20,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  roomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  createRoomButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#27ae60',
  },
  joinRoomButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#2980b9',
  },
  roomButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  roomCodeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#3498db',
    marginVertical: 20,
    letterSpacing: 5,
  },
  waitingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 25,
  },
  gameBoard: {
    flex: 1,
    backgroundColor: '#639c3e', // Better grass green
    position: 'relative',
    overflow: 'hidden',
  },
  river: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    height: 50,
    backgroundColor: '#4fa3d1',
    width: '100%',
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#8fb8d6', // Lighter foam edge
    zIndex: 1,
    opacity: 0.9,
  },
  bridge: {
    position: 'absolute',
    width: 60,
    height: 54, // Slightly longer than river to overlap
    top: -2,
    backgroundColor: '#795548', // Wood brown
    borderColor: '#3e2723',
    borderWidth: 2,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  towerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    elevation: 8,
  },
  arrowContainer: {
    position: 'absolute',
    width: 20,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  arrowShaft: {
    width: 15,
    height: 2,
    backgroundColor: '#8B4513',
    position: 'absolute',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#A9A9A9',
    position: 'absolute',
    right: 0,
  },
  cannonball: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: 'black',
    borderRadius: 6,
    zIndex: 100,
  },
  bullet: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#2c3e50',
    borderRadius: 4,
    zIndex: 100,
  },
  witchProjectile: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#9b59b6',
    borderRadius: 5,
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#8e44ad',
    shadowColor: '#9b59b6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  dragonFire: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#2ecc71',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  fireballSmall: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: '#e67e22',
    borderRadius: 7,
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#f1c40f',
  },
  fireballSpell: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#f1c40f',
    shadowColor: 'orange',
    shadowRadius: 10,
    elevation: 10,
  },
  zapSpell: {
    position: 'absolute',
    width: 50,
    height: 50,
    zIndex: 100,
  },
  lightningBolt: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 25,
    opacity: 0.8,
    shadowColor: '#3498db',
    shadowRadius: 15,
    elevation: 15,
  },
  arrowsSpell: {
    position: 'absolute',
    width: 40,
    height: 40,
    zIndex: 100,
  },
  arrowVolley: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 20,
    opacity: 0.7,
    shadowColor: '#27ae60',
    shadowRadius: 10,
    elevation: 10,
  },
  poisonSpell: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: 'rgba(155, 89, 182, 0.4)',
    borderRadius: 50,
    zIndex: 100,
    borderWidth: 3,
    borderColor: '#9b59b6',
  },
  unit: {
    position: 'absolute',
    width: 30,
    height: 30,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBarBack: {
    position: 'absolute',
    top: -10,
    width: '120%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  healthBarFront: {
    height: '100%',
  },
  footerContainer: {
    backgroundColor: '#1a1a2e',
    paddingBottom: 8,
    borderTopWidth: 3,
    borderTopColor: '#D442F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  deckContainer: {
    flexDirection: 'row',
    padding: 5,
    alignItems: 'flex-end',
    height: 90,
  },
  nextCardContainer: {
    width: 50,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  card: {
    width: 60,
    height: 75,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  hiddenCard: {
    opacity: 0.3,
  },
  nextCard: {
    width: 40,
    height: 50,
    opacity: 0.8,
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 2,
  },
  elixirCostBubble: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  elixirCostText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  nextLabel: {
    position: 'absolute',
    top: -15,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  elixirSection: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  elixirContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  elixirText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
    width: 25,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  elixirBarBack: {
    flex: 1,
    height: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0f0f1a',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  elixirBarFill: {
    height: '100%',
    backgroundColor: '#D442F5',
    borderRadius: 8,
  },
  elixirTick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  debugBtnSmall: {
    backgroundColor: '#555',
    padding: 5,
    borderRadius: 4,
    marginLeft: 10,
  },
  dragProxy: {
    position: 'absolute',
    width: 60,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  dragProxyLabel: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    borderRadius: 4,
    marginTop: 5,
  },
  timerContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    zIndex: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 1,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  gameOverTitle: {
    fontSize: 52,
    fontWeight: '900',
    marginBottom: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  restartButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Lobby Styles
  lobbyContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  lobbyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tabContentArea: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  bottomNavigation: {
    height: 75,
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#D442F5',
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 15,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabButtonActive: {
    borderTopWidth: 4,
    borderTopColor: '#D442F5',
  },
  tabIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#D442F5',
    fontWeight: '900',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F1C40F',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 18,
    color: '#888',
  },
  battleTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  deckPreviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1C40F',
    marginBottom: 20,
  },
  deckPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  miniCard: {
    width: 70,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 5,
    borderWidth: 3,
    // borderColor set dynamically
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  miniCardName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
  },
  miniCardCost: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  miniCardCostText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // --- Deck Tab Styles ---
  deckTabContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  deckHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  deckTabTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  magicItemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2980b9',
  },
  magicItemIcon: {
    marginRight: 5,
  },
  magicItemsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deckStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  deckStatItem: {
    alignItems: 'center',
  },
  deckStatLabel: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 2,
    fontWeight: '600',
  },
  deckStatValue: {
    color: '#D442F5',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  deckStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  deckSelectorContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  deckSelectorLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  deckSelectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  deckSelectorButton: {
    flex: 1,
    backgroundColor: 'rgba(52, 152, 219, 0.4)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2980b9',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  deckSelectorButtonActive: {
    backgroundColor: '#2980b9',
    borderColor: '#f1c40f',
    shadowColor: '#f1c40f',
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  deckSelectorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deckSelectorButtonTextActive: {
    color: '#f1c40f',
    fontSize: 17,
    textShadowColor: 'rgba(241, 196, 15, 0.5)',
    textShadowRadius: 4,
  },
  filterContainer: {
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  filterButtonActive: {
    backgroundColor: '#34495e',
    borderColor: '#fff',
  },
  filterButtonText: {
    color: '#bdc3c7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  deckBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 3,
    borderColor: '#F1C40F',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  deckBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F1C40F',
    marginBottom: 8,
    textAlign: 'center',
  },
  deckBoxInner: {
    alignItems: 'center',
  },
  allCardsScroll: {
    flex: 1,
    marginBottom: 80,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  deckCard: {
    width: 70,
    height: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F1C40F',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 3,
  },
  deckCardBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  deckCardBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deckCardHighlight: {
    backgroundColor: 'rgba(241, 196, 15, 0.4)',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  draggableCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  dragHandle: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  dragHandleIcon: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: -2,
  },
  deckCardSelected: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
    borderWidth: 3,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#2ecc71',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  swapInstructions: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  swapInstructionsText: {
    color: '#2ecc71',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  cancelButton: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  deckCardName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 3,
  },
  deckCardCost: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  deckCardCostText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
  },
  cardTypeBadge: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#ff4500',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardTypeBadgeFlying: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#27ae60',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardTypeBadgeBuilding: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#8B4513',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardTypeText: {
    color: '#fff',
    fontSize: 6,
    fontWeight: '900',
  },
  // Card Detail Modal Styles
  cardDetailModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardDetailModalContent: {
    backgroundColor: '#2c3e50',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 350,
    borderWidth: 4,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#e74c3c',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardDetailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardDetailIconBig: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  cardDetailCostBig: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 10,
  },
  cardDetailCostBigText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  cardDetailNameBig: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F1C40F',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDetailTypeBig: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4500',
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  cardDetailTypeBigFlying: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  cardDetailTypeBigBuilding: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    backgroundColor: 'rgba(139, 69, 19, 0.2)',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  cardDetailStatsBig: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: '#F1C40F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  // --- New Battle Screen Styles ---
  topInfoBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomInfoBar: {
    position: 'absolute',
    bottom: 145, // Just above the footer
    left: 10,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfoContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  playerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  clanName: {
    color: '#ccc',
    fontSize: 10,
    fontStyle: 'italic',
  },
  trophyContainer: {
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    padding: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F1C40F',
  },
  trophyText: {
    color: '#F1C40F',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scoreBoard: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  crownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  crownIcon: {
    fontSize: 18,
    marginHorizontal: 2,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 35,
    height: 35,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    zIndex: 60,
  },
  emoteButton: {
    position: 'absolute',
    bottom: 145,
    left: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    zIndex: 60,
    display: 'none', // Hidden for now as it overlaps with player info, or we can move it
  },
  timerTextRed: {
    color: '#e74c3c',
  },
  elixirBubble: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  elixirBubbleDouble: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  elixirDoubleText: {
    position: 'absolute',
    bottom: -2,
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  elixirBarFillDouble: {
    backgroundColor: '#FFD700',
  },
  // --- Double Elixir Alert Styles ---
  doubleElixirAlert: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  doubleElixirAlertContent: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFA500',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
    alignItems: 'center',
  },
  doubleElixirAlertTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#8B4500',
    textShadowColor: '#FFA500',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 5,
  },
  doubleElixirAlertSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4500',
  },
  // --- Lobby Header Styles ---
  lobbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: 'rgba(20, 20, 35, 0.95)',
    borderBottomWidth: 3,
    borderBottomColor: '#D442F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  lobbyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpLevelContainer: {
    width: 38,
    height: 38,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: '#9b59b6',
    marginRight: 12,
    shadowColor: '#9b59b6',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  xpLevelText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    transform: [{ rotate: '-45deg' }],
  },
  playerIdentity: {
    justifyContent: 'center',
  },
  lobbyPlayerName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  xpBarContainer: {
    width: 85,
    height: 9,
    backgroundColor: '#2c3e50',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  xpBarFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#667eea',
  },
  lobbyHeaderRight: {
    flexDirection: 'row',
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: 'rgba(212, 66, 245, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  currencyIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  currencyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // --- Chest Slots Styles ---
  chestSlotsContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  chestSlotsTitle: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  chestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chestSlot: {
    width: '23%',
    height: 60,
    backgroundColor: '#5D4037', // Brown
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  chestSlotEmpty: {
    width: '23%',
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chestText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 2,
  },
  chestTimer: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  chestTextEmpty: {
    color: '#777',
    fontSize: 9,
    textAlign: 'center',
  },
  // --- Arena Title Styles ---
  arenaTitleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  arenaTitle: {
    color: '#F1C40F',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  arenaSubtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  battleButtonSubtext: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  // --- Shop Styles ---
  shopContainer: {
    flex: 1,
    padding: 10,
  },
  shopSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  shopSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  shopSectionTimer: {
    color: '#f1c40f',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dealCard: {
    width: '32%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 5,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bdc3c7',
  },
  dealHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 5,
  },
  dealImageContainer: {
    marginVertical: 5,
    alignItems: 'center',
  },
  dealCount: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  dealName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
    height: 25,
  },
  buyButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#27ae60',
  },
  buyButtonFree: {
    backgroundColor: '#f1c40f',
    borderBottomColor: '#f39c12',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  passBanner: {
    backgroundColor: '#f1c40f',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  passBannerLeft: {
    flex: 1,
  },
  passBannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 2,
  },
  passButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  passButtonText: {
    color: '#f1c40f',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // --- Clan Styles ---
  clanTabContainer: {
    flex: 1,
  },
  clanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginBottom: 5,
  },
  clanHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clanBadge: {
    width: 40,
    height: 45,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#2980b9',
  },
  clanName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  clanStats: {
    color: '#ccc',
    fontSize: 12,
  },
  clanInfoButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  chatList: {
    flex: 1,
  },
  chatRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  chatRowMe: {
    justifyContent: 'flex-end',
  },
  chatRowOther: {
    justifyContent: 'flex-start',
  },
  chatAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  chatBubbleMe: {
    backgroundColor: '#3498db',
    borderBottomRightRadius: 0,
  },
  chatBubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 0,
  },
  chatUser: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 2,
  },
  chatRole: {
    color: '#999',
    fontWeight: 'normal',
  },
  chatText: {
    color: '#333', // Default text color
    fontSize: 14,
  },
  chatTime: {
    fontSize: 8,
    color: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  systemMessageText: {
    color: '#ccc',
    fontSize: 10,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    height: 40,
  },
  sendButton: {
    backgroundColor: '#f1c40f',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  // --- Card Menu Styles ---
  cardMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardMenuContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 3,
    borderColor: '#F1C40F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  cardMenuPreview: {
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  cardMenuIconWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 10,
  },
  cardMenuIcon: {
    fontSize: 50,
  },
  cardMenuCostBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  cardMenuCostText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  cardMenuName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F1C40F',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardMenuRarityBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
  },
  cardMenuRarityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardMenuStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  cardMenuStat: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardMenuStatLabel: {
    color: '#aaa',
    fontSize: 10,
    marginBottom: 2,
    fontWeight: '600',
  },
  cardMenuStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardMenuButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardMenuButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMenuButtonInfo: {
    backgroundColor: '#3498db',
    borderBottomWidth: 3,
    borderBottomColor: '#2980b9',
  },
  cardMenuButtonSwap: {
    backgroundColor: '#2ecc71',
    borderBottomWidth: 3,
    borderBottomColor: '#27ae60',
  },
  cardMenuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  cardMenuOr: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  cardMenuCancel: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardMenuCancelText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // --- Deck Slot Selector Styles ---
  deckSelectorContainer: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  deckSelectorLabel: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    letterSpacing: 1,
  },
  deckSelectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 3,
  },
  deckSelectorButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  deckSelectorButtonActive: {
    backgroundColor: '#F1C40F',
  },
  deckSelectorButtonText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deckSelectorButtonTextActive: {
    color: '#000',
  },
  slotSelectorContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slotSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  slotSelectorDeck: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: '#F1C40F',
  },
  slotSelectorSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  slotSelectorSlot: {
    width: 70,
    height: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F1C40F',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  slotSelectorSlotHighlighted: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
    borderWidth: 3,
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  slotSelectorSlotIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  slotSelectorSlotName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 3,
    textAlign: 'center',
  },
  slotSelectorSlotCost: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  slotSelectorSlotCostText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
  },
  slotSelectorCancel: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#e74c3c',
    borderRadius: 25,
  },
  slotSelectorCancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Chest Opening Modal Styles
  chestModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 50,
  },
  chestModalContent: {
    alignItems: 'center',
    width: '100%',
  },
  chestModalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 40,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 2,
  },
  chestVisual: {
    width: 200,
    height: 160,
    backgroundColor: '#5D4037', // Brown
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
  },
  chestTapText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.8,
    marginTop: 20,
  },
  rewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 20,
  },
  rewardRevealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 30,
  },
  rewardItemLarge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconLarge: {
    fontSize: 80,
    marginBottom: 10,
  },
  rewardValueLarge: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  rewardLabelLarge: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardCountBadge: {
    backgroundColor: '#34495e',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardCountText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  itemCountBadge: {
    position: 'absolute',
    top: -20,
    right: 40,
    backgroundColor: '#e74c3c',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 10,
    zIndex: 100,
  },
  itemCountText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  closeChestButton: {
    marginTop: 40,
    backgroundColor: '#F1C40F',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderBottomWidth: 5,
    borderBottomColor: '#c29d0b',
  },
  closeChestButtonText: {
    color: '#3e2723',
    fontSize: 20,
    fontWeight: '900',
  },
  chestOpenText: {
    color: '#2ecc71',
    fontWeight: '900',
    fontSize: 10,
    textShadowColor: 'black',
    textShadowRadius: 1,
  },
  chestLockedText: {
    color: '#7f8c8d',
    fontWeight: 'bold',
    fontSize: 10,
  },
});
