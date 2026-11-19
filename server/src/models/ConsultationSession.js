const mongoose = require('mongoose');

const ConsultationSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    chatHistory: [
      {
        sender: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        text: { type: String, required: true },
        actionPayload: { type: Object },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    diagnosedProfile: {
      skinType: { type: String },
      primaryConcerns: [{ type: String }],
      sensitivities: [{ type: String }],
      contraindications: [{ type: String }],
    },
    recommendedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    recommendedRegimen: {
      am: [{ step: String, product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, notes: String }],
      pm: [{ step: String, product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, notes: String }],
      cautionNotes: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConsultationSession', ConsultationSessionSchema);
