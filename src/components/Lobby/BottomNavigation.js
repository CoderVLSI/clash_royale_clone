import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import styles from '../../styles/gameStyles';

const BottomNavigation = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 0, name: 'Shop', icon: '🛒' },
        { id: 1, name: 'Decks', icon: '📚' },
        { id: 2, name: 'Battle', icon: '⚔️' },
        { id: 3, name: 'Social', icon: '👥' },
        { id: 4, name: 'Events', icon: '🏆' }
    ];

    return (
        <View style={styles.bottomNavigation}>
            {tabs.map(tab => (
                <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
                    onPress={() => onTabChange(tab.id)}
                >
                    <Text style={[styles.tabIcon, activeTab === tab.id && { transform: [{ scale: 1.2 }] }]}>{tab.icon}</Text>
                    <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                        {tab.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default BottomNavigation;
