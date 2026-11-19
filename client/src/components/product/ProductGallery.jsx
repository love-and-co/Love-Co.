import React, { useState } from 'react';
import { ZoomIn, ChevronLeft, ChevronRight, Share2, Check } from 'lucide-react';

export default function ProductGallery({ images = [], name = 'Product', isBestSeller = false, isNewLaunch = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const displayImages = images && images.length > 0
    ? images
    : [{ url: '/images/sweet_almond_squalane_bar.jpg', alt: name }];

  const currentImage = displayImages[activeIndex] || displayImages[0];

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleShare = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: `${name} | LOVE & Co.`,
      text: `Discover ${name} by LOVE & Co. Cold-Pressed Botanical Skincare.`,
      url: shareUrl,
    };

    // 1. Try Native Web Share API (mobile devices and supported desktop browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setCopied(true);
        setToastMessage('Shared!');
        setTimeout(() => {
          setCopied(false);
          setToastMessage('');
        }, 2500);
        return;
      } catch (err) {
        // If user cancelled native share, do nothing
        if (err.name === 'AbortError') return;
      }
    }

    // 2. Fallback: Copy URL to clipboard
    let copySuccess = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copySuccess = true;
      }
    } catch (err) {
      // Clipboard write failed (e.g. permission or insecure context)
    }

    // 3. Fallback for older/restricted browsers
    if (!copySuccess && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        copySuccess = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.error('execCommand failed', e);
      }
    }

    setCopied(true);
    setToastMessage('Link copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setToastMessage('');
    }, 2500);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4 select-none">
      {/* Main High-Resolution Image Container */}
      <div
        className="relative aspect-square w-full bg-white border border-[#E5DFD7] rounded-xl overflow-hidden cursor-crosshair group shadow-2xs"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Badges anchored top-left */}
        <div className="absolute top-3.5 left-3.5 z-20 flex flex-col gap-1.5">
          {isBestSeller && (
            <span className="bg-[#1C1614] text-[#FAF8F5] text-[10px] sm:text-[11px] font-monoClinical font-semibold px-2.5 py-1 tracking-wider uppercase rounded-xs shadow-xs">
              Best Seller
            </span>
          )}
          {isNewLaunch && (
            <span className="bg-[#C5A880] text-[#1C1614] text-[10px] sm:text-[11px] font-monoClinical font-semibold px-2.5 py-1 tracking-wider uppercase rounded-xs shadow-xs">
              New Launch
            </span>
          )}
        </div>

        {/* Action icons top-right */}
        <div className="absolute top-3.5 right-3.5 z-30 flex items-center space-x-2">
          {/* Confirmation Toast */}
          {toastMessage && (
            <div className="bg-[#1C1614] text-[#FAF8F5] text-[11px] font-monoClinical font-semibold px-2.5 py-1 rounded shadow-md flex items-center space-x-1 animate-fadeIn">
              <Check className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{toastMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleShare}
            title={copied ? 'Link Copied!' : 'Share product link'}
            aria-label="Share product link"
            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#1C1614] border border-[#E5DFD7] flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#C5A880]" />
            ) : (
              <Share2 className="w-4 h-4 text-[#1C1614]" />
            )}
          </button>
          <div className="hidden sm:flex w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-[#E5DFD7] text-[#1C1614] items-center justify-center shadow-xs">
            <ZoomIn className="w-4 h-4" />
          </div>
        </div>

        {/* Regular Image Display */}
        <img
          src={currentImage.url || currentImage}
          alt={currentImage.alt || name}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isZoomed ? 'opacity-0' : 'opacity-100'
          }`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/sweet_almond_squalane_bar.jpg';
          }}
        />

        {/* Zoomed Lens Layer */}
        {isZoomed && (
          <div
            className="absolute inset-0 pointer-events-none bg-no-repeat bg-cover transition-none"
            style={{
              backgroundImage: `url('${currentImage.url || currentImage}')`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundSize: '220%',
            }}
          />
        )}

        {/* Mobile Swipe / Arrow Controls */}
        {displayImages.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 text-[#1C1614] hover:text-[#3A302A] border border-[#E5DFD7] flex items-center justify-center shadow-xs"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 text-[#1C1614] hover:text-[#3A302A] border border-[#E5DFD7] flex items-center justify-center shadow-xs"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {displayImages.map((img, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-[#FAF8F5] overflow-hidden border rounded-lg transition-all ${
                  isSelected
                    ? 'border-[#1C1614] ring-1 ring-[#1C1614] shadow-xs'
                    : 'border-[#E5DFD7] hover:border-[#1C1614]/50 opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url || img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
