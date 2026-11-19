import React, { useState } from 'react';
import { Plus, Minus, Check, MapPin, Tag, Gift, Coins, Quote, Heart, Share2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import ProductAccordions from './ProductAccordions';
import GoesWellWithWidget from './GoesWellWithWidget';

export default function ProductPurchasePanel({ product }) {
  const addItem = useCartStore((state) => state.addItem);
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistIds = useWishlistStore((state) => state.wishlistIds);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const prodKey = String(product?._id || product?.id || product?.slug || '');
  const isSaved =
    (wishlistIds || []).includes(String(product?._id || '')) ||
    (wishlistIds || []).includes(String(product?.id || '')) ||
    (wishlistItems || []).some(
      (item) =>
        String(item._id) === prodKey ||
        String(item.id) === prodKey ||
        item.slug === product?.slug
    );
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareProduct = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: `${product.name} | LOVE & Co.`,
      text: `Check out ${product.name} at LOVE & Co.:`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      }
    } catch (err) {}

    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {}
    }

    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Variants configuration directly from product data
  const activeVariants = product.variants && product.variants.length > 0
    ? product.variants.map((v) => ({
        size: v.size,
        price: v.price,
        compareAtPrice: v.mrp || v.compareAtPrice || Math.round(v.price * 1.2),
        inStock: v.inStock !== false,
      }))
    : [
        {
          size: product.volumeWeight ? product.volumeWeight.replace(/ cured.*$/, '') : '100g',
          price: product.price,
          compareAtPrice: product.compareAtPrice || Math.round(product.price * 1.25),
        },
      ];

  const [selectedVariant, setSelectedVariant] = useState(activeVariants[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const currentStock = product.stock !== undefined ? product.stock : (product.stockQty !== undefined ? product.stockQty : 50);
  const isSoldOut = currentStock === 0 || product.status === 'OUT_OF_STOCK';

  React.useEffect(() => {
    if (activeVariants && activeVariants.length > 0) {
      setSelectedVariant(activeVariants[0]);
    }
  }, [product.slug]);

  // Delivery pincode checker state
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);

  const discountPercentage = Math.round(
    (((selectedVariant.compareAtPrice || product.compareAtPrice) - selectedVariant.price) /
      (selectedVariant.compareAtPrice || product.compareAtPrice)) * 100
  ) || 18;

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length < 6) {
      setPincodeStatus({ valid: false, message: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }
    // Calculate realistic delivery date (tomorrow or next day)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    const dateStr = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    setPincodeStatus({
      valid: true,
      message: `Delivery by ${dateStr} • Free shipping on orders over ₹500`,
    });
  };

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const scrollToReviews = () => {
    const el = document.getElementById('customer-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Title & Sub-Active Line */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-luxury font-normal tracking-tight text-[#1C1614] leading-snug">
          {product.name}
        </h1>
        <div className="text-[11px] font-monoClinical font-medium uppercase tracking-[0.2em] text-[#6E6259] mt-1.5">
          {product.category?.replace(/-/g, ' ')} • {product.activesConcentration || '100% PURE PLANT ACTIVES'}
        </div>
        {product.tagline && (
          <p className="text-sm sm:text-[15px] font-serif-luxury italic text-[#3A302A] mt-1.5">
            {product.tagline}
          </p>
        )}
        <p className="text-xs font-monoClinical uppercase tracking-[0.16em] text-[#6E6259] mt-1.5">
          BROAD SPECTRUM CELLULAR NOURISHMENT | 100% BIOCOMPATIBLE
        </p>
      </div>

      {/* Rating Snippet (Interactive Anchor) */}
      <button
        type="button"
        onClick={scrollToReviews}
        className="inline-flex items-center space-x-3 text-base sm:text-lg font-medium text-[#1C1614] hover:text-[#3A302A] transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-1.5">
          <span className="text-[#C59B27] fill-[#C59B27] text-xl sm:text-2xl leading-none">★</span>
          <span className="font-bold text-[#1C1614] text-base sm:text-lg font-monoClinical tracking-tight">
            {product.ratings?.average || 4.9} / 5
          </span>
        </div>
        <span className="text-[#C5A880] text-base sm:text-lg">•</span>
        <span className="underline underline-offset-4 text-[#6E6259] hover:text-[#1C1614] text-xs sm:text-sm font-sans">
          ({(product.ratings?.count || 2141).toLocaleString()} Verified Rituals)
        </span>
      </button>

      {/* Attribute Badges (Row of Pills in Signature Botanical Lavender) */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <span className="bg-[#F4F1FA] text-[#4A3B66] border border-[#E6E0F0] font-monoClinical font-semibold px-3 py-1 rounded-full text-[11px] tracking-wider uppercase">
          {product.isFragranceFree ? '✓ Fragrance-Free' : '✓ Pure Essential Oil'}
        </span>
        <span className="bg-[#F4F1FA] text-[#4A3B66] border border-[#E6E0F0] font-monoClinical font-semibold px-3 py-1 rounded-full text-[11px] tracking-wider uppercase">
          ✓ Non-Comedogenic
        </span>
        <span className="bg-[#F4F1FA] text-[#4A3B66] border border-[#E6E0F0] font-monoClinical font-semibold px-3 py-1 rounded-full text-[11px] tracking-wider uppercase">
          ✓ Cold-Pressed &lt; 35°C
        </span>
        {product.productDetails?.scentProfile && (
          <span className="bg-[#F4F1FA] text-[#4A3B66] border border-[#E6E0F0] font-monoClinical font-semibold px-3 py-1 rounded-full text-[11px] tracking-wider uppercase">
            Scent: {product.productDetails.scentProfile}
          </span>
        )}
        <span className="bg-[#F4F1FA] text-[#4A3B66] border border-[#E6E0F0] font-monoClinical font-semibold px-3 py-1 rounded-full text-[11px] tracking-wider uppercase">
          ✓ pH {product.productDetails?.phLevel || product.phLevel || '8.0 - 8.5'}
        </span>
      </div>

      {/* Choose Variants / Sizes */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-[#1C1614] uppercase tracking-wider font-monoClinical text-[11px]">
            CHOOSE VARIANTS &rarr; <span className="font-normal text-[#6E6259]">Select Size</span>
          </span>
          <span className="text-[#6E6259] font-monoClinical text-[11px]">
            Selected: <strong className="text-[#1C1614]">{selectedVariant?.size}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeVariants.map((variant) => {
            const isSelected = selectedVariant?.size === variant.size;
            return (
              <button
                key={variant.size}
                type="button"
                onClick={() => setSelectedVariant(variant)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border font-monoClinical cursor-pointer rounded-xs ${
                  isSelected
                    ? 'bg-[#1C1614] text-[#FAF8F5] border-[#1C1614] shadow-xs'
                    : 'bg-white text-[#1C1614] border-[#E5DFD7] hover:border-[#1C1614]/50'
                }`}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Matrix */}
      <div className="flex items-baseline space-x-3 pt-1">
        <span className="text-2xl sm:text-3xl font-serif-luxury font-normal tracking-tight text-[#1C1614]">
          ₹{selectedVariant.price}
        </span>
        {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
          <span className="text-sm font-medium font-monoClinical text-[#8C827A] line-through">
            MRP ₹{selectedVariant.compareAtPrice}
          </span>
        )}
        <span className="bg-[#E6E0F0] text-[#4A3B66] font-semibold px-2.5 py-0.5 rounded border border-[#D7CEE8] text-[11px] font-monoClinical uppercase tracking-wider">
          {discountPercentage}% OFF
        </span>
        <span className="text-[11px] text-[#8C827A] font-sans">
          (Inc. of all taxes)
        </span>
      </div>

      {/* Sold Out Luxury Indicator */}
      {isSoldOut && (
        <div className="p-3 bg-[#F3EFEA] border border-[#E5DFD7] rounded-md flex items-center justify-between text-xs font-monoClinical">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#1C1614] animate-pulse" />
            <span className="font-semibold text-[#1C1614] uppercase tracking-wider">
              Sold Out / Restocking Soon
            </span>
          </div>
          <span className="text-[10px] text-[#1C1614] uppercase tracking-wider bg-white px-2 py-0.5 rounded font-semibold border border-[#E5DFD7]">
            Small Batch Curing
          </span>
        </div>
      )}

      {/* Quantity Stepper & Primary CTA Button */}
      <div className="flex space-x-3 pt-1">
        {/* Quantity Stepper */}
        <div className={`flex items-center border border-[#E5DFD7] bg-white rounded-sm ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-11 flex items-center justify-center text-[#1C1614] hover:text-[#3A302A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Decrease quantity"
            disabled={isSoldOut}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-9 text-center font-bold font-monoClinical text-xs text-[#1C1614] select-none">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-11 flex items-center justify-center text-[#1C1614] hover:text-[#3A302A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Increase quantity"
            disabled={isSoldOut}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary CTA Button */}
        {isSoldOut ? (
          <button
            type="button"
            disabled
            className="flex-1 h-11 px-6 text-xs font-monoClinical font-bold uppercase tracking-widest text-[#8C827A] bg-[#F3EFEA] border border-[#E5DFD7] flex items-center justify-center space-x-2 rounded-sm cursor-not-allowed select-none"
          >
            <span>SOLD OUT — RESTOCKING SOON</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 h-11 px-6 text-xs font-monoClinical font-bold uppercase tracking-widest text-[#FAF8F5] transition-all flex items-center justify-center space-x-2 shadow-xs rounded-sm cursor-pointer py-3.5 ${
              added
                ? 'bg-[#2A211D]'
                : 'bg-[#1C1614] hover:bg-[#2A211D] active:scale-[0.99]'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 text-[#C5A880]" />
                <span>ADDED TO CART</span>
              </>
            ) : (
              <span>ADD TO CART</span>
            )}
          </button>
        )}

        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={() => toggleItem(product)}
          aria-label={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
          title={isSaved ? 'Remove from Wishlist' : 'Save to Wishlist'}
          className={`h-11 px-4 border rounded-sm transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
            isSaved
              ? 'bg-red-50 text-red-500 border-red-200 ring-1 ring-red-200'
              : 'border-[#E5DFD7] bg-white text-[#8C827A] hover:text-red-500 hover:border-red-200 hover:bg-red-50/40'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${
              isSaved ? 'fill-red-500 text-red-500' : ''
            }`}
          />
        </button>

        {/* Product Share Button */}
        <button
          type="button"
          onClick={handleShareProduct}
          aria-label={copiedShare ? 'Link Copied!' : 'Share Product'}
          title={copiedShare ? 'Link Copied!' : 'Share Product'}
          className={`h-11 px-4 border rounded-sm transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
            copiedShare
              ? 'bg-[#F3EFEA] text-[#1C1614] border-[#C5A880] font-semibold text-xs'
              : 'border-[#E5DFD7] bg-white text-[#1C1614] hover:border-[#1C1614]/40'
          }`}
        >
          {copiedShare ? (
            <div className="flex items-center space-x-1 text-[#1C1614]">
              <Check className="w-4 h-4 text-[#C5A880]" />
              <span className="text-[11px] font-monoClinical">Copied</span>
            </div>
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Promotional Offers Strip */}
      <div className="space-y-1.5 pt-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-[#1C1614] flex items-center space-x-1 font-monoClinical">
          <Tag className="w-3 h-3 text-[#C5A880]" />
          <span>Available Offers &amp; Promotions</span>
        </span>
        <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex-shrink-0 p-3 bg-white/90 border border-dashed border-[#E5DFD7] text-xs max-w-xs space-y-1 rounded-sm shadow-2xs">
            <span className="font-bold text-[#1C1614] uppercase tracking-wider text-[11px] bg-[#F3EFEA] px-2 py-0.5 border border-[#E5DFD7] font-monoClinical rounded-xs inline-block">
              🏷️ AT10
            </span>
            <p className="text-[#6E6259] text-[11px] font-sans">
              Get Additional 10% Off on orders above ₹1,599
            </p>
          </div>
          <div className="flex-shrink-0 p-3 bg-white/90 border border-dashed border-[#E5DFD7] text-xs max-w-xs space-y-1 rounded-sm shadow-2xs">
            <span className="font-bold text-[#1C1614] uppercase tracking-wider text-[11px] bg-[#F3EFEA] px-2 py-0.5 border border-[#E5DFD7] font-monoClinical rounded-xs inline-block">
              🎁 B2G3FREE
            </span>
            <p className="text-[#6E6259] text-[11px] font-sans">
              Buy 2, Get the 3rd complimentary product FREE
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof Quote Card */}
      <div className="bg-[#F3EFEA] border-l-2 border-[#1C1614] text-[#3A302A] p-3.5 text-xs sm:text-sm italic flex items-start space-x-2.5 rounded-r-sm">
        <Quote className="w-4 h-4 text-[#C5A880] flex-shrink-0 mt-0.5 not-italic" />
        <div>
          <span>"This restored my moisture barrier within a single week without leaving any greasy residue."</span>
          <span className="block not-italic font-semibold text-[#1C1614] mt-1 text-[11px] font-monoClinical uppercase tracking-wider">
            — Rhea S., Verified Dermatological Patient
          </span>
        </div>
      </div>

      {/* Loyalty / Love Loyalty Points Banner in Signature Botanical Lavender */}
      <div className="flex items-center space-x-2.5 bg-[#F4F1FA] border border-[#E6E0F0] text-[#4A3B66] px-4 py-2.5 rounded-sm font-medium text-xs shadow-2xs">
        <Coins className="w-4 h-4 text-[#8D7BBA] flex-shrink-0" />
        <span className="font-sans font-medium">Earn Love Loyalty Points on every order.</span>
      </div>

      {/* Delivery Pincode Checker */}
      <div className="space-y-1.5 pt-2">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-[#1C1614] flex items-center space-x-1 font-monoClinical">
          <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>Check Delivery Estimates &amp; COD Availability</span>
        </label>
        <form onSubmit={handleCheckPincode} className="flex">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter your 6-digit PIN code"
            className="flex-1 px-3 py-2 bg-white border border-[#E5DFD7] text-xs font-monoClinical text-[#1C1614] focus:outline-none focus:border-[#1C1614]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1C1614] text-[#FAF8F5] text-xs font-monoClinical font-bold uppercase tracking-wider hover:bg-[#2A211D] transition-colors cursor-pointer"
          >
            Check
          </button>
        </form>
        {pincodeStatus && (
          <p
            className={`text-xs font-medium pt-1 ${
              pincodeStatus.valid ? 'text-[#1C1614]' : 'text-red-600'
            }`}
          >
            {pincodeStatus.message}
          </p>
        )}
      </div>

      {/* Specifications Accordions Component */}
      <ProductAccordions product={product} />

      {/* Complementary "Goes Well With" Widget */}
      <GoesWellWithWidget currentProduct={product} />
    </div>
  );
}
