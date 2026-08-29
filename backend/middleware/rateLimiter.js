const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

/**
 * General API Rate Limiter
 * Limits requests per window to protect against brute-force and DDoS attacks
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV !== 'production' ? 10000 : 500, // 10000 in dev mode, 500 in prod
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: () => process.env.NODE_ENV !== 'production', // Skip rate limiting during development/testing
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many requests from this IP. Please try again after 15 minutes.'));
  }
});

/**
 * Auth Endpoints Rate Limiter (Login, Register, Password Reset)
 * Stricter limit to prevent brute force attacks on authentication
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV !== 'production' ? 1000 : 50, // 1000 in dev mode, 50 in prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again after 15 minutes.'));
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
