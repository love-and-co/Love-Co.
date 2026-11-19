import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  ArrowRight,
  Sparkles,
  Check,
  ShoppingBag,
  Sun,
  Moon,
  Award,
} from 'lucide-react';
import { useCopilotStore } from '../../store/copilotStore';
import { useCartStore } from '../../store/cartStore';

export default function RoutineAssistantModal() {
  const {
    isOpen,
    closeCopilot,
    activeTab,
    setTab,
    skinType,
    concerns,
    sendChatMessage,
    messages,
    diagnosedProfile,
    recommendedProducts,
    recommendedRegimen,
    explanation,
    isLoading,
  } = useCopilotStore();

  const addItem = useCartStore((state) => state.addItem);
  const addMultipleItems = useCartStore((state) => state.addMultipleItems);

  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [addedProductId, setAddedProductId] = useState(null);
  const [regimenAdded, setRegimenAdded] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: '🌿 Cold-pressed soap for acne', query: 'Which cold-pressed soap is best for acne, breakouts, and oily skin?' },
    { label: '💧 Dry skin & barrier repair', query: 'Recommend a gentle routine to repair a damaged, stinging skin barrier.' },
    { label: '✨ 45-day ambient curing benefit', query: 'Why does 45-day ambient curing make Love & Co. soaps gentler on skin?' },
    { label: '💋 Chapped lips & peeling', query: 'Tell me about Velisse lip elixir for chapped, sensitive lips.' },
  ];

  // Speech to Text Web API
  const handleVoiceToggle = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim() && !isLoading) {
      const q = chatInput.trim();
      setChatInput('');
      sendChatMessage(q);
    }
  };

  const handleQuickPromptClick = (promptQuery) => {
    if (!isLoading) {
      setChatInput('');
      sendChatMessage(promptQuery);
    }
  };

  const handleAddToCart = (product) => {
    addItem({
      ...product,
      id: product._id || product.id,
      selectedGrams: 100,
    });
    setAddedProductId(product._id || product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const handleAddFullRegimen = () => {
    if (recommendedProducts && recommendedProducts.length > 0) {
      addMultipleItems(recommendedProducts, true);
      setRegimenAdded(true);
      setTimeout(() => setRegimenAdded(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-mocha-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white border border-brand-silver shadow-2xl rounded-2xl flex flex-col h-[90vh] sm:h-[85vh] max-h-[850px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-brand-silver bg-brand-canvas/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-serif-luxury font-bold text-sm tracking-wider text-brand-mocha-900">
              LOVE &amp; CO. — Sam AI Assistant
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {recommendedRegimen && (
              <button
                onClick={() => setTab(activeTab === 'regimen' ? 'chat' : 'regimen')}
                className="px-3 py-1 rounded-full border border-brand-silver bg-white hover:bg-brand-lavender-light text-brand-mocha text-xs font-mono-clinical font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 text-moss" />
                <span>{activeTab === 'regimen' ? 'Back to Chat' : 'Prescription ✓'}</span>
              </button>
            )}
            <button
              onClick={closeCopilot}
              aria-label="Close assistant"
              className="w-8 h-8 rounded-full border border-brand-silver bg-white hover:bg-brand-lavender-light text-brand-mocha flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SAM AI CHAT (MATCHING MINIMALIST SCREENSHOT DESIGN)               */}
        {/* ========================================================================= */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
            {/* If no chat messages yet: Render Hero Minimalist Greeting & Center Pill */}
            {messages.length === 0 ? (
              <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 sm:p-10 text-center">
                {/* Brand Logo */}
                <div className="mb-4">
                  <span className="font-serif-luxury text-3xl sm:text-4xl font-extrabold tracking-[0.12em] text-brand-mocha-900 block leading-none">
                    LOVE &amp; CO.
                  </span>
                  <span className="font-mono-clinical text-[8px] uppercase tracking-[0.35em] text-brand-mocha/60 font-semibold block mt-1">
                    Cold-Pressed Botanical Atelier
                  </span>
                </div>

                {/* Welcoming Headings */}
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight flex items-center justify-center gap-2 mb-1.5 font-sans">
                  <span>Welcome to Love &amp; Co.!</span>
                  <span className="inline-block animate-bounce">👋</span>
                </h2>
                <p className="text-sm sm:text-base text-neutral-500 font-sans mb-8">
                  I&apos;m Sam, your Skin AI Assistant.
                </p>

                {/* Hero Input Pill with warm amber glow */}
                <form onSubmit={handleSendChat} className="w-full max-w-xl mx-auto mb-6">
                  <div
                    className={`relative flex items-center w-full rounded-full bg-white border-2 transition-all duration-300 shadow-sm ${
                      isListening
                        ? 'border-red-500 ring-4 ring-red-100'
                        : 'border-[#E77843]/70 hover:border-[#E77843] focus-within:border-[#E77843] focus-within:ring-4 focus-within:ring-[#E77843]/15'
                    } p-2 pl-6 sm:pl-7`}
                  >
                    <input
                      type="text"
                      placeholder={isListening ? 'Listening to your voice...' : 'Ask me anything...'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="w-full bg-transparent text-sm sm:text-base text-neutral-800 placeholder-neutral-400 focus:outline-none pr-3 font-sans"
                      disabled={isLoading}
                      autoFocus
                    />
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleVoiceToggle}
                        title={isListening ? 'Stop listening' : 'Voice input'}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          isListening
                            ? 'text-red-500 bg-red-50 animate-pulse'
                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                        }`}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !chatInput.trim()}
                        className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-600 hover:text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-neutral-100 disabled:hover:text-neutral-600 cursor-pointer shrink-0"
                        aria-label="Send query"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Quick Consultation Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPromptClick(p.query)}
                      className="text-xs px-3.5 py-1.5 rounded-full bg-brand-canvas border border-brand-silver hover:border-brand-mocha text-brand-mocha-900 hover:bg-brand-lavender-light transition-all shadow-2xs font-sans cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Conversation Feed */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans text-xs sm:text-sm">
                <div className="text-center pb-2 border-b border-brand-silver">
                  <span className="font-serif-luxury font-bold text-sm tracking-wider text-brand-mocha-900">
                    LOVE &amp; CO. — Sam AI Assistant
                  </span>
                </div>

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-2xl ${
                        m.sender === 'user'
                          ? 'bg-brand-mocha-900 text-white rounded-tr-xs shadow-xs'
                          : 'bg-brand-canvas border border-brand-silver text-brand-mocha-900 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="text-[10px] font-mono-clinical uppercase tracking-wider mb-1 text-brand-mocha/70">
                        {m.sender === 'user' ? 'You' : 'Sam • Skin AI'}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                      {/* Display Regimen AM/PM if provided */}
                      {m.regimen && (
                        <div className="mt-4 pt-3 border-t border-brand-silver/60 space-y-3 font-sans text-xs">
                          {m.regimen.am && (
                            <div className="bg-white/90 p-3 rounded-lg border border-brand-silver">
                              <span className="font-mono-clinical uppercase text-[10px] font-bold text-brand-mocha flex items-center mb-1">
                                <Sun className="w-3.5 h-3.5 mr-1 text-amber-600" /> Morning Regimen
                              </span>
                              <p className="text-brand-mocha-900 font-medium">
                                {m.regimen.am.steps ? m.regimen.am.steps.join(' → ') : m.regimen.am}
                              </p>
                            </div>
                          )}
                          {m.regimen.pm && (
                            <div className="bg-white/90 p-3 rounded-lg border border-brand-silver">
                              <span className="font-mono-clinical uppercase text-[10px] font-bold text-brand-mocha flex items-center mb-1">
                                <Moon className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Evening Regimen
                              </span>
                              <p className="text-brand-mocha-900 font-medium">
                                {m.regimen.pm.steps ? m.regimen.pm.steps.join(' → ') : m.regimen.pm}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Recommended Products Showcase */}
                {recommendedProducts && recommendedProducts.length > 0 && (
                  <div className="p-4 bg-brand-lavender-light/40 border border-brand-lavender rounded-xl space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-clinical text-[11px] font-bold uppercase tracking-wider text-brand-mocha flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Sam&apos;s Recommended Botanical Products
                      </span>
                      <button
                        onClick={handleAddFullRegimen}
                        className="text-[11px] font-mono-clinical uppercase font-bold text-brand-mocha hover:underline cursor-pointer"
                      >
                        {regimenAdded ? '✓ Added to Cart!' : '+ Add All to Cart'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recommendedProducts.map((p) => {
                        const pid = p._id || p.id;
                        const isAdded = addedProductId === pid;
                        return (
                          <div
                            key={pid}
                            className="bg-white border border-brand-silver p-3 rounded-lg flex items-center space-x-3 shadow-2xs hover:border-brand-mocha transition-all"
                          >
                            <img
                              src={p.image || '/images/minimalist_hero_product.jpg'}
                              alt={p.name}
                              className="w-14 h-14 object-cover rounded-xs border border-brand-silver shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-serif-luxury font-medium text-xs text-brand-mocha-900 truncate">
                                {p.name}
                              </h5>
                              <span className="text-[10px] text-moss font-semibold block">
                                ₹{p.price}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className={`p-2 rounded-full border transition-all cursor-pointer shrink-0 ${
                                isAdded
                                  ? 'bg-moss text-white border-moss'
                                  : 'bg-brand-canvas text-brand-mocha border-brand-silver hover:bg-brand-mocha-900 hover:text-white'
                              }`}
                              title="Add to cart"
                            >
                              {isAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-brand-canvas border border-brand-silver p-3.5 rounded-2xl rounded-tl-xs flex items-center space-x-2 text-xs font-mono-clinical text-brand-mocha">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-100">●</span>
                      <span className="animate-pulse delay-200">●</span>
                      <span className="ml-2">Sam is analyzing botanical actives &amp; barrier compatibility...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Bottom Docked Input Pill (when in active conversation) */}
            {messages.length > 0 && (
              <div className="p-3 sm:p-4 border-t border-brand-silver bg-white shrink-0">
                <form onSubmit={handleSendChat} className="max-w-2xl mx-auto">
                  <div
                    className={`relative flex items-center w-full rounded-full bg-white border-2 transition-all duration-300 shadow-sm ${
                      isListening
                        ? 'border-red-500 ring-4 ring-red-100'
                        : 'border-[#E77843]/70 hover:border-[#E77843] focus-within:border-[#E77843] focus-within:ring-4 focus-within:ring-[#E77843]/15'
                    } p-1.5 pl-5 sm:pl-6`}
                  >
                    <input
                      type="text"
                      placeholder={isListening ? 'Listening...' : 'Ask follow-up or describe skin changes...'}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none pr-2 font-sans"
                      disabled={isLoading}
                    />
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleVoiceToggle}
                        title={isListening ? 'Stop voice' : 'Voice input'}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          isListening
                            ? 'text-red-500 bg-red-50 animate-pulse'
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !chatInput.trim()}
                        className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-600 hover:text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: REGIMEN PRESCRIPTION                                               */}
        {/* ========================================================================= */}
        {activeTab === 'regimen' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-brand-canvas">
            {!recommendedRegimen ? (
              <div className="text-center py-12">
                <p className="text-brand-mocha font-mono-clinical text-xs mb-4">
                  No active prescription formulated yet.
                </p>
                <button
                  onClick={() => setTab('chat')}
                  className="px-5 py-2.5 bg-brand-mocha-900 text-white text-xs font-mono-clinical uppercase rounded-xs cursor-pointer"
                >
                  Ask Sam to Formulate
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-white border border-brand-silver rounded-lg">
                  <span className="text-[10px] font-mono-clinical uppercase text-brand-mocha font-bold tracking-wider block">
                    Diagnostic Dossier
                  </span>
                  <h4 className="font-serif-luxury font-medium text-lg text-brand-mocha-900 mt-0.5">
                    Profile: {diagnosedProfile?.skinType || skinType} Skin • Concerns: {(diagnosedProfile?.primaryConcerns || concerns).join(', ')}
                  </h4>
                  <p className="text-xs text-brand-mocha/80 font-sans mt-1 leading-relaxed">
                    {explanation}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedRegimen.am && (
                    <div className="p-4 bg-white border border-brand-silver rounded-lg space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-mono-clinical font-bold text-amber-700 uppercase">
                        <Sun className="w-4 h-4" />
                        <span>AM Routine (Protect &amp; Cleanse)</span>
                      </div>
                      <p className="text-xs font-sans text-brand-mocha-900">
                        {recommendedRegimen.am.steps ? recommendedRegimen.am.steps.join(' → ') : recommendedRegimen.am}
                      </p>
                    </div>
                  )}

                  {recommendedRegimen.pm && (
                    <div className="p-4 bg-white border border-brand-silver rounded-lg space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-mono-clinical font-bold text-indigo-700 uppercase">
                        <Moon className="w-4 h-4" />
                        <span>PM Routine (Nourish &amp; Repair)</span>
                      </div>
                      <p className="text-xs font-sans text-brand-mocha-900">
                        {recommendedRegimen.pm.steps ? recommendedRegimen.pm.steps.join(' → ') : recommendedRegimen.pm}
                      </p>
                    </div>
                  )}
                </div>

                {recommendedProducts && recommendedProducts.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-mono-clinical uppercase text-brand-mocha-900 font-bold block">
                      Prescribed Products
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recommendedProducts.map((p) => (
                        <div
                          key={p._id || p.id}
                          className="p-3 bg-white border border-brand-silver rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={p.image || '/images/minimalist_hero_product.jpg'}
                              alt={p.name}
                              className="w-12 h-12 object-cover rounded-xs border border-brand-silver shrink-0"
                            />
                            <div>
                              <h5 className="font-serif-luxury text-xs font-bold text-brand-mocha-900">
                                {p.name}
                              </h5>
                              <span className="text-xs font-mono-clinical text-moss">₹{p.price}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(p)}
                            className="px-3 py-1.5 bg-brand-mocha-900 text-white hover:bg-brand-mocha text-[11px] font-mono-clinical uppercase rounded-xs cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFullRegimen}
                      className="w-full py-3.5 bg-brand-mocha-900 text-white hover:bg-brand-mocha text-xs font-mono-clinical uppercase tracking-wider font-semibold rounded-xs shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>{regimenAdded ? '✓ All Items Added to Cart!' : 'Add Complete Routine to Cart'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
