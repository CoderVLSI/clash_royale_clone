// App_modular.js - Modularized version using hooks
// To use: rename this to App.js (backup original first)

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

// Import hooks
import useGameState from './src/hooks/useGameState';
import useGameLoop from './src/hooks/useGameLoop';

// Import UI component
import AppUI from './src/components/AppUI';

export default function App() {
    // Initialize all game state via custom hook
    const gameState = useGameState();

    // Run game loops via custom hook
    useGameLoop(gameState);

    // Render UI via modular component
    return (
        <>
            <StatusBar style="light" />
            <AppUI gameState={gameState} />
        </>
    );
}
