import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CollectionCard from './CollectionCard';
const DeckSlotSelector = memo(({ visible, onClose, cards, onSwap }) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.cardMenuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.slotSelectorContent}>
          <Text style={styles.slotSelectorTitle}>Select slot to swap with {visible?.name || 'Card'}</Text>

          <View style={styles.slotSelectorDeck}>
            <View style={styles.slotSelectorSlotRow}>
              {(cards || []).slice(0, 4).map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.slotSelectorSlot}
                  onPress={() => onSwap(index)}
                >
                  <UnitSprite id={card.id} isOpponent={false} size={45} />
                  <Text style={styles.slotSelectorSlotName}>{card.name || 'Card'}</Text>
                  <View style={styles.slotSelectorSlotCost}>
                    <Text style={styles.slotSelectorSlotCostText}>{card.cost || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.slotSelectorSlotRow}>
              {(cards || []).slice(4, 8).map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.slotSelectorSlot}
                  onPress={() => onSwap(index + 4)}
                >
                  <UnitSprite id={card.id} isOpponent={false} size={45} />
                  <Text style={styles.slotSelectorSlotName}>{card.name || 'Card'}</Text>
                  <View style={styles.slotSelectorSlotCost}>
                    <Text style={styles.slotSelectorSlotCostText}>{card.cost || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.slotSelectorCancel}
            onPress={onClose}
          >
            <Text style={styles.slotSelectorCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});


export default DeckSlotSelector;
