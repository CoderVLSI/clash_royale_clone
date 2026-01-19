import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import HealthBar from '../HealthBar';
import styles from '../../styles/gameStyles';
import { KING_TOWER_SIZE, PRINCESS_TOWER_SIZE } from '../../constants/gameData';

const TowerSprite = ({ type, isOpponent, size }) => {
    const color = isOpponent ? '#E74C3C' : '#3498DB';
    const secondary = isOpponent ? '#C0392B' : '#2980B9';

    if (type === 'king') {
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100">
                <Rect x="10" y="40" width="80" height="50" rx="5" fill="#7f8c8d" stroke="black" strokeWidth="2" />
                <Rect x="20" y="20" width="60" height="40" fill={color} stroke="black" strokeWidth="2" />
                <Rect x="15" y="10" width="15" height="15" fill={secondary} stroke="black" strokeWidth="1" />
                <Rect x="42.5" y="10" width="15" height="15" fill={secondary} stroke="black" strokeWidth="1" />
                <Rect x="70" y="10" width="15" height="15" fill={secondary} stroke="black" strokeWidth="1" />
                <Circle cx="50" cy="65" r="10" fill="black" />
            </Svg>
        );
    }
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Rect x="20" y="30" width="60" height="60" rx="5" fill="#95a5a6" stroke="black" strokeWidth="2" />
            <Rect x="15" y="10" width="70" height="25" fill={color} stroke="black" strokeWidth="2" />
            <Rect x="40" y="50" width="20" height="30" rx="10" fill="black" />
        </Svg>
    );
};

const Tower = ({ tower }) => {
    const isPrincess = tower.type === 'princess';
    const size = isPrincess ? PRINCESS_TOWER_SIZE : KING_TOWER_SIZE;

    const styleObj = {
        left: tower.x - size / 2,
        top: tower.y - size / 2,
        width: size,
        height: size,
        zIndex: 10,
        position: 'absolute'
    };

    const isSlowed = tower.slowUntil > Date.now();
    const isStunned = tower.stunUntil > Date.now();

    return (
        <View style={[styles.towerContainer, styleObj]}>
            <TowerSprite type={tower.type} isOpponent={tower.isOpponent} size={size} />
            {isSlowed && (
                <View style={{
                    position: 'absolute',
                    top: -5, left: -5, right: -5, bottom: -5,
                    backgroundColor: 'rgba(135, 206, 250, 0.4)',
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: '#00BFFF',
                    zIndex: 15,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Text style={{ fontSize: 16 }}>❄️</Text>
                </View>
            )}
            {isStunned && (
                <View style={{
                    position: 'absolute',
                    top: -5, left: -5, right: -5, bottom: -5,
                    backgroundColor: 'rgba(255, 255, 0, 0.3)',
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: '#FFFF00',
                    zIndex: 16,
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Text style={{ fontSize: 16 }}>⚡</Text>
                </View>
            )}
            <HealthBar current={tower.hp} max={tower.maxHp} isOpponent={tower.isOpponent} />
        </View>
    );
};

export default Tower;
