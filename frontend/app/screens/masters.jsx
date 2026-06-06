import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import ExpertCard from '../../components/ExpertCard';

export default function MastersScreen() {
  const [experts, setExperts] = useState([]);
  const [activeMethod, setActiveMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [expertsRes, methodRes] = await Promise.all([
        api.get('/masters/experts'),
        api.get('/masters/method/active'),
      ]);
      setExperts(expertsRes.data);
      setActiveMethod(methodRes.data.activeMethod);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyMethod = async (expert) => {
    const isAlreadyActive = activeMethod === expert.slug;
    if (isAlreadyActive) {
      Alert.alert('Clear Method', `Stop following ${expert.name}'s method?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive', onPress: async () => {
            await api.put('/masters/method/active', { activeMethod: null });
            setActiveMethod(null);
            Alert.alert('Cleared', 'Jarvis will now use general guidance.');
          }
        },
      ]);
    } else {
      await api.put('/masters/method/active', { activeMethod: expert.slug });
      setActiveMethod(expert.slug);
      Alert.alert(
        `Method Applied! 🎯`,
        `Jarvis will now guide you using ${expert.name}'s method:\n\n"${expert.methodSummary}"`,
        [{ text: 'Got it' }]
      );
    }
  };

  if (loading) return <ActivityIndicator color="#534AB7" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={experts}
        keyExtractor={e => e.slug}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#534AB7" />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Money Masters</Text>
            <Text style={styles.headerSub}>12 financial legends. Their wisdom, your wallet.</Text>
            {activeMethod && (
              <View style={styles.activeMethodBanner}>
                <Text style={styles.activeMethodLabel}>
                  Active: {experts.find(e => e.slug === activeMethod)?.name || activeMethod}'s Method
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ExpertCard
            expert={item}
            isActive={activeMethod === item.slug}
            onLearnMore={(e) => router.push({ pathname: '/screens/expert-detail', params: { slug: e.slug } })}
            onApply={applyMethod}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#111827' },
  headerSub: { fontSize: 14, color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
  activeMethodBanner: { backgroundColor: '#F5F3FF', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#534AB7' },
  activeMethodLabel: { fontSize: 13, fontWeight: '700', color: '#534AB7' },
});
