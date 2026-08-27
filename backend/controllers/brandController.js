const Brand = require('../models/brandModel');
const Product = require('../models/productModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all brands
// @route   GET /api/v1/brands
// @access  Public
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });

  res.status(200).json(
    new ApiResponse(200, { count: brands.length, brands }, 'Brands retrieved successfully')
  );
});

// @desc    Get single brand by ID
// @route   GET /api/v1/brands/:id
// @access  Public
const getBrandById = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ApiError(404, 'Brand not found'));
  }

  res.status(200).json(
    new ApiResponse(200, { brand }, 'Brand retrieved successfully')
  );
});

// @desc    Create new brand
// @route   POST /api/v1/brands
// @access  Private/Admin
const createBrand = asyncHandler(async (req, res, next) => {
  const { name, logo, website, isActive } = req.body;

  if (!name || name.trim() === '') {
    return next(new ApiError(400, 'Brand name is required'));
  }

  const brandExists = await Brand.findOne({ name: name.trim() });
  if (brandExists) {
    return next(new ApiError(400, 'Brand with this name already exists'));
  }

  const brand = await Brand.create({
    name: name.trim(),
    logo,
    website: website ? website.trim() : '',
    isActive: isActive !== undefined ? isActive : true
  });

  res.status(201).json(
    new ApiResponse(201, { brand }, 'Brand created successfully')
  );
});

// @desc    Update brand
// @route   PUT /api/v1/brands/:id
// @access  Private/Admin
const updateBrand = asyncHandler(async (req, res, next) => {
  let brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ApiError(404, 'Brand not found'));
  }

  if (req.body.name) {
    req.body.name = req.body.name.trim();
  }
  if (req.body.website !== undefined) {
    req.body.website = req.body.website.trim();
  }

  brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(
    new ApiResponse(200, { brand }, 'Brand updated successfully')
  );
});

// @desc    Delete brand
// @route   DELETE /api/v1/brands/:id
// @access  Private/Admin
const deleteBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new ApiError(404, 'Brand not found'));
  }

  // Check if any product is using this brand
  const productCount = await Product.countDocuments({ brand: req.params.id });
  if (productCount > 0) {
    return next(new ApiError(400, `Cannot delete brand: ${productCount} product(s) are associated with it`));
  }

  await brand.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Brand deleted successfully')
  );
});

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand
};
