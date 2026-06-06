import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  StyleSheet, RefreshControl, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import EmptyState from '../../components/EmptyState';

const TABS = ['Subscriptions', 'Debts'];

function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
}

export default function SubscriptionsDebtsScreen() {
  const [tab, setTab] = useState('Subscriptions');
  const [subs, setSubs] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [formType, setFormType] = useState('sub'); // 'sub' | 'debt'

  const load = async () => {
    try {
      const [subsRes, debtsRes] = await Promise.all([api.get('/subscriptions'), api.get('/debts')]);
      setSubs(subsRes.data);
      setDebts(debtsRes.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAddSub = () => { setFormType('sub'); setFormData({ name: '', amount: '', renewalDate: '', category: 'Other' }); setShowForm(true); };
  const openAddDebt = () => { setFormType('debt'); setFormData({ personName: '', amount: '', type: 'owe', dueDate: '', notes: '' }); setShowForm(true); };

  const submitSub = async () => {
    const { data } = await api.post('/subscriptions', { ...formData, amount: Number(formData.amount) });
    setSubs(prev => [...prev, data]);
    setShowForm(false);
  };

  const submitDebt = async () => {
    const { data } = await api.post('/debts', { ...formData, amount: Number(formData.amount) });
    setDebts(prev => [...prev, data]);
    setShowForm(false);
  };

  const settleDebt = async (id) => {
    const { data } = await api.put(`/debts/${id}`, { isSettled: true });
    setDebts(prev => prev.map(d => d._id === id ? data : d));
  };

  const deleteSub = async (id) => {
    await api.delete(`/subscriptions/${id}`);
    setSubs(prev => prev.filter(s => s._id !== id));
  };

  const totalMonthly = subs.filter(s => s.isActive).reduce((sum, s) => sum + s.amount, 0);
  const iOwe = debts.filter(d => !d.isSettled && d.type === 'owe').reduce((s, d) => s + d.amount, 0);
  const owedToMe = debts.filter(d => !d.isSettled && d.type === 'owed').reduce((s, d) => s + d.amount, 0);

  if (loading) return <ActivityIndicator color="#534AB7" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Subscriptions' ? (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Monthly total</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalMonthly)}</Text>
          </View>
          <FlatList
            data={subs}
            keyExtractor={i => i._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#534AB7" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState icon="card-outline" title="No subscriptions" subtitle="Track your recurring payments" />}
            renderItem={({ item }) => {
              const days = daysUntil(item.renewalDate);
              return (
                <View style={styles.card}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>Renews in {days > 0 ? `${days} days` : 'today'}</Text>
                  </View>
                  {days <= 3 && <View style={styles.urgentBadge}><Text style={styles.urgentText}>Soon!</Text></View>}
                  <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
                  <TouchableOpacity onPress={() => deleteSub(item._id)} style={{ marginLeft: 8 }}>
                    <Ionicons name="trash-outline" size={18} color="#E24B4A" />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
          <TouchableOpacity style={styles.fab} onPress={openAddSub}><Ionicons name="add" size={28} color="#fff" /></TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={[styles.summaryValue, { color: owedToMe >= iOwe ? '#1D9E75' : '#E24B4A', fontSize: 16 }]}>
              {owedToMe >= iOwe ? `You are net owed ${formatCurrency(owedToMe - iOwe)}` : `You net owe ${formatCurrency(iOwe - owedToMe)}`}
            </Text>
          </View>
          <FlatList
            data={debts}
            keyExtractor={i => i._id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState icon="people-outline" title="No debts" subtitle="Track who owes who" />}
            renderItem={({ item }) => (
              <View style={[styles.card, item.isSettled && styles.settled]}>
                <View style={[styles.debtType, { backgroundColor: item.type === 'owe' ? '#FEE2E2' : '#D1FAE5' }]}>
                  <Text style={[styles.debtTypeText, { color: item.type === 'owe' ? '#E24B4A' : '#1D9E75' }]}>
                    {item.type === 'owe' ? 'I owe' : 'Owes me'}
                  </Text>
                </View>
                <View style={styles.cardLeft}>
                  <Text style={[styles.cardTitle, item.isSettled && styles.strikeThrough]}>{item.personName}</Text>
                  {item.notes ? <Text style={styles.cardSub}>{item.notes}</Text> : null}
                </View>
                <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
                {!item.isSettled && (
                  <TouchableOpacity onPress={() => settleDebt(item._id)} style={styles.settleBtn}>
                    <Text style={styles.settleBtnText}>Settle</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
          <TouchableOpacity style={styles.fab} onPress={openAddDebt}><Ionicons name="add" size={28} color="#fff" /></TouchableOpacity>
        </>
      )}

      {/* Add Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <View style={styles.formContainer}>
          <View style={styles.handle} />
          <Text style={styles.formTitle}>{formType === 'sub' ? 'New Subscription' : 'New Debt'}</Text>
          <ScrollView contentContainerStyle={styles.formBody} keyboardShouldPersistTaps="handled">
            {formType === 'sub' ? (
              <>
                <TextInput style={styles.input} placeholder="Service name" value={formData.name} onChangeText={v => setFormData(p => ({ ...p, name: v }))} placeholderTextColor="#9CA3AF" />
                <TextInput style={styles.input} placeholder="Monthly amount (৳)" keyboardType="numeric" value={formData.amount} onChangeText={v => setFormData(p => ({ ...p, amount: v }))} placeholderTextColor="#9CA3AF" />
                <TextInput style={styles.input} placeholder="Next renewal date (YYYY-MM-DD)" value={formData.renewalDate} onChangeText={v => setFormData(p => ({ ...p, renewalDate: v }))} placeholderTextColor="#9CA3AF" />
              </>
            ) : (
              <>
                <TextInput style={styles.input} placeholder="Person's name" value={formData.personName} onChangeText={v => setFormData(p => ({ ...p, personName: v }))} placeholderTextColor="#9CA3AF" />
                <TextInput style={styles.input} placeholder="Amount (৳)" keyboardType="numeric" value={formData.amount} onChangeText={v => setFormData(p => ({ ...p, amount: v }))} placeholderTextColor="#9CA3AF" />
                <View style={styles.typeRow}>
                  {['owe', 'owed'].map(t => (
                    <TouchableOpacity key={t} style={[styles.typeBtn, formData.type === t && styles.typeBtnActive]} onPress={() => setFormData(p => ({ ...p, type: t }))}>
                      <Text style={[styles.typeBtnText, formData.type === t && styles.typeBtnTextActive]}>{t === 'owe' ? 'I owe them' : 'They owe me'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.input} placeholder="Notes (optional)" value={formData.notes} onChangeText={v => setFormData(p => ({ ...p, notes: v }))} placeholderTextColor="#9CA3AF" />
              </>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={formType === 'sub' ? submitSub : submitDebt}>
              <Text style={styles.submitText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#F3F4F6', borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#534AB7' },
  summary: { paddingHorizontal: 16, marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  urgentBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  urgentText: { color: '#E24B4A', fontSize: 11, fontWeight: '700' },
  settled: { opacity: 0.5 },
  strikeThrough: { textDecorationLine: 'line-through' },
  debtType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  debtTypeText: { fontSize: 11, fontWeight: '700' },
  settleBtn: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  settleBtnText: { color: '#1D9E75', fontWeight: '700', fontSize: 13 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#534AB7', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowColor: '#534AB7', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  formContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  formTitle: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 20, paddingTop: 16, marginBottom: 8 },
  formBody: { paddingHorizontal: 20, paddingBottom: 40 },
  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#534AB7' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  typeBtnTextActive: { color: '#fff' },
  submitBtn: { marginTop: 16, backgroundColor: '#534AB7', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
