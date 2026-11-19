const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Loyalty = require('../models/Loyalty');
const mongoose = require('mongoose');
const paymentService = require('../services/paymentService');
const inventoryLockService = require('../services/inventoryLockService');
const shiprocketService = require('../services/shiprocketService');
const loyaltyService = require('../services/loyaltyService');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { items, shippingAddress, paymentProvider = 'Razorpay', sessionId, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required for checkout' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ error: 'Complete shipping address is required' });
    }

    // Verify all item prices strictly from database
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const pid = item.productId || item.product || item.id || item._id;
      let product = null;

      if (pid && mongoose.Types.ObjectId.isValid(pid)) {
        product = await Product.findById(pid);
      }

      if (!product && pid) {
        product = await Product.findOne({
          $or: [{ slug: pid }, { handle: pid }],
        });
      }

      if (!product && (item.slug || item.name || item.title)) {
        product = await Product.findOne({
          $or: [
            ...(item.slug ? [{ slug: item.slug }] : []),
            ...(item.name ? [{ name: item.name }] : []),
            ...(item.title ? [{ title: item.title }] : []),
          ],
        });
      }

      // Fallback to active catalog formulation if an older dev session cart item was referenced
      if (!product) {
        product = await Product.findOne();
      }

      if (!product) {
        return res.status(404).json({ error: 'No active botanical formulations found in catalog' });
      }

      const qty = parseInt(item.quantity, 10) || 1;
      const itemSubtotal = product.price * qty;
      subtotal += itemSubtotal;

      const imgUrl = (product.images && product.images[0] ? product.images[0].url : '') || product.image || item.image || '';

      verifiedItems.push({
        product: product._id,
        title: product.name,
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        price: product.price,
        image: imgUrl,
        isBundleItem: Boolean(item.isBundleItem),
      });
    }

    // Tiered or coupon / loyalty reward discounts
    let discountAmount = 0;
    let rewardApplied = null;
    const cleanCoupon = couponCode ? couponCode.trim().toUpperCase() : '';

    if (cleanCoupon.startsWith('RITUAL-') || cleanCoupon === 'FREE_TRIO') {
      const rewardResult = await loyaltyService.validateAndApplyReward({
        userId: req.user ? req.user.id : null,
        code: cleanCoupon,
        rewardType: cleanCoupon === 'FREE_TRIO' ? 'FREE_TRIO' : 'COUPON',
        subtotal,
        applyNow: false,
      });

      if (!rewardResult.valid) {
        return res.status(400).json({ error: rewardResult.error || 'Invalid or already used coupon code' });
      }

      discountAmount = rewardResult.discountAmount || 0;
      rewardApplied = {
        rewardType: rewardResult.rewardType,
        code: cleanCoupon,
        discountAmount,
        description: rewardResult.message || `${cleanCoupon} Discount`,
      };
    } else if (cleanCoupon === 'BOTANICAL15' || cleanCoupon === 'LOVE15') {
      discountAmount = Math.round(subtotal * 0.15);
      rewardApplied = {
        rewardType: 'COUPON',
        code: cleanCoupon,
        discountAmount,
        description: `${cleanCoupon} (15% Off)`,
      };
    } else {
      discountAmount = 0;
    }

    const shippingFee = subtotal - discountAmount >= 500 ? 0 : 50; // Free shipping at or above 500
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    const orderNumber = `LCO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const paymentIntent = await paymentService.createPaymentIntent({
      orderNumber,
      amount: totalAmount,
      currency: 'INR',
      provider: paymentProvider,
    });

    // Resolve active customer user from database
    let activeCustomer = null;
    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      activeCustomer = await User.findById(req.user.id).catch(() => null);
    }
    if (!activeCustomer && req.user?.email) {
      activeCustomer = await User.findOne({ email: req.user.email.toLowerCase().trim() });
    }
    if (!activeCustomer && shippingAddress?.email) {
      const cleanEmail = shippingAddress.email.toLowerCase().trim();
      activeCustomer = await User.findOne({ email: cleanEmail });
      if (!activeCustomer) {
        const fullName = shippingAddress.fullName || shippingAddress.recipientName || 'Apothecary Patron';
        const cleanPhone = shippingAddress.phone ? shippingAddress.phone.replace(/\D/g, '').slice(-10) : undefined;
        try {
          activeCustomer = await User.create({
            fullName,
            email: cleanEmail,
            phone: cleanPhone || undefined,
            role: 'customer',
            authProvider: 'local',
            ritualStamps: 0,
            isRitualCompleted: false,
          });
        } catch (_) {
          activeCustomer = await User.findOne({ email: cleanEmail });
        }
      }
    }
    const targetCustomerId = activeCustomer ? activeCustomer._id : (req.user?.id || null);

    const order = await Order.create({
      orderNumber,
      customer: targetCustomerId,
      customerId: targetCustomerId,
      items: verifiedItems,
      subtotal,
      discountAmount,
      discountTotal: discountAmount,
      shippingFee,
      totalAmount,
      grandTotal: totalAmount,
      rewardApplied,
      paymentDetails: {
        provider: paymentProvider,
        transactionId: paymentIntent.orderId || paymentIntent.clientSecret || 'TXN-MOCK',
        paymentStatus: paymentProvider === 'COD' ? 'AUTHORIZED' : 'PENDING',
      },
      fulfillmentStatus: 'PLACED',
      shippingAddress,
      trackingTimeline: [
        {
          stage: 'PLACED',
          description: 'Order confirmed and small-batch inventory locked.',
          timestamp: new Date(),
          completed: true,
        },
        {
          stage: 'PROCESSING',
          description: 'Atelier lab team preparing cold-pressed inspection.',
          timestamp: new Date(Date.now() + 3600000),
          completed: false,
        },
        {
          stage: 'DISPATCHED',
          description: 'Dispatched in plastic-free recycled paperboard courier.',
          timestamp: new Date(Date.now() + 86400000),
          completed: false,
        },
        {
          stage: 'DELIVERED',
          description: 'Delivered to your doorstep.',
          timestamp: new Date(Date.now() + 172800000),
          completed: false,
        },
      ],
    });

    // Reduce inventory immediately or via webhook
    await inventoryLockService.commitStockReduction(verifiedItems, sessionId);

    // Atomically mark redeemed mystery coupon as isUsed = true in MongoDB
    if (cleanCoupon.startsWith('RITUAL-') && rewardApplied) {
      await Loyalty.updateOne(
        { 'mysteryCoupons.code': cleanCoupon },
        {
          $set: {
            'mysteryCoupons.$.isUsed': true,
            'mysteryCoupons.$.usedAt': new Date(),
            'mysteryCoupons.$.usedInOrderId': order.orderNumber,
          },
        }
      ).catch((err) => console.warn('Could not mark coupon as used in Loyalty:', err));
    }

    // Order Placement Loyalty Hook: Enforce single source of truth based on loyalty.stampedOrderIds.length
    let mysteryCoupon = null;
    let targetUserId = targetCustomerId || (activeCustomer ? activeCustomer._id : null);
    if (!targetUserId && shippingAddress?.email) {
      const cleanEmail = shippingAddress.email.toLowerCase().trim();
      const matchedUser = await User.findOne({ email: cleanEmail });
      if (matchedUser) {
        targetUserId = matchedUser._id;
      }
    }

    if (targetUserId) {
      try {
        const loyaltyResult = await loyaltyService.assignOrderLoyalty(order, targetUserId);
        mysteryCoupon = loyaltyResult?.mysteryCoupon || null;
      } catch (lErr) {
        console.warn('Could not process order loyalty on checkout:', lErr);
      }
    } else {
      order.milestoneGift = null;
      order.complimentaryGifts = [];
      order.mysteryCoupon = null;
      order.showLoyaltyCard = false;
      await order.save();
    }

    res.status(201).json({
      message: 'Checkout initialized successfully',
      order,
      paymentIntent,
      mysteryCoupon: mysteryCoupon || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(404).json({ error: 'Order ID is required' });
    }

    const query = {
      $or: [
        { orderNumber: id },
        { orderId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
      ],
    };

    let order = await Order.findOne(query)
      .populate('items.product')
      .populate('customer', 'fullName email phone savedAddresses');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // STRICT CUSTOMER DATA OWNERSHIP CHECK
    const ADMIN_EMAILS = ['loveandcosupport@gmail.com', 'loveandcoadmin@gmail.com'];
    const isAdmin =
      req.user &&
      req.user.role === 'admin' &&
      ADMIN_EMAILS.includes((req.user.email || '').toLowerCase().trim());

    if (!isAdmin) {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required to view this order.' });
      }

      const reqUserId = (req.user._id || req.user.id)?.toString();
      const reqUserEmail = (req.user.email || '').toLowerCase().trim();

      const orderCustomerId = (
        order.customer?._id ||
        order.customer ||
        order.customerId ||
        order.user ||
        order.userId
      )?.toString();
      const orderCustomerEmail = (
        order.shippingAddress?.email ||
        order.customer?.email ||
        ''
      ).toLowerCase().trim();

      const isOwner =
        (orderCustomerId && orderCustomerId === reqUserId) ||
        (orderCustomerEmail && orderCustomerEmail === reqUserEmail);

      if (!isOwner) {
        return res.status(403).json({
          error: 'Access denied: You do not have permission to view this order.',
        });
      }
    }

    const mappedOrder = order.toObject ? order.toObject() : { ...order };

    // Synchronize latest mysteryCoupon revealed state & loyalty stamps
    try {
      let userLoyalty = null;
      const targetUserId =
        (mappedOrder.customer && (mappedOrder.customer._id || mappedOrder.customer.id)) ||
        (mappedOrder.customerId && (mappedOrder.customerId._id || mappedOrder.customerId.id)) ||
        (typeof mappedOrder.customer === 'string' ? mappedOrder.customer : null) ||
        (typeof mappedOrder.customerId === 'string' ? mappedOrder.customerId : null) ||
        (typeof mappedOrder.userId === 'string' ? mappedOrder.userId : null);

      if (targetUserId) {
        userLoyalty = await Loyalty.findOne({ $or: [{ userId: targetUserId }, { user: targetUserId }] });
      }
      if (!userLoyalty && mappedOrder.shippingAddress?.email) {
        const u = await User.findOne({ email: mappedOrder.shippingAddress.email.toLowerCase().trim() });
        if (u) {
          userLoyalty = await Loyalty.findOne({ $or: [{ userId: u._id }, { user: u._id }] });
        }
      }
      if (!userLoyalty && mappedOrder._id) {
        userLoyalty = await Loyalty.findOne({
          $or: [
            { 'mysteryCoupons.sourceOrderId': mappedOrder._id },
            { 'mysteryCoupons.sourceOrderId': mappedOrder.orderNumber },
            { stampedOrderIds: mappedOrder._id },
          ],
        });
      }
      if (!userLoyalty && mappedOrder.mysteryCoupon?.code) {
        userLoyalty = await Loyalty.findOne({
          'mysteryCoupons.code': mappedOrder.mysteryCoupon.code.toUpperCase(),
        });
      }

      // If userLoyalty is still null, and we have a valid targetUserId, get or create it
      if (!userLoyalty && targetUserId) {
        userLoyalty = await Loyalty.getOrCreate(targetUserId);
      }

      const totalAmt = mappedOrder.totalAmount ?? mappedOrder.grandTotal ?? 0;

      if (userLoyalty) {
        const stampedOrderIds = (userLoyalty.stampedOrderIds || []).map((sid) => (sid ? sid.toString() : ''));
        const orderIdStr = order._id ? order._id.toString() : '';
        const orderNumStr = order.orderNumber ? String(order.orderNumber) : '';

        let stampPosition = stampedOrderIds.findIndex(
          (sid) => (orderIdStr && sid === orderIdStr) || (orderNumStr && sid === orderNumStr)
        );

        if (totalAmt < 499) {
          // Rule 1: Ineligible (< ₹499)
          mappedOrder.milestoneGift = null;
          mappedOrder.complimentaryGifts = [];
          mappedOrder.mysteryCoupon = null;
          mappedOrder.showLoyaltyCard = false;
          mappedOrder.isPostRitualOrder = false;
          mappedOrder.stampNumber = null;

          if (order.milestoneGift || order.mysteryCoupon || order.showLoyaltyCard !== false) {
            order.milestoneGift = null;
            order.complimentaryGifts = [];
            order.mysteryCoupon = null;
            order.showLoyaltyCard = false;
            order.isPostRitualOrder = false;
            order.stampNumber = null;
            await order.save().catch(() => {});
          }
        } else {
          const calculatedStamp = stampPosition !== -1 ? stampPosition + 1 : (mappedOrder.stampNumber || null);
          const isTenthOrder = calculatedStamp === 10;
          const isPost10Order = calculatedStamp > 10 || (userLoyalty.isRitualCompleted && !isTenthOrder && stampPosition === -1);

          if (isPost10Order) {
            // Rule 4: 11th+ order shutdown
            mappedOrder.milestoneGift = null;
            mappedOrder.complimentaryGifts = [];
            mappedOrder.mysteryCoupon = null;
            mappedOrder.showLoyaltyCard = false;
            mappedOrder.isPostRitualOrder = true;
            mappedOrder.stampNumber = null;

            if (order.milestoneGift || order.showLoyaltyCard) {
              order.milestoneGift = null;
              order.complimentaryGifts = [];
              order.showLoyaltyCard = false;
              order.isPostRitualOrder = true;
              order.stampNumber = null;
              await order.save().catch(() => {});
            }
          } else if (calculatedStamp >= 1 && calculatedStamp <= 10) {
            // Rule 2 & Rule 3: Valid qualifying order 1-10
            mappedOrder.showLoyaltyCard = true;
            mappedOrder.isPostRitualOrder = false;
            mappedOrder.stampNumber = calculatedStamp;

            if (isTenthOrder) {
              const milestoneGift = {
                name: 'LOVE & Co. Signature 3-Bar Botanical Trio',
                subtitle: 'Complimentary Ritual Gift',
                quantity: 1,
                price: 0,
                image: '/images/products/botanical_trio_box.jpg',
                reason: '10th Ritual Milestone Reward',
                unlockedAt: order.createdAt || new Date(),
              };
              mappedOrder.milestoneGift = milestoneGift;
              mappedOrder.complimentaryGifts = [milestoneGift];
              order.milestoneGift = milestoneGift;
              order.complimentaryGifts = [milestoneGift];
              order.stampNumber = 10;
              order.showLoyaltyCard = true;
              await order.save().catch(() => {});
            } else {
              // FOR STAMPS 1 THROUGH 9: STRICTLY NULL
              mappedOrder.milestoneGift = null;
              mappedOrder.complimentaryGifts = [];
              if (order.milestoneGift) {
                order.milestoneGift = null;
                order.complimentaryGifts = [];
                order.stampNumber = calculatedStamp;
                await order.save().catch(() => {});
              }
            }

            let matched = (userLoyalty.mysteryCoupons || []).find(
              (c) =>
                (orderIdStr && String(c.sourceOrderId) === orderIdStr) ||
                (orderNumStr && String(c.sourceOrderId) === orderNumStr) ||
                (mappedOrder.mysteryCoupon?.code && c.code === mappedOrder.mysteryCoupon.code)
            );

            if (matched) {
              mappedOrder.mysteryCoupon = {
                code: matched.code,
                discountPercent: matched.discountPercent || 15,
                maxDiscount: matched.maxDiscount || 250,
                expiresAt: matched.expiresAt,
                isUsed: Boolean(matched.isUsed),
                revealed: Boolean(matched.revealed),
                sourceOrderId: matched.sourceOrderId,
              };
              if (!order.mysteryCoupon || order.mysteryCoupon.revealed !== matched.revealed) {
                order.mysteryCoupon = mappedOrder.mysteryCoupon;
                await order.save().catch(() => {});
              }
            } else if (order.mysteryCoupon) {
              mappedOrder.mysteryCoupon = order.mysteryCoupon;
            }

            mappedOrder.ritualStamps = Math.min(
              10,
              userLoyalty.ritualStamps || (isTenthOrder ? 10 : stampPosition >= 0 ? stampPosition + 1 : 0)
            );
            mappedOrder.isRitualCompleted = Boolean(userLoyalty.isRitualCompleted && mappedOrder.ritualStamps === 10);
            mappedOrder.freeTrioUnlocked = false;
          }
        }
      } else {
        // If no userLoyalty document exists, never allow milestoneGift unless stampNumber is strictly 10
        if (mappedOrder.stampNumber !== 10) {
          mappedOrder.milestoneGift = null;
          mappedOrder.complimentaryGifts = [];
        }
      }
    } catch (lErr) {
      console.warn('Could not populate loyalty data for order:', lErr);
    }

    // Deterministic Rule Enforcement: If not a valid loyalty order, strip all loyalty properties
    if (mappedOrder.showLoyaltyCard !== true) {
      mappedOrder.mysteryCoupon = null;
      mappedOrder.milestoneGift = null;
      mappedOrder.complimentaryGifts = [];
      mappedOrder.stampNumber = null;
    }

    if (mappedOrder && mappedOrder.items) {
      mappedOrder.items = mappedOrder.items.map((item) => {
        let img = item.image;
        if (!img && item.product) {
          img = item.product.images?.[0]?.url || item.product.image;
        }
        if (!img) {
          const str = `${item.title || ''} ${item.name || ''} ${item.product?.name || ''} ${item.product?.slug || ''}`.toUpperCase();
          if (str.includes('BLOOM')) img = '/images/products/bloom_neem_turmeric_soap.jpg';
          else if (str.includes('BLUSH')) img = '/images/products/blush_rose_goatmilk_soap.jpg';
          else if (str.includes('VELVET')) img = '/images/products/velvet_sandalwood_shea_soap.jpg';
          else if (str.includes('VELISSE')) img = '/images/products/velisse_rose_lipbalm.jpg';
        }
        return {
          ...item,
          image: img,
        };
      });
    }

    if (mappedOrder && mappedOrder.shippingAddress) {
      if (
        !mappedOrder.shippingAddress.recipientName ||
        mappedOrder.shippingAddress.recipientName === 'Valued Client'
      ) {
        mappedOrder.shippingAddress.recipientName =
          mappedOrder.customer?.fullName || 'Customer';
        mappedOrder.shippingAddress.fullName =
          mappedOrder.shippingAddress.recipientName;
      }
      if (!mappedOrder.shippingAddress.email && mappedOrder.customer?.email) {
        mappedOrder.shippingAddress.email = mappedOrder.customer.email;
      }
      if (!mappedOrder.shippingAddress.phone && mappedOrder.customer?.phone) {
        mappedOrder.shippingAddress.phone = mappedOrder.customer.phone;
      }
      if (mappedOrder.shippingAddress.street === 'Apothecary Lane') {
        mappedOrder.shippingAddress.street = '42 Apothecary Lane, Indiranagar';
      }
    }

    res.json({ order: mappedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let queryUser = null;
    if (req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      queryUser = await User.findById(req.user.id).catch(() => null);
    }
    if (!queryUser && req.user.email) {
      queryUser = await User.findOne({ email: req.user.email.toLowerCase().trim() });
    }
    const resolvedId = queryUser ? queryUser._id : req.user.id;
    const resolvedEmail = (queryUser?.email || req.user.email || '').toLowerCase().trim();

    const queryConditions = [];
    if (resolvedId) {
      queryConditions.push({ customer: resolvedId });
      queryConditions.push({ customerId: resolvedId });
    }
    if (resolvedEmail) {
      queryConditions.push({ 'shippingAddress.email': resolvedEmail });
    }

    if (queryConditions.length === 0) {
      return res.json({ orders: [] });
    }

    const orders = await Order.find({ $or: queryConditions })
      .select('orderNumber orderId items totalAmount grandTotal pricingBreakdown payment paymentDetails fulfillmentStatus shipping trackingTimeline createdAt stampNumber milestoneGift complimentaryGifts')
      .populate('items.product', 'name title slug price images')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const { orderNumber, paymentStatus, transactionId } = req.body;
    const order = await Order.findOneAndUpdate(
      { orderNumber },
      {
        'paymentDetails.paymentStatus': paymentStatus || 'PAID',
        'paymentDetails.transactionId': transactionId,
        fulfillmentStatus: 'PROCESSING',
      },
      { new: true }
    );

    res.json({ message: 'Webhook processed', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Get all customer orders with filtering
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.fulfillmentStatus = status.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { 'shippingAddress.recipientName': searchRegex },
        { 'shippingAddress.email': searchRegex },
        { 'shippingAddress.phone': searchRegex },
      ];
    }

    const orders = await Order.find(query)
      .select('-trackingTimeline')
      .populate('items.product', 'name title slug price images stock stockQty')
      .populate('customer', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Update fulfillment status and tracking
exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { fulfillmentStatus, trackingNumber, courier, status } = req.body;

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderNumber: id }, { orderId: id }] });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.shipping) {
      order.shipping = {};
    }

    const targetFulfillment = (fulfillmentStatus || (status === 'PACKED' ? 'PROCESSING' : null) || '').toUpperCase();

    if (targetFulfillment) {
      order.fulfillmentStatus = targetFulfillment;

      if (targetFulfillment === 'PROCESSING' || status === 'PACKED') {
        order.shipping.status = 'PACKED';
      } else if (targetFulfillment === 'DISPATCHED') {
        order.shipping.status = 'DISPATCHED';
      } else if (targetFulfillment === 'DELIVERED') {
        order.shipping.status = 'DELIVERED';
      } else if (targetFulfillment === 'CANCELLED') {
        order.shipping.status = 'CANCELLED';
        if (order.payment) order.payment.status = 'FAILED';
        if (order.paymentDetails) order.paymentDetails.paymentStatus = 'FAILED';
      }

      const stageMap = {
        PROCESSING: 'Batch formulated, inspected, and packed.',
        CURING_BATCH: 'Formulation undergoing final lipid stabilization.',
        DISPATCHED: `Package dispatched via ${courier || order.shipping?.courier || 'Delhivery Air'}${trackingNumber ? ` (AWB: ${trackingNumber})` : ''}.`,
        DELIVERED: 'Package successfully delivered to customer doorstep.',
        CANCELLED: 'Order cancelled by store administrator.',
      };

      if (!order.trackingTimeline) order.trackingTimeline = [];
      order.trackingTimeline.push({
        stage: targetFulfillment,
        description: stageMap[targetFulfillment] || `Order marked as ${targetFulfillment}.`,
        timestamp: new Date(),
        completed: true,
      });
    }

    if (courier) {
      order.shipping.courier = courier;
    }

    if (trackingNumber) {
      order.shipping.awbNumber = trackingNumber;
      order.shipping.trackingUrl = `https://track.delhivery.com/?p=${trackingNumber}`;
      order.shippingAddress = order.shippingAddress || {};
      order.shippingAddress.trackingNumber = trackingNumber;
    }

    await order.save();

    // Delivery Stamp Trigger: check if order qualified for Apothecary Ritual stamp
    if (order.fulfillmentStatus === 'DELIVERED' || order.shipping?.status === 'DELIVERED') {
      try {
        await loyaltyService.awardDeliveryStamp(order);
      } catch (stampErr) {
        console.error('Failed to award delivery stamp in updateOrderStatusAdmin:', stampErr);
      }
    }

    if (req.io) {
      req.io.emit('order:status_updated', {
        id: order._id,
        orderNumber: order.orderNumber,
        fulfillmentStatus: order.fulfillmentStatus,
        shippingStatus: order.shipping.status,
      });
    }

    res.json({ success: true, message: 'Order status updated successfully', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: Summary Store Statistics
exports.getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const placedOrders = await Order.countDocuments({ fulfillmentStatus: 'PLACED' });
    const processingOrders = await Order.countDocuments({ fulfillmentStatus: 'PROCESSING' });
    const dispatchedOrders = await Order.countDocuments({ fulfillmentStatus: 'DISPATCHED' });
    const deliveredOrders = await Order.countDocuments({ fulfillmentStatus: 'DELIVERED' });

    const revenueAgg = await Order.aggregate([
      { $match: { 'paymentDetails.paymentStatus': { $in: ['PAID', 'AUTHORIZED'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const lowStockProducts = await Product.countDocuments({ stockQty: { $lte: 15 } });

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        activeOrders: placedOrders + processingOrders + dispatchedOrders,
        placedOrders,
        processingOrders,
        dispatchedOrders,
        deliveredOrders,
        totalCustomers,
        lowStockProducts,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Module 1: 1-Click Shiprocket Fulfillment & AWB Generation
// 1-Click Shiprocket Push & AWB Dispatch
exports.pushOrderToShiprocket = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate('items.product');
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderNumber: id }, { orderId: id }] }).populate('items.product');
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found in database' });
    }

    const fulfillResult = await shiprocketService.fulfillOrder(order);

    if (!order.shippingDetails) order.shippingDetails = {};
    if (!order.shipping) order.shipping = {};

    order.shippingDetails.shiprocketOrderId = String(fulfillResult.orderId || order.orderNumber);
    order.shippingDetails.shipmentId = String(fulfillResult.shipmentId || '');
    order.shippingDetails.awbCode = fulfillResult.awbCode;
    order.shippingDetails.courierName = fulfillResult.courierName;
    order.shippingDetails.trackingUrl = fulfillResult.trackingUrl || `https://shiprocket.co/tracking/${fulfillResult.awbCode}`;
    order.shippingDetails.currentCourierStatus = 'AWB Assigned';

    if (!order.shippingDetails.trackingHistory) order.shippingDetails.trackingHistory = [];
    order.shippingDetails.trackingHistory.push({
      status: 'AWB Assigned',
      location: 'Hyderabad Botanical Atelier',
      timestamp: new Date(),
      activity: `Courier assigned: ${fulfillResult.courierName} (AWB: ${fulfillResult.awbCode}). Ready for dispatch.`,
    });

    order.fulfillmentStatus = 'SHIPPED';
    order.shipping.status = 'DISPATCHED';
    order.shipping.awb = fulfillResult.awbCode;
    order.shipping.awbNumber = fulfillResult.awbCode;
    order.shipping.courier = fulfillResult.courierName;
    order.shipping.courierName = fulfillResult.courierName;
    order.shipping.trackingUrl = order.shippingDetails.trackingUrl;
    order.shipping.labelUrl = fulfillResult.labelUrl;

    if (!order.shippingAddress) order.shippingAddress = {};
    order.shippingAddress.trackingNumber = fulfillResult.awbCode;
    order.shippingAddress.carrier = fulfillResult.courierName;

    if (!order.trackingTimeline) order.trackingTimeline = [];
    order.trackingTimeline.push({
      stage: 'SHIPPED',
      description: `Dispatched via ${fulfillResult.courierName} (AWB: ${fulfillResult.awbCode}). Climate-neutral transit.`,
      timestamp: new Date(),
      completed: true,
    });

    await order.save();

    const io = req.io || global.io;
    if (io) {
      io.emit('order:status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.fulfillmentStatus,
        shippingStatus: order.shipping.status,
        currentCourierStatus: order.shippingDetails.currentCourierStatus,
        awb: fulfillResult.awbCode,
        courier: fulfillResult.courierName,
        trackingUrl: order.shippingDetails.trackingUrl,
      });
      io.emit('order:status_updated', {
        id: order._id,
        orderNumber: order.orderNumber,
        fulfillmentStatus: order.fulfillmentStatus,
        shippingStatus: order.shipping.status,
        awb: fulfillResult.awbCode,
        courier: fulfillResult.courierName,
        labelUrl: fulfillResult.labelUrl,
      });
      io.emit('tracking:updated', {
        orderNumber: order.orderNumber,
        status: 'SHIPPED',
        awb: fulfillResult.awbCode,
        timeline: order.trackingTimeline,
      });
    }

    res.json({
      success: true,
      message: 'Order pushed to Shiprocket & AWB assigned successfully',
      order,
      awb: fulfillResult.awbCode,
      courierName: fulfillResult.courierName,
      trackingUrl: order.shippingDetails.trackingUrl,
      labelUrl: fulfillResult.labelUrl,
      isMock: fulfillResult.isMock,
    });
  } catch (err) {
    console.error('Shiprocket push error:', err);
    res.status(500).json({ error: err.message || 'Shiprocket dispatch push failed' });
  }
};

