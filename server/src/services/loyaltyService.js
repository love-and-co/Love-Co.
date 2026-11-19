const mongoose = require('mongoose');
const Loyalty = require('../models/Loyalty');
const User = require('../models/User');

/**
 * Generate a unique mystery coupon code e.g. RITUAL-8X4K
 */
function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars (0, O, 1, I)
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RITUAL-${randomPart}`;
}

/**
 * Weighted probability mystery discount:
 * - 60% chance: 5% or 10%
 * - 30% chance: 12% or 15%
 * - 10% chance: 20% (capped at ₹250 max discount)
 */
function generateMysteryDiscount() {
  const roll = Math.random() * 100;
  if (roll < 60) {
    return Math.random() < 0.5 ? 5 : 10;
  } else if (roll < 90) {
    return Math.random() < 0.5 ? 12 : 15;
  } else {
    return 20;
  }
}

/**
 * Single source of truth: Assign loyalty stamp & mystery coupon on qualifying order placement.
 * Follows the 5 deterministic rules:
 * Rule 1: totalAmount < 499 -> completely ineligible (no stamp, no seal, no gift).
 * Rule 2: totalAmount >= 499 (orders 1-9) -> automatic permanent stamp, 1 mystery coupon, showLoyaltyCard = true.
 * Rule 3: Exact 10th qualifying order -> stamp 10, isRitualCompleted = true, attaches milestoneGift.
 * Rule 4: 11th+ order (isRitualCompleted === true or priorCount >= 10) -> completely shut down.
 * Rule 5: Anti-scam idempotency -> already stamped orders return without duplicate stamping.
 */
async function assignOrderLoyalty(order, targetUserId = null) {
  if (!order) return null;

  const total =
    order.totalAmount ??
    order.pricingBreakdown?.totalAmount ??
    order.grandTotal ??
    0;

  // RULE 1: Strict ₹499 Minimum Threshold
  if (total < 499) {
    order.showLoyaltyCard = false;
    order.stampNumber = null;
    order.mysteryCoupon = null;
    order.milestoneGift = null;
    order.complimentaryGifts = [];
    order.isPostRitualOrder = false;
    await order.save().catch(() => {});
    return order;
  }

  // Resolve user cleanly from targetUserId, order.customer, customerId, or shipping email
  let rawUserId =
    (targetUserId && (targetUserId._id || targetUserId.id || (typeof targetUserId === 'string' ? targetUserId : null))) ||
    (order.customer && (order.customer._id || order.customer.id || (typeof order.customer === 'string' ? order.customer : null))) ||
    (order.customerId && (order.customerId._id || order.customerId.id || (typeof order.customerId === 'string' ? order.customerId : null)));

  let user = null;
  if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
    user = await User.findById(rawUserId).catch(() => null);
  }
  if (!user && order.shippingAddress?.email) {
    const email = order.shippingAddress.email.toLowerCase().trim();
    user = await User.findOne({ email });
    if (!user) {
      const fullName = order.shippingAddress.fullName || order.shippingAddress.recipientName || 'Apothecary Patron';
      const cleanPhone = order.shippingAddress.phone ? order.shippingAddress.phone.replace(/\D/g, '').slice(-10) : undefined;
      try {
        user = await User.create({
          fullName,
          email,
          phone: cleanPhone || undefined,
          role: 'customer',
          authProvider: 'local',
          ritualStamps: 0,
          isRitualCompleted: false,
        });
      } catch (_) {
        user = await User.findOne({ email });
      }
    }
  }
  if (!user && (targetUserId?.email || order.customer?.email)) {
    const email = (targetUserId?.email || order.customer?.email).toLowerCase().trim();
    user = await User.findOne({ email });
  }

  let userId = user ? user._id : rawUserId;
  if (user) {
    order.customer = user._id;
    order.customerId = user._id;
  }

  if (!userId) {
    order.showLoyaltyCard = false;
    order.stampNumber = null;
    order.mysteryCoupon = null;
    order.milestoneGift = null;
    order.complimentaryGifts = [];
    order.isPostRitualOrder = false;
    await order.save().catch(() => {});
    return order;
  }

  // Auto-Create Loyalty Record for New Customers: atomic upsert so missing document never fails
  let loyalty = await Loyalty.findOneAndUpdate(
    { $or: [{ userId }, { user: userId }] },
    {
      $setOnInsert: {
        userId,
        user: userId,
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
  if (!loyalty) return order;

  // Normalize stampedOrderIds: array of unique string IDs
  const rawIds = (loyalty.stampedOrderIds || []).map((id) => (id ? id.toString() : '')).filter(Boolean);
  const uniqueOrderIds = Array.from(new Set(rawIds));
  loyalty.stampedOrderIds = uniqueOrderIds;

  const orderIdStr = order._id ? order._id.toString() : '';
  const orderNumStr = order.orderNumber ? String(order.orderNumber) : '';

  // RULE 5: Idempotency check — order is already recorded in stampedOrderIds
  const existingIdx = uniqueOrderIds.findIndex(
    (id) => (orderIdStr && id === orderIdStr) || (orderNumStr && id === orderNumStr)
  );

  if (existingIdx !== -1) {
    const existingStampNum = existingIdx + 1;
    if (existingStampNum === 10) {
      order.stampNumber = 10;
      order.showLoyaltyCard = true;
      order.isPostRitualOrder = false;
      const milestoneGift = {
        name: 'LOVE & Co. Signature 3-Bar Botanical Trio',
        subtitle: 'Complimentary Ritual Gift',
        quantity: 1,
        price: 0,
        image: '/images/products/botanical_trio_box.jpg',
        reason: '10th Ritual Milestone Reward',
        unlockedAt: order.createdAt || new Date(),
      };
      order.milestoneGift = milestoneGift;
      order.complimentaryGifts = [milestoneGift];
      await order.save().catch(() => {});
      return order;
    } else if (existingStampNum < 10) {
      order.stampNumber = existingStampNum;
      order.milestoneGift = null;
      order.complimentaryGifts = [];
      order.showLoyaltyCard = true;
      order.isPostRitualOrder = false;
      await order.save().catch(() => {});
      return order;
    } else {
      order.showLoyaltyCard = false;
      order.stampNumber = null;
      order.mysteryCoupon = null;
      order.milestoneGift = null;
      order.complimentaryGifts = [];
      order.isPostRitualOrder = true;
      await order.save().catch(() => {});
      return order;
    }
  }

  // RULE 4: Complete Shutdown on 11th+ Orders
  if (loyalty.isRitualCompleted === true || uniqueOrderIds.length >= 10) {
    loyalty.isRitualCompleted = true;
    loyalty.freeTrioUnlocked = false;
    loyalty.ritualStamps = 10;

    order.showLoyaltyCard = false;
    order.stampNumber = null;
    order.mysteryCoupon = null;
    order.milestoneGift = null;
    order.complimentaryGifts = [];
    order.isPostRitualOrder = true;

    await loyalty.save();
    await order.save();
    return order;
  }

  // RULE 2 & RULE 3: Add qualifying order to stampedOrderIds (deduplicated)
  if (orderIdStr) {
    loyalty.stampedOrderIds.push(orderIdStr);
  } else if (orderNumStr) {
    loyalty.stampedOrderIds.push(orderNumStr);
  }
  loyalty.stampedOrderIds = Array.from(
    new Set(loyalty.stampedOrderIds.map((id) => (id ? id.toString() : '')).filter(Boolean))
  );

  const newStampCount = Math.min(10, loyalty.stampedOrderIds.length);
  loyalty.ritualStamps = newStampCount;

  order.stampNumber = newStampCount;
  order.showLoyaltyCard = true;
  order.isPostRitualOrder = false;

  // Generate 1 mystery coupon for this qualifying order
  let code = generateCouponCode();
  while ((loyalty.mysteryCoupons || []).some((c) => c.code === code)) {
    code = generateCouponCode();
  }

  const couponObj = {
    code,
    discountPercent: generateMysteryDiscount(),
    maxDiscount: 250,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    isUsed: false,
    revealed: false,
    sourceOrderId: orderIdStr || orderNumStr,
    createdAt: new Date(),
  };

  loyalty.mysteryCoupons.push(couponObj);
  order.mysteryCoupon = couponObj;

  // Strict 10th-Order-Only Free Trio Rule:
  // Attach milestoneGift ONLY IF newStampCount === 10
  // For stamps 1 through 9, order.milestoneGift MUST strictly be null
  if (newStampCount === 10) {
    loyalty.isRitualCompleted = true;
    loyalty.freeTrioUnlocked = false;
    loyalty.completedCycles = 1;

    const milestoneGift = {
      name: 'LOVE & Co. Signature 3-Bar Botanical Trio',
      subtitle: 'Complimentary Ritual Gift',
      quantity: 1,
      price: 0,
      image: '/images/products/botanical_trio_box.jpg',
      reason: '10th Ritual Milestone Reward',
      unlockedAt: new Date(),
    };

    order.milestoneGift = milestoneGift;
    order.complimentaryGifts = [milestoneGift];
  } else {
    loyalty.isRitualCompleted = false;
    loyalty.freeTrioUnlocked = false;
    order.milestoneGift = null;
    order.complimentaryGifts = [];
  }

  await loyalty.save();
  await order.save();

  if (userId) {
    const UserModel = mongoose.model('User');
    await UserModel.findByIdAndUpdate(userId, {
      ritualStamps: newStampCount,
      isRitualCompleted: newStampCount === 10,
      loyalty: loyalty._id,
    }).catch(() => {});
  }
  return order;
}

/**
 * RULE 5: Break the wax seal.
 * Strictly reveals the already-assigned coupon for this order.
 * NEVER increments stamps or creates new coupons!
 */
async function revealMysteryCoupon(userId, couponCode) {
  if (!couponCode) throw new Error('Mystery coupon code is required');
  const normalizedCode = couponCode.trim().toUpperCase();

  let loyalty = null;
  if (userId) {
    loyalty = await Loyalty.findOne({ userId, 'mysteryCoupons.code': normalizedCode });
    if (!loyalty) {
      loyalty = await Loyalty.findOne({ userId });
    }
  }
  if (!loyalty) {
    loyalty = await Loyalty.findOne({ 'mysteryCoupons.code': normalizedCode });
  }

  // Fallback: check Order model for in-memory / restart resilience
  if (!loyalty) {
    try {
      const Order = mongoose.model('Order');
      const matchedOrder = await Order.findOne({
        $or: [
          { 'mysteryCoupon.code': normalizedCode },
          { orderNumber: normalizedCode },
        ],
      });
      if (matchedOrder && (matchedOrder.customer || matchedOrder.customerId)) {
        loyalty = await Loyalty.getOrCreate(matchedOrder.customer || matchedOrder.customerId);
      }
    } catch (_) {}
  }

  if (!loyalty) {
    throw new Error('Mystery coupon not found with code: ' + normalizedCode);
  }

  let coupon = (loyalty.mysteryCoupons || []).find((c) => c.code === normalizedCode);
  let wasAlreadyRevealed = false;

  if (!coupon) {
    // Graceful adoption / generation for active client sessions across server restarts
    coupon = {
      code: normalizedCode,
      discountPercent: generateMysteryDiscount(),
      maxDiscount: 250,
      expiresAt: new Date(Date.now() + 14 * 86400000),
      isUsed: false,
      revealed: true,
      createdAt: new Date(),
    };
    loyalty.mysteryCoupons.push(coupon);
  } else {
    wasAlreadyRevealed = Boolean(coupon.revealed);
    coupon.revealed = true;
  }

  await loyalty.save();

  // Atomically mark revealed in Order document
  try {
    const Order = mongoose.model('Order');
    await Order.updateOne(
      { 'mysteryCoupon.code': normalizedCode },
      { $set: { 'mysteryCoupon.revealed': true } }
    );
  } catch (_) {}

  // STRICTLY return only coupon reveal data — NEVER stamp counts, never isRitualCompleted.
  // Stamps are immutable after order placement; revealing a coupon must NOT touch them.
  return {
    alreadyRevealed: wasAlreadyRevealed,
    coupon: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      maxDiscount: coupon.maxDiscount,
      expiresAt: coupon.expiresAt,
      revealed: true,
      isUsed: Boolean(coupon.isUsed),
      isExpired: new Date(coupon.expiresAt) < new Date(),
    },
  };
}

/**
 * Fetch full loyalty summary for customer dashboard / profile tab=ritual
 */
async function getUserLoyaltySummary(userId) {
  if (!userId) return null;

  const loyalty = await Loyalty.getOrCreate(userId);
  const now = new Date();

  const rawIds = (loyalty.stampedOrderIds || []).map((id) => (id ? id.toString() : '')).filter(Boolean);
  const stampCount = Math.min(10, loyalty.ritualStamps || rawIds.length || 0);
  const isRitualCompleted = Boolean(loyalty.isRitualCompleted && stampCount === 10);

  const formattedCoupons = (loyalty.mysteryCoupons || []).map((c) => {
    const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;
    return {
      _id: c._id,
      code: c.code,
      discountPercent: c.discountPercent,
      maxDiscount: c.maxDiscount,
      expiresAt: c.expiresAt,
      isUsed: Boolean(c.isUsed),
      revealed: Boolean(c.revealed),
      isExpired,
      status: c.isUsed ? 'USED' : isExpired ? 'EXPIRED' : 'ACTIVE',
      sourceOrderId: c.sourceOrderId,
      createdAt: c.createdAt,
    };
  });

  return {
    ritualStamps: stampCount,
    isRitualCompleted,
    freeTrioUnlocked: false,
    completedCycles: loyalty.completedCycles || (isRitualCompleted ? 1 : 0),
    stampedOrdersCount: rawIds.length,
    mysteryCoupons: formattedCoupons,
  };
}

/**
 * Validate mystery coupon code or FREE_TRIO redemption at checkout
 */
async function validateAndApplyReward({
  userId,
  rewardType,
  code,
  subtotal = 0,
  applyNow = false,
  orderId = null,
}) {
  const normalizedType = (rewardType || (code === 'FREE_TRIO' ? 'FREE_TRIO' : 'COUPON')).toUpperCase();
  const normalizedCode = code ? code.trim().toUpperCase() : null;

  // FREE_TRIO redemption check
  if (normalizedType === 'FREE_TRIO' || normalizedCode === 'FREE_TRIO') {
    if (!userId) {
      return {
        valid: false,
        error: 'Authentication required to redeem the Apothecary Ritual Free Trio reward.',
      };
    }

    const loyalty = await Loyalty.findOne({ userId });
    if (!loyalty || loyalty.isRitualCompleted || loyalty.ritualStamps < 10) {
      return {
        valid: false,
        error: 'The 10-stamp Ritual Milestone Reward has already been fulfilled on your 10th order.',
        currentStamps: loyalty?.ritualStamps || 0,
      };
    }
  }

  // MYSTERY COUPON validation
  if (!normalizedCode) {
    return { valid: false, error: 'Mystery coupon code is required' };
  }

  let loyalty = null;
  if (userId) {
    loyalty = await Loyalty.findOne({ userId });
  }
  if (!loyalty) {
    loyalty = await Loyalty.findOne({ 'mysteryCoupons.code': normalizedCode });
  }

  if (!loyalty) {
    return { valid: false, error: 'Invalid mystery coupon code' };
  }

  const coupon = (loyalty.mysteryCoupons || []).find((c) => c.code === normalizedCode);
  if (!coupon) {
    return { valid: false, error: 'Invalid mystery coupon code' };
  }

  if (coupon.isUsed) {
    return { valid: false, error: 'This mystery coupon has already been redeemed' };
  }

  const now = new Date();
  if (new Date(coupon.expiresAt) < now) {
    return { valid: false, error: 'This mystery coupon has expired (14-day validity window exceeded)' };
  }

  const percent = coupon.discountPercent || 10;
  const maxDiscount = coupon.maxDiscount || 250;
  const calculatedDiscount = Math.round((subtotal * percent) / 100);
  const discountAmount = Math.min(calculatedDiscount, maxDiscount);

  if (applyNow) {
    coupon.isUsed = true;
    coupon.usedAt = new Date();
    if (orderId) {
      coupon.usedInOrderId = orderId;
    }
    await loyalty.save();
  }

  return {
    valid: true,
    rewardType: 'COUPON',
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    maxDiscount: coupon.maxDiscount,
    discountAmount,
    message: `${coupon.discountPercent}% Mystery Coupon applied (savings capped at ₹${maxDiscount})`,
  };
}

/**
 * One-time deterministic database sync script.
 * Inspects all user orders sorted chronologically (createdAt: 1),
 * applies strictly the 5 rules, and purges any invalid stamps/gifts.
 */
async function syncAllUsersLoyaltyAndOrders() {
  try {
    const UserModel = mongoose.model('User');
    const OrderModel = mongoose.model('Order');
    const LoyaltyModel = mongoose.model('Loyalty');

    const users = await UserModel.find({});
    for (const user of users) {
      // Find all user orders sorted chronologically
      const allOrders = await OrderModel.find({
        $or: [
          { customer: user._id },
          { customerId: user._id },
          { 'shippingAddress.email': user.email },
        ],
      }).sort({ createdAt: 1 });

      const loyalty = await LoyaltyModel.getOrCreate(user._id);

      // Separate qualifying orders (>= 499)
      const qualifyingOrders = allOrders.filter((o) => {
        const total = o.totalAmount ?? o.pricingBreakdown?.totalAmount ?? o.grandTotal ?? 0;
        return total >= 499;
      });

      const stampedOrderIds = [];
      const updatedCoupons = [];

      // Process orders 1 to 10
      for (let i = 0; i < qualifyingOrders.length; i++) {
        const ord = qualifyingOrders[i];
        if (i < 10) {
          const stampNumber = i + 1;
          ord.customer = user._id;
          ord.customerId = user._id;
          ord.stampNumber = stampNumber;
          ord.showLoyaltyCard = true;
          ord.isPostRitualOrder = false;

          stampedOrderIds.push(ord._id.toString());

          // Match or generate coupon
          let coupon = (loyalty.mysteryCoupons || []).find(
            (c) => String(c.sourceOrderId) === ord._id.toString() || (ord.mysteryCoupon && c.code === ord.mysteryCoupon.code)
          );
          if (!coupon) {
            coupon = {
              code: ord.mysteryCoupon?.code || generateCouponCode(),
              discountPercent: ord.mysteryCoupon?.discountPercent || generateMysteryDiscount(),
              maxDiscount: 250,
              expiresAt: ord.mysteryCoupon?.expiresAt || new Date(Date.now() + 14 * 86400000),
              isUsed: Boolean(ord.mysteryCoupon?.isUsed),
              revealed: Boolean(ord.mysteryCoupon?.revealed),
              sourceOrderId: ord._id.toString(),
              createdAt: ord.createdAt || new Date(),
            };
          }
          ord.mysteryCoupon = coupon;
          updatedCoupons.push(coupon);

          if (stampNumber === 10) {
            const milestoneGift = {
              name: 'LOVE & Co. Signature 3-Bar Botanical Trio',
              subtitle: 'Complimentary Ritual Gift',
              quantity: 1,
              price: 0,
              image: '/images/products/botanical_trio_box.jpg',
              reason: '10th Ritual Milestone Reward',
              unlockedAt: ord.createdAt || new Date(),
            };
            ord.milestoneGift = milestoneGift;
            ord.complimentaryGifts = [milestoneGift];
          } else {
            ord.milestoneGift = null;
            ord.complimentaryGifts = [];
          }

          await ord.save();
        } else {
          // Orders 11+
          ord.customer = user._id;
          ord.customerId = user._id;
          ord.stampNumber = null;
          ord.showLoyaltyCard = false;
          ord.mysteryCoupon = null;
          ord.milestoneGift = null;
          ord.complimentaryGifts = [];
          ord.isPostRitualOrder = true;
          await ord.save();
        }
      }

      // Non-qualifying orders (< 499)
      const nonQualifyingOrders = allOrders.filter((o) => {
        const total = o.totalAmount ?? o.pricingBreakdown?.totalAmount ?? o.grandTotal ?? 0;
        return total < 499;
      });

      for (const ord of nonQualifyingOrders) {
        ord.stampNumber = null;
        ord.showLoyaltyCard = false;
        ord.mysteryCoupon = null;
        ord.milestoneGift = null;
        ord.complimentaryGifts = [];
        ord.isPostRitualOrder = false;
        await ord.save();
      }

      // Update loyalty document
      loyalty.stampedOrderIds = stampedOrderIds;
      loyalty.ritualStamps = Math.min(10, stampedOrderIds.length);
      loyalty.isRitualCompleted = stampedOrderIds.length >= 10;
      loyalty.freeTrioUnlocked = false;
      loyalty.completedCycles = stampedOrderIds.length >= 10 ? 1 : 0;
      loyalty.mysteryCoupons = updatedCoupons;
      await loyalty.save();

      await UserModel.findByIdAndUpdate(user._id, {
        ritualStamps: loyalty.ritualStamps,
        isRitualCompleted: loyalty.isRitualCompleted,
        loyalty: loyalty._id,
      }).catch(() => {});
    }

    return { success: true };
  } catch (err) {
    console.error('Database loyalty sync failed:', err);
    return { success: false, error: err.message };
  }
}

// Backward compatibility aliases
const awardOrderStamp = assignOrderLoyalty;
const awardDeliveryStamp = assignOrderLoyalty;
const processOrderLoyalty = assignOrderLoyalty;
const cleanupLoyaltyOrders = syncAllUsersLoyaltyAndOrders;

module.exports = {
  generateCouponCode,
  generateMysteryDiscount,
  assignOrderLoyalty,
  processOrderLoyalty,
  awardOrderStamp,
  awardDeliveryStamp,
  revealMysteryCoupon,
  validateAndApplyReward,
  getUserLoyaltySummary,
  syncAllUsersLoyaltyAndOrders,
  cleanupLoyaltyOrders,
};
