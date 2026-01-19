import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect, Path, G, Ellipse, Text, Line } from 'react-native-svg';
import { CARDS } from '../constants/gameData';

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

export default UnitSprite;
