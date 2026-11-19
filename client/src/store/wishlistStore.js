import { create } from 'zustand';
import { api } from '../lib/api';

export const useWishlistStore = create((set, get) => ({
  items: [],
  wishlistIds: [],
  isWishlistOpen: false,
  isAuthPromptOpen: false,
  pendingWishlistProduct: null,
  toast: { message: '', visible: false },
  isLoading: false,

  openWishlist: () => set({ isWishlistOpen: true }),
  closeWishlist: () => set({ isWishlistOpen: false }),
  toggleWishlist: () => set((state) => ({ isWishlistOpen: !state.isWishlistOpen })),

  openAuthPrompt: (product) => {
    if (typeof window !== 'undefined' && product) {
      try {
        sessionStorage.setItem('love_co_pending_wishlist', JSON.stringify(product));
      } catch (_) {}
    }
    set({ isAuthPromptOpen: true, pendingWishlistProduct: product });
  },

  closeAuthPrompt: () => set({ isAuthPromptOpen: false }),

  showToast: (message) => {
    set({ toast: { message, visible: true } });
    if (typeof window !== 'undefined') {
      if (window._wishlistToastTimer) clearTimeout(window._wishlistToastTimer);
      window._wishlistToastTimer = setTimeout(() => {
        set({ toast: { message: '', visible: false } });
      }, 3500);
    }
  },

  hideToast: () => set({ toast: { message: '', visible: false } }),

  initializeWishlist: async () => {
    if (typeof window !== 'undefined') {
      // Eliminate any legacy anonymous unauthenticated storage
      localStorage.removeItem('love_co_wishlist');
      const token = localStorage.getItem('love_co_token');
      if (token) {
        await get().fetchWishlist();
        await get().syncPendingItem();
      } else {
        set({ items: [], wishlistIds: [] });
      }
    }
  },

  fetchWishlist: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('love_co_token');
    if (!token) {
      set({ items: [], wishlistIds: [] });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.getWishlist();
      if (res.data?.success) {
        const items = res.data.wishlist || [];
        const wishlistIds =
          res.data.wishlistIds || items.map((i) => i._id?.toString() || i.id?.toString());
        set({ items, wishlistIds, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      // If 401 or network error, silently handle
      set({ isLoading: false });
    }
  },

  isInWishlist: (productIdOrSlug) => {
    if (!productIdOrSlug) return false;
    const target = String(productIdOrSlug);
    const { wishlistIds, items } = get();

    if (wishlistIds.includes(target)) return true;

    return items.some(
      (item) =>
        String(item._id) === target ||
        String(item.id) === target ||
        item.slug === target ||
        item.handle === target
    );
  },

  toggleItem: async (product) => {
    if (!product) return { gated: false };

    const token = typeof window !== 'undefined' ? localStorage.getItem('love_co_token') : null;
    if (!token) {
      // 1. Guest user gate: do NOT save anonymously, open luxury sign-in prompt modal
      get().openAuthPrompt(product);
      return { gated: true, isAdded: false };
    }

    const key = product._id || product.id || product.slug;
    const isCurrentlySaved = get().isInWishlist(key);

    // Optimistic UI update
    const previousItems = [...get().items];
    const previousIds = [...get().wishlistIds];

    if (isCurrentlySaved) {
      const newItems = previousItems.filter(
        (i) => String(i._id) !== String(key) && String(i.id) !== String(key) && i.slug !== key
      );
      const newIds = previousIds.filter((id) => id !== String(key));
      set({ items: newItems, wishlistIds: newIds });
    } else {
      set({
        items: [product, ...previousItems],
        wishlistIds: [String(product._id || product.id || key), ...previousIds],
      });
    }

    try {
      const res = await api.toggleWishlist(key);
      if (res.data?.success) {
        const items = res.data.wishlist || [];
        const wishlistIds = res.data.wishlistIds || [];
        set({ items, wishlistIds });
        if (res.data.isAdded) {
          get().showToast('Saved to your Wishlist');
        } else {
          get().showToast('Removed from your Wishlist');
        }
        return { gated: false, isAdded: res.data.isAdded };
      }
    } catch (err) {
      // Revert optimistic update on error
      set({ items: previousItems, wishlistIds: previousIds });
      console.error('Failed to toggle wishlist item:', err);
    }

    return { gated: false, isAdded: false };
  },

  removeItem: async (productIdOrSlug) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('love_co_token') : null;
    if (!token) return;

    const previousItems = [...get().items];
    const previousIds = [...get().wishlistIds];

    const key = String(productIdOrSlug);
    const newItems = previousItems.filter(
      (i) => String(i._id) !== key && String(i.id) !== key && i.slug !== key
    );
    const newIds = previousIds.filter((id) => id !== key);
    set({ items: newItems, wishlistIds: newIds });

    try {
      const res = await api.removeFromWishlist(productIdOrSlug);
      if (res.data?.success) {
        const items = res.data.wishlist || [];
        const wishlistIds = res.data.wishlistIds || [];
        set({ items, wishlistIds });
        get().showToast('Removed from your Wishlist');
      }
    } catch (err) {
      set({ items: previousItems, wishlistIds: previousIds });
      console.error('Failed to remove product from wishlist:', err);
    }
  },

  syncPendingItem: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('love_co_token');
    if (!token) return;

    let pending = get().pendingWishlistProduct;
    if (!pending) {
      try {
        const stored = sessionStorage.getItem('love_co_pending_wishlist');
        if (stored) {
          pending = JSON.parse(stored);
        }
      } catch (_) {}
    }

    if (pending) {
      const key = pending._id || pending.id || pending.slug;
      try {
        const res = await api.toggleWishlist(key);
        if (res.data?.success) {
          const items = res.data.wishlist || [];
          const wishlistIds = res.data.wishlistIds || [];
          set({
            items,
            wishlistIds,
            pendingWishlistProduct: null,
            isAuthPromptOpen: false,
          });
          sessionStorage.removeItem('love_co_pending_wishlist');
          get().showToast('Saved to your Wishlist');
        }
      } catch (err) {
        console.error('Failed to auto-save pending wishlist product:', err);
      }
    }
  },

  clearWishlistState: () => {
    set({
      items: [],
      wishlistIds: [],
      pendingWishlistProduct: null,
      isAuthPromptOpen: false,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('love_co_wishlist');
      sessionStorage.removeItem('love_co_pending_wishlist');
    }
  },

  getItemCount: () => get().items.length,
}));
