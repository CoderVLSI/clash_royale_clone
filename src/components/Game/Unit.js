import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import UnitSprite from '../UnitSprite';
import HealthBar from '../HealthBar';
import styles from '../../styles/gameStyles';

const Unit = ({ unit }) => {
    if (!unit) return null;

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

export default Unit;
