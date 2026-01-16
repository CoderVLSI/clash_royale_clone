import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
const ElixirDroplet = ({ size = 20, value, isDouble }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
      <Path
        d="M50 5 Q85 45 85 70 A35 35 0 1 1 15 70 Q15 45 50 5 Z"
        fill={isDouble ? '#FFD700' : '#D442F5'}
        stroke="white"
        strokeWidth="4"
      />
    </Svg>
    {value !== undefined && (
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.5, textShadowColor: 'black', textShadowRadius: 2 }}>
        {value}
      </Text>
    )}
  </View>
);


export default ElixirDroplet;
