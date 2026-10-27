const mongoose = require('mongoose');

const specSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, default: '' },
    variant: { type: String, default: '' }
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    size: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '' },
    price: { type: Number, min: 0, default: null },
    discountPrice: { type: Number, min: 0, default: null },
    stock: { type: Number, min: 0, default: null },
    sku: { type: String, trim: true, default: '' },
    image: { type: String, default: '' }
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Product title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price cannot be negative']
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true
    },
    images: {
      type: [imageSchema],
      default: []
    },
    sizes: {
      type: [{ type: String, trim: true }],
      default: []
    },
    colors: {
      type: [{ type: String, trim: true }],
      default: []
    },
    variants: {
      type: [variantSchema],
      default: []
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be below 0'],
        max: [5, 'Rating cannot exceed 5']
      },
      numReviews: {
        type: Number,
        default: 0,
        min: [0, 'Number of reviews cannot be negative']
      }
    },
    specs: [specSchema],
    isFeatured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performant filtering and sorting
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ price: 1, category: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });

// Instance Method: Check if product is in stock
productSchema.methods.isInStock = function (requestedQuantity = 1) {
  return this.stock >= requestedQuantity;
};

// Static Method: Find featured products
productSchema.statics.findFeaturedProducts = function (limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .populate('brand', 'name logo')
    .limit(limit);
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
