import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useStoreStatusStore } from '../../store/storeStatusStore';

export default function CartDrawer() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { storeStatus } = useStoreStatusStore();
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    getSubtotal,
    getBundleDiscountPercentage,
    getDiscountAmount,
    getShippingFee,
    getGrandTotal,
    getItemCount,
    promoCode,
    applyCoupon,
    removeCoupon,
    appliedReward,
    removeReward,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState({ text: '', isError: false });

  if (!isDrawerOpen) return null;

  const subtotal = getSubtotal();
  const discountPct = getBundleDiscountPercentage();
  const discountAmount = getDiscountAmount();
  const shippingFee = getShippingFee();
  const grandTotal = getGrandTotal();
  const totalCount = getItemCount();

  const freeShippingThreshold = 500;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - (subtotal - discountAmount));
  const shippingProgressPct = Math.min(100, Math.round(((subtotal - discountAmount) / freeShippingThreshold) * 100));

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponMsg({ text: res.message, isError: false });
      setCouponInput('');
    } else {
      setCouponMsg({ text: res.message, isError: true });
    }
  };

  const handleCheckoutClick = () => {
    closeDrawer();
    const token = typeof window !== 'undefined' ? localStorage.getItem('love_co_token') : null;
    if (!isAuthenticated && !token) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-mocha-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-brand-canvas border-l border-brand-silver flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-silver flex items-center justify-between bg-brand-silver-light/60">
            <div className="flex items-center space-x-2">
              <span className="font-serif-luxury font-medium text-xl text-brand-mocha-900 tracking-tight">
                Your Bag
              </span>
              <span className="text-xs font-mono-clinical px-2 py-0.5 bg-brand-lavender text-brand-mocha-900 rounded-full border border-brand-lavender-hover font-semibold">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1 text-brand-mocha/70 hover:text-brand-mocha transition-colors rounded-full hover:bg-brand-silver-light cursor-pointer"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="px-6 py-3 bg-brand-silver-light/40 border-b border-brand-silver">
            <div className="flex justify-between items-center text-xs font-mono-clinical mb-1.5">
              <span>
                {amountToFreeShipping > 0 ? (
                  <>
                    Add <strong className="text-brand-mocha-900">₹{amountToFreeShipping}</strong> for Free Climate Shipping
                  </>
                ) : (
                  <span className="text-moss font-bold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Free Carbon-Neutral Shipping Unlocked
                  </span>
                )}
              </span>
              <span className="text-[11px] text-brand-mocha/60">{shippingProgressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-brand-silver rounded-full overflow-hidden border border-brand-silver">
              <div
                className="h-full bg-brand-mocha transition-all duration-300"
                style={{ width: `${shippingProgressPct}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-brand-silver/60 bg-white">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <span className="text-4xl mb-3">🌿</span>
                <h4 className="font-serif-luxury font-medium text-xl text-brand-mocha-900 mb-1">
                  Your shopping bag is empty
                </h4>
                <p className="text-xs text-brand-mocha/70 font-mono-clinical max-w-xs mb-6">
                  Select small-batch cold-pressed soaps or botanical oils to build your regimen.
                </p>
                <div className="flex flex-col space-y-2 w-full max-w-xs">
                  <Link
                    href="/catalog"
                    onClick={closeDrawer}
                    className="w-full py-2.5 bg-brand-mocha text-white text-xs font-mono-clinical uppercase tracking-wider text-center hover:bg-brand-mocha-600 transition-colors font-bold rounded-sm cursor-pointer"
                  >
                    Explore Products
                  </Link>
                  <Link
                    href="/bundle-builder"
                    onClick={closeDrawer}
                    className="w-full py-2.5 bg-brand-lavender-light text-brand-mocha-900 text-xs font-mono-clinical uppercase tracking-wider text-center hover:bg-brand-lavender border border-brand-lavender transition-colors font-bold rounded-sm cursor-pointer"
                  >
                    Build Custom Bundle (15% Off)
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id || item._id} className="py-4 flex space-x-4">
                  <div className="w-20 h-20 bg-brand-silver-light border border-brand-silver flex-shrink-0 overflow-hidden rounded-xs">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-mocha/40 text-xs font-mono-clinical">
                        L&amp;Co.
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeDrawer}
                          className="font-serif-luxury font-medium text-sm text-brand-mocha-900 hover:text-brand-mocha leading-snug line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id || item._id)}
                          className="text-brand-mocha/40 hover:text-red-700 p-1 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.activesConcentration && (
                        <p className="text-[11px] font-mono-clinical text-brand-mocha mt-0.5 line-clamp-1 font-semibold">
                          {item.activesConcentration}
                        </p>
                      )}

                      {item.isBundleItem && (
                        <span className="inline-block mt-1 text-[10px] font-mono-clinical px-1.5 py-0.5 bg-brand-lavender text-brand-mocha-900 border border-brand-lavender-hover rounded">
                          Bundle Item
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-brand-silver bg-white rounded-xs">
                        <button
                          onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}
                          className="p-1 px-2 text-brand-mocha hover:bg-brand-silver-light transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono-clinical font-medium text-brand-mocha-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}
                          className="p-1 px-2 text-brand-mocha hover:bg-brand-silver-light transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-xs font-mono-clinical font-bold text-brand-mocha-900">
                          ₹{item.price * item.quantity}
                        </span>
                        {(item.compareAtPrice > item.price || item.mrp > item.price) && (
                          <span className="text-[10px] font-mono-clinical text-brand-mocha/40 line-through ml-1.5">
                            ₹{(item.compareAtPrice || item.mrp) * item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {items.length > 0 && (
            <div className="border-t border-brand-silver bg-brand-silver-light/40 px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
              {/* Promo code form */}
              <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-brand-mocha/50" />
                  <input
                    type="text"
                    placeholder="Coupon (e.g. BOTANICAL15)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-white border border-brand-silver text-xs font-mono-clinical text-brand-mocha-900 uppercase focus:outline-none focus:border-brand-mocha rounded-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-brand-lavender text-brand-mocha-900 text-xs font-mono-clinical uppercase hover:bg-white font-bold border border-brand-lavender-hover rounded-xs transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {couponMsg.text && (
                <p className={`text-[11px] font-mono-clinical ${couponMsg.isError ? 'text-red-600' : 'text-moss font-bold'}`}>
                  {couponMsg.text}
                </p>
              )}

              {appliedReward ? (
                <div className="flex justify-between items-center text-xs font-mono-clinical bg-[#FAF8F5] p-2.5 rounded-xl border border-[#C5A880]">
                  <span className="text-brand-mocha-900 font-semibold">{appliedReward.description || appliedReward.code}</span>
                  <button onClick={removeReward} className="text-red-600 hover:underline text-[11px] cursor-pointer">
                    Remove
                  </button>
                </div>
              ) : promoCode ? (
                <div className="flex justify-between items-center text-xs font-mono-clinical bg-brand-lavender-light p-2 rounded border border-brand-lavender">
                  <span className="text-brand-mocha-900 font-semibold">Active: {promoCode}</span>
                  <button onClick={removeCoupon} className="text-red-600 hover:underline text-[11px] cursor-pointer">
                    Remove
                  </button>
                </div>
              ) : null}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs font-mono-clinical">
                <div className="flex justify-between text-brand-mocha/80">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                {discountAmount > 0 && (promoCode || appliedReward) && (
                  <div className="flex justify-between text-brand-mocha font-medium">
                    <span>
                      Coupon Discount ({appliedReward ? (appliedReward.code || appliedReward.description) : promoCode})
                    </span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-brand-mocha/80">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                </div>

                <div className="pt-2 border-t border-brand-silver flex justify-between font-bold text-sm text-brand-mocha-900">
                  <span>Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                type="button"
                disabled={Boolean(storeStatus?.isPaused)}
                onClick={handleCheckoutClick}
                className={`w-full py-3.5 text-xs font-mono-clinical uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-md font-bold rounded-sm ${
                  storeStatus?.isPaused
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-brand-mocha text-white hover:bg-brand-mocha-600 cursor-pointer'
                }`}
              >
                <span>{storeStatus?.isPaused ? 'Checkout Paused for Curing' : 'Proceed to Checkout'}</span>
                {!storeStatus?.isPaused && <ArrowRight className="w-4 h-4 text-white" />}
              </button>

              <div className="text-center text-[10px] font-mono-clinical text-brand-mocha/60">
                {storeStatus?.isPaused
                  ? 'Orders are temporarily paused during botanical cure cycle.'
                  : 'Atomic 15-min stock hold applied at checkout step.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
