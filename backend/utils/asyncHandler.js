/**
 * Higher-order utility to wrap async request handlers and automatically pass errors to Express error handler
 * @param {Function} requestHandler - Async Express route handler function
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = asyncHandler;
