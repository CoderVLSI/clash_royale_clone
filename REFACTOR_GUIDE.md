# File Refactoring Guide

## What's Done ✅
- Created folder structure: `src/{cards,game,components,utils,visualEffects,mechanics}`
- Extracted: `src/cards/cardDefinitions.js` (CARDS array)
- Extracted: `src/utils/constants.js` (all constants)

## What's Next (Priority Order)

### 1. Extract UnitSprite Component (~1500 lines)
**File**: `src/components/UnitSprite.js`
- Find the `UnitSprite` component in App.js
- Extract all SVG sprite code
- Export it as default export
- Import in App.js: `import UnitSprite from './src/components/UnitSprite';`

### 2. Extract Visual Effects (~1500 lines)
**File**: `src/visualEffects/effectRenderer.js`
- Find the `VisualEffects` component rendering
- Move all effect type checks (fire_explosion, ice_freeze, etc.)
- Export as `VisualEffects` component
- This is HUGE and will save lots of space

### 3. Extract Game Loop (~4000 lines)
**File**: `src/game/gameLoop.js`
- Extract the `useEffect` game loop (lines ~6000-8500)
- Export as `useGameLoop` hook
- This is the MEAT of the game logic

### 4. Extract UI Tab Components (~1000 lines each)
**Files**:
- `src/components/DeckTab.js`
- `src/components/BattleTab.js`
- `src/components/ShopTab.js`
- `src/components/ClanTab.js`

### 5. Extract Mechanics (as needed)
**Files**:
- `src/mechanics/shields.js` (shield logic)
- `src/mechanics/splash.js` (splash damage)
- `src/mechanics/projectiles.js` (projectile system)

## Final App.js Structure (Goal)
```javascript
import React, { useState } from 'react';
import CARDS from './src/cards/cardDefinitions';
import { width, height } from './src/utils/constants';
import UnitSprite from './src/components/UnitSprite';
import VisualEffects from './src/visualEffects/effectRenderer';
import { useGameLoop } from './src/game/gameLoop';
import DeckTab from './src/components/DeckTab';
import BattleTab from './src/components/BattleTab';
import ShopTab from './src/components/ShopTab';
import ClanTab from './src/components/ClanTab';

// Styles (extract to src/styles/styles.js)

export default function App() {
  // Main component logic (should be ~500 lines max)
}
```

## Import Updates Needed in App.js

Replace:
```javascript
const CARDS = [...]; // DELETE - lines 24-130
const { width, height } = Dimensions.get('window'); // DELETE
const KING_TOWER_SIZE = 65; // DELETE - all constants
```

Add:
```javascript
import CARDS from './src/cards/cardDefinitions';
import { width, height, KING_TOWER_SIZE, ... } from './src/utils/constants';
import UnitSprite from './src/components/UnitSprite';
```

## Estimated Final File Sizes:
- App.js: ~500 lines (from 11,348!)
- cardDefinitions.js: ~130 lines
- cardSprites.js: ~1500 lines
- constants.js: ~50 lines
- effectRenderer.js: ~1500 lines
- gameLoop.js: ~4000 lines
- BattleTab.js: ~1000 lines
- Other components: ~500 lines each

## Testing After Each Extract:
1. `npm start` or `expo start`
2. Check for import errors
3. Test game functionality
4. Commit after each successful extraction

---

**Created by**: Claude (Team Supercell)
**Date**: 2025-01-16
**Status**: Started - Ready for Gemini to continue!
