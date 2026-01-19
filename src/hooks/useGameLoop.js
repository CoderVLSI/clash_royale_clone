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
  useEffect(() => {
    if (!inGame || gameOver) return;

    const loop = setInterval(() => {
      const now = Date.now();

      // Defensive check: ensure towersRef.current exists and is an array
      const currentTowers = towersRef.current || [];
      let nextTowers = [...currentTowers];

      const playerKing = nextTowers.find(t => !t.isOpponent && t.type === 'king');
      const opponentKing = nextTowers.find(t => t.isOpponent && t.type === 'king');

      if (playerKing && playerKing.hp <= 0) {
        setGameOver('DEFEAT');
        return;
      }
      if (opponentKing && opponentKing.hp <= 0) {
        setGameOver('VICTORY');
        return;
      }

      // Update Score
      const destroyedOpponentTowers = nextTowers.filter(t => t.isOpponent && t.hp <= 0).length;
      const destroyedPlayerTowers = nextTowers.filter(t => !t.isOpponent && t.hp <= 0).length;

      // OVERTIME SUDDEN DEATH: First tower destroyed wins
      if (overtimeStartedRef.current) {
        // Check if a tower was just destroyed this frame (score changed)
        const [prevOpponentDestroyed, prevPlayerDestroyed] = scoreRef.current || [0, 0];
        if (destroyedOpponentTowers > prevOpponentDestroyed) {
          setGameOver('VICTORY');
          return;
        }
        if (destroyedPlayerTowers > prevPlayerDestroyed) {
          setGameOver('DEFEAT');
          return;
        }
      }

      // Only set state if score changed (to avoid infinite loops) - though in this simple interval it might be fine,
      // best to be safe if we were using refs for score. But here we use functional state updates elsewhere.
      // Actually, we can just update it.
      setScore([destroyedOpponentTowers, destroyedPlayerTowers]);

      // TOWER DECAY PHASE: Towers lose HP automatically at same pace
      if (towerDecayStartedRef.current) {
        const TOWER_DECAY_RATE = 50; // HP lost per tick (adjust for balance)
        let towerDestroyedThisFrame = false;

        nextTowers = nextTowers.map(tower => {
          if (tower.hp > 0) {
            const newHp = Math.max(0, tower.hp - TOWER_DECAY_RATE);
            if (newHp === 0 && tower.hp > 0) {
              towerDestroyedThisFrame = true;
              // Tower destroyed - opponent wins
              if (tower.isOpponent) {
                setGameOver('VICTORY');
              } else {
                setGameOver('DEFEAT');
              }
            }
            return { ...tower, hp: newHp };
          }
          return tower;
        });

        if (towerDestroyedThisFrame) {
          setTowers(nextTowers);
          return; // Game over, exit loop
        }

        setTowers(nextTowers);
      }

      let nextProjectiles = [...projectilesRef.current];

      // Collect splash damage events to apply after unit updates
      let splashEvents = [];
      // Collect units to spawn (will be added at the end)
      let unitsToSpawn = [];
      let damageEvents = [];
      // Spirit card effects
      let healEvents = [];
      let chainEvents = [];

      let currentUnits = (unitsRef.current || []).map(u => {
        // Check if stunned
        const isCurrentlyStunned = u.stunUntil && now < u.stunUntil;
        const wasPreviouslyStunned = u.wasStunned || false;

        // Check if frozen
        const isCurrentlyFrozen = u.freezeUntil && now < u.freezeUntil;

        // If stun just ended, unlock target
        if (wasPreviouslyStunned && !isCurrentlyStunned) {
          u.lockedTarget = null;
          u.wasStunned = false;
        } else if (isCurrentlyStunned) {
          u.wasStunned = true;
          return u; // Can't move or attack while stunned
        }

        // If frozen, can't move or attack
        if (isCurrentlyFrozen) {
          return { ...u, isFrozen: true }; // Return but don't process movement/attacks
        } else if (u.isFrozen) {
          u.isFrozen = false; // Unfreeze when duration ends
        }

        // Check if raged - boost speed and attack
        const isRaged = u.rageUntil && now < u.rageUntil;
        const rageMultiplier = isRaged ? (1 + (u.rageBoost || 0.35)) : 1;
        u.currentRageMultiplier = rageMultiplier; // Store for attack speed calculation

        // Jump Attack Processing (Spirits)
        if (u.isJumpingAttack) {
          const jumpDuration = 300; // ms
          const progress = Math.min(1, (now - u.jumpStartTime) / jumpDuration);

          // Lerp position
          const newX = u.jumpStartX + (u.jumpTargetX - u.jumpStartX) * progress;
          const newY = u.jumpStartY + (u.jumpTargetY - u.jumpStartY) * progress;

          if (progress >= 1) {
            // Landed! Apply effects
            const target = (unitsRef.current || []).find(t => t.id === u.jumpTargetId) ||
              (nextTowers || []).find(t => t.id === u.jumpTargetId);

            // Even if target died, spirits often splash area. But let's assume we hit the location.
            const hitX = u.jumpTargetX;
            const hitY = u.jumpTargetY;
            const damage = u.damage;

            // Fire Spirit / Splash
            if (u.splash) {
              splashEvents.push({
                attacker: u,
                targetX: hitX,
                targetY: hitY,
                damage: damage,
                stun: u.stun || 0
              });
              // Visual - different for Ice Spirit vs Fire Spirit
              const visualType = u.spriteId === 'ice_spirit' ? 'ice_freeze' : 'fire_explosion';
              const visualRadius = u.spriteId === 'ice_spirit' ? 40 : 50;
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: visualType,
                x: hitX,
                y: hitY,
                radius: visualRadius,
                startTime: Date.now(),
                duration: 600
              }]);
            } else if (target) {
              // Single target damage if not splash (though most spirits are splash or special)
              // Ice Spirit is splash too? Actually Ice Spirit IS splash in CR.
              // My data says Ice Spirit splash: true. So handled above.
              // What about non-splash spirits? (None currently).
              // Just in case:
              if (target.id >= 100) { // Unit
                damageEvents.push({ targetId: target.id, damage: damage, attackerId: u.id });
              } else { // Tower
                // Modify tower directly in nextTowers? Can't do that easily here as we are iterating units.
                // We'll use damageEvents for units, but for towers we might need a separate queue or handle it in the tower loop.
                // Actually, existing damageEvents logic only handles units.
                // Let's add a `towerDamageEvents` or just apply it to `nextTowers` via a lookup later?
                // Easier: Add a special `projectile` style hit event that creates a "hit" that resolves immediately.
                // Or just find the tower in `nextTowers` index and update it.
                const tIndex = nextTowers.findIndex(t => t.id === target.id);
                if (tIndex !== -1) {
                  nextTowers[tIndex].hp -= damage;
                }
              }
            }

            // Ice Spirit Freeze (stun)
            if (u.stun && u.stun > 0) {
              // Apply to area if splash, or target
              const affectRadius = 50;
              const isIceSpirit = u.spriteId === 'ice_spirit';
              // Units
              currentUnits.forEach(unit => {
                if (unit.isOpponent !== u.isOpponent && unit.hp > 0) {
                  const dist = Math.sqrt(Math.pow(unit.x - hitX, 2) + Math.pow(unit.y - hitY, 2));
                  if (dist <= affectRadius) {
                    unit.stunUntil = now + (u.stun * 1000);
                    unit.wasStunned = true;
                    // Ice Spirit applies freeze visual (same as Freeze spell)
                    if (isIceSpirit) {
                      unit.freezeUntil = now + (u.stun * 1000);
                    }
                  }
                }
              });
              // Towers
              nextTowers.forEach(tower => {
                if (tower.isOpponent !== u.isOpponent && tower.hp > 0) {
                  const dist = Math.sqrt(Math.pow(tower.x - hitX, 2) + Math.pow(tower.y - hitY, 2));
                  if (dist <= affectRadius + 20) {
                    tower.stunUntil = now + (u.stun * 1000);
                    // Ice Spirit applies freeze visual to towers too
                    if (isIceSpirit) {
                      tower.freezeUntil = now + (u.stun * 1000);
                    }
                  }
                }
              });
              // Visual
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'ice_freeze',
                x: hitX,
                y: hitY,
                radius: 40,
                startTime: Date.now(),
                duration: 800
              }]);
            }

            // Heal Spirit
            if (u.healsOnAttack > 0) {
              healEvents.push({
                x: hitX,
                y: hitY,
                radius: u.healRadius,
                amount: u.healsOnAttack,
                isOpponent: u.isOpponent
              });
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'heal_glow',
                x: hitX,
                y: hitY,
                radius: u.healRadius,
                startTime: Date.now(),
                duration: 600
              }]);
            }

            // Electro Spirit Chain
            if (u.chain > 0 && target) {
              chainEvents.push({
                attackerId: u.id,
                primaryTarget: target,
                chainCount: Math.min(u.chain - 1, 3),
                damage: damage,
                stun: u.stun || 0,
                isOpponent: u.isOpponent,
                startX: hitX,
                startY: hitY
              });
            }

            return { ...u, x: newX, y: newY, hp: 0 }; // Die
          }

          return { ...u, x: newX, y: newY };
        }

        // Passive Healing (Battle Healer)
        if (u.passiveHeal && u.passiveHeal > 0) {
          const lastPassiveHeal = u.lastPassiveHeal || u.spawnTime;
          if (now - lastPassiveHeal >= 1000) {
            u.hp = Math.min(u.maxHp, u.hp + u.passiveHeal);
            u.lastPassiveHeal = now;

            // Visual effect for passive heal
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'heal_glow',
              x: u.x,
              y: u.y,
              radius: 20,
              startTime: Date.now(),
              duration: 400
            }]);
          }
        }

        // Check building lifetime - depreciate HP over time
        if (u.lifetimeDuration && u.spawnTime && u.maxHp) {
          const elapsedSeconds = (now - u.spawnTime) / 1000;
          const hpLostPerSecond = u.maxHp / u.lifetimeDuration;
          const hpLostTotal = Math.floor(elapsedSeconds * hpLostPerSecond);
          const currentHpFromDepreciation = Math.max(0, u.maxHp - hpLostTotal);
          // Use the lower of current HP or depreciation HP
          if (currentHpFromDepreciation < u.hp) {
            return { ...u, hp: currentHpFromDepreciation };
          }
        }

        // Handle Elixir generation (Elixir Collector)
        if (u.generatesElixir && u.elixirGenerationTime !== undefined) {
          const timeSinceLastGen = (now - u.elixirGenerationTime) / 1000;
          const elixirGenRate = 10.5; // Generate 1 elixir every 10.5 seconds (93s lifetime / 8 elixir)

          if (timeSinceLastGen >= elixirGenRate) {
            // Generate elixir for the owner
            if (u.isOpponent) {
              setEnemyElixir(prev => Math.min(10, prev + 1));
            } else {
              setElixir(prev => Math.min(10, prev + 1));
            }

            // Visual effect for elixir generation
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'elixir_popup',
              x: u.x,
              y: u.y - 20,
              value: '+1',
              startTime: Date.now(),
              duration: 800
            }]);

            return { ...u, elixirGenerationTime: now };
          }
        }

        // Handle periodic spawning (Tombstone spawns skeletons every spawnRate seconds)
        if (u.spawns && u.spawnRate && u.lastSpawn !== undefined) {
          // Check if we've reached the spawn limit (for graveyard)
          const maxSpawned = u.totalToSpawn || Infinity;
          const spawnedSoFar = u.spawnedSoFar || 0;

          if (spawnedSoFar < maxSpawned) {
            const timeSinceLastSpawn = (now - u.lastSpawn) / 1000; // Convert to seconds
            if (timeSinceLastSpawn >= u.spawnRate) {
              // Spawn the units
              const spawnCardId = u.spawns;
              const spawnCard = CARDS.find(c => c.id === spawnCardId);

              if (spawnCard) {
                const newSpawns = [];
                // Use unit's spawnCount if defined, otherwise fall back to spawn card's count
                let spawnCount = u.spawnCount || spawnCard.count || 1;

                // Limit spawn count to not exceed totalToSpawn
                if (spawnedSoFar + spawnCount > maxSpawned) {
                  spawnCount = maxSpawned - spawnedSoFar;
                }

                for (let i = 0; i < spawnCount; i++) {
                  // Calculate spawn position - ensure skeletons spawn AWAY from parent, not inside
                  // For buildings (speed === 0), spawn in direction toward enemy
                  // For moving units like Witch, spawn around them with minimum distance
                  let offsetX, offsetY;

                  if (u.type === 'graveyard_zone') {
                    // Graveyard: spawn randomly in a 4-tile radius circle (80 pixels)
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 80; // 0-80 pixels from center (4 tiles)
                    offsetX = Math.cos(angle) * distance;
                    offsetY = Math.sin(angle) * distance;
                  } else if (u.speed === 0) {
                    // Building (Tombstone) - spawn skeletons toward enemy side
                    const minOffset = 50;
                    const maxOffset = 80;
                    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45 to +45 degrees from forward
                    const distance = minOffset + Math.random() * (maxOffset - minOffset);
                    offsetX = Math.sin(angle) * distance;
                    // Spawn toward enemy: player buildings spawn up (-Y), opponent buildings spawn down (+Y)
                    offsetY = u.isOpponent ? distance * Math.cos(angle) : -distance * Math.cos(angle);
                  } else {
                    // Moving unit (Witch) - spawn around with minimum distance
                    const minOffset = 50;
                    const maxOffset = 80;
                    const angle = (i / spawnCount) * Math.PI * 2 + Math.random() * 0.5; // Spread evenly around
                    const distance = minOffset + Math.random() * (maxOffset - minOffset);
                    offsetX = Math.cos(angle) * distance;
                    offsetY = Math.sin(angle) * distance;
                  }

                  const spawnX = u.x + offsetX;
                  const spawnY = u.y + offsetY;

                  // Clamp spawn position to map bounds to prevent spawned units from going off-map
                  const clampedSpawnX = Math.max(20, Math.min(width - 20, spawnX));
                  const clampedSpawnY = Math.max(20, Math.min(height - 20, spawnY));

                  newSpawns.push({
                    id: Date.now() + Math.random() * 1000 + i,
                    x: clampedSpawnX,
                    y: clampedSpawnY,
                    hp: spawnCard.hp,
                    maxHp: spawnCard.hp,
                    isOpponent: u.isOpponent,
                    speed: spawnCard.speed,
                    lane: u.lane,
                    lastAttack: 0,
                    spriteId: spawnCard.id,
                    type: spawnCard.type,
                    range: spawnCard.range,
                    damage: spawnCard.damage,
                    attackSpeed: spawnCard.attackSpeed,
                    projectile: spawnCard.projectile,
                    lockedTarget: null,
                    wasPushed: false,
                    wasStunned: false,
                    stunUntil: 0,
                    baseDamage: spawnCard.damage,
                    // Copy special properties from spawnCard
                    kamikaze: spawnCard.kamikaze || false,
                    splash: spawnCard.splash || false,
                    frontalSplash: spawnCard.frontalSplash || false,
                    healsOnAttack: spawnCard.healsOnAttack || 0,
                    healRadius: spawnCard.healRadius || 0,
                    chain: spawnCard.chain || 0,
                    stun: spawnCard.stun || 0,
                    // Shield properties (Guards, Dark Prince)
                    hasShield: spawnCard.hasShield || false,
                    currentShieldHp: spawnCard.shieldHp || 0,
                    shieldHp: spawnCard.shieldHp || 0
                  });
                }

                // Add spawned units to collection (will be added at end of loop)
                unitsToSpawn.push(...newSpawns);

                // Update last spawn time and spawned count
                u.lastSpawn = now;
                u.spawnedSoFar = spawnedSoFar + spawnCount;
              }
            }
          }
        }

        // Handle spawn damage (one-time effect on spawn)
        if (u.spawnDamage && !u.spawnEffectProcessed) {
          u.spawnEffectProcessed = true;
          // Add splash event centered on unit
          splashEvents.push({
            attacker: u,
            targetX: u.x,
            targetY: u.y,
            damage: u.spawnDamage,
            slow: u.slow
          });

          // Mega Knight spawn slam visual effect
          if (u.spriteId === 'mega_knight') {
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'mega_knight_slam',
              x: u.x,
              y: u.y,
              radius: 70,
              startTime: Date.now(),
              duration: 600
            }]);
          }
        }

        // Handle Phoenix Egg hatching
        if (u.hatchesInto && u.hatchTime && now >= u.hatchTime) {
          // Only hatch if the egg is still alive
          if (u.hp > 0) {
            const hatchCard = CARDS.find(c => c.id === u.hatchesInto);
            if (hatchCard) {
              unitsToSpawn.push({
                id: 'phoenix_reborn_' + Date.now(),
                x: u.x,
                y: u.y,
                hp: hatchCard.hp,
                maxHp: hatchCard.hp,
                isOpponent: u.isOpponent,
                speed: hatchCard.speed,
                type: hatchCard.type,
                range: hatchCard.range,
                damage: hatchCard.damage,
                attackSpeed: hatchCard.attackSpeed,
                projectile: hatchCard.projectile,
                lane: u.lane,
                lastAttack: 0,
                spriteId: hatchCard.id,
                spawnTime: Date.now() - 2000,
                splash: hatchCard.splash,
                revivesAsEgg: true,
                eggHp: u.eggHp,
                eggDuration: u.eggDuration
              });
              // Hatch visual effect
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'fire_explosion',
                x: u.x,
                y: u.y,
                radius: 60,
                startTime: Date.now(),
                duration: 600
              }]);
            }
          }
          // Remove the egg (whether it hatched or died)
          return null;
        }

        // Handle Cannon Cart transform to building
        if (u.transformsToBuilding && !u.hasTransformed) {
          // Find nearest building
          const targetBuilding = (towersRef.current || []).find(t => t.isOpponent !== u.isOpponent && t.hp > 0 && t.type === 'princess');
          if (targetBuilding) {
            const dist = Math.sqrt(Math.pow(u.x - targetBuilding.x, 2) + Math.pow(u.y - targetBuilding.y, 2));
            // Transform when close to target building (within attack range)
            if (dist <= u.range + 20) {
              // Transform into stationary cannon building
              return {
                ...u,
                hasTransformed: true,
                speed: 0,
                type: 'building',
                hp: u.hp + u.shieldHp, // Add shield HP to total HP when transformed
                maxHp: u.hp + u.shieldHp,
                currentShieldHp: 0,
                hasShield: false,
                transformTime: Date.now()
              };
            }
          }
        }

        // Handle Tesla hidden mechanic
        // In real CR: Tesla has full range/damage at all times
        // When hidden: cannot be targeted by enemies
        // When visible (enemies in range): attacks normally
        let actualDamage = u.damage;
        let actualRange = u.range;
        if (u.hidden) {
          if (u.spriteId === 'tesla') {
            // Tesla logic: Uncloak when enemies are near
            const detectionRange = u.range * 1.2;
            const hasEnemyInRange = (unitsRef.current || []).some(enemy =>
              enemy.isOpponent !== u.isOpponent && enemy.hp > 0 &&
              Math.sqrt(Math.pow(enemy.x - u.x, 2) + Math.pow(enemy.y - u.y, 2)) <= detectionRange
            );

            if (!u.hidden.lastCombatTime) u.hidden.lastCombatTime = now;

            if (hasEnemyInRange) {
              u.hidden.lastCombatTime = now;
              if (u.hidden.active) {
                u.hidden.wakeTime = now;
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'tesla_reveal',
                  x: u.x, y: u.y,
                  radius: 50, startTime: Date.now(), duration: 500
                }]);
              }
              u.hidden.active = false;
            } else {
              const timeSinceCombat = (now - u.hidden.lastCombatTime) / 1000;
              if (timeSinceCombat > 3) u.hidden.active = true;
            }
          } else if (u.spriteId === 'royal_ghost') {
            // Royal Ghost logic: Re-cloak 3s after last attack
            const timeSinceAttack = now - (u.hidden.lastAttackTime || 0);
            if (!u.hidden.active && timeSinceAttack > 3000) {
              u.hidden.active = true;
            }
          }
        }

        // Handle Prince charge
        if (u.charge) {
          // Activate charge after traveling 2 tiles
          if (u.charge.distance >= u.charge.threshold && !u.charge.active) {
            u.charge.active = true;
          }

          // If charging, double the damage
          if (u.charge.active) {
            actualDamage = u.damage * 2;
          }
        }

        // Handle spawn delay (Golem, Golemite) - unit cannot move or attack during spawn delay
        if (u.spawnDelay && u.spawnTime) {
          const timeSinceSpawn = now - u.spawnTime;
          if (timeSinceSpawn < u.spawnDelay) {
            // Still in spawn delay - skip all movement and attack logic
            return u;
          }
        }

        // GOBLIN GIANT: Independent spear goblin attacks from his back
        // These attack continuously with their own speed, separate from Giant's melee punch
        if (u.extraProjectiles > 0 && u.spriteId === 'goblin_giant') {
          const spearGoblinCard = CARDS.find(c => c.id === 'spear_goblins');
          if (spearGoblinCard) {
            const lastSpearAttack = u.lastSpearAttack || 0;
            const timeSinceSpearAttack = now - lastSpearAttack;

            // Spear goblins attack every 1100ms (their attack speed), independent of Giant
            if (timeSinceSpearAttack >= spearGoblinCard.attackSpeed) {
              // Find nearest enemy unit for spear goblins to target
              const spearTargets = (unitsRef.current || []).filter(t => t.isOpponent !== u.isOpponent && t.hp > 0 && t.type !== 'building');
              let closestSpearTarget = null;
              let minSpearDist = Infinity;
              spearTargets.forEach(t => {
                const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
                if (dist < minSpearDist && dist <= spearGoblinCard.range * 2) {
                  minSpearDist = dist;
                  closestSpearTarget = t;
                }
              });

              // Shoot extra projectiles (spear goblin attacks) - happens even while Giant is walking!
              if (closestSpearTarget) {
                const spearTarget = closestSpearTarget;
                for (let i = 0; i < u.extraProjectiles; i++) {
                  nextProjectiles.push({
                    id: now + Math.random() + i + spearTarget.id + 1000,
                    x: u.x - 20 + (i * 40), // Slightly offset positions
                    y: u.y - 10,
                    targetId: spearTarget.id,
                    targetX: spearTarget.x,
                    targetY: spearTarget.y,
                    speed: 12,
                    damage: spearGoblinCard.damage,
                    type: 'spear',
                    splash: false,
                    attackerId: u.id,
                    isOpponent: u.isOpponent
                  });
                }
                // Update last spear attack time
                u.lastSpearAttack = now;
              }
            }
          }
        }

        // Defensive check: ensure nextTowers is an array before filtering
        // Initial targets: Only Princess towers (King tower added conditionally below)
        // This applies to ALL units (Ground, Flying, Building-targeters)
        let targets = (nextTowers || []).filter(t =>
          t.isOpponent !== u.isOpponent &&
          t.hp > 0 &&
          t.type === 'princess'
        );

        // King tower becomes targetable when princess tower on that side is destroyed
        // Check if we should add king tower to targets
        const isOpponent = u.isOpponent;
        if (isOpponent) {
          // Opponent unit targeting player towers
          const leftPrincess = nextTowers.find(t => t.id === 4 && t.hp > 0);
          const rightPrincess = nextTowers.find(t => t.id === 5 && t.hp > 0);
          const king = nextTowers.find(t => t.id === 3 && t.hp > 0);

          // If either princess is destroyed, king becomes targetable from anywhere
          if (!leftPrincess || !rightPrincess) {
            if (king) {
              targets.push(king);
            }
          }
        } else {
          // Player unit targeting opponent towers
          const leftPrincess = nextTowers.find(t => t.id === 1 && t.hp > 0);
          const rightPrincess = nextTowers.find(t => t.id === 2 && t.hp > 0);
          const king = nextTowers.find(t => t.id === 0 && t.hp > 0);

          // If either princess is destroyed, king becomes targetable from anywhere
          if (!leftPrincess || !rightPrincess) {
            if (king) {
              targets.push(king);
            }
          }
        }

        // Units that target buildings ONLY (Giant, Hog) ignore other units
        if (u.targetType !== 'buildings') {
          // For other units: PRIORITIZE towers, only target units if no towers in range
          // Use unitsRef.current instead of currentUnits to avoid circular reference
          // Exclude hidden Teslas from targets (they're underground and untargetable)
          // Exclude zones (graveyard) from targets (they're untargetable)
          const unitTargets = (unitsRef.current || []).filter(targetUnit =>
            targetUnit.isOpponent !== u.isOpponent &&
            targetUnit.hp > 0 &&
            !targetUnit.hidden?.active && // Untargetable if hidden (Royal Ghost, Tesla)
            !targetUnit.isZone && // Cannot target zones (graveyard, etc.)
            // Ground melee units cannot target flying units, but ranged units can
            // EXCEPTION: X-Bow targets ground ONLY despite having projectile
            (u.type === 'flying' || (u.projectile && u.spriteId !== 'x_bow') || targetUnit.type !== 'flying')
          );

          // Check if any tower is in range
          const hasTowerInRange = targets.some(t => {
            const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
            return dist <= actualRange + 25;
          });

          // Only add unit targets if no towers are in range
          if (!hasTowerInRange) {
            targets = [...targets, ...unitTargets];
          }
        }

        // LOCKED TARGET MECHANIC
        // If unit has a locked target, check if it's still alive and valid
        if (u.lockedTarget) {
          // Check if locked target still exists and is alive
          const lockedTargetAlive = targets.some(t => t.id === u.lockedTarget);

          // Unlock if: target died or unit was pushed back
          if (!lockedTargetAlive || u.wasPushed) {
            u.lockedTarget = null;
            u.wasPushed = false;
          } else {
            // Keep locked target - filter to only include locked target
            targets = targets.filter(t => t.id === u.lockedTarget);
          }
        }

        let closestTarget = null;
        let minDist = Infinity;

        targets.forEach(t => {
          const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
          if (dist < minDist) {
            minDist = dist;
            closestTarget = t;
          }
        });

        // Electro Wizard split attack - find 2 closest targets
        let closestTarget2 = null;
        let minDist2 = Infinity;
        if (u.spriteId === 'electro_wizard') {
          targets.forEach(t => {
            if (t.id !== closestTarget?.id) {
              const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
              if (dist < minDist2) {
                minDist2 = dist;
                closestTarget2 = t;
              }
            }
          });
        }

        // Bandit Dash - activate dash when entering dash range while moving toward target
        if (u.dashInvincible && u.spriteId === 'bandit' && !u.isDashing && closestTarget && minDist <= (u.dashRange || 80) && minDist > u.range + 10) {
          // Activate dash when within dash range (but not too close)
          u.isDashing = true;
          u.dashEndTime = now + 750; // Dash lasts 750ms
          u.lockedTarget = closestTarget.id; // Lock onto target

          // Visual effect for dash
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'dash_trail',
            x: u.x,
            y: u.y,
            radius: 30,
            startTime: Date.now(),
            duration: 750
          }]);
        }

        if (closestTarget && minDist <= actualRange + 25) {
          // LOCK the target when starting to attack
          if (!u.lockedTarget) {
            u.lockedTarget = closestTarget.id;
          }

          // Inferno Tower & Inferno Dragon Continuous Beam Visual - show every frame while locked on target
          if (u.damageRamp && (u.spriteId === 'inferno_tower' || u.spriteId === 'inferno_dragon')) {
            const beamIntensity = Math.min(1, (u.currentDamageBonus || 0) / 400); // 0 = weak, 1 = max

            setVisualEffects(prev => {
              // Remove old beam from this tower
              const filtered = prev.filter(e => e.attackerId !== u.id || e.type !== 'inferno_beam');

              // Add updated beam
              return [...filtered, {
                id: Date.now() + Math.random(),
                type: 'inferno_beam',
                attackerId: u.id,
                startX: u.x,
                startY: u.y,
                endX: closestTarget.x,
                endY: closestTarget.y,
                intensity: beamIntensity,
                startTime: Date.now(),
                duration: 100 // Short duration, will be refreshed each frame
              }];
            });
          }

          // Electro Giant Shock Aura - show continuously while alive
          if (u.shockOnHit && u.spriteId === 'electro_giant') {
            const shockRadius = u.shockRadius || 50;

            setVisualEffects(prev => {
              // Remove old aura from this giant
              const filtered = prev.filter(e => e.attackerId !== u.id || e.type !== 'electro_aura');

              // Add updated aura
              return [...filtered, {
                id: Date.now() + Math.random(),
                type: 'electro_aura',
                attackerId: u.id,
                x: u.x,
                y: u.y,
                radius: shockRadius,
                startTime: Date.now(),
                duration: 100 // Short duration, will be refreshed each frame
              }];
            });
          }

          const isWakingUp = u.hidden && u.hidden.wakeTime && (now - u.hidden.wakeTime < 500);

          let currentAttackSpeed = u.attackSpeed;
          if (u.slowUntil > now) {
            currentAttackSpeed = u.attackSpeed / (1 - (u.slowAmount || 0.35));
          }
          if (u.rageUntil > now) {
            currentAttackSpeed = u.attackSpeed / 1.35; // 35% faster attack speed
          }

          // Sparky charge check - must be fully charged before attacking
          let canAttackNow = true;
          if (u.chargeState) {
            const timeCharging = now - u.chargeState.startTime;
            if (timeCharging < u.chargeState.duration) {
              canAttackNow = false; // Still charging
            } else if (!u.chargeState.isCharged) {
              // Just finished charging
              u.chargeState.isCharged = true;
            }
          }

          if (now - u.lastAttack > currentAttackSpeed && !isWakingUp && canAttackNow) {
            // Mark that this unit attacked this frame (for recoil mechanic)
            u.justAttacked = true;

            // Reset Sparky charge state after attacking
            if (u.chargeState && u.chargeState.isCharged) {
              u.chargeState.isCharged = false;
              u.chargeState.startTime = now;
            }

            // Calculate damage to deal
            let damageToDeal = actualDamage;

            // Uncloak if hidden (Royal Ghost)
            if (u.hidden && u.hidden.active) {
              u.hidden.active = false;
              u.hidden.lastAttackTime = now;
            }

            // Bandit Dash - deals 2x damage while dashing
            if (u.dashInvincible && u.isDashing && u.spriteId === 'bandit') {
              damageToDeal = actualDamage * 2; // Dash deals 2x damage
            }

            // Inferno Tower Damage Ramp - increases over time
            if (u.damageRamp) {
              const timeRamping = (now - u.lastDamageRampTime) / 1000;
              u.currentDamageBonus = Math.min(350, timeRamping * 60); // Slower ramp, cap at +350
              damageToDeal = actualDamage + u.currentDamageBonus;
            }

            // Hunter Shotgun Spread - damage falls off with distance
            if (u.shotgunSpread) {
              const distToTarget = Math.sqrt(Math.pow(closestTarget.x - u.x, 2) + Math.pow(closestTarget.y - u.y, 2));
              const falloff = Math.max(0.3, 1 - (distToTarget / 150)); // 30% min damage at max range
              damageToDeal = Math.floor(actualDamage * falloff);
            }

            // Note: Witch spawns skeletons via periodic spawn (spawnRate: 7), not attack spawn

            // Electro Wizard split attack - fire at 2 targets
            const targetsToAttack = [closestTarget];
            if (u.spriteId === 'electro_wizard' && closestTarget2 && minDist2 <= actualRange + 25) {
              targetsToAttack.push(closestTarget2);
            }

            if (u.projectile) {
              // Tesla uses lightning - special instant effect
              // X-Bow has very fast arrows
              const projectileType = (u.spriteId === 'tesla') ? 'tesla_lightning' : u.projectile;
              let projectileSpeed = 12; // Default speed
              if (u.spriteId === 'tesla') {
                projectileSpeed = 100; // Instant for Tesla
              } else if (u.spriteId === 'x_bow') {
                projectileSpeed = 50; // Very fast arrows for X-Bow
              }

              // Fire projectiles at all targets
              targetsToAttack.forEach(target => {
                if (u.shotgunSpread) {
                  // Hunter fires 10 bullets in a cone
                  const baseAngle = Math.atan2(target.y - u.y, target.x - u.x);
                  for (let i = -4; i <= 5; i++) {
                    const angle = baseAngle + (i * 0.15); // spread
                    const tX = u.x + Math.cos(angle) * 150;
                    const tY = u.y + Math.sin(angle) * 150;

                    nextProjectiles.push({
                      id: now + Math.random() + i,
                      x: u.x,
                      y: u.y,
                      targetId: null, // Shotgun bullets are location based
                      targetX: tX,
                      targetY: tY,
                      speed: 15,
                      damage: Math.floor(damageToDeal / 10), // Divide total damage by pellet count
                      type: 'bullet', // pellets
                      attackerId: u.id,
                      isOpponent: u.isOpponent
                    });
                  }
                } else if (u.spreadCount && u.spriteId === 'firecracker') {
                  // Firecracker fires 8 rockets in a forward spread pattern
                  const baseAngle = Math.atan2(target.y - u.y, target.x - u.x);
                  const spreadArc = u.spreadArc || 0.5; // Radians of spread
                  const pelletCount = u.spreadCount || 8;

                  for (let i = 0; i < pelletCount; i++) {
                    // Distribute pellets evenly across the arc
                    const angleOffset = -spreadArc / 2 + (spreadArc * i / (pelletCount - 1));
                    const angle = baseAngle + angleOffset;
                    const distance = 200; // Firecrackers shoot far forward
                    const tX = u.x + Math.cos(angle) * distance;
                    const tY = u.y + Math.sin(angle) * distance;

                    nextProjectiles.push({
                      id: now + Math.random() + i,
                      x: u.x,
                      y: u.y,
                      targetId: null, // Firecracker rockets are location based
                      targetX: tX,
                      targetY: tY,
                      speed: 12,
                      damage: Math.floor(damageToDeal / pelletCount), // Divide damage by rocket count
                      type: 'firecracker',
                      splash: true,
                      splashRadius: 25,
                      stun: u.stun || 0,
                      attackerId: u.id,
                      isOpponent: u.isOpponent
                    });
                  }
                } else {
                  nextProjectiles.push({
                    id: now + Math.random() + target.id,
                    x: u.x,
                    y: u.y,
                    targetId: target.id,
                    targetX: target.x,
                    targetY: target.y,
                    speed: projectileSpeed,
                    damage: damageToDeal,
                    type: projectileType,
                    splash: u.splash,
                    slow: u.slow,
                    stun: u.stun,
                    attackerId: u.id,
                    isOpponent: u.isOpponent,
                    pierce: u.pierce || false,
                    chain: u.chain || 0,
                    turnsToPig: u.turnsToPig || false
                  });

                  // Goblin Giant: Extra spear goblin attacks from his back
                  if (u.extraProjectiles > 0) {
                    const spearGoblinCard = CARDS.find(c => c.id === 'spear_goblins');
                    if (spearGoblinCard) {
                      // Find nearest enemy unit for spear goblins to target
                      const spearTargets = currentUnits.filter(t => t.isOpponent !== u.isOpponent && t.hp > 0 && t.type !== 'building');
                      let closestSpearTarget = null;
                      let minSpearDist = Infinity;
                      spearTargets.forEach(t => {
                        const dist = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
                        if (dist < minSpearDist && dist <= spearGoblinCard.range * 2) {
                          minSpearDist = dist;
                          closestSpearTarget = t;
                        }
                      });

                      // Shoot extra projectiles (spear goblin attacks)
                      for (let i = 0; i < u.extraProjectiles; i++) {
                        const spearTarget = closestSpearTarget || target;
                        nextProjectiles.push({
                          id: now + Math.random() + i + target.id + 1000,
                          x: u.x - 20 + (i * 40), // Slightly offset positions
                          y: u.y - 10,
                          targetId: spearTarget.id,
                          targetX: spearTarget.x,
                          targetY: spearTarget.y,
                          speed: 12,
                          damage: spearGoblinCard.damage,
                          type: 'spear',
                          splash: false,
                          attackerId: u.id,
                          isOpponent: u.isOpponent
                        });
                      }
                    }
                  }
                }
              });
            }

            // Firecracker Recoil - push herself back when shooting (after attack logic)
            if (u.recoil && u.justAttacked && closestTarget) {
              const angle = Math.atan2(u.y - closestTarget.y, u.x - closestTarget.x); // Opposite direction
              const recoilDistance = u.recoil || 60;
              let nextRX = u.x + Math.cos(angle) * recoilDistance;
              let nextRY = u.y + Math.sin(angle) * recoilDistance;

              // River collision during recoil
              const rY = height / 2;
              const distR = Math.abs(nextRY - rY);
              const bW = 60;
              const lBX = 95;
              const rBX = width - 95;
              const onB = (Math.abs(nextRX - lBX) < bW / 2) || (Math.abs(nextRX - rBX) < bW / 2);

              const isFlyingOrJumping = u.jumps || u.type === 'flying';
              if (distR < 25 && !onB && !isFlyingOrJumping) {
                // Recoil would put unit into river - stop at edge
                nextRY = rY + (u.y < rY ? -25 : 25);
              }

              u.x = Math.max(10, Math.min(width - 10, nextRX));
              u.y = Math.max(10, Math.min(height - 10, nextRY));

              // Recoil visual
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'dust_cloud',
                x: u.x,
                y: u.y,
                radius: 25,
                startTime: Date.now(),
                duration: 400
              }]);
            }

            if (u.kamikaze && u.spriteId !== 'battle_ram') {
              // SPIRIT JUMP ATTACK INITIATION
              return {
                ...u,
                isJumpingAttack: true,
                jumpStartTime: now,
                jumpStartX: u.x,
                jumpStartY: u.y,
                jumpTargetX: closestTarget.x,
                jumpTargetY: closestTarget.y,
                jumpTargetId: closestTarget.id,
                lastAttack: now,
                hidden: u.hidden,
                charge: u.charge,
                lockedTarget: u.lockedTarget,
                wasPushed: false,
                wasStunned: u.wasStunned
              };
            } else {
              // Melee attack - apply damage directly
              // Check if target is a tower (id < 100) or a unit (id >= 100)
              if (closestTarget.id < 100) {
                // Target is a tower
                const targetIndex = nextTowers.findIndex(t => t.id === closestTarget.id);
                if (targetIndex !== -1) {
                  nextTowers[targetIndex] = {
                    ...nextTowers[targetIndex],
                    hp: nextTowers[targetIndex].hp - damageToDeal
                  };
                }
              } else {
                // Target is a unit - apply damage directly
                // Target is a unit - apply damage directly via event queue (cannot modify currentUnits inside map)
                damageEvents.push({
                  targetId: closestTarget.id,
                  damage: damageToDeal,
                  attackerId: u.id
                });

                // Reset charge if Prince gets attacked - handled in damage application
                /* Note: We handle charge reset when applying damage */
              }
              // Record splash damage event if attacker has splash
              if (u.splash) {
                splashEvents.push({
                  attacker: u,
                  attackerX: u.x,
                  attackerY: u.y,
                  targetX: closestTarget.x,
                  targetY: closestTarget.y,
                  damage: damageToDeal,
                  frontalSplash: u.frontalSplash || false,
                  turnsToPig: u.turnsToPig || false,
                  knockback: u.knockback || 0,
                  boomerang: u.boomerang || false
                });
              }

              // Electro Giant Shock - stun all enemies in radius when attacking
              if (u.shockOnHit && u.spriteId === 'electro_giant') {
                const shockRadius = u.shockRadius || 50;
                const shockStunDuration = (u.shockStun || 0.5) * 1000; // Convert to ms

                // Create stun events for all enemies in radius
                setUnits(prevUnits => {
                  return prevUnits.map(enemy => {
                    // Only affect enemy units within radius
                    if (enemy.isOpponent !== u.isOpponent && enemy.hp > 0) {
                      const dist = Math.sqrt(Math.pow(enemy.x - u.x, 2) + Math.pow(enemy.y - u.y, 2));
                      if (dist <= shockRadius) {
                        // Create lightning zap visual effect
                        setVisualEffects(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          type: 'lightning_strike',
                          x: enemy.x,
                          y: enemy.y,
                          radius: 30,
                          startTime: Date.now(),
                          duration: 300
                        }]);

                        // Apply stun
                        return { ...enemy, stunUntil: now + shockStunDuration };
                      }
                    }
                    return enemy;
                  });
                });

                // Also stun enemy towers in radius
                setTowers(prevTowers => {
                  return prevTowers.map(tower => {
                    if (tower.isOpponent !== u.isOpponent && tower.hp > 0) {
                      const dist = Math.sqrt(Math.pow(tower.x - u.x, 2) + Math.pow(tower.y - u.y, 2));
                      if (dist <= shockRadius) {
                        // Create lightning zap visual effect
                        setVisualEffects(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          type: 'lightning_strike',
                          x: tower.x,
                          y: tower.y,
                          radius: 30,
                          startTime: Date.now(),
                          duration: 300
                        }]);

                        // Apply stun (towers have stunUntil property)
                        return { ...tower, stunUntil: now + shockStunDuration };
                      }
                    }
                    return tower;
                  });
                });
              }

              // Heal on Attack (Battle Healer & Heal Spirit)
              if (u.healsOnAttack > 0) {
                healEvents.push({
                  x: u.x,
                  y: u.y,
                  radius: u.healRadius,
                  amount: u.healsOnAttack,
                  isOpponent: u.isOpponent
                });

                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'heal_pulse',
                  x: u.x,
                  y: u.y,
                  radius: u.healRadius,
                  startTime: Date.now(),
                  duration: 600
                }]);
              }

              // Spirit Cards special effects (AND Battle Ram impact)
              if (u.kamikaze) {
                // Add splash damage for units with splash (Wall Breakers, Fire Spirits)
                if (u.splash) {
                  splashEvents.push({
                    attacker: u,
                    targetX: closestTarget.x,
                    targetY: closestTarget.y,
                    damage: damageToDeal,
                    radius: u.splashRadius || 50
                  });
                }

                // Fire Spirit - explosion visual (has splash: true)
                if (u.splash) {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'fire_explosion',
                    x: closestTarget.x,
                    y: closestTarget.y,
                    radius: 50,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }

                // Battle Ram - wood break visual
                if (u.spriteId === 'battle_ram') {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'goblin_barrel_spawn', // Reuse wood effect
                    x: u.x,
                    y: u.y,
                    radius: 40,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }

                // Wall Breakers - building explosion visual
                if (u.spriteId === 'wall_breakers') {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'fire_explosion', // Building explosion
                    x: u.x,
                    y: u.y,
                    radius: 60,
                    startTime: Date.now(),
                    duration: 600
                  }]);
                }

                // Ice Spirit - freeze visual
                if (u.stun && u.stun > 0) {
                  damageEvents.push({
                    targetId: closestTarget.id,
                    damage: damageToDeal,
                    attackerId: u.id,
                    stun: u.stun
                  });
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'ice_freeze',
                    x: closestTarget.x,
                    y: closestTarget.y,
                    radius: 40,
                    startTime: Date.now(),
                    duration: 800
                  }]);
                }

                // Heal Spirit - logic moved out to handle Battle Healer too

                // Electro Spirit - chain visual
                if (u.chain > 0) {
                  chainEvents.push({
                    attackerId: u.id,
                    primaryTarget: closestTarget,
                    chainCount: Math.min(u.chain - 1, 3), // Max 3 additional targets (4 total)
                    damage: damageToDeal,
                    stun: u.stun || 0,
                    isOpponent: u.isOpponent,
                    startX: u.x,
                    startY: u.y
                  });
                }

                // Kamikaze - die after attacking
                return { ...u, lastAttack: now, hp: 0, hidden: u.hidden, charge: u.charge ? { ...u.charge, distance: 0, active: false } : u.charge, lockedTarget: u.lockedTarget, wasPushed: false, wasStunned: u.wasStunned };
              }
            }
            // Reset charge when Prince attacks (consumes charge)
            const updatedCharge = u.charge ? { ...u.charge, distance: 0, active: false } : u.charge;
            return {
              ...u,
              lastAttack: now,
              hidden: u.hidden,
              charge: updatedCharge,
              lockedTarget: u.lockedTarget,
              wasPushed: false,
              wasStunned: u.wasStunned,
              // Preserve new card properties
              dashRange: u.dashRange || 80,
              isDashing: u.isDashing || false,
              dashEndTime: u.dashEndTime || 0,
              currentDamageBonus: u.currentDamageBonus || 0,
              lastBombDrop: u.lastBombDrop || 0
            };
          }
          return {
            ...u,
            hidden: u.hidden,
            lockedTarget: u.lockedTarget,
            wasPushed: false,
            wasStunned: u.wasStunned,
            // Preserve new card properties
            dashRange: u.dashRange || 80,
            isDashing: u.isDashing || false,
            dashEndTime: u.dashEndTime || 0,
            currentDamageBonus: u.currentDamageBonus || 0,
            lastBombDrop: u.lastBombDrop || 0
          };
        } else if (u.spriteId === 'mega_knight' && closestTarget && !u.isJumping && minDist > 50 && minDist < 150) {
          // MEGA KNIGHT JUMP START
          // If target is out of melee range but in jump range (50-150)
          return { ...u, isJumping: true, jumpTargetId: closestTarget.id, hidden: u.hidden, charge: u.charge, lockedTarget: u.lockedTarget, wasPushed: false, wasStunned: u.wasStunned };
        } else {
          // Movement logic
          let nextY = u.y;
          let nextX = u.x;
          let isJumpingNow = u.isJumping;

          // Apply speed boost for charging Prince
          const speedMultiplier = (u.charge && u.charge.active) ? 2 : 1;
          let effectiveSpeed = u.speed * speedMultiplier;

          if (u.rageUntil > now) {
            effectiveSpeed *= 1.35; // 35% faster movement speed
          }

          // Mega Knight Jump Movement
          if (isJumpingNow) {
            const jumpTarget = targets.find(t => t.id === u.jumpTargetId);
            if (jumpTarget) {
              effectiveSpeed = 10; // High speed for jump
              const angle = Math.atan2(jumpTarget.y - u.y, jumpTarget.x - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;

              const distRemaining = Math.sqrt(Math.pow(jumpTarget.x - nextX, 2) + Math.pow(jumpTarget.y - nextY, 2));

              // Landing logic
              if (distRemaining < 20) {
                // LANDED
                isJumpingNow = false;
                // Deal big splash damage + Knockback
                const jumpDamage = u.baseDamage * 2; // Jump does 2x damage
                splashEvents.push({
                  attacker: u,
                  targetX: nextX,
                  targetY: nextY,
                  damage: jumpDamage,
                  knockback: 40 // Push units back
                });
              }
            } else {
              // Target died/gone while jumping - cancel jump
              isJumpingNow = false;
            }
          } else if (u.isDashing) {
            // BANDIT DASH MOVEMENT
            const dashTarget = (u.lockedTarget && targets.find(t => t.id === u.lockedTarget)) || closestTarget;

            if (dashTarget) {
              effectiveSpeed = 12; // Dash speed (very fast)
              const angle = Math.atan2(dashTarget.y - u.y, dashTarget.x - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;

              const distRemaining = Math.sqrt(Math.pow(dashTarget.x - nextX, 2) + Math.pow(dashTarget.y - nextY, 2));

              // End dash if close enough (attack range)
              if (distRemaining < 25) {
                u.isDashing = false;
                // Damage multiplier handled in attack logic
              }
            } else {
              u.isDashing = false; // Target lost
            }
          } else if (u.burrowing && u.burrowing.active && u.burrowing.targetX !== undefined) {
            // MINER BURROW MOVEMENT - travels underground to target location
            const targetX = u.burrowing.targetX;
            const targetY = u.burrowing.targetY;
            const distToTarget = Math.sqrt(Math.pow(targetX - u.x, 2) + Math.pow(targetY - u.y, 2));

            if (distToTarget > 5) {
              // Move toward burrow target
              const angle = Math.atan2(targetY - u.y, targetX - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;
            } else {
              // Reached target - stop burrowing and pop up
              u.burrowing.active = false;
              // Add popup visual
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'miner_popup',
                x: u.x,
                y: u.y,
                radius: 50,
                startTime: Date.now(),
                duration: 800
              }]);
            }
          } else {
            // Regular movement for non-miner, non-dashing units
            // Apply slow effect
            if (u.slowUntil > now) {
              effectiveSpeed *= (1 - (u.slowAmount || 0.35));
            }

            // Apply rage speed boost
            if (u.rageUntil > now) {
              effectiveSpeed *= (1 + (u.rageBoost || 0.35));
            }

            // Stop to attack - units like Sparky stop moving when in range
            if (u.stopsToAttack && closestTarget) {
              const distToTarget = Math.sqrt(Math.pow(closestTarget.x - u.x, 2) + Math.pow(closestTarget.y - u.y, 2));
              const attackRange = (u.range || 25) + 15; // Add buffer
              if (distToTarget <= attackRange) {
                effectiveSpeed = 0; // Stop moving to attack
              }
            }

            // Movement Calculation
            if ((u.jumps || u.type === 'flying') && closestTarget) {
              // Direct pathfinding for units that ignore terrain
              const angle = Math.atan2(closestTarget.y - u.y, closestTarget.x - u.x);
              nextX += Math.cos(angle) * effectiveSpeed;
              nextY += Math.sin(angle) * effectiveSpeed;

              // Skeleton Barrel - POP when reaching building!
              if (u.spriteId === 'skeleton_barrel') {
                const distToTarget = Math.sqrt(Math.pow(closestTarget.x - nextX, 2) + Math.pow(closestTarget.y - nextY, 2));
                // Pop if touching (30px buffer)
                if (distToTarget < 30) {
                  return { ...u, x: nextX, y: nextY, hp: 0 }; // Die immediately to trigger death spawn
                }
              }
            } else {
              // Standard vertical movement for ground units (bridges will handle steering)
              if (u.isOpponent) {
                nextY += effectiveSpeed;
              } else {
                nextY -= effectiveSpeed;
              }
            }

            // Track distance for charge
            if (u.charge && !u.charge.active) {
              const moveDist = Math.sqrt(Math.pow(nextX - u.x, 2) + Math.pow(nextY - u.y, 2));
              u.charge.distance = (u.charge.distance || 0) + moveDist;
            }

            // Defensive check: ensure nextTowers is an array
            const allTowers = (towersRef.current || []).filter(t => t.hp > 0);

            // Find the enemy King tower to redirect to after destroying princess tower
            const enemyKing = (towersRef.current || []).find(t => t.type === 'king' && t.isOpponent !== u.isOpponent && t.hp > 0);
            const kingCenterX = enemyKing ? enemyKing.x : width / 2;

            // Check if unit's lane princess tower is destroyed
            const lanePrincess = (towersRef.current || []).find(t =>
              t.type === 'princess' &&
              t.isOpponent !== u.isOpponent &&
              ((u.lane === 'LEFT' && t.x < width / 2) || (u.lane === 'RIGHT' && t.x > width / 2))
            );
            const princessDestroyed = !lanePrincess || lanePrincess.hp <= 0;

            // If princess tower is destroyed and unit is past the princess tower zone, steer toward King
            const princessY = u.isOpponent ? (height - 230) : 150;
            const pastPrincess = u.isOpponent ? (nextY > princessY + 30) : (nextY < princessY - 30);

            if (princessDestroyed && pastPrincess && enemyKing) {
              // Steer toward King tower center
              const diffX = kingCenterX - nextX;
              if (Math.abs(diffX) > 5) {
                const steerSpeed = Math.min(2, Math.abs(diffX) * 0.1);
                nextX += Math.sign(diffX) * steerSpeed;
              }
            }

            let collision = false;
            let avoidX = 0;

            // LANE CENTERING: Make units bunch up more in the center of their lane
            const laneCenterX = u.lane === 'LEFT' ? 95 : width - 95;
            const distToLaneCenter = Math.abs(nextX - laneCenterX);
            if (distToLaneCenter > 20 && effectiveSpeed > 0) {
              // Steer toward lane center
              const steerStrength = 2; // Strong steering to center
              avoidX += Math.sign(laneCenterX - nextX) * steerStrength;
            }

            for (let t of allTowers) {
              const distToTower = Math.sqrt(Math.pow(t.x - nextX, 2) + Math.pow(t.y - nextY, 2));
              const minDistance = (t.type === 'king' ? 45 : 35);

              if (distToTower < minDistance) {
                collision = true;
                if (nextX < t.x) {
                  avoidX += -2;
                } else {
                  avoidX += 2;
                }
                break;
              }
            }

            const riverY = height / 2;
            const distToRiver = Math.abs(nextY - riverY);

            // Flying units and jumpers move differently - they skip tower collision avoidance AND bridge logic
            const isFlyingOrJumping = u.jumps || u.type === 'flying';

            if (isFlyingOrJumping && effectiveSpeed > 0) {
              // Flying/jumping units just move straight toward target, no special avoidance
              // Movement already calculated above, do nothing extra
            } else if (collision && effectiveSpeed > 0) {
              nextX += avoidX;
              nextY = u.y + (u.isOpponent ? effectiveSpeed * 0.5 : -effectiveSpeed * 0.5);
            } else if (!collision && effectiveSpeed > 0) {
              // STRICT RIVER BLOCKING
              // Bridge zones: Left ~95, Right ~Width-95. Width ~40.
              const bridgeWidth = 50; // generous width
              const leftBridgeX = 95;
              const rightBridgeX = width - 95;

              const onLeftBridge = Math.abs(nextX - leftBridgeX) < bridgeWidth / 2;
              const onRightBridge = Math.abs(nextX - rightBridgeX) < bridgeWidth / 2;
              const onBridge = onLeftBridge || onRightBridge;

              if (distToRiver < 30 && !onBridge) {
                // BLOCKED BY RIVER
                // Allow moving AWAY from the river, but not towards it
                const isMovingTowardsRiver = (u.y < riverY && nextY > u.y) || (u.y > riverY && nextY < u.y);
                if (isMovingTowardsRiver) {
                  nextY = u.y;
                }

                // Slide towards nearest bridge
                const bridgeCenterX = u.lane === 'LEFT' ? leftBridgeX : rightBridgeX;
                const diffX = bridgeCenterX - nextX;
                // Move sideways to find bridge - slightly faster than normal speed
                nextX += Math.sign(diffX) * Math.min(Math.abs(diffX), effectiveSpeed * 1.5);
              } else if (distToRiver < 120 && !onBridge) {
                // Approaching river - steer towards bridge
                const bridgeCenterX = u.lane === 'LEFT' ? leftBridgeX : rightBridgeX;
                const diffX = bridgeCenterX - nextX;
                if (Math.abs(diffX) > 2) {
                  const steerSpeed = 2; // Stronger steering
                  nextX += Math.sign(diffX) * steerSpeed;
                }
              }
            }
          }

          // Update Bandit dash state - end dash when time is up
          let isDashingNow = u.isDashing || false;
          if (isDashingNow && now > (u.dashEndTime || 0)) {
            isDashingNow = false;
          }

          // Track Inferno Tower target for damage ramp reset
          if (u.damageRamp && u.lockedTarget && u.lastTargetId !== u.lockedTarget) {
            // Target changed, reset damage ramp
            u.lastDamageRampTime = now;
            u.currentDamageBonus = 0;
            u.lastTargetId = u.lockedTarget;
          } else if (u.damageRamp && !u.lockedTarget) {
            // No target, reset
            u.lastDamageRampTime = now;
            u.currentDamageBonus = 0;
          }

          return {
            ...u,
            x: nextX,
            y: nextY,
            hidden: u.hidden,
            charge: u.charge,
            lockedTarget: u.lockedTarget,
            wasPushed: u.wasPushed,
            wasStunned: u.wasStunned,
            isJumping: isJumpingNow,
            jumpTargetId: u.jumpTargetId,
            // Preserve new card properties
            dashRange: u.dashRange || 80,
            isDashing: isDashingNow,
            dashEndTime: u.dashEndTime || 0,
            currentDamageBonus: u.currentDamageBonus || 0,
            lastBombDrop: u.lastBombDrop || 0,
            lastTargetId: u.lastTargetId
          };
        }
      });

      // Filter out expired clones and out-of-bounds units
      // (Death filter and spawn processing moved to after all damage is applied)
      currentUnits = currentUnits.filter(u => {
        // Check if clone has expired
        if (u.isClone && u.cloneEndTime && Date.now() >= u.cloneEndTime) {
          return false;
        }
        // Remove out-of-bounds units
        if (u.y <= -50 || u.y >= height + 50) {
          return false;
        }
        return true;
      });

      // Apply collected splash damage events
      splashEvents.forEach(event => {
        const splashRadius = event.radius || 50;

        // For frontal splash (Dark Prince), calculate attack direction angle
        let attackAngle = 0;
        if (event.frontalSplash) {
          attackAngle = Math.atan2(event.targetY - event.attackerY, event.targetX - event.attackerX);
        }

        // Boomerang return damage (Executioner)
        if (event.boomerang) {
          // Schedule second splash damage when axe returns to Executioner
          setTimeout(() => {
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'fire_explosion', // Reuse explosion visual for axe return
              x: event.attackerX,
              y: event.attackerY,
              radius: 40,
              startTime: Date.now(),
              duration: 400
            }]);
            // Apply return damage to all enemies around Executioner
            setUnits(prevUnits => {
              return prevUnits.map(unit => {
                if (unit.isOpponent !== event.attacker.isOpponent && unit.hp > 0) {
                  const dist = Math.sqrt(Math.pow(unit.x - event.attackerX, 2) + Math.pow(unit.y - event.attackerY, 2));
                  if (dist <= splashRadius) {
                    const returnDamage = Math.floor(event.damage * 0.5); // Half damage on return
                    let remainingDamage = returnDamage;
                    let newShieldHp = unit.currentShieldHp || 0;
                    if (unit.hasShield && newShieldHp > 0) {
                      if (remainingDamage >= newShieldHp) {
                        remainingDamage -= newShieldHp;
                        newShieldHp = 0;
                      } else {
                        newShieldHp -= remainingDamage;
                        remainingDamage = 0;
                      }
                    }
                    return { ...unit, hp: unit.hp - remainingDamage, currentShieldHp: newShieldHp };
                  }
                }
                return unit;
              });
            });
          }, 600); // Axe returns after 600ms
        }

        // Damage all enemy units in splash radius
        currentUnits = currentUnits.map(unit => {
          if (unit.isOpponent !== event.attacker.isOpponent && unit.hp > 0) {
            const dist = Math.sqrt(Math.pow(unit.x - event.targetX, 2) + Math.pow(unit.y - event.targetY, 2));
            if (dist <= splashRadius) {
              // For frontal splash, check if unit is in front (within 180 degrees)
              if (event.frontalSplash) {
                const angleToUnit = Math.atan2(unit.y - event.attackerY, unit.x - event.attackerX);
                let angleDiff = angleToUnit - attackAngle;
                // Normalize angle to [-PI, PI]
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                // Only splash if unit is in front (within 90 degrees of attack direction)
                if (Math.abs(angleDiff) > Math.PI / 2) {
                  return unit; // Skip, unit is behind
                }
              }

              const damage = Math.floor(event.damage * 0.5);

              // Handle Shield
              let remainingDamage = damage;
              let newShieldHp = unit.currentShieldHp || 0;
              let shieldBroken = false;

              if (unit.hasShield && newShieldHp > 0) {
                if (remainingDamage >= newShieldHp) {
                  remainingDamage -= newShieldHp;
                  newShieldHp = 0;
                  shieldBroken = true;
                } else {
                  newShieldHp -= remainingDamage;
                  remainingDamage = 0;
                }
              }

              let updatedUnit = { ...unit, hp: unit.hp - remainingDamage, currentShieldHp: newShieldHp };

              // Shield Break Visual
              if (shieldBroken) {
                updatedUnit.hasShield = false;
                if (unit.spriteId === 'guards') updatedUnit.spriteId = 'skeletons';
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'shield_break',
                  x: unit.x,
                  y: unit.y,
                  radius: 35,
                  startTime: Date.now(),
                  duration: 500
                }]);
              }

              if (event.slow) {
                updatedUnit.slowUntil = Date.now() + 2000;
                updatedUnit.slowAmount = event.slow;
              }

              // Handle stun (Ice Spirit freeze)
              if (event.stun && event.stun > 0) {
                updatedUnit.stunUntil = Date.now() + (event.stun * 1000);
                updatedUnit.wasStunned = true;

                // Freeze visual effect
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'ice_freeze',
                  x: unit.x,
                  y: unit.y,
                  radius: 40,
                  startTime: Date.now(),
                  duration: 600
                }]);

                // Reset charge if Prince gets stunned
                if (unit.charge) {
                  updatedUnit.charge = { ...unit.charge, distance: 0, active: false };
                }
              }

              // Handle Knockback
              if (event.knockback) {
                const angle = Math.atan2(unit.y - event.targetY, unit.x - event.targetX);
                let knockX = updatedUnit.x + Math.cos(angle) * event.knockback;
                let knockY = updatedUnit.y + Math.sin(angle) * event.knockback;

                // River collision during knockback
                const rY = height / 2;
                const distR = Math.abs(knockY - rY);
                const bW = 60;
                const lBX = 95;
                const rBX = width - 95;
                const onB = (Math.abs(knockX - lBX) < bW / 2) || (Math.abs(knockX - rBX) < bW / 2);

                const isFlyingOrJumping = unit.jumps || unit.type === 'flying';
                if (distR < 25 && !onB && !isFlyingOrJumping) {
                  // Pushed into river - stop at edge
                  knockY = rY + (unit.y < rY ? -25 : 25);
                }

                updatedUnit.x = Math.max(10, Math.min(width - 10, knockX));
                updatedUnit.y = Math.max(10, Math.min(height - 10, knockY));
                updatedUnit.wasPushed = true;
              }

              // Mother Witch curse - marks enemy for 5 seconds
              if (event.turnsToPig && !unit.isPig && unit.type !== 'building') {
                updatedUnit.cursedUntil = Date.now() + 5000;
                updatedUnit.cursedByAttackerSide = event.attacker.isOpponent; // Track which side cursed them
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'curse',
                  x: unit.x,
                  y: unit.y,
                  startTime: Date.now(),
                  duration: 500
                }]);
              }
              return updatedUnit;
            }
          }
          return unit;
        });
        // Also splash towers
        nextTowers = nextTowers.map(tower => {
          if (tower.isOpponent !== event.attacker.isOpponent && tower.hp > 0) {
            const dist = Math.sqrt(Math.pow(tower.x - event.targetX, 2) + Math.pow(tower.y - event.targetY, 2));
            if (dist <= splashRadius + 20) {
              // For frontal splash, check if tower is in front
              if (event.frontalSplash) {
                const angleToTower = Math.atan2(tower.y - event.attackerY, tower.x - event.attackerX);
                let angleDiff = angleToTower - attackAngle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                if (Math.abs(angleDiff) > Math.PI / 2) {
                  return tower; // Skip, tower is behind
                }
              }

              const updatedTower = { ...tower, hp: tower.hp - Math.floor(event.damage * 0.5) };

              // Handle stun (Ice Spirit freeze)
              if (event.stun && event.stun > 0) {
                updatedTower.stunUntil = Date.now() + (event.stun * 1000);
                updatedTower.wasStunned = true;

                // Freeze visual effect for towers
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'ice_freeze',
                  x: tower.x,
                  y: tower.y,
                  radius: 40,
                  startTime: Date.now(),
                  duration: 600
                }]);
              }

              return updatedTower;
            }
          }
          return tower;
        });
      });

      // Apply heal events (Heal Spirit)
      healEvents.forEach(event => {
        // Heal all friendly units in radius
        currentUnits = currentUnits.map(unit => {
          if (unit.isOpponent === event.isOpponent && unit.hp > 0) {
            const dist = Math.sqrt(Math.pow(unit.x - event.x, 2) + Math.pow(unit.y - event.y, 2));
            if (dist <= event.radius) {
              return { ...unit, hp: Math.min(unit.maxHp || unit.hp + event.amount, unit.hp + event.amount) };
            }
          }
          return unit;
        });
        // Also heal friendly towers
        nextTowers = nextTowers.map(tower => {
          if (tower.isOpponent === event.isOpponent && tower.hp > 0) {
            const dist = Math.sqrt(Math.pow(tower.x - event.x, 2) + Math.pow(tower.y - event.y, 2));
            if (dist <= event.radius) {
              return { ...tower, hp: Math.min(tower.maxHp || tower.hp + event.amount, tower.hp + event.amount) };
            }
          }
          return tower;
        });
      });

      // Apply chain events (Electro Spirit)
      chainEvents.forEach(event => {
        const attacker = currentUnits.find(u => u.id === event.attackerId);
        if (!attacker) return; // Attacker died before chain could complete

        let chainedTargets = [event.primaryTarget];
        let remainingChains = event.chainCount;

        // Find additional targets to chain to
        while (remainingChains > 0) {
          let lastTarget = chainedTargets[chainedTargets.length - 1];
          let closestDist = Infinity;
          let closestTarget = null;

          // Find closest enemy unit to the last chained target
          currentUnits.forEach(unit => {
            if (unit.isOpponent !== event.isOpponent && unit.hp > 0 && !chainedTargets.find(t => t.id === unit.id) && !unit.isZone) {
              const dist = Math.sqrt(Math.pow(unit.x - lastTarget.x, 2) + Math.pow(unit.y - lastTarget.y, 2));
              if (dist < closestDist && dist < 80) { // Max chain distance: 80
                closestDist = dist;
                closestTarget = unit;
              }
            }
          });

          if (closestTarget) {
            chainedTargets.push(closestTarget);
            remainingChains--;
          } else {
            break; // No more targets in range
          }
        }

        // Apply damage and stun to all chained targets (except the first one which was already hit)
        chainedTargets.slice(1).forEach(target => {
          damageEvents.push({
            targetId: target.id,
            damage: event.damage,
            attackerId: event.attackerId
          });
          // Apply stun
          if (event.stun > 0) {
            const targetUnit = currentUnits.find(u => u.id === target.id);
            if (targetUnit) {
              targetUnit.stunUntil = Date.now() + (event.stun * 1000);
              targetUnit.wasStunned = true;
            }
          }
        });

        // Create visual effect for chain lightning
        if (chainedTargets.length > 1) {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'chain_lightning',
            targets: chainedTargets.map(t => ({ x: t.x, y: t.y })),
            startTime: Date.now(),
            duration: 400
          }]);
        }
      });

      let activeProjectiles = nextProjectiles.map(p => {
        let targetX = p.targetX;
        let targetY = p.targetY;

        if (!p.isSpell) {
          const isTargetTower = p.targetId < 100;
          if (isTargetTower) {
            const target = nextTowers.find(t => t.id === p.targetId);
            if (target) {
              targetX = target.x;
              targetY = target.y;
            }
          } else {
            const target = (unitsRef.current || []).find(u => u.id === p.targetId);
            if (target) {
              targetX = target.x;
              targetY = target.y;
            }
          }
        }

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (p.type === 'tesla_lightning') {
          return {
            ...p,
            targetX,
            targetY,
            hit: !p.damageDealt, // Only hit if not yet dealt damage
            keepVisual: true
          };
        }

        if (p.type === 'bomb_delayed') {
          if (Date.now() - p.spawnTime >= p.delay) {
            return { ...p, hit: true };
          }
          return p; // Keep waiting
        }

        // ROYAL DELIVERY: Handle falling movement and hit time
        // ROYAL DELIVERY: Handle arcing movement from King Tower
        if (p.isDelivery) {
          const progress = (Date.now() - p.spawnTime) / (p.duration * 1000);
          if (progress >= 1) {
            return { ...p, hit: true, x: p.targetX, y: p.targetY };
          }

          // Interpolate Ground Position (startX -> targetX, startY -> targetY)
          const startX = p.startX || p.targetX;
          const startY = p.startY || (p.targetY - 300);

          const currentGroundX = startX + (p.targetX - startX) * progress;
          const currentGroundY = startY + (p.targetY - startY) * progress;

          // Arc Height (Parabola): Peaks in middle
          // Height offset (visual Y) = -1 * (4 * maxHeight * progress * (1 - progress))
          // But Royal Delivery goes High and drops. Let's stick to standard arc.
          const arcHeight = 350; // Higher arc for delivery
          const heightOffset = 4 * arcHeight * progress * (1 - progress);

          // Visual Y = GroundY - HeightOffset
          return {
            ...p,
            x: currentGroundX,
            y: currentGroundY - heightOffset
          };
        }

        // MAGIC ARCHER PIERCE LOGIC
        if (p.pierce) {
          const angle = Math.atan2(dy, dx);
          const nextX = p.x + Math.cos(angle) * p.speed;
          const nextY = p.y + Math.sin(angle) * p.speed;
          const hitIds = p.hitIds || [];
          const maxHits = 5; // Maximum number of targets to pierce through

          // Check if projectile has traveled past its target by significant distance
          const distTraveled = Math.sqrt(Math.pow(nextX - p.x, 2) + Math.pow(nextY - p.y, 2));
          const totalDistTraveled = (p.totalDistTraveled || 0) + distTraveled;
          const distToTarget = Math.sqrt(Math.pow(p.targetX - p.x, 2) + Math.pow(p.targetY - p.y, 2));

          // Check for collisions
          const targets = [
            ...(unitsRef.current || []).filter(u => u.isOpponent !== p.isOpponent && u.hp > 0),
            ...(nextTowers || []).filter(t => t.isOpponent !== p.isOpponent && t.hp > 0)
          ];

          targets.forEach(t => {
            if (!hitIds.includes(t.id)) {
              const distToProj = Math.sqrt(Math.pow(t.x - nextX, 2) + Math.pow(t.y - nextY, 2));
              if (distToProj < 30) {
                // HIT!
                hitIds.push(t.id);
                // Apply damage immediately (since we want to hit multiple targets in one frame possibly)
                if (t.id < 100) {
                  const tIndex = nextTowers.findIndex(tow => tow.id === t.id);
                  if (tIndex !== -1) nextTowers[tIndex].hp -= p.damage;
                } else {
                  damageEvents.push({ targetId: t.id, damage: p.damage, attackerId: p.attackerId });
                }
              }
            }
          });

          // Remove projectile if:
          // 1. Hit max number of targets
          // 2. Traveled 100 pixels past target
          // 3. Out of bounds
          if (hitIds.length >= maxHits || (distToTarget < 100 && totalDistTraveled > distToTarget + 100) ||
            nextX < -50 || nextX > width + 50 || nextY < -50 || nextY > height + 50) {
            return { ...p, damageDealt: true, hit: true }; // Mark for removal
          }

          return { ...p, x: nextX, y: nextY, hitIds, totalDistTraveled };
        }

        if (dist < p.speed + 10) {
          return { ...p, hit: true };
        }

        const angle = Math.atan2(dy, dx);
        return {
          ...p,
          x: p.x + Math.cos(angle) * p.speed,
          y: p.y + Math.sin(angle) * p.speed,
          targetX,
          targetY
        };
      });

      const hits = activeProjectiles.filter(p => (p.hit && !p.damageDealt) || p.isPoison);
      if (hits.length > 0) {

        hits.forEach(h => {
          if (!h.isPoison) {
            h.damageDealt = true;
          }

          // Handle Log-type projectiles (The Log, Barb Barrel) BEFORE spell split
          if (h.isLog) {
            const logWidth = 40;
            const logStartY = h.logStartY || h.y;
            const logEndY = h.logEndY || h.targetY;
            const minX = h.x - logWidth / 2;
            const maxX = h.x + logWidth / 2;
            const minY = Math.min(logStartY, logEndY);
            const maxY = Math.max(logStartY, logEndY);

            currentUnits = currentUnits.map(u => {
              if (u.hp > 0) {
                const isEnemy = h.isOpponent !== undefined ? !h.isOpponent : u.isOpponent;
                if (isEnemy && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
                  let updatedUnit = { ...u, hp: u.hp - h.damage };
                  if (h.knockback && h.knockback > 0 && u.type !== 'building') {
                    const logDirection = logEndY > logStartY ? 1 : -1;
                    updatedUnit.y = u.y + (h.knockback * logDirection);
                    updatedUnit.y = Math.max(10, Math.min(height - 10, updatedUnit.y));
                    updatedUnit.wasPushed = true;
                  }
                  return updatedUnit;
                }
              }
              return u;
            });

            // Barb Barrel: spawn barbarian
            if (h.isBarrel && h.spawns) {
              const barbCard = CARDS.find(c => c.id === h.spawns);
              if (barbCard) {
                unitsToSpawn.push({
                  id: 'barb_from_barrel_' + Date.now(),
                  x: h.targetX,
                  y: h.targetY,
                  hp: barbCard.hp,
                  maxHp: barbCard.hp,
                  isOpponent: h.isOpponent,
                  speed: barbCard.speed,
                  lane: h.targetX < width / 2 ? 'LEFT' : 'RIGHT',
                  lastAttack: 0,
                  spriteId: barbCard.id,
                  type: barbCard.type,
                  range: barbCard.range,
                  damage: barbCard.damage,
                  attackSpeed: barbCard.attackSpeed,
                  spawnTime: Date.now()
                });
              }
            }
          } else if (h.isSpell) {
            // Handle spell effects (Fireball, Arrows, Zap, Poison)
            if (h.isPoison) {
              // Poison is special - stays on battlefield and ticks continuously
              // Check if poison has expired
              const poisonAge = (now - h.spawnTime) / 1000; // in seconds
              if (poisonAge < h.duration) {
                // Deal damage every second
                const lastTick = h.lastDamageTick || h.spawnTime;
                const timeSinceTick = (now - lastTick) / 1000;
                if (timeSinceTick >= 1) {
                  // Deal damage to all units in radius
                  currentUnits = currentUnits.map(u => {
                    const isEnemy = u.isOpponent !== (h.isOpponent || false);
                    const dist = Math.sqrt(Math.pow(u.x - h.x, 2) + Math.pow(u.y - h.y, 2));
                    if (isEnemy && dist < h.radius) {
                      return { ...u, hp: u.hp - h.damage };
                    }
                    return u;
                  });
                  // Deal damage to towers in radius
                  nextTowers = nextTowers.map(t => {
                    const isEnemy = t.isOpponent !== (h.isOpponent || false);
                    const dist = Math.sqrt(Math.pow(t.x - h.x, 2) + Math.pow(t.y - h.y, 2));
                    if (isEnemy && dist < h.radius + 30) {
                      const towerDamage = Math.floor(h.damage * 0.3); // 30% Crown Tower damage
                      return { ...t, hp: t.hp - towerDamage };
                    }
                    return t;
                  });                  // Update last tick time by modifying the projectile
                  h.lastDamageTick = now;
                }
              }
              // Poison will be filtered out after duration
            } else if (h.isRage) {
              // Rage Spell Logic
              const rageAge = (now - h.spawnTime) / 1000;
              if (rageAge < h.duration) {
                // Refresh rage effect on units in radius
                // Rage updates constantly (every tick)
                currentUnits = currentUnits.map(u => {
                  const isFriendly = u.isOpponent === (h.isOpponent || false);
                  const dist = Math.sqrt(Math.pow(u.x - h.x, 2) + Math.pow(u.y - h.y, 2));
                  if (isFriendly && dist < h.radius) {
                    return { ...u, rageUntil: now + 200 }; // Buffer of 200ms
                  }
                  return u;
                });
                // Rage towers
                nextTowers = nextTowers.map(t => {
                  const isFriendly = t.isOpponent === (h.isOpponent || false);
                  const dist = Math.sqrt(Math.pow(t.x - h.x, 2) + Math.pow(t.y - h.y, 2));
                  if (isFriendly && dist < h.radius + 30) {
                    return { ...t, rageUntil: now + 200 };
                  }
                  return t;
                });

                // Create persistent rage visual effect (recreated every frame to show continuous effect)
                if (!h.rageEffectCreated) {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'rage_aura',
                    x: h.x,
                    y: h.y,
                    radius: h.radius || 50,
                    startTime: Date.now(),
                    duration: h.duration * 1000
                  }]);
                  h.rageEffectCreated = true;
                }
              }
            } else if (h.isGoblinBarrel) {
              // Goblin Barrel hits - spawn goblins around impact point
              const spawnCardId = h.spawns;
              const spawnCard = CARDS.find(c => c.id === spawnCardId);
              const spawnCount = h.spawnCount || 3;


              if (spawnCard) {
                const newGoblins = [];
                const lane = h.targetX < width / 2 ? 'LEFT' : 'RIGHT';

                for (let i = 0; i < spawnCount; i++) {
                  // Spawn goblins in a circle around the impact point
                  const angle = (i / spawnCount) * Math.PI * 2;
                  const distance = 30 + Math.random() * 20; // 30-50 pixels from center
                  const offsetX = Math.cos(angle) * distance;
                  const offsetY = Math.sin(angle) * distance;

                  newGoblins.push({
                    id: Date.now() + i,
                    x: h.targetX + offsetX,
                    y: h.targetY + offsetY,
                    hp: spawnCard.hp,
                    maxHp: spawnCard.hp,
                    isOpponent: h.isOpponent || false,
                    speed: spawnCard.speed,
                    lane: lane,
                    lastAttack: 0,
                    spriteId: spawnCard.id,
                    type: spawnCard.type,
                    range: spawnCard.range,
                    damage: spawnCard.damage,
                    attackSpeed: spawnCard.attackSpeed,
                    projectile: spawnCard.projectile,
                    lockedTarget: null,
                    wasPushed: false,
                    wasStunned: false,
                    stunUntil: 0,
                    baseDamage: spawnCard.damage
                  });
                }

                // Add goblins to queue (don't setUnits directly to avoid overwrite)
                unitsToSpawn.push(...newGoblins);

                // Visual effect for barrel break
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'goblin_barrel_spawn',
                  x: h.targetX,
                  y: h.targetY,
                  radius: 20,
                  startTime: Date.now(),
                  duration: 500
                }]);
              }
            } else {
              // Other spells (Fireball, Arrows, Zap, Earthquake) - one-time damage
              currentUnits = currentUnits.map(u => {
                const isEnemy = u.isOpponent !== (h.isOpponent || false);
                const dist = Math.sqrt(Math.pow(u.x - h.targetX, 2) + Math.pow(u.y - h.targetY, 2));
                if (isEnemy && dist < h.radius) {
                  let damageToDeal = h.damage;

                  // Earthquake: 3.5x damage to buildings (speed === 0 means building)
                  if (h.type === 'earthquake_spell' && u.speed === 0) {
                    damageToDeal = Math.floor(h.damage * 3.5);
                  }

                  // Handle Shield
                  let remainingDamage = damageToDeal;
                  let newShieldHp = u.currentShieldHp || 0;
                  let shieldBroken = false;

                  if (u.hasShield && newShieldHp > 0) {
                    if (remainingDamage >= newShieldHp) {
                      remainingDamage -= newShieldHp;
                      newShieldHp = 0;
                      shieldBroken = true;
                    } else {
                      newShieldHp -= remainingDamage;
                      remainingDamage = 0;
                    }
                  }

                  let updatedUnit = { ...u, hp: u.hp - remainingDamage, currentShieldHp: newShieldHp };

                  // Shield Break Visual
                  if (shieldBroken) {
                    updatedUnit.hasShield = false;
                    if (u.spriteId === 'guards') updatedUnit.spriteId = 'skeletons';
                    setVisualEffects(prev => [...prev, {
                      id: Date.now() + Math.random(),
                      type: 'shield_break',
                      x: u.x,
                      y: u.y,
                      radius: 35,
                      startTime: Date.now(),
                      duration: 500
                    }]);
                  }

                  // Zap stun effect - resets charge ONLY when stunned
                  if (h.stun && h.stun > 0) {
                    updatedUnit.stunUntil = now + (h.stun * 1000);
                    // Reset charge if Prince gets stunned
                    if (u.charge) {
                      updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                    }
                  }

                  // Apply slow effect (Earthquake, Ice Wizard)
                  if (h.slow && h.slow > 0) {
                    updatedUnit.slowUntil = now + 2000; // Slow lasts 2s
                    updatedUnit.slowAmount = h.slow;
                  }

                  return updatedUnit;
                }
                return u;
              });
              nextTowers = nextTowers.map(t => {
                const isEnemy = t.isOpponent !== (h.isOpponent || false);
                const dist = Math.sqrt(Math.pow(t.x - h.targetX, 2) + Math.pow(t.y - h.targetY, 2));
                if (isEnemy && dist < h.radius + 30) {
                  let damageToDeal = Math.floor(h.damage * 0.3); // 30% Crown Tower damage

                  // Earthquake exception: higher relative tower damage
                  if (h.type === 'earthquake_spell') {
                    damageToDeal = Math.floor(h.damage * 0.35);
                  }

                  return { ...t, hp: t.hp - damageToDeal };
                }
                return t;
              });
              // Create visual effects for spells
              if (h.type === 'fireball_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'fireball_explosion',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 60,
                  startTime: Date.now(),
                  duration: 600
                }]);
              } else if (h.type === 'zap_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'zap_impact',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 35,
                  startTime: Date.now(),
                  duration: 400
                }]);
              } else if (h.type === 'arrows_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'arrows_impact',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 40,
                  startTime: Date.now(),
                  duration: 500
                }]);
              } else if (h.type === 'poison_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'poison_cloud',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 50,
                  startTime: Date.now(),
                  duration: 5000
                }]);
              } else if (h.type === 'rocket_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'rocket_explosion',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 30,
                  startTime: Date.now(),
                  duration: 800
                }]);
              } else if (h.type === 'earthquake_spell') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'earthquake_crack',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 70,
                  startTime: Date.now(),
                  duration: 1000
                }]);
              } else if (h.type === 'lightning_bolt') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'lightning_strike',
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 50,
                  startTime: Date.now(),
                  duration: 500
                }]);
              } else if (h.type === 'bomb_delayed') {
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'fire_explosion', // Bomb explosion
                  x: h.targetX,
                  y: h.targetY,
                  radius: h.radius || 60,
                  startTime: Date.now(),
                  duration: 600
                }]);
              } else if (h.type === 'the_log') {
                // The Log impact - dirt trail and impact effect
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'log_impact',
                  x: h.targetX,
                  y: h.targetY,
                  radius: 40,
                  startTime: Date.now(),
                  duration: 600
                }]);
              } else if (h.isDelivery) {
                // ROYAL DELIVERY: Splash damage (hits AIR too) + Spawn Recruit
                // Deal splash damage to all enemies in radius
                currentUnits = currentUnits.map(u => {
                  if (u.isOpponent !== h.isOpponent && u.hp > 0) {
                    const dist = Math.sqrt(Math.pow(u.x - h.x, 2) + Math.pow(u.y - h.y, 2));
                    if (dist <= (h.radius || 45)) {
                      // Knockback away from impact center
                      let newX = u.x;
                      let newY = u.y;
                      if (h.knockback && u.type !== 'building') {
                        const angle = Math.atan2(u.y - h.y, u.x - h.x);
                        newX = u.x + Math.cos(angle) * h.knockback;
                        newY = u.y + Math.sin(angle) * h.knockback;
                      }
                      return {
                        ...u,
                        hp: u.hp - h.damage,
                        x: newX,
                        y: newY,
                        wasPushed: true
                      };
                    }
                  }
                  return u;
                });

                // Apply damage to towers
                nextTowers = nextTowers.map(t => {
                  if (t.isOpponent !== h.isOpponent && t.hp > 0) {
                    const dist = Math.sqrt(Math.pow(t.x - h.x, 2) + Math.pow(t.y - h.y, 2));
                    if (dist <= (h.radius || 45)) {
                      return { ...t, hp: t.hp - h.damage };
                    }
                  }
                  return t;
                });

                // Visual effect for impact
                setVisualEffects(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  type: 'royal_delivery',
                  x: h.x,
                  y: h.y,
                  radius: h.radius || 45,
                  startTime: Date.now(),
                  duration: 500
                }]);

                // Spawn Royal Recruit
                if (h.spawns) {
                  const recruitCard = CARDS.find(c => c.id === h.spawns) || CARDS.find(c => c.id === 'knight');
                  if (recruitCard) {
                    unitsToSpawn.push({
                      id: 'royal_recruit_' + Date.now() + '_' + Math.random(),
                      x: h.x,
                      y: h.y,
                      hp: recruitCard.hp,
                      maxHp: recruitCard.hp,
                      shieldHp: recruitCard.shieldHp,
                      maxShieldHp: recruitCard.shieldHp,
                      isOpponent: h.isOpponent,
                      speed: recruitCard.speed,
                      lane: h.x < width / 2 ? 'LEFT' : 'RIGHT',
                      lastAttack: 0,
                      spriteId: h.spawns,
                      type: recruitCard.type,
                      range: recruitCard.range,
                      damage: recruitCard.damage,
                      attackSpeed: recruitCard.attackSpeed,
                      hasShield: recruitCard.hasShield,
                      spawnTime: Date.now() - 2000
                    });
                  }
                }
              }
            }

          } else {
            // Handle projectile hits (arrows, bullets, fireballs)
            const hitX = h.targetX;
            const hitY = h.targetY;

            // ELECTRO DRAGON CHAIN LOGIC
            if (h.chain > 0) {
              const target = (unitsRef.current || []).find(u => u.id === h.targetId) ||
                (nextTowers || []).find(t => t.id === h.targetId);
              if (target) {
                chainEvents.push({
                  attackerId: h.attackerId,
                  primaryTarget: target,
                  chainCount: Math.min(h.chain - 1, 3), // Max 3 more
                  damage: h.damage,
                  stun: h.stun || 0,
                  isOpponent: h.isOpponent,
                  startX: h.x,
                  startY: h.y
                });
              }
            }


            // Damage the primary target
            currentUnits = currentUnits.map(u => {
              if (u.id === h.targetId) {
                // Handle Shield
                let remainingDamage = h.damage;
                let newShieldHp = u.currentShieldHp || 0;
                let shieldBroken = false;

                if (u.hasShield && newShieldHp > 0) {
                  if (remainingDamage >= newShieldHp) {
                    remainingDamage -= newShieldHp;
                    newShieldHp = 0;
                    shieldBroken = true;
                  } else {
                    newShieldHp -= remainingDamage;
                    remainingDamage = 0;
                  }
                }

                let updatedUnit = { ...u, hp: u.hp - remainingDamage, currentShieldHp: newShieldHp };

                // Shield Break Visual
                if (shieldBroken) {
                  updatedUnit.hasShield = false;
                  if (u.spriteId === 'guards') updatedUnit.spriteId = 'skeletons';
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'shield_break',
                    x: u.x,
                    y: u.y,
                    radius: 35,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }

                // Apply stun effect (Electro Wizard)
                if (h.stun && h.stun > 0) {
                  updatedUnit.stunUntil = now + (h.stun * 1000);
                  // Reset charge if Prince gets stunned
                  if (u.charge) {
                    updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                  }
                }

                // Apply slow effect (Ice Wizard)
                if (h.slow && h.slow > 0) {
                  updatedUnit.slowUntil = now + 2000;
                  updatedUnit.slowAmount = h.slow;
                }

                // Electro Giant Shock Aura - if attacker is in Electro Giant's aura, shock them
                if (h.attackerId) {
                  // Find all Electro Giants and check if attacker is in their aura
                  const electroGiants = currentUnits.filter(eg =>
                    eg.spriteId === 'electro_giant' &&
                    eg.hp > 0 &&
                    eg.isOpponent !== u.isOpponent // Enemy Electro Giant
                  );

                  electroGiants.forEach(eg => {
                    const distToGiant = Math.sqrt(Math.pow(u.x - eg.x, 2) + Math.pow(u.y - eg.y, 2));
                    const shockRadius = eg.shockRadius || 50;

                    if (distToGiant <= shockRadius) {
                      // Attacker is in Electro Giant's aura - shock them!
                      updatedUnit.hp -= (eg.shockDamage || 100);
                      updatedUnit.stunUntil = now + ((eg.shockStun || 0.5) * 1000);

                      // Reset charge if Prince gets shocked
                      if (u.charge) {
                        updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                      }

                      // Sparking visual effect
                      setVisualEffects(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        type: 'electro_giant_shock',
                        x: u.x,
                        y: u.y,
                        radius: 40,
                        startTime: Date.now(),
                        duration: 500
                      }]);
                    }
                  });
                }

                // Mother Witch curse - marks enemy for 5 seconds
                if (h.turnsToPig && !u.isPig && u.type !== 'building') {
                  updatedUnit.cursedUntil = now + 5000;
                  updatedUnit.cursedByAttackerSide = h.isOpponent; // Track which side cursed them
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'curse',
                    x: u.x,
                    y: u.y,
                    startTime: Date.now(),
                    duration: 500
                  }]);
                }
                return updatedUnit;
              }
              return u;
            });

            // Apply splash damage if projectile has splash
            if (h.splash) {
              const splashRadius = h.splashRadius || 50; // Use projectile's splashRadius or default 50
              currentUnits = currentUnits.map(u => {
                if (u.id !== h.targetId && u.hp > 0) {
                  const isEnemy = h.isOpponent !== undefined ? !h.isOpponent : u.isOpponent;
                  if (isEnemy) {
                    const dist = Math.sqrt(Math.pow(u.x - hitX, 2) + Math.pow(u.y - hitY, 2));
                    if (dist <= splashRadius) {
                      let updatedUnit = { ...u, hp: u.hp - Math.floor(h.damage * 0.5) };

                      // Apply knockback (Fireball)
                      if (h.knockback && h.knockback > 0 && u.type !== 'building') {
                        const angle = Math.atan2(u.y - h.y || hitY, u.x - h.x || hitX);
                        let newX = u.x + Math.cos(angle) * h.knockback;
                        let newY = u.y + Math.sin(angle) * h.knockback;

                        // River collision during knockback
                        const rY = height / 2;
                        const distR = Math.abs(newY - rY);
                        const bW = 60;
                        const lBX = 95;
                        const rBX = width - 95;
                        const onB = (Math.abs(newX - lBX) < bW / 2) || (Math.abs(newX - rBX) < bW / 2);

                        const isFlyingOrJumping = u.jumps || u.type === 'flying';
                        if (distR < 25 && !onB && !isFlyingOrJumping) {
                          newY = rY + (u.y < rY ? -25 : 25);
                        }

                        updatedUnit.x = Math.max(10, Math.min(width - 10, newX));
                        updatedUnit.y = Math.max(10, Math.min(height - 10, newY));
                        updatedUnit.wasPushed = true;
                      }

                      // Apply stun effect (Electro Wizard)
                      if (h.stun && h.stun > 0) {
                        updatedUnit.stunUntil = now + (h.stun * 1000);
                        // Reset charge if Prince gets stunned
                        if (u.charge) {
                          updatedUnit.charge = { ...u.charge, distance: 0, active: false };
                        }
                      }

                      // Apply slow effect (Ice Wizard)
                      if (h.slow && h.slow > 0) {
                        updatedUnit.slowUntil = now + 2000;
                        updatedUnit.slowAmount = h.slow;
                      }

                      // Mother Witch curse - marks enemy for 5 seconds
                      if (h.turnsToPig && !u.isPig && u.type !== 'building') {
                        updatedUnit.cursedUntil = now + 5000;
                        updatedUnit.cursedByAttackerSide = h.isOpponent;
                        setVisualEffects(prev => [...prev, {
                          id: Date.now() + Math.random(),
                          type: 'curse',
                          x: u.x,
                          y: u.y,
                          startTime: Date.now(),
                          duration: 500
                        }]);
                      }
                      return updatedUnit;
                    }
                  }
                }
                return u;
              });
            }

            // Also damage towers (primary target)
            if (h.targetId < 100) {
              const tIndex = nextTowers.findIndex(t => t.id === h.targetId);
              if (tIndex !== -1) {
                const tower = nextTowers[tIndex];
                let damageToDeal = h.damage;
                if (h.isSpell) damageToDeal = Math.floor(damageToDeal * 0.3); // 30% for spells

                let updatedTower = { ...tower, hp: tower.hp - damageToDeal };

                // Tower hit visual effect for significant damage
                if (damageToDeal > 15) {
                  setVisualEffects(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'tower_hit',
                    x: tower.x,
                    y: tower.y,
                    radius: 40,
                    startTime: Date.now(),
                    duration: 200
                  }]);
                }

                // Apply stun effect (Electro Wizard) to towers
                if (h.stun && h.stun > 0) {
                  updatedTower.stunUntil = now + (h.stun * 1000);
                }

                // Apply slow effect (Ice Wizard) to towers
                if (h.slow && h.slow > 0) {
                  updatedTower.slowUntil = now + 2000;
                  updatedTower.slowAmount = h.slow;
                }

                nextTowers[tIndex] = updatedTower;
              }

              // Apply splash damage to OTHER towers (not primary target)
              if (h.splash) {
                const splashRadius = h.splashRadius || 50;
                nextTowers = nextTowers.map(tower => {
                  if (tower.id !== h.targetId && tower.hp > 0) {
                    const isEnemy = h.isOpponent !== undefined ? !h.isOpponent : tower.isOpponent;
                    if (isEnemy) {
                      const dist = Math.sqrt(Math.pow(tower.x - hitX, 2) + Math.pow(tower.y - hitY, 2));
                      if (dist <= splashRadius + 30) { // +30 for tower size
                        let damageToDeal = Math.floor(h.damage * 0.5);
                        if (h.isSpell) damageToDeal = Math.floor(damageToDeal * 0.3); // 30% reduction for spells

                        let updatedTower = { ...tower, hp: tower.hp - damageToDeal };

                        // Apply stun effect to towers
                        if (h.stun && h.stun > 0) {
                          updatedTower.stunUntil = now + (h.stun * 1000);
                        }

                        // Apply slow effect to towers
                        if (h.slow && h.slow > 0) {
                          updatedTower.slowUntil = now + 2000;
                          updatedTower.slowAmount = h.slow;
                        }

                        return updatedTower;
                      }
                    }
                  }
                  return tower;
                });
              }
            }
          }
        });

        // Remove hit projectiles, but keep poison, rage, and tornado visual-only projectiles
        activeProjectiles = activeProjectiles.filter(p => {
          if (p.keepVisual && p.type === 'tesla_lightning') {
            return (now - Math.floor(p.id)) < 150;
          }
          if (p.isPoison || p.isRage || p.isTornado) {
            return ((now - p.spawnTime) / 1000 < p.duration);
          }
          return !p.hit;
        });

        // Process tornado pull effect on enemies
        activeProjectiles.filter(p => p.isTornado && (now - p.spawnTime) / 1000 < p.duration).forEach(tornado => {
          const pullRadius = tornado.radius || 60;
          const pullStrengthPerTick = 2; // Fixed pull strength per tick (not using delta)

          // Pull enemy units toward tornado center
          currentUnits = currentUnits.map(unit => {
            if (unit.isOpponent !== tornado.isOpponent && unit.hp > 0) {
              const dx = unit.x - tornado.x;
              const dy = unit.y - tornado.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist <= pullRadius && dist > 5) {
                // Pull toward center
                const pullX = -dx / dist * pullStrengthPerTick;
                const pullY = -dy / dist * pullStrengthPerTick;
                return {
                  ...unit,
                  x: unit.x + pullX,
                  y: unit.y + pullY,
                  hp: unit.hp - 1 // Small fixed damage per tick
                };
              }
            }
            return unit;
          });
        });

        // Process rage zone continuous refresh - units inside get rageUntil refreshed
        activeProjectiles.filter(p => p.isRage && (now - p.spawnTime) / 1000 < p.duration).forEach(rageZone => {
          const rageRadius = rageZone.radius || 60;
          const remainingDuration = (rageZone.duration * 1000) - (now - rageZone.spawnTime);
          const rageBoost = rageZone.rageBoost || 0.35;

          // Refresh rage for all friendly units in radius
          currentUnits = currentUnits.map(unit => {
            if (unit.isOpponent === rageZone.isOpponent && unit.hp > 0) {
              const dx = unit.x - rageZone.x;
              const dy = unit.y - rageZone.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist <= rageRadius) {
                // Refresh rage - extend rageUntil to remaining zone duration + buffer
                const newRageUntil = now + Math.min(remainingDuration + 500, 2000);
                return {
                  ...unit,
                  rageUntil: Math.max(unit.rageUntil || 0, newRageUntil),
                  rageBoost: rageBoost
                };
              }
            }
            return unit;
          });
        });
      }

      activeProjectiles = activeProjectiles.filter(p =>
        p.x > -50 && p.x < width + 50 && p.y > -50 && p.y < height + 50
      );

      nextTowers = nextTowers.map(tower => {
        if (tower.hp <= 0) return tower;

        let isActive = true;
        if (tower.type === 'king') {
          const isDamaged = tower.hp < tower.maxHp;
          const mySideTowers = nextTowers.filter(t => t.isOpponent === tower.isOpponent && t.type === 'princess');
          const lostPrincess = mySideTowers.some(t => t.hp <= 0);
          if (!isDamaged && !lostPrincess) {
            isActive = false;
          }
        }
        if (!isActive) return tower;

        // Check if tower is stunned - can't attack while stunned
        const isStunned = tower.stunUntil && now < tower.stunUntil;
        if (isStunned) return tower;

        if (now - tower.lastShot < (tower.type === 'king' ? FIRE_RATE_KING : FIRE_RATE_PRINCESS)) return tower;

        const targets = currentUnits.filter(u => u.isOpponent !== tower.isOpponent);
        let closestTarget = null;
        let minDist = Infinity;

        targets.forEach(u => {
          const dist = Math.sqrt(Math.pow(u.x - tower.x, 2) + Math.pow(u.y - tower.y, 2));
          if (dist <= tower.range && dist < minDist) {
            minDist = dist;
            closestTarget = u;
          }
        });

        if (closestTarget) {
          activeProjectiles.push({
            id: now + Math.random(),
            x: tower.x,
            y: tower.y,
            targetId: closestTarget.id,
            targetX: closestTarget.x,
            targetY: closestTarget.y,
            speed: tower.type === 'king' ? PROJECTILE_SPEED_CANNON : PROJECTILE_SPEED_ARROW,
            damage: 125,
            type: tower.type === 'king' ? 'cannon' : 'arrow'
          });
          return { ...tower, lastShot: now };
        }
        return tower;
      });



      // Apply unit-vs-unit damage events
      if (damageEvents.length > 0) {
        currentUnits = currentUnits.map(u => {
          const events = damageEvents.filter(e => e.targetId === u.id);
          if (events.length > 0) {
            const totalDamage = events.reduce((sum, e) => sum + e.damage, 0);
            // Also reset charge if taking damage
            const updatedCharge = u.charge ? { ...u.charge, distance: 0, active: false } : u.charge;

            // Handle shield absorption (Guards, Dark Prince)
            let remainingDamage = totalDamage;
            let newShieldHp = u.currentShieldHp || 0;
            let shieldBroken = false;

            if (u.hasShield && newShieldHp > 0) {
              if (remainingDamage >= newShieldHp) {
                remainingDamage -= newShieldHp;
                newShieldHp = 0;
                shieldBroken = true;
              } else {
                newShieldHp -= remainingDamage;
                remainingDamage = 0;
              }
            }

            // Bandit dash invincibility - no damage while dashing
            if (u.dashInvincible && u.isDashing) {
              remainingDamage = 0;
            }

            // Royal Ghost hidden invincibility - no damage while invisible
            if (u.hidden && u.hidden.active) {
              remainingDamage = 0;
            }

            // Miner burrowing invincibility - no damage while burrowing
            if (u.burrowing && u.burrowing.active) {
              remainingDamage = 0;
            }

            const updatedUnit = {
              ...u,
              hp: u.hp - remainingDamage,
              currentShieldHp: newShieldHp,
              charge: updatedCharge
            };

            // If shield just broke, Guards transform to skeletons (Dark Prince just loses shield)
            if (shieldBroken) {
              updatedUnit.hasShield = false;

              // Guards transform to regular skeletons when shield breaks
              if (u.spriteId === 'guards') {
                updatedUnit.spriteId = 'skeletons';
              }

              // Trigger shield break visual effect
              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'shield_break',
                x: u.x,
                y: u.y,
                radius: 35,
                startTime: Date.now(),
                duration: 500
              }]);
            }

            return updatedUnit;
          }
          return u;
        });
      }

      // Filter dead units and process death spawns (after ALL damage has been applied)
      const unitsThatDied = [];
      currentUnits = currentUnits.filter(u => {
        if (u.hp <= 0) {
          unitsThatDied.push(u);
          return false;
        }
        return true;
      });

      // Handle death spawns
      unitsThatDied.forEach(deadUnit => {
        console.log('[DEATH]', deadUnit.spriteId, 'deathSpawns:', deadUnit.deathSpawns);

        // Goblin Hut death spawn - 3 Spear Goblins
        if (deadUnit.spriteId === 'goblin_hut' && deadUnit.isOpponent === false) {
          const spawnCard = CARDS.find(c => c.id === 'spear_goblins');
          if (spawnCard) {
            const newGoblins = [];
            for (let i = 0; i < 3; i++) {
              const angle = (i / 3) * Math.PI * 2;
              const distance = 30 + Math.random() * 20;
              const offsetX = Math.cos(angle) * distance;
              const offsetY = Math.sin(angle) * distance;

              newGoblins.push({
                id: Date.now() + Math.random() * 1000 + i,
                x: deadUnit.x + offsetX,
                y: deadUnit.y + offsetY,
                hp: spawnCard.hp,
                maxHp: spawnCard.hp,
                isOpponent: deadUnit.isOpponent,
                speed: spawnCard.speed,
                lane: deadUnit.lane,
                lastAttack: now,
                spriteId: spawnCard.id,
                type: spawnCard.type,
                range: spawnCard.range,
                damage: spawnCard.damage,
                attackSpeed: spawnCard.attackSpeed,
                projectile: spawnCard.projectile,
                lockedTarget: null,
                wasPushed: false,
                wasStunned: false,
                stunUntil: 0,
                baseDamage: spawnCard.damage
              });
            }
            unitsToSpawn.push(...newGoblins);

            // Goblin Hut destruction visual effect
            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'building_destruction',
              x: deadUnit.x,
              y: deadUnit.y,
              radius: 60,
              startTime: Date.now(),
              duration: 800
            }]);
          }
        }

        // Lumberjack death - drops Rage spell
        if (deadUnit.deathRage && deadUnit.spriteId === 'lumberjack') {
          setProjectiles(prev => [...prev, {
            id: Date.now() + Math.random(),
            x: deadUnit.x,
            y: deadUnit.y,
            targetX: deadUnit.x,
            targetY: deadUnit.y,
            speed: 0,
            damage: 0,
            radius: 50,
            type: 'rage_spell',
            isSpell: true,
            isRage: true,
            hit: true,
            spawnTime: now,
            duration: 6,
            isOpponent: deadUnit.isOpponent
          }]);
        }

        // Generic Death Spawns (Skeleton Barrel, Tombstone, Lava Hound, Golem, Elixir Golem)
        if (deadUnit.spriteId === 'tombstone' || deadUnit.deathSpawns) {
          let spawnId = deadUnit.deathSpawns || 'skeletons';
          const spawnCard = CARDS.find(c => c.id === spawnId);

          console.log('[DEATH SPAWN]', deadUnit.spriteId, '→', spawnId, 'x', deadUnit.deathSpawnCount);

          if (spawnCard) {
            const deathSpawnCount = deadUnit.deathSpawnCount || 4;
            for (let i = 0; i < deathSpawnCount; i++) {
              const angle = (i / deathSpawnCount) * Math.PI * 2 + Math.random() * 0.5;
              const distance = 15 + Math.random() * 20;
              const offsetX = Math.cos(angle) * distance;
              const offsetY = Math.sin(angle) * distance;

              // Clamp spawn position to map bounds to prevent spawned units from going off-map
              const spawnX = Math.max(20, Math.min(width - 20, deadUnit.x + offsetX));
              const spawnY = Math.max(20, Math.min(height - 20, deadUnit.y + offsetY));

              unitsToSpawn.push({
                id: Date.now() + Math.random() * 1000 + i,
                x: spawnX,
                y: spawnY,
                hp: spawnCard.hp,
                maxHp: spawnCard.hp,
                isOpponent: deadUnit.isOpponent,
                speed: spawnCard.speed,
                lane: deadUnit.lane,
                lastAttack: 0,
                spriteId: spawnCard.id,
                type: spawnCard.type,
                range: spawnCard.range,
                damage: spawnCard.damage,
                attackSpeed: spawnCard.attackSpeed,
                projectile: spawnCard.projectile,
                targetType: spawnCard.targetType,
                lockedTarget: null,
                wasPushed: false,
                wasStunned: false,
                stunUntil: 0,
                baseDamage: spawnCard.damage,
                spawnTime: Date.now(),
                spawnDelay: spawnCard.spawnDelay || 0,
                splash: spawnCard.splash || false,
                frontalSplash: spawnCard.frontalSplash || false,
                hasShield: spawnCard.hasShield || false,
                currentShieldHp: spawnCard.shieldHp || 0,
                shieldHp: spawnCard.shieldHp || 0,
                deathSpawns: spawnCard.deathSpawns,
                deathSpawnCount: spawnCard.deathSpawnCount,
                deathDamage: spawnCard.deathDamage,
                deathRadius: spawnCard.deathRadius,
                deathSlow: spawnCard.deathSlow,
                givesOpponentElixir: spawnCard.givesOpponentElixir || false,
                bombDrops: spawnCard.bombDrops || false,
                turnsToPig: spawnCard.turnsToPig || false
              });
            }
          }
        }

        // Phoenix - revive as egg on death
        if (deadUnit.revivesAsEgg && deadUnit.eggHp > 0) {
          const eggCard = CARDS.find(c => c.id === 'phoenix_egg');
          if (eggCard) {
            const hatchTime = Date.now() + (deadUnit.eggDuration || 3000);
            unitsToSpawn.push({
              id: 'phoenix_egg_' + Date.now(),
              x: deadUnit.x,
              y: deadUnit.y,
              hp: deadUnit.eggHp,
              maxHp: deadUnit.eggHp,
              isOpponent: deadUnit.isOpponent,
              speed: 0,
              type: 'ground',
              range: 0,
              damage: 0,
              attackSpeed: 0,
              projectile: null,
              lane: deadUnit.lane,
              lastAttack: 0,
              spriteId: 'phoenix_egg',
              isToken: true,
              spawnTime: Date.now(),
              hatchTime: hatchTime,
              hatchesInto: 'phoenix',
              hatchDuration: deadUnit.eggDuration || 3000,
              revivesAsEgg: false
            });
          }
        }

        // Death visual effects
        if (deadUnit.spriteId === 'golem' || deadUnit.spriteId === 'golemite' || deadUnit.spriteId === 'elixir_golem' || deadUnit.spriteId === 'elixir_golemite') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'golem_death',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: deadUnit.spriteId.includes('elixir') ? 60 : 80,
            startTime: Date.now(),
            duration: 1000
          }]);
        } else if (deadUnit.spriteId === 'lava_hound') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'lava_hound_death',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: 100,
            startTime: Date.now(),
            duration: 1500
          }]);
        } else if (deadUnit.spriteId === 'tombstone') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'building_destruction',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: 50,
            startTime: Date.now(),
            duration: 800
          }]);
        } else if (deadUnit.spriteId === 'skeleton_barrel') {
          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'goblin_barrel_spawn',
            x: deadUnit.x,
            y: deadUnit.y,
            radius: 40,
            startTime: Date.now(),
            duration: 500
          }]);
        }

        // Death Damage (Ice Golem, Golem)
        if (deadUnit.deathDamage || deadUnit.spriteId === 'ice_golem') {
          const cardDef = CARDS.find(c => c.id === deadUnit.spriteId);

          if (cardDef && (cardDef.deathDamage || cardDef.deathSlow)) {
            if (cardDef.deathBombDelay) {
              // Delayed Death Bomb (Balloon, Giant Skeleton)
              setProjectiles(prev => [...prev, {
                id: Date.now() + Math.random(),
                x: deadUnit.x,
                y: deadUnit.y,
                targetX: deadUnit.x,
                targetY: deadUnit.y,
                speed: 0,
                damage: cardDef.deathDamage || 0,
                radius: cardDef.deathRadius || 60,
                type: 'bomb_delayed',
                visualType: 'bomb',
                isSpell: true,
                hit: false,
                spawnTime: Date.now(),
                delay: cardDef.deathBombDelay,
                isOpponent: deadUnit.isOpponent
              }]);

              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: 'bomb_drop',
                x: deadUnit.x,
                y: deadUnit.y,
                radius: 20,
                startTime: Date.now(),
                duration: 500
              }]);
            } else {
              // Instant Death Damage (Ice Golem, Golem)
              splashEvents.push({
                attacker: deadUnit,
                targetX: deadUnit.x,
                targetY: deadUnit.y,
                damage: cardDef.deathDamage || 0,
                slow: cardDef.deathSlow
              });

              let effectType = 'fire_explosion';
              let effectRadius = cardDef.deathRadius || 40;

              if (deadUnit.spriteId === 'ice_golem') {
                effectType = 'ice_nova';
                effectRadius = 80;
              }

              setVisualEffects(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: effectType,
                x: deadUnit.x,
                y: deadUnit.y,
                radius: effectRadius,
                startTime: Date.now(),
                duration: 800
              }]);
            }
          }
        }

        // Elixir Return (Elixir Golem chain)
        if (deadUnit.givesOpponentElixir) {
          if (deadUnit.isOpponent) {
            setElixir(prev => Math.min(10, prev + 1));
          } else {
            setEnemyElixir(prev => Math.min(10, prev + 1));
          }

          setVisualEffects(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'elixir_popup',
            x: deadUnit.x,
            y: deadUnit.y - 20,
            value: '+1',
            startTime: Date.now(),
            duration: 800
          }]);
        }

        // Mother Witch: If cursed unit dies, spawn Hog for the attacker
        if (deadUnit.cursedUntil && Date.now() < deadUnit.cursedUntil && deadUnit.type !== 'building') {
          const hogCard = CARDS.find(c => c.id === 'cursed_hog');
          if (hogCard) {
            const hogIsOpponent = deadUnit.cursedByAttackerSide;

            unitsToSpawn.push({
              id: 'hog_' + Date.now() + '_' + Math.random(),
              spriteId: 'cursed_hog',
              x: deadUnit.x,
              y: deadUnit.y,
              hp: hogCard.hp,
              maxHp: hogCard.hp,
              damage: hogCard.damage,
              speed: hogCard.speed,
              range: hogCard.range,
              attackSpeed: hogCard.attackSpeed,
              lastAttack: 0,
              type: 'ground',
              targetable: true,
              isOpponent: hogIsOpponent,
              lane: deadUnit.lane,
              spawnedPig: true
            });

            setVisualEffects(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'transformation',
              x: deadUnit.x,
              y: deadUnit.y,
              startTime: Date.now(),
              duration: 500
            }]);
          }
        }
      });

      // Show purple circle visual above all currently cursed units
      currentUnits.forEach(unit => {
        if (unit.cursedUntil && Date.now() < unit.cursedUntil && !unit.isPig && unit.type !== 'building') {
          // Create/update purple circle visual for this cursed unit
          // We use a unique ID based on unit ID to avoid duplicates
          const curseVisualId = `curse_${unit.id}`;
          // Only add if not already present (check existing visuals)
          setVisualEffects(prev => {
            // Filter out old curse visuals for this unit
            const filtered = prev.filter(v => v.id !== curseVisualId);
            // Add new curse visual that will last 100ms (refreshed each frame)
            return [...filtered, {
              id: curseVisualId,
              type: 'curse_purple',
              x: unit.x,
              y: unit.y - 20,
              radius: 25,
              startTime: Date.now(),
              duration: 100
            }];
          });
        }
      });

      // Update state
      const allUnits = [...currentUnits, ...unitsToSpawn];
      setUnits(allUnits);
      setProjectiles(activeProjectiles);
      setTowers(nextTowers);

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

  // Enemy AI - Play Cards Automatically
  useEffect(() => {
    if (!inGame || gameOver) return;

    const aiInterval = setInterval(() => {
      const currentElixir = enemyElixirRef.current;
      const currentHand = enemyHandRef.current || [];
      const allUnits = unitsRef.current || [];
      const playerUnits = allUnits.filter(u => !u.isOpponent && u.hp > 0);
      const enemyUnits = allUnits.filter(u => u.isOpponent && u.hp > 0);
      const enemyTowers = towersRef.current.filter(t => t.isOpponent && t.hp > 0);
      const playerTowers = towersRef.current.filter(t => !t.isOpponent && t.hp > 0);

      if (!currentHand.length) return;

      // --- DECK STRATEGY SETTINGS ---
      const deckType = enemyDeckIndex; // 0: Hog, 1: Bait, 2: BridgeSpam, 3: Golem, 4: Giant
      let elixirThreshold = 5; // Default: play cards at 5 elixir

      if (deckType === 3) elixirThreshold = 9.5; // Golem AI waits for max elixir
      if (deckType === 2) elixirThreshold = 7;   // Bridge Spam waits for decent elixir
      if (deckType === 0) elixirThreshold = 4;   // Hog Cycle plays fast

      // Always defend if under attack
      const isUnderAttack = playerUnits.some(u => u.y < height / 2 + 100);
      if (isUnderAttack) elixirThreshold = Math.min(elixirThreshold, 3);

      if (currentElixir < elixirThreshold) return;

      // --- CARD SELECTION ---
      let cardToPlay = null;
      let targetX = width / 2;
      let targetY = 100;

      // 1. Spell Countering (Reactive)
      const swarmUnits = playerUnits.filter(u => ['skeleton_army', 'minions', 'minion_horde', 'skeletons', 'bats'].includes(u.spriteId));
      if (swarmUnits.length >= 3) {
        const spellIdx = currentHand.findIndex(c => c.type === 'spell' && ['arrows', 'zap', 'fireball', 'poison'].includes(c.id));
        if (spellIdx !== -1) {
          cardToPlay = currentHand[spellIdx];
          const target = swarmUnits[Math.floor(swarmUnits.length / 2)];
          targetX = target.x; targetY = target.y;
        }
      }

      // 2. Win Condition / Deck Strategy (Proactive)
      if (!cardToPlay) {
        if (deckType === 3 && currentElixir >= 9.5) {
          // Golem: Spawn in back
          const golemIdx = currentHand.findIndex(c => c.id === 'golem');
          if (golemIdx !== -1) {
            cardToPlay = currentHand[golemIdx];
            targetX = Math.random() < 0.5 ? 70 : width - 70;
            targetY = 50; // Deep back
          }
        } else if (deckType === 0) {
          // Hog: Play at bridge
          const hogIdx = currentHand.findIndex(c => c.id === 'hog_rider');
          if (hogIdx !== -1) {
            cardToPlay = currentHand[hogIdx];
            targetX = Math.random() < 0.5 ? 95 : width - 95;
            targetY = height / 2 - 40; // Bridge
          }
        } else if (deckType === 1) {
          // Bait: Goblin Barrel on tower
          const barrelIdx = currentHand.findIndex(c => c.id === 'goblin_barrel');
          if (barrelIdx !== -1 && playerTowers.length > 0) {
            cardToPlay = currentHand[barrelIdx];
            const targetTower = playerTowers[Math.floor(Math.random() * playerTowers.length)];
            targetX = targetTower.x; targetY = targetTower.y;
          }
        }
      }

      // 3. Fallback: Defend or Cycle
      if (!cardToPlay) {
        // Find best affordable card
        const affordable = currentHand.filter(c => c.cost <= currentElixir);
        if (affordable.length > 0) {
          // Sort: prefer cheap cards if defending, expensive if building push
          affordable.sort((a, b) => isUnderAttack ? (a.cost - b.cost) : (b.cost - a.cost));
          cardToPlay = affordable[0];

          if (isUnderAttack) {
            // Deploy defensively
            targetX = playerUnits[0].x + (Math.random() * 20 - 10);
            targetY = 150; // In front of towers
          } else {
            // Deploy at bridge or back based on type
            const isTank = cardToPlay.hp > 1500;
            targetX = Math.random() < 0.5 ? 70 : width - 70;
            targetY = isTank ? 50 : 120;
          }
        }
      }

      if (cardToPlay) {
        spawnCard(cardToPlay, targetX, targetY, true);
      }
    }, 1800); // Faster decision making (1.8s)

    return () => clearInterval(aiInterval);
  }, [inGame, gameOver, enemyDeckIndex]);
};

export default useGameLoop;
