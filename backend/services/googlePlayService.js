const { google } = require('googleapis');

// Google Play Developer API — validates subscription receipts
// Credentials: create a service account in Google Cloud Console
// and download the JSON key file. Set contents as GOOGLE_SERVICE_ACCOUNT_JSON env var.

let androidPublisher = null;

function getAndroidPublisher() {
  if (androidPublisher) return androidPublisher;

  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    console.warn('⚠️  GOOGLE_SERVICE_ACCOUNT_JSON not set — Google Play validation disabled');
    return null;
  }

  try {
    const credentials = JSON.parse(credJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    androidPublisher = google.androidpublisher({ version: 'v3', auth });
    return androidPublisher;
  } catch (err) {
    console.error('Google Play auth setup failed:', err.message);
    return null;
  }
}

const PACKAGE_NAME = 'com.pocketjarvis.app';

// Validate a subscription purchase token from Google Play
async function validateSubscription(productId, purchaseToken) {
  const publisher = getAndroidPublisher();
  if (!publisher) return { valid: false, error: 'Google Play validation not configured' };

  try {
    const res = await publisher.purchases.subscriptionsv2.get({
      packageName: PACKAGE_NAME,
      token: purchaseToken,
    });

    const sub = res.data;
    const isActive = sub.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE'
      || sub.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';

    // Get expiry from the first line item
    const lineItem = sub.lineItems?.[0];
    const expiryTime = lineItem?.expiryTime;

    return {
      valid: isActive,
      subscriptionState: sub.subscriptionState,
      productId: lineItem?.productId || productId,
      expiryTime,
      orderId: sub.latestOrderId,
      raw: sub,
    };
  } catch (err) {
    console.error('Google Play validation error:', err.message);
    return { valid: false, error: err.message };
  }
}

// Map Google Play product ID to our plan ID
const PRODUCT_PLAN_MAP = {
  'pocketjarvis_pro_monthly':     'pro',
  'pocketjarvis_premium_monthly': 'premium',
};

function getPlanFromProductId(productId) {
  return PRODUCT_PLAN_MAP[productId] || null;
}

module.exports = { validateSubscription, getPlanFromProductId, PRODUCT_PLAN_MAP };
