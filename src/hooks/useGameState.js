import { useState, useRef, useEffect } from 'react';
import { Dimensions } from 'react-native';
import io from 'socket.io-client';
import { CARDS, KING_RANGE, TOWER_RANGE } from '../constants/gameData';

const { width, height } = Dimensions.get('window');

// Helper to construct decks
const getDeckByIds = (ids) => ids.map(id => CARDS.find(c => c.id === id)).filter(Boolean);

const useGameState = () => {
    const [inGame, setInGame] = useState(false);
    const [inLobby, setInLobby] = useState(false);
    const [openingChest, setOpeningChest] = useState(null);
    const [friendlyModalVisible, setFriendlyModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState(2);
    const [gameOver, setGameOver] = useState(null);
    const [timeLeft, setTimeLeft] = useState(180);
    const [score, setScore] = useState([0, 0]);
    const [isDoubleElixir, setIsDoubleElixir] = useState(false);
    const [showDoubleElixirAlert, setShowDoubleElixirAlert] = useState(false);
    const [isOvertime, setIsOvertime] = useState(false);
    const [showOvertimeAlert, setShowOvertimeAlert] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    // Refs for Game Loop access
    const doubleElixirTriggeredRef = useRef(false);
    const overtimeStartedRef = useRef(false);
    const socketRef = useRef(null);

    // Decks State
    const [allDecks, setAllDecks] = useState([
        getDeckByIds(['mother_witch', 'elixir_golem', 'ice_golem', 'ice_spirit', 'skeletons', 'fireball', 'zap', 'hog_rider']), // Test Deck
        getDeckByIds(['goblin_barrel', 'princess', 'knight', 'dart_goblin', 'inferno_tower', 'rocket', 'arrows', 'skeletons']), // Log Bait
        getDeckByIds(['pekka', 'bandit', 'battle_ram', 'electro_wizard', 'magic_archer', 'zap', 'poison', 'royal_ghost']), // Pekka Bridge Spam
        getDeckByIds(['golem', 'night_witch', 'baby_dragon', 'mega_minion', 'lightning', 'zap', 'elite_barbarians', 'mini_pekka']), // Golem Beatdown
        getDeckByIds(['giant', 'prince', 'archers', 'spear_goblins', 'fireball', 'zap', 'minions', 'valkyrie']) // Classic Giant
    ]);
    const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);

    // Force update Test Deck if Mother Witch is missing (handles HMR/Persistence issues)
    useEffect(() => {
        if (!allDecks[0] || !allDecks[0].some(c => c.id === 'mother_witch')) {
            setAllDecks(prev => {
                const newDecks = [...prev];
                newDecks[0] = getDeckByIds(['mother_witch', 'elixir_golem', 'ice_golem', 'ice_spirit', 'skeletons', 'fireball', 'zap', 'hog_rider']);
                return newDecks;
            });
        }
    }, []);

    const userCards = allDecks[selectedDeckIndex];

    // Card & Elixir State
    const [elixir, setElixir] = useState(5);
    const [hand, setHand] = useState([]); // Initialized in resetGame
    const [nextCard, setNextCard] = useState(null);
    const [deckQueue, setDeckQueue] = useState([]);

    // Dragging State
    const [draggingCard, setDraggingCard] = useState(null);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [globalDraggingCard, setGlobalDraggingCard] = useState(null);
    const [globalDragPosition, setGlobalDragPosition] = useState({ x: 0, y: 0 });
    const [screenShake, setScreenShake] = useState(null);

    // Enemy State
    const [enemyElixir, setEnemyElixir] = useState(5);
    const [enemyHand, setEnemyHand] = useState([]);
    const [enemyNextCard, setEnemyNextCard] = useState(null);
    const [enemyDeckQueue, setEnemyDeckQueue] = useState([]);
    const [enemyDeckIndex, setEnemyDeckIndex] = useState(4);

    // Game Entities
    const [towers, setTowers] = useState([]);
    const [units, setUnits] = useState([]);
    const [projectiles, setProjectiles] = useState([]);
    const [visualEffects, setVisualEffects] = useState([]);
    const [lastPlayedCard, setLastPlayedCard] = useState(null);
    const [enemyLastPlayedCard, setEnemyLastPlayedCard] = useState(null);

    // Refs for Loop
    const towersRef = useRef(towers);
    const unitsRef = useRef(units);
    const projectilesRef = useRef(projectiles);
    const enemyElixirRef = useRef(enemyElixir);
    const enemyHandRef = useRef(enemyHand);
    const enemyNextCardRef = useRef(enemyNextCard);
    const enemyDeckQueueRef = useRef(enemyDeckQueue);
    const lastPlayedCardRef = useRef(lastPlayedCard);
    const enemyLastPlayedCardRef = useRef(enemyLastPlayedCard);
    const scoreRef = useRef(score);

    // Sync Refs
    useEffect(() => { towersRef.current = towers; }, [towers]);
    useEffect(() => { unitsRef.current = units; }, [units]);
    useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { enemyElixirRef.current = enemyElixir; }, [enemyElixir]);
    useEffect(() => { enemyHandRef.current = enemyHand; }, [enemyHand]);
    useEffect(() => { enemyNextCardRef.current = enemyNextCard; }, [enemyNextCard]);
    useEffect(() => { enemyDeckQueueRef.current = enemyDeckQueue; }, [enemyDeckQueue]);
    useEffect(() => { lastPlayedCardRef.current = lastPlayedCard; }, [lastPlayedCard]);
    useEffect(() => { enemyLastPlayedCardRef.current = enemyLastPlayedCard; }, [enemyLastPlayedCard]);

    const resetGame = (destination = 'game') => {
        setElixir(5);
        setScore([0, 0]);
        setIsDoubleElixir(false);
        setShowDoubleElixirAlert(false);
        setIsOvertime(false);
        setShowOvertimeAlert(false);
        doubleElixirTriggeredRef.current = false;
        overtimeStartedRef.current = false;

        // Player Deck Randomization
        const currentDeck = userCards || allDecks[0];
        const shuffledPlayerDeck = [...currentDeck].sort(() => Math.random() - 0.5);
        setHand([shuffledPlayerDeck[0], shuffledPlayerDeck[1], shuffledPlayerDeck[2], shuffledPlayerDeck[3]]);
        setNextCard(shuffledPlayerDeck[4]);
        setDeckQueue([shuffledPlayerDeck[5], shuffledPlayerDeck[6], shuffledPlayerDeck[7]]);

        // Enemy AI Deck Randomization
        setEnemyElixir(5);
        const randomEnemyDeckIndex = Math.floor(Math.random() * allDecks.length);
        setEnemyDeckIndex(randomEnemyDeckIndex);
        const enemyDeck = allDecks[randomEnemyDeckIndex];
        const shuffledEnemyDeck = [...enemyDeck].sort(() => Math.random() - 0.5);
        setEnemyHand([shuffledEnemyDeck[0], shuffledEnemyDeck[1], shuffledEnemyDeck[2], shuffledEnemyDeck[3]]);
        setEnemyNextCard(shuffledEnemyDeck[4]);
        setEnemyDeckQueue([shuffledEnemyDeck[5], shuffledEnemyDeck[6], shuffledEnemyDeck[7]]);

        setUnits([]);
        setProjectiles([]);
        setTimeLeft(180);
        setGameOver(null);
        setTowers([
            { id: 0, type: 'king', isOpponent: true, hp: 4000, maxHp: 4000, x: width / 2, y: 80, range: KING_RANGE, lastShot: 0 },
            { id: 1, type: 'princess', isOpponent: true, hp: 2500, maxHp: 2500, x: 70, y: 150, range: TOWER_RANGE, lastShot: 0 },
            { id: 2, type: 'princess', isOpponent: true, hp: 2500, maxHp: 2500, x: width - 70, y: 150, range: TOWER_RANGE, lastShot: 0 },
            { id: 3, type: 'king', isOpponent: false, hp: 4000, maxHp: 4000, x: width / 2, y: height - 200, range: KING_RANGE, lastShot: 0 },
            { id: 4, type: 'princess', isOpponent: false, hp: 2500, maxHp: 2500, x: 70, y: height - 270, range: TOWER_RANGE, lastShot: 0 },
            { id: 5, type: 'princess', isOpponent: false, hp: 2500, maxHp: 2500, x: width - 70, y: height - 270, range: TOWER_RANGE, lastShot: 0 },
        ]);

        if (destination === 'lobby') {
            setInLobby(true);
            setInGame(false);
        } else {
            setInGame(true);
        }
    };

    const concedeGame = () => {
        setGameOver('LOSE');
    };

    const handleSwapCards = (source, toIndex) => {
        setAllDecks(prevDecks => {
            const newDecks = [...prevDecks];
            const currentDeck = [...newDecks[selectedDeckIndex]];
            if (typeof source === 'object' && source !== null) {
                currentDeck[toIndex] = source;
            } else if (typeof source === 'number') {
                if (source >= 8) {
                    currentDeck[toIndex] = CARDS[source];
                } else {
                    const temp = currentDeck[source];
                    currentDeck[source] = currentDeck[toIndex];
                    currentDeck[toIndex] = temp;
                }
            }
            newDecks[selectedDeckIndex] = currentDeck;
            return newDecks;
        });
    };

    const onGlobalDragStart = (card, x, y) => {
        setGlobalDraggingCard(card);
        setGlobalDragPosition({ x, y });
    };
    const onGlobalDragMove = (x, y) => {
        setGlobalDragPosition({ x, y });
    };
    const onGlobalDragEnd = () => {
        setGlobalDraggingCard(null);
    };

    // Socket Initialization
    useEffect(() => {
        socketRef.current = io("http://localhost:3000");
        socketRef.current.on("start_game", (data) => {
            setFriendlyModalVisible(false);
            resetGame();
            setInLobby(false);
            setInGame(true);
        });
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Initial load/reset (optional, mostly handled by lobby starting game)
    // But we need to ensure hand is populated if we start immediately or something.
    // However, App.js logic calls resetGame() when switching?
    // Actually in App.js resetGame is called on start.
    // For now we expose resetGame and let components call it.

    return {
        inGame, setInGame,
        inLobby, setInLobby,
        openingChest, setOpeningChest,
        friendlyModalVisible, setFriendlyModalVisible,
        activeTab, setActiveTab,
        gameOver, setGameOver,
        timeLeft, setTimeLeft,
        score, setScore,
        isDoubleElixir, setIsDoubleElixir,
        showDoubleElixirAlert, setShowDoubleElixirAlert,
        isOvertime, setIsOvertime,
        showOvertimeAlert, setShowOvertimeAlert,
        audioEnabled, setAudioEnabled,
        doubleElixirTriggeredRef, overtimeStartedRef, socketRef,
        allDecks, setAllDecks, selectedDeckIndex, setSelectedDeckIndex, userCards,
        elixir, setElixir,
        hand, setHand,
        nextCard, setNextCard,
        deckQueue, setDeckQueue,
        draggingCard, setDraggingCard,
        dragPosition, setDragPosition,
        globalDraggingCard, setGlobalDraggingCard,
        globalDragPosition, setGlobalDragPosition,
        screenShake, setScreenShake,
        enemyElixir, setEnemyElixir,
        enemyHand, setEnemyHand,
        enemyNextCard, setEnemyNextCard,
        enemyDeckQueue, setEnemyDeckQueue,
        enemyDeckIndex, setEnemyDeckIndex,
        towers, setTowers,
        units, setUnits,
        projectiles, setProjectiles,
        visualEffects, setVisualEffects,
        lastPlayedCard, setLastPlayedCard,
        enemyLastPlayedCard, setEnemyLastPlayedCard,
        towersRef, unitsRef, projectilesRef, enemyElixirRef, enemyHandRef, enemyNextCardRef, enemyDeckQueueRef, scoreRef, lastPlayedCardRef, enemyLastPlayedCardRef,
        resetGame, concedeGame, handleSwapCards, onGlobalDragStart, onGlobalDragMove, onGlobalDragEnd
    };
};

export default useGameState;
