const Razorpay = require('razorpay');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

// Lazily initialize Razorpay instance so missing keys don't crash at import
let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
    });
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
    throw new ApiError(500, `Razorpay order creation failed: ${error.message}`);
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
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
    .update(body)
    .digest('hex');

  return expectedSignature === razorpay_signature;
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature
};
