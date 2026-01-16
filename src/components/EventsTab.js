import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const EventsTab = () => (
  <ScrollView style={styles.eventsContainer} contentContainerStyle={{ paddingBottom: 100 }}>
    <View style={styles.eventCard}>
      <LinearGradient colors={['#8e44ad', '#2c3e50']} style={styles.eventGradient}>
        <View style={styles.eventBadge}><Text style={styles.eventBadgeText}>CHALLENGE</Text></View>
        <Text style={styles.eventTitle}>MEGA KNIGHT CHALLENGE</Text>
        <Text style={styles.eventSubtitle}>Win to unlock the Mega Knight!</Text>
        <View style={styles.eventRewards}>
          <View style={styles.rewardItem}><Text>💰</Text><Text style={styles.rewardValue}>1000</Text></View>
          <View style={styles.rewardItem}><Text>🃏</Text><Text style={styles.rewardValue}>x10</Text></View>
          <View style={styles.rewardItem}><Text>✨</Text><Text style={styles.rewardValue}>Free</Text></View>
        </View>
        <TouchableOpacity style={styles.eventButton}>
          <Text style={styles.eventButtonText}>JOIN NOW</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>

    <View style={styles.eventCard}>
      <LinearGradient colors={['#2980b9', '#34495e']} style={styles.eventGradient}>
        <View style={styles.eventBadge}><Text style={styles.eventBadgeText}>TOURNAMENT</Text></View>
        <Text style={styles.eventTitle}>GLOBAL TOURNAMENT</Text>
        <Text style={styles.eventSubtitle}>Competing for the top spot!</Text>
        <View style={styles.eventStatsRow}>
          <Text style={styles.eventStat}>Wins: 0</Text>
          <Text style={styles.eventStat}>Losses: 0/3</Text>
        </View>
        <TouchableOpacity style={[styles.eventButton, {backgroundColor: '#3498db'}]}>
          <Text style={styles.eventButtonText}>ENTER</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </ScrollView>
);


export default EventsTab;
