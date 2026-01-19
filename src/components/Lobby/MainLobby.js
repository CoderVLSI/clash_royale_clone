import React from 'react';
import { View, ImageBackground } from 'react-native';
import styles from '../../styles/gameStyles';

// Components
import LobbyHeader from './LobbyHeader';
import ShopTab from './ShopTab';
import DeckTab from './DeckTab';
import BattleTab from './BattleTab';
import SocialTab from './SocialTab';
import EventsTab from './EventsTab';
import BottomNavigation from './BottomNavigation';

const MainLobby = ({
    activeTab, onTabChange, onStartGame, currentDeck, onSwapCards,
    dragHandlers, selectedDeckIndex, setSelectedDeckIndex, allDecks,
    chests, onUnlockChest, onOpenChest
}) => {
    const renderTabContent = () => {
        switch (activeTab) {
            case 0: return <ShopTab />;
            case 1: return <DeckTab
                cards={currentDeck}
                onSwapCards={onSwapCards}
                dragHandlers={dragHandlers}
                selectedDeckIndex={selectedDeckIndex}
                setSelectedDeckIndex={setSelectedDeckIndex}
                allDecks={allDecks}
            />;
            case 2: return <BattleTab
                currentDeck={currentDeck}
                onStartBattle={onStartGame}
                chests={chests}
                onUnlockChest={onUnlockChest}
                onOpenChest={onOpenChest}
            />;
            case 3: return <SocialTab />;
            case 4: return <EventsTab />;
            default: return null;
        }
    };

    return (
        <ImageBackground source={require('../../assets/lobby-bg.jpg')} style={styles.lobbyContainer}>
            <View style={styles.lobbyOverlay}>
                <LobbyHeader />
                <View style={styles.tabContentArea}>
                    {renderTabContent()}
                </View>
                <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
            </View>
        </ImageBackground>
    );
};

export default MainLobby;
