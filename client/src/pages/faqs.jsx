import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Search, ChevronDown, ChevronUp, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Formulation & Ingredients',
    items: [
      {
        q: 'What is cold-saponified soap and how is it different from normal soap?',
        a: 'Cold-saponification is a traditional, small-batch artisanal process where plant oils (shea butter, virgin coconut, squalane) are combined with an alkali at low temperatures. Unlike commercial soaps which extract glycerin and use synthetic detergents (SLS/SLES), our bars undergo a 6-week slow cure that retains 100% natural moisturizing glycerin within the bar.'
      },
      {
        q: 'Are Love & Co. products free from sulfates, parabens, and synthetic perfumes?',
        a: 'Yes, completely. Every formulation is 100% free from sulfates, parabens, phthalates, synthetic foaming syndets, artificial dyes, and phthalate-laden synthetic perfumes. Our aromas derive purely from cold-pressed botanical seeds and pure essential plant extracts.'
      },
      {
        q: 'Can I use the cold-saponified cleansing bars on my face?',
        a: 'Absolutely. Formulations such as LOVE & Co. BLOOM (Neem & Turmeric) and LOVE & Co. BLUSH (Rose Petal & French Pink Clay) are specifically crafted for gentle facial and body cleansing with biocompatible lipid buffering to prevent tightness.'
      },
    ]
  },
  {
    category: 'Orders, Shipping & Delivery',
    items: [
      {
        q: 'How long does domestic shipping take across India?',
        a: 'Orders are dispatched within 24 hours from our Bengaluru atelier. Delivery to metro cities typically takes 24–48 hours, while other locations arrive within 4–7 days via express air couriers (Bluedart, Delhivery, DTDC).'
      },
      {
        q: 'What is the threshold for free shipping?',
        a: 'We offer Free Domestic Express Shipping on all orders of ₹500 or more. For orders below ₹500, a standard nominal shipping fee of ₹49 is applied at checkout.'
      },
      {
        q: 'How do I track my order once placed?',
        a: 'Once your order is registered, you will receive an SMS and WhatsApp tracking link. You can also visit our Track Order page (/orders/track) anytime and enter your order number or phone number for real-time dispatch updates.'
      },
    ]
  },
  {
    category: 'Skin Suitability & Diagnostics',
    items: [
      {
        q: 'How do I know which formulation is best for my skin type?',
        a: 'You can tap the AI Copilot widget on the bottom right to consult with Sam, our clinical AI skincare expert. Sam will analyze your sebum profile, current concerns (such as acne, barrier dryness, or pigmentation), and recommend a curated personalized regimen.'
      },
      {
        q: 'Are your products safe for acne-prone and sensitive skin?',
        a: 'Yes. Our formulas are non-comedogenic and formulated to respect the physiological acid mantle at pH 5.5–6.0. However, if you have specific nut allergies, please review the complete INCI ingredient ledger and perform a 24-hour patch test.'
      },
      {
        q: 'What is the 30-Day Biocompatibility Assurance guarantee?',
        a: 'If any active formulation from Love & Co. causes adverse skin irritation or sensitivity within 30 days of receipt, our customer care team will offer a replacement or direct reformulation assistance without hassle.'
      },
    ]
  },
  {
    category: 'Payments & Returns',
    items: [
      {
        q: 'Which payment methods are accepted at checkout?',
        a: 'We support all major payment providers including Instant UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), NetBanking, and Cash on Delivery (COD).'
      },
      {
        q: 'Can I cancel or modify my order after payment?',
        a: 'Orders can be cancelled or modified within 2 hours of placement before our laboratory seals the small-batch package for courier dispatch. Contact loveandcosupport@gmail.com or message us on WhatsApp support for immediate assistance.'
      },
    ]
  }
];

export default function FaqsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    const q = searchQuery.toLowerCase();
    return FAQ_DATA.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
      )
    })).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  return (
    <>
      <Head>
        <title>Frequently Asked Questions — Love &amp; Co. Atelier</title>
        <meta
          name="description"
          content="Find answers to common questions about Love & Co. cold-pressed soaps, clinical botanicals, shipping timelines, order tracking, and returns."
        />
      </Head>

      <div className="min-h-screen bg-[#FAF9F8] text-brand-mocha-900 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 pb-8 border-b-2 border-brand-silver">
            <span className="inline-block px-3.5 py-1 bg-brand-mocha text-white text-[10px] font-monoClinical font-bold uppercase tracking-widest rounded-full">
              Customer Support
            </span>
            <h1 className="font-serifLuxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans max-w-xl mx-auto">
              Everything you need to know about our cold-saponified craft, shipping, and skincare safety.
            </p>

            {/* Live Search Bar */}
            <div className="pt-4 max-w-md mx-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search questions (e.g. shipping, facial use, acne)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-brand-silver rounded-2xl text-xs sm:text-sm font-sans text-brand-mocha-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-mocha shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Categorized Accordion */}
          <div className="space-y-8">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-brand-silver p-8">
                <HelpCircle className="w-10 h-10 text-brand-mocha/40 mx-auto mb-3" />
                <h3 className="font-serifLuxury text-lg text-brand-mocha-900 mb-1">No matching questions found</h3>
                <p className="text-xs text-brand-mocha-900/60 font-sans mb-4">
                  Have a specific question about an ingredient or your routine?
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 bg-brand-mocha text-white rounded-xl text-xs font-monoClinical font-bold uppercase tracking-wider"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredFaqs.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-3">
                  <h2 className="text-xs font-monoClinical uppercase tracking-wider text-brand-mocha font-bold pl-1">
                    {cat.category}
                  </h2>
                  <div className="space-y-2.5">
                    {cat.items.map((item, iIdx) => {
                      const key = `${cIdx}-${iIdx}`;
                      const isOpen = openItems[key];
                      return (
                        <div
                          key={iIdx}
                          className="bg-white rounded-2xl border-2 border-brand-silver overflow-hidden shadow-2xs transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(key)}
                            className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF9F8] transition-colors"
                          >
                            <span className="font-serifLuxury text-sm sm:text-base text-brand-mocha-900 font-medium">
                              {item.q}
                            </span>
                            <span className="p-1 rounded-full bg-[#E6E0F0] text-brand-mocha shrink-0">
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5 pt-1 text-xs sm:text-sm font-sans text-brand-mocha-900/80 leading-relaxed border-t border-brand-silver/50 animate-fadeIn">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Need More Assistance Banner */}
          <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <h3 className="font-serifLuxury text-xl text-brand-mocha-900">
              Still have a question?
            </h3>
            <p className="text-xs text-brand-mocha-900/70 font-sans max-w-md mx-auto">
              Our clinical skincare advisors and concierge support team are available on WhatsApp and email.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <a
                href="https://wa.me/919440607778"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-monoClinical font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                WhatsApp Advisor
              </a>
              <a
                href="mailto:loveandcosupport@gmail.com"
                className="px-6 py-2.5 bg-[#E6E0F0] hover:bg-[#DDD2F0] text-brand-mocha-900 border border-brand-silver rounded-xl text-xs font-monoClinical font-bold uppercase tracking-wider transition-all"
              >
                Email Support
              </a>
            </div>
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

