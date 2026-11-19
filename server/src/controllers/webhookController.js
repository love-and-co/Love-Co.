const Order = require('../models/Order');
const Product = require('../models/Product');
const loyaltyService = require('../services/loyaltyService');

/**
 * Helper to roll back reserved stock when an order is cancelled or marked RTO
 */
const rollbackOrderStock = async (order) => {
  if (order.isStockRestored) return;
  try {
    for (const item of order.items || []) {
      const pid = item.product?._id || item.product || item.productId;
      const qty = Number(item.quantity) || 1;
      if (pid) {
        const product = await Product.findById(pid);
        if (product) {
          product.stock = (product.stock || 0) + qty;
          product.stockQty = (product.stockQty || 0) + qty;
          if (product.status === 'OUT_OF_STOCK' && product.stock > 0) {
            product.status = 'ACTIVE';
          }
          await product.save();
        }
      }
    }
    order.isStockRestored = true;
  } catch (err) {
    console.warn('[Webhook] Failed restoring stock on cancellation:', err.message);
  }
};

/**
 * Handle incoming Shiprocket tracking webhooks
 * POST /api/v1/webhooks/shiprocket
 */
exports.handleShiprocketWebhook = async (req, res) => {
  try {
    // 1. Verify webhook security token if configured
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (expectedToken) {
      const receivedToken =
        req.headers['x-api-key'] ||
        req.headers['x-shiprocket-token'] ||
        req.headers['authorization']?.replace(/^Bearer\s+/i, '');

      if (receivedToken && receivedToken !== expectedToken) {
        console.warn('[Shiprocket Webhook] Invalid webhook authentication token received');
        return res.status(401).json({ error: 'Unauthorized: Invalid Shiprocket webhook token' });
      }
    }

    const payload = req.body || {};
    const awb = String(payload.awb || payload.awb_code || payload.tracking_number || '').trim();
    const orderId = String(payload.order_id || payload.orderNumber || '').trim();
    const rawStatus = (payload.current_status || payload.status || '').toUpperCase().trim();

    if (!awb && !orderId) {
      return res.status(400).json({ error: 'Missing AWB or Order ID in webhook payload' });
    }

    // 2. Find matching order in MongoDB
    const query = {
      $or: [
        ...(orderId ? [
          { orderNumber: orderId },
          { orderId: orderId },
          { 'shippingDetails.shiprocketOrderId': orderId },
        ] : []),
        ...(awb ? [
          { 'shippingDetails.awbCode': awb },
          { 'shipping.awb': awb },
          { 'shipping.awbNumber': awb },
          { 'shippingAddress.trackingNumber': awb },
        ] : []),
      ],
    };

    const order = await Order.findOne(query);
    if (!order) {
      console.warn(`[Shiprocket Webhook] No order matched for orderId: ${orderId}, awb: ${awb}`);
      return res.status(404).json({ error: 'No matching order found for tracking webhook' });
    }

    if (!order.shippingDetails) order.shippingDetails = {};
    if (!order.shippingDetails.trackingHistory) order.shippingDetails.trackingHistory = [];
    if (!order.shipping) order.shipping = {};
    if (!order.trackingTimeline) order.trackingTimeline = [];

    // 3. Map status cleanly
    let mappedFulfillment = order.fulfillmentStatus || 'PLACED';
    let mappedShipping = order.shipping?.status || 'UNFULFILLED';
    let courierStatusText = payload.current_status || rawStatus || 'In Transit';
    let description = payload.activity || payload.scans?.[0]?.activity || `Courier status update: ${courierStatusText}`;

    if (rawStatus.includes('PICKED') || rawStatus.includes('TRANSIT') || rawStatus.includes('SHIPPED')) {
      mappedFulfillment = 'SHIPPED';
      mappedShipping = 'DISPATCHED';
      courierStatusText = rawStatus.includes('PICKED') ? 'Picked Up' : 'In Transit';
      description = payload.activity || 'Shipment picked up by courier and in transit.';
    } else if (rawStatus.includes('OUT FOR DELIVERY')) {
      mappedFulfillment = 'OUT_FOR_DELIVERY';
      mappedShipping = 'OUT_FOR_DELIVERY';
      courierStatusText = 'Out for Delivery';
      description = payload.activity || 'Package is out for delivery with local courier agent.';
    } else if (rawStatus.includes('DELIVERED')) {
      mappedFulfillment = 'DELIVERED';
      mappedShipping = 'DELIVERED';
      courierStatusText = 'Delivered';
      description = payload.activity || 'Delivered successfully to recipient.';
    } else if (rawStatus.includes('RTO') || rawStatus.includes('CANCEL')) {
      mappedFulfillment = 'CANCELLED';
      mappedShipping = 'CANCELLED';
      courierStatusText = rawStatus.includes('RTO') ? 'Return to Origin' : 'Cancelled';
      description = payload.activity || 'Order unfulfilled / Return to Origin initiated by courier.';
      await rollbackOrderStock(order);
    }

    order.fulfillmentStatus = mappedFulfillment;
    order.shipping.status = mappedShipping;
    order.shippingDetails.currentCourierStatus = courierStatusText;

    if (payload.courier_name && !order.shippingDetails.courierName) {
      order.shippingDetails.courierName = payload.courier_name;
      order.shipping.courier = payload.courier_name;
    }
    if (awb && !order.shippingDetails.awbCode) {
      order.shippingDetails.awbCode = awb;
      order.shipping.awb = awb;
      order.shipping.awbNumber = awb;
    }

    // 4. Append scan checkpoints to trackingHistory
    const scanTimestamp = payload.date ? new Date(payload.date) : new Date();
    const location = payload.location || payload.city || 'Courier Hub Facility';

    const isDuplicate = order.shippingDetails.trackingHistory.some(
      (h) => h.status === courierStatusText && h.location === location && Math.abs(new Date(h.timestamp) - scanTimestamp) < 60000
    );

    if (!isDuplicate) {
      order.shippingDetails.trackingHistory.push({
        status: courierStatusText,
        location,
        timestamp: scanTimestamp,
        activity: description,
      });

      order.trackingTimeline.push({
        stage: mappedFulfillment,
        description,
        timestamp: scanTimestamp,
        completed: true,
      });
    }

    await order.save();

    // 5. If delivered, award Ritual Loyalty delivery stamp
    if (order.fulfillmentStatus === 'DELIVERED') {
      try {
        await loyaltyService.awardDeliveryStamp(order);
      } catch (stampErr) {
        console.error('[Shiprocket Webhook] Failed awarding delivery stamp:', stampErr);
      }
    }

    // 6. Broadcast real-time Socket.IO events
    const io = req.io || global.io;
    if (io) {
      io.emit('order:status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.fulfillmentStatus,
        shippingStatus: order.shipping.status,
        currentCourierStatus: order.shippingDetails.currentCourierStatus,
        trackingHistory: order.shippingDetails.trackingHistory,
      });

      io.emit('order:status_updated', {
        id: order._id,
        orderNumber: order.orderNumber,
        fulfillmentStatus: order.fulfillmentStatus,
        shippingStatus: order.shipping.status,
      });

      io.emit('tracking:updated', {
        orderNumber: order.orderNumber,
        status: mappedShipping,
        timeline: order.trackingTimeline,
      });
    }

    res.json({
      success: true,
      message: 'Shiprocket tracking update processed successfully',
      orderNumber: order.orderNumber,
      status: order.fulfillmentStatus,
      currentCourierStatus: order.shippingDetails.currentCourierStatus,
    });
  } catch (err) {
    console.error('[Shiprocket Webhook] Internal error:', err);
    res.status(500).json({ error: err.message });
  }
};
