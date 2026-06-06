import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ExpertCard({ expert, isActive, onLearnMore, onApply }) {
  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {isActive && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active Method</Text></View>}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: expert.avatarColor }]}>
          <Text style={styles.avatarInitials}>{expert.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{expert.name}</Text>
          <Text style={styles.title}>{expert.title}</Text>
        </View>
        <View style={[styles.catBadge, { backgroundColor: expert.avatarColor + '22' }]}>
          <Text style={[styles.catText, { color: expert.avatarColor }]}>{expert.category}</Text>
        </View>
      </View>

      <Text style={styles.quote}>"{expert.featuredQuote}"</Text>
      <Text style={styles.method}>{expert.methodSummary}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.learnBtn} onPress={() => onLearnMore?.(expert)}>
          <Text style={styles.learnBtnText}>Learn more</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: expert.avatarColor }, isActive && styles.applyBtnActive]}
          onPress={() => onApply?.(expert)}
        >
          <Text style={styles.applyBtnText}>{isActive ? '✓ Applied' : 'Apply method'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardActive: { borderWidth: 2, borderColor: '#534AB7' },
  activeBadge: { backgroundColor: '#534AB7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  activeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: '#111827' },
  title: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  quote: { fontSize: 13, fontStyle: 'italic', color: '#6B7280', lineHeight: 20, marginBottom: 8 },
  method: { fontSize: 13, color: '#374151', lineHeight: 19, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  learnBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  learnBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  applyBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  applyBtnActive: { opacity: 0.7 },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
