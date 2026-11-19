import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Gift,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  CheckCircle2,
  Package
} from 'lucide-react';
import { api } from '../../lib/api';

const BOTANICAL_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607006483224-48612ca3b417?q=80&w=600';

export default function CustomerDossierSlideOver({ isOpen, onClose, customerId, initialCustomer }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.getCustomerDossier(customerId);
        if (res.data?.success) {
          setDossier(res.data.dossier);
        }
      } catch (err) {
        console.warn('Failed to load customer dossier details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const data = dossier || initialCustomer || {};
  const name = data.name || 'Botanical Patron';
  const phone = data.phone || 'N/A';
  const email = data.email || 'N/A';
  const stamps = Math.min(10, data.stamps || data.orderCount || data.ordersCount || 0);
  const freeTrioUnlocked = Boolean(data.freeTrioUnlocked || data.milestoneUnlocked || stamps >= 10);
  const ltv = data.totalLtv || data.totalSpend || 0;
  const orders = data.orders || [];

  // Extract purchased products with unique photos
  const purchasedProducts = [];
  const seenProductIds = new Set();
  orders.forEach((ord) => {
    (ord.items || []).forEach((itm) => {
      const prodId = itm.product?._id || itm.product || itm.name;
      if (prodId && !seenProductIds.has(prodId)) {
        seenProductIds.add(prodId);
        purchasedProducts.push({
          id: prodId,
          name: itm.name || itm.product?.name || 'Botanical Formulation',
          image: itm.image || itm.product?.images?.[0]?.url || BOTANICAL_FALLBACK_IMAGE,
          price: itm.price || 0,
          category: itm.product?.category || 'Cold-Pressed Soap',
        });
      }
    });
  });

  const handleWhatsAppChat = () => {
    if (!phone || phone === 'N/A') return;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const msg = encodeURIComponent(
      `Hello ${name},\n\n` +
      `Warm greetings from LOVE & CO. Botanical Apothecary.\n\n` +
      `Thank you for honoring our cold-process botanical soaps. We are always here to curate your personal skincare ritual.\n\n` +
      `Warm regards,\nLove & Co. Atelier Bengaluru`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#1C1614]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#FAF8F5] border-l border-[#E6DDD0] shadow-2xl flex flex-col font-sans text-[#1C1614]">
          {/* Slide-over Header */}
          <div className="bg-[#1C1614] text-[#FAF8F5] px-6 py-5 flex items-center justify-between border-b border-[#C5A880]/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#C5A880] text-[#1C1614] font-serif font-bold text-sm flex items-center justify-center border border-white/20">
                {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#C5A880] block">
                  360° Patron Intelligence
                </span>
                <h2 className="text-base font-serif font-semibold">{name}</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Slide-over Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#E6DDD0] rounded-xl p-3.5 shadow-sm">
                <span className="text-[10px] font-serif uppercase tracking-widest text-stone-400 font-semibold block">
                  Lifetime Value (LTV)
                </span>
                <p className="text-xl font-serif font-semibold text-[#1C1614] mt-0.5">
                  ₹{ltv.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-stone-500 font-mono">
                  {orders.length || data.ordersCount || 0} completed orders
                </span>
              </div>

              <div className="bg-white border border-[#E6DDD0] rounded-xl p-3.5 shadow-sm">
                <span className="text-[10px] font-serif uppercase tracking-widest text-stone-400 font-semibold block">
                  Patron Tier
                </span>
                <p className="text-base font-serif font-semibold text-[#C5A880] mt-1">
                  {(data.ordersCount >= 3 || orders.length >= 3)
                    ? 'VIP Connoisseur'
                    : (data.ordersCount === 2 || orders.length === 2)
                    ? 'Repeat Patron'
                    : 'Explorer'}
                </p>
                <span className="text-[10px] text-emerald-700 font-mono flex items-center space-x-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified Patron</span>
                </span>
              </div>
            </div>

            {/* 10-Dot Ritual Loyalty Stamp Progress */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span className="font-serif text-xs font-semibold uppercase tracking-wider text-[#1C1614]">
                    10-Stamp Ritual Card
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#C5A880]">
                  {stamps}/10 Stamps
                </span>
              </div>

              {/* 10-Dot Visual Progress Bar */}
              <div className="grid grid-cols-10 gap-1.5 pt-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const stampIndex = i + 1;
                  const isFilled = stampIndex <= stamps;
                  const isTenth = stampIndex === 10;

                  return (
                    <div
                      key={stampIndex}
                      title={isTenth ? '10th Stamp: Unlocks Complimentary Signature Botanical Trio Box' : `Stamp ${stampIndex}`}
                      className={`h-7 rounded-lg flex items-center justify-center transition-all ${
                        isFilled
                          ? isTenth
                            ? 'bg-[#C5A880] text-[#1C1614] shadow-sm font-bold'
                            : 'bg-[#1C1614] text-[#FAF8F5] shadow-sm'
                          : 'bg-[#F7F4EF] text-stone-300 border border-[#E6DDD0]'
                      }`}
                    >
                      {isTenth ? (
                        <Gift className={`w-3.5 h-3.5 ${isFilled ? 'text-[#1C1614]' : 'text-stone-300'}`} />
                      ) : (
                        <span className="text-[10px] font-mono">{stampIndex}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {freeTrioUnlocked ? (
                <div className="p-3 bg-[#C5A880]/15 border border-[#C5A880]/40 rounded-xl flex items-center space-x-2 text-xs text-[#8C6D3F]">
                  <Gift className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                  <span>
                    <strong>Milestone Achieved:</strong> Eligible for free Signature Botanical Trio on their next order!
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-stone-500 font-serif">
                  {10 - stamps} more order(s) until complimentary <strong>Botanical Trio Box</strong> is unlocked.
                </p>
              )}
            </div>

            {/* Favorite / Purchased Formulations (High-Resolution Photos) */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Purchased Botanical Formulations
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  {purchasedProducts.length} unique items
                </span>
              </div>

              {purchasedProducts.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2">
                  No previous formulation photos cached for this profile.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {purchasedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="group bg-[#F7F4EF]/70 border border-[#E6DDD0] rounded-xl p-2.5 flex items-center space-x-2.5 transition-all hover:border-[#C5A880]"
                    >
                      <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = BOTANICAL_FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-serif font-medium text-stone-900 truncate">
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          ₹{prod.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact & Location Dossier */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm space-y-3 text-xs">
              <span className="font-serif text-xs font-semibold uppercase tracking-wider text-stone-500 block">
                Contact &amp; Delivery Destination
              </span>
              <div className="space-y-2 text-stone-700">
                <div className="flex items-center space-x-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span className="font-mono">{phone}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span className="text-stone-600">{email}</span>
                </div>
                <div className="flex items-start space-x-2.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0 mt-0.5" />
                  <span className="text-stone-600">
                    {data.shippingAddress?.street ? `${data.shippingAddress.street}, ` : ''}
                    {data.city || data.shippingAddress?.city || 'Bengaluru'}, {data.state || data.shippingAddress?.state || 'Karnataka'}
                    {data.shippingAddress?.pincode ? ` - ${data.shippingAddress.pincode}` : ''}
                  </span>
                </div>
              </div>

              {/* One-click WhatsApp concierge outreach */}
              <div className="pt-2">
                <button
                  onClick={handleWhatsAppChat}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Concierge Message</span>
                </button>
              </div>
            </div>

            {/* Order History Mini List */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm space-y-3">
              <span className="font-serif text-xs font-semibold uppercase tracking-wider text-stone-500 block">
                Fulfillment Order Log
              </span>
              <div className="space-y-2">
                {orders.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-2">No past orders on file.</p>
                ) : (
                  orders.map((ord) => (
                    <div
                      key={ord._id || ord.id}
                      className="p-3 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-mono font-bold text-[#1C1614]">#{ord.orderNumber}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {new Date(ord.createdAt || ord.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-semibold text-stone-900 block">
                          ₹{ord.totalAmount || ord.amount}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-stone-200 text-stone-800">
                          {ord.fulfillmentStatus || ord.status || 'PLACED'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Slide-over Footer */}
          <div className="p-4 bg-white border-t border-[#E6DDD0] flex items-center justify-between">
            <Link
              href={`/admin/customers/${data.id || customerId}`}
              className="text-xs text-[#C5A880] font-serif hover:underline flex items-center space-x-1"
            >
              <span>View Full Dossier Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#1C1614] rounded-xl text-xs font-medium transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
