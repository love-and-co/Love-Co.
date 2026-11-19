const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const wishlistController = require('../controllers/wishlistController');

// All wishlist operations strictly require user authentication
router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;
