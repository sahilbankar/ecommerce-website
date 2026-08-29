const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get admin dashboard statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalReviews,
    totalCoupons
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'Pending' }),
    Order.countDocuments({ orderStatus: 'Delivered' }),
    Order.countDocuments({ orderStatus: 'Cancelled' }),
    Review.countDocuments(),
    mongoose.model('Coupon').countDocuments()
  ]);

  // Revenue: sum of all paid orders
  const revenueResult = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  // Revenue by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
  ]);

  // Top 5 selling products
  const topProducts = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        title: { $first: '$orderItems.title' },
        totalSold: { $sum: '$orderItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      summary: {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalReviews,
        totalCoupons,
        totalRevenue
      },
      monthlyRevenue,
      ordersByStatus,
      topProducts
    }, 'Dashboard statistics retrieved successfully')
  );
});

// @desc    Get recent orders for dashboard (Admin)
// @route   GET /api/v1/admin/recent-orders
// @access  Private/Admin
const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;

  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json(
    new ApiResponse(200, { orders }, 'Recent orders retrieved successfully')
  );
});

module.exports = {
  getDashboardStats,
  getRecentOrders
};
