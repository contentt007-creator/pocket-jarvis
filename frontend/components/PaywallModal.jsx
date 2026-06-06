import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const FEATURE_LABELS = {
  aiChat:            { icon: 'sparkles',        label: 'Jarvis AI Chat',        plan: 'Pro' },
  aiInsight:         { icon: 'bulb-outline',    label: 'AI Insights',           plan: 'Pro' },
  reports:           { icon: 'bar-chart',       label: 'Reports & Charts',      plan: 'Pro' },
  subscriptionsDebts:{ icon: 'repeat',          label: 'Subscriptions & Debts', plan: 'Pro' },
  lendMoney:         { icon: 'cash-outline',    label: 'Lend Money',            plan: 'Pro' },
  moneyMasters:      { icon: 'school-outline',  label: 'Money Masters',         plan: 'Pro' },
  applyBudgetMethod: { icon: 'options-outline', label: 'Budgeting Methods',     plan: 'Premium' },
  whatIf:            { icon: 'analytics',       label: 'What-If Analysis',      plan: 'Premium' },
  dailyWisdom:       { icon: 'book-outline',    label: 'Daily Wisdom',          plan: 'Premium' },
  transactionLimit:  { icon: 'list',            label: 'Unlimited Transactions', plan: 'Pro' },
  goalLimit:         { icon: 'flag-outline',    label: 'More Goals',            plan: 'Pro' },
};

export default function PaywallModal({ visible, feature, onClose }) {
  const info = FEATURE_LABELS[feature] || { icon: 'lock-closed', label: 'This feature', plan: 'Pro' };
  const isPremiumFeature = info.plan === 'Premium';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: isPremiumFeature ? '#FEF9C3' : '#F5F3FF' }]}>
            <Ionicons name={info.icon} size={32} color={isPremiumFeature ? '#D97706' : '#534AB7'} />
          </View>

          {/* Lock badge */}
          <View style={[styles.planBadge, { backgroundColor: isPremiumFeature ? '#D97706' : '#534AB7' }]}>
            <Ionicons name="lock-closed" size={11} color="#fff" />
            <Text style={styles.planBadgeText}>{info.plan} Feature</Text>
          </View>

          <Text style={styles.title}>{info.label}</Text>
          <Text style={styles.subtitle}>
            Unlock {info.label} and more with Pocket Jarvis {info.plan}.
            {isPremiumFeature
              ? ' Available from ৳150/month.'
              : ' Starting at just ৳99/month.'}
          </Text>

          {/* Mini plan highlights */}
          <View style={styles.highlights}>
            {isPremiumFeature ? (
              <>
                <Highlight text="Unlimited Jarvis AI messages" />
                <Highlight text="Apply budgeting methods (JARS, Ramsey…)" />
                <Highlight text="What-If goal analysis" />
                <Highlight text="Daily Wisdom cards" />
              </>
            ) : (
              <>
                <Highlight text="Unlimited transactions" />
                <Highlight text="Jarvis AI chat (30 msg/day)" />
                <Highlight text="Full Reports & Charts" />
                <Highlight text="Subscriptions, Debts & Lend Money" />
              </>
            )}
          </View>

          {/* CTAs */}
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: isPremiumFeature ? '#D97706' : '#534AB7' }]}
            onPress={() => { onClose(); router.push('/screens/upgrade'); }}
          >
            <Text style={styles.upgradeBtnText}>See Plans — from ৳99/mo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
            <Text style={styles.laterBtnText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Highlight({ text }) {
  return (
    <View style={styles.highlightRow}>
      <Ionicons name="checkmark-circle" size={16} color="#1D9E75" />
      <Text style={styles.highlightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 28, alignItems: 'center', width: '100%' },
  iconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  planBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  highlights: { alignSelf: 'stretch', gap: 8, marginBottom: 24 },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  highlightText: { fontSize: 14, color: '#374151' },
  upgradeBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  laterBtn: { paddingVertical: 10 },
  laterBtnText: { color: '#9CA3AF', fontSize: 15 },
});