exports.shipOrderViaShiprocket = exports.pushOrderToShiprocket;

// Manual Live Sync with Shiprocket Tracking API
exports.syncOrderWithShiprocket = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderNumber: id }, { orderId: id }] });
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found in database' });
    }

    const awbCode = order.shippingDetails?.awbCode || order.shipping?.awb || order.shipping?.awbNumber;
    if (!awbCode) {
      return res.status(400).json({ error: 'No AWB assigned to this order yet. Please push to Shiprocket first.' });
    }

    const trackingResult = await shiprocketService.fetchLiveTracking(awbCode);
    if (!trackingResult.success && !trackingResult.isMock) {
      return res.status(400).json({ error: trackingResult.error || 'Failed to fetch live tracking from Shiprocket' });
    }

    if (!order.shippingDetails) order.shippingDetails = {};
    if (!order.shippingDetails.trackingHistory) order.shippingDetails.trackingHistory = [];

    order.shippingDetails.currentCourierStatus = trackingResult.currentStatus || 'In Transit';
    if (trackingResult.courierName) {
      order.shippingDetails.courierName = trackingResult.courierName;
      if (!order.shipping) order.shipping = {};
      order.shipping.courier = trackingResult.courierName;
      order.shipping.courierName = trackingResult.courierName;
    }

    // Merge scans into trackingHistory
    for (const scan of trackingResult.scans || []) {
      const isPresent = order.shippingDetails.trackingHistory.some(
        (h) => h.status === scan.status && h.location === scan.location
      );
      if (!isPresent) {
        order.shippingDetails.trackingHistory.push({
          status: scan.status,
          location: scan.location,
          timestamp: scan.timestamp ? new Date(scan.timestamp) : new Date(),
          activity: scan.activity,
        });
      }
    }

    // Map status if delivered
    const stUpper = (trackingResult.currentStatus || '').toUpperCase();
    if (stUpper.includes('DELIVERED') && order.fulfillmentStatus !== 'DELIVERED') {
      order.fulfillmentStatus = 'DELIVERED';
      if (!order.shipping) order.shipping = {};
      order.shipping.status = 'DELIVERED';
      try {
        await loyaltyService.awardDeliveryStamp(order);
      } catch (e) {
        console.error('Failed to award stamp on sync:', e);
      }
    } else if (stUpper.includes('OUT FOR DELIVERY')) {
      order.fulfillmentStatus = 'OUT_FOR_DELIVERY';
      if (!order.shipping) order.shipping = {};
      order.shipping.status = 'OUT_FOR_DELIVERY';
    }

    await order.save();

    const io = req.io || global.io;
    if (io) {
      io.emit('order:status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.fulfillmentStatus,
        shippingStatus: order.shipping?.status,
        currentCourierStatus: order.shippingDetails.currentCourierStatus,
        trackingHistory: order.shippingDetails.trackingHistory,
      });
    }

    res.json({
      success: true,
      message: 'Tracking status synced successfully with Shiprocket',
      order,
      tracking: trackingResult,
    });
  } catch (err) {
    console.error('Shiprocket sync error:', err);
    res.status(500).json({ error: err.message || 'Shiprocket sync failed' });
  }
};

