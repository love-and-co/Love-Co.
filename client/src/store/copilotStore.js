import { create } from 'zustand';
import { api } from '../lib/api';

// Greeting phrases (mirrors server-side detection for instant local response)
const GREETINGS = new Set([
  'hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening',
  'good afternoon', 'good night', 'hola', 'howdy', 'greetings',
  'hai', 'hii', 'hiii', 'heya', 'yo', 'sup',
]);

function clientIsGreeting(text) {
  const norm = (text || '').trim().toLowerCase();
  return [...GREETINGS].some((g) => norm === g || norm.startsWith(g + ' ') || norm.startsWith(g + '!'));
}

const INITIAL_SAM_MESSAGE = {
  id: 'sam-welcome',
  role: 'model',
  text: `Hello! I'm **Sam**, your official Botanical Skincare Copilot here at **Love & Co.** 🌿

Whether you're looking to clear active breakouts, deeply hydrate a dry barrier, fade sun tan, or heal chapped lips — I'm here to analyze your skin and formulate a personalized clinical routine.

To begin, could you share:
1. **Your skin type** — Oily, Dry, Combination, or Sensitive?
2. **Your primary skin concern today?**

Feel free to describe your skin in your own words, or tap a quick option below!`,
  actionPayload: {
    diagnosedConcerns: [],
    recommendedProducts: [],
    quickReplies: [
      'I have stubborn acne & oily skin',
      'Dry, tight skin after washing',
      'Beach tan & dark spots',
      'Chapped & peeling lips',
    ],
  },
  timestamp: new Date().toISOString(),
};

export const useCopilotStore = create((set, get) => ({
  isOpen: false,
  activeTab: 'chat', // 'chat' | 'questionnaire' | 'regimen'
  skinType: 'Combination',
  concerns: ['Barrier Repair', 'Acne'],
  sensitivities: [],
  messages: [INITIAL_SAM_MESSAGE],
  diagnosedProfile: null,
  recommendedProducts: [],
  recommendedRegimen: null,
  explanation: '',
  isLoading: false,

  initializeCopilot: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('love_co_sam_history');
        if (saved && saved.trim() && saved !== 'undefined' && saved !== 'null') {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            set({ messages: parsed });
          }
        }
      } catch (e) {
        console.error('Failed to load saved Sam chat history:', e);
      }
    }
  },

  openCopilot: (presetConcern = null) => {
    if (presetConcern) {
      set((state) => ({
        concerns: [presetConcern],
        isOpen: true,
      }));
      // If user opened with a specific concern prompt
      if (typeof presetConcern === 'string' && presetConcern.length > 3) {
        get().sendSamMessage(`I need help with ${presetConcern}`);
      }
    } else {
      set({ isOpen: true });
    }
  },

  closeCopilot: () => set({ isOpen: false }),

  setTab: (tab) => set({ activeTab: tab }),

  setSkinType: (type) => set({ skinType: type }),

  toggleConcern: (concern) => {
    const current = get().concerns;
    if (current.includes(concern)) {
      set({ concerns: current.filter((c) => c !== concern) });
    } else {
      set({ concerns: [...current, concern] });
    }
  },

  toggleSensitivity: (sens) => {
    const current = get().sensitivities;
    if (current.includes(sens)) {
      set({ sensitivities: current.filter((s) => s !== sens) });
    } else {
      set({ sensitivities: [...current, sens] });
    }
  },

  /**
   * Primary Sam Conversational AI Chat Method — RAG-powered
   */
  sendSamMessage: async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || get().isLoading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = get().messages;
    const updatedWithUser = [...currentMessages, userMsg];

    set({ messages: updatedWithUser, isLoading: true });

    // Persist to localStorage immediately
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('love_co_sam_history', JSON.stringify(updatedWithUser)); } catch (_) {}
    }

    // ── Client-side instant greeting response (no network round-trip) ──
    if (clientIsGreeting(trimmed) && currentMessages.filter((m) => m.role === 'user').length === 0) {
      const greetMsg = {
        id: `sam_${Date.now()}`,
        role: 'model',
        sender: 'assistant',
        text: `Hello! I'm **Sam**, your botanical skincare and formulation copilot at **Love & Co.** 🌿\n\nWhether you're looking to clear active breakouts, deeply hydrate a dry barrier, fade sun tan, or heal chapped lips — I'm here to analyze your skin and formulate a personalized clinical routine.\n\nTo begin, could you share:\n1. **Your skin type** — Oily, Dry, Combination, or Sensitive?\n2. **Your primary skin concern today?**`,
        actionPayload: {
          diagnosedConcerns: [],
          recommendedProducts: [],
          quickReplies: ['I have stubborn acne & oily skin', 'Dry, tight skin after washing', 'Beach tan & dark spots', 'Chapped & peeling lips'],
        },
        timestamp: new Date().toISOString(),
      };
      const final = [...updatedWithUser, greetMsg];
      set({ messages: final, isLoading: false });
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('love_co_sam_history', JSON.stringify(final)); } catch (_) {}
      }
      return;
    }

    try {
      // Build history payload (exclude welcome message)
      const historyPayload = currentMessages
        .filter((m) => m.text && m.id !== 'sam-welcome')
        .map((m) => ({
          role: m.role === 'model' || m.sender === 'assistant' ? 'model' : 'user',
          text: m.text,
        }));

      const res = await api.chatWithSam({ message: trimmed, history: historyPayload });
      const data = res.data;

      const samMsg = {
        id: `sam_${Date.now()}`,
        role: 'model',
        sender: 'assistant',
        text: data.reply || "I've analyzed your skin profile.",
        actionPayload: data.actionPayload || null,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedWithUser, samMsg];
      set({
        messages: finalMessages,
        isLoading: false,
        diagnosedProfile: data.actionPayload?.diagnosedConcerns
          ? { primaryConcerns: data.actionPayload.diagnosedConcerns }
          : get().diagnosedProfile,
        recommendedProducts: data.actionPayload?.recommendedProducts || get().recommendedProducts,
        explanation: data.reply || '',
      });

      if (typeof window !== 'undefined') {
        try { localStorage.setItem('love_co_sam_history', JSON.stringify(finalMessages)); } catch (_) {}
      }
    } catch (err) {
      console.error('Sam RAG chat request failed:', err);
      const fallback = {
        id: `sam_err_${Date.now()}`,
        role: 'model',
        sender: 'assistant',
        text: "I experienced a brief connection issue. Please try asking again or select one of the quick diagnostic options below.",
        actionPayload: {
          diagnosedConcerns: [],
          recommendedProducts: [],
          quickReplies: ['Acne & oily skin', 'Dry skin help', 'Beach tan & dark spots'],
        },
        timestamp: new Date().toISOString(),
      };
      set({ messages: [...updatedWithUser, fallback], isLoading: false });
    }
  },

  // Backward compatibility alias for existing components
  sendChatMessage: async (text) => {
    return get().sendSamMessage(text);
  },

  clearChatHistory: () => {
    set({
      messages: [INITIAL_SAM_MESSAGE],
      diagnosedProfile: null,
      recommendedProducts: [],
      recommendedRegimen: null,
      explanation: '',
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('love_co_sam_history');
    }
  },

  resetDiagnostic: () => {
    get().clearChatHistory();
  },
}));
