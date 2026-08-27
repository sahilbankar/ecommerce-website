const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const ApiError = require('../utils/ApiError');

/**
 * Create a Stripe PaymentIntent
 * @param {number} amount - Amount in smallest currency unit (paisa/cents)
 * @param {string} currency - Currency code e.g. 'inr', 'usd'
 * @param {Object} metadata - Optional metadata object
 * @returns {Promise<Object>} Stripe PaymentIntent object
 */
const createStripePaymentIntent = async (amount, currency = 'inr', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest unit
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true }
    });
    return paymentIntent;
  } catch (error) {
    throw new ApiError(500, `Stripe error: ${error.message}`);
  }
};

/**
 * Retrieve a Stripe PaymentIntent by ID
 * @param {string} paymentIntentId
 * @returns {Promise<Object>}
 */
const retrieveStripePaymentIntent = async (paymentIntentId) => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    throw new ApiError(500, `Stripe retrieval error: ${error.message}`);
  }
};

/**
 * Construct and verify a Stripe Webhook event
 * @param {Buffer} rawBody - Raw request body buffer
 * @param {string} signature - Stripe-Signature header value
 * @returns {Object} Verified Stripe event
 */
const constructStripeWebhookEvent = (rawBody, signature) => {
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (error) {
    throw new ApiError(400, `Stripe webhook signature verification failed: ${error.message}`);
  }
};

module.exports = {
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  constructStripeWebhookEvent,
  stripe
};
