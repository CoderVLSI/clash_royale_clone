import React, { memo } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { Svg, Circle, Rect, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import CARDS from '../cards/cardDefinitions';

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        console.log('[Card] Touch start on', card.name, 'canAfford:', canAffordRef.current, 'isNext:', isNextRef.current);
        return true;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const currentCanAfford = canAffordRef.current;
        const currentIsNext = isNextRef.current;
        console.log('[Card] PanResponderGrant -', card.name, 'canAfford:', currentCanAfford);
        const { onDragStart } = callbacksRef.current;
        if (!currentIsNext && currentCanAfford && onDragStart) {
          console.log('[Card] Calling onDragStart for', card.name);
          onDragStart(card, gestureState);
        } else {
          console.log('[Card] onDragStart blocked - isNext:', currentIsNext, 'canAfford:', currentCanAfford);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { onDragMove } = callbacksRef.current;
        if (!isNextRef.current && canAffordRef.current && onDragMove) {
          onDragMove(gestureState);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('[Card] PanResponderRelease -', card.name);
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
