import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useMethod } from '../../context/MethodContext';
import { usePlan } from '../../context/PlanContext';
import { usePin } from '../../context/PinContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateHealthScore, scoreToGrade } from '../../utils/calculateHealth';
import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';
import { Card, GradientCard, SectionHeader, Pill, IconButton, StatCard, Avatar } from '../../components/ui';
import AddTransactionModal from '../../components/AddTransactionModal';
import api from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Health badge (small "A+" pill) ───────────────────────────────────────
function HealthBadge({ score }) {
  const { grade, color, label } = scoreToGrade(score);
  return (
    <View style={[styles.healthBadge, { backgroundColor: color + '18', borderColor: color + '30' }]}>
      <Text style={[styles.healthGrade, { color }]}>{grade}</Text>
      <View>
        <Text style={styles.healthLabelTop}>Financial Health</Text>
        <Text style={[styles.healthLabelBot, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Mini donut chart ──────────────────────────────────────────────────────
function MiniDonut({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const strokeWidth = 18;
  const radiusSize = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusSize;
  let offset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={radiusSize} stroke={colors.borderSoft} strokeWidth={strokeWidth} fill="none" />
        {data.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const rotation = (offset / total) * 360 - 90;
          offset += seg.value;
          return (
            <Circle
              key={i}
              cx={size/2} cy={size/2} r={radiusSize}
              stroke={seg.color} strokeWidth={strokeWidth} fill="none"
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="butt"
              transform={`rotate(${rotation} ${size/2} ${size/2})`}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { user } = useAuth();
  const { isFree, plan } = usePlan();
  const { activeMethod } = useMethod();
  const { hasPin } = usePin();
  const {
    transactions, summary, budget, goals,
    fetchTransactions, fetchSummary, fetchBudget, fetchGoals,
  } = useFinance();

  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [balance, setBalance] = useState(0);

  const load = useCallback(async () => {
    const month = new Date().toISOString().slice(0, 7);
    await Promise.all([
      fetchTransactions({ limit: 5 }),
      fetchSummary(month),
      fetchBudget(month),
      fetchGoals(),
    ]);
    try {
      const { data } = await api.get('/transactions', { params: { limit: 9999 } });
      const allTxns = data.transactions;
      const totalIn = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalOut = allTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setBalance((user?.initialBalance || 0) + totalIn - totalOut);
    } catch { setBalance(user?.initialBalance || 0); }
  }, [fetchTransactions, fetchSummary, fetchBudget, fetchGoals, user]);

  const loadInsight = useCallback(async () => {
    setInsightLoading(true);
    try {
      const { data } = await api.get('/ai/insight');
      setInsight(data.insight);
    } catch { setInsight("Track a few transactions and I'll spot patterns for you."); }
    finally { setInsightLoading(false); }
  }, []);

  useEffect(() => { load(); loadInsight(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); await loadInsight(); setRefreshing(false); };

  const healthScore = summary && budget ? calculateHealthScore({
    budgetCategories: budget.categories || [],
    monthlyIncome: summary.income,
    monthExpense: summary.expense,
    goals,
  }) : 75;

  const savedThisMonth = Math.max((summary?.income || 0) - (summary?.expense || 0), 0);
  const debtTotal = 0; // could compute from loans later

  // Spending breakdown for donut
  const spendData = Object.entries(summary?.categoryBreakdown || {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, color: colors.categories[name] || colors.textMuted }));
  const totalSpend = spendData.reduce((s, d) => s + d.value, 0);

  const recent = transactions.slice(0, 4);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ═════ Header ═════ */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.name} numberOfLines={1}>{user?.name || 'there'}</Text>
            <View style={{ marginTop: spacing.sm }}>
              <HealthBadge score={healthScore} />
            </View>
          </View>
          <View style={styles.headerActions}>
            <IconButton icon="notifications-outline" hasDot={isFree} onPress={() => router.push('/screens/upgrade')} />
            <TouchableOpacity onPress={() => router.push('/screens/profile')}>
              <Avatar name={user?.name || 'U'} size={44} bg={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═════ Balance Hero (gradient) ═════ */}
        <GradientCard colors={gradients.primary} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabel}>Total Balance</Text>
                <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.7)" />
              </View>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(balance)}</Text>
            </View>
            {summary?.income > 0 && (
              <View style={styles.heroGrowth}>
                <Ionicons name="trending-up" size={12} color="#fff" />
                <Text style={styles.heroGrowthText}>
                  {Math.round(((savedThisMonth) / (summary?.income || 1)) * 100)}%
                </Text>
              </View>
            )}
          </View>

          {/* Income / Expenses split */}
          <View style={styles.heroSplit}>
            <View style={styles.heroSplitItem}>
              <View style={styles.heroDot} />
              <View>
                <Text style={styles.heroSplitLabel}>Income</Text>
                <Text style={styles.heroSplitValue}>{formatCurrency(summary?.income || 0)}</Text>
              </View>
            </View>
            <View style={[styles.heroSplitItem, { alignItems: 'flex-end' }]}>
              <View>
                <Text style={styles.heroSplitLabel}>Expenses</Text>
                <Text style={styles.heroSplitValue}>{formatCurrency(summary?.expense || 0)}</Text>
              </View>
              <View style={[styles.heroDot, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
            </View>
          </View>
        </GradientCard>

        {/* ═════ Quick Stats Grid ═════ */}
        <View style={styles.statsGrid}>
          <StatCard icon="arrow-down-outline" iconColor={colors.success}
                    label="Income" value={formatCurrency(summary?.income || 0)} />
          <StatCard icon="arrow-up-outline" iconColor={colors.danger}
                    label="Expenses" value={formatCurrency(summary?.expense || 0)} />
        </View>
        <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
          <StatCard icon="wallet-outline" iconColor={colors.primary}
                    label="Savings" value={formatCurrency(savedThisMonth)} />
          <StatCard icon="card-outline" iconColor={colors.warning}
                    label="Goals" value={String(goals?.length || 0)} />
        </View>

        {/* ═════ Spending Breakdown ═════ */}
        {spendData.length > 0 && (
          <>
            <SectionHeader title="Spending Breakdown" action={() => router.push('/(tabs)/reports')} />
            <Card>
              <View style={styles.spendRow}>
                <View style={styles.donutWrap}>
                  <MiniDonut data={spendData} size={130} />
                  <View style={styles.donutCenter}>
                    <Text style={styles.donutAmount}>{formatCurrency(totalSpend)}</Text>
                    <Text style={styles.donutLabel}>this month</Text>
                  </View>
                </View>
                <View style={styles.legendList}>
                  {spendData.slice(0, 5).map((seg, i) => {
                    const pct = Math.round((seg.value / totalSpend) * 100);
                    return (
                      <View key={i} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                        <Text style={styles.legendName}>{seg.name}</Text>
                        <Text style={styles.legendPct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>
          </>
        )}

        {/* ═════ AI Insight Card ═════ */}
        <SectionHeader title="Jarvis Insight" />
        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIcon}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </View>
            <Text style={styles.insightLabel}>AI Analysis</Text>
            <Pill label={plan?.toUpperCase() || 'FREE'} color={colors.primary} />
          </View>
          {insightLoading ? (
            <ActivityIndicator color={colors.primary} size="small" style={{ marginTop: spacing.md }} />
          ) : (
            <Text style={styles.insightText}>{insight}</Text>
          )}
          <TouchableOpacity style={styles.insightBtn} onPress={() => router.push('/(tabs)/jarvis')}>
            <Text style={styles.insightBtnText}>See Analysis</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* ═════ PIN setup banner ═════ */}
        {!hasPin && (
          <TouchableOpacity
            style={styles.pinBanner}
            onPress={() => router.push('/screens/set-pin')}
            activeOpacity={0.85}
          >
            <View style={styles.pinBannerIcon}>
              <Ionicons name="lock-closed" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pinBannerTitle}>Secure your account</Text>
              <Text style={styles.pinBannerSub}>Set a 4-digit PIN — required every time you open the app</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* ═════ Quick Actions ═════ */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickGrid}>
          <QuickAction icon="list-outline" label="Transactions" color={colors.primary}
                       onPress={() => router.push('/screens/transactions')} />
          <QuickAction icon="cash-outline" label="Lend Money" color={colors.success}
                       onPress={() => router.push('/screens/loans')} />
          <QuickAction icon="repeat-outline" label="Subs & Debts" color={colors.warning}
                       onPress={() => router.push('/screens/subscriptions')} />
          <QuickAction icon="school-outline" label="Money Masters" color={colors.danger}
                       onPress={() => router.push('/screens/masters')} />
        </View>

        {/* ═════ Recent Transactions ═════ */}
        {recent.length > 0 && (
          <>
            <SectionHeader title="Recent Activity" action={() => router.push('/screens/transactions')} />
            <Card padding={0}>
              {recent.map((t, i) => (
                <TxRow key={t._id} item={t} isLast={i === recent.length - 1} />
              ))}
            </Card>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═════ FAB ═════ */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.9}>
        <View style={styles.fabInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </TouchableOpacity>

      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={() => { setShowAddModal(false); load(); }}
      />
    </SafeAreaView>
  );
}

// ─── Quick action button ───────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Transaction row ───────────────────────────────────────────────────────
function TxRow({ item, isLast }) {
  const iconMap = {
    Food: 'restaurant-outline', Transport: 'car-outline', Entertainment: 'game-controller-outline',
    Health: 'medkit-outline', Shopping: 'bag-handle-outline', Bills: 'receipt-outline', Other: 'apps-outline',
  };
  const cat = item.category || 'Other';
  const catColor = colors.categories[cat] || colors.textMuted;

  return (
    <View style={[styles.txRow, !isLast && styles.txRowBorder]}>
      <View style={[styles.txIcon, { backgroundColor: catColor + '18' }]}>
        <Ionicons name={iconMap[cat] || 'apps-outline'} size={18} color={catColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.txMeta}>
          {cat} · {new Date(item.date).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: item.type === 'income' ? colors.success : colors.text }]}>
        {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: spacing.md, marginBottom: spacing.xl },
  greeting: { ...typography.caption, color: colors.textMuted },
  name: { ...typography.title, color: colors.text, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },

  healthBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, alignSelf: 'flex-start', borderWidth: 1 },
  healthGrade: { fontSize: 18, fontWeight: '900' },
  healthLabelTop: { fontSize: 9, color: colors.textMuted, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  healthLabelBot: { fontSize: 12, fontWeight: '700' },

  // Hero card
  heroCard: { marginBottom: spacing.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  heroAmount: { ...typography.bigNumber, color: '#fff', marginTop: 4 },
  heroGrowth: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.full },
  heroGrowthText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  heroSplit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  heroSplitItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  heroSplitLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  heroSplitValue: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: spacing.md },

  // Spending donut
  spendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  donutWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutAmount: { fontSize: 17, fontWeight: '800', color: colors.text },
  donutLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  legendList: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '500' },
  legendPct: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },

  // Insight card
  insightCard: { borderWidth: 1, borderColor: colors.primarySoft },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  insightIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  insightLabel: { flex: 1, ...typography.bodyBold, color: colors.text, fontSize: 14 },
  insightText: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  insightBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, alignSelf: 'flex-start' },
  insightBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  // PIN banner
  pinBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.primary + '30' },
  pinBannerIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pinBannerTitle: { ...typography.bodyBold, color: colors.primary, fontSize: 14 },
  pinBannerSub: { ...typography.caption, color: colors.text, marginTop: 2 },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickAction: { width: (SCREEN_W - spacing.lg * 2 - spacing.md) / 2, ...shadows.sm, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quickActionIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { ...typography.body, color: colors.text, fontWeight: '600' },

  // Transactions
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  txIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txTitle: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
  txMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800', color: colors.text },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20, zIndex: 100 },
  fabInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.primary },
});
