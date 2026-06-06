import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatBubble({ message, isUser }) {
  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.jarvisBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.jarvisText]}>{message}</Text>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  return (
    <View style={[styles.row, styles.rowLeft]}>
      <View style={[styles.bubble, styles.jarvisBubble, styles.typing]}>
        <Text style={styles.dots}>• • •</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 16 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  userBubble: { backgroundColor: '#534AB7', borderBottomRightRadius: 4 },
  jarvisBubble: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 21 },
  userText: { color: '#fff' },
  jarvisText: { color: '#111827' },
  typing: { paddingVertical: 12 },
  dots: { color: '#9CA3AF', letterSpacing: 4, fontSize: 16 },
});
