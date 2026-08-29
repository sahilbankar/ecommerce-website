const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Product = require('../models/productModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper: Auto progress order status based on time elapsed since creation
const autoProgressOrder = async (order) => {
  if (!order || order.orderStatus === 'Cancelled' || order.orderStatus === 'Delivered') {
    return order;
  }

  const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
  const elapsedMins = elapsedMs / (1000 * 60);

  let targetStatus = 'Pending';
  if (elapsedMins >= 25) {
    targetStatus = 'Delivered';
  } else if (elapsedMins >= 20) {
    targetStatus = 'Out for Delivery';
  } else if (elapsedMins >= 15) {
    targetStatus = 'Shipped';
  } else if (elapsedMins >= 10) {
    targetStatus = 'Processing';
  } else if (elapsedMins >= 5) {
    targetStatus = 'Confirmed';
  }

  // Define progression precedence
  const statusPrecedence = {
    'Pending': 0,
    'Confirmed': 1,
    'Processing': 2,
    'Shipped': 3,
    'Out for Delivery': 4,
    'Delivered': 5
  };

  const currentVal = statusPrecedence[order.orderStatus] || 0;
  const targetVal = statusPrecedence[targetStatus] || 0;

  // Only progress forward
  if (targetVal > currentVal) {
    order.orderStatus = targetStatus;
    if (targetStatus === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      
      if (order.paymentMethod === 'COD' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }
    await order.save();
  }

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

  if (!orderItems || orderItems.length === 0) {
    return next(new ApiError(400, 'No order items provided'));
  }

  // Validate stock and build order items
  const validatedItems = [];
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return next(new ApiError(404, `Product not found: ${item.product}`));
    }
    if (!product.isInStock(item.quantity)) {
      return next(new ApiError(400, `Insufficient stock for product: ${product.title}`));
    }
    validatedItems.push({
      product: product._id,
      title: product.title,
      image: product.images[0]?.url || '',
      price: item.price,
      quantity: item.quantity,
      variant: item.variant || {}
    });
  }

  // Apply coupon discount if provided
  let finalTotal = totalPrice;
  if (couponCode) {
    const coupon = await Coupon.findByCode(couponCode);
    if (!coupon) {
      return next(new ApiError(400, 'Invalid coupon code'));
    }
    const validity = coupon.isValid(itemsPrice);
    if (!validity.valid) {
      return next(new ApiError(400, validity.message));
    }
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (itemsPrice * coupon.discountAmount) / 100;
    } else {
      discount = coupon.discountAmount;
    }
    finalTotal = Math.max(0, totalPrice - discount);
    coupon.usageCount += 1;
    await coupon.save();
  }

  const isPaid = paymentMethod !== 'COD';
  const paidAt = isPaid ? Date.now() : undefined;

  const order = await Order.create({
    user: req.user._id,
    orderItems: validatedItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice: finalTotal,
    isPaid,
    paidAt
  });

  // Decrement stock for each product
  for (const item of validatedItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }

  // Clear user's cart after successful order
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

  res.status(201).json(
    new ApiResponse(201, { order }, 'Order placed successfully')
  );
});

// @desc    Get logged-in user's orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.getOrdersByUser(req.user._id);
  const processedOrders = await Promise.all(orders.map(order => autoProgressOrder(order)));

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

  const processedOrder = await autoProgressOrder(order);

  res.status(200).json(
    new ApiResponse(200, { order: processedOrder }, 'Order retrieved successfully')
  );
});

// @desc    Update order to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ApiError(404, 'Order not found'));
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.email_address
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

  // Restore product stock
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
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
