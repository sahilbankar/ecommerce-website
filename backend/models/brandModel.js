const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Brand name cannot exceed 50 characters']
    },
    logo: {
      url: {
        type: String,
        default: ''
      },
      public_id: {
        type: String,
        default: ''
      }
    },
    website: {
      type: String,
      trim: true
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

// Static method: Find all active brands
brandSchema.statics.findActiveBrands = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

const Brand = mongoose.model('Brand', brandSchema);
module.exports = Brand;
