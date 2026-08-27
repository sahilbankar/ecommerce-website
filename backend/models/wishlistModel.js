const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Static method: Find or create wishlist for user
wishlistSchema.statics.getWishlistByUserId = async function (userId) {
  let wishlist = await this.findOne({ user: userId }).populate({
    path: 'products',
    select: 'title slug price discountPrice images ratings stock isActive category brand',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name logo' }
    ]
  });

  if (!wishlist) {
    wishlist = await this.create({ user: userId, products: [] });
  } else if (wishlist.products && wishlist.products.length > 0) {
    // Filter out any null products in case products were removed from DB
    const validProducts = wishlist.products.filter((p) => p !== null && p !== undefined);
    if (validProducts.length !== wishlist.products.length) {
      wishlist.products = validProducts.map((p) => p._id);
      await wishlist.save();
      wishlist.products = validProducts;
    }
  }
  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
