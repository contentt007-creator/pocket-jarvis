import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatCurrency';

const CATEGORY_ICONS = {
  Food: 'restaurant', Transport: 'car', Entertainment: 'game-controller',
  Health: 'medkit', Shopping: 'bag-handle', Bills: 'receipt', Other: 'ellipsis-horizontal-circle',
};

function barColor(pct) {
  if (pct >= 100) return '#E24B4A';
  if (pct >= 85) return '#EF9F27';
  return '#1D9E75';
}

function statusText(pct) {
  if (pct >= 100) return 'Over budget!';
  if (pct >= 85) return 'Getting close';
  return 'Well on track';
}

export default function BudgetBar({ cat, onPress }) {
  const pct = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;
  const color = barColor(pct);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={[styles.icon, { backgroundColor: color + '22' }]}>
            <Ionicons name={CATEGORY_ICONS[cat.name] || 'ellipsis-horizontal-circle'} size={16} color={color} />
          </View>
          <Text style={styles.name}>{cat.name}</Text>
        </View>
        <Text style={[styles.status, { color }]}>{statusText(pct)}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.spent}>{formatCurrency(cat.spent)} spent</Text>
        <Text style={styles.limit}>{cat.limit > 0 ? `${pct}% of ${formatCurrency(cat.limit)}` : 'No limit set'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  status: { fontSize: 12, fontWeight: '600' },
  barBg: { height: 7, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  spent: { fontSize: 12, color: '#374151', fontWeight: '500' },
  limit: { fontSize: 12, color: '#9CA3AF' },
});
