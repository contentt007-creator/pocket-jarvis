# Privacy Policy for Pocket Jarvis

**Effective Date:** December 1, 2025
**Last Updated:** December 1, 2025

---

## Introduction

Pocket Jarvis ("we", "our", "us", "the App") is a personal finance management application operated by Pocket Jarvis Team. This privacy policy explains what information we collect, how we use it, and how we protect it.

We respect your privacy and are committed to protecting your personal data.

---

## 1. Information We Collect

### Account Information
When you create an account, we collect:
- **Name** — to personalize your experience
- **Email address** — for authentication and account recovery
- **Password** — stored only as a one-way encrypted hash (we never see your password)
- **Monthly income & initial balance** — entered during onboarding for budget calculations

### Financial Data You Enter
We store information you voluntarily provide:
- Transactions (income and expenses)
- Budget categories and limits
- Savings goals and progress
- Loans (money you've lent to others)
- Subscriptions and debts you track

### Subscription & Payment Information
- Selected subscription plan (Free, Pro, or Premium)
- bKash transaction IDs (TrxID) you submit for payment verification
- Google Play purchase tokens (when you subscribe via Google Play)

We do **not** store your bKash PIN, card numbers, or any banking credentials.

### Technical Information
- Device type and operating system version
- App version
- Crash reports (anonymized)

---

## 2. How We Use Your Information

We use your information only to:
- Provide and improve the core App functionality
- Calculate budgets, financial health scores, and personalized insights
- Process subscription payments and grant access to paid features
- Send your financial data to Google Gemini AI to generate personalized advice (see Section 4)
- Communicate important account updates and security notifications
- Comply with legal obligations

We will **never**:
- Sell your data to third parties
- Use your financial data for advertising
- Share individual user data with marketers

---

## 3. Data Storage & Security

Your data is stored on:
- **MongoDB Atlas** — encrypted at rest with industry-standard AES-256 encryption
- **Railway** (application servers) — encrypted in transit using TLS/HTTPS

All communication between the App and our servers uses HTTPS encryption.

Passwords are hashed using **bcrypt** with a salt — we cannot recover your original password.

---

## 4. AI Processing (Google Gemini)

When you chat with **Jarvis AI**, your message and a summary of your financial data (current balance, monthly income/expenses, budget status, goals) is sent to **Google's Gemini API** to generate personalized advice.

- Google does **not** retain this data for training their AI models (per Google's API terms)
- Your data is processed only to generate your response and is then discarded
- See Google's API privacy policy: https://ai.google.dev/terms

You can avoid AI processing entirely by not using the Jarvis chat feature.

---

## 5. Third-Party Services

Pocket Jarvis uses these third-party services:

| Service | Purpose | Data shared |
|---|---|---|
| **MongoDB Atlas** | Database hosting | All app data |
| **Railway** | Server hosting | All app data |
| **Google Gemini API** | AI chat responses | Your message + financial context |
| **bKash Payment Gateway** | Subscription payments | TrxID and amount |
| **Google Play Billing** | Subscription payments | Purchase tokens, product IDs |
| **Expo (EAS)** | App build and distribution | None (only the app code) |

Each service has its own privacy policy. We do not control their practices.

---

## 6. Your Rights

You have the right to:
- **Access** your data — view it anytime in the app
- **Update** your data — edit transactions, goals, profile
- **Delete your account** — contact us at the email below to permanently delete all your data
- **Export your data** — use the in-app Export feature on the Reports screen
- **Opt out of AI processing** — simply don't use the Jarvis chat feature

To delete your account or request a data export, email us at: **contentt0077@gmail.com**

We will respond within 30 days.

---

## 7. Data Retention

We keep your data while your account is active. If you delete your account, all personal data is **permanently deleted within 30 days** except where retention is required by law.

Anonymized analytics may be retained indefinitely for product improvement.

---

## 8. Children's Privacy

Pocket Jarvis is **not intended for children under 18**. We do not knowingly collect personal information from anyone under 18. If you believe a minor has provided us with personal data, please contact us immediately.

---

## 9. International Users

The App is operated from Bangladesh. By using Pocket Jarvis, you consent to the transfer of your data to Bangladesh and to servers in regions where MongoDB Atlas, Railway, and Google operate.

---

## 10. Changes to This Policy

We may update this policy occasionally. Material changes will be communicated via in-app notification or email. The "Last Updated" date at the top reflects the latest version.

Continued use of the App after changes constitutes acceptance of the updated policy.

---

## 11. Data Safety Disclosure (Google Play)

Per Google Play's Data Safety requirements, we disclose:

**Data we collect:**
- Email address (account)
- Name (account)
- Financial info (in-app only, never shared)

**Data we share with third parties:**
- Email and name → bKash and Google Play (only for payment processing)
- Message content + financial summary → Google Gemini (for AI responses, not stored)

**Security practices:**
- All data is encrypted in transit (HTTPS)
- All data is encrypted at rest
- You can request your data be deleted

---

## 12. Contact Us

For any questions, concerns, or requests related to this privacy policy:

**Email:** contentt0077@gmail.com
**App:** Pocket Jarvis
**Country:** Bangladesh

---

*This privacy policy is provided in good faith. By using Pocket Jarvis, you acknowledge that you have read and understood it.*
