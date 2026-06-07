// Premium reusable UI primitives — single file to keep imports clean
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style, padding = 'lg', soft = false, onPress }) {
  const pad = typeof padding === 'string' ? spacing[padding] : padding;
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, soft && styles.cardSoft, { padding: pad }, style]}
    >
      {children}
    </Wrap>
  );
}

// ─── Gradient Card ────────────────────────────────────────────────────────────
export function GradientCard({ children, colors: gColors = gradients.primary, style }) {
  return (
    <LinearGradient
      colors={gColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientCard, style]}
    >
      {children}
    </LinearGradient>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel = 'View all' }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Pill Badge ──────────────────────────────────────────────────────────────
export function Pill({ icon, label, color = colors.primary, bg }) {
  const background = bg || color + '15';
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon && <Ionicons name={icon} size={11} color={color} />}
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Icon Button ─────────────────────────────────────────────────────────────
export function IconButton({ icon, onPress, color = colors.text, bg = colors.bg, size = 20, hasDot = false }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.iconBtn, { backgroundColor: bg }]} activeOpacity={0.7}>
      <Ionicons name={icon} size={size} color={color} />
      {hasDot && <View style={styles.iconDot} />}
    </TouchableOpacity>
  );
}

// ─── Stat Card (small, used in grids) ────────────────────────────────────────
export function StatCard({ icon, iconColor = colors.primary, iconBg, label, value, trend, onPress }) {
  return (
    <Card onPress={onPress} padding="lg" style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg || iconColor + '18' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {trend !== undefined && trend !== null && (
        <View style={styles.statTrend}>
          <Ionicons
            name={trend >= 0 ? 'trending-up' : 'trending-down'}
            size={10}
            color={trend >= 0 ? colors.success : colors.danger}
          />
          <Text style={[styles.statTrendText, { color: trend >= 0 ? colors.success : colors.danger }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </Card>
  );
}

// ─── Primary Button ──────────────────────────────────────────────────────────
export function PrimaryButton({ label, onPress, icon, loading, disabled, gradient: useGradient = true, style }) {
  if (useGradient) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.9}>
        <LinearGradient
          colors={disabled ? [colors.textSoft, colors.textSoft] : gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, style]}
        >
          {icon && <Ionicons name={icon} size={18} color="#fff" />}
          <Text style={styles.btnText}>{loading ? 'Please wait…' : label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
      style={[styles.btn, { backgroundColor: colors.primary }, style]}>
      {icon && <Ionicons name={icon} size={18} color="#fff" />}
      <Text style={styles.btnText}>{loading ? 'Please wait…' : label}</Text>
    </TouchableOpacity>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, max = 100, color = colors.primary, height = 6, bg }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <View style={[styles.progressBg, { height, backgroundColor: bg || colors.borderSoft }]}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color, height }]} />
    </View>
  );
}

// ─── Avatar Circle ───────────────────────────────────────────────────────────
export function Avatar({ name = '?', size = 40, bg = colors.primary, color = '#fff' }) {
  const initial = name.trim()[0]?.toUpperCase() || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    ...shadows.sm,
  },
  cardSoft: { backgroundColor: colors.cardSoft, ...shadows.sm, shadowOpacity: 0 },
  gradientCard: { borderRadius: radius['2xl'], padding: spacing['2xl'], ...shadows.primary },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.lg },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  sectionAction: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  sectionActionText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full },
  pillText: { fontSize: 11, fontWeight: '700' },

  iconBtn: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconDot: { position: 'absolute', top: 11, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.card },

  statCard: { flex: 1, gap: spacing.sm },
  statIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.bodyBold, color: colors.text, fontSize: 18 },
  statTrend: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  statTrendText: { fontSize: 11, fontWeight: '700' },

  btn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.primary, shadowOpacity: 0.2 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  progressBg: { borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { borderRadius: radius.full },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800' },
});

export default { Card, GradientCard, SectionHeader, Pill, IconButton, StatCard, PrimaryButton, ProgressBar, Avatar };
