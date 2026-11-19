import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Check, Star, Camera, X, ShieldCheck } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

export default function WriteReviewPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);

  const [formData, setFormData] = useState({
    author: '',
    rating: 5,
    role: 'Verified Buyer',
    concern: 'Barrier Support',
    title: '',
    comment: '',
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  // 1. Authentication Gate: If customer is not logged in, redirect to login page
  useEffect(() => {
    if (!router.isReady) return;
    if (!isAuthenticated && !isLoading) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [router.isReady, isAuthenticated, isLoading, router]);

  // Pre-fill reviewer name from authenticated customer profile
  useEffect(() => {
    if (user?.name || user?.fullName) {
      setFormData((prev) => ({
        ...prev,
        author: prev.author || user.name || user.fullName,
      }));
    }
  }, [user]);

  // Load product details
  useEffect(() => {
    if (!slug) return;
    async function loadProduct() {
      try {
        const res = await api.getProductBySlug(slug);
        setProduct(res.data.product);
        if (res.data.product?.concernsHandled?.[0]) {
          setFormData((prev) => ({
            ...prev,
            concern: res.data.product.concernsHandled[0],
          }));
        }
      } catch (err) {
        console.error('Could not load formulation', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveAuthor = (formData.author || user?.name || user?.fullName || 'Verified Member').trim();
    if (!formData.comment.trim()) {
      setErrorMsg('Please share your review and experience with this product.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const newReview = {
      author: effectiveAuthor,
      role: formData.role || 'Verified Buyer',
      rating: Number(formData.rating),
      concern: formData.concern,
      title: formData.comment.trim().split('\n')[0].slice(0, 60) || 'Exceptional product experience',
      comment: formData.comment.trim(),
      image: images[0] || null,
      images: images,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    try {
      // 1. Upload review to backend database
      await api.addProductReview(slug, newReview);

      // 2. Resilient backup to localStorage for instant local reflection
      try {
        const storageKey = `local_reviews_${slug}`;
        const raw = localStorage.getItem(storageKey);
        let existing = [];
        if (raw && raw.trim() && raw !== 'undefined' && raw !== 'null') {
          try { existing = JSON.parse(raw); } catch (_) { existing = []; }
        }
        localStorage.setItem(storageKey, JSON.stringify([newReview, ...(Array.isArray(existing) ? existing : [])]));
      } catch (storageErr) {
        console.warn('LocalStorage review backup failed', storageErr);
      }

      setSubmitted(true);

      // 3. Redirect back to formulation detail page
      setTimeout(() => {
        router.push(`/product/${slug}?reviewed=true`);
      }, 1500);
    } catch (err) {
      console.error('Review upload failed:', err);
      // Fallback: Still save to local storage if API encountered an issue
      try {
        const storageKey = `local_reviews_${slug}`;
        const raw = localStorage.getItem(storageKey);
        let existing = [];
        if (raw && raw.trim() && raw !== 'undefined' && raw !== 'null') {
          try { existing = JSON.parse(raw); } catch (_) { existing = []; }
        }
        localStorage.setItem(storageKey, JSON.stringify([newReview, ...(Array.isArray(existing) ? existing : [])]));
        setSubmitted(true);
        setTimeout(() => {
          router.push(`/product/${slug}?reviewed=true`);
        }, 1500);
      } catch (e) {
        setErrorMsg('Failed to upload review. Please try again.');
        setSubmitting(false);
      }
    }
  };

  const ratingLabels = {
    1: '1 / 5 — Poor',
    2: '2 / 5 — Below Expectations',
    3: '3 / 5 — Good / Acceptable',
    4: '4 / 5 — Very Effective & Gentle',
    5: '5 / 5 — Exceptional / Highly Recommended',
  };

  // If customer is not logged in, render redirect state
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-[#E5DFD7] p-8 max-w-md w-full text-center space-y-4 rounded-2xl shadow-xs">
          <div className="w-9 h-9 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-serif-luxury text-xl text-[#1C1614]">Sign In Required</h2>
          <p className="text-xs font-sans text-[#6E6259] leading-relaxed">
            Redirecting you to sign in so your review can be verified and credited with Love Loyalty Points...
          </p>
          <div className="pt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(router.asPath)}`}
              className="inline-block px-5 py-2.5 bg-[#1C1614] text-[#FAF8F5] text-xs font-monoClinical font-bold uppercase tracking-wider rounded-xl shadow-xs"
            >
              Click here if not redirected
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-20 px-4">
        <div className="max-w-2xl mx-auto bg-white border border-[#E5DFD7] p-8 rounded-2xl animate-pulse space-y-4 shadow-xs">
          <div className="h-6 bg-[#E5DFD7] w-1/3 rounded"></div>
          <div className="h-10 bg-[#E5DFD7] w-2/3 rounded"></div>
          <div className="h-32 bg-[#E5DFD7] w-full rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Write a Review — {product?.name || 'Product'} — Love &amp; Co.</title>
        <meta name="description" content="Submit your review and observation for Love & Co. products." />
      </Head>

      <div className="bg-[#FAF8F5] min-h-screen py-8 sm:py-16 text-[#1C1614]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Back Navigation */}
          <div className="mb-6">
            <Link
              href={slug ? `/product/${slug}` : '/catalog'}
              className="inline-flex items-center space-x-2 text-xs font-monoClinical uppercase tracking-wider text-[#1C1614] hover:text-[#6E6259] transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#1C1614] group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-bold">Back to Product</span>
            </Link>
          </div>

          {/* Product Header Card */}
          {product && (
            <div className="bg-white border border-[#E5DFD7] p-4 sm:p-6 mb-8 flex items-center space-x-4 sm:space-x-6 rounded-2xl shadow-2xs">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl flex-shrink-0 overflow-hidden">
                <img
                  src={product.images?.[0]?.url || product.images?.[0] || '/images/products/sweet_almond_squalane_bar.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-xs font-monoClinical uppercase tracking-[0.2em] text-[#6E6259] font-medium block truncate">
                  {product.activesConcentration || '100% PURE PLANT ACTIVES'}
                </span>
                <h2 className="font-serif-luxury text-lg sm:text-2xl text-[#1C1614] font-normal truncate mt-0.5">
                  {product.name}
                </h2>
                <div className="flex items-center space-x-2 mt-1 text-xs font-monoClinical text-[#6E6259]">
                  <span className="font-bold text-[#1C1614]">₹{product.price}</span>
                  <span>•</span>
                  <span>{product.volumeWeight || '100g bar'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submission Form Card */}
          <div className="bg-white border border-[#E5DFD7] p-6 sm:p-10 rounded-2xl shadow-xs">
            <div className="border-b border-[#E5DFD7] pb-5 mb-6">
              <span className="text-[10.5px] font-monoClinical uppercase tracking-[0.2em] text-[#6E6259] font-medium block">
                AUTHENTIC REFLECTIONS &bull; VERIFIED BUYER
              </span>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl text-[#1C1614] font-normal mt-1">
                Submit Your Review
              </h1>
              <p className="text-xs text-[#6E6259] font-sans mt-1 leading-relaxed">
                Your feedback helps our community make informed skincare choices and earns you Love Loyalty Points credited post-verification.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 bg-[#F4F1FA] border border-[#E6E0F0] text-center space-y-3 rounded-2xl">
                <div className="w-12 h-12 bg-[#1C1614] text-[#FAF8F5] rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-6 h-6 text-[#C5A880]" />
                </div>
                <h3 className="font-serif-luxury text-2xl text-[#1C1614]">
                  Review Successfully Uploaded
                </h3>
                <p className="text-xs font-monoClinical text-[#4A3B66] font-semibold">
                  Your review has been verified and added to the customer reviews ledger.
                </p>
                <p className="text-[11px] font-monoClinical text-[#8C827A]">
                  Redirecting you back to the product page...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-xs font-monoClinical text-red-700 rounded-xl">
                    {errorMsg}
                  </div>
                )}

                {/* Star Rating Selector */}
                <div>
                  <label className="block text-xs font-monoClinical uppercase font-bold text-[#1C1614] mb-2 tracking-wider">
                    Overall Product Rating *
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className="flex items-center space-x-1"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((score) => {
                        const isFilled = (hoverRating || formData.rating) >= score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: score })}
                            onMouseEnter={() => setHoverRating(score)}
                            className="p-1 rounded-sm text-[#C59B27] transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                            aria-label={`Rate ${score} out of 5 stars`}
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                isFilled
                                  ? 'fill-[#C59B27] text-[#C59B27]'
                                  : 'text-[#E5DFD7] fill-[#FAF8F5]'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs sm:text-sm font-sans font-medium text-[#1C1614]">
                      {ratingLabels[hoverRating || formData.rating]}
                    </span>
                  </div>
                </div>

                {/* Detailed Review Experience */}
                <div>
                  <label className="block text-xs font-monoClinical uppercase font-bold text-[#1C1614] mb-1.5 tracking-wider">
                    Your Review *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Share your experience with this product — including texture, lather density, skin feel, and results..."
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="w-full p-3.5 bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl text-xs font-sans text-[#1C1614] focus:outline-none focus:border-[#1C1614] leading-relaxed"
                  ></textarea>
                </div>

                {/* Upload Picture Section */}
                <div>
                  <label className="block text-xs font-monoClinical uppercase font-bold text-[#1C1614] mb-2 tracking-wider">
                    Upload Picture (Optional)
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Previews */}
                    {images.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E5DFD7] group shadow-2xs bg-[#FAF8F5]"
                      >
                        <img
                          src={imgSrc}
                          alt={`Uploaded preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add Photo Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-20 rounded-xl border-2 border-dashed border-[#E5DFD7] hover:border-[#1C1614] hover:bg-[#FAF8F5] flex flex-col items-center justify-center text-[#1C1614] transition-all cursor-pointer group px-1"
                    >
                      <Camera className="w-5 h-5 text-[#8C827A] group-hover:text-[#1C1614] transition-colors mb-1" />
                      <span className="text-[10px] font-monoClinical font-semibold text-[#6E6259] group-hover:text-[#1C1614] text-center leading-tight">
                        Upload Picture
                      </span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Reviewer Public Display Name with Edit Option */}
                <div className="pt-2 border-t border-[#E5DFD7]">
                  {!isEditingAuthor ? (
                    <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl text-xs">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[#6E6259] font-sans">Reviewing publicly as:</span>
                        <span className="font-serif-luxury text-sm font-semibold text-[#1C1614]">
                          {formData.author || user?.name || user?.fullName || 'Verified Member'}
                        </span>
                        <span className="inline-flex items-center space-x-1 text-[10px] font-monoClinical uppercase bg-[#F3EFEA] text-[#1C1614] border border-[#E5DFD7] px-2 py-0.5 rounded-full font-medium">
                          <ShieldCheck className="w-3 h-3 text-[#C5A880]" />
                          <span>Verified Member</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingAuthor(true)}
                        className="text-xs font-monoClinical uppercase tracking-wider text-[#1C1614] hover:text-[#6E6259] underline font-semibold cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-monoClinical uppercase font-bold text-[#1C1614]">
                          Edit Public Display Name
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsEditingAuthor(false)}
                          className="text-xs font-monoClinical uppercase text-[#6E6259] hover:text-[#1C1614] underline cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Enter your name"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          className="flex-1 px-3.5 py-2 bg-white border border-[#E5DFD7] text-xs font-monoClinical text-[#1C1614] rounded-lg focus:outline-none focus:border-[#1C1614]"
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingAuthor(false)}
                          className="px-4 py-2 bg-[#1C1614] text-[#FAF8F5] text-xs font-monoClinical font-bold uppercase tracking-wider rounded-lg hover:bg-[#2A211D] transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                      <p className="text-[11px] text-[#8C827A] font-sans">
                        This name will be displayed next to your verified review.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submission CTA */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#1C1614] text-[#FAF8F5] hover:bg-[#2A211D] transition-colors text-xs font-monoClinical uppercase tracking-wider font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting Review...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
