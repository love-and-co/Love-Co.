import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function WhyChooseUsSection() {
  const pillars = [
    {
      id: 'cold-saponified',
      title: 'Sub-35°C Cold Saponified',
      description: 'Preserves 100% native moisturizing glycerol and living lipids never damaged by boiling heat.',
      icon: (
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 sm:w-12 sm:h-12 stroke-current fill-none transition-transform duration-300 group-hover:scale-105"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Cold-Pressed Botanical Lipid Droplet */}
          <path d="M24 6C16 18 12 24 12 31a12 12 0 0 0 24 0c0-7-4-13-12-25z" />
          <path d="M24 17v13" strokeDasharray="2 3" strokeWidth="1.5" />
          <circle cx="24" cy="31" r="3" fill="currentColor" />
          <path d="M19 20c-1 3 0 7 3 8" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 'whole-botanicals',
      title: 'Whole Active Botanicals',
      description: 'Pure wild turmeric, organic neem, fresh goat milk, and authentic red sandalwood with zero fillers.',
      icon: (
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 sm:w-12 sm:h-12 stroke-current fill-none transition-transform duration-300 group-hover:scale-105"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Mortar & Sprouting Botanicals */}
          <path d="M10 25c0 9 6 14 14 14s14-5 14-14H10z" />
          <path d="M30 10l-8 15" strokeWidth="2.5" />
          <path d="M18 17c-3-2-7-1-8 2 2 3 6 3 8 0z" />
          <path d="M21 14c1-3 5-5 8-3-1 3-4 5-8 3z" />
        </svg>
      ),
    },
    {
      id: 'cedar-curing',
      title: '45-Day Cedar Curing',
      description: 'Naturally air-cured on slatted cedar drying racks for rock-dense bars that produce rich micro-suds.',
      icon: (
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 sm:w-12 sm:h-12 stroke-current fill-none transition-transform duration-300 group-hover:scale-105"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Slow Maturation Hourglass */}
          <path d="M14 8h20M14 40h20" strokeWidth="2" />
          <path d="M16 8v6c0 5 4 8 8 10 4-2 8-5 8-10V8" />
          <path d="M16 40v-6c0-5 4-8 8-10 4 2 8 5 8 10v6" />
          <circle cx="24" cy="33" r="2" fill="currentColor" />
          <circle cx="24" cy="37" r="2.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'purity-disclosure',
      title: '100% Purity Disclosure',
      description: 'Full transparency with zero synthetic fragrance, sulfated detergents, artificial dyes, or EDTA binders.',
      icon: (
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 sm:w-12 sm:h-12 stroke-current fill-none transition-transform duration-300 group-hover:scale-105"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Purity Shield with Verified Botanical Check */}
          <path d="M24 6l14 5v11c0 11-7 18-14 20-7-2-14-9-14-20V11l14-5z" />
          <path d="M18 24l4 4 8-8" strokeWidth="2.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-brand-canvas border-b border-brand-silver">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header tailored to Love & Co. Products */}
        <div className="max-w-3xl mx-auto text-center space-y-2 sm:space-y-3 px-2">
          <span className="text-[10px] sm:text-[11px] font-mono-clinical uppercase tracking-[0.2em] sm:tracking-[0.25em] text-brand-mocha font-bold block">
            The Love &amp; Co. Distinction
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-[38px] md:text-[44px] lg:text-5xl font-normal text-brand-mocha-900 tracking-tight leading-tight">
            Why Choose Love &amp; Co.?
          </h2>
          <p className="text-xs sm:text-sm text-brand-mocha-700 font-sans leading-relaxed max-w-2xl mx-auto">
            Where traditional cold-process soapmaking meets modern lipid biocompatibility. Formulated under 35°C to protect your skin barrier with authentic organic botanicals.
          </p>
        </div>

        {/* Responsive Grid: 2 columns on Mobile (<640px), 2 columns on small Tablet, 4 columns on Desktop (>=768px/1024px) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-10 pt-10 sm:pt-14 lg:pt-16 max-w-6xl mx-auto">
          {pillars.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col items-center text-center p-2 sm:p-4 rounded-sm transition-all"
            >
              {/* Minimalist Vector Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-brand-mocha-900 group-hover:text-brand-mocha transition-colors">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="font-serif-luxury text-sm sm:text-base lg:text-lg font-medium text-brand-mocha-900 mt-2.5 sm:mt-4 mb-1 sm:mb-2 tracking-tight leading-snug">
                {item.title}
              </h3>

              {/* Subtitle Description */}
              <p className="text-[11px] sm:text-xs lg:text-[13px] text-brand-mocha-700 font-sans leading-relaxed max-w-[170px] sm:max-w-[220px] lg:max-w-[240px]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Action CTA Button */}
        <div className="mt-10 sm:mt-12 lg:mt-14 text-center px-4">
          <Link
            href="/catalog"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-brand-mocha text-white hover:bg-brand-mocha-600 transition-colors text-xs font-mono-clinical uppercase tracking-wider font-bold rounded-sm shadow-sm cursor-pointer"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
