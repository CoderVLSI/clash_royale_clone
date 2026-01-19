import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import UnitSprite from '../UnitSprite';
import Card from '../Card';
import ElixirDroplet from '../ElixirDroplet';
import VisualEffects from '../VisualEffects';
import Unit from './Unit';
import Projectile from './Projectile';
import Tower from './Tower';
import GameOverScreen from './GameOverScreen';
import styles from '../../styles/gameStyles';

const { width, height } = Dimensions.get('window');

const SvgText = ({ x, y, fontSize, fill, textAnchor, dy, fontWeight, children }) => (
    <Text style={{
        position: 'absolute',
        left: x,
        top: y,
        fontSize: parseInt(fontSize),
        color: fill,
        textAlign: textAnchor === 'middle' ? 'center' : 'left',
        fontWeight: fontWeight,
        transform: [{ translateY: parseInt(dy || 0) }]
    }}>
        {children}
    </Text>
);

const GameBoard = ({
    towers, units, projectiles, visualEffects, setVisualEffects, screenShake, setScreenShake, timeLeft, gameOver,
    elixir, enemyElixir, hand, nextCard, draggingCard, dragPosition,
    handleDragStart, handleDragMove, handleDragEnd,
    spawnTestEnemy, formatTime, onRestart, score,
    isDoubleElixir, showDoubleElixirAlert,
    audioEnabled, setAudioEnabled, onConcede,
    globalDraggingCard, globalDragPosition
}) => {
    const [showSettings, setShowSettings] = useState(false);
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
                    return <Tower key={tower.id} tower={tower} />;
                })}

                <View style={styles.river}>
                    <View style={[styles.bridge, { left: 65 }]} />
                    <View style={[styles.bridge, { right: 65 }]} />
                </View>

                {(units || []).filter(u => u != null).map(u => <Unit key={u.id} unit={u} />)}
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
                                    const startY = dragPosition.y + 37.5;
                                    const logDistance = 150;
                                    const endY = draggingCard.isOpponent ? startY + logDistance : startY - logDistance;
                                    const logWidth = 40;

                                    return (
                                        <>
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
                                            <Path
                                                d={`M${dragPosition.x + 30} ${startY + 20} L${dragPosition.x + 30} ${draggingCard.isOpponent ? startY + 60 : startY - 60}`}
                                                stroke="#f1c40f"
                                                strokeWidth="3"
                                                fill="none"
                                                markerEnd="url(#arrowhead)"
                                            />
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
        </View>
    );
};

export default GameBoard;
