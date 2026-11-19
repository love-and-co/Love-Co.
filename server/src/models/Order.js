const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  productId: { type: String },
  variantId: { type: String },
  batchNumber: { type: String }, // FEFO assigned batch
  title: { type: String },
  name: { type: String },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  unitPrice: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  gstRate: { type: Number, default: 18 },
  image: { type: String },
  isBundleItem: { type: Boolean, default: false },
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    pricingBreakdown: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
    },
    shipping: {
      courier: { type: String, default: 'Bluedart Express' },
      courierName: { type: String },
      awbNumber: { type: String },
      awb: { type: String },
      trackingUrl: { type: String },
      labelUrl: { type: String },
      status: {
        type: String,
        enum: ['UNFULFILLED', 'PACKED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO', 'CANCELLED'],
        default: 'UNFULFILLED',
      },
    },
    payment: {
      mode: { type: String, enum: ['PREPAID', 'COD'], default: 'PREPAID' },
      gateway: { type: String, enum: ['Razorpay', 'Cashfree', 'Stripe'], default: 'Razorpay' },
      status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'AUTHORIZED'], default: 'PAID' },
      transactionId: { type: String },
    },
    isRtoRisk: { type: Boolean, default: false },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allows guest checkout with shipping details
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
    },
    paymentDetails: {
      provider: {
        type: String,
        enum: ['Razorpay', 'Stripe', 'COD', 'MockPay'],
        default: 'Razorpay',
      },
      transactionId: { type: String },
      paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'AUTHORIZED', 'REFUNDED', 'unpaid', 'captured'],
        default: 'PENDING',
      },
    },
    fulfillmentStatus: {
      type: String,
      enum: [
        'PLACED',
        'PROCESSING',
        'PACKED',
        'CURING_BATCH',
        'DISPATCHED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PLACED',
    },
    shippingDetails: {
      shiprocketOrderId: { type: String },
      shipmentId: { type: String },
      awbCode: { type: String },
      courierName: { type: String },
      trackingUrl: { type: String },
      currentCourierStatus: { type: String, default: 'Order Created' },
      trackingHistory: [
        {
          status: { type: String },
          location: { type: String },
          timestamp: { type: Date, default: Date.now },
          activity: { type: String },
        },
      ],
    },
    isStockRestored: {
      type: Boolean,
      default: false,
    },
    shippingAddress: {
      recipientName: String,
      fullName: String,
      email: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    trackingTimeline: [
      {
        stage: String,
        description: String,
        timestamp: { type: Date, default: Date.now },
        completed: { type: Boolean, default: false },
      },
    ],
    mysteryCoupon: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rewardApplied: {
      rewardType: { type: String, enum: ['COUPON', 'FREE_TRIO'] },
      code: String,
      discountAmount: Number,
      description: String,
    },
    stampNumber: {
      type: Number,
      default: null,
    },
    isPostRitualOrder: {
      type: Boolean,
      default: false,
    },
    showLoyaltyCard: {
      type: Boolean,
      default: false,
    },
    milestoneGift: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    complimentaryGifts: [
      {
        name: String,
        subtitle: String,
        image: String,
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        reason: String,
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrderSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

OrderSchema.virtual('status')
  .get(function () {
    return this.fulfillmentStatus;
  })
  .set(function (val) {
    this.fulfillmentStatus = val;
  });

OrderSchema.pre('save', function (next) {
  if (!this.orderId && this.orderNumber) this.orderId = this.orderNumber;
  if (!this.orderNumber && this.orderId) this.orderNumber = this.orderId;
  if (!this.customerId && this.customer) this.customerId = this.customer;
  if (!this.customer && this.customerId) this.customer = this.customerId;
  if (!this.grandTotal && this.totalAmount) this.grandTotal = this.totalAmount;
  if (!this.totalAmount && this.grandTotal) this.totalAmount = this.grandTotal;
  if (!this.discountTotal && this.discountAmount) this.discountTotal = this.discountAmount;
  if (!this.discountAmount && this.discountTotal) this.discountAmount = this.discountTotal;

  // Sync shippingDetails <-> shipping sub-documents
  if (this.shippingDetails) {
    if (!this.shipping) this.shipping = {};
    if (this.shippingDetails.awbCode) {
      this.shipping.awb = this.shippingDetails.awbCode;
      this.shipping.awbNumber = this.shippingDetails.awbCode;
    }
    if (this.shippingDetails.courierName) {
      this.shipping.courier = this.shippingDetails.courierName;
      this.shipping.courierName = this.shippingDetails.courierName;
    }
    if (this.shippingDetails.trackingUrl) {
      this.shipping.trackingUrl = this.shippingDetails.trackingUrl;
    }
  }

  next();
});

module.exports = mongoose.model('Order', OrderSchema);
