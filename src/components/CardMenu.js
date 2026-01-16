import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CARDS from '../cards/cardDefinitions';
const CardMenu = memo(({ card, onClose, onInfo, onSwap }) => {
  if (!card) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!card}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.cardMenuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.cardMenuContent}>
          {/* Card Preview */}
          <View style={styles.cardMenuPreview}>
            <UnitSprite id={card.id} isOpponent={false} size={60} />
            <View style={styles.cardMenuCostBadge}>
              <Text style={styles.cardMenuCostText}>{card.cost}</Text>
            </View>
            <Text style={styles.cardMenuName}>{card.name}</Text>
            <View style={styles.cardMenuRarityBadge}>
              <Text style={styles.cardMenuRarityText}>{card.rarity?.toUpperCase()}</Text>
            </View>
          </View>

          {/* Stats Preview */}
          <View style={styles.cardMenuStats}>
            {Boolean(card.hp) && <Text style={styles.cardMenuStat}>HP: {card.hp}</Text>}
            {Boolean(card.damage) && <Text style={styles.cardMenuStat}>DMG: {card.damage}</Text>}
            {Boolean(card.speed !== undefined && card.speed > 0) && <Text style={styles.cardMenuStat}>SPD: {card.speed}</Text>}
          </View>

          {/* Action Buttons */}
          <View style={styles.cardMenuButtons}>
            <TouchableOpacity
              style={[styles.cardMenuButton, styles.cardMenuButtonInfo]}
              onPress={() => onInfo(card)}
            >
              <Text style={styles.cardMenuButtonText}>📊 Info</Text>
            </TouchableOpacity>

            <Text style={styles.cardMenuOr}>OR</Text>

            <TouchableOpacity
              style={[styles.cardMenuButton, styles.cardMenuButtonSwap]}
              onPress={() => onSwap(card)}
            >
              <Text style={styles.cardMenuButtonText}>🔄 Swap</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cardMenuCancel}
            onPress={onClose}
          >
            <Text style={styles.cardMenuCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

// Deck slot selector - Memoized

export default CardMenu;
