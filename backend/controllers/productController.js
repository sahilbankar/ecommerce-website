const Product = require('../models/productModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/v1/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  // Full-text keyword search
  if (req.query.keyword) {
    filter.$text = { $search: req.query.keyword };
  }

  // Filter by Category
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Filter by Brand
  if (req.query.brand) {
    filter.brand = req.query.brand;
  }

  // Filter by Price Range
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  // Filter by Rating
  if (req.query.rating) {
    filter['ratings.average'] = { $gte: Number(req.query.rating) };
  }

  // Filter in-stock items only
  if (req.query.inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // Filter featured products
  if (req.query.isFeatured === 'true') {
    filter.isFeatured = true;
  }

  // Sorting logic
  let sortOption = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { 'ratings.average': -1 };
        break;
      case 'title':
        sortOption = { title: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
        break;
    }
  }

  const totalProducts = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .populate('brand', 'name logo')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          page,
          limit,
          totalProducts,
          totalPages: Math.ceil(totalProducts / limit)
        }
      },
      'Products retrieved successfully'
    )
  );
});

// @desc    Get single product by slug
// @route   GET /api/v1/products/slug/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category', 'name slug')
    .populate('brand', 'name logo');

  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  res.status(200).json(
    new ApiResponse(200, { product }, 'Product retrieved successfully')
  );
});

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('brand', 'name logo');

  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  res.status(200).json(
    new ApiResponse(200, { product }, 'Product retrieved successfully')
  );
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res, next) => {
  const {
    title,
    slug,
    description,
    price,
    discountPrice,
    stock,
    category,
    brand,
    images,
    specs,
    isFeatured,
    sizes,
    colors,
    variants
  } = req.body;

  const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const productExists = await Product.findOne({ slug: generatedSlug });
  if (productExists) {
    return next(new ApiError(400, 'Product with this title or slug already exists'));
  }

  const product = await Product.create({
    title,
    slug: generatedSlug,
    description,
    price,
    discountPrice,
    stock,
    category,
    brand,
    images: images || [],
    specs: specs || [],
    isFeatured: isFeatured !== undefined ? isFeatured : false,
    sizes: sizes || [],
    colors: colors || [],
    variants: variants || []
  });

  res.status(201).json(
    new ApiResponse(201, { product }, 'Product created successfully')
  );
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  if (req.body.title && !req.body.slug) {
    req.body.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json(
    new ApiResponse(200, { product }, 'Product updated successfully')
  );
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  // Clean up any uploaded Cloudinary images
  if (product.images && product.images.length > 0) {
    const { deleteFromCloudinary } = require('../services/cloudinaryService');
    for (const img of product.images) {
      if (img && img.public_id) {
        try {
          await deleteFromCloudinary(img.public_id);
        } catch {
          // Ignore individual delete errors
        }
      }
    }
  }

  await product.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Product deleted successfully')
  );
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
