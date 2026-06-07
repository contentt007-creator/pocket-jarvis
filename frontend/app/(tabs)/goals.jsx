import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, Alert, RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useFinance } from '../../context/FinanceContext';
import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';
import { Card, GradientCard, SectionHeader, Pill, IconButton, PrimaryButton } from '../../components/ui';
import MilestoneQuote from '../../components/MilestoneQuote';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api';

const ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📱', '💍', '🎓', '🏋️', '💰', '🎮', '🛡️'];

// ─── Goal card ─────────────────────────────────────────────────────────────
function GoalCard({ goal, onDeposit, onWhatIf, onDelete }) {
  const pct = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
  const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const complete = pct >= 100;

  // Estimated completion based on current pace
  const monthsLeft = daysLeft > 0 ? Math.ceil(daysLeft / 30) : 0;
  const eta = monthsLeft > 0 ? `${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} remaining` : 'Past due';

  return (
    <Card style={styles.goalCard} padding={0}>
      {/* Header strip */}
      <View style={styles.goalHeader}>
        <View style={styles.goalEmoji}>
          <Text style={{ fontSize: 28 }}>{goal.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
          <Text style={styles.goalEta}>{complete ? '🎉 Goal achieved!' : eta}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(goal)} style={styles.goalMenu}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress section */}
      <View style={styles.goalBody}>
        <View style={styles.goalAmountsRow}>
          <Text style={styles.goalSaved}>{formatCurrency(goal.savedAmount)}</Text>
          <Text style={styles.goalTarget}>of {formatCurrency(goal.targetAmount)}</Text>
        </View>

        <View style={styles.goalProgressBg}>
          <View style={[styles.goalProgressFill, { width: `${pct}%`, backgroundColor: complete ? colors.success : colors.primary }]} />
        </View>

        <View style={styles.goalFooter}>
          <View style={styles.goalPctBadge}>
            <Text style={[styles.goalPctText, { color: complete ? colors.success : colors.primary }]}>{pct}%</Text>
          </View>
          <Text style={styles.goalRemainText}>{formatCurrency(remaining)} to go</Text>
        </View>
      </View>

      {/* Actions */}
      {!complete && (
        <View style={styles.goalActions}>
          <TouchableOpacity style={styles.goalActionPrimary} onPress={() => onDeposit(goal)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.goalActionPrimaryText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goalActionSecondary} onPress={() => onWhatIf(goal)}>
            <Ionicons name="analytics-outline" size={16} color={colors.primary} />
            <Text style={styles.goalActionSecondaryText}>What if?</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function GoalsScreen() {
  const { goals, fetchGoals } = useFinance();
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);
  const [whatIfGoal, setWhatIfGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [milestoneQuote, setMilestoneQuote] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [tab, setTab] = useState('active'); // active | completed
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🎯', targetAmount: '', targetDate: '' });

  useEffect(() => { fetchGoals(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchGoals(); setRefreshing(false); };

  const addGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate)
      return Alert.alert('Required', 'Please fill all fields');
    try {
      await api.post('/goals', { ...newGoal, targetAmount: Number(newGoal.targetAmount) });
      await fetchGoals();
      setShowAdd(false);
      setNewGoal({ name: '', icon: '🎯', targetAmount: '', targetDate: '' });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not create goal');
    }
  };

  const doDeposit = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return Alert.alert('Invalid', 'Enter a valid amount');
    const { data } = await api.post(`/goals/${depositGoal._id}/deposit`, { amount: amt });
    if (data.newMilestones?.length > 0) {
      const pct = data.newMilestones[0];
      try {
        const qRes = await api.get('/masters/quote/contextual?situation=milestone');
        setMilestoneQuote({ quote: qRes.data.quote, expert: qRes.data.expert, color: qRes.data.avatarColor, pct, goalName: depositGoal.name });
      } catch { /* */ }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await fetchGoals();
    setDepositGoal(null);
    setDepositAmount('');
  };

  const deleteGoal = (goal) => {
    Alert.alert('Delete goal?', `Remove "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/goals/${goal._id}`); await fetchGoals();
      }},
    ]);
  };

  const loadWhatIf = async (goal) => {
    setWhatIfGoal(goal);
    setWhatIfResult(null);
    setWhatIfLoading(true);
    try {
      const { data } = await api.post('/ai/whatif', { goalId: goal._id });
      setWhatIfResult(data);
    } catch { setWhatIfResult({ projection: 'Could not analyze right now. Try again later.' }); }
    finally { setWhatIfLoading(false); }
  };

  const activeGoals    = goals.filter(g => g.savedAmount < g.targetAmount);
  const completedGoals = goals.filter(g => g.savedAmount >= g.targetAmount);
  const shownGoals     = tab === 'active' ? activeGoals : completedGoals;

  const totalSaved   = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget  = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════ Hero — Total Goal Savings ═════ */}
        <GradientCard colors={gradients.primary} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Total Goal Savings</Text>
              <Text style={styles.heroAmount}>{formatCurrency(totalSaved)}</Text>
              <Text style={styles.heroSub}>
                Across {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'}
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Text style={{ fontSize: 52 }}>🎯</Text>
            </View>
          </View>

          {totalTarget > 0 && (
            <View style={styles.heroProgress}>
              <View style={styles.heroProgressBg}>
                <View style={[styles.heroProgressFill, { width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.heroProgressLabel}>
                {Math.round((totalSaved / totalTarget) * 100)}% of {formatCurrency(totalTarget)}
              </Text>
            </View>
          )}
        </GradientCard>

        {/* ═════ Tabs ═════ */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'active' && styles.tabActive]} onPress={() => setTab('active')}>
            <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
              All Goals
            </Text>
            <View style={[styles.tabBadge, tab === 'active' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'active' && styles.tabBadgeTextActive]}>{activeGoals.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'completed' && styles.tabActive]} onPress={() => setTab('completed')}>
            <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
            <View style={[styles.tabBadge, tab === 'completed' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'completed' && styles.tabBadgeTextActive]}>{completedGoals.length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═════ Goal list ═════ */}
        {shownGoals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>{tab === 'active' ? 'No active goals' : 'No completed goals yet'}</Text>
            <Text style={styles.emptySub}>
              {tab === 'active' ? 'Tap the + button to set your first goal' : 'Keep saving — milestones await!'}
            </Text>
          </View>
        ) : (
          shownGoals.map(g => (
            <GoalCard key={g._id} goal={g}
                      onDeposit={setDepositGoal} onWhatIf={loadWhatIf} onDelete={deleteGoal} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═════ FAB ═════ */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.9}>
        <View style={styles.fabInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* ═════ Add goal modal ═════ */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalTop}>
            <Text style={styles.modalTitle}>New Goal</Text>
            <IconButton icon="close" onPress={() => setShowAdd(false)} bg={colors.cardSoft} />
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            <Text style={styles.fieldLabel}>Choose an icon</Text>
            <View style={styles.iconGrid}>
              {ICONS.map(ic => (
                <TouchableOpacity key={ic}
                                  style={[styles.iconBtn, newGoal.icon === ic && styles.iconBtnActive]}
                                  onPress={() => setNewGoal(p => ({ ...p, icon: ic }))}>
                  <Text style={{ fontSize: 22 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Goal name</Text>
            <TextInput style={styles.field} placeholder="e.g. Emergency Fund" placeholderTextColor={colors.textSoft}
                       value={newGoal.name} onChangeText={v => setNewGoal(p => ({ ...p, name: v }))} />

            <Text style={styles.fieldLabel}>Target amount (৳)</Text>
            <TextInput style={styles.field} placeholder="50000" keyboardType="numeric" placeholderTextColor={colors.textSoft}
                       value={newGoal.targetAmount} onChangeText={v => setNewGoal(p => ({ ...p, targetAmount: v }))} />

            <Text style={styles.fieldLabel}>Target date (YYYY-MM-DD)</Text>
            <TextInput style={styles.field} placeholder="2025-12-31" placeholderTextColor={colors.textSoft}
                       value={newGoal.targetDate} onChangeText={v => setNewGoal(p => ({ ...p, targetDate: v }))} />

            <View style={{ marginTop: spacing.xl }}>
              <PrimaryButton label="Create Goal" icon="flag-outline" onPress={addGoal} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ═════ Deposit modal ═════ */}
      <Modal visible={!!depositGoal} transparent animationType="slide" onRequestClose={() => setDepositGoal(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Deposit to {depositGoal?.name}</Text>
            <Text style={styles.sheetSub}>
              {formatCurrency(depositGoal?.savedAmount || 0)} / {formatCurrency(depositGoal?.targetAmount || 0)} saved
            </Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.amountPrefix}>৳</Text>
              <TextInput style={styles.amountInput} value={depositAmount} onChangeText={setDepositAmount}
                         keyboardType="numeric" autoFocus placeholder="0" placeholderTextColor={colors.textSoft} />
            </View>
            <PrimaryButton label="Add Money" icon="cash-outline" onPress={doDeposit} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDepositGoal(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═════ What-if modal ═════ */}
      <Modal visible={!!whatIfGoal} transparent animationType="slide" onRequestClose={() => setWhatIfGoal(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>What if?</Text>
            <Text style={styles.sheetSub}>{whatIfGoal?.name}</Text>
            {whatIfLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : whatIfResult && (
              <>
                <View style={styles.whatIfStats}>
                  <View style={styles.whatIfStat}>
                    <Text style={styles.whatIfStatValue}>{formatCurrency(whatIfResult.weeklyNeeded || 0)}</Text>
                    <Text style={styles.whatIfStatLabel}>per week</Text>
                  </View>
                  <View style={styles.whatIfStat}>
                    <Text style={styles.whatIfStatValue}>{whatIfResult.daysLeft || 0}d</Text>
                    <Text style={styles.whatIfStatLabel}>remaining</Text>
                  </View>
                  <View style={styles.whatIfStat}>
                    <Text style={styles.whatIfStatValue}>{formatCurrency(whatIfResult.remaining || 0)}</Text>
                    <Text style={styles.whatIfStatLabel}>to save</Text>
                  </View>
                </View>
                <View style={styles.whatIfCard}>
                  <Text style={styles.whatIfText}>{whatIfResult.projection}</Text>
                </View>
              </>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setWhatIfGoal(null)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═════ Milestone celebration ═════ */}
      <MilestoneQuote
        visible={!!milestoneQuote}
        milestone={milestoneQuote?.pct}
        quote={milestoneQuote?.quote}
        expert={milestoneQuote?.expert}
        expertColor={milestoneQuote?.color}
        goalName={milestoneQuote?.goalName}
        onClose={() => setMilestoneQuote(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },

  // Hero
  hero: { marginBottom: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  heroAmount: { ...typography.bigNumber, color: '#fff', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500', marginTop: 4 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroProgress: { marginTop: spacing.lg },
  heroProgressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.full, overflow: 'hidden' },
  heroProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: radius.full },
  heroProgressLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 8 },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, padding: 4, marginBottom: spacing.lg, ...shadows.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: colors.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, minWidth: 22, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabBadgeText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  tabBadgeTextActive: { color: '#fff' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.bodyBold, color: colors.text, marginTop: 8 },
  emptySub: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },

  // Goal card
  goalCard: { marginBottom: spacing.md, overflow: 'hidden' },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.sm },
  goalEmoji: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  goalName: { ...typography.bodyBold, color: colors.text, fontSize: 16 },
  goalEta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  goalMenu: { padding: 6 },

  goalBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  goalAmountsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: spacing.sm },
  goalSaved: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  goalTarget: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },

  goalProgressBg: { height: 8, backgroundColor: colors.borderSoft, borderRadius: radius.full, overflow: 'hidden' },
  goalProgressFill: { height: '100%', borderRadius: radius.full },

  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  goalPctBadge: { backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  goalPctText: { fontSize: 12, fontWeight: '800' },
  goalRemainText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  goalActions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
  goalActionPrimary: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, paddingVertical: 11, borderRadius: radius.md, ...shadows.primary, shadowOpacity: 0.18 },
  goalActionPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  goalActionSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primarySoft, paddingVertical: 11, borderRadius: radius.md },
  goalActionSecondaryText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20, zIndex: 100 },
  fabInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.primary },

  // Add modal
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  modalTitle: { ...typography.title, color: colors.text },

  fieldLabel: { ...typography.caption, color: colors.text, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  field: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  iconBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },

  // Deposit / what-if sheet
  sheetOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing['2xl'] },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: 4 },
  sheetSub: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },

  amountInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardSoft, borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 2, borderColor: colors.primary, marginBottom: spacing.lg },
  amountPrefix: { fontSize: 22, color: colors.primary, fontWeight: '800', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 22, color: colors.text, paddingVertical: 14, fontWeight: '700' },

  whatIfStats: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: spacing.lg, backgroundColor: colors.cardSoft, padding: spacing.lg, borderRadius: radius.lg },
  whatIfStat: { alignItems: 'center' },
  whatIfStatValue: { fontSize: 17, fontWeight: '800', color: colors.primary },
  whatIfStatLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  whatIfCard: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary, marginBottom: spacing.md },
  whatIfText: { fontSize: 14, color: colors.text, lineHeight: 21 },

  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  cancelBtnText: { color: colors.textMuted, fontSize: 15 },
});
