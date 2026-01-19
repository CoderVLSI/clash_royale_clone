import React, { useState, useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import UnitSprite from '../UnitSprite';
import CollectionCard from '../CollectionCard';
import { CARDS, RARITY_COLORS } from '../../constants/gameData';
import styles from '../../styles/gameStyles';

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

// Card menu component (popup) - Memoized
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

    const [searchQuery, setSearchQuery] = useState('');

    const filteredCards = useMemo(() => {
        return CARDS.filter(card => !card.isToken).filter(card => {
            if (filterRarity === 'all') return true;
            return card.rarity === filterRarity;
        }).filter(card => {
            // Filter by search query (search in card name)
            if (!searchQuery || searchQuery.trim() === '') return true;
            const query = searchQuery.toLowerCase().trim();
            return card.name.toLowerCase().includes(query);
        }).sort((a, b) => sortByElixir ? a.cost - b.cost : 0);
    }, [filterRarity, sortByElixir, searchQuery]);

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
                            <View key={card.id} ref={el => deckSlotRefs.current[i] = el} style={{ width: '23%', aspectRatio: 0.8 }}>
                                {card.rarity === 'legendary' ? (
                                    // Legendary hexagonal with rainbow border
                                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                                        {/* Rainbow hexagon border */}
                                        <Svg width="100%" height="100%" viewBox="0 0 100 80" style={{ position: 'absolute' }}>
                                            <Defs>
                                                <LinearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <Stop offset="0%" stopColor="#ff0000" stopColor="#ff0000" />
                                                    <Stop offset="20%" stopColor="#ff7f00" stopColor="#ff7f00" />
                                                    <Stop offset="40%" stopColor="#ffff00" stopColor="#ffff00" />
                                                    <Stop offset="60%" stopColor="#00ff00" stopColor="#00ff00" />
                                                    <Stop offset="80%" stopColor="#0000ff" stopColor="#0000ff" />
                                                    <Stop offset="100%" stopColor="#8b00ff" stopColor="#8b00ff" />
                                                </LinearGradient>
                                            </Defs>
                                            {/* Hexagon shape - more angular like Clash Royale */}
                                            <Polygon
                                                points="20,2 80,2 98,40 80,78 20,78 2,40"
                                                fill="white"
                                                stroke="url(#rainbowGrad)"
                                                strokeWidth="4"
                                            />
                                            {/* Inner glow */}
                                            <Polygon
                                                points="22,4 78,4 96,40 78,76 22,76 4,40"
                                                fill="rgba(139, 0, 255, 0.1)"
                                            />
                                        </Svg>
                                        {/* Card content */}
                                        <TouchableOpacity
                                            onPress={() => handleDeckCardTap(card)}
                                            style={{
                                                position: 'absolute',
                                                width: '100%',
                                                height: '100%',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <UnitSprite id={card.id} size={35} />
                                            <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    // Normal card
                                    <TouchableOpacity
                                        onPress={() => handleDeckCardTap(card)}
                                        style={[
                                            styles.deckCardCompact,
                                            { borderColor: RARITY_COLORS[card.rarity] },
                                            { width: '100%', height: '100%' }
                                        ]}
                                    >
                                        <UnitSprite id={card.id} size={35} />
                                        <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                    <View style={styles.cardRowCompact}>
                        {cards.slice(4, 8).map((card, i) => (
                            <View key={card.id} ref={el => deckSlotRefs.current[i + 4] = el} style={{ width: '23%', aspectRatio: 0.8 }}>
                                {card.rarity === 'legendary' ? (
                                    // Legendary hexagonal with rainbow border
                                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                                        {/* Rainbow hexagon border */}
                                        <Svg width="100%" height="100%" viewBox="0 0 100 80" style={{ position: 'absolute' }}>
                                            <Defs>
                                                <LinearGradient id="rainbowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <Stop offset="0%" stopColor="#ff0000" stopColor="#ff0000" />
                                                    <Stop offset="20%" stopColor="#ff7f00" stopColor="#ff7f00" />
                                                    <Stop offset="40%" stopColor="#ffff00" stopColor="#ffff00" />
                                                    <Stop offset="60%" stopColor="#00ff00" stopColor="#00ff00" />
                                                    <Stop offset="80%" stopColor="#0000ff" stopColor="#0000ff" />
                                                    <Stop offset="100%" stopColor="#8b00ff" stopColor="#8b00ff" />
                                                </LinearGradient>
                                            </Defs>
                                            {/* Hexagon shape */}
                                            <Polygon
                                                points="12,3 88,3 97,40 88,77 12,77 3,40"
                                                fill="white"
                                                stroke="url(#rainbowGrad2)"
                                                strokeWidth="4"
                                            />
                                            {/* Inner glow */}
                                            <Polygon
                                                points="15,6 85,6 94,40 85,74 15,74 6,40"
                                                fill="rgba(139, 0, 255, 0.1)"
                                            />
                                        </Svg>
                                        {/* Card content */}
                                        <TouchableOpacity
                                            onPress={() => handleDeckCardTap(card)}
                                            style={{
                                                position: 'absolute',
                                                width: '100%',
                                                height: '100%',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <UnitSprite id={card.id} size={35} />
                                            <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    // Normal card
                                    <TouchableOpacity
                                        onPress={() => handleDeckCardTap(card)}
                                        style={[
                                            styles.deckCardCompact,
                                            { borderColor: RARITY_COLORS[card.rarity] },
                                            { width: '100%', height: '100%' }
                                        ]}
                                    >
                                        <UnitSprite id={card.id} size={35} />
                                        <View style={styles.cardCostSmall}><Text style={styles.cardCostSmallText}>{card.cost}</Text></View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.deckFooterRow}>
                    <View style={styles.towerTroopSlot}>
                        <UnitSprite id="princess" size={25} />
                        <Text style={styles.towerTroopText}>Princess</Text>
                    </View>
                    <View style={styles.avgElixirContainer}>
                        <Text style={styles.avgElixirText}>Avg. Elixir: {(cards.reduce((s, c) => s + c.cost, 0) / 8).toFixed(1)}</Text>
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

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search cards..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity style={styles.searchClearButton} onPress={() => setSearchQuery('')}>
                        <Text style={styles.searchClearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
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
