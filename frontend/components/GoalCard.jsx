import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatCurrency';

export default function GoalCard({ goal, onDeposit, onWhatIf }) {
  const pct = Math.round((goal.savedAmount / goal.targetAmount) * 100);
  const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
  const weeksLeft = Math.max(daysLeft / 7, 1);
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const weeklyNeeded = Math.ceil(remaining / weeksLeft);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{goal.icon}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{goal.name}</Text>
          <Text style={styles.sub}>{daysLeft > 0 ? `${daysLeft} days left` : 'Past due'}</Text>
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` }]} />
      </View>

      <View style={styles.amounts}>
        <Text style={styles.saved}>{formatCurrency(goal.savedAmount)} saved</Text>
        <Text style={styles.target}>of {formatCurrency(goal.targetAmount)}</Text>
      </View>

      <Text style={styles.weekly}>Save {formatCurrency(weeklyNeeded)}/week to hit this on time</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => onDeposit?.(goal)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.btnPrimaryText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => onWhatIf?.(goal)}>
          <Ionicons name="analytics-outline" size={16} color="#534AB7" />
          <Text style={styles.btnSecondaryText}>What if?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  icon: { fontSize: 28 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  pct: { fontSize: 20, fontWeight: '800', color: '#534AB7' },
  barBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', backgroundColor: '#534AB7', borderRadius: 10 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  saved: { fontSize: 13, fontWeight: '600', color: '#374151' },
  target: { fontSize: 13, color: '#9CA3AF' },
  weekly: { fontSize: 12, color: '#1D9E75', fontWeight: '600', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#534AB7', borderRadius: 12, paddingVertical: 10, gap: 4 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF', borderRadius: 12, paddingVertical: 10, gap: 4 },
  btnSecondaryText: { color: '#534AB7', fontWeight: '700', fontSize: 14 },
});
