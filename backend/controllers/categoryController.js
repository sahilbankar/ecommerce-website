const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { deleteFromCloudinary } = require('../services/cloudinaryService');

// @desc    Get all categories (hierarchical or flat)
// @route   GET /api/v1/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .populate('parentCategory', 'name slug')
    .sort({ name: 1 });

  res.status(200).json(
    new ApiResponse(200, { count: categories.length, categories }, 'Categories retrieved successfully')
  );
});

// @desc    Get single category by slug
// @route   GET /api/v1/categories/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate('parentCategory', 'name slug');

  if (!category) {
    return next(new ApiError(404, 'Category not found'));
  }

  res.status(200).json(
    new ApiResponse(200, { category }, 'Category retrieved successfully')
  );
});

// @desc    Get single category by ID or Slug
// @route   GET /api/v1/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res, next) => {
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const query = isMongoId ? { _id: req.params.id } : { slug: req.params.id };
  const category = await Category.findOne(query).populate('parentCategory', 'name slug');

  if (!category) {
    return next(new ApiError(404, 'Category not found'));
  }

  res.status(200).json(
    new ApiResponse(200, { category }, 'Category retrieved successfully')
  );
});


// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res, next) => {
  const { name, slug, description, image, parentCategory, isActive } = req.body;

  const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const categoryExists = await Category.findOne({
    $or: [{ name }, { slug: generatedSlug }]
  });

  if (categoryExists) {
    return next(new ApiError(400, 'Category with this name or slug already exists'));
  }

  const category = await Category.create({
    name,
    slug: generatedSlug,
    description,
    image,
    parentCategory: parentCategory || null,
    isActive: isActive !== undefined ? isActive : true
  });

  res.status(201).json(
    new ApiResponse(201, { category }, 'Category created successfully')
  );
});

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ApiError(404, 'Category not found'));
  }

  if (req.body.name && !req.body.slug) {
    req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('parentCategory', 'name slug');

  res.status(200).json(
    new ApiResponse(200, { category }, 'Category updated successfully')
  );
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ApiError(404, 'Category not found'));
  }

  // Check if any product is using this category
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    if (req.query.force === 'true') {
      await Product.deleteMany({ category: req.params.id });
    } else {
      return next(new ApiError(400, `Cannot delete category: ${productCount} product(s) are associated with it`));
    }
  }

  // Check if any subcategory has this category as parent
  const subcategoryCount = await Category.countDocuments({ parentCategory: req.params.id });
  if (subcategoryCount > 0) {
    if (req.query.force === 'true') {
      await Category.updateMany({ parentCategory: req.params.id }, { $set: { parentCategory: null } });
    } else {
      return next(new ApiError(400, `Cannot delete category: ${subcategoryCount} subcategory(ies) are associated with it`));
    }
  }

  // Delete image from cloudinary if exists
  if (category.image?.public_id) {
    try {
      await deleteFromCloudinary(category.image.public_id);
    } catch {
      // ignore deletion errors if asset was already deleted
    }
  }

  await category.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Category deleted successfully')
  );
});

module.exports = {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
