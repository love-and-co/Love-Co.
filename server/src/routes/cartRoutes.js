const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/validate-bundle', cartController.validateBundle);
router.post('/bundle', cartController.validateBundle); // Alias from spec
router.post('/reserve-stock', cartController.reserveStock);
router.post('/release-stock', cartController.releaseStock);

module.exports = router;
