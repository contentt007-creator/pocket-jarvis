# 📦 Pocket Jarvis — Play Store Upload Package

Everything Ashique needs to upload Pocket Jarvis to the Google Play Store.

---

## 🚀 Quick Start (15-minute upload guide)

1. **[Sign up at Play Console](https://play.google.com/console/signup)** — $25 one-time fee
2. **Create new app** in Play Console: name "Pocket Jarvis", language English + Bengali, type App, category Finance
3. **Upload the AAB** (link below) to Internal Testing first
4. **Fill in store listing** using the assets in `/play-store-assets/`
5. **Submit for review** — Google reviews finance apps in 3-7 days

---

## 📂 What's in this folder

| File | Purpose | Size |
|---|---|---|
| `play-store-assets/play-store-icon-512.png` | App icon (required) | 512×512 |
| `play-store-assets/feature-graphic-1024x500.png` | Store listing banner | 1024×500 |
| `play-store-assets/adaptive-icon-512.png` | Foreground for adaptive icon | 512×512 |
| `play-store-assets/PRIVACY_POLICY.md` | Markdown source | — |

---

## 🌐 Public URLs (for Play Console form)

| Field | URL |
|---|---|
| **App Website** | https://contentt007-creator.github.io/pocket-jarvis/ |
| **Privacy Policy** | https://contentt007-creator.github.io/pocket-jarvis/privacy.html |
| **Terms of Service** | https://contentt007-creator.github.io/pocket-jarvis/terms.html |
| **Support Email** | contentt0077@gmail.com |

*(GitHub Pages takes ~1 minute to deploy after each push.)*

---

## 📲 AAB File

**Production AAB** (link will be available once build finishes):
- Check latest build: https://expo.dev/accounts/jahidethans/projects/pocket-jarvis/builds
- File extension: `.aab` (Android App Bundle — Google Play required format)
- Already signed with EAS upload key
- Use **"Play App Signing"** when uploading (recommended)

To rebuild later (after code changes):
```bash
cd frontend
# Bump version in app.json (e.g. 1.0.0 → 1.0.1) AND versionCode (1 → 2)
eas build --platform android --profile production
```

---

## 🎨 Screenshots Needed (you create these)

Take 4-8 phone screenshots from the installed app:
1. Home screen (with the gradient balance card)
2. Budget screen (with the circular progress ring)
3. Goals screen (with the gradient hero)
4. Jarvis AI screen (with insight cards)
5. Reports screen (with the financial health gauge)

**Specs:** 16:9 or 9:16 aspect, min 320px, max 3840px on any side, PNG or JPG.

**Pro tip:** Use the installed APK and take screenshots from your phone directly. Or use an emulator with the AAB.

---

## 📝 Store Listing Content (copy-paste into Play Console)

### App Name
```
Pocket Jarvis
```

### Short Description (80 chars max)
```
AI personal finance for Bangladesh. Budget, save, and chat with Jarvis AI.
```

### Full Description (4000 chars max)
```
Pocket Jarvis — Your personal AI finance advisor, built for Bangladesh.

Track every taka, build smart budgets, set savings goals, and get personalized financial wisdom from Jarvis AI — your money companion that actually understands you.

🤖 MEET JARVIS — YOUR AI ADVISOR
Chat with Jarvis about your money. He sees your real spending, your goals, and your habits, then gives you personalized advice. No generic tips — every response uses YOUR numbers.

💰 SMART BUDGETING
• Track unlimited transactions
• Categorize spending automatically
• Set monthly budgets per category
• Get warnings when you're close to your limit

🎯 SAVINGS GOALS
• Create goals with deadlines
• Track progress with milestones
• Calculate weekly savings needed
• Celebrate at 25%, 50%, 75%, 100%

📊 FINANCIAL HEALTH SCORE
See your monthly grade (A-F) based on spending discipline, savings progress, and budget adherence.

🎓 MONEY MASTERS
Learn from 12 legendary financial minds — Warren Buffett, Dave Ramsey, Robert Kiyosaki, and more. Apply their proven methods to your own finances.

💸 LEND MONEY TRACKING
Lend to friends and family? Track every loan, partial repayment, and due date in one place.

📱 PAY WITH BKASH OR GOOGLE PLAY
Subscribe to Pro (৳99/mo) or Premium (৳150/mo) using bKash or Google Play. Local, secure, simple.

🇧🇩 BUILT FOR BANGLADESH
• All amounts in Bangladeshi Taka (৳)
• bKash payment support
• Bengali culture aware

✨ FREE FOREVER (with limits)
• 50 transactions/month
• 3 savings goals
• Basic AI insights
• 10 Jarvis messages per day

🌟 PRO — ৳99/month
• Unlimited transactions
• 15 savings goals
• 100 Jarvis messages per day
• Full reports & charts
• Money Masters wisdom
• Subscriptions, Debts & Lend Money

💎 PREMIUM — ৳150/month
• Everything in Pro
• Unlimited goals & loans
• Unlimited Jarvis AI
• Apply budgeting methods (JARS, Zero-based, etc.)
• What-If goal analysis
• Daily Wisdom cards

Download Pocket Jarvis today and take control of your financial life.

Your money. Your move.
```

### Category
```
Finance
```

### Tags
```
finance, budget, savings, AI, money, expense tracker, bKash, Bangladesh
```

### Content Rating Questionnaire
- Violence: No
- Sexuality: No
- Gambling: No
- User-generated content: No
- Shares user data with 3rd parties: Yes (Google Gemini for AI, bKash for payments)
- Health info: No
- Financial info: **Yes** — personal financial tracking only, no real money transfer
- Result: **Rated for 13+** (likely)

### Target Audience
- Primary: **18+**
- Adults: **Yes**
- Children/Teens: **No**

### Data Safety Form (Play Console)

**Does the app collect data?** YES

**Data types collected:**
- Personal info: Name, Email
- Financial info: User payment info (TrxIDs), Other financial info (transactions, budgets)
- App activity: App interactions
- Device IDs: Device ID

**Is data encrypted in transit?** YES
**Is data encrypted at rest?** YES
**Can users request data deletion?** YES (email request)
**Data collection optional?** Required for account; optional for AI features

**Shared with third parties:**
- Google Gemini API (for AI responses, not stored by them)
- bKash (for payment processing)
- Google Play (for subscription processing)

---

## 💳 In-App Purchases Setup

In Play Console → Monetize → Products → Subscriptions, create:

### Subscription 1
- **Product ID:** `pocketjarvis_pro_monthly` (must match exactly!)
- **Name:** Pocket Jarvis Pro
- **Description:** Unlimited transactions, Jarvis AI chat, full reports
- **Billing period:** Monthly
- **Price:** ৳99 BDT
- **Free trial:** None (or 7 days if you prefer)
- **Grace period:** 3 days (default)

### Subscription 2
- **Product ID:** `pocketjarvis_premium_monthly` (must match exactly!)
- **Name:** Pocket Jarvis Premium
- **Description:** Everything in Pro + budgeting methods, what-if analysis, unlimited AI
- **Billing period:** Monthly
- **Price:** ৳150 BDT
- **Free trial:** None
- **Grace period:** 3 days

⚠️ **Product IDs are hardcoded in the backend** — DO NOT change them.

---

## 🔐 Signing Key

The AAB is already signed by EAS. When uploading, choose **"Play App Signing"** — Google will manage the signing key for you.

If you need the raw keystore (rarely needed):
```bash
cd frontend
eas credentials --platform android
# Select: production → Download keystore from EAS servers
```

---

## ✅ Pre-submission Checklist

Before submitting for review:

- [ ] AAB uploaded to Internal Testing
- [ ] Tested on a real device — register, add transactions, try Jarvis, upgrade flow
- [ ] All store listing fields filled (name, descriptions, screenshots, icon, feature graphic)
- [ ] Privacy Policy URL added
- [ ] Data Safety form completed
- [ ] Content rating questionnaire submitted (will get rated automatically)
- [ ] Target audience set to 18+
- [ ] Subscription products created (Pro + Premium)
- [ ] Linked to test account for Google's review team
- [ ] App icon (512×512) uploaded
- [ ] Feature graphic (1024×500) uploaded
- [ ] At least 2 phone screenshots uploaded

---

## 📞 Backend & Account Access

| Service | URL | Access |
|---|---|---|
| **Backend (Railway)** | https://pocket-jarvis-backend-production.up.railway.app | Owner: contentt0077 — ask to be added |
| **Database (MongoDB)** | https://cloud.mongodb.com | Owner: contentt0077 — ask to be added |
| **EAS Builds** | https://expo.dev/accounts/jahidethans/projects/pocket-jarvis | Owner: jahidethans — already managed |
| **GitHub** | https://github.com/contentt007-creator/pocket-jarvis | ✅ Already added as admin |

---

## ⚙️ Backend Environment Variables (Railway already has these — don't commit to git!)

For local development, you'll need:

```env
MONGO_URI=...                  # Ask owner for actual value
JWT_SECRET=...                 # Ask owner for actual value
GEMINI_API_KEY=...             # Ask owner or create your own at aistudio.google.com
PORT=5000
API_BASE_URL=https://pocket-jarvis-backend-production.up.railway.app
ADMIN_EMAIL=contentt0077@gmail.com
BKASH_MERCHANT_NUMBER=...      # Set the real bKash number once received
BKASH_SANDBOX=true
GOOGLE_SERVICE_ACCOUNT_JSON=   # Set after Play Console API access is linked
```

---

## 🆘 Common Issues

**"Upload failed — keystore mismatch"**
→ Use ONLY the AAB from EAS. Don't rebuild from scratch with a different keystore.

**"Subscription product not found in app"**
→ Product IDs MUST match exactly: `pocketjarvis_pro_monthly`, `pocketjarvis_premium_monthly`

**"App rejected — finance app needs extra verification"**
→ Reply to Google with: app description, privacy policy URL, test account credentials, screenshot of payment flow

**"Privacy policy URL not accessible"**
→ Make sure GitHub Pages is enabled and the URL responds:
https://contentt007-creator.github.io/pocket-jarvis/privacy.html

**"AAB rejected — target API level too low"**
→ Run `eas build --platform android --profile production` again. EAS always uses the latest API level.

---

## 📞 Contact Owner

Anything unclear → **contentt0077@gmail.com**

---

*Built with 💜 in Bangladesh*
