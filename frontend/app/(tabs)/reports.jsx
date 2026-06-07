import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, Share, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, gradients, radius, spacing, typography, shadows } from '../../theme';
import { Card, GradientCard, SectionHeader, Pill, IconButton } from '../../components/ui';
import QuoteTipCard from '../../components/QuoteTipCard';
import { formatCurrency } from '../../utils/formatCurrency';
import { scoreToGrade } from '../../utils/calculateHealth';
import api from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(m) {
  return new Date(m + '-01').toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
}

function gradeComment(grade) {
  const map = {
    'A+': "Outstanding! You're doing great with your finances.",
    'A':  "Excellent! You're well ahead of your budget and savings goals.",
    'B':  "Great work! A few small tweaks could push you to an A.",
    'C':  "Fair month. Some categories are creeping up.",
    'D':  "Needs work. Several areas went over budget this month.",
    'F':  "Tough month. Let's reset and plan a tighter budget.",
  };
  return map[grade] || map.B;
}

// ─── Gauge meter (semi-circle) ─────────────────────────────────────────────
function GaugeMeter({ score, size = 160 }) {
  const { grade, color } = scoreToGrade(score);
  const strokeWidth = 16;
  const r = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2 + 10;
  // Semi-circle from -180° (left) to 0° (right)
  const startAngle = -180;
  const endAngle = -180 + (score / 100) * 180;

  function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
  }

  function arcPath(cx, cy, radius, start, end) {
    const startPt = polarToCartesian(cx, cy, radius, start);
    const endPt   = polarToCartesian(cx, cy, radius, end);
    const largeArc = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`;
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size / 1.6}>
        <Path d={arcPath(centerX, centerY, r, -180, 0)}
              stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
        <Path d={arcPath(centerX, centerY, r, startAngle, endAngle)}
              stroke="#fff" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
      </Svg>
      <View style={{ alignItems: 'center', marginTop: -28 }}>
        <Text style={[styles.gaugeGrade, { color: '#fff' }]}>{grade}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function ReportsScreen() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [gradeQuote, setGradeQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState('week'); // week | month

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/transactions/summary', { params: { month } }),
      api.get(`/budgets/${month}/status`),
    ]).then(([s, b]) => {
      setSummary(s.data); setBudget(b.data);
      const exp = s.data.expense; const inc = s.data.income;
      let sc = 100;
      if (inc > 0) { const r = exp / inc; if (r > 1) sc -= 40; else if (r > 0.9) sc -= 30; else if (r > 0.75) sc -= 20; else if (r > 0.6) sc -= 10; }
      const { grade } = scoreToGrade(Math.max(0, sc));
      const sit = ['A', 'B'].includes(grade) ? 'grade-ab' : grade === 'C' ? 'grade-c' : 'grade-df';
      api.get(`/masters/quote/contextual?situation=${sit}`).then(r => setGradeQuote(r.data)).catch(() => {});
    }).finally(() => setLoading(false));
  }, [month]);

  const changeMonth = (dir) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const exportReport = async () => {
    try {
      const text = `Pocket Jarvis Monthly Report
${monthLabel(month)}

Income: ${formatCurrency(summary?.income || 0)}
Expenses: ${formatCurrency(summary?.expense || 0)}
Net: ${formatCurrency(summary?.net || 0)}
`;
      await Share.share({ message: text, title: 'Pocket Jarvis Report' });
    } catch { Alert.alert('Error', 'Could not share report'); }
  };

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
    </SafeAreaView>
  );

  // Compute health score
  const exp = summary?.expense || 0;
  const inc = summary?.income || 0;
  let sc = 100;
  if (inc > 0) { const r = exp / inc; if (r > 1) sc -= 40; else if (r > 0.9) sc -= 30; else if (r > 0.75) sc -= 20; else if (r > 0.6) sc -= 10; }
  const cats = budget?.categories || [];
  const withLimit = cats.filter(c => c.limit > 0);
  if (withLimit.length > 0) {
    const over = withLimit.filter(c => c.spent > c.limit).length;
    sc -= Math.round((over / withLimit.length) * 40);
  }
  sc = Math.max(0, sc);
  const { grade } = scoreToGrade(sc);

  // Chart data
  const breakdown = summary?.categoryBreakdown || {};
  const pieData = Object.entries(breakdown).filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name, population: value, color: colors.categories[name] || colors.textMuted,
      legendFontColor: colors.text, legendFontSize: 11,
    }));

  // Spending trend (mock weekly distribution from monthly total)
  const totalExp = summary?.expense || 0;
  const trendData = trendView === 'week'
    ? { labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'], datasets: [{ data: [Math.round(totalExp * 0.28), Math.round(totalExp * 0.26), Math.round(totalExp * 0.25), Math.round(totalExp * 0.21)] }] }
    : { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ data: [4200, 5100, 4800, 5400, 5800, totalExp || 6050] }] };

  // Income vs Expense over 6 months (mock except current)
  const sixMonth = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { data: [16000, 17500, 18000, 17800, 18200, inc || 18500], color: () => colors.success, strokeWidth: 2 },
      { data: [5200, 6100, 5800, 6400, 6800, exp || 6050],       color: () => colors.danger,  strokeWidth: 2 },
    ],
    legend: ['Income', 'Expenses'],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card, backgroundGradientTo: colors.card,
    decimalPlaces: 0, color: () => colors.primary, labelColor: () => colors.textMuted,
    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.card },
    propsForBackgroundLines: { stroke: colors.borderSoft, strokeDasharray: '' },
    style: { borderRadius: radius.lg },
  };

  // Win & leak
  const win  = withLimit.sort((a, b) => (a.spent / a.limit) - (b.spent / b.limit))[0];
  const leak = withLimit.sort((a, b) => (b.spent / b.limit) - (a.spent / a.limit))[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ═════ Top bar ═════ */}
        <View style={styles.topBar}>
          <IconButton icon="chevron-back" onPress={() => changeMonth(-1)} bg={colors.card} />
          <View style={styles.monthBlock}>
            <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </View>
          <IconButton icon="share-outline" onPress={exportReport} bg={colors.card} />
        </View>

        {/* ═════ Hero — Financial Health Gauge ═════ */}
        <GradientCard colors={gradients.primary} style={styles.healthCard}>
          <View style={styles.healthRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.healthLabel}>Financial Health</Text>
              <Text style={styles.healthScore}>{grade}</Text>
              <Text style={styles.healthMessage}>{gradeComment(grade)}</Text>
            </View>
            <GaugeMeter score={sc} size={140} />
          </View>
        </GradientCard>

        {/* ═════ Grade quote ═════ */}
        {gradeQuote && (
          <View style={{ marginTop: spacing.md }}>
            <QuoteTipCard quote={gradeQuote.quote} expert={gradeQuote.expert} color={gradeQuote.avatarColor} />
          </View>
        )}

        {/* ═════ Income vs Expenses ═════ */}
        <SectionHeader title="Income vs Expenses" actionLabel="This Month" />
        <Card>
          <View style={styles.legendRow}>
            <LegendItem color={colors.success} label="Income" />
            <LegendItem color={colors.danger}  label="Expenses" />
          </View>
          <LineChart
            data={sixMonth}
            width={SCREEN_W - spacing.lg * 2 - spacing.lg * 2}
            height={180}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            style={{ marginVertical: 8, borderRadius: radius.lg, marginLeft: -8 }}
          />
        </Card>

        {/* ═════ Spending Trend ═════ */}
        <View style={styles.trendHeaderRow}>
          <Text style={styles.sectionTitle}>Spending Trend</Text>
          <View style={styles.trendToggle}>
            {['week', 'month'].map(v => (
              <TouchableOpacity key={v}
                                style={[styles.trendOpt, trendView === v && styles.trendOptActive]}
                                onPress={() => setTrendView(v)}>
                <Text style={[styles.trendOptText, trendView === v && styles.trendOptTextActive]}>
                  {v === 'week' ? 'Weekly' : 'Monthly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Card>
          <View style={styles.trendValueRow}>
            <Text style={styles.trendValue}>{formatCurrency(totalExp)}</Text>
            <Pill label={trendView === 'week' ? 'This Month' : 'Last 6 mo'} color={colors.primary} />
          </View>
          <BarChart
            data={trendData}
            width={SCREEN_W - spacing.lg * 2 - spacing.lg * 2}
            height={180}
            chartConfig={{ ...chartConfig, color: (op = 1) => `rgba(91, 77, 248, ${op})` }}
            fromZero
            withInnerLines={false}
            showValuesOnTopOfBars={false}
            style={{ marginVertical: 8, borderRadius: radius.lg, marginLeft: -8 }}
          />
        </Card>

        {/* ═════ Category Analysis (donut) ═════ */}
        {pieData.length > 0 && (
          <>
            <SectionHeader title="Category Breakdown" actionLabel="This Month" />
            <Card style={{ alignItems: 'center' }}>
              <PieChart
                data={pieData}
                width={SCREEN_W - spacing.lg * 2 - spacing.lg * 2}
                height={180}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[10, 0]}
                hasLegend={true}
                avoidFalseZero={true}
              />
            </Card>
          </>
        )}

        {/* ═════ AI Monthly Summary ═════ */}
        <SectionHeader title="AI Monthly Summary" />
        <View style={styles.summaryGrid}>
          <SummaryCard icon="trophy" iconColor={colors.success}
                       label="Biggest Win" value={win?.name || 'No data'}
                       sub={win ? `${formatCurrency(win.spent)} of ${formatCurrency(win.limit)}` : ''} />
          <SummaryCard icon="warning" iconColor={colors.danger}
                       label="Biggest Leak" value={leak?.name || 'No data'}
                       sub={leak ? `${formatCurrency(leak.spent)} of ${formatCurrency(leak.limit)}` : ''} />
          <SummaryCard icon="trending-up" iconColor={colors.primary}
                       label="Savings Growth" value={formatCurrency(Math.max(inc - exp, 0))}
                       sub="vs target" />
          <SummaryCard icon="flame" iconColor={colors.warning}
                       label="Projected" value={formatCurrency((inc - exp) * 12)}
                       sub="annual savings" />
        </View>

        {/* ═════ Export ═════ */}
        <SectionHeader title="Export Report" />
        <Card padding={0}>
          <ExportRow icon="document-text-outline" label="Export as PDF"
                     sub="Detailed monthly report" onPress={() => Alert.alert('Coming soon')} />
          <View style={styles.divider} />
          <ExportRow icon="share-outline" label="Share Summary"
                     sub="Send to anyone" onPress={exportReport} />
          <View style={styles.divider} />
          <ExportRow icon="download-outline" label="Download CSV"
                     sub="For spreadsheets" onPress={() => Alert.alert('Coming soon')} />
        </Card>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────
function LegendItem({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function SummaryCard({ icon, iconColor, label, value, sub }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
      {sub ? <Text style={styles.summarySub}>{sub}</Text> : null}
    </View>
  );
}

function ExportRow({ icon, label, sub, onPress }) {
  return (
    <TouchableOpacity style={styles.exportRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.exportIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.exportLabel}>{label}</Text>
        <Text style={styles.exportSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md, marginBottom: spacing.lg },
  monthBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthLabel: { ...typography.bodyBold, color: colors.text, fontSize: 16 },

  sectionTitle: { ...typography.sectionTitle, color: colors.text },

  // Health card
  healthCard: { padding: spacing.xl },
  healthRow: { flexDirection: 'row', alignItems: 'center' },
  healthLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  healthScore: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -1, marginTop: 4, marginBottom: 4 },
  healthMessage: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, fontWeight: '500' },

  gaugeGrade: { fontSize: 32, fontWeight: '900' },

  // Legend
  legendRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

  // Trend
  trendHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md },
  trendToggle: { flexDirection: 'row', backgroundColor: colors.card, padding: 3, borderRadius: radius.md, gap: 2 },
  trendOpt: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm },
  trendOptActive: { backgroundColor: colors.primary },
  trendOptText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  trendOptTextActive: { color: '#fff' },

  trendValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  trendValue: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },

  // Summary grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  summaryCard: { width: (SCREEN_W - spacing.lg * 2 - spacing.md) / 2, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: 6, ...shadows.sm },
  summaryIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { ...typography.caption, color: colors.textMuted },
  summaryValue: { ...typography.bodyBold, color: colors.text, fontSize: 16 },
  summarySub: { fontSize: 11, color: colors.textSoft, fontWeight: '500' },

  // Export
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  exportIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  exportLabel: { ...typography.bodyBold, color: colors.text, fontSize: 14 },
  exportSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderSoft, marginLeft: spacing.lg + 36 + spacing.md },
});
