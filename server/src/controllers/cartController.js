const bundleService = require('../services/bundleService');
const inventoryLockService = require('../services/inventoryLockService');

exports.validateBundle = async (req, res) => {
  try {
    const { itemIds, includeGiftPackaging } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'Array of itemIds is required' });
    }

    const bundleCalculation = await bundleService.calculateBundle(itemIds, includeGiftPackaging);
    res.json(bundleCalculation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.reserveStock = async (req, res) => {
  try {
    const { items, sessionId } = req.body;

    if (!items || !Array.isArray(items) || !sessionId) {
      return res.status(400).json({ error: 'Items array and sessionId are required' });
    }

    const reservations = [];
    for (const item of items) {
      const pid = item.productId || item.product || item._id;
      const resv = await inventoryLockService.reserveProductStock(pid, item.quantity || 1, sessionId);
      reservations.push(resv);
    }

    res.json({
      message: 'Batch inventory reserved for 15 minutes',
      reservations,
    });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
};

exports.releaseStock = async (req, res) => {
  try {
    const { productId, sessionId } = req.body;
    if (productId && sessionId) {
      await inventoryLockService.releaseProductStock(productId, sessionId);
    }
    res.json({ message: 'Stock reservation released' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
