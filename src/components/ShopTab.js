import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CARDS from '../cards/cardDefinitions';
import MiniCard from './MiniCard';
const ShopTab = () => {
  const dailyDeals = [
    { id: 'knight', name: 'Knight', count: 50, cost: 500, currency: 'GOLD', rarity: 'common' },
    { id: 'musketeer', name: 'Musketeer', count: 20, cost: 1000, currency: 'GOLD', rarity: 'rare' },
    { id: 'baby_dragon', name: 'Baby Dragon', count: 2, cost: 2000, currency: 'GOLD', rarity: 'epic' },
    { id: 'archers', name: 'Archers', count: 50, cost: 0, currency: 'FREE', rarity: 'common' },
    { id: 'hog_rider', name: 'Hog Rider', count: 20, cost: 1000, currency: 'GOLD', rarity: 'rare' },
    { id: 'witch', name: 'Witch', count: 2, cost: 100, currency: 'GEM', rarity: 'epic' },
  ];

  return (
    <ScrollView style={styles.shopContainer} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Special Offer Banner */}
      <View style={styles.specialOfferBanner}>
        <LinearGradient colors={['#f39c12', '#e67e22']} style={styles.specialOfferGradient}>
          <View style={styles.offerContent}>
            <Text style={styles.offerTag}>BEST VALUE!</Text>
            <Text style={styles.offerTitle}>SUPER MAGICAL BUNDLE</Text>
            <View style={styles.offerImageRow}>
              <Text style={{fontSize: 40}}>🎁</Text>
              <Text style={{fontSize: 40}}>💰</Text>
              <Text style={{fontSize: 40}}>💎</Text>
            </View>
            <TouchableOpacity style={styles.offerButton}>
              <Text style={styles.offerButtonText}>$9.99</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.shopSectionHeader}>
        <Text style={styles.shopSectionTitle}>DAILY DEALS</Text>
        <Text style={styles.shopSectionTimer}>4h 20m</Text>
      </View>

      <View style={styles.dealsGrid}>
        {dailyDeals.map((deal, index) => (
          <View key={index} style={styles.dealCard}>
            <View style={[styles.dealRarityBar, {backgroundColor: RARITY_COLORS[deal.rarity]}]} />
            <Text style={styles.dealHeader}>{deal.currency === 'FREE' ? 'FREE' : 'x' + deal.count}</Text>
            <View style={styles.dealImageContainer}>
              <UnitSprite id={deal.id} size={45} />
            </View>
            <Text style={styles.dealName}>{deal.name}</Text>
            <TouchableOpacity style={[styles.buyButton, deal.currency === 'FREE' && styles.buyButtonFree]}>
              <Text style={styles.buyButtonText}>
                {deal.currency === 'FREE' ? 'CLAIM' : deal.cost} {deal.currency === 'GOLD' ? '💰' : deal.currency === 'GEM' ? '💎' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.shopSectionHeader}>
        <Text style={styles.shopSectionTitle}>CHESTS</Text>
      </View>
      <View style={styles.chestShopRow}>
        <TouchableOpacity style={styles.shopChestCard}>
          <Text style={{fontSize: 40}}>🥈</Text>
          <Text style={styles.shopChestName}>Silver Chest</Text>
          <View style={styles.shopChestPrice}><Text style={styles.shopChestPriceText}>50 💎</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shopChestCard}>
          <Text style={{fontSize: 40}}>🥇</Text>
          <Text style={styles.shopChestName}>Gold Chest</Text>
          <View style={styles.shopChestPrice}><Text style={styles.shopChestPriceText}>150 💎</Text></View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};


export default ShopTab;
