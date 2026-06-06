import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinance } from '../../context/FinanceContext';
import { useMethod } from '../../context/MethodContext';
import BudgetBar from '../../components/BudgetBar';
import JARSBreakdown from '../../components/JARSBreakdown';
import SafetyBufferCard from '../../components/SafetyBufferCard';
import QuoteTipCard from '../../components/QuoteTipCard';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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
  const totalSpent = budget?.categories?.reduce((s, c) => s + c.spent, 0) || 0;
  const overCats = budget?.categories?.filter(c => c.limit > 0 && c.spent / c.limit >= 0.85) || [];

  const changeMonth = (dir) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  if (!budget) return <ActivityIndicator color="#534AB7" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={20} color="#534AB7" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{new Date(month + '-01').toLocaleDateString('en-BD', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn} disabled={month >= currentMonth()}>
          <Ionicons name="chevron-forward" size={20} color={month >= currentMonth() ? '#D1D5DB' : '#534AB7'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#534AB7" />}
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total spent</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryLabel}>Budgeted</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalBudgeted)}</Text>
            </View>
          </View>
          <View style={styles.overallBarBg}>
            <View style={[styles.overallBarFill, {
              width: totalBudgeted > 0 ? `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%` : '0%',
              backgroundColor: totalSpent > totalBudgeted ? '#E24B4A' : '#534AB7',
            }]} />
          </View>
        </View>

        {/* Jarvis warning */}
        {overCats.length > 0 && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.warningTitle}>Jarvis Warning</Text>
            </View>
            <Text style={styles.warningText}>
              {overCats[0].name} is at {Math.round((overCats[0].spent / overCats[0].limit) * 100)}% of budget.
              {overCats.length > 1 ? ` Plus ${overCats.length - 1} more categor${overCats.length > 2 ? 'ies' : 'y'} approaching limit.` : ''} Consider reducing spending in {overCats[0].name.toLowerCase()} for the rest of the month.
            </Text>
          </View>
        )}

        {/* Method-specific panels */}
        {activeMethod === 'dave-ramsey' && (() => {
          const monthlyIncome = summary?.income || 0;
          const totalAssigned = budget.categories.reduce((s, c) => s + c.limit, 0);
          const unassigned = monthlyIncome - totalAssigned;
          return (
            <View style={[styles.methodPanel, { borderColor: '#E24B4A' }]}>
              <Text style={[styles.methodPanelTitle, { color: '#E24B4A' }]}>Zero-Based Budget</Text>
              <Text style={styles.methodPanelSub}>Every taka must have a name</Text>
              <Text style={[styles.methodPanelValue, { color: unassigned === 0 ? '#1D9E75' : unassigned < 0 ? '#E24B4A' : '#EF9F27' }]}>
                {unassigned === 0 ? '✓ Fully assigned' : unassigned > 0 ? `৳${unassigned.toLocaleString()} left to assign` : `৳${Math.abs(unassigned).toLocaleString()} over-assigned`}
              </Text>
            </View>
          );
        })()}

        {activeMethod === 'harv-eker' && (
          <JARSBreakdown monthlyIncome={summary?.income || 0} />
        )}

        {activeMethod === 'benjamin-graham' && (
          <SafetyBufferCard budgetCategories={budget.categories} />
        )}

        {/* Category bars */}
        {budget.categories.map(cat => {
          const pct = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;
          // Graham: show 80% safety marker; also show quote tip at 90%+
          const grahamWarning = activeMethod === 'benjamin-graham' && pct >= 80;
          return (
            <View key={cat.name}>
              <BudgetBar
                cat={cat}
                onPress={() => { setEditCat(cat); setEditLimit(String(cat.limit)); }}
                showSafetyMarker={activeMethod === 'benjamin-graham'}
              />
              {pct >= 90 && (
                <QuoteTipCard
                  quote="A budget is telling your money where to go instead of wondering where it went."
                  expert="Dave Ramsey"
                  color="#E24B4A"
                />
              )}
              {grahamWarning && pct < 90 && (
                <QuoteTipCard
                  quote="The essence of investment management is the management of risks, not the management of returns."
                  expert="Benjamin Graham"
                  color="#1D9E75"
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Edit limit modal */}
      <Modal visible={!!editCat} transparent animationType="slide" onRequestClose={() => setEditCat(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Set limit for {editCat?.name}</Text>
            <Text style={styles.sheetSub}>Currently spent: {formatCurrency(editCat?.spent)}</Text>
            <View style={styles.inputRow}>
              <Text style={styles.prefix}>৳</Text>
              <TextInput
                style={styles.limitInput} value={editLimit} onChangeText={setEditLimit}
                keyboardType="numeric" autoFocus placeholder="0" placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveLimit}>
              <Text style={styles.saveBtnText}>Save Limit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditCat(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  monthBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  overallBarBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
  overallBarFill: { height: '100%', borderRadius: 10 },
  warningCard: { backgroundColor: '#534AB7', borderRadius: 16, padding: 16, marginBottom: 12 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  warningTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  warningText: { color: '#C4BFEE', fontSize: 13, lineHeight: 19 },
  methodPanel: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5 },
  methodPanelTitle: { fontSize: 14, fontWeight: '800' },
  methodPanelSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2, marginBottom: 8 },
  methodPanelValue: { fontSize: 18, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sheetSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, borderWidth: 2, borderColor: '#534AB7', marginBottom: 16 },
  prefix: { fontSize: 22, color: '#534AB7', fontWeight: '700', marginRight: 4 },
  limitInput: { flex: 1, fontSize: 22, color: '#111827', paddingVertical: 14 },
  saveBtn: { backgroundColor: '#534AB7', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: '#9CA3AF', fontSize: 15 },
});
