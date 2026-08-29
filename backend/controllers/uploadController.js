const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary
} = require('../services/cloudinaryService');

// ─────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────

// @desc    Upload / update logged-in user's avatar
// @route   PUT /api/v1/upload/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No image file provided'));
  }

  const user = await User.findById(req.user._id);

  // Delete old avatar from Cloudinary if it has a public_id
  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  const result = await uploadToCloudinary(req.file.buffer, 'ecommerce/avatars', {
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  user.avatar = { url: result.url, public_id: result.public_id };
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(200, { avatar: user.avatar }, 'Avatar uploaded successfully')
  );
});

// ─────────────────────────────────────────────
// PRODUCT IMAGES
// ─────────────────────────────────────────────

// @desc    Upload product images (Admin)
// @route   POST /api/v1/upload/product/:productId/images
// @access  Private/Admin
const uploadProductImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'No image files provided'));
  }

  const product = await Product.findById(req.params.productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  let variants = req.body.variants || [];
  if (typeof variants === 'string') {
    variants = [variants];
  }

  const uploadedImages = await uploadMultipleToCloudinary(req.files, 'ecommerce/products');

  const formattedImages = uploadedImages.map((img, index) => ({
    url: img.url,
    public_id: img.public_id || '',
    variant: Array.isArray(variants) ? (variants[index] || '') : ''
  }));

  // Append uploaded images to product's images array
  product.images.push(...formattedImages);
  await product.save();

  res.status(200).json(
    new ApiResponse(200, { images: product.images }, 'Product images uploaded successfully')
  );
});

// @desc    Delete a specific product image (Admin)
// @route   DELETE /api/v1/upload/product/:productId/images
// @access  Private/Admin
const deleteProductImage = asyncHandler(async (req, res, next) => {
  const { public_id, url } = req.body;

  if (!public_id && !url) {
    return next(new ApiError(400, 'public_id or image url is required to delete an image'));
  }

  const product = await Product.findById(req.params.productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  const imageIndex = product.images.findIndex(
    (img) =>
      (public_id && img.public_id === public_id) ||
      (url && img.url === url) ||
      (public_id && img.url === public_id)
  );

  if (imageIndex === -1) {
    return next(new ApiError(404, 'Image not found on this product'));
  }

  const targetImage = product.images[imageIndex];

  if (targetImage && targetImage.public_id) {
    try {
      await deleteFromCloudinary(targetImage.public_id);
    } catch {
      // Ignore Cloudinary delete error if already removed
    }
  }

  product.images.splice(imageIndex, 1);
  await product.save();

  res.status(200).json(
    new ApiResponse(200, { images: product.images }, 'Product image deleted successfully')
  );
});

// ─────────────────────────────────────────────
// CATEGORY IMAGE
// ─────────────────────────────────────────────

// @desc    Upload category image (Admin)
// @route   PUT /api/v1/upload/category/:categoryId/image
// @access  Private/Admin
const uploadCategoryImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No image file provided'));
  }

  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    return next(new ApiError(404, 'Category not found'));
  }

  // Delete old image
  if (category.image?.public_id) {
    await deleteFromCloudinary(category.image.public_id);
  }

  const result = await uploadToCloudinary(req.file.buffer, 'ecommerce/categories', {
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  category.image = { url: result.url, public_id: result.public_id };
  await category.save();

  res.status(200).json(
    new ApiResponse(200, { image: category.image }, 'Category image uploaded successfully')
  );
});

// ─────────────────────────────────────────────
// BRAND LOGO
// ─────────────────────────────────────────────

// @desc    Upload brand logo (Admin)
// @route   PUT /api/v1/upload/brand/:brandId/logo
// @access  Private/Admin
const uploadBrandLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No image file provided'));
  }

  const brand = await Brand.findById(req.params.brandId);
  if (!brand) {
    return next(new ApiError(404, 'Brand not found'));
  }

  // Delete old logo
  if (brand.logo?.public_id) {
    await deleteFromCloudinary(brand.logo.public_id);
  }

  const result = await uploadToCloudinary(req.file.buffer, 'ecommerce/brands', {
    transformation: [
      { width: 200, height: 200, crop: 'pad', background: 'white' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  brand.logo = { url: result.url, public_id: result.public_id };
  await brand.save();

  res.status(200).json(
    new ApiResponse(200, { logo: brand.logo }, 'Brand logo uploaded successfully')
  );
});

// ─────────────────────────────────────────────
// GENERIC DELETE
// ─────────────────────────────────────────────

// @desc    Delete any image from Cloudinary by public_id (Admin)
// @route   DELETE /api/v1/upload/image
// @access  Private/Admin
const deleteImage = asyncHandler(async (req, res, next) => {
  const { public_id } = req.body;

  if (!public_id) {
    return next(new ApiError(400, 'public_id is required'));
  }

  const result = await deleteFromCloudinary(public_id);

  res.status(200).json(
    new ApiResponse(200, { result }, 'Image deleted from Cloudinary successfully')
  );
});

module.exports = {
  uploadAvatar,
  uploadProductImages,
  deleteProductImage,
  uploadCategoryImage,
  uploadBrandLogo,
  deleteImage
};
