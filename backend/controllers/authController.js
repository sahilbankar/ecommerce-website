const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../services/emailService');
const jwtConfig = require('../config/jwt');

/**
 * Helper: Send Refresh Token in HTTP-Only Cookie and return Access Token
 */
const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in user document
  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });

  // Set HTTP-Only Cookie for Refresh Token
  res.cookie('refreshToken', refreshToken, jwtConfig.cookieOptions);

  // Exclude password from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    avatar: user.avatar,
    isBlocked: user.isBlocked,
    lastLogin: user.lastLogin || user.createdAt,
    createdAt: user.createdAt
  };

  res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      {
        user: userResponse,
        accessToken
      },
      message
    )
  );
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return next(new ApiError(400, 'User with this email already exists'));
  }

  // Prevent arbitrary non-admin registration of admin role
  const userRole = role === 'admin' && req.body.adminSecret === process.env.ADMIN_SECRET ? 'admin' : 'customer';

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: userRole,
    lastLogin: new Date()
  });

  await sendTokenResponse(user, 201, res, 'User registered successfully');
});

// @desc    Login user & get access token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email and include password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  // Check if user account is blocked
  if (user.isBlocked) {
    return next(new ApiError(403, 'Your account has been suspended. Please contact support.'));
  }

  // Update last login date
  user.lastLogin = new Date();

  await sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout user & clear refresh token cookie
// @route   POST /api/v1/auth/logout
// @access  Public / Private
const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    // Remove refresh token from DB if user token exists
    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.refresh.secret);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Ignore token verification errors during logout
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/v1/auth/refresh-token
// @access  Public (uses refresh token cookie)
const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return next(new ApiError(401, 'Refresh token missing. Please log in again'));
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.refresh.secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'Invalid refresh token, user not found'));
    }

    if (user.isBlocked) {
      return next(new ApiError(403, 'Your account is suspended'));
    }

    // Check if refresh token exists in user's saved tokens
    const tokenExists = user.refreshTokens.some((t) => t.token === token);
    if (!tokenExists) {
      return next(new ApiError(401, 'Refresh token has been revoked or expired'));
    }

    // Generate new access token
    const newAccessToken = user.generateAccessToken();

    res.status(200).json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken },
        'Access token refreshed successfully'
      )
    );
  } catch {
    return next(new ApiError(401, 'Refresh token expired or invalid. Please log in again'));
  }
});

// @desc    Forgot Password - Send reset token email
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError(400, 'Please provide an email address'));
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new ApiError(404, 'There is no user registered with that email address'));
  }

  // Generate unhashed reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash reset token and save to user
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const message = `You are receiving this email because a password reset was requested for your account.\n\nPlease navigate to the following link to reset your password:\n\n${resetUrl}\n\nThis token is valid for 10 minutes. If you did not request a password reset, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token - E-Commerce App',
      message
    });

    res.status(200).json(
      new ApiResponse(
        200,
        { resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined },
        'Password reset email sent successfully'
      )
    );
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ApiError(500, `Email could not be sent: ${error.message}`));
  }
});

// @desc    Reset Password using token
// @route   PUT /api/v1/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return next(new ApiError(400, 'Password must be at least 6 characters long'));
  }

  // Hash token from parameter URL
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ApiError(400, 'Invalid or expired password reset token'));
  }

  // Set new password and clear reset token fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  await sendTokenResponse(user, 200, res, 'Password reset successful');
});

// @desc    Get current authenticated user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user }, 'User profile fetched successfully'));
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe
};
