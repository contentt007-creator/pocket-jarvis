// Pocket Jarvis subscription plan definitions
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'BDT',
    limits: {
      transactionsPerMonth: 30,
      goals: 2,
      activeLoans: 0,
      jarvisMessagesPerDay: 0,
    },
    features: {
      aiChat: false,
      aiInsight: false,
      reports: false,
      subscriptionsDebts: false,
      lendMoney: false,
      moneyMasters: 'view',       // 'none' | 'view' | 'full'
      applyBudgetMethod: false,
      whatIf: false,
      dailyWisdom: false,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    currency: 'BDT',
    limits: {
      transactionsPerMonth: Infinity,
      goals: 10,
      activeLoans: 5,
      jarvisMessagesPerDay: 30,
    },
    features: {
      aiChat: true,
      aiInsight: true,
      reports: true,
      subscriptionsDebts: true,
      lendMoney: true,
      moneyMasters: 'full',
      applyBudgetMethod: false,
      whatIf: false,
      dailyWisdom: false,
    },
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    price: 150,
    currency: 'BDT',
    limits: {
      transactionsPerMonth: Infinity,
      goals: Infinity,
      activeLoans: Infinity,
      jarvisMessagesPerDay: Infinity,
    },
    features: {
      aiChat: true,
      aiInsight: true,
      reports: true,
      subscriptionsDebts: true,
      lendMoney: true,
      moneyMasters: 'full',
      applyBudgetMethod: true,
      whatIf: true,
      dailyWisdom: true,
    },
  },
};

module.exports = PLANS;
