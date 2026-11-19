import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  ArrowRight,
  ExternalLink,
  Plus,
  Sparkles,
  DollarSign,
  Tag,
  ShieldAlert,
  LayoutGrid,
  List,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';

const CATEGORIES = [
  'All',
  'Cold-Pressed Soaps',
  'Lip Care',
  'Ritual Trios',
  'Combos',
];

const BOTANICAL_FALLBACK_IMG = 'https://images.unsplash.com/photo-1607006483224-48612ca3b417?q=80&w=600';

export default function LiveStockPricingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Slide-over Quick Edit Drawer
  const [drawerProduct, setDrawerProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editVolume, setEditVolume] = useState('');
  const [savingDrawer, setSavingDrawer] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminProducts();
      if (res.data?.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.warn('Failed to load products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Listen for real-time catalog changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('catalog:update', fetchProducts);
    return () => {
      socket.off('catalog:update', fetchProducts);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (err) => {
    setErrorMessage(err);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // Inline In Stock / Out of Stock toggle
  const handleToggleStock = async (product) => {
    try {
      const res = await api.toggleProductStock(product._id);
      if (res.data?.success) {
        showToast(res.data.message || 'Stock status updated');
        setProducts((prev) =>
          prev.map((p) =>
            p._id === product._id
              ? { ...p, status: res.data.product.status, stock: res.data.product.stock, stockQty: res.data.product.stock }
              : p
          )
        );
      }
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to toggle stock');
    }
  };

  // Open Slide-over Quick Edit Drawer
  const openDrawer = (product) => {
    setDrawerProduct(product);
    setEditPrice(product.price || '');
    setEditMrp(product.compareAtPrice || product.price || '');
    setEditStock(product.stockQty !== undefined ? product.stockQty : (product.stock || 50));
    setEditVolume(product.volumeWeight || '100g Bar');
  };

  const handleSaveDrawer = async () => {
    if (!drawerProduct) return;
    try {
      setSavingDrawer(true);
      const [priceRes, stockRes] = await Promise.all([
        api.quickPriceUpdate(drawerProduct._id, {
          price: Number(editPrice),
          compareAtPrice: Number(editMrp),
        }),
        api.updateProductStock(drawerProduct._id, Number(editStock)),
      ]);

      if (priceRes.data?.success || stockRes.data?.success) {
        showToast(`Saved updates for ${drawerProduct.name}`);
        setProducts((prev) =>
          prev.map((p) =>
            p._id === drawerProduct._id
              ? {
                  ...p,
                  price: Number(editPrice),
                  compareAtPrice: Number(editMrp),
                  stock: Number(editStock),
                  stockQty: Number(editStock),
                  volumeWeight: editVolume,
                }
              : p
          )
        );
        setDrawerProduct(null);
      }
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to save changes');
    } finally {
      setSavingDrawer(false);
    }
  };

  // Delete Guard: Rejects if present in active orders
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete formulation "${product.name}"?`)) {
      return;
    }

    try {
      const res = await api.deleteProductGuarded(product._id);
      if (res.data?.success) {
        showToast(res.data.message || 'Product removed from catalog');
        setProducts((prev) => prev.filter((p) => p._id !== product._id));
      }
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Failed to delete product');
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'All') {
        const cat = (p.category || '').toLowerCase();
        const sel = category.toLowerCase();
        if (!cat.includes(sel) && !sel.includes(cat)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const name = (p.name || p.title || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        if (!name.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [products, category, search]);

  return (
    <AdminLayout pageTitle="Catalog &amp; Live Stock Atelier">
      <Head>
        <title>Catalog &amp; Stock | Love &amp; Co. Flagship</title>
      </Head>

      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E6DDD0] pb-5">
          <div>
            <h1 className="text-2xl font-serif text-[#1C1614] font-normal tracking-wide">
              Botanical Catalog &amp; Live Stock
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Visual formulation registry, stock health status bars &amp; quick slide-over editor.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchProducts}
              className="px-3 py-2 bg-white hover:bg-stone-50 border border-[#E6DDD0] rounded-xl text-xs font-medium text-stone-700 transition-colors shadow-2xs flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/products/new"
              className="px-4 py-2 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-wider transition-all shadow-xs flex items-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>+ Add New Formulation</span>
            </Link>
          </div>
        </div>

        {/* Floating Toasts */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-200">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Filter, Search & View Toggle Controls */}
        <div className="bg-white border border-[#E6DDD0] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-serif tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1C1614] text-[#FAF8F5] shadow-2xs font-semibold'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search + View Toggle */}
          <div className="flex items-center space-x-3">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search formulation title or category..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Grid vs Table Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-[#1C1614] shadow-2xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Photo Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-[#1C1614] shadow-2xs' : 'text-stone-400 hover:text-stone-700'
                }`}
                title="Photo Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            A. PHOTO GRID VIEW
        ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="py-24 text-center text-xs text-stone-400 bg-white rounded-2xl border border-[#E6DDD0]">
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin" />
            Loading botanical catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-[#E6DDD0] text-stone-500 space-y-2">
            <Package className="w-10 h-10 mx-auto text-stone-300" />
            <p className="font-serif text-sm">No formulations found matching criteria.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const currentStock = p.stockQty !== undefined ? p.stockQty : (p.stock || 0);
              const isOutOfStock = p.status === 'OUT_OF_STOCK' || currentStock <= 0;
              const photo = p.images?.[0]?.url || BOTANICAL_FALLBACK_IMG;

              // Stock Health Color: Emerald (>=10), Amber (<10), Terracotta (<=0)
              const healthColor =
                currentStock <= 0 ? 'bg-[#C25953]' : currentStock < 10 ? 'bg-amber-500' : 'bg-emerald-500';
              const healthLabel =
                currentStock <= 0 ? 'Out of Stock' : currentStock < 10 ? 'Low Stock' : 'Healthy Stock';

              return (
                <div
                  key={p._id}
                  className="bg-white border border-[#E6DDD0] rounded-2xl overflow-hidden shadow-xs hover:border-[#C5A880] transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* 1:1 Aspect Image Container */}
                    <div className="aspect-square w-full bg-stone-100 relative overflow-hidden">
                      <img
                        src={photo}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-[#1C1614]/80 backdrop-blur-xs text-[#FAF8F5] text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full">
                        {p.category || 'Soap Bar'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-serif font-semibold text-stone-900 text-sm truncate">
                          {p.name || p.title}
                        </h3>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {p.volumeWeight || '100g Bar'}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline space-x-2">
                        <span className="font-mono font-bold text-sm text-[#1C1614]">
                          ₹{p.price}
                        </span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="font-mono text-xs text-stone-400 line-through">
                            ₹{p.compareAtPrice}
                          </span>
                        )}
                      </div>

                      {/* Visual Stock Health Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-stone-500">{healthLabel}</span>
                          <span className="font-mono font-semibold text-stone-800">
                            {currentStock} units
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${healthColor}`}
                            style={{ width: `${Math.min(100, Math.max(8, (currentStock / 50) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="p-4 pt-0 border-t border-stone-100 mt-3 flex items-center justify-between gap-2">
                    {/* Inline Stock Toggle Button */}
                    <button
                      onClick={() => handleToggleStock(p)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                        !isOutOfStock
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      {!isOutOfStock ? 'In Stock' : 'Out of Stock'}
                    </button>

                    <div className="flex items-center space-x-1">
                      {/* Slide-over Quick Edit Drawer Button */}
                      <button
                        onClick={() => openDrawer(p)}
                        className="p-1.5 text-stone-500 hover:text-[#1C1614] rounded-lg hover:bg-stone-100 transition-colors"
                        title="Quick Edit Drawer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Guarded Delete */}
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Formulation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              B. RICH PHOTO TABLE VIEW (64×64px Photos)
          ───────────────────────────────────────────────────────────── */
          <div className="bg-white border border-[#E6DDD0] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-[#E6DDD0] text-stone-500 font-serif uppercase tracking-widest text-[11px]">
                    <th className="py-3 px-4">Formulation</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Stock Health</th>
                    <th className="py-3 px-4">Availability Switch</th>
                    <th className="py-3 px-4">Price / MRP</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => {
                    const currentStock = p.stockQty !== undefined ? p.stockQty : (p.stock || 0);
                    const isOutOfStock = p.status === 'OUT_OF_STOCK' || currentStock <= 0;
                    const photo = p.images?.[0]?.url || BOTANICAL_FALLBACK_IMG;
                    const healthColor =
                      currentStock <= 0 ? 'bg-[#C25953]' : currentStock < 10 ? 'bg-amber-500' : 'bg-emerald-500';

                    return (
                      <tr key={p._id} className="hover:bg-stone-50/70 transition-colors">
                        {/* 64×64px Rounded Photo + Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0">
                              <img
                                src={photo}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif font-semibold text-stone-900 text-sm truncate">
                                {p.name || p.title}
                              </p>
                              <p className="text-[11px] text-stone-400 mt-0.5">
                                {p.volumeWeight || '100g Bar'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-stone-100 text-stone-700">
                            {p.category || 'Soaps'}
                          </span>
                        </td>

                        {/* Stock Health Bar */}
                        <td className="py-3.5 px-4 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-mono font-bold text-stone-800">{currentStock} units</span>
                              <span className="text-[10px] text-stone-400">
                                {currentStock < 10 ? 'Low' : 'Healthy'}
                              </span>
                            </div>
                            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${healthColor}`}
                                style={{ width: `${Math.min(100, Math.max(8, (currentStock / 50) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Availability Toggle */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStock(p)}
                            className={`px-3 py-1 rounded-full text-[11px] font-medium border ${
                              !isOutOfStock
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            {!isOutOfStock ? 'In Stock (Live)' : 'Out of Stock'}
                          </button>
                        </td>

                        {/* Price & MRP */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-sm text-[#1C1614]">₹{p.price}</span>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <span className="text-xs text-stone-400 line-through ml-2">
                              ₹{p.compareAtPrice}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openDrawer(p)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              Quick Edit
                            </button>
                            <Link
                              href={`/admin/products/${p._id}/edit`}
                              className="p-1.5 text-stone-400 hover:text-[#1C1614] rounded hover:bg-stone-100"
                              title="Full Studio Editor"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              title="Delete formulation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SLIDE-OVER QUICK EDIT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {drawerProduct && (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#E6DDD0] shadow-2xl flex flex-col font-sans text-[#1C1614]">
              {/* Drawer Header */}
              <div className="p-6 bg-[#1C1614] text-[#FAF8F5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-serif uppercase tracking-widest text-[#C5A880]">
                    Quick Edit Drawer
                  </span>
                  <h3 className="font-serif text-base font-semibold mt-0.5 truncate max-w-[260px]">
                    {drawerProduct.name}
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerProduct(null)}
                  className="p-1 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Photo Preview */}
                <div className="flex items-center space-x-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-stone-200 flex-shrink-0">
                    <img
                      src={drawerProduct.images?.[0]?.url || BOTANICAL_FALLBACK_IMG}
                      alt={drawerProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-stone-400">{drawerProduct.category}</span>
                    <p className="font-serif font-semibold text-stone-900 mt-0.5">{drawerProduct.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Compare At / MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Stock Quantity (Units)
                  </label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-serif uppercase tracking-wider text-stone-600 mb-1">
                    Variant / Weight
                  </label>
                  <input
                    type="text"
                    value={editVolume}
                    onChange={(e) => setEditVolume(e.target.value)}
                    placeholder="e.g. 100g Bar, Pack of 2"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <Link
                  href={`/admin/products/${drawerProduct._id}/edit`}
                  className="text-xs text-[#C5A880] hover:underline font-serif"
                >
                  Open Full Studio →
                </Link>
                <button
                  onClick={handleSaveDrawer}
                  disabled={savingDrawer}
                  className="px-5 py-2.5 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-wider font-semibold transition-all shadow-xs"
                >
                  {savingDrawer ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
