import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Svg, Circle, Rect, Path, G, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const VisualEffects = ({ effects, setEffects }) => {

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
          // Heal pulse (Battle Healer attack) - yellow/gold aura
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
                  r={effect.radius * (0.4 + progress * 0.6)}
                  fill="rgba(241, 196, 15, 0.3)"
                  stroke="#F1C40F"
                  strokeWidth="2"
                  opacity={0.5}
                />
                <Circle
                  cx={effect.radius}
                  cy={effect.radius}
                  r={effect.radius * 0.3}
                  fill="#FFF176"
                  opacity={0.2}
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
                textShadowOffset: {width: 1, height: 1}
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
        <UnitSprite id={spriteId} isOpponent={isEnemy} size={unitSize} unit={unit} />
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
              {isUnlocking && <Text style={{fontSize: 10, color: '#f1c40f'}}>Unlocking...</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default VisualEffects;
