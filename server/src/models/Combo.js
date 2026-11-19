const mongoose = require('mongoose');

const ComboItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  variant: {
    type: String,
    default: '100g Bar',
  },
});

const ComboSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    items: [ComboItemSchema],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      default: 0,
    },
    savingsAmount: {
      type: Number,
      default: 0,
    },
    savingsPercent: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 25,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    ritualBenefits: [{ type: String }],
    badge: {
      type: String,
      default: 'Curated Ritual',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Combo', ComboSchema);
