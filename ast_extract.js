const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');

console.log('Reading App.js...');
const code = fs.readFileSync('App.js', 'utf8');

console.log('Parsing with Babel...');
const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

// Components to extract
const componentsToExtract = [
  'MainMenu',
  'GameOverScreen', 
  'TowerSprite',
  'UnitSprite',
  'Card',
  'HealthBar',
  'VisualEffects',
  'Projectile',
  'Unit',
  'LobbyHeader',
  'ChestSlots',
  'MiniCard',
  'ShopTab',
  'EventsTab',
  'ElixirDroplet',
  'DeckStats',
  'CollectionCard',
  'CardMenu',
  'DeckSlotSelector',
  'DeckTab',
  'BattleTab',
  'SocialTab',
  'BottomNavigation',
  'MainLobby',
  'GameBoard',
  'ChestOpeningModal',
  'FriendlyBattleModal'
];

// Extract CARDS array
console.log('Extracting CARDS array...');
traverse(ast, {
  VariableDeclaration(path) {
    const declarator = path.node.declarations[0];
    if (declarator && declarator.id.name === 'CARDS' && t.isVariableDeclarator(declarator)) {
      const cardsCode = generator(path.node).code;
      fs.writeFileSync('src/cards/cardDefinitions.js', 
        cardsCode + '\n\nexport default CARDS;');
      console.log('✓ Extracted CARDS to src/cards/cardDefinitions.js');
      path.remove();
    }
  }
});

// Extract constants
console.log('Extracting constants...');
const constants = [];
traverse(ast, {
  VariableDeclaration(path) {
    if (path.node.declarations[0]) {
      const name = path.node.declarations[0].id.name;
      if (['KING_TOWER_SIZE', 'PRINCESS_TOWER_SIZE', 'TOWER_RANGE', 'KING_RANGE',
           'UNIT_ATTACK_RANGE', 'UNIT_DAMAGE', 'UNIT_ATTACK_SPEED', 'PROJECTILE_SPEED_ARROW',
           'PROJECTILE_SPEED_CANNON', 'FIRE_RATE_PRINCESS', 'FIRE_RATE_KING', 'RARITY_COLORS'].includes(name)) {
        constants.push(generator(path.node).code);
        path.remove();
      }
    }
  }
});

fs.writeFileSync('src/utils/constants.js',
  `// Constants extracted from App.js\n` +
  constants.join('\n') +
  '\nexport { KING_TOWER_SIZE, PRINCESS_TOWER_SIZE, TOWER_RANGE, KING_RANGE, UNIT_ATTACK_RANGE, UNIT_DAMAGE, UNIT_ATTACK_SPEED, PROJECTILE_SPEED_ARROW, PROJECTILE_SPEED_CANNON, FIRE_RATE_PRINCESS, FIRE_RATE_KING, RARITY_COLORS };');
console.log('✓ Extracted constants to src/utils/constants.js');

// Extract components
console.log('Extracting components...');
componentsToExtract.forEach(componentName => {
  traverse(ast, {
    VariableDeclaration(path) {
      const declarator = path.node.declarations[0];
      if (declarator && declarator.id && declarator.id.name === componentName) {
        console.log(`Found ${componentName}`);
        
        // Get imports needed for this component
        const imports = [];
        let hasReact = false;
        let hasSvg = false;
        
        path.scope.getBinding(componentName).referencePaths.forEach(refPath => {
          const binding = refPath.scope.getBinding(componentName);
          if (binding && binding.path) {
            binding.path.parentPath.traverse({
              Identifier(idPath) {
                const name = idPath.node.name;
                // Track which imports are used
              }
            });
          }
        });
        
        // Generate component code
        const componentCode = generator(path.node).code;
        
        // Determine file path
        const filePath = `src/components/${componentName}.js`;
        
        fs.writeFileSync(filePath, componentCode + '\n\nexport default ' + componentName + ';');
        console.log(`✓ Extracted ${componentName} to ${filePath}`);
        
        path.remove();
      }
    }
  });
});

console.log('\nGenerating updated App.js...');
const newCode = generator(ast).code;
fs.writeFileSync('App_new.js', newCode);
console.log('✓ Created App_new.js with extracted code removed');

console.log('\n✅ AST extraction complete!');
