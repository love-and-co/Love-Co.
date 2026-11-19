import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Mic,
  ArrowRight,
  Sparkles,
  Check,
  ShoppingBag,
  Sun,
  Moon,
  MessageSquare,
  Sliders,
} from 'lucide-react';
import { useCopilotStore } from '../store/copilotStore';
import { useCartStore } from '../store/cartStore';

export default function AiConsultPage() {
  const {
    sendChatMessage,
    messages,
    recommendedProducts,
    recommendedRegimen,
    explanation,
    diagnosedProfile,
    skinType,
    concerns,
    isLoading,
    resetDiagnostic,
  } = useCopilotStore();

  const addItem = useCartStore((state) => state.addItem);
  const addMultipleItems = useCartStore((state) => state.addMultipleItems);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [addedProductId, setAddedProductId] = useState(null);
  const [regimenAdded, setRegimenAdded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

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
      alert('Speech recognition is not supported in this browser. Please type your query.');
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
        setInput(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const q = input.trim();
      setInput('');
      sendChatMessage(q);
    }
  };

  const handlePromptClick = (promptQuery) => {
    if (!isLoading) {
      setInput('');
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
    <>
      <Head>
        <title>Skin AI Assistant — Love &amp; Co.</title>
        <meta
          name="description"
          content="Meet Sam, your Love & Co. Skin AI Assistant. Ask questions and formulate a customized cold-pressed AM/PM routine."
        />
      </Head>

      <div className="min-h-[88vh] bg-[#FAF9F8] flex flex-col justify-between py-10 sm:py-16 px-4">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
          {/* If no messages yet: Render Minimalist Screenshot Hero UI */}
          {messages.length === 0 ? (
            <div className="text-center space-y-6 my-auto animate-in fade-in zoom-in-95 duration-300">
              {/* Brand Typography */}
              <div className="space-y-1">
                <Link href="/" className="inline-block group">
                  <span className="font-serif-luxury text-3xl sm:text-5xl font-extrabold tracking-[0.14em] text-brand-mocha-900 group-hover:text-brand-mocha transition-colors">
                    LOVE &amp; CO.
                  </span>
                </Link>
                <span className="font-mono-clinical text-[9px] uppercase tracking-[0.4em] text-brand-mocha/60 font-semibold block">
                  Botanical Lipid Atelier
                </span>
              </div>

              {/* Welcoming Greeting */}
              <div className="space-y-1 pt-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-neutral-900 tracking-tight flex items-center justify-center gap-2 font-sans">
                  <span>Welcome to Love &amp; Co.!</span>
                  <span className="inline-block animate-bounce">👋</span>
                </h1>
                <p className="text-sm sm:text-base text-neutral-500 font-sans">
                  I&apos;m Sam, your Skin AI Assistant.
                </p>
              </div>

              {/* Iconic Hero Input Pill with warm amber glow */}
              <form onSubmit={handleSend} className="max-w-xl w-full mx-auto pt-2">
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
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base text-neutral-800 placeholder-neutral-400 focus:outline-none pr-3 font-sans"
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleVoiceToggle}
                      title={isListening ? 'Stop voice' : 'Voice input'}
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
                      disabled={isLoading || !input.trim()}
                      className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-600 hover:text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-neutral-100 disabled:hover:text-neutral-600 cursor-pointer shrink-0"
                      aria-label="Send question"
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

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto pt-3">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePromptClick(p.query)}
                    className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-brand-silver hover:border-brand-mocha text-brand-mocha-900 hover:bg-brand-lavender-light transition-all shadow-2xs font-sans cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversational Feed */
            <div className="space-y-6">
              {/* Top Mini Brand Navigation */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-silver">
                <div className="flex items-center space-x-2">
                  <span className="font-serif-luxury font-bold text-base text-brand-mocha-900">
                    LOVE &amp; CO.
                  </span>
                  <span className="text-xs text-neutral-400 font-sans">•</span>
                  <span className="text-xs font-sans text-neutral-600 font-medium">
                    Sam Skin AI Assistant
                  </span>
                </div>
                <button
                  onClick={resetDiagnostic}
                  className="text-xs font-mono-clinical text-brand-mocha hover:underline cursor-pointer"
                >
                  Start New Consultation
                </button>
              </div>

              {/* Messages Thread */}
              <div className="space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] p-5 rounded-2xl ${
                        m.sender === 'user'
                          ? 'bg-brand-mocha-900 text-white rounded-tr-xs shadow-xs'
                          : 'bg-white border border-brand-silver text-brand-mocha-900 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="text-[10px] font-mono-clinical uppercase tracking-wider mb-1.5 text-brand-mocha/70">
                        {m.sender === 'user' ? 'You' : 'Sam • Skin AI'}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {m.text}
                      </p>

                      {/* Display Regimen AM/PM if provided */}
                      {m.regimen && (
                        <div className="mt-4 pt-3.5 border-t border-brand-silver/60 space-y-3 font-sans text-xs">
                          {m.regimen.am && (
                            <div className="bg-brand-canvas p-3.5 rounded-lg border border-brand-silver">
                              <span className="font-mono-clinical uppercase text-[10px] font-bold text-amber-800 flex items-center mb-1">
                                <Sun className="w-3.5 h-3.5 mr-1 text-amber-600" /> Morning Routine
                              </span>
                              <p className="text-brand-mocha-900 font-medium">
                                {m.regimen.am.steps ? m.regimen.am.steps.join(' → ') : m.regimen.am}
                              </p>
                            </div>
                          )}
                          {m.regimen.pm && (
                            <div className="bg-brand-canvas p-3.5 rounded-lg border border-brand-silver">
                              <span className="font-mono-clinical uppercase text-[10px] font-bold text-indigo-800 flex items-center mb-1">
                                <Moon className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Evening Routine
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

                {/* Recommended Products */}
                {recommendedProducts && recommendedProducts.length > 0 && (
                  <div className="p-5 bg-white border border-brand-silver rounded-2xl space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-clinical text-xs font-bold uppercase tracking-wider text-brand-mocha flex items-center">
                        <Sparkles className="w-4 h-4 mr-1.5" /> Sam&apos;s Prescribed Botanical Formulas
                      </span>
                      <button
                        onClick={handleAddFullRegimen}
                        className="text-xs font-mono-clinical uppercase font-bold text-brand-mocha hover:underline cursor-pointer"
                      >
                        {regimenAdded ? '✓ Added All to Cart!' : '+ Add Complete Routine'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recommendedProducts.map((p) => {
                        const pid = p._id || p.id;
                        const isAdded = addedProductId === pid;
                        return (
                          <div
                            key={pid}
                            className="bg-brand-canvas border border-brand-silver p-3.5 rounded-xl flex items-center space-x-3 shadow-2xs hover:border-brand-mocha transition-all"
                          >
                            <img
                              src={p.image || '/images/minimalist_hero_product.jpg'}
                              alt={p.name}
                              className="w-14 h-14 object-cover rounded-xs border border-brand-silver shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-serif-luxury font-medium text-xs sm:text-sm text-brand-mocha-900 truncate">
                                {p.name}
                              </h5>
                              <span className="text-xs text-moss font-semibold block">
                                ₹{p.price}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className={`p-2 rounded-full border transition-all cursor-pointer shrink-0 ${
                                isAdded
                                  ? 'bg-moss text-white border-moss'
                                  : 'bg-white text-brand-mocha border-brand-silver hover:bg-brand-mocha-900 hover:text-white'
                              }`}
                              title="Add to cart"
                            >
                              {isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
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
                    <div className="bg-white border border-brand-silver p-4 rounded-2xl rounded-tl-xs flex items-center space-x-2 text-xs font-mono-clinical text-brand-mocha shadow-2xs">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-100">●</span>
                      <span className="animate-pulse delay-200">●</span>
                      <span className="ml-2">Sam is cross-referencing botanical actives...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Fixed Input Pill for continuing conversation */}
              <div className="pt-6">
                <form onSubmit={handleSend} className="max-w-2xl mx-auto">
                  <div
                    className={`relative flex items-center w-full rounded-full bg-white border-2 transition-all duration-300 shadow-sm ${
                      isListening
                        ? 'border-red-500 ring-4 ring-red-100'
                        : 'border-[#E77843]/70 hover:border-[#E77843] focus-within:border-[#E77843] focus-within:ring-4 focus-within:ring-[#E77843]/15'
                    } p-2 pl-6`}
                  >
                    <input
                      type="text"
                      placeholder={isListening ? 'Listening...' : 'Ask follow-up or describe skin changes...'}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none pr-3 font-sans"
                      disabled={isLoading}
                    />
                    <div className="flex items-center space-x-1.5 shrink-0">
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
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-600 hover:text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
