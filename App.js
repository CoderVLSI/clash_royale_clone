import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, PanResponder, Animated, Image, ImageBackground, ScrollView, Modal, TextInput, KeyboardAvoidingView, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import Svg, { Circle, Rect, Path, G, Defs, LinearGradient, Stop, Polygon, Text as SvgText } from 'react-native-svg';
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
  { id: 'knight', name: 'Knight', cost: 3, color: '#f1c40f', hp: 1400, speed: 1.5, type: 'ground', range: 20, damage: 150, attackSpeed: 1200, projectile: null, count: 1, rarity: 'common' },
  { id: 'archers', name: 'Archers', cost: 3, color: '#e67e22', hp: 250, speed: 2, type: 'ground', range: 80, damage: 100, attackSpeed: 1000, projectile: 'arrow', count: 2, rarity: 'common' },
  { id: 'giant', name: 'Giant', cost: 5, color: '#e74c3c', hp: 3000, speed: 1, type: 'ground', range: 20, damage: 200, attackSpeed: 1500, projectile: null, count: 1, targetType: 'buildings', rarity: 'rare' },
  { id: 'mini_pekka', name: 'Mini P', cost: 4, color: '#9b59b6', hp: 1100, speed: 2.5, type: 'ground', range: 25, damage: 350, attackSpeed: 1400, projectile: null, count: 1, rarity: 'rare' },
  { id: 'spear_goblins', name: 'Spear Gobs', cost: 2, color: '#2ecc71', hp: 110, speed: 3, type: 'ground', range: 110, damage: 65, attackSpeed: 1100, projectile: 'spear', count: 3, rarity: 'common' },
  { id: 'musketeer', name: 'Musket', cost: 4, color: '#34495e', hp: 800, speed: 1.5, type: 'ground', range: 100, damage: 180, attackSpeed: 1100, projectile: 'bullet', count: 1, rarity: 'rare' },
  { id: 'baby_dragon', name: 'Baby D', cost: 4, color: '#27ae60', hp: 1200, speed: 2, type: 'flying', range: 80, damage: 130, attackSpeed: 1300, projectile: 'dragon_fire', count: 1, splash: true, rarity: 'epic' },
  { id: 'fireball', name: 'Fireball', cost: 4, color: '#ff4500', type: 'spell', damage: 325, radius: 60, count: 1, rarity: 'rare' },

  // New cards
  { id: 'cannon', name: 'Cannon', cost: 3, color: '#8B4513', hp: 380, speed: 0, type: 'building', range: 90, damage: 60, attackSpeed: 1000, projectile: 'cannonball', count: 1, lifetime: 30, rarity: 'common' },
  { id: 'barbarians', name: 'Barbarians', cost: 5, color: '#CD853F', hp: 300, speed: 1.5, type: 'ground', range: 30, damage: 75, attackSpeed: 1500, projectile: null, count: 5, rarity: 'common' },
  { id: 'arrows', name: 'Arrows', cost: 3, color: '#2ecc71', type: 'spell', damage: 115, radius: 40, count: 1, rarity: 'common' },
  { id: 'zap', name: 'Zap', cost: 2, color: '#3498db', type: 'spell', damage: 140, radius: 35, count: 1, stun: 0.5, rarity: 'common' },
  { id: 'minions', name: 'Minions', cost: 3, color: '#9b59b6', hp: 90, speed: 3, type: 'flying', range: 50, damage: 80, attackSpeed: 1000, projectile: 'dark_ball', count: 3, rarity: 'common' },
  { id: 'skeleton_army', name: 'Skeleton Army', cost: 3, color: '#ecf0f1', hp: 40, speed: 2, type: 'ground', range: 25, damage: 40, attackSpeed: 1000, projectile: null, count: 15, rarity: 'epic' },
  { id: 'skeletons', name: 'Skelly', cost: 1, color: '#bdc3c7', hp: 40, speed: 2, type: 'ground', range: 25, damage: 40, attackSpeed: 1000, projectile: null, count: 3, rarity: 'common' },
  { id: 'valkyrie', name: 'Valkyrie', cost: 4, color: '#e74c3c', hp: 1200, speed: 1.5, type: 'ground', range: 25, damage: 120, attackSpeed: 1500, projectile: null, count: 1, splash: true, rarity: 'rare' },
  { id: 'poison', name: 'Poison', cost: 4, color: '#27ae60', type: 'spell', damage: 70, radius: 50, count: 1, duration: 5, rarity: 'epic' },
  { id: 'minion_horde', name: 'Minion H', cost: 5, color: '#8e44ad', hp: 90, speed: 3, type: 'flying', range: 50, damage: 80, attackSpeed: 1000, projectile: 'dark_ball', count: 6, rarity: 'common' },
  { id: 'witch', name: 'Witch', cost: 5, color: '#9b59b6', hp: 700, speed: 1.5, type: 'ground', range: 55, damage: 100, attackSpeed: 1000, projectile: 'witch_projectile', count: 1, splash: true, spawns: 'skeletons', spawnRate: 5, spawnCount: 3, rarity: 'epic' },
  { id: 'hog_rider', name: 'Hog', cost: 4, color: '#e67e22', hp: 1600, speed: 3.5, type: 'ground', range: 25, damage: 180, attackSpeed: 1600, projectile: null, count: 1, targetType: 'buildings', jumps: true, rarity: 'rare' },
  { id: 'prince', name: 'Prince', cost: 5, color: '#f39c12', hp: 1100, speed: 2, type: 'ground', range: 30, damage: 245, attackSpeed: 1500, projectile: null, count: 1, charge: true, rarity: 'epic' },
  { id: 'tesla', name: 'Tesla', cost: 4, color: '#f1c40f', hp: 600, speed: 0, type: 'building', range: 55, damage: 100, attackSpeed: 800, projectile: 'tesla_lightning', count: 1, lifetime: 35, hidden: true, rarity: 'common' },
  { id: 'wizard', name: 'Wizard', cost: 5, color: '#9b59b6', hp: 600, speed: 1.5, type: 'ground', range: 60, damage: 170, attackSpeed: 1400, projectile: 'fireball_small', count: 1, splash: true, rarity: 'rare' },
  { id: 'tombstone', name: 'Tombstone', cost: 3, color: '#95a5a6', hp: 450, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 40, spawns: 'skeletons', spawnRate: 3.1, spawnCount: 2, deathSpawnCount: 4, rarity: 'rare' },
  { id: 'sword_goblins', name: 'Sword Gobs', cost: 3, color: '#2ecc71', hp: 162, speed: 3, type: 'ground', range: 25, damage: 100, attackSpeed: 900, projectile: null, count: 3, rarity: 'common' },
  { id: 'ice_wizard', name: 'Ice Wiz', cost: 3, color: '#3498db', hp: 590, speed: 1.5, type: 'ground', range: 55, damage: 75, attackSpeed: 1700, projectile: 'ice_shard', count: 1, splash: true, rarity: 'legendary', slow: 0.35, spawnDamage: 75 },

  // Lava Hound & Lava Pups
  { id: 'lava_hound', name: 'Lava Hound', cost: 7, color: '#c0392b', hp: 3150, speed: 1, type: 'flying', range: 25, damage: 35, attackSpeed: 1300, projectile: null, count: 1, targetType: 'buildings', rarity: 'legendary', deathSpawns: 'lava_pups', deathSpawnCount: 6 },
  { id: 'lava_pups', name: 'Lava Pups', cost: 0, color: '#e74c3c', hp: 180, speed: 2, type: 'flying', range: 50, damage: 45, attackSpeed: 1000, projectile: 'lava_shot', count: 1, rarity: 'common', isToken: true },

  // Super easy additions
  { id: 'three_musketeers', name: '3 Musketeers', cost: 9, color: '#34495e', hp: 800, speed: 1.5, type: 'ground', range: 100, damage: 180, attackSpeed: 1100, projectile: 'bullet', count: 3, rarity: 'rare' },
  { id: 'royal_giant', name: 'Royal Giant', cost: 6, color: '#e67e22', hp: 1800, speed: 1.2, type: 'ground', range: 90, damage: 140, attackSpeed: 1300, projectile: 'cannonball', count: 1, targetType: 'buildings', rarity: 'rare' },
  { id: 'rocket', name: 'Rocket', cost: 6, color: '#ff4500', type: 'spell', damage: 600, radius: 30, count: 1, rarity: 'rare' },

  // Medium easy additions
  { id: 'dark_prince', name: 'Dark Prince', cost: 4, color: '#2c3e50', hp: 1100, speed: 2, type: 'ground', range: 30, damage: 220, attackSpeed: 1500, projectile: null, count: 1, splash: true, charge: true, rarity: 'epic' },
  { id: 'elite_barbarians', name: 'Elite Barbs', cost: 6, color: '#c0392b', hp: 600, speed: 3, type: 'ground', range: 30, damage: 200, attackSpeed: 1400, projectile: null, count: 2, rarity: 'epic' },
  { id: 'golem', name: 'Golem', cost: 8, color: '#7f8c8d', hp: 4000, speed: 0.9, type: 'ground', range: 20, damage: 200, attackSpeed: 1700, projectile: null, count: 1, targetType: 'buildings', rarity: 'epic', deathSpawns: 'golemite', deathSpawnCount: 2, spawnDelay: 1000 },
  { id: 'golemite', name: 'Golemite', cost: 0, color: '#95a5a6', hp: 1300, speed: 1, type: 'ground', range: 20, damage: 100, attackSpeed: 1700, projectile: null, count: 1, targetType: 'buildings', rarity: 'common', isToken: true, deathSpawns: 'golemite', deathSpawnCount: 1, spawnDelay: 500 },

  // Next set of additions
  { id: 'pekka', name: 'P.E.K.K.A', cost: 7, color: '#8e44ad', hp: 2900, speed: 1, type: 'ground', range: 25, damage: 650, attackSpeed: 1800, projectile: null, count: 1, rarity: 'epic' },
  { id: 'mega_knight', name: 'Mega Knight', cost: 7, color: '#e67e22', hp: 3300, speed: 1.5, type: 'ground', range: 25, damage: 240, attackSpeed: 1600, projectile: null, count: 1, splash: true, spawnDamage: 180, jumps: true, rarity: 'legendary' },
  { id: 'electro_wizard', name: 'Electro Wiz', cost: 4, color: '#3498db', hp: 590, speed: 1.5, type: 'ground', range: 55, damage: 170, attackSpeed: 1100, projectile: 'electric_bolt', count: 1, splash: false, stun: 0.5, rarity: 'legendary', spawnDamage: 170 },
  { id: 'lightning', name: 'Lightning', cost: 6, color: '#f1c40f', type: 'spell', damage: 900, radius: 15, count: 1, rarity: 'epic' },
  { id: 'x_bow', name: 'X-Bow', cost: 6, color: '#95a5a6', hp: 700, speed: 0, type: 'building', range: 280, damage: 40, attackSpeed: 100, projectile: 'arrow', count: 1, lifetime: 30, rarity: 'epic', spawnDelay: 3500 },
  { id: 'mirror', name: 'Mirror', cost: 1, color: '#ecf0f1', type: 'spell', isMirror: true, rarity: 'epic' },

  // Spirit Cards - All cost 1 Elixir and die when they attack
  { id: 'fire_spirit', name: 'Fire Spirit', cost: 1, color: '#e74c3c', hp: 90, speed: 4, type: 'ground', range: 25, damage: 81, attackSpeed: 1000, projectile: null, count: 1, splash: true, rarity: 'common', kamikaze: true },
  { id: 'ice_spirit', name: 'Ice Spirit', cost: 1, color: '#3498db', hp: 90, speed: 4, type: 'ground', range: 25, damage: 91, attackSpeed: 1000, projectile: null, count: 1, splash: true, stun: 1.0, rarity: 'common', kamikaze: true },
  { id: 'electro_spirit', name: 'Electro Spirit', cost: 1, color: '#9b59b6', hp: 90, speed: 4, type: 'ground', range: 25, damage: 100, attackSpeed: 1000, projectile: null, count: 1, chain: 9, stun: 0.5, rarity: 'common', kamikaze: true },
  { id: 'heal_spirit', name: 'Heal Spirit', cost: 1, color: '#2ecc71', hp: 110, speed: 4, type: 'ground', range: 25, damage: 230, attackSpeed: 1000, projectile: null, count: 1, splash: true, rarity: 'rare', kamikaze: true, healsOnAttack: 400, healRadius: 50 },

  // Additional cards for new decks
  { id: 'bomber', name: 'Bomber', cost: 2, color: '#e67e22', hp: 340, speed: 2, type: 'ground', range: 55, damage: 145, attackSpeed: 1600, projectile: 'bomb', count: 1, splash: true, rarity: 'common' },
  { id: 'goblin_barrel', name: 'Goblin B', cost: 3, color: '#2ecc71', type: 'spell', damage: 0, radius: 20, count: 3, spawns: 'sword_goblins', spawnCount: 3, rarity: 'epic' },
  { id: 'elixir_collector', name: 'Elixir G', cost: 6, color: '#9b59b6', hp: 1070, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 93, rarity: 'rare', generatesElixir: true },
  { id: 'goblin_hut', name: 'Goblin Hut', cost: 5, color: '#2ecc71', hp: 1293, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 60, spawns: 'sword_goblins', spawnRate: 4.7, spawnCount: 1, rarity: 'rare' },
  { id: 'furnace', name: 'Furnace', cost: 4, color: '#e74c3c', hp: 727, speed: 0, type: 'building', range: 0, damage: 0, attackSpeed: 0, projectile: null, count: 1, lifetime: 60, spawns: 'fire_spirit', spawnRate: 7, spawnCount: 1, rarity: 'rare' },
  { id: 'earthquake', name: 'Earthquake', cost: 3, color: '#7f8c8d', type: 'spell', damage: 243, radius: 70, count: 1, slow: 0.35, rarity: 'rare' },
  { id: 'graveyard', name: 'Graveyard', cost: 5, color: '#2c3e50', type: 'spell', damage: 0, radius: 80, count: 20, spawns: 'skeletons', spawnCount: 20, rarity: 'legendary' },
  { id: 'lumberjack', name: 'Lumberjack', cost: 4, color: '#e67e22', hp: 820, speed: 2.5, type: 'ground', range: 25, damage: 200, attackSpeed: 700, projectile: null, count: 1, splash: true, deathRage: true, rarity: 'legendary' },
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
          <Circle cx="50" cy="50" r="40" fill="#2ecc71" stroke="white" strokeWidth="2" />
          <Path d="M20 30 L80 70" stroke="#bdc3c7" strokeWidth="5" />
          <Path d="M20 30 L30 40" stroke="#bdc3c7" strokeWidth="5" />
          <Circle cx="40" cy="45" r="5" fill="black" />
          <Circle cx="60" cy="45" r="5" fill="black" />
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
          {/* Lemon/lime body */}
          <Rect x="32" y="32" width="36" height="36" rx="6" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          {/* Glowing eyes */}
          <Circle cx="43" cy="45" r="4" fill="white" />
          <Circle cx="57" cy="45" r="4" fill="white" />
          <Circle cx="43" cy="45" r="2" fill="#27ae60" />
          <Circle cx="57" cy="45" r="2" fill="#27ae60" />
          {/* Small hands and feet */}
          <Circle cx="25" cy="50" r="5" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
          <Circle cx="75" cy="50" r="5" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
          <Circle cx="40" cy="75" r="5" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
          <Circle cx="60" cy="75" r="5" fill="#2ecc71" stroke="#27ae60" strokeWidth="1" />
          {/* Healing cross symbol */}
          <Rect x="47" y="35" width="6" height="14" fill="white" rx="1" />
          <Rect x="43" y="39" width="14" height="6" fill="white" rx="1" />
          {/* Healing aura */}
          <Circle cx="50" cy="50" r="45" fill="none" stroke="#2ecc71" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
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
          {/* Base */}
          <Rect x="20" y="50" width="60" height="30" fill="#f39c12" stroke="#e67e22" strokeWidth="2" rx="3" />
          {/* Elixir vial */}
          <Rect x="40" y="30" width="20" height="40" fill="#3498db" stroke="#2980b9" strokeWidth="2" rx="3" />
          <Rect x="45" y="20" width="10" height="15" fill="#3498db" stroke="#2980b9" strokeWidth="2" />
          {/* Elixir liquid */}
          <Rect x="42" y="35" width="16" height="30" fill="#9b59b6" opacity="0.7" />
          {/* Collector wheels */}
          <Circle cx="25" cy="80" r="5" fill="#7f8c8d" />
          <Circle cx="75" cy="80" r="5" fill="#7f8c8d" />
        </Svg>
      );
    case 'goblin_hut':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Hut structure */}
          <Rect x="20" y="50" width="60" height="40" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          {/* Roof */}
          <Path d="M15 50 L50 25 L85 50 Z" fill="#A0522D" stroke="#654321" strokeWidth="2" />
          {/* Door */}
          <Rect x="42" y="65" width="16" height="25" fill="#654321" />
          {/* Window */}
          <Circle cx="35" cy="60" r="5" fill="#f1c40f" opacity="0.8" />
          <Circle cx="65" cy="60" r="5" fill="#f1c40f" opacity="0.8" />
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
        console.log('[Card] Touch start on', card.name, 'canAfford:', canAffordRef.current, 'isNext:', isNextRef.current);
        return true;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const currentCanAfford = canAffordRef.current;
        const currentIsNext = isNextRef.current;
        console.log('[Card] PanResponderGrant -', card.name, 'canAfford:', currentCanAfford);
        const { onDragStart } = callbacksRef.current;
        if (!currentIsNext && currentCanAfford && onDragStart) {
          console.log('[Card] Calling onDragStart for', card.name);
          onDragStart(card, gestureState);
        } else {
          console.log('[Card] onDragStart blocked - isNext:', currentIsNext, 'canAfford:', currentCanAfford);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { onDragMove } = callbacksRef.current;
        if (!isNextRef.current && canAffordRef.current && onDragMove) {
          onDragMove(gestureState);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('[Card] PanResponderRelease -', card.name);
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

const HealthBar = ({ current, max, isOpponent }) => {
  if (current <= 0) return null;
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <View style={{ position: 'absolute', top: -22, width: '120%', alignItems: 'center', zIndex: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 3, marginBottom: 1 }}>
        {current}
      </Text>
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

        if (effect.type === 'heal_glow') {
          // Heal glow - green expanding circle with + symbols
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
                  fill="#2ecc71"
                  opacity={0.4}
                />
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.6}
                  fill="#27ae60"
                  opacity={0.2}
                />
              </Svg>
              {/* Plus symbol - outside SVG */}
              <View style={{
                position: 'absolute',
                opacity: opacity
              }}>
                <Text style={{
                  fontSize: 28,
                  color: '#2ecc71',
                  fontWeight: 'bold',
                  textShadowColor: 'white',
                  textShadowRadius: 5
                }}>+</Text>
              </View>
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
                <SvgText x={spellRadius} y={spellRadius + 10} fontSize={spellRadius * 0.6} textAnchor="middle" fill="#8e44ad" opacity="0.8">😡</SvgText>
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
  return <View style={[styles.cannonball, { left: position.x, top: position.y }]} />;
};

const Unit = ({ unit }) => {
  const spriteId = unit.spriteId || 'knight';
  const isEnemy = unit.isOpponent;
  const isSlowed = unit.slowUntil > Date.now();
  const isRaged = unit.rageUntil > Date.now();

  // Use dynamic size for zones (radius * 2) or default to 30 for troops
  const unitSize = unit.radius ? (unit.radius * 2) : 30;

  // Check if unit is in spawn delay (Golem, Golemite)
  const isSpawning = Boolean((unit.spawnDelay > 0) && unit.spawnTime && (Date.now() - unit.spawnTime < unit.spawnDelay));
  const rotationAnim = useRef(new Animated.Value(0)).current;

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

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.unit, { left: unit.x - unitSize / 2, top: unit.y - unitSize / 2, width: unitSize, height: unitSize }]}>
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

      <UnitSprite id={spriteId} isOpponent={isEnemy} size={unitSize} unit={unit} />
      
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
      {/* Health bar for enemy units */}
      <View style={{ position: 'absolute', top: -8, width: unitSize, height: 6, backgroundColor: '#333', borderRadius: 3, left: 0, zIndex: 10 }}>
        <View style={{ width: `${(unit.hp / unit.maxHp) * 100}%`, height: '100%', backgroundColor: '#ff4444' }} />
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
              {isUnlocking && <Text style={{fontSize: 10, color: '#f1c40f'}}>Unlocking...</Text>}
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
  const deals = [
    { id: 'knight', name: 'Knight', count: 50, cost: 500, currency: 'GOLD', rarity: 'common' },
    { id: 'musketeer', name: 'Musketeer', count: 20, cost: 1000, currency: 'GOLD', rarity: 'rare' },
    { id: 'baby_dragon', name: 'Baby Dragon', count: 2, cost: 2000, currency: 'GOLD', rarity: 'epic' },
    { id: 'archers', name: 'Archers', count: 50, cost: 0, currency: 'FREE', rarity: 'common' }, // Free daily
    { id: 'hog_rider', name: 'Hog Rider', count: 20, cost: 1000, currency: 'GOLD', rarity: 'rare' },
    { id: 'witch', name: 'Witch', count: 2, cost: 100, currency: 'GEM', rarity: 'epic' },
  ];

  return (
    <ScrollView style={styles.shopContainer} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.shopSectionHeader}>
        <Text style={styles.shopSectionTitle}>DAILY DEALS</Text>
        <Text style={styles.shopSectionTimer}>Refreshes in 4h 20m</Text>
      </View>

      <View style={styles.dealsGrid}>
        {deals.map((deal, index) => (
          <View key={index} style={styles.dealCard}>
            <Text style={styles.dealHeader}>{deal.currency === 'FREE' ? 'FREE' : 'DAILY DEAL'}</Text>
            <View style={styles.dealImageContainer}>
              <UnitSprite id={deal.id} isOpponent={false} size={50} />
              <Text style={styles.dealCount}>x{deal.count}</Text>
            </View>
            <Text style={styles.dealName}>{deal.name}</Text>
            <TouchableOpacity style={[styles.buyButton, deal.currency === 'FREE' && styles.buyButtonFree]}>
              <Text style={styles.buyButtonText}>
                {deal.currency === 'FREE' ? 'CLAIM' : `${deal.cost} ${deal.currency === 'GEM' ? '💎' : '💰'}`}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.shopSectionHeader}>
        <Text style={styles.shopSectionTitle}>ROYALE PASS</Text>
      </View>
      <View style={styles.passBanner}>
        <View style={styles.passBannerLeft}>
          <Text style={styles.passBannerTitle}>UNLOCK EXCLUSIVE REWARDS!</Text>
          <TouchableOpacity style={styles.passButton}>
            <Text style={styles.passButtonText}>GET PASS</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.passBannerRight}>
          <UnitSprite id="king" isOpponent={false} size={60} />
        </View>
      </View>
    </ScrollView>
  );
};

