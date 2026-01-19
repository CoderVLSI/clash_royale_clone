import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import UnitSprite from '../UnitSprite';
import { CARDS } from '../../constants/gameData';
import styles from '../../styles/gameStyles';

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

export default ChestOpeningModal;
