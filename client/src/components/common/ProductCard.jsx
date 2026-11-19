import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, Heart, Edit3 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';

export default function ProductCard({ product }) {
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistIds = useWishlistStore((state) => state.wishlistIds);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin =
    isAuthenticated &&
    user?.role === 'admin' &&
    ['loveandcosupport@gmail.com', 'loveandcoadmin@gmail.com'].includes((user?.email || '').toLowerCase().trim());

  const currentStock = product.stock !== undefined ? product.stock : (product.stockQty !== undefined ? product.stockQty : 50);
  const isSoldOut = currentStock === 0 || product.status === 'OUT_OF_STOCK';

  // Find matching item in cart
  const cartItem = (cartItems || []).find((item) => {
    const prodId = String(product._id || product.id || '');
    const prodSlug = String(product.slug || '');
    const itemId = String(item.id || item._id || '');
    const itemSlug = String(item.slug || '');
    const itemCartLineId = String(item.cartLineId || '');

    if (prodId && (itemId === prodId || itemCartLineId === prodId || itemCartLineId.startsWith(`${prodId}-`))) {
      return true;
    }
    if (prodSlug && (itemSlug === prodSlug || itemId === prodSlug || itemCartLineId === prodSlug || itemCartLineId.startsWith(`${prodSlug}-`))) {
      return true;
    }
    return false;
  });

  const quantity = cartItem?.quantity || 0;

  const ratingValue = Number(
    product.rating ?? product.ratings?.average ?? product.averageRating ?? 4.9
  );
  const formattedRating = (isNaN(ratingValue) ? 4.9 : ratingValue).toFixed(1);

  const reviewCount =
    product.numReviews ||
    product.reviewCount ||
    product.ratings?.count ||
    (Array.isArray(product.reviews) ? product.reviews.length : 0) ||
    24;

  const rawVolume = (product.volumeWeight || product.volume || product.size || '100g bar').trim();
  const volumeLabel =
    rawVolume.toLowerCase().endsWith('g') && !rawVolume.toLowerCase().includes('bar')
      ? `${rawVolume.toUpperCase()} BAR`
      : rawVolume.toUpperCase();

  const prodKey = String(product._id || product.id || product.slug || '');
  const isSaved =
    (wishlistIds || []).includes(String(product._id || '')) ||
    (wishlistIds || []).includes(String(product.id || '')) ||
    (wishlistItems || []).some(
      (item) =>
        String(item._id) === prodKey ||
        String(item.id) === prodKey ||
        item.slug === product.slug
    );

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    addItem(product, 1);
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;
    const targetKey = cartItem.cartLineId || cartItem.id || cartItem._id || product.slug;
    if (quantity <= 1) {
      removeItem(targetKey);
    } else {
      updateQuantity(targetKey, quantity - 1);
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStock > 0 && quantity >= currentStock) return;
    if (!cartItem) {
      addItem(product, 1);
    } else {
      const targetKey = cartItem.cartLineId || cartItem.id || cartItem._id || product.slug;
      updateQuantity(targetKey, quantity + 1);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
  };

  const fallbackImage = '/images/products/bloom_neem_turmeric_soap.jpg';
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isPrimary)?.url || product.images[0].url
      : fallbackImage;

  return (
    <div className="group flex flex-col h-full bg-white border border-brand-silver hover:border-brand-mocha/40 transition-all duration-300 shadow-sm hover:shadow-md relative">
      {/* Product Image & Badges */}
      <div className="relative aspect-square overflow-hidden bg-brand-silver-light">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={primaryImage}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackImage;
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Status badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col space-y-1 z-10 pointer-events-none">
          {isSoldOut ? (
            <span className="px-2 py-0.5 bg-[#1C1614]/95 text-[#FAF9F8] text-[10px] font-mono font-medium uppercase tracking-wider border border-[#EAE6DF]/30 shadow-xs">
              Sold Out / Restocking Soon
            </span>
          ) : (
            <>
              {product.isBestSeller && (
                <span className="px-2 py-0.5 bg-brand-mocha text-white text-[11px] font-semibold tracking-widest uppercase shadow-xs">
                  Best Seller
                </span>
              )}
              {product.isNewLaunch && (
                <span className="px-2 py-0.5 bg-brand-lavender text-brand-mocha-900 font-semibold text-[11px] uppercase border border-brand-lavender-hover shadow-xs">
                  New Launch
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-full transition-all duration-200 cursor-pointer shadow-xs ${
            isSaved
              ? 'bg-red-50 text-red-500 ring-2 ring-red-200 border border-red-200'
              : 'bg-white/90 backdrop-blur-xs text-[#8C827A] hover:text-red-500 hover:bg-red-50 hover:scale-110 border border-brand-silver'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${
              isSaved ? 'fill-red-500 text-red-500' : ''
            }`}
          />
        </button>

        {/* Admin Edit Shortcut on Card */}
        {isAdmin && (
          <Link
            href={`/admin/products?edit=${product._id || product.slug || product.id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 left-2 z-20 px-2 py-1 bg-[#1C1614]/90 hover:bg-[#1C1614] text-white rounded-md text-[10px] font-semibold flex items-center space-x-1 shadow-md transition backdrop-blur-xs"
            title="Edit this product in admin portal"
          >
            <Edit3 className="w-3 h-3 text-amber-400" />
            <span>Edit</span>
          </Link>
        )}
      </div>

      {/* Product Dossier Content */}
      <div className="p-2.5 sm:p-4 lg:p-5 flex-1 flex flex-col bg-white">
        {/* Category / Concern Pill */}
        <div className="flex justify-start mb-1 text-left min-h-[18px] sm:min-h-[20px] lg:min-h-[22px] items-center">
          <span className="text-[7.5px] sm:text-[8px] lg:text-[10px] font-mono-clinical font-medium bg-brand-lavender-light text-brand-lavender-text border border-brand-lavender/80 px-1.5 py-0.5 lg:px-2 lg:py-0.5 uppercase tracking-wide inline-block rounded-xs text-left truncate max-w-full">
            {product.activesConcentration || product.category?.replace(/-/g, ' ')}
          </span>
        </div>

        {/* Product Title */}
        <Link
          href={`/product/${product.slug}`}
          className="block font-serif-luxury font-bold text-xs sm:text-[14px] lg:text-[17px] text-[#1C1614] hover:text-brand-mocha transition-colors line-clamp-1 leading-snug"
        >
          {product.name}
        </Link>

        {/* Ratings & Volume Row */}
        <div className="mt-2.5 sm:mt-3 flex items-center justify-between text-xs font-mono-clinical pb-1.5 lg:pb-2 border-b border-brand-silver">
          <div className="flex items-center space-x-1">
            <span className="text-[#D97706] text-sm leading-none select-none">★</span>
            <span className="text-sm font-medium text-[#1C1614] leading-none">{formattedRating}</span>
            {reviewCount > 0 && (
              <span className="text-xs text-[#6E6259] font-normal leading-none">({reviewCount})</span>
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono-clinical uppercase tracking-wider text-[#6E6259]">
            {volumeLabel}
          </div>
        </div>

        {/* Pricing & Quick Add Button */}
        <div className="mt-auto pt-2.5 sm:pt-3 flex items-center justify-between gap-1">
          <div className="flex items-baseline space-x-1 lg:space-x-1.5">
            <span className="font-mono-clinical font-bold text-xs sm:text-[13px] lg:text-[16px] text-brand-mocha-900">
              ₹{product.price}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="font-mono-clinical text-[9.5px] sm:text-[10.5px] lg:text-[12px] text-brand-mocha/40 line-through">
                ₹{product.compareAtPrice}
              </span>
            )}
          </div>

          {isSoldOut ? (
            <span className="h-[30px] sm:h-[34px] min-w-[84px] sm:min-w-[92px] px-2.5 py-1.5 text-[9px] sm:text-[10px] font-mono-clinical uppercase font-bold tracking-wider text-[#6E6259] bg-[#FAF9F8] border border-[#EAE6DF] rounded-full cursor-not-allowed select-none flex items-center justify-center flex-shrink-0">
              Sold Out
            </span>
          ) : quantity >= 1 ? (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="h-[30px] sm:h-[34px] min-w-[84px] sm:min-w-[92px] px-2 sm:px-2.5 py-1.5 bg-[#5C3A2E] text-[#FAF8F5] rounded-full flex items-center justify-between shadow-2xs transition-all duration-200 flex-shrink-0 select-none"
            >
              <button
                type="button"
                onClick={handleDecrement}
                aria-label={`Decrease ${product.name} quantity`}
                className="w-5 h-5 flex items-center justify-center hover:bg-white/20 active:scale-90 rounded-full transition-all cursor-pointer text-[#FAF8F5]"
              >
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="font-mono-clinical font-bold text-xs sm:text-[13px] text-[#FAF8F5] tabular-nums px-1 text-center min-w-[16px]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={currentStock > 0 && quantity >= currentStock}
                aria-label={`Increase ${product.name} quantity`}
                className="w-5 h-5 flex items-center justify-center hover:bg-white/20 active:scale-90 rounded-full transition-all cursor-pointer text-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="h-[30px] sm:h-[34px] min-w-[84px] sm:min-w-[92px] px-3 py-1.5 bg-[#5C3A2E] hover:bg-[#4A2E24] text-[#FAF8F5] text-[10px] sm:text-[11px] font-mono-clinical uppercase font-bold tracking-wider rounded-full transition-all duration-200 flex items-center justify-center space-x-1 shadow-2xs hover:shadow-sm cursor-pointer flex-shrink-0 active:scale-95"
            >
              <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FAF8F5] stroke-[2.5]" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
