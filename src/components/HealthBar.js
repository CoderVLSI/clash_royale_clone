import React from 'react';
import { View, Text } from 'react-native';

const HealthBar = ({ current, max, isOpponent, hasShield, shieldHp, shieldMax }) => {
    if (current <= 0) return null;
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    const shieldPercentage = hasShield && shieldHp > 0 ? Math.max(0, Math.min(100, (shieldHp / shieldMax) * 100)) : 0;

    return (
        <View style={{ position: 'absolute', top: -22, width: '120%', alignItems: 'center', zIndex: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 3, marginBottom: 1 }}>
                {current}
            </Text>

            {/* Shield bar (shown above HP bar if shield exists) */}
            {hasShield && shieldHp > 0 && (
                <View style={{ width: '100%', height: 6, backgroundColor: '#2c3e50', borderRadius: 3, borderWidth: 1, borderColor: '#000', overflow: 'hidden', marginBottom: 1 }}>
                    <View
                        style={{
                            width: `${shieldPercentage}%`,
                            height: '100%',
                            backgroundColor: '#3498db'
                        }}
                    />
                </View>
            )}

            {/* HP bar */}
            <View style={{ width: '100%', height: 8, backgroundColor: '#333', borderRadius: 4, borderWidth: 1, borderColor: '#000', overflow: 'hidden' }}>
                <View
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: isOpponent ? '#e74c3c' : '#2ecc71'
                    }}
                />
            </View>
        </View>
    );
};

export default HealthBar;
