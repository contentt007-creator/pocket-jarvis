import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function ExpertDetailScreen() {
  const { slug } = useLocalSearchParams();
  const [expert, setExpert] = useState(null);
  const [jarvisAnalysis, setJarvisAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/masters/experts/${slug}`),
      api.get('/masters/method/active'),
    ]).then(([eRes, mRes]) => {
      setExpert(eRes.data);
      setActiveMethod(mRes.data.activeMethod);
      loadAnalysis(eRes.data);
    }).finally(() => setLoading(false));
  }, [slug]);

  const loadAnalysis = async (e) => {
    setAnalysisLoading(true);
    try {
      const { data } = await api.post('/ai/chat', {
        message: `In 2-3 sentences, explain how ${e.name} would view my current financial situation. Their core method: ${e.methodSummary}. Be specific and use my actual numbers.`,
      });
      setJarvisAnalysis(data.reply);
    } catch {
      setJarvisAnalysis('Connect to Jarvis to see how this method applies to your finances.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const applyMethod = async () => {
    const isActive = activeMethod === expert.slug;
    await api.put('/masters/method/active', { activeMethod: isActive ? null : expert.slug });
    setActiveMethod(isActive ? null : expert.slug);
    Alert.alert(
      isActive ? 'Method Cleared' : `${expert.name}'s Method Applied! 🎯`,
      isActive
        ? 'Jarvis will now use general guidance.'
        : `Jarvis will now frame all advice through ${expert.name}'s philosophy.`,
      [{ text: 'Got it' }]
    );
  };

  if (loading) return <ActivityIndicator color="#534AB7" style={{ flex: 1 }} />;
  if (!expert) return null;

  const isActive = activeMethod === expert.slug;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: expert.avatarColor }]}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>{expert.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
          </View>
          <Text style={styles.heroName}>{expert.name}</Text>
          <Text style={styles.heroTitle}>{expert.title}</Text>
        </View>

        <View style={styles.body}>
          {/* Method bullets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Method</Text>
            {(expert.methodBullets || []).map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: expert.avatarColor }]} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Quotes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Their Words</Text>
            {(expert.quotes || []).map((q, i) => (
              <View key={i} style={[styles.quoteCard, { borderLeftColor: expert.avatarColor }]}>
                <Text style={styles.quoteText}>"{q.quote}"</Text>
                <View style={[styles.catBadge, { backgroundColor: expert.avatarColor + '22' }]}>
                  <Text style={[styles.catText, { color: expert.avatarColor }]}>{q.category}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Jarvis analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How this applies to you right now</Text>
            <View style={styles.jarvisCard}>
              <View style={styles.jarvisHeader}>
                <View style={styles.jarvisAvatar}>
                  <Ionicons name="sparkles" size={14} color="#fff" />
                </View>
                <Text style={styles.jarvisLabel}>Jarvis Analysis</Text>
              </View>
              {analysisLoading ? (
                <ActivityIndicator color="#534AB7" size="small" style={{ marginTop: 8 }} />
              ) : (
                <Text style={styles.jarvisText}>{jarvisAnalysis}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Apply button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: isActive ? '#E5E7EB' : expert.avatarColor }]}
          onPress={applyMethod}
        >
          <Text style={[styles.applyBtnText, isActive && { color: '#6B7280' }]}>
            {isActive ? '✓ Method Active — Tap to remove' : `Apply ${expert.name}'s Method`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingBottom: 100 },
  hero: { paddingTop: 48, paddingBottom: 32, alignItems: 'center', gap: 8 },
  heroAvatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroInitials: { color: '#fff', fontSize: 26, fontWeight: '900' },
  heroName: { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' },
  body: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bulletDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 21 },
  quoteCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderLeftWidth: 3, marginBottom: 10 },
  quoteText: { fontSize: 14, fontStyle: 'italic', color: '#374151', lineHeight: 21, marginBottom: 8 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  jarvisCard: { backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#534AB7' },
  jarvisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  jarvisAvatar: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  jarvisLabel: { fontSize: 13, fontWeight: '700', color: '#534AB7' },
  jarvisText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  applyBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
