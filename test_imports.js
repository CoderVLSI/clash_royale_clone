// Test if our extracted modules work
import CARDS from './src/cards/cardDefinitions.js';
import { KING_TOWER_SIZE, RARITY_COLORS } from './src/utils/constants.js';

console.log('✓ CARDS loaded:', CARDS.length, 'cards');
console.log('✓ KING_TOWER_SIZE:', KING_TOWER_SIZE);
console.log('✓ RARITY_COLORS:', Object.keys(RARITY_COLORS));

process.exit(0);
