import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MilestoneQuote({ visible, milestone, quote, expert, expertColor = '#534AB7', goalName, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.confetti}>🎊</Text>
          <Text style={styles.milestone}>{milestone}% Reached!</Text>
          {goalName && <Text style={styles.goalName}>{goalName}</Text>}
          {quote && (
            <View style={[styles.quoteBox, { borderLeftColor: expertColor }]}>
              <Text style={styles.quoteText}>"{quote}"</Text>
              <Text style={[styles.expertName, { color: expertColor }]}>— {expert}</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.btn, { backgroundColor: expertColor }]} onPress={onClose}>
            <Text style={styles.btnText}>Keep going! 🚀</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', width: '100%' },
  confetti: { fontSize: 56, marginBottom: 8 },
  milestone: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  goalName: { fontSize: 15, color: '#9CA3AF', marginBottom: 16 },
  quoteBox: { borderLeftWidth: 3, paddingLeft: 14, marginBottom: 20, alignSelf: 'stretch' },
  quoteText: { fontSize: 14, fontStyle: 'italic', color: '#374151', lineHeight: 21 },
  expertName: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  btn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
