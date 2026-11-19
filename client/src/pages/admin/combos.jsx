import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Package,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  Gift,
  X
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../lib/api';

export default function RitualBundlesPage() {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for New/Edit Combo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    price: 999,
    compareAtPrice: 1350,
    stock: 25,
    badge: 'Save ₹351',
    selectedItems: [],
    images: [{ url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800' }],
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCombosAndProducts = async () => {
    try {
      setLoading(true);
      const [comboRes, prodRes] = await Promise.all([
        api.getCombos(),
        api.getAdminProducts(),
      ]);

      if (comboRes.data?.success) {
        setCombos(comboRes.data.combos || []);
      }
      if (prodRes.data?.success) {
        setProducts(prodRes.data.products || []);
      }
    } catch (err) {
      console.warn('Failed to load combos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombosAndProducts();
  }, []);

  const openNewModal = () => {
    setEditingCombo(null);
    setFormData({
      name: '',
      subtitle: 'Artisanal Botanical Trio',
      description: 'A luxurious three-bar cold-pressed soap ritual preserving essential fatty acids and natural cold-process glycerin.',
      price: 999,
      compareAtPrice: 1250,
      stock: 25,
      badge: 'Save ₹251',
      selectedItems: products.slice(0, 3).map((p) => ({ product: p._id, quantity: 1, variant: '100g Bar' })),
      images: [{ url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800' }],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      subtitle: combo.subtitle || '',
      description: combo.description || '',
      price: combo.price,
      compareAtPrice: combo.compareAtPrice || combo.price,
      stock: combo.stock || 25,
      badge: combo.badge || '',
      selectedItems: (combo.items || []).map((i) => ({
        product: i.product?._id || i.product,
        quantity: i.quantity || 1,
        variant: i.variant || '100g Bar',
      })),
      images: combo.images && combo.images.length > 0 ? combo.images : [{ url: '' }],
    });
    setIsModalOpen(true);
  };

  const handlePriceChange = (price, compareAtPrice) => {
    const p = Number(price);
    const cmp = Number(compareAtPrice);
    const savings = cmp > p ? cmp - p : 0;
    setFormData((prev) => ({
      ...prev,
      price: p,
      compareAtPrice: cmp,
      badge: savings > 0 ? `Save ₹${savings}` : prev.badge,
    }));
  };

  const handleToggleProductInCombo = (productId) => {
    setFormData((prev) => {
      const exists = prev.selectedItems.some((i) => i.product === productId);
      if (exists) {
        return {
          ...prev,
          selectedItems: prev.selectedItems.filter((i) => i.product !== productId),
        };
      } else {
        return {
          ...prev,
          selectedItems: [...prev.selectedItems, { product: productId, quantity: 1, variant: '100g Bar' }],
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Bundle name is required');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      if (editingCombo) {
        await api.updateCombo(editingCombo._id, formData);
        setSuccessMsg(`Updated bundle: ${formData.name}`);
      } else {
        await api.createCombo(formData);
        setSuccessMsg(`Created new ritual bundle: ${formData.name}`);
      }

      setIsModalOpen(false);
      fetchCombosAndProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error saving bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCombo = async (combo) => {
    if (!window.confirm(`Delete Ritual Bundle "${combo.name}"?`)) return;

    try {
      const res = await api.deleteCombo(combo._id);
      if (res.data?.success) {
        setCombos((prev) => prev.filter((c) => c._id !== combo._id));
        setSuccessMsg('Ritual bundle removed.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to delete bundle');
    }
  };

  return (
    <AdminLayout pageTitle="Ritual Bundles">
      <Head>
        <title>Ritual Bundles &amp; Trios | Love &amp; Co. Flagship</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-serif tracking-widest text-[#C5A880] uppercase">
              <span>Catalog Studio</span>
              <span>/</span>
              <span>Ritual Bundles &amp; Trios</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1C1614] font-normal tracking-wide mt-1">
              Ritual Bundles &amp; Gift Sets
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Curate multi-bar gift boxes, calculate customer savings automatically &amp; manage trio allocations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchCombosAndProducts}
              className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-700 transition-colors shadow-sm flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-[#1C1614] hover:bg-black text-[#FAF8F5] border border-[#C5A880]/40 rounded-xl text-xs font-serif tracking-wider uppercase transition-all shadow-sm flex items-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Curate New Bundle</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Combos Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin" />
            Loading curated ritual bundles...
          </div>
        ) : combos.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 space-y-3">
            <Layers className="w-12 h-12 mx-auto text-stone-300" />
            <p className="font-serif text-base text-[#1C1614]">No Ritual Bundles Created Yet</p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Combine 3 bestseller cold-pressed bars into an alluring ritual gift set with custom savings badges.
            </p>
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-[#1C1614] text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-wider"
            >
              Create First Trio Bundle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combos.map((combo) => {
              const savings = (combo.compareAtPrice && combo.compareAtPrice > combo.price)
                ? combo.compareAtPrice - combo.price
                : 0;

              return (
                <div
                  key={combo._id}
                  className="bg-white border border-[#C5A880]/30 rounded-2xl overflow-hidden shadow-sm hover:border-[#C5A880] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Banner */}
                    <div className="h-44 w-full bg-stone-100 relative overflow-hidden">
                      {combo.images && combo.images[0]?.url ? (
                        <img
                          src={combo.images[0].url}
                          alt={combo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Layers className="w-10 h-10" />
                        </div>
                      )}
                      {combo.badge && (
                        <div className="absolute top-3 right-3 bg-[#1C1614] text-[#C5A880] text-[10px] font-serif uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#C5A880]/40 shadow-md">
                          {combo.badge}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A880] font-semibold">
                          {combo.subtitle || 'Ritual Trio'}
                        </span>
                        <h3 className="font-serif text-lg text-[#1C1614] font-medium mt-0.5">
                          {combo.name}
                        </h3>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {combo.description}
                      </p>

                      {/* Items in Combo */}
                      <div className="space-y-1 pt-2 border-t border-stone-100 text-xs">
                        <span className="text-[10px] uppercase font-serif text-stone-400 tracking-wider">
                          Includes {combo.items?.length || 0} Formulations:
                        </span>
                        {(combo.items || []).map((itm, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-stone-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                            <span className="truncate">{itm.product?.name || 'Botanical Bar'}</span>
                            <span className="text-stone-400 text-[10px]">({itm.quantity}x)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Pricing & Actions */}
                  <div className="p-5 pt-0 border-t border-stone-100 mt-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="font-mono text-base font-bold text-[#1C1614]">₹{combo.price}</span>
                        {combo.compareAtPrice > combo.price && (
                          <span className="font-mono text-xs text-stone-400 line-through">
                            ₹{combo.compareAtPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">Stock: {combo.stock || 25} boxes</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => openEditModal(combo)}
                        className="p-2 text-stone-600 hover:text-[#1C1614] rounded-lg hover:bg-stone-100 transition-colors"
                        title="Edit Bundle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCombo(combo)}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Bundle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Curate / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1C1614]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#C5A880]/30 w-full max-w-2xl rounded-2xl shadow-2xl p-6 font-sans text-[#1C1614] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-base tracking-wider uppercase font-semibold text-[#1C1614]">
                {editingCombo ? 'Edit Ritual Bundle' : 'Curate New Botanical Bundle / Trio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-[#1C1614]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Bundle Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. The Signature Botanical Trio"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Subtitle / Eyebrow
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Cold-Pressed Saponified Trio"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Bundle Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => handlePriceChange(e.target.value, formData.compareAtPrice)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Compare At MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={(e) => handlePriceChange(formData.price, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Auto Savings Badge
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Bundle Stock Allocation
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Product Selection Checklist */}
              <div>
                <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1.5">
                  Select Botanical Bars Included ({formData.selectedItems.length} selected):
                </label>
                <div className="max-h-44 overflow-y-auto space-y-1.5 border border-stone-200 rounded-xl p-3 bg-white">
                  {products.map((p) => {
                    const isSelected = formData.selectedItems.some((i) => i.product === p._id);
                    return (
                      <label
                        key={p._id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#C5A880]/15 border-[#C5A880] font-medium' : 'hover:bg-stone-50 border-stone-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProductInCombo(p._id)}
                            className="accent-[#1C1614]"
                          />
                          <span>{p.name}</span>
                        </div>
                        <span className="font-mono text-stone-500">₹{p.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                  Box Image URL
                </label>
                <input
                  type="url"
                  value={formData.images[0]?.url || ''}
                  onChange={(e) => setFormData({ ...formData, images: [{ url: e.target.value }] })}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-[#1C1614]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl font-serif uppercase tracking-wider"
                >
                  {saving ? 'Saving...' : 'Save Ritual Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
