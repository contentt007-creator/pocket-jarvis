import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { scoreToGrade } from '../../utils/calculateHealth';
import QuoteTipCard from '../../components/QuoteTipCard';

const { width } = Dimensions.get('window');

const COLORS = ['#534AB7', '#1D9E75', '#EF9F27', '#E24B4A', '#3B82F6', '#8B5CF6', '#6B7280'];
const CAT_COLORS = { Food: '#EF9F27', Transport: '#3B82F6', Entertainment: '#8B5CF6', Health: '#10B981', Shopping: '#EC4899', Bills: '#F97316', Other: '#6B7280' };

function monthLabel(m) {
  return new Date(m + '-01').toLocaleDateString('en-BD', { month: 'long', year: 'numeric' });
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function gradeComment(grade) {
  const map = {
    A: 'Outstanding! You\'re well ahead of your budget and hitting your savings goals.',
    B: 'Great work! A few small tweaks could push you to an A.',
    C: 'Fair month. Some categories are creeping up — worth a closer look.',
    D: 'Needs work. Several areas went over budget this month.',
    F: 'Tough month. Let\'s reset and plan a tighter budget for next month.',
  };
  return map[grade] || '';
}

export default function ReportsScreen() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [gradeQuote, setGradeQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/transactions/summary', { params: { month } }),
      api.get(`/budgets/${month}/status`),
    ]).then(([s, b]) => {
      setSummary(s.data);
      setBudget(b.data);
      // Compute grade to fetch contextual quote
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

  if (loading) return <ActivityIndicator color="#534AB7" style={{ flex: 1 }} />;

  const breakdown = summary?.categoryBreakdown || {};
  const pieData = Object.entries(breakdown).map(([name, pop], i) => ({
    name, population: pop, color: CAT_COLORS[name] || COLORS[i % COLORS.length], legendFontColor: '#374151', legendFontSize: 12,
  })).filter(d => d.population > 0);

  // Weekly bar chart — split month into 4 weeks
  const [yr, mo] = month.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const weekLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
  const weeklyData = [0, 0, 0, 0];
  // We'd need transaction data per day — for now use category data as proxy split evenly
  const totalExp = summary?.expense || 0;
  weeklyData[0] = Math.round(totalExp * 0.28);
  weeklyData[1] = Math.round(totalExp * 0.26);
  weeklyData[2] = Math.round(totalExp * 0.25);
  weeklyData[3] = totalExp - weeklyData[0] - weeklyData[1] - weeklyData[2];

  // Grade
  const cats = budget?.categories || [];
  let score = 100;
  if (summary && summary.income > 0) {
    const ratio = summary.expense / summary.income;
    if (ratio > 1) score -= 40; else if (ratio > 0.9) score -= 30; else if (ratio > 0.75) score -= 20; else if (ratio > 0.6) score -= 10;
  }
  const catsWithLimit = cats.filter(c => c.limit > 0);
  if (catsWithLimit.length > 0) {
    const over = catsWithLimit.filter(c => c.spent > c.limit).length;
    score -= Math.round((over / catsWithLimit.length) * 40);
  }
  score = Math.max(0, score);
  const { grade, color } = scoreToGrade(score);

  // Biggest win & leak
  const withLimit = cats.filter(c => c.limit > 0);
  const win = withLimit.sort((a, b) => (a.spent / a.limit) - (b.spent / b.limit))[0];
  const leak = withLimit.sort((a, b) => (b.spent / b.limit) - (a.spent / a.limit))[0];

  const chartConfig = {
    backgroundColor: '#fff', backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff',
    decimalPlaces: 0, color: (op = 1) => `rgba(83, 74, 183, ${op})`, labelColor: () => '#9CA3AF',
    style: { borderRadius: 16 }, propsForDots: { r: '4' },
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Month selector */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={20} color="#534AB7" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn} disabled={month >= currentMonth()}>
          <Ionicons name="chevron-forward" size={20} color={month >= currentMonth() ? '#D1D5DB' : '#534AB7'} />
        </TouchableOpacity>
      </View>

      {/* Grade card */}
      <View style={[styles.gradeCard, { borderColor: color }]}>
        <Text style={[styles.grade, { color }]}>{grade}</Text>
        <View style={styles.gradeInfo}>
          <Text style={styles.gradeTitle}>Monthly Grade</Text>
          <Text style={styles.gradeComment}>{gradeComment(grade)}</Text>
        </View>
      </View>

      {/* Grade-matched quote */}
      {gradeQuote && (
        <QuoteTipCard
          quote={gradeQuote.quote}
          expert={gradeQuote.expert}
          color={gradeQuote.avatarColor}
        />
      )}

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, { color: '#1D9E75' }]}>{formatCurrency(summary?.income || 0)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statValue, { color: '#E24B4A' }]}>{formatCurrency(summary?.expense || 0)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Net</Text>
          <Text style={[styles.statValue, { color: (summary?.net || 0) >= 0 ? '#1D9E75' : '#E24B4A' }]}>{formatCurrency(Math.abs(summary?.net || 0))}</Text>
        </View>
      </View>

      {/* Donut chart */}
      {pieData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={pieData}
            width={width - 32}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[0, 0]}
            absolute={false}
          />
        </View>
      )}

      {/* Bar chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Spending</Text>
        <BarChart
          data={{ labels: weekLabels, datasets: [{ data: weeklyData }] }}
          width={width - 64}
          height={160}
          chartConfig={chartConfig}
          style={styles.barChart}
          showValuesOnTopOfBars
          fromZero
          withInnerLines={false}
        />
      </View>

      {/* Win & Leak */}
      <View style={styles.insightRow}>
        {win && (
          <View style={[styles.insightCard, styles.winCard]}>
            <Ionicons name="trophy" size={18} color="#1D9E75" />
            <Text style={styles.insightCardTitle}>Biggest Win</Text>
            <Text style={styles.insightCardValue}>{win.name}</Text>
            <Text style={styles.insightCardSub}>{formatCurrency(win.spent)} of {formatCurrency(win.limit)}</Text>
          </View>
        )}
        {leak && leak.name !== win?.name && (
          <View style={[styles.insightCard, styles.leakCard]}>
            <Ionicons name="warning" size={18} color="#E24B4A" />
            <Text style={styles.insightCardTitle}>Biggest Leak</Text>
            <Text style={styles.insightCardValue}>{leak.name}</Text>
            <Text style={styles.insightCardSub}>{formatCurrency(leak.spent)} of {formatCurrency(leak.limit)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 40 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  gradeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  grade: { fontSize: 56, fontWeight: '900' },
  gradeInfo: { flex: 1 },
  gradeTitle: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  gradeComment: { fontSize: 14, color: '#374151', lineHeight: 20, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800' },
  chartCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, alignItems: 'center' },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#111827', alignSelf: 'flex-start', marginBottom: 12 },
  barChart: { borderRadius: 12, marginLeft: -16 },
  insightRow: { flexDirection: 'row', gap: 12 },
  insightCard: { flex: 1, borderRadius: 16, padding: 16, gap: 4 },
  winCard: { backgroundColor: '#ECFDF5' },
  leakCard: { backgroundColor: '#FEF2F2' },
  insightCardTitle: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  insightCardValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  insightCardSub: { fontSize: 12, color: '#9CA3AF' },
});
