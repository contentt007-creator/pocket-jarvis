import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState({ icon = 'document-outline', title = 'Nothing here yet', subtitle = 'Add something to get started' }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={52} color="#D1D5DB" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  title: { fontSize: 17, fontWeight: '600', color: '#6B7280', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },
});
