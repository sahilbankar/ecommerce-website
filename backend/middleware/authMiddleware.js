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

  if (!token) {
    return next(new ApiError(401, 'Not authorized, access token missing'));
  }

  try {
    // Verify Access Token
    const decoded = jwt.verify(token, jwtConfig.access.secret);

    // Fetch user from DB (excluding password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ApiError(401, 'User belonging to this token no longer exists'));
    }

    if (user.isBlocked) {
      return next(new ApiError(403, 'Your account has been suspended. Please contact support.'));
    }

    req.user = user;
    next();
  } catch (error) {
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
    if (!req.user || !roles.includes(req.user.role)) {
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
