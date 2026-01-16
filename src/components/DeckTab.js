import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CARDS from '../cards/cardDefinitions';
import CollectionCard from './CollectionCard';
import CardMenu from './CardMenu';
import DeckSlotSelector from './DeckSlotSelector';
import DeckStats from './DeckStats';
import MiniCard from './MiniCard';
const DeckTab = ({ cards = [], onSwapCards, dragHandlers, allDecks, selectedDeckIndex, setSelectedDeckIndex }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardMenuCard, setCardMenuCard] = useState(null);
  const [showSlotSelector, setShowSlotSelector] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterRarity, setFilterRarity] = useState('all');
  const [sortByElixir, setSortByElixir] = useState(false);

  const dropZones = useRef([]);
  const deckSlotRefs = useRef([]);
  const [localDraggingCard, setLocalDraggingCard] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const filteredCards = useMemo(() => {
    return CARDS.filter(card => !card.isToken).filter(card => {
      if (filterRarity === 'all') return true;
      return card.rarity === filterRarity;
    }).sort((a, b) => sortByElixir ? a.cost - b.cost : 0);
  }, [filterRarity, sortByElixir]);

  const handleCollectionCardTap = useCallback((card) => setCardMenuCard(card), []);
  const handleDeckCardTap = useCallback((card) => setSelectedCard(card), []);

  const handleCardInfo = useCallback((card) => {
    setCardMenuCard(null);
    setSelectedCard(card);
  }, []);

  const handleCardSwapRequest = useCallback((card) => {
    setCardMenuCard(null);
    setShowSlotSelector(card);
  }, []);

  const handleSwapFromMenu = useCallback((deckIndex) => {
    const sourceCard = showSlotSelector || cardMenuCard;
    if (sourceCard) {
      const fromIndex = cards.findIndex(c => c.id === sourceCard.id);
      if (fromIndex !== -1) {
        if (fromIndex !== deckIndex) onSwapCards(fromIndex, deckIndex);
      } else onSwapCards(sourceCard, deckIndex);
      setCardMenuCard(null);
      setShowSlotSelector(null);
    }
  }, [showSlotSelector, cardMenuCard, cards, onSwapCards]);

  const handleDragStart = useCallback((card, gesture, componentRef) => {
    setScrollEnabled(false);
    setLocalDraggingCard(card);
    componentRef.measure((x, y, width, height, pageX, pageY) => {
      if (dragHandlers?.start) dragHandlers.start(card, pageX, pageY);
      deckSlotRefs.current.forEach((ref, index) => {
        if (ref) ref.measure((x, y, width, height, pageX, pageY) => {
          dropZones.current[index] = { x: pageX, y: pageY, width, height, index };
        });
      });
    });
  }, [dragHandlers]);

  const handleDragEnd = useCallback((gesture) => {
    const target = dropZones.current.find(zone => 
      gesture.moveX >= zone.x && gesture.moveX <= zone.x + zone.width &&
      gesture.moveY >= zone.y && gesture.moveY <= zone.y + zone.height
    );
    if (target) {
      const fromIndex = cards.findIndex(c => c.id === localDraggingCard?.id);
      if (fromIndex !== -1 && fromIndex !== target.index) onSwapCards(fromIndex, target.index);
    }
    if (dragHandlers?.end) dragHandlers.end();
    setLocalDraggingCard(null);
    setScrollEnabled(true);
  }, [cards, localDraggingCard, onSwapCards, dragHandlers]);

  const renderCollectionCard = useCallback(({ item }) => (
    <View style={{ margin: 3 }}>
      <CollectionCard
        card={item}
        isInDeck={cards.some(c => c?.id === item.id)}
        isDragging={localDraggingCard?.id === item.id}
        onTap={handleCollectionCardTap}
        onDragStart={handleDragStart}
        onDragMove={(g) => dragHandlers?.move?.(g.moveX, g.moveY)}
        onDragEnd={handleDragEnd}
        globalDragHandlers={dragHandlers}
      />
    </View>
  ), [cards, localDraggingCard, handleCollectionCardTap, handleDragStart, handleDragEnd, dragHandlers]);

  return (
    <View style={styles.deckTabContainer}>
      {/* Header Deck Grid (Persistent) */}
      <View style={styles.deckGridContainer}>
        <View style={styles.deckHeaderRow}>
          <Text style={styles.deckTabTitle}>Battle Deck</Text>
          <View style={styles.deckSelectorMini}>
            {allDecks.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedDeckIndex(i)} style={[styles.deckDot, selectedDeckIndex === i && styles.deckDotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.deckCardGrid}>
          <View style={styles.cardRowCompact}>
            {cards.slice(0, 4).map((card, i) => (
              <TouchableOpacity key={card.id} ref={el => deckSlotRefs.current[i] = el} onPress={() => handleDeckCardTap(card)} style={[styles.deckCardCompact, {borderColor: RARITY_COLORS[card.rarity]}]}>
                <UnitSprite id={card.id} size={35} />
                <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.cardRowCompact}>
            {cards.slice(4, 8).map((card, i) => (
              <TouchableOpacity key={card.id} ref={el => deckSlotRefs.current[i+4] = el} onPress={() => handleDeckCardTap(card)} style={[styles.deckCardCompact, {borderColor: RARITY_COLORS[card.rarity]}]}>
                <UnitSprite id={card.id} size={35} />
                <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.deckFooterRow}>
          <View style={styles.towerTroopSlot}>
            <UnitSprite id="princess" size={25} />
            <Text style={styles.towerTroopText}>Princess</Text>
          </View>
          <View style={styles.avgElixirContainer}>
            <Text style={styles.avgElixirText}>Avg. Elixir: {(cards.reduce((s,c)=>s+c.cost,0)/8).toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Collection Section */}
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionTitle}>Collection</Text>
        <TouchableOpacity style={styles.filterButtonMini} onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterButtonText}>Sort By ▾</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCards}
        keyExtractor={item => item.id}
        numColumns={4}
        renderItem={renderCollectionCard}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />

      {/* Modals */}
      <CardMenu card={cardMenuCard} onClose={() => setCardMenuCard(null)} onInfo={handleCardInfo} onSwap={handleCardSwapRequest} />
      <DeckSlotSelector visible={showSlotSelector} onClose={() => setShowSlotSelector(null)} cards={cards} onSwap={handleSwapFromMenu} />
      <Modal animationType="fade" transparent visible={!!selectedCard} onRequestClose={() => setSelectedCard(null)}>
        <View style={styles.cardDetailModal}>
          <View style={[styles.cardDetailModalContent, { borderColor: RARITY_COLORS[selectedCard?.rarity] || '#F1C40F' }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCard(null)}><Text style={styles.closeButtonText}>✕</Text></TouchableOpacity>
            <View style={styles.cardDetailHeader}>
              <UnitSprite id={selectedCard?.id} size={80} />
              <Text style={styles.cardDetailNameBig}>{selectedCard?.name}</Text>
              <Text style={styles.cardDetailTypeBig}>{selectedCard?.rarity?.toUpperCase()} {selectedCard?.type?.toUpperCase()}</Text>
            </View>
            <View style={styles.cardDetailStatsBig}>
              {selectedCard?.hp && <View style={styles.statRow}><Text style={styles.statLabel}>HP</Text><Text style={styles.statValue}>{selectedCard.hp}</Text></View>}
              {selectedCard?.damage && <View style={styles.statRow}><Text style={styles.statLabel}>Damage</Text><Text style={styles.statValue}>{selectedCard.damage}</Text></View>}
              {selectedCard?.range && <View style={styles.statRow}><Text style={styles.statLabel}>Range</Text><Text style={styles.statValue}>{selectedCard.range}</Text></View>}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DeckTab;