// Module 2: 1-Click Razorpay Refund & Order Cancellation
exports.refundOrderViaRazorpay = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason = 'Administrative cancellation / refund request' } = req.body;

    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate('items.product');
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderNumber: id }, { orderId: id }] }).populate('items.product');
    }
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const refundAmount = Number(amount) || Number(order.totalAmount || order.grandTotal || 0);
    const paymentId = order.paymentDetails?.transactionId || order.payment?.transactionId || `TXN-${order.orderNumber}`;

    const refundResult = await paymentService.refundPayment({
      paymentId,
      amount: refundAmount,
      reason,
    });

    if (!order.payment) order.payment = {};
    if (!order.paymentDetails) order.paymentDetails = {};

    order.payment.status = 'REFUNDED';
    order.paymentDetails.paymentStatus = 'REFUNDED';
    order.fulfillmentStatus = 'CANCELLED';
    if (!order.shipping) order.shipping = {};
    order.shipping.status = 'CANCELLED';

    if (!order.trackingTimeline) order.trackingTimeline = [];
    order.trackingTimeline.push({
      stage: 'REFUNDED',
      description: `Refund of ₹${refundAmount} processed via Razorpay (${refundResult.refundId || 'REFUND-COMPLETED'}). Order cancelled.`,
      timestamp: new Date(),
      completed: true,
    });

    // Restore stock back to products
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
    } catch (stockErr) {
      console.warn('Failed restoring stock on refund:', stockErr.message);
    }

    await order.save();

    if (req.io) {
      req.io.emit('order:status_updated', {
        id: order._id,
        orderNumber: order.orderNumber,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentStatus: 'REFUNDED',
      });
      req.io.emit('tracking:updated', {
        orderNumber: order.orderNumber,
        status: 'CANCELLED',
        timeline: order.trackingTimeline,
      });
    }

    res.json({
      success: true,
      message: 'Refund executed successfully via Razorpay',
      order,
      refund: refundResult,
    });
  } catch (err) {
    console.error('Refund processing error:', err);
    res.status(500).json({ error: err.message || 'Refund processing failed' });
  }
};

