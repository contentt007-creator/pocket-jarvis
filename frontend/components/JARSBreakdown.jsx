import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/formatCurrency';

const JARS = [
  { key: 'necessities', label: 'Necessities', pct: 55, emoji: '🏠', color: '#534AB7' },
  { key: 'savings', label: 'Long-term Savings', pct: 10, emoji: '🏦', color: '#1D9E75' },
  { key: 'education', label: 'Education', pct: 10, emoji: '📚', color: '#3B82F6' },
  { key: 'play', label: 'Play', pct: 10, emoji: '🎉', color: '#EF9F27' },
  { key: 'giving', label: 'Giving', pct: 10, emoji: '🤝', color: '#EC4899' },
  { key: 'ffa', label: 'Financial Freedom', pct: 5, emoji: '💎', color: '#14B8A6' },
];

export default function JARSBreakdown({ monthlyIncome = 0 }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your JARS for this income</Text>
      {JARS.map(jar => {
        const amount = Math.round((jar.pct / 100) * monthlyIncome);
        return (
          <View key={jar.key} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: jar.color + '22' }]}>
              <Text style={styles.emoji}>{jar.emoji}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{jar.label}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${jar.pct}%`, backgroundColor: jar.color }]} />
              </View>
            </View>
            <View style={styles.right}>
              <Text style={[styles.pct, { color: jar.color }]}>{jar.pct}%</Text>
              <Text style={styles.amount}>{formatCurrency(amount)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginVertical: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 18 },
  info: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  barBg: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  right: { alignItems: 'flex-end', minWidth: 64 },
  pct: { fontSize: 13, fontWeight: '800' },
  amount: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
});
