const fs = require('fs');

// 1. Update orderModel.js
const orderModelPath = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/backend/models/orderModel.js';
let orderModel = fs.readFileSync(orderModelPath, 'utf8');

if (!orderModel.includes('isReviewed')) {
  orderModel = orderModel.replace(
    /quantity: \{ type: Number, required: true, min: 1 \},/g,
    "quantity: { type: Number, required: true, min: 1 },\n    isReviewed: { type: Boolean, default: false },"
  );
  fs.writeFileSync(orderModelPath, orderModel);
  console.log('Updated orderModel.js');
}

// 2. Update reviewModel.js
const reviewModelPath = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/backend/models/reviewModel.js';
let reviewModel = fs.readFileSync(reviewModelPath, 'utf8');

if (!reviewModel.includes('order: {')) {
  reviewModel = reviewModel.replace(
    /product: \{[\s\S]*?index: true\s*\}/,
    `product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required']
    }`
  );
  
  // Remove the old unique index that prevented multiple reviews from the same user
  // (Because a user might buy the product again in a different order and want to review it again)
  reviewModel = reviewModel.replace(
    "reviewSchema.index({ product: 1, user: 1 }, { unique: true });",
    "reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });"
  );
  
  fs.writeFileSync(reviewModelPath, reviewModel);
  console.log('Updated reviewModel.js');
}
