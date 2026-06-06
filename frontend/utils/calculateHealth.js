// Score 0–100 → grade A–F
export function calculateHealthScore({ budgetCategories, monthlyIncome, monthExpense, goals }) {
  let score = 100;

  // Income vs expense ratio (40 pts)
  if (monthlyIncome > 0) {
    const ratio = monthExpense / monthlyIncome;
    if (ratio > 1) score -= 40;
    else if (ratio > 0.9) score -= 30;
    else if (ratio > 0.75) score -= 20;
    else if (ratio > 0.6) score -= 10;
  }

  // Budget adherence (40 pts)
  const catsWithLimit = budgetCategories.filter(c => c.limit > 0);
  if (catsWithLimit.length > 0) {
    const overBudget = catsWithLimit.filter(c => c.spent > c.limit).length;
    const ratio = overBudget / catsWithLimit.length;
    score -= Math.round(ratio * 40);
  }

  // Savings progress (20 pts)
  if (goals && goals.length > 0) {
    const avgProgress = goals.reduce((s, g) => s + (g.savedAmount / g.targetAmount), 0) / goals.length;
    if (avgProgress < 0.1) score -= 20;
    else if (avgProgress < 0.25) score -= 10;
    else if (avgProgress < 0.5) score -= 5;
  }

  score = Math.max(0, Math.min(100, score));
  return score;
}

export function scoreToGrade(score) {
  if (score >= 90) return { grade: 'A', color: '#1D9E75', label: 'Excellent' };
  if (score >= 80) return { grade: 'B', color: '#1D9E75', label: 'Good' };
  if (score >= 70) return { grade: 'C', color: '#EF9F27', label: 'Fair' };
  if (score >= 60) return { grade: 'D', color: '#EF9F27', label: 'Needs Work' };
  return { grade: 'F', color: '#E24B4A', label: 'Critical' };
}
