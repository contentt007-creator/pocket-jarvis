import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '../../services/api';
import { usePlan } from '../../context/PlanContext';
import {
  setupIAP, purchaseSubscription, validateAndActivate, restorePurchases, endConnection,
  purchaseUpdatedListener, purchaseErrorListener, PRODUCT_IDS,
} from '../../services/iap';

const PURPLE = '#534AB7';
const GOLD   = '#D97706';
const GREEN  = '#1D9E75';
const BKASH  = '#E2136E';
const GPLAY  = '#01875F'; // Google Play green

// ─── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, color: '#6B7280',
    bg: '#F9FAFB', border: '#E5E7EB', icon: 'person-outline',
    tagline: 'Get started for free',
    features: [
      { text: '30 transactions / month', ok: true },
      { text: '2 savings goals',         ok: true },
      { text: 'Basic budgeting',         ok: true },
      { text: 'Jarvis AI chat',          ok: false },
      { text: 'Reports & Charts',        ok: false },
      { text: 'Money Masters',           ok: false },
      { text: 'Subscriptions & Debts',   ok: false },
      { text: 'Lend Money',              ok: false },
    ],
  },
  {
    id: 'pro', name: 'Pro', price: 99, color: PURPLE,
    bg: '#F5F3FF', border: PURPLE, icon: 'star',
    tagline: 'Most popular · ৳99/month',
    popular: true,
    sku: PRODUCT_IDS.pro,
    features: [
      { text: 'Unlimited transactions',          ok: true },
      { text: '10 savings goals',                ok: true },
      { text: 'Full budgeting (all categories)', ok: true },
      { text: 'Jarvis AI chat (30 msg/day)',      ok: true },
      { text: 'Full Reports & Charts',           ok: true },
      { text: 'Money Masters (all experts)',     ok: true },
      { text: 'Subscriptions & Debts',           ok: true },
      { text: 'Lend Money (5 active loans)',     ok: true },
    ],
  },
  {
    id: 'premium', name: 'Premium', price: 150, color: GOLD,
    bg: '#FFFBEB', border: GOLD, icon: 'diamond',
    tagline: 'Everything unlocked · ৳150/month',
    sku: PRODUCT_IDS.premium,
    features: [
      { text: 'Everything in Pro',       ok: true },
      { text: 'Unlimited goals & loans', ok: true },
      { text: 'Unlimited Jarvis AI',     ok: true },
      { text: 'Apply budgeting methods', ok: true },
      { text: 'What-If goal analysis',   ok: true },
      { text: 'Daily Wisdom cards',      ok: true },
      { text: 'All future features',     ok: true },
      { text: 'Priority support',        ok: true },
    ],
  },
];

