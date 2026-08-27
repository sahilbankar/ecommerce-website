const Review = require('../models/reviewModel');
const Order = require('../models/orderModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews?productId=...
// @access  Public
const getProductReviews = asyncHandler(async (req, res, next) => {
  if (!req.query.productId) {
    return next(new ApiError(400, 'productId query parameter is required'));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { product: req.query.productId, status: 'approved' };

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }, 'Reviews retrieved successfully')
  );
});

// @desc    Create a product review
// @route   POST /api/v1/reviews
// @access  Private
const createReview = asyncHandler(async (req, res, next) => {
  const { productId, rating, title, comment } = req.body;

  if (!productId || !rating || !comment) {
    return next(new ApiError(400, 'productId, rating, and comment are required'));
  }

  if (rating < 1 || rating > 5) {
    return next(new ApiError(400, 'Rating must be between 1 and 5'));
  }

  // Check if user already reviewed this product
  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: req.user._id
  });
  if (alreadyReviewed) {
    return next(new ApiError(400, 'You have already submitted a review for this product'));
  }

  // Check if user has purchased this product to mark as verified purchase
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    orderStatus: 'Delivered'
  });

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    verifiedPurchase: !!hasPurchased
  });

  await review.populate('user', 'name avatar');

  res.status(201).json(
    new ApiResponse(201, { review }, 'Review submitted successfully')
  );
});

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError(404, 'Review not found'));
  }

  if (review.user.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Not authorized to update this review'));
  }

  const { rating, title, comment } = req.body;

  if (rating) review.rating = rating;
  if (title) review.title = title;
  if (comment) review.comment = comment;

  await review.save();

  res.status(200).json(
    new ApiResponse(200, { review }, 'Review updated successfully')
  );
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ApiError(404, 'Review not found'));
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to delete this review'));
  }

  await review.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Review deleted successfully')
  );
});

// @desc    Get all reviews (Admin)
// @route   GET /api/v1/reviews/all
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('user', 'name email')
    .populate('product', 'title slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }, 'All reviews retrieved successfully')
  );
});

// @desc    Update review status (Admin)
// @route   PUT /api/v1/reviews/:id/status
// @access  Private/Admin
const updateReviewStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return next(new ApiError(400, 'Status must be pending, approved, or rejected'));
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new ApiError(404, 'Review not found'));
  }

  review.status = status;
  await review.save();

  // Recalculate product rating
  await Review.getAverageRating(review.product);

  res.status(200).json(
    new ApiResponse(200, { review }, `Review status updated to ${status}`)
  );
});

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewStatus
};
