import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const LobbyHeader = () => (
  <View style={styles.lobbyHeader}>
    <View style={styles.lobbyHeaderLeft}>
      <View style={styles.xpLevelContainer}>
        <Text style={styles.xpLevelText}>13</Text>
      </View>
      <View style={styles.playerIdentity}>
        <Text style={styles.lobbyPlayerName}>You</Text>
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBarFill} />
        </View>
      </View>
    </View>
    <View style={styles.lobbyHeaderRight}>
      <View style={styles.currencyContainer}>
        <Text style={styles.currencyIcon}>💰</Text>
        <Text style={styles.currencyText}>5420</Text>
      </View>
      <View style={styles.currencyContainer}>
        <Text style={styles.currencyIcon}>💎</Text>
        <Text style={styles.currencyText}>150</Text>
      </View>
    </View>
  </View>
);


export default LobbyHeader;
