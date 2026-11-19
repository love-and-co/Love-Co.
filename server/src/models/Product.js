const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    handle: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    activesConcentration: {
      type: String,
      default: '',
    },
    keyActives: [
      {
        name: { type: String },
        percentage: { type: String },
        purpose: { type: String },
      },
    ],
    activeIngredients: [
      {
        name: { type: String, default: '' },
        percentage: { type: String, default: '' },
        function: { type: String, default: '' },
      },
    ],
    routineStep: {
      type: String,
      enum: ['Cleanse', 'Treat', 'Moisturize', 'Sunscreen'],
      default: 'Treat',
    },
    usageTime: {
      type: String,
      enum: ['AM', 'PM', 'Both'],
      default: 'Both',
    },
    contraindications: [{ type: String }],
    costPrice: {
      type: Number,
      default: 0,
    },
    discountPrice: {
      type: Number,
    },
    gstRate: {
      type: Number,
      enum: [0, 5, 12, 18],
      default: 18,
    },
    batches: [
      {
        batchNumber: { type: String, required: true },
        mfgDate: { type: Date, required: true },
        expDate: { type: Date, required: true },
        stockQuantity: { type: Number, required: true, default: 0 },
        reservedQuantity: { type: Number, default: 0 },
        isWrittenOff: { type: Boolean, default: false },
        previousStockQuantity: { type: Number, default: 0 },
        status: { type: String, default: 'ACTIVE' },
      },
    ],
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    concernsHandled: [
      {
        type: String,
        index: true,
      },
    ],
    concerns: [
      {
        type: String,
        index: true,
      },
    ],
    skinTypes: [
      {
        type: String,
        default: ['All'],
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    stockQty: {
      type: Number,
      default: 50,
      min: 0,
    },
    stock: {
      type: Number,
      default: 50,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT', 'ARCHIVED', 'OUT_OF_STOCK'],
      default: 'ACTIVE',
    },
    phRange: {
      type: String,
      default: '5.5 - 6.0',
    },
    volumeWeight: {
      type: String,
      default: '100g',
    },
    variants: [
      {
        size: { type: String },
        price: { type: Number },
        mrp: { type: Number },
        inStock: { type: Boolean, default: true },
      },
    ],
    keyIngredientsDetail: [
      {
        name: { type: String },
        role: { type: String },
      },
    ],
    productDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    inciIngredients: [
      {
        type: String,
      },
    ],
    fullIngredientsList: {
      type: String,
    },
    phLevel: {
      type: String,
      default: '5.5',
    },
    curingPeriodDays: {
      type: Number,
      default: 0,
    },
    batchNumber: {
      type: String,
      default: 'LOT-2026-CP1',
    },
    isFragranceFree: {
      type: Boolean,
      default: true,
    },
    isVegan: {
      type: Boolean,
      default: true,
    },
    usageInstructions: {
      routineTime: {
        type: String,
        enum: ['AM', 'PM', 'AM_PM'],
        default: 'AM_PM',
      },
      directions: { type: String },
    },
    contraindications: [
      {
        type: String,
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    ratings: {
      average: { type: Number, default: 4.8 },
      count: { type: Number, default: 42 },
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isNewLaunch: {
      type: Boolean,
      default: false,
    },
    reviews: [
      {
        author: { type: String, required: true },
        role: { type: String, default: 'Verified Buyer' },
        rating: { type: Number, default: 5 },
        date: { type: String },
        concern: { type: String },
        title: { type: String },
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id string
ProductSchema.virtual('id').get(function () {
  return this._id ? this._id.toHexString() : undefined;
});

// Virtuals to ensure compatibility between spec aliases
ProductSchema.pre('save', function (next) {
  if (!this.handle && this.slug) this.handle = this.slug;
  if (!this.slug && this.handle) this.slug = this.handle;
  if (!this.title && this.name) this.title = this.name;
  if (!this.name && this.title) this.name = this.title;
  if (this.stock !== undefined && this.stock !== null) {
    this.stockQty = Number(this.stock);
  } else if (this.stockQty !== undefined && this.stockQty !== null) {
    this.stock = Number(this.stockQty);
  }
  if (!this.phRange && this.phLevel) this.phRange = this.phLevel;
  if (!this.phLevel && this.phRange) this.phLevel = this.phRange;
  if (this.stockQty <= 0) {
    this.status = 'OUT_OF_STOCK';
  } else if (!this.status || this.status === 'OUT_OF_STOCK') {
    this.status = 'ACTIVE';
  }
  if (!this.concerns || this.concerns.length === 0) {
    this.concerns = this.concernsHandled;
  }
  if (!this.concernsHandled || this.concernsHandled.length === 0) {
    this.concernsHandled = this.concerns;
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
