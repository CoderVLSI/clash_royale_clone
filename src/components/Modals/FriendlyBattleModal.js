import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import styles from '../../styles/gameStyles';

const FriendlyBattleModal = ({ visible, onClose, socket }) => {
    const [mode, setMode] = useState('MENU'); // MENU, CREATE, JOIN
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setMode('MENU');
            setRoomCode('');
            setJoinCode('');
            setError('');
        }
    }, [visible]);

    useEffect(() => {
        if (!socket) return;

        socket.on('room_created', (roomId) => {
            setRoomCode(roomId);
        });

        socket.on('error', (msg) => {
            setError(msg);
            // Reset after 3s
            setTimeout(() => setError(''), 3000);
        });

        return () => {
            socket.off('room_created');
            socket.off('error');
        };
    }, [socket]);

    const handleCreate = () => {
        setMode('CREATE');
        // Generate random 4-digit code and request creation
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        // In reality, server should generate ID, but we'll request one for simplicity
        if (socket) socket.emit('create_room', code);
    };

    const handleJoin = () => {
        if (joinCode.length === 4) {
            if (socket) socket.emit('join_room', joinCode);
        } else {
            setError('Please enter a 4-digit room code');
        }
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <TouchableOpacity style={styles.chestModalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.friendlyModalContent} onStartShouldSetResponder={() => true}>
                    <Text style={styles.friendlyModalTitle}>FRIENDLY BATTLE</Text>

                    {mode === 'MENU' && (
                        <View style={styles.roomButtonsRow}>
                            <TouchableOpacity style={styles.createRoomButton} onPress={handleCreate}>
                                <Text style={styles.roomButtonText}>CREATE ROOM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.joinRoomButton} onPress={() => setMode('JOIN')}>
                                <Text style={styles.roomButtonText}>JOIN ROOM</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {mode === 'CREATE' && (
                        <View style={{ alignItems: 'center', width: '100%' }}>
                            <Text style={styles.waitingText}>Share this code with your friend:</Text>
                            <Text style={styles.roomCodeText}>{roomCode || '...'}</Text>
                            <Text style={styles.waitingText}>Waiting for opponent...</Text>
                            <ActivityIndicator size="large" color="#3498db" />
                        </View>
                    )}

                    {mode === 'JOIN' && (
                        <View style={{ alignItems: 'center', width: '100%' }}>
                            <TextInput
                                style={styles.roomInput}
                                placeholder="Enter Room Code"
                                keyboardType="numeric"
                                maxLength={4}
                                value={joinCode}
                                onChangeText={setJoinCode}
                            />
                            <TouchableOpacity style={styles.joinRoomButton} onPress={handleJoin}>
                                <Text style={styles.roomButtonText}>JOIN BATTLE</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {error ? <Text style={{ color: 'red', marginTop: 10, fontWeight: 'bold' }}>{error}</Text> : null}

                    <TouchableOpacity style={styles.cardMenuCancel} onPress={onClose}>
                        <Text style={styles.cardMenuCancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default FriendlyBattleModal;
