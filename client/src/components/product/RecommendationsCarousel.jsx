import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../common/ProductCard';
import { mockProducts } from '../../data/mockProducts';

export default function RecommendationsCarousel({
  currentSlug,
  relatedProducts = [],
  title,
  products,
}) {
  const scrollRef = useRef(null);

  const rawList =
    products && products.length > 0
      ? products
      : relatedProducts && relatedProducts.length > 0
      ? relatedProducts
      : mockProducts;

  const productsToDisplay = rawList
    .filter((p) => (p.slug || p._id || p.id) !== currentSlug)
    .slice(0, 8)
    .map((p) => {
      // Normalize images array for ProductCard
      let images = p.images;
      if (!images || images.length === 0) {
        images = [
          {
            url: p.image || p.imageUrl || p.imagePrimary || '/images/products/bloom_neem_turmeric_soap.jpg',
            isPrimary: true,
          },
        ];
      } else if (typeof images[0] === 'string') {
        images = images.map((url, i) => ({ url, isPrimary: i === 0 }));
      }

      return {
        ...p,
        _id: p._id || p.id || p.slug,
        id: p.id || p._id || p.slug,
        slug: p.slug,
        name: p.name || p.title,
        title: p.title || p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice || p.mrp,
        activesConcentration:
          p.activesConcentration || p.concernsHandled?.[0] || 'Botanical Care',
        volumeWeight:
          p.volumeWeight ||
          p.volume ||
          (p.variants?.[0]?.size ? `${p.variants[0].size} bar` : '100g bar'),
        images,
        ratings: p.ratings || {
          average: p.rating || 4.9,
          count: p.reviewsCount || p.numReviews || 120,
        },
        stock: p.stock !== undefined ? p.stock : (p.stockQty !== undefined ? p.stockQty : 50),
      };
    });

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-10 sm:pt-14 pb-14 sm:pb-18 bg-[#FAF8F5] border-t border-[#E5DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header matching exact brand typography & right-aligned Explore link */}
        <div className="flex items-end justify-between mb-5 sm:mb-8 gap-3">
          <div>
            <span className="text-[11px] font-monoClinical uppercase tracking-[0.2em] text-[#6E6259] font-medium block">
              Dermatological Pairings
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl md:text-4xl text-[#1C1614] font-normal tracking-tight mt-1">
              {title || 'You Might Also Like'}
            </h2>
          </div>

          <Link
            href="/catalog"
            className="text-[10px] sm:text-[11px] font-monoClinical uppercase tracking-[0.16em] text-[#1C1614] hover:text-[#6E6259] flex items-center font-medium shrink-0 ml-auto transition-colors cursor-pointer pb-1 group"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 text-[#C5A880] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Carousel Scroll Track with exact "For You" device responsiveness */}
        <div className="relative group/carousel">
          {productsToDisplay.length > 4 && (
            <>
              <button
                type="button"
                onClick={() => scroll('left')}
                aria-label="Previous products"
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3.5 z-20 w-9 h-9 rounded-full bg-white/95 border border-[#E5DFD7] text-[#1C1614] hover:bg-[#FAF8F5] shadow-md items-center justify-center transition-all cursor-pointer opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                aria-label="Next products"
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3.5 z-20 w-9 h-9 rounded-full bg-white/95 border border-[#E5DFD7] text-[#1C1614] hover:bg-[#FAF8F5] shadow-md items-center justify-center transition-all cursor-pointer opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
          >
            {productsToDisplay.map((product) => (
              <div
                key={product._id || product.id || product.slug}
                className="w-[46vw] sm:w-[32vw] md:w-[24vw] lg:w-[calc(25%-18px)] shrink-0 snap-start flex flex-col"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
