import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';
import ChestSlots from './ChestSlots';
import UnitSprite from '../UnitSprite';
import styles from '../../styles/gameStyles';

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

export default BattleTab;
