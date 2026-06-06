// Run once: node routes/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Quote = require('../models/Quote');
const EXPERTS = require('../data/experts');

async function seed() {
  await connectDB();
  await Quote.deleteMany({});

  const docs = [];
  for (const expert of EXPERTS) {
    for (const q of expert.quotes) {
      docs.push({
        expert: expert.name,
        title: expert.title,
        quote: q.quote,
        method: expert.methodSummary,
        category: q.category,
        avatarColor: expert.avatarColor,
        situation: q.situation,
      });
    }
  }

  await Quote.insertMany(docs);
  console.log(`Seeded ${docs.length} quotes from ${EXPERTS.length} experts`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
