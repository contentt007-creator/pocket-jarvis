import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { MethodProvider } from '../context/MethodContext';
import { PlanProvider } from '../context/PlanContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/screens/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#534AB7' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="screens/onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="screens/login" options={{ headerShown: false }} />
      <Stack.Screen name="screens/transactions" options={{ headerShown: true, title: 'Transactions', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' } }} />
      <Stack.Screen name="screens/subscriptions" options={{ headerShown: true, title: 'Subscriptions & Debts', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' } }} />
      <Stack.Screen name="screens/masters" options={{ headerShown: true, title: 'Money Masters', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' } }} />
      <Stack.Screen name="screens/loans" options={{ headerShown: true, title: 'Lend Money', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' } }} />
      <Stack.Screen name="screens/upgrade" options={{ headerShown: true, title: 'Upgrade Plan', headerStyle: { backgroundColor: '#F9FAFB' }, headerTitleStyle: { fontSize: 18, fontWeight: '800' }, headerShadowVisible: false }} />
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
            <StatusBar style="dark" />
            <RootLayoutNav />
          </PlanProvider>
        </MethodProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
