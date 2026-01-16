import React from 'react';
import { Svg, Circle, Rect, Path, G, Defs, RadialGradient, Stop, Polygon, Ellipse } from 'react-native-svg';
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
  return <View style={[styles.cannonball, { left: position.x, top: position.y }]} />;
};


export default Projectile;
