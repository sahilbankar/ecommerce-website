const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required']
    },
    discountAmount: {
      type: Number,
      required: [true, 'Discount amount is required'],
      min: [0, 'Discount amount cannot be negative']
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase amount cannot be negative']
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    usageLimit: {
      type: Number,
      default: null
    },
    usageCount: {
      type: Number,
      default: 0
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

// Instance Method: Check if coupon is currently valid
couponSchema.methods.isValid = function (purchaseAmount = 0) {
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (this.expiresAt && new Date() > this.expiresAt) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (purchaseAmount < this.minPurchase) return { valid: false, message: `Minimum purchase of ₹${this.minPurchase} required` };

  return { valid: true, message: 'Coupon is valid' };
};

// Static Method: Find active coupon by code
couponSchema.statics.findByCode = function (code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
