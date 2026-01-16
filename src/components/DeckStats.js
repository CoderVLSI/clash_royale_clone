import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const DeckStats = ({ cards = [] }) => {
  const avgElixir = (cards.reduce((sum, c) => sum + (c?.cost || 0), 0) / (cards.length || 1)).toFixed(1);
  return (
    <View style={styles.deckStatsContainer}>
      <View style={styles.deckStatItem}>
        <Text style={styles.deckStatLabel}>Avg. Elixir</Text>
        <Text style={[styles.deckStatValue, { color: '#E74C3C' }]}>{avgElixir}</Text>
      </View>
      <View style={styles.deckStatDivider} />
      <View style={styles.deckStatItem}>
        <Text style={styles.deckStatLabel}>Tower Troop</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UnitSprite id="princess" isOpponent={false} size={20} />
          <Text style={styles.deckStatValue}>Princess</Text>
        </View>
      </View>
    </View>
  );
};

// Optimized Collection Card Component

export default DeckStats;
