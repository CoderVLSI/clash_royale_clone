import React, { useState, useEffect } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import styles from '../styles/gameStyles';

const MainMenu = ({ onStart }) => {
    const [progress, setProgress] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [tipIndex, setTipIndex] = useState(0);

    const TIPS = [
        "Tip: Destroying enemy towers grants Crowns!",
        "Tip: Join a Clan to request cards and friendly battle!",
        "Tip: Don't spend all your Elixir at once!",
        "Tip: Lure enemy troops to the center to activate your King Tower.",
        "Tip: Use spells to damage multiple units at once.",
        "Tip: Balance your deck with ground and air units."
    ];

    useEffect(() => {
        // Pick a random tip on mount
        setTipIndex(Math.floor(Math.random() * TIPS.length));

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setLoaded(true);
                    return 100;
                }
                return prev + 2; // Slower load for effect
            });
        }, 30);
        return () => clearInterval(interval);
    }, []);

    // Auto-start when loaded
    useEffect(() => {
        if (loaded) {
            // Small delay before transition
            const timer = setTimeout(onStart, 500);
            return () => clearTimeout(timer);
        }
    }, [loaded, onStart]);

    return (
        <ImageBackground source={require('../../assets/background.jpg')} style={styles.menuContainer}>
            <View style={styles.menuOverlay}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoTextClash}>CLASH</Text>
                    <Text style={styles.logoTextRoyale}>ROYALE</Text>
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.loadingBottomContainer}>
                    <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>

                    <View style={styles.loadingBarRow}>
                        <Text style={styles.loadingPercentage}>{progress}%</Text>
                        <View style={styles.loadingBarTrack}>
                            <View style={[styles.loadingBarFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    <Text style={styles.loadingStateText}>Updating Arena...</Text>
                </View>

                <Text style={styles.copyrightText}>SUPERCELL</Text>
            </View>
        </ImageBackground>
    );
};

export default MainMenu;
