import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Filter, X, Search, Check, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { api } from '../lib/api';
import { INITIAL_PRODUCTS } from '../modules/admin/data/mockSeed';

export const PRODUCTS_STORAGE_KEY = 'love_co_admin_products_v1';

const categories = [
  { label: 'All Products', value: '' },
  { label: 'Cold-Pressed Soaps', value: 'cold-pressed-soaps' },
  { label: 'Lip Care & Butters', value: 'lip-care' },
];

const concerns = [
  'All Concerns',
  'Acne',
  'Barrier Repair',
  'Pigmentation',
  'Dryness',
  'Sensitivity',
];

const skinTypes = ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(router.query.category || '');
  const [selectedConcern, setSelectedConcern] = useState(router.query.concern || '');
  const [selectedSkinType, setSelectedSkinType] = useState('');
  const [sortBy, setSortBy] = useState('bestselling');
  const [searchQuery, setSearchQuery] = useState(router.query.search || '');

  // Synchronize router query
  useEffect(() => {
    if (router.query.category !== undefined) {
      setSelectedCategory(router.query.category);
    } else if (router.query.search !== undefined) {
      // If arriving via global search query, clear category constraint
      setSelectedCategory('');
    }
    if (router.query.concern !== undefined) setSelectedConcern(router.query.concern);
    if (router.query.search !== undefined) setSearchQuery(router.query.search);
  }, [router.query]);

  const getPersistentProducts = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (stored && stored.trim() && stored !== 'undefined' && stored !== 'null') {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  };

  // Fetch catalog with Instant Optimistic Filter
  useEffect(() => {
    async function fetchProducts() {
      const localProducts = getPersistentProducts();

      // Instant 0ms optimistic filter
      let filtered = [...localProducts].filter((p) => p.isActive !== false);

      if (selectedCategory) {
        filtered = filtered.filter((p) => {
          const cat = (p.category || '').toLowerCase();
          const target = selectedCategory.toLowerCase();
          if (target.includes('soap')) return cat.includes('soap');
          if (target.includes('lip')) return cat.includes('lip');
          return cat === target;
        });
      }

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p.slug?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
      }

      if (selectedSkinType && selectedSkinType !== 'All') {
        filtered = filtered.filter((p) =>
          (p.skinTypes || []).some((st) => st.toLowerCase().includes(selectedSkinType.toLowerCase()))
        );
      }

      if (sortBy === 'price_asc') {
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortBy === 'price_desc') {
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
      }

      setProducts(filtered);

      try {
        const params = {
          sort: sortBy,
        };
        if (selectedCategory) params.category = selectedCategory;
        if (selectedConcern && selectedConcern !== 'All Concerns') params.concern = selectedConcern;
        if (selectedSkinType && selectedSkinType !== 'All') params.skinType = selectedSkinType;
        if (searchQuery) params.search = searchQuery;

        const res = await api.getProducts(params);
        if (res.data?.products && res.data.products.length > 0) {
          // Merge any persistent admin edits (price, stock, title) into backend items
          const merged = res.data.products.map((p) => {
            const override = localProducts.find((lp) => lp._id === p._id || lp.slug === p.slug);
            return override ? { ...p, ...override } : p;
          });
          setProducts(merged);
          return;
        }
      } catch (err) {
        console.warn('API fetch failed, using local product catalog:', err);
      }
    }

    fetchProducts();

    // Listen for custom event when products are updated in admin portal
    const handleSync = () => fetchProducts();
    window.addEventListener('love_co_products_updated', handleSync);
    return () => window.removeEventListener('love_co_products_updated', handleSync);
  }, [selectedCategory, selectedConcern, selectedSkinType, sortBy, searchQuery]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedConcern('');
    setSelectedSkinType('');
    setSearchQuery('');
    router.push('/catalog', undefined, { shallow: true });
  };

  const hasActiveFilters = Boolean(
    selectedCategory ||
    (selectedConcern && selectedConcern !== 'All Concerns') ||
    (selectedSkinType && selectedSkinType !== 'All') ||
    searchQuery
  );

  return (
    <>
      <Head>
        <title>Our Products — Love &amp; Co. Apothecary</title>
      </Head>

      <div className="bg-brand-canvas min-h-screen">
        {/* Catalog Banner with Luxury Brand Warmth */}
        <div className="bg-brand-lavender-light/60 border-b border-brand-silver py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-brand-mocha-900 tracking-tight uppercase">
                OUR PRODUCTS
              </h1>
            </div>

            <div className="mt-4 md:mt-0 text-xs font-mono-clinical text-brand-mocha-700">
              Displaying <strong className="text-brand-mocha-900 font-bold">{products.length}</strong> verified products
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Mobile Filter Toggle & Sort Bar */}
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-brand-silver">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center space-x-2 px-3.5 py-2 border border-brand-silver bg-white text-xs font-mono-clinical uppercase text-brand-mocha-900 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-brand-mocha" />
              <span>Filter {hasActiveFilters && '●'}</span>
            </button>

            {/* Active filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 order-3 lg:order-2 w-full lg:w-auto mt-3 lg:mt-0">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-2 py-1 text-[11px] sm:text-xs font-mono-clinical text-red-700 hover:underline flex items-center bg-red-50 sm:bg-transparent cursor-pointer"
                >
                  <X className="w-3 h-3 mr-1" /> Clear All
                </button>
              )}
              {selectedCategory && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white border border-brand-silver text-[11px] sm:text-xs font-mono-clinical text-brand-mocha-900 flex items-center shadow-xs">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="ml-1.5 text-brand-mocha-400 hover:text-brand-mocha-900 cursor-pointer">
                    ×
                  </button>
                </span>
              )}
              {selectedConcern && selectedConcern !== 'All Concerns' && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white border border-brand-silver text-[11px] sm:text-xs font-mono-clinical text-brand-mocha-900 flex items-center shadow-xs">
                  {selectedConcern}
                  <button onClick={() => setSelectedConcern('')} className="ml-1.5 text-brand-mocha-400 hover:text-brand-mocha-900 cursor-pointer">
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white border border-brand-silver text-[11px] sm:text-xs font-mono-clinical text-brand-mocha-900 flex items-center shadow-xs">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1.5 text-brand-mocha-400 hover:text-brand-mocha-900 cursor-pointer">
                    ×
                  </button>
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 text-xs font-mono-clinical order-2 lg:order-3">
              <span className="text-brand-mocha-700 uppercase hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-brand-silver bg-white text-brand-mocha-900 text-[11px] sm:text-xs font-mono-clinical uppercase focus:outline-none focus:border-brand-mocha cursor-pointer shadow-xs"
              >
                <option value="bestselling">Best Sellers</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Recent Releases</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Sidebar Filters Desktop & Mobile Drawer */}
            <aside className={`lg:col-span-3 space-y-6 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="border border-brand-silver p-4 sm:p-6 bg-white divide-y divide-brand-silver shadow-sm">
                {/* Mobile Filter Header */}
                <div className="flex items-center justify-between pb-3 lg:hidden">
                  <span className="font-serif-luxury font-medium text-lg text-brand-mocha-900">Filter Products</span>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-brand-mocha-700 hover:text-brand-mocha-900 text-xs font-mono-clinical uppercase border border-brand-silver px-2.5 py-1"
                  >
                    Done ✓
                  </button>
                </div>

                {/* Search */}
                <div className="pb-5">
                  <h4 className="text-xs font-mono-clinical font-bold uppercase tracking-wider text-brand-mocha-900 mb-3">
                    Search Formula Actives
                  </h4>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-brand-mocha-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Squalane, BHA, Shea..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-brand-canvas border border-brand-silver text-xs font-mono-clinical focus:outline-none focus:border-brand-mocha text-brand-mocha-900"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="py-5">
                  <h4 className="text-xs font-mono-clinical font-bold uppercase tracking-wider text-brand-mocha-900 mb-3">
                    Product Category
                  </h4>
                  <div className="space-y-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`w-full text-left py-1 text-xs font-mono-clinical transition-colors flex items-center justify-between ${
                          selectedCategory === cat.value
                            ? 'font-bold text-brand-mocha'
                            : 'text-brand-mocha-700 hover:text-brand-mocha-900'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {selectedCategory === cat.value && <span className="w-1.5 h-1.5 rounded-full bg-brand-mocha"></span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cutaneous Concerns */}
                <div className="py-5">
                  <h4 className="text-xs font-mono-clinical font-bold uppercase tracking-wider text-brand-mocha-900 mb-3">
                    Skin Challenge Target
                  </h4>
                  <div className="space-y-1.5">
                    {concerns.map((c) => {
                      const isSelected = selectedConcern === c || (!selectedConcern && c === 'All Concerns');
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedConcern(c === 'All Concerns' ? '' : c)}
                          className={`w-full text-left py-1 text-xs font-mono-clinical transition-colors flex items-center justify-between ${
                            isSelected ? 'font-bold text-brand-mocha' : 'text-brand-mocha-700 hover:text-brand-mocha-900'
                          }`}
                        >
                          <span>{c}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-brand-mocha"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Skin Type */}
                <div className="py-5">
                  <h4 className="text-xs font-mono-clinical font-bold uppercase tracking-wider text-brand-mocha-900 mb-3">
                    Biocompatibility Type
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {skinTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedSkinType(t === 'All' ? '' : t)}
                        className={`py-1.5 px-2 text-[11px] font-mono-clinical uppercase border text-center transition-all ${
                          (selectedSkinType === t || (!selectedSkinType && t === 'All'))
                            ? 'border-brand-mocha bg-brand-mocha text-white font-bold shadow-xs'
                            : 'border-brand-silver bg-brand-canvas text-brand-mocha-700 hover:border-brand-mocha'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <main className="lg:col-span-9">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-brand-silver p-3 sm:p-4 animate-pulse bg-white">
                      <div className="aspect-square bg-brand-silver-light mb-3 sm:mb-4"></div>
                      <div className="h-3 bg-brand-silver-light w-3/4 mb-2"></div>
                      <div className="h-4 bg-brand-silver-light w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 sm:py-20 border border-brand-silver bg-white p-6 sm:p-8">
                  <h3 className="font-serif-luxury font-medium text-xl sm:text-2xl text-brand-mocha-900 mb-2">
                    No matching botanical products found
                  </h3>
                  <p className="text-xs font-mono-clinical text-brand-mocha-700 mb-6">
                    Try clearing specific concern tags or searching for a core active like "Shea" or "Barrier".
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="pressable px-6 py-3 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all shadow-sm"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
