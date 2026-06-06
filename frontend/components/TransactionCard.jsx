import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatCurrency';

const CATEGORY_ICONS = {
  Food: 'restaurant',
  Transport: 'car',
  Entertainment: 'game-controller',
  Health: 'medkit',
  Shopping: 'bag-handle',
  Bills: 'receipt',
  Other: 'ellipsis-horizontal-circle',
};

const CATEGORY_COLORS = {
  Food: '#EF9F27',
  Transport: '#3B82F6',
  Entertainment: '#8B5CF6',
  Health: '#10B981',
  Shopping: '#EC4899',
  Bills: '#F97316',
  Other: '#6B7280',
};

const TAG_COLORS = { Need: '#1D9E75', Want: '#EF9F27', Regret: '#E24B4A' };

export default function TransactionCard({ item, onTagPress }) {
  const iconName = CATEGORY_ICONS[item.category] || 'ellipsis-horizontal-circle';
  const iconColor = CATEGORY_COLORS[item.category] || '#6B7280';

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={styles.row}>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}</Text>
          {item.tag && (
            <TouchableOpacity onPress={() => onTagPress?.(item)} style={[styles.tag, { backgroundColor: TAG_COLORS[item.tag] + '22' }]}>
              <Text style={[styles.tagText, { color: TAG_COLORS[item.tag] }]}>{item.tag}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={[styles.amount, { color: item.type === 'income' ? '#1D9E75' : '#E24B4A' }]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  date: { fontSize: 12, color: '#9CA3AF' },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },
  amount: { fontSize: 15, fontWeight: '700' },
});
