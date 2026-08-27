const ApiError = require('../utils/ApiError');

/**
 * Handle 404 Not Found requests
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Resource Not Found - ${req.originalUrl}`);
  next(error);
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Handle default JavaScript Error or unhandled exceptions
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => val.message);
    const message = `Validation Error: ${errors.join(', ')}`;
    error = new ApiError(400, message, errors);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token expired. Please log in again');
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  res.status(error.statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler
};
