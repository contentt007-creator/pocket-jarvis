import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../../services/api';
import TransactionCard from '../../components/TransactionCard';
import EmptyState from '../../components/EmptyState';
import AddTransactionModal from '../../components/AddTransactionModal';

const FILTERS = ['All', 'Income', 'Expense'];

function groupByDate(txns) {
  const map = {};
  txns.forEach(t => {
    const d = new Date(t.date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    const key = d.getTime() === today.getTime() ? 'Today'
      : d.getTime() === yesterday.getTime() ? 'Yesterday'
        : d.toLocaleDateString('en-BD', { month: 'long', day: 'numeric' });
    if (!map[key]) map[key] = [];
    map[key].push(t);
  });
  return Object.entries(map).map(([date, items]) => ({ date, items }));
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const params = { page: p, limit: 20 };
      if (filter !== 'All') params.type = filter.toLowerCase();
      if (search) params.search = search;
      const { data } = await api.get('/transactions', { params });
      setTransactions(prev => reset ? data.transactions : [...prev, ...data.transactions]);
      setHasMore(p < data.pages);
      setPage(p + 1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setTransactions([]);
    load(true);
  }, [filter, search]);

  const onRefresh = () => { setRefreshing(true); setPage(1); load(true); };

  const deleteTransaction = async (id) => {
    Alert.alert('Delete', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await api.delete(`/transactions/${id}`);
          setTransactions(prev => prev.filter(t => t._id !== id));
        }
      },
    ]);
  };

  const cycleTag = async (item) => {
    const tags = [null, 'Need', 'Want', 'Regret'];
    const nextTag = tags[(tags.indexOf(item.tag) + 1) % tags.length];
    const { data } = await api.put(`/transactions/${item._id}`, { tag: nextTag });
    setTransactions(prev => prev.map(t => t._id === data._id ? data : t));
  };

  const grouped = groupByDate(transactions);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search transactions..." placeholderTextColor="#9CA3AF"
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color="#9CA3AF" /></TouchableOpacity> : null}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color="#534AB7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#534AB7" />}
          onEndReached={() => hasMore && load()}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="No transactions" subtitle="Tap + to add your first one" />}
          renderItem={({ item: group }) => (
            <View>
              <Text style={styles.dateLabel}>{group.date}</Text>
              {group.items.map(txn => (
                <View key={txn._id} style={styles.swipeRow}>
                  <TransactionCard item={txn} onTagPress={cycleTag} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTransaction(txn._id)}>
                    <Ionicons name="trash" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={showModal} onClose={() => setShowModal(false)}
        onAdded={(t) => setTransactions(prev => [t, ...prev])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 12 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterActive: { backgroundColor: '#534AB7' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  dateLabel: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginTop: 12, marginBottom: 6 },
  swipeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  deleteBtn: { backgroundColor: '#E24B4A', borderRadius: 14, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#534AB7', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowColor: '#534AB7', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
