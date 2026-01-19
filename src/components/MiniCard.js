import React from 'react';
import { Text, View } from 'react-native';
import { Text } from 'react-native-svg';
import UnitSprite from './UnitSprite';
import { RARITY_COLORS } from '../utils/constants';

const MiniCard = ({
  card
}) => <View style={[styles.miniCard, {
  borderColor: RARITY_COLORS[card.rarity] || '#000'
}]}>
    <UnitSprite id={card.id} isOpponent={false} size={35} />
    <Text style={styles.miniCardName}>{card.name}</Text>
    <View style={styles.miniCardCost}>
      <Text style={styles.miniCardCostText}>{card.cost}</Text>
    </View>
  </View>;

export default MiniCard;