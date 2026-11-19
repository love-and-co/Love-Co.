const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const orderController = require('../controllers/orderController');

// Shiprocket live tracking webhook
router.post('/shiprocket', webhookController.handleShiprocketWebhook);

// Razorpay payment webhooks
router.post('/razorpay', orderController.handleWebhook);

module.exports = router;

