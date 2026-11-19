const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SkinQuizRule = require('../models/SkinQuizRule');

// 1. Dashboard KPIs & Urgent Alerts Analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [allOrders, allProducts] = await Promise.all([
      Order.find()
        .select('orderNumber orderId totalAmount pricingBreakdown payment paymentDetails fulfillmentStatus shipping items createdAt customer shippingAddress')
        .sort({ createdAt: -1 })
        .lean(),
      Product.find()
        .select('name title stock stockQty totalStock lowStockThreshold category batches')
        .lean(),
    ]);

    // KPI 1: Total Revenue (sum of totalAmount from orders where payment is PAID or AUTHORIZED)
    const paidOrders = allOrders.filter((ord) => {
      const paySt = (ord.payment?.status || ord.paymentDetails?.paymentStatus || '').toUpperCase();
      return paySt === 'PAID' || paySt === 'AUTHORIZED' || paySt === 'CAPTURED';
    });
    const totalRevenue = paidOrders.reduce((sum, ord) => sum + (ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0), 0);

    // KPI 1b: Today's Revenue
    const todayOrders = paidOrders.filter((ord) => new Date(ord.createdAt) >= todayStart);
    const todayRevenue = todayOrders.reduce((sum, ord) => sum + (ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0), 0);

    // KPI 2: Total Orders
    const totalOrdersCount = allOrders.length;

    // KPI 3: Units Sold (total item quantity across non-cancelled orders)
    const validOrders = allOrders.filter((ord) => {
      const st = (ord.fulfillmentStatus || ord.shipping?.status || '').toUpperCase();
      return st !== 'CANCELLED' && st !== 'RTO' && ord.payment?.status !== 'FAILED';
    });
    const unitsSold = validOrders.reduce((sum, ord) => {
      const itemsCount = (ord.items || []).reduce((iSum, itm) => iSum + (Number(itm.quantity) || 1), 0);
      return sum + itemsCount;
    }, 0);

    // KPI 4: Pending Dispatch (count of orders with status 'PLACED' or 'PROCESSING')
    const pendingDispatchOrders = allOrders.filter((ord) => {
      const st = (ord.fulfillmentStatus || ord.shipping?.status || '').toUpperCase();
      return st === 'PLACED' || st === 'PROCESSING' || st === 'UNFULFILLED' || st === 'PACKED';
    });
    const pendingDispatchCount = pendingDispatchOrders.length;

    // KPI 5: Active COD Value (sum of COD orders pending fulfillment)
    const activeCodOrders = allOrders.filter((ord) => {
      const isCod = (ord.payment?.mode || ord.paymentDetails?.provider || ord.paymentMethod || '').toUpperCase() === 'COD';
      const st = (ord.fulfillmentStatus || ord.shipping?.status || '').toUpperCase();
      return isCod && (st === 'PLACED' || st === 'PROCESSING' || st === 'UNFULFILLED' || st === 'PACKED');
    });
    const activeCodValue = activeCodOrders.reduce((sum, ord) => sum + (ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0), 0);

    // Urgent Alert 1: Low stock warning products (stock <= 15 or lowStockThreshold)
    const lowStockAlerts = allProducts
      .filter((p) => {
        const threshold = p.lowStockThreshold || 15;
        const currentStock = p.stockQty !== undefined ? p.stockQty : (p.stock !== undefined ? p.stock : (p.totalStock || 0));
        return currentStock <= threshold || currentStock <= 15;
      })
      .map((p) => ({
        id: p._id,
        title: p.title || p.name,
        currentStock: p.stockQty !== undefined ? p.stockQty : (p.stock || 0),
        threshold: p.lowStockThreshold || 15,
      }));

    // Urgent Alert 2: Near-expiry batches (< 90 days remaining)
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const nearExpiryBatches = [];

    allProducts.forEach((p) => {
      (p.batches || []).forEach((b) => {
        if (b.stockQuantity > 0 && b.expDate) {
          const expTime = new Date(b.expDate).getTime();
          const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 90) {
            nearExpiryBatches.push({
              productId: p._id,
              productTitle: p.title || p.name,
              batchNumber: b.batchNumber,
              unitsLeft: b.stockQuantity,
              expDate: b.expDate,
              daysRemaining: daysLeft,
              status: daysLeft <= 0 ? 'EXPIRED' : 'EXPIRING_SOON',
            });
          }
        }
      });
    });

    // Urgent Alert 3: Unfulfilled orders pending > 24 hours
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const delayedUnfulfilledOrders = allOrders
      .filter((ord) => {
        const st = (ord.shipping?.status || ord.fulfillmentStatus || '').toUpperCase();
        const isPending = st === 'UNFULFILLED' || st === 'PLACED';
        const isOld = new Date(ord.createdAt) < twentyFourHoursAgo;
        return isPending && isOld;
      })
      .map((ord) => ({
        orderId: ord.orderId || ord.orderNumber,
        customerName: ord.customer?.name || ord.shippingAddress?.recipientName,
        hoursElapsed: Math.floor((now - new Date(ord.createdAt).getTime()) / (1000 * 60 * 60)),
        totalAmount: ord.totalAmount || 0,
      }));

    // Charts: 7-Day & 30-Day Revenue Trends from live orders
    const getLiveTrends = (days) => {
      return Array.from({ length: days }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayOrders = allOrders.filter((ord) => {
          const ordDate = ord.createdAt ? new Date(ord.createdAt).toISOString().split('T')[0] : '';
          return ordDate === dateStr;
        });
        const dayRev = dayOrders
          .filter((ord) => {
            const paySt = (ord.payment?.status || ord.paymentDetails?.paymentStatus || '').toUpperCase();
            return paySt === 'PAID' || paySt === 'AUTHORIZED' || paySt === 'CAPTURED';
          })
          .reduce((sum, ord) => sum + (ord.totalAmount || ord.pricingBreakdown?.totalAmount || 0), 0);

        return {
          date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          revenue: dayRev,
          orders: dayOrders.length,
        };
      });
    };

    const last7Days = getLiveTrends(7);
    const last30Days = getLiveTrends(30);

    // Top Best-Selling Products from live orders
    const salesMap = {};
    allOrders.forEach((ord) => {
      (ord.items || []).forEach((itm) => {
        const title = itm.title || itm.name || 'Botanical Formulation';
        const pId = itm.productId || itm.product?.toString() || 'prod_unknown';
        if (!salesMap[title]) {
          const matchedProd = allProducts.find((p) => (p.title || p.name) === title || p._id.toString() === pId);
          salesMap[title] = {
            id: pId,
            title,
            units: 0,
            unitsSold: 0,
            stockRemaining: matchedProd ? (matchedProd.stockQty !== undefined ? matchedProd.stockQty : matchedProd.stock) : 0,
            activePct: matchedProd?.category === 'Soaps' ? 'Cold-Process Soap' : 'Botanical Lip Care',
          };
        }
        salesMap[title].units += (Number(itm.quantity) || 1);
        salesMap[title].unitsSold += (Number(itm.quantity) || 1);
      });
    });

    let topSellingProducts = Object.values(salesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    if (topSellingProducts.length === 0) {
      topSellingProducts = allProducts.slice(0, 4).map((p) => ({
        id: p._id,
        title: p.title || p.name,
        units: 0,
        unitsSold: 0,
        stockRemaining: p.stockQty || 0,
        activePct: p.category || 'Botanical Formulation',
      }));
    }

    // RTO & Return Rate
    const rtoCount = allOrders.filter((ord) => (ord.shipping?.status || ord.fulfillmentStatus) === 'RTO').length;
    const rtoRate = allOrders.length > 0 ? Math.round((rtoCount / allOrders.length) * 1000) / 10 : 0;

    const payload = {
      success: true,
      totalRevenue,
      activeCodValue,
      unitsSold,
      lowStockAlerts,
      pendingDispatch: pendingDispatchCount,
      kpis: {
        totalRevenue,
        todayRevenue,
        totalOrders: totalOrdersCount,
        unitsSold,
        pendingDispatch: pendingDispatchCount,
        activeCodValue,
      },
      urgentAlerts: {
        lowStockCount: lowStockAlerts.length,
        lowStockItems: lowStockAlerts,
        lowStockAlerts,
        nearExpiryCount: nearExpiryBatches.length,
        nearExpiryItems: nearExpiryBatches,
        nearExpiryBatches,
        unfulfilledCount: delayedUnfulfilledOrders.length,
        unfulfilledOrders: delayedUnfulfilledOrders,
        delayedUnfulfilledOrders,
      },
      charts: {
        revenueTrends7D: last7Days,
        revenueTrends30D: last30Days,
        topSellingProducts,
        rtoRate,
      },
      topSellingProducts,
      revenueTrends7D: last7Days,
      revenueTrends30D: last30Days,
      revenueTrends: last7Days,
      rtoRate,
    };

    res.json(payload);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to compute dashboard analytics' });
  }
};

