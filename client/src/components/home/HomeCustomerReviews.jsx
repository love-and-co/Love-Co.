import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

const reviews = [
  {
    id: 1,
    rating: '5.0 / 5.0',
    title: '"Calmed my breakouts in 10 days"',
    comment:
      'The neem and turmeric blend cleared my forehead congestion without drying out my cheeks. The lather is rich, earthy and super gentle.',
    author: 'Priya M., Mumbai',
    product: 'LOVE & Co. BLOOM',
    verified: true,
  },
  {
    id: 2,
    rating: '5.0 / 5.0',
    title: '"Creamy and intensely hydrating"',
    comment:
      'My dry skin usually stings after any soap, but BLUSH feels like washing with pure liquid cream. The subtle natural rose aroma is therapeutic.',
    author: 'Shreya D., New Delhi',
    product: 'LOVE & Co. BLUSH',
    verified: true,
  },
  {
    id: 3,
    rating: '5.0 / 5.0',
    title: '"Genuine red sandalwood & raw shea"',
    comment:
      'The earthy warm woody aroma is natural and not overwhelming. It made my skin noticeably smoother and helped with post-sun dullness.',
    author: 'Vikram S., Bengaluru',
    product: 'LOVE & Co. VELVET',
    verified: true,
  },
  {
    id: 4,
    rating: '5.0 / 5.0',
    title: '"Cured my chapped lips overnight"',
    comment:
      'Non-sticky and cushiony. It creates a protective layer that lasts for hours without needing constant reapplication. Love the real rose aroma.',
    author: 'Ananya R., Pune',
    product: 'Velisse by LOVE & Co.',
    verified: true,
  },
];

export default function HomeCustomerReviews() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  // Sync scroll position with activeSlide dot on mobile/tablet
  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, offsetWidth } = carouselRef.current;
      const cards = carouselRef.current.children;
      let closestIndex = 0;
      let minDiff = Infinity;
      const containerCenter = scrollLeft + offsetWidth / 2;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const diff = Math.abs(containerCenter - cardCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      setActiveSlide(closestIndex);
    }
  };

  const scrollToSlide = (index) => {
    const targetIndex = (index + reviews.length) % reviews.length;
    setActiveSlide(targetIndex);
    if (carouselRef.current) {
      const container = carouselRef.current;
      const card = container.children[targetIndex];
      if (card) {
        const cardLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        const containerWidth = container.offsetWidth;
        const targetScroll = cardLeft - (containerWidth - cardWidth) / 2;
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    }
  };

  const nextSlide = () => {
    scrollToSlide(activeSlide + 1);
  };

  const prevSlide = () => {
    scrollToSlide(activeSlide - 1);
  };

  // Move carousel automatically every 4 seconds when not hovered/touched
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % reviews.length;
        if (carouselRef.current) {
          const container = carouselRef.current;
          const card = container.children[next];
          if (card) {
            const cardLeft = card.offsetLeft;
            const cardWidth = card.offsetWidth;
            const containerWidth = container.offsetWidth;
            const targetScroll = cardLeft - (containerWidth - cardWidth) / 2;
            container.scrollTo({
              left: Math.max(0, targetScroll),
              behavior: 'smooth',
            });
          }
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-brand-silver-light/30 border-b border-brand-silver overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14 space-y-2">
          <span className="text-[10px] sm:text-xs font-mono-clinical uppercase tracking-[0.2em] sm:tracking-wider text-brand-mocha font-bold block">
            Our customers felt happy
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-[38px] md:text-[44px] lg:text-5xl font-normal text-brand-mocha-900 tracking-tight">
            Customer Reviews
          </h2>
        </div>

        {/* 1. Mobile & Tablet Carousel View (< lg) */}
        <div
          className="lg:hidden relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Scroll-Snap Slider */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex space-x-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 px-1"
          >
            {reviews.map((r, i) => (
              <div
                key={r.id}
                className="w-[85vw] sm:w-[380px] shrink-0 snap-center bg-white border border-brand-silver p-5 sm:p-6 flex flex-col justify-between shadow-xs rounded-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono-clinical uppercase tracking-wider text-brand-mocha font-bold flex items-center space-x-1">
                      <span className="text-brand-mocha fill-brand-mocha">★</span>
                      <span>{r.rating} Rating</span>
                    </div>
                    {r.product && (
                      <span className="text-[9px] font-mono-clinical uppercase bg-brand-lavender-light text-brand-lavender-text border border-brand-lavender px-2 py-0.5 rounded-xs font-semibold">
                        {r.product}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif-luxury font-medium text-base sm:text-lg text-brand-mocha-900 leading-snug">
                    {r.title}
                  </h4>
                  <p className="text-xs text-brand-mocha/80 font-sans leading-relaxed">
                    {r.comment}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-brand-silver flex items-center justify-between text-[11px] font-mono-clinical text-brand-mocha/80">
                  <span className="font-bold text-brand-mocha-900">{r.author}</span>
                  <span className="text-moss font-semibold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Buyer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Desktop Grid View (>= lg) */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-5">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-brand-silver p-6 flex flex-col justify-between shadow-xs rounded-sm hover:border-brand-mocha/40 transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono-clinical uppercase tracking-wider text-brand-mocha font-bold flex items-center space-x-1">
                    <span className="text-brand-mocha fill-brand-mocha">★</span>
                    <span>{r.rating} Rating</span>
                  </div>
                  {r.product && (
                    <span className="text-[9px] font-mono-clinical uppercase bg-brand-lavender-light text-brand-lavender-text border border-brand-lavender px-1.5 py-0.5 rounded-xs font-semibold">
                      {r.product}
                    </span>
                  )}
                </div>
                <h4 className="font-serif-luxury font-medium text-base text-brand-mocha-900 leading-snug">
                  {r.title}
                </h4>
                <p className="text-xs text-brand-mocha/80 font-sans leading-relaxed">
                  {r.comment}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-silver flex items-center justify-between text-[11px] font-mono-clinical text-brand-mocha/80">
                <span className="font-bold text-brand-mocha-900">{r.author}</span>
                <span className="text-moss font-semibold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Buyer
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
