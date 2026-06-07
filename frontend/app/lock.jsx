import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { useAuth } from '../context/AuthContext';
import { usePin } from '../context/PinContext';
import { colors, gradients, radius, spacing, typography, shadows } from '../theme';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;

export default function LockScreen() {
  const { user, logout } = useAuth();
  const { hasPin, verifyPin, tryBiometricUnlock, bioEnabled, clearPin } = usePin();
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  // Try biometric on mount
  useEffect(() => {
    if (bioEnabled) tryBiometricUnlock();
  }, []);

  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  };

  const onDigit = async (d) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    Haptics.selectionAsync();

    if (next.length === PIN_LENGTH) {
      const match = await verifyPin(next);
      if (match) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPin('');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        animateShake();
        setShaking(true);
        setTimeout(() => { setPin(''); setShaking(false); }, 600);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          Alert.alert(
            'Too Many Attempts',
            'For security, please log in again with your password.',
            [{ text: 'OK', onPress: async () => { await clearPin(); await logout(); router.replace('/screens/login'); } }]
          );
        }
      }
    }
  };

  const onBackspace = () => {
    setPin(p => p.slice(0, -1));
    Haptics.selectionAsync();
  };

  const onForgot = () => {
    Alert.alert(
      'Forgot PIN?',
      'You\'ll need to log in again with your password. Your data will stay safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          await clearPin();
          await logout();
          router.replace('/screens/login');
        }},
      ]
    );
  };

  const onBiometric = async () => {
    await tryBiometricUnlock();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={['rgba(91,77,248,0.18)', 'rgba(124,107,255,0.05)']}
              style={styles.logoGlow}
            >
              <View style={styles.logoCircle}>
                <Ionicons name="lock-closed" size={32} color={colors.primary} />
              </View>
            </LinearGradient>
          </View>

          {/* Greeting */}
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.name}>{user?.name?.split(' ')[0] || 'there'}</Text>
          <Text style={styles.hint}>Enter your PIN to continue</Text>

          {/* PIN dots */}
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shake }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View key={i} style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                shaking && styles.dotError,
              ]} />
            ))}
          </Animated.View>

          {/* Attempts warning */}
          {attempts > 0 && (
            <Text style={styles.attempts}>
              {attempts >= 3 ? `⚠️ ${MAX_ATTEMPTS - attempts} attempts left` : 'Incorrect PIN'}
            </Text>
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
              <KeypadButton key={d} digit={d} onPress={() => onDigit(String(d))} />
            ))}
            {bioEnabled ? (
              <TouchableOpacity style={styles.keypadBtn} onPress={onBiometric}>
                <Ionicons name="finger-print" size={28} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.keypadBtn} />
            )}
            <KeypadButton digit={0} onPress={() => onDigit('0')} />
            <TouchableOpacity style={styles.keypadBtn} onPress={onBackspace}>
              <Ionicons name="backspace-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Forgot PIN */}
          <TouchableOpacity onPress={onForgot} style={styles.forgot}>
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function KeypadButton({ digit, onPress }) {
  return (
    <TouchableOpacity style={styles.keypadBtn} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.keypadDigit}>{digit}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40, paddingHorizontal: 24 },

  logoWrap: { alignItems: 'center', marginBottom: 8 },
  logoGlow: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  logoCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(91,77,248,0.15)', borderWidth: 1, borderColor: 'rgba(91,77,248,0.3)', alignItems: 'center', justifyContent: 'center' },

  welcome: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4, letterSpacing: -0.3 },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8, fontWeight: '500' },

  // PIN dots
  dotsRow: { flexDirection: 'row', gap: 16, marginTop: 28, marginBottom: 12 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotError: { borderColor: colors.danger, backgroundColor: colors.danger },

  attempts: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: 4 },

  // Keypad
  keypad: { width: 280, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 24 },
  keypadBtn: { width: 80, height: 70, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  keypadDigit: { color: '#fff', fontSize: 26, fontWeight: '600' },

  forgot: { paddingVertical: 12, paddingHorizontal: 24 },
  forgotText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
});
