import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, RefreshControl, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import EmptyState from '../../components/EmptyState';

const PURPLE = '#534AB7';
const GREEN  = '#1D9E75';
const RED    = '#E24B4A';
const AMBER  = '#EF9F27';

function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

function statusColor(loan) {
  if (loan.isSettled) return GREEN;
  if (loan.dueDate && daysUntil(loan.dueDate) < 0) return RED;
  if (loan.dueDate && daysUntil(loan.dueDate) <= 3) return AMBER;
  return PURPLE;
}

function statusLabel(loan) {
  if (loan.isSettled) return 'Settled';
  const pct = loan.amount > 0 ? Math.round((loan.amountRepaid / loan.amount) * 100) : 0;
  if (pct > 0) return `${pct}% repaid`;
  if (loan.dueDate) {
    const d = daysUntil(loan.dueDate);
    if (d < 0) return `Overdue ${Math.abs(d)}d`;
    if (d === 0) return 'Due today';
    return `Due in ${d}d`;
  }
  return 'Active';
}

// ─── Loan Card ────────────────────────────────────────────────────────────────
function LoanCard({ loan, onRepayment, onSettle, onDelete, onViewHistory }) {
  const outstanding = Math.max(loan.amount - loan.amountRepaid, 0);
  const pct = loan.amount > 0 ? Math.min((loan.amountRepaid / loan.amount) * 100, 100) : 0;
  const color = statusColor(loan);

  return (
    <View style={[styles.card, loan.isSettled && styles.cardSettled]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: color + '22' }]}>
          <Text style={[styles.avatarLetter, { color }]}>{loan.personName[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.personName}>{loan.personName}</Text>
          {loan.purpose ? <Text style={styles.purpose}>{loan.purpose}</Text> : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.statusText, { color }]}>{statusLabel(loan)}</Text>
        </View>
      </View>

      {/* Amounts */}
      <View style={styles.amountRow}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Lent</Text>
          <Text style={styles.amountValue}>{formatCurrency(loan.amount)}</Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Repaid</Text>
          <Text style={[styles.amountValue, { color: GREEN }]}>{formatCurrency(loan.amountRepaid)}</Text>
        </View>
        <View style={styles.amountDivider} />
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Outstanding</Text>
          <Text style={[styles.amountValue, { color: outstanding > 0 ? RED : GREEN }]}>
            {formatCurrency(outstanding)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      {!loan.isSettled && (
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? GREEN : PURPLE }]} />
        </View>
      )}

      {/* Due date */}
      {loan.dueDate && !loan.isSettled && (
        <View style={styles.dueDateRow}>
          <Ionicons name="calendar-outline" size={13} color={color} />
          <Text style={[styles.dueDateText, { color }]}>
            {daysUntil(loan.dueDate) < 0
              ? `Overdue by ${Math.abs(daysUntil(loan.dueDate))} days`
              : daysUntil(loan.dueDate) === 0
                ? 'Due today!'
                : `Due ${new Date(loan.dueDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </Text>
        </View>
      )}

      {/* Actions */}
      {!loan.isSettled && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => onRepayment(loan)}>
            <Ionicons name="cash-outline" size={15} color="#fff" />
            <Text style={styles.actionBtnPrimaryText}>Record repayment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => onSettle(loan)}>
            <Ionicons name="checkmark-circle-outline" size={15} color={GREEN} />
            <Text style={[styles.actionBtnSecondaryText, { color: GREEN }]}>Settle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer links */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => onViewHistory(loan)}>
          <Ionicons name="time-outline" size={13} color="#9CA3AF" />
          <Text style={styles.footerBtnText}>
            {loan.repayments?.length || 0} repayment{loan.repayments?.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={() => onDelete(loan)}>
          <Ionicons name="trash-outline" size={13} color={RED} />
          <Text style={[styles.footerBtnText, { color: RED }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function LoansScreen() {
  const [loans, setLoans]         = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('active'); // 'active' | 'settled' | 'all'

  // Modals
  const [showAdd, setShowAdd]         = useState(false);
  const [repaymentLoan, setRepaymentLoan] = useState(null);
  const [historyLoan, setHistoryLoan]   = useState(null);

  // Form state
  const [form, setForm] = useState({ personName: '', amount: '', purpose: '', dueDate: '', notes: '' });
  const [repayForm, setRepayForm] = useState({ amount: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loansRes, summaryRes] = await Promise.all([
        api.get('/loans', { params: { status: filter === 'all' ? undefined : filter } }),
        api.get('/loans/summary'),
      ]);
      setLoans(loansRes.data);
      setSummary(summaryRes.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // ── Add loan ──
  const addLoan = async () => {
    if (!form.personName.trim()) return Alert.alert('Required', 'Enter the person\'s name');
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return Alert.alert('Required', 'Enter a valid amount');
    setSaving(true);
    try {
      const { data } = await api.post('/loans', {
        personName: form.personName.trim(),
        amount: Number(form.amount),
        purpose: form.purpose.trim(),
        dueDate: form.dueDate || undefined,
        notes: form.notes.trim(),
      });
      setLoans(prev => [data, ...prev]);
      setSummary(s => s ? { ...s, totalLent: s.totalLent + data.amount, totalOutstanding: s.totalOutstanding + data.amount, activeCount: s.activeCount + 1 } : s);
      setShowAdd(false);
      setForm({ personName: '', amount: '', purpose: '', dueDate: '', notes: '' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Record repayment ──
  const recordRepayment = async () => {
    if (!repayForm.amount || Number(repayForm.amount) <= 0)
      return Alert.alert('Required', 'Enter a valid repayment amount');
    setSaving(true);
    try {
      const { data } = await api.post(`/loans/${repaymentLoan._id}/repayment`, {
        amount: Number(repayForm.amount),
        note: repayForm.note.trim(),
      });
      setLoans(prev => prev.map(l => l._id === data._id ? data : l));
      setRepaymentLoan(null);
      setRepayForm({ amount: '', note: '' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      load(); // refresh summary
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record');
    } finally {
      setSaving(false);
    }
  };

  // ── Settle ──
  const settleLoan = (loan) => {
    Alert.alert(
      'Mark as Settled',
      `Mark the ৳${loan.amount.toLocaleString()} loan to ${loan.personName} as fully settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle', onPress: async () => {
            const { data } = await api.put(`/loans/${loan._id}/settle`);
            setLoans(prev => prev.map(l => l._id === data._id ? data : l));
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            load();
          }
        },
      ]
    );
  };

  // ── Delete ──
  const deleteLoan = (loan) => {
    Alert.alert('Delete Loan', `Remove the loan record for ${loan.personName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await api.delete(`/loans/${loan._id}`);
          setLoans(prev => prev.filter(l => l._id !== loan._id));
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          load();
        }
      },
    ]);
  };

  const FILTERS = [
    { key: 'active', label: 'Active' },
    { key: 'settled', label: 'Settled' },
    { key: 'all', label: 'All' },
  ];

  return (
    <View style={styles.container}>
      {/* Summary banner */}
      {summary && (
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalLent)}</Text>
            <Text style={styles.summaryLabel}>Total lent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: RED }]}>{formatCurrency(summary.totalOutstanding)}</Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: GREEN }]}>{formatCurrency(summary.totalRepaid)}</Text>
            <Text style={styles.summaryLabel}>Recovered</Text>
          </View>
          {summary.overdueCount > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: RED }]}>{summary.overdueCount}</Text>
                <Text style={[styles.summaryLabel, { color: RED }]}>Overdue</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <ActivityIndicator color={PURPLE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={l => l._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
          ListEmptyComponent={
            <EmptyState
              icon="cash-outline"
              title={filter === 'settled' ? 'No settled loans' : 'No active loans'}
              subtitle="Tap + to record money you've lent"
            />
          }
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onRepayment={setRepaymentLoan}
              onSettle={settleLoan}
              onDelete={deleteLoan}
              onViewHistory={setHistoryLoan}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Add Loan Modal ── */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lend Money</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close-circle" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Who are you lending to?</Text>
            <TextInput style={styles.input} placeholder="Person's name" placeholderTextColor="#9CA3AF"
              value={form.personName} onChangeText={v => setForm(p => ({ ...p, personName: v }))} autoCapitalize="words" />

            <Text style={styles.fieldLabel}>Amount (৳)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9CA3AF"
              keyboardType="numeric" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} />

            <Text style={styles.fieldLabel}>Purpose (optional)</Text>
            <TextInput style={styles.input} placeholder="e.g. Emergency, Business, Travel…" placeholderTextColor="#9CA3AF"
              value={form.purpose} onChangeText={v => setForm(p => ({ ...p, purpose: v }))} />

            <Text style={styles.fieldLabel}>Expected return date (optional)</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF"
              value={form.dueDate} onChangeText={v => setForm(p => ({ ...p, dueDate: v }))} />

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Any extra details…" placeholderTextColor="#9CA3AF"
              multiline numberOfLines={3} value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} />

            <TouchableOpacity style={styles.submitBtn} onPress={addLoan} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="cash-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Record Loan</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Record Repayment Modal ── */}
      <Modal visible={!!repaymentLoan} transparent animationType="slide" onRequestClose={() => setRepaymentLoan(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Record Repayment</Text>
            {repaymentLoan && (
              <Text style={styles.sheetSubtitle}>
                {repaymentLoan.personName} · Outstanding: {formatCurrency(Math.max(repaymentLoan.amount - repaymentLoan.amountRepaid, 0))}
              </Text>
            )}
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>৳</Text>
              <TextInput
                style={styles.amountInput} placeholder="0" placeholderTextColor="#9CA3AF"
                keyboardType="numeric" autoFocus value={repayForm.amount}
                onChangeText={v => setRepayForm(p => ({ ...p, amount: v }))}
              />
            </View>
            <TextInput
              style={[styles.input, { marginTop: 10 }]} placeholder="Note (optional)" placeholderTextColor="#9CA3AF"
              value={repayForm.note} onChangeText={v => setRepayForm(p => ({ ...p, note: v }))}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={recordRepayment} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Repayment</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setRepaymentLoan(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Repayment History Modal ── */}
      <Modal visible={!!historyLoan} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHistoryLoan(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{historyLoan?.personName}</Text>
            <TouchableOpacity onPress={() => setHistoryLoan(null)}>
              <Ionicons name="close-circle" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {historyLoan && (
            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Loan summary */}
              <View style={styles.historyHeader}>
                <View style={styles.historyHeaderItem}>
                  <Text style={styles.historyHeaderValue}>{formatCurrency(historyLoan.amount)}</Text>
                  <Text style={styles.historyHeaderLabel}>Original</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                <View style={styles.historyHeaderItem}>
                  <Text style={[styles.historyHeaderValue, { color: GREEN }]}>{formatCurrency(historyLoan.amountRepaid)}</Text>
                  <Text style={styles.historyHeaderLabel}>Repaid</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                <View style={styles.historyHeaderItem}>
                  <Text style={[styles.historyHeaderValue, { color: RED }]}>{formatCurrency(Math.max(historyLoan.amount - historyLoan.amountRepaid, 0))}</Text>
                  <Text style={styles.historyHeaderLabel}>Left</Text>
                </View>
              </View>

              {/* Timeline */}
              <Text style={styles.sectionTitle}>Repayment History</Text>
              {(!historyLoan.repayments || historyLoan.repayments.length === 0) ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="time-outline" size={32} color="#D1D5DB" />
                  <Text style={styles.emptyHistoryText}>No repayments yet</Text>
                </View>
              ) : (
                [...historyLoan.repayments].reverse().map((r, i) => (
                  <View key={r._id || i} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineRow}>
                        <Text style={styles.timelineAmount}>{formatCurrency(r.amount)}</Text>
                        <Text style={styles.timelineDate}>
                          {new Date(r.date).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      {r.note ? <Text style={styles.timelineNote}>{r.note}</Text> : null}
                    </View>
                  </View>
                ))
              )}

              {/* Loan creation event */}
              <View style={[styles.timelineItem, { opacity: 0.5 }]}>
                <View style={[styles.timelineDot, { backgroundColor: PURPLE }]} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineRow}>
                    <Text style={[styles.timelineAmount, { color: PURPLE }]}>Lent {formatCurrency(historyLoan.amount)}</Text>
                    <Text style={styles.timelineDate}>
                      {new Date(historyLoan.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  {historyLoan.purpose ? <Text style={styles.timelineNote}>{historyLoan.purpose}</Text> : null}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Summary banner
  summaryBanner: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 4 },

  // Filters
  filterRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4, backgroundColor: '#F3F4F6', borderRadius: 14, padding: 4 },
  filterTab: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },
  filterTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: PURPLE },

  list: { padding: 16, paddingBottom: 100 },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardSettled: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatarCircle: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '800' },
  cardHeaderInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  purpose: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  amountRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 10 },
  amountBox: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 3 },
  amountValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  amountDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 4 },

  progressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 10 },

  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  dueDateText: { fontSize: 12, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtnPrimary: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 11 },
  actionBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#ECFDF5', borderRadius: 12, paddingVertical: 11 },
  actionBtnSecondaryText: { fontWeight: '700', fontSize: 13 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  footerBtnText: { fontSize: 12, color: '#9CA3AF' },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: PURPLE, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  modalBody: { paddingHorizontal: 20, paddingBottom: 48 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { marginTop: 24, backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Bottom sheet
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 16 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, borderWidth: 2, borderColor: PURPLE },
  currencyPrefix: { fontSize: 22, color: PURPLE, fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 22, color: '#111827', paddingVertical: 14 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelBtnText: { color: '#9CA3AF', fontSize: 15 },

  // History modal
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 24 },
  historyHeaderItem: { alignItems: 'center' },
  historyHeaderValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  historyHeaderLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyHistory: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyHistoryText: { fontSize: 14, color: '#9CA3AF' },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN, marginTop: 5, flexShrink: 0 },
  timelineContent: { flex: 1, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  timelineDate: { fontSize: 12, color: '#9CA3AF' },
  timelineNote: { fontSize: 13, color: '#6B7280', marginTop: 3 },
});