exports.getAdminDashboardStats = exports.getDashboardAnalytics;

// 2. Inventory & Expiry Watchlist (FEFO Aggregator)
exports.getBatchExpiryWatchlist = async (req, res) => {
  try {
    const products = await Product.find()
      .select('name title slug batches costPrice price')
      .lean();
    const watchlist = [];
    const now = Date.now();

    products.forEach((p) => {
      (p.batches || []).forEach((b) => {
        const expTime = new Date(b.expDate).getTime();
        const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        const isWrittenOff = b.isWrittenOff === true || b.stockQuantity === 0;
        let status = 'SAFE';
        if (isWrittenOff) status = 'WRITTEN_OFF';
        else if (daysLeft <= 0) status = 'EXPIRED';
        else if (daysLeft <= 90) status = 'EXPIRING_SOON';

        watchlist.push({
          productId: p._id,
          productName: p.title || p.name,
          sku: `${(p.slug || p._id).slice(0, 4).toUpperCase()}-${b.batchNumber}`,
          batchNumber: b.batchNumber,
          mfgDate: b.mfgDate,
          expDate: b.expDate,
          unitsLeft: b.stockQuantity,
          stockQuantity: b.stockQuantity,
          reservedQuantity: b.reservedQuantity || 0,
          previousStockQuantity: b.previousStockQuantity || 10,
          daysRemaining: daysLeft,
          status,
          isWrittenOff,
          actionableLossValue: b.stockQuantity * (p.costPrice || Math.round(p.price * 0.3)),
        });
      });
    });

    // Sort by FEFO (earliest expiry date first, but written-off at bottom)
    watchlist.sort((a, b) => {
      if (a.isWrittenOff && !b.isWrittenOff) return 1;
      if (!a.isWrittenOff && b.isWrittenOff) return -1;
      return new Date(a.expDate).getTime() - new Date(b.expDate).getTime();
    });

    res.json({ success: true, watchlist });
  } catch (error) {
    console.error('Error fetching batch watchlist:', error);
    res.status(500).json({ error: 'Failed to retrieve expiry watchlist' });
  }
};

