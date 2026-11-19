import React, { useState } from 'react';
import { X, Package, AlertTriangle, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

export default function LowStockRestockModal({ isOpen, onClose, lowStockSKUs = [], onRestocked }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRestock = async ({ incrementAmount = 0, targetStock = 0, productIds = [] }) => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await api.bulkRestock({
        productIds,
        incrementAmount,
        targetStock,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Restocked successfully');
        if (onRestocked) onRestocked();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.data?.error || 'Failed to restock');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Restock failed');
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
            <Package className="w-5 h-5 text-[#C5A880]" />
            <h2 className="font-serif text-base tracking-wider uppercase text-[#FAF8F5]">
              Restock Low Inventory SKUs
            </h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <p className="text-xs text-stone-600">
            There are currently <strong className="text-[#1C1614]">{lowStockSKUs.length} SKUs</strong> below 10 units in the active catalog. Select a batch restock increment or bring all to the standard batch reserve (50 units).
          </p>

          {/* Quick SKU overview list */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-stone-200 rounded-xl p-3 bg-white">
            {lowStockSKUs.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-2">All SKUs healthy (&gt; 10 units)</p>
            ) : (
              lowStockSKUs.map((sku) => (
                <div key={sku._id} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-none">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-serif truncate">{sku.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-rose-600 font-semibold">{sku.currentStock} units</span>
                    <button
                      disabled={loading}
                      onClick={() => handleRestock({ incrementAmount: 10, productIds: [sku._id] })}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-[#C5A880]/20 text-[10px] rounded font-medium text-stone-700 hover:text-[#1C1614] transition-colors"
                    >
                      +10
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bulk Action Buttons */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-stone-500">
              Bulk Actions Across All {lowStockSKUs.length} Low SKUs:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading || lowStockSKUs.length === 0}
                onClick={() => handleRestock({ incrementAmount: 5 })}
                className="py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-[#1C1614] transition-all hover:border-[#C5A880]"
              >
                +5 to All
              </button>
              <button
                type="button"
                disabled={loading || lowStockSKUs.length === 0}
                onClick={() => handleRestock({ incrementAmount: 10 })}
                className="py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-[#1C1614] transition-all hover:border-[#C5A880]"
              >
                +10 to All
              </button>
              <button
                type="button"
                disabled={loading || lowStockSKUs.length === 0}
                onClick={() => handleRestock({ incrementAmount: 50 })}
                className="py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-[#1C1614] transition-all hover:border-[#C5A880]"
              >
                +50 to All
              </button>
            </div>

            <button
              type="button"
              disabled={loading || lowStockSKUs.length === 0}
              onClick={() => handleRestock({ targetStock: 50 })}
              className="w-full mt-2 py-3 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-widest transition-all border border-[#C5A880]/50 shadow-md flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span>Restock All Low SKUs to 50 Units</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
