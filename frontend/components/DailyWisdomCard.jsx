import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function DailyWisdomCard({ onPress }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/masters/quote/random')
      .then(r => setQuote(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={styles.card}>
      <ActivityIndicator color="#534AB7" size="small" />
    </View>
  );
  if (!quote) return null;

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: quote.avatarColor || '#534AB7' }]} onPress={() => onPress?.(quote)} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: quote.avatarColor || '#534AB7' }]}>
          <Ionicons name="book-outline" size={14} color="#fff" />
        </View>
        <Text style={styles.label}>Daily Wisdom</Text>
        <View style={[styles.catBadge, { backgroundColor: (quote.avatarColor || '#534AB7') + '22' }]}>
          <Text style={[styles.catText, { color: quote.avatarColor || '#534AB7' }]}>{quote.category}</Text>
        </View>
      </View>
      <Text style={styles.quote}>"{quote.quote}"</Text>
      <Text style={styles.expert}>— {quote.expert}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  avatar: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 12, fontWeight: '700', color: '#374151' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  quote: { fontSize: 14, color: '#374151', fontStyle: 'italic', lineHeight: 21, marginBottom: 8 },
  expert: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
});
