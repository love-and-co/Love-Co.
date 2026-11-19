const mongoose = require('mongoose');

const curingBatchSchema = new mongoose.Schema(
  {
    batchCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    }, // e.g. CUR-2026-901
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
    },
    pourDate: {
      type: Date,
      required: true,
    },
    targetCureDate: {
      type: Date,
      required: true,
    },
    phLevelTested: {
      type: Number,
      default: null,
      min: 0,
      max: 14,
    },
    waterLossPercentage: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['POURED', 'CURING', 'QC_PENDING', 'APPROVED', 'RECALLED', 'ON_HOLD'],
      default: 'CURING',
      index: true,
    },
    testedBy: {
      type: String,
      default: 'Admin',
    },
    coaReference: {
      type: String,
      default: '',
    }, // Certificate of Analysis e.g. COA-AMB-2026-901
    botanicalNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CuringBatch', curingBatchSchema);

