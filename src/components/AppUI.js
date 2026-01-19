import React from 'react';
import { StyleSheet, View } from 'react-native';
import MainMenu from './MainMenu';
import MainLobby from './Lobby/MainLobby';
import GameBoard from './Game/GameBoard';
import ChestOpeningModal from './Modals/ChestOpeningModal';
import FriendlyBattleModal from './Modals/FriendlyBattleModal';
import styles from '../styles/gameStyles';

const AppUI = ({ gameState }) => {
    const {
        inGame, setInGame,
        inLobby, setInLobby,
        openingChest, setOpeningChest,
        friendlyModalVisible, setFriendlyModalVisible,
        activeTab, setActiveTab,
        gameOver,
        timeLeft,
        score,
        isDoubleElixir,
        showDoubleElixirAlert,
        isOvertime,
        showOvertimeAlert,
        audioEnabled, setAudioEnabled,
        chests,
        allDecks, setAllDecks, selectedDeckIndex, setSelectedDeckIndex, userCards,
        elixir,
        hand,
        nextCard,
        deckQueue,
        draggingCard,
        dragPosition,
        globalDraggingCard,
        globalDragPosition,
        screenShake, setScreenShake,
        enemyElixir,
        enemyHand,
        towers,
        units,
        projectiles,
        visualEffects, setVisualEffects,
        socketRef,

        resetGame, concedeGame, handleSwapCards,
        onGlobalDragStart, onGlobalDragMove, onGlobalDragEnd,
        handleDragStart, handleDragMove, handleDragEnd,
        handleUnlockChest, handleOpenChest, handleCollectRewards,
        onFriendlyBattle,
        startFriendlyMatch,
        checkWinner,
        formatTime,
        handleFriendlyBattle,
        spawnTestEnemy,
        isTowerDecay // Now available
    } = gameState;

    // Recreate handleStartBattle
    const onStartGame = () => {
        resetGame();
        setInLobby(false);
        setInGame(true);
    };

    // Render based on navigation state
    if (!inGame && !inLobby) {
        return <MainMenu onStart={() => setInLobby(true)} />;
    }

    if (!inGame && inLobby) {
        return (
            <>
                <MainLobby
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onStartGame={onStartGame}
                    currentDeck={userCards}
                    onSwapCards={handleSwapCards}
                    dragHandlers={{ start: onGlobalDragStart, move: onGlobalDragMove, end: onGlobalDragEnd }}
                    selectedDeckIndex={selectedDeckIndex}
                    setSelectedDeckIndex={setSelectedDeckIndex}
                    allDecks={allDecks}
                    chests={chests}
                    onUnlockChest={handleUnlockChest}
                    onOpenChest={handleOpenChest}
                    onFriendlyBattle={handleFriendlyBattle}
                />
                {openingChest && (
                    <ChestOpeningModal
                        chest={openingChest}
                        onClose={handleCollectRewards}
                    />
                )}
                <FriendlyBattleModal
                    visible={friendlyModalVisible}
                    onClose={() => setFriendlyModalVisible(false)}
                    socket={socketRef.current}
                />
            </>
        );
    }

    return (
        <GameBoard
            towers={towers}
            units={units}
            projectiles={projectiles}
            visualEffects={visualEffects}
            setVisualEffects={setVisualEffects}
            screenShake={screenShake}
            setScreenShake={setScreenShake}
            timeLeft={timeLeft}
            gameOver={gameOver}
            elixir={elixir}
            enemyElixir={enemyElixir}
            hand={hand}
            nextCard={nextCard}
            draggingCard={draggingCard}
            dragPosition={dragPosition}
            handleDragStart={handleDragStart}
            handleDragMove={handleDragMove}
            handleDragEnd={handleDragEnd}
            spawnTestEnemy={spawnTestEnemy}
            formatTime={formatTime}
            onRestart={(dest) => resetGame(dest)}
            score={score}
            isDoubleElixir={isDoubleElixir}
            showDoubleElixirAlert={showDoubleElixirAlert}
            isOvertime={isOvertime}
            showOvertimeAlert={showOvertimeAlert}
            isTowerDecay={isTowerDecay}
            audioEnabled={audioEnabled}
            setAudioEnabled={setAudioEnabled}
            onConcede={concedeGame}
            globalDraggingCard={globalDraggingCard}
            globalDragPosition={globalDragPosition}
        />
    );
};

export default AppUI;
