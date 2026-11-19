import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Sparkles,
  ArrowLeft,
  Package,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Tag,
  DollarSign
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { api } from '../../../lib/api';

const SKIN_TYPE_OPTIONS = [
  'All Skin Types',
  'Dry & Flaky',
  'Sensitive & Reactive',
  'Oily & Acne-Prone',
  'Mature & Dehydrated',
];

const CATEGORY_OPTIONS = [
  'Cold-Pressed Soaps',
  'Lip Care',
  'Ritual Trios',
  'Botanical Balms',
  'Combos',
];

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1607006483224-48612ca3b417?q=80&w=800',
  'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800',
  'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?q=80&w=800',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800',
];

export default function NewProductCatalogStudio() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORY_OPTIONS[0],
    volumeWeight: '100g Bar',
    price: 380,
    compareAtPrice: 450,
    stockQty: 50,
    shelfLifeMonths: 24,
    skinTypes: ['All Skin Types'],
    keyIngredients: 'Cold-pressed virgin coconut oil, unrefined shea butter, sweet almond oil',
    tagline: '',
    description: '',
    usageInstructions: '',
    keyBenefits: ['', '', ''],
    imageUrl: PRESET_PHOTOS[0],
  });

  const [generatingAi, setGeneratingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI Botanical Copywriter
  const handleGenerateAiCopy = async () => {
    if (!formData.name.trim()) {
      setErrorMsg('Please enter a product title first before invoking the AI Copywriter.');
      return;
    }

    try {
      setGeneratingAi(true);
      setErrorMsg('');

      const res = await api.generateBotanicalCopy({
        title: formData.name,
        category: formData.category,
        keyIngredients: formData.keyIngredients,
        skinType: formData.skinTypes.join(', '),
      });

      if (res.data?.success && res.data.copy) {
        const copy = res.data.copy;
        setFormData((prev) => ({
          ...prev,
          tagline: copy.tagline || prev.tagline,
          description: copy.description || prev.description,
          usageInstructions: copy.usageInstructions || prev.usageInstructions,
          keyBenefits: copy.keyBenefits && copy.keyBenefits.length > 0 ? copy.keyBenefits : prev.keyBenefits,
        }));
        setSuccessMsg('✨ AI Botanical formulation copy generated!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'AI copy generation failed');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleToggleSkinType = (type) => {
    setFormData((prev) => {
      const exists = prev.skinTypes.includes(type);
      return {
        ...prev,
        skinTypes: exists ? prev.skinTypes.filter((t) => t !== type) : [...prev.skinTypes, type],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const payload = {
        name: formData.name,
        title: formData.name,
        slug,
        category: formData.category,
        volumeWeight: formData.volumeWeight,
        price: Number(formData.price),
        compareAtPrice: Number(formData.compareAtPrice),
        stock: Number(formData.stockQty),
        stockQty: Number(formData.stockQty),
        tagline: formData.tagline,
        description: formData.description,
        skinTypes: formData.skinTypes,
        shelfLifeMonths: Number(formData.shelfLifeMonths),
        images: [{ url: formData.imageUrl.trim() || PRESET_PHOTOS[0], isPrimary: true }],
        usageInstructions: {
          routineTime: 'Both',
          directions: formData.usageInstructions,
        },
        keyActives: formData.keyIngredients.split(',').map((k) => ({ name: k.trim() })),
      };

      const res = await api.createProduct(payload);
      if (res.data?.success) {
        router.push('/admin/inventory');
      } else {
        setErrorMsg(res.data?.error || 'Failed to create formulation');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout pageTitle="Apothecary Formulation Studio">
      <Head>
        <title>New Formulation Studio | Love &amp; Co. Flagship</title>
      </Head>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E6DDD0] pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/inventory"
              className="p-2 rounded-xl bg-white border border-[#E6DDD0] text-stone-600 hover:text-[#1C1614] hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-serif text-[#1C1614] font-normal tracking-wide">
                Formulate New Botanical SKU
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">
                Curate ingredients, configure batch reserves &amp; invoke AI sensory storytelling.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={generatingAi}
              onClick={handleGenerateAiCopy}
              className="px-4 py-2 bg-[#C5A880]/15 hover:bg-[#C5A880]/25 text-[#1C1614] border border-[#C5A880] rounded-xl text-xs font-serif uppercase tracking-wider transition-all flex items-center space-x-2 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{generatingAi ? 'Formulating...' : 'Generate Copy with AI'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-wider font-semibold transition-all shadow-xs"
            >
              {saving ? 'Publishing...' : 'Publish Formulation'}
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

        {/* ─────────────────────────────────────────────────────────────
            2-COLUMN SPACIOUS STUDIO LAYOUT (LEFT: 60% / RIGHT: 40%)
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════════════════════════════════════════════════════════════
              LEFT COLUMN: FORMULATION SPECS & AI COPYWRITER (7 Cols)
          ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Specs Card */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs space-y-5">
              <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-[#1C1614] border-b border-stone-100 pb-2">
                1. Formulation Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Formulation Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Saffron & Sweet Almond Cold-Pressed Soap"
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Variant / Pack Size
                  </label>
                  <input
                    type="text"
                    value={formData.volumeWeight}
                    onChange={(e) => setFormData({ ...formData, volumeWeight: e.target.value })}
                    placeholder="e.g. 100g Bar, Pack of 2"
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Compare At MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Initial Stock Reserve (Units)
                  </label>
                  <input
                    type="number"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Shelf Life (Months)
                  </label>
                  <input
                    type="number"
                    value={formData.shelfLifeMonths}
                    onChange={(e) => setFormData({ ...formData, shelfLifeMonths: Number(e.target.value) })}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                  Key Botanical Actives &amp; Oils
                </label>
                <input
                  type="text"
                  value={formData.keyIngredients}
                  onChange={(e) => setFormData({ ...formData, keyIngredients: e.target.value })}
                  placeholder="e.g. Saffron distillates, coconut oil, unrefined shea butter"
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1.5">
                  Target Skin Compatibility:
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPE_OPTIONS.map((st) => {
                    const isSelected = formData.skinTypes.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleToggleSkinType(st)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          isSelected
                            ? 'bg-[#1C1614] text-[#FAF8F5] border-[#1C1614]'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Copywriting Section */}
            <div className="bg-white border border-[#C5A880]/40 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-[#1C1614] flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>2. AI Botanical Storytelling &amp; Copy</span>
                </h3>
                <button
                  type="button"
                  disabled={generatingAi}
                  onClick={handleGenerateAiCopy}
                  className="text-xs text-[#C5A880] hover:underline font-serif"
                >
                  {generatingAi ? 'Generating...' : 'Auto-Generate →'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                  Poetic Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. An artisanal hymn to pure botanicals and restorative lipid care."
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                  Sensory Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Click 'Generate Copy with AI' to craft evocative apothecary copy..."
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880] leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                  Application Ritual Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.usageInstructions}
                  onChange={(e) => setFormData({ ...formData, usageInstructions: e.target.value })}
                  placeholder="Application directions for daily bath ritual..."
                  className="w-full text-xs px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              RIGHT COLUMN: LARGE PHOTO PREVIEW & CARD MOCKUP (5 Cols)
          ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Large Photo Preview & Uploader Card */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-sm tracking-wider uppercase font-semibold text-[#1C1614] border-b border-stone-100 pb-2">
                Product Photo Studio
              </h3>

              {/* 1:1 Large Image Canvas */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative group shadow-inner">
                <img
                  src={formData.imageUrl || PRESET_PHOTOS[0]}
                  alt="Product formulation preview"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <span className="text-white text-xs font-serif bg-black/60 px-3 py-1.5 rounded-full">
                    Active Formulation Imagery
                  </span>
                </div>
              </div>

              {/* Image URL Input */}
              <div>
                <label className="block text-xs font-serif uppercase tracking-wider text-stone-600 mb-1">
                  Image URL / CDN Path
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Preset Botanical Photos Picker */}
              <div>
                <span className="text-[10px] uppercase font-serif tracking-widest text-stone-400 block mb-2">
                  Or Select Botanical Preset:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_PHOTOS.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: src })}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        formData.imageUrl === src ? 'border-[#C5A880] scale-95 shadow-xs' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <img src={src} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Customer Storefront Card Mockup */}
            <div className="bg-[#FAF8F5] border border-dashed border-[#C5A880]/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-serif uppercase tracking-widest text-stone-400">
                <span>Live Customer Storefront Mockup</span>
                <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
              </div>

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                  <img
                    src={formData.imageUrl || PRESET_PHOTOS[0]}
                    alt="Mockup"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A880]">
                    {formData.category}
                  </span>
                  <h4 className="font-serif font-semibold text-sm text-[#1C1614] truncate">
                    {formData.name || 'Formulation Title Preview'}
                  </h4>
                  <p className="font-mono text-xs font-bold text-[#1C1614] pt-1">
                    ₹{formData.price}{' '}
                    {formData.compareAtPrice > formData.price && (
                      <span className="text-stone-400 font-normal line-through text-[11px] ml-1">
                        ₹{formData.compareAtPrice}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
