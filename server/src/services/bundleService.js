const Product = require('../models/Product');

class BundleService {
  /**
   * Validate bundle items from database and compute progressive tiered discounts
   * Tiered discount: 10% on 2 items, 15% on 3+ items
   */
  async calculateBundle(itemIds, includeGiftPackaging = false) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error('Bundle must contain at least 1 product');
    }

    const products = await Product.find({ _id: { $in: itemIds } });
    if (products.length !== itemIds.length) {
      throw new Error('One or more selected bundle items are invalid');
    }

    let subtotal = 0;
    const items = [];

    for (const pid of itemIds) {
      const prod = products.find((p) => p._id.toString() === pid.toString());
      subtotal += prod.price;
      items.push({
        product: prod._id,
        name: prod.name,
        price: prod.price,
        activesConcentration: prod.activesConcentration,
        category: prod.category,
        image: prod.images && prod.images[0] ? prod.images[0].url : '',
      });
    }

    let discountPercentage = 0;
    if (items.length === 2) {
      discountPercentage = 10;
    } else if (items.length >= 3) {
      discountPercentage = 15;
    }

    const discountAmount = Math.round((subtotal * discountPercentage) / 100);
    const packagingFee = includeGiftPackaging ? 99 : 0;
    const totalAmount = subtotal - discountAmount + packagingFee;

    return {
      items,
      itemCount: items.length,
      subtotal,
      discountPercentage,
      discountAmount,
      packagingFee,
      totalAmount,
      isQualifiedBundle: items.length >= 2,
    };
  }
}

module.exports = new BundleService();
