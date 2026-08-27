const ApiError = require('../utils/ApiError');

/**
 * Validate registration request body
 */
const validateRegister = (req, _res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim() === '') errors.push('Name is required');
  if (!email || email.trim() === '') errors.push('Email is required');
  if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Error', errors));
  }
  next();
};

/**
 * Validate login request body
 */
const validateLogin = (req, _res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || email.trim() === '') errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation Error', errors));
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
