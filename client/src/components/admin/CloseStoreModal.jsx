import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { api } from '../../lib/api';

const PRESET_REASONS = [
  {
    title: 'Batch Curing & Lipid Saponification',
    notice: 'Our cold-process botanical cure room is currently completing lipid saponification. Orders are temporarily paused and will resume shortly.',
    durationDays: 14,
  },
  {
    title: 'Annual Botanical Rest & Holiday Break',
    notice: 'Our Bangalore apothecary atelier is resting for the seasonal holidays. We reopen fresh for new botanical batches on the date below.',
    durationDays: 7,
  },
  {
    title: 'Artisanal Inventory Restock & Quality Check',
    notice: 'Catalog dispatch is briefly paused for annual formulation inventory audit and clinical QC testing. Browsing remains active.',
    durationDays: 3,
  },
];

export default function CloseStoreModal({ isOpen, onClose, currentStatus, onStatusUpdated }) {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [pauseReason, setPauseReason] = useState('');
  const [reopenDate, setReopenDate] = useState('');
  const [pauseNotice, setPauseNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentStatus) {
      setIsPaused(Boolean(currentStatus.isPaused));
      setPauseReason(currentStatus.pauseReason || PRESET_REASONS[0].title);
      setReopenDate(currentStatus.reopenDate || '');
      setPauseNotice(currentStatus.pauseNotice || PRESET_REASONS[0].notice);
    }
  }, [currentStatus]);

  if (!isOpen) return null;

  const handleApplyPreset = (idx) => {
    setSelectedPreset(idx);
    const p = PRESET_REASONS[idx];
    setPauseReason(p.title);
    setPauseNotice(p.notice);

    const d = new Date();
    d.setDate(d.getDate() + p.durationDays);
    setReopenDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (targetPausedState) => {
    try {
      setSaving(true);
      setError('');

      const payload = {
        isPaused: targetPausedState,
        pauseReason: targetPausedState ? pauseReason : '',
        reopenDate: targetPausedState ? reopenDate : '',
        pauseNotice: targetPausedState ? pauseNotice : '',
      };

      const res = await api.updateStoreStatus(payload);
      if (res.data?.success) {
        setIsPaused(targetPausedState);
        if (onStatusUpdated) onStatusUpdated(res.data.storeStatus);
        onClose();
      } else {
        setError(res.data?.error || 'Failed to update store status');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error updating status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1C1614]/70 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] border border-[#C5A880]/30 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden font-sans text-[#1C1614] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1C1614] text-[#FAF8F5] px-6 py-5 flex items-center justify-between border-b border-[#C5A880]/30">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <div>
              <h2 className="text-base font-serif tracking-wider uppercase text-[#FAF8F5]">
                {isPaused ? 'Storefront is Paused' : 'Live Storefront Controls'}
              </h2>
              <p className="text-xs text-[#C5A880] tracking-wide">
                Control customer checkout and holiday/curing notices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start justify-between ${
            isPaused
              ? 'bg-amber-50/80 border-amber-200/80 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
          }`}>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="font-semibold text-xs tracking-wider uppercase">
                  {isPaused ? 'Currently: Paused / Cure Mode' : 'Currently: Storefront Live & Taking Orders'}
                </span>
              </div>
              <p className="text-xs mt-1 text-stone-600">
                {isPaused
                  ? 'Checkout is temporarily blocked on the customer storefront. Visitors see the announcement banner below.'
                  : 'Customers across India can freely add botanical soaps to cart and proceed to checkout.'}
              </p>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-stone-600">
              Quick Preset Notice:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(idx)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedPreset === idx
                      ? 'border-[#C5A880] bg-[#C5A880]/10 text-[#1C1614] font-medium shadow-sm'
                      : 'border-stone-200 bg-white hover:border-[#C5A880]/50 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif">{preset.title}</span>
                    <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      ~{preset.durationDays} Days
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-stone-600 mb-1">
                Pause Reason / Headline
              </label>
              <input
                type="text"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Batch Curing & Lipid Saponification"
                className="w-full text-xs px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A880] text-[#1C1614]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-stone-600 mb-1">
                Estimated Reopening Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={reopenDate}
                  onChange={(e) => setReopenDate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A880] text-[#1C1614]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-stone-600 mb-1">
                Customer Storefront Banner Announcement
              </label>
              <textarea
                rows={3}
                value={pauseNotice}
                onChange={(e) => setPauseNotice(e.target.value)}
                placeholder="Message displayed prominently across the top of the storefront..."
                className="w-full text-xs px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A880] text-[#1C1614]"
              />
            </div>

            {/* Live Customer Preview */}
            <div className="border border-dashed border-[#C5A880]/40 rounded-xl p-3 bg-stone-50">
              <div className="flex items-center justify-between text-[10px] text-stone-500 uppercase tracking-widest font-semibold mb-1.5">
                <span>Customer Storefront Preview</span>
                <span className="text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">Top Banner</span>
              </div>
              <div className="bg-[#1C1614] text-[#FAF8F5] p-3 rounded-lg text-xs font-serif text-center space-y-1">
                <div className="text-[#C5A880] text-[11px] uppercase tracking-widest">
                  🌿 {pauseReason || 'Apothecary Notice'}
                </div>
                <p className="text-[11px] text-stone-300 font-sans leading-relaxed">
                  {pauseNotice || 'Orders temporarily paused.'}
                </p>
                {reopenDate && (
                  <p className="text-[10px] text-[#C5A880] font-sans">
                    Resuming dispatch on: {new Date(reopenDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100/80 px-6 py-4 flex items-center justify-between border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-stone-600 hover:text-[#1C1614] font-medium transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            {isPaused ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmit(false)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saving ? 'Opening...' : 'Reopen Storefront Now'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmit(true)}
                className="px-4 py-2.5 bg-[#1C1614] hover:bg-black text-[#FAF8F5] border border-[#C5A880]/40 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>{saving ? 'Pausing...' : 'Confirm & Pause Storefront'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
