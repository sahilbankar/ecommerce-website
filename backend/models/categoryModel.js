const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: {
      url: {
        type: String,
        default: ''
      },
      public_id: {
        type: String,
        default: ''
      }
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
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

// Static method: Find all root / top-level categories
categorySchema.statics.findTopLevelCategories = function () {
  return this.find({ parentCategory: null, isActive: true });
};

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
