# Pocket Jarvis 💜
### "Your money. Your move."

A full-stack mobile personal finance app powered by AI. Built with React Native (Expo), Node.js/Express, MongoDB Atlas, and Google Gemini.

---

## Stack

| Layer      | Tech                            |
|------------|---------------------------------|
| Mobile     | React Native + Expo Router      |
| Backend    | Node.js + Express.js            |
| Database   | MongoDB Atlas (free tier)       |
| AI         | Google Gemini 1.5 Flash         |
| Auth       | JWT (JSON Web Tokens)           |
| Storage    | AsyncStorage (local cache)      |

---

## Features

- **Dashboard** — balance, health grade ring, AI insight, recent transactions
- **Transactions** — full CRUD, search, filter, tag (Need/Want/Regret), grouped by date
- **Budget** — per-category limits with progress bars, Jarvis warning when near limit
- **Goals** — savings goals with milestones, deposit tracking, "What if?" AI projections
- **Jarvis AI Chat** — conversational finance advisor with full context from your data
- **Reports** — monthly grade (A–F), donut chart, weekly bar chart, win/leak analysis
- **Subscriptions & Debts** — track recurring payments and who owes who

---

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (or an emulator)

---

### 1. Get a MongoDB Atlas connection string (free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a **free M0 cluster** (512MB, no credit card needed)
3. Under **Database Access**, create a user with read/write permissions
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) or your IP
5. Click **Connect → Connect your application** and copy the connection string
6. Replace `<username>` and `<password>` in the string

---

### 2. Get a Gemini API key (free)

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with a Google account
3. Click **Get API key → Create API key**
4. Copy the key

---

### 3. Backend setup

```bash
cd pocket-jarvis/backend
npm install

# Edit .env with your real values:
# MONGO_URI=mongodb+srv://...
# JWT_SECRET=any_long_random_string
# GEMINI_API_KEY=your_key_here
# PORT=5000

npm run dev
```

Backend runs at `http://localhost:5000`. Test it: `http://localhost:5000/health`

---

### 4. Frontend setup

```bash
cd pocket-jarvis/frontend
npm install

# Edit .env:
# EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:5000/api
# (Use your machine's local IP, e.g. 192.168.1.5, not localhost — phone needs to reach your machine)

npx expo start
```

Scan the QR code with **Expo Go** on your phone.

To find your local IP:
- **Windows**: `ipconfig` → look for IPv4 Address
- **Mac/Linux**: `ifconfig` → look for inet

---

## Running locally (quick start)

```bash
# Terminal 1 — backend
cd pocket-jarvis/backend && npm install && npm run dev

# Seed the Money Masters quotes database (run once after backend starts)
cd pocket-jarvis/backend && npm run seed

# Terminal 2 — frontend
cd pocket-jarvis/frontend && npm install && npx expo start
```

---

## Project structure

```
pocket-jarvis/
├── backend/
│   ├── server.js           # Express app entry
│   ├── config/db.js        # MongoDB connection
│   ├── middleware/auth.js  # JWT middleware
│   ├── models/             # Mongoose schemas
│   └── routes/             # API route handlers
└── frontend/
    ├── app/
    │   ├── (tabs)/         # Tab screens (Home, Budget, Goals, Jarvis, Reports)
    │   ├── screens/        # Stack screens (Onboarding, Login, Transactions, etc.)
    │   └── _layout.jsx     # Root navigation + auth gate
    ├── components/         # Reusable UI components
    ├── context/            # Auth + Finance state
    ├── services/api.js     # Axios instance with JWT interceptor
    └── utils/              # Currency formatting, health score, etc.
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/transactions` | List transactions (filterable) |
| POST | `/api/transactions` | Add transaction |
| GET | `/api/transactions/summary` | Monthly income/expense/breakdown |
| GET | `/api/budgets/:month` | Get/create budget for month |
| PUT | `/api/budgets/:month` | Update category limits |
| GET/POST/PUT/DELETE | `/api/goals` | CRUD goals |
| POST | `/api/goals/:id/deposit` | Add money to goal |
| GET/POST/PUT/DELETE | `/api/subscriptions` | CRUD subscriptions |
| GET/POST/PUT/DELETE | `/api/debts` | CRUD debts |
| POST | `/api/ai/chat` | Jarvis chat with financial context |
| GET | `/api/ai/insight` | Daily one-line AI insight |
| POST | `/api/ai/whatif` | Goal projection |
| GET | `/api/masters/experts` | All 12 expert cards |
| GET | `/api/masters/experts/:slug` | Expert profile + user snapshot |
| GET | `/api/masters/quote/random` | Random quote from any expert |
| GET | `/api/masters/quote/contextual?situation=X` | Situation-matched quote |
| GET | `/api/masters/method/active` | User's active budgeting method |
| PUT | `/api/masters/method/active` | Set active method |
| GET | `/api/masters/rolling-income` | 3-month average income |

