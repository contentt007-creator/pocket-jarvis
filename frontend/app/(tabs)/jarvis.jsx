import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../context/AuthContext';
import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';
import { Card, IconButton } from '../../components/ui';
import api from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');

const SUGGESTED_QUESTIONS = [
  { text: 'How can I save more?',         icon: 'wallet-outline' },
  { text: 'Where did my money go?',       icon: 'search-outline' },
  { text: 'Can I afford a laptop?',       icon: 'laptop-outline' },
  { text: "What's my spending pattern?",  icon: 'analytics-outline' },
];

const INSIGHT_CARDS = [
  { id: 'review',   title: 'Weekly Review',     subtitle: 'Summary of your last 7 days',     icon: 'calendar-outline',    color: colors.primary, emoji: '📊' },
  { id: 'spending', title: 'Spending Analysis', subtitle: 'Understand your spending pattern', icon: 'pie-chart-outline',   color: colors.warning, emoji: '💸' },
  { id: 'savings',  title: 'Savings Plan',      subtitle: 'Personalized plan to save more',  icon: 'trending-up-outline', color: colors.success, emoji: '💰' },
  { id: 'invest',   title: 'Investment Ideas',  subtitle: 'Grow your money smarter',         icon: 'sparkles-outline',    color: colors.danger,  emoji: '🚀' },
];

const QUICK_ACTIONS = [
  { id: 'budget',   label: 'Generate Budget',      icon: 'document-text-outline' },
  { id: 'analyze',  label: 'Analyze Spending',     icon: 'bar-chart-outline' },
  { id: 'forecast', label: 'Forecast Savings',     icon: 'trending-up-outline' },
  { id: 'health',   label: 'Financial Health Check', icon: 'pulse-outline' },
];

let msgId = 0;
const mkMsg = (text, isUser) => ({ id: String(++msgId), text, isUser });

// ─── Typing indicator ──────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <View style={[styles.row, styles.rowLeft]}>
      <View style={styles.jarvisAvatar}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDot} />
        <View style={[styles.typingDot, { opacity: 0.6 }]} />
        <View style={[styles.typingDot, { opacity: 0.3 }]} />
      </View>
    </View>
  );
}

