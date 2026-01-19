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
  const [isTowerDecay, setIsTowerDecay] = useState(false); // ADDED


  const [chests, setChests] = useState([
    { id: 'chest_0', slotIndex: 0, type: 'SUPER MAGICAL', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
    { id: 'chest_1', slotIndex: 1, type: 'GOLD', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
    { id: 'chest_2', slotIndex: 2, type: 'GIANT', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
    { id: 'chest_3', slotIndex: 3, type: 'MAGICAL', state: 'UNLOCKED', unlockTime: 0, timeLeft: 0 },
  ]);

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
    setIsTowerDecay(false);
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


  const spawnCard = (card, x, y, isOpponent = false) => {




    // Handle Mirror card - copy the last played card with +1 level

    let actualCard = card;

    let levelBoost = 0;

    if (card.id === 'mirror') {

      const lastCard = isOpponent ? enemyLastPlayedCardRef.current : lastPlayedCardRef.current;

      if (!lastCard) {


        return;

      }

      levelBoost = (lastCard.level || 11) + 1; // Tournament Standard 11 + 1

      actualCard = { ...lastCard };

      actualCard.cost = lastCard.cost + 1;

      actualCard.level = levelBoost;

      const levelBonus = 1 + (levelBoost - 11) * 0.1;

      actualCard.hp = Math.floor(lastCard.hp * levelBonus);

      actualCard.damage = Math.floor(lastCard.damage * levelBonus);

    }



    const setTargetElixir = isOpponent ? setEnemyElixir : setElixir;

    const setTargetHand = isOpponent ? setEnemyHand : setHand;

    const setTargetQueue = isOpponent ? setEnemyDeckQueue : setDeckQueue;

    const setTargetNext = isOpponent ? setEnemyNextCard : setNextCard;

    const nextCardToUse = isOpponent ? enemyNextCardRef.current : nextCard;



    setTargetElixir(currentElixir => {

      const costToUse = actualCard.cost;

      if (currentElixir < costToUse) return currentElixir;

      const newElixir = currentElixir - costToUse;



      if (actualCard.type === 'spell') {

        let spellType = 'fireball_spell';

        let spellSpeed = 15;

        let startX = width / 2;

        let startY = isOpponent ? 0 : height;



        if (actualCard.id === 'lightning') {

          spellType = 'lightning_bolt';

          spellSpeed = 100;

          const allTargets = [

            ...(unitsRef.current || []).filter(u => u.isOpponent !== isOpponent),

            ...(towersRef.current || []).filter(t => t.isOpponent !== isOpponent && t.hp > 0)

          ];

          const targetsInRange = allTargets.filter(t => {

            const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));

            return dist <= actualCard.radius;

          });

          const topTargets = targetsInRange.sort((a, b) => b.hp - a.hp).slice(0, 3);

          if (topTargets.length > 0) {

            const newProjectiles = topTargets.map((t, index) => ({

              id: Date.now() + index,

              x: t.x, y: t.y - 50, targetX: t.x, targetY: t.y,

              speed: 100, damage: actualCard.damage, type: 'lightning_bolt',

              isSpell: true, stun: 0.5, hit: true, spawnTime: Date.now(), isOpponent

            }));

            setProjectiles(prev => [...prev, ...newProjectiles]);

            setUnits(prev => prev.map(u => {

              if (topTargets.some(t => t.id === u.id)) {

                return { ...u, hp: u.hp - actualCard.damage, stunUntil: Date.now() + 500, wasStunned: true };

              }

              return u;

            }));

            setTowers(prev => prev.map(t => {

              if (topTargets.some(target => target.id === t.id)) {

                const towerDamage = Math.floor(actualCard.damage * 0.3);

                return { ...t, hp: t.hp - towerDamage };

              }

              return t;

            }));

          }

        } else if (actualCard.id === 'zap') {

          spellType = 'zap_spell';

          const zapRadius = actualCard.radius || 35;

          const zapDamage = actualCard.damage;

          const zapStun = (actualCard.stun || 0.5) * 1000;



          // Apply damage and stun immediately

          setUnits(prev => prev.map(u => {

            if (u.isOpponent !== isOpponent) {

              const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));

              if (dist <= zapRadius) {

                return { ...u, hp: u.hp - zapDamage, stunUntil: Date.now() + zapStun, wasStunned: true };

              }

            }

            return u;

          }));



          setTowers(prev => prev.map(t => {

            if (t.isOpponent !== isOpponent && t.hp > 0) {

              const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));

              if (dist <= zapRadius) {

                const towerDamage = Math.floor(zapDamage * 0.3);

                return { ...t, hp: t.hp - towerDamage, stunUntil: Date.now() + zapStun, wasStunned: true };

              }

            }

            return t;

          }));



          // Add visual effect

          setVisualEffects(prev => [...prev, {

            id: Date.now(),

            type: 'zap_aura',

            x, y,

            radius: zapRadius,

            startTime: Date.now(),

            duration: 500

          }]);



        } else if (actualCard.id === 'the_log') {

          spellType = 'the_log';

          // The Log starts WHERE you deploy it, then rolls FORWARD
          // Player (bottom): starts at deploy position, rolls UP (towards Y=0)
          // Opponent (top): starts at deploy position, rolls DOWN (towards Y=height)
          startX = x;
          startY = y;
          // Store the direction for damage calculation
          const logDirection = isOpponent ? 1 : -1; // 1 = down, -1 = up
          const logDistance = 150; // How far the log rolls

          // Calculate target position based on direction
          const targetY = y + (logDirection * logDistance);

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: startX, y: startY, targetX: x, targetY: targetY,

            speed: 15, damage: actualCard.damage, radius: actualCard.radius,

            type: spellType, isSpell: true, stun: actualCard.stun || 0,

            duration: actualCard.duration || 0, hit: false, spawnTime: Date.now(),

            isOpponent,

            knockback: actualCard.knockback || 0,

            splash: false, // Not splash, uses rectangular path damage

            isLog: true, // Special flag for log damage

            logStartY: startY,
            logEndY: targetY,

            y: startY

          }]);

        } else if (actualCard.id === 'poison') {

          spellType = 'poison_spell';

          spellSpeed = 100;

          startX = x; startY = y;

        } else if (actualCard.id === 'rocket') {

          spellType = 'rocket_spell';

          startY = isOpponent ? 0 : height;

          spellSpeed = 12;

        } else if (actualCard.id === 'goblin_barrel') {

          spellType = 'goblin_barrel_spell';

          spellSpeed = 25;

          startX = x; startY = isOpponent ? 0 : 0;

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: startX, y: startY, targetX: x, targetY: y,

            speed: spellSpeed, damage: 0, radius: actualCard.radius,

            type: spellType, isSpell: true, hit: false, spawnTime: Date.now(),

            isGoblinBarrel: true, spawns: actualCard.spawns, spawnCount: actualCard.spawnCount || 3, isOpponent

          }]);

        } else if (actualCard.id === 'earthquake') {

          spellType = 'earthquake_spell';

          spellSpeed = 100;

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: x, y: y, targetX: x, targetY: y,

            speed: spellSpeed, damage: actualCard.damage, radius: actualCard.radius,

            type: spellType, isSpell: true, stun: actualCard.stun || 0,

            duration: actualCard.duration || 0, hit: true, spawnTime: Date.now(),

            slow: actualCard.slow, isOpponent

          }]);

          setScreenShake({ intensity: 1.0, duration: 500 });

        } else if (actualCard.id === 'graveyard') {

          spellType = 'graveyard_spell';

          spellSpeed = 100;

          setUnits(prev => [...prev, {

            id: 'graveyard_' + Date.now(), x: x, y: y, hp: 9999, maxHp: 9999,

            isOpponent, speed: 0, lane: x < width / 2 ? 'LEFT' : 'RIGHT',

            lastAttack: 0, spriteId: 'graveyard_zone', type: 'graveyard_zone',

            range: 0, damage: 0, attackSpeed: 0, spawns: actualCard.spawns,

            spawnRate: 0.5, spawnCount: 1, lastSpawn: Date.now(), lifetimeDuration: 10,

            spawnTime: Date.now(), totalToSpawn: 20, spawnedSoFar: 0, isZone: true, radius: actualCard.radius

          }]);

        } else if (actualCard.id === 'clone') {

          // Clone spell - duplicate all units in radius
          const cloneRadius = actualCard.radius || 35;

          setUnits(prevUnits => {
            const newClones = prevUnits.filter(unit => {
              const dx = unit.x - x;
              const dy = unit.y - y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance <= cloneRadius && !unit.isOpponent && unit.type !== 'building';
            }).map(unit => ({
              ...unit,
              id: 'clone_' + Date.now() + '_' + Math.random(),
              x: unit.x + (Math.random() * 20 - 10),
              y: unit.y + (Math.random() * 20 - 10),
              hp: 1, // Clones have only 1 HP
              maxHp: 1,
              isClone: true,
              cloneEndTime: Date.now() + (actualCard.cloneDuration || 10) * 1000
            }));
            return [...prevUnits, ...newClones];
          });

          // Add visual effect
          setVisualEffects(prev => [...prev, {
            id: Date.now(),
            type: 'clone_spell',
            x, y,
            radius: cloneRadius,
            startTime: Date.now(),
            duration: 1000
          }]);

        } else if (actualCard.id === 'freeze') {
          // Freeze spell - freeze all enemies in radius for X seconds
          const freezeRadius = actualCard.radius || 50;
          const freezeDuration = (actualCard.freezeDuration || 4) * 1000;

          // Freeze all enemy units in radius
          setUnits(prev => prev.map(u => {
            if (u.isOpponent !== isOpponent) {
              const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));
              if (dist <= freezeRadius) {
                return { ...u, hp: u.hp - (actualCard.damage || 0), freezeUntil: Date.now() + freezeDuration };
              }
            }
            return u;
          }));

          // Freeze enemy towers in radius
          setTowers(prev => prev.map(t => {
            if (t.isOpponent !== isOpponent && t.hp > 0) {
              const dist = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));
              if (dist <= freezeRadius + 30) {
                const towerDamage = Math.floor((actualCard.damage || 0) * 0.3);
                return { ...t, hp: t.hp - towerDamage, freezeUntil: Date.now() + freezeDuration };
              }
            }
            return t;
          }));

          // Add visual effect
          setVisualEffects(prev => [...prev, {
            id: Date.now(),
            type: 'freeze_spell',
            x, y,
            radius: freezeRadius,
            startTime: Date.now(),
            duration: freezeDuration
          }]);

        } else if (actualCard.id === 'rage') {
          // Rage spell - boost allies' speed and attack in radius
          const rageRadius = actualCard.radius || 60;
          const rageDuration = (actualCard.rageDuration || 7) * 1000;
          const rageBoost = actualCard.rageBoost || 0.35;

          // Apply rage to all friendly units in radius
          setUnits(prev => prev.map(u => {
            if (u.isOpponent === isOpponent) {
              const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));
              if (dist <= rageRadius) {
                return { ...u, rageUntil: Date.now() + rageDuration, rageBoost: rageBoost };
              }
            }
            return u;
          }));

          // Add visual rage zone effect (persists for duration)
          setProjectiles(prev => [...prev, {
            id: Date.now(), x: x, y: y, targetX: x, targetY: y,
            speed: 0, damage: 0, radius: rageRadius,
            type: 'rage_zone', isSpell: true, hit: true, spawnTime: Date.now(),
            isRage: true, duration: rageDuration / 1000, isOpponent, rageBoost: rageBoost
          }]);

          // NOTE: Snowball travels as projectile - damage handled in projectile hit code
          // No instant handler needed here

        } else if (actualCard.id === 'tornado') {
          // Tornado spell - pull enemies toward center
          const tornadoRadius = actualCard.radius || 60;
          const pullStrength = actualCard.pullStrength || 100;

          // Create tornado zone that persists and pulls enemies
          setProjectiles(prev => [...prev, {
            id: Date.now(), x: x, y: y, targetX: x, targetY: y,
            speed: 0, damage: actualCard.damage || 0, radius: tornadoRadius,
            type: 'tornado_zone', isSpell: true, hit: true, spawnTime: Date.now(),
            isTornado: true, duration: actualCard.duration || 1, isOpponent, pullStrength: pullStrength
          }]);

        } else if (actualCard.id === 'barb_barrel') {
          // Barb Barrel - rolls forward like The Log, spawns barbarian at end
          spellType = 'barb_barrel';

          // Same pattern as The Log but shorter distance and no knockback
          startX = x;
          startY = y;
          const logDirection = isOpponent ? 1 : -1; // 1 = down, -1 = up
          const rollDistance = 100; // Shorter than log's 150

          const targetY = y + (logDirection * rollDistance);

          setProjectiles(prev => [...prev, {
            id: Date.now(), x: startX, y: startY, targetX: x, targetY: targetY,
            speed: 12, damage: actualCard.damage, radius: actualCard.radius,
            type: 'barb_barrel', isSpell: true, stun: 0,
            duration: 0, hit: false, spawnTime: Date.now(),
            isOpponent,
            knockback: 0, // No knockback unlike The Log
            splash: false,
            isLog: true, // Use same damage processing as Log
            isBarrel: true, // Flag to spawn barbarian at end
            logStartY: startY,
            logEndY: targetY,
            spawns: 'barbarian_single',
            y: startY
          }]);

        } else if (actualCard.id === 'royal_delivery') {
          // Royal Delivery - Delayed falling box from King Tower
          const spawnDelay = actualCard.spawnDelay || 3000;

          // Start from King Tower
          const startX = width / 2;
          const startY = isOpponent ? 60 : height - 60;

          // Create projectile launching from King Tower
          setProjectiles(prev => [...prev, {
            id: Date.now(),
            x: startX,
            y: startY,
            startX: startX,
            startY: startY,
            targetX: x,
            targetY: y,
            speed: 0, // Custom movement logic
            damage: actualCard.damage,
            radius: actualCard.radius || 45,
            type: 'royal_delivery_box', isSpell: true,
            duration: spawnDelay / 1000,
            hit: false, spawnTime: Date.now(), isOpponent,
            isDelivery: true,
            spawns: 'royal_recruit_single',
            knockback: 15
          }]);

        }



        const isPoison = actualCard.id === 'poison';

        if (actualCard.id !== 'lightning' && actualCard.id !== 'goblin_barrel' && actualCard.id !== 'graveyard' && actualCard.id !== 'earthquake' && actualCard.id !== 'zap' && actualCard.id !== 'clone' && actualCard.id !== 'freeze' && actualCard.id !== 'rage' && actualCard.id !== 'tornado' && actualCard.id !== 'barb_barrel' && actualCard.id !== 'royal_delivery') {

          setProjectiles(prev => [...prev, {

            id: Date.now(), x: startX, y: startY, targetX: x, targetY: y,

            speed: spellSpeed, damage: actualCard.damage, radius: actualCard.radius,

            type: spellType, isSpell: true, stun: actualCard.stun || 0,

            duration: actualCard.duration || 0, hit: isPoison, spawnTime: Date.now(),

            isPoison, isOpponent,

            knockback: actualCard.knockback || 0,

            splash: actualCard.id === 'fireball' || actualCard.id === 'the_log', // These spells do splash damage

            y: startY // Store starting Y for knockback calculation

          }]);

        }

      } else {

        const lane = x < width / 2 ? 'LEFT' : 'RIGHT';

        const count = actualCard.count || 1;

        const newUnits = [];

        for (let i = 0; i < count; i++) {

          let offsetX = count > 1 ? (Math.random() * 20 - 10) : 0;

          let offsetY = count > 1 ? (Math.random() * 20 - 10) : 0;

          // Royal Recruits - spread across the player's area horizontally
          if (actualCard.splitSpawn && count > 1) {
            // Spread horizontally across the player's side
            // 7 recruits spread from left to right
            const spreadWidth = 120; // Total spread width
            const horizontalPos = (i / (count - 1)) * spreadWidth - (spreadWidth / 2);
            offsetX = horizontalPos;
            // Small vertical offset for variety
            offsetY = (Math.random() * 40 - 20);
          }

          let unitLane = lane;

          let spawnX = x + offsetX;

          let spawnY = y + offsetY;

          // LANE CENTERING: Pull spawn position towards center of lane
          const laneCenter = lane === 'LEFT' ? 95 : width - 95;
          const distFromCenter = spawnX - laneCenter;
          spawnX -= distFromCenter * 0.3; // Pull 30% towards center

          // MINER: Starts at player's side, travels underground to deployment position
          let targetX = x + offsetX;
          let targetY = y + offsetY;

          if (actualCard.id === 'miner') {
            // Miner starts from behind player's towers
            spawnY = isOpponent ? height * 0.1 : height * 0.9; // Behind player's towers
            // Keep X in the same lane as deployment
            spawnX = x;
          }

          // GOBLIN DRILL: Burrows from player's side to target building like Miner
          if (actualCard.id === 'goblin_drill') {
            // Goblin Drill starts from behind player's towers (like Miner)
            spawnY = isOpponent ? height * 0.1 : height * 0.9; // Behind player's towers
            spawnX = x; // Keep X in the same lane as deployment
          }

          if (actualCard.id === 'three_musketeers' && count === 3) {

            if (i < 2) unitLane = lane;

            else {

              unitLane = lane === 'LEFT' ? 'RIGHT' : 'LEFT';

              spawnX = unitLane === 'LEFT' ? 70 + offsetX : width - 70 + offsetX;

            }

          }

          newUnits.push({

            id: Date.now() + i + (isOpponent ? 10000 : 0),

            x: spawnX, y: spawnY, hp: actualCard.hp, maxHp: actualCard.hp,

            isOpponent, speed: actualCard.speed, lane: unitLane,

            lastAttack: 0, spriteId: actualCard.id, type: actualCard.type,

            range: actualCard.range, damage: actualCard.damage,

            attackSpeed: actualCard.attackSpeed, projectile: actualCard.projectile,

            targetType: actualCard.targetType,

            charge: actualCard.charge ? { active: false, distance: 0, threshold: 2 } : undefined,

            chargeState: actualCard.chargeTime ? { startTime: Date.now(), duration: actualCard.chargeTime, isCharged: false } : undefined,

            hidden: actualCard.hidden ? { active: true, visibleHp: actualCard.hp } : undefined,

            burrowing: actualCard.burrows ? { active: true, startTime: Date.now(), targetX, targetY } : undefined,

            deployAnywhere: actualCard.deployAnywhere || false,

            splash: actualCard.splash || false,

            frontalSplash: actualCard.frontalSplash || false,

            spawnDamage: actualCard.spawnDamage || undefined,

            spawns: actualCard.spawns || undefined,

            spawnRate: actualCard.spawnRate || undefined,

            spawnCount: actualCard.spawnCount || undefined,

            deathSpawnCount: actualCard.deathSpawnCount || undefined,

            deathSpawns: actualCard.deathSpawns || undefined,

            lastSpawn: actualCard.spawnRate ? Date.now() : 0,

            lifetimeDuration: actualCard.lifetime || undefined,

            spawnTime: Date.now(),

            spawnDelay: actualCard.spawnDelay || 0,

            jumps: actualCard.jumps || false,

            slow: actualCard.slow || 0,

            slowUntil: 0, stunUntil: 0, baseDamage: actualCard.damage,

            lockedTarget: null, wasPushed: false, wasStunned: false,

            kamikaze: actualCard.kamikaze || false,

            chain: actualCard.chain || 0,

            healsOnAttack: actualCard.healsOnAttack || 0,

            healRadius: actualCard.healRadius || 0,

            passiveHeal: actualCard.passiveHeal || 0,

            deathRage: actualCard.deathRage || false,

            generatesElixir: actualCard.generatesElixir || false,

            elixirGenerationTime: 0,

            hasShield: actualCard.hasShield || false,

            currentShieldHp: actualCard.shieldHp || 0,

            shieldHp: actualCard.shieldHp || 0,

            deathDamage: actualCard.deathDamage || 0,

            deathRadius: actualCard.deathRadius || 0,

            deathSlow: actualCard.deathSlow || 0,

            dashInvincible: actualCard.dashInvincible || false,

            dashRange: actualCard.dashRange || 80,

            recoil: actualCard.recoil || 0,

            stopsToAttack: actualCard.stopsToAttack || false,

            turnsToPig: actualCard.turnsToPig || false,

            extraProjectiles: actualCard.extraProjectiles || 0,

            isDashing: false, dashEndTime: 0,

            damageRamp: actualCard.damageRamp || false,

            currentDamageBonus: 0, lastDamageRampTime: Date.now(),

            lastTargetId: null, bombDrops: actualCard.bombDrops || false,

            lastBombDrop: Date.now(), shotgunSpread: actualCard.shotgunSpread || false,

            pierce: actualCard.pierce || false,

            givesOpponentElixir: actualCard.givesOpponentElixir || false,

            transformsToBuilding: actualCard.transformsToBuilding || false,

            spawnsExtra: actualCard.spawnsExtra || undefined,

            extraCount: actualCard.extraCount || 0,

            revivesAsEgg: actualCard.revivesAsEgg || false,

            eggHp: actualCard.eggHp || 0,

            eggDuration: actualCard.eggDuration || 3000,

            hatchTime: actualCard.hatchDuration ? Date.now() + actualCard.hatchDuration : undefined,

            hatchesInto: actualCard.hatchesInto || undefined

          });

        }

        if (actualCard.id === 'elixir_golem' || actualCard.deathSpawns) {
          console.log('[SPAWN]', actualCard.id, 'deathSpawns:', actualCard.deathSpawns, 'count:', actualCard.deathSpawnCount);
        }

        setUnits(prev => [...(prev || []), ...newUnits]);

        // Rascals - spawn girls instantly behind the boy
        if (actualCard.spawnsExtra && actualCard.extraCount > 0) {
          const extraCard = CARDS.find(c => c.id === actualCard.spawnsExtra);
          if (extraCard) {
            const extraUnits = [];
            // Girls spawn behind the boy (towards their own side)
            // Player's girls spawn below (positive Y offset), opponent's spawn above (negative Y offset)
            const behindOffset = isOpponent ? -30 : 30;

            for (let i = 0; i < actualCard.extraCount; i++) {
              // Spread girls horizontally behind the boy
              const horizontalOffset = (i === 0 ? -20 : 20); // Left girl and right girl
              extraUnits.push({
                id: 'rascal_girl_' + Date.now() + '_' + i,
                x: x + horizontalOffset,
                y: y + behindOffset,
                hp: extraCard.hp,
                maxHp: extraCard.hp,
                isOpponent: isOpponent,
                speed: extraCard.speed,
                lane: x < width / 2 ? 'LEFT' : 'RIGHT',
                lastAttack: 0,
                spriteId: extraCard.id,
                type: extraCard.type,
                range: extraCard.range,
                damage: extraCard.damage,
                attackSpeed: extraCard.attackSpeed,
                projectile: extraCard.projectile,
                spawnTime: Date.now() - 2000 // Already ready to attack
              });
            }
            setUnits(prev => [...(prev || []), ...extraUnits]);
          }
        }

        // Miner burrowing visual - dirt going into ground at spawn point (player's bridge)
        if (actualCard.id === 'miner') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'miner_burrow',
            x: spawnX,
            y: spawnY,
            radius: 50,
            startTime: Date.now(),
            duration: 1000
          }]);
        }

        // Goblin Drill burrowing visual - same as Miner
        if (actualCard.id === 'goblin_drill') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'miner_burrow',
            x: spawnX,
            y: spawnY,
            radius: 50,
            startTime: Date.now(),
            duration: 1000
          }]);
        }

        if (actualCard.id === 'electro_wizard' || actualCard.id === 'mega_knight') {

          const spawnZapRange = actualCard.id === 'mega_knight' ? 80 : 60;

          const spawnZapDamage = actualCard.spawnDamage || actualCard.damage;

          const stunDuration = actualCard.stun || (actualCard.id === 'mega_knight' ? 0 : 0.5);

          const knockbackForce = actualCard.id === 'mega_knight' ? 40 : 0;

          setUnits(prevUnits => prevUnits.map(u => {

            if (u.isOpponent === isOpponent) return u;

            const dist = Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2));

            if (dist <= spawnZapRange) {

              if (actualCard.id === 'electro_wizard') {

                setProjectiles(prevProjs => [...prevProjs, {

                  id: Date.now() + Math.random(), x, y, targetX: u.x, targetY: u.y,

                  speed: 50, damage: 0, type: 'electric_bolt', stun: stunDuration,

                  isSpell: true, hit: true, spawnZap: true, isOpponent

                }]);

              }

              let newX = u.x; let newY = u.y;

              if (knockbackForce > 0) {
                const angle = Math.atan2(u.y - y, u.x - x);
                let nX = u.x + Math.cos(angle) * knockbackForce;
                let nY = u.y + Math.sin(angle) * knockbackForce;

                // River collision during knockback
                const rY = height / 2;
                const distR = Math.abs(nY - rY);
                const bW = 60;
                const lBX = 95;
                const rBX = width - 95;
                const onB = (Math.abs(nX - lBX) < bW / 2) || (Math.abs(nX - rBX) < bW / 2);

                const isFlyingOrJumping = u.jumps || u.type === 'flying';
                if (distR < 25 && !onB && !isFlyingOrJumping) {
                  nY = rY + (u.y < rY ? -25 : 25);
                }

                newX = Math.max(10, Math.min(width - 10, nX));
                newY = Math.max(10, Math.min(height - 10, nY));
              }

              return { ...u, x: newX, y: newY, hp: u.hp - spawnZapDamage, stunUntil: stunDuration > 0 ? Date.now() + (stunDuration * 1000) : u.stunUntil, wasStunned: stunDuration > 0, wasPushed: knockbackForce > 0 };

            }

            return u;

          }));

        }

      }



      if (!isOpponent) setLastPlayedCard(actualCard);

      else setEnemyLastPlayedCard(actualCard);



      setTargetHand(currentHand => {

        const newHand = [...currentHand];

        const cardIndex = newHand.findIndex(c => c.id === card.id);

        if (cardIndex !== -1) newHand.splice(cardIndex, 1);

        newHand.push(nextCardToUse);

        return newHand;

      });



      setTargetQueue(currentQueue => {

        const newQueue = [...currentQueue];

        const newNext = newQueue.shift();

        if (card.id !== 'mirror') newQueue.push(card);

        setTargetNext(newNext);

        return newQueue;

      });



      return newElixir;

    });

  };

  const spawnTestEnemy = () => {
    if (gameOver) return;
    const lane = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    const laneX = lane === 'LEFT' ? 70 : width - 70;

    const types = ['knight', 'giant', 'spear_goblins', 'archers', 'musketeer'];
    const type = types[Math.floor(Math.random() * types.length)];
    const stats = CARDS.find(c => c.id === type) || CARDS[0];

    const count = stats.count || 1;
    const newUnits = [];

    for (let i = 0; i < count; i++) {
      const offsetX = count > 1 ? (Math.random() * 40 - 20) : 0;
      const offsetY = count > 1 ? (Math.random() * 40 - 20) : 0;

      newUnits.push({
        id: Date.now() + i,
        x: laneX + offsetX,
        y: 50 + offsetY,
        hp: stats.hp,
        maxHp: stats.hp,
        isOpponent: true,
        speed: stats.speed,
        lane: lane,
        lastAttack: 0,
        spriteId: type,
        range: stats.range,
        damage: stats.damage,
        attackSpeed: stats.attackSpeed,
        projectile: stats.projectile,
        targetType: stats.targetType,
        // Special properties
        charge: stats.charge ? { active: false, distance: 0, threshold: 4 } : undefined,
        hidden: stats.hidden ? { active: true, visibleHp: stats.hp } : undefined,
        splash: stats.splash || false,
        jumps: stats.jumps || false,  // Hog Rider can jump over river
        spawns: stats.spawns,
        spawnRate: stats.spawnRate,
        spawnCount: stats.spawnCount,
        deathSpawnCount: stats.deathSpawnCount,
        lastSpawn: stats.spawnRate ? Date.now() : 0,
        lifetimeDuration: stats.lifetime,  // Store lifetime duration in seconds
        spawnTime: Date.now(),  // Track when building was spawned for HP depreciation
        maxHp: stats.hp,  // Store initial max HP for depreciation calculation
        stunUntil: 0,
        baseDamage: stats.damage,
        lockedTarget: null,
        wasPushed: false,
        wasStunned: false
      });
    }
    setUnits(prev => [...(prev || []), ...newUnits]);
  };


  const handleFriendlyBattle = () => {
    setFriendlyModalVisible(true);
  };

  const startFriendlyMatch = () => {
    setFriendlyModalVisible(false);
    resetGame();
    setInLobby(false);
    setInGame(true);
    // In a real app, we would set a flag for friendly mode here
  };

  const checkWinner = () => {
    const playerTowers = towersRef.current.filter(t => !t.isOpponent && t.hp > 0).length;
    const opponentTowers = towersRef.current.filter(t => t.isOpponent && t.hp > 0).length;

    let result = 'DRAW';
    if (playerTowers > opponentTowers) result = 'VICTORY';
    else if (opponentTowers > playerTowers) result = 'DEFEAT';

    setGameOver(result);

    // Reward Chest on Victory
    if (result === 'VICTORY') {
      setChests(prev => {
        // Find first empty slot (0-3)
        const occupiedSlots = prev.map(c => c.slotIndex);
        let emptySlot = -1;
        for (let i = 0; i < 4; i++) {
          if (!occupiedSlots.includes(i)) {
            emptySlot = i;
            break;
          }
        }

        if (emptySlot !== -1) {
          const chestTypes = ['SILVER', 'SILVER', 'SILVER', 'GOLD', 'GIANT', 'MAGICAL'];
          const randomType = chestTypes[Math.floor(Math.random() * chestTypes.length)];
          let unlockTime = 3 * 60 * 60; // Silver default

          if (randomType === 'GOLD') unlockTime = 8 * 60 * 60;
          if (randomType === 'GIANT' || randomType === 'MAGICAL') unlockTime = 12 * 60 * 60;
          if (randomType === 'SUPER MAGICAL') unlockTime = 24 * 60 * 60;

          const newChest = {
            id: 'chest_' + Date.now(),
            slotIndex: emptySlot,
            type: randomType,
            state: 'LOCKED',
            unlockTime: unlockTime,
            timeLeft: 0
          };

          return [...prev, newChest];
        }
        return prev;
      });
    }
  };

  const handleDragStart = (card, gesture) => {
    setDraggingCard(card);
    setDragPosition({ x: gesture.x0, y: gesture.y0 });
  };

  const handleDragMove = (gesture) => {
    setDragPosition({ x: gesture.moveX, y: gesture.moveY });
  };

  const handleDragEnd = (gesture) => {
    if (gameOver) return;
    const dropX = gesture.moveX;
    const dropY = gesture.moveY;
    const card = draggingCard;


    setDraggingCard(null);

    if (!card) return;

    const footerHeight = 135;
    const gameAreaBottom = height - footerHeight;
    const riverY = height / 2;

    if (dropY < gameAreaBottom) {
      // Check if deployment is allowed based on tower status
      let canDeploy = false;

      if (card.type === 'spell') {
        // Spells can be deployed anywhere
        canDeploy = true;
      } else if (card.deployAnywhere) {
        // Miner can be deployed anywhere (even on enemy towers)
        canDeploy = true;
      } else {
        // For non-spells: check if opponent's princess tower on that side is destroyed
        const leftOpponentPrincess = towers.find(t => t.id === 1 && t.hp > 0);
        const rightOpponentPrincess = towers.find(t => t.id === 2 && t.hp > 0);

        const isLeftSide = dropX < width / 2;

        // Deployment tolerance - allow placing almost at the bridge
        // Standard river Y is height / 2.
        // We allow much higher (smaller Y) for better UX - can deploy near bridges
        let deploymentBoundary = riverY - 100; // Generous tolerance - almost touching bridge

        // Hog Rider (jumps) and Flying units can be deployed further forward (over river/bridge)
        if (card.id === 'hog_rider' || card.type === 'flying') {
          deploymentBoundary = riverY - 120;
        }

        // Allow deployment on own side (player's side)
        if (dropY > deploymentBoundary) {
          canDeploy = true;
        }
        // Allow deployment in enemy territory if that side's princess tower is destroyed
        // Can deploy anywhere in the enemy half (0 to riverY) when that side's tower is gone
        else if (isLeftSide && !leftOpponentPrincess) {
          // Left princess destroyed - can deploy anywhere on left side of enemy territory
          canDeploy = true;
        }
        else if (!isLeftSide && !rightOpponentPrincess) {
          // Right princess destroyed - can deploy anywhere on right side of enemy territory
          canDeploy = true;
        }
      }

      if (canDeploy) {
        spawnCard(card, dropX, dropY);
      } else {
      }
    } else {
    }
  };

  const handleUnlockChest = (chestToUnlock) => {
    // All chests are already unlocked in this version
    setChests(prev => prev.map(c => {
      if (c.id === chestToUnlock.id) {
        return { ...c, state: 'UNLOCKED', timeLeft: 0 };
      }
      return c;
    }));
  };

  const handleOpenChest = (chestToOpen) => {
    setOpeningChest(chestToOpen);
  };

  const handleCollectRewards = () => {
    if (openingChest) {
      // Remove chest from slot
      setChests(prev => prev.filter(c => c.id !== openingChest.id));
      setOpeningChest(null);
    }
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };


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
    chests, setChests,
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
    resetGame, concedeGame, handleSwapCards, onGlobalDragStart, onGlobalDragMove, onGlobalDragEnd,
    spawnCard, handleFriendlyBattle, startFriendlyMatch, checkWinner,
    handleDragStart, handleDragMove, handleDragEnd, handleUnlockChest, handleOpenChest, handleCollectRewards, formatTime
  };
};

export default useGameState;

