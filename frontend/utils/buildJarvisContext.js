export function buildJarvisContext({ user, summary, budgetStatus, goals, upcomingSubs, debts }) {
  return {
    name: user?.name || 'User',
    balance: summary?.balance || 0,
    income: summary?.income || 0,
    expense: summary?.expense || 0,
    net: summary?.net || 0,
    categorySpend: summary?.categoryBreakdown || {},
    budgetStatus: budgetStatus?.categories || [],
    goals: goals || [],
    upcomingSubs: upcomingSubs || [],
    debts: debts || [],
  };
}
