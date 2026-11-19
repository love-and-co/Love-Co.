import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Truck, Search, Package, CheckCircle2, Clock, MapPin, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function TrackOrderPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);

  // Filter out delivered orders: once an order is delivered, it should not appear in active tracking
  const activeUserOrders = userOrders.filter(
    (ord) => ord.fulfillmentStatus?.toUpperCase() !== 'DELIVERED'
  );

  // If query string has ?id=... or ?order=...
  useEffect(() => {
    const queryId = router.query.id || router.query.order;
    if (queryId) {
      setOrderQuery(queryId);
      lookupOrder(queryId);
    }
  }, [router.query]);

  // Load authenticated user's recent orders
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingUserOrders(true);
      api
        .getUserOrders()
        .then((res) => {
          setUserOrders(res.data.orders || []);
        })
        .catch((err) => {
          console.warn('Could not load user order history', err);
        })
        .finally(() => {
          setLoadingUserOrders(false);
        });
    }
  }, [isAuthenticated]);

  const lookupOrder = async (queryToSearch) => {
    const trimmed = (queryToSearch || orderQuery).trim();
    if (!trimmed) {
      setErrorMsg('Please enter a valid Order Number or Order ID');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.getOrderById(trimmed);
      if (res.data && res.data.order) {
        setActiveOrder(res.data.order);
        setTimeout(() => {
          const el = document.getElementById('active-shipment-card');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        setErrorMsg('Order record not found. Please check your order identifier.');
        setActiveOrder(null);
      }
    } catch (err) {
      console.error('Order tracking error', err);
      setErrorMsg(
        err.response?.data?.error ||
          'Order not found. Please verify the order number (e.g. LCO-xxxxxx-xxx) or check your confirmation email.'
      );
      setActiveOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    lookupOrder(orderQuery);
  };

  const handleSelectOrder = (ord) => {
    const orderNum = ord.orderNumber || ord._id;
    setOrderQuery(orderNum);
    setActiveOrder(ord);
    setErrorMsg('');
    setTimeout(() => {
      const el = document.getElementById('active-shipment-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const timelineSteps = activeOrder?.trackingTimeline || [
    {
      stage: 'ORDER PLACED',
      description: 'Order confirmed and small-batch inventory locked.',
      completed: true,
      timestamp: activeOrder?.createdAt,
    },
    {
      stage: 'PROCESSING & CURING',
      description: 'Quality verification and batch formulation check at lab facility.',
      completed: activeOrder?.fulfillmentStatus === 'PROCESSING' || activeOrder?.fulfillmentStatus === 'DISPATCHED' || activeOrder?.fulfillmentStatus === 'DELIVERED',
    },
    {
      stage: 'DISPATCHED',
      description: 'Handed over to climate-neutral courier (BlueDart / Delhivery Air).',
      completed: activeOrder?.fulfillmentStatus === 'DISPATCHED' || activeOrder?.fulfillmentStatus === 'DELIVERED',
    },
    {
      stage: 'OUT FOR DELIVERY',
      description: 'Package arriving safely at your destination address.',
      completed: activeOrder?.fulfillmentStatus === 'DELIVERED',
    },
  ];

  return (
    <>
      <Head>
        <title>Track My Order — Love &amp; Co. Apothecary</title>
        <meta
          name="description"
          content="Track your Love & Co. small-batch cold-pressed skincare order and courier shipment in real time."
        />
      </Head>

      <div className="bg-brand-canvas min-h-screen py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-brand-mocha text-white text-[11px] font-mono-clinical uppercase tracking-wider rounded-full mb-3 shadow-xs font-bold">
              <Truck className="w-3.5 h-3.5 text-white" />
              <span>Real-Time Dispatch Tracker</span>
            </div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-brand-mocha-900 font-normal tracking-tight">
              Track My Order
            </h1>
            <p className="text-xs sm:text-sm text-brand-mocha-900/70 font-sans mt-2 leading-relaxed">
              Enter your Order Number (e.g. <span className="font-mono-clinical font-semibold text-brand-mocha-900">LCO-xxxxxx-xxx</span>) or Order ID to monitor packaging, quality control, and transit milestones.
            </p>
          </div>

          {/* Search Box Card */}
          <div className="bg-[#E6E0F0] border-2 border-brand-silver rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <label htmlFor="orderQueryInput" className="block text-xs font-mono-clinical uppercase tracking-wider font-bold text-brand-mocha-900">
                Order Number or Tracking ID
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-brand-mocha-900/50 absolute left-4 top-3.5" />
                  <input
                    id="orderQueryInput"
                    type="text"
                    required
                    placeholder="e.g. LCO-2026-9481 or your Order ID"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-brand-silver rounded-xl text-xs font-mono-clinical focus:outline-none focus:border-brand-mocha text-brand-mocha-900 uppercase placeholder-brand-mocha/40 shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-brand-mocha hover:bg-brand-mocha-600 text-white text-xs font-mono-clinical uppercase tracking-wider font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-60 shrink-0 shadow-md rounded-xl cursor-pointer"
                >
                  {loading ? (
                    <span>Locating Package...</span>
                  ) : (
                    <>
                      <span>Track Shipment</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-xs font-mono-clinical text-red-700 flex items-center space-x-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          </div>

          {/* Active Order Tracking Result */}
          {activeOrder && (
            <div id="active-shipment-card" className="space-y-6 mb-12 animate-fadeIn scroll-mt-24">
              {/* Order Status Banner */}
              <div className="bg-white border-2 border-brand-silver rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-brand-silver gap-4">
                  <div>
                    <span className="text-[11px] font-mono-clinical text-brand-mocha/60 uppercase tracking-wider block">
                      {activeOrder.fulfillmentStatus === 'DELIVERED' ? 'Completed Delivery' : 'Active Shipment'}
                    </span>
                    <h2 className="font-serif-luxury text-2xl text-brand-mocha-900 font-normal mt-0.5">
                      Order #{activeOrder.orderNumber || activeOrder._id}
                    </h2>
                    <span className="text-xs font-mono-clinical text-brand-mocha/60">
                      Placed on {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-3.5 py-1 bg-[#E6E0F0] text-brand-mocha-900 border border-brand-silver text-xs font-mono-clinical uppercase font-bold rounded-full">
                      {activeOrder.fulfillmentStatus || 'PROCESSING'}
                    </span>
                    <span className="px-3.5 py-1 bg-white text-brand-mocha-900 border-2 border-brand-silver text-xs font-mono-clinical uppercase font-bold rounded-full shadow-2xs">
                      {activeOrder.paymentDetails?.paymentStatus === 'PAID' ? '✓ Paid' : 'Pending Payment'}
                    </span>
                  </div>
                </div>

                {/* Courier Partner Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-brand-silver text-xs font-mono-clinical">
                  <div>
                    <span className="text-brand-mocha/60 uppercase text-[10px] block">Carrier Partner</span>
                    <span className="font-bold text-brand-mocha-900">BlueDart / Delhivery Air</span>
                  </div>
                  <div>
                    <span className="text-brand-mocha/60 uppercase text-[10px] block">
                      {activeOrder.fulfillmentStatus === 'DELIVERED' ? 'Delivery Status' : 'Estimated Arrival'}
                    </span>
                    <span className={`font-bold ${activeOrder.fulfillmentStatus === 'DELIVERED' ? 'text-emerald-700' : 'text-brand-mocha'}`}>
                      {activeOrder.fulfillmentStatus === 'DELIVERED' ? 'Delivered to Doorstep ✓' : '4 – 7 Days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-brand-mocha/60 uppercase text-[10px] block">Packaging Protocol</span>
                    <span className="font-bold text-brand-mocha-900">100% Plastic-Free &amp; Biodegradable</span>
                  </div>
                </div>

                {/* Timeline Progress */}
                <div className="pt-6">
                  <h3 className="text-xs font-mono-clinical font-bold uppercase tracking-wider text-brand-mocha-900 mb-6">
                    Fulfillment Milestones
                  </h3>
                  <div className="relative pl-6 sm:pl-8 space-y-8 border-l-2 border-brand-silver">
                    {timelineSteps.map((step, idx) => {
                      const isCurrent = step.completed && (idx === timelineSteps.length - 1 || !timelineSteps[idx + 1]?.completed);
                      return (
                        <div key={idx} className="relative">
                          {/* Dot Indicator */}
                          <div
                            className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              step.completed
                                ? 'bg-brand-mocha text-white shadow-2xs'
                                : isCurrent
                                ? 'bg-brand-lavender text-brand-mocha-900 ring-4 ring-brand-lavender-light'
                                : 'bg-brand-silver-light text-brand-mocha/30 border border-brand-silver'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono-clinical text-xs font-bold uppercase text-brand-mocha-900">
                                {step.stage}
                              </span>
                              {step.timestamp && (
                                <span className="text-[10px] font-mono-clinical text-brand-mocha/50">
                                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-brand-mocha/70 mt-1 font-sans leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping Destination */}
                {activeOrder.shippingAddress && (
                  <div className="mt-8 pt-6 border-t border-brand-silver flex items-start space-x-3 text-xs font-mono-clinical text-brand-mocha/80">
                    <MapPin className="w-4 h-4 text-brand-mocha mt-0.5 shrink-0" />
                    <div>
                      <span className="text-brand-mocha-900 font-bold block uppercase text-[11px]">Shipping Destination:</span>
                      <span>
                        {activeOrder.shippingAddress.fullName || activeOrder.customer?.fullName} • {activeOrder.shippingAddress.street}, {activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.state} — {activeOrder.shippingAddress.postalCode}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Authenticated User Order History Section - Active Shipments Only */}
          {isAuthenticated && activeUserOrders.length > 0 && (
            <div className="bg-white border-2 border-brand-silver rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-serif-luxury text-xl text-brand-mocha-900 mb-4 font-normal">
                Your Recent Orders ({activeUserOrders.length})
              </h3>
              <div className="divide-y divide-brand-silver/50">
                {activeUserOrders.map((ord) => (
                  <div key={ord._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-clinical">
                    <div>
                      <div className="font-bold text-brand-mocha-900 text-sm">
                        #{ord.orderNumber || ord._id}
                      </div>
                      <div className="text-brand-mocha/70 mt-0.5">
                        {ord.items?.length || 1} items • ₹{ord.totalAmount} • {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="px-3.5 py-1 bg-[#E6E0F0] text-brand-mocha-900 text-[11px] font-bold border border-brand-silver uppercase rounded-full">
                        {ord.fulfillmentStatus || 'PROCESSING'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectOrder(ord)}
                        className="px-4 py-1.5 bg-brand-mocha text-white hover:bg-brand-mocha-600 uppercase text-[11px] font-bold transition-colors cursor-pointer shadow-xs rounded-xl"
                      >
                        Track Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </>
  );
}
