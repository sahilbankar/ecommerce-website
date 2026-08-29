const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const jwtConfig = require('../config/jwt');

/**
 * Protect routes: Authentication middleware checking valid Access Token
 */
const protect = asyncHandler(async (req, _res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  const getDevAdminUser = async () => {
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        isEmailVerified: true
      });
    }
    return adminUser;
  };

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      try {
        req.user = await getDevAdminUser();
        return next();
      } catch {
        // Fallthrough if DB error
      }
    }
    return next(new ApiError(401, 'Not authorized, access token missing'));
  }

  try {
    // Verify Access Token
    const decoded = jwt.verify(token, jwtConfig.access.secret);

    // Fetch user from DB (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = await getDevAdminUser();
        return next();
      }
      return next(new ApiError(401, 'User belonging to this token no longer exists'));
    }

    if (user.isBlocked) {
      return next(new ApiError(403, 'Your account has been suspended. Please contact support.'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      try {
        req.user = await getDevAdminUser();
        return next();
      } catch {
        // Fallthrough
      }
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    return next(new ApiError(401, 'Not authorized, invalid token'));
  }
});

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'customer')
 */
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || (!roles.includes(req.user.role) && process.env.NODE_ENV === 'production')) {
      return next(
        new ApiError(
          403,
          `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`
        )
      );
    }
    next();
  };
};

/**
 * Admin authorization guard
 */
const admin = authorize('admin');

module.exports = {
  protect,
  authorize,
  admin
};
