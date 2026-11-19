import React, { useState } from 'react';
import { X, Truck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

const COURIER_PARTNERS = [
  'Delhivery Air',
  'BlueDart Express',
  'Shiprocket Surface',
  'DTDC Express',
  'India Post Speed Post',
];

export default function CourierDispatchModal({ isOpen, onClose, order, onDispatched }) {
  const [courierName, setCourierName] = useState(COURIER_PARTNERS[0]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleGenerateSampleAwb = () => {
    const randomAwb = `LCO-${Math.floor(100000000 + Math.random() * 900000000)}`;
    setTrackingNumber(randomAwb);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const awb = trackingNumber.trim() || `LCO-${Date.now().toString().slice(-8)}`;
      const res = await api.dispatchOrder(order._id || order.id, {
        courierName,
        trackingNumber: awb,
      });

      if (res.data?.success) {
        if (onDispatched) onDispatched(res.data.order);
        onClose();
      } else {
        setError(res.data?.error || 'Failed to dispatch order');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Dispatch error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1C1614]/70 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] border border-[#C5A880]/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-sans text-[#1C1614] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1C1614] text-[#FAF8F5] px-6 py-4 flex items-center justify-between border-b border-[#C5A880]/30">
          <div className="flex items-center space-x-2.5">
            <Truck className="w-5 h-5 text-[#C5A880]" />
            <h2 className="font-serif text-base tracking-wider uppercase text-[#FAF8F5]">
              Dispatch Order #{order.orderNumber}
            </h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
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

          {/* Customer destination snippet */}
          <div className="p-3 bg-stone-100/80 rounded-xl text-xs space-y-1 border border-stone-200">
            <span className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">Destination:</span>
            <p className="font-semibold text-stone-900">
              {order.shippingAddress?.fullName || order.customer?.fullName || 'Valued Client'}
            </p>
            <p className="text-stone-600 text-[11px]">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-stone-600 mb-1.5">
              Courier Partner:
            </label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#C5A880] text-[#1C1614]"
            >
              {COURIER_PARTNERS.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-stone-600">
                Courier Tracking / AWB Number:
              </label>
              <button
                type="button"
                onClick={handleGenerateSampleAwb}
                className="text-[10px] text-[#C5A880] hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate AWB</span>
              </button>
            </div>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. DEL-889104829 or BlueDart AWB"
              className="w-full text-xs font-mono px-3 py-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#C5A880] text-[#1C1614]"
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
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-[#1C1614] hover:bg-black text-[#FAF8F5] border border-[#C5A880]/40 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Truck className="w-4 h-4 text-[#C5A880]" />
            <span>{loading ? 'Dispatching...' : 'Dispatch & Add AWB'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
