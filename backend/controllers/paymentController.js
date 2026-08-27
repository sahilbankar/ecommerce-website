const Order = require('../models/orderModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { createStripePaymentIntent, retrieveStripePaymentIntent, constructStripeWebhookEvent } = require('../services/stripeService');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../services/razorpayService');

// ─────────────────────────────────────────────
// STRIPE
// ─────────────────────────────────────────────

// @desc    Create Stripe PaymentIntent
// @route   POST /api/v1/payment/stripe/create-intent
// @access  Private
const createStripeIntent = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'inr', orderId } = req.body;

  if (!amount || amount <= 0) {
    return next(new ApiError(400, 'A valid payment amount is required'));
  }

  const paymentIntent = await createStripePaymentIntent(amount, currency, {
    orderId: orderId || '',
    userId: req.user._id.toString()
  });

  res.status(200).json(
    new ApiResponse(200, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }, 'Stripe PaymentIntent created successfully')
  );
});

// @desc    Confirm and verify Stripe payment then update order
// @route   POST /api/v1/payment/stripe/verify
// @access  Private
const verifyStripePayment = asyncHandler(async (req, res, next) => {
  const { paymentIntentId, orderId } = req.body;

  if (!paymentIntentId || !orderId) {
    return next(new ApiError(400, 'paymentIntentId and orderId are required'));
  }

  const paymentIntent = await retrieveStripePaymentIntent(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    return next(new ApiError(400, `Payment not completed. Status: ${paymentIntent.status}`));
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  if (order.user.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Not authorized to update this order'));
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.orderStatus = 'Processing';
  order.paymentResult = {
    id: paymentIntent.id,
    status: paymentIntent.status,
    update_time: new Date(paymentIntent.created * 1000).toISOString(),
    email_address: paymentIntent.receipt_email || ''
  };
  await order.save();

  res.status(200).json(
    new ApiResponse(200, { order }, 'Stripe payment verified and order updated successfully')
  );
});

// @desc    Handle Stripe Webhook events
// @route   POST /api/v1/payment/stripe/webhook
// @access  Public (verified by Stripe signature)
const handleStripeWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return next(new ApiError(400, 'Missing Stripe webhook signature'));
  }

  let event;
  try {
    event = constructStripeWebhookEvent(req.rawBody || req.body, signature);
  } catch (err) {
    return next(err);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      console.log(`[Stripe Webhook] PaymentIntent succeeded: ${intent.id}`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object;
      console.error(`[Stripe Webhook] Payment failed: ${failedIntent.id} | ${failedIntent.last_payment_error?.message}`);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────
// RAZORPAY
// ─────────────────────────────────────────────

// @desc    Create Razorpay order
// @route   POST /api/v1/payment/razorpay/create-order
// @access  Private
const createRazorpayPaymentOrder = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'INR', orderId } = req.body;

  if (!amount || amount <= 0) {
    return next(new ApiError(400, 'A valid payment amount is required'));
  }

  const receipt = orderId ? `receipt_${orderId}` : `receipt_${Date.now()}`;

  const razorpayOrder = await createRazorpayOrder(amount, currency, receipt, {
    userId: req.user._id.toString()
  });

  res.status(200).json(
    new ApiResponse(200, {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || ''
    }, 'Razorpay order created successfully')
  );
});

// @desc    Verify Razorpay payment signature and update order
// @route   POST /api/v1/payment/razorpay/verify
// @access  Private
const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new ApiError(400, 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'));
  }

  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return next(new ApiError(400, 'Invalid Razorpay payment signature. Payment verification failed.'));
  }

  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized to update this order'));
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'Processing';
    order.paymentResult = {
      id: razorpay_payment_id,
      status: 'captured',
      update_time: new Date().toISOString(),
      email_address: req.user.email
    };
    await order.save();

    return res.status(200).json(
      new ApiResponse(200, { order }, 'Razorpay payment verified and order updated successfully')
    );
  }

  res.status(200).json(
    new ApiResponse(200, {
      paymentId: razorpay_payment_id,
      verified: true
    }, 'Razorpay payment signature verified successfully')
  );
});

// ─────────────────────────────────────────────
// CASH ON DELIVERY
// ─────────────────────────────────────────────

// @desc    Confirm Cash on Delivery order
// @route   POST /api/v1/payment/cod/confirm
// @access  Private
const confirmCODOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  if (!orderId) {
    return next(new ApiError(400, 'orderId is required'));
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  if (order.user.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Not authorized to update this order'));
  }

  if (order.paymentMethod !== 'COD') {
    return next(new ApiError(400, 'This order is not a Cash on Delivery order'));
  }

  order.orderStatus = 'Processing';
  order.paymentResult = {
    id: `COD-${Date.now()}`,
    status: 'cash_on_delivery',
    update_time: new Date().toISOString(),
    email_address: req.user.email
  };
  await order.save();

  res.status(200).json(
    new ApiResponse(200, { order }, 'Cash on Delivery order confirmed successfully')
  );
});

// @desc    Mark COD order as paid on delivery (Admin)
// @route   PUT /api/v1/payment/cod/:orderId/collected
// @access  Private/Admin
const markCODCollected = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  if (order.paymentMethod !== 'COD') {
    return next(new ApiError(400, 'This order is not a COD order'));
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  await order.save();

  res.status(200).json(
    new ApiResponse(200, { order }, 'COD payment collected and order marked as paid')
  );
});

module.exports = {
  createStripeIntent,
  verifyStripePayment,
  handleStripeWebhook,
  createRazorpayPaymentOrder,
  verifyRazorpayPayment,
  confirmCODOrder,
  markCODCollected
};
