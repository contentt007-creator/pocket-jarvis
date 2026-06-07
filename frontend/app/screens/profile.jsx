import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';

import { useAuth } from '../../context/AuthContext';
import { usePin } from '../../context/PinContext';
import { usePlan } from '../../context/PlanContext';
import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';
import { Card, GradientCard, Avatar, IconButton, PrimaryButton } from '../../components/ui';

// ─── Row primitives ────────────────────────────────────────────────────────
function SettingRow({ icon, iconColor = colors.primary, label, sub, value, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={[styles.rowIcon, { backgroundColor: (danger ? colors.danger : iconColor) + '15' }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {value !== undefined ? value : (onPress && <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />)}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { hasPin, bioEnabled, enableBiometric, disableBiometric, removePin } = usePin();
  const { plan, endDate } = usePlan();

  const [editName, setEditName]   = useState(false);
  const [name, setName]           = useState(user?.name || '');
  const [saving, setSaving]       = useState(false);

  // Edit name
  const saveName = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Name cannot be empty');
    setSaving(true);
    try {
      const api = require('../../services/api').default;
      const { data } = await api.put('/auth/me', { name: name.trim() });
      updateUser(data);
      setEditName(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update');
    } finally {
      setSaving(false);
    }
  };

  // PIN actions
  const handleChangePin = () => router.push({ pathname: '/screens/set-pin', params: { mode: 'change' } });

  const handleRemovePin = () => {
    Alert.prompt(
      'Remove PIN',
      'Enter your current PIN to remove the lock screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async (currentPin) => {
          try {
            await removePin(currentPin);
            Alert.alert('Removed', 'PIN lock is now disabled.');
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }}
      ],
      'secure-text', '', 'number-pad'
    );
  };

  // Biometric toggle
  const toggleBiometric = async (next) => {
    try {
      if (next) {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHw) return Alert.alert('Unavailable', 'This device doesn\'t support biometric auth.');
        if (!enrolled) return Alert.alert('Not Enrolled', 'Set up fingerprint or face unlock in your device settings first.');
        await enableBiometric();
      } else {
        await disableBiometric();
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Log out?',
      'Your data stays safe. You\'ll need to log back in with email and password.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/screens/login');
        }},
      ]
    );
  };

  const planLabel = { free: 'Free', pro: 'Pro', premium: 'Premium' }[plan] || 'Free';
  const planColor = { free: colors.textMuted, pro: colors.primary, premium: '#D97706' }[plan] || colors.textMuted;

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient colors={gradients.primary} style={styles.headerBg}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <IconButton icon="chevron-back" onPress={() => router.back()} bg="rgba(255,255,255,0.15)" color="#fff" />
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card (overlapping header) */}
        <View style={styles.profileCard}>
          <Avatar name={user?.name || 'U'} size={72} bg={colors.primary} />
          <Text style={styles.profileName}>{user?.name || 'You'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <TouchableOpacity
            style={[styles.planChip, { backgroundColor: planColor + '15' }]}
            onPress={() => router.push('/screens/upgrade')}>
            <Ionicons name={plan === 'premium' ? 'diamond' : plan === 'pro' ? 'star' : 'person-outline'} size={12} color={planColor} />
            <Text style={[styles.planChipText, { color: planColor }]}>{planLabel} Plan</Text>
            {plan === 'free' && (
              <View style={styles.upgradeBadge}>
                <Text style={styles.upgradeBadgeText}>UPGRADE</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ═════ Account ═════ */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card padding={0}>
          <SettingRow icon="person-outline" label="Name" sub={user?.name}
                      onPress={() => setEditName(true)} />
          <View style={styles.divider} />
          <SettingRow icon="mail-outline" label="Email" sub={user?.email} />
          <View style={styles.divider} />
          <SettingRow icon="card-outline" iconColor={planColor} label="Subscription"
                      sub={plan === 'free' ? 'Free Plan' : `${planLabel} · ${endDate ? `renews ${new Date(endDate).toLocaleDateString()}` : 'active'}`}
                      onPress={() => router.push('/screens/upgrade')} />
        </Card>

        {/* ═════ Security ═════ */}
        <Text style={styles.sectionTitle}>Security</Text>
        <Card padding={0}>
          {hasPin ? (
            <>
              <SettingRow icon="key-outline" iconColor={colors.success} label="App PIN"
                          sub="4-digit lock screen enabled"
                          value={<Ionicons name="checkmark-circle" size={20} color={colors.success} />} />
              <View style={styles.divider} />
              <SettingRow icon="create-outline" label="Change PIN"
                          sub="Set a new 4-digit code" onPress={handleChangePin} />
              <View style={styles.divider} />
              <SettingRow icon="finger-print" iconColor={colors.primary} label="Biometric Unlock"
                          sub="Use fingerprint or face"
                          value={<Switch value={bioEnabled} onValueChange={toggleBiometric}
                                         trackColor={{ true: colors.primary, false: colors.border }}
                                         thumbColor="#fff" />} />
              <View style={styles.divider} />
              <SettingRow icon="lock-open-outline" iconColor={colors.danger} label="Remove PIN"
                          sub="Disable the lock screen" onPress={handleRemovePin} danger />
            </>
          ) : (
            <SettingRow icon="lock-closed-outline" iconColor={colors.warning} label="Set up App PIN"
                        sub="Add a 4-digit lock for extra security"
                        onPress={() => router.push('/screens/set-pin')} />
          )}
        </Card>

        {/* ═════ Preferences ═════ */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card padding={0}>
          <SettingRow icon="school-outline" label="Money Masters"
                      sub="Choose a budgeting method" onPress={() => router.push('/screens/masters')} />
          <View style={styles.divider} />
          <SettingRow icon="notifications-outline" label="Notifications"
                      sub="Coming soon" />
        </Card>

        {/* ═════ Support ═════ */}
        <Text style={styles.sectionTitle}>Support</Text>
        <Card padding={0}>
          <SettingRow icon="help-circle-outline" label="Help Center"
                      sub="FAQs and guides" onPress={() => Alert.alert('Coming soon')} />
          <View style={styles.divider} />
          <SettingRow icon="mail-outline" label="Contact Us"
                      sub="contentt0077@gmail.com" onPress={() => Alert.alert('Email', 'contentt0077@gmail.com')} />
          <View style={styles.divider} />
          <SettingRow icon="document-text-outline" label="Privacy Policy"
                      onPress={() => Alert.alert('Privacy', 'https://contentt007-creator.github.io/pocket-jarvis/privacy.html')} />
        </Card>

        {/* ═════ Sign out ═════ */}
        <View style={{ marginTop: spacing.xl }}>
          <Card padding={0}>
            <SettingRow icon="log-out-outline" label="Sign Out"
                        onPress={handleLogout} danger />
          </Card>
        </View>

        <Text style={styles.versionText}>Pocket Jarvis · v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═════ Edit name modal ═════ */}
      <Modal visible={editName} transparent animationType="slide" onRequestClose={() => setEditName(false)}>
        <View style={styles.overlay}>
          <View style={styles.editSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSoft}
              autoFocus
            />
            <View style={{ marginTop: spacing.lg }}>
              <PrimaryButton label="Save" icon="checkmark" onPress={saveName} loading={saving} />
            </View>
            <TouchableOpacity onPress={() => setEditName(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerBg: { paddingBottom: 90 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  profileCard: { backgroundColor: colors.card, borderRadius: radius['2xl'], padding: spacing.xl, alignItems: 'center', marginTop: -70, marginBottom: spacing.xl, ...shadows.lg },
  profileName: { ...typography.title, color: colors.text, marginTop: spacing.md },
  profileEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  planChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  planChipText: { fontSize: 12, fontWeight: '700' },
  upgradeBadge: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  upgradeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  sectionTitle: { ...typography.label, color: colors.textMuted, fontSize: 11, marginTop: spacing.xl, marginBottom: spacing.sm, marginLeft: spacing.xs },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
  rowSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginLeft: spacing.lg + 36 + spacing.md },

  versionText: { textAlign: 'center', color: colors.textSoft, fontSize: 11, fontWeight: '500', marginTop: spacing.xl },

  // Modal
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  editSheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing['2xl'] },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.md },
  input: { backgroundColor: colors.cardSoft, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  cancelText: { color: colors.textMuted, fontSize: 15 },
});
