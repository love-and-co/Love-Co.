import React from 'react';
import Link from 'next/link';
import { Heart, X, ArrowRight, Check } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';

export default function WishlistToast() {
  const { toast, hideToast } = useWishlistStore();

  if (!toast.visible) return null;

  const isSaved = toast.message.toLowerCase().includes('saved');

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div className="bg-[#1C1614] text-[#FAF9F8] border border-white/20 shadow-2xl rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center space-x-3.5 backdrop-blur-md max-w-sm">
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSaved ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-neutral-300'
          }`}
        >
          {isSaved ? (
            <Heart className="w-4 h-4 fill-red-400 text-red-400" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </div>

        {/* Message & Link */}
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-semibold tracking-wide text-white truncate">
            {toast.message}
          </p>
          <Link
            href="/wishlist"
            onClick={hideToast}
            className="text-[11px] font-mono-clinical uppercase tracking-wider text-[#E6E0F0] hover:text-white underline font-medium inline-flex items-center space-x-1 mt-0.5"
          >
            <span>View Wishlist</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={hideToast}
          className="p-1 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
