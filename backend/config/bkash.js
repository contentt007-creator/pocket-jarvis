// bKash PGW Tokenized Checkout configuration
const SANDBOX = process.env.BKASH_SANDBOX !== 'false'; // default: sandbox mode

const BKASH = {
  baseURL: SANDBOX
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta',
  appKey:     process.env.BKASH_APP_KEY,
  appSecret:  process.env.BKASH_APP_SECRET,
  username:   process.env.BKASH_USERNAME,
  password:   process.env.BKASH_PASSWORD,
  sandbox:    SANDBOX,
};

module.exports = BKASH;
