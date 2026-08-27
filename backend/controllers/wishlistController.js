const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user wishlist
// @route   GET /api/v1/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.getWishlistByUserId(req.user._id);

  res.status(200).json(
    new ApiResponse(200, { wishlist }, 'Wishlist retrieved successfully')
  );
});

// @desc    Add product to wishlist
// @route   POST /api/v1/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new ApiError(400, 'Product ID is required'));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  const isAlreadyInWishlist = wishlist.products.some(
    (id) => id && id.toString() === productId.toString()
  );

  if (isAlreadyInWishlist) {
    return next(new ApiError(400, 'Product is already in wishlist'));
  }

  wishlist.products.push(productId);
  await wishlist.save();

  wishlist = await Wishlist.findById(wishlist._id).populate({
    path: 'products',
    select: 'title slug price discountPrice images ratings stock isActive category brand',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name logo' }
    ]
  });

  if (wishlist && wishlist.products) {
    wishlist.products = wishlist.products.filter((p) => p !== null && p !== undefined);
  }

  res.status(200).json(
    new ApiResponse(200, { wishlist }, 'Product added to wishlist successfully')
  );
});

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    return next(new ApiError(400, 'Product ID is required'));
  }

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    return next(new ApiError(404, 'Wishlist not found'));
  }

  wishlist.products = wishlist.products.filter(
    (id) => id && id.toString() !== productId.toString()
  );
  await wishlist.save();

  const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
    path: 'products',
    select: 'title slug price discountPrice images ratings stock isActive category brand',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name logo' }
    ]
  });

  if (updatedWishlist && updatedWishlist.products) {
    updatedWishlist.products = updatedWishlist.products.filter((p) => p !== null && p !== undefined);
  }

  res.status(200).json(
    new ApiResponse(200, { wishlist: updatedWishlist }, 'Product removed from wishlist')
  );
});

// @desc    Clear wishlist
// @route   DELETE /api/v1/wishlist
// @access  Private
const clearWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = [];
    await wishlist.save();
  } else {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.status(200).json(
    new ApiResponse(200, { wishlist: { ...wishlist.toObject(), products: [] } }, 'Wishlist cleared successfully')
  );
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
