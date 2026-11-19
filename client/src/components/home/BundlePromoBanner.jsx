import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BundlePromoBanner() {
  return (
    <section className="bg-brand-canvas border-b border-brand-silver py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-mocha-900 text-white rounded-2xl sm:rounded-3xl border border-brand-mocha-700 shadow-2xl relative overflow-hidden">
          {/* Subtle decorative background ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lavender/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-lavender/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 lg:p-12 relative z-10">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#E6E0F0] animate-pulse" />
                <span className="font-serif-luxury text-xs sm:text-sm tracking-[0.25em] uppercase text-[#E6E0F0] font-medium">
                  Custom Duo Engineering
                </span>
              </div>

              <h2 className="font-serif-luxury text-[26px] sm:text-[34px] md:text-[38px] lg:text-4xl font-light text-white leading-tight">
                Build Your Own 2-Step Botanical Duo. <br className="hidden sm:inline" />
                <span className="italic font-normal text-[#E6E0F0] block sm:inline mt-1 sm:mt-0">
                  Save 10% on 2 items.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#E5E4E2]/90 font-sans leading-relaxed max-w-xl">
                Rather than forcing rigid multi-step regimens, our kit engine allows you to pair your favorite cold-pressed saponified cleansing bars with our restorative Nilotica shea lip butters.
              </p>

              {/* Benefit highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono-clinical">
                <div className="flex items-center space-x-2 text-[#A86D49]">
                  <CheckCircle2 className="w-4 h-4 text-[#A86D49] shrink-0" />
                  <span className="font-medium">Customizable soap &amp; balm pairings</span>
                </div>
                <div className="flex items-center space-x-2 text-[#A86D49]">
                  <CheckCircle2 className="w-4 h-4 text-[#A86D49] shrink-0" />
                  <span className="font-medium">Automatic 10% duo bundle discount</span>
                </div>
              </div>

              {/* Action Button (Desktop Only) */}
              <div className="hidden lg:block pt-2">
                <Link
                  href="/bundle-builder"
                  className="pressable inline-flex items-center justify-center space-x-2 px-8 py-3.5 sm:py-4 bg-[#E6E0F0] text-brand-mocha-900 hover:bg-white text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-lg rounded-xl group cursor-pointer"
                >
                  <span>Launch Kit Configurator</span>
                  <ArrowRight className="w-4 h-4 text-brand-mocha-900 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* Right Basket Image Showcase & Mobile Action Button */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
              <Link href="/bundle-builder" className="block relative group w-full max-w-md cursor-pointer">
                <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden border border-brand-mocha-700 shadow-2xl bg-neutral-900">
                  <img
                    src="/images/botanical_kit_basket.jpg"
                    alt="Curated Love & Co. Botanical Basket with BLOOM, BLUSH, VELVET and Velisse"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
              </Link>

              {/* Action Button (Mobile & Tablet: placed below the photo) */}
              <div className="block lg:hidden w-full max-w-md pt-5 sm:pt-6">
                <Link
                  href="/bundle-builder"
                  className="pressable w-full flex items-center justify-center space-x-2 px-8 py-3.5 sm:py-4 bg-[#E6E0F0] text-brand-mocha-900 hover:bg-white text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-lg rounded-xl group text-center cursor-pointer"
                >
                  <span>Launch Kit Configurator</span>
                  <ArrowRight className="w-4 h-4 text-brand-mocha-900 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
