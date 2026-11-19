const redisClient = require('../config/redis');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const HOLD_TTL_SECONDS = 900; // 15-minute stock hold

class InventoryLockService {
  /**
   * Acquire temporary stock reservation for a user session during checkout
   */
  async reserveProductStock(productId, quantity, sessionId) {
    let product = null;

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product && productId) {
      product = await Product.findOne({
        $or: [{ slug: productId }, { handle: productId }],
      });
    }
    if (!product) {
      product = await Product.findOne();
    }
    if (!product) {
      return { success: false, message: 'No active stock' };
    }

    const currentStock = product.stockQty !== undefined ? product.stockQty : (product.stock || 0);

    let totalReserved = 0;
    try {
      const holdKeyPattern = `reservation:product:${productId}:*`;
      const activeHoldKeys = await redisClient.keys(holdKeyPattern);

      for (const key of activeHoldKeys) {
        if (!key.endsWith(sessionId)) {
          const val = await redisClient.get(key);
          if (val) totalReserved += parseInt(val, 10) || 0;
        }
      }
    } catch (redisErr) {
      // Redis optional in local dev
    }

    const availableStock = currentStock - totalReserved;
    if (availableStock < quantity) {
      throw new Error(
        `Insufficient batch stock for "${product.name}". Available: ${Math.max(0, availableStock)}, Requested: ${quantity}`
      );
    }

    try {
      const sessionKey = `reservation:product:${productId}:${sessionId}`;
      await redisClient.set(sessionKey, quantity, 'EX', HOLD_TTL_SECONDS);
    } catch (e) {}

    return {
      success: true,
      productId,
      reservedQuantity: quantity,
      expiresInSeconds: HOLD_TTL_SECONDS,
    };
  }

  /**
   * Release reservation when cart is cleared or checkout completes
   */
  async releaseProductStock(productId, sessionId) {
    try {
      const sessionKey = `reservation:product:${productId}:${sessionId}`;
      await redisClient.del(sessionKey);
    } catch (e) {}
  }

  /**
   * Finalize order and atomically deduct database stock + lock status if 0
   */
  async commitStockReduction(items, sessionId) {
    for (const item of items) {
      const pid = item.product?._id || item.product || item.productId;
      const qty = Number(item.quantity) || 1;

      if (!pid) continue;

      let product = null;
      if (mongoose.Types.ObjectId.isValid(pid)) {
        product = await Product.findById(pid);
      }
      if (!product) {
        product = await Product.findOne({
          $or: [{ slug: pid }, { handle: pid }, { name: item.title || item.name }],
        });
      }

      if (product) {
        const currentStock = Number(product.stockQty !== undefined ? product.stockQty : (product.stock || 0));
        const newStock = Math.max(0, currentStock - qty);

        product.stockQty = newStock;
        product.stock = newStock;

        // Automatically set status to OUT_OF_STOCK if stock hits 0
        if (newStock === 0) {
          product.status = 'OUT_OF_STOCK';
        }

        // Deduct from batches if applicable (FEFO: earliest expiry first)
        if (product.batches && product.batches.length > 0) {
          let remainingToDeduct = qty;
          // Sort active batches by expDate ascending
          product.batches.sort((a, b) => new Date(a.expDate) - new Date(b.expDate));
          for (const b of product.batches) {
            if (b.stockQuantity > 0 && remainingToDeduct > 0) {
              const deduct = Math.min(b.stockQuantity, remainingToDeduct);
              b.stockQuantity -= deduct;
              remainingToDeduct -= deduct;
            }
          }
        }

        await product.save();
      }

      if (sessionId) {
        try {
          await this.releaseProductStock(pid, sessionId);
        } catch (releaseErr) {}
      }
    }
  }
}

module.exports = new InventoryLockService();
