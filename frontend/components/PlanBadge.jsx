import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlan } from '../context/PlanContext';

const PLAN_CONFIG = {
  free:    { label: 'Free',    bg: '#F3F4F6', color: '#6B7280', icon: 'person-outline' },
  pro:     { label: 'Pro',     bg: '#F5F3FF', color: '#534AB7', icon: 'star' },
  premium: { label: 'Premium', bg: '#FEF9C3', color: '#D97706', icon: 'diamond' },
};

export default function PlanBadge({ style }) {
  const { plan, endDate } = usePlan();
  const cfg = PLAN_CONFIG[plan] || PLAN_CONFIG.free;

  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: cfg.bg }, style]}
      onPress={() => router.push('/screens/upgrade')}
    >
      <Ionicons name={cfg.icon} size={13} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
      {plan === 'free' && <Text style={styles.upgrade}>Upgrade</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  label: { fontSize: 12, fontWeight: '700' },
  upgrade: { fontSize: 11, color: '#534AB7', fontWeight: '600', marginLeft: 2 },
});
