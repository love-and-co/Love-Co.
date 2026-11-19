import React, { useState } from 'react';
import { Plus, Minus, ShieldCheck, Info } from 'lucide-react';

export default function IngredientsDeepDive({ product }) {
  const [openActives, setOpenActives] = useState({ 0: true });
  const [openInci, setOpenInci] = useState(false);

  const toggleActive = (idx) => {
    setOpenActives((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const keyIngredients =
    product.keyIngredientsDetail && product.keyIngredientsDetail.length > 0
      ? product.keyIngredientsDetail
      : (product.keyActives || []).map((ka) => ({
          name: ka.name,
          role: ka.purpose || ka.percentage,
        }));

  const inciList =
    product.inciIngredients && product.inciIngredients.length > 0
      ? product.inciIngredients
      : [];

  return (
    <section className="py-14 sm:py-20 border-t border-[#E5DFD7] bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 space-y-1.5">
          <span className="text-[11px] font-monoClinical uppercase tracking-[0.2em] text-[#6E6259] font-medium block">
            100% Active Disclosure &bull; Zero Hidden Excipients
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif-luxury font-normal tracking-tight text-[#1C1614]">
            Ingredients Deep Dive
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6259] font-sans max-w-xl mx-auto pt-1 leading-relaxed">
            Every active compound and plant lipid in {product.name} is formulated at uncompromising concentrations with full biocompatibility.
          </p>
        </div>

        {/* Expandable Key Actives */}
        <div className="border-t border-b border-[#E5DFD7] divide-y divide-[#E5DFD7]">
          {keyIngredients.map((item, idx) => (
            <div key={idx} className="py-4 sm:py-5">
              <button
                type="button"
                onClick={() => toggleActive(idx)}
                className="w-full flex justify-between items-center text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-[#C5A880] shrink-0" />
                  <span className="font-serif-luxury text-base sm:text-lg text-[#1C1614] group-hover:text-brand-mocha font-medium transition-colors">
                    {item.name}
                  </span>
                </div>
                <span className="p-1 text-[#6E6259] group-hover:text-[#1C1614] transition-colors shrink-0">
                  {openActives[idx] ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>

              {openActives[idx] && (
                <div className="mt-3.5 pl-5 sm:pl-6 animate-fadeIn">
                  <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl text-[#3A302A] shadow-2xs space-y-1.5">
                    <span className="font-monoClinical tracking-wider text-[10.5px] uppercase text-[#6E6259] font-bold block">
                      Clinical Role &amp; Mechanism
                    </span>
                    <p className="font-sans text-xs sm:text-sm text-[#3A302A] leading-relaxed">
                      {item.role}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Full INCI Transparency Accordion */}
          <div className="py-4 sm:py-5">
            <button
              type="button"
              onClick={() => setOpenInci(!openInci)}
              className="w-full flex justify-between items-center text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span className="font-serif-luxury text-base sm:text-lg text-[#1C1614] group-hover:text-[#3A302A] font-medium transition-colors">
                  Full Ingredient Transparency (Complete INCI Ledger)
                </span>
              </div>
              <span className="p-1 text-[#6E6259] group-hover:text-[#1C1614] transition-colors shrink-0">
                {openInci ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </span>
            </button>

            {openInci && (
              <div className="mt-4 space-y-4 animate-fadeIn">
                <p className="text-xs sm:text-[13px] text-[#6E6259] font-sans leading-relaxed">
                  We believe in 100% radical transparency. Below is the comprehensive declared listing of every botanical and bio-lipid compound present in this formulation:
                </p>

                <div className="overflow-x-auto border border-[#E5DFD7] rounded-xl shadow-2xs bg-[#FAF8F5]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3EFEA] border-b border-[#E5DFD7] text-[#1C1614] font-semibold font-monoClinical text-[10.5px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-16">Item</th>
                        <th className="py-3 px-4">INCI Ingredient Name</th>
                        <th className="py-3 px-4 text-right sm:text-left">Standard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DFD7]">
                      {inciList.map((ingredient, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="py-3 px-4 font-monoClinical text-[#8C827A]">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#1C1614] font-sans">
                            {ingredient}
                          </td>
                          <td className="py-3 px-4 text-[#6E6259] font-monoClinical text-[11px] text-right sm:text-left">
                            100% Biocompatible
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 sm:p-4 bg-[#F3EFEA] border border-[#E5DFD7] rounded-xl flex items-center space-x-2.5 text-xs text-[#3A302A] font-sans">
                  <Info className="w-4 h-4 text-[#1C1614] shrink-0" />
                  <span>
                    Formulated without synthetic detergents, synthetic foaming agents, sulfates (SLS/SLES), parabens, phthalates, or micro-plastics.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
