const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: ''
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    verifiedPurchase: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    }
  },
  {
    timestamps: true
  }
);

// Compound index on product and user
reviewSchema.index({ product: 1, user: 1 });

// Static Method: Calculate and update average rating on Product
reviewSchema.statics.getAverageRating = async function (productId) {
  const prodId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
  const stats = await this.aggregate([
    { $match: { product: prodId, status: 'approved' } },
    {
      $group: {
        _id: '$product',
        numReviews: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratings: {
          average: Math.round(stats[0].avgRating * 10) / 10,
          numReviews: stats[0].numReviews
        }
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratings: {
          average: 0,
          numReviews: 0
        }
      });
    }
  } catch (error) {
    console.error(`[Review Model] Error updating product ratings: ${error.message}`);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after delete
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.product);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