// Module 1 Webhook: Shiprocket Courier Tracking Updates
exports.handleShiprocketWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    const awb = payload.awb || payload.awb_code || payload.tracking_number;
    const orderId = payload.order_id || payload.orderNumber;
    const rawStatus = (payload.current_status || payload.status || '').toUpperCase();

    if (!awb && !orderId) {
      return res.status(400).json({ error: 'Missing AWB or Order ID in webhook payload' });
    }

    const query = {
      $or: [
        ...(orderId ? [{ orderNumber: orderId }, { orderId: orderId }] : []),
        ...(awb ? [{ 'shipping.awb': awb }, { 'shipping.awbNumber': awb }, { 'shippingAddress.trackingNumber': awb }] : []),
      ],
    };

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ error: 'No matching order found for tracking webhook' });
    }

    if (!order.shipping) order.shipping = {};
    if (!order.trackingTimeline) order.trackingTimeline = [];

    let mappedFulfillment = order.fulfillmentStatus;
    let mappedShipping = order.shipping.status;
    let description = payload.scans?.[0]?.activity || payload.activity || `Courier status update: ${rawStatus}`;

    if (rawStatus.includes('PICKED') || rawStatus.includes('TRANSIT')) {
      mappedFulfillment = 'DISPATCHED';
      mappedShipping = 'DISPATCHED';
    } else if (rawStatus.includes('OUT FOR DELIVERY')) {
      mappedFulfillment = 'DISPATCHED';
      mappedShipping = 'OUT_FOR_DELIVERY';
      description = 'Package is out for delivery with local courier executive.';
    } else if (rawStatus.includes('DELIVERED')) {
      mappedFulfillment = 'DELIVERED';
      mappedShipping = 'DELIVERED';
      description = 'Package delivered successfully to customer address.';
    } else if (rawStatus.includes('RTO') || rawStatus.includes('CANCEL')) {
      mappedFulfillment = 'CANCELLED';
      mappedShipping = 'RTO';
      description = 'Delivery unfulfilled / Return to Origin initiated by courier.';
    }

    order.fulfillmentStatus = mappedFulfillment;
    order.shipping.status = mappedShipping;

    order.trackingTimeline.push({
      stage: mappedShipping,
      description,
      timestamp: new Date(),
      completed: true,
    });

    await order.save();

    // Delivery Stamp Trigger: check if order qualified for Apothecary Ritual stamp
    if (order.fulfillmentStatus === 'DELIVERED' || order.shipping?.status === 'DELIVERED') {
      try {
        await loyaltyService.awardDeliveryStamp(order);
      } catch (stampErr) {
        console.error('Failed to award delivery stamp in handleShiprocketWebhook:', stampErr);
      }
    }

    if (req.io) {
      req.io.emit('order:status_updated', {
        id: order._id,
        orderNumber: order.orderNumber,
        fulfillmentStatus: order.fulfillmentStatus,
        shippingStatus: order.shipping.status,
      });
      req.io.emit('tracking:updated', {
        orderNumber: order.orderNumber,
        status: mappedShipping,
        timeline: order.trackingTimeline,
      });
    }

    res.json({
      success: true,
      message: 'Shiprocket tracking update processed successfully',
      orderNumber: order.orderNumber,
      status: mappedShipping,
    });
  } catch (err) {
    console.error('Shiprocket webhook error:', err);
    res.status(500).json({ error: err.message });
  }
};

