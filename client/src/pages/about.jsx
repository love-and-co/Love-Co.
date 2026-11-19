import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Heart, Leaf, Award, ArrowRight, Clock, Droplets, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us — Love &amp; Co. Botanical Atelier</title>
        <meta
          name="description"
          content="Learn about Love & Co. — our dedication to small-batch cold-saponified cleansing bars, bio-active restorative botanicals, and conscious formulation."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900">
        {/* Hero Banner */}
        <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-[#E6E0F0]/50 via-[#FAF9F8] to-[#FAF9F8] border-b border-brand-silver">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="inline-block px-3.5 py-1.5 bg-brand-mocha text-white text-[11px] font-monoClinical font-bold uppercase tracking-widest rounded-full shadow-2xs">
              Our Heritage &amp; Craft
            </span>
            <h1 className="font-serifLuxury text-4xl sm:text-5xl lg:text-6xl text-brand-mocha-900 font-normal tracking-tight">
              Honoring Skin as a Living Ecosystem
            </h1>
            <p className="text-sm sm:text-base text-brand-mocha-900/75 max-w-2xl mx-auto font-sans leading-relaxed">
              Love &amp; Co. was born from a refusal to compromise between natural purity and active clinical efficacy. We craft small-batch cold-saponified bars and restorative botanical lip elixirs free from synthetic syndets, fillers, and artificial perfumes.
            </p>
          </div>
        </section>

        {/* The 4 Pillars */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serifLuxury text-2xl sm:text-3xl text-brand-mocha-900 mb-2">
              The Four Atelier Pillars
            </h2>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 max-w-lg mx-auto font-sans">
              Every formulation leaves our laboratory only when it aligns with our strict biocompatibility standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border-2 border-brand-silver shadow-xs hover:border-brand-mocha/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#E6E0F0] border border-brand-silver flex items-center justify-center text-brand-mocha mb-4">
                <Clock className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serifLuxury text-lg text-brand-mocha-900 mb-2">6-Week Slow Cure</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans leading-relaxed">
                We never rush saponification with artificial heat. Our bars cure naturally for 42 days, yielding a dense, gentle lather with naturally retained glycerin.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-brand-silver shadow-xs hover:border-brand-mocha/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#E6E0F0] border border-brand-silver flex items-center justify-center text-brand-mocha mb-4">
                <Leaf className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serifLuxury text-lg text-brand-mocha-900 mb-2">Zero Detergent Syndets</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans leading-relaxed">
                Free of SLS, SLES, parabens, phthalates, and synthetic lather boosters. Only organic plant lipids and certified organic herbal actives touch your skin.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-brand-silver shadow-xs hover:border-brand-mocha/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#E6E0F0] border border-brand-silver flex items-center justify-center text-brand-mocha mb-4">
                <Droplets className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serifLuxury text-lg text-brand-mocha-900 mb-2">Active Lipid Matrix</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans leading-relaxed">
                Enriched with Ugandan Nilotica shea butter, plant squalane, virgin cold-pressed coconut, and wild-harvested turmeric to repair the moisture barrier.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-brand-silver shadow-xs hover:border-brand-mocha/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#E6E0F0] border border-brand-silver flex items-center justify-center text-brand-mocha mb-4">
                <Award className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serifLuxury text-lg text-brand-mocha-900 mb-2">Clinical Diagnostics</h3>
              <p className="text-xs text-brand-mocha-900/70 font-sans leading-relaxed">
                Paired with our Sam AI Skin Expert to formulate individualized regimens tailored to your skin’s unique sebum, sensitivity, and barrier state.
              </p>
            </div>
          </div>
        </section>

        {/* Atelier Commitment Card */}
        <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border-2 border-brand-silver p-8 sm:p-12 shadow-sm text-center space-y-6">
            <span className="text-xs font-monoClinical uppercase tracking-wider text-brand-mocha font-bold">
              Our Clean Formulation Pledge
            </span>
            <h2 className="font-serifLuxury text-3xl sm:text-4xl text-brand-mocha-900">
              Complete INCI Transparency
            </h2>
            <p className="text-xs sm:text-sm text-brand-mocha-900/75 leading-relaxed font-sans max-w-2xl mx-auto">
              We list 100% of our ingredients without proprietary masking. If an oil is in our formulation, it is cold-pressed and unrefined. If an extract is present, it is standardized for therapeutic potency.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-4 text-xs font-monoClinical">
              <span className="px-4 py-2 bg-[#FAF9F8] border border-brand-silver rounded-full text-brand-mocha font-semibold">
                ✓ Cruelty Free &amp; Leaping Bunny Standards
              </span>
              <span className="px-4 py-2 bg-[#FAF9F8] border border-brand-silver rounded-full text-brand-mocha font-semibold">
                ✓ Hand-Poured in Micro-Batches
              </span>
              <span className="px-4 py-2 bg-[#FAF9F8] border border-brand-silver rounded-full text-brand-mocha font-semibold">
                ✓ Recyclable &amp; Plastic-Negative Packaging
              </span>
            </div>

            <div className="pt-6">
              <Link
                href="/catalog"
                className="inline-flex items-center space-x-2 px-8 py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-monoClinical font-bold uppercase tracking-wider transition-all shadow-md"
              >
                <span>Explore Our Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

