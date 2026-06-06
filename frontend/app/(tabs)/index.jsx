import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { calculateHealthScore } from '../../utils/calculateHealth';
import TransactionCard from '../../components/TransactionCard';
import AIInsightCard from '../../components/AIInsightCard';
import StatCard from '../../components/StatCard';
import HealthRing from '../../components/HealthRing';
import AddTransactionModal from '../../components/AddTransactionModal';
import EmptyState from '../../components/EmptyState';
import DailyWisdomCard from '../../components/DailyWisdomCard';
import MethodBadge from '../../components/MethodBadge';
import PlanBadge from '../../components/PlanBadge';
import { useMethod } from '../../context/MethodContext';
import { usePlan } from '../../context/PlanContext';
import api from '../../services/api';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { activeMethod } = useMethod();
  const { isFree } = usePlan();
  const { transactions, summary, budget, goals, fetchTransactions, fetchSummary, fetchBudget, fetchGoals } = useFinance();
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [balance, setBalance] = useState(0);

  const load = useCallback(async () => {
    const month = new Date().toISOString().slice(0, 7);
    await Promise.all([
      fetchTransactions({ limit: 5 }),
      fetchSummary(month),
      fetchBudget(month),
      fetchGoals(),
    ]);

    // compute balance
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
    } catch { setInsight('Keep tracking your spending to get personalized tips from Jarvis.'); }
    finally { setInsightLoading(false); }
  }, []);

  useEffect(() => { load(); loadInsight(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); await loadInsight(); setRefreshing(false); };

  const healthScore = summary && budget ? calculateHealthScore({
    budgetCategories: budget.categories || [],
    monthlyIncome: summary.income,
    monthExpense: summary.expense,
    goals,
  }) : 0;

  const recent = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#534AB7" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{user?.name?.split(' ')[0] || 'there'} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <PlanBadge />
            <MethodBadge activeMethod={activeMethod} onPress={() => router.push('/screens/masters')} />
            <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/screens/masters')}>
              <Ionicons name="school-outline" size={22} color="#534AB7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceRow}>
            <HealthRing score={healthScore} size={80} />
            <View style={styles.balanceMeta}>
              <Text style={styles.tagline}>Your money. Your move.</Text>
              <TouchableOpacity style={styles.viewReports} onPress={() => router.push('/(tabs)/reports')}>
                <Text style={styles.viewReportsText}>View Reports</Text>
                <Ionicons name="arrow-forward" size={14} color="#534AB7" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statRow}>
          <StatCard label="Spent this month" value={formatCurrency(summary?.expense || 0)} icon="trending-down" iconColor="#E24B4A" bg="#FEF2F2" />
          <StatCard label="Saved this month" value={formatCurrency(Math.max((summary?.income || 0) - (summary?.expense || 0), 0))} icon="trending-up" iconColor="#1D9E75" bg="#ECFDF5" />
        </View>

        {/* AI Insight */}
        <AIInsightCard insight={insight} loading={insightLoading} />

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/screens/transactions')}>
            <Ionicons name="list" size={20} color="#534AB7" />
            <Text style={styles.quickBtnText}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/screens/loans')}>
            <Ionicons name="cash-outline" size={20} color="#1D9E75" />
            <Text style={[styles.quickBtnText, { color: '#1D9E75' }]}>Lend Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/screens/subscriptions')}>
            <Ionicons name="repeat" size={20} color="#534AB7" />
            <Text style={styles.quickBtnText}>Subs & Debts</Text>
          </TouchableOpacity>
        </View>

        {/* Daily wisdom */}
        <View style={styles.section}>
          <DailyWisdomCard onPress={(q) => router.push({ pathname: '/screens/expert-detail', params: { slug: q.expert?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '') } })} />
        </View>

        {/* Recent transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => router.push('/screens/transactions')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Tap + to record your first one" />
          ) : (
            recent.map(txn => <TransactionCard key={txn._id} item={txn} />)
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={showModal} onClose={() => setShowModal(false)}
        onAdded={() => { setShowModal(false); load(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  greeting: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  balanceCard: { backgroundColor: '#534AB7', borderRadius: 24, padding: 22, marginBottom: 16 },
  balanceLabel: { fontSize: 13, color: '#C4BFEE', fontWeight: '500', marginBottom: 4 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  balanceMeta: { flex: 1 },
  tagline: { fontSize: 13, color: '#C4BFEE', fontStyle: 'italic', marginBottom: 10 },
  viewReports: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  viewReportsText: { color: '#534AB7', fontWeight: '700', fontSize: 13 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 16 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F5F3FF', borderRadius: 14, paddingVertical: 14 },
  quickBtnText: { fontSize: 14, fontWeight: '600', color: '#534AB7' },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  seeAll: { fontSize: 13, color: '#534AB7', fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#534AB7', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowColor: '#534AB7', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
