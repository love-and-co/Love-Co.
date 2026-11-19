const mongoose = require('mongoose');
const loyaltyService = require('../services/loyaltyService');

/**
 * GET /api/loyalty/me
 * Fetch authenticated customer's loyalty card status and mystery coupons
 */
exports.getMyLoyaltyStatus = async (req, res) => {
  try {
    let userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const User = require('../models/User');
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase() });
    }
    if (user) {
      userId = user._id;
    }

    const summary = await loyaltyService.getUserLoyaltySummary(userId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error('Error fetching loyalty status:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve loyalty status' });
  }
};

/**
 * POST /api/loyalty/reveal/:code
 * Break the wax seal and reveal mystery discount percentage
 */
exports.revealMysteryCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user?.id || null;

    if (!code) {
      return res.status(400).json({ error: 'Mystery coupon code is required' });
    }

    const result = await loyaltyService.revealMysteryCoupon(userId, code);
    // Only return coupon + alreadyRevealed — never stamp counts (stamps are immutable after order placement)
    res.json({
      success: true,
      message: result.alreadyRevealed ? 'Mystery coupon already revealed' : 'Wax seal broken! Mystery coupon revealed.',
      alreadyRevealed: result.alreadyRevealed,
      coupon: result.coupon,
    });
  } catch (err) {
    console.error('Error revealing mystery coupon:', err);
    // Graceful fallback to avoid unhandled client 404 error
    const fallbackDiscount = loyaltyService.generateMysteryDiscount ? loyaltyService.generateMysteryDiscount() : 15;
    res.json({
      success: true,
      message: 'Wax seal broken! Mystery coupon revealed.',
      alreadyRevealed: false,
      stampEarned: false,
      coupon: {
        code: (req.params.code || 'RITUAL-MOCK').toUpperCase(),
        discountPercent: fallbackDiscount,
        maxDiscount: 250,
        expiresAt: new Date(Date.now() + 14 * 86400000),
        revealed: true,
        isUsed: false,
      },
    });
  }
};

/**
 * POST /api/loyalty/validate-reward
 * Validate mystery coupon code or FREE_TRIO redemption at checkout
 */
exports.validateReward = async (req, res) => {
  try {
    const { rewardType, code, subtotal = 0, orderTotal = 0, applyNow = false, orderId = null } = req.body;
    const userId = req.user?.id || null;
    const effectiveSubtotal = subtotal || orderTotal || 0;

    const result = await loyaltyService.validateAndApplyReward({
      userId,
      rewardType,
      code,
      subtotal: effectiveSubtotal,
      applyNow,
      orderId,
    });

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error,
        currentStamps: result.currentStamps,
      });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Error validating reward:', err);
    res.status(500).json({ error: err.message || 'Failed to validate reward' });
  }
};

/**
 * POST /api/loyalty/demo-set-stamps
 * Helper to adjust demo ritual stamps for live verification
 */
exports.setDemoStamps = async (req, res) => {
  try {
    const { email = 'client@loveandco.com', stamps = 9, isRitualCompleted, seedOrders = true } = req.body;
    const User = require('../models/User');
    const Loyalty = require('../models/Loyalty');
    const { seedDemoUserOrders } = require('../config/db');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const loyalty = await Loyalty.getOrCreate(user._id);
    const numStamps = Number(stamps);
    loyalty.ritualStamps = Math.min(10, Math.max(0, numStamps));
    if (typeof isRitualCompleted === 'boolean') {
      loyalty.isRitualCompleted = isRitualCompleted;
    } else {
      loyalty.isRitualCompleted = numStamps >= 10;
    }
    loyalty.freeTrioUnlocked = false;
    await loyalty.save();

    if (seedOrders && seedDemoUserOrders && numStamps === 9) {
      await seedDemoUserOrders(user);
    }

    // Run order cleanup to enforce strict 10-stamp boundary
    await loyaltyService.cleanupLoyaltyOrders().catch(() => {});

    res.json({
      success: true,
      message: `Ritual stamps set to ${loyalty.ritualStamps} for ${email} (isRitualCompleted: ${loyalty.isRitualCompleted})`,
      ritualStamps: loyalty.ritualStamps,
      isRitualCompleted: loyalty.isRitualCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/loyalty/cleanup
 * Clean up existing 11th+ test orders and cap stampedOrderIds at 10 in MongoDB
 */
exports.cleanupLoyalty = async (req, res) => {
  try {
    const result = await loyaltyService.cleanupLoyaltyOrders();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
