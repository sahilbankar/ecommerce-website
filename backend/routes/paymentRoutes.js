const express = require('express');
const {
  createStripeIntent,
  verifyStripePayment,
  handleStripeWebhook,
  createRazorpayPaymentOrder,
  verifyRazorpayPayment,
  confirmCODOrder,
  markCODCollected
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Stripe Routes ──────────────────────────────────────────────────────
// POST /api/v1/payment/stripe/create-intent   – create PaymentIntent
// POST /api/v1/payment/stripe/verify          – verify payment & update order
// POST /api/v1/payment/stripe/webhook         – Stripe webhook (raw body required)
router.post('/stripe/create-intent', protect, createStripeIntent);
router.post('/stripe/verify', protect, verifyStripePayment);

// Webhook needs raw body – bypass express.json() via express.raw()
router.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// ── Razorpay Routes ────────────────────────────────────────────────────
// POST /api/v1/payment/razorpay/create-order  – create Razorpay order
// POST /api/v1/payment/razorpay/verify        – verify HMAC signature & update order
router.post('/razorpay/create-order', protect, createRazorpayPaymentOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// ── Cash on Delivery Routes ────────────────────────────────────────────
// POST /api/v1/payment/cod/confirm            – confirm COD order (customer)
// PUT  /api/v1/payment/cod/:orderId/collected – mark collected on delivery (admin)
router.post('/cod/confirm', protect, confirmCODOrder);
router.put('/cod/:orderId/collected', protect, admin, markCODCollected);

module.exports = router;
