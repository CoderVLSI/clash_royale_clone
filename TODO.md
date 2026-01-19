# Project Status: App.js Modularization (Shadow Mode)

This document tracks the progress of splitting the monolithic `App.js` (14,000+ lines) into modular components.

**Strategy**: "Shadow Mode" - Create new files for components without deleting code from `App.js` yet, to maintain a working build at all times.

## 1. Preparation & Data (Completed)
- [x] **Constants**: Extracted `CARDS`, `RARITY_COLORS` to `src/constants/gameData.js`.
- [x] **Styles**: Extracted `StyleSheet` (~2800 lines) to `src/styles/gameStyles.js`.

## 2. Visual & Basic Components (Completed)
- [x] **VisualEffects**: Extracted complex effects (~1500 lines) to `src/components/VisualEffects.js`.
- [x] **UnitSprite**: Extracted unit rendering logic (~2000 lines) to `src/components/UnitSprite.js`.
- [x] **HealthBar**: Extracted `HealthBar` to `src/components/HealthBar.js`.
- [x] **ElixirDroplet**: Extracted `ElixirDroplet` to `src/components/ElixirDroplet.js`.
- [x] **Card**: Extracted `Card` (Deck UI) to `src/components/Card.js`.

## 3. UI & Lobby Components (Next Steps)
*Goal: Move the UI code (~2,000 lines) out of App.js.*
- [ ] **Lobby Tabs**:
    - [ ] `src/components/Lobby/ShopTab.js`
    - [ ] `src/components/Lobby/DeckTab.js`
    - [ ] `src/components/Lobby/SocialTab.js`
    - [ ] `src/components/Lobby/EventsTab.js`
- [ ] **Lobby Shell**:
    - [ ] `src/components/Lobby/MainLobby.js` (Wrapper)
    - [ ] `src/components/Lobby/LobbyHeader.js`
    - [ ] `src/components/Lobby/BottomNavigation.js`
- [ ] **Modals**:
    - [ ] `src/components/Modals/ChestOpeningModal.js`
    - [ ] `src/components/Modals/FriendlyBattleModal.js`

## 4. Game Entities (Pending)
*Goal: Move game object rendering (~1,000 lines) out of App.js.*
- [ ] **GameBoard**: Wrapper component (`src/components/GameBoard.js`).
- [ ] **Unit**: The `Unit` component (`src/components/Unit.js`).
- [ ] **Projectile**: The `Projectile` component (`src/components/Projectile.js`).
- [ ] **Tower**: The `Tower` component (`src/components/Tower.js`).

## 5. Core Game Logic (Final Boss)
*Goal: Refactor the massive Game Loop (~4,500 lines).*
- [ ] **State Management**: Extract state to a Context or Custom Hook (`useGameState`).
- [ ] **Game Loop**: Extract the `useEffect` loop to `src/hooks/useGameLoop.js`.
- [ ] **Physics Engine**: Separate movement and collision logic.

## 6. Integration (The Switch)
- [ ] **Validation**: Ensure all Shadow Components match `App.js` logic.
- [ ] **Refactor App.js**: Import all new components and delete the 14,000 lines of original code.
