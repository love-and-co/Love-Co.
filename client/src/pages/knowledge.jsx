import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { BookOpen, Sparkles, Droplets, Leaf, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ARTICLES = [
  {
    id: 'cold-saponification-vs-syndet',
    tag: 'Soap Chemistry',
    title: 'The Truth About Cold-Saponified Cleansing Bars vs. Commercial Syndet Detergent Bars',
    readTime: '4 min read',
    summary: 'Commercial "beauty bars" and syndet detergents strip the acid mantle with synthetic surfactants like SLS. Explore how genuine cold-saponification retains 100% plant glycerin to respect the epidermal barrier.',
    content: `Most commercial drugstore cleansing bars are not technically soap at all; they are synthetic detergent ("syndet") blocks bound with plasticizers, artificial foamers (SLS/SLES), and petrochemical hardeners.

In contrast, Love & Co.'s authentic cold-saponified bars are crafted through a meticulous, low-temperature lipid-alkali reaction. Virgin cold-pressed coconut oil, raw shea butter, and organic olive lipids saponify slowly, naturally producing unadulterated plant glycerin. 

Rather than extracting this prized humectant to sell separately, our 6-week slow cure keeps the glycerin intact within the bar matrix, yielding a soft, biocompatible micro-lather that cleanses impurities without disrupting the skin's physiological moisture barrier.`,
  },
  {
    id: 'squalane-nilotica-lipids',
    tag: 'Barrier Repair',
    title: 'Biocompatible Lipids: The Molecular Affinity of Squalane & Ugandan Nilotica Shea',
    readTime: '5 min read',
    summary: 'Why ordinary petroleum jelly seals without nourishing, while cold-pressed plant squalane and Nilotica shea olein penetrate deep into the intercellular stratum corneum.',
    content: `Human skin naturally produces squalene in its sebum, but endogenous synthesis drops sharply after age 25. Plant-derived squalane acts as a biomimetic skin twin: its branched hydrocarbon structure slips past intercellular gaps to deliver deep barrier replenishment.

Paired with Ugandan Nilotica Shea Butter—which possesses an exceptionally high concentration of therapeutic oleic fatty acids compared to standard West African shea—it softens chapped lips, calms dry micro-cracks, and restores lipid balance without synthetic mineral oil occlusion.`,
  },
  {
    id: 'curcumin-neem-botanicals',
    tag: 'Clinical Botanicals',
    title: 'Curcuminoids & Azadirachtin: Ancient Ayurvedic Botanicals Backed by Modern Dermatology',
    readTime: '3 min read',
    summary: 'How standardized turmeric curcumin and cold-pressed neem seed oil work in synergy to regulate oil production and calm stubborn breakout inflammation.',
    content: `Turmeric is celebrated for its bioactive curcuminoids, which downregulate pro-inflammatory cytokines that trigger redness and acne breakouts. 

When paired with raw cold-pressed Neem seed oil (rich in azadirachtin and fatty linoleic acids), it delivers a potent, non-drying antimicrobial action that purifies congested pores, evens skin tone, and clears blemishes while keeping the protective skin flora intact.`,
  },
];

export default function KnowledgePage() {
  const [selectedArticle, setSelectedArticle] = useState(ARTICLES[0]);

  return (
    <>
      <Head>
        <title>Botanical Knowledge Ledger — Love &amp; Co. Atelier</title>
        <meta
          name="description"
          content="Explore the scientific knowledge ledger behind cold-saponified soaps, stratum corneum lipid matrices, and active botanical skincare formulations."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Botanical Science
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              The Botanical Knowledge Ledger
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Clinical whitepapers, cold-saponification chemistry, and active ingredient formulation principles.
            </p>
          </div>

          {/* Featured Reading Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Nav List */}
            <div className="lg:col-span-5 space-y-3">
              <h2 className="text-xs font-monoClinical uppercase tracking-wider text-brand-mocha font-bold mb-3">
                Research Articles
              </h2>
              {ARTICLES.map((article) => {
                const isActive = selectedArticle.id === article.id;
                return (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white border-brand-mocha shadow-sm'
                        : 'bg-[#FAF9F8] border-brand-silver hover:bg-white hover:border-brand-mocha/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-monoClinical mb-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#E6E0F0] text-brand-mocha font-bold uppercase">
                        {article.tag}
                      </span>
                      <span className="text-stone-400">{article.readTime}</span>
                    </div>
                    <h3 className="font-serifLuxury text-sm sm:text-base text-brand-mocha-900 font-medium line-clamp-2">
                      {article.title}
                    </h3>
                  </button>
                );
              })}
            </div>

            {/* Right Detailed Reader */}
            <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-10 shadow-sm space-y-6">
              <div className="border-b border-brand-silver pb-4 space-y-2">
                <span className="text-[10px] font-monoClinical uppercase tracking-widest text-brand-mocha font-bold">
                  {selectedArticle.tag} • {selectedArticle.readTime}
                </span>
                <h2 className="font-serifLuxury text-2xl sm:text-3xl text-brand-mocha-900 font-normal leading-snug">
                  {selectedArticle.title}
                </h2>
              </div>

              <div className="p-4 bg-[#E6E0F0]/50 border border-brand-silver rounded-2xl text-xs sm:text-sm font-sans italic text-brand-mocha-900 leading-relaxed">
                {selectedArticle.summary}
              </div>

              <div className="text-xs sm:text-sm font-sans leading-relaxed text-brand-mocha-900/85 whitespace-pre-line space-y-4">
                {selectedArticle.content}
              </div>

              <div className="pt-6 border-t border-brand-silver flex items-center justify-between">
                <span className="text-[11px] font-monoClinical text-stone-500">
                  Formulation Ledger v2.4
                </span>
                <Link
                  href="/catalog"
                  className="inline-flex items-center space-x-1.5 text-xs font-monoClinical font-bold text-brand-mocha hover:underline"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link href="/" className="text-xs font-monoClinical font-bold uppercase tracking-wider text-brand-mocha hover:underline">
              &larr; Return to Atelier Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

