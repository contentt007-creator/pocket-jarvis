import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from './AuthContext';

const PIN_KEY     = 'pj_pin_hash';
const BIO_KEY     = 'pj_bio_enabled';
const LAST_BG_KEY = 'pj_last_bg';

// Simple SHA-like obfuscation (not cryptographically strong, but SecureStore already encrypts)
function obfuscate(pin) { return pin.split('').reverse().join('') + '_pj_2025'; }

const PinContext = createContext(null);

export function PinProvider({ children }) {
  const { user, token, loading: authLoading } = useAuth();
  const [hasPin,     setHasPin]     = useState(false);
  const [isLocked,   setIsLocked]   = useState(true);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [checking,   setChecking]   = useState(true);
  const appState = useRef(AppState.currentState);

  // ─── Load PIN state on mount and when user changes ─────────────────────
  const refresh = useCallback(async () => {
    if (!user || !token) {
      setHasPin(false);
      setIsLocked(false);
      setChecking(false);
      return;
    }
    try {
      const stored = await SecureStore.getItemAsync(PIN_KEY);
      const bio    = await SecureStore.getItemAsync(BIO_KEY);
      setHasPin(!!stored);
      setBioEnabled(bio === '1');
      // If user is logged in but no PIN yet, unlock so they can set one
      setIsLocked(!!stored);
    } catch {
      setHasPin(false);
      setIsLocked(false);
    } finally {
      setChecking(false);
    }
  }, [user, token]);

  useEffect(() => { if (!authLoading) refresh(); }, [user, token, authLoading, refresh]);

  // ─── Lock when app goes to background, require PIN on return ───────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (appState.current.match(/active/) && next.match(/inactive|background/)) {
        await SecureStore.setItemAsync(LAST_BG_KEY, String(Date.now()));
      }
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const stored = await SecureStore.getItemAsync(PIN_KEY);
        if (stored && user) setIsLocked(true);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [user]);

  // ─── PIN operations ────────────────────────────────────────────────────
  const setPin = async (pin) => {
    if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');
    await SecureStore.setItemAsync(PIN_KEY, obfuscate(pin));
    setHasPin(true);
    setIsLocked(false);
  };

  const verifyPin = async (pin) => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    const match = stored === obfuscate(pin);
    if (match) setIsLocked(false);
    return match;
  };

  const changePin = async (currentPin, newPin) => {
    const ok = await verifyPin(currentPin);
    if (!ok) throw new Error('Current PIN is incorrect');
    await setPin(newPin);
  };

  const removePin = async (currentPin) => {
    const ok = await verifyPin(currentPin);
    if (!ok) throw new Error('Current PIN is incorrect');
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIO_KEY);
    setHasPin(false);
    setIsLocked(false);
    setBioEnabled(false);
  };

  // Called on logout — clears PIN so next user sets their own
  const clearPin = async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIO_KEY);
    setHasPin(false);
    setIsLocked(false);
    setBioEnabled(false);
  };

  const lock = () => setIsLocked(true);
  const unlock = () => setIsLocked(false);

  // ─── Biometric ─────────────────────────────────────────────────────────
  const enableBiometric = async () => {
    const hasHw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHw || !enrolled) throw new Error('Biometric auth not available on this device');
    await SecureStore.setItemAsync(BIO_KEY, '1');
    setBioEnabled(true);
  };

  const disableBiometric = async () => {
    await SecureStore.deleteItemAsync(BIO_KEY);
    setBioEnabled(false);
  };

  const tryBiometricUnlock = async () => {
    if (!bioEnabled) return false;
    try {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Pocket Jarvis',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      if (r.success) { setIsLocked(false); return true; }
    } catch { /* fall through */ }
    return false;
  };

  return (
    <PinContext.Provider value={{
      hasPin, isLocked, bioEnabled, checking,
      setPin, verifyPin, changePin, removePin, clearPin,
      lock, unlock,
      enableBiometric, disableBiometric, tryBiometricUnlock,
      refresh,
    }}>
      {children}
    </PinContext.Provider>
  );
}

export const usePin = () => useContext(PinContext);
