const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const flagshipAdmin = require('../controllers/flagshipAdminController');
const { verifyAuth, requireAdmin, adminOrDev } = require('../middleware/authMiddleware');

router.get('/store-status', flagshipAdmin.getStoreStatus);
router.get('/', productController.getProducts);
router.get('/curated/bestsellers', productController.getBestSellers);
router.get('/concerns/list', productController.getConcernsList);

// Admin product & stock mutations
router.patch('/admin/products/:id/stock', adminOrDev, productController.updateProductStock);
router.patch('/:id/stock', adminOrDev, productController.updateProductStock);
router.put('/admin/products/:id/stock', adminOrDev, productController.updateProductStock);
router.put('/:id', adminOrDev, productController.updateProduct);

router.get('/:slug', productController.getProductBySlug);
router.post('/:slug/reviews', productController.addReview);
router.post('/', adminOrDev, productController.createProduct);
router.put('/:id/inventory', adminOrDev, productController.updateInventory);

module.exports = router;
