const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

// Lazily initialize Razorpay instance with strict credential validation
let razorpayInstance = null;

const getRazorpayCredentials = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_id === 'rzp_test_placeholder' || key_secret === 'placeholder_secret') {
    throw new ApiError(500, 'Payment gateway configuration error. Razorpay API keys are not configured on the server.');
  }

  return { key_id, key_secret };
};

const getRazorpay = () => {
  if (!razorpayInstance) {
    const { key_id, key_secret } = getRazorpayCredentials();
    razorpayInstance = new Razorpay({ key_id, key_secret });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay Order
 * @param {number} amount    - Amount in smallest currency unit (paisa)
 * @param {string} currency  - Currency code e.g. 'INR'
 * @param {string} receipt   - Unique receipt identifier (e.g. order ID)
 * @param {Object} notes     - Optional notes object
 * @returns {Promise<Object>} Razorpay order object
 */
const createRazorpayOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  try {
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100), // Convert to paisa
      currency: currency.toUpperCase(),
      receipt,
      notes
    });
    return order;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Log server-side for internal diagnostic while scrubbing any potential key or header leaks
    console.error('[Razorpay Order Creation Error]:', error?.error?.description || error.message);
    const userMessage = error?.error?.description || 'Failed to initiate payment session with gateway. Please try again.';
    throw new ApiError(error?.statusCode || 502, userMessage);
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} razorpay_order_id
 * @param {string} razorpay_payment_id
 * @param {string} razorpay_signature
 * @returns {boolean} true if signature is valid
 */
const verifyRazorpaySignature = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const { key_secret } = getRazorpayCredentials();
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpay_signature;
};

/**
 * Fetch Razorpay payment details by ID
 * @param {string} paymentId
 * @returns {Promise<Object>} Razorpay payment object
 */
const fetchRazorpayPayment = async (paymentId) => {
  try {
    const payment = await getRazorpay().payments.fetch(paymentId);
    return payment;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.warn('[Razorpay Fetch Payment Warning]:', error?.error?.description || error.message);
    throw new ApiError(error?.statusCode || 502, 'Unable to retrieve payment verification details from gateway.');
  }
};

/**
 * Verify Razorpay webhook signature
 * @param {string|Buffer} body
 * @param {string} signature
 * @param {string} webhookSecret
 * @returns {boolean}
 */
const verifyRazorpayWebhookSignature = (body, signature, webhookSecret) => {
  if (!signature || !webhookSecret || webhookSecret === 'placeholder_secret') return false;
  try {
    const bodyStr = Buffer.isBuffer(body) ? body.toString('utf8') : (typeof body === 'string' ? body : JSON.stringify(body));
    return Razorpay.validateWebhookSignature(bodyStr, signature, webhookSecret);
  } catch {
    return false;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  verifyRazorpayWebhookSignature
};
