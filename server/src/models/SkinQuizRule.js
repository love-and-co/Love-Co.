const mongoose = require('mongoose');

const skinQuizRuleSchema = new mongoose.Schema(
  {
    concern: {
      type: String,
      required: true,
      enum: [
        'Acne',
        'Pigmentation',
        'Aging',
        'Barrier Repair',
        'Oil Control',
        'Dryness & Dehydration',
        'Redness & Sensitivity',
        'Enlarged Pores',
      ],
      index: true,
    },
    skinType: {
      type: String,
      required: true,
      enum: ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'],
      index: true,
    },
    recommendedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    recommendedRoutine: {
      am: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      pm: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
    },
    adviceHeadline: {
      type: String,
      default: '',
    },
    activeContraindicationWarnings: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SkinQuizRule', skinQuizRuleSchema);

