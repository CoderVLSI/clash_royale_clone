import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../../styles/gameStyles';

const ChestSlots = ({ chests, onUnlock, onOpen }) => {
    const getChestColor = (type) => {
        switch (type) {
            case 'SILVER': return '#bdc3c7';
            case 'GOLD': return '#f1c40f';
            case 'GIANT': return '#e67e22';
            case 'MAGICAL': return '#9b59b6';
            case 'SUPER MAGICAL': return '#3498db';
            default: return '#bdc3c7';
        }
    };

    const formatChestTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    return (
        <View style={styles.chestSlotsContainer}>
            <Text style={styles.chestSlotsTitle}>CHESTS</Text>
            <View style={styles.chestRow}>
                {[0, 1, 2, 3].map(index => {
                    const chest = chests.find(c => c.slotIndex === index);
                    if (!chest) {
                        return (
                            <View key={index} style={styles.chestSlotEmpty}>
                                <Text style={styles.chestTextEmpty}>Empty Slot</Text>
                            </View>
                        );
                    }

                    const isUnlocking = chest.state === 'UNLOCKING';
                    const isUnlocked = chest.state === 'UNLOCKED';

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.chestSlot, { borderColor: getChestColor(chest.type), borderWidth: 2 }]}
                            onPress={() => isUnlocked ? onOpen(chest) : onUnlock(chest)}
                            disabled={isUnlocking}
                        >
                            <Text style={[styles.chestText, { color: getChestColor(chest.type) }]}>{chest.type}</Text>
                            {isUnlocked ? (
                                <Text style={styles.chestOpenText}>OPEN!</Text>
                            ) : isUnlocking ? (
                                <Text style={styles.chestTimer}>{formatChestTime(chest.timeLeft)}</Text>
                            ) : (
                                <Text style={styles.chestLockedText}>{formatChestTime(chest.unlockTime)}</Text>
                            )}
                            {isUnlocking && <Text style={{ fontSize: 10, color: '#f1c40f' }}>Unlocking...</Text>}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default ChestSlots;
