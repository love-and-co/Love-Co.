import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';

const CANCELLATION_REASONS = [
  'Customer requested cancellation before courier handover',
  'Delivery address invalid or incomplete PIN code',
  'Duplicate accidental checkout by customer',
  'Payment verification anomaly / Fraud prevention',
  'Batch quality re-inspection hold in cure room',
];

export default function CancellationReasonModal({ isOpen, onClose, order, onCancelled }) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
      const res = await api.cancelOrder(order._id || order.id, { reason: finalReason });

      if (res.data?.success) {
        if (onCancelled) onCancelled(res.data.order);
        onClose();
      } else {
        setError(res.data?.error || 'Failed to cancel order');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error processing cancellation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1C1614]/70 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] border border-rose-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-sans text-[#1C1614] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-900 text-rose-50 px-6 py-4 flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-300" />
            <h2 className="font-serif text-base tracking-wider uppercase">
              Cancel Order #{order.orderNumber}
            </h2>
          </div>
          <button onClick={onClose} className="text-rose-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Atomic stock restoration callout */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
            <RotateCcw className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Automatic Stock Return Activated</p>
              <p className="mt-0.5 text-stone-600 text-[11px] leading-relaxed">
                Cancelling will trigger an atomic inventory rollback (<code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">$inc</code> via Promise.allSettled), immediately restoring all item quantities to the active catalog.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-stone-600">
              Select Reason:
            </label>
            <div className="space-y-1.5">
              {CANCELLATION_REASONS.map((reason, idx) => (
                <label
                  key={idx}
                  className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-[#C5A880] bg-[#C5A880]/10 text-[#1C1614] font-medium'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-[#1C1614]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-stone-600 mb-1">
              Or Custom Notes (Optional):
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Internal operational notes regarding this cancellation..."
              className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 px-6 py-4 flex items-center justify-between border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-stone-600 hover:text-[#1C1614] font-medium"
          >
            Go Back
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5"
          >
            <span>{loading ? 'Rolling back...' : 'Confirm Cancellation & Rollback Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
