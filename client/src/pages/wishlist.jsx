import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Heart,
  ShoppingBag,
  Trash2,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export default function WishlistPage() {
  const router = useRouter();
  const { items, removeItem, clearWishlist, initializeWishlist } = useWishlistStore();
  const { addItem: addToBag, openDrawer: openCartDrawer } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [movingId, setMovingId] = useState(null);
  const [allMoved, setAllMoved] = useState(false);

  // Handle single item "MOVE TO BAG"
  const handleMoveToBag = (product, removeAfter = false) => {
    const key = product._id || product.id || product.slug;
    setMovingId(key);

    addToBag(product, 1);

    if (removeAfter) {
      removeItem(key);
    }

    setTimeout(() => {
      setMovingId(null);
      openCartDrawer();
    }, 450);
  };

  // Handle "MOVE ALL TO BAG"
  const handleMoveAllToBag = () => {
    setAllMoved(true);
    items.forEach((item) => {
      addToBag(item, 1);
    });

    setTimeout(() => {
      setAllMoved(false);
      openCartDrawer();
    }, 600);
  };

  return (
    <>
      <Head>
        <title>My Wishlist — Love &amp; Co. Botanical Apothecary</title>
        <meta
          name="description"
          content="Review and manage your curated wishlist of cold-pressed botanical soaps and clinical lipid formulations."
        />
      </Head>

      <div className="bg-[#FAF9F8] min-h-screen">
        {/* Wishlist Header Banner in Pale Lavender */}
        <div className="bg-[#E6E0F0] border-b-2 border-brand-silver py-10 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between relative z-10 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono-clinical text-brand-mocha font-bold uppercase tracking-widest mb-2">
                <Link href="/" className="hover:text-brand-mocha-900 hover:underline">
                  Home
                </Link>
                <span>/</span>
                <span className="text-brand-mocha-900 font-bold">Wishlist</span>
              </div>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-brand-mocha-900 tracking-tight uppercase flex items-center space-x-3">
                <span>MY RITUAL WISHLIST</span>
              </h1>
            </div>

            {isAuthenticated && (
              <div className="text-xs font-mono-clinical">
                <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-brand-mocha text-white rounded-full font-bold shadow-md">
                  <span>{items.length}</span>
                  <span>{items.length === 1 ? 'Product' : 'Products'} Saved</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* 1. GUEST / LOGGED-OUT GATE */}
          {!isAuthenticated ? (
            <div className="border-2 border-brand-silver bg-white p-8 sm:p-14 text-center shadow-md max-w-xl mx-auto rounded-3xl space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#E6E0F0] border-2 border-brand-silver mx-auto flex items-center justify-center text-brand-mocha shadow-xs">
                <Heart className="w-8 h-8 text-red-500 fill-red-500 stroke-[1.5]" />
              </div>

              <div className="space-y-2">
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-medium text-brand-mocha-900">
                  Sign In to View Your Wishlist
                </h2>
                <p className="text-xs sm:text-sm font-sans text-brand-mocha-900/70 max-w-md mx-auto leading-relaxed">
                  Your saved apothecary favorites and personalized formulations are secured to your account. Sign in to view and transfer them directly to your bag.
                </p>
              </div>

              {/* Quick Google Sign In */}
              <div className="pt-2 max-w-sm mx-auto">
                <GoogleLoginButton
                  buttonText="Continue with Google"
                  onSuccess={() => initializeWishlist()}
                  redirectUrl="/wishlist"
                />
              </div>

              <div className="relative flex items-center justify-center my-2 max-w-sm mx-auto">
                <div className="w-full border-t border-brand-silver"></div>
                <span className="absolute bg-white px-3 text-[10.5px] font-mono-clinical uppercase tracking-wider text-neutral-500">
                  or
                </span>
              </div>

              {/* Email / Password Navigation Links */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
                <Link
                  href="/login?redirect=/wishlist"
                  className="w-full py-2.5 px-4 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-xs text-center"
                >
                  Sign In with Email
                </Link>
                <Link
                  href="/register?redirect=/wishlist"
                  className="w-full py-2.5 px-4 bg-white text-brand-mocha-900 border-2 border-brand-silver hover:bg-[#E6E0F0] rounded-xl text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-2xs text-center"
                >
                  Create Account
                </Link>
              </div>

              <div className="flex items-center justify-center space-x-2 text-[11px] font-sans text-brand-mocha-900/60 pt-2 border-t border-brand-silver">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-mocha" />
                <span>Encrypted Apothecary Account &bull; Cross-device sync</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* 2. AUTHENTICATED BUT EMPTY WISHLIST */
            <div className="border-2 border-brand-silver bg-white p-8 sm:p-16 text-center shadow-sm max-w-2xl mx-auto rounded-3xl">
              <div className="w-20 h-20 rounded-full bg-[#E6E0F0] border-2 border-brand-silver mx-auto flex items-center justify-center text-brand-mocha mb-6 shadow-xs">
                <Heart className="w-9 h-9 text-brand-mocha fill-brand-mocha/20 stroke-[1.5]" />
              </div>

              <h2 className="font-serif-luxury text-2xl sm:text-3xl font-medium text-brand-mocha-900 mb-2">
                Your Ritual Wishlist is Empty
              </h2>

              <p className="text-xs sm:text-sm font-sans text-brand-mocha-900/70 max-w-md mx-auto mb-8 leading-relaxed">
                You haven't saved any botanical formulations to your wishlist yet. Tap the heart icon on any small-batch bar or ritual product to preserve it here.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/catalog"
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-md rounded-xl text-center cursor-pointer"
                >
                  Explore Apothecary
                </Link>
                <Link
                  href="/bundle-builder"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#E6E0F0] hover:bg-[#d8d1e5] text-brand-mocha-900 border-2 border-brand-silver text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-2xs rounded-xl text-center cursor-pointer"
                >
                  Curate Custom Bundle
                </Link>
              </div>
            </div>
          ) : (
            /* 3. AUTHENTICATED WITH WISHLIST ITEMS */
            <div className="space-y-8">
              {/* Toolbar */}
              <div className="bg-[#E6E0F0]/60 border-2 border-brand-silver rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs font-mono-clinical text-brand-mocha font-semibold">
                  Saved products are synchronized to your account (<strong>{user?.email}</strong>).
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={clearWishlist}
                    className="flex-1 sm:flex-none px-4 py-2 border-2 border-brand-silver bg-white text-brand-mocha-900 hover:bg-[#FAF9F8] text-xs font-mono-clinical uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    onClick={handleMoveAllToBag}
                    disabled={allMoved}
                    className="flex-1 sm:flex-none px-5 py-2 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-widest font-bold inline-flex items-center justify-center space-x-2 transition-all shadow-md rounded-xl cursor-pointer disabled:opacity-75"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{allMoved ? 'Adding...' : 'Move All to Bag'}</span>
                  </button>
                </div>
              </div>

              {/* Wishlist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((product) => {
                  const key = product._id || product.id || product.slug;
                  const fallbackImage = '/images/products/bloom_neem_turmeric_soap.jpg';
                  const primaryImage =
                    product.images && product.images.length > 0
                      ? product.images.find((img) => img.isPrimary)?.url || product.images[0].url
                      : product.image || fallbackImage;

                  const stock =
                    product.stock !== undefined
                      ? product.stock
                      : product.stockQty !== undefined
                      ? product.stockQty
                      : 50;

                  const isOutOfStock = stock <= 0 || product.status === 'OUT_OF_STOCK';
                  const isLowStock = !isOutOfStock && stock <= 10;
                  const isMovingThis = movingId === key;

                  return (
                    <div
                      key={key}
                      className="group flex flex-col h-full bg-white border-2 border-brand-silver rounded-2xl overflow-hidden hover:border-brand-mocha/40 transition-all duration-300 shadow-sm hover:shadow-md relative"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative aspect-square overflow-hidden bg-brand-silver-light">
                        <Link href={`/product/${product.slug}`} className="block w-full h-full">
                          <img
                            src={primaryImage}
                            alt={product.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallbackImage;
                            }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>

                        {/* Remove from Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          aria-label={`Remove ${product.name} from wishlist`}
                          title="Remove from wishlist"
                          className="absolute top-2.5 right-2.5 z-20 p-2 rounded-full bg-white/90 backdrop-blur-xs text-[#8C827A] hover:text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer shadow-xs border border-brand-silver hover:scale-105"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Stock Badge on Thumbnail */}
                        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 bg-[#1C1614]/90 text-white text-[10px] font-mono-clinical uppercase tracking-wider font-semibold rounded shadow-xs">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono-clinical uppercase tracking-wider font-semibold rounded shadow-xs">
                              Low Stock ({stock} left)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono-clinical uppercase tracking-wider font-semibold rounded shadow-xs">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="p-4 flex flex-col flex-1 justify-between space-y-4">
                        <div className="space-y-1">
                          {/* Category */}
                          <span className="text-[10px] font-mono-clinical uppercase tracking-widest text-brand-mocha/70 font-bold block">
                            {product.category || 'Botanical Bar'}
                          </span>

                          {/* Name */}
                          <Link
                            href={`/product/${product.slug}`}
                            className="font-serif-luxury text-base text-brand-mocha-900 hover:text-brand-mocha font-medium line-clamp-1 transition-colors block"
                            title={product.name}
                          >
                            {product.name}
                          </Link>

                          {/* Subtitle / Actives */}
                          <p className="text-xs font-sans text-brand-mocha-900/60 line-clamp-1">
                            {product.subtitle || product.tagline || 'Cold-pressed bioactive formula'}
                          </p>

                          {/* Price */}
                          <div className="flex items-baseline space-x-2 pt-1">
                            <span className="font-mono-clinical font-bold text-sm text-brand-mocha-900">
                              ₹{product.price}
                            </span>
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                              <span className="font-mono-clinical text-xs text-neutral-400 line-through">
                                ₹{product.compareAtPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Primary "MOVE TO BAG" Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleMoveToBag(product)}
                            disabled={isOutOfStock || isMovingThis}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono-clinical uppercase tracking-wider font-bold flex items-center justify-center space-x-2 transition-all duration-200 shadow-xs cursor-pointer ${
                              isOutOfStock
                                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                : isMovingThis
                                ? 'bg-emerald-700 text-white'
                                : 'bg-brand-mocha text-white hover:bg-brand-mocha-600 active:scale-[0.98]'
                            }`}
                          >
                            {isMovingThis ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Moved to Bag</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{isOutOfStock ? 'Sold Out' : 'Move to Bag'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