export default function UpgradeScreen() {
  const { plan: currentPlan, endDate, refresh } = usePlan();
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null); // which plan is being purchased
  const [processingMethod, setProcessingMethod] = useState(null); // 'bkash' | 'google'

  // bKash manual modal state
  const [bkashModal, setBkashModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [trxId, setTrxId]             = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  // IAP listeners
  const purchaseUpdateSub = useRef(null);
  const purchaseErrorSub  = useRef(null);

  const merchantNumber = billingStatus?.merchantNumber || '01XXXXXXXXXX';

  useEffect(() => {
    api.get('/billing/status')
      .then(r => setBillingStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Setup Google Play billing
    setupIAP();

    // Listen for purchase results
    purchaseUpdateSub.current = purchaseUpdatedListener(async (purchase) => {
      if (!purchase.purchaseToken) return;
      try {
        setProcessingMethod('google');
        const result = await validateAndActivate(purchase);
        await refresh();
        setBillingStatus(prev => ({ ...prev, plan: result.plan }));
        setProcessingPlan(null);
        setProcessingMethod(null);
        Alert.alert('🎉 Subscribed!', `Welcome to Pocket Jarvis ${result.plan}! Your plan is now active.`);
      } catch (err) {
        setProcessingPlan(null);
        setProcessingMethod(null);
        Alert.alert('Activation failed', 'Payment received but activation failed. Contact support with your order ID.');
      }
    });

    purchaseErrorSub.current = purchaseErrorListener((err) => {
      setProcessingPlan(null);
      setProcessingMethod(null);
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase failed', err.message || 'Something went wrong. Please try again.');
      }
    });

    return () => {
      purchaseUpdateSub.current?.remove();
      purchaseErrorSub.current?.remove();
      endConnection();
    };
  }, []);

  // ── Google Play purchase ──
  const handleGooglePlay = async (plan) => {
    Alert.alert(
      'Coming Soon',
      'Google Play payment will be available once Pocket Jarvis is published on Play Store. Please use bKash for now — it works instantly!',
      [{ text: 'Use bKash instead', onPress: () => openBkash(plan) }, { text: 'OK', style: 'cancel' }]
    );
  };

  // ── bKash manual submit ──
  const openBkash = (plan) => {
    setSelectedPlan(plan);
    setTrxId(''); setSenderNumber(''); setSubmitted(false);
    setBkashModal(true);
  };

  const submitBkash = async () => {
    if (!trxId.trim()) return Alert.alert('Required', 'Enter your bKash Transaction ID (TrxID)');
    setSubmitting(true);
    try {
      await api.post('/billing/manual/submit', {
        planId: selectedPlan.id,
        trxId: trxId.trim(),
        senderNumber: senderNumber.trim(),
      });
      setSubmitted(true);
      refresh();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setProcessingMethod('google');
    try {
      const results = await restorePurchases();
      if (results.length > 0) {
        await refresh();
        Alert.alert('Restored!', `Your ${results[0].plan} subscription has been restored.`);
      } else {
        Alert.alert('No purchases found', 'No active Google Play subscriptions found to restore.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setProcessingMethod(null);
    }
  };

  if (loading) return <ActivityIndicator color={PURPLE} style={{ flex: 1, marginTop: 80 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pocket Jarvis Plans</Text>
        <Text style={styles.subtitle}>Choose how you want to pay</Text>
        {/* Payment method pills */}
        <View style={styles.paymentPills}>
          <View style={[styles.pill, { backgroundColor: '#FDE8F0' }]}>
            <Ionicons name="phone-portrait-outline" size={13} color={BKASH} />
            <Text style={[styles.pillText, { color: BKASH }]}>bKash</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#E6F4F1' }]}>
            <Ionicons name="logo-google-playstore" size={13} color={GPLAY} />
            <Text style={[styles.pillText, { color: GPLAY }]}>Google Play</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="card-outline" size={13} color={GOLD} />
            <Text style={[styles.pillText, { color: GOLD }]}>Cards</Text>
          </View>
        </View>
      </View>

      {/* Active plan banner */}
      {currentPlan !== 'free' && (
        <View style={styles.activeBanner}>
          <Ionicons name="checkmark-circle" size={18} color={GREEN} />
          <Text style={styles.activeBannerText}>
            <Text style={{ fontWeight: '800' }}>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</Text> plan active
            {endDate ? ` · expires ${new Date(endDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </Text>
        </View>
      )}

      {/* Plan cards */}
      {PLANS.map(plan => {
        const isCurrent = plan.id === currentPlan;
        const isProcessing = processingPlan === plan.id;

        return (
          <View key={plan.id} style={[styles.card, { borderColor: plan.border, backgroundColor: plan.bg }, isCurrent && styles.cardCurrent]}>

            {/* Ribbon */}
            {plan.popular && !isCurrent && (
              <View style={[styles.ribbon, { backgroundColor: plan.color }]}>
                <Text style={styles.ribbonText}>⭐ Most Popular</Text>
              </View>
            )}
            {isCurrent && (
              <View style={[styles.ribbon, { backgroundColor: GREEN }]}>
                <Text style={styles.ribbonText}>✓ Your Plan</Text>
              </View>
            )}

            {/* Plan info */}
            <View style={styles.planRow}>
              <View style={[styles.planIconWrap, { backgroundColor: plan.color + '22' }]}>
                <Ionicons name={plan.icon} size={22} color={plan.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                <Text style={styles.planTagline}>{plan.tagline}</Text>
              </View>
              {plan.price > 0 && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>৳{plan.price}</Text>
                  <Text style={styles.planPer}>/month</Text>
                </View>
              )}
            </View>

            {/* Features list */}
            <View style={styles.featureList}>
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons
                    name={f.ok ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={f.ok ? GREEN : '#D1D5DB'}
                  />
                  <Text style={[styles.featureText, !f.ok && styles.featureOff]}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Payment buttons — only for paid plans */}
            {plan.price > 0 && !isCurrent && (
              <View style={styles.payBtns}>
                {/* bKash button */}
                <TouchableOpacity
                  style={[styles.payBtn, styles.bkashBtn]}
                  onPress={() => openBkash(plan)}
                  disabled={!!processingPlan}
                >
                  <Ionicons name="phone-portrait-outline" size={16} color="#fff" />
                  <Text style={styles.payBtnText}>bKash · ৳{plan.price}</Text>
                </TouchableOpacity>

                {/* Google Play button */}
                <TouchableOpacity
                  style={[styles.payBtn, styles.googleBtn]}
                  onPress={() => handleGooglePlay(plan)}
                  disabled={!!processingPlan}
                >
                  {isProcessing && processingMethod === 'google' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-google-playstore" size={16} color="#fff" />
                      <Text style={styles.payBtnText}>Google Play</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Current plan state */}
            {isCurrent && plan.price > 0 && (
              <View style={styles.currentPlanBtn}>
                <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                <Text style={[styles.currentPlanBtnText, { color: GREEN }]}>Active Plan</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Restore purchases */}
      <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={!!processingMethod}>
        {processingMethod === 'google' && !processingPlan ? (
          <ActivityIndicator color={GPLAY} size="small" />
        ) : (
          <>
            <Ionicons name="refresh-outline" size={16} color={GPLAY} />
            <Text style={[styles.restoreBtnText, { color: GPLAY }]}>Restore Google Play purchases</Text>
          </>
        )}
      </TouchableOpacity>

      {/* FAQ */}
      <View style={styles.faq}>
        {[
          { q: 'What is bKash payment?', a: `Send ৳ to our bKash number, enter your TrxID in the app, and your plan activates within a few hours after verification.` },
          { q: 'What is Google Play payment?', a: 'Pay using your Google account — credit card, debit card, or Google Pay balance. Auto-renews monthly. Cancel anytime from Play Store settings.' },
          { q: 'Can I cancel anytime?', a: 'Yes. For Google Play: cancel in Play Store → Subscriptions. For bKash: it\'s a one-time monthly payment — just don\'t renew.' },
          { q: 'What if I switch phones?', a: 'For Google Play, tap "Restore purchases" above. For bKash, contact us at our support number.' },
        ].map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
      </View>

      <View style={{ height: 48 }} />

      {/* ══ bKash Manual Payment Modal ══ */}
      <Modal visible={bkashModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBkashModal(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalHandle} />

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {submitted ? (
              /* ── Success ── */
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={72} color={GREEN} />
                <Text style={styles.successTitle}>Submitted! 🎉</Text>
                <Text style={styles.successSub}>
                  We received your TrxID. Your <Text style={{ fontWeight: '800' }}>
                    {selectedPlan?.name}
                  </Text> plan will be activated within a few hours.
                </Text>
                <Text style={styles.successNote}>We'll notify you once verified.</Text>
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: GREEN }]} onPress={() => setBkashModal(false)}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Header */}
                <View style={styles.bkashHeader}>
                  <View style={[styles.bkashLogo, { backgroundColor: BKASH }]}>
                    <Ionicons name="phone-portrait-outline" size={28} color="#fff" />
                  </View>
                  <Text style={styles.bkashTitle}>Pay with bKash</Text>
                  <Text style={styles.bkashSub}>{selectedPlan?.name} Plan · ৳{selectedPlan?.price}/month</Text>
                </View>

                {/* Step 1 */}
                <View style={styles.step}>
                  <View style={[styles.stepCircle, { backgroundColor: BKASH }]}>
                    <Text style={styles.stepNum}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Send ৳{selectedPlan?.price} to this bKash number</Text>
                    <Text style={styles.stepHint}>Open bKash → Send Money → Enter number below</Text>
                    <TouchableOpacity
                      style={styles.numberCard}
                      onPress={async () => {
                        await Clipboard.setStringAsync(merchantNumber);
                        Alert.alert('Copied!', `${merchantNumber} copied to clipboard`);
                      }}
                    >
                      <Text style={styles.numberCardNum}>{merchantNumber}</Text>
                      <View style={styles.copyRow}>
                        <Ionicons name="copy-outline" size={14} color={BKASH} />
                        <Text style={[styles.copyLabel, { color: BKASH }]}>Tap to copy</Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.refNote}>Reference / Note: "Pocket Jarvis {selectedPlan?.name}"</Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={styles.step}>
                  <View style={[styles.stepCircle, { backgroundColor: BKASH }]}>
                    <Text style={styles.stepNum}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Enter your Transaction ID (TrxID)</Text>
                    <Text style={styles.stepHint}>Find it in bKash app → Transaction History</Text>
                    <TextInput
                      style={styles.trxInput}
                      placeholder="e.g. 9CJ12345AB"
                      placeholderTextColor="#9CA3AF"
                      value={trxId}
                      onChangeText={v => setTrxId(v.toUpperCase())}
                      autoCapitalize="characters"
                    />
                    <TextInput
                      style={[styles.trxInput, { marginTop: 10 }]}
                      placeholder="Your bKash number (optional)"
                      placeholderTextColor="#9CA3AF"
                      value={senderNumber}
                      onChangeText={setSenderNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: BKASH }]}
                  onPress={submitBkash}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" />
                    : <><Ionicons name="send" size={16} color="#fff" /><Text style={styles.submitBtnText}>Submit Payment</Text></>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelTxt} onPress={() => setBkashModal(false)}>
                  <Text style={styles.cancelTxtLabel}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16 },

  /* Header */
  header: { alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
  paymentPills: { flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: '700' },

  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, marginBottom: 16 },
  activeBannerText: { fontSize: 14, color: '#065F46', flex: 1 },

  /* Plan card */
  card: { borderRadius: 22, borderWidth: 2, padding: 20, marginBottom: 16, overflow: 'hidden' },
  cardCurrent: { elevation: 4 },
  ribbon: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 14, paddingVertical: 6, borderBottomLeftRadius: 14 },
  ribbonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 6 },
  planIconWrap: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 20, fontWeight: '900' },
  planTagline: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  planPrice: { fontSize: 28, fontWeight: '900' },
  planPer: { fontSize: 12, color: '#9CA3AF' },

  featureList: { gap: 8, marginBottom: 18 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#374151' },
  featureOff: { color: '#9CA3AF' },

  /* Payment buttons */
  payBtns: { flexDirection: 'row', gap: 10 },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 14 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bkashBtn: { backgroundColor: BKASH },
  googleBtn: { backgroundColor: GPLAY },

  currentPlanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, backgroundColor: '#ECFDF5', borderRadius: 14 },
  currentPlanBtnText: { fontWeight: '700', fontSize: 15 },

  /* Restore */
  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginBottom: 20 },
  restoreBtnText: { fontSize: 14, fontWeight: '600' },

  /* FAQ */
  faq: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  faqItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, paddingRight: 8 },
  faqA: { fontSize: 13, color: '#6B7280', marginTop: 8, lineHeight: 21 },

  /* bKash modal */
  modalWrap: { flex: 1, backgroundColor: '#fff' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalBody: { padding: 20, paddingBottom: 48 },

  bkashHeader: { alignItems: 'center', marginBottom: 28 },
  bkashLogo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bkashTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  bkashSub: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },

  step: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 16 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  stepHint: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  refNote: { fontSize: 12, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' },

  numberCard: { backgroundColor: '#FFF0F6', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: BKASH, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numberCardNum: { fontSize: 22, fontWeight: '900', color: BKASH, letterSpacing: 1 },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyLabel: { fontSize: 12, fontWeight: '600' },

  trxInput: { backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB', letterSpacing: 0.5 },

  submitBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelTxt: { alignItems: 'center', paddingVertical: 14 },
  cancelTxtLabel: { color: '#9CA3AF', fontSize: 15 },

  successBox: { alignItems: 'center', paddingTop: 48, gap: 12 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
  successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 23, paddingHorizontal: 8 },
  successNote: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  doneBtn: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48, marginTop: 12 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
