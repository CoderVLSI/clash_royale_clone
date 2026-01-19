const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

const componentName = process.argv[2];
if (!componentName) {
  console.log('Usage: node extract_component.js <ComponentName>');
  process.exit(1);
}

console.log(`\n🔍 Extracting: ${componentName}`);

const code = fs.readFileSync('App.js', 'utf8');
const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

let componentPath = null;
let found = false;

traverse(ast, {
  VariableDeclaration(path) {
    const declarator = path.node.declarations[0];
    if (declarator && declarator.id && declarator.id.name === componentName) {
      console.log(`✓ Found ${componentName}`);
      componentPath = path;
      found = true;
    }
  }
});

if (!found) {
  console.log(`❌ Component ${componentName} not found!`);
  process.exit(1);
}

// Generate component code
const componentCode = generator(componentPath.node, {
  compact: false,
  comments: true
}).code;

// Build imports - add common ones by default
const imports = ["import React from 'react';"];
const rnImports = new Set();
const svgImports = new Set();
const otherImports = new Set();

// Detect what's used
const codeToCheck = componentCode;

// React Native components
const rnComponents = [
  'View', 'Text', 'StyleSheet', 'TouchableOpacity', 'ScrollView', 
  'Modal', 'Image', 'ImageBackground', 'Animated', 'PanResponder',
  'FlatList', 'TextInput', 'StatusBar', 'ActivityIndicator'
];

rnComponents.forEach(comp => {
  if (codeToCheck.includes(comp)) {
    rnImports.add(comp);
  }
});

// SVG components
const svgComponents = [
  'Svg', 'Circle', 'Rect', 'Path', 'G', 'Defs', 'LinearGradient', 
  'Stop', 'Polygon', 'Ellipse', 'Text', 'Line'
];

svgComponents.forEach(comp => {
  if (codeToCheck.includes(comp)) {
    svgImports.add(comp);
  }
});

// Add imports
if (rnImports.size > 0) {
  imports.push(`import { ${Array.from(rnImports).sort().join(', ')} } from 'react-native';`);
}

if (svgImports.size > 0) {
  imports.push(`import { ${Array.from(svgImports).sort().join(', ')} } from 'react-native-svg';`);
}

if (codeToCheck.includes('LinearGradient as ExpoLinearGradient')) {
  imports.push("import { LinearGradient } from 'expo-linear-gradient';");
}

// Local imports
if (codeToCheck.includes('UnitSprite')) {
  imports.push("import UnitSprite from './UnitSprite';");
}
if (codeToCheck.includes('TowerSprite')) {
  imports.push("import TowerSprite from './TowerSprite';");
}
if (codeToCheck.includes('RARITY_COLORS')) {
  imports.push("import { RARITY_COLORS } from '../utils/constants';");
}
if (codeToCheck.includes('CARDS')) {
  imports.push("import CARDS from '../cards/cardDefinitions';");
}

// Write to file
const fileName = `src/components/${componentName}.js`;
const fullCode = imports.join('\n') + '\n\n' + componentCode + `\n\nexport default ${componentName};`;

fs.writeFileSync(fileName, fullCode);
console.log(`✓ Written to ${fileName}`);
console.log(`✓ Size: ${fullCode.length} bytes\n`);

// Remove from App.js
const ast2 = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

traverse(ast2, {
  VariableDeclaration(path) {
    const declarator = path.node.declarations[0];
    if (declarator && declarator.id && declarator.id.name === componentName) {
      path.remove();
    }
  }
});

const newAppCode = generator(ast2, {
  compact: false,
  comments: true
}).code;

fs.writeFileSync('App_new.js', newAppCode);
console.log(`✓ Created App_new.js with ${componentName} removed\n`);
console.log('✅ Extraction complete!');
