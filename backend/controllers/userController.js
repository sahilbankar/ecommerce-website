const User = require('../models/userModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get current user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, { user: req.user }, 'Profile retrieved successfully')
  );
});

// @desc    Update current user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  // Prevent email duplication
  if (email && email !== req.user.email) {
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return next(new ApiError(400, 'Email is already in use by another account'));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  );

  res.status(200).json(
    new ApiResponse(200, { user: updatedUser }, 'Profile updated successfully')
  );
});

// @desc    Change user password
// @route   PUT /api/v1/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Current password and new password are required'));
  }

  if (newPassword.length < 6) {
    return next(new ApiError(400, 'New password must be at least 6 characters'));
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return next(new ApiError(401, 'Current password is incorrect'));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, null, 'Password changed successfully')
  );
});

// @desc    Get user addresses
// @route   GET /api/v1/users/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: addresses.length, addresses }, 'Addresses retrieved successfully')
  );
});

// @desc    Add new address
// @route   POST /api/v1/users/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const { street, city, state, postalCode, country, addressType, isDefault } = req.body;

  const address = new Address({
    user: req.user._id,
    street,
    city,
    state,
    postalCode,
    country: country || 'India',
    addressType: addressType || 'Home',
    isDefault: isDefault || false
  });

  await address.save();

  res.status(201).json(
    new ApiResponse(201, { address }, 'Address added successfully')
  );
});

// @desc    Update address
// @route   PUT /api/v1/users/addresses/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return next(new ApiError(404, 'Address not found'));
  }

  const updatedAddress = await Address.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(
    new ApiResponse(200, { address: updatedAddress }, 'Address updated successfully')
  );
});

// @desc    Delete address
// @route   DELETE /api/v1/users/addresses/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return next(new ApiError(404, 'Address not found'));
  }

  await address.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Address deleted successfully')
  );
});

// ──────────────────────────────────────────
// ADMIN User Management
// ──────────────────────────────────────────

// @desc    Get all users with order metrics & activity summary (Admin)
// @route   GET /api/v1/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === 'true';

  if (req.query.search || req.query.keyword) {
    const term = req.query.search || req.query.keyword;
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password -refreshTokens')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Aggregate order metrics for each user
  const enrichedUsers = await Promise.all(
    users.map(async (u) => {
      const orderStats = await Order.aggregate([
        { $match: { user: u._id } },
        {
          $group: {
            _id: null,
            ordersCount: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' }
          }
        }
      ]);

      const ordersCount = orderStats.length > 0 ? orderStats[0].ordersCount : 0;
      const totalSpent = orderStats.length > 0 ? orderStats[0].totalSpent : 0;

      return {
        ...u.toObject(),
        ordersCount,
        totalSpent
      };
    })
  );

  // Summary statistics across all customers
  const [totalCustomers, activeCustomers, blockedCustomers] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', isBlocked: false }),
    User.countDocuments({ role: 'customer', isBlocked: true })
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      users: enrichedUsers,
      stats: {
        totalCustomers,
        activeCustomers,
        blockedCustomers
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }, 'Users retrieved successfully')
  );
});

// @desc    Get user by ID with activity log and recent orders (Admin)
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokens');

  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  // Fetch recent orders for this user
  const recentOrders = await Order.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate order metrics
  const totalOrders = recentOrders.length;
  const totalSpent = recentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  // Build activity timeline
  const activities = [
    {
      type: 'REGISTER',
      title: 'Account Registered',
      description: `Registered with email ${user.email}`,
      timestamp: user.createdAt
    }
  ];

  if (user.lastLogin) {
    activities.push({
      type: 'LOGIN',
      title: 'User Logged In',
      description: 'Logged into platform session',
      timestamp: user.lastLogin
    });
  }

  recentOrders.forEach((ord) => {
    activities.push({
      type: 'ORDER',
      title: `Placed Order #${ord._id.toString().slice(-6)}`,
      description: `Order value: $${ord.totalPrice?.toFixed(2)} (${ord.orderItems?.length || 0} items) - Status: ${ord.orderStatus}`,
      timestamp: ord.createdAt
    });
  });

  // Sort activities newest first
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.status(200).json(
    new ApiResponse(200, {
      user: {
        ...user.toObject(),
        totalOrders,
        totalSpent,
        recentOrders,
        activities
      }
    }, 'User details retrieved successfully')
  );
});

// @desc    Update user status (block/unblock) – Admin
// @route   PUT /api/v1/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { isBlocked } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  if (user.role === 'admin') {
    return next(new ApiError(403, 'Cannot block an admin account'));
  }

  user.isBlocked = isBlocked;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(200, { user: { _id: user._id, isBlocked: user.isBlocked } },
      `User account ${isBlocked ? 'blocked' : 'unblocked'} successfully`)
  );
});

// @desc    Delete user (Admin)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError(404, 'User not found'));
  }

  if (user.role === 'admin') {
    return next(new ApiError(403, 'Cannot delete an admin account'));
  }

  await user.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'User deleted successfully')
  );
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser
};
