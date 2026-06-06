const axios = require('axios');
const BKASH = require('../config/bkash');

// Cache token in memory (expires in 3600s, refresh early)
let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const { data } = await axios.post(
    `${BKASH.baseURL}/tokenized/checkout/token/grant`,
    { app_key: BKASH.appKey, app_secret: BKASH.appSecret },
    {
      headers: {
        username: BKASH.username,
        password: BKASH.password,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!data.id_token) throw new Error('bKash token grant failed: ' + JSON.stringify(data));
  _token = data.id_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 60s early
  return _token;
}

async function createPayment({ amount, merchantInvoiceNumber, payerReference, callbackURL }) {
  const token = await getToken();
  const { data } = await axios.post(
    `${BKASH.baseURL}/tokenized/checkout/create`,
    {
      mode: '0011',             // fixed-amount one-time payment
      payerReference,
      callbackURL,
      amount: String(amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber,
    },
    {
      headers: {
        Authorization: token,
        'X-APP-Key': BKASH.appKey,
        'Content-Type': 'application/json',
      },
    }
  );
  return data; // contains bkashURL and paymentID
}

async function executePayment(paymentID) {
  const token = await getToken();
  const { data } = await axios.post(
    `${BKASH.baseURL}/tokenized/checkout/execute`,
    { paymentID },
    {
      headers: {
        Authorization: token,
        'X-APP-Key': BKASH.appKey,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}

async function queryPayment(paymentID) {
  const token = await getToken();
  const { data } = await axios.post(
    `${BKASH.baseURL}/tokenized/checkout/payment/status`,
    { paymentID },
    {
      headers: {
        Authorization: token,
        'X-APP-Key': BKASH.appKey,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}

async function refundPayment({ paymentID, amount, trxID, sku, reason }) {
  const token = await getToken();
  const { data } = await axios.post(
    `${BKASH.baseURL}/tokenized/checkout/payment/refund`,
    { paymentID, amount: String(amount), trxID, sku, reason },
    {
      headers: {
        Authorization: token,
        'X-APP-Key': BKASH.appKey,
        'Content-Type': 'application/json',
      },
    }
  );
  return data;
}

module.exports = { getToken, createPayment, executePayment, queryPayment, refundPayment };
