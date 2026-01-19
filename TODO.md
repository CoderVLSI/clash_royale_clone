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
- [x] **Lobby Tabs**:
    - [x] `src/components/Lobby/ShopTab.js`
    - [x] `src/components/Lobby/DeckTab.js`
    - [x] `src/components/Lobby/SocialTab.js`
    - [x] `src/components/Lobby/EventsTab.js`
- [x] **Lobby Shell**:
    - [x] `src/components/Lobby/MainLobby.js` (Wrapper)
    - [x] `src/components/Lobby/LobbyHeader.js`
    - [x] `src/components/Lobby/BottomNavigation.js`
- [x] **Modals**:
    - [x] `src/components/Modals/ChestOpeningModal.js`
    - [x] `src/components/Modals/FriendlyBattleModal.js`

## 4. Game Entities (Pending)
*Goal: Move game object rendering (~1,000 lines) out of App.js.*
- [x] **GameBoard**: Wrapper component (`src/components/Game/GameBoard.js`).
- [x] **Unit**: The `Unit` component (`src/components/Game/Unit.js`).
- [x] **Projectile**: The `Projectile` component (`src/components/Game/Projectile.js`).
- [x] **Tower**: The `Tower` component (`src/components/Game/Tower.js`).

## 5. Core Game Logic (Final Boss) - ⚠️ IN PROGRESS
*Goal: Refactor the massive Game Loop (~4,500 lines).*
- [x] **State Management**: Extract state to a Context or Custom Hook (`useGameState`).
- [x] **Game Loop**: Extract the `useEffect` loop to `src/hooks/useGameLoop.js`.
- [x] **Physics Engine**: Separate movement and collision logic.

**Status**: `useGameState.js` created (1377 lines) but missing latest features (tower decay). `useGameLoop.js` extraction was broken and deleted. Original App.js still works.

## 6. Integration (The Switch) - ❌ FAILED
- [x] **Validation**: Ensure all Shadow Components match `App.js` logic.
- [ ] **Refactor `App.js`**: Import all new components and delete the 14,000 lines of original code.

**Status**: Integration attempted but failed. App.js was restored from git. The game loop extraction needs to be redone properly.

## Next Steps
1. Fix `useGameLoop.js` - properly extract game loop from App.js
2. Update `useGameState.js` with tower decay features
3. Test hooks independently before integrating
4. Complete integration when hooks are verified working
