import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Star, CheckCircle2, ShieldCheck, ThumbsUp, ArrowRight, MessageSquareQuote, Filter } from 'lucide-react';

const REVIEWS_DATA = [
  {
    id: 1,
    name: 'Dr. Ananya Sen',
    location: 'Bengaluru',
    product: 'LOVE & Co. BLOOM (Neem & Turmeric)',
    rating: 5,
    title: 'Cleared persistent jawline acne within 3 weeks',
    comment: 'As someone dealing with stubborn adult hormonal breakouts, most face washes stripped my skin raw. BLOOM produces this incredibly dense botanical foam that calms inflammation without that tight, dry feeling. Genuinely impressed by the cold-saponified craft.',
    date: '14 Oct 2026',
    verified: true,
    helpfulCount: 42,
    category: 'Acne & Clarifying'
  },
  {
    id: 2,
    name: 'Pooja Iyer',
    location: 'Chennai',
    product: 'LOVE & Co. BLUSH (Rose & Goat Milk)',
    rating: 5,
    title: 'Holy grail for sensitive, dehydrated skin',
    comment: 'The natural lactic acid from the goat milk and soothing rose petals make this bar feel like a luxury spa treatment. My skin barrier has never felt softer. The 6-week cure really shows in how long the bar lasts without melting into mush.',
    date: '21 Oct 2026',
    verified: true,
    helpfulCount: 38,
    category: 'Hydration & Sensitive Skin'
  },
  {
    id: 3,
    name: 'Vikramaditya Roy',
    location: 'Mumbai',
    product: 'LOVE & Co. VELVET (Red Sandalwood & Shea)',
    rating: 5,
    title: 'Faded beach tan and evened out my texture',
    comment: 'Used VELVET daily after returning from a coastal vacation in Goa. The Rakta Chandana and raw shea combination lifted dead cells gently and restored my natural skin tone without irritation. Truly ultra-clean apothecary quality.',
    date: '02 Oct 2026',
    verified: true,
    helpfulCount: 29,
    category: 'Sun Tan & Marks'
  },
  {
    id: 4,
    name: 'Meera Deshmukh',
    location: 'Pune',
    product: 'LOVE & Co. VELISSE (Nilotica Lip Elixir)',
    rating: 5,
    title: 'Healed chapped, peeling lips overnight',
    comment: 'I have tried every pharmacy lip balm and luxury lip mask on the market. VELISSE is in a league of its own. It absorbs into the lips rather than sitting on top like waxy petroleum jelly. Zero synthetic scent, just pure botanical butter.',
    date: '18 Oct 2026',
    verified: true,
    helpfulCount: 51,
    category: 'Lip Care'
  },
  {
    id: 5,
    name: 'Siddharth Menon',
    location: 'Kochi',
    product: 'LOVE & Co. BLOOM (Neem & Turmeric)',
    rating: 5,
    title: 'Best Ayurvedic cleanser with modern clinical texture',
    comment: 'Does not dry out skin even when used twice daily. Lathers beautifully and washes away cleanly with zero chemical residue. Highly recommend pairing with their bundle discount.',
    date: '26 Oct 2026',
    verified: true,
    helpfulCount: 19,
    category: 'Acne & Clarifying'
  },
  {
    id: 6,
    name: 'Ritu Kulkarni',
    location: 'Hyderabad',
    product: 'LOVE & Co. BLUSH (Rose & Goat Milk)',
    rating: 5,
    title: 'Pure indulgence every single morning',
    comment: 'The scent is faint and natural, completely free from cheap artificial rose perfumery. Leaves skin calm, velvety, and hydrated before applying my serums.',
    date: '28 Oct 2026',
    verified: true,
    helpfulCount: 15,
    category: 'Hydration & Sensitive Skin'
  }
];

const CATEGORIES = ['All Concerns', 'Acne & Clarifying', 'Hydration & Sensitive Skin', 'Sun Tan & Marks', 'Lip Care'];

