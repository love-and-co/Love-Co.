const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const flagshipAdmin = require('../controllers/flagshipAdminController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/consultation/message', optionalAuth, aiController.consultSkin);
router.post('/diagnose', optionalAuth, aiController.consultSkin); // Spec alias
router.post('/consultation/regimen-to-cart', optionalAuth, aiController.regimenToCart);
router.post('/bundle-cart', optionalAuth, aiController.regimenToCart); // Spec alias
router.post('/chat', optionalAuth, aiController.chatWithSam); // Sam AI Skincare Copilot
router.post('/generate-description', flagshipAdmin.generateBotanicalCopy);

module.exports = router;
