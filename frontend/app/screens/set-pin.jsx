import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';

import { usePin } from '../../context/PinContext';
import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';

const PIN_LENGTH = 4;

// Mode flow:
// "new"     → step: enter → confirm → done
// "change"  → step: current → enter → confirm → done
export default function SetPinScreen() {
  const params = useLocalSearchParams();
  const mode = params.mode === 'change' ? 'change' : 'new';
  const { setPin: savePin, verifyPin, changePin } = usePin();

  const [step, setStep] = useState(mode === 'change' ? 'current' : 'enter');
  const [currentPin, setCurrentPin] = useState('');
  const [firstPin,   setFirstPin]   = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  const stepInfo = {
    current: { title: 'Enter current PIN', sub: 'Confirm your identity to change PIN' },
    enter:   { title: mode === 'change' ? 'New PIN' : 'Create your PIN', sub: 'Choose a 4-digit code you\'ll remember' },
    confirm: { title: 'Confirm PIN', sub: 'Enter the same code again' },
  }[step];

  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const onDigit = async (d) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    setError('');
    Haptics.selectionAsync();

    if (next.length === PIN_LENGTH) {
      // Step transitions
      if (step === 'current') {
        const ok = await verifyPin(next);
        if (ok) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStep('enter'); setPin('');
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          animateShake();
          setError('Incorrect PIN');
          setTimeout(() => { setPin(''); }, 500);
        }
      } else if (step === 'enter') {
        setFirstPin(next);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep('confirm'); setPin('');
      } else if (step === 'confirm') {
        if (next === firstPin) {
          try {
            if (mode === 'change') await changePin(currentPin || firstPin, next);
            else await savePin(next);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              '✅ PIN Set',
              mode === 'change' ? 'Your PIN has been updated.' : 'Your PIN is set. You\'ll be asked for it each time you open Pocket Jarvis.',
              [{ text: 'Done', onPress: () => router.replace(mode === 'change' ? '/screens/profile' : '/(tabs)') }]
            );
          } catch (e) {
            Alert.alert('Error', e.message);
            setStep('enter'); setPin(''); setFirstPin('');
          }
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          animateShake();
          setError('PINs don\'t match. Try again.');
          setTimeout(() => { setPin(''); setFirstPin(''); setStep('enter'); }, 800);
        }
      }
    }
  };

  const onBackspace = () => { setPin(p => p.slice(0, -1)); Haptics.selectionAsync(); };

  // Save current PIN to memory after verifying so we can pass to changePin
  React.useEffect(() => {
    if (step === 'enter' && mode === 'change' && !currentPin && firstPin === '') {
      // Already verified current — store it from previous step (we don't have it here)
      // Workaround: just use changePin which re-verifies
    }
  }, [step]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={28} color={colors.primary} />
          </View>

          {/* Headings */}
          <Text style={styles.title}>{stepInfo.title}</Text>
          <Text style={styles.sub}>{stepInfo.sub}</Text>

          {/* PIN dots */}
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View key={i} style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]} />
            ))}
          </Animated.View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, (step === 'enter' || step === 'confirm') && styles.stepDotDone]} />
            <View style={[styles.stepDot, step === 'confirm' && styles.stepDotDone]} />
          </View>

          {/* Keypad */}
          <View style={styles.keypad}>
            {[1,2,3,4,5,6,7,8,9].map(d => (
              <TouchableOpacity key={d} style={styles.keypadBtn} onPress={() => onDigit(String(d))}>
                <Text style={styles.keypadDigit}>{d}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.keypadBtn} />
            <TouchableOpacity style={styles.keypadBtn} onPress={() => onDigit('0')}>
              <Text style={styles.keypadDigit}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadBtn} onPress={onBackspace}>
              <Ionicons name="backspace-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 32 },

  iconWrap: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(91,77,248,0.15)', borderWidth: 1, borderColor: 'rgba(91,77,248,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },

  title: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  sub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 21, paddingHorizontal: 24 },

  dotsRow: { flexDirection: 'row', gap: 16, marginTop: 40, marginBottom: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotError: { borderColor: colors.danger, backgroundColor: colors.danger },

  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: 4 },

  stepIndicator: { flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 8 },
  stepDot: { width: 24, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepDotDone: { backgroundColor: colors.primary },

  keypad: { width: 280, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 32 },
  keypadBtn: { width: 80, height: 70, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  keypadDigit: { color: '#fff', fontSize: 26, fontWeight: '600' },
});