export default function ReviewsPage() {
  const [selectedCat, setSelectedCat] = useState('All Concerns');
  const [helpfulMap, setHelpfulMap] = useState({});

  const handleHelpful = (id) => {
    setHelpfulMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filtered = selectedCat === 'All Concerns'
    ? REVIEWS_DATA
    : REVIEWS_DATA.filter((r) => r.category === selectedCat);

  return (
    <>
      <Head>
        <title>Verified Customer Reviews — Love &amp; Co. Atelier</title>
        <meta
          name="description"
          content="Read authentic, verified buyer reviews for Love & Co. cold-saponified cleansing bars, barrier lip elixirs, and clinical skincare formulations."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Customer Testimonials
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Verified Atelier Reviews
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Real results and product experiences shared by verified Love &amp; Co. patrons.
            </p>
          </div>

          {/* Rating Summary Bar */}
          <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-brand-silver pb-4 md:pb-0 md:pr-6 space-y-2">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <span className="font-serifLuxury text-5xl text-brand-mocha-900 font-bold">4.9</span>
                <div className="space-y-1">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[11px] font-monoClinical text-stone-500">Based on 630+ Reviews</p>
                </div>
              </div>
              <p className="text-xs text-brand-mocha-900/70 font-sans">
                98.4% of customers recommend our cold-saponified products for sensitive and barrier-compromised skin.
              </p>
            </div>

            <div className="md:col-span-8 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 text-xs font-monoClinical text-brand-mocha-900/80">
                <div className="flex items-center space-x-2">
                  <span className="w-16">5 Stars</span>
                  <div className="w-36 sm:w-48 h-2 bg-[#FAF9F8] border border-brand-silver rounded-full overflow-hidden">
                    <div className="w-[94%] h-full bg-brand-mocha rounded-full" />
                  </div>
                  <span className="text-stone-400 text-[10px]">94%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-16">4 Stars</span>
                  <div className="w-36 sm:w-48 h-2 bg-[#FAF9F8] border border-brand-silver rounded-full overflow-hidden">
                    <div className="w-[5%] h-full bg-brand-mocha rounded-full" />
                  </div>
                  <span className="text-stone-400 text-[10px]">5%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-16">3 Stars</span>
                  <div className="w-36 sm:w-48 h-2 bg-[#FAF9F8] border border-brand-silver rounded-full overflow-hidden">
                    <div className="w-[1%] h-full bg-brand-mocha rounded-full" />
                  </div>
                  <span className="text-stone-400 text-[10px]">1%</span>
                </div>
              </div>

              <div className="w-full sm:w-auto text-center sm:text-right">
                <Link
                  href="/catalog"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-monoClinical font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-monoClinical uppercase tracking-wider text-brand-mocha font-bold shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-monoClinical transition-all cursor-pointer whitespace-nowrap ${
                  selectedCat === cat
                    ? 'bg-brand-mocha text-white shadow-xs font-bold'
                    : 'bg-white border border-brand-silver text-brand-mocha-900 hover:bg-[#E6E0F0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((rev) => {
              const isHelpful = helpfulMap[rev.id];
              return (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-7 shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: User & Verified Badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-serifLuxury text-base text-brand-mocha-900 font-medium">
                            {rev.name}
                          </h3>
                          {rev.verified && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-monoClinical font-bold">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-monoClinical text-stone-400">
                          {rev.location} • {rev.date}
                        </p>
                      </div>

                      {/* Stars */}
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Product Pill */}
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-[#FAF9F8] border border-brand-silver text-[11px] font-monoClinical text-brand-mocha font-semibold">
                      {rev.product}
                    </span>

                    {/* Headline & Comment */}
                    <div className="space-y-1.5">
                      <h4 className="font-serifLuxury text-sm sm:text-base text-brand-mocha-900 font-semibold leading-snug">
                        &ldquo;{rev.title}&rdquo;
                      </h4>
                      <p className="text-xs sm:text-[13px] text-brand-mocha-900/80 font-sans leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  </div>

                  {/* Helpful Button */}
                  <div className="pt-3 border-t border-brand-silver/50 flex items-center justify-between text-xs font-monoClinical">
                    <span className="text-stone-400 text-[11px]">
                      {rev.helpfulCount + (isHelpful ? 1 : 0)} found this helpful
                    </span>
                    <button
                      type="button"
                      onClick={() => handleHelpful(rev.id)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isHelpful
                          ? 'bg-[#E6E0F0] border-brand-mocha text-brand-mocha font-bold'
                          : 'bg-white border-brand-silver text-stone-500 hover:text-brand-mocha hover:border-brand-mocha/40'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{isHelpful ? 'Helpful ✓' : 'Helpful'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs font-monoClinical font-bold uppercase tracking-wider text-brand-mocha hover:underline">
              &larr; Return to Atelier Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

