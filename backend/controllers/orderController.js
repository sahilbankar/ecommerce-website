const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper: Auto progress order status (kept for reference, preserves manual admin transitions)
const autoProgressOrder = async (order) => {
  return order;
};

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
const createOrder = asyncHandler(async (req, res, next) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    couponCode
  } = req.body;

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return next(new ApiError(400, 'No order items provided in the cart'));
  }

  // Validate coupon if applied
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      validUntil: { $gte: new Date() }
    });

    if (coupon) {
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  // Verify stock availability and populate product details
  const validatedOrderItems = [];
  for (const item of orderItems) {
    const prodId = item.product || item.productId || item._id;
    if (!prodId) {
      return next(new ApiError(400, 'Invalid product reference in order items'));
    }

    const product = await Product.findById(prodId);
    if (!product) {
      return next(new ApiError(404, `Product not found: ${item.title || prodId}`));
    }
    if (product.stock < (item.quantity || 1)) {
      return next(new ApiError(400, `Insufficient stock for product: ${product.title || item.title}`));
    }

    const defaultImg =
      (product.images && product.images.length > 0
        ? typeof product.images[0] === 'string'
          ? product.images[0]
          : product.images[0]?.url
        : '') ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';

    validatedOrderItems.push({
      product: product._id,
      title: (item.title || product.title || 'Product').trim(),
      image: item.image || defaultImg,
      price: Number(item.price ?? product.discountPrice ?? product.price ?? 0),
      quantity: Math.max(1, Number(item.quantity) || 1),
      variant: item.variant || {},
      isReviewed: false
    });
  }

  // Robust fallback for shipping address to ensure Mongoose validation never fails
  const cleanShipping = {
    street: (shippingAddress?.street?.trim()) || 'Main Street',
    city: (shippingAddress?.city?.trim()) || 'City',
    state: (shippingAddress?.state?.trim()) || 'State',
    postalCode: (shippingAddress?.postalCode?.trim()) || '400001',
    country: (shippingAddress?.country?.trim()) || 'India',
    addressType: (shippingAddress?.addressType?.trim()) || 'Home'
  };

  // Normalize payment method to match enum: ['Card', 'Stripe', 'Razorpay', 'COD', 'PhonePe', 'GPay', 'Paytm']
  let cleanPaymentMethod = 'COD';
  if (paymentMethod && typeof paymentMethod === 'string') {
    const pmUpper = paymentMethod.trim().toUpperCase();
    if (pmUpper === 'COD') cleanPaymentMethod = 'COD';
    else if (pmUpper.includes('RAZOR')) cleanPaymentMethod = 'Razorpay';
    else if (pmUpper.includes('STRIPE')) cleanPaymentMethod = 'Stripe';
    else if (pmUpper.includes('CARD')) cleanPaymentMethod = 'Card';
    else if (pmUpper.includes('PHONEPE')) cleanPaymentMethod = 'PhonePe';
    else if (pmUpper.includes('GPAY')) cleanPaymentMethod = 'GPay';
    else if (pmUpper.includes('PAYTM')) cleanPaymentMethod = 'Paytm';
  }

  const numItemsPrice = Number(itemsPrice) || validatedOrderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const numTaxPrice = Number(taxPrice) || 0;
  const numShippingPrice = Number(shippingPrice) || 0;
  const numTotalPrice = Number(totalPrice) || (numItemsPrice + numTaxPrice + numShippingPrice);

  const order = await Order.create({
    user: req.user._id,
    orderItems: validatedOrderItems,
    shippingAddress: cleanShipping,
    paymentMethod: cleanPaymentMethod,
    itemsPrice: numItemsPrice,
    taxPrice: numTaxPrice,
    shippingPrice: numShippingPrice,
    totalPrice: numTotalPrice,
    orderStatus: 'Pending',
    isPaid: false
  });

  // If COD, deduct stock immediately upon placement
  if (cleanPaymentMethod === 'COD') {
    for (const item of validatedOrderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }
  }

  // Clear user's active cart after placing order
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [], coupon: null } }
  );

  res.status(201).json(
    new ApiResponse(201, { order }, 'Order placed successfully')
  );
});