const MagicItems = () => (
  <View style={styles.magicItemsContainer}>
    <View style={styles.magicItem}><Text style={{ fontSize: 12 }}>✨</Text></View>
    <View style={styles.magicItem}><Text style={{ fontSize: 12 }}>🃏</Text></View>
  </View>
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

const DeckTab = ({ cards = [], onSwapCards, dragHandlers, allDecks, selectedDeckIndex, setSelectedDeckIndex }) => {
  const [selectedCard, setSelectedCard] = useState(null); // For detail modal
  const [cardMenuCard, setCardMenuCard] = useState(null); // For popup menu
  const [showSlotSelector, setShowSlotSelector] = useState(null); // For slot selector
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterRarity, setFilterRarity] = useState('all');
  const [sortByElixir, setSortByElixir] = useState(false);

  // Drag & drop refs
  const dropZones = useRef([]);
  const deckSlotRefs = useRef([]);

  // Drag state
  const [localDraggingCard, setLocalDraggingCard] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Filter Logic - Memoized to prevent re-computation on every render
  const filteredCards = useMemo(() => {
    return CARDS.filter(card => !card.isToken).filter(card => {
      if (filterRarity === 'all') return true;
      return card.rarity === filterRarity;
    }).sort((a, b) => {
      if (sortByElixir) {
        return a.cost - b.cost;
      }
      // Default sort by id/name stability or rarity if needed
      return 0;
    });
  }, [filterRarity, sortByElixir]);

  // Filter Modal Component
  const FilterModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity 
        style={styles.cardMenuOverlay} 
        activeOpacity={1} 
        onPress={() => setShowFilterModal(false)}
      >
        <View style={styles.cardMenuContent}>
          <Text style={styles.slotSelectorTitle}>Filter Collection</Text>
          
          <Text style={styles.deckSelectorLabel}>RARITY</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20}}>
            <TouchableOpacity 
              style={[styles.filterButton, filterRarity === 'all' && styles.filterButtonActive]} 
              onPress={() => setFilterRarity('all')}
            >
              <Text style={[styles.filterButtonText, filterRarity === 'all' && styles.filterButtonTextActive]}>All</Text>
            </TouchableOpacity>
            {['common', 'rare', 'epic', 'legendary'].map(rarity => (
              <TouchableOpacity 
                key={rarity}
                style={[styles.filterButton, filterRarity === rarity && styles.filterButtonActive, { borderColor: RARITY_COLORS[rarity] }]} 
                onPress={() => setFilterRarity(rarity)}
              >
                <Text style={[styles.filterButtonText, filterRarity === rarity && styles.filterButtonTextActive, { color: filterRarity === rarity ? '#fff' : RARITY_COLORS[rarity] }]}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.deckSelectorLabel}>SORT BY</Text>
          <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 20}}>
            <TouchableOpacity 
              style={[styles.filterButton, sortByElixir && styles.filterButtonActive]} 
              onPress={() => setSortByElixir(!sortByElixir)}
            >
              <Text style={[styles.filterButtonText, sortByElixir && styles.filterButtonTextActive]}>Elixir Cost {sortByElixir ? '▲' : ''}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cardMenuCancel}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.cardMenuCancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Show card menu for collection cards
  const handleCollectionCardTap = useCallback((card) => {
    setCardMenuCard(card);
  }, []);

  // Handle tap on deck slot card
  const handleDeckCardTap = useCallback((card, index) => {
    // Just show details for deck cards
    setSelectedCard(card);
  }, []);

  // Handle swap from menu
  const handleSwapFromMenu = useCallback((deckIndex) => {
    // Use showSlotSelector as the source card (it's set when Swap is clicked)
    const sourceCard = showSlotSelector || cardMenuCard;
    if (sourceCard) {
      const fromIndex = cards.findIndex(c => c.id === sourceCard.id);
      if (fromIndex !== -1) {
        // Source is in deck - swap indices
        if (fromIndex !== deckIndex) {
          onSwapCards(fromIndex, deckIndex);
        }
      } else {
        // Source is from collection - pass card object
        onSwapCards(sourceCard, deckIndex);
      }
      // Clear both states
      setCardMenuCard(null);
      setShowSlotSelector(null);
    }
  }, [showSlotSelector, cardMenuCard, cards, onSwapCards]);

  // Card menu component (popup)
  const CardMenu = ({ card }) => {
    if (!card) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!card}
        onRequestClose={() => setCardMenuCard(null)}
      >
        <TouchableOpacity style={styles.cardMenuOverlay} activeOpacity={1} onPress={() => setCardMenuCard(null)}>
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
                onPress={() => {
                  setCardMenuCard(null);
                  setSelectedCard(card);
                }}
              >
                <Text style={styles.cardMenuButtonText}>📊 Info</Text>
              </TouchableOpacity>

              <Text style={styles.cardMenuOr}>OR</Text>

              <TouchableOpacity
                style={[styles.cardMenuButton, styles.cardMenuButtonSwap]}
                onPress={() => {
                  setCardMenuCard(null);
                  setShowSlotSelector(card);
                }}
              >
                <Text style={styles.cardMenuButtonText}>🔄 Swap</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cardMenuCancel}
              onPress={() => setCardMenuCard(null)}
            >
              <Text style={styles.cardMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Deck slot selector
  const DeckSlotSelector = () => {
    if (!showSlotSelector) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!showSlotSelector}
        onRequestClose={() => setShowSlotSelector(null)}
      >
        <TouchableOpacity style={styles.cardMenuOverlay} activeOpacity={1} onPress={() => setShowSlotSelector(null)}>
          <View style={styles.slotSelectorContent}>
            <Text style={styles.slotSelectorTitle}>Select slot to swap with {showSlotSelector?.name || 'Card'}</Text>

            <View style={styles.slotSelectorDeck}>
              <View style={styles.slotSelectorSlotRow}>
                {(cards || []).slice(0, 4).map((card, index) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.slotSelectorSlot}
                    onPress={() => handleSwapFromMenu(index)}
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
                    onPress={() => handleSwapFromMenu(index + 4)}
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
              onPress={() => setShowSlotSelector(null)}
            >
              <Text style={styles.slotSelectorCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const measureDropZones = useCallback(() => {
    dropZones.current = [];
    deckSlotRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.measure((x, y, width, height, pageX, pageY) => {
          dropZones.current[index] = { x: pageX, y: pageY, width, height, index };
        });
      }
    });
  }, []);

  const handleDragStart = useCallback((card, gesture, componentRef) => {
    setScrollEnabled(false);
    setLocalDraggingCard(card);

    componentRef.measure((x, y, width, height, pageX, pageY) => {
      // Notify global handler
      if (dragHandlers && dragHandlers.start) {
        dragHandlers.start(card, pageX, pageY);
      }
      // Also measure drop zones now
      measureDropZones();
    });
  }, [dragHandlers, measureDropZones]);

  const handleDragMove = useCallback((gesture) => {
    if (dragHandlers && dragHandlers.move) {
      dragHandlers.move(gesture.moveX, gesture.moveY);
    }
  }, [dragHandlers]);

  const handleDragEnd = useCallback((gesture) => {
    const dropX = gesture.moveX;
    const dropY = gesture.moveY;

    // Check collision with drop zones
    const target = dropZones.current.find(zone => {
      return dropX >= zone.x && dropX <= zone.x + zone.width &&
        dropY >= zone.y && dropY <= zone.y + zone.height;
    });

    if (target) {
      const fromIndex = cards.findIndex(c => c.id === localDraggingCard?.id);
      const toIndex = target.index;

      if (fromIndex !== -1 && fromIndex !== toIndex) {
        onSwapCards(fromIndex, toIndex);
      }
    }

    if (dragHandlers && dragHandlers.end) {
      dragHandlers.end();
    }
    setLocalDraggingCard(null);
    setScrollEnabled(true);
  }, [cards, localDraggingCard, onSwapCards, dragHandlers]);

  const renderCollectionCard = useCallback(({ item }) => {
    const isInDeck = cards.some(c => c && c.id === item.id);
    const isDragging = localDraggingCard?.id === item.id;
    
    return (
      <View style={{ margin: 3 }}>
        <CollectionCard 
          card={item} 
          isInDeck={isInDeck} 
          isDragging={isDragging}
          onTap={handleCollectionCardTap}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          globalDragHandlers={dragHandlers}
        />
      </View>
    );
  }, [cards, localDraggingCard, handleCollectionCardTap, handleDragStart, handleDragMove, handleDragEnd, dragHandlers]);

  return (
    <View style={styles.deckTabContainer}>
      <View style={styles.deckHeaderRow}>
        <Text style={styles.deckTabTitle}>Battle Deck {selectedDeckIndex + 1}</Text>
        <MagicItems />
      </View>

      <DeckStats cards={cards} />

      {/* Deck Selector - 5 Deck Slots */}
      <View style={styles.deckSelectorContainer}>
        <Text style={styles.deckSelectorLabel}>SELECT DECK:</Text>
        <View style={styles.deckSelectorButtons}>
          {allDecks.map((_, deckIndex) => (
            <TouchableOpacity
              key={deckIndex}
              style={[
                styles.deckSelectorButton,
                selectedDeckIndex === deckIndex && styles.deckSelectorButtonActive
              ]}
              onPress={() => setSelectedDeckIndex(deckIndex)}
            >
              <Text style={[
                styles.deckSelectorButtonText,
                selectedDeckIndex === deckIndex && styles.deckSelectorButtonTextActive
              ]}>
                Deck {deckIndex + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Current Battle Deck Box */}
      <View style={styles.deckBox}>
        <View style={styles.deckBoxInner}>
          <View style={styles.cardRow}>
            {(cards || []).slice(0, 4).map((card, index) => {
              if (!card) return null;
              const isLegendary = card.rarity === 'legendary';
              return (
                <TouchableOpacity
                  key={card.id}
                  ref={el => deckSlotRefs.current[index] = el}
                  style={[
                    styles.deckCard,
                    !isLegendary && { borderColor: RARITY_COLORS[card.rarity] || '#000' },
                    isLegendary && { backgroundColor: 'transparent', borderWidth: 0 }
                  ]}
                  onPress={() => handleDeckCardTap(card, index)}
                  activeOpacity={0.7}
                >
                  {isLegendary && (
                    <Svg width="70" height="85" viewBox="0 0 60 75" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <Defs>
                        <LinearGradient id="rainbow_deck" x1="0" y1="0" x2="1" y2="1">
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
                        stroke="url(#rainbow_deck)"
                        strokeWidth="2"
                      />
                    </Svg>
                  )}
                  <UnitSprite id={card.id} isOpponent={false} size={40} />
                  <Text style={styles.deckCardName}>{card.name || 'Card'}</Text>
                  <View style={styles.deckCardCost}>
                    <Text style={styles.deckCardCostText}>{card.cost || 0}</Text>
                  </View>
                  {card.type === 'spell' && <View style={styles.cardTypeBadge}><Text style={styles.cardTypeText}>SPELL</Text></View>}
                  {card.type === 'flying' && <View style={styles.cardTypeBadgeFlying}><Text style={styles.cardTypeText}>FLY</Text></View>}
                  {card.targetType === 'buildings' && <View style={styles.cardTypeBadgeBuilding}><Text style={styles.cardTypeText}>BLD</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.cardRow}>
            {(cards || []).slice(4, 8).map((card, index) => {
              if (!card) return null;
              const isLegendary = card.rarity === 'legendary';
              return (
                <TouchableOpacity
                  key={card.id}
                  ref={el => deckSlotRefs.current[index + 4] = el}
                  style={[
                    styles.deckCard,
                    !isLegendary && { borderColor: RARITY_COLORS[card.rarity] || '#000' },
                    isLegendary && { backgroundColor: 'transparent', borderWidth: 0 }
                  ]}
                  onPress={() => handleDeckCardTap(card, index + 4)}
                  activeOpacity={0.7}
                >
                  {isLegendary && (
                    <Svg width="70" height="85" viewBox="0 0 60 75" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <Defs>
                        <LinearGradient id="rainbow_deck" x1="0" y1="0" x2="1" y2="1">
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
                        stroke="url(#rainbow_deck)"
                        strokeWidth="2"
                      />
                    </Svg>
                  )}
                  <UnitSprite id={card.id} isOpponent={false} size={40} />
                  <Text style={styles.deckCardName}>{card.name || 'Card'}</Text>
                  <View style={styles.deckCardCost}>
                    <Text style={styles.deckCardCostText}>{card.cost || 0}</Text>
                  </View>
                  {card.type === 'spell' && <View style={styles.cardTypeBadge}><Text style={styles.cardTypeText}>SPELL</Text></View>}
                  {card.type === 'flying' && <View style={styles.cardTypeBadgeFlying}><Text style={styles.cardTypeText}>FLY</Text></View>}
                  {card.targetType === 'buildings' && <View style={styles.cardTypeBadgeBuilding}><Text style={styles.cardTypeText}>BLD</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* All Cards Section */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5}}>
        <Text style={[styles.deckBoxTitle, {marginBottom: 0}]}>Collection</Text>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>Filters {filterRarity !== 'all' || sortByElixir ? '•' : ''} ▾</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter Modal */}
      <FilterModal />

      <View style={[styles.deckBox, { flex: 1, paddingVertical: 8, paddingHorizontal: 4 }]}>
        <FlatList
          data={filteredCards}
          keyExtractor={item => item.id}
          numColumns={4}
          renderItem={renderCollectionCard}
          scrollEnabled={scrollEnabled}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 20 }}
          columnWrapperStyle={{ justifyContent: 'flex-start' }}
        />
      </View>

      {/* Card Menu Modal */}
      <CardMenu card={cardMenuCard} />

      {/* Deck Slot Selector Modal */}
      <DeckSlotSelector />

      {/* Card Detail Modal */}
      {selectedCard && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedCard}
          onRequestClose={() => setSelectedCard(null)}
        >
          <View style={styles.cardDetailModal}>
            <View style={[styles.cardDetailModalContent, { borderColor: RARITY_COLORS[selectedCard.rarity] || '#F1C40F' }]}>
              <View style={styles.cardDetailCostBig}>
                <Text style={styles.cardDetailCostBigText}>{selectedCard.cost}</Text>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCard(null)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.cardDetailHeader}>
                <View style={styles.cardDetailIconBig}>
                  <UnitSprite id={selectedCard.id} isOpponent={false} size={80} />
                </View>
                <Text style={styles.cardDetailNameBig}>{selectedCard.name}</Text>
                {selectedCard.type === 'spell' && <Text style={styles.cardDetailTypeBig}>🔥 SPELL</Text>}
                {selectedCard.type === 'flying' && <Text style={styles.cardDetailTypeBigFlying}>🦅 FLYING</Text>}
                {selectedCard.targetType === 'buildings' && <Text style={styles.cardDetailTypeBigBuilding}>🏠 TARGETS BUILDINGS</Text>}
                {selectedCard.type === 'building' && <Text style={styles.cardDetailTypeBigBuilding}>🏠 BUILDING</Text>}
              </View>

              <View style={styles.cardDetailStatsBig}>
                {/* Special Abilities */}
                {Boolean(selectedCard.charge || selectedCard.spawns || selectedCard.splash || (selectedCard.stun && selectedCard.stun > 0) || selectedCard.jumps) && (
                  <View style={{ marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' }}>
                    {selectedCard.charge && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: '#f1c40f' }]}>⚡ Special:</Text>
                        <Text style={[styles.statValue, { color: '#fff' }]}>Charge Attack</Text>
                      </View>
                    )}
                    {selectedCard.spawns && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: '#9b59b6' }]}>💀 Spawns:</Text>
                        <Text style={[styles.statValue, { color: '#fff' }]}>{selectedCard.spawnCount}x {selectedCard.spawns}</Text>
                      </View>
                    )}
                    {selectedCard.splash && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: '#e74c3c' }]}>💥 Area:</Text>
                        <Text style={[styles.statValue, { color: '#fff' }]}>Splash Damage</Text>
                      </View>
                    )}
                    {selectedCard.stun > 0 && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: '#3498db' }]}>💫 Effect:</Text>
                        <Text style={[styles.statValue, { color: '#fff' }]}>Stun ({selectedCard.stun}s)</Text>
                      </View>
                    )}
                    {selectedCard.jumps && (
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: '#e67e22' }]}>🐇 Trait:</Text>
                        <Text style={[styles.statValue, { color: '#fff' }]}>River Jump</Text>
                      </View>
                    )}
                  </View>
                )}

                {Boolean(selectedCard.hp) && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>❤️ Hitpoints:</Text>
                    <Text style={styles.statValue}>{selectedCard.hp}</Text>
                  </View>
                )}
                {Boolean(selectedCard.damage) && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>⚔️ Damage:</Text>
                    <Text style={styles.statValue}>{selectedCard.damage}</Text>
                  </View>
                )}
                {Boolean(selectedCard.speed !== undefined && selectedCard.speed > 0) && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>👟 Speed:</Text>
                    <Text style={styles.statValue}>{selectedCard.speed}</Text>
                  </View>
                )}
                {Boolean(selectedCard.range) && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>🎯 Range:</Text>
                    <Text style={styles.statValue}>{selectedCard.range}</Text>
                  </View>
                )}
                {Boolean(selectedCard.count > 1) && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>👥 Count:</Text>
                    <Text style={styles.statValue}>{selectedCard.count}</Text>
                  </View>
                )}
                {Boolean(selectedCard.attackSpeed) && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>⚡ Hit Speed:</Text>
                    <Text style={styles.statValue}>{selectedCard.attackSpeed}ms</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.upgradeButton} onPress={() => setSelectedCard(null)}>
                <Text style={styles.upgradeButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const BattleTab = ({ currentDeck, onStartBattle, chests, onUnlockChest, onOpenChest, onFriendlyBattle }) => (
  <View style={styles.battleTabContainer}>
    <View style={styles.arenaTitleContainer}>
      <Text style={styles.arenaTitle}>ARENA 1</Text>
      <Text style={styles.arenaSubtitle}>Goblin Stadium</Text>
    </View>

    <View style={styles.deckBox}>
      <Text style={styles.deckBoxTitle}>Battle Deck</Text>
      <View style={styles.deckBoxInner}>
        <View style={styles.cardRow}>
          {(currentDeck || []).slice(0, 4).map(card => (
            <View key={card.id} style={[styles.deckCard, { borderColor: RARITY_COLORS[card.rarity] || '#000' }]}>
              <UnitSprite id={card.id} isOpponent={false} size={40} />
              <Text style={styles.deckCardName}>{card.name}</Text>
              <View style={styles.deckCardCost}>
                <Text style={styles.deckCardCostText}>{card.cost}</Text>
              </View>
              {card.type === 'spell' && <View style={styles.cardTypeBadge}><Text style={styles.cardTypeText}>SPELL</Text></View>}
              {card.type === 'flying' && <View style={styles.cardTypeBadgeFlying}><Text style={styles.cardTypeText}>FLY</Text></View>}
              {card.targetType === 'buildings' && <View style={styles.cardTypeBadgeBuilding}><Text style={styles.cardTypeText}>BLD</Text></View>}
            </View>
          ))}
        </View>
        <View style={styles.cardRow}>
          {(currentDeck || []).slice(4, 8).map(card => (
            <View key={card.id} style={[styles.deckCard, { borderColor: RARITY_COLORS[card.rarity] || '#000' }]}>
              <UnitSprite id={card.id} isOpponent={false} size={40} />
              <Text style={styles.deckCardName}>{card.name}</Text>
              <View style={styles.deckCardCost}>
                <Text style={styles.deckCardCostText}>{card.cost}</Text>
              </View>
              {card.type === 'spell' && <View style={styles.cardTypeBadge}><Text style={styles.cardTypeText}>SPELL</Text></View>}
              {card.type === 'flying' && <View style={styles.cardTypeBadgeFlying}><Text style={styles.cardTypeText}>FLY</Text></View>}
              {card.targetType === 'buildings' && <View style={styles.cardTypeBadgeBuilding}><Text style={styles.cardTypeText}>BLD</Text></View>}
            </View>
          ))}
        </View>
      </View>
    </View>

    <TouchableOpacity style={styles.battleButton} onPress={onStartBattle}>
      <Text style={styles.battleButtonText}>BATTLE</Text>
      <Text style={styles.battleButtonSubtext}>Ranked 1v1</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.friendlyButton} onPress={onFriendlyBattle}>
      <Text style={styles.friendlyButtonText}>Play with Friend</Text>
    </TouchableOpacity>

    <ChestSlots chests={chests} onUnlock={onUnlockChest} onOpen={onOpenChest} />
  </View>
);

