import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Truck,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Check,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  Shield,
  HelpCircle,
  Tag
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useStoreStatusStore } from '../store/storeStatusStore';
import { api } from '../lib/api';
import RitualRewardsCheckoutSelector from '../components/loyalty/RitualRewardsCheckoutSelector';

export default function CheckoutPage() {
  const router = useRouter();
  const { storeStatus } = useStoreStatusStore();
  const {
    items,
    getSubtotal,
    getBundleDiscountPercentage,
    getDiscountAmount,
    getShippingFee,
    getGrandTotal,
    clearCart,
    sessionId,
    promoCode,
    appliedReward,
  } = useCartStore();

  const { user, isAuthenticated } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  // Authentication Guard: Ensure user is logged in before proceeding with checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('love_co_token');
      if (!isAuthenticated && !token) {
        router.replace('/login?redirect=/checkout');
      } else {
        setAuthChecked(true);
      }
    }
  }, [isAuthenticated, router]);

  const [shippingAddress, setShippingAddress] = useState({
    recipientName: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
  });

  const [paymentProvider, setPaymentProvider] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockReserved, setStockReserved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      const defaultAddr = user.savedAddresses?.find((a) => a.isDefault) || user.savedAddresses?.[0];
      const rawPhone = user.phone || defaultAddr?.phone || '';
      const sanitizedPhone = rawPhone.replace(/\D/g, '').slice(-10);
      setShippingAddress({
        recipientName: user.fullName || defaultAddr?.recipientName || '',
        street: defaultAddr?.street || '',
        city: defaultAddr?.city || '',
        state: defaultAddr?.state || '',
        pincode: defaultAddr?.pincode || '',
        phone: sanitizedPhone,
        email: user.email || '',
      });
    }
  }, [user]);

  // Attempt Redis 15-minute stock reservation on checkout mount
  useEffect(() => {
    if (items.length > 0 && sessionId) {
      const reservePayload = items.map((i) => ({
        productId: i.id || i._id,
        slug: i.slug,
        name: i.name || i.title,
        quantity: i.quantity,
      }));

      api.reserveStock(reservePayload, sessionId)
        .then(() => setStockReserved(true))
        .catch((err) => {
          console.warn('Stock reservation error:', err.response?.data?.error || err.message);
        });
    }
  }, [items, sessionId]);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const discountPct = getBundleDiscountPercentage();
  const shippingFee = getShippingFee();
  const grandTotal = getGrandTotal();

  if (!authChecked && !isAuthenticated && (typeof window === 'undefined' || !localStorage.getItem('love_co_token'))) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-3xl border-2 border-brand-silver p-8 text-center shadow-lg">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-brand-mocha border-t-transparent rounded-full animate-spin" />
          <h2 className="font-serifLuxury text-2xl text-brand-mocha-900 mb-2 font-normal">
            Redirecting to Sign In...
          </h2>
          <p className="text-xs font-sans text-brand-mocha-900/70">
            Please sign in to securely access checkout and reserve your order.
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting && !showCelebration) {
    return (
      <div className="min-h-screen bg-[#FAF9F8] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-3xl border-2 border-brand-silver p-8 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#E6E0F0] border-2 border-brand-silver flex items-center justify-center text-brand-mocha shadow-sm">
            <ShoppingBag className="w-9 h-9 stroke-[1.6]" />
          </div>
          <h2 className="font-serifLuxury text-3xl text-brand-mocha-900 mb-2 font-normal">
            Your Shopping Bag is Empty
          </h2>
          <p className="text-xs font-sans text-brand-mocha-900/70 mb-8 leading-relaxed">
            Select your preferred cold-pressed botanical products and therapeutic care essentials before accessing checkout.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-monoClinical font-bold uppercase tracking-wider transition-all duration-200 shadow-md"
          >
            Explore Products &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setShippingAddress((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleImmediateRedirect = () => {
    if (confirmedOrder?.orderNumber) {
      router.push(`/orders/${confirmedOrder.orderNumber}`);
    }
  };

  const handleCompleteOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (storeStatus?.isPaused) {
      setErrorMsg(storeStatus.pauseNotice || 'Orders are temporarily paused for curing. Please check back shortly.');
      return;
    }

    if (!shippingAddress.recipientName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.pincode) {
      setErrorMsg('Please complete all required shipping fields');
      return;
    }

    if (!shippingAddress.phone || shippingAddress.phone.length !== 10 || !/^\d{10}$/.test(shippingAddress.phone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!paymentProvider) {
      setErrorMsg('Please select a payment method before confirming your order');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.id || i._id,
          slug: i.slug,
          name: i.name || i.title,
          quantity: i.quantity,
          isBundleItem: i.isBundleItem,
        })),
        shippingAddress,
        paymentProvider,
        sessionId,
        couponCode: appliedReward?.code || promoCode,
      };

      const res = await api.checkout(payload);
      const { order } = res.data;

      // Celebrate and clear cart
      setConfirmedOrder(order);
      setShowCelebration(true);
      setIsSubmitting(false);

      clearCart();

      // Show celebration popup for ~3 seconds, then transition to order page
      setTimeout(() => {
        router.push(`/orders/${order.orderNumber}`);
      }, 3000);
    } catch (err) {
      console.error('Checkout failed', err);
      setErrorMsg(err.response?.data?.error || 'Order initialization failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Secure Checkout — Love &amp; Co. Botanical Atelier</title>
      </Head>

      <div className="bg-[#FAF9F8] min-h-screen text-brand-mocha-900">
        {/* Top Luxury Checkout Navigation Bar */}
        <header className="bg-white/95 backdrop-blur-md border-b-2 border-brand-silver sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Stepper */}
            <div className="flex items-center space-x-3 text-xs font-monoClinical">
              <div className="flex items-center text-brand-mocha font-bold">
                <span className="w-5 h-5 rounded-full bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver flex items-center justify-center mr-1.5 text-[10px] font-bold">
                  ✓
                </span>
                <span>Bag</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-brand-silver" />
              <div className="flex items-center text-brand-mocha-900 font-bold">
                <span className="w-5 h-5 rounded-full bg-brand-mocha text-white flex items-center justify-center mr-1.5 text-[10px]">
                  2
                </span>
                <span>Details &amp; Shipping</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-brand-silver" />
              <div className="flex items-center text-brand-mocha-900/40">
                <span className="w-5 h-5 rounded-full bg-brand-silver-light border border-brand-silver text-brand-mocha-900/50 flex items-center justify-center mr-1.5 text-[10px]">
                  3
                </span>
                <span>Payment</span>
              </div>
            </div>

            {/* Trust badge in Pale Lavender */}
            <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#E6E0F0] border border-brand-silver rounded-full text-xs text-brand-mocha-900 font-bold shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-brand-mocha stroke-[2]" />
              <span className="hidden sm:inline font-monoClinical text-[11px] tracking-wide">256-Bit SSL Encrypted</span>
              <span className="sm:hidden font-monoClinical text-[11px]">Secure</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb / Back Link */}
          <div className="mb-6">
            <Link
              href="/catalog"
              className="inline-flex items-center text-xs font-monoClinical font-bold text-brand-mocha hover:text-brand-mocha-900 transition-colors gap-1.5 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Return to Shopping Bag &amp; Catalog</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Shipping & Payment Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Redis Stock Hold Banner in Pale Lavender */}
              {stockReserved && (
                <div className="p-4 bg-[#E6E0F0]/60 border-2 border-brand-silver rounded-2xl flex items-center justify-between text-xs text-brand-mocha-900 shadow-sm animate-fadeIn">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-brand-silver flex items-center justify-center flex-shrink-0 text-brand-mocha">
                      <Clock className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <p className="font-bold text-brand-mocha-900">
                        Batch inventory reserved for your session
                      </p>
                      <p className="text-[11px] text-brand-mocha-900/70">
                        15-minute guaranteed hold prevents batch sell-outs during checkout.
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-mocha text-white font-monoClinical text-[10px] font-bold tracking-wider uppercase shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Active Hold
                  </span>
                </div>
              )}

              {/* Error Notification */}
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-sans text-red-700 flex items-center space-x-3 shadow-sm animate-fadeIn">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-700" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCompleteOrder} className="space-y-8">
                {/* 1. Contact & Shipping Address Card */}
                <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-brand-silver">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-full bg-brand-mocha text-white flex items-center justify-center text-xs font-monoClinical font-bold shadow-2xs">
                        1
                      </span>
                      <h3 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal tracking-wide">
                        Shipping Destination &amp; Recipient
                      </h3>
                    </div>
                    {isAuthenticated && (
                      <span className="text-[11px] font-monoClinical font-bold text-brand-mocha-900 bg-[#E6E0F0] border border-brand-silver px-3 py-1 rounded-full">
                        Saved Profile Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider mb-1.5 font-sans">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="recipientName"
                        required
                        value={shippingAddress.recipientName}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-[#FCFBF9] border-2 border-brand-silver rounded-xl focus:outline-none focus:border-brand-mocha focus:bg-white focus:ring-2 focus:ring-brand-lavender transition-all text-brand-mocha-900 placeholder:text-stone-400 font-sans text-sm"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider mb-1.5 font-sans">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={shippingAddress.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 bg-[#FCFBF9] border-2 border-brand-silver rounded-xl focus:outline-none focus:border-brand-mocha focus:bg-white focus:ring-2 focus:ring-brand-lavender transition-all text-brand-mocha-900 placeholder:text-stone-400 font-sans text-sm"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider font-sans">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-monoClinical font-bold text-brand-mocha/70">
                          {shippingAddress.phone ? `${shippingAddress.phone.length}/10 digits` : '10 digits'}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-xs font-monoClinical font-bold text-brand-mocha-900/70 border-r-2 border-brand-silver pr-2.5 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          required
                          maxLength={10}
                          pattern="[0-9]{10}"
                          inputMode="numeric"
                          value={shippingAddress.phone}
                          onChange={handleInputChange}
                          placeholder="9876543210"
                          className="w-full pl-16 pr-4 py-3 bg-[#FCFBF9] border-2 border-brand-silver rounded-xl focus:outline-none focus:border-brand-mocha focus:bg-white focus:ring-2 focus:ring-brand-lavender transition-all text-brand-mocha-900 placeholder:text-stone-400 font-sans text-sm tracking-wide"
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-brand-mocha-900/60 font-sans">
                        Must contain exactly 10 numeric digits.
                      </p>
                    </div>

                    {/* Street Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider mb-1.5 font-sans">
                        Street Address, Apartment &amp; Landmark <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="street"
                        required
                        value={shippingAddress.street}
                        onChange={handleInputChange}
                        placeholder="House / Flat No., Building Name, Street"
                        className="w-full px-4 py-3 bg-[#FCFBF9] border-2 border-brand-silver rounded-xl focus:outline-none focus:border-brand-mocha focus:bg-white focus:ring-2 focus:ring-brand-lavender transition-all text-brand-mocha-900 placeholder:text-stone-400 font-sans text-sm"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider mb-1.5 font-sans">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={shippingAddress.city}
                        onChange={handleInputChange}
                        placeholder="Bengaluru"
                        className="w-full px-4 py-3 bg-[#FCFBF9] border-2 border-brand-silver rounded-xl focus:outline-none focus:border-brand-mocha focus:bg-white focus:ring-2 focus:ring-brand-lavender transition-all text-brand-mocha-900 placeholder:text-stone-400 font-sans text-sm"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider mb-1.5 font-sans">
                        State / Province <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={shippingAddress.state}
                        onChange={handleInputChange}
                        placeholder="Karnataka"
                        className="w-full px-4 py-3 bg-[#FCFBF9] border-2 border-brand-silver rounded-xl focus:outline-none focus:border-brand-mocha focus:bg-white focus:ring-2 focus:ring-brand-lavender transition-all text-brand-mocha-900 placeholder:text-stone-400 font-sans text-sm"
                      />
                    </div>

                    {/* PIN Code */}
                    <div>
                      <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider mb-1.5 font-sans">
                        PIN / Postal Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={shippingAddress.pincode}
                        onChange={handleInputChange}
                        placeholder="560038"
                        className="w-full px-4 py-3 bg-[#FCFBF9] border-2 border-brand-silver rounded-xl focus:outline-none focus:border-brand-mocha focus:bg-white focus:ring-2 focus:ring-brand-lavender transition-all text-brand-mocha-900 placeholder:text-stone-400 font-sans text-sm"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-[11px] font-bold text-brand-mocha-900 uppercase tracking-wider mb-1.5 font-sans">
                        Country
                      </label>
                      <div className="w-full px-4 py-3 bg-[#E6E0F0]/40 border-2 border-brand-silver rounded-xl text-brand-mocha-900 font-sans text-sm flex items-center justify-between">
                        <span className="font-semibold">India</span>
                        <span className="text-[10px] text-brand-mocha uppercase font-monoClinical tracking-wider font-bold">Domestic Express</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method Selector Card */}
                <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-brand-silver">
                    <div className="flex items-center space-x-3">
                      <span className="w-8 h-8 rounded-full bg-brand-mocha text-white flex items-center justify-center text-xs font-monoClinical font-bold shadow-2xs">
                        2
                      </span>
                      <h3 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal tracking-wide">
                        Select Payment Method
                      </h3>
                    </div>
                    {!paymentProvider ? (
                      <span className="text-[10px] font-monoClinical uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                        Selection Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-monoClinical uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                        Selected: {paymentProvider}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Razorpay Option */}
                    <label
                      onClick={() => {
                        setPaymentProvider('Razorpay');
                        if (errorMsg.includes('payment method')) setErrorMsg('');
                      }}
                      className={`relative flex items-start justify-between p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentProvider === 'Razorpay'
                          ? 'border-brand-mocha bg-[#E6E0F0]/30 shadow-xs'
                          : 'border-brand-silver bg-white hover:border-brand-mocha/40 hover:bg-[#FAF9F8]'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="pt-0.5">
                          <input
                            type="radio"
                            name="paymentProvider"
                            value="Razorpay"
                            checked={paymentProvider === 'Razorpay'}
                            onChange={() => {
                              setPaymentProvider('Razorpay');
                              if (errorMsg.includes('payment method')) setErrorMsg('');
                            }}
                            className="w-4 h-4 text-brand-mocha border-brand-silver focus:ring-brand-mocha cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serifLuxury text-base font-medium text-brand-mocha-900">
                              Razorpay Secure
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver font-monoClinical text-[10px] font-bold uppercase tracking-wider">
                              Fastest &amp; Recommended
                            </span>
                          </div>
                          <p className="text-xs text-brand-mocha-900/70 mt-1 font-sans">
                            Instant UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Cred.
                          </p>
                          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-monoClinical font-semibold text-brand-mocha-900">
                            <span className="px-2 py-0.5 bg-brand-silver-light border border-brand-silver rounded-md">UPI</span>
                            <span className="px-2 py-0.5 bg-brand-silver-light border border-brand-silver rounded-md">GPay</span>
                            <span className="px-2 py-0.5 bg-brand-silver-light border border-brand-silver rounded-md">PhonePe</span>
                            <span className="px-2 py-0.5 bg-brand-silver-light border border-brand-silver rounded-md">Cards</span>
                          </div>
                        </div>
                      </div>
                      <CreditCard className={`w-5 h-5 flex-shrink-0 mt-0.5 ${paymentProvider === 'Razorpay' ? 'text-brand-mocha' : 'text-brand-silver-dark'}`} />
                    </label>

                    {/* Stripe Global Option */}
                    <label
                      onClick={() => {
                        setPaymentProvider('Stripe');
                        if (errorMsg.includes('payment method')) setErrorMsg('');
                      }}
                      className={`relative flex items-start justify-between p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentProvider === 'Stripe'
                          ? 'border-brand-mocha bg-[#E6E0F0]/30 shadow-xs'
                          : 'border-brand-silver bg-white hover:border-brand-mocha/40 hover:bg-[#FAF9F8]'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="pt-0.5">
                          <input
                            type="radio"
                            name="paymentProvider"
                            value="Stripe"
                            checked={paymentProvider === 'Stripe'}
                            onChange={() => {
                              setPaymentProvider('Stripe');
                              if (errorMsg.includes('payment method')) setErrorMsg('');
                            }}
                            className="w-4 h-4 text-brand-mocha border-brand-silver focus:ring-brand-mocha cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serifLuxury text-base font-medium text-brand-mocha-900">
                              Stripe Global Cards
                            </span>
                          </div>
                          <p className="text-xs text-brand-mocha-900/70 mt-1 font-sans">
                            International Visa, Mastercard, American Express with 3D Secure verification.
                          </p>
                        </div>
                      </div>
                      <CreditCard className={`w-5 h-5 flex-shrink-0 mt-0.5 ${paymentProvider === 'Stripe' ? 'text-brand-mocha' : 'text-brand-silver-dark'}`} />
                    </label>

                    {/* Cash on Delivery Option */}
                    <label
                      onClick={() => {
                        setPaymentProvider('COD');
                        if (errorMsg.includes('payment method')) setErrorMsg('');
                      }}
                      className={`relative flex items-start justify-between p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        paymentProvider === 'COD'
                          ? 'border-brand-mocha bg-[#E6E0F0]/30 shadow-xs'
                          : 'border-brand-silver bg-white hover:border-brand-mocha/40 hover:bg-[#FAF9F8]'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="pt-0.5">
                          <input
                            type="radio"
                            name="paymentProvider"
                            value="COD"
                            checked={paymentProvider === 'COD'}
                            onChange={() => {
                              setPaymentProvider('COD');
                              if (errorMsg.includes('payment method')) setErrorMsg('');
                            }}
                            className="w-4 h-4 text-brand-mocha border-brand-silver focus:ring-brand-mocha cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serifLuxury text-base font-medium text-brand-mocha-900">
                              Cash on Delivery (COD)
                            </span>
                          </div>
                          <p className="text-xs text-brand-mocha-900/70 mt-1 font-sans">
                            Pay in cash or scan delivery agent QR code upon package handover at your doorstep.
                          </p>
                        </div>
                      </div>
                      <Truck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${paymentProvider === 'COD' ? 'text-brand-mocha' : 'text-brand-silver-dark'}`} />
                    </label>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm font-monoClinical font-bold uppercase tracking-wider flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2.5">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                        <span className="tracking-wider">Securing Inventory &amp; Finalizing Order...</span>
                      </span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-[#E6E0F0]" />
                        <span>Confirm Order</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>

                  {/* Trust guarantees bar */}
                  <div className="grid grid-cols-3 gap-2.5 text-center pt-2">
                    <div className="p-3 rounded-xl bg-white border-2 border-brand-silver flex flex-col items-center shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-brand-mocha mb-1" />
                      <span className="text-[10.5px] font-sans font-semibold text-brand-mocha-900">100% Biocompatible</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border-2 border-brand-silver flex flex-col items-center shadow-2xs">
                      <Truck className="w-4 h-4 text-brand-mocha mb-1" />
                      <span className="text-[10.5px] font-sans font-semibold text-brand-mocha-900">Climate Express</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border-2 border-brand-silver flex flex-col items-center shadow-2xs">
                      <Lock className="w-4 h-4 text-brand-mocha mb-1" />
                      <span className="text-[10.5px] font-sans font-semibold text-brand-mocha-900">Encrypted Vault</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Order Summary Card (Sticky) */}
            <div className="lg:col-span-5 sticky top-28 space-y-4">
              {/* Available Ritual Rewards Selector */}
              <RitualRewardsCheckoutSelector className="mb-2" />

              <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-silver">
                  <h3 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal tracking-wide">
                    Order Summary
                  </h3>
                  <span className="text-xs font-monoClinical px-3 py-1 rounded-full bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver font-bold">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3.5 max-h-72 overflow-y-auto divide-y divide-brand-silver/50 pr-1 scrollbar-thin">
                  {items.map((item) => (
                    <div key={item.id || item._id} className="pt-3.5 first:pt-0 flex space-x-3.5 text-xs">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FAF9F8] border-2 border-brand-silver flex-shrink-0">
                        <img
                          src={item.image || ''}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-brand-mocha text-white text-[9px] font-monoClinical font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                          ×{item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="font-serifLuxury text-sm font-medium text-brand-mocha-900 line-clamp-1 leading-snug">
                            {item.name}
                          </div>
                          {item.activesConcentration && (
                            <div className="text-[10px] font-monoClinical text-brand-mocha-900/60 mt-0.5">
                              {item.activesConcentration}
                            </div>
                          )}
                          {item.isBundleItem && (
                            <span className="inline-block mt-1 text-[9px] font-monoClinical px-2 py-0.5 rounded bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver uppercase tracking-wider font-semibold">
                              Curated Regimen
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-xs font-monoClinical mt-1">
                          <span className="text-brand-mocha-900/60 text-[11px]">Qty: {item.quantity}</span>
                          <div className="text-right">
                            <span className="font-bold text-brand-mocha-900">₹{item.price * item.quantity}</span>
                            {(item.compareAtPrice > item.price || item.mrp > item.price) && (
                              <span className="text-[10px] text-brand-mocha-900/40 line-through ml-1.5 font-normal">
                                ₹{(item.compareAtPrice || item.mrp) * item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Calculations */}
                <div className="pt-4 mt-4 border-t border-brand-silver space-y-2.5 text-xs font-sans">
                  <div className="flex justify-between text-brand-mocha-900/70">
                    <span>Subtotal</span>
                    <span className="font-monoClinical text-brand-mocha-900 font-semibold">₹{subtotal}</span>
                  </div>

                  {discountAmount > 0 && (promoCode || appliedReward) && (
                    <div className="flex justify-between text-brand-mocha font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-brand-mocha" />
                        Coupon Discount ({appliedReward ? (appliedReward.code || appliedReward.description) : promoCode})
                      </span>
                      <span className="font-monoClinical">-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-brand-mocha-900/70">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-brand-mocha" />
                      Climate-Neutral Delivery
                    </span>
                    <span className="font-monoClinical">
                      {shippingFee === 0 ? (
                        <span className="text-brand-mocha font-bold uppercase tracking-wider text-[11px]">Free</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3.5 border-t border-brand-silver flex justify-between items-baseline">
                    <div>
                      <div className="font-serifLuxury text-base text-brand-mocha-900 font-semibold">Total Amount</div>
                      <div className="text-[10px] text-brand-mocha-900/60 font-sans">Includes all botanical products &amp; taxes</div>
                    </div>
                    <div className="font-monoClinical font-bold text-2xl text-brand-mocha-900">
                      ₹{grandTotal}
                    </div>
                  </div>
                </div>

                {/* Guarantee certificate card */}
                <div className="mt-5 p-4 bg-[#E6E0F0]/60 border-2 border-brand-silver rounded-2xl text-xs font-sans text-brand-mocha-900 flex items-start space-x-3 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-brand-mocha flex-shrink-0 mt-0.5 stroke-[2.5]" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-brand-mocha-900 block mb-0.5">30-Day Biocompatibility Assurance</span>
                    If any active formulation causes sensitivity, our clinical atelier provides a direct reformulation or replacement.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Celebrating "Your Order is Confirmed" Pop-Up Modal */}
        {showCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-mocha-900/65 backdrop-blur-md">
            <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-10 max-w-lg w-full text-center shadow-2xl relative overflow-hidden animate-fadeIn">
              {/* Subtle luxury ambient glows */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#E6E0F0] rounded-full blur-2xl pointer-events-none -mr-16 -mt-16 opacity-70" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#E6E0F0] rounded-full blur-xl pointer-events-none -ml-12 -mb-12 opacity-70" />

              <div className="relative z-10">
                {/* Celebrating Icon Medallion */}
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#E6E0F0] border-2 border-brand-silver flex items-center justify-center text-brand-mocha shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-brand-mocha stroke-[2.2] animate-bounce" />
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center px-4 py-1.5 bg-[#E6E0F0] border border-brand-silver text-brand-mocha-900 text-xs font-monoClinical font-bold uppercase tracking-wider rounded-full mb-3 shadow-2xs">
                  <span>Batch Reserved &amp; Registered</span>
                </div>

                {/* Celebrating Headline */}
                <h2 className="font-serifLuxury text-3xl sm:text-4xl text-brand-mocha-900 font-normal tracking-tight mb-2">
                  Your Order is Confirmed!
                </h2>

                <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans leading-relaxed max-w-sm mx-auto mb-6">
                  Thank you for choosing Love &amp; Co. Botanical Atelier. Your small-batch cold-pressed formulation is now reserved and being prepared.
                </p>

                {/* Order Summary Snapshot */}
                {confirmedOrder && (
                  <div className="bg-[#FAF9F8] border-2 border-brand-silver rounded-2xl p-4 mb-6 text-xs font-monoClinical text-brand-mocha-900 space-y-2 text-left shadow-2xs">
                    <div className="flex justify-between items-center pb-2 border-b border-brand-silver/60">
                      <span className="text-brand-mocha-900/60 uppercase text-[10px]">Order Number</span>
                      <strong className="text-brand-mocha text-sm font-bold">#{confirmedOrder.orderNumber}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-mocha-900/60">Fulfillment Status</span>
                      <span className="font-bold text-brand-mocha-900 uppercase text-[11px] px-2.5 py-0.5 rounded-full bg-[#E6E0F0] border border-brand-silver">
                        {confirmedOrder.fulfillmentStatus || 'Confirmed'}
                      </span>
                    </div>
                    {shippingAddress.recipientName && (
                      <div className="flex justify-between items-center">
                        <span className="text-brand-mocha-900/60">Delivering To</span>
                        <span className="font-medium truncate max-w-[200px]">
                          {shippingAddress.recipientName}{shippingAddress.city ? `, ${shippingAddress.city}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3-Second Transition Progress Bar */}
                <div className="space-y-2.5 pt-1">
                  <div className="w-full h-2 bg-[#FAF9F8] rounded-full overflow-hidden border border-brand-silver p-0.5">
                    <div className="h-full bg-brand-mocha rounded-full transition-all duration-[3000ms] ease-linear w-full" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-monoClinical text-brand-mocha-900/70">
                    <span>Opening your order tracking hub...</span>
                    <button
                      type="button"
                      onClick={handleImmediateRedirect}
                      className="text-brand-mocha hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Order Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
