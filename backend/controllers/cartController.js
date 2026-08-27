const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getCartByUserId(req.user._id);

  res.status(200).json(
    new ApiResponse(200, { cart }, 'Cart retrieved successfully')
  );
});

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1, variant } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new ApiError(404, 'Product not found or unavailable'));
  }

  if (product.stock < quantity) {
    return next(new ApiError(400, `Only ${product.stock} items available in stock`));
  }

  const effectivePrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if item already exists in cart with same variant
  const itemIndex = cart.items.findIndex((item) => {
    const isSameProduct = item.product.toString() === productId;
    const isSameColor = item.variant?.color === variant?.color;
    const isSameSize = item.variant?.size === variant?.size;
    return isSameProduct && isSameColor && isSameSize;
  });

  if (itemIndex > -1) {
    const newQty = cart.items[itemIndex].quantity + Number(quantity);
    if (product.stock < newQty) {
      return next(new ApiError(400, `Cannot add more. Stock limit of ${product.stock} reached.`));
    }
    cart.items[itemIndex].quantity = newQty;
    cart.items[itemIndex].price = effectivePrice;
  } else {
    cart.items.push({
      product: productId,
      quantity: Number(quantity),
      variant: variant || {},
      price: effectivePrice
    });
  }

  await cart.save();

  cart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'title slug price discountPrice images stock isActive'
  });

  res.status(200).json(
    new ApiResponse(200, { cart }, 'Item added to cart successfully')
  );
});

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/items/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  if (quantity < 1) {
    return next(new ApiError(400, 'Quantity must be at least 1'));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(404, 'Cart not found'));
  }

  const itemIndex = cart.items.findIndex((item) => item._id.toString() === req.params.itemId);
  if (itemIndex === -1) {
    return next(new ApiError(404, 'Cart item not found'));
  }

  const product = await Product.findById(cart.items[itemIndex].product);
  if (product && product.stock < quantity) {
    return next(new ApiError(400, `Only ${product.stock} items available in stock`));
  }

  cart.items[itemIndex].quantity = Number(quantity);
  await cart.save();

  const updatedCart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'title slug price discountPrice images stock isActive'
  });

  res.status(200).json(
    new ApiResponse(200, { cart: updatedCart }, 'Cart item updated successfully')
  );
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/items/:itemId
// @access  Private
const removeCartItem = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(404, 'Cart not found'));
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  await cart.save();

  const updatedCart = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'title slug price discountPrice images stock isActive'
  });

  res.status(200).json(
    new ApiResponse(200, { cart: updatedCart }, 'Cart item removed successfully')
  );
});

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
  } else {
    cart = await Cart.create({ user: req.user._id, items: [], totalAmount: 0 });
  }

  res.status(200).json(
    new ApiResponse(200, { cart }, 'Cart cleared successfully')
  );
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
