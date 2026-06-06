import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import QuoteTipCard from './QuoteTipCard';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other'];
const TAGS = ['Need', 'Want', 'Regret'];

export default function AddTransactionModal({ visible, onClose, onAdded }) {
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [tag, setTag] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [regretQuote, setRegretQuote] = useState(null);

  const reset = () => { setTitle(''); setAmount(''); setCategory('Food'); setTag(null); setNotes(''); setType('expense'); };

  const submit = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Please enter a title');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return Alert.alert('Required', 'Enter a valid amount');
    setLoading(true);
    try {
      const { data } = await api.post('/transactions', {
        title: title.trim(), amount: Number(amount), type, category,
        tag: type === 'expense' ? tag : null, notes: notes.trim(),
      });
      onAdded?.(data);
      // Show a quote tip if tagged Regret
      if (tag === 'Regret') {
        try {
          const qRes = await api.get('/masters/quote/contextual?situation=regret');
          setRegretQuote(qRes.data);
          return; // keep modal open briefly to show quote
        } catch { /* ignore */ }
      }
      reset();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>New Transaction</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#9CA3AF" /></TouchableOpacity>
        </View>

        {/* Type toggle */}
        <View style={styles.typeRow}>
          {['expense', 'income'].map(t => (
            <TouchableOpacity
              key={t} style={[styles.typeBtn, type === t && (t === 'expense' ? styles.typeExpense : styles.typeIncome)]}
              onPress={() => setType(t)}>
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnActive]}>{t === 'expense' ? '− Expense' : '+ Income'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Lunch at Bashundhara" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Amount (৳)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" placeholderTextColor="#9CA3AF" />

          {type === 'expense' && (
            <>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Tag (optional)</Text>
              <View style={styles.chipRow}>
                {TAGS.map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, tag === t && styles.chipActive]} onPress={() => setTag(tag === t ? null : t)}>
                    <Text style={[styles.chipText, tag === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Any extra details..." placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />

          {regretQuote && (
            <View>
              <QuoteTipCard
                quote={regretQuote.quote}
                expert={regretQuote.expert}
                color={regretQuote.avatarColor}
                onDismiss={() => { setRegretQuote(null); reset(); onClose(); }}
              />
              <TouchableOpacity style={[styles.submit, { backgroundColor: '#6B7280', marginTop: 0 }]} onPress={() => { setRegretQuote(null); reset(); onClose(); }}>
                <Text style={styles.submitText}>Got it, close</Text>
              </TouchableOpacity>
            </View>
          )}
          {!regretQuote && <TouchableOpacity style={styles.submit} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add Transaction</Text>}
          </TouchableOpacity>}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  typeRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 8 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' },
  typeExpense: { backgroundColor: '#FEE2E2' },
  typeIncome: { backgroundColor: '#D1FAE5' },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  typeBtnActive: { color: '#111827' },
  form: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  chips: { flexGrow: 0, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  chipActive: { backgroundColor: '#534AB7' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },
  submit: { marginTop: 28, backgroundColor: '#534AB7', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
