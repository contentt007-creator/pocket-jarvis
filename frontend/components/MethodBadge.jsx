import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const METHOD_COLORS = {
  'warren-buffett': '#534AB7',
  'benjamin-graham': '#1D9E75',
  'robert-kiyosaki': '#EF9F27',
  'dave-ramsey': '#E24B4A',
  'suze-orman': '#8B5CF6',
  'john-bogle': '#3B82F6',
  'george-soros': '#F97316',
  'john-maynard-keynes': '#10B981',
  'milton-friedman': '#6366F1',
  'napoleon-hill': '#EC4899',
  'harv-eker': '#14B8A6',
  'ramit-sethi': '#F59E0B',
};

const METHOD_NAMES = {
  'warren-buffett': 'Buffett',
  'benjamin-graham': 'Graham',
  'robert-kiyosaki': 'Kiyosaki',
  'dave-ramsey': 'Ramsey',
  'suze-orman': 'Orman',
  'john-bogle': 'Bogle',
  'george-soros': 'Soros',
  'john-maynard-keynes': 'Keynes',
  'milton-friedman': 'Friedman',
  'napoleon-hill': 'Hill',
  'harv-eker': 'JARS',
  'ramit-sethi': 'Sethi',
};

export default function MethodBadge({ activeMethod, onPress }) {
  if (!activeMethod) return null;
  const color = METHOD_COLORS[activeMethod] || '#534AB7';
  const name = METHOD_NAMES[activeMethod] || activeMethod;

  return (
    <TouchableOpacity style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]} onPress={onPress}>
      <Ionicons name="school-outline" size={12} color={color} />
      <Text style={[styles.text, { color }]}>{name} Method</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '700' },
});
