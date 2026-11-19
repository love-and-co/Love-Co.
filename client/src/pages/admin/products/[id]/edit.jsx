import React, { useState, useEffect } from 'react';
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
  DollarSign,
  RotateCcw
} from 'lucide-react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { api } from '../../../../lib/api';

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

export default function EditProductCatalogStudio() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORY_OPTIONS[0],
    volumeWeight: '100g Bar',
    price: 380,
    compareAtPrice: 450,
    stockQty: 50,
    shelfLifeMonths: 24,
    skinTypes: ['All Skin Types'],
    keyIngredients: '',
    tagline: '',
    description: '',
    usageInstructions: '',
    keyBenefits: ['', '', ''],
    imageUrl: PRESET_PHOTOS[0],
  });

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Try getting admin products first
        const res = await api.getAdminProducts();
        if (res.data?.success) {
          const prod = (res.data.products || []).find(
            (p) => p._id === id || p.slug === id
          );
          if (prod) {
            setFormData({
              name: prod.name || '',
              category: prod.category || CATEGORY_OPTIONS[0],
              volumeWeight: prod.volumeWeight || prod.weight || '100g Bar',
              price: prod.price || 380,
              compareAtPrice: prod.compareAtPrice || prod.mrp || 450,
              stockQty: prod.stockQty !== undefined ? prod.stockQty : (prod.stock || 50),
              shelfLifeMonths: prod.shelfLifeMonths || 24,
              skinTypes: Array.isArray(prod.skinTypes) && prod.skinTypes.length > 0 ? prod.skinTypes : ['All Skin Types'],
              keyIngredients: Array.isArray(prod.keyIngredients) ? prod.keyIngredients.join(', ') : (prod.keyIngredients || ''),
              tagline: prod.tagline || '',
              description: prod.description || '',
              usageInstructions: prod.usageInstructions || '',
              keyBenefits: Array.isArray(prod.keyBenefits) && prod.keyBenefits.length > 0
                ? [prod.keyBenefits[0] || '', prod.keyBenefits[1] || '', prod.keyBenefits[2] || '']
                : ['', '', ''],
              imageUrl: prod.images?.[0]?.url || prod.image || PRESET_PHOTOS[0],
            });
          }
        }
      } catch (err) {
        console.warn('Failed loading product details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBenefitChange = (index, val) => {
    setFormData((prev) => {
      const nextBenefits = [...prev.keyBenefits];
      nextBenefits[index] = val;
      return { ...prev, keyBenefits: nextBenefits };
    });
  };

  const toggleSkinType = (st) => {
    setFormData((prev) => {
      const exists = prev.skinTypes.includes(st);
      return {
        ...prev,
        skinTypes: exists
          ? prev.skinTypes.filter((x) => x !== st)
          : [...prev.skinTypes, st],
      };
    });
  };

  // AI Botanical Description Generator
  const handleGenerateAiCopy = async () => {
    if (!formData.name) {
      setErrorMsg('Please specify a formulation name before generating copy.');
      return;
    }

    try {
      setGeneratingAi(true);
      setErrorMsg('');

      const res = await api.generateBotanicalCopy({
        name: formData.name,
        category: formData.category,
        keyIngredients: formData.keyIngredients,
        skinTypes: formData.skinTypes,
      });

      if (res.data?.success && res.data.copy) {
        const copy = res.data.copy;
        setFormData((prev) => ({
          ...prev,
          tagline: copy.tagline || prev.tagline,
          description: copy.description || prev.description,
          usageInstructions: copy.usageInstructions || prev.usageInstructions,
          keyBenefits: copy.keyBenefits?.length
            ? copy.keyBenefits.slice(0, 3)
            : prev.keyBenefits,
        }));
        setSuccessMsg('AI Botanical copy generated with editorial elegance.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg('Failed generating AI copy: ' + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      setErrorMsg('Formulation name and price are required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const payload = {
        name: formData.name,
        category: formData.category,
        volumeWeight: formData.volumeWeight,
        price: Number(formData.price),
        compareAtPrice: Number(formData.compareAtPrice || formData.price),
        stock: Number(formData.stockQty),
        stockQty: Number(formData.stockQty),
        shelfLifeMonths: Number(formData.shelfLifeMonths || 24),
        skinTypes: formData.skinTypes,
        keyIngredients: formData.keyIngredients.split(',').map((s) => s.trim()).filter(Boolean),
        tagline: formData.tagline,
        description: formData.description,
        usageInstructions: formData.usageInstructions,
        keyBenefits: formData.keyBenefits.filter(Boolean),
        images: [{ url: formData.imageUrl, isPrimary: true, alt: formData.name }],
      };

      await api.updateProduct(id, payload);
      setSuccessMsg(`Saved changes to "${formData.name}".`);
      setTimeout(() => {
        router.push('/admin/inventory');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error updating product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Catalog Studio">
        <div className="py-24 text-center text-xs text-stone-500">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin" />
          Loading formulation atelier...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Catalog Studio">
      <Head>
        <title>Edit Formulation Studio | Love &amp; Co. Flagship</title>
      </Head>

      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E6DDD0] pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/inventory"
              className="p-2.5 rounded-xl bg-white border border-[#E6DDD0] text-stone-600 hover:text-[#1C1614] hover:bg-[#F7F4EF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2 text-xs font-serif tracking-widest text-[#C5A880] uppercase">
                <span>Catalog Studio</span>
                <span>/</span>
                <span>Edit Formulation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[#1C1614] font-normal tracking-wide mt-1">
                Edit: {formData.name || 'Botanical Soap'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin/inventory"
              className="px-4 py-2 bg-white hover:bg-[#F7F4EF] border border-[#E6DDD0] rounded-xl text-xs font-serif tracking-wider uppercase transition-colors"
            >
              Discard Changes
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2.5 bg-[#1C1614] hover:bg-black text-[#FAF8F5] border border-[#C5A880]/40 rounded-xl text-xs font-serif tracking-widest uppercase transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? 'Updating Formulation...' : 'Save & Publish Changes'}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Spacious 2-Column Studio Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (60% / 7 cols): Formulation Specs & AI Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Core Specifications */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-base text-[#1C1614] font-semibold flex items-center space-x-2">
                <Package className="w-4 h-4 text-[#C5A880]" />
                <span>1. Formulation Identity &amp; Specs</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                    Formulation Title *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Damascus Rose & Shea Butter Botanical Bar"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                    Apothecary Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                    Weight / Variant Pack
                  </label>
                  <input
                    type="text"
                    name="volumeWeight"
                    value={formData.volumeWeight}
                    onChange={handleChange}
                    placeholder="e.g. 100g Bar or Pack of 2"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Pricing & Live Curing Stock */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-base text-[#1C1614] font-semibold flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-[#C5A880]" />
                <span>2. Pricing &amp; Inventory</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="1"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                    Compare At MRP (₹)
                  </label>
                  <input
                    type="number"
                    name="compareAtPrice"
                    value={formData.compareAtPrice}
                    onChange={handleChange}
                    min="1"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stockQty"
                    value={formData.stockQty}
                    onChange={handleChange}
                    min="0"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>
            </div>

            {/* 3. AI Botanical Copy Generator */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-base text-[#1C1614] font-semibold flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <span>3. Botanical Description &amp; AI Copywriter</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Generate sensory rituals and active ingredient writeups in Love &amp; Co.’s editorial voice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiCopy}
                  disabled={generatingAi}
                  className="px-3.5 py-2 bg-[#C5A880] hover:bg-[#b0936b] text-[#1C1614] font-semibold rounded-xl text-xs font-serif uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAi ? 'Composing...' : 'AI Generate'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Hand-stirred cold process bar for deeply nurtured, radiant skin."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                  Sensory Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Detailed description of the botanicals, sensory lather, and cold-process curing method..."
                  className="w-full text-xs p-3.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
          </div>

          {/* Right Column (40% / 5 cols): Photo Preview Uploader & Live Card Mockup */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Photo Uploader & Selector */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-base text-[#1C1614] font-semibold flex items-center space-x-2">
                <Upload className="w-4 h-4 text-[#C5A880]" />
                <span>Product Photo Studio Preview</span>
              </h2>

              {/* Large 1:1 Aspect Ratio Photo Preview */}
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-[#E6DDD0] bg-[#F7F4EF] shadow-inner relative group">
                <img
                  src={formData.imageUrl}
                  alt={formData.name || 'Botanical Soap Preview'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1C1614]/80 backdrop-blur-sm text-[#FAF8F5] text-[10px] font-mono uppercase px-2.5 py-1 rounded-full">
                  Primary 1:1 Aspect
                </div>
              </div>

              {/* Photo URL Input */}
              <div>
                <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                  Image CDN URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Preset Botanical Photos */}
              <div>
                <span className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-2">
                  Atelier Botanical Presets
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_PHOTOS.map((photo, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: photo }))}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        formData.imageUrl === photo
                          ? 'border-[#C5A880] ring-2 ring-[#C5A880]/30 scale-95'
                          : 'border-transparent hover:border-stone-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Customer Storefront Card Mockup */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#C5A880] font-semibold">
                  Live Storefront Preview
                </span>
                <span className="text-[10px] font-mono text-stone-400">Customer View</span>
              </div>

              <div className="border border-[#E6DDD0] rounded-2xl overflow-hidden bg-[#FAF8F5]">
                <div className="aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-1.5">
                  <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500">
                    {formData.category}
                  </span>
                  <h4 className="font-serif text-sm font-semibold text-[#1C1614] line-clamp-1">
                    {formData.name || 'Untitled Botanical Formulation'}
                  </h4>
                  <div className="flex items-baseline space-x-2 pt-1">
                    <span className="font-serif font-bold text-base text-[#1C1614]">
                      ₹{formData.price}
                    </span>
                    {formData.compareAtPrice > formData.price && (
                      <span className="text-xs text-stone-400 line-through font-mono">
                        ₹{formData.compareAtPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
