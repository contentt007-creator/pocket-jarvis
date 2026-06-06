const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');
const PLANS = require('../config/plans');

// Get or create subscription record for a user
async function getUserPlan(userId) {
  let sub = await Subscription.findOne({ userId });
  if (!sub) sub = await Subscription.create({ userId, plan: 'free' });
  if (sub.plan !== 'free' && sub.endDate && new Date() > new Date(sub.endDate)) {
    sub.plan = 'free';
    sub.status = 'expired';
    await sub.save();
  }
  return sub;
}

// Middleware: attach plan info to req
async function attachPlan(req, res, next) {
  try {
    if (!req.user) return next();
    const sub = await getUserPlan(req.user._id);
    req.subscription = sub;
    req.plan = PLANS[sub.plan] || PLANS.free;
    next();
  } catch (err) {
    next(err);
  }
}

// Middleware: require feature flag
function requireFeature(featureKey) {
  return async (req, res, next) => {
    await attachPlan(req, res, async () => {
      const allowed = req.plan.features[featureKey];
      if (!allowed || allowed === 'none') {
        return res.status(403).json({
          message: `This feature requires a paid plan.`,
          feature: featureKey,
          requiredPlan: getMinPlanFor(featureKey),
          upgradeRequired: true,
        });
      }
      next();
    });
  };
}

// Middleware: check transaction limit
async function checkTransactionLimit(req, res, next) {
  try {
    const sub = await getUserPlan(req.user._id);
    const plan = PLANS[sub.plan];
    if (plan.limits.transactionsPerMonth === Infinity) return next();

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await Transaction.countDocuments({ userId: req.user._id, createdAt: { $gte: start } });
    if (count >= plan.limits.transactionsPerMonth) {
      return res.status(403).json({
        message: `You've reached your ${plan.limits.transactionsPerMonth} transactions/month limit.`,
        limit: plan.limits.transactionsPerMonth,
        current: count,
        upgradeRequired: true,
        requiredPlan: 'pro',
      });
    }
    next();
  } catch (err) { next(err); }
}

// Middleware: check goal limit
async function checkGoalLimit(req, res, next) {
  try {
    const sub = await getUserPlan(req.user._id);
    const plan = PLANS[sub.plan];
    if (plan.limits.goals === Infinity) return next();

    const count = await Goal.countDocuments({ userId: req.user._id });
    if (count >= plan.limits.goals) {
      return res.status(403).json({
        message: `You've reached your ${plan.limits.goals} goals limit.`,
        limit: plan.limits.goals,
        current: count,
        upgradeRequired: true,
        requiredPlan: 'pro',
      });
    }
    next();
  } catch (err) { next(err); }
}

// Middleware: check active loan limit
async function checkLoanLimit(req, res, next) {
  try {
    const sub = await getUserPlan(req.user._id);
    const plan = PLANS[sub.plan];

    if (!plan.features.lendMoney) {
      return res.status(403).json({ message: 'Lend Money requires a Pro plan.', upgradeRequired: true, requiredPlan: 'pro' });
    }
    if (plan.limits.activeLoans === Infinity) return next();

    const count = await Loan.countDocuments({ userId: req.user._id, isSettled: false });
    if (count >= plan.limits.activeLoans) {
      return res.status(403).json({
        message: `You've reached your ${plan.limits.activeLoans} active loans limit.`,
        limit: plan.limits.activeLoans,
        upgradeRequired: true,
        requiredPlan: 'premium',
      });
    }
    next();
  } catch (err) { next(err); }
}

// Middleware: check Jarvis daily message limit
async function checkAiLimit(req, res, next) {
  try {
    const sub = await getUserPlan(req.user._id);
    const plan = PLANS[sub.plan];

    if (!plan.features.aiChat) {
      return res.status(403).json({ message: 'Jarvis AI requires a Pro plan.', upgradeRequired: true, requiredPlan: 'pro' });
    }
    if (plan.limits.jarvisMessagesPerDay === Infinity) return next();

    // Count today's AI chat calls (store count in subscription or use a simple Redis/counter approach)
    // For simplicity, track via a DailyUsage model or just proceed (add tracking later)
    next();
  } catch (err) { next(err); }
}

function getMinPlanFor(featureKey) {
  for (const [planId, plan] of Object.entries(PLANS)) {
    if (planId === 'free') continue;
    const val = plan.features[featureKey];
    if (val && val !== 'none' && val !== false) return planId;
  }
  return 'pro';
}

module.exports = { attachPlan, requireFeature, checkTransactionLimit, checkGoalLimit, checkLoanLimit, checkAiLimit, getUserPlan };
