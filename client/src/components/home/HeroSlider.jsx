import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// 3 Distinct Slides with Unique High-Resolution Imagery & Responsive Copy
const SLIDES = [
  {
    id: 1,
    badge: 'Artisanal Craft →',
    headline: 'Slow-Cured Cold-Pressed Botanicals',
    subtitleLarge: '4-Week Slow Cured on Natural Decks',
    shortBenefit: 'Cold-pressed oils for creamy, barrier-safe lather.',
    subtext:
      'Handcrafted in small batches using raw plant butters, cold-pressed oils, and therapeutic herbs — cured for 4 weeks for a barrier-safe lather.',
    ctaText: 'Discover Our Craft',
    ctaLink: '/about',
    // Collage Images
    heroPortrait: '/images/login_botanical_banner.jpg',
    heroPortraitAlt: 'Radiant skin botanical skincare ritual',
    circleTop: '/images/why_choose_us_craft.jpg',
    circleTopAlt: 'Artisan cold-pressed soap crafting in wooden molds',
    circleBottom: '/images/blush_rose_goatmilk_soap.jpg',
    circleBottomAlt: 'Blush Rose & Goat Milk soap bar with fresh botanicals',
  },
  {
    id: 2,
    badge: 'New Launch →',
    headline: 'Pure Botanical Lip Care & Butters',
    subtitleLarge: 'Raw Nilotica Shea & Golden Jojoba',
    shortBenefit: 'Overnight barrier cushion for soft, plump lips.',
    subtext:
      'Deeply restorative overnight lip cushion infused with raw Nilotica shea butter, golden jojoba, and cold-pressed sweet almond for plump, barrier-repaired lips.',
    ctaText: 'Shop Now',
    ctaLink: '/catalog?category=lip-care',
    // Collage Images
    heroPortrait: '/images/concern_lips.jpg',
    heroPortraitAlt: 'Hydrated natural healthy lips and radiant complexion',
    circleTop: '/images/velisse_rose_lipbalm.jpg',
    circleTopAlt: 'Velisse botanical lip butter jar with Damask rose petals',
    circleBottom: '/images/alkanna_tinted_lipbutter.jpg',
    circleBottomAlt: 'Alkanna tinted botanical lip butter',
  },
  {
    id: 3,
    badge: 'Signature Collection →',
    headline: 'The Daily Radiance Trio',
    subtitleLarge: 'Bloom Neem, Blush Rose & Velvet Sandalwood',
    shortBenefit: 'Daily clarifying rituals for balanced, radiant skin.',
    subtext:
      'Our most-loved products: Blush Rose & Goat Milk, Bloom Neem & Turmeric, and Velvet Red Sandalwood for balanced, clarified skin.',
    ctaText: 'Explore Bestsellers',
    ctaLink: '/catalog?sort=bestselling',
    // Collage Images
    heroPortrait: '/images/concern_barrier.jpg',
    heroPortraitAlt: 'Dewy natural skin barrier glow',
    circleTop: '/images/curated_regimen_basket.jpg',
    circleTopAlt: 'Curated cold-pressed soap collection basket',
    circleBottom: '/images/bloom_neem_turmeric_soap.jpg',
    circleBottomAlt: 'Bloom Neem and Turmeric clarifying soap bar',
  },
  {
    id: 4,
    badge: 'Love Loyalty Club →',
    headline: 'Our Love Loyalty Points & Rewards',
    subtitleLarge: 'Earn Points On Every Order',
    shortBenefit: 'Redeem points for mystery gifts & complimentary trios.',
    subtext:
      'Join our inner circle. Earn Love Loyalty Points on every purchase, unlock exclusive mystery coupons, and receive complimentary botanical trios.',
    ctaText: 'Explore Rewards',
    ctaLink: '/account/profile',
    // Collage Images
    heroPortrait: '/images/loyalty_hero_portrait.jpg',
    heroPortraitAlt: 'Love & Co. Loyalty Club luxury gift box with burgundy wax seal and golden membership card',
    circleTop: '/images/loyalty_stamp_card.jpg',
    circleTopAlt: 'Embossed golden ritual stamps on deckle-edge loyalty passport',
    circleBottom: '/images/loyalty_rewards_gift.jpg',
    circleBottomAlt: 'Curated complimentary trio gift set with Reward Tier Unlocked gold foil tag',
  },
];

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-advance every 5 seconds (5000ms) with pause on hover/interaction
  useEffect(() => {
    if (isPaused || isDragging) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, isDragging]);

  const goToSlide = (idx) => setActiveSlide(idx);
  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));

  // High-sensitivity touch swipe support for mobile fingers
  const handleTouchStart = (e) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    if (touchStartX === null || !e.changedTouches || e.changedTouches.length === 0) return;

    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    // Detect horizontal swipe with 30px threshold (prioritizes horizontal over vertical scroll)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (diffX > 0) {
        nextSlide(); // Finger swiped left -> Next slide
      } else {
        prevSlide(); // Finger swiped right -> Previous slide
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Pointer / Mouse drag support for desktop & trackpads
  const handlePointerDown = (e) => {
    setIsPaused(true);
    setIsDragging(true);
    setTouchStartX(e.clientX);
    setTouchStartY(e.clientY);
  };

  const handlePointerUp = (e) => {
    setIsPaused(false);
    if (!isDragging || touchStartX === null) {
      setIsDragging(false);
      return;
    }

    const diffX = touchStartX - e.clientX;
    const diffY = touchStartY - e.clientY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setIsDragging(false);
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const current = SLIDES[activeSlide];

  return (
    <section
      className="relative w-full bg-[#FAF8F5] border-b border-[#EAE6DF] overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-label="Love & Co. Editorial Hero"
    >
      {/* 
        Ultra-Compact Side-by-Side Proportions:
        Mobile (~340px-370px), Tablet md:h-[370px], Laptop/Desktop lg:h-[420px] xl:h-[450px]
      */}
      <div className="w-full max-w-[1680px] mx-auto py-2.5 sm:py-3 md:py-3.5 lg:py-5 h-[340px] sm:h-[370px] md:h-[370px] lg:h-[420px] xl:h-[450px] flex flex-row items-center">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN (Expanded to fill available space)           */}
        {/* ======================================================== */}
        <div className="relative w-[56%] sm:w-[58%] lg:w-[60%] pl-3.5 pr-2 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex flex-col justify-center h-full">
          <div className="max-w-2xl xl:max-w-3xl space-y-2 sm:space-y-2.5 md:space-y-3.5 my-auto">
            
            {/* Eyebrow Badge */}
            <div className="overflow-hidden">
              <span
                key={`badge-${activeSlide}`}
                className="inline-flex items-center text-[9px] sm:text-[10px] md:text-xs font-classic uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#C06C4E] font-bold transition-opacity duration-500 animate-fadeIn"
              >
                {current.badge}
              </span>
            </div>

            {/* Headline (Grand & Expanded across width) */}
            <div>
              <h1
                key={`headline-${activeSlide}`}
                className="font-serif-editorial font-medium text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[50px] text-[#1C1614] leading-[1.08] sm:leading-[1.12] md:leading-[1.14] tracking-tight transition-opacity duration-500 animate-fadeIn"
              >
                {current.headline}
              </h1>
            </div>

            {/* Sub-tagline & Expanded Description */}
            <div
              key={`sub-${activeSlide}`}
              className="space-y-1 sm:space-y-1.5 transition-opacity duration-500 animate-fadeIn"
            >
              <p className="text-xs sm:text-sm md:text-base font-serif font-bold text-[#1C1614] tracking-wide leading-snug">
                {current.subtitleLarge}
              </p>

              <p className="block lg:hidden text-[10px] sm:text-xs text-[#4A3B32] font-sans font-light leading-relaxed">
                {current.shortBenefit}
              </p>
              <p className="hidden lg:block text-xs sm:text-sm md:text-[14.5px] text-[#4A3B32] font-sans font-light leading-relaxed max-w-xl xl:max-w-2xl">
                {current.subtext}
              </p>
            </div>

            {/* Expanded CTA Pill Button */}
            <div className="pt-1.5 sm:pt-2.5">
              <Link
                href={current.ctaLink}
                className="inline-flex items-center space-x-2 px-5 py-2 sm:px-6 sm:py-2.5 bg-[#1C1614] hover:bg-[#342721] text-[#FAF9F8] font-classic text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium rounded-full transition-all duration-300 shadow-xs hover:shadow-sm active:scale-95 cursor-pointer group"
              >
                <span>{current.ctaText}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN (Harmonious Organic Collage)                 */}
        {/* ======================================================== */}
        <div className="relative w-[44%] sm:w-[42%] lg:w-[40%] pr-3.5 pl-2 sm:px-4 md:px-6 lg:px-8 flex items-center justify-center overflow-hidden bg-[#FAF8F5] h-full">
          
          {/* Scaled-Down Collage Canvas */}
          <div className="relative w-full max-w-[220px] sm:max-w-[280px] md:max-w-[360px] lg:max-w-[440px] xl:max-w-[480px] h-[250px] sm:h-[280px] md:h-[300px] lg:h-[340px] xl:h-[360px] my-auto">
            
            {/* Top Organic Cutout Arch */}
            <div className="absolute top-0 right-0 sm:right-2 w-[72%] sm:w-[68%] h-[250px] sm:h-[280px] md:h-[300px] lg:h-[340px] xl:h-[360px] rounded-t-[60px] sm:rounded-t-[80px] md:rounded-t-[95px] xl:rounded-t-[120px] rounded-b-[16px] sm:rounded-b-[20px] lg:rounded-b-[24px] overflow-hidden shadow-sm sm:shadow-md md:shadow-lg border-2 sm:border-4 border-white z-10 transition-all duration-700">
              <img
                key={`portrait-${activeSlide}`}
                src={current.heroPortrait}
                alt={current.heroPortraitAlt}
                className="w-full h-full object-cover object-center transition-opacity duration-700 animate-fadeIn"
              />
              {/* Soft sunlit overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1614]/15 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Circular Organic Crop 1 (Top Left) */}
            <div className="absolute top-4 sm:top-6 lg:top-8 left-0 sm:left-2 md:left-4 w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden shadow-sm sm:shadow-md md:shadow-lg border-2 sm:border-4 border-[#FAF8F5] z-20 transition-all duration-700 hover:scale-105">
              <img
                key={`circ-top-${activeSlide}`}
                src={current.circleTop}
                alt={current.circleTopAlt}
                className="w-full h-full object-cover object-center transition-opacity duration-700 animate-fadeIn"
              />
            </div>

            {/* Circular Organic Crop 2 (Bottom Left) */}
            <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-2 lg:bottom-2 left-6 sm:left-8 md:left-10 lg:left-14 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden shadow-md sm:shadow-lg md:shadow-xl border-2 sm:border-4 border-[#FAF8F5] z-30 transition-all duration-700 hover:scale-105">
              <img
                key={`circ-bot-${activeSlide}`}
                src={current.circleBottom}
                alt={current.circleBottomAlt}
                className="w-full h-full object-cover object-center transition-opacity duration-700 animate-fadeIn"
              />
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* CLEAN BOTTOM-CENTER PAGINATION DOTS ONLY                  */}
      {/* Zero arrows, zero numbering, positioned at bottom-3       */}
      {/* ======================================================== */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className="p-1 focus:outline-none cursor-pointer"
          >
            <span
              className={`block transition-all duration-300 rounded-full ${
                idx === activeSlide
                  ? 'w-6 h-1.5 bg-[#2A211D]'
                  : 'w-1.5 h-1.5 bg-[#2A211D]/30 hover:bg-[#2A211D]/60'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
