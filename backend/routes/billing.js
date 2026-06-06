const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const auth = require('../middleware/auth');
const PLANS = require('../config/plans');
const bkash = require('../services/bkashService');
const { validateSubscription, getPlanFromProductId, PRODUCT_PLAN_MAP } = require('../services/googlePlayService');

const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const DEEP_LINK = 'pocketjarvis://payment';
const BKASH_MODE = !!process.env.BKASH_APP_KEY; // auto-switch: PGW if keys exist, manual otherwise
const BKASH_MERCHANT_NUMBER = process.env.BKASH_MERCHANT_NUMBER || '01XXXXXXXXXX';

// ─── Plans ────────────────────────────────────────────────────────────────────
router.get('/plans', (req, res) => {
  res.json(Object.values(PLANS).map(p => ({
    id: p.id, name: p.name, price: p.price,
    currency: p.currency, limits: p.limits, features: p.features,
  })));
});

// ─── Current subscription status ─────────────────────────────────────────────
router.get('/status', auth, async (req, res) => {
  try {
    let sub = await Subscription.findOne({ userId: req.user._id });
    if (!sub) sub = await Subscription.create({ userId: req.user._id, plan: 'free' });

    if (sub.plan !== 'free' && sub.endDate && new Date() > new Date(sub.endDate)) {
      sub.plan = 'free'; sub.status = 'expired'; await sub.save();
    }

    res.json({
      plan: sub.plan,
      status: sub.status,
      endDate: sub.endDate,
      isActive: sub.plan === 'free' || (sub.status === 'active' && (!sub.endDate || new Date() < new Date(sub.endDate))),
      planDetails: PLANS[sub.plan],
      paymentMode: BKASH_MODE ? 'pgw' : 'manual',
      merchantNumber: BKASH_MERCHANT_NUMBER,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── MODE 1: bKash PGW — initiate payment ────────────────────────────────────
router.post('/bkash/create', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan || plan.price === 0) return res.status(400).json({ message: 'Invalid plan' });

    const invoiceNumber = `PJ-${uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

    const result = await bkash.createPayment({
      amount: plan.price,
      merchantInvoiceNumber: invoiceNumber,
      payerReference: req.user._id.toString(),
      callbackURL: `${API_BASE}/api/billing/bkash/callback?userId=${req.user._id}&planId=${planId}&invoice=${invoiceNumber}`,
    });

    if (result.statusCode !== '0000') {
      return res.status(500).json({ message: result.statusMessage || 'bKash payment creation failed' });
    }

    // Store pending payment
    let sub = await Subscription.findOne({ userId: req.user._id });
    if (!sub) sub = await Subscription.create({ userId: req.user._id, plan: 'free' });
    sub.payments.push({
      transactionId: invoiceNumber,
      amount: plan.price,
      plan: planId,
      status: 'pending',
      gateway: 'bkash',
    });
    await sub.save();

    res.json({ bkashURL: result.bkashURL, paymentID: result.paymentID, invoiceNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── bKash PGW — callback (bKash redirects here after user pays) ─────────────
router.get('/bkash/callback', async (req, res) => {
  const { paymentID, status, userId, planId, invoice } = req.query;

  if (status === 'cancel') {
    await _updatePaymentStatus(userId, invoice, 'cancelled');
    return res.redirect(`${DEEP_LINK}?status=cancelled`);
  }
  if (status === 'failure') {
    await _updatePaymentStatus(userId, invoice, 'failed');
    return res.redirect(`${DEEP_LINK}?status=failed`);
  }

  try {
    // Execute the payment
    const result = await bkash.executePayment(paymentID);
    if (result.statusCode === '0000' || result.transactionStatus === 'Completed') {
      await _activateSubscription(userId, planId, invoice, result.trxID, result.paymentID, 'bkash');
      return res.redirect(`${DEEP_LINK}?status=success&plan=${planId}&trxId=${result.trxID}`);
    }
    await _updatePaymentStatus(userId, invoice, 'failed');
    res.redirect(`${DEEP_LINK}?status=failed`);
  } catch (err) {
    console.error('bKash callback error:', err.message);
    res.redirect(`${DEEP_LINK}?status=error`);
  }
});

// ─── MODE 2: Manual bKash — user submits TrxID ───────────────────────────────
router.post('/manual/submit', auth, async (req, res) => {
  try {
    const { planId, trxId, senderNumber } = req.body;
    const plan = PLANS[planId];
    if (!plan || plan.price === 0) return res.status(400).json({ message: 'Invalid plan' });
    if (!trxId?.trim()) return res.status(400).json({ message: 'Transaction ID is required' });

    // Check for duplicate TrxID
    const duplicate = await Subscription.findOne({ 'payments.transactionId': trxId.trim() });
    if (duplicate) return res.status(400).json({ message: 'This transaction ID has already been used.' });

    const invoiceNumber = trxId.trim().toUpperCase();

    let sub = await Subscription.findOne({ userId: req.user._id });
    if (!sub) sub = await Subscription.create({ userId: req.user._id, plan: 'free' });

    sub.payments.push({
      transactionId: invoiceNumber,
      amount: plan.price,
      plan: planId,
      status: 'pending',
      gateway: 'bkash-manual',
      cardType: senderNumber || 'unknown',
    });
    await sub.save();

    res.json({
      message: 'Payment submitted for verification. Your plan will be activated within a few hours.',
      invoiceNumber,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Admin: approve manual payment ───────────────────────────────────────────
router.post('/admin/approve', auth, async (req, res) => {
  try {
    if (req.user.email !== process.env.ADMIN_EMAIL) return res.status(403).json({ message: 'Forbidden' });
    const { trxId } = req.body;

    const sub = await Subscription.findOne({ 'payments.transactionId': trxId.toUpperCase() });
    if (!sub) return res.status(404).json({ message: 'No payment found with this TrxID' });

    const payment = sub.payments.find(p => p.transactionId === trxId.toUpperCase());
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'success') return res.status(400).json({ message: 'Already approved' });

    await _activateSubscription(sub.userId, payment.plan, payment.transactionId, payment.transactionId, null, 'bkash-manual');
    res.json({ message: `✅ Plan "${payment.plan}" activated for user ${sub.userId}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Admin: list pending manual payments ─────────────────────────────────────
router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (req.user.email !== process.env.ADMIN_EMAIL) return res.status(403).json({ message: 'Forbidden' });
    const subs = await Subscription.find({ 'payments.status': 'pending' }).populate('userId', 'name email');
    const pending = [];
    for (const sub of subs) {
      const p = sub.payments.filter(p => p.status === 'pending');
      p.forEach(pay => pending.push({
        userId: sub.userId?._id,
        userName: sub.userId?.name,
        userEmail: sub.userId?.email,
        trxId: pay.transactionId,
        plan: pay.plan,
        amount: pay.amount,
        gateway: pay.gateway,
        senderNumber: pay.cardType,
        submittedAt: pay._id.getTimestamp(),
      }));
    }
    res.json(pending.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Admin: manually grant plan (promo / testing) ────────────────────────────
router.post('/admin/grant', auth, async (req, res) => {
  try {
    if (req.user.email !== process.env.ADMIN_EMAIL) return res.status(403).json({ message: 'Forbidden' });
    const { targetEmail, planId, months = 1 } = req.body;
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);
    const sub = await Subscription.findOneAndUpdate(
      { userId: targetUser._id },
      { plan: planId, status: 'active', startDate: new Date(), endDate },
      { upsert: true, new: true }
    );
    res.json({ message: `Granted ${planId} to ${targetEmail} until ${endDate.toDateString()}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Cancel subscription ──────────────────────────────────────────────────────
router.post('/cancel', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { userId: req.user._id },
      { status: 'cancelled', autoRenew: false },
      { new: true }
    );
    res.json({ message: 'Subscription cancelled. You keep access until the end of your billing period.', endDate: sub?.endDate });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Google Play Billing ──────────────────────────────────────────────────────

// POST /api/billing/google/validate  — called after successful IAP on device
router.post('/google/validate', auth, async (req, res) => {
  try {
    const { productId, purchaseToken, orderId } = req.body;
    if (!productId || !purchaseToken) return res.status(400).json({ message: 'productId and purchaseToken are required' });

    const planId = getPlanFromProductId(productId);
    if (!planId) return res.status(400).json({ message: `Unknown product: ${productId}` });

    // Validate with Google Play API
    const validation = await validateSubscription(productId, purchaseToken);

    if (!validation.valid && process.env.NODE_ENV !== 'development') {
      return res.status(400).json({ message: 'Purchase validation failed', details: validation.error });
    }

    // Activate (or trust client in dev/sandbox mode if Google not configured)
    const expiryDate = validation.expiryTime
      ? new Date(validation.expiryTime)
      : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();

    let sub = await Subscription.findOne({ userId: req.user._id });
    if (!sub) sub = await Subscription.create({ userId: req.user._id, plan: 'free' });

    sub.plan = planId;
    sub.status = 'active';
    sub.startDate = new Date();
    sub.endDate = expiryDate;
    sub.payments.push({
      transactionId: orderId || purchaseToken.slice(0, 32),
      amount: PLANS[planId].price,
      plan: planId,
      status: 'success',
      gateway: 'google-play',
      paidAt: new Date(),
    });
    await sub.save();

    console.log(`✅ Google Play: userId=${req.user._id} plan=${planId} expires=${expiryDate}`);
    res.json({ success: true, plan: planId, endDate: expiryDate, planDetails: PLANS[planId] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/billing/google/products  — list available product IDs for IAP
router.get('/google/products', (req, res) => {
  res.json(Object.entries(PRODUCT_PLAN_MAP).map(([productId, planId]) => ({
    productId,
    planId,
    price: PLANS[planId].price,
    name: PLANS[planId].name,
    currency: 'BDT',
  })));
});

// POST /api/billing/google/webhook  — Real-Time Developer Notifications (Pub/Sub)
router.post('/google/webhook', async (req, res) => {
  try {
    const message = req.body?.message;
    if (!message?.data) return res.status(200).send('ok');

    const decoded = JSON.parse(Buffer.from(message.data, 'base64').toString('utf8'));
    const { subscriptionNotification, testNotification } = decoded;

    if (testNotification) {
      console.log('Google Play webhook test received');
      return res.status(200).send('ok');
    }

    if (subscriptionNotification) {
      const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;
      // notificationType: 1=RECOVERED, 2=RENEWED, 3=CANCELED, 4=PURCHASED, 5=ACCOUNT_HOLD, 12=EXPIRED
      if ([1, 2, 4].includes(notificationType)) {
        // Subscription active/renewed — find user by purchaseToken and extend
        const sub = await Subscription.findOne({ 'payments.transactionId': { $regex: purchaseToken.slice(0, 10) } });
        if (sub) {
          const planId = getPlanFromProductId(subscriptionId);
          const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 1);
          sub.plan = planId || sub.plan;
          sub.status = 'active';
          sub.endDate = endDate;
          await sub.save();
          console.log(`Google Play webhook: renewed userId=${sub.userId} plan=${sub.plan}`);
        }
      } else if ([3, 12].includes(notificationType)) {
        // Cancelled or expired
        const sub = await Subscription.findOne({ 'payments.transactionId': { $regex: purchaseToken.slice(0, 10) } });
        if (sub) { sub.status = 'cancelled'; await sub.save(); }
      }
    }
    res.status(200).send('ok');
  } catch (err) {
    console.error('Google webhook error:', err.message);
    res.status(200).send('ok'); // Always 200 to Google
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function _activateSubscription(userId, planId, invoiceNumber, trxID, paymentID, gateway) {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  await Subscription.findOneAndUpdate(
    { userId },
    {
      plan: planId,
      status: 'active',
      startDate: new Date(),
      endDate,
      $set: {
        'payments.$[p].status': 'success',
        'payments.$[p].paidAt': new Date(),
        'payments.$[p].gateway': gateway,
        ...(paymentID ? { 'payments.$[p].valId': paymentID } : {}),
      },
    },
    { arrayFilters: [{ 'p.transactionId': invoiceNumber }] }
  );
  console.log(`✅ Subscription activated: userId=${userId} plan=${planId} trxID=${trxID}`);
}

async function _updatePaymentStatus(userId, invoiceNumber, status) {
  await Subscription.updateOne(
    { userId, 'payments.transactionId': invoiceNumber },
    { $set: { 'payments.$.status': status } }
  );
}

module.exports = router;
