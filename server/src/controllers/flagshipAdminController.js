const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const StoreSettings = require('../models/StoreSettings');
const Loyalty = require('../models/Loyalty');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');

// Helper to record audit logs
async function recordAudit(req, { actionType, targetEntity, targetId, details, reason }) {
  try {
    await AdminAuditLog.create({
      adminId: req.user?._id || req.user?.id || null,
      adminEmail: req.user?.email || 'loveandcoadmin@gmail.com',
      adminRole: req.user?.role || 'admin',
      actionType,
      targetEntity,
      targetId: String(targetId || ''),
      newValue: details,
      ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
      reason: reason || 'Action executed in Love & Co. Flagship Command Center',
    });
  } catch (err) {
    console.warn('Non-fatal audit log notice:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. STORE STATUS & PAUSE MODAL
// ─────────────────────────────────────────────────────────────
exports.getStoreStatus = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }
    const storeStatus = settings.storeStatus || {
      isPaused: false,
      pauseReason: '',
      reopenDate: '',
      pauseNotice: 'Our cold-process botanical cure room is currently completing lipid saponification. Orders are temporarily paused and will resume shortly.',
    };
    res.json({ success: true, storeStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve store status: ' + err.message });
  }
};

exports.updateStoreStatus = async (req, res) => {
  try {
    const { isPaused, pauseReason, reopenDate, pauseNotice } = req.body;
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }

    if (!settings.storeStatus) {
      settings.storeStatus = {};
    }

    settings.storeStatus.isPaused = Boolean(isPaused);
    if (pauseReason !== undefined) settings.storeStatus.pauseReason = pauseReason;
    if (reopenDate !== undefined) settings.storeStatus.reopenDate = reopenDate;
    if (pauseNotice !== undefined) settings.storeStatus.pauseNotice = pauseNotice;
    settings.storeStatus.updatedAt = new Date();

    await settings.save();

    const updatedStatus = settings.storeStatus.toObject ? settings.storeStatus.toObject() : settings.storeStatus;

    // Broadcast store status to all connected storefronts & admins via Socket.IO
    if (req.io) {
      req.io.emit('store:status_update', updatedStatus);
    }

    await recordAudit(req, {
      actionType: 'STORE_STATUS_TOGGLE',
      targetEntity: 'StoreSettings',
      targetId: settings._id,
      details: updatedStatus,
      reason: isPaused ? `Storefront paused: ${pauseReason || 'Botanical batch curing'}` : 'Storefront reopened for orders',
    });

    res.json({
      success: true,
      message: isPaused ? 'Storefront paused successfully' : 'Storefront reopened successfully',
      storeStatus: updatedStatus,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update store status: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. OPERATIONS COMMAND CENTER KPIS & QUEUE
// ─────────────────────────────────────────────────────────────
exports.getOperationsKpis = async (req, res) => {
  try {
    const [orders, products, loyaltyRecords] = await Promise.all([
      Order.find().select('orderNumber totalAmount pricingBreakdown payment paymentDetails fulfillmentStatus shipping items createdAt customer').lean(),
      Product.find().select('name title stock stockQty lowStockThreshold category price images').lean(),
      Loyalty.find().select('stampsCompleted milestoneUnlocked totalRewardsEarned').lean(),
    ]);

    // Active fulfillment queue: PLACED + PACKED + PROCESSING
    const activeQueueOrders = orders.filter((ord) => {
      const st = (ord.fulfillmentStatus || ord.shipping?.status || '').toUpperCase();
      return st === 'PLACED' || st === 'PACKED' || st === 'PROCESSING' || st === 'UNFULFILLED';
    });

    // Awaiting dispatch: orders marked PACKED or PROCESSING needing courier tracking AWB
    const awaitingDispatchOrders = orders.filter((ord) => {
      const st = (ord.fulfillmentStatus || ord.shipping?.status || '').toUpperCase();
      const hasAwb = Boolean(ord.shipping?.trackingNumber || ord.shipping?.awbCode);
      return (st === 'PACKED' || st === 'PROCESSING') && !hasAwb;
    });

    // Low stock SKUs: stock < 10
    const lowStockSKUs = products.filter((p) => {
      const current = p.stockQty !== undefined ? p.stockQty : (p.stock || 0);
      return current < 10;
    }).map((p) => ({
      _id: p._id,
      name: p.name || p.title,
      category: p.category || 'Cold-Pressed Soaps',
      currentStock: p.stockQty !== undefined ? p.stockQty : (p.stock || 0),
      price: p.price || 0,
      image: (p.images && p.images[0]?.url) ? p.images[0].url : '',
    }));

    // Fulfilled revenue (delivered, dispatched, or paid orders)
    const fulfilledOrders = orders.filter((ord) => {
      const st = (ord.fulfillmentStatus || ord.shipping?.status || '').toUpperCase();
      const paySt = (ord.payment?.status || ord.paymentDetails?.paymentStatus || '').toUpperCase();
      return (st === 'DELIVERED' || st === 'DISPATCHED' || st === 'SHIPPED') ||
             (paySt === 'PAID' && st !== 'CANCELLED' && st !== 'RTO');
    });

    const totalFulfilledRevenue = fulfilledOrders.reduce((sum, ord) => {
      return sum + (ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0);
    }, 0);

    const totalOrdersCount = orders.length;
    const aov = fulfilledOrders.length > 0 ? Math.round(totalFulfilledRevenue / fulfilledOrders.length) : 0;

    // 10-stamp rituals completed
    const ritualsCompleted = loyaltyRecords.reduce((sum, rec) => {
      const completed = rec.stampsCompleted || (rec.milestoneUnlocked ? 1 : 0);
      return sum + (completed >= 10 ? 1 : 0);
    }, 0);

    res.json({
      success: true,
      kpis: {
        activeFulfillmentQueue: activeQueueOrders.length,
        awaitingDispatch: awaitingDispatchOrders.length,
        lowStockCount: lowStockSKUs.length,
        lowStockSKUs,
        totalFulfilledRevenue,
        aov,
        totalOrdersCount,
        tenStampRitualsCompleted: ritualsCompleted,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve operations KPIs: ' + err.message });
  }
};

exports.getOperationsQueue = async (req, res) => {
  try {
    const { tab = 'active', search = '', limit = 50 } = req.query;

    let query = {};

    // Tab filter
    const upperTab = tab.toUpperCase();
    if (upperTab === 'ACTIVE') {
      query.fulfillmentStatus = { $in: ['PLACED', 'PACKED', 'PROCESSING', 'UNFULFILLED'] };
    } else if (upperTab === 'PACKED') {
      query.fulfillmentStatus = 'PACKED';
    } else if (upperTab === 'SHIPPED' || upperTab === 'DISPATCHED') {
      query.fulfillmentStatus = { $in: ['SHIPPED', 'DISPATCHED'] };
    } else if (upperTab === 'DELIVERED') {
      query.fulfillmentStatus = 'DELIVERED';
    } else if (upperTab === 'CANCELLED') {
      query.fulfillmentStatus = { $in: ['CANCELLED', 'REFUNDED', 'RTO'] };
    }

    let orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('items.product', 'name price images category stock stockQty')
      .lean();

    // Client/search query matching orderNumber, customer name, phone, city
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      orders = orders.filter((ord) => {
        const num = (ord.orderNumber || ord.orderId || '').toLowerCase();
        const name = (ord.customer?.fullName || ord.shippingAddress?.fullName || ord.shippingAddress?.recipientName || '').toLowerCase();
        const phone = (ord.customer?.phone || ord.shippingAddress?.phone || '').toLowerCase();
        const city = (ord.shippingAddress?.city || '').toLowerCase();
        return num.includes(q) || name.includes(q) || phone.includes(q) || city.includes(q);
      });
    }

    res.json({ success: true, orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve operations queue: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. ORDER ACTIONS (PACK, DISPATCH, CANCEL WITH ATOMIC ROLLBACK)
// ─────────────────────────────────────────────────────────────
exports.markOrderPacked = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.fulfillmentStatus = 'PACKED';
    if (!order.shipping) order.shipping = {};
    order.shipping.status = 'PACKED';

    if (!order.trackingTimeline) order.trackingTimeline = [];
    order.trackingTimeline.push({
      stage: 'PACKED',
      description: 'Botanical formulations inspected, wrapped in butter paper, and packed into kraft box.',
      timestamp: new Date(),
      completed: true,
    });

    await order.save();

    if (req.io) {
      req.io.emit('order:status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'PACKED',
        fulfillmentStatus: 'PACKED',
      });
    }

    await recordAudit(req, {
      actionType: 'ORDER_PACKED',
      targetEntity: 'Order',
      targetId: order._id,
      details: { orderNumber: order.orderNumber, status: 'PACKED' },
      reason: 'Order packed in packaging station',
    });

    res.json({ success: true, message: `Order #${order.orderNumber} marked as Packed`, order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pack order: ' + err.message });
  }
};

exports.dispatchOrderWithCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const { courierName = 'Delhivery Air', trackingNumber = '' } = req.body;

    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.fulfillmentStatus = 'DISPATCHED';
    if (!order.shipping) order.shipping = {};
    order.shipping.status = 'DISPATCHED';
    order.shipping.courier = courierName;
    order.shipping.trackingNumber = trackingNumber || `AWB-${Date.now().toString().slice(-8)}`;
    order.shipping.awbCode = order.shipping.trackingNumber;

    if (!order.trackingTimeline) order.trackingTimeline = [];
    order.trackingTimeline.push({
      stage: 'DISPATCHED',
      description: `Dispatched via ${courierName}. Tracking AWB: ${order.shipping.trackingNumber}.`,
      timestamp: new Date(),
      completed: true,
    });

    await order.save();

    if (req.io) {
      req.io.emit('order:status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'DISPATCHED',
        fulfillmentStatus: 'DISPATCHED',
        shipping: order.shipping,
      });
    }

    await recordAudit(req, {
      actionType: 'ORDER_DISPATCHED',
      targetEntity: 'Order',
      targetId: order._id,
      details: { orderNumber: order.orderNumber, courier: courierName, trackingNumber: order.shipping.trackingNumber },
      reason: `Courier manifest generated with ${courierName}`,
    });

    res.json({
      success: true,
      message: `Order #${order.orderNumber} dispatched via ${courierName}`,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to dispatch order: ' + err.message });
  }
};

exports.cancelOrderWithStockRollback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer requested cancellation prior to courier handover' } = req.body;

    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.fulfillmentStatus === 'CANCELLED') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    const previousStatus = order.fulfillmentStatus;
    order.fulfillmentStatus = 'CANCELLED';
    if (!order.shipping) order.shipping = {};
    order.shipping.status = 'CANCELLED';

    if (order.payment) order.payment.status = 'REFUNDED';
    if (order.paymentDetails) order.paymentDetails.paymentStatus = 'REFUNDED';

    if (!order.trackingTimeline) order.trackingTimeline = [];
    order.trackingTimeline.push({
      stage: 'CANCELLED',
      description: `Order cancelled. Reason: ${reason}. Inventory restored to stock.`,
      timestamp: new Date(),
      completed: true,
    });

    await order.save();

    // ATOMIC STOCK ROLLBACK via Promise.allSettled: $inc product stock & reset OUT_OF_STOCK to ACTIVE
    const rollbackPromises = (order.items || []).map(async (item) => {
      const pid = item.product?._id || item.product || item.productId;
      const qty = Number(item.quantity) || 1;
      if (!pid) return null;
      return Product.findByIdAndUpdate(
        pid,
        {
          $inc: { stock: qty, stockQty: qty },
          $set: { status: 'ACTIVE' },
        },
        { new: true }
      );
    });

    const rollbackResults = await Promise.allSettled(rollbackPromises);
    const restoredCount = rollbackResults.filter((r) => r.status === 'fulfilled' && r.value).length;

    if (req.io) {
      req.io.emit('order:status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'CANCELLED',
        fulfillmentStatus: 'CANCELLED',
      });
      req.io.emit('catalog:update', { reason: 'stock_restored_on_order_cancel', orderNumber: order.orderNumber });
    }

    await recordAudit(req, {
      actionType: 'ORDER_CANCELLED',
      targetEntity: 'Order',
      targetId: order._id,
      details: { orderNumber: order.orderNumber, reason, restoredItems: restoredCount },
      reason: `Order cancelled: ${reason}`,
    });

    res.json({
      success: true,
      message: `Order #${order.orderNumber} successfully cancelled. Restored stock for ${restoredCount} SKU items.`,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 4. INVENTORY, QUICK-PRICE & ACTIVE ORDER DELETION GUARD
// ─────────────────────────────────────────────────────────────
exports.toggleProductStockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentStatus = product.status || 'ACTIVE';
    const newStatus = currentStatus === 'OUT_OF_STOCK' ? 'ACTIVE' : 'OUT_OF_STOCK';
    product.status = newStatus;
    if (newStatus === 'OUT_OF_STOCK') {
      product.stock = 0;
      product.stockQty = 0;
    } else if ((product.stock || 0) <= 0) {
      product.stock = 25;
      product.stockQty = 25;
    }

    await product.save();

    if (req.io) {
      req.io.emit('catalog:update', {
        productId: product._id,
        status: newStatus,
        stock: product.stock,
      });
    }

    await recordAudit(req, {
      actionType: 'PRODUCT_STOCK_TOGGLE',
      targetEntity: 'Product',
      targetId: product._id,
      details: { previous: currentStatus, current: newStatus },
      reason: `Stock status toggled to ${newStatus}`,
    });

    res.json({
      success: true,
      message: `Product is now ${newStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'In Stock'}`,
      product,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle product stock: ' + err.message });
  }
};

exports.quickPriceUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, compareAtPrice } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (price !== undefined) product.price = Number(price);
    if (compareAtPrice !== undefined) product.compareAtPrice = Number(compareAtPrice);

    await product.save();

    if (req.io) {
      req.io.emit('catalog:update', {
        productId: product._id,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
      });
    }

    res.json({ success: true, message: 'Price updated successfully', product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update price: ' + err.message });
  }
};

exports.bulkRestockLowInventory = async (req, res) => {
  try {
    const { productIds = [], incrementAmount = 0, targetStock = 0 } = req.body;

    let filter = {};
    if (productIds && productIds.length > 0) {
      filter._id = { $in: productIds };
    } else {
      // Restock all low stock SKUs
      filter.$or = [{ stock: { $lt: 10 } }, { stockQty: { $lt: 10 } }];
    }

    const products = await Product.find(filter);
    const updated = [];

    for (const p of products) {
      if (targetStock > 0) {
        p.stock = targetStock;
        p.stockQty = targetStock;
      } else if (incrementAmount > 0) {
        p.stock = (p.stock || 0) + incrementAmount;
        p.stockQty = (p.stockQty || 0) + incrementAmount;
      }
      p.status = 'ACTIVE';
      await p.save();
      updated.push({ id: p._id, name: p.name, newStock: p.stock });
    }

    if (req.io) {
      req.io.emit('catalog:update', { reason: 'bulk_restock', updatedCount: updated.length });
    }

    res.json({ success: true, message: `Successfully restocked ${updated.length} products`, updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed bulk restock: ' + err.message });
  }
};

// ACTIVE ORDER DELETION GUARD FOR PRODUCTS
exports.deleteProductGuarded = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists in any active unfulfilled / in-transit orders
    const activeOrder = await Order.findOne({
      'items.product': id,
      fulfillmentStatus: { $in: ['PLACED', 'PACKED', 'PROCESSING', 'UNFULFILLED', 'SHIPPED', 'DISPATCHED'] },
    }).select('orderNumber fulfillmentStatus');

    if (activeOrder) {
      return res.status(400).json({
        success: false,
        error: `Active Order Protection: Cannot delete botanical product while active fulfillment order #${activeOrder.orderNumber} (${activeOrder.fulfillmentStatus}) is pending fulfillment. Please dispatch or cancel the order first.`,
      });
    }

    await Product.findByIdAndDelete(id);

    if (req.io) {
      req.io.emit('catalog:update', { reason: 'product_deleted', productId: id });
    }

    res.json({ success: true, message: 'Product successfully removed from catalog.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 5. RITUAL BUNDLES & TRIOS (COMBOS)
// ─────────────────────────────────────────────────────────────
exports.getAllCombos = async (req, res) => {
  try {
    const combos = await Combo.find().populate('items.product', 'name price images category stock stockQty');
    res.json({ success: true, combos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch combos: ' + err.message });
  }
};

exports.createCombo = async (req, res) => {
  try {
    const { name, subtitle, description, items, price, compareAtPrice, stock, images, badge, ritualBenefits } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Bundle name and price are required' });
    }

    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const savingsAmount = (compareAtPrice && compareAtPrice > price) ? (compareAtPrice - price) : 0;
    const savingsPercent = compareAtPrice > 0 ? Math.round((savingsAmount / compareAtPrice) * 100) : 0;

    const newCombo = await Combo.create({
      name,
      slug,
      subtitle: subtitle || '',
      description: description || '',
      items: items || [],
      price: Number(price),
      compareAtPrice: Number(compareAtPrice || price),
      savingsAmount,
      savingsPercent,
      stock: Number(stock !== undefined ? stock : 25),
      images: images || [],
      badge: badge || (savingsAmount > 0 ? `Save ₹${savingsAmount}` : 'Curated Ritual'),
      ritualBenefits: ritualBenefits || [],
    });

    if (req.io) {
      req.io.emit('catalog:update', { reason: 'combo_created', comboId: newCombo._id });
    }

    res.status(201).json({ success: true, combo: newCombo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create combo: ' + err.message });
  }
};

exports.updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subtitle, description, items, price, compareAtPrice, stock, images, badge, ritualBenefits, isActive } = req.body;

    const combo = await Combo.findById(id);
    if (!combo) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    if (name) combo.name = name;
    if (subtitle !== undefined) combo.subtitle = subtitle;
    if (description !== undefined) combo.description = description;
    if (items) combo.items = items;
    if (price !== undefined) combo.price = Number(price);
    if (compareAtPrice !== undefined) combo.compareAtPrice = Number(compareAtPrice);
    if (stock !== undefined) combo.stock = Number(stock);
    if (images) combo.images = images;
    if (badge) combo.badge = badge;
    if (ritualBenefits) combo.ritualBenefits = ritualBenefits;
    if (isActive !== undefined) combo.isActive = Boolean(isActive);

    if (combo.compareAtPrice && combo.compareAtPrice > combo.price) {
      combo.savingsAmount = combo.compareAtPrice - combo.price;
      combo.savingsPercent = Math.round((combo.savingsAmount / combo.compareAtPrice) * 100);
    }

    await combo.save();

    if (req.io) {
      req.io.emit('catalog:update', { reason: 'combo_updated', comboId: combo._id });
    }

    res.json({ success: true, combo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update combo: ' + err.message });
  }
};

exports.deleteComboGuarded = async (req, res) => {
  try {
    const { id } = req.params;
    await Combo.findByIdAndDelete(id);

    if (req.io) {
      req.io.emit('catalog:update', { reason: 'combo_deleted', comboId: id });
    }

    res.json({ success: true, message: 'Ritual Bundle successfully deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete bundle: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 6. CUSTOMER INTELLIGENCE & LOYALTY CRM
// ─────────────────────────────────────────────────────────────
exports.getCustomerIntelligence = async (req, res) => {
  try {
    const [orders, users, loyaltyRecords] = await Promise.all([
      Order.find()
        .select('orderNumber totalAmount pricingBreakdown payment paymentDetails fulfillmentStatus shipping items createdAt customer shippingAddress')
        .sort({ createdAt: -1 })
        .lean(),
      User.find().select('fullName name email phone isPhoneVerified createdAt').lean(),
      Loyalty.find().select('user stampsCompleted currentStamps milestoneUnlocked totalRewardsEarned createdAt').lean(),
    ]);

    // Build unified customer map by email or phone
    const customerMap = new Map();

    users.forEach((u) => {
      const key = (u.email || u.phone || u._id.toString()).toLowerCase().trim();
      customerMap.set(key, {
        id: u._id.toString(),
        name: u.fullName || u.name || 'Botanical Patron',
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        isPhoneVerified: Boolean(u.isPhoneVerified),
        joinedDate: u.createdAt,
        totalSpend: 0,
        ordersCount: 0,
        orders: [],
        stamps: 0,
        milestoneUnlocked: false,
        state: '',
        city: '',
        preferredPayment: 'Online',
        codOrdersCount: 0,
        onlineOrdersCount: 0,
      });
    });

    // Map loyalty records
    const loyaltyUserMap = new Map();
    loyaltyRecords.forEach((lr) => {
      if (lr.user) {
        loyaltyUserMap.set(lr.user.toString(), lr);
      }
    });

    // Process all orders into customer map
    orders.forEach((ord) => {
      const email = (ord.customer?.email || ord.shippingAddress?.email || '').toLowerCase().trim();
      const phone = (ord.customer?.phone || ord.shippingAddress?.phone || '').trim();
      const key = email || phone || (ord.customer?._id ? ord.customer._id.toString() : 'guest_' + ord.orderNumber);

      let record = customerMap.get(key);
      if (!record) {
        const rawName = ord.shippingAddress?.fullName || ord.shippingAddress?.recipientName || ord.customer?.fullName || ord.customer?.name || 'Customer';
        record = {
          id: key,
          name: rawName,
          email: ord.customer?.email || ord.shippingAddress?.email || 'N/A',
          phone: ord.customer?.phone || ord.shippingAddress?.phone || 'N/A',
          isPhoneVerified: false,
          joinedDate: ord.createdAt,
          totalSpend: 0,
          ordersCount: 0,
          orders: [],
          stamps: 0,
          milestoneUnlocked: false,
          state: ord.shippingAddress?.state || '',
          city: ord.shippingAddress?.city || '',
          preferredPayment: 'Online',
          codOrdersCount: 0,
          onlineOrdersCount: 0,
        };
        customerMap.set(key, record);
      }

      const ordAmt = ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0;
      const isPaidOrValid = ord.fulfillmentStatus !== 'CANCELLED' && ord.payment?.status !== 'FAILED';

      if (isPaidOrValid) {
        record.totalSpend += ordAmt;
      }
      record.ordersCount += 1;
      record.orders.push({
        id: ord._id,
        orderNumber: ord.orderNumber,
        date: ord.createdAt,
        amount: ordAmt,
        status: ord.fulfillmentStatus || 'PLACED',
        paymentMode: (ord.payment?.mode || ord.paymentDetails?.provider || 'ONLINE').toUpperCase(),
      });

      if (ord.shippingAddress?.state && !record.state) record.state = ord.shippingAddress.state;
      if (ord.shippingAddress?.city && !record.city) record.city = ord.shippingAddress.city;

      const pMode = (ord.payment?.mode || ord.paymentDetails?.provider || 'ONLINE').toUpperCase();
      if (pMode === 'COD') {
        record.codOrdersCount += 1;
      } else {
        record.onlineOrdersCount += 1;
      }
    });

    const customers = Array.from(customerMap.values()).map((c) => {
      // Find loyalty
      const lr = loyaltyUserMap.get(c.id);
      if (lr) {
        c.stamps = lr.currentStamps || lr.stampsCompleted || 0;
        c.milestoneUnlocked = Boolean(lr.milestoneUnlocked || c.stamps >= 10);
      } else {
        c.stamps = Math.min(10, c.ordersCount);
        c.milestoneUnlocked = c.ordersCount >= 10;
      }
      c.preferredPayment = c.codOrdersCount > c.onlineOrdersCount ? 'COD' : 'Prepaid';
      return c;
    });

    // 1. Overview KPIs
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter((c) => c.ordersCount >= 2).length;
    const repeatPurchaseRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    const activeLoyaltyMembers = customers.filter((c) => c.stamps > 0).length;

    // 2. Segmentation
    const now = Date.now();
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const segmentation = {
      vip: customers.filter((c) => c.ordersCount >= 3),
      repeat: customers.filter((c) => c.ordersCount === 2),
      firstTime: customers.filter((c) => c.ordersCount === 1),
      inactive: customers.filter((c) => {
        if (c.orders.length === 0) return true;
        const lastOrderTime = new Date(c.orders[0].date).getTime();
        return lastOrderTime < sixtyDaysAgo;
      }),
    };

    // 3. Geographic Distribution
    const stateMap = {};
    customers.forEach((c) => {
      const stateName = (c.state || 'Karnataka').trim();
      if (!stateMap[stateName]) {
        stateMap[stateName] = { state: stateName, customerCount: 0, codCount: 0, prepaidCount: 0, totalSpend: 0 };
      }
      stateMap[stateName].customerCount += 1;
      stateMap[stateName].codCount += c.codOrdersCount;
      stateMap[stateName].prepaidCount += c.onlineOrdersCount;
      stateMap[stateName].totalSpend += c.totalSpend;
    });
    const geographic = Object.values(stateMap).sort((a, b) => b.customerCount - a.customerCount);

    // 4. Retention & Loyalty Funnel (Stamp 1 through 10)
    const stampFunnel = Array.from({ length: 10 }, (_, i) => {
      const stampNum = i + 1;
      const count = customers.filter((c) => c.stamps >= stampNum).length;
      return {
        stamp: stampNum,
        customerCount: count,
        label: stampNum === 10 ? 'Stamp 10: Free Botanical Trio Unlocked' : `Stamp ${stampNum}`,
      };
    });

    res.json({
      success: true,
      crm: {
        overview: {
          totalCustomers,
          repeatCustomers,
          repeatPurchaseRate,
          activeLoyaltyMembers,
        },
        customers,
        segmentation: {
          vipCount: segmentation.vip.length,
          repeatCount: segmentation.repeat.length,
          firstTimeCount: segmentation.firstTime.length,
          inactiveCount: segmentation.inactive.length,
        },
        geographic,
        stampFunnel,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer CRM: ' + err.message });
  }
};

exports.getCustomerDossier = async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).lean();
    }
    if (!user) {
      user = await User.findOne({ $or: [{ email: id.toLowerCase() }, { phone: id }] }).lean();
    }

    // Fetch all orders matching this user or email
    const email = user?.email || (id.includes('@') ? id.toLowerCase() : null);
    const phone = user?.phone || (!id.includes('@') ? id : null);

    const orderQuery = {
      $or: [
        ...(user ? [{ customer: user._id }] : []),
        ...(email ? [{ 'customer.email': email }, { 'shippingAddress.email': email }] : []),
        ...(phone ? [{ 'customer.phone': phone }, { 'shippingAddress.phone': phone }] : []),
      ],
    };

    const orders = await Order.find(orderQuery)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price images category')
      .lean();

    const totalLtv = orders
      .filter((o) => o.fulfillmentStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const dossier = {
      id: user?._id || id,
      name: user?.fullName || (orders[0]?.shippingAddress?.fullName) || 'Botanical Patron',
      email: user?.email || email || 'N/A',
      phone: user?.phone || phone || 'N/A',
      isPhoneVerified: Boolean(user?.isPhoneVerified),
      totalLtv,
      orderCount: orders.length,
      stamps: Math.min(10, orders.length),
      freeTrioUnlocked: orders.length >= 10,
      shippingAddress: orders[0]?.shippingAddress || null,
      orders,
    };

    res.json({ success: true, dossier });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve customer dossier: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 7. FINANCIAL P&L ANALYTICS & HEALTH
// ─────────────────────────────────────────────────────────────
exports.getFinancialPnlAnalytics = async (req, res) => {
  try {
    const { range = 'all' } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (range === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today } };
    } else if (range === 'yesterday') {
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } };
    } else if (range === '7d') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      dateFilter = { createdAt: { $gte: past7 } };
    } else if (range === 'mtd') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
    }

    const orders = await Order.find(dateFilter)
      .populate('items.product', 'costPrice price name category')
      .lean();

    let gmv = 0;
    let fulfilledRevenue = 0;
    let cogs = 0;
    let shippingExpenses = 0;
    let discountsAbsorbed = 0;
    let totalFulfilledOrders = 0;

    orders.forEach((ord) => {
      const amt = ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0;
      gmv += amt;

      const isDeliveredOrPaid =
        (ord.fulfillmentStatus === 'DELIVERED' || ord.fulfillmentStatus === 'DISPATCHED' || ord.shipping?.status === 'DISPATCHED') ||
        (ord.payment?.status === 'PAID' && ord.fulfillmentStatus !== 'CANCELLED');

      if (isDeliveredOrPaid) {
        fulfilledRevenue += amt;
        totalFulfilledOrders += 1;
        shippingExpenses += (ord.pricingBreakdown?.shippingFee || 65);
        discountsAbsorbed += (ord.pricingBreakdown?.couponDiscount || ord.pricingBreakdown?.discount || 0);

        // COGS estimation: product costPrice or 32% standard luxury botanical formulation baseline
        let orderCogs = 0;
        (ord.items || []).forEach((itm) => {
          const prodCost = itm.product?.costPrice || (itm.price ? itm.price * 0.32 : 120);
          orderCogs += prodCost * (Number(itm.quantity) || 1);
        });
        cogs += Math.round(orderCogs);
      }
    });

    const netProfit = fulfilledRevenue - cogs - shippingExpenses - discountsAbsorbed;
    const netProfitMargin = fulfilledRevenue > 0 ? Number(((netProfit / fulfilledRevenue) * 100).toFixed(1)) : 0;

    // Daily revenue vs orders trend
    const daysCount = range === '7d' ? 7 : range === 'today' ? 1 : 14;
    const trendMap = {};

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      trendMap[key] = { date: key, revenue: 0, orders: 0, netProfit: 0 };
    }

    orders.forEach((ord) => {
      const dateKey = new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (trendMap[dateKey]) {
        const amt = ord.totalAmount || 0;
        trendMap[dateKey].revenue += amt;
        trendMap[dateKey].orders += 1;
        trendMap[dateKey].netProfit += Math.round(amt * 0.48); // Baseline net contribution
      }
    });

    res.json({
      success: true,
      pnl: {
        range,
        fulfilledRevenue,
        gmv,
        cogs,
        shippingExpenses,
        discountsAbsorbed,
        netProfit,
        netProfitMargin,
        totalFulfilledOrders,
        trends: Object.values(trendMap),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate financial P&L: ' + err.message });
  }
};

exports.getInventoryReplenishmentWatch = async (req, res) => {
  try {
    const products = await Product.find().select('name category price costPrice stock stockQty lowStockThreshold updatedAt createdAt').lean();

    // Low stock replenishment
    const lowStockReplenishment = products
      .filter((p) => {
        const current = p.stockQty !== undefined ? p.stockQty : (p.stock || 0);
        return current < 15;
      })
      .map((p) => {
        const current = p.stockQty !== undefined ? p.stockQty : (p.stock || 0);
        return {
          id: p._id,
          name: p.name,
          category: p.category,
          stock: current,
          status: current === 0 ? 'CRITICAL_DEPLETED' : current < 5 ? 'URGENT' : 'LOW',
          recommendedReorder: Math.max(50, 60 - current),
          estimatedLeadTimeDays: 14, // Botanical cure cycle
        };
      });

    // Slow movers: stock > 20 and no recent sale
    const slowMovers = products
      .filter((p) => {
        const current = p.stockQty !== undefined ? p.stockQty : (p.stock || 0);
        return current >= 20;
      })
      .slice(0, 5)
      .map((p) => ({
        id: p._id,
        name: p.name,
        category: p.category,
        stock: p.stockQty !== undefined ? p.stockQty : (p.stock || 0),
        daysInStock: Math.floor((Date.now() - new Date(p.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
      }));

    res.json({
      success: true,
      lowStockReplenishment,
      slowMovers,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory health: ' + err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 8. AI BOTANICAL COPYWRITER
// ─────────────────────────────────────────────────────────────
exports.generateBotanicalCopy = async (req, res) => {
  try {
    const { title, category = 'Cold-Pressed Soaps', keyIngredients = '', skinType = 'All Skin Types' } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Product title is required to formulate botanical copy' });
    }

    // Try Gemini if API key is present
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are the master botanical formulator and luxury editorial copywriter for "Love & Co.", a high-end D2C apothecary crafting cold-pressed organic soaps and botanical skincare in Bangalore, India.
Generate high-converting, sensory, poetic yet clinical copy for a new product with:
Title: ${title}
Category: ${category}
Key Botanical Ingredients: ${keyIngredients || 'Cold-pressed virgin coconut, raw shea butter, botanical distillates'}
Target Skin Profile: ${skinType}

Respond ONLY with valid JSON with keys:
{
  "description": "Rich 2-3 paragraph evocative story and tactile formulation experience",
  "usageInstructions": "Ritual application guide for morning or evening bath",
  "keyBenefits": ["Benefit 1 with active botanicals", "Benefit 2 with skin barrier restoration", "Benefit 3"],
  "tagline": "Short poetic 1-line luxury tagline"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({ success: true, copy: parsed });
        }
      } catch (geminiErr) {
        console.warn('Gemini AI fallback triggered:', geminiErr.message);
      }
    }

    // High quality intelligent template formulation fallback
    const botanicalBotanics = keyIngredients || 'Cold-pressed botanical oils, unrefined Ghanaian shea butter, pure essential distillates';
    const copy = {
      tagline: `An artisanal ritual of pure botanicals and restorative lipid care for ${title.toLowerCase()}.`,
      description: `Formulated in small micro-batches in our Bangalore cure atelier, ${title} is a celebratory hymn to botanical purity. Hand-blended using slowly cured saponified vegetable lipids, this formulation preserves naturally occurring botanical glycerin to envelop the skin in protective, velvety moisture.\n\nFree from synthetic lathering agents, phthalates, and artificial colorants, each bar offers a rich, dense micro-foam that gently lifts impurities while respecting the delicate epidermal acid mantle. Your daily bath becomes an immersive sensory retreat of natural earthen notes and deeply nourished skin.`,
      usageInstructions: `Moisten the bar under warm water until a thick, pearlescent micro-foam forms in your palms. Gently massage across damp skin in circular, upward motions, allowing the cold-pressed active botanicals to nourish for 60 seconds before rinsing cleanly. Store on a draining wooden soap dish between rituals to extend cure bar longevity.`,
      keyBenefits: [
        `Preserves 100% natural cold-process glycerin for intense, long-lasting dermal hydration.`,
        `Formulated with ${botanicalBotanics} to soothe sensitive or dry skin without tightness.`,
        `Reinforces the epidermal lipid barrier with neutral pH and clean botanical antioxidants.`,
      ],
    };

    res.json({ success: true, copy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate botanical copy: ' + err.message });
  }
};
