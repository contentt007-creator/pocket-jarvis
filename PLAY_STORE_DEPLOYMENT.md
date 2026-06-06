# 🚀 Pocket Jarvis — Play Store Deployment Guide

This doc is for **Ashique** (or anyone) who needs to publish Pocket Jarvis to Google Play Store.

---

## 📦 What you get from us

| Item | How to get it |
|---|---|
| **Production AAB file** | Download from EAS (link in handoff message) |
| **Signing keystore** | Choose one of two options below |
| **GitHub repo** | https://github.com/contentt007-creator/pocket-jarvis |
| **Backend (Railway)** | Production URL: `https://pocket-jarvis-backend-production.up.railway.app` |
| **App identity** | Package name: `com.pocketjarvis.app` |

---

## 🔐 Signing Key — Two Options

### Option A — Use Play App Signing (Recommended ✅)
**Google manages the signing key. We give you the upload key. Simpler and safer.**

1. When you create the app in Play Console, opt into **"Play App Signing"**
2. Upload our AAB — Google will accept it because EAS already signed it with the upload key
3. Google re-signs with their managed key before distributing
4. If we ever lose our upload key, Google can reset it

This is what 95% of apps do. **Use this.**

### Option B — Download our keystore from EAS
Only needed if you want full control over the signing key (advanced).

```bash
cd frontend
eas credentials --platform android
# Select: production
# Select: Keystore: Manage everything needed to build your project
# Select: Download keystore from EAS servers
```

You'll get:
- `keystore.jks` file
- Keystore password
- Key alias
- Key password

**Store these securely** — losing them = no more updates to the app, forever.

---

## 📋 Step-by-Step Publishing

### 1. Create a Play Console developer account
- Go to: https://play.google.com/console/signup
- Pay $25 one-time fee
- Complete identity verification (1-3 days)

### 2. Create the app in Play Console
- Click **"Create app"**
- App name: **Pocket Jarvis**
- Default language: **English (US)** + add **Bengali (Bangladesh)**
- App or game: **App**
- Free or paid: **Free** (with in-app purchases)

### 3. Set up app content (required)
Complete every section in the left sidebar that has a red dot:

