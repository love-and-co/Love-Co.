const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
const { verifyAuth, optionalAuth } = require('../middleware/authMiddleware');

// Get customer loyalty card stamps, free trio unlock, and mystery coupons
router.get('/me', verifyAuth, loyaltyController.getMyLoyaltyStatus);

// Reveal mystery coupon (breaks wax seal)
router.post('/reveal/:code', optionalAuth, loyaltyController.revealMysteryCoupon);

// Validate mystery coupon or Free Trio reward at checkout
router.post('/validate-reward', optionalAuth, loyaltyController.validateReward);

// Demo stamp setter
router.post('/demo-set-stamps', loyaltyController.setDemoStamps);

// One-time loyalty and order boundary cleanup
router.post('/cleanup', loyaltyController.cleanupLoyalty);

module.exports = router;
