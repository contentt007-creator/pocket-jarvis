import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { useFinance } from '../../context/FinanceContext';
import { useMethod } from '../../context/MethodContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';
import { Card, GradientCard, SectionHeader, Pill, IconButton } from '../../components/ui';
import JARSBreakdown from '../../components/JARSBreakdown';
import api from '../../services/api';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Animated circular progress ring ──────────────────────────────────────
function ProgressRing({ value, size = 200, strokeWidth = 18, color = '#fff', track = 'rgba(255,255,255,0.25)' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value, 0), 100);
  const dash = (pct / 100) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        <Circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ - dash}`} />
      </Svg>
    </View>
  );
}

// ─── Category row ─────────────────────────────────────────────────────────
function CategoryRow({ cat, onPress }) {
  const pct = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;
  const color = pct >= 100 ? colors.danger : pct >= 85 ? colors.warning : (colors.categories[cat.name] || colors.primary);
  const iconMap = {
    Food: 'restaurant', Transport: 'car', Entertainment: 'game-controller',
    Health: 'medkit', Shopping: 'bag-handle', Bills: 'receipt', Other: 'apps',
  };

  return (
    <TouchableOpacity style={styles.catRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.catIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={iconMap[cat.name] || 'apps'} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.catTopRow}>
          <Text style={styles.catName}>{cat.name}</Text>
          <Text style={styles.catAmount}>
            {formatCurrency(cat.spent)} <Text style={styles.catLimit}>/ {formatCurrency(cat.limit || 0)}</Text>
          </Text>
        </View>
        <View style={styles.catBarRow}>
          <View style={styles.catBarBg}>
            <View style={[styles.catBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
          </View>
          <Text style={[styles.catPct, { color }]}>{pct}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function BudgetScreen() {
  const { budget, fetchBudget, summary } = useFinance();
  const { activeMethod } = useMethod();
  const [month, setMonth] = useState(currentMonth());
  const [refreshing, setRefreshing] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [editLimit, setEditLimit] = useState('');

  useEffect(() => { fetchBudget(month); }, [month]);

  const onRefresh = async () => { setRefreshing(true); await fetchBudget(month); setRefreshing(false); };

  const saveLimit = async () => {
    const val = Number(editLimit);
    if (isNaN(val) || val < 0) return Alert.alert('Invalid', 'Enter a valid amount');
    await api.put(`/budgets/${month}`, { categories: [{ name: editCat.name, limit: val }] });
    await fetchBudget(month);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditCat(null);
  };

  const totalBudgeted = budget?.categories?.reduce((s, c) => s + c.limit, 0) || 0;
  const totalSpent    = budget?.categories?.reduce((s, c) => s + c.spent, 0) || 0;
  const pctUsed       = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const overCats      = budget?.categories?.filter(c => c.limit > 0 && c.spent / c.limit >= 0.85) || [];

  const changeMonth = (dir) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });

  if (!budget) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════ Top bar with month selector ═════ */}
        <View style={styles.topBar}>
          <IconButton icon="chevron-back" onPress={() => changeMonth(-1)} bg={colors.card} />
          <View style={styles.monthBlock}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </View>
          <IconButton icon="chevron-forward" onPress={() => changeMonth(1)} bg={colors.card} />
        </View>

        {/* ═════ Hero — circular ring ═════ */}
        <GradientCard colors={gradients.primary} style={styles.heroCard}>
          <View style={styles.heroInner}>
            <ProgressRing value={pctUsed} size={210} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringLabel}>Budget Used</Text>
              <Text style={styles.ringPct}>{pctUsed}%</Text>
              <Text style={styles.ringAmount}>
                {formatCurrency(totalSpent)}
                <Text style={styles.ringDivider}> / {formatCurrency(totalBudgeted)}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Remaining</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(Math.max(totalBudgeted - totalSpent, 0))}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Daily Avg</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(Math.round(totalSpent / Math.max(new Date().getDate(), 1)))}
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* ═════ AI Suggestion ═════ */}
        {overCats.length > 0 && (
          <Card style={styles.suggestion}>
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionIcon}>
                <Ionicons name="bulb" size={14} color="#fff" />
              </View>
              <Text style={styles.suggestionTag}>Jarvis Suggestion</Text>
            </View>
            <Text style={styles.suggestionText}>
              {overCats[0].name} is at {Math.round((overCats[0].spent / overCats[0].limit) * 100)}% of budget.
              {overCats.length > 1 ? ` Plus ${overCats.length - 1} more categor${overCats.length > 2 ? 'ies' : 'y'} need attention.` : ''}
              {' '}Try reducing {overCats[0].name.toLowerCase()} spending by 10% to stay on target.
            </Text>
          </Card>
        )}

        {/* ═════ Method-specific panel ═════ */}
        {activeMethod === 'harv-eker' && (
          <View style={{ marginTop: spacing.lg }}>
            <JARSBreakdown monthlyIncome={summary?.income || 0} />
          </View>
        )}

        {/* ═════ Category Budgets ═════ */}
        <SectionHeader title="Categories" actionLabel="Edit"
                       action={() => Alert.alert('Tip', 'Tap any category to set its limit')} />
        <Card padding={0}>
          {budget.categories.map((cat, i) => (
            <View key={cat.name}>
              <CategoryRow cat={cat} onPress={() => { setEditCat(cat); setEditLimit(String(cat.limit)); }} />
              {i < budget.categories.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═════ Edit limit modal ═════ */}
      <Modal visible={!!editCat} transparent animationType="slide" onRequestClose={() => setEditCat(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set limit for {editCat?.name}</Text>
            <Text style={styles.modalSub}>Currently spent: {formatCurrency(editCat?.spent || 0)}</Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalPrefix}>৳</Text>
              <TextInput
                style={styles.modalInput} value={editLimit} onChangeText={setEditLimit}
                keyboardType="numeric" autoFocus placeholder="0" placeholderTextColor={colors.textSoft}
              />
            </View>
            <TouchableOpacity style={styles.modalSave} onPress={saveLimit}>
              <Text style={styles.modalSaveText}>Save Limit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setEditCat(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md, marginBottom: spacing.lg },
  monthBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthLabel: { ...typography.bodyBold, color: colors.text, fontSize: 16 },

  // Hero
  heroCard: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  heroInner: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  ringPct: { color: '#fff', fontSize: 52, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
  ringAmount: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 4 },
  ringDivider: { color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  heroBottom: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', alignSelf: 'stretch' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  heroStatValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.18)' },

  // Suggestion
  suggestion: { marginTop: spacing.lg, borderWidth: 1, borderColor: colors.primarySoft },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  suggestionIcon: { width: 24, height: 24, borderRadius: 7, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  suggestionTag: { fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 0.2 },
  suggestionText: { ...typography.body, color: colors.text, lineHeight: 22 },

  // Categories
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  catIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catName: { ...typography.bodyBold, color: colors.text },
  catAmount: { fontSize: 13, fontWeight: '700', color: colors.text },
  catLimit: { color: colors.textMuted, fontWeight: '500' },
  catBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catBarBg: { flex: 1, height: 6, backgroundColor: colors.borderSoft, borderRadius: radius.full, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: radius.full },
  catPct: { fontSize: 12, fontWeight: '800', minWidth: 36, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginLeft: spacing.lg + 40 + spacing.md },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing['2xl'] },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: 4 },
  modalSub: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardSoft, borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 2, borderColor: colors.primary, marginBottom: spacing.lg },
  modalPrefix: { fontSize: 22, color: colors.primary, fontWeight: '800', marginRight: 4 },
  modalInput: { flex: 1, fontSize: 22, color: colors.text, paddingVertical: 14, fontWeight: '700' },
  modalSave: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', ...shadows.primary, shadowOpacity: 0.25 },
  modalSaveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalCancel: { alignItems: 'center', paddingVertical: spacing.md, marginTop: 4 },
  modalCancelText: { color: colors.textMuted, fontSize: 15 },
});