// 3. Write-off Damaged or Expired Stock (with Undo support)
exports.writeOffBatch = async (req, res) => {
  try {
    const { productId, batchNumber, isUndo, restoredQuantity } = req.body;
    let product = null;

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product && productId) {
      product = await Product.findOne({ $or: [{ slug: productId }, { _id: productId }] });
    }
    if (!product && batchNumber) {
      product = await Product.findOne({ 'batches.batchNumber': batchNumber });
    }
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const batch = (product.batches || []).find((b) => b.batchNumber === batchNumber);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (isUndo) {
      const unitsToRestore = Math.max(1, parseInt(restoredQuantity, 10) || batch.previousStockQuantity || 10);
      batch.stockQuantity = unitsToRestore;
      batch.isWrittenOff = false;
      batch.status = 'ACTIVE';
      product.stockQty = (product.stockQty || 0) + unitsToRestore;
      await product.save();
      return res.json({
        success: true,
        message: `Successfully restored ${unitsToRestore} units for batch ${batchNumber}.`,
        restoredQuantity: unitsToRestore,
      });
    }

    const writtenOffUnits = batch.stockQuantity;
    batch.previousStockQuantity = batch.stockQuantity > 0 ? batch.stockQuantity : (batch.previousStockQuantity || 10);
    batch.stockQuantity = 0;
    batch.isWrittenOff = true;
    batch.status = 'WRITTEN_OFF';
    product.stockQty = Math.max(0, (product.stockQty || 0) - writtenOffUnits);
    await product.save();

    res.json({
      success: true,
      message: `Successfully written off ${writtenOffUnits} units of batch ${batchNumber}.`,
      previousStockQuantity: batch.previousStockQuantity,
    });
  } catch (error) {
    console.error('Error writing off batch:', error);
    res.status(500).json({ error: 'Failed to process stock write-off' });
  }
};

// 4. Skin Quiz & Routine Manager
exports.getQuizRules = async (req, res) => {
  try {
    let rules = await SkinQuizRule.find().populate('recommendedProductIds recommendedRoutine.am recommendedRoutine.pm');
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching quiz rules:', error);
    res.status(500).json({ error: 'Failed to retrieve skin quiz rules' });
  }
};

exports.createOrUpdateQuizRule = async (req, res) => {
  try {
    const { id, concern, skinType, recommendedProductIds, recommendedRoutine, adviceHeadline, activeContraindicationWarnings } = req.body;

    let rule;
    if (id) {
      rule = await SkinQuizRule.findByIdAndUpdate(
        id,
        { concern, skinType, recommendedProductIds, recommendedRoutine, adviceHeadline, activeContraindicationWarnings },
        { new: true }
      );
    } else {
      rule = await SkinQuizRule.create({
        concern,
        skinType,
        recommendedProductIds,
        recommendedRoutine,
        adviceHeadline,
        activeContraindicationWarnings,
      });
    }

    res.json({ success: true, rule });
  } catch (error) {
    console.error('Error updating quiz rule:', error);
    res.status(400).json({ error: error.message || 'Failed to save quiz rule' });
  }
};

exports.deleteQuizRule = async (req, res) => {
  try {
    const { id } = req.params;
    await SkinQuizRule.findByIdAndDelete(id);
    res.json({ success: true, message: 'Quiz rule deleted.' });
  } catch (error) {
    console.error('Error deleting quiz rule:', error);
    res.status(500).json({ error: 'Failed to delete quiz rule' });
  }
};

