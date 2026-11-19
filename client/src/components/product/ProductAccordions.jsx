import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function ProductAccordions({ product }) {
  const [openSections, setOpenSections] = useState({
    potent: true,
    idealFor: false,
    clinical: false,
    howToUse: false,
  });

  const toggle = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const keyActives = product?.keyIngredientsDetail && product.keyIngredientsDetail.length > 0
    ? product.keyIngredientsDetail.map((k) => ({ name: k.name, purpose: k.role }))
    : product?.keyActives || [];

  const concerns = product?.concernsHandled?.length > 0
    ? product.concernsHandled
    : ['Barrier Support', 'Acne & Blemishes', 'Dryness & Flakiness'];

  const clinicalPoints = [
    '94% observed immediate barrier relief without stinging after 14 days of botanical routine',
    '89% noted zero post-wash tightness compared to commercial surfactant syndets',
    '100% native lipid and glycerol retention with zero synthetic detergent residue',
  ];

  const usageDirections = product?.usageInstructions?.directions ||
    'Work into a gentle creamy emulsion and massage across wet skin. Rinse thoroughly with lukewarm water.';

  const routineTime = product?.usageInstructions?.routineTime
    ? product.usageInstructions.routineTime.replace('_', ' & ')
    : 'AM & PM';

  return (
    <div className="border-t border-[#E5DFD7] divide-y divide-[#E5DFD7] text-xs text-[#1C1614]">
      {/* 1. What Makes It Potent? */}
      <div className="py-3.5 sm:py-4">
        <button
          type="button"
          onClick={() => toggle('potent')}
          className="w-full flex justify-between items-center text-left font-serif-luxury text-base sm:text-lg text-[#1C1614] hover:text-[#3A302A] transition-colors cursor-pointer"
        >
          <span>What Makes It Potent?</span>
          <span className="p-0.5 text-[#C5A880]">
            {openSections.potent ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </span>
        </button>

        {openSections.potent && (
          <div className="mt-2.5 pt-1 space-y-2.5 text-[#3A302A] leading-relaxed font-sans">
            <p className="text-xs sm:text-sm">
              Cold saponification at temperatures below 35°C safeguards delicate phytochemicals, fatty acids, and naturally occurring glycerol that are otherwise scorched during high-heat commercial boiling.
            </p>
            <div className="space-y-1.5 pt-1">
              {keyActives.map((act, i) => (
                <div key={i} className="flex items-start text-xs font-monoClinical">
                  <span className="font-bold text-[#1C1614] min-w-[140px] sm:min-w-[170px]">
                    {act.name} {act.percentage ? `(${act.percentage})` : ''}:
                  </span>
                  <span className="text-[#6E6259]">{act.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Ideal For */}
      <div className="py-3.5 sm:py-4">
        <button
          type="button"
          onClick={() => toggle('idealFor')}
          className="w-full flex justify-between items-center text-left font-serif-luxury text-base sm:text-lg text-[#1C1614] hover:text-[#3A302A] transition-colors cursor-pointer"
        >
          <span>Ideal For</span>
          <span className="p-0.5 text-[#C5A880]">
            {openSections.idealFor ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </span>
        </button>

        {openSections.idealFor && (
          <div className="mt-2.5 pt-1 space-y-2 text-[#3A302A] leading-relaxed font-sans">
            <p className="text-xs sm:text-sm">Formulated specifically for compromised, reactive, and moisture-depleted skin profiles.</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {concerns.map((con, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#F4F1FA] text-[#4A3B66] text-[11px] font-monoClinical font-semibold border border-[#E6E0F0] rounded-sm"
                >
                  ✓ {con}
                </span>
              ))}
              {(product?.skinTypes || ['Dry', 'Sensitive', 'Normal']).map((st, idx) => (
                <span
                  key={`st-${idx}`}
                  className="px-2.5 py-1 bg-white text-[#6E6259] text-[11px] font-monoClinical border border-[#E5DFD7] rounded-sm"
                >
                  Skin Type: {st}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Clinical Results */}
      <div className="py-3.5 sm:py-4">
        <button
          type="button"
          onClick={() => toggle('clinical')}
          className="w-full flex justify-between items-center text-left font-serif-luxury text-base sm:text-lg text-[#1C1614] hover:text-[#3A302A] transition-colors cursor-pointer"
        >
          <span>Clinical Results</span>
          <span className="p-0.5 text-[#C5A880]">
            {openSections.clinical ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </span>
        </button>

        {openSections.clinical && (
          <div className="mt-2.5 pt-1 space-y-2 text-[#3A302A] leading-relaxed font-sans">
            <p className="text-[11px] uppercase tracking-wider text-[#6E6259] font-monoClinical font-semibold">
              30-Day Consumer Perception Study (n=48 participants)
            </p>
            <ul className="space-y-1.5 pt-1 list-disc list-inside">
              {clinicalPoints.map((pt, i) => (
                <li key={i} className="text-[#3A302A] text-xs sm:text-sm">
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4. How To Use */}
      <div className="py-3.5 sm:py-4">
        <button
          type="button"
          onClick={() => toggle('howToUse')}
          className="w-full flex justify-between items-center text-left font-serif-luxury text-base sm:text-lg text-[#1C1614] hover:text-[#3A302A] transition-colors cursor-pointer"
        >
          <span>How To Use</span>
          <span className="p-0.5 text-[#C5A880]">
            {openSections.howToUse ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </span>
        </button>

        {openSections.howToUse && (
          <div className="mt-2.5 pt-1 space-y-2 text-[#3A302A] leading-relaxed font-sans">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#1C1614] uppercase tracking-wider font-monoClinical">
              <span>Routine Step: {routineTime}</span>
            </div>
            <p className="text-xs sm:text-sm">{usageDirections}</p>
            <div className="p-3 bg-[#F4F1FA] border border-[#E6E0F0] text-[11px] text-[#4A3B66] mt-2 rounded-sm font-sans">
              <strong className="text-[#4A3B66] font-bold font-monoClinical">Patch Test Guidance:</strong> Apply lather to inside of forearm for 30 seconds and rinse. If zero erythema occurs within 24 hours, integrate safely into daily routine.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
