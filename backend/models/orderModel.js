const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    title: { type: String, default: 'Product' },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variant: {
      color: String,
      size: String
    },
    isReviewed: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, default: 'Not Provided' },
    city: { type: String, default: 'Not Provided' },
    state: { type: String, default: 'Not Provided' },
    postalCode: { type: String, default: '400001' },
    country: { type: String, default: 'India' },
    addressType: { type: String, default: 'Home' }
  },
  { _id: false }
);

const paymentResultSchema = new mongoose.Schema(
  {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String },
    method: { type: String, default: '' },
    bank: { type: String, default: '' },
    wallet: { type: String, default: '' },
    vpa: { type: String, default: '' },
    razorpay_order_id: { type: String, default: '' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      default: () => ({})
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Card', 'Stripe', 'Razorpay', 'COD', 'PhonePe', 'GPay', 'Paytm'],
      default: 'COD'
    },
    paymentResult: paymentResultSchema,
    razorpayOrderId: {
      type: String,
      default: ''
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    paidAt: {
      type: Date
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    trackingNumber: {
      type: String,
      default: ''
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false
    },
    deliveredAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index for filtering orders by creation date
orderSchema.index({ createdAt: -1 });

// Pre-save hook: Automatically set isDelivered and deliveredAt when orderStatus is Delivered
// Note: Payment status is kept logically separate from fulfillment. Delivering does NOT automatically mark an unpaid order as Paid.
orderSchema.pre('save', function (next) {
  if (this.orderStatus === 'Delivered') {
    this.isDelivered = true;
    if (!this.deliveredAt) this.deliveredAt = new Date();
  }
  next();
});

// Instance Method: Update order status
orderSchema.methods.updateStatus = async function (status, tracking = '') {
  this.orderStatus = status;
  if (tracking) this.trackingNumber = tracking;

  if (status === 'Delivered') {
    this.isDelivered = true;
    if (!this.deliveredAt) this.deliveredAt = Date.now();
  }

  return await this.save();
};

// Static Method: Get customer orders
orderSchema.statics.getOrdersByUser = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
