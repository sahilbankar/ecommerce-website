const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Seed initial data if DB is empty
const seedInitialData = async () => {
  const count = await Product.countDocuments();
  if (count > 0) return;

  const Coupon = require('../models/couponModel');

  const cat1 = await Category.findOneAndUpdate(
    { slug: 'electronics' },
    { name: 'Electronics', slug: 'electronics', description: 'High-tech smartphones, gadgets, and devices.' },
    { upsert: true, new: true }
  );
  const cat2 = await Category.findOneAndUpdate(
    { slug: 'fashion' },
    { name: 'Fashion Wear', slug: 'fashion', description: 'Trendy clothing, shoes, and lifestyle apparel.' },
    { upsert: true, new: true }
  );
  const cat3 = await Category.findOneAndUpdate(
    { slug: 'home-decor' },
    { name: 'Home Decor', slug: 'home-decor', description: 'Elegant furniture, lighting, and living products.' },
    { upsert: true, new: true }
  );
  const cat4 = await Category.findOneAndUpdate(
    { slug: 'activewear' },
    { name: 'Activewear', slug: 'activewear', description: 'Premium sports clothing and fitness gear.' },
    { upsert: true, new: true }
  );

  const brand1 = await Brand.findOneAndUpdate({ slug: 'aurasound' }, { name: 'AuraSound', slug: 'aurasound' }, { upsert: true, new: true });
  const brand2 = await Brand.findOneAndUpdate({ slug: 'chronos' }, { name: 'Chronos', slug: 'chronos' }, { upsert: true, new: true });
  const brand3 = await Brand.findOneAndUpdate({ slug: 'vanguard' }, { name: 'Vanguard', slug: 'vanguard' }, { upsert: true, new: true });
  const brand4 = await Brand.findOneAndUpdate({ slug: 'ceramica' }, { name: 'Ceramica', slug: 'ceramica' }, { upsert: true, new: true });
  const brand5 = await Brand.findOneAndUpdate({ slug: 'apex' }, { name: 'Apex', slug: 'apex' }, { upsert: true, new: true });
  const brand6 = await Brand.findOneAndUpdate({ slug: 'nordiclight' }, { name: 'NordicLight', slug: 'nordiclight' }, { upsert: true, new: true });

  await Product.create([
    {
      title: 'AuraSound Noise Cancelling Headphones',
      slug: 'aurasound-headphones',
      description: 'Experience deep, immersive sound and advanced active noise cancellation. Features 40-hour battery life, luxury memory foam cushioning, and ultra-high-definition audio output.',
      price: 299.99,
      discountPrice: 249.99,
      stock: 12,
      category: cat1._id,
      brand: brand1._id,
      images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', public_id: '' }],
      ratings: { average: 4.8, numReviews: 124 },
      isFeatured: true
    },
    {
      title: 'Chronos Smart Watch Edition 5',
      slug: 'chronos-smart-watch-5',
      description: 'Track your health, receive call notifications, and monitor sleep seamlessly. Waterproof structure with fluid always-on AMOLED touchscreen display.',
      price: 199.99,
      stock: 25,
      category: cat1._id,
      brand: brand2._id,
      images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', public_id: '' }],
      ratings: { average: 4.5, numReviews: 89 },
      isFeatured: true
    },
    {
      title: 'Vanguard Leather Backpack',
      slug: 'vanguard-leather-backpack',
      description: 'Handcrafted from full-grain vegetable-tanned leather. Fits up to a 16-inch laptop with multiple quick-access pockets and ergonomic padded straps.',
      price: 149.99,
      discountPrice: 129.99,
      stock: 8,
      category: cat2._id,
      brand: brand3._id,
      images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', public_id: '' }],
      ratings: { average: 4.7, numReviews: 42 },
      isFeatured: true
    },
    {
      title: 'Minimalist Ceramic Vase Set',
      slug: 'minimalist-ceramic-vase-set',
      description: 'Set of three matte-finished ceramic flower vases in organic earth tones. Beautifully crafted to enhance modern living rooms and study desks.',
      price: 79.99,
      stock: 15,
      category: cat3._id,
      brand: brand4._id,
      images: [{ url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80', public_id: '' }],
      ratings: { average: 4.2, numReviews: 18 },
      isFeatured: false
    },
    {
      title: 'Apex Fit Pro Sneakers',
      slug: 'apex-fit-pro-sneakers',
      description: 'Engineered for distance running and heavy cross-training. Responsive foam midsoles combined with breathable knits keep your feet cool and cushioned.',
      price: 129.99,
      stock: 10,
      category: cat4._id,
      brand: brand5._id,
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', public_id: '' }],
      ratings: { average: 4.6, numReviews: 95 },
      isFeatured: false
    },
    {
      title: 'Nordic Oak Table Lamp',
      slug: 'nordic-oak-table-lamp',
      description: 'Natural oak wood tripod frame supporting a textured woven flax shade. Gentle warm lighting ideal for reading corners or nightstands.',
      price: 89.99,
      discountPrice: 69.99,
      stock: 10,
      category: cat3._id,
      brand: brand6._id,
      images: [{ url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', public_id: '' }],
      ratings: { average: 4.4, numReviews: 31 },
      isFeatured: true
    }
  ]);

  await Coupon.findOneAndUpdate(
    { code: 'WELCOME20' },
    {
      code: 'WELCOME20',
      discountType: 'percentage',
      discountAmount: 20,
      minPurchase: 499,
      usageLimit: 500,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    { upsert: true }
  );
};

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

  // Filter by Category (supports ObjectId, slug, or name)
  if (req.query.category) {
    if (mongoose.Types.ObjectId.isValid(req.query.category)) {
      filter.category = req.query.category;
    } else {
      const catObj = await Category.findOne({
        $or: [
          { slug: req.query.category },
          { name: new RegExp(`^${req.query.category.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
        ]
      });
      if (catObj) {
        filter.category = catObj._id;
      } else {
        filter.category = new mongoose.Types.ObjectId();
      }
    }
  }

  // Filter by Brand (supports ObjectId, slug, or name)
  if (req.query.brand) {
    if (mongoose.Types.ObjectId.isValid(req.query.brand)) {
      filter.brand = req.query.brand;
    } else {
      const brandObj = await Brand.findOne({
        $or: [
          { slug: req.query.brand },
          { name: new RegExp(`^${req.query.brand.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
        ]
      });
      if (brandObj) {
        filter.brand = brandObj._id;
      } else {
        filter.brand = new mongoose.Types.ObjectId();
      }
    }
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

  let totalProducts = await Product.countDocuments(filter);

  // Auto seed if DB has 0 products
  if (totalProducts === 0 && !req.query.keyword && !req.query.category && !req.query.brand && !req.query.minPrice && !req.query.maxPrice) {
    try {
      await seedInitialData();
      totalProducts = await Product.countDocuments(filter);
    } catch {
      // Ignore seed error
    }
  }

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

  let generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const productExists = await Product.findOne({ slug: generatedSlug });
  if (productExists) {
    generatedSlug = `${generatedSlug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // Resolve or create Category
  let categoryId = category;
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    const catName = typeof category === 'string' && category.trim() ? category.trim() : 'General';
    const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let catObj = await Category.findOne({ $or: [{ slug: catSlug }, { name: new RegExp(`^${catName}$`, 'i') }] });
    if (!catObj) {
      catObj = await Category.create({ name: catName, slug: catSlug });
    }
    categoryId = catObj._id;
  }

  // Resolve or create Brand
  let brandId = brand;
  if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
    const brandName = typeof brand === 'string' && brand.trim() ? brand.trim() : 'Generic';
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let brandObj = await Brand.findOne({ $or: [{ slug: brandSlug }, { name: new RegExp(`^${brandName}$`, 'i') }] });
    if (!brandObj) {
      brandObj = await Brand.create({ name: brandName, slug: brandSlug });
    }
    brandId = brandObj._id;
  }

  const ratingAvg = req.body.ratings && typeof req.body.ratings === 'object'
    ? Number(req.body.ratings.average || 4.5)
    : (req.body.rating !== undefined ? Number(req.body.rating) : 4.5);

  const product = await Product.create({
    title,
    slug: generatedSlug,
    description,
    price,
    discountPrice,
    stock,
    category: categoryId,
    brand: brandId,
    images: images || [],
    ratings: { average: ratingAvg, numReviews: req.body.ratings?.numReviews || 0 },
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

  // Resolve Category if passed as string name/slug
  if (req.body.category && !mongoose.Types.ObjectId.isValid(req.body.category)) {
    const catName = req.body.category.trim();
    const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let catObj = await Category.findOne({ $or: [{ slug: catSlug }, { name: new RegExp(`^${catName}$`, 'i') }] });
    if (!catObj) {
      catObj = await Category.create({ name: catName, slug: catSlug });
    }
    req.body.category = catObj._id;
  }

  // Resolve Brand if passed as string name/slug
  if (req.body.brand && !mongoose.Types.ObjectId.isValid(req.body.brand)) {
    const brandName = req.body.brand.trim();
    const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let brandObj = await Brand.findOne({ $or: [{ slug: brandSlug }, { name: new RegExp(`^${brandName}$`, 'i') }] });
    if (!brandObj) {
      brandObj = await Brand.create({ name: brandName, slug: brandSlug });
    }
    req.body.brand = brandObj._id;
  }

  if (req.body.ratings !== undefined || req.body.rating !== undefined) {
    const ratingAvg = req.body.ratings && typeof req.body.ratings === 'object'
      ? Number(req.body.ratings.average || 4.5)
      : Number(req.body.rating || 4.5);
    req.body.ratings = {
      average: ratingAvg,
      numReviews: product.ratings?.numReviews || 0
    };
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
