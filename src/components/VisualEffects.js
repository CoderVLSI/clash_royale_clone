import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path, Rect, Line, Ellipse } from 'react-native-svg';

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
                            }} viewBox={`0 0 ${effect.width || 500} ${effect.height || 800}`}>
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
                    // Lumberjack dropping rage - bottle break + purple splash
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
                                {/* Bottle shatter */}
                                <Path d={`M${effect.radius} ${effect.radius} L${effect.radius * 0.8} ${effect.radius * 0.7} L${effect.radius * 1.2} ${effect.radius * 0.7} Z`} fill="#ecf0f1" opacity={0.8} />
                                {/* Purple splash liquid */}
                                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.6 * progress} fill="#9b59b6" opacity={0.8} />
                                <Circle cx={effect.radius * 0.7} cy={effect.radius * 0.7} r={effect.radius * 0.2 * progress} fill="#9b59b6" />
                                <Circle cx={effect.radius * 1.3} cy={effect.radius * 0.8} r={effect.radius * 0.25 * progress} fill="#9b59b6" />
                                <Circle cx={effect.radius * 0.8} cy={effect.radius * 1.3} r={effect.radius * 0.15 * progress} fill="#9b59b6" />
                            </Svg>
                        </View>
                    );
                }

                if (effect.type === 'mega_knight_slam') {
                    // Mega Knight landing - CRATER + debris + shockwave
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
                                {/* Crater - dark hole */}
                                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.5} fill="#2c3e50" opacity={0.8} />
                                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.4} fill="#000" opacity={0.4} />
                                {/* Shockwave ring */}
                                <Circle
                                    cx={effect.radius}
                                    cy={effect.radius}
                                    r={effect.radius * (0.5 + progress * 0.5)}
                                    fill="none"
                                    stroke="#bdc3c7"
                                    strokeWidth="4"
                                    opacity={0.6}
                                />
                                {/* Spikes/Debris projecting out */}
                                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                    <Path
                                        key={i}
                                        d={`M${effect.radius} ${effect.radius} L${effect.radius + Math.cos(angle * Math.PI / 180) * effect.radius * 0.8} ${effect.radius + Math.sin(angle * Math.PI / 180) * effect.radius * 0.8}`}
                                        stroke="#7f8c8d"
                                        strokeWidth="3"
                                        opacity={0.8}
                                    />
                                ))}
                            </Svg>
                        </View>
                    );
                }

                if (effect.type === 'tesla_reveal') {
                    // Tesla popping up - mechanical circles + lightning spark
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
                                {/* Opening hatch */}
                                <Circle cx={effect.radius} cy={effect.radius} r={effect.radius * 0.6} fill="none" stroke="#7f8c8d" strokeWidth="2" strokeDasharray="5 2" />
                                <Rect x={effect.radius - 10} y={effect.radius - 10} width="20" height="20" fill="#95a5a6" opacity={0.5} />
                                {/* Electric spark */}
                                <Path d={`M${effect.radius - 5} ${effect.radius} L${effect.radius + 5} ${effect.radius} L${effect.radius} ${effect.radius - 10} Z`} fill="#f1c40f" opacity={0.8 + Math.sin(now / 50) * 0.2} />
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

export default VisualEffects;
