import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

export default function GoesWellWithWidget({ currentProduct }) {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedSize, setSelectedSize] = useState('100g');
  const [added, setAdded] = useState(false);

  // Recommended complementary pairing based on category
  const isLipCare = currentProduct?.category === 'lip-care';
  const pairing = isLipCare
    ? {
        id: 'cold-pressed-almond-squalane-cleansing-bar',
        slug: 'cold-pressed-almond-squalane-cleansing-bar',
        name: 'Sweet Almond & Olive Squalane Saponified Bar',
        subtitle: 'Cleanses without stripping essential lipids',
        price: 349,
        compareAtPrice: 420,
        image: '/images/sweet_almond_squalane_bar.jpg',
        sizes: [
          { size: '100g', price: 349 },
          { size: '125g', price: 399 },
        ],
      }
    : {
        id: 'nilotica-shea-ceramide-lip-elixir',
        slug: 'nilotica-shea-ceramide-lip-elixir',
        name: 'Nilotica Shea & 5-Ceramide Barrier Lip Elixir',
        subtitle: 'Seals moisture and prevents trans-epidermal water loss',
        price: 299,
        compareAtPrice: 350,
        image: '/images/nilotica_shea_lipbalm.jpg',
        sizes: [
          { size: '15g', price: 299 },
          { size: '30g', price: 449 },
        ],
      };

  const activeVariant = pairing.sizes.find((s) => s.size === selectedSize) || pairing.sizes[0];

  const handleAddPairing = () => {
    addItem(
      {
        id: pairing.id,
        _id: pairing.id,
        slug: pairing.slug,
        name: pairing.name,
        price: activeVariant.price,
        compareAtPrice: pairing.compareAtPrice,
        image: pairing.image,
      },
      1,
      activeVariant.size
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mt-6 p-4 sm:p-5 bg-white/90 border border-[#E5DFD7] rounded-xl shadow-2xs">
      <div className="text-[11px] font-monoClinical font-medium uppercase tracking-[0.2em] text-[#6E6259] mb-3">
        <span>Goes Well With (Complete Routine)</span>
      </div>

      <div className="flex items-center space-x-3.5">
        <Link
          href={`/product/${pairing.slug}`}
          className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF8F5] border border-[#E5DFD7] rounded-lg flex-shrink-0 overflow-hidden group"
        >
          <img
            src={pairing.image}
            alt={pairing.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/product/${pairing.slug}`}
            className="font-serif-luxury text-sm sm:text-base text-[#1C1614] hover:text-[#3A302A] line-clamp-1"
          >
            {pairing.name}
          </Link>
          <p className="text-xs text-[#6E6259] line-clamp-1 mt-0.5 font-sans">{pairing.subtitle}</p>

          <div className="flex items-center space-x-2 mt-1.5">
            <span className="font-serif-luxury text-sm sm:text-base text-[#1C1614]">₹{activeVariant.price}</span>
            {pairing.compareAtPrice && (
              <span className="text-[11px] font-monoClinical text-[#8C827A] line-through">₹{pairing.compareAtPrice}</span>
            )}
          </div>

          {/* Size Selectors & Quick Add */}
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex space-x-1">
              {pairing.sizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => setSelectedSize(s.size)}
                  className={`text-[10px] px-2 py-0.5 font-monoClinical uppercase tracking-wider border rounded-xs transition-colors cursor-pointer ${
                    selectedSize === s.size
                      ? 'bg-[#1C1614] text-[#FAF8F5] border-[#1C1614]'
                      : 'bg-[#F4F1FA] text-[#4A3B66] border-[#E6E0F0] hover:border-[#8D7BBA]'
                  }`}
                >
                  {s.size}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddPairing}
              className={`text-xs px-3.5 py-1 font-monoClinical font-semibold transition-all flex items-center space-x-1 uppercase tracking-wider rounded-xs cursor-pointer ${
                added
                  ? 'bg-[#2A211D] text-[#FAF8F5]'
                  : 'bg-[#1C1614] text-[#FAF8F5] hover:bg-[#2A211D]'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3 h-3 text-[#C5A880]" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 text-[#C5A880]" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
