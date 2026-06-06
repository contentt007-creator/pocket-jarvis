// Google Play IAP stub — full implementation will land when app is published to Play Store.
// Until then, the Upgrade screen shows "Coming soon" for Google Play and uses bKash only.

export const PRODUCT_IDS = {
  pro:     'pocketjarvis_pro_monthly',
  premium: 'pocketjarvis_premium_monthly',
};

export const SKUS = Object.values(PRODUCT_IDS);

// No-op stubs — UI shows "Coming soon" alert instead of triggering these
export async function setupIAP() { return false; }
export async function fetchProducts() { return []; }
export async function purchaseSubscription() {
  throw new Error('Google Play payment will be available once the app is published to Play Store. Please use bKash for now.');
}
export async function validateAndActivate() { return null; }
export async function restorePurchases() { return []; }
export function endConnection() {}

// Stub listeners so React Native imports don't crash
export const purchaseUpdatedListener = () => ({ remove: () => {} });
export const purchaseErrorListener   = () => ({ remove: () => {} });
