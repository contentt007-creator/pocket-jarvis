// Pocket Jarvis subscription plan definitions
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'BDT',
    limits: {
      transactionsPerMonth: 50,
      goals: 3,
      activeLoans: 2,
      jarvisMessagesPerDay: 10,        // generous taste of Jarvis
    },
    features: {
      aiChat: true,                    // ✅ enabled — limited by jarvisMessagesPerDay
      aiInsight: true,                 // ✅ enabled — daily insight card
      reports: true,                   // ✅ enabled — basic reports
      subscriptionsDebts: true,        // ✅ enabled — basic tracking
      lendMoney: true,                 // ✅ enabled — limited by activeLoans
      moneyMasters: 'view',            // view only, can't apply methods
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
      goals: 15,
      activeLoans: 10,
      jarvisMessagesPerDay: 100,
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
