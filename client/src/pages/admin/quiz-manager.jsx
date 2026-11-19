import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Sparkles,
  Plus,
  Sun,
  Moon,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Search
} from 'lucide-react';
import AdminLayout from '../../modules/admin/components/AdminLayout';
import { api } from '../../lib/api';
import { INITIAL_PRODUCTS, INITIAL_QUIZ_RULES } from '../../modules/admin/data/mockSeed';

const CONCERNS = ['Acne', 'Barrier Repair', 'Pigmentation', 'Aging', 'Oil Control', 'Dryness'];
const SKIN_TYPES = ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'];

export default function AdminQuizManagerPage() {
  const [rules, setRules] = useState(INITIAL_QUIZ_RULES);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [form, setForm] = useState({
    concern: 'Acne',
    skinType: 'Oily',
    adviceHeadline: '',
    amProducts: [],
    pmProducts: [],
    warningInput: '',
    contraindicationWarnings: [],
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.getQuizRules();
      if (res.data?.success && res.data.rules && res.data.rules.length > 0) {
        setRules(res.data.rules);
      }
    } catch (err) {
      console.warn('API error, using initial quiz rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const getProductTitle = (idOrObj) => {
    if (!idOrObj) return 'Formulation';
    if (typeof idOrObj === 'object') return idOrObj.title || 'Formulation';
    const found = products.find((p) => p._id === idOrObj);
    return found ? found.title : idOrObj;
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setForm({
      concern: 'Acne & Blemishes',
      skinType: 'Oily',
      adviceHeadline: 'Botanical Clarifying & Neem Purification Ritual',
      amProducts: ['prod_bloom', 'prod_velisse'],
      pmProducts: ['prod_bloom'],
      warningInput: '',
      contraindicationWarnings: ['Use lukewarm water to lather the cold-process soap gently; avoid aggressive physical scrubbing.'],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    const am = (rule.recommendedRoutine?.am || []).map((p) => (typeof p === 'object' ? p._id : p));
    const pm = (rule.recommendedRoutine?.pm || []).map((p) => (typeof p === 'object' ? p._id : p));

    setForm({
      concern: rule.concern || 'Acne',
      skinType: rule.skinType || 'Oily',
      adviceHeadline: rule.adviceHeadline || '',
      amProducts: am,
      pmProducts: pm,
      warningInput: '',
      contraindicationWarnings: rule.activeContraindicationWarnings || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!form.adviceHeadline.trim()) {
      alert('Please provide a clinical advice headline for this regimen');
      return;
    }

    const payload = {
      id: editingRule ? editingRule._id : undefined,
      concern: form.concern,
      skinType: form.skinType,
      adviceHeadline: form.adviceHeadline,
      recommendedProductIds: Array.from(new Set([...form.amProducts, ...form.pmProducts])),
      recommendedRoutine: {
        am: form.amProducts,
        pm: form.pmProducts,
      },
      activeContraindicationWarnings: form.contraindicationWarnings,
    };

    try {
      await api.saveQuizRule(payload);
    } catch (e) {
      // client fallback
    }

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r._id === editingRule._id
            ? { ...r, ...payload, _id: editingRule._id }
            : r
        )
      );
      showToast(`Rule updated for ${form.concern} (${form.skinType})`);
    } else {
      const newRule = {
        _id: `rule_${Date.now().toString().slice(-4)}`,
        ...payload,
      };
      setRules([newRule, ...rules]);
      showToast(`Created new routine rule for ${form.concern}`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteRule = async (id) => {
    if (confirm('Delete this skin quiz recommendation rule?')) {
      try {
        await api.deleteQuizRule(id);
      } catch (e) {
        // simulation fallback
      }
      setRules((prev) => prev.filter((r) => r._id !== id));
      showToast('Recommendation rule deleted');
    }
  };

  const toggleProductInList = (listType, productId) => {
    const key = listType === 'AM' ? 'amProducts' : 'pmProducts';
    const list = [...form[key]];
    const idx = list.indexOf(productId);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
    }
    setForm({ ...form, [key]: list });
  };

  const handleAddWarning = () => {
    if (form.warningInput.trim()) {
      setForm({
        ...form,
        contraindicationWarnings: [...form.contraindicationWarnings, form.warningInput.trim()],
        warningInput: '',
      });
    }
  };

  const handleRemoveWarning = (idx) => {
    setForm({
      ...form,
      contraindicationWarnings: form.contraindicationWarnings.filter((_, i) => i !== idx),
    });
  };

  // Filtered Rules
  const filteredRules = rules.filter((r) => {
    const matchSearch =
      r.concern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.skinType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.adviceHeadline || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchConcern = selectedConcern === 'ALL' || r.concern === selectedConcern;
    return matchSearch && matchConcern;
  });

  return (
    <AdminLayout activeTab="Skin Quiz & Regimens">
      <Head>
        <title>Skin Quiz & Routine Rules Manager | Love & Co. Admin</title>
      </Head>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1614] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E3EE]">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-700" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1614] tracking-tight">
              Skin Quiz & Regimen Recommendation Rules
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visual rule builder mapping customer skin concerns & barrier profiles to personalized AM/PM clinical routines.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#1C1614] hover:bg-[#342721] text-xs font-medium text-white transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Recommendation Rule</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#E8E3EE] rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search concern, skin type, or headline..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedConcern('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              selectedConcern === 'ALL'
                ? 'bg-[#1C1614] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Concerns
          </button>
          {CONCERNS.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedConcern(c)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedConcern === c
                  ? 'bg-[#1C1614] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => {
          const amProducts = rule.recommendedRoutine?.am || [];
          const pmProducts = rule.recommendedRoutine?.pm || [];

          return (
            <div
              key={rule._id}
              className="bg-white border border-[#E8E3EE] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#1C1614]/30 transition"
            >
              <div>
                {/* Rule Header Badges */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#E8E3EE] text-[#4A3B32]">
                      {rule.concern}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-gray-100 text-gray-700">
                      Skin: {rule.skinType}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(rule)}
                      title="Edit Rule"
                      className="p-1.5 text-gray-500 hover:text-[#1C1614] hover:bg-gray-100 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule._id)}
                      title="Delete Rule"
                      className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Advice Headline */}
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-[#1C1614] leading-snug">
                    {rule.adviceHeadline || 'Clinical Prescription'}
                  </h3>
                </div>

                {/* AM & PM Regimens */}
                <div className="mt-4 space-y-3 text-xs">
                  {/* AM Routine */}
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                    <div className="flex items-center space-x-1.5 text-amber-900 font-semibold mb-1.5 text-[11px]">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      <span>Morning Regimen (AM)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {amProducts.map((p, i) => (
                        <React.Fragment key={i}>
                          <span className="px-2 py-1 bg-white text-gray-800 rounded-md border border-amber-200/70 text-[10px] font-medium shadow-2xs">
                            {getProductTitle(p)}
                          </span>
                          {i < amProducts.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* PM Routine */}
                  <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/60">
                    <div className="flex items-center space-x-1.5 text-purple-900 font-semibold mb-1.5 text-[11px]">
                      <Moon className="w-3.5 h-3.5 text-purple-600" />
                      <span>Evening Regimen (PM)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {pmProducts.map((p, i) => (
                        <React.Fragment key={i}>
                          <span className="px-2 py-1 bg-white text-gray-800 rounded-md border border-purple-200/70 text-[10px] font-medium shadow-2xs">
                            {getProductTitle(p)}
                          </span>
                          {i < pmProducts.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contraindication Warnings */}
                {rule.activeContraindicationWarnings && rule.activeContraindicationWarnings.length > 0 && (
                  <div className="mt-3 bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/70 text-[11px] space-y-1">
                    <div className="flex items-center space-x-1 text-rose-900 font-semibold text-[10px] uppercase font-mono">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>Contraindications</span>
                    </div>
                    {rule.activeContraindicationWarnings.map((w, idx) => (
                      <p key={idx} className="text-rose-800 text-[10px]">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>Rule ID: {rule._id}</span>
                <span>Active in Quiz Engine</span>
              </div>
            </div>
          );
        })}

        {filteredRules.length === 0 && (
          <div className="col-span-2 bg-white rounded-2xl p-8 border border-gray-200 text-center text-gray-500 text-xs">
            No recommendation rules found matching the criteria.
          </div>
        )}
      </div>

      {/* Create / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3EE]">
              <div>
                <h2 className="text-sm font-serif font-bold text-[#1C1614]">
                  {editingRule ? 'Edit Recommendation Rule' : 'New Regimen Recommendation Rule'}
                </h2>
                <p className="text-[11px] text-gray-500">Map quiz concern & skin profile to tailored clinical products.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Concern & Skin Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Skin Concern</label>
                  <select
                    value={form.concern}
                    onChange={(e) => setForm({ ...form, concern: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300"
                  >
                    {CONCERNS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Skin Type</label>
                  <select
                    value={form.skinType}
                    onChange={(e) => setForm({ ...form, skinType: e.target.value })}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300"
                  >
                    {SKIN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">
                  Prescription Headline *
                </label>
                <input
                  type="text"
                  value={form.adviceHeadline}
                  onChange={(e) => setForm({ ...form, adviceHeadline: e.target.value })}
                  placeholder="e.g. BHA Exfoliation & Sebum Regulation Regimen"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                />
              </div>

              {/* AM Product Picker */}
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/70 space-y-2">
                <div className="text-xs font-semibold text-amber-900 flex items-center space-x-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Morning Regimen (AM) Products</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {products.map((p) => {
                    const isSelected = form.amProducts.includes(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => toggleProductInList('AM', p._id)}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition ${
                          isSelected
                            ? 'bg-amber-700 text-white border-amber-800 font-semibold'
                            : 'bg-white text-gray-700 border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        {p.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PM Product Picker */}
              <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200/70 space-y-2">
                <div className="text-xs font-semibold text-purple-900 flex items-center space-x-1.5">
                  <Moon className="w-3.5 h-3.5 text-purple-600" />
                  <span>Evening Regimen (PM) Products</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {products.map((p) => {
                    const isSelected = form.pmProducts.includes(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => toggleProductInList('PM', p._id)}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-800 font-semibold'
                            : 'bg-white text-gray-700 border-purple-200 hover:bg-purple-100/50'
                        }`}
                      >
                        {p.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contraindications Warning Builder */}
              <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50 space-y-2">
                <label className="text-xs font-semibold text-gray-800 block">
                  Active Incompatibilities & Contraindication Warnings
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={form.warningInput}
                    onChange={(e) => setForm({ ...form, warningInput: e.target.value })}
                    placeholder="e.g. Do not combine Vitamin C with direct acids in AM."
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddWarning}
                    className="px-3 py-1.5 text-xs bg-[#1C1614] text-white rounded-lg hover:bg-[#342721]"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  {form.contraindicationWarnings.map((warn, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-gray-200">
                      <span className="text-gray-700">{warn}</span>
                      <button type="button" onClick={() => handleRemoveWarning(i)} className="text-gray-400 hover:text-red-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E8E3EE] bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveRule}
                className="px-5 py-2 text-xs font-medium bg-[#1C1614] text-white rounded-lg hover:bg-[#342721] transition shadow-xs"
              >
                {editingRule ? 'Save Rule Changes' : 'Activate Quiz Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

