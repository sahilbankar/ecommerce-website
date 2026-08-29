const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    title: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variant: {
      color: String,
      size: String
    }
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    addressType: { type: String, default: 'Home' }
  },
  { _id: false }
);

const paymentResultSchema = new mongoose.Schema(
  {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
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
      required: [true, 'Shipping address is required']
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Card', 'Stripe', 'Razorpay', 'COD', 'PhonePe', 'GPay', 'Paytm']
    },
    paymentResult: paymentResultSchema,
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
    }
  },
  {
    timestamps: true
  }
);

// Index for filtering orders by creation date
orderSchema.index({ createdAt: -1 });

// Instance Method: Update order status
orderSchema.methods.updateStatus = async function (status, tracking = '') {
  this.orderStatus = status;
  if (tracking) this.trackingNumber = tracking;

  if (status === 'Delivered') {
    this.isDelivered = true;
    this.deliveredAt = Date.now();
    
    if (this.paymentMethod === 'COD' && !this.isPaid) {
      this.isPaid = true;
      this.paidAt = Date.now();
    }
  }

  return await this.save();
};

// Static Method: Get customer orders
orderSchema.statics.getOrdersByUser = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
