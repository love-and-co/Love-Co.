const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const d2cAdmin = require('../controllers/d2cAdminController');
const adminOps = require('../controllers/adminOperationsController');
const settingsController = require('../controllers/settingsController');
const flagshipAdmin = require('../controllers/flagshipAdminController');
const { adminOrDev } = require('../middleware/authMiddleware');

// 1. Storefront Operational Status & Pause Modal
router.get('/store-status', adminOrDev, flagshipAdmin.getStoreStatus);
router.put('/store-status', adminOrDev, flagshipAdmin.updateStoreStatus);

// 2. Page 1: Operations Command Center
router.get('/operations/kpis', adminOrDev, flagshipAdmin.getOperationsKpis);
router.get('/operations/queue', adminOrDev, flagshipAdmin.getOperationsQueue);
router.put('/orders/:id/pack', adminOrDev, flagshipAdmin.markOrderPacked);
router.put('/orders/:id/dispatch', adminOrDev, flagshipAdmin.dispatchOrderWithCourier);
router.post('/orders/:id/cancel', adminOrDev, flagshipAdmin.cancelOrderWithStockRollback);

// 3. Page 2: Orders & Dispatch Hub
router.get('/orders', adminOrDev, orderController.getAllOrdersAdmin);
router.get('/orders/all', adminOrDev, orderController.getAllOrdersAdmin);
router.put('/orders/:id/status', adminOrDev, orderController.updateOrderStatusAdmin);
router.post('/orders/:id/ship', adminOrDev, orderController.pushOrderToShiprocket);
router.post('/orders/:id/shiprocket/push', adminOrDev, orderController.pushOrderToShiprocket);
router.post('/orders/:id/shiprocket/sync', adminOrDev, orderController.syncOrderWithShiprocket);
router.post('/orders/:id/refund', adminOrDev, orderController.refundOrderViaRazorpay);
router.post('/orders/:id/generate-shipping-label', adminOrDev, adminOps.generateCourierLabel);
router.get('/orders/:id/invoice', adminOrDev, adminOps.generateGstInvoiceData);

// 4. Pages 3 & 4: Live Inventory & Catalog Studio
router.get('/products', adminOrDev, productController.getProducts);
router.post('/products', adminOrDev, productController.createProduct);
router.put('/products/:id', adminOrDev, productController.updateProduct);
router.patch('/products/:id/toggle-stock', adminOrDev, flagshipAdmin.toggleProductStockStatus);
router.patch('/products/:id/quick-price', adminOrDev, flagshipAdmin.quickPriceUpdate);
router.patch('/products/:id/stock', adminOrDev, productController.updateProductStock);
router.put('/products/:id/stock', adminOrDev, productController.updateProductStock);
router.post('/inventory/bulk-restock', adminOrDev, flagshipAdmin.bulkRestockLowInventory);
router.delete('/products/:id', adminOrDev, flagshipAdmin.deleteProductGuarded); // Active order deletion guard

// 5. Page 5: Ritual Bundles & Trios (Combos)
router.get('/combos', adminOrDev, flagshipAdmin.getAllCombos);
router.post('/combos', adminOrDev, flagshipAdmin.createCombo);
router.put('/combos/:id', adminOrDev, flagshipAdmin.updateCombo);
router.delete('/combos/:id', adminOrDev, flagshipAdmin.deleteComboGuarded);

// 6. Page 6: Customer Intelligence & Loyalty CRM
router.get('/customers', adminOrDev, flagshipAdmin.getCustomerIntelligence);
router.get('/customers/:id', adminOrDev, flagshipAdmin.getCustomerDossier);

// 7. Page 7: Financial P&L & Analytics
router.get('/analytics/pnl', adminOrDev, flagshipAdmin.getFinancialPnlAnalytics);
router.get('/analytics/replenishment', adminOrDev, flagshipAdmin.getInventoryReplenishmentWatch);
router.get('/dashboard-stats', adminOrDev, d2cAdmin.getAdminDashboardStats);
router.get('/d2c/analytics', adminOrDev, d2cAdmin.getDashboardAnalytics);
router.get('/stats', adminOrDev, orderController.getAdminStats);

// 8. AI Apothecary Copywriter
router.post('/ai/generate-copy', adminOrDev, flagshipAdmin.generateBotanicalCopy);
router.post('/ai/generate-description', adminOrDev, flagshipAdmin.generateBotanicalCopy);

// Settings, Curing & Batches
router.get('/settings', adminOrDev, settingsController.getStoreSettings);
router.put('/settings', adminOrDev, settingsController.updateStoreSettings);
router.get('/curing-batches', adminOrDev, adminOps.getCuringBatches);
router.post('/curing-batches', adminOrDev, adminOps.createBatch);
router.put('/curing-batches/:batchId/status', adminOrDev, adminOps.updateBatchQC);
router.put('/curing-batches/:batchCode/hold', adminOrDev, adminOps.holdBatch);
router.get('/d2c/watchlist', adminOrDev, d2cAdmin.getBatchExpiryWatchlist);
router.post('/d2c/write-off', adminOrDev, d2cAdmin.writeOffBatch);
router.get('/d2c/quiz-rules', adminOrDev, d2cAdmin.getQuizRules);
router.post('/d2c/quiz-rules', adminOrDev, d2cAdmin.createOrUpdateQuizRule);
router.delete('/d2c/quiz-rules/:id', adminOrDev, d2cAdmin.deleteQuizRule);

module.exports = router;
