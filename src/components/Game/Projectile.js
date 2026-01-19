import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Circle, Path, Ellipse } from 'react-native-svg';
import styles from '../../styles/gameStyles';

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
        return (
            <View style={{
                position: 'absolute',
                left: position.x - 25,
                top: position.y - 25,
                width: 50,
                height: 50,
                backgroundColor: type === 'poison_spell' ? 'rgba(231, 76, 60, 0.4)' : 'rgba(155, 89, 182, 0.4)',
                borderRadius: 25,
                borderColor: type === 'poison_spell' ? '#c0392b' : '#8e44ad',
                borderWidth: 2
            }} />
        );
    }
    if (type === 'snowball_spell') {
        // Giant Snowball
        return (
            <View style={{
                position: 'absolute',
                left: position.x - 15,
                top: position.y - 15,
                width: 30,
                height: 30,
                backgroundColor: '#ecf0f1',
                borderRadius: 15,
                borderColor: '#bdc3c7',
                borderWidth: 2,
                shadowColor: '#fff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10
            }}>
                {/* Snow particles inside */}
                <View style={{ position: 'absolute', top: 5, left: 10, width: 4, height: 4, backgroundColor: '#bdc3c7', borderRadius: 2 }} />
                <View style={{ position: 'absolute', top: 15, left: 20, width: 3, height: 3, backgroundColor: '#bdc3c7', borderRadius: 1.5 }} />
            </View>
        );
    }
    if (type === 'freeze_spell') {
        return (
            <View style={{
                position: 'absolute',
                left: position.x - 25,
                top: position.y - 25,
                width: 50,
                height: 50,
                backgroundColor: 'rgba(52, 152, 219, 0.4)',
                borderRadius: 25,
                borderColor: '#3498db',
                borderWidth: 2
            }}>
                {/* Ice crystals icon */}
                <Text style={{ position: 'absolute', top: 10, left: 15 }}>❄️</Text>
            </View>
        );
    }
    // Generic Cannonball / Projectile
    if (type === 'bomb') {
        return (
            <View style={{
                position: 'absolute',
                backgroundColor: '#2c3e50',
                width: 14,
                height: 14,
                borderRadius: 7,
                left: position.x,
                top: position.y
            }}>
                <View style={{ position: 'absolute', top: -3, right: -2, width: 4, height: 4, backgroundColor: '#e74c3c', borderRadius: 2 }} />
            </View>
        );
    }
    if (type === 'axe') {
        // Spinning Axe (Executioner) - boomerang
        const spin = (Date.now() / 5) % 360;
        return (
            <View style={{
                position: 'absolute',
                width: 20,
                height: 20,
                left: position.x - 10,
                top: position.y - 10,
                transform: [{ rotate: `${spin}deg` }]
            }}>
                <Svg width="20" height="20" viewBox="0 0 20 20">
                    <Path d="M2 10 Q10 2 18 10 Q10 18 2 10 Z" fill="#7f8c8d" stroke="black" strokeWidth="1" />
                    <Circle cx="10" cy="10" r="3" fill="black" />
                    {/* Sharp edges highlight */}
                    <Path d="M3 15 L5 14 M27 15 L25 14" stroke="#E0E0E0" strokeWidth="1" />
                </Svg>
            </View>
        );
    }
    return <View style={[styles.cannonball, { left: position.x, top: position.y }]} />;
};

export default Projectile;
