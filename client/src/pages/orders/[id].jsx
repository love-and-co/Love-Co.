import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Clock,
  Truck,
  Package,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  ExternalLink,
  Tag,
  Gift,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import WaxSealRevealCard from '../../components/loyalty/WaxSealRevealCard';

export default function OrderTrackingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mysteryCoupon, setMysteryCoupon] = useState(null);
  const [currentStamps, setCurrentStamps] = useState(0);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [showScanHistory, setShowScanHistory] = useState(true);

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    navigator.clipboard?.writeText(awb);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2500);
  };

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadOrder() {
      try {
        const res = await api.getOrderById(id);
        if (isMounted && res.data?.order) {
          const ord = res.data.order;
          setOrder(ord);

          const isValidLoyaltyOrder = Boolean(
            ord &&
            ord.showLoyaltyCard === true &&
            !ord.isPostRitualOrder &&
            ord.mysteryCoupon &&
            ord.mysteryCoupon.code &&
            ord.stampNumber >= 1 &&
            ord.stampNumber <= 10
          );

          if (!isValidLoyaltyOrder) {
            setMysteryCoupon(null);
          } else {
            setMysteryCoupon(ord.mysteryCoupon);
          }

          if (typeof ord.ritualStamps === 'number') {
            setCurrentStamps(ord.ritualStamps);
          }
        }

        // Fetch customer loyalty summary for overall profile progress
        try {
          const loyaltyRes = await api.getLoyaltyStatus();
          if (isMounted && loyaltyRes.data?.data) {
            const lData = loyaltyRes.data.data;
            if (typeof lData.ritualStamps === 'number') {
              setCurrentStamps(lData.ritualStamps);
            }
          }
        } catch (lErr) {
          // Guest or unauthenticated viewer
        }
      } catch (err) {
        console.error('Failed to load order', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrder();
    const interval = setInterval(loadOrder, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-canvas py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-brand-silver rounded-xl w-1/3 mb-2" />
          <div className="h-28 bg-white rounded-3xl border-2 border-brand-silver" />
          <div className="h-64 bg-white rounded-3xl border-2 border-brand-silver" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-canvas flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-3xl border-2 border-brand-silver p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#E6E0F0] border-2 border-brand-silver flex items-center justify-center text-brand-mocha">
            <Package className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="font-serifLuxury text-2xl text-brand-mocha-900 mb-2 font-normal">
            Order Record Not Found
          </h2>
          <p className="text-xs font-sans text-brand-mocha-900/60 mb-6 leading-relaxed">
            We could not locate this order identifier. Please check your order confirmation details or contact our apothecary desk.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalog"
              className="px-6 py-3 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-sans font-semibold uppercase tracking-wider transition-all duration-200 shadow-xs"
            >
              Explore Products &rarr;
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-[#FAF9F8] hover:bg-[#E6E0F0] text-brand-mocha-900 border-2 border-brand-silver rounded-xl text-xs font-sans font-medium uppercase tracking-wider transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timeline = order.trackingTimeline || [
    {
      stage: 'PLACED',
      description: 'Order confirmed and small-batch inventory locked.',
      completed: true,
      timestamp: order.createdAt,
    },
    {
      stage: 'PROCESSING',
      description: 'Atelier lab team preparing cold-pressed inspection.',
      completed: false,
    },
    {
      stage: 'DISPATCHED',
      description: 'Dispatched in plastic-free recycled paperboard courier.',
      completed: false,
    },
    {
      stage: 'DELIVERED',
      description: 'Delivered to your doorstep.',
      completed: false,
    },
  ];

  const firstProductSlug =
    order.items?.[0]?.product?.slug ||
    order.items?.[0]?.slug ||
    'love-and-co-bloom-neem-turmeric-soap';
  const feedbackHref = `/product/${firstProductSlug}/review`;

  return (
    <>
      <Head>
        <title>Order {order.orderNumber} Status — Love &amp; Co. Botanical Atelier</title>
      </Head>

      <div className="bg-brand-canvas min-h-screen py-10 sm:py-14 px-4 sm:px-6 lg:px-8 text-brand-mocha-900">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Top Breadcrumb Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/catalog"
              className="inline-flex items-center text-xs font-sans text-brand-mocha hover:text-brand-mocha-900 transition-colors gap-1.5 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Continue Shopping Catalog</span>
            </Link>
            <span className="text-[11px] font-monoClinical text-brand-mocha-900/60 uppercase tracking-wider">
              Secure Apothecary Order Hub
            </span>
          </div>

          {/* 1. Order Confirmed Hero Header Card */}
          <div className="bg-[#E6E0F0] rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
            <div>
              {/* Confirmed badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-brand-mocha text-white rounded-full text-xs font-monoClinical font-bold uppercase tracking-wider mb-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5]" />
                <span>Order Confirmed &amp; Batch Reserved</span>
              </div>

              {/* Order Number */}
              <h1 className="font-serifLuxury text-2xl sm:text-3xl lg:text-4xl font-normal tracking-wide text-brand-mocha-900">
                {order.orderNumber}
              </h1>

              {/* Date */}
              <p className="text-xs font-sans text-brand-mocha-900/70 mt-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-mocha" />
                <span>
                  Placed on{' '}
                  <strong className="text-brand-mocha-900 font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </p>
            </div>

            {/* Status & Payment Pills */}
            <div className="flex flex-col sm:items-end gap-2.5">
              <span className="inline-flex items-center px-4 py-2 bg-brand-mocha text-white text-xs font-monoClinical uppercase tracking-wider font-bold rounded-full shadow-md">
                Status: {order.fulfillmentStatus}
              </span>
              <div className="text-xs font-sans text-brand-mocha-900 bg-white border-2 border-brand-silver px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 font-medium shadow-2xs">
                <span>Payment:</span>
                <span className="font-bold text-brand-mocha-900">
                  {order.paymentDetails?.paymentStatus}
                </span>
                <span className="text-brand-silver">•</span>
                <span className="text-brand-mocha-900/80">via {order.paymentDetails?.provider}</span>
              </div>
            </div>
          </div>

          {/* Interactive Wax Seal Mystery Reward Card */}
          {Boolean(
            order &&
            order.showLoyaltyCard === true &&
            !order.isPostRitualOrder &&
            order.mysteryCoupon &&
            order.mysteryCoupon.code &&
            order.stampNumber >= 1 &&
            order.stampNumber <= 10 &&
            mysteryCoupon &&
            mysteryCoupon.code
          ) && (
            <WaxSealRevealCard
              coupon={mysteryCoupon}
              orderNumber={order.orderNumber}
              isPostRitualOrder={order.isPostRitualOrder}
              showLoyaltyCard={order.showLoyaltyCard}
              stampNumber={order.stampNumber}
              ritualStamps={currentStamps}
              currentStamps={currentStamps}
              onCouponRevealed={(revealedCoupon, updatedStamps, revealData) => {
                setMysteryCoupon(revealedCoupon);
                if (typeof updatedStamps === 'number') {
                  setCurrentStamps(updatedStamps);
                }
                setOrder((prev) =>
                  prev
                    ? {
                        ...prev,
                        mysteryCoupon: revealedCoupon,
                        ritualStamps: updatedStamps ?? prev.ritualStamps,
                        milestoneGift: revealData?.milestoneGift || prev.milestoneGift,
                      }
                    : prev
                );
              }}
            />
          )}

          {/* 2. Luxury Shipment & Courier Tracking Card */}
          {(() => {
            const rawStatus = (order.fulfillmentStatus || order.shipping?.status || 'PLACED').toUpperCase();
            const isCancelled = rawStatus === 'CANCELLED' || rawStatus === 'RTO';

            const STEPS = [
              { key: 'PLACED', label: 'Order Placed', desc: 'Formulation reserved' },
              { key: 'PACKED', label: 'Packed', desc: 'Atelier lab inspection' },
              { key: 'SHIPPED', label: 'Shipped', desc: 'In climate-neutral transit' },
              { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'With local courier partner' },
              { key: 'DELIVERED', label: 'Delivered', desc: 'Doorstep arrival' },
            ];

            let activeStepIndex = 0;
            if (rawStatus === 'DELIVERED') activeStepIndex = 4;
            else if (rawStatus === 'OUT_FOR_DELIVERY') activeStepIndex = 3;
            else if (rawStatus === 'SHIPPED' || rawStatus === 'DISPATCHED') activeStepIndex = 2;
            else if (rawStatus === 'PACKED' || rawStatus === 'PROCESSING') activeStepIndex = 1;
            else activeStepIndex = 0;

            const awbCode = order.shippingDetails?.awbCode || order.shipping?.awb || order.shipping?.awbNumber || order.shippingAddress?.trackingNumber;
            const courierName = order.shippingDetails?.courierName || order.shipping?.courierName || order.shipping?.courier || 'Shiprocket Partner Courier';
            const courierStatus = order.shippingDetails?.currentCourierStatus || (rawStatus === 'DELIVERED' ? 'Delivered' : rawStatus === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : rawStatus === 'SHIPPED' || rawStatus === 'DISPATCHED' ? 'In Transit' : 'Order Placed');
            const trackingUrl = order.shippingDetails?.trackingUrl || order.shipping?.trackingUrl || (awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null);
            const scans = (order.shippingDetails?.trackingHistory && order.shippingDetails.trackingHistory.length > 0)
              ? order.shippingDetails.trackingHistory
              : (order.trackingTimeline || []);

            return (
              <div className="bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-8 shadow-sm space-y-6">
                {/* Header: Status title & Live Courier Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-brand-silver gap-4">
                  <div>
                    <span className="text-[10.5px] font-monoClinical uppercase tracking-wider text-brand-mocha/70 font-semibold block">
                      Live Courier Fulfillment Desk
                    </span>
                    <h3 className="font-serifLuxury text-2xl text-brand-mocha-900 font-normal tracking-wide mt-0.5">
                      Shipment &amp; Courier Tracking
                    </h3>
                  </div>

                  {awbCode && (
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Courier Partner Badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver text-xs font-monoClinical font-bold shadow-2xs">
                        <Truck className="w-3.5 h-3.5 text-brand-mocha" />
                        {courierName}
                      </span>
                      {/* Status Pill */}
                      <span className="px-3 py-1.5 rounded-full bg-brand-mocha text-white text-xs font-monoClinical uppercase font-bold tracking-wider shadow-xs">
                        {courierStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* AWB Code & Track on Courier Site Bar */}
                {awbCode && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F8] border border-brand-silver flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-monoClinical uppercase tracking-wider text-brand-mocha/60 font-semibold">
                        Air Waybill (AWB) Tracking Code
                      </span>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-monoClinical text-base sm:text-lg font-bold text-brand-mocha-900 tracking-wider">
                          {awbCode}
                        </span>
                        <button
                          onClick={() => handleCopyAwb(awbCode)}
                          className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-brand-silver rounded-lg text-xs font-monoClinical font-semibold text-brand-mocha flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          title="Copy AWB Number"
                        >
                          {copiedAwb ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-brand-mocha" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl text-xs font-monoClinical uppercase tracking-wider font-bold transition shadow-xs cursor-pointer self-start sm:self-center"
                      >
                        <span>Track on Courier Site</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Visual Step-by-Step Progress Tracker */}
                <div className="py-4">
                  {isCancelled ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-monoClinical flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-600" />
                      <span>This order has been cancelled / returned to origin. Inventory has been safely released.</span>
                    </div>
                  ) : (
                    <div>
                      {/* Desktop / Tablet Stepper */}
                      <div className="hidden sm:block">
                        <div className="relative flex items-center justify-between">
                          {/* Background connecting bar */}
                          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-brand-silver rounded-full z-0" />
                          {/* Active filled connecting bar */}
                          <div
                            className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-brand-mocha rounded-full z-0 transition-all duration-500"
                            style={{ width: `${(activeStepIndex / (STEPS.length - 1)) * 100}%` }}
                          />

                          {STEPS.map((step, idx) => {
                            const isCompleted = idx < activeStepIndex;
                            const isCurrent = idx === activeStepIndex;
                            return (
                              <div key={step.key} className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                    isCompleted
                                      ? 'bg-brand-mocha text-white shadow-xs ring-4 ring-brand-canvas'
                                      : isCurrent
                                      ? 'bg-brand-mocha text-white ring-4 ring-[#E6E0F0] animate-pulse shadow-md font-bold'
                                      : 'bg-white border-2 border-brand-silver text-brand-mocha-900/40 ring-4 ring-brand-canvas'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                                  ) : isCurrent ? (
                                    <Clock className="w-4 h-4 stroke-[2.2]" />
                                  ) : (
                                    <span className="text-xs font-monoClinical font-bold">{idx + 1}</span>
                                  )}
                                </div>
                                <span
                                  className={`text-xs font-monoClinical uppercase tracking-wider mt-2.5 font-bold ${
                                    isCurrent ? 'text-brand-mocha' : isCompleted ? 'text-brand-mocha-900' : 'text-brand-mocha-900/40'
                                  }`}
                                >
                                  {step.label}
                                </span>
                                <span className="text-[10px] font-sans text-brand-mocha-900/60 text-center max-w-[100px] mt-0.5">
                                  {step.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mobile Stepper (Vertical) */}
                      <div className="sm:hidden space-y-4">
                        {STEPS.map((step, idx) => {
                          const isCompleted = idx < activeStepIndex;
                          const isCurrent = idx === activeStepIndex;
                          return (
                            <div key={step.key} className="flex items-start space-x-3">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isCompleted
                                    ? 'bg-brand-mocha text-white'
                                    : isCurrent
                                    ? 'bg-brand-mocha text-white ring-2 ring-[#E6E0F0] animate-pulse font-bold'
                                    : 'bg-white border-2 border-brand-silver text-brand-mocha-900/40'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                ) : (
                                  <span className="text-[10px] font-monoClinical font-bold">{idx + 1}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <span
                                  className={`text-xs font-monoClinical uppercase font-bold tracking-wider ${
                                    isCurrent ? 'text-brand-mocha' : isCompleted ? 'text-brand-mocha-900' : 'text-brand-mocha-900/40'
                                  }`}
                                >
                                  {step.label}
                                </span>
                                <p className="text-[11px] font-sans text-brand-mocha-900/60 leading-tight">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Scan Checkpoints Accordion */}
                {scans.length > 0 && (
                  <div className="border-t border-brand-silver pt-5">
                    <button
                      onClick={() => setShowScanHistory((prev) => !prev)}
                      className="w-full flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-brand-mocha" />
                        <span className="font-serifLuxury text-base text-brand-mocha-900 font-medium">
                          Live Courier Scan Checkpoints ({scans.length})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs font-monoClinical text-brand-mocha">
                        <span>{showScanHistory ? 'Hide checkpoints' : 'View all'}</span>
                        {showScanHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {showScanHistory && (
                      <div className="mt-4 space-y-3.5 pl-3 border-l-2 border-brand-silver ml-2">
                        {scans.map((scan, sIdx) => {
                          const scanDate = scan.timestamp ? new Date(scan.timestamp) : null;
                          return (
                            <div key={sIdx} className="relative pl-4">
                              <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-mocha ring-2 ring-white" />
                              <div className="flex flex-wrap items-baseline justify-between gap-1">
                                <span className="font-monoClinical text-xs font-bold text-brand-mocha-900">
                                  {scan.status || scan.stage || 'Scan Checkpoint'}
                                </span>
                                {scanDate && (
                                  <span className="font-monoClinical text-[10.5px] text-brand-mocha-900/60">
                                    {scanDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                                    {scanDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-sans text-brand-mocha-900/70 mt-0.5">
                                {scan.activity || scan.description || 'Processed by courier partner facility'}
                              </p>
                              {scan.location && (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-monoClinical text-brand-mocha mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {scan.location}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. Order Items & Shipping Address Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* LEFT: Purchased Products List & Totals */}
            <div className="md:col-span-7 bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-7 shadow-sm space-y-4">
              <div className="pb-3.5 border-b border-brand-silver">
                <h4 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal tracking-wide flex items-center justify-between flex-wrap gap-2">
                  <span>
                    Purchased Products ({order.items?.length || 0})
                    {Boolean(
                      order &&
                      order.stampNumber === 10 &&
                      order.milestoneGift &&
                      order.milestoneGift.name
                    ) && (
                      <span className="text-sm font-sans text-[#8C3A27] font-semibold ml-2">
                        + 1 Free Ritual Gift
                      </span>
                    )}
                  </span>
                </h4>
              </div>

              {/* Items List */}
              <div className="divide-y divide-brand-silver/50">
                {order.items?.map((item, idx) => {
                  const resolveImage = (it) => {
                    if (it.image) return it.image;
                    if (it.product?.images?.[0]?.url) return it.product.images[0].url;
                    if (typeof it.product?.images?.[0] === 'string') return it.product.images[0];
                    if (it.product?.image) return it.product.image;
                    const title = (it.title || it.name || it.product?.name || it.slug || '').toUpperCase();
                    if (title.includes('TRIO')) return '/images/products/botanical_trio_box.jpg';
                    if (title.includes('BLOOM') || title.includes('NEEM')) return '/images/products/bloom_neem_turmeric_soap.jpg';
                    if (title.includes('BLUSH') || title.includes('GOAT')) return '/images/products/blush_rose_goatmilk_soap.jpg';
                    if (title.includes('VELVET') || title.includes('SANDALWOOD')) return '/images/products/velvet_sandalwood_shea_soap.jpg';
                    if (title.includes('VELISSE') || title.includes('LIP')) return '/images/products/velisse_rose_lipbalm.jpg';
                    return null;
                  };
                  const productImg = resolveImage(item);
                  const itemPrice = item.unitPrice || item.price || 0;
                  return (
                    <div key={idx} className="py-3.5 first:pt-1 flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center space-x-3.5">
                        {productImg ? (
                          <img
                            src={productImg}
                            alt={item.title || item.name}
                            className="w-14 h-14 rounded-xl object-cover bg-brand-canvas border-2 border-brand-silver flex-shrink-0"
                            onError={(e) => {
                              const title = (item.title || item.name || '').toUpperCase();
                              if (title.includes('TRIO')) e.currentTarget.src = '/images/products/botanical_trio_box.jpg';
                              else if (title.includes('BLOOM')) e.currentTarget.src = '/images/products/bloom_neem_turmeric_soap.jpg';
                              else if (title.includes('BLUSH')) e.currentTarget.src = '/images/products/blush_rose_goatmilk_soap.jpg';
                              else if (title.includes('VELVET')) e.currentTarget.src = '/images/products/velvet_sandalwood_shea_soap.jpg';
                              else if (title.includes('VELISSE')) e.currentTarget.src = '/images/products/velisse_rose_lipbalm.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#E6E0F0] border-2 border-brand-silver flex items-center justify-center text-brand-mocha flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                          </div>
                        )}
                        <div>
                          <div className="font-serifLuxury text-base font-medium text-brand-mocha-900 leading-snug">
                            {item.title || item.name}
                          </div>
                          <div className="text-[11px] font-monoClinical text-brand-mocha-900/60 mt-0.5">
                            Qty: <strong className="text-brand-mocha-900">{item.quantity}</strong> × ₹{itemPrice}
                          </div>
                          {item.isBundleItem && (
                            <span className="inline-block mt-1 text-[9px] font-monoClinical px-2 py-0.5 bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver rounded uppercase tracking-wider font-semibold">
                              Curated Regimen
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-monoClinical font-bold text-sm text-brand-mocha-900 flex-shrink-0">
                        ₹{itemPrice * item.quantity}
                      </div>
                    </div>
                  );
                })}

                {/* Complimentary 10th Stamp Milestone Gift Line Item */}
                {Boolean(
                  order &&
                  (Number(order.stampNumber) === 10) &&
                  Boolean(order.milestoneGift) &&
                  Boolean(order.milestoneGift?.name || order.complimentaryGifts?.[0]?.name)
                ) && (
                  <div className="py-3.5 flex items-center justify-between text-xs gap-3 bg-[#FAF8F5]/80 p-3 rounded-2xl border border-[#C5A880]/30 my-1">
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={order.milestoneGift?.image || order.complimentaryGifts?.[0]?.image || '/images/products/botanical_trio_box.jpg'}
                        alt={order.milestoneGift?.name || order.complimentaryGifts?.[0]?.name || 'LOVE & Co. Signature 3-Bar Botanical Trio'}
                        className="w-14 h-14 rounded-lg object-cover bg-brand-canvas border border-[#EAE3D9] flex-shrink-0 shadow-2xs"
                        onError={(e) => {
                          e.currentTarget.src = '/images/products/botanical_trio_box.jpg';
                        }}
                      />
                      <div>
                        <div className="font-serifLuxury text-base font-medium text-brand-mocha-900 leading-snug">
                          {order.milestoneGift?.name || order.complimentaryGifts?.[0]?.name || 'LOVE & Co. Signature 3-Bar Botanical Trio'}
                        </div>
                        <div className="text-xs text-[#6E6259] font-sans mt-0.5">
                          QTY: 1 &nbsp;•&nbsp; Complimentary 10th Stamp Ritual Gift
                        </div>
                      </div>
                    </div>
                    <div className="text-xs tracking-[0.15em] uppercase font-bold text-[#4A5D4E] flex-shrink-0 font-monoClinical px-2.5 py-1 bg-[#4A5D4E]/10 rounded-full border border-[#4A5D4E]/30">
                      FREE
                    </div>
                  </div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-4 border-t border-brand-silver text-xs font-sans space-y-2">
                <div className="flex justify-between text-brand-mocha-900/70">
                  <span>Subtotal</span>
                  <span className="font-monoClinical text-brand-mocha-900 font-semibold">₹{order.subtotal}</span>
                </div>

                {/* Milestone Gift in Billing Breakdown */}
                {Boolean(
                  order &&
                  (Number(order.stampNumber) === 10) &&
                  Boolean(order.milestoneGift) &&
                  Boolean(order.milestoneGift?.name || order.complimentaryGifts?.[0]?.name)
                ) && (
                  <div className="flex justify-between text-[#8C3A27] font-medium py-0.5">
                    <span className="flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#8C3A27]" />
                      Complimentary 3-Bar Botanical Trio
                    </span>
                    <span className="font-monoClinical text-[#4A5D4E] font-bold">FREE (₹0)</span>
                  </div>
                )}

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-brand-mocha font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-brand-mocha" />
                      Discount
                    </span>
                    <span className="font-monoClinical">-₹{order.discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-brand-mocha-900/70">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-brand-mocha" />
                    Climate-Neutral Delivery
                  </span>
                  <span className="font-monoClinical">
                    {order.shippingFee === 0 ? (
                      <span className="text-brand-mocha font-bold uppercase tracking-wider text-[11px]">FREE</span>
                    ) : (
                      `₹${order.shippingFee}`
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-brand-silver flex justify-between items-baseline font-bold">
                  <div>
                    <span className="font-serifLuxury text-lg text-brand-mocha-900 font-semibold">Grand Total</span>
                    <span className="text-[10px] text-brand-mocha-900/50 font-sans block font-normal">
                      Includes all natural taxes &amp; charges
                    </span>
                  </div>
                  <span className="font-monoClinical text-2xl text-brand-mocha-900">
                    ₹{order.totalAmount || order.grandTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Shipping Address & Actions */}
            <div className="md:col-span-5 bg-white rounded-3xl border-2 border-brand-silver p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-brand-silver">
                <h4 className="font-serifLuxury text-xl text-brand-mocha-900 font-normal tracking-wide flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-brand-mocha" />
                  <span>Shipping Details</span>
                </h4>
              </div>

              {/* Address details */}
              {order.shippingAddress && (() => {
                const rawName = order.shippingAddress.recipientName || order.shippingAddress.fullName;
                const customerName = (rawName && rawName !== 'Valued Client')
                  ? rawName
                  : (order.customer?.fullName || user?.fullName || 'Aria Vance');
                const street = (order.shippingAddress.street === 'Apothecary Lane')
                  ? '42 Apothecary Lane, Indiranagar'
                  : (order.shippingAddress.street || '42 Apothecary Lane, Indiranagar');
                const phone = order.shippingAddress.phone || user?.phone || '+91 98765 43210';
                const email = order.shippingAddress.email || user?.email || 'client@loveandco.com';

                return (
                  <div className="space-y-3 text-xs font-sans text-brand-mocha-900/80">
                    <div>
                      <p className="font-serifLuxury text-base font-semibold text-brand-mocha-900 leading-snug">
                        {customerName}
                      </p>
                      <p className="text-brand-mocha-900/70 mt-1 leading-relaxed">
                        {street}
                      </p>
                      <p className="text-brand-mocha-900/70">
                        {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                        <span className="font-monoClinical font-medium text-brand-mocha-900">
                          {order.shippingAddress.pincode || order.shippingAddress.postalCode}
                        </span>
                      </p>
                      <p className="text-brand-mocha-900/70">{order.shippingAddress.country || 'India'}</p>
                    </div>

                    {/* Phone & Email Container */}
                    <div className="bg-[#FAF9F8] border-2 border-brand-silver rounded-2xl p-3.5 space-y-1.5 text-[11px] font-monoClinical text-brand-mocha-900/70">
                      {phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-brand-mocha flex-shrink-0" />
                          <span>Phone: <strong className="text-brand-mocha-900">{phone}</strong></span>
                        </div>
                      )}
                      {email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-brand-mocha flex-shrink-0" />
                          <span className="truncate">Email: <strong className="text-brand-mocha-900">{email}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-brand-silver flex flex-col space-y-2.5">
                <Link
                  href="/catalog"
                  className="w-full py-3.5 px-5 bg-brand-mocha hover:bg-brand-mocha-600 text-white rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 text-xs font-sans font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 group cursor-pointer"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href={feedbackHref}
                  className="w-full py-3 px-5 bg-[#FAF9F8] hover:bg-[#E6E0F0] border-2 border-brand-silver text-brand-mocha-900 rounded-xl text-xs font-sans font-medium uppercase tracking-wider text-center transition-all cursor-pointer"
                >
                  Feedback
                </Link>
              </div>

              {/* Biocompatibility Guarantee Card */}
              <div className="p-4 bg-[#E6E0F0]/60 border-2 border-brand-silver rounded-2xl text-xs font-sans text-brand-mocha-900 flex items-start space-x-3 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-brand-mocha flex-shrink-0 mt-0.5 stroke-[2.5]" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-brand-mocha-900 block mb-0.5">30-Day Biocompatibility Assurance</span>
                  Every cold-pressed batch is backed by our direct clinical consultation and replacement guarantee.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
