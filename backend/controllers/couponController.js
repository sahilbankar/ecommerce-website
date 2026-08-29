const Coupon = require('../models/couponModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Validate / apply coupon code
// @route   POST /api/v1/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res, next) => {
  const { code, purchaseAmount } = req.body;

  if (!code) {
    return next(new ApiError(400, 'Coupon code is required'));
  }

  const coupon = await Coupon.findByCode(code);
  if (!coupon) {
    return next(new ApiError(404, 'Coupon not found or inactive'));
  }

  const validity = coupon.isValid(purchaseAmount || 0);
  if (!validity.valid) {
    return next(new ApiError(400, validity.message));
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = ((purchaseAmount || 0) * coupon.discountAmount) / 100;
  } else {
    discountAmount = coupon.discountAmount;
  }

  res.status(200).json(
    new ApiResponse(200, {
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
        calculatedDiscount: discountAmount
      }
    }, 'Coupon is valid')
  );
});

// @desc    Get all coupons (Admin)
// @route   GET /api/v1/coupons
// @access  Private/Admin
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: coupons.length, coupons }, 'Coupons retrieved successfully')
  );
});

// @desc    Get single coupon by ID (Admin)
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin
const getCouponById = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ApiError(404, 'Coupon not found'));
  }

  res.status(200).json(
    new ApiResponse(200, { coupon }, 'Coupon retrieved successfully')
  );
});

// @desc    Create coupon (Admin)
// @route   POST /api/v1/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res, next) => {
  const { code, discountType, discountAmount, minPurchase, expiresAt, usageLimit, isActive } = req.body;

  const exists = await Coupon.findOne({ code: code.toUpperCase() });
  if (exists) {
    return next(new ApiError(400, 'A coupon with this code already exists'));
  }

  if (discountType === 'percentage' && (discountAmount < 1 || discountAmount > 100)) {
    return next(new ApiError(400, 'Percentage discount must be between 1 and 100'));
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountAmount,
    minPurchase: minPurchase || 0,
    expiresAt,
    usageLimit: usageLimit || null,
    isActive: isActive !== undefined ? isActive : true
  });

  res.status(201).json(
    new ApiResponse(201, { coupon }, 'Coupon created successfully')
  );
});

// @desc    Update coupon (Admin)
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res, next) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ApiError(404, 'Coupon not found'));
  }

  if (req.body.code) {
    req.body.code = req.body.code.toUpperCase();
  }

  coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(
    new ApiResponse(200, { coupon }, 'Coupon updated successfully')
  );
});

// @desc    Delete coupon (Admin)
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new ApiError(404, 'Coupon not found'));
  }

  await coupon.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Coupon deleted successfully')
  );
});


// @desc    Get all active coupons (Public)
// @route   GET /api/v1/coupons/active
// @access  Public
const getActiveCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  // Filter out those that exceeded usage limit
  const activeCoupons = coupons.filter(c => c.usageLimit === null || c.usageCount < c.usageLimit);

  res.status(200).json(
    new ApiResponse(200, { count: activeCoupons.length, coupons: activeCoupons }, 'Active coupons retrieved successfully')
  );
});

module.exports = {
  getActiveCoupons,
  validateCoupon,
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