- **Privacy policy URL** → Required. Use [termsfeed.com](https://termsfeed.com) to generate one. Must be hosted publicly.
- **App access** → "All functionality is available without restrictions"
- **Ads** → "No, my app does not contain ads"
- **Content rating** → Take the questionnaire → likely **Everyone** (it's a finance tracker)
- **Target audience** → 18+ (financial app)
- **News app** → No
- **COVID-19 apps** → No
- **Data safety** → Declare what we collect:
  - Email (account)
  - Name (account)
  - Financial info (in-app — user-entered transactions)
  - **No data shared with third parties** (data only goes to MongoDB Atlas)
  - **Data is encrypted in transit** (HTTPS to Railway)

### 4. Set up in-app subscriptions
Path: **Monetize → Products → Subscriptions → Create subscription**

| Product ID | Name | Price |
|---|---|---|
| `pocketjarvis_pro_monthly` | Pocket Jarvis Pro | ৳99/month BDT |
| `pocketjarvis_premium_monthly` | Pocket Jarvis Premium | ৳150/month BDT |

⚠️ **Product IDs must match these exactly** — the backend is hardcoded to recognize them.

For each subscription:
- Billing period: **Monthly**
- Free trial: **None** (or 7 days if you want — your call)
- Grace period: **3 days** (Google default)

### 5. Set up the store listing
- **Short description** (80 chars): 
  > AI-powered personal finance with Bengali support and bKash payments
- **Full description** (4000 chars): see template at bottom of this doc
- **App icon**: 512×512 PNG — use `logo-source.png` from repo, resized
- **Feature graphic**: 1024×500 PNG — make a banner with the logo + "Pocket Jarvis" text
- **Phone screenshots**: 2–8 PNGs minimum 320px. Suggested: Home, Budget, Goals, Jarvis Chat, Reports
- **Category**: Finance

### 6. Upload the AAB

#### a) Set up internal testing first (recommended)
- Production → **Internal testing** → Create new release
- Upload the `.aab` we send you
- Add yourself + a few testers via email
- Test thoroughly: register → make transactions → tap Upgrade → simulate bKash payment

#### b) Promote to Production
- Once tested, promote the same build to Production
- Submit for review
- Google reviews in **3–7 days** (sometimes 1–2 weeks for finance apps)

---

## 🔄 Future Updates (after first release)

When new features are added:

```bash
cd frontend
# 1. Bump version
# Edit app.json: increase "version" (e.g. 1.0.0 → 1.0.1) AND "versionCode" (1 → 2)

# 2. Build
eas build --platform android --profile production

# 3. Download the new .aab and upload to Play Console
```

Update reviews are typically faster (1-2 days).

---

## 💳 Enabling Google Play IAP (after Play Store goes live)

Currently `react-native-iap` is **stubbed out** (shows "Coming Soon" alert). Once the app is live in Play Store, re-enable it:

### 1. Install the real library
```bash
cd frontend
npm install react-native-iap react-native-nitro-modules --legacy-peer-deps
```

### 2. Restore the real IAP service
Replace `frontend/services/iap.js` with the version from git history (commit before `502200d`):
```bash
git show 78d330a:frontend/services/iap.js > frontend/services/iap.js
```

### 3. Set up Google Play API access (for receipt validation)
- Play Console → **Setup → API access**
- Link your Google Cloud project
- Create a **Service Account** (Google Cloud Console → IAM → Service Accounts → Create)
- Grant role: **Pub/Sub Admin** + **Service Account User**
- Download the JSON key
- Add to Railway:
  ```bash
  railway variables set GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
  ```

### 4. Rebuild and publish
```bash
eas build --platform android --profile production
```

---

## 📝 Store Listing — Full Description Template

```
Pocket Jarvis — Your personal AI finance advisor, built for Bangladesh.

Track every taka, build smart budgets, set savings goals, and get personalized 
financial wisdom — all powered by AI.

🤖 MEET JARVIS — YOUR AI ADVISOR
Chat with Jarvis about your money. He sees your real spending, your goals, 
and your habits, then gives you personalized advice. No generic tips — every 
response uses YOUR numbers.

💰 SMART BUDGETING
- Track unlimited transactions
- Categorize spending automatically
- Set monthly budgets per category
- Get warnings when you're close to your limit

🎯 SAVINGS GOALS
- Create unlimited goals with deadlines
- Track progress with milestones
- Calculate daily / weekly savings needed
- Celebrate when you hit 25%, 50%, 75%, 100%

📊 FINANCIAL HEALTH SCORE
See your monthly grade (A–F) based on spending discipline, savings progress, 
and budget adherence.

🎓 MONEY MASTERS
Learn from 12 legendary financial minds — Warren Buffett, Dave Ramsey, Robert 
Kiyosaki, and more. Apply their proven methods (Zero-based budgeting, JARS 
system, Pay yourself first) to your own finances.

💸 LEND MONEY TRACKING
Lend money to friends and family? Track every loan, partial repayment, and due 
date in one place.

📱 PAY WITH BKASH
Subscribe to Pro (৳99/mo) or Premium (৳150/mo) using your bKash account. 
Simple, local, secure.

🇧🇩 BUILT FOR BANGLADESH
- All amounts in Bangladeshi Taka (৳)
- bKash payment support
- Bengali culture aware

✨ FREE FOREVER (with limits)
- 30 transactions/month
- 2 savings goals
- Basic budgeting

🌟 PRO — ৳99/month
- Unlimited transactions
- Jarvis AI Chat
- Full reports & charts
- Money Masters wisdom

💎 PREMIUM — ৳150/month
- Everything in Pro
- Unlimited goals & loans
- Apply budgeting methods
- What-If goal analysis
- Daily Wisdom cards

Download Pocket Jarvis today and take control of your financial life.

Your money. Your move.
```

---

## ❓ Troubleshooting

**"Upload failed: keystore mismatch"**  
→ You're trying to upload an AAB signed by a different key than what was set up initially. Use the EAS-built AAB only.

**"Subscription product ID not found"**  
→ Product IDs in Play Console must match exactly: `pocketjarvis_pro_monthly` and `pocketjarvis_premium_monthly`

**"App rejected: requires extra account verification"**  
→ Finance apps go through extra scrutiny. Respond to Google's email with: 
- Privacy policy URL
- Test account credentials they can use
- Explanation: "Personal finance tracker — no real money transfer, no banking services"

---

## 📞 Contact

For backend/code questions, contact: **contentt0077@gmail.com**

Repo: https://github.com/contentt007-creator/pocket-jarvis
