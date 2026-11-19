const mongoose = require('mongoose');

const MysteryCouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 5,
    max: 20,
  },
  maxDiscount: {
    type: Number,
    default: 250,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  revealed: {
    type: Boolean,
    default: false,
  },
  sourceOrderId: {
    type: mongoose.Schema.Types.Mixed,
  },
  usedAt: {
    type: Date,
  },
  usedInOrderId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const LoyaltySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    ritualStamps: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    isRitualCompleted: {
      type: Boolean,
      default: false,
    },
    stampedOrderIds: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    freeTrioUnlocked: {
      type: Boolean,
      default: false,
    },
    completedCycles: {
      type: Number,
      default: 0,
    },
    mysteryCoupons: [MysteryCouponSchema],
  },
  { timestamps: true }
);

LoyaltySchema.pre('save', function (next) {
  if (this.userId && !this.user) {
    this.user = this.userId;
  } else if (this.user && !this.userId) {
    this.userId = this.user;
  }
  next();
});

// Helper method to retrieve or auto-initialize loyalty record with atomic upsert
LoyaltySchema.statics.getOrCreate = async function (userId) {
  if (!userId) return null;
  const uid = userId._id || userId.id || userId;
  let loyalty = await this.findOneAndUpdate(
    { $or: [{ userId: uid }, { user: uid }] },
    {
      $setOnInsert: {
        userId: uid,
        user: uid,
        ritualStamps: 0,
        isRitualCompleted: false,
        stampedOrderIds: [],
        freeTrioUnlocked: false,
        completedCycles: 0,
        mysteryCoupons: [],
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return loyalty;
};

module.exports = mongoose.model('Loyalty', LoyaltySchema);
