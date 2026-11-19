import { create } from 'zustand';
import { api } from '../lib/api';
import { useWishlistStore } from './wishlistStore';

const setTokenCookie = (token) => {
  if (typeof document !== 'undefined' && token) {
    document.cookie = `love_co_token=${token}; path=/; max-age=604800; SameSite=Lax`;
  }
};

const clearTokenCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'love_co_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
};

const safeJsonParse = (str, fallback = null) => {
  if (!str || typeof str !== 'string' || !str.trim() || str === 'undefined' || str === 'null') {
    return fallback;
  }
  try {
    return JSON.parse(str);
  } catch (_) {
    return fallback;
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isAuthModalOpen: false,
  authModalMethod: 'email',

  openAuthModal: (method = 'email') => set({ isAuthModalOpen: true, authModalMethod: method, error: null }),
  closeAuthModal: () => set({ isAuthModalOpen: false, error: null }),

  initializeAuth: async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('love_co_token');
      const savedUser = localStorage.getItem('love_co_user');
      const parsedUser = safeJsonParse(savedUser);
      if (token && parsedUser) {
        setTokenCookie(token);
        try {
          set({ token, user: parsedUser, isAuthenticated: true });
          const res = await api.getMe();
          if (res.data?.user) {
            set({ user: res.data.user });
            localStorage.setItem('love_co_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid');
          get().logout();
        }
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.login({ email, password });
      const { token, user } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('love_co_token', token);
        localStorage.setItem('love_co_user', JSON.stringify(user));
        setTokenCookie(token);
      }
      set({ user, token, isAuthenticated: true, isLoading: false });
      useWishlistStore.getState().initializeWishlist();
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.error || 'Authentication failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  loginWithGoogle: async (googleData = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.loginWithGoogle(googleData);
      const { token, user, requiresPhoneVerification, needsPhoneVerification } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('love_co_token', token);
        localStorage.setItem('love_co_user', JSON.stringify(user));
        setTokenCookie(token);
      }
      const isVerified = Boolean(user?.isPhoneVerified && user?.phone && user?.phone.length === 10);
      const mustVerify = Boolean(requiresPhoneVerification ?? needsPhoneVerification ?? (!isVerified && user?.role !== 'admin'));
      set({ user, token, isAuthenticated: true, isLoading: false });
      useWishlistStore.getState().initializeWishlist();
      return { success: true, user, needsPhoneVerification: mustVerify };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Google authentication failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.register(payload);
      const { token, user } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('love_co_token', token);
        localStorage.setItem('love_co_user', JSON.stringify(user));
        setTokenCookie(token);
      }
      set({ user, token, isAuthenticated: true, isLoading: false });
      useWishlistStore.getState().initializeWishlist();
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  verifyPhoneOtp: async (phone, otp, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.verifyOtp({ phone, otp, fullName });
      const { token, user } = res.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('love_co_token', token);
        localStorage.setItem('love_co_user', JSON.stringify(user));
        setTokenCookie(token);
      }
      set({ user, token, isAuthenticated: true, isLoading: false });
      useWishlistStore.getState().initializeWishlist();
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.error || 'OTP verification failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await api.updateProfile(profileData);
      const updatedUser = res.data.user;
      set((state) => ({
        user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
      }));
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('love_co_user');
        const parsedOld = safeJsonParse(savedUser, {});
        const merged = { ...parsedOld, ...updatedUser };
        localStorage.setItem('love_co_user', JSON.stringify(merged));
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to update profile';
      return { success: false, error: msg };
    }
  },

  addAddress: async (addressData) => {
    try {
      const res = await api.addAddress(addressData);
      const savedAddresses = res.data.savedAddresses;
      set((state) => ({
        user: state.user ? { ...state.user, savedAddresses } : null,
      }));
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('love_co_user');
        const userObj = safeJsonParse(savedUser);
        if (userObj) {
          userObj.savedAddresses = savedAddresses;
          localStorage.setItem('love_co_user', JSON.stringify(userObj));
        }
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to add address';
      return { success: false, error: msg };
    }
  },

  deleteAddress: async (addressId) => {
    try {
      const res = await api.deleteAddress(addressId);
      const savedAddresses = res.data.savedAddresses;
      set((state) => ({
        user: state.user ? { ...state.user, savedAddresses } : null,
      }));
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('love_co_user');
        const userObj = safeJsonParse(savedUser);
        if (userObj) {
          userObj.savedAddresses = savedAddresses;
          localStorage.setItem('love_co_user', JSON.stringify(userObj));
        }
      }
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete address';
      return { success: false, error: msg };
    }
  },

  updateSkinProfile: async (skinProfile) => {
    try {
      const res = await api.updateSkinProfile(skinProfile);
      set((state) => ({
        user: state.user ? { ...state.user, skinProfile: res.data.skinProfile } : null,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  setUser: (updatedUser) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
    }));
    if (typeof window !== 'undefined' && updatedUser) {
      const savedUser = localStorage.getItem('love_co_user');
      const parsedOld = safeJsonParse(savedUser, {});
      const merged = { ...parsedOld, ...updatedUser };
      localStorage.setItem('love_co_user', JSON.stringify(merged));
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('love_co_token');
      localStorage.removeItem('love_co_user');
      clearTokenCookie();
    }
    set({ user: null, token: null, isAuthenticated: false, error: null });
    useWishlistStore.getState().clearWishlistState();
  },
}));
