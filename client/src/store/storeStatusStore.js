import { create } from 'zustand';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export const useStoreStatusStore = create((set) => ({
  storeStatus: {
    isPaused: false,
    pauseReason: '',
    reopenDate: '',
    pauseNotice: '',
  },
  isLoading: false,

  setStoreStatus: (status) => set({ storeStatus: status }),

  fetchStoreStatus: async () => {
    try {
      set({ isLoading: true });
      const res = await api.getPublicStoreStatus();
      if (res.data?.success && res.data.storeStatus) {
        set({ storeStatus: res.data.storeStatus });
      }
    } catch (_) {
      // Fallback
    } finally {
      set({ isLoading: false });
    }
  },

  initSocketListener: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('store:status_update', (newStatus) => {
      set({ storeStatus: newStatus });
    });
  },
}));
