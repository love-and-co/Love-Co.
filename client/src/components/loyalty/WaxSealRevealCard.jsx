import React, { useState, useEffect } from 'react';
import {
  Gift,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';

export default function WaxSealRevealCard(props) {
  const { coupon, isPostRitualOrder, showLoyaltyCard, currentStamps = 0, ritualStamps = 0, stampNumber, order } = props || {};
  const effectiveStamps = Number(ritualStamps || currentStamps || 0);

  // Immediate Hard Return Kill-Switch before any hooks or DOM rendering
  if (
    !coupon ||
    !coupon.code ||
    isPostRitualOrder ||
    showLoyaltyCard === false ||
    (order && order.showLoyaltyCard === false) ||
    !stampNumber ||
    stampNumber < 1 ||
    stampNumber > 10
  ) {
    return null;
  }

  return <WaxSealRevealCardInner {...props} />;
}

function WaxSealRevealCardInner({
  coupon,
  orderNumber,
  onCouponRevealed,
  currentStamps = 0,
  isPostRitualOrder = false,
  showLoyaltyCard = true,
  stampNumber = null,
  ritualStamps = 0,
}) {
  const effectiveStamps = Number(ritualStamps || currentStamps || 0);
  const isInitialRevealed = Boolean(coupon?.revealed);
  const [stage, setStage] = useState(isInitialRevealed ? 'settled' : 'unrevealed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedData, setRevealedData] = useState(isInitialRevealed ? coupon : null);
  const [stampsCount, setStampsCount] = useState(currentStamps || 0);
  const [newStampIdx, setNewStampIdx] = useState(null);
  const [stampEarned, setStampEarned] = useState(false);
  const [milestoneGift, setMilestoneGift] = useState(coupon?.milestoneGift?.name ? coupon.milestoneGift : null);
  const [copied, setCopied] = useState(false);

  // Synchronize when coupon prop changes (e.g. on page refresh or database hydration)
  useEffect(() => {
    if (coupon) {
      if (coupon.revealed) {
        setRevealedData(coupon);
        setStage('settled');
      } else if (stage === 'unrevealed') {
        setRevealedData(coupon);
      }
      if (coupon.milestoneGift && coupon.milestoneGift.name) {
        setMilestoneGift(coupon.milestoneGift);
      }
    }
  }, [coupon?.code, coupon?.revealed]);

  useEffect(() => {
    if (typeof currentStamps === 'number') {
      setStampsCount(currentStamps);
    }
  }, [currentStamps]);

  const handleBreakSeal = async () => {
    if (isSubmitting || stage !== 'unrevealed') return;
    setIsSubmitting(true);

    try {
      const res = await api.revealMysteryCoupon(coupon.code);
      const data = res.data;

      if (data?.alreadyRevealed) {
        // Idempotent: already revealed previously
        const c = data.coupon || coupon;
        setRevealedData(c);
        if (data?.milestoneGift) {
          setMilestoneGift(data.milestoneGift);
        }
        // NEVER touch stampsCount from reveal response — stamps are immutable after order placement
        setStage('settled');
        onCouponRevealed?.(c, undefined, data);
        return;
      }

      // Fresh unboxing!
      const finalCoupon = data?.coupon || {
        ...coupon,
        revealed: true,
        discountPercent: data?.coupon?.discountPercent || coupon.discountPercent || 15,
      };
      setRevealedData(finalCoupon);

      if (data?.milestoneGift) {
        setMilestoneGift(data.milestoneGift);
      }

      // NEVER use data.stampEarned / data.newStampIndex / data.ritualStamps — stamps don't change on reveal
      setStampEarned(false);
      setNewStampIdx(stampsCount); // keep existing count unchanged

      // Stage 1: Wax seal cracks and stamp lands on the slot
      setStage('cracking');

      // Stage 2: After 1300ms, unfold the reward voucher
      setTimeout(() => {
        setStage('settled');
        onCouponRevealed?.(finalCoupon, undefined, data);
      }, 1300);
    } catch (err) {
      console.error('Failed to break wax seal:', err);
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    const code = revealedData?.code || coupon.code;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const discount = revealedData?.discountPercent || coupon.discountPercent || 15;
  const couponCode = revealedData?.code || coupon.code;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF8F5] via-[#F3ECE1] to-[#EAE0D2] border-2 border-[#C5A880]/50 shadow-md p-6 sm:p-8 transition-all duration-500">
      {/* Decorative Vintage Hairline Inner Border */}
      <div className="pointer-events-none absolute inset-2.5 rounded-[20px] border border-[#C5A880]/30" />

      {/* Subtle Corner Watermarks */}
      <div className="pointer-events-none absolute top-4 left-4 text-[9px] font-mono-clinical uppercase tracking-[0.25em] text-[#8C3A27]/40 font-bold select-none">
        L&CO. APOTHECARY
      </div>
      <div className="pointer-events-none absolute top-4 right-4 text-[9px] font-mono-clinical uppercase tracking-[0.25em] text-[#8C3A27]/40 font-bold select-none">
        BATCH #{orderNumber || 'ARCHIVE'}
      </div>

      {/* ========================================================================= */}
      {/* STATE 1: UNREVEALED WAX SEAL (Tap Wax Seal to Break)                      */}
      {/* ========================================================================= */}
      {stage === 'unrevealed' && (
        <div className="relative z-10 flex flex-col items-center text-center py-2 sm:py-4">
          {/* Header pill */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#8C3A27]/10 border border-[#8C3A27]/25 text-[#8C3A27] text-[10px] font-mono-clinical font-bold uppercase tracking-widest mb-4">
            <Gift className="w-3.5 h-3.5 text-[#8C3A27]" />
            <span>Mystery Botanical Reward</span>
          </div>

          <h3 className="font-serif-luxury text-xl sm:text-2xl text-[#1C1614] font-semibold max-w-lg leading-tight tracking-tight">
            A Botanical Seal Awaits Your Ritual
          </h3>
          <p className="text-xs sm:text-sm text-[#1C1614]/70 font-sans max-w-md mt-2 mb-4 leading-relaxed">
            Every confirmed order earns an authentic wax-sealed mystery voucher (5% to 20% OFF)
            plus ritual progress toward your complimentary 3-Bar Botanical Trio.
          </p>

          {/* Sole Clickable Trigger: 3D Embossed Wax Seal Medallion */}
          <div className="relative my-2 flex flex-col items-center group">
            <button
              type="button"
              onClick={handleBreakSeal}
              disabled={isSubmitting}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-2 bg-gradient-to-br from-[#8C3A27] via-[#A64B35] to-[#5C1F13] shadow-[0_12px_28px_rgba(100,30,18,0.4),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.5)] border-4 border-[#C5A880]/80 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform group-hover:scale-105 active:scale-95 disabled:cursor-not-allowed select-none"
              title="Tap Wax Seal to Break & Reveal Reward"
            >
              {isSubmitting ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-[9px] font-mono-clinical uppercase tracking-widest text-[#FAF8F5]">
                    BREAKING...
                  </span>
                </div>
              ) : (
                <div className="w-full h-full rounded-full border border-dashed border-[#FAF8F5]/50 flex flex-col items-center justify-center relative p-1">
                  <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-[#FAF8F5] drop-shadow-md mb-1 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] sm:text-[11px] font-mono-clinical font-black tracking-[0.2em] uppercase text-[#FAF8F5] drop-shadow">
                    BREAK
                  </span>
                  <span className="text-[8.5px] sm:text-[9.5px] font-serif-luxury tracking-[0.25em] uppercase text-[#FAF8F5]/90">
                    SEAL
                  </span>
                </div>
              )}
            </button>

            {/* Subtle glow pulse around wax seal */}
            <div className="pointer-events-none absolute -inset-2 rounded-full border border-[#C5A880]/30 animate-pulse" />

            {/* Helper Caption */}
            <p className="text-[11.5px] font-sans text-[#1C1614]/65 mt-3 tracking-wide">
              Tap the wax seal above to reveal your reward
            </p>
          </div>

          {/* Current Stamp Progress Preview */}
          <div className="mt-4 flex items-center space-x-2 text-xs font-mono-clinical text-[#1C1614]/75">
            <span className="font-semibold uppercase tracking-wider">Loyalty Card:</span>
            <div className="w-24 h-2 bg-[#1C1614]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8C3A27] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((stampsCount || 0) / 10) * 100)}%` }}
              />
            </div>
            <span className="font-bold text-[#8C3A27]">{stampsCount || 0} / 10 Stamps</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: CRACKING WAX SEAL & STAMP IMPACT (0ms – 1300ms)                  */}
      {/* ========================================================================= */}
      {stage === 'cracking' && (
        <div className="relative z-10 flex flex-col items-center text-center py-4 sm:py-6">
          {/* Cracked Seal Animation */}
          <div className="relative w-24 h-24 rounded-full p-2 bg-gradient-to-br from-[#8C3A27] via-[#A64B35] to-[#5C1F13] border-4 border-[#C5A880] flex items-center justify-center animate-sealCrack shadow-2xl mb-4">
            <Gift className="w-8 h-8 text-[#FAF8F5]" />
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#8C3A27] text-white text-xs font-mono-clinical font-bold uppercase tracking-wider shadow-md mb-6 animate-fadeIn">
            <Gift className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>
              {milestoneGift || newStampIdx === 10
                ? `🎉 10TH RITUAL STAMP UNLOCKED! FREE 3-BAR BOTANICAL TRIO ADDED TO BILL!`
                : stampEarned
                ? `+1 RITUAL STAMP LOCKED IN!`
                : `MYSTERY REWARD UNLOCKED!`}
            </span>
          </div>

          {/* 10-Slot Stamp Grid with Live Punch Impact */}
          <div className="w-full max-w-md bg-white/60 backdrop-blur-xs rounded-2xl p-4 border border-[#C5A880]/40 shadow-xs">
            <div className="text-[11px] font-mono-clinical uppercase tracking-wider font-bold text-[#1C1614]/80 mb-3 flex items-center justify-between">
              <span>Botanical Ritual Stamp Card</span>
              <span className="text-[#8C3A27] font-extrabold">{stampsCount} / 10 Stamps</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 justify-items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                const isNewStamp = slot === newStampIdx;
                const isAlreadyEarned = slot < (newStampIdx || stampsCount);

                return (
                  <div key={slot} className="relative flex flex-col items-center">
                    {isNewStamp ? (
                      <div className="relative">
                        {/* Golden Ripple Ring Expanding Outward */}
                        <div className="absolute inset-0 rounded-full border-2 border-[#C5A880] animate-goldenRipple pointer-events-none" />
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#8C3A27] border-2 border-[#C5A880] flex items-center justify-center text-white shadow-lg animate-stampImpact">
                          <Gift className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : isAlreadyEarned ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#8C3A27]/90 border border-[#8C3A27] flex items-center justify-center text-white shadow-2xs">
                        <Gift className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-[#C5A880]/60 bg-white/40 flex items-center justify-center text-[#1C1614]/40 font-mono-clinical text-[11px] font-bold">
                        {slot === 10 ? <Gift className="w-3.5 h-3.5 text-[#C5A880]" /> : slot}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2 / SETTLED: UNVEILED REWARD VOUCHER + VERIFIED STAMP CARD          */}
      {/* ========================================================================= */}
      {stage === 'settled' && (
        <div className="relative z-10 animate-voucherUnfold space-y-5">
          {/* Milestone 10th Stamp Free Trio Gift Banner (Strictly Order 10 only) */}
          {Boolean((Number(stampNumber) === 10 || effectiveStamps === 10) && ((milestoneGift && milestoneGift.name) || (coupon?.milestoneGift && coupon?.milestoneGift?.name))) && (
            <div className="p-4 rounded-2xl bg-[#FAF6EF] border-2 border-[#C5A880] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center space-x-3.5">
                <img
                  src="/images/products/botanical_trio_box.jpg"
                  alt="LOVE & Co. Signature Botanical Trio Box"
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl object-cover bg-brand-canvas border-2 border-[#C5A880] flex-shrink-0 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = '/images/botanical_trio_box.jpg';
                  }}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#8C3A27] text-white font-mono-clinical text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                      🎁 10th Stamp Milestone Gift
                    </span>
                    <span className="text-[11px] font-mono-clinical text-[#3E6B48] font-bold">
                      ✓ Attached to Order Bill Below
                    </span>
                  </div>
                  <h4 className="font-serif-luxury text-base font-bold text-[#1C1614] mt-1">
                    Free 3-Bar Botanical Trio Box Added!
                  </h4>
                  <p className="text-xs text-[#1C1614]/70 font-sans mt-0.5">
                    Includes Bloom Neem, Blush Rose &amp; Velvet Sandalwood formulation bars (₹0 / FREE) added to your packing list.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
                <span className="line-through text-xs text-[#1C1614]/50 font-mono-clinical">₹999</span>
                <span className="px-3.5 py-1.5 rounded-xl bg-[#3E6B48] text-white font-mono-clinical font-black text-xs uppercase tracking-wider shadow-xs">
                  ₹0 FREE
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* Left: Mystery Voucher Pass */}
            <div className="flex-1 bg-white/90 backdrop-blur-xs rounded-2xl border-2 border-dashed border-[#C5A880]/70 p-5 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
              {/* Top Row: Tag + Verified Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                <span className="px-3 py-1 rounded-full bg-[#8C3A27] text-white text-[10px] font-mono-clinical font-black uppercase tracking-widest shadow-2xs">
                  {discount}% OFF REWARD
                </span>
                <span className="inline-flex items-center space-x-1 text-[11px] font-mono-clinical text-[#3E6B48] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified & Saved to Profile</span>
                </span>
              </div>

              {/* Main Discount Headline */}
              <div>
                <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1C1614] leading-tight">
                  {discount}% OFF Your Next Order
                </h3>
                <p className="text-xs text-[#1C1614]/70 font-sans mt-1.5 leading-relaxed">
                  Valid for 14 days on all small-batch cold-pressed soaps & lip care. Maximum savings up to ₹250.
                </p>
              </div>

              {/* Voucher Code & 1-Click Copy */}
              <div className="mt-5 pt-4 border-t border-[#E5DFD7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <div className="px-3.5 py-1.5 bg-[#FAF8F5] border border-[#C5A880]/60 rounded-xl font-mono-clinical font-black text-sm sm:text-base text-[#1C1614] tracking-widest select-all shadow-inner">
                    {couponCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-[#1C1614] hover:bg-[#2A211D] text-[#FAF8F5] text-xs font-mono-clinical font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>COPY CODE</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[10.5px] font-mono-clinical text-[#1C1614]/60 uppercase tracking-wider">
                  Expires in 14 days
                </div>
              </div>
            </div>

            {/* Right: Permanent 10-Stamp Ritual Progress Card */}
            <div className="w-full lg:w-72 bg-[#FAF8F5]/90 rounded-2xl border border-[#C5A880]/50 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono-clinical font-bold uppercase tracking-wider text-[#1C1614]">
                    Ritual Stamp Card
                  </span>
                  <span className="text-xs font-mono-clinical font-black text-[#8C3A27]">
                    {stampsCount} / 10
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#1C1614]/10 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-[#8C3A27] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, ((stampsCount || 0) / 10) * 100)}%` }}
                  />
                </div>

                {/* 10-Slot Grid */}
                <div className="grid grid-cols-5 gap-2 justify-items-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                    const isEarned = slot <= stampsCount;
                    return (
                      <div
                        key={slot}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono-clinical font-bold transition-all ${
                          isEarned
                            ? 'bg-[#8C3A27] text-white shadow-2xs border border-[#C5A880]/60'
                            : 'border-2 border-dashed border-[#C5A880]/60 bg-white/40 text-[#1C1614]/40'
                        }`}
                        title={
                          slot === 10
                            ? 'Milestone 10: Complimentary 3-Bar Botanical Trio'
                            : `Ritual Stamp #${slot}`
                        }
                      >
                        {isEarned ? (
                          <Gift className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                        ) : slot === 10 ? (
                          <Gift className="w-3.5 h-3.5 text-[#C5A880]" />
                        ) : (
                          slot
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestone notice */}
              <div className="mt-4 pt-3 border-t border-[#1C1614]/10 text-[10.5px] font-mono-clinical text-[#1C1614]/75 flex items-center space-x-1.5">
                <Gift className="w-3.5 h-3.5 text-[#8C3A27] shrink-0" />
                <span>
                  {stampsCount >= 10
                    ? '✓ 10/10 Ritual Milestone Completed'
                    : `${10 - stampsCount} more stamp${10 - stampsCount === 1 ? '' : 's'} to unlock Free 3-Bar Trio`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
