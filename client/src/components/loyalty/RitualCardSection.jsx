import React, { useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Copy,
  Check,
  Award,
  ShieldCheck,
  Clock,
  ArrowRight,
  Heart,
  Ticket,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

/**
 * Format ISO Expiry Date to readable "Valid until DD MMM"
 */
function formatExpiryDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `Valid until ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
}

/**
 * Format ISO Expiry Date to uppercase "DD MMM YYYY" for apothecary ticket
 */
function formatExpiryDateUpper(dateStr) {
  if (!dateStr) return '14 DAYS';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '14 DAYS';
  const day = d.toLocaleDateString('en-US', { day: '2-digit' });
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Authentic Scalloped & Notched Ticket Silhouette CSS Mask
 * - Top & Bottom Semicircular Notches at 72% seam (10px radius)
 * - Fine Repeating Semicircular Postage-Stamp Scallops along Left & Right vertical edges (4px radius every 16px)
 */
const ticketMaskStyle = {
  WebkitMaskImage:
    'radial-gradient(circle 10px at 72% 0, transparent 9.5px, black 10px), radial-gradient(circle 10px at 72% 100%, transparent 9.5px, black 10px), radial-gradient(circle 4px at 0 8px, transparent 3.5px, black 4px), radial-gradient(circle 4px at 100% 8px, transparent 3.5px, black 4px)',
  WebkitMaskSize: '100% 100%, 100% 100%, 100% 16px, 100% 16px',
  WebkitMaskRepeat: 'no-repeat, no-repeat, repeat-y, repeat-y',
  WebkitMaskComposite: 'destination-in',
  maskImage:
    'radial-gradient(circle 10px at 72% 0, transparent 9.5px, black 10px), radial-gradient(circle 10px at 72% 100%, transparent 9.5px, black 10px), radial-gradient(circle 4px at 0 8px, transparent 3.5px, black 4px), radial-gradient(circle 4px at 100% 8px, transparent 3.5px, black 4px)',
  maskSize: '100% 100%, 100% 100%, 100% 16px, 100% 16px',
  maskRepeat: 'no-repeat, no-repeat, repeat-y, repeat-y',
  maskComposite: 'intersect',
};

export default function RitualCardSection({
  loyalty,
  onLoyaltyUpdate,
  user: propUser,
}) {
  const { user: storeUser } = useAuthStore();
  const currentUser = propUser || storeUser || null;

  // Personalize coupons wallet & loyalty card with account holder name (e.g. Dhanush -> Dhanush's Loyalty Card)
  const rawName = currentUser?.fullName || currentUser?.name || '';
  const firstName = rawName.trim().split(' ')[0] || (currentUser?.email ? currentUser.email.split('@')[0] : '');
  const capitalizedName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';
  const possessiveName = capitalizedName
    ? `${capitalizedName}'${capitalizedName.endsWith('s') || capitalizedName.endsWith('S') ? '' : 's'}`
    : '';
  const walletHeading = possessiveName ? `${possessiveName} Coupons Wallet` : 'Coupons Wallet';
  const loyaltyCardHeading = possessiveName ? `${possessiveName} Loyalty Card` : 'Loyalty Card';

  const [revealingCode, setRevealingCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showPastHistory, setShowPastHistory] = useState(false);

  const stamps = Math.min(10, loyalty?.ritualStamps || 0);
  const isCompleted = Boolean(stamps >= 10 && loyalty?.isRitualCompleted);
  const completedCycles = loyalty?.completedCycles || 0;
  const coupons = loyalty?.mysteryCoupons || [];

  // Categorize coupons cleanly into Active vs. Expired & Redeemed
  const now = new Date();
  const activeCoupons = coupons.filter((c) => {
    const isUsed = Boolean(c.isUsed);
    const isExpired = c.expiresAt ? new Date(c.expiresAt) <= now : false;
    return !isUsed && !isExpired;
  });

  const pastCoupons = coupons.filter((c) => {
    const isUsed = Boolean(c.isUsed);
    const isExpired = c.expiresAt ? new Date(c.expiresAt) <= now : false;
    return isUsed || isExpired;
  });

  const handleRevealCoupon = async (code) => {
    setRevealingCode(code);
    try {
      const res = await api.revealMysteryCoupon(code);
      const couponData = res.data?.coupon || {
        code,
        revealed: true,
        discountPercent: 15,
        maxDiscount: 250,
      };
      if (onLoyaltyUpdate) {
        onLoyaltyUpdate((prev) => {
          if (!prev) return prev;
          const updated = (prev.mysteryCoupons || []).map((c) =>
            c.code === code ? { ...c, ...couponData, revealed: true } : c
          );
          // STRICTLY: never update ritualStamps or isRitualCompleted from coupon reveal
          return { ...prev, mysteryCoupons: updated };
        });
      }
    } catch (err) {
      console.warn('Failed to reveal coupon via API, applying local reveal fallback:', err);
      if (onLoyaltyUpdate) {
        onLoyaltyUpdate((prev) => {
          if (!prev) return prev;
          const updated = (prev.mysteryCoupons || []).map((c) =>
            c.code === code ? { ...c, revealed: true, discountPercent: c.discountPercent || 15 } : c
          );
          return { ...prev, mysteryCoupons: updated };
        });
      }
    } finally {
      setRevealingCode(null);
    }
  };

  const handleCopyCode = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. MY LOYALTY CARD (10-STAMP BOTANICAL EMBOSSED CARD)   */}
      {/* ======================================================== */}
      <div
        className={`rounded-3xl p-5 sm:p-7 lg:p-9 border-2 transition-all duration-300 relative overflow-hidden shadow-sm ${
          isCompleted
            ? 'bg-gradient-to-br from-[#FAF8F5] via-[#F6F1EA] to-[#FAF8F5] border-[#C5A880] ring-4 ring-[#C5A880]/20'
            : 'bg-[#FAF8F5] border-brand-silver'
        }`}
      >
        {/* Subtle decorative gold/ivory glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E8E3EE]/40 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 space-y-6">
          {/* Card Header: Responsive Eyebrow, Title & Stamp Counter Stack */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#1C1614]/10">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E8E3EE] text-[#1C1614] border border-[#1C1614]/10 text-[10px] sm:text-[11px] font-monoClinical font-bold uppercase tracking-wider mb-1">
                <Heart className="w-3.5 h-3.5 text-[#8C3A27] fill-[#8C3A27]" />
                <span>LOVE &amp; CO. LOYALTY ATELIER</span>
              </div>
              <h2 className="font-serifLuxury text-2xl sm:text-3xl font-medium text-[#1C1614] tracking-tight">
                {loyaltyCardHeading}
              </h2>
              <p className="text-xs sm:text-sm text-[#1C1614]/70 font-sans max-w-xl leading-relaxed">
                Collect 10 cold-process delivery stamps to unlock a complimentary full 3-product signature trio.
              </p>
            </div>

            {/* Stamp Counter & Badge */}
            <div className="flex items-center space-x-3 self-start sm:self-center shrink-0">
              {completedCycles > 0 && (
                <span className="px-3 py-1 bg-[#FAF8F5] border border-[#C5A880] text-[#1C1614] rounded-full text-[10px] font-monoClinical font-semibold flex items-center space-x-1 shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{completedCycles} Cycles Completed</span>
                </span>
              )}

              <div className="px-4 py-2 rounded-2xl bg-[#1C1614] text-[#FAF8F5] text-center font-monoClinical shadow-xs">
                <div className="text-[10px] tracking-wider uppercase text-[#C5A880] font-bold">
                  LOYALTY PROGRESS
                </div>
                <div className="text-base sm:text-lg font-bold">
                  {stamps} <span className="text-[#FAF8F5]/50 text-xs">/ 10 STAMPS</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 10-STAMP SYMMETRICAL GRID: 2 NEAT ROWS OF 5 STAMPS      */}
          {/* ======================================================== */}
          <div className="pt-1">
            <div className="grid grid-cols-5 gap-2.5 sm:gap-4 max-w-2xl mx-auto justify-items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slotNumber) => {
                const isStamped = slotNumber <= stamps;
                const isFinalGoal = slotNumber === 10;

                return (
                  <div
                    key={slotNumber}
                    className="flex flex-col items-center space-y-1 group"
                  >
                    <div
                      className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative ${
                        isStamped
                          ? 'bg-gradient-to-br from-[#E2D1B3] via-[#C5A880] to-[#9E7D53] border-2 border-[#C5A880] text-[#1C1614] shadow-md scale-100 hover:scale-105'
                          : isFinalGoal
                          ? 'border-2 border-dashed border-[#C5A880] bg-[#FAF8F5] text-[#C5A880] hover:border-[#C5A880]'
                          : 'border-2 border-dashed border-[#1C1614]/25 bg-[#FAF8F5] text-[#1C1614]/40 hover:border-[#1C1614]/50'
                      }`}
                    >
                      {isStamped ? (
                        <>
                          <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-[#1C1614] stroke-[2.2]" />
                          <span className="text-[8px] sm:text-[9px] font-monoClinical font-bold leading-none mt-0.5">
                            #{slotNumber}
                          </span>
                        </>
                      ) : (
                        <>
                          {isFinalGoal ? (
                            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A880] stroke-[1.8] animate-pulse" />
                          ) : (
                            <span className="text-xs sm:text-sm font-monoClinical font-semibold">
                              {slotNumber}
                            </span>
                          )}
                          <span className="text-[7.5px] sm:text-[8.5px] font-monoClinical uppercase tracking-tight text-[#1C1614]/50 leading-none">
                            {isFinalGoal ? 'TRIO' : 'STAMP'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* MILESTONE BANNER & RESPONSIVE FULL-WIDTH PROGRESS BAR   */}
          {/* ======================================================== */}
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#1C1614]/75 gap-2">
              <span className="flex items-center gap-1.5 font-sans">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span>Orders ₹499+ automatically award a verified stamp upon order confirmation.</span>
              </span>
              <span className="font-monoClinical text-[11px] sm:text-xs font-semibold text-[#8C3A27]">
                {isCompleted
                  ? '✓ 10/10 Loyalty Milestone Completed'
                  : `${10 - stamps} more stamp${10 - stamps === 1 ? '' : 's'} to unlock Complimentary 3-Bar Botanical Trio`}
              </span>
            </div>

            {/* Full-width responsive progress track */}
            <div className="w-full h-2.5 bg-[#1C1614]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8C3A27] via-[#C5A880] to-[#8C3A27] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (stamps / 10) * 100)}%` }}
              />
            </div>
          </div>

          {/* 10/10 COMPLETED SETTLED BANNER STATE (COMPACT HORIZONTAL LAYOUT) */}
          {isCompleted && (
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-[#E2D1B3]/30 to-[#FAF8F5] border-2 border-[#C5A880] shadow-xs flex items-center justify-between gap-3 sm:gap-4 overflow-hidden animate-fadeIn">
              <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0 flex-1">
                {/* Photo Left Side */}
                <img
                  src="/images/products/botanical_trio_box.jpg"
                  alt="LOVE & Co. Signature Botanical Trio Box"
                  className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 shrink-0 rounded-xl object-cover bg-brand-canvas border border-[#C5A880]/60 shadow-xs"
                  onError={(e) => {
                    e.currentTarget.src = '/images/botanical_trio_box.jpg';
                  }}
                />

                {/* Content Right Side */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-monoClinical font-bold uppercase tracking-wider text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#1C1614] text-[#FAF8F5]">
                      10/10 Milestone
                    </span>
                    <span className="font-monoClinical text-[10px] sm:text-xs text-[#3E6B48] font-bold">
                      ✓ Fulfilled on Order #10
                    </span>
                  </div>

                  <h4 className="font-serifLuxury text-sm sm:text-base md:text-lg font-semibold text-[#1C1614] mt-0.5 truncate leading-snug">
                    Complimentary 3-Bar Botanical Trio
                  </h4>

                  <p className="text-[11px] sm:text-xs text-[#1C1614]/70 font-sans mt-0.5 truncate sm:whitespace-normal sm:line-clamp-1">
                    Signature Trio Box fulfilled with cold-pressed formulation bars.
                  </p>
                </div>
              </div>

              {/* Status Pill (Tablet/Desktop) */}
              <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#C5A880] text-[#1C1614] font-monoClinical text-[11px] font-bold uppercase tracking-wider shrink-0 text-center shadow-2xs whitespace-nowrap">
                ✓ Program Complete
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. COUPONS WALLET (PERFORATED APOTHECARY TICKETS)        */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border-2 border-brand-silver p-5 sm:p-7 lg:p-9 shadow-sm space-y-6">
        {/* Wallet Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-silver gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#E8E3EE] text-[#1C1614] flex items-center justify-center font-bold text-sm">
              <Ticket className="w-4 h-4 text-[#1C1614]" />
            </span>
            <div>
              <h3 className="font-serifLuxury text-xl sm:text-2xl font-normal text-[#1C1614]">
                {walletHeading}
              </h3>
              <p className="text-xs text-[#1C1614]/65 font-sans">
                Authentic perforated apothecary vouchers unlocked through confirmed ritual orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-monoClinical px-3 py-1 rounded-full bg-[#FAF8F5] border border-brand-silver text-[#1C1614] font-semibold">
              {activeCoupons.length} Active {activeCoupons.length === 1 ? 'Reward' : 'Rewards'}
            </span>
            {pastCoupons.length > 0 && (
              <span className="text-xs font-monoClinical px-3 py-1 rounded-full bg-[#F4F0EA] border border-[#E5DFD7] text-[#1C1614]/60 font-medium">
                {pastCoupons.length} Past
              </span>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: ACTIVE REWARDS (Available & Unexpired)       */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serifLuxury text-lg font-medium text-[#1C1614] flex items-center gap-2">
              <span>Active Rewards</span>
              <span className="text-xs font-monoClinical font-semibold px-2 py-0.5 rounded-full bg-[#8C3A27]/10 text-[#8C3A27]">
                {activeCoupons.length}
              </span>
            </h4>
            {activeCoupons.length > 0 && (
              <span className="text-[11px] font-monoClinical text-[#1C1614]/50">
                Detachable voucher tickets ready for checkout
              </span>
            )}
          </div>

          {activeCoupons.length === 0 ? (
            <div className="py-8 px-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#1C1614]/20 text-center">
              <p className="text-xs sm:text-sm font-sans text-[#1C1614]/75 font-medium">
                No active ritual vouchers at the moment.
              </p>
              <p className="text-[11px] font-sans text-[#1C1614]/50 mt-1">
                Place your next qualifying order (₹499+) to automatically earn a fresh wax-sealed mystery reward.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {activeCoupons.map((c) => {
                const isRevealed = Boolean(c.revealed);
                const isRevealing = revealingCode === c.code;
                const isCopied = copiedCode === c.code;

                return (
                  <div
                    key={c._id || c.code}
                    className="relative filter drop-shadow-[0_6px_16px_rgba(28,22,20,0.07)] transition-all group"
                  >
                    {/* Authentic Scalloped & Notched Ticket Silhouette with CSS Mask */}
                    <div
                      className="relative flex items-stretch rounded-2xl overflow-visible w-full bg-[#FCF9F4] ring-1 ring-inset ring-[#C5A880]/30"
                      style={ticketMaskStyle}
                    >
                      {/* Left Main Voucher Body (72% width — Clean Classic Luxury Layout) */}
                      <div className="w-[72%] min-w-0 p-3.5 sm:p-5 pl-4 sm:pl-6 flex flex-col justify-between space-y-2.5">
                        {/* Top Header: Botanical Gift Emblem + Stacked Editorial Serif Headline */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2 sm:space-x-2.5">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#8B4A38]/10 flex items-center justify-center text-[#8B4A38] shrink-0 border border-[#8B4A38]/20">
                              <Gift className="w-3.5 h-3.5 text-[#8B4A38]" />
                            </div>
                            <div className="leading-none">
                              <span className="font-serifLuxury text-xs sm:text-sm font-bold tracking-[0.2em] text-[#1C1614] uppercase block">
                                RITUAL
                              </span>
                              <span className="font-serifLuxury text-[9.5px] sm:text-[10.5px] tracking-[0.22em] text-[#1C1614]/70 uppercase block mt-0.5">
                                VOUCHER
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full font-monoClinical text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                              isRevealed
                                ? 'bg-[#E8E3EE] text-[#1C1614] border border-[#C5A880]/40'
                                : 'bg-[#FAF6EF] text-[#8B4A38] border border-[#8B4A38]/30'
                            }`}
                          >
                            {isRevealed ? 'ACTIVE' : 'SEALED'}
                          </span>
                        </div>

                        {/* Bottom Row (2-Column Split: Discount Pill Badge + Validity & Terms) */}
                        <div className="flex items-center space-x-2.5 sm:space-x-3 pt-1">
                          {/* Discount Pill Badge */}
                          <div className="bg-[#5C3A2E] text-[#FAF8F5] rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shrink-0 flex items-center justify-center shadow-xs">
                            <span className="font-serifLuxury text-base sm:text-lg md:text-xl font-bold tracking-tight whitespace-nowrap">
                              {isRevealed ? `${c.discountPercent}% OFF` : 'MYSTERY'}
                            </span>
                          </div>

                          {/* Validity & Terms Block */}
                          <div className="text-[8.5px] sm:text-[9.5px] tracking-[0.1em] text-[#6E6259] uppercase font-monoClinical leading-tight sm:leading-[1.35] flex flex-col justify-center min-w-0">
                            <span className="font-semibold text-[#1C1614]/85 whitespace-nowrap">
                              VALID UNTIL : {formatExpiryDateUpper(c.expiresAt)}
                            </span>
                            <span className="whitespace-nowrap">
                              MAX SAVINGS ₹{c.maxDiscount || 250}
                            </span>
                            <span className="text-[#8B4A38] font-bold tracking-[0.12em] whitespace-nowrap">
                              LOVEANDCO.IN
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vertical Dashed Perforation at 72% split */}
                      <div className="border-l-2 border-dashed border-[#C5A880]/75 self-stretch z-10 shrink-0" />

                      {/* Right Stub (28% width) */}
                      <div
                        className={`w-[28%] min-w-0 bg-[#F5EFE6] p-2 sm:p-3.5 pr-3 sm:pr-4 flex flex-col items-center justify-center text-center select-none space-y-2 sm:space-y-2.5 ${
                          isCopied
                            ? 'origin-top-left transition-all duration-300 ease-out translate-x-1.5 translate-y-1 rotate-3 shadow-md z-20'
                            : 'z-10'
                        }`}
                      >
                        {/* Micro-label */}
                        <span className="text-[7px] sm:text-[8px] font-monoClinical uppercase tracking-wider text-[#1C1614]/50 font-bold whitespace-nowrap">
                          ADMIT ONE / REDEEM
                        </span>

                        {/* Monospace Code Pill */}
                        <div className="w-full font-mono font-bold text-[9.5px] sm:text-[11px] tracking-tight sm:tracking-wider text-[#1C1614] bg-white/90 px-1 sm:px-1.5 py-1 rounded-lg border border-[#C5A880]/40 shadow-xs select-all whitespace-nowrap truncate">
                          {c.code}
                        </div>

                        {isRevealed ? (
                          /* COPY Pill Button with feedback */
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className={`w-full py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-full text-[9px] sm:text-[10px] font-monoClinical font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all shadow-xs active:scale-95 cursor-pointer ${
                              isCopied
                                ? 'bg-[#3E5242] text-white'
                                : 'bg-[#1C1614] hover:bg-[#2A211D] text-[#FAF8F5]'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-white shrink-0" />
                                <span className="truncate">COPIED ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#C5A880] shrink-0" />
                                <span>COPY</span>
                              </>
                            )}
                          </button>
                        ) : (
                          /* TEAR & REVEAL Button for sealed voucher */
                          <>
                            <button
                              type="button"
                              onClick={() => handleRevealCoupon(c.code)}
                              disabled={isRevealing}
                              className="w-full py-1 sm:py-1.5 px-1 rounded-full bg-gradient-to-r from-[#8C3A27] to-[#A64B35] hover:from-[#A64B35] hover:to-[#8C3A27] text-white text-[8.5px] sm:text-[10px] font-monoClinical font-bold uppercase tracking-wider flex items-center justify-center space-x-1 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {isRevealing ? (
                                <span>REVEALING...</span>
                              ) : (
                                <>
                                  <Gift className="w-3 h-3 text-[#FAF8F5] shrink-0" />
                                  <span className="truncate">UNSEAL</span>
                                </>
                              )}
                            </button>

                            {c.sourceOrderId && (
                              <Link
                                href={`/orders/${c.sourceOrderId}`}
                                className="text-[8px] sm:text-[8.5px] font-monoClinical text-[#8C3A27] underline hover:text-[#5C1F13] truncate max-w-full"
                              >
                                Order #{String(c.sourceOrderId).slice(-4)}
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: EXPIRED & REDEEMED (Tucked Away Past History) */}
        {/* Hidden completely if pastCoupons.length === 0           */}
        {/* ======================================================== */}
        {pastCoupons.length > 0 && (
          <div className="pt-6 border-t border-brand-silver space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPastHistory((prev) => !prev)}
                className="flex items-center gap-2 text-left group cursor-pointer"
              >
                <h4 className="font-serifLuxury text-base sm:text-lg font-medium text-[#1C1614]/75 group-hover:text-[#1C1614] transition-colors">
                  Past Redeemed &amp; Expired ({pastCoupons.length})
                </h4>
                <span className="text-xs font-monoClinical text-[#8C3A27] group-hover:underline">
                  {showPastHistory ? 'Hide ▲' : 'Show ▼'}
                </span>
              </button>
              <span className="text-[11px] font-monoClinical text-[#1C1614]/40 uppercase tracking-wider">
                Past History
              </span>
            </div>

            {showPastHistory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 animate-fadeIn">
                {pastCoupons.map((c) => {
                  const isUsed = Boolean(c.isUsed);

                  return (
                    <div
                      key={c._id || c.code}
                      className="relative filter drop-shadow-[0_4px_10px_rgba(28,22,20,0.04)] opacity-65 filter grayscale-[0.25]"
                    >
                      <div
                        className="relative flex items-stretch rounded-2xl overflow-visible w-full bg-[#F4F0EA] ring-1 ring-inset ring-[#E5DFD7]"
                        style={ticketMaskStyle}
                      >
                        {/* Left Body 72% */}
                        <div className="w-[72%] min-w-0 p-3 sm:p-4 pl-4 sm:pl-5 flex flex-col justify-between space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-md bg-[#1C1614]/10 flex items-center justify-center text-[#1C1614]/60 shrink-0">
                                <Gift className="w-3 h-3 text-[#1C1614]/60" />
                              </div>
                              <div className="leading-none">
                                <span className="font-serifLuxury text-[11px] sm:text-xs font-bold tracking-[0.18em] text-[#1C1614]/70 uppercase block">
                                  RITUAL
                                </span>
                                <span className="font-serifLuxury text-[8.5px] sm:text-[9.5px] tracking-[0.2em] text-[#1C1614]/50 uppercase block mt-0.5">
                                  ARCHIVE
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-[#1C1614]/10 text-[#1C1614]/60 font-monoClinical text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider shrink-0">
                              {isUsed ? 'REDEEMED' : 'EXPIRED'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2.5 pt-0.5">
                            <div className="bg-[#1C1614]/15 text-[#1C1614]/70 rounded-lg px-2.5 py-1 shrink-0 flex items-center justify-center">
                              <span className="font-serifLuxury text-sm sm:text-base font-bold whitespace-nowrap">
                                {c.discountPercent ? `${c.discountPercent}% OFF` : 'VOUCHER'}
                              </span>
                            </div>
                            <div className="text-[8px] sm:text-[9px] tracking-[0.1em] text-[#6E6259] uppercase font-monoClinical leading-tight flex flex-col justify-center min-w-0">
                              <span className="truncate">
                                {isUsed ? 'APPLIED AT CHECKOUT' : 'WINDOW CONCLUDED'}
                              </span>
                              <span className="text-[#8B4A38]/70 font-semibold tracking-[0.12em]">
                                LOVEANDCO.IN
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Perforated Divider at 72% */}
                        <div className="border-l-2 border-dashed border-[#D6CEC2] self-stretch z-10 shrink-0" />

                        {/* Right Stub 28% */}
                        <div className="w-[28%] min-w-0 bg-[#EBE5DB] p-2 sm:p-3 pr-3 sm:pr-3.5 flex flex-col items-center justify-center text-center space-y-2 select-none">
                          <span className="text-[7px] sm:text-[8px] font-monoClinical uppercase tracking-widest text-[#1C1614]/40 font-bold whitespace-nowrap">
                            ARCHIVED
                          </span>
                          <div className="w-full font-mono text-[9px] sm:text-[10px] tracking-tight text-[#1C1614]/40 line-through truncate">
                            {c.code}
                          </div>
                          <button
                            type="button"
                            disabled
                            className="w-full py-0.5 sm:py-1 px-1 rounded-full bg-[#1C1614]/10 text-[#1C1614]/40 text-[8px] sm:text-[8.5px] font-monoClinical font-bold uppercase tracking-wider cursor-not-allowed truncate"
                          >
                            {isUsed ? 'USED' : 'CLOSED'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
