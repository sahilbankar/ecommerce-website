const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { createStripePaymentIntent, retrieveStripePaymentIntent, constructStripeWebhookEvent } = require('../services/stripeService');
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  verifyRazorpayWebhookSignature
} = require('../services/razorpayService');

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

  let payableAmount = amount;
  let order = null;

  // If orderId is provided, validate against trusted order in database
  if (orderId) {
    order = await Order.findById(orderId);
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized for this order'));
    }
    if (order.isPaid) {
      return next(new ApiError(400, 'This order has already been paid for.'));
    }
    payableAmount = order.totalPrice;
  }

  if (!payableAmount || payableAmount <= 0) {
    return next(new ApiError(400, 'A valid payment amount is required'));
  }

  const receipt = orderId ? `receipt_${orderId}` : `receipt_${Date.now()}`;

  const razorpayOrder = await createRazorpayOrder(payableAmount, currency, receipt, {
    orderId: orderId || '',
    userId: req.user._id.toString()
  });

  // Track the Razorpay order ID on our database order
  if (order) {
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();
  }

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

  // 1. Verify HMAC cryptographic signature
  const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return next(new ApiError(400, 'Invalid Razorpay payment signature. Payment verification failed.'));
  }

  // 2. Fetch payment details from Razorpay API to confirm capture status
  let paymentDetails = null;
  try {
    paymentDetails = await fetchRazorpayPayment(razorpay_payment_id);
  } catch (err) {
    console.warn(`[Razorpay Verify] Could not fetch payment ${razorpay_payment_id} from API:`, err.message);
  }

  // Verify payment status from Razorpay API if retrieved
  if (paymentDetails) {
    if (paymentDetails.order_id && paymentDetails.order_id !== razorpay_order_id) {
      return next(new ApiError(400, 'Payment order ID mismatch with Razorpay records.'));
    }
    if (!['captured', 'authorized'].includes(paymentDetails.status)) {
      return next(new ApiError(400, `Payment not completed. Current status: ${paymentDetails.status}`));
    }
  }

  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized to update this order'));
    }

    // Idempotency: If already paid, safely return success immediately (prevents duplicate processing)
    if (order.isPaid) {
      return res.status(200).json(
        new ApiResponse(200, { order }, 'Payment already verified and order confirmed')
      );
    }

    // Verify tracked razorpayOrderId matches if set
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return next(new ApiError(400, 'Razorpay order ID does not match this order.'));
    }

    // Verify amount in paisa matches order total
    if (paymentDetails) {
      const expectedAmountInPaisa = Math.round(order.totalPrice * 100);
      if (paymentDetails.amount !== expectedAmountInPaisa) {
        return next(new ApiError(400, 'Payment amount mismatch between Razorpay and order.'));
      }
    }

    // Atomic transition: Update isPaid to true only if it is currently false
    const paymentResultData = {
      id: razorpay_payment_id,
      status: paymentDetails?.status || 'captured',
      update_time: new Date().toISOString(),
      email_address: paymentDetails?.email || req.user.email,
      method: paymentDetails?.method || '',
      bank: paymentDetails?.bank || '',
      wallet: paymentDetails?.wallet || '',
      vpa: paymentDetails?.vpa || '',
      razorpay_order_id
    };

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, isPaid: false },
      {
        $set: {
          isPaid: true,
          paidAt: Date.now(),
          orderStatus: 'Confirmed',
          paymentMethod: 'Razorpay',
          razorpayOrderId: razorpay_order_id,
          paymentResult: paymentResultData
        }
      },
      { new: true }
    );

    // If updatedOrder is null, another concurrent request or webhook already completed the transition
    if (updatedOrder) {
      // Safely deduct stock for order items once
      for (const item of updatedOrder.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }

      // Clear user's backend cart now that payment is confirmed
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

      return res.status(200).json(
        new ApiResponse(200, { order: updatedOrder }, 'Razorpay payment verified and order updated successfully')
      );
    } else {
      // Already marked as paid by concurrent verification or webhook; return current state safely
      const freshOrder = await Order.findById(order._id);
      return res.status(200).json(
        new ApiResponse(200, { order: freshOrder }, 'Payment already verified and order confirmed')
      );
    }
  }

  res.status(200).json(
    new ApiResponse(200, {
      paymentId: razorpay_payment_id,
      verified: true
    }, 'Razorpay payment signature verified successfully')
  );
});

// @desc    Handle Razorpay Webhook events
// @route   POST /api/v1/payment/razorpay/webhook
// @access  Public (verified by Razorpay signature)
const handleRazorpayWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!signature) {
    return next(new ApiError(400, 'Missing Razorpay webhook signature'));
  }

  const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);

  if (!isValid) {
    return next(new ApiError(400, 'Invalid Razorpay webhook signature'));
  }

  const event = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
    ? req.body
    : JSON.parse(rawBody.toString());

  const eventType = event.event;

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const orderId = paymentEntity?.notes?.orderId || orderEntity?.notes?.orderId;
    const receipt = orderEntity?.receipt || paymentEntity?.receipt;

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (receipt && receipt.startsWith('receipt_')) {
      const extractedId = receipt.replace('receipt_', '');
      order = await Order.findById(extractedId);
    }

    if (order) {
      const paymentResultData = {
        id: paymentEntity?.id || event.payload?.payment?.entity?.id,
        status: 'captured',
        update_time: new Date().toISOString(),
        email_address: paymentEntity?.email || '',
        method: paymentEntity?.method || '',
        bank: paymentEntity?.bank || '',
        wallet: paymentEntity?.wallet || '',
        vpa: paymentEntity?.vpa || '',
        razorpay_order_id: paymentEntity?.order_id || orderEntity?.id || ''
      };

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id, isPaid: false },
        {
          $set: {
            isPaid: true,
            paidAt: Date.now(),
            orderStatus: 'Confirmed',
            paymentMethod: 'Razorpay',
            razorpayOrderId: paymentEntity?.order_id || orderEntity?.id || order.razorpayOrderId,
            paymentResult: paymentResultData
          }
        },
        { new: true }
      );

      if (updatedOrder) {
        console.log(`[Razorpay Webhook] Order #${updatedOrder._id} marked paid via webhook.`);

        // Deduct stock exactly once
        for (const item of updatedOrder.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity }
          });
        }
        // Clear cart
        if (updatedOrder.user) {
          await Cart.findOneAndUpdate({ user: updatedOrder.user }, { items: [], totalAmount: 0 });
        }
      }
    }
  } else if (eventType === 'payment.failed') {
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.notes?.orderId;
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && !order.isPaid) {
        order.paymentResult = {
          id: paymentEntity?.id,
          status: 'failed',
          update_time: new Date().toISOString(),
          email_address: paymentEntity?.email || '',
          method: paymentEntity?.method || '',
          bank: paymentEntity?.bank || '',
          wallet: paymentEntity?.wallet || '',
          vpa: paymentEntity?.vpa || '',
          razorpay_order_id: paymentEntity?.order_id || ''
        };
        await order.save();
        console.log(`[Razorpay Webhook] Payment failed logged for Order #${order._id}.`);
      }
    }
  }

  res.status(200).json({ status: 'ok' });
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
  handleRazorpayWebhook,
  confirmCODOrder,
  markCODCollected
};
