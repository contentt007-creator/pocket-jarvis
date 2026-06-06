import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ChatBubble, { TypingIndicator } from '../../components/ChatBubble';
import api from '../../services/api';

const SUGGESTIONS = [
  'Can I afford something?',
  'Rate my month',
  'How do I save faster?',
  "What's eating my budget?",
];

let msgId = 0;
const mkMsg = (text, isUser) => ({ id: String(++msgId), text, isUser });

export default function JarvisScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [aiMsgCount, setAiMsgCount] = useState(0);
  const listRef = useRef(null);

  // Greeting on mount
  useEffect(() => {
    (async () => {
      setTyping(true);
      try {
        const { data } = await api.post('/ai/chat', {
          message: `Say hi to ${user?.name || 'me'} and briefly mention one thing about their current financial situation to show you know their data. Keep it to 2 sentences.`,
        });
        setMessages([mkMsg(data.reply, false)]);
      } catch {
        setMessages([mkMsg(`Hi ${user?.name || 'there'}! I'm Jarvis, your personal finance advisor. How can I help you today?`, false)]);
      } finally {
        setTyping(false);
      }
    })();
  }, []);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, mkMsg(msg, true)]);
    setTyping(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const { data } = await api.post('/ai/chat', { message: msg });
      const newCount = aiMsgCount + 1;
      setAiMsgCount(newCount);
      let reply = data.reply;
      // Append an expert quote every 3rd AI response
      if (newCount % 3 === 0) {
        try {
          const qRes = await api.get('/masters/quote/random');
          reply = `${reply}\n\n*"${qRes.data.quote}"*\n— ${qRes.data.expert}`;
        } catch { /* ignore */ }
      }
      setMessages(prev => [...prev, mkMsg(reply, false)]);
    } catch {
      setMessages(prev => [...prev, mkMsg("Sorry, I couldn't connect right now. Try again in a moment.", false)]);
    } finally {
      setTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.jarvisName}>Jarvis</Text>
          <Text style={styles.jarvisSub}>knows your finances</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => <ChatBubble message={item.text} isUser={item.isUser} />}
        ListFooterComponent={typing ? <TypingIndicator /> : null}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input} value={input} onChangeText={setInput}
          placeholder="Ask Jarvis anything..." placeholderTextColor="#9CA3AF"
          multiline maxLength={500}
          returnKeyType="send" onSubmitEditing={() => send()}
        />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={() => send()} disabled={!input.trim() || typing}>
          <Ionicons name="send" size={18} color={input.trim() ? '#fff' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  jarvisName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  jarvisSub: { fontSize: 12, color: '#1D9E75', fontWeight: '600' },
  messages: { paddingTop: 16, paddingBottom: 16 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  chip: { backgroundColor: '#F5F3FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  chipText: { fontSize: 13, color: '#534AB7', fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 10 },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', maxHeight: 100, borderWidth: 1, borderColor: '#E5E7EB' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#F3F4F6' },
});
