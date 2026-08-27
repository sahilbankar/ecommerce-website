const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    variant: {
      color: String,
      size: String
    },
    price: {
      type: Number,
      required: [true, 'Item price is required']
    }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: Automatically calculate total amount
cartSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  next();
});

// Static method: Find or create cart for user
cartSchema.statics.getCartByUserId = async function (userId) {
  let cart = await this.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title slug price discountPrice images stock isActive'
  });

  if (!cart) {
    cart = await this.create({ user: userId, items: [], totalAmount: 0 });
  }
  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
