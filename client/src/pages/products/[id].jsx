import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Edit3 } from 'lucide-react';
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
  if (p._id) acc[p._id] = p;
  if (p.id) acc[p.id] = p;
  return acc;
}, {});

const DEFAULT_PRODUCT =
  FALLBACK_PRODUCTS['love-and-co-bloom-neem-turmeric-soap'] ||
  mockProducts[0] ||
  null;

export default function ProductDetailPageById() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin =
    isAuthenticated &&
    user?.role === 'admin' &&
    ['loveandcosupport@gmail.com', 'loveandcoadmin@gmail.com'].includes((user?.email || '').toLowerCase().trim());

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    if (!id) {
      setProduct(DEFAULT_PRODUCT);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchProduct() {
      setLoading(true);

      // Check persistent admin products in localStorage
      let persistentOverride = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('love_co_admin_products_v1');
          if (stored && stored.trim() && stored !== 'undefined' && stored !== 'null') {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              persistentOverride = parsed.find(
                (p) => p.slug === id || p._id === id || p.id === id || p.handle === id
              );
            }
          }
        } catch (e) {}
      }

      try {
        const res = await api.getProductBySlug(id);
        if (isMounted && res.data?.product) {
          const merged = persistentOverride
            ? { ...res.data.product, ...persistentOverride }
            : res.data.product;
          setProduct(merged);
          setRelated(res.data.related || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('API query failed for product, attempting fallback:', err);
      }

      if (isMounted) {
        const fallback =
          persistentOverride ||
          FALLBACK_PRODUCTS[id] ||
          DEFAULT_PRODUCT;
        setProduct(fallback);
        setLoading(false);
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center">
        <div className="text-center space-y-3 font-mono text-xs text-[#4A3B32]">
          <div className="w-8 h-8 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Accessing cold-pressed formulation dossier...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-serif-luxury font-bold text-[#1C1614] mb-2">
          Formulation Not Found
        </h2>
        <p className="text-xs text-[#4A3B32] mb-6 max-w-md font-sans">
          The requested small-batch formulation is currently unavailable or has been archived from the catalog.
        </p>
        <Link
          href="/catalog"
          className="px-6 py-2.5 bg-[#1C1614] text-[#FAF9F8] text-xs font-mono uppercase tracking-widest rounded-xl hover:bg-[#2A211D] transition"
        >
          Return to Apothecary Catalog
        </Link>
      </div>
    );
  }

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isPrimary)?.url || product.images[0].url
      : '/images/products/bloom_neem_turmeric_soap.jpg';

  const currentStock = product.stock !== undefined ? product.stock : (product.stockQty !== undefined ? product.stockQty : 50);
  const isSoldOut = currentStock === 0 || product.status === 'OUT_OF_STOCK';

  return (
    <div className="bg-[#FAF9F8] min-h-screen">
      <Head>
        <title>{product.name || 'Botanical Formulation'} | LOVE & Co.</title>
        <meta
          name="description"
          content={product.tagline || product.subtitle || 'Small-batch luxury skincare formulated with cold-pressed actives.'}
        />
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Back Link & Admin Edit Shortcut */}
        <div className="flex items-center justify-between">
          <Link
            href="/catalog"
            className="inline-flex items-center space-x-2 text-xs font-monoClinical uppercase tracking-wider text-[#4A3B32] hover:text-[#1C1614] transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </Link>

          {isAdmin && (
            <Link
              href={`/admin/products?edit=${product._id || product.slug || product.id}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1C1614] text-white text-[11px] font-mono tracking-wider uppercase hover:bg-[#2A211D] transition shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#D8D0E3]" />
              <span>Edit in Admin Desk</span>
            </Link>
          )}
        </div>

        {/* Sold Out Banner if Out of Stock */}
        {isSoldOut && (
          <div className="bg-[#FAF9F8] border border-[#EAE6DF] rounded-2xl p-4 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-3 text-[#1C1614]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A3B32] animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">
                Sold Out / Restocking Soon
              </span>
              <span className="text-[#4A3B32]/70 hidden sm:inline">
                This handcrafted batch has sold out. Next small-batch harvest is undergoing saponification curing.
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-[#E8E3EE] text-[#4A3B32] px-2.5 py-1 rounded-full font-semibold border border-[#D8D0E3]">
              Atelier Notification Active
            </span>
          </div>
        )}

        {/* Product Showcase: Gallery & Purchase Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <ProductGallery
            images={product.images && product.images.length > 0 ? product.images : [{ url: primaryImage, alt: product.name }]}
            productName={product.name}
          />
          <ProductPurchasePanel product={product} />
        </div>

        {/* Deep Dive & Science */}
        <IngredientsDeepDive product={product} />

        {/* Customer Reviews */}
        <CustomerReviewsSection
          product={product}
          reviews={product.reviews || []}
        />

        {/* FAQs */}
        <ProductFaqSection product={product} />

        {/* Related Products Carousel */}
        {related && related.length > 0 && (
          <RecommendationsCarousel
            title="Complementary Products"
            products={related}
          />
        )}
      </main>
    </div>
  );
}

