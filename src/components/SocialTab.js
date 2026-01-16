import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const SocialTab = () => {
  const [messages, setMessages] = useState([
    { id: '1', user: 'KingSlayer', text: 'Good game everyone!', role: 'Elder', time: '2h ago' },
    { id: '2', user: 'PrincessLover', text: 'Can someone donate Wizards?', role: 'Member', time: '1h ago' },
    { id: '3', user: 'System', text: 'Trainer Cheddar joined the clan.', role: 'System', time: '30m ago' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim().length === 0) return;
    const newMsg = { id: Date.now().toString(), user: 'You', text: inputText, role: 'Leader', time: 'Just now' };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const renderMessage = ({ item }) => {
    if (item.role === 'System') return <View style={styles.systemMessage}><Text style={styles.systemMessageText}>{item.text}</Text></View>;
    const isMe = item.user === 'You';
    return (
      <View style={[styles.chatRow, isMe ? styles.chatRowMe : styles.chatRowOther]}>
        <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
          {!isMe && <Text style={[styles.chatUser, {color: item.role === 'Elder' ? '#f1c40f' : '#3498db'}]}>{item.user}</Text>}
          <Text style={styles.chatText}>{item.text}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.clanTabContainer}>
      <View style={styles.socialHeader}>
        <View style={styles.clanMainInfo}>
          <View style={styles.clanBadgeLarge}><Text style={{fontSize: 24}}>🛡️</Text></View>
          <View>
            <Text style={styles.clanNameText}>Blue Kings</Text>
            <Text style={styles.clanStatusText}>48/50 Members • 🏆 4000+</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clanSettingsIcon}><Text style={{fontSize: 18}}>ℹ️</Text></TouchableOpacity>
      </View>

      <View style={styles.requestBanner}>
        <Text style={styles.requestText}>New card request available!</Text>
        <TouchableOpacity style={styles.requestButton}><Text style={styles.requestButtonText}>REQUEST</Text></TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.chatContainer} keyboardVerticalOffset={80}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 10 }}
        />
        <View style={styles.inputContainer}>
          <TextInput style={styles.chatInput} placeholder="Message..." placeholderTextColor="#888" value={inputText} onChangeText={setInputText} />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}><Text style={styles.sendButtonText}>S</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};


export default SocialTab;
