import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { MethodProvider } from '../context/MethodContext';
import { PlanProvider } from '../context/PlanContext';
import { PinProvider, usePin } from '../context/PinContext';
import LockScreen from './lock';
import { colors } from '../theme';

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { hasPin, isLocked, checking: pinChecking } = usePin();

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.replace('/screens/onboarding');
      else router.replace('/(tabs)');
    }
  }, [user, authLoading]);

  // Initial loading screen
  if (authLoading || pinChecking) {
    return (
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#0A0A0A']}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </LinearGradient>
    );
  }

  // 🔒 Show lock screen overlay if user has a PIN and the app is locked
  if (user && hasPin && isLocked) {
    return <LockScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="screens/onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="screens/login" options={{ headerShown: false }} />
      <Stack.Screen name="screens/set-pin" options={{ headerShown: false }} />
      <Stack.Screen name="screens/profile" options={{ headerShown: false }} />
      <Stack.Screen name="screens/transactions" options={{ headerShown: true, title: 'Transactions', headerStyle: { backgroundColor: '#F8F9FC' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' }, headerShadowVisible: false }} />
      <Stack.Screen name="screens/subscriptions" options={{ headerShown: true, title: 'Subscriptions & Debts', headerStyle: { backgroundColor: '#F8F9FC' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' }, headerShadowVisible: false }} />
      <Stack.Screen name="screens/masters" options={{ headerShown: true, title: 'Money Masters', headerStyle: { backgroundColor: '#F8F9FC' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' }, headerShadowVisible: false }} />
      <Stack.Screen name="screens/loans" options={{ headerShown: true, title: 'Lend Money', headerStyle: { backgroundColor: '#F8F9FC' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' }, headerShadowVisible: false }} />
      <Stack.Screen name="screens/upgrade" options={{ headerShown: true, title: 'Upgrade Plan', headerStyle: { backgroundColor: '#F8F9FC' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' }, headerShadowVisible: false }} />
      <Stack.Screen name="screens/expert-detail" options={{ headerShown: true, title: '', headerTransparent: true, headerTintColor: '#fff' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MethodProvider>
          <PlanProvider>
            <PinProvider>
              <StatusBar style="dark" />
              <RootLayoutNav />
            </PinProvider>
          </PlanProvider>
        </MethodProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
