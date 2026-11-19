const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAuth, optionalAuth } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.get('/me', verifyAuth, authController.getMe);
router.put('/profile', verifyAuth, authController.updateProfile);
router.put('/skin-profile', verifyAuth, authController.updateSkinProfile);
router.post('/address', verifyAuth, authController.addAddress);
router.delete('/address/:addressId', verifyAuth, authController.deleteAddress);

// Mandatory 10-Digit Phone OTP Routes
router.post('/send-phone-otp', optionalAuth, authController.sendPhoneOtp);
router.post('/verify-phone-otp', optionalAuth, authController.verifyPhoneOtp);

// OTP routes: support both /send-otp & /otp/send, /verify-otp & /otp/verify
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/otp/send', authController.sendOtp);
router.post('/otp/verify', authController.verifyOtp);

module.exports = router;
