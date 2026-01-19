import React, { memo, useRef } from 'react';
import { View, Text, PanResponder } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { RARITY_COLORS } from '../constants/gameData';
import UnitSprite from './UnitSprite';
import ElixirDroplet from './ElixirDroplet';
import styles from '../styles/gameStyles';

const Card = memo(({ card, isNext, canAfford, onDragStart, onDragMove, onDragEnd, isDragging, lastPlayedCard }) => {
    // Use card or fallback to lastPlayedCard for rendering while animating out
    const cardToDisplay = card || lastPlayedCard;

    // If we have no card to display at all (and no lastPlayedCard), render invisible placeholder
    // But usually we should have something if we are not completely empty
    if (!cardToDisplay) {
        return <View style={[styles.card, styles.hiddenCard, { opacity: 0 }]} />;
    }

    const isMirror = cardToDisplay.id === 'mirror';

    // Calculate display cost
    let displayCost = cardToDisplay.cost;
    if (isMirror) {
        if (lastPlayedCard) {
            displayCost = lastPlayedCard.cost + 1;
        } else {
            displayCost = '?'; // Should be 1 more than last played, but if none allowed, ?
        }
    }

    // Refs for callbacks to avoid closure staleness in PanResponder
    const callbacksRef = useRef({ onDragStart, onDragMove, onDragEnd });
    callbacksRef.current = { onDragStart, onDragMove, onDragEnd };

    // Refs for props meant to be accessed inside PanResponder
    const isNextRef = useRef(isNext);
    const canAffordRef = useRef(canAfford);
    isNextRef.current = isNext;
    canAffordRef.current = canAfford;

    const componentRef = useRef(null);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !isNextRef.current && canAffordRef.current,
            onMoveShouldSetPanResponder: () => !isNextRef.current && canAffordRef.current,
            onPanResponderGrant: (evt, gestureState) => {
                const { onDragStart } = callbacksRef.current;
                if (!isNextRef.current && canAffordRef.current && onDragStart) {
                    // Measure the card position to pass to the drag handler for proxy positioning
                    if (componentRef.current) {
                        componentRef.current.measure((x, y, width, height, pageX, pageY) => {
                            onDragStart(cardToDisplay, gestureState, { x: pageX, y: pageY, width, height });
                        });
                    } else {
                        onDragStart(cardToDisplay, gestureState, null);
                    }
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                const { onDragMove } = callbacksRef.current;
                if (!isNextRef.current && canAffordRef.current && onDragMove) {
                    onDragMove(gestureState);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { onDragEnd } = callbacksRef.current;
                if (!isNextRef.current && canAffordRef.current && onDragEnd) {
                    onDragEnd(gestureState);
                }
            },
        })
    ).current;

    // Always attach panHandlers - we check canAfford inside the callbacks
    // This prevents the responder from being lost when elixir changes
    const handlers = !isNext ? panResponder.panHandlers : {};
    const isLegendary = cardToDisplay.rarity === 'legendary';

    return (
        <View
            ref={componentRef}
            style={[
                styles.card,
                !isLegendary && { borderColor: RARITY_COLORS[cardToDisplay.rarity] || '#000' },
                isLegendary && { backgroundColor: 'transparent', borderWidth: 0 },
                isNext && styles.nextCard,
                (!canAfford && !isNext) && styles.disabledCard,
                isDragging && styles.hiddenCard
            ]}
            {...handlers}
        >
            {isLegendary && (
                <Svg width={isNext ? "40" : "60"} height={isNext ? "50" : "75"} viewBox="0 0 60 75" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <Defs>
                        <LinearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
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
                        fill="#ecf0f1"
                        stroke="url(#rainbow)"
                        strokeWidth="3"
                    />
                </Svg>
            )}
            <View style={styles.cardContent}>
                <UnitSprite id={cardToDisplay.id} isOpponent={false} size={isNext ? 30 : 40} />
                <Text style={styles.cardName}>{cardToDisplay.name}</Text>
                {isMirror && (
                    <Text style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 14, fontWeight: 'bold', color: '#FFD700', textShadowColor: '#000', textShadowRadius: 2 }}>
                        +1
                    </Text>
                )}
            </View>

            <View style={{ position: 'absolute', top: -8, left: -8, zIndex: 10 }}>
                <ElixirDroplet size={24} value={displayCost} />
            </View>

            {isNext && <Text style={styles.nextLabel}>Next</Text>}
        </View>
    );
}, (prevProps, nextProps) => {
    // Custom comparison: return true (skip re-render) ONLY when canAfford is the same
    // If canAfford changed, return false to trigger re-render
    // Use optional chaining to handle undefined cards
    return prevProps.canAfford === nextProps.canAfford &&
        prevProps.isDragging === nextProps.isDragging &&
        prevProps.card?.id === nextProps.card?.id;
});

export default Card;
