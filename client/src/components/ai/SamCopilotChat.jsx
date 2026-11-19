import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  ShoppingBag,
  Check,
  ShieldCheck,
  ExternalLink,
  Leaf,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useCopilotStore } from '../../store/copilotStore';
import { useCartStore } from '../../store/cartStore';

// ─────────────────────────────────────────────────────────────
// MARKDOWN RENDERER — clinical apothecary typography
// ─────────────────────────────────────────────────────────────
function formatInlineMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-brand-mocha-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-brand-mocha-700">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-brand-lavender/40 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
}

function MarkdownMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const t = line.trim();
        if (!t) return <div key={idx} className="h-1" />;

        if (t.startsWith('### '))
          return (
            <h4 key={idx} className="text-[11px] font-mono-clinical uppercase tracking-widest font-bold text-brand-mocha-900 pt-2 pb-0.5 border-b border-brand-silver/50">
              {t.replace('### ', '')}
            </h4>
          );

        if (t.startsWith('#### '))
          return (
            <h5 key={idx} className="text-[11px] font-mono-clinical font-bold text-brand-mocha-700 pt-1 flex items-center gap-1">
              <Leaf className="w-3 h-3 shrink-0" />
              {t.replace('#### ', '')}
            </h5>
          );

        if (t.startsWith('- ') || t.startsWith('* '))
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1 w-1 h-1 rounded-full bg-brand-mocha-400 shrink-0" />
              <div className="flex-1 text-[13px]" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(t.substring(2)) }} />
            </div>
          );

        if (/^\d+\.\s/.test(t)) {
          const [num, ...rest] = t.split('. ');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="font-mono-clinical text-[10px] font-bold text-brand-mocha-600 shrink-0 mt-0.5">{num}.</span>
              <div className="flex-1 text-[13px]" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(rest.join('. ')) }} />
            </div>
          );
        }

        // italic disclaimer
        if (t.startsWith('*') && t.endsWith('*') && !t.startsWith('**'))
          return <p key={idx} className="text-[11px] text-brand-mocha-500/80 italic pt-1">{t.slice(1, -1)}</p>;

        return (
          <p key={idx} className="text-[13px]" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(t) }} />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// IN-CHAT PRODUCT RECOMMENDATION CARD
// ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, justAdded }) {
  return (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white border border-brand-silver/80 hover:border-brand-mocha/40 rounded-xl p-3 shadow-sm transition-all">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-brand-canvas border border-brand-silver/30 shrink-0 overflow-hidden flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Sparkles className="w-5 h-5 text-brand-mocha-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[12px] font-serif-clinical font-bold text-brand-mocha-900 leading-tight">{product.name}</span>
          {product.volume && (
            <span className="text-[10px] font-mono-clinical text-brand-mocha-500 bg-brand-silver-light px-1.5 py-0.5 rounded-full border border-brand-silver/50">
              {product.volume}
            </span>
          )}
        </div>
        <div className="text-[12px] font-mono-clinical font-bold text-brand-mocha-900 mt-0.5">₹{product.price}</div>
        {product.reason && (
          <p className="text-[11px] text-brand-mocha-600 leading-snug mt-0.5 line-clamp-2">{product.reason}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <button
          onClick={() => onAddToCart(product)}
          disabled={justAdded}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono-clinical font-semibold transition-all cursor-pointer shadow-sm whitespace-nowrap ${
            justAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-brand-mocha-900 text-white hover:bg-brand-mocha hover:shadow-md active:scale-95'
          }`}
        >
          {justAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5 text-brand-lavender-light" />}
          <span>{justAdded ? 'Added ✓' : 'Add to Cart'}</span>
        </button>
        <Link
          href={`/product/${product.slug}`}
          onClick={() => {}} // keep chat open; user navigates via new-tab intent
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-brand-mocha-400 hover:text-brand-mocha-900 hover:bg-brand-silver-light rounded-lg transition-colors"
          title="View product"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-white border border-brand-silver/50 rounded-2xl rounded-tl-sm w-fit shadow-xs max-w-[85%]">
      <Sparkles className="w-3.5 h-3.5 text-brand-mocha animate-pulse shrink-0" />
      <span className="text-[12px] font-mono-clinical text-brand-mocha-600 italic">Sam is analyzing your concern…</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-brand-mocha-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function SamCopilotChat() {
  const {
    isOpen,
    closeCopilot,
    messages,
    sendSamMessage,
    isLoading,
    clearChatHistory,
  } = useCopilotStore();

  const addItem   = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const [input, setInput]       = useState('');
  const [addedSlugs, setAddedSlugs] = useState({}); // { [slug]: true }
  const [showQuickOptions, setShowQuickOptions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Handlers ───────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;
    setInput('');
    sendSamMessage(query);
  };

  const handleQuickReply = (text) => {
    if (isLoading) return;
    sendSamMessage(text);
  };

  const handleAddToCart = (product) => {
    const cartProduct = {
      _id:    product.slug,
      id:     product.slug,
      slug:   product.slug,
      name:   product.name,
      price:  product.price,
      images: [{ url: product.image || '/images/products/bloom_neem_turmeric_soap.jpg' }],
    };
    addItem(cartProduct, 1, product.volume || '100g');

    // "Added ✓" flash for this slug
    setAddedSlugs((prev) => ({ ...prev, [product.slug]: true }));
    setTimeout(() => {
      setAddedSlugs((prev) => { const n = { ...prev }; delete n[product.slug]; return n; });
    }, 2500);

    // Open cart drawer so user sees the item appear
    setTimeout(() => openDrawer(), 300);
  };

  // Collect latest quick replies from messages
  const latestQuickReplies = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const qr = messages[i]?.actionPayload?.quickReplies;
      if (Array.isArray(qr) && qr.length > 0) return qr;
    }
    return ['Acne & oily skin', 'Dry skin & peeling lips', 'Beach tan & dark spots', 'Lip care'];
  })();

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-mocha-900/35 backdrop-blur-sm"
        onClick={closeCopilot}
        aria-hidden
      />

      {/* Chat Panel */}
      <div className="relative w-full max-w-md sm:max-w-lg flex flex-col h-full bg-white shadow-2xl border-l border-brand-silver z-10">

        {/* ── Header ── */}
        <div className="shrink-0 px-5 py-3.5 bg-brand-mocha-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative w-9 h-9 rounded-full bg-brand-mocha-800 border border-brand-silver/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-brand-lavender" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-brand-mocha-900 rounded-full" />
            </div>
            {/* Name block */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-serif-clinical font-medium tracking-tight">Sam • Love &amp; Co.</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono-clinical uppercase tracking-wider bg-brand-mocha-800 text-brand-lavender border border-brand-mocha-700 rounded">
                  AI Skin Expert
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={clearChatHistory}
              title="New consultation"
              className="p-2 text-brand-silver/70 hover:text-white hover:bg-brand-mocha-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={closeCopilot}
              title="Close"
              className="p-2 text-brand-silver/70 hover:text-white hover:bg-brand-mocha-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Chat Feed ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FAFAF9]">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user' || msg.sender === 'user';

            return (
              <div key={msg.id || idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>

                {/* Message bubble */}
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-xs ${
                    isUser
                      ? 'bg-brand-mocha-900 text-white rounded-tr-sm'
                      : 'bg-white border border-brand-silver/70 text-brand-mocha-900 rounded-tl-sm'
                  }`}
                >
                  {/* Sam label strip */}
                  {!isUser && (
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-brand-silver/30 text-[10px] font-mono-clinical text-brand-mocha-500 uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-brand-mocha" />
                      Botanical Prescription
                    </div>
                  )}

                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <MarkdownMessage text={msg.text} />
                  )}

                  {/* Timestamp */}
                  <div className={`text-[9px] font-mono-clinical mt-1.5 select-none ${isUser ? 'text-brand-silver/70 text-right' : 'text-brand-mocha-400'}`}>
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </div>
                </div>

                {/* Product recommendation cards */}
                {!isUser && Array.isArray(msg.actionPayload?.recommendedProducts) && msg.actionPayload.recommendedProducts.length > 0 && (
                  <div className="w-full max-w-[95%] mt-2 space-y-2">
                    <div className="text-[10px] font-mono-clinical uppercase tracking-wider text-brand-mocha-500 font-bold px-0.5">
                      Prescribed Products:
                    </div>
                    {msg.actionPayload.recommendedProducts.map((prod, pIdx) => (
                      <ProductCard
                        key={pIdx}
                        product={prod}
                        onAddToCart={handleAddToCart}
                        justAdded={!!addedSlugs[prod.slug]}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start">
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Reply Pills ── */}
        <div className="shrink-0 px-3.5 py-1.5 bg-[#FAF9F8] border-t border-brand-silver/40 transition-all">
          <div
            onClick={() => setShowQuickOptions((prev) => !prev)}
            className="flex items-center justify-between cursor-pointer select-none py-0.5 group"
            title={showQuickOptions ? 'Collapse quick options' : 'Expand quick options'}
          >
            <span className="text-[8.5px] font-mono-clinical uppercase tracking-widest text-brand-mocha-900/60 font-bold group-hover:text-brand-mocha-900 transition-colors">
              Quick Diagnostic Options
            </span>
            <button
              type="button"
              className="p-0.5 rounded text-brand-mocha-900/60 group-hover:text-brand-mocha transition-all cursor-pointer"
              aria-label={showQuickOptions ? 'Collapse options' : 'Expand options'}
            >
              {showQuickOptions ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {showQuickOptions && (
            <div className="flex flex-wrap gap-1.5 pt-1.5 animate-fadeIn">
              {latestQuickReplies.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReply(qr)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono-clinical font-medium bg-[#E6E0F0] border border-[#D4CCE2] text-brand-mocha-900 hover:bg-[#DDD4EA] hover:border-brand-mocha rounded-full transition-all duration-150 cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-2xs active:scale-95 leading-none"
                >
                  <span className="w-1 h-1 rounded-full bg-brand-mocha shrink-0" />
                  <span>{qr}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Input Bar ── */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 flex items-center gap-2 px-3 py-3 bg-white border-t border-brand-silver"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your skin concern to Sam…"
            disabled={isLoading}
            className="flex-1 bg-brand-canvas/50 border border-brand-silver rounded-xl px-3.5 py-2.5 text-[13px] text-brand-mocha-900 placeholder-brand-mocha-400 focus:outline-none focus:ring-1 focus:ring-brand-mocha focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-brand-mocha-900 text-white hover:bg-brand-mocha flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4 text-brand-lavender-light" />
          </button>
        </form>
      </div>
    </div>
  );
}
