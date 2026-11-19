import React, { useState, useEffect } from 'react';
import {
  Gift,
  Check,
  X,
  Tag,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export default function RitualRewardsCheckoutSelector({ className = '' }) {
  const { isAuthenticated } = useAuthStore();
  const { appliedReward, applyReward, removeReward, getSubtotal } = useCartStore();

  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [applyingCode, setApplyingCode] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchRewards() {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const res = await api.getLoyaltyStatus();
        if (isMounted && res.data?.data) {
          setLoyalty(res.data.data);
        }
      } catch (err) {
        console.warn('Could not load customer ritual loyalty data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRewards();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated || !loyalty) return null;

  const subtotal = getSubtotal();
  const hasFreeTrio = Boolean(!loyalty?.isRitualCompleted && loyalty?.freeTrioUnlocked);
  const activeCoupons = (loyalty.mysteryCoupons || []).filter(
    (c) => c.revealed && !c.isUsed && !c.isExpired
  );

  const totalRewardsCount = (hasFreeTrio ? 1 : 0) + activeCoupons.length;

  if (totalRewardsCount === 0 && !appliedReward) {
    return null;
  }

  const handleApplyFreeTrio = async () => {
    setApplyingCode('FREE_TRIO');
    try {
      const res = await api.validateReward({
        rewardType: 'FREE_TRIO',
        subtotal,
        applyNow: false,
      });

      if (res.data?.valid) {
        applyReward({
          type: 'FREE_TRIO',
          rewardType: 'FREE_TRIO',
          code: 'FREE_TRIO',
          discountAmount: res.data.discountAmount || 499,
          description: 'Complimentary 3-Product Signature Botanical Trio',
        });
      }
    } catch (err) {
      console.error('Failed to validate Free Trio reward:', err);
    } finally {
      setApplyingCode(null);
    }
  };

  const handleApplyCoupon = async (coupon) => {
    setApplyingCode(coupon.code);
    try {
      const res = await api.validateReward({
        rewardType: 'COUPON',
        code: coupon.code,
        subtotal,
        applyNow: false,
      });

      if (res.data?.valid) {
        applyReward({
          type: 'COUPON',
          rewardType: 'COUPON',
          code: coupon.code,
          discountPercent: res.data.discountPercent || coupon.discountPercent,
          maxDiscount: res.data.maxDiscount || coupon.maxDiscount,
          discountAmount: res.data.discountAmount,
          description: `${coupon.discountPercent}% OFF Mystery Reward`,
        });
      }
    } catch (err) {
      console.error('Failed to validate mystery coupon:', err);
    } finally {
      setApplyingCode(null);
    }
  };

  return (
    <div
      className={`rounded-2xl border-2 transition-all overflow-hidden ${
        appliedReward
          ? 'bg-gradient-to-br from-[#FAF8F5] via-[#E2D1B3]/30 to-[#FAF8F5] border-[#C5A880] shadow-xs'
          : 'bg-[#FAF8F5] border-brand-silver'
      } ${className}`}
    >
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-black/2"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#E8E3EE] text-[#1C1614] flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-[#C5A880] stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif-luxury text-sm font-medium text-[#1C1614]">
                Available Ritual Rewards
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1614] text-[#FAF8F5] font-mono-clinical text-[10px] font-bold">
                {totalRewardsCount} Available
              </span>
            </div>
            <p className="text-[11px] text-[#1C1614]/65 font-sans mt-0.5">
              {appliedReward
                ? `Active: ${appliedReward.description || appliedReward.code}`
                : 'Redeem your unlocked Free Trio or 5%–20% mystery discounts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {appliedReward && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono-clinical font-bold text-[#1C1614] bg-[#E8E3EE] px-2.5 py-1 rounded-full border border-[#C5A880]/30">
              <Check className="w-3 h-3 text-[#C5A880]" />
              <span>Applied</span>
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#1C1614]/60" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#1C1614]/60" />
          )}
        </div>
      </button>

      {/* Rewards List */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#1C1614]/10 animate-fadeIn">
          {/* Active Reward Notice with Remove option */}
          {appliedReward && (
            <div className="p-3 rounded-xl bg-white border border-[#C5A880] flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2 text-xs">
                <Check className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <span className="font-medium text-[#1C1614]">
                  {appliedReward.description || appliedReward.code} applied (-₹{appliedReward.discountAmount || 0})
                </span>
              </div>
              <button
                type="button"
                onClick={removeReward}
                className="text-xs text-[#1C1614]/60 hover:text-red-700 font-mono-clinical flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {/* 1. Complimentary Free Trio Reward */}
          {hasFreeTrio && (
            <div className="p-3.5 rounded-xl bg-white border-2 border-[#C5A880] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start space-x-2.5">
                <img
                  src="/images/products/botanical_trio_box.jpg"
                  alt="Complimentary 3-Product Signature Trio"
                  className="w-10 h-10 rounded-lg object-cover bg-brand-canvas border border-[#C5A880] flex-shrink-0 mt-0.5"
                  onError={(e) => {
                    e.currentTarget.src = '/images/botanical_trio_box.jpg';
                  }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif-luxury text-sm font-semibold text-[#1C1614]">
                      Complimentary 3-Product Signature Trio
                    </span>
                    <span className="px-2 py-0.2 bg-[#FAF8F5] border border-[#C5A880] text-[#1C1614] font-mono-clinical text-[10px] font-bold rounded">
                      ₹499 Value
                    </span>
                  </div>
                  <p className="text-[11px] text-[#1C1614]/70 font-sans mt-0.5">
                    Unlocked via your 10 completed apothecary ritual delivery stamps.
                  </p>
                </div>
              </div>

              {appliedReward?.type === 'FREE_TRIO' ? (
                <span className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#C5A880] text-[#1C1614] text-xs font-mono-clinical font-bold uppercase tracking-wider text-center">
                  Active in Summary
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyFreeTrio}
                  disabled={applyingCode === 'FREE_TRIO'}
                  className="px-4 py-2 rounded-lg bg-[#1C1614] hover:bg-[#2A211D] text-[#FAF8F5] text-xs font-mono-clinical font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {applyingCode === 'FREE_TRIO' ? 'Applying...' : 'Apply Free Trio'}
                </button>
              )}
            </div>
          )}

          {/* 2. Active Mystery Coupons */}
          {activeCoupons.map((coupon) => {
            const isThisApplied = appliedReward?.code === coupon.code;

            return (
              <div
                key={coupon.code}
                className="p-3 rounded-xl bg-white border border-brand-silver flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
              >
                <div className="flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E8E3EE] text-[#1C1614] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Tag className="w-3.5 h-3.5 text-[#C5A880]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono-clinical font-bold text-xs text-[#1C1614] tracking-wider">
                        {coupon.code}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#C5A880]/40 rounded text-[10px] font-mono-clinical font-semibold text-[#1C1614]">
                        {coupon.discountPercent}% OFF (Max ₹{coupon.maxDiscount || 250})
                      </span>
                    </div>
                    <div className="text-[10px] text-[#1C1614]/60 font-mono-clinical mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#1C1614]/40" />
                      <span>
                        Valid until {new Date(coupon.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {isThisApplied ? (
                  <span className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#C5A880] text-[#1C1614] text-xs font-mono-clinical font-bold uppercase tracking-wider text-center">
                    Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(coupon)}
                    disabled={applyingCode === coupon.code}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1C1614] hover:bg-[#2A211D] text-[#FAF8F5] text-xs font-mono-clinical font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50 self-end sm:self-center"
                  >
                    {applyingCode === coupon.code ? 'Applying...' : 'Apply Reward'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