const ClanTab = () => {
  const [messages, setMessages] = useState([
    { id: '1', user: 'KingSlayer', text: 'Good game everyone!', role: 'Elder', time: '2h ago' },
    { id: '2', user: 'PrincessLover', text: 'Can someone donate Wizards?', role: 'Member', time: '1h ago' },
    { id: '3', user: 'System', text: 'Trainer Cheddar joined the clan.', role: 'System', time: '30m ago' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim().length === 0) return;
    const newMsg = {
      id: Date.now().toString(),
      user: 'You',
      text: inputText,
      role: 'Leader',
      time: 'Just now'
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const renderMessage = ({ item }) => {
    if (item.role === 'System') {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }
    const isMe = item.user === 'You';
    return (
      <View style={[styles.chatRow, isMe ? styles.chatRowMe : styles.chatRowOther]}>
        {!isMe && <View style={styles.chatAvatar}><Text style={{ fontSize: 12 }}>👤</Text></View>}
        <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
          {!isMe && <Text style={styles.chatUser}>{item.user} <Text style={styles.chatRole}>({item.role})</Text></Text>}
          <Text style={styles.chatText}>{item.text}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.clanTabContainer}>
      {/* Clan Header */}
      <View style={styles.clanHeader}>
        <View style={styles.clanHeaderLeft}>
          <View style={styles.clanBadge}><Text style={{ fontSize: 24 }}>🛡️</Text></View>
          <View>
            <Text style={styles.clanName}>Blue Kings</Text>
            <Text style={styles.clanStats}>48/50 Members • 24000 🏆</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clanInfoButton}><Text style={{ color: '#fff', fontWeight: 'bold' }}>i</Text></TouchableOpacity>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView behavior="padding" style={styles.chatContainer}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.chatList}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 0, name: 'Shop', icon: '🛒' },
    { id: 1, name: 'Deck', icon: '📚' },
    { id: 2, name: 'Battle', icon: '⚔️' },
    { id: 3, name: 'Clan', icon: '👥' }
  ];

  return (
    <View style={styles.bottomNavigation}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
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
      case 3: return <ClanTab />;
      default: return <BattleTab 
        currentDeck={currentDeck} 
        onStartBattle={onStartGame}
        chests={chests}
        onUnlockChest={onUnlockChest}
        onOpenChest={onOpenChest} 
      />;
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
  elixir, hand, nextCard, draggingCard, dragPosition,
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
        </View>

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

      </View>

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
      </Animated.View>

      {draggingCard && (
        <View style={{ position: 'absolute', left: dragPosition.x, top: dragPosition.y, zIndex: 9999, elevation: 100 }} pointerEvents="none">
          {/* Range/Radius Indicator - Only for Spells (radius), Buildings, or Units with Spawn Damage */}
          {Boolean(draggingCard.radius || (draggingCard.range && (draggingCard.type === 'building' || draggingCard.spawnDamage))) && (
            <View style={{
              position: 'absolute',
              left: -(draggingCard.radius || draggingCard.range),
              top: -(draggingCard.radius || draggingCard.range),
              width: (draggingCard.radius || draggingCard.range) * 2,
              height: (draggingCard.radius || draggingCard.range) * 2,
              borderRadius: (draggingCard.radius || draggingCard.range),
              backgroundColor: draggingCard.type === 'spell' ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              borderColor: draggingCard.type === 'spell' ? '#FFFF00' : 'white',
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
  console.log('Rendering ChestOpeningModal for:', chest.id);
  const [step, setStep] = useState('CLOSED'); // CLOSED -> OPENING -> REWARDS
  const [rewards, setRewards] = useState([]);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const generateRewards = () => {
    let gold = 0;
    let gems = 0;
    let cardCount = 0;
    
    switch (chest.type) {
      case 'SILVER': gold = 50; cardCount = 5; break;
      case 'GOLD': gold = 200; gems = 2; cardCount = 15; break;
      case 'GIANT': gold = 1000; cardCount = 50; break;
      case 'MAGICAL': gold = 500; gems = 10; cardCount = 20; break;
      case 'TEST': gold = 9999; gems = 999; cardCount = 1; break;
      default: gold = 100; cardCount = 10;
    }

    const newRewards = [];
    if (gold > 0) newRewards.push({ type: 'GOLD', value: gold, icon: '💰', label: 'Gold' });
    if (gems > 0) newRewards.push({ type: 'GEM', value: gems, icon: '💎', label: 'Gems' });
    
    // For bigger chests, add multiple cards or items to make it feel "real"
    const randomCard = CARDS[Math.floor(Math.random() * CARDS.length)];
    if (cardCount > 0) newRewards.push({ type: 'CARD', value: cardCount, icon: '🃏', label: randomCard.name, card: randomCard });

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
          <View style={{alignItems: 'center'}}>
            <Animated.View style={[
              styles.chestVisual, 
              { 
                borderColor: getChestColor(chest.type),
                transform: [{ translateX: shakeAnim }] 
              }
            ]}>
              <Text style={{fontSize: 50}}>🔒</Text>
            </Animated.View>
            <Text style={styles.chestTapText}>Tap to Open!</Text>
          </View>
        )}

        {(step === 'OPENING' || step === 'FINISHED') && currentReward && (
          <View style={{alignItems: 'center', width: '100%'}}>
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
                  <View style={{alignItems: 'center'}}>
                    <UnitSprite id={currentReward.card.id} isOpponent={false} size={120} />
                    <Text style={styles.rewardValueLarge}>{currentReward.label}</Text>
                    <View style={styles.cardCountBadge}>
                      <Text style={styles.cardCountText}>x{currentReward.value}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{alignItems: 'center'}}>
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
            <View style={{alignItems: 'center', width: '100%'}}>
              <Text style={styles.waitingText}>Share this code with your friend:</Text>
              <Text style={styles.roomCodeText}>{roomCode || '...'}</Text>
              <Text style={styles.waitingText}>Waiting for opponent...</Text>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          )}

          {mode === 'JOIN' && (
            <View style={{alignItems: 'center', width: '100%'}}>
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

          {error ? <Text style={{color: 'red', marginTop: 10, fontWeight: 'bold'}}>{error}</Text> : null}

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
      console.log("Connected to server:", socketRef.current.id);
    });

    socketRef.current.on("start_game", (data) => {
      console.log("Game Starting!", data);
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
  // Filter out token cards (golemite, lava_pups, etc.) from deck initialization
  const playableCards = CARDS.filter(card => !card.isToken);
  const [allDecks, setAllDecks] = useState([
    playableCards.slice(0, 8),  // Deck 1
    playableCards.slice(8, 16), // Deck 2
    playableCards.slice(16, 24), // Deck 3
    playableCards.slice(24, 32), // Deck 4
    playableCards.slice(32, 40)  // Deck 5
  ]);
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);

  // Get currently selected deck
  const userCards = allDecks[selectedDeckIndex];

  // Global Drag State
  const [globalDraggingCard, setGlobalDraggingCard] = useState(null);
  const [globalDragPosition, setGlobalDragPosition] = useState({ x: 0, y: 0 });

  const [elixir, setElixir] = useState(5);
  const [hand, setHand] = useState([CARDS[0], CARDS[1], CARDS[2], CARDS[3]]);
  const [nextCard, setNextCard] = useState(CARDS[4]);
  const [deckQueue, setDeckQueue] = useState([CARDS[5], CARDS[6], CARDS[7]]);
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
  const [enemyHand, setEnemyHand] = useState([CARDS[0], CARDS[3], CARDS[5], CARDS[6]]);
  const [enemyNextCard, setEnemyNextCard] = useState(CARDS[1]);
  const [enemyDeckQueue, setEnemyDeckQueue] = useState([CARDS[2], CARDS[4], CARDS[7]]);

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

  const towersRef = useRef(towers);
  const unitsRef = useRef(units);
  const projectilesRef = useRef(projectiles);
  const enemyElixirRef = useRef(enemyElixir);
  const enemyHandRef = useRef(enemyHand);
  const enemyNextCardRef = useRef(enemyNextCard);
  const enemyDeckQueueRef = useRef(enemyDeckQueue);
  const lastPlayedCardRef = useRef(lastPlayedCard);

  useEffect(() => { towersRef.current = towers; }, [towers]);
  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
  useEffect(() => { enemyElixirRef.current = enemyElixir; }, [enemyElixir]);
  useEffect(() => { enemyHandRef.current = enemyHand; }, [enemyHand]);
  useEffect(() => { enemyNextCardRef.current = enemyNextCard; }, [enemyNextCard]);
  useEffect(() => { enemyDeckQueueRef.current = enemyDeckQueue; }, [enemyDeckQueue]);
  useEffect(() => { lastPlayedCardRef.current = lastPlayedCard; }, [lastPlayedCard]);

  const concedeGame = () => {
    setGameOver('LOSE');
  };

  const resetGame = (destination = 'game') => {
    setElixir(5);
    setScore([0, 0]);
    setIsDoubleElixir(false);
    setShowDoubleElixirAlert(false);
    doubleElixirTriggeredRef.current = false;
    // Use the current user deck and randomize the starting hand
    const currentDeck = userCards || CARDS;
    // Shuffle the deck randomly
    const shuffledDeck = [...currentDeck].sort(() => Math.random() - 0.5);
    setHand([shuffledDeck[0], shuffledDeck[1], shuffledDeck[2], shuffledDeck[3]]);
    setNextCard(shuffledDeck[4]);
    setDeckQueue([shuffledDeck[5], shuffledDeck[6], shuffledDeck[7]]);
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
    console.log('[handleDragStart] Card:', card.name, 'elixir:', elixir, 'cost:', card.cost);
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

    console.log('[handleDragEnd] Card:', card?.name, 'dropX:', dropX, 'dropY:', dropY);

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
      } else {
        // For non-spells: check if opponent's princess tower on that side is destroyed
        const leftOpponentPrincess = towers.find(t => t.id === 1 && t.hp > 0);
        const rightOpponentPrincess = towers.find(t => t.id === 2 && t.hp > 0);

        const isLeftSide = dropX < width / 2;

        // Deployment tolerance - allow placing slightly into the river area
        // Standard river Y is height / 2.
        // We allow slightly higher (smaller Y) for better UX.
        let deploymentBoundary = riverY - 15; // Basic tolerance

        // Hog Rider (jumps) and Flying units can be deployed further forward (over river/bridge)
        if (card.id === 'hog_rider' || card.type === 'flying') {
          deploymentBoundary = riverY - 50;
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
        console.log('[handleDragEnd] Calling spawnCard for', card.name);
        spawnCard(card, dropX, dropY);
      } else {
        console.log('[handleDragEnd] Drop blocked - must deploy on your side (or in destroyed tower zone)');
      }
    } else {
      console.log('[handleDragEnd] Drop blocked - dropped in footer area');
    }
  };

  const spawnCard = (card, x, y) => {
    console.log('[spawnCard] Starting - Card:', card.name, 'cost:', card.cost, 'current elixir:', elixir);

    // Handle Mirror card - copy the last played card with +1 level
    let actualCard = card;
    let levelBoost = 0;
    if (card.id === 'mirror') {
      const lastCard = lastPlayedCardRef.current;
      if (!lastCard) {
        console.log('[spawnCard] No card to mirror!');
        return;
      }
      levelBoost = (lastCard.level || 9) + 1; // Default to level 9 (common) + 1
      actualCard = { ...lastCard };
      // Mirror costs (copied card cost + 1)
      actualCard.cost = lastCard.cost + 1;
      actualCard.level = levelBoost;
      // Apply level boost to stats (+10% per level above level 9)
      const levelBonus = 1 + (levelBoost - 9) * 0.1; // Level 9 = 100%, Level 10 = 110%, etc.
      actualCard.hp = Math.floor(lastCard.hp * levelBonus);
      actualCard.damage = Math.floor(lastCard.damage * levelBonus);
      console.log('[spawnCard] Mirroring:', actualCard.name, 'new cost:', actualCard.cost, 'level:', levelBoost, 'hp:', actualCard.hp, 'damage:', actualCard.damage);
    }

    setElixir(currentElixir => {
      const costToUse = actualCard.cost;
      console.log('[spawnCard] Inside setElixir - currentElixir:', currentElixir, 'card.cost:', costToUse);
      if (currentElixir < costToUse) {
        console.log('[spawnCard] BLOCKED - Not enough elixir!');
        return currentElixir;
      }
      const newElixir = currentElixir - costToUse;

      if (actualCard.type === 'spell') {
        // Different spell types have different visuals and timing
        let spellType = 'fireball_spell';
        let spellSpeed = 15;
        let startX = width / 2;
        let startY = height;

        if (actualCard.id === 'lightning') {
          // Lightning - Hits 3 highest HP units/towers
          spellType = 'lightning_bolt';
          spellSpeed = 100; // Instant

          // Find targets
          const allTargets = [
            ...(unitsRef.current || []).filter(u => u.isOpponent !== (card.isOpponent || false)),
            ...(towersRef.current || []).filter(t => t.isOpponent !== (card.isOpponent || false) && t.hp > 0)
          ];

          const targetsInRange = allTargets.filter(t => {
            const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));
            return dist <= actualCard.radius;
          });

          // Sort by HP descending and take top 3
          const topTargets = targetsInRange.sort((a, b) => b.hp - a.hp).slice(0, 3);

          if (topTargets.length > 0) {
            const newProjectiles = topTargets.map((t, index) => ({
              id: Date.now() + index,
              x: t.x, // Lightning strikes directly
              y: t.y - 50, // Start slightly above
              targetX: t.x,
              targetY: t.y,
              speed: 100,
              damage: actualCard.damage,
              type: 'electric_bolt', // Reuse electric bolt visual
              isSpell: true,
              stun: 0.5,
              hit: true,
              spawnTime: Date.now()
            }));

            // Apply damage and stun directly for instant feedback (since we mark hit: true)
            // But the main loop handles hit: true projectiles too?
            // Actually, hit: true projectiles are filtered out unless we handle them.
            // Let's use the standard spell logic but push multiple projectiles.
            // We need to verify if the projectile loop applies damage for all 'hit: true' spells.
            // Yes, it does (lines 3510+). However, standard logic expects ONE projectile per spell cast.
            // If we push multiple, it should work fine.
            setProjectiles(prev => [...prev, ...newProjectiles]);

            // Manually apply damage/stun here to ensure it hits exactly these targets
            // The loop might re-find targets in radius which isn't what we want for Lightning (specific targets).
            // So: Apply state changes immediately.

            setUnits(prev => prev.map(u => {
              if (topTargets.some(t => t.id === u.id)) {
                return {
                  ...u,
                  hp: u.hp - actualCard.damage,
                  stunUntil: Date.now() + 500,
                  wasStunned: true
                };
              }
              return u;
            }));

            setTowers(prev => prev.map(t => {
              if (topTargets.some(target => target.id === t.id)) {
                return { ...t, hp: t.hp - actualCard.damage };
              }
              return t;
            }));
          }

        } else if (actualCard.id === 'zap') {
          // Zap is instant with lightning
          spellType = 'zap_spell';
          spellSpeed = 100; // Very fast (instant)
        } else if (actualCard.id === 'arrows') {
          // Arrows fall from sky with volley visual
          spellType = 'arrows_spell';
          startY = 0; // Start from top of screen
          spellSpeed = 20;
        } else if (actualCard.id === 'poison') {
          // Poison is instant area that stays and ticks damage
          spellType = 'poison_spell';
          spellSpeed = 100; // Instant - no travel time
          startX = x; // Start at target location
          startY = y;  // Start at target location
        } else if (actualCard.id === 'rocket') {
          // Rocket shoots straight up then down on target
          spellType = 'rocket_spell';
          startY = height;
          spellSpeed = 12; // Slower than fireball
        } else if (actualCard.id === 'goblin_barrel') {
          // Goblin Barrel - spawns 3 goblins around target after delay
          spellType = 'goblin_barrel_spell';
          spellSpeed = 25; // Barrel falls from sky
          startX = x;
          startY = 0; // Start from top of screen

          // Create barrel projectile that will spawn goblins on impact
          const spawnCardId = actualCard.spawns;
          const spawnCard = CARDS.find(c => c.id === spawnCardId);
          const spawnCount = actualCard.spawnCount || 3;

          setProjectiles(prev => [...prev, {
            id: Date.now(),
            x: startX,
            y: startY,
            targetX: x,
            targetY: y,
            speed: spellSpeed,
            damage: 0,
            radius: actualCard.radius,
            type: spellType,
            isSpell: true,
            hit: false,
            spawnTime: Date.now(),
            isGoblinBarrel: true,
            spawns: spawnCardId,
            spawnCount: spawnCount
          }]);
        } else if (actualCard.id === 'earthquake') {
          // Earthquake - instant damage with screen shake
          spellType = 'earthquake_spell';
          spellSpeed = 100; // Instant

          setProjectiles(prev => [...prev, {
            id: Date.now(),
            x: x, // Start at target (instant)
            y: y,
            targetX: x,
            targetY: y,
            speed: spellSpeed,
            damage: actualCard.damage,
            radius: actualCard.radius,
            type: spellType,
            isSpell: true,
            stun: actualCard.stun || 0,
            duration: actualCard.duration || 0,
            hit: true, // Instant - already hit the ground
            spawnTime: Date.now(),
            slow: actualCard.slow
          }]);

          // Trigger screen shake
          setScreenShake({ intensity: 1.0, duration: 500 });
        } else if (actualCard.id === 'graveyard') {
          // Graveyard - spawns skeletons gradually over time
          spellType = 'graveyard_spell';
          spellSpeed = 100; // Instant

          const spawnCardId = actualCard.spawns;
          const spawnCard = CARDS.find(c => c.id === spawnCardId);
          const spawnCount = actualCard.spawnCount || 15;

          // Create a graveyard zone that spawns skeletons over 4 seconds
          const newUnit = {
            id: 'graveyard_' + Date.now(),
            x: x,
            y: y,
            hp: 9999, // Invincible - cannot be destroyed
            maxHp: 9999,
            isOpponent: false,
            speed: 0, // Stationary
            lane: x < width / 2 ? 'LEFT' : 'RIGHT',
            lastAttack: 0,
            spriteId: 'graveyard_zone',
            type: 'graveyard_zone', // Special type
            range: 0,
            damage: 0,
            attackSpeed: 0,
            spawns: spawnCardId,
            spawnRate: 0.5, // Spawn every 0.5 seconds (20 skeletons in 10 seconds)
            spawnCount: 1, // Spawn 1 skeleton at a time
            lastSpawn: Date.now(),
            lifetimeDuration: 10, // Lasts 10 seconds
            spawnTime: Date.now(),
            totalToSpawn: 20, // 10s / 0.5s = 20 skeletons
            spawnedSoFar: 0,
            isOpponent: false,
            isZone: true, // Mark as a zone (untargetable by units)
            radius: actualCard.radius // Set the radius for visual scaling
          };
          setUnits(prev => [...prev, newUnit]);
        }

        // For poison, mark it as already hit since it's instant
        const isPoison = actualCard.id === 'poison';
        // Skip default projectile creation for Lightning, Goblin Barrel, Graveyard, and Earthquake as we handled them
        if (actualCard.id !== 'lightning' && actualCard.id !== 'goblin_barrel' && actualCard.id !== 'graveyard' && actualCard.id !== 'earthquake') {
          const currentTime = Date.now();
          setProjectiles(prev => [...prev, {
            id: Date.now(),
            x: startX,
            y: startY,
            targetX: x,
            targetY: y,
            speed: spellSpeed,
            damage: actualCard.damage,
            radius: actualCard.radius,
            type: spellType,
            isSpell: true,
            stun: actualCard.stun || 0,
            duration: actualCard.duration || 0,
            hit: isPoison, // Poison is instant
            spawnTime: currentTime, // Track when poison was spawned
            isPoison: isPoison // Mark as poison for special handling
          }]);
        }
      } else {
        const lane = x < width / 2 ? 'LEFT' : 'RIGHT';
        const count = actualCard.count || 1;
        const newUnits = [];

        for (let i = 0; i < count; i++) {
          const offsetX = count > 1 ? (Math.random() * 40 - 20) : 0;
          const offsetY = count > 1 ? (Math.random() * 40 - 20) : 0;

          // Three Musketeers special split: 2 to one lane, 1 to the other
          let unitLane = lane;
          let spawnX = x + offsetX;
          let spawnY = y + offsetY;

          if (actualCard.id === 'three_musketeers' && count === 3) {
            if (i < 2) {
              // First 2 go to the dropped lane
              unitLane = lane;
              spawnX = x + offsetX;
              spawnY = y + offsetY;
            } else {
              // Third one goes to opposite lane
              unitLane = lane === 'LEFT' ? 'RIGHT' : 'LEFT';
              // Spawn on opposite side of the river
              spawnX = unitLane === 'LEFT' ? 70 + offsetX : width - 70 + offsetX;
              spawnY = y + offsetY;
            }
          }

          newUnits.push({
            id: Date.now() + i,
            x: spawnX,
            y: spawnY,
            hp: actualCard.hp,
            maxHp: actualCard.hp,
            isOpponent: false,
            speed: actualCard.speed,
            lane: unitLane,
            lastAttack: 0,
            spriteId: actualCard.id,
            type: actualCard.type,
            range: actualCard.range,
            damage: actualCard.damage,
            attackSpeed: actualCard.attackSpeed,
            projectile: actualCard.projectile,
            targetType: actualCard.targetType,
            // Special properties
            charge: actualCard.charge ? {
              active: false,
              distance: 0,      // Distance traveled so far
              threshold: 2      // Charge activates after 2 tiles
            } : undefined,
            hidden: actualCard.hidden ? { active: true, visibleHp: actualCard.hp } : undefined,
            splash: actualCard.splash || false,
            spawnDamage: actualCard.spawnDamage,
            spawns: actualCard.spawns,
            spawnRate: actualCard.spawnRate,
            spawnCount: actualCard.spawnCount,  // Custom spawn count (e.g., Tombstone: 2, Witch: 3)
            deathSpawnCount: actualCard.deathSpawnCount,  // Units to spawn on death (Tombstone: 4, Lava Hound: 6)
            deathSpawns: actualCard.deathSpawns,  // What unit type to spawn on death (e.g., 'lava_pups')
            lastSpawn: actualCard.spawnRate ? Date.now() : 0,  // Initialize to now for buildings with spawnRate
            lifetimeDuration: actualCard.lifetime,  // Store lifetime duration in seconds
            spawnTime: Date.now(),  // Track when building was spawned for HP depreciation
            spawnDelay: actualCard.spawnDelay || 0,  // Spawn delay before unit can move/attack (Golem: 1000ms, Golemite: 500ms)
            maxHp: actualCard.hp,  // Store initial max HP for depreciation calculation
            jumps: actualCard.jumps || false,  // Hog Rider can jump over river
            slow: actualCard.slow || 0,
            slowUntil: 0,
            stunUntil: 0,
            baseDamage: actualCard.damage,
            lockedTarget: null,  // Once locked, unit won't switch targets
            wasPushed: false,    // Track if unit was pushed back (unlocks target)
            wasStunned: false,   // Track if unit was stunned (unlocks target when stun ends)
            kamikaze: actualCard.kamikaze || false,  // Spirit cards die when they attack
            chain: actualCard.chain || 0,  // Electro Spirit chain count
            healsOnAttack: actualCard.healsOnAttack || 0,  // Heal Spirit healing amount
            healRadius: actualCard.healRadius || 0,  // Heal Spirit healing radius
            deathRage: actualCard.deathRage || false,  // Lumberjack rage on death
            generatesElixir: actualCard.generatesElixir || false,  // Elixir Collector generates elixir
            elixirGenerationTime: 0  // Track last elixir generation time
          });
          // Log spawn properties for debugging
          if (actualCard.spawns) {
            console.log('[SPAWN CARD]', actualCard.id, 'spawns:', actualCard.spawns, 'spawnRate:', actualCard.spawnRate);
          }
          if (actualCard.deathSpawns) {
            console.log('[SPAWN CARD]', actualCard.id, 'deathSpawns:', actualCard.deathSpawns, 'deathSpawnCount:', actualCard.deathSpawnCount);
          }
        }
        setUnits(prev => [...(prev || []), ...newUnits]);

        // Electro Wizard spawn zap & Mega Knight Spawn Knockback
        if (actualCard.id === 'electro_wizard' || actualCard.id === 'mega_knight') {
          setUnits(prevUnits => {
            const spawnZapRange = actualCard.id === 'mega_knight' ? 80 : 60;
            const spawnZapDamage = actualCard.spawnDamage || actualCard.damage;
            const stunDuration = actualCard.stun || (actualCard.id === 'mega_knight' ? 0 : 0.5);
            const knockbackForce = actualCard.id === 'mega_knight' ? 40 : 0; // Mega Knight knocks back

            return prevUnits.map(u => {
              // Only affect enemy units within range
              if (!u.isOpponent) return u; // Skip friendly units

              const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));
              if (dist <= spawnZapRange) {
                // Visual effect handled by adding a projectile or just implied?
                // For E-Wiz we added a projectile. For MK we might want one too or just a splash event.

                if (actualCard.id === 'electro_wizard') {
                  setProjectiles(prevProjs => [...prevProjs, {
                    id: Date.now() + Math.random(),
                    x: x,
                    y: y,
                    targetX: u.x,
                    targetY: u.y,
                    speed: 50,
                    damage: 0, // Damage applied below manually
                    type: 'electric_bolt',
                    stun: stunDuration,
                    isSpell: true,
                    hit: true,
                    spawnZap: true
                  }]);
                }

                // Apply damage, stun, and KNOCKBACK
                let newX = u.x;
                let newY = u.y;

                if (knockbackForce > 0) {
                  const angle = Math.atan2(u.y - y, u.x - x);
                  newX += Math.cos(angle) * knockbackForce;
                  newY += Math.sin(angle) * knockbackForce;
                  // Boundary checks
                  newX = Math.max(10, Math.min(width - 10, newX));
                  newY = Math.max(10, Math.min(height - 10, newY));
                }

                return {
                  ...u,
                  x: newX,
                  y: newY,
                  hp: u.hp - spawnZapDamage,
                  stunUntil: stunDuration > 0 ? Date.now() + (stunDuration * 1000) : u.stunUntil,
                  wasStunned: stunDuration > 0,
                  wasPushed: knockbackForce > 0
                };
              }
              return u;
            });
          });
        }
      }

      // Track the last played card (but NOT when playing Mirror itself)
      if (card.id !== 'mirror') {
        setLastPlayedCard(card);
      }

      // Cycle cards - use findIndex + splice to remove only first occurrence
      // For Mirror, we remove Mirror from hand, not the copied card
      const cardToCycle = card;
      setHand(currentHand => {
        const newHand = [...currentHand];
        const cardIndex = newHand.findIndex(c => c.id === cardToCycle.id);
        if (cardIndex !== -1) {
          newHand.splice(cardIndex, 1);
        }
        newHand.push(nextCard);
        console.log('[spawnCard] Card cycled successfully - removed', cardToCycle.name, 'from hand, added', nextCard.name);
        return newHand;
      });

      setDeckQueue(currentQueue => {
        const newQueue = [...currentQueue];
        const newNext = newQueue.shift();
        // Don't add Mirror to deck queue - Mirror copies cards, it doesn't get recycled
        if (cardToCycle.id !== 'mirror') {
          newQueue.push(cardToCycle);
        }
        setNextCard(newNext);
        console.log('[spawnCard] Deck updated - new next card:', newNext?.name);
        return newQueue;
      });

      console.log('[spawnCard] SUCCESS -', actualCard.name, 'spawned, elixir:', newElixir);
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
    { id: 'test_chest', slotIndex: 0, type: 'TEST', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
    { id: 'chest_1', slotIndex: 1, type: 'SILVER', state: 'LOCKED', unlockTime: 3 * 60 * 60, timeLeft: 3 * 60 * 60 },
    { id: 'chest_2', slotIndex: 2, type: 'GOLD', state: 'LOCKED', unlockTime: 8 * 60 * 60, timeLeft: 8 * 60 * 60 },
  ]);

  // Chest Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setChests(prevChests => {
        return prevChests.map(chest => {
          if (chest.state === 'UNLOCKING') {
            const newTimeLeft = Math.max(0, chest.timeLeft - 1);
            if (newTimeLeft === 0) {
              return { ...chest, state: 'UNLOCKED', timeLeft: 0 };
            }
            return { ...chest, timeLeft: newTimeLeft };
          }
          return chest;
        });
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlockChest = (chestToUnlock) => {
    // Check if another chest is already unlocking
    const isAnyUnlocking = chests.some(c => c.state === 'UNLOCKING');
    if (isAnyUnlocking) {
      // In real game, you can queue one, but for now simple 1 at a time
      console.log('Already unlocking a chest!');
      return;
    }

    setChests(prev => prev.map(c => {
      if (c.id === chestToUnlock.id) {
        return { ...c, state: 'UNLOCKING' };
      }
      return c;
    }));
  };

  const handleOpenChest = (chestToOpen) => {
    console.log('handleOpenChest called with:', chestToOpen);
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
            state: 'LOCKED',
            unlockTime: unlockTime,
            timeLeft: unlockTime
          };
          return [...prev, newChest];
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

        // If stun just ended, unlock target
        if (wasPreviouslyStunned && !isCurrentlyStunned) {
          u.lockedTarget = null;
          u.wasStunned = false;
        } else if (isCurrentlyStunned) {
          u.wasStunned = true;
          return u; // Can't move or attack while stunned
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
                    healsOnAttack: spawnCard.healsOnAttack || 0,
                    healRadius: spawnCard.healRadius || 0,
                    chain: spawnCard.chain || 0,
                    stun: spawnCard.stun || 0
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

        // Handle Tesla hidden mechanic
        // In real CR: Tesla has full range/damage at all times
        // When hidden: cannot be targeted by enemies
        // When visible (enemies in range): attacks normally
        let actualDamage = u.damage;
        let actualRange = u.range;
        if (u.hidden) {
          // Check if enemy unit is in detection range (slightly larger than attack range)
          const detectionRange = u.range * 1.2;
          const hasEnemyInRange = (unitsRef.current || []).some(enemy =>
            enemy.isOpponent !== u.isOpponent && enemy.hp > 0 &&
            Math.sqrt(Math.pow(enemy.x - u.x, 2) + Math.pow(enemy.y - u.y, 2)) <= detectionRange
          );

          // Track when Tesla was last in combat
          if (!u.hidden.lastCombatTime) {
            u.hidden.lastCombatTime = now;
          }

          if (hasEnemyInRange) {
            // Tesla emerges - visible and can attack with full stats
            u.hidden.lastCombatTime = now;
            if (u.hidden.active) {
              u.hidden.wakeTime = now;

              // Tesla reveal visual effect
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'tesla_reveal',
                x: u.x,
                y: u.y,
                radius: 50,
                startTime: Date.now(),
                duration: 500
              }]);
            }
            u.hidden.active = false;
          } else {
            // Check if been out of combat for 3+ seconds
            const timeSinceCombat = (now - u.hidden.lastCombatTime) / 1000;
            if (timeSinceCombat > 3) {
              // Go underground - hidden and untargetable
              u.hidden.active = true;
            }
            // While visible (just emerged), Tesla can still attack with full stats
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
            !(targetUnit.hidden?.active && targetUnit.spriteId === 'tesla') &&
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

        if (closestTarget && minDist <= actualRange + 25) {
          // LOCK the target when starting to attack
          if (!u.lockedTarget) {
            u.lockedTarget = closestTarget.id;
          }

          const isWakingUp = u.hidden && u.hidden.wakeTime && (now - u.hidden.wakeTime < 500);

          let currentAttackSpeed = u.attackSpeed;
          if (u.slowUntil > now) {
            currentAttackSpeed = u.attackSpeed / (1 - (u.slowAmount || 0.35));
          }
          if (u.rageUntil > now) {
            currentAttackSpeed = u.attackSpeed / 1.35; // 35% faster attack speed
          }

          if (now - u.lastAttack > currentAttackSpeed && !isWakingUp) {
            // Calculate damage to deal
            let damageToDeal = actualDamage;

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
                  isOpponent: u.isOpponent
                });
              });
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
                  targetX: closestTarget.x,
                  targetY: closestTarget.y,
                  damage: damageToDeal
                });
              }

              // Spirit Cards special effects
              if (u.kamikaze) {
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

                // Heal Spirit - heal visual
                if (u.healsOnAttack > 0) {
                  healEvents.push({
                    x: closestTarget.x,
                    y: closestTarget.y,
                    radius: u.healRadius,
                    amount: u.healsOnAttack,
                    isOpponent: u.isOpponent
                  });
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'heal_glow',
                    x: closestTarget.x,
                    y: closestTarget.y,
                    radius: u.healRadius,
                    startTime: Date.now(),
                    duration: 600
                  }]);
                }

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
            return { ...u, lastAttack: now, hidden: u.hidden, charge: updatedCharge, lockedTarget: u.lockedTarget, wasPushed: false, wasStunned: u.wasStunned };
          }
          return { ...u, hidden: u.hidden, lockedTarget: u.lockedTarget, wasPushed: false, wasStunned: u.wasStunned };
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
          } else {

            // Apply slow effect
            if (u.slowUntil > now) {
              effectiveSpeed *= (1 - (u.slowAmount || 0.35));
            }

            // Movement Calculation
            if ((u.jumps || u.type === 'flying') && closestTarget) {
              // Direct pathfinding for units that ignore terrain
              const angle = Math.atan2(closestTarget.y - u.y, closestTarget.x - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;
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
            const allTowers = (nextTowers || []).filter(t => t.hp > 0);

            // Find the enemy King tower to redirect to after destroying princess tower
            const enemyKing = (nextTowers || []).find(t => t.type === 'king' && t.isOpponent !== u.isOpponent && t.hp > 0);
            const kingCenterX = enemyKing ? enemyKing.x : width / 2;

            // Check if unit's lane princess tower is destroyed
            const lanePrincess = (nextTowers || []).find(t =>
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

            for (let t of allTowers) {
              const distToTower = Math.sqrt(Math.pow(t.x - nextX, 2) + Math.pow(t.y - nextY, 2));
              const minDistance = (t.type === 'king' ? 45 : 35);

              if (distToTower < minDistance) {
                collision = true;
                if (nextX < t.x) {
                  avoidX = -2;
                } else {
                  avoidX = 2;
                }
                break;
              }
            }

            if (collision && effectiveSpeed > 0) {
              nextX += avoidX;
              nextY = u.y + (u.isOpponent ? effectiveSpeed * 0.5 : -effectiveSpeed * 0.5);
            } else if (!collision && effectiveSpeed > 0) {
              const riverY = height / 2;
              const distToRiver = Math.abs(nextY - riverY);

              // Hog Rider can jump over river - skip bridge logic
              // Flying units fly over river - skip bridge logic
              if (u.jumps || u.type === 'flying') {
                // Jump/fly over river - just continue straight across
                // No bridge steering needed
              } else if (distToRiver < 100) {
                // Other ground units must use bridges
                const bridgeCenterX = u.lane === 'LEFT' ? 95 : width - 95;
                const diffX = bridgeCenterX - nextX;
                if (Math.abs(diffX) > 2) {
                  const steerSpeed = 1.5;
                  nextX += Math.sign(diffX) * steerSpeed;
                }
              }
            }
          }

          return { ...u, x: nextX, y: nextY, hidden: u.hidden, charge: u.charge, lockedTarget: u.lockedTarget, wasPushed: u.wasPushed, wasStunned: u.wasStunned, isJumping: isJumpingNow, jumpTargetId: u.jumpTargetId };
        }
      });

      // Filter out dead units - but handle death spawns first
      const beforeFilter = currentUnits.length;
      const unitsThatDied = [];

      currentUnits = currentUnits.filter(u => {
        if (u.hp <= 0) {
          // Track units that died this frame for death spawn handling
          unitsThatDied.push(u);

          if (u.spriteId === 'skeletons') {
            console.log('[FILTER]', 'skeleton died - hp:', u.hp);
          }
          return false;
        }
        if (u.y <= -50 || u.y >= height + 50) {
          if (u.spriteId === 'skeletons') {
            console.log('[FILTER]', 'skeleton out of bounds - y:', u.y, 'height:', height);
          }
          return false;
        }
        return true;
      });

      // Handle death spawns (Goblin Hut spawns 3 goblins when destroyed)
      if (unitsThatDied.length > 0) {
        unitsThatDied.forEach(deadUnit => {
          // Goblin Hut death spawn - 3 Spear Goblins
          if (deadUnit.spriteId === 'goblin_hut' && deadUnit.isOpponent === false) {
            const spawnCard = CARDS.find(c => c.id === 'sword_goblins');
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
            // Create Rage effect at Lumberjack's death location
            setProjectiles(prev => [...prev, {
              id: Date.now() + Math.random(),
              x: deadUnit.x,
              y: deadUnit.y,
              targetX: deadUnit.x,
              targetY: deadUnit.y,
              speed: 0,
              damage: 0,
              radius: 50, // Rage spell radius (2.5 tiles = 50 pixels)
              type: 'rage_spell',
              isSpell: true,
              isRage: true,
              hit: true,
              spawnTime: now,
              duration: 6, // Rage lasts 6 seconds
              isOpponent: deadUnit.isOpponent
            }]);
          }
        });
      }

      const afterFilter = currentUnits.length;
      if (beforeFilter !== afterFilter) {
        console.log('[FILTER]', 'Removed', beforeFilter - afterFilter, 'units');
      }

      // Apply collected splash damage events
      splashEvents.forEach(event => {
        const splashRadius = 50;
        // Damage all enemy units in splash radius
        currentUnits = currentUnits.map(unit => {
          if (unit.isOpponent !== event.attacker.isOpponent && unit.hp > 0) {
            const dist = Math.sqrt(Math.pow(unit.x - event.targetX, 2) + Math.pow(unit.y - event.targetY, 2));
            if (dist <= splashRadius) {
              let updatedUnit = { ...unit, hp: unit.hp - Math.floor(event.damage * 0.5) };
              if (event.slow) {
                updatedUnit.slowUntil = Date.now() + 2000;
                updatedUnit.slowAmount = event.slow;
              }
              // Handle Knockback
              if (event.knockback) {
                const angle = Math.atan2(unit.y - event.targetY, unit.x - event.targetX);
                updatedUnit.x += Math.cos(angle) * event.knockback;
                updatedUnit.y += Math.sin(angle) * event.knockback;
                // Keep bounds
                updatedUnit.x = Math.max(10, Math.min(width - 10, updatedUnit.x));
                updatedUnit.y = Math.max(10, Math.min(height - 10, updatedUnit.y));
                updatedUnit.wasPushed = true;
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
              return { ...tower, hp: tower.hp - Math.floor(event.damage * 0.5) };
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
          if (h.isSpell) {
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
                      return { ...t, hp: t.hp - h.damage };
                    }
                    return t;
                  });
                  // Update last tick time by modifying the projectile
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
                    isOpponent: false,
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

                // Add goblins to the game
                setUnits(prev => [...prev, ...newGoblins]);
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

                  let updatedUnit = { ...u, hp: u.hp - damageToDeal };

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
                  let damageToDeal = h.damage;

                  // Earthquake: 3.5x damage to buildings (towers are buildings)
                  if (h.type === 'earthquake_spell') {
                    damageToDeal = Math.floor(h.damage * 3.5);
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
              }
            }

          } else {
            // Handle projectile hits (arrows, bullets, fireballs)
            const hitX = h.targetX;
            const hitY = h.targetY;

            // Damage the primary target
            currentUnits = currentUnits.map(u => {
              if (u.id === h.targetId) {
                let updatedUnit = { ...u, hp: u.hp - h.damage };

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
                return updatedUnit;
              }
              return u;
            });

            // Apply splash damage if projectile has splash
            if (h.splash) {
              const splashRadius = 50;
              currentUnits = currentUnits.map(u => {
                if (u.id !== h.targetId && u.hp > 0) {
                  const isEnemy = h.isOpponent !== undefined ? !h.isOpponent : u.isOpponent;
                  if (isEnemy) {
                    const dist = Math.sqrt(Math.pow(u.x - hitX, 2) + Math.pow(u.y - hitY, 2));
                    if (dist <= splashRadius) {
                      let updatedUnit = { ...u, hp: u.hp - Math.floor(h.damage * 0.5) };

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
                let updatedTower = { ...tower, hp: tower.hp - h.damage };

                // Tower hit visual effect for significant damage
                if (h.damage > 50) {
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
            }
          }
        });

        // Remove hit projectiles, but keep poison and visual-only projectiles
        activeProjectiles = activeProjectiles.filter(p => {
          if (p.keepVisual && p.type === 'tesla_lightning') {
            return (now - Math.floor(p.id)) < 150;
          }
          if (p.isPoison || p.isRage) {
            return ((now - p.spawnTime) / 1000 < p.duration);
          }
          return !p.hit;
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
            damage: 50,
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
            return { ...u, hp: u.hp - totalDamage, charge: updatedCharge };
          }
          return u;
        });
      }

      // Check for death spawns (Tombstone -> skeletons, Lava Hound -> lava pups)
      // This MUST run after damage is applied but before dead units are filtered
      const deathSpawns = [];
      currentUnits.forEach(u => {
        // Generic death spawn check - works for Tombstone, Lava Hound, etc.
        if (u.hp <= 0 && (u.spriteId === 'tombstone' || u.deathSpawns || u.deathRage)) {
          
          if (u.deathRage) {
             // Spawn Rage Spell
             activeProjectiles.push({
                id: Date.now() + Math.random(),
                x: u.x,
                y: u.y,
                targetX: u.x,
                targetY: u.y,
                speed: 100, // Instant
                damage: 0,
                radius: 65, // Rage radius
                type: 'rage_spell',
                isSpell: true,
                isRage: true,
                spawnTime: Date.now(),
                duration: 6, // Rage lasts 6 seconds (reduced for balance/implementation simplicty, usually 6-8s)
                isOpponent: u.isOpponent,
                hit: true // It's already "hit" the ground
             });

             // Lumberjack rage drop visual effect
             setVisualEffects(prev => [...prev, {
               id: Date.now() + Math.random(),
               type: 'lumberjack_rage',
               x: u.x,
               y: u.y,
               radius: 50,
               startTime: Date.now(),
               duration: 1000
             }]);
          }

          // Determine what to spawn
          let spawnId = 'skeletons'; // Default for Tombstone
          if (u.deathSpawns) {
            spawnId = u.deathSpawns; // Use custom spawn type (e.g., 'lava_pups')
          }

          const spawnCard = CARDS.find(c => c.id === spawnId);
          if (spawnCard) {
            const deathSpawnCount = u.deathSpawnCount || 4;
            for (let i = 0; i < deathSpawnCount; i++) {
              // Spawn units in a spread pattern around the destroyed unit
              const angle = (i / deathSpawnCount) * Math.PI * 2 + Math.random() * 0.5;
              const distance = 50 + Math.random() * 30;  // 50-80 pixels away
              const offsetX = Math.cos(angle) * distance;
              const offsetY = Math.sin(angle) * distance;
              deathSpawns.push({
                id: Date.now() + Math.random() * 1000 + i,
                x: u.x + offsetX,
                y: u.y + offsetY,
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
                spawnTime: Date.now(),  // Track spawn time for spawn delay
                spawnDelay: spawnCard.spawnDelay || 0  // Inherit spawn delay from card
              });
            }

            // Add death visual effects based on unit type
            if (u.spriteId === 'golem' || u.spriteId === 'golemite') {
              // Golem death - stone explosion
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'golem_death',
                x: u.x,
                y: u.y,
                radius: 80,
                startTime: Date.now(),
                duration: 1000
              }]);
            } else if (u.spriteId === 'lava_hound') {
              // Lava Hound death - fiery explosion
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'lava_hound_death',
                x: u.x,
                y: u.y,
                radius: 100,
                startTime: Date.now(),
                duration: 1500
              }]);
            } else if (u.spriteId === 'tombstone') {
              // Tombstone destruction
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'building_destruction',
                x: u.x,
                y: u.y,
                radius: 50,
                startTime: Date.now(),
                duration: 800
              }]);
            }
          }
        }
      });

      // Add death spawns to collection
      if (deathSpawns.length > 0) {
        unitsToSpawn.push(...deathSpawns);
      }

      // Filter dead units
      currentUnits = currentUnits.filter(u => u.hp > 0);

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

      if (!currentHand.length) return; // Skip if no hand

      console.log('[Enemy AI] Thinking - Elixir:', currentElixir, 'Hand:', currentHand.map(c => c.name), 'Player units:', playerUnits.length);

      // SMART CARD SELECTION
      let cardToPlay = null;
      let cardIndex = -1;

      // Priority 1: Counter swarm units with spells or splash
      const swarmUnits = playerUnits.filter(u => (u.spriteId === 'skeleton_army' || u.spriteId === 'minions' || u.spriteId === 'minion_horde' || u.spriteId === 'spear_goblins' || u.spriteId === 'barbarians' || u.spriteId === 'skeletons') && u.hp > 0);
      if (swarmUnits.length >= 3) {
        // Look for spells first (arrows, zap, fireball)
        const spellCard = currentHand.findIndex(c => c.type === 'spell' && c.cost <= currentElixir && (c.id === 'arrows' || c.id === 'zap' || c.id === 'fireball'));
        if (spellCard !== -1) {
          cardToPlay = currentHand[spellCard];
          cardIndex = spellCard;
          console.log('[Enemy AI] COUNTER: Using spell on swarm');
        } else {
          // Look for splash units (Valkyrie, Wizard, Baby Dragon)
          const splashCard = currentHand.findIndex(c => c.splash && c.cost <= currentElixir && c.type !== 'spell');
          if (splashCard !== -1) {
            cardToPlay = currentHand[splashCard];
            cardIndex = splashCard;
            console.log('[Enemy AI] COUNTER: Using splash on swarm');
          }
        }
      }

      // Priority 2: Counter buildings with building-targeting units
      const playerBuildings = playerUnits.filter(u => u.type === 'building' && u.hp > 0);
      if (playerBuildings.length > 0 && !cardToPlay) {
        const buildingKiller = currentHand.findIndex(c => c.targetType === 'buildings' && c.cost <= currentElixir);
        if (buildingKiller !== -1) {
          cardToPlay = currentHand[buildingKiller];
          cardIndex = buildingKiller;
          console.log('[Enemy AI] COUNTER: Targeting buildings');
        }
      }

      // Priority 3: Save elixir for big pushes in double elixir
      const shouldSaveForBigPush = isDoubleElixir && currentElixir < 7 && currentHand.some(c => c.cost >= 5);
      if (!shouldSaveForBigPush && !cardToPlay) {
        // Priority 4: Tank + support combo (if we have many units)
        if (enemyUnits.length >= 2 && currentElixir >= 5) {
          const bigCard = currentHand.findIndex(c => c.cost >= 4 && c.cost <= currentElixir && (c.hp > 1000 || c.damage > 150));
          if (bigCard !== -1) {
            cardToPlay = currentHand[bigCard];
            cardIndex = bigCard;
            console.log('[Enemy AI] COMBO: Adding to push');
          }
        }

        // Priority 5: Play best affordable card based on game state
        if (!cardToPlay) {
          const affordableCards = currentHand.map((card, idx) => ({ card, idx, priority: 0 }))
            .filter(({ card }) => card.cost <= currentElixir);

          if (affordableCards.length > 0) {
            // Score each card
            affordableCards.forEach(({ card, idx }) => {
              // Prefer high HP tanks when we have few units
              if (enemyUnits.length < 2 && card.hp > 1000) card.priority += 50;

              // Prefer splash damage when player has many units
              if (playerUnits.length >= 2 && card.splash) card.priority += 40;

              // Prefer high damage units when player has low HP units
              if (playerUnits.some(u => u.hp < 300) && card.damage > 100) card.priority += 30;

              // Prefer ranged units when we're ahead on units
              if (enemyUnits.length > playerUnits.length && card.range > 50) card.priority += 20;

              // Prefer expensive cards in double elixir
              if (isDoubleElixir && card.cost >= 5) card.priority += 25;

              // Random factor for variety
              card.priority += Math.random() * 10;
            });

            // Sort by priority and pick best
            affordableCards.sort((a, b) => b.priority - a.priority);
            cardToPlay = affordableCards[0].card;
            cardIndex = affordableCards[0].idx;
            console.log('[Enemy AI] BEST CARD:', cardToPlay.name, 'priority:', Math.floor(affordableCards[0].priority));
          }
        }
      }

      if (cardToPlay && cardIndex !== -1) {
        const card = cardToPlay;

        // SMART POSITIONING
        let targetX, targetY;
        const lane = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';

        if (card.type === 'spell') {
          // Cast spell strategically
          if (swarmUnits.length >= 3 && card.id !== 'poison') {
            // Target spell at swarm center
            const avgX = swarmUnits.reduce((sum, u) => sum + u.x, 0) / swarmUnits.length;
            const avgY = swarmUnits.reduce((sum, u) => sum + u.y, 0) / swarmUnits.length;
            targetX = avgX;
            targetY = avgY;
            console.log('[Enemy AI] SPELL: Targeting swarm at', targetX, targetY);
          } else if (card.id === 'poison' && playerUnits.length > 0) {
            // Poison targets unit clusters
            const avgX = playerUnits.reduce((sum, u) => sum + u.x, 0) / playerUnits.length;
            const avgY = playerUnits.reduce((sum, u) => sum + u.y, 0) / playerUnits.length;
            targetX = avgX;
            targetY = avgY;
            console.log('[Enemy AI] SPELL: Poisoning cluster');
          } else if (playerBuildings.length > 0) {
            // Target buildings
            const target = playerBuildings[0];
            targetX = target.x;
            targetY = target.y;
            console.log('[Enemy AI] SPELL: Targeting building');
          } else {
            // Random spell placement
            targetX = Math.random() * (width - 100) + 50;
            targetY = height - 100 - Math.random() * 150;
          }

          const spellType = card.id === 'zap' ? 'zap_spell' :
            card.id === 'arrows' ? 'arrows_spell' :
              card.id === 'poison' ? 'poison_spell' : 'fireball_spell';

          setProjectiles(prev => [...prev, {
            id: Date.now(),
            x: card.id === 'poison' ? targetX : width / 2,
            y: card.id === 'poison' ? targetY : 0,
            targetX: targetX,
            targetY: targetY,
            speed: card.id === 'zap' ? 100 : card.id === 'poison' ? 100 : 15,
            damage: card.damage,
            radius: card.radius,
            type: spellType,
            isSpell: true,
            stun: card.stun || 0,
            duration: card.duration || 0,
            hit: card.id === 'poison',
            spawnTime: Date.now(),
            isPoison: card.id === 'poison'
          }]);
        } else {
          // Smart unit deployment
          const spawnX = lane === 'LEFT' ? 70 : width - 70;
          let spawnY = 100;

          // Position based on card type
          if (card.targetType === 'buildings') {
            // Target buildings - spawn closer to action
            if (playerBuildings.length > 0) {
              spawnY = playerBuildings[0].y - 80;
            }
          } else if (card.type === 'flying') {
            // Flying units - spawn ahead
            spawnY = 80;
          } else if (card.hp > 1500) {
            // Tanks - spawn in front
            spawnY = 120;
          } else if (card.range > 50) {
            // Ranged - spawn behind
            spawnY = 60;
          }

          console.log('[Enemy AI] DEPLOYING', card.name, 'at lane:', lane);

          // Spawn enemy unit(s)
          const count = card.count || 1;
          const newUnits = [];

          for (let i = 0; i < count; i++) {
            const offsetX = count > 1 ? (Math.random() * 40 - 20) : 0;
            const offsetY = count > 1 ? (Math.random() * 40 - 20) : 0;

            const newUnit = {
              id: Date.now() + i,
              x: spawnX + offsetX,
              y: spawnY + offsetY,
              hp: card.hp,
              maxHp: card.hp,
              isOpponent: true,
              speed: card.speed,
              lane: lane,
              lastAttack: 0,
              spriteId: card.id,
              type: card.type,
              range: card.range,
              damage: card.damage,
              attackSpeed: card.attackSpeed,
              projectile: card.projectile,
              // Special properties
              charge: card.charge ? {
                active: false,
                distance: 0,
                threshold: 2
              } : undefined,
              hidden: card.hidden ? { active: true, visibleHp: card.hp } : undefined,
              splash: card.splash || false,
              spawns: card.spawns,
              spawnRate: card.spawnRate,
              lastSpawn: 0,
              lifetime: card.lifetime ? Date.now() + card.lifetime * 1000 : undefined,
              stunUntil: 0,
              baseDamage: card.damage,
              targetType: card.targetType,
              lockedTarget: null,
              wasPushed: false,
              wasStunned: false
            };
            newUnits.push(newUnit);
          }
          setUnits(prev => [...prev, ...newUnits]);
        }

        // Deduct elixir
        setEnemyElixir(prev => prev - card.cost);

        // Cycle enemy cards
        setEnemyHand(prevHand => {
          const newHand = [...prevHand];
          newHand.splice(cardIndex, 1);
          newHand.push(enemyNextCardRef.current);
          return newHand;
        });

        setEnemyDeckQueue(prevQueue => {
          const newQueue = [...prevQueue];
          const newNext = newQueue.shift();
          newQueue.push(card);
          setEnemyNextCard(newNext);
          return newQueue;
        });
      } else {
        console.log('[Enemy AI] Saving elixir for better play...');
      }
    }, 2400); // Faster AI thinking (2.4 seconds)

    return () => clearInterval(aiInterval);
  }, [inGame, gameOver]);

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
      />
      {globalDraggingCard && (
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
    backgroundColor: '#222',
    paddingBottom: 5,
    borderTopWidth: 2,
    borderTopColor: '#444',
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
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 4,
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
    top: -5,
    left: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D442F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 5,
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
    height: 18,
    backgroundColor: '#444',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  elixirBarFill: {
    height: '100%',
    backgroundColor: '#D442F5',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 5,
    borderRadius: 5,
    zIndex: 50,
  },
  timerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 30,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  restartButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    height: 70,
    backgroundColor: '#16213e',
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#0f3460',
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    borderTopWidth: 3,
    borderTopColor: '#F1C40F',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
  },
  tabLabelActive: {
    color: '#F1C40F',
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
    paddingTop: 45, // More space for notch
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: 'rgba(30, 39, 46, 0.9)', // Darker semi-transparent
    borderBottomWidth: 2,
    borderBottomColor: '#34495e',
  },
  lobbyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpLevelContainer: {
    width: 35,
    height: 35,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: '#2980b9',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  xpLevelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    transform: [{ rotate: '-45deg' }],
  },
  playerIdentity: {
    justifyContent: 'center',
  },
  lobbyPlayerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    textShadowColor: 'black',
    textShadowRadius: 1,
  },
  xpBarContainer: {
    width: 80,
    height: 8,
    backgroundColor: '#2c3e50',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#3498db',
  },
  lobbyHeaderRight: {
    flexDirection: 'row',
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currencyIcon: {
    fontSize: 12,
    marginRight: 5,
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
    textShadowOffset: {width: 2, height: 2},
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
