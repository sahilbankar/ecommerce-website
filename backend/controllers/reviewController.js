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
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  // Retrieve approved and verified customer reviews (exclude rejected)
  const filter = { product: req.query.productId, status: { $ne: 'rejected' } };

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
  const { productId, rating, title, comment, orderId } = req.body;

  if (!productId || !rating || !comment) {
    return next(new ApiError(400, 'productId, rating, and comment are required'));
  }

  if (rating < 1 || rating > 5) {
    return next(new ApiError(400, 'Rating must be between 1 and 5'));
  }

  // Check if user has purchased this product
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    orderStatus: { $ne: 'Cancelled' }
  });

  if (!hasPurchased && req.user.role !== 'admin') {
    return next(new ApiError(403, 'You can only review products that you have purchased and received'));
  }

  // Check if user already reviewed this product -> Update existing review (prevent duplicate)
  const alreadyReviewed = await Review.findOne({
    product: productId,
    user: req.user._id
  });

  if (alreadyReviewed) {
    alreadyReviewed.rating = Number(rating);
    if (comment) alreadyReviewed.comment = comment.trim();
    if (title !== undefined) alreadyReviewed.title = title;
    alreadyReviewed.status = 'approved';
    alreadyReviewed.verifiedPurchase = true;
    if (orderId || hasPurchased?._id) {
      alreadyReviewed.order = orderId || hasPurchased._id;
    }
    await alreadyReviewed.save();

    await Review.getAverageRating(productId);
    await alreadyReviewed.populate('user', 'name avatar');
    return res.status(200).json(
      new ApiResponse(200, { review: alreadyReviewed }, 'Review updated successfully')
    );
  }

  const reviewPayload = {
    user: req.user._id,
    product: productId,
    rating: Number(rating),
    title: title || '',
    comment: comment.trim(),
    verifiedPurchase: true,
    status: 'approved'
  };

  if (orderId || hasPurchased?._id) {
    reviewPayload.order = orderId || hasPurchased._id;
  }

  const review = await Review.create(reviewPayload);

  // Recalculate average rating for product immediately
  await Review.getAverageRating(productId);

  // Mark the item as reviewed in the specific order
  const targetOrderId = orderId || hasPurchased?._id;
  if (targetOrderId) {
    const order = await Order.findOne({ _id: targetOrderId, user: req.user._id });
    if (order) {
      const item = order.orderItems.find(i => i.product.toString() === productId.toString());
      if (item) {
        item.isReviewed = true;
        await order.save();
      }
    }
  }

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

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Not authorized to update this review'));
  }

  const { rating, title, comment, status } = req.body;

  if (rating) review.rating = Number(rating);
  if (title !== undefined) review.title = title;
  if (comment) review.comment = comment.trim();
  
  if (req.user.role === 'admin' && status) {
    review.status = status;
    if (status === 'rejected') review.rejectedBy = 'admin';
    if (status === 'approved') review.rejectedBy = 'none';
  } else if (req.user.role !== 'admin') {
    review.status = 'approved';
  }

  await review.save();
  await Review.getAverageRating(review.product);
  await review.populate('user', 'name avatar');

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

  const productId = review.product;
  const orderId = review.order;

  if (req.user.role === 'admin') {
    // If deleted by Admin, mark as rejected by admin so it moves to Rejected section
    review.status = 'rejected';
    review.rejectedBy = 'admin';
    await review.save();

    await Review.getAverageRating(productId);

    return res.status(200).json(
      new ApiResponse(200, { review }, 'Review rejected by admin successfully')
    );
  }

  // If deleted by Customer themselves, delete document
  await review.deleteOne();

  // Recalculate rating
  await Review.getAverageRating(productId);

  // Unmark isReviewed on order if exists
  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      const item = order.orderItems.find(i => i.product.toString() === productId.toString());
      if (item) {
        item.isReviewed = false;
        await order.save();
      }
    }
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Review deleted successfully')
  );
});

// @desc    Get all reviews (Admin)
// @route   GET /api/v1/reviews/all
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate('user', 'name email avatar')
    .populate('product', 'title slug images price')
    .populate('order', '_id')
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
  if (status === 'rejected') {
    review.rejectedBy = 'admin';
  } else if (status === 'approved') {
    review.rejectedBy = 'none';
  }

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
