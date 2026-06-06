import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, Alert, RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFinance } from '../../context/FinanceContext';
import GoalCard from '../../components/GoalCard';
import EmptyState from '../../components/EmptyState';
import MilestoneQuote from '../../components/MilestoneQuote';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api';

const MILESTONE_MSGS = { 25: '25% there! Keep going! 🎉', 50: 'Halfway! You\'re crushing it! 🚀', 75: '75%! Almost there! 💪', 100: 'Goal achieved! 🏆' };
const ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📱', '💍', '🎓', '🏋️', '💰'];

export default function GoalsScreen() {
  const { goals, fetchGoals } = useFinance();
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);
  const [whatIfGoal, setWhatIfGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [milestone, setMilestone] = useState(null); // { pct, goalName }
  const [milestoneQuote, setMilestoneQuote] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🎯', targetAmount: '', targetDate: '' });

  useEffect(() => { fetchGoals(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchGoals(); setRefreshing(false); };

  const addGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) return Alert.alert('Required', 'Fill all fields');
    await api.post('/goals', { ...newGoal, targetAmount: Number(newGoal.targetAmount) });
    await fetchGoals();
    setShowAdd(false);
    setNewGoal({ name: '', icon: '🎯', targetAmount: '', targetDate: '' });
  };

  const doDeposit = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return Alert.alert('Invalid', 'Enter a valid amount');
    const { data } = await api.post(`/goals/${depositGoal._id}/deposit`, { amount: amt });
    if (data.newMilestones?.length > 0) {
      const pct = data.newMilestones[0];
      // Fetch a contextual milestone quote
      try {
        const qRes = await api.get('/masters/quote/contextual?situation=milestone');
        setMilestoneQuote({ quote: qRes.data.quote, expert: qRes.data.expert, color: qRes.data.avatarColor, pct, goalName: depositGoal.name });
      } catch {
        setMilestone({ text: MILESTONE_MSGS[pct], pct, goalName: depositGoal.name });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await fetchGoals();
    setDepositGoal(null);
    setDepositAmount('');
  };

  const loadWhatIf = async (goal) => {
    setWhatIfGoal(goal);
    setWhatIfResult(null);
    setWhatIfLoading(true);
    try {
      const { data } = await api.post('/ai/whatif', { goalId: goal._id });
      setWhatIfResult(data);
    } finally {
      setWhatIfLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        keyExtractor={g => g._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#534AB7" />}
        ListEmptyComponent={<EmptyState icon="flag-outline" title="No goals yet" subtitle="Tap + to set your first savings goal" />}
        renderItem={({ item }) => (
          <GoalCard goal={item} onDeposit={setDepositGoal} onWhatIf={loadWhatIf} />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>New Goal</Text>
          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
              {ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[styles.iconBtn, newGoal.icon === ic && styles.iconBtnActive]} onPress={() => setNewGoal(p => ({ ...p, icon: ic }))}>
                  <Text style={styles.iconEmoji}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Goal name</Text>
            <TextInput style={styles.input} placeholder="e.g. Emergency fund" value={newGoal.name} onChangeText={v => setNewGoal(p => ({ ...p, name: v }))} placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Target amount (৳)</Text>
            <TextInput style={styles.input} placeholder="50000" keyboardType="numeric" value={newGoal.targetAmount} onChangeText={v => setNewGoal(p => ({ ...p, targetAmount: v }))} placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Target date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2025-12-31" value={newGoal.targetDate} onChangeText={v => setNewGoal(p => ({ ...p, targetDate: v }))} placeholderTextColor="#9CA3AF" />
            <TouchableOpacity style={styles.saveBtn} onPress={addGoal}>
              <Text style={styles.saveBtnText}>Create Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={!!depositGoal} transparent animationType="slide" onRequestClose={() => setDepositGoal(null)}>
        <View style={styles.overlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Deposit to {depositGoal?.name}</Text>
            <Text style={styles.sub}>{formatCurrency(depositGoal?.savedAmount)} / {formatCurrency(depositGoal?.targetAmount)} saved</Text>
            <View style={styles.inputRow}>
              <Text style={styles.prefix}>৳</Text>
              <TextInput style={styles.amountInput} value={depositAmount} onChangeText={setDepositAmount} keyboardType="numeric" autoFocus placeholder="0" placeholderTextColor="#9CA3AF" />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={doDeposit}>
              <Text style={styles.saveBtnText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Milestone with quote */}
      <MilestoneQuote
        visible={!!milestoneQuote}
        milestone={milestoneQuote?.pct}
        quote={milestoneQuote?.quote}
        expert={milestoneQuote?.expert}
        expertColor={milestoneQuote?.color}
        goalName={milestoneQuote?.goalName}
        onClose={() => setMilestoneQuote(null)}
      />
      {/* Fallback plain milestone if quote fetch failed */}
      <Modal visible={!!milestone} transparent animationType="fade" onRequestClose={() => setMilestone(null)}>
        <View style={styles.overlay}>
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneEmoji}>🎊</Text>
            <Text style={styles.milestoneText}>{milestone?.text}</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setMilestone(null)}>
              <Text style={styles.saveBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* What If Modal */}
      <Modal visible={!!whatIfGoal} transparent animationType="slide" onRequestClose={() => setWhatIfGoal(null)}>
        <View style={styles.overlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>What if? — {whatIfGoal?.name}</Text>
            {whatIfLoading ? (
              <ActivityIndicator color="#534AB7" style={{ marginVertical: 24 }} />
            ) : whatIfResult ? (
              <>
                <View style={styles.whatIfStats}>
                  <View style={styles.whatIfStat}>
                    <Text style={styles.whatIfValue}>{formatCurrency(whatIfResult.weeklyNeeded)}/wk</Text>
                    <Text style={styles.whatIfLabel}>Weekly needed</Text>
                  </View>
                  <View style={styles.whatIfStat}>
                    <Text style={styles.whatIfValue}>{whatIfResult.daysLeft}d</Text>
                    <Text style={styles.whatIfLabel}>Days left</Text>
                  </View>
                  <View style={styles.whatIfStat}>
                    <Text style={styles.whatIfValue}>{formatCurrency(whatIfResult.remaining)}</Text>
                    <Text style={styles.whatIfLabel}>Remaining</Text>
                  </View>
                </View>
                <View style={styles.projectionCard}>
                  <Text style={styles.projectionText}>{whatIfResult.projection}</Text>
                </View>
              </>
            ) : null}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setWhatIfGoal(null)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16, paddingBottom: 100 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#534AB7', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowColor: '#534AB7', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  sheet: { flex: 1, backgroundColor: '#F9FAFB' },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  iconRow: { flexGrow: 0, marginBottom: 4 },
  iconBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  iconBtnActive: { backgroundColor: '#F5F3FF', borderWidth: 2, borderColor: '#534AB7' },
  iconEmoji: { fontSize: 24 },
  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 4 },
  saveBtn: { marginTop: 20, backgroundColor: '#534AB7', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sub: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, borderWidth: 2, borderColor: '#534AB7', marginBottom: 4 },
  prefix: { fontSize: 22, color: '#534AB7', fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 22, color: '#111827', paddingVertical: 14 },
  milestoneCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, margin: 24, alignItems: 'center' },
  milestoneEmoji: { fontSize: 64, marginBottom: 16 },
  milestoneText: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 20 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelText: { color: '#9CA3AF', fontSize: 15 },
  whatIfStats: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  whatIfStat: { alignItems: 'center' },
  whatIfValue: { fontSize: 18, fontWeight: '800', color: '#534AB7' },
  whatIfLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  projectionCard: { backgroundColor: '#F5F3FF', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#534AB7' },
  projectionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
});
