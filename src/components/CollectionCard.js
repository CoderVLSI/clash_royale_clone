import React, { memo, useRef } from 'react';
import { View, Text, TouchableOpacity, PanResponder } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import UnitSprite from './UnitSprite';
import { RARITY_COLORS } from '../constants/gameData';
import styles from '../styles/gameStyles';

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

export default CollectionCard;