---

## Money Masters

12 legendary financial minds are built into Pocket Jarvis. Their wisdom surfaces throughout the app — as daily quotes, milestone celebrations, grade feedback, and adaptive AI behavior.

### The Experts & Their Methods

| Expert | Method | Key Behavior Change |
|--------|--------|---------------------|
| **Warren Buffett** | Pay yourself first | Jarvis asks "have you paid yourself first?" on every income |
| **Benjamin Graham** | Margin of safety | Budget bars show 80% safety marker; warns at 80% not 100% |
| **Robert Kiyosaki** | Assets vs liabilities | Every purchase analyzed as asset or liability |
| **Dave Ramsey** | Zero-based budgeting | "Remaining to assign" counter; every taka must be named |
| **Suze Orman** | Emergency fund first | Emergency fund goal auto-suggested; always top priority |
| **John Bogle** | Simplicity + consistency | Jarvis emphasizes regular small deposits over sporadic large ones |
| **George Soros** | Asymmetric risk | Jarvis calculates downside before upside on major decisions |
| **John Maynard Keynes** | Emotional vs rational | Jarvis identifies spending drivers |
| **Milton Friedman** | Permanent income | Budget based on 3-month rolling average, not current month |
| **Napoleon Hill** | Goal with deadline | Every goal requires deadline; daily savings counter |
| **T. Harv Eker** | JARS system (55/10/10/10/10/5) | Budget screen reorganizes into 6 colored jars |
| **Ramit Sethi** | Conscious spending | Your 2–3 priority categories never flagged as overspending |

### How to switch methods

1. Tap the **school icon** in the Home screen header, or navigate to **Money Masters** from the menu
2. Browse the 12 expert cards
3. Tap **"Apply method"** on any expert — Jarvis immediately adapts
4. The active method badge appears on the Home screen header
5. Tap the badge again to view or change the method

### Quote tip system

Quotes surface automatically at the right moments:
- **Home screen** — Daily Wisdom card rotates every day
- **Budget screen** — Quote appears when any category hits 90%+
- **Goals screen** — Milestone quotes on 25/50/75/100% with expert attribution
- **Transactions** — Regret-tagged expenses trigger a contextual quote
- **Reports screen** — Grade-matched quote appears after monthly grade reveal
- **Jarvis AI chat** — An expert quote appended every 3rd AI response
- **Onboarding** — Random motivational quote shown before first app entry

### Seeding the quotes database

```bash
cd pocket-jarvis/backend
npm run seed
# Output: Seeded 35 quotes from 12 experts
```

---

## Design system

| Token | Value |
|-------|-------|
| Primary | `#534AB7` (deep purple) |
| Accent | `#1D9E75` (teal) |
| Danger | `#E24B4A` (red) |
| Warning | `#EF9F27` (amber) |
| Currency | BDT (৳) |
| Style | Flat, white cards, generous whitespace |
