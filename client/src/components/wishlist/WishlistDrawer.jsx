import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { X, Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

export default function WishlistDrawer() {
  const router = useRouter();
  const { items, isWishlistOpen, closeWishlist, removeItem, clearWishlist } = useWishlistStore();
  const { addItem: addToCart, openDrawer: openCartDrawer } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [addedItems, setAddedItems] = React.useState({});
  const [allAdded, setAllAdded] = React.useState(false);

  if (!isWishlistOpen) return null;

  const handleAddToBag = (product) => {
    addToCart(product, 1);
    const id = product._id || product.id || product.slug;
    setAddedItems((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [id]: false }));
    }, 1800);
  };

  const handleAddAllToBag = () => {
    items.forEach((item) => {
      addToCart(item, 1);
    });
    setAllAdded(true);
    setTimeout(() => {
      setAllAdded(false);
      closeWishlist();
      openCartDrawer();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-mocha-900/40 backdrop-blur-xs transition-opacity"
        onClick={closeWishlist}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F8] shadow-2xl flex flex-col border-l-2 border-brand-silver">
          {/* Header in Pale Lavender */}
          <div className="p-4 sm:p-5 border-b-2 border-brand-silver bg-[#E6E0F0] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white border border-brand-silver flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </div>
              <div>
                <h2 className="font-serif-luxury font-medium text-lg text-brand-mocha-900 uppercase tracking-wide leading-none">
                  My Wishlist
                </h2>
                <span className="text-[10.5px] font-mono-clinical text-brand-mocha font-semibold">
                  {items.length} {items.length === 1 ? 'Product' : 'Products'} Saved
                </span>
              </div>
            </div>
            <button
              onClick={closeWishlist}
              className="p-1.5 text-brand-mocha-900 bg-white hover:bg-brand-mocha hover:text-white border border-brand-silver rounded-full transition-colors cursor-pointer shadow-2xs"
              aria-label="Close wishlist drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F8] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E6E0F0] border-2 border-brand-silver flex items-center justify-center text-brand-mocha shadow-xs">
                <Heart className="w-8 h-8 text-red-500 fill-red-500 stroke-[1.5]" />
              </div>
              <h3 className="font-serif-luxury text-xl font-medium text-brand-mocha-900">
                Sign in to View Saved Items
              </h3>
              <p className="text-xs font-mono-clinical text-brand-mocha/70 max-w-xs leading-relaxed">
                Log in to sync your favorites across devices and transfer them seamlessly to your bag.
              </p>
              <div className="pt-2 w-full space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    closeWishlist();
                    router.push('/login?redirect=/wishlist');
                  }}
                  className="w-full py-2.5 px-4 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF9F8]">
              <div className="w-20 h-20 rounded-full bg-[#E6E0F0] border-2 border-brand-silver flex items-center justify-center text-brand-mocha mb-5 shadow-sm">
                <Heart className="w-9 h-9 text-brand-mocha fill-brand-mocha/30 stroke-[1.5]" />
              </div>
              <h3 className="font-serif-luxury text-2xl font-medium text-brand-mocha-900 mb-2">
                Your Wishlist is Empty
              </h3>
              <p className="text-xs font-mono-clinical text-brand-mocha/70 max-w-xs mb-6 leading-relaxed">
                Save your favorite botanical bars and regimens to revisit and transfer them directly to bag.
              </p>
              <button
                onClick={() => {
                  closeWishlist();
                  router.push('/catalog');
                }}
                className="px-8 py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-md rounded-xl cursor-pointer"
              >
                Explore Products
              </button>
            </div>
          ) : (
            <>
              {/* Product List */}
              <div className="flex-1 overflow-y-auto divide-y divide-brand-silver p-4 sm:p-5 space-y-4">
                {items.map((item) => {
                  const id = item._id || item.id || item.slug;
                  const itemImage =
                    item.image ||
                    (item.images && item.images[0]?.url) ||
                    '/images/products/bloom_neem_turmeric_soap.jpg';

                  return (
                    <div key={id} className="pt-4 first:pt-0 flex space-x-3.5 items-start group bg-white border border-brand-silver rounded-2xl p-3.5 shadow-2xs">
                      {/* Product Thumbnail */}
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeWishlist}
                        className="w-20 h-20 bg-brand-canvas border border-brand-silver shrink-0 overflow-hidden rounded-xl relative block"
                      >
                        <img
                          src={itemImage}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={closeWishlist}
                            className="font-serif-luxury text-sm font-medium text-brand-mocha-900 hover:text-brand-mocha truncate transition-colors"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(id)}
                            className="text-brand-mocha/50 hover:text-red-600 hover:bg-[#E6E0F0] rounded-md transition-colors p-1"
                            aria-label={`Remove ${item.name} from wishlist`}
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.activesConcentration && (
                          <div className="text-[10px] font-mono-clinical text-brand-mocha font-semibold uppercase truncate mt-0.5">
                            {item.activesConcentration}
                          </div>
                        )}

                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-mono-clinical font-bold text-brand-mocha-900">
                            ₹{item.price}
                          </span>
                          {item.compareAtPrice && item.compareAtPrice > item.price && (
                            <span className="text-[11px] font-mono-clinical text-brand-mocha/40 line-through">
                              ₹{item.compareAtPrice}
                            </span>
                          )}
                          {item.volumeWeight && (
                            <span className="text-[10px] font-mono-clinical text-brand-mocha/60 border-l border-brand-silver pl-2">
                              {item.volumeWeight}
                            </span>
                          )}
                        </div>

                        {/* Add to Bag button */}
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={() => handleAddToBag(item)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-[11px] font-mono-clinical uppercase tracking-wider font-semibold rounded-lg transition-all shadow-2xs cursor-pointer ${
                              addedItems[id]
                                ? 'bg-brand-mocha-800 text-white ring-2 ring-white/60'
                                : 'bg-brand-mocha hover:bg-brand-mocha-600 text-white'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{addedItems[id] ? 'Added to Bag ✓' : 'Add to Bag'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer in Pale Lavender */}
              <div className="border-t-2 border-brand-silver bg-[#E6E0F0] p-4 sm:p-5 space-y-3">
                <button
                  type="button"
                  onClick={handleAddAllToBag}
                  className="w-full py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all shadow-md rounded-xl cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{allAdded ? 'Added All to Bag ✓' : `Add All (${items.length}) to Bag`}</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={clearWishlist}
                    className="text-[11px] font-mono-clinical text-brand-mocha-900/70 hover:text-red-700 transition-colors underline cursor-pointer"
                  >
                    Clear All
                  </button>

                  <Link
                    href="/wishlist"
                    onClick={closeWishlist}
                    className="text-[11px] font-mono-clinical text-brand-mocha-900 bg-white hover:bg-brand-silver-light border border-brand-silver px-3 py-1 rounded-md font-bold inline-flex items-center space-x-1 transition-colors shadow-2xs"
                  >
                    <span>View Wishlist Page</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
