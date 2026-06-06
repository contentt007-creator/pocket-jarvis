const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Subscription = require('../models/Subscription');
const Debt = require('../models/Debt');
const UserMethod = require('../models/UserMethod');
const EXPERTS = require('../data/experts');
const auth = require('../middleware/auth');
const { checkAiLimit, requireFeature } = require('../middleware/planGate');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function buildContext(user) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [txns, goals, subs, debts] = await Promise.all([
    Transaction.find({ userId: user._id, date: { $gte: start, $lt: end } }),
    Goal.find({ userId: user._id }),
    Subscription.find({ userId: user._id, isActive: true }),
    Debt.find({ userId: user._id, isSettled: false }),
  ]);

  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const catSpend = {};
  txns.filter(t => t.type === 'expense').forEach(t => {
    catSpend[t.category] = (catSpend[t.category] || 0) + t.amount;
  });

  const allTxns = await Transaction.find({ userId: user._id });
  const totalIncome = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = user.initialBalance + totalIncome - totalExpense;

  const goalsText = goals.map(g => {
    const pct = Math.round((g.savedAmount / g.targetAmount) * 100);
    const daysLeft = Math.ceil((new Date(g.targetDate) - now) / (1000 * 60 * 60 * 24));
    return `${g.name}: ৳${g.savedAmount.toLocaleString()}/৳${g.targetAmount.toLocaleString()} (${pct}%, ${daysLeft} days left)`;
  }).join('; ');

  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingSubs = subs.filter(s => new Date(s.renewalDate) <= in7).map(s => `${s.name} ৳${s.amount}`).join(', ');

  const iOwe = debts.filter(d => d.type === 'owe').reduce((s, d) => s + d.amount, 0);
  const owedToMe = debts.filter(d => d.type === 'owed').reduce((s, d) => s + d.amount, 0);

  return {
    name: user.name,
    balance,
    month,
    income,
    expense,
    net: income - expense,
    catSpend,
    goalsText,
    upcomingSubs,
    debtSummary: `You owe ৳${iOwe.toLocaleString()}, others owe you ৳${owedToMe.toLocaleString()}`,
  };
}

function buildSystemPrompt(ctx, userMessage, activeExpert) {
  const catLines = Object.entries(ctx.catSpend)
    .map(([k, v]) => `${k} ৳${v.toLocaleString()}`)
    .join(', ') || 'No expenses yet';

  const methodLine = activeExpert
    ? `The user has chosen to follow ${activeExpert.name}'s method: ${activeExpert.methodSummary}. Always frame your advice through this lens. ${
        activeExpert.slug === 'dave-ramsey' ? 'Ask whether every taka has been assigned a name this month.' :
        activeExpert.slug === 'warren-buffett' ? 'Always ask "have you paid yourself first?" when relevant.' :
        activeExpert.slug === 'harv-eker' ? 'Reference the JARS system (55/10/10/10/10/5) when giving budget advice.' :
        activeExpert.slug === 'suze-orman' ? 'Always check whether the emergency fund is funded before praising other goals.' :
        activeExpert.slug === 'benjamin-graham' ? 'Warn when spending exceeds 80% of any category — that is the margin of safety.' :
        activeExpert.slug === 'ramit-sethi' ? 'Never guilt-trip the user for spending on their chosen rich life priorities.' :
        activeExpert.slug === 'napoleon-hill' ? 'Reference the user\'s goal deadlines and daily savings required in your advice.' :
        activeExpert.slug === 'milton-friedman' ? 'Compare spending to the 3-month rolling income average, not the current month.' :
        'Adapt your tone and framework to this expert\'s philosophy.'
      }`
    : '';

  return `You are Jarvis, a friendly and smart personal finance advisor inside the Pocket Jarvis app. You speak clearly, warmly, and without judgment. You always reference the user's actual financial data in your responses — never give generic advice. ${methodLine}

Here is ${ctx.name}'s current financial snapshot:
- Current balance: ৳${ctx.balance.toLocaleString()}
- This month (${ctx.month}): Income ৳${ctx.income.toLocaleString()}, Expenses ৳${ctx.expense.toLocaleString()}, Net ৳${ctx.net.toLocaleString()}
- Spending by category: ${catLines}
- Savings goals: ${ctx.goalsText || 'No goals set'}
- Upcoming subscriptions (next 7 days): ${ctx.upcomingSubs || 'None'}
- Outstanding debts: ${ctx.debtSummary}

The user's message: ${userMessage}

Respond in 3–5 sentences max. Be specific, use their numbers, and end with one clear actionable suggestion.`;
}

// POST /api/ai/chat
router.post('/chat', auth, checkAiLimit, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const [ctx, userMethod] = await Promise.all([
      buildContext(req.user),
      UserMethod.findOne({ userId: req.user._id }),
    ]);
    const activeExpert = userMethod?.activeMethod
      ? EXPERTS.find(e => e.slug === userMethod.activeMethod)
      : null;

    const prompt = buildSystemPrompt(ctx, message, activeExpert);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ reply: text, activeMethod: userMethod?.activeMethod || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ai/insight
router.get('/insight', auth, async (req, res) => {
  try {
    const ctx = await buildContext(req.user);
    const prompt = `You are Jarvis, a friendly personal finance AI. Based on this snapshot for ${ctx.name}:
Balance: ৳${ctx.balance.toLocaleString()}, This month income: ৳${ctx.income.toLocaleString()}, expenses: ৳${ctx.expense.toLocaleString()}.
Write ONE punchy, personalized insight sentence (max 20 words) that references their actual numbers. No greeting, no emoji, just the insight.`;
    const result = await model.generateContent(prompt);
    res.json({ insight: result.response.text().trim() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/whatif
router.post('/whatif', auth, async (req, res) => {
  try {
    const { goalId, newTargetDate, newTargetAmount } = req.body;
    const Goal = require('../models/Goal');
    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const targetAmount = newTargetAmount || goal.targetAmount;
    const targetDate = newTargetDate ? new Date(newTargetDate) : new Date(goal.targetDate);
    const daysLeft = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(targetAmount - goal.savedAmount, 0);
    const weeksLeft = Math.max(daysLeft / 7, 1);
    const weeklyNeeded = Math.ceil(remaining / weeksLeft);

    const prompt = `You are Jarvis. A user wants to save ৳${remaining.toLocaleString()} in ${daysLeft} days (৳${weeklyNeeded.toLocaleString()}/week) for their goal "${goal.name}". In 2–3 sentences, give a realistic, encouraging assessment of whether this is achievable and one concrete tip.`;
    const result = await model.generateContent(prompt);
    res.json({ weeklyNeeded, daysLeft, remaining, projection: result.response.text().trim() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
