import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AIInsightCard({ insight, loading }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
        <Text style={styles.label}>Jarvis Insight</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#534AB7" size="small" style={{ marginTop: 4 }} />
      ) : (
        <Text style={styles.text}>{insight || 'Jarvis is analyzing your finances...'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#534AB7' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  avatar: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: '#534AB7' },
  text: { fontSize: 14, color: '#374151', lineHeight: 20 },
});
