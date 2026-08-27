const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

/**
 * General API Rate Limiter
 * Limits requests per window to protect against brute-force and DDoS attacks
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
  max: 20, // Limit each IP to 20 requests per 15 minutes for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again after 15 minutes.'));
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
