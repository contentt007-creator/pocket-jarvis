// Pocket Jarvis premium fintech design system
// Inspired by Revolut, Monarch Money, Copilot Money

export const colors = {
  // Brand
  primary:        '#5B4DF8',
  primaryLight:   '#7C6BFF',
  primaryDark:    '#4438D9',
  primarySoft:    '#EEF0FF',

  // Status
  success:        '#16A34A',
  successSoft:    '#DCFCE7',
  danger:         '#EF4444',
  dangerSoft:     '#FEE2E2',
  warning:        '#F59E0B',
  warningSoft:    '#FEF3C7',
  info:           '#3B82F6',
  infoSoft:       '#DBEAFE',

  // Surfaces
  bg:             '#F8F9FC',
  card:           '#FFFFFF',
  cardSoft:       '#F8F9FC',
  overlay:        'rgba(17, 24, 39, 0.5)',

  // Text
  text:           '#111827',
  textMuted:      '#6B7280',
  textSoft:       '#9CA3AF',
  textInverse:    '#FFFFFF',

  // Border
  border:         '#E5E7EB',
  borderSoft:     '#F1F2F6',

  // Category palette (for charts/icons)
  categories: {
    Food:          '#F59E0B',
    Transport:     '#3B82F6',
    Entertainment: '#8B5CF6',
    Health:        '#10B981',
    Shopping:      '#EC4899',
    Bills:         '#F97316',
    Other:         '#6B7280',
  },

  // Chart palette
  chart: ['#5B4DF8', '#F59E0B', '#16A34A', '#EF4444', '#3B82F6', '#EC4899', '#6B7280'],
};

export const gradients = {
  primary: ['#5B4DF8', '#7C6BFF'],
  primaryDeep: ['#4438D9', '#5B4DF8'],
  success: ['#16A34A', '#22C55E'],
  warning: ['#F59E0B', '#FBBF24'],
  premium: ['#1E1B4B', '#5B4DF8'],
  goldDark: ['#0A0A0A', '#1F1F1F'],
};

export const radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
};

export const typography = {
  largeTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  title:      { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  cardValue:  { fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  bigNumber:  { fontSize: 36, fontWeight: '800', letterSpacing: -0.6 },
  body:       { fontSize: 15, fontWeight: '500' },
  bodyBold:   { fontSize: 15, fontWeight: '700' },
  caption:    { fontSize: 13, fontWeight: '500' },
  micro:      { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  label:      { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
};

// Premium shadows (iOS-style, low + soft)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primary: {
    shadowColor: '#5B4DF8',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export const theme = { colors, gradients, radius, spacing, typography, shadows };
export default theme;
