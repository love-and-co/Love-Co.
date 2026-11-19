import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function ProductFaqSection({ product }) {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'What are the product specifications & regulatory details?',
      a: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 sm:p-5 bg-white border border-[#D7CEE8] rounded-xl text-xs font-monoClinical text-[#3A302A] shadow-2xs">
            <div>
              <strong className="text-[#1C1614] font-semibold">Net Weight:</strong>{' '}
              {product?.volumeWeight || '100g bar'}
            </div>
            <div>
              <strong className="text-[#1C1614] font-semibold">Shelf Life:</strong> 24 Months from manufacturing
            </div>
            <div>
              <strong className="text-[#1C1614] font-semibold">Physical Dimensions:</strong> 7.5cm × 5.0cm × 2.8cm
            </div>
            <div>
              <strong className="text-[#1C1614] font-semibold">Active Batch ID:</strong>{' '}
              {product?.batchNumber || 'LOT-CP-2026-BLS02'}
            </div>
            <div>
              <strong className="text-[#1C1614] font-semibold">Cruelty-Free Status:</strong> 100% Leaping Bunny Certified
            </div>
            <div>
              <strong className="text-[#1C1614] font-semibold">Country of Origin:</strong> India (Ethically wildcrafted botanicals)
            </div>
          </div>
          <p className="text-[11px] text-[#8C827A] font-sans pt-1">
            Manufactured in GMP-certified laboratory by Love &amp; Co. Botanicals Pvt. Ltd. Zero animal testing, zero synthetic chemical bleaches.
          </p>
        </div>
      ),
    },
    {
      q: 'Does this product leave any greasy residue or film after washing?',
      a: (
        <p className="text-sm font-sans text-[#3A302A] leading-relaxed bg-white p-4 sm:p-5 rounded-xl border border-[#D7CEE8] shadow-2xs">
          No. Because our cold-pressed saponification process converts triglycerides into natural micellar salts and pure glycerol, the lather rinses completely clean with water. You retain essential cellular barrier lipids without any oily or occlusive coating.
        </p>
      ),
    },
    {
      q: 'Is this formula safe for ultra-sensitive, barrier-compromised, or eczema-prone skin?',
      a: (
        <p className="text-sm font-sans text-[#3A302A] leading-relaxed bg-white p-4 sm:p-5 rounded-xl border border-[#D7CEE8] shadow-2xs">
          Yes. The formula is specifically engineered to respect the physiological acid mantle at pH 5.5 - 6.0. It is completely free from added essential oils, masking fragrances, drying sulfates (SLS/SLES), and parabens. However, if you have known nut or plant allergies, always review the full INCI ledger.
        </p>
      ),
    },
    {
      q: 'Can pregnant or nursing mothers safely use this product?',
      a: (
        <p className="text-sm font-sans text-[#3A302A] leading-relaxed bg-white p-4 sm:p-5 rounded-xl border border-[#D7CEE8] shadow-2xs">
          Yes. All Love &amp; Co. cold-pressed lipid products are free of synthetic retinoids, hydroquinone, chemical phthalates, and high-percentage salicylic acid. They are deemed safe for pregnancy and postpartum skin replenishment.
        </p>
      ),
    },
  ];

  const toggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="py-14 sm:py-20 border-t border-[#D7CEE8] bg-[#F2EDF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 space-y-1.5">
          <span className="text-[11px] font-monoClinical uppercase tracking-[0.2em] text-[#4A3B66] font-semibold block">
            Product Inquiries &bull; Safety Ledger
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif-luxury font-normal tracking-tight text-[#1C1614]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="border-t border-b border-[#D7CEE8] divide-y divide-[#D7CEE8]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4 sm:py-5">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex justify-between items-center text-left group cursor-pointer"
                >
                  <span className="font-serif-luxury text-base sm:text-lg text-[#1C1614] group-hover:text-[#4A3B66] font-medium transition-colors pr-4 leading-snug">
                    {faq.q}
                  </span>
                  <span className="p-1 text-[#8D7BBA] group-hover:text-[#4A3B66] transition-colors shrink-0">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-3.5 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
