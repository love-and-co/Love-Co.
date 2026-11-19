const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const PRODUCT_SELECT_FIELDS =
  'name slug price compareAtPrice images stock stockQty category subtitle title isBestSeller isNewLaunch status ratings activesConcentration volumeWeight handle description';

/**
 * Resolve product identifier (ObjectId, slug, or handle) to product document
 */
async function resolveProduct(identifier) {
  if (!identifier) return null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const product = await Product.findById(identifier);
    if (product) return product;
  }

  // Lookup by slug or handle
  return await Product.findOne({
    $or: [{ slug: identifier }, { handle: identifier }],
  });
}

/**
 * GET /api/v1/wishlist
 * Returns populated wishlist items for the authenticated user
 */
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).populate({
      path: 'wishlist',
      select: PRODUCT_SELECT_FIELDS,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    // Filter out any broken / deleted references
    const validItems = (user.wishlist || []).filter((item) => item !== null && Boolean(item._id));

    // If any null references were detected, clean them up asynchronously
    if (validItems.length !== (user.wishlist || []).length) {
      user.wishlist = validItems.map((item) => item._id);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      count: validItems.length,
      wishlist: validItems,
      wishlistIds: validItems.map((item) => item._id.toString()),
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve wishlist' });
  }
};

/**
 * POST /api/v1/wishlist/toggle
 * Atomically toggle a product in user's wishlist ($addToSet or $pull)
 */
exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, id, slug } = req.body;
    const rawIdentifier = productId || id || slug;

    if (!rawIdentifier) {
      return res.status(400).json({ success: false, error: 'Product identifier is required' });
    }

    const product = await resolveProduct(rawIdentifier);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found in apothecary catalog' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const targetIdStr = product._id.toString();
    const isAlreadyInWishlist = (user.wishlist || []).some(
      (savedId) => savedId && savedId.toString() === targetIdStr
    );

    let updatedUser;
    let isAdded = false;

    if (isAlreadyInWishlist) {
      // Remove via atomic $pull
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { wishlist: product._id } },
        { new: true }
      ).populate({
        path: 'wishlist',
        select: PRODUCT_SELECT_FIELDS,
      });
      isAdded = false;
    } else {
      // Add via atomic $addToSet
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { wishlist: product._id } },
        { new: true }
      ).populate({
        path: 'wishlist',
        select: PRODUCT_SELECT_FIELDS,
      });
      isAdded = true;
    }

    const validItems = (updatedUser.wishlist || []).filter((item) => item !== null && Boolean(item._id));

    return res.status(200).json({
      success: true,
      isAdded,
      productId: product._id.toString(),
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
      },
      count: validItems.length,
      wishlist: validItems,
      wishlistIds: validItems.map((item) => item._id.toString()),
      message: isAdded
        ? `${product.name} saved to your wishlist`
        : `${product.name} removed from your wishlist`,
    });
  } catch (error) {
    console.error('Error toggling wishlist item:', error);
    return res.status(500).json({ success: false, error: 'Failed to update wishlist' });
  }
};

/**
 * DELETE /api/v1/wishlist/:productId
 * Remove an item from the user's wishlist
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product identifier is required' });
    }

    const product = await resolveProduct(productId);
    const targetObjectId = product ? product._id : (mongoose.Types.ObjectId.isValid(productId) ? productId : null);

    if (!targetObjectId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: targetObjectId } },
      { new: true }
    ).populate({
      path: 'wishlist',
      select: PRODUCT_SELECT_FIELDS,
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const validItems = (updatedUser.wishlist || []).filter((item) => item !== null && Boolean(item._id));

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: validItems.length,
      wishlist: validItems,
      wishlistIds: validItems.map((item) => item._id.toString()),
    });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove product from wishlist' });
  }
};
