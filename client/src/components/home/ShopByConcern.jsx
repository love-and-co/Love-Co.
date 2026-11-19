import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Droplets, Smile } from 'lucide-react';

const concerns = [
  {
    title: 'Acne & Blemishes',
    subtitle: 'Neem leaf & wild turmeric botanical clarification',
    concern: 'Acne',
    image: '/images/concern_acne.jpg',
    link: '/catalog?concern=Acne',
  },
  {
    title: 'Barrier Support & Sensitivity',
    subtitle: 'Rose petal & fresh goat milk soothing moisture',
    concern: 'Barrier Repair',
    image: '/images/concern_dryness.jpg',
    link: '/catalog?concern=Barrier%20Repair',
  },
  {
    title: 'Pigmentation & Texture',
    subtitle: 'Ayurvedic red sandalwood & raw shea replenishment',
    concern: 'Pigmentation',
    image: '/images/concern_barrier.jpg',
    link: '/catalog?concern=Pigmentation',
  },
  {
    title: 'Dry & Chapped Lips',
    subtitle: 'Pure damascena rose & raw shea butter cushion',
    concern: 'Dryness',
    image: '/images/concern_lips.jpg',
    link: '/catalog?category=lip-care',
  },
];

export default function ShopByConcern() {
  return (
    <section className="py-10 sm:py-14 md:py-18 lg:py-20 bg-[#F2EDF7] border-y-2 border-brand-silver relative overflow-hidden">
      {/* Decorative soft silver/lavender ambient glow */}
      <div className="absolute -top-32 -right-32 w-72 sm:w-96 h-72 sm:h-96 bg-brand-lavender/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 sm:w-96 h-72 sm:h-96 bg-brand-silver/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-10 lg:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2.5 sm:gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-brand-mocha text-white text-[9.5px] sm:text-xs font-mono-clinical font-bold uppercase tracking-widest mb-1.5 sm:mb-2.5 shadow-xs">
              Targeted Regimens
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-[38px] md:text-[44px] lg:text-5xl font-normal text-brand-mocha-900 tracking-tight">
              Shop by Skin Concern
            </h2>
          </div>
          <p className="text-[11.5px] sm:text-xs md:text-sm text-brand-mocha-900/70 font-sans max-w-md leading-relaxed">
            Biocompatible cold-pressed botanicals tailored to soothe, clarify, and fortify your skin barrier with clinical precision.
          </p>
        </div>

        {/* Responsive Grid: 2-column on mobile, 2-column on tablet, 4-column on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6">
          {concerns.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="group flex flex-col justify-between bg-white border border-brand-silver hover:border-brand-mocha rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300"
            >
              <div>
                {/* Image Container with Floating Category Pill */}
                <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-brand-silver-light">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-mocha-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full bg-brand-mocha/95 text-white text-[8.5px] sm:text-[9.5px] md:text-[10px] font-mono-clinical font-bold uppercase tracking-wider shadow-xs backdrop-blur-2xs">
                    {item.concern}
                  </span>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 lg:p-5">
                  <h3 className="font-serif-luxury font-medium text-xs sm:text-base lg:text-lg text-brand-mocha-900 group-hover:text-brand-mocha transition-colors leading-tight sm:leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-brand-mocha-900/65 font-sans mt-1 leading-snug line-clamp-2 hidden xs:line-clamp-2 sm:block">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mx-3 sm:mx-4 lg:mx-5 mb-3 sm:mb-4 lg:mb-5 pt-2 sm:pt-3 border-t border-brand-silver flex items-center justify-between text-[9.5px] sm:text-xs font-mono-clinical text-brand-mocha font-bold uppercase tracking-wider group-hover:text-brand-mocha-900 transition-colors">
                <span className="truncate pr-1">Explore</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-lavender text-brand-mocha-900 flex items-center justify-center group-hover:bg-brand-mocha group-hover:text-white transition-all shrink-0">
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
