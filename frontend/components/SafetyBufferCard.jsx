import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatCurrency';

// Graham method: show safety buffer (total unspent below 80% of limit)
export default function SafetyBufferCard({ budgetCategories }) {
  const buffer = (budgetCategories || []).reduce((total, cat) => {
    if (cat.limit <= 0) return total;
    const safeLimit = cat.limit * 0.8;
    const buf = Math.max(safeLimit - cat.spent, 0);
    return total + buf;
  }, 0);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={18} color="#1D9E75" />
      </View>
      <View>
        <Text style={styles.label}>Safety Buffer</Text>
        <Text style={styles.sub}>Graham's 80% rule — unspent below safe zone</Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(buffer)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#1D9E75', marginVertical: 8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#065F46' },
  sub: { fontSize: 11, color: '#34D399', marginTop: 1 },
  amount: { marginLeft: 'auto', fontSize: 18, fontWeight: '800', color: '#065F46' },
});
