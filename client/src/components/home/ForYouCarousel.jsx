import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../common/ProductCard';

export default function ForYouCarousel({ products = [], loading = false }) {
  const scrollRef = useRef(null);

  return (
    <section className="pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-14 bg-white border-b border-brand-silver">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Explore All */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-serif-luxury text-3xl sm:text-[40px] md:text-[44px] lg:text-5xl font-normal text-brand-mocha-900 tracking-tight">
            For You
          </h2>

          <Link
            href="/catalog"
            className="text-xs font-mono-clinical uppercase tracking-wider text-brand-mocha-900 hover:text-brand-mocha flex items-center font-bold shrink-0 ml-3 transition-colors cursor-pointer"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 text-brand-mocha" />
          </Link>
        </div>

        {/* Carousel Scroll Track */}
        {loading ? (
          <div className="flex gap-3 sm:gap-4 lg:gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-[46vw] sm:w-[32vw] md:w-[24vw] lg:w-[calc(25%-18px)] shrink-0 border border-brand-silver p-3 lg:p-5 animate-pulse bg-brand-silver-light"
              >
                <div className="aspect-square bg-brand-silver mb-3"></div>
                <div className="h-2.5 bg-brand-silver w-3/4 mb-1.5"></div>
                <div className="h-3 bg-brand-silver w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
          >
            {products.map((product) => (
              <div
                key={product._id || product.id}
                className="w-[46vw] sm:w-[32vw] md:w-[24vw] lg:w-[calc(25%-18px)] shrink-0 snap-start flex flex-col"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
