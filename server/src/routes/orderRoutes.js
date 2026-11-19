const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const adminOps = require('../controllers/adminOperationsController');
const d2cAdmin = require('../controllers/d2cAdminController');
const { verifyAuth, optionalAuth, requireAdmin, adminOrDev } = require('../middleware/authMiddleware');

router.post('/checkout', optionalAuth, orderController.createCheckoutSession);
router.post('/checkout-session', optionalAuth, orderController.createCheckoutSession);
router.post('/webhook', orderController.handleWebhook);
router.get('/customer/history', verifyAuth, orderController.getUserOrders);

// Admin Order Management & Metrics
router.get('/admin/dashboard-stats', adminOrDev, d2cAdmin.getAdminDashboardStats);
router.get('/admin/all', adminOrDev, orderController.getAllOrdersAdmin);
router.get('/admin/orders', adminOrDev, orderController.getAllOrdersAdmin);
router.put('/admin/:id/status', adminOrDev, orderController.updateOrderStatusAdmin);
router.put('/admin/orders/:id/status', adminOrDev, orderController.updateOrderStatusAdmin);
router.get('/admin/stats', adminOrDev, orderController.getAdminStats);

// Extended Administrative Operations (Curing, Labels, GST Invoicing, AI Oversight, Audit, Promotions)
router.get('/admin/curing-batches', adminOrDev, adminOps.getCuringBatches);
router.post('/admin/curing-batches', adminOrDev, adminOps.createBatch);
router.put('/admin/curing-batches/:batchId/status', adminOrDev, adminOps.updateBatchQC);
router.put('/admin/curing-batches/:batchCode/hold', adminOrDev, adminOps.holdBatch);

router.get('/admin/audit-logs', adminOrDev, adminOps.getAdminAuditLogs);
router.post('/admin/orders/:id/generate-shipping-label', adminOrDev, adminOps.generateCourierLabel);
router.get('/admin/orders/:id/invoice', adminOrDev, adminOps.generateGstInvoiceData);

router.get('/admin/ai-analytics', adminOrDev, adminOps.getSamCopilotMetrics);
router.post('/admin/promotions', adminOrDev, adminOps.createDiscountRule);

// D2C Skincare & Formulation Admin Portal Endpoints
router.get('/admin/d2c/analytics', adminOrDev, d2cAdmin.getDashboardAnalytics);
router.get('/admin/d2c/watchlist', adminOrDev, d2cAdmin.getBatchExpiryWatchlist);
router.post('/admin/d2c/write-off', adminOrDev, d2cAdmin.writeOffBatch);
router.get('/admin/d2c/quiz-rules', adminOrDev, d2cAdmin.getQuizRules);
router.post('/admin/d2c/quiz-rules', adminOrDev, d2cAdmin.createOrUpdateQuizRule);
router.delete('/admin/d2c/quiz-rules/:id', adminOrDev, d2cAdmin.deleteQuizRule);

router.get('/:id', optionalAuth, orderController.getOrderById);

module.exports = router;