// ─── Chat bubble ───────────────────────────────────────────────────────────
function ChatBubble({ message, isUser }) {
  if (isUser) {
    return (
      <View style={[styles.row, styles.rowRight]}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userBubble}>
          <Text style={styles.userText}>{message}</Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={[styles.row, styles.rowLeft]}>
      <View style={styles.jarvisAvatar}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={styles.jarvisBubble}>
        <Text style={styles.jarvisText}>{message}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function JarvisScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [aiMsgCount, setAiMsgCount] = useState(0);
  const [chatStarted, setChatStarted] = useState(false);
  const listRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (chatStarted) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, typing]);

  const send = async (textOverride) => {
    const msg = (textOverride || input).trim();
    if (!msg || typing) return;
    setInput('');
    if (!chatStarted) setChatStarted(true);
    setMessages(prev => [...prev, mkMsg(msg, true)]);
    setTyping(true);

    try {
      const { data } = await api.post('/ai/chat', { message: msg });
      const newCount = aiMsgCount + 1;
      setAiMsgCount(newCount);
      let reply = data.reply;
      if (newCount % 3 === 0) {
        try {
          const qRes = await api.get('/masters/quote/random');
          reply = `${reply}\n\n💭 "${qRes.data.quote}"\n— ${qRes.data.expert}`;
        } catch { /* */ }
      }
      setMessages(prev => [...prev, mkMsg(reply, false)]);
    } catch (err) {
      let errorMsg = "I'm having trouble right now. Please try again.";
      if (err.code === 'ECONNABORTED') errorMsg = "That took too long — try a shorter question.";
      else if (err.response?.status === 403) errorMsg = "You've hit your daily limit. Upgrade to Pro for more!";
      else if (err.response?.status >= 500) errorMsg = "Server hiccup — please try again.";
      else if (!err.response) errorMsg = "Can't reach the server. Check your connection.";
      setMessages(prev => [...prev, mkMsg(errorMsg, false)]);
    } finally {
      setTyping(false);
    }
  };

  const handleInsightCard = (card) => {
    const prompts = {
      review:   'Give me a complete review of my last 7 days of spending — what stood out, where I improved, where I slipped.',
      spending: 'Analyze my spending pattern this month. Which categories dominate, and what changed from last month?',
      savings:  "Build me a personalized savings plan based on my current income and expenses.",
      invest:   'Based on my finances, what are 3 realistic ways I could grow my money smarter starting this month?',
    };
    send(prompts[card.id]);
  };

  const handleQuickAction = (action) => {
    const prompts = {
      budget:   'Generate an optimal monthly budget for me based on my income and current spending.',
      analyze:  'Deeply analyze my recent spending and identify any leaks or unusual patterns.',
      forecast: 'Forecast how much I can realistically save over the next 6 months at my current pace.',
      health:   'Give me a full financial health check — strengths, weaknesses, and 3 specific actions to improve.',
    };
    send(prompts[action.id]);
  };

  // ─── INTRO STATE (before first message) ──────────────────────────────────
  if (!chatStarted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.introScroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.heroSection}>
            <View style={styles.heroAvatar}>
              <LinearGradient
                colors={gradients.primary}
                style={styles.heroAvatarBg}>
                <Ionicons name="sparkles" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Jarvis AI</Text>
            <Text style={styles.heroSub}>Your personal finance advisor</Text>
          </View>

          {/* Suggested Questions */}
          <Text style={styles.sectionLabel}>Suggested Questions</Text>
          <View style={styles.questionsList}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <TouchableOpacity key={i} style={styles.questionCard} onPress={() => send(q.text)} activeOpacity={0.7}>
                <View style={styles.questionIcon}>
                  <Ionicons name={q.icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.questionText}>{q.text}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textSoft} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Insights */}
          <View style={styles.insightsHeaderRow}>
            <Text style={styles.sectionLabel}>Quick Insights</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>
          <View style={styles.insightGrid}>
            {INSIGHT_CARDS.map(card => (
              <TouchableOpacity key={card.id} style={styles.insightCard}
                                onPress={() => handleInsightCard(card)} activeOpacity={0.7}>
                <View style={[styles.insightCardIcon, { backgroundColor: card.color + '15' }]}>
                  <Text style={{ fontSize: 20 }}>{card.emoji}</Text>
                </View>
                <Text style={styles.insightCardTitle}>{card.title}</Text>
                <Text style={styles.insightCardSub}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.actionList}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity key={action.id} style={styles.actionChip}
                                onPress={() => handleQuickAction(action)} activeOpacity={0.7}>
                <Ionicons name={action.icon} size={16} color={colors.primary} />
                <Text style={styles.actionChipText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Input bar (always visible) */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <View style={styles.inputBar}>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask Jarvis anything…"
                placeholderTextColor={colors.textSoft}
                returnKeyType="send"
                onSubmitEditing={() => send()}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={() => send()}
                disabled={!input.trim()}>
                {input.trim() ? (
                  <LinearGradient colors={gradients.primary} style={styles.sendBtnInner}>
                    <Ionicons name="arrow-up" size={18} color="#fff" />
                  </LinearGradient>
                ) : (
                  <View style={[styles.sendBtnInner, { backgroundColor: colors.borderSoft }]}>
                    <Ionicons name="arrow-up" size={18} color={colors.textSoft} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── CHAT STATE ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Chat header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderAvatar}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderName}>Jarvis AI</Text>
          <View style={styles.chatStatusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.chatHeaderStatus}>Online · Knows your finances</Text>
          </View>
        </View>
        <IconButton icon="ellipsis-vertical" onPress={() => setChatStarted(false)} bg={colors.cardSoft} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => <ChatBubble message={item.text} isUser={item.isUser} />}
          ListFooterComponent={typing ? <TypingBubble /> : null}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Jarvis anything…"
              placeholderTextColor={colors.textSoft}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
              onPress={() => send()}
              disabled={!input.trim() || typing}>
              {input.trim() && !typing ? (
                <LinearGradient colors={gradients.primary} style={styles.sendBtnInner}>
                  <Ionicons name="arrow-up" size={18} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={[styles.sendBtnInner, { backgroundColor: colors.borderSoft }]}>
                  <Ionicons name="arrow-up" size={18} color={colors.textSoft} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  introScroll: { padding: spacing.lg },

  // Hero
  heroSection: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
  heroAvatar: { marginBottom: spacing.md, ...shadows.primary, shadowOpacity: 0.3, borderRadius: 28 },
  heroAvatarBg: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { ...typography.title, color: colors.text },
  heroSub: { ...typography.body, color: colors.textMuted, marginTop: 4 },

  // Section labels
  sectionLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.md, marginTop: spacing.lg, fontSize: 12 },
  insightsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAllText: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: spacing.lg },

  // Suggested questions
  questionsList: { gap: spacing.sm },
  questionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm },
  questionIcon: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  questionText: { flex: 1, ...typography.body, color: colors.text, fontWeight: '600' },

  // Insight grid (2x2)
  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  insightCard: { width: (SCREEN_W - spacing.lg * 2 - spacing.md) / 2, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, ...shadows.sm },
  insightCardIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  insightCardTitle: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
  insightCardSub: { fontSize: 11, color: colors.textMuted, fontWeight: '500', lineHeight: 15 },

  // Quick action chips
  actionList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, ...shadows.sm, shadowOpacity: 0.03 },
  actionChipText: { fontSize: 13, color: colors.text, fontWeight: '600' },

  // Chat header
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.primary, shadowOpacity: 0.2 },
  chatHeaderName: { ...typography.bodyBold, color: colors.text, fontSize: 16 },
  chatStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  chatHeaderStatus: { fontSize: 12, color: colors.success, fontWeight: '600' },

  // Messages
  messages: { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start', gap: 8 },
  rowRight: { justifyContent: 'flex-end' },

  jarvisAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jarvisBubble: { maxWidth: '78%', backgroundColor: colors.card, borderRadius: radius.lg, borderTopLeftRadius: 4, paddingVertical: spacing.md, paddingHorizontal: spacing.md, ...shadows.sm },
  jarvisText: { ...typography.body, color: colors.text, lineHeight: 22 },

  userBubble: { maxWidth: '78%', borderRadius: radius.lg, borderBottomRightRadius: 4, paddingVertical: spacing.md, paddingHorizontal: spacing.md, ...shadows.primary, shadowOpacity: 0.15 },
  userText: { ...typography.body, color: '#fff', lineHeight: 22 },

  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.card, borderRadius: radius.lg, borderTopLeftRadius: 4, paddingVertical: 14, paddingHorizontal: 14, ...shadows.sm },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },

  // Input bar
  inputBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, backgroundColor: colors.bg },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.card, borderRadius: 28, paddingLeft: spacing.lg, paddingRight: 6, paddingVertical: 6, ...shadows.md, borderWidth: 1, borderColor: colors.borderSoft, gap: spacing.sm },
  input: { flex: 1, fontSize: 15, color: colors.text, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { borderRadius: 22 },
  sendBtnDisabled: {},
  sendBtnInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
