import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Edit3, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import ProductGallery from '../../components/product/ProductGallery';
import ProductPurchasePanel from '../../components/product/ProductPurchasePanel';
import IngredientsDeepDive from '../../components/product/IngredientsDeepDive';
import RecommendationsCarousel from '../../components/product/RecommendationsCarousel';
import CustomerReviewsSection from '../../components/product/CustomerReviewsSection';
import ProductFaqSection from '../../components/product/ProductFaqSection';

import { mockProducts } from '../../data/mockProducts';

const FALLBACK_PRODUCTS = mockProducts.reduce((acc, p) => {
  if (p.slug) acc[p.slug] = p;
  if (p.handle) acc[p.handle] = p;
  return acc;
}, {});

const DEFAULT_PRODUCT =
  FALLBACK_PRODUCTS['love-and-co-bloom-neem-turmeric-soap'] ||
  mockProducts[0] ||
  null;

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin =
    isAuthenticated &&
    user?.role === 'admin' &&
    ['loveandcosupport@gmail.com', 'loveandcoadmin@gmail.com'].includes((user?.email || '').toLowerCase().trim());

  // Instant zero-delay initial state from local catalogue
  const syncFallback = slug ? (FALLBACK_PRODUCTS[slug] || DEFAULT_PRODUCT) : DEFAULT_PRODUCT;
  const [product, setProduct] = useState(syncFallback);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!router.isReady) return;

    // If no slug in query, fallback gracefully
    if (!slug) {
      setProduct(DEFAULT_PRODUCT);
      setLoading(false);
      return;
    }

    // Immediately populate local product in 0ms to eliminate loading lag
    const instantItem = FALLBACK_PRODUCTS[slug] || DEFAULT_PRODUCT;
    if (instantItem && (!product || product.slug !== slug)) {
      setProduct(instantItem);
    }

    let isMounted = true;
    async function fetchProduct() {
      if (!instantItem && !product) {
        setLoading(true);
      }

      // Check persistent admin products in localStorage
      let persistentOverride = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('love_co_admin_products_v1');
          if (stored && stored.trim() && stored !== 'undefined' && stored !== 'null') {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              persistentOverride = parsed.find((p) => p.slug === slug || p._id === slug || p.handle === slug);
            }
          }
        } catch (e) {}
      }

      try {
        const res = await api.getProductBySlug(slug);
        if (isMounted && res.data?.product) {
          const merged = persistentOverride ? { ...res.data.product, ...persistentOverride } : res.data.product;
          setProduct(merged);
          setRelated(res.data.related || []);
          if (res.data.product.reviews) {
            setReviews(res.data.product.reviews);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('API query failed, loading clinical mock dataset fallback', err);
      }

      // Fallback matching or default
      if (isMounted) {
        const fallback =
          persistentOverride ||
          FALLBACK_PRODUCTS[slug] ||
          DEFAULT_PRODUCT;
        setProduct(fallback);
        setLoading(false);
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, slug]);

  const currentProduct = product || (slug ? FALLBACK_PRODUCTS[slug] : null) || DEFAULT_PRODUCT;

  if (loading && !currentProduct) {
    return (
      <div className="min-h-screen bg-white py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-neutral-100 border border-neutral-200"></div>
          <div className="space-y-4">
            <div className="h-4 bg-neutral-200 w-1/3"></div>
            <div className="h-8 bg-neutral-200 w-3/4"></div>
            <div className="h-5 bg-neutral-200 w-1/4"></div>
            <div className="h-24 bg-neutral-200 w-full"></div>
            <div className="h-12 bg-neutral-200 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${currentProduct?.name || 'Product'} — Love & Co. Products`}</title>
        <meta
          name="description"
          content={currentProduct?.tagline || currentProduct?.activesConcentration || 'Love & Co. Cold-Pressed Botanical Products'}
        />
      </Head>

      <main className="bg-[#FAF8F5] min-h-screen font-sans text-[#1C1614]">
        {/* Top Minimalist Back Navigation */}
        <div className="border-b border-[#E5DFD7] bg-[#FAF8F5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center space-x-1.5 text-xs font-monoClinical uppercase tracking-wider text-[#1C1614] hover:text-[#6E6259] transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#1C1614] group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-semibold">Back to Catalog</span>
            </button>

            {isAdmin && (
              <Link
                href={`/admin/products?edit=${currentProduct._id || currentProduct.slug || currentProduct.id}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#1C1614] hover:bg-[#342721] text-white text-xs font-semibold rounded-lg shadow-xs transition"
                title="Edit this product in admin portal"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Product (Admin)</span>
              </Link>
            )}
          </div>
        </div>

        {/* Admin Product Management Strip */}
        {isAdmin && (
          <div className="bg-amber-50 border-b border-amber-300 py-2.5 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="p-1 bg-amber-200 text-amber-950 rounded font-mono font-bold text-[10px]">ADMIN VIEW</span>
                <span className="font-semibold text-amber-950">
                  Customer view for: {currentProduct.name || currentProduct.title}
                </span>
                <span className="text-[11px] text-amber-800 hidden md:inline">
                  (Stock: {currentProduct.totalStock || currentProduct.stockQty || 0} units • ₹{currentProduct.price})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/admin/products?edit=${currentProduct._id || currentProduct.slug || currentProduct.id}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#1C1614] hover:bg-[#3E2E25] text-white font-semibold rounded-lg shadow-2xs transition text-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Formulation & Batches</span>
                </Link>
                <Link
                  href="/admin/inventory"
                  className="px-2.5 py-1 bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-950 font-medium rounded-lg transition text-xs"
                >
                  Batch List
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Above-the-Fold 2-Column Product Showcase */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Image Gallery (ProductGallery.jsx) */}
            <div className="lg:col-span-6 lg:sticky lg:top-24">
              <ProductGallery
                images={currentProduct.images}
                name={currentProduct.name}
                isBestSeller={currentProduct.isBestSeller}
                isNewLaunch={currentProduct.isNewLaunch}
              />
            </div>

            {/* Right Column: Purchase Panel (ProductPurchasePanel.jsx) */}
            <div className="lg:col-span-6">
              <ProductPurchasePanel product={currentProduct} />
            </div>
          </div>
        </div>

        {/* Section C: Ingredients Deep Dive */}
        <IngredientsDeepDive product={currentProduct} />

        {/* Section D: Recommendations Carousel ("You Might Also Like") */}
        <RecommendationsCarousel
          currentSlug={currentProduct.slug}
          relatedProducts={related}
        />

        {/* Section E: Detailed Customer Reviews Hub */}
        <CustomerReviewsSection product={currentProduct} initialReviews={reviews} />

        {/* Section F: FAQs & Legal Specifications */}
        <ProductFaqSection product={currentProduct} />
      </main>
    </>
  );
}