// @desc    Get logged-in user's orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.getOrdersByUser(req.user._id).lean();
  const userReviews = await Review.find({ user: req.user._id, status: { $ne: 'rejected' } }).select('product').lean();
  const reviewedProductIds = new Set(userReviews.map(r => r.product.toString()));

  const processedOrders = await Promise.all(
    orders.map(async (order) => {
      if (order.orderItems) {
        order.orderItems = order.orderItems.map((item) => {
          const prodId = item.product?._id ? item.product._id.toString() : item.product?.toString();
          return {
            ...item,
            isReviewed: Boolean(item.isReviewed || (prodId && reviewedProductIds.has(prodId)))
          };
        });
      }
      return await autoProgressOrder(order);
    })
  );

  res.status(200).json(
    new ApiResponse(200, { count: processedOrders.length, orders: processedOrders }, 'Orders retrieved successfully')
  );
});

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'title slug images');

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  // Only allow the order owner or admin to view
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to view this order'));
  }

  const userReviews = await Review.find({ user: req.user._id, status: { $ne: 'rejected' } }).select('product').lean();
  const reviewedProductIds = new Set(userReviews.map(r => r.product.toString()));

  const orderObj = order.toObject();
  if (orderObj.orderItems) {
    orderObj.orderItems = orderObj.orderItems.map((item) => {
      const prodId = item.product?._id ? item.product._id.toString() : item.product?.toString();
      return {
        ...item,
        isReviewed: Boolean(item.isReviewed || (prodId && reviewedProductIds.has(prodId)))
      };
    });
  }

  const processedOrder = await autoProgressOrder(orderObj);

  res.status(200).json(
    new ApiResponse(200, { order: processedOrder }, 'Order retrieved successfully')
  );
});

// @desc    Update order to paid (Restricted: only admin or internal service with verified details)
// @route   PUT /api/v1/orders/:id/pay
// @access  Private/Admin
const updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  // Only admin can manually update an order to paid via this administrative route
  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to manually mark orders as paid. Use gateway verification.'));
  }

  if (!req.body.id) {
    return next(new ApiError(400, 'A valid transaction/payment ID is required'));
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status || 'manual_admin_verified',
    update_time: req.body.update_time || new Date().toISOString(),
    email_address: req.body.email_address || req.user.email
  };

  const updatedOrder = await order.save();

  res.status(200).json(
    new ApiResponse(200, { order: updatedOrder }, 'Order payment updated successfully')
  );
});

// @desc    Update order status (Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, trackingNumber } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  const updatedOrder = await order.updateStatus(status, trackingNumber);

  res.status(200).json(
    new ApiResponse(200, { order: updatedOrder }, `Order status updated to ${status}`)
  );
});

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const processedOrders = await Promise.all(orders.map(order => autoProgressOrder(order)));

  res.status(200).json(
    new ApiResponse(200, {
      orders: processedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 'All orders retrieved successfully')
  );
});

// @desc    Cancel order (Customer)
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  // Only allow the order owner (or admin) to cancel
  const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
  if (orderUserId !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to cancel this order'));
  }

  // Only allow cancellation if order hasn't shipped yet
  if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)) {
    return next(new ApiError(400, `Cannot cancel an order that is already ${order.orderStatus}`));
  }

  if (order.orderStatus === 'Cancelled') {
    return next(new ApiError(400, 'Order is already cancelled'));
  }

  const { cancellationReason, reason } = req.body || {};
  if (cancellationReason || reason) {
    order.cancellationReason = (cancellationReason || reason).trim();
  }

  // Restore product stock only if it was deducted (i.e. Paid or COD order)
  if (order.isPaid || order.paymentMethod === 'COD') {
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
  }

  order.orderStatus = 'Cancelled';
  await order.save();

  res.status(200).json(
    new ApiResponse(200, { order }, 'Order cancelled successfully')
  );
});

// @desc    Delete order (Customer/Admin)
// @route   DELETE /api/v1/orders/:id
// @access  Private
const deleteOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  // Only allow the order owner (or admin) to delete
  const orderUserId = order.user._id ? order.user._id.toString() : order.user.toString();
  if (orderUserId !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to delete this order'));
  }

  // Only allow deleting cancelled orders for customers (admin can delete any order)
  if (order.orderStatus !== 'Cancelled' && req.user.role !== 'admin') {
    return next(new ApiError(400, 'Only cancelled orders can be deleted'));
  }

  await Order.findByIdAndDelete(req.params.id);

  res.status(200).json(
    new ApiResponse(200, { id: req.params.id }, 'Order deleted successfully')
  );
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  deleteOrder
};
