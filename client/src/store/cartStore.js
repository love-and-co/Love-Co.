import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  isDrawerOpen: false,
  promoCode: '',
  promoDiscount: 0,
  appliedReward: null,
  includeGiftPackaging: false,
  sessionId: typeof window !== 'undefined' ? (localStorage.getItem('love_co_session_id') || `sess_${Math.random().toString(36).substring(2, 9)}`) : 'sess_initial',

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  initializeCart: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('love_co_cart');
        if (saved && saved.trim() && saved !== 'undefined' && saved !== 'null') {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            set({ items: parsed });
          }
        }
        let sess = localStorage.getItem('love_co_session_id');
        if (!sess) {
          sess = `sess_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem('love_co_session_id', sess);
        }
        set({ sessionId: sess });
      } catch (e) {
        console.error('Failed to load saved cart', e);
      }
    }
  },

  addItem: (product, quantity = 1, selectedVariant = null, isBundleItem = false) => {
    let variant = selectedVariant;
    let bundleFlag = isBundleItem;
    if (typeof selectedVariant === 'boolean') {
      bundleFlag = selectedVariant;
      variant = null;
    }

    const current = get().items;
    const baseId = product.id || product._id || product.slug;
    const variantSize = typeof variant === 'string' ? variant : variant?.size;
    const lineId = variantSize ? `${baseId}-${variantSize}` : baseId;

    const existingIndex = current.findIndex(
      (item) => (item.cartLineId || item.id || item._id) === lineId
    );

    const price = variant?.price ?? product.price;
    const compareAtPrice = variant?.compareAtPrice ?? product.compareAtPrice;

    let updated = [];
    if (existingIndex > -1) {
      updated = current.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updated = [
        ...current,
        {
          id: baseId,
          _id: product._id || baseId,
          cartLineId: lineId,
          slug: product.slug,
          name: product.name,
          selectedSize: variantSize || product.volumeWeight || 'Default',
          price,
          compareAtPrice,
          activesConcentration: product.activesConcentration,
          image: product.images && product.images[0] ? (product.images[0].url || product.images[0]) : (product.image || ''),
          quantity,
          isBundleItem: bundleFlag,
        },
      ];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('love_co_cart', JSON.stringify(updated));
    }
    set({ items: updated });
  },

  addMultipleItems: (productsList, isBundle = true) => {
    const current = get().items;
    const newItems = [...current];

    productsList.forEach((prod) => {
      const existing = newItems.find((i) => (i.id || i._id) === (prod.id || prod._id));
      if (existing) {
        existing.quantity += 1;
      } else {
        newItems.push({
          id: prod.id || prod._id,
          _id: prod._id || prod.id,
          slug: prod.slug,
          name: prod.name,
          price: prod.price,
          compareAtPrice: prod.compareAtPrice,
          activesConcentration: prod.activesConcentration,
          image: prod.images && prod.images[0] ? prod.images[0].url : (prod.image || ''),
          quantity: 1,
          isBundleItem: isBundle,
        });
      }
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('love_co_cart', JSON.stringify(newItems));
    }
    set({ items: newItems });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    const updated = get().items.map((item) => {
      const match =
        (item.cartLineId && item.cartLineId === id) ||
        (item.id && item.id === id) ||
        (item._id && item._id === id) ||
        (item.slug && item.slug === id);
      return match ? { ...item, quantity } : item;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('love_co_cart', JSON.stringify(updated));
    }
    set({ items: updated });
  },

  removeItem: (id) => {
    const updated = get().items.filter((item) => {
      const match =
        (item.cartLineId && item.cartLineId === id) ||
        (item.id && item.id === id) ||
        (item._id && item._id === id) ||
        (item.slug && item.slug === id);
      return !match;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('love_co_cart', JSON.stringify(updated));
    }
    set({ items: updated });
  },

  clearCart: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('love_co_cart');
    }
    set({ items: [], promoCode: '', promoDiscount: 0, appliedReward: null });
  },

  setGiftPackaging: (val) => set({ includeGiftPackaging: val }),

  applyCoupon: async (code) => {
    if (!code) return { success: false, message: 'Please enter a coupon code' };
    const upper = code.trim().toUpperCase();
    if (upper === 'BOTANICAL15' || upper === 'LOVE15') {
      set({ promoCode: upper, promoDiscount: 15, appliedReward: null });
      return { success: true, message: '15% Botanical Discount Applied!' };
    }
    if (upper.startsWith('RITUAL-') || upper === 'FREE_TRIO') {
      try {
        const { api } = await import('../lib/api');
        const res = await api.validateReward({
          code: upper,
          rewardType: upper === 'FREE_TRIO' ? 'FREE_TRIO' : 'COUPON',
          subtotal: get().getSubtotal(),
          applyNow: false,
        });
        if (res.data?.valid) {
          get().applyReward({
            type: res.data.rewardType || 'COUPON',
            rewardType: res.data.rewardType || 'COUPON',
            code: upper,
            discountPercent: res.data.discountPercent,
            discountAmount: res.data.discountAmount,
            description: res.data.message || `Ritual Reward (${upper})`,
          });
          return { success: true, message: res.data.message || 'Reward coupon applied!' };
        }
        return { success: false, message: res.data?.error || 'Invalid or expired coupon' };
      } catch (err) {
        return { success: false, message: err.response?.data?.error || 'Invalid promotional code' };
      }
    }
    return { success: false, message: 'Invalid promotional code' };
  },

  removeCoupon: () => set({ promoCode: '', promoDiscount: 0, appliedReward: null }),

  applyReward: (reward) => {
    set({
      appliedReward: reward,
      promoCode: reward.code || reward.rewardType || 'RITUAL_REWARD',
      promoDiscount: reward.discountPercent || 0,
    });
  },

  removeReward: () => set({ appliedReward: null, promoCode: '', promoDiscount: 0 }),

  // Computed Selectors
  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  },

  getBundleDiscountPercentage: () => {
    const reward = get().appliedReward;
    if (reward?.discountPercent) return reward.discountPercent;
    const promo = get().promoDiscount;
    if (promo > 0) return promo;
    return 0;
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const reward = get().appliedReward;
    if (reward) {
      if (reward.rewardType === 'FREE_TRIO' || reward.type === 'FREE_TRIO') {
        return Math.min(subtotal, reward.discountAmount || 499);
      }
      if (reward.discountAmount !== undefined && reward.discountAmount !== null) {
        return Number(reward.discountAmount);
      }
      if (reward.discountPercent) {
        const calculated = Math.round((subtotal * reward.discountPercent) / 100);
        return Math.min(calculated, reward.maxDiscount || 250);
      }
    }
    const promo = get().promoDiscount;
    if (promo > 0) {
      return Math.round((subtotal * promo) / 100);
    }
    return 0;
  },

  getShippingFee: () => {
    const net = get().getSubtotal() - get().getDiscountAmount();
    if (net >= 500 || net === 0) return 0;
    return 50;
  },

  getGrandTotal: () => {
    const net = get().getSubtotal() - get().getDiscountAmount();
    const packaging = get().includeGiftPackaging ? 99 : 0;
    const shipping = get().getShippingFee();
    return net + packaging + shipping;
  },

  getItemCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },
}));
