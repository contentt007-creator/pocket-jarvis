import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QuoteTipCard({ quote, expert, color = '#534AB7', onPress, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarInitial}>{expert?.[0] || '?'}</Text>
        </View>
        <Text style={styles.expertName}>{expert}</Text>
        <TouchableOpacity onPress={() => { setDismissed(true); onDismiss?.(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.quote}>"{quote}"</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14, borderLeftWidth: 3, marginVertical: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  avatar: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 12, fontWeight: '800' },
  expertName: { flex: 1, fontSize: 12, fontWeight: '700', color: '#374151' },
  quote: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 19 },
});
