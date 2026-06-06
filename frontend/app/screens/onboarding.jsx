import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STEPS = [
  { key: 'name', title: "What should Jarvis\ncall you?", placeholder: 'Your name', keyboard: 'default', icon: '👋' },
  { key: 'email', title: 'Your email address', placeholder: 'you@example.com', keyboard: 'email-address', icon: '📧' },
  { key: 'password', title: 'Create a password', placeholder: 'Min 6 characters', keyboard: 'default', secure: true, icon: '🔒' },
  { key: 'monthlyIncome', title: "What's your monthly\nincome?", placeholder: '0', keyboard: 'numeric', prefix: '৳', icon: '💰' },
  { key: 'initialBalance', title: "What's your current\nbank balance?", placeholder: '0', keyboard: 'numeric', prefix: '৳', icon: '🏦' },
];

export default function OnboardingScreen() {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ name: '', email: '', password: '', monthlyIncome: '', initialBalance: '' });
  const [loading, setLoading] = useState(false);
  const [launchQuote, setLaunchQuote] = useState(null);
  const inputRef = useRef(null);

  const current = STEPS[step];

  const next = async () => {
    const val = values[current.key];
    if (!val.trim()) return Alert.alert('Required', `Please enter your ${current.key}`);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setLoading(true);
      try {
        await register({
          name: values.name,
          email: values.email,
          password: values.password,
          monthlyIncome: Number(values.monthlyIncome) || 0,
          initialBalance: Number(values.initialBalance) || 0,
        });
        // Show a launch quote before entering the app
        try {
          const { data } = await api.get('/masters/quote/random');
          setLaunchQuote(data);
          return; // hold on the quote screen — navigation happens from there
        } catch { /* fall through */ }
        router.replace('/(tabs)');
      } catch (err) {
        Alert.alert('Error', err.response?.data?.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  // Launch quote screen (after registration)
  if (launchQuote) {
    return (
      <View style={[styles.container, styles.quoteScreen]}>
        <View style={[styles.quoteAvatar, { backgroundColor: launchQuote.avatarColor }]}>
          <Text style={styles.quoteAvatarText}>{launchQuote.expert?.[0]}</Text>
        </View>
        <Text style={styles.quoteText}>"{launchQuote.quote}"</Text>
        <Text style={styles.quoteExpert}>— {launchQuote.expert}</Text>
        <Text style={styles.quoteTitle}>{launchQuote.title}</Text>
        <TouchableOpacity style={[styles.btn, styles.btnLaunch, { backgroundColor: launchQuote.avatarColor || '#534AB7' }]} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>Enter Pocket Jarvis 💜</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>

        <View style={styles.inputWrap}>
          {current.prefix && <Text style={styles.prefix}>{current.prefix}</Text>}
          <TextInput
            ref={inputRef}
            style={[styles.input, current.prefix && styles.inputIndent]}
            value={values[current.key]}
            onChangeText={v => setValues(prev => ({ ...prev, [current.key]: v }))}
            placeholder={current.placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={current.keyboard}
            secureTextEntry={current.secure}
            autoCapitalize={current.key === 'name' ? 'words' : 'none'}
            returnKeyType="next"
            onSubmitEditing={next}
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={next} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.btnText}>{step === STEPS.length - 1 ? 'Launch Jarvis' : 'Continue'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {step > 0 && (
          <TouchableOpacity style={styles.back} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottom}>
        <Text style={styles.bottomText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/screens/login')}>
          <Text style={styles.link}> Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 60, paddingBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#534AB7', width: 24 },
  dotDone: { backgroundColor: '#1D9E75' },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  emoji: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', lineHeight: 36, marginBottom: 28 },
  inputWrap: { backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderColor: '#534AB7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 },
  prefix: { fontSize: 20, color: '#534AB7', fontWeight: '700', marginRight: 4 },
  input: { flex: 1, fontSize: 20, color: '#111827', paddingVertical: 16 },
  inputIndent: { paddingLeft: 0 },
  btn: { backgroundColor: '#534AB7', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  back: { alignItems: 'center', marginTop: 16 },
  backText: { color: '#9CA3AF', fontSize: 15 },
  bottom: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 40 },
  bottomText: { color: '#6B7280', fontSize: 14 },
  link: { color: '#534AB7', fontSize: 14, fontWeight: '700' },
  quoteScreen: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  quoteAvatar: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  quoteAvatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  quoteText: { fontSize: 20, fontStyle: 'italic', color: '#111827', textAlign: 'center', lineHeight: 30, marginBottom: 16 },
  quoteExpert: { fontSize: 15, fontWeight: '800', color: '#374151', marginBottom: 4 },
  quoteTitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 40 },
  btnLaunch: { width: '100%' },
});
