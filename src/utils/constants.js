// Game Constants

const { width, height } = Dimensions.get('window');

// Tower sizes
export const KING_TOWER_SIZE = 65;
export const PRINCESS_TOWER_SIZE = 50;
export const TOWER_RANGE = 150;
export const KING_RANGE = 180;
export const UNIT_ATTACK_RANGE = 40;
export const UNIT_DAMAGE = 10;
export const UNIT_ATTACK_SPEED = 1000;

// Projectile speeds
export const PROJECTILE_SPEED_ARROW = 12;
export const PROJECTILE_SPEED_CANNON = 8;
export const FIRE_RATE_PRINCESS = 800;
export const FIRE_RATE_KING = 1000;

// Screen dimensions
export { width, height };

// Rarity colors
export const RARITY_COLORS = {
  common: '#bdc3c7',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12'
};

// Card categories
export const CATEGORIES = {
  all: 'All',
  troops: 'Troops',
  spells: 'Spells',
  buildings: 'Buildings'
};
