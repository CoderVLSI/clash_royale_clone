import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { CARDS } from '../constants/gameData';

const { width, height } = Dimensions.get('window');

// Constants for game mechanics
const FIRE_RATE_KING = 1000;
const FIRE_RATE_PRINCESS = 800;
const PROJECTILE_SPEED_ARROW = 12;
const PROJECTILE_SPEED_CANNON = 8;

const useGameLoop = (gameState) => {
  const {
    inGame, gameOver, setInGame, setGameOver,
    timeLeft, setTimeLeft,
    score, setScore,
    isDoubleElixir, setIsDoubleElixir,
    showDoubleElixirAlert, setShowDoubleElixirAlert,
    isOvertime, setIsOvertime,
    showOvertimeAlert, setShowOvertimeAlert,
    isTowerDecay, setIsTowerDecay,
    showTowerDecayAlert, setShowTowerDecayAlert,
    doubleElixirTriggeredRef, overtimeStartedRef, towerDecayStartedRef,
    elixir, setElixir,
    enemyElixir, setEnemyElixir,
    enemyHand, setEnemyHand,
    towers, setTowers,
    units, setUnits,
    projectiles, setProjectiles,
    visualEffects, setVisualEffects,
    towersRef, unitsRef, projectilesRef, enemyElixirRef, enemyHandRef,
    enemyNextCardRef, enemyDeckQueueRef, scoreRef, lastPlayedCardRef, enemyLastPlayedCardRef,
    spawnCard, checkWinner,
    enemyDeckIndex
  } = gameState;

  // ========== TIMER useEffect ==========
  useEffect(() => {
    if (!inGame || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Check if game is tied when timer hits 0
          const currentTowers = towersRef.current || [];
          const playerTowersStanding = currentTowers.filter(t => !t.isOpponent && t.hp > 0).length;
          const opponentTowersStanding = currentTowers.filter(t => t.isOpponent && t.hp > 0).length;
          const playerTowersDestroyed = currentTowers.filter(t => !t.isOpponent && t.hp <= 0).length;
          const opponentTowersDestroyed = currentTowers.filter(t => t.isOpponent && t.hp <= 0).length;

          // If tied and no towers destroyed, and neither overtime nor tower decay started
          if (playerTowersStanding === opponentTowersStanding &&
              playerTowersDestroyed === 0 && opponentTowersDestroyed === 0 &&
              !overtimeStartedRef.current && !towerDecayStartedRef.current) {
            overtimeStartedRef.current = true;
            setIsOvertime(true);
            setShowOvertimeAlert(true);
            setTimeout(() => setShowOvertimeAlert(false), 3000);
            return 60; // 60 seconds of overtime
          }

          // If overtime just ended and still tied with no towers destroyed
          if (overtimeStartedRef.current && !towerDecayStartedRef.current &&
              playerTowersStanding === opponentTowersStanding &&
              playerTowersDestroyed === opponentTowersDestroyed) {
            towerDecayStartedRef.current = true;
            setIsTowerDecay(true);
            setShowTowerDecayAlert(true);
            setTimeout(() => setShowTowerDecayAlert(false), 3000);
            return -1; // Negative time indicates tower decay phase
          }

          // Tower decay phase ended or game should end
          clearInterval(timer);
          checkWinner();
          return 0;
        }
        // Check for double elixir activation at 60 seconds (2 minutes into match)
        if (prev === 60 && !doubleElixirTriggeredRef.current && !overtimeStartedRef.current) {
          doubleElixirTriggeredRef.current = true;
          setIsDoubleElixir(true);
          setShowDoubleElixirAlert(true);
          // Hide alert after 3 seconds
          setTimeout(() => setShowDoubleElixirAlert(false), 3000);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [inGame, gameOver]);

  // ========== MAIN GAME LOOP useEffect ==========
  // This is a placeholder - the full game loop is 3300+ lines and needs to be extracted
  // For now, returning an empty effect to prevent errors
  useEffect(() => {
    if (!inGame || gameOver) return;

    const loop = setInterval(() => {
      // TODO: Extract full game loop from App.js lines 8012-11328
      // This includes: unit movement, combat, projectiles, towers, splash damage, etc.
    }, 50);

    return () => clearInterval(loop);
  }, [inGame, gameOver]);

  // ========== ELIXIR GENERATION useEffect ==========
  useEffect(() => {
    if (!inGame || gameOver) return;
    const interval = setInterval(() => {
      setElixir(prev => Math.min(prev + (isDoubleElixir ? 0.07 : 0.035), 10));
    }, (isDoubleElixir ? 1400 : 2800));
    return () => clearInterval(interval);
  }, [inGame, gameOver, isDoubleElixir]);

  // ========== ENEMY ELIXIR GENERATION useEffect ==========
  useEffect(() => {
    if (!inGame || gameOver) return;
    const interval = setInterval(() => {
      setEnemyElixir(prev => Math.min(prev + (isDoubleElixir ? 0.07 : 0.035), 10));
    }, (isDoubleElixir ? 1400 : 2800));
    return () => clearInterval(interval);
  }, [inGame, gameOver, isDoubleElixir]);

  // ========== ENEMY AI useEffect ==========
  useEffect(() => {
    if (!inGame || gameOver) return;

    const aiInterval = setInterval(() => {
      const now = Date.now();
      const currentElixir = enemyElixirRef.current;
      const currentHand = enemyHandRef.current;

      // Simple AI: Play card when elixir is available
      if (currentElixir >= 3 && currentHand && currentHand.length > 0) {
        const cardToPlay = currentHand[0];
        if (cardToPlay && currentElixir >= cardToPlay.cost) {
          const targetX = Math.random() < 0.5 ? 70 : width - 70;
          const targetY = cardToPlay.hp > 1500 ? 50 : 120;
          spawnCard(cardToPlay, targetX, targetY, true);
        }
      }
    }, 1800);

    return () => clearInterval(aiInterval);
  }, [inGame, gameOver, enemyDeckIndex]);
};

export default useGameLoop;
