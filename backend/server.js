require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/debts', require('./routes/debts'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/masters', require('./routes/masters'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/billing', require('./routes/billing'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Run seed: node backend/routes/seed.js

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Pocket Jarvis API running on port ${PORT}`));
