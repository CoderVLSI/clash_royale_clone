import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../../styles/gameStyles';

const GameOverScreen = ({ result, onRestart }) => {
    const isVictory = result === 'VICTORY';
    return (
        <View style={styles.gameOverContainer}>
            <Text style={[styles.gameOverTitle, { color: isVictory ? '#F1C40F' : '#E74C3C' }]}>
                {result}!
            </Text>
            <TouchableOpacity style={styles.restartButton} onPress={() => onRestart('lobby')}>
                <Text style={styles.restartButtonText}>RETURN TO LOBBY</Text>
            </TouchableOpacity>
        </View>
    );
};

export default GameOverScreen;
