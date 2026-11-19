import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Gift,
  ShoppingCart,
  Send,
  CheckCircle2,
  Package,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { api } from '../../../lib/api';

export default function CustomerDossierPage() {
  const router = useRouter();
  const { id } = router.query;

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDossier = async () => {
      try {
        setLoading(true);
        const res = await api.getCustomerDossier(id);
        if (res.data?.success) {
          setDossier(res.data.dossier);
        }
      } catch (err) {
        console.warn('Failed loading dossier:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, [id]);

  const handleWhatsAppOutreach = () => {
    if (!dossier?.phone || dossier.phone === 'N/A') return;
    const cleanPhone = dossier.phone.replace(/\D/g, '').slice(-10);
    const msg = encodeURIComponent(
      `Hello ${dossier.name},\n\n` +
      `Warm greetings from LOVE & CO. Botanical Apothecary in Bangalore.\n\n` +
      `We cherish your patronage and would love to know how your cold-pressed soap ritual is serving your skin. If you need a personalized formulation recommendation, our atelier team is always at your service.\n\n` +
      `Warm regards,\nLove & Co.`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Customer Dossier">
        <div className="py-24 text-center text-xs text-stone-500">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin" />
          Loading 360° customer dossier...
        </div>
      </AdminLayout>
    );
  }

  if (!dossier) {
    return (
      <AdminLayout pageTitle="Customer Dossier">
        <div className="py-24 text-center text-stone-500 space-y-3">
          <Users className="w-10 h-10 mx-auto text-stone-300" />
          <p className="font-serif text-sm">Customer Dossier Not Found</p>
          <Link href="/admin/customers" className="text-xs text-[#C5A880] hover:underline">
            ← Return to Customer CRM
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Customer Dossier">
      <Head>
        <title>{dossier.name} - 360° Patron Dossier | Love &amp; Co.</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/customers"
              className="p-2 rounded-xl bg-white border border-stone-300 text-stone-600 hover:text-[#1C1614] hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="text-xs font-serif tracking-widest text-[#C5A880] uppercase">
                Customer Intelligence
              </div>
              <h1 className="text-2xl font-serif text-[#1C1614] font-normal tracking-wide mt-0.5">
                360° Patron Dossier: {dossier.name}
              </h1>
            </div>
          </div>

          <button
            onClick={handleWhatsAppOutreach}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center space-x-2 self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>WhatsApp Direct Outreach</span>
          </button>
        </div>

        {/* Profile Card & KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity */}
          <div className="bg-white border border-[#C5A880]/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-[#1C1614] text-[#FAF8F5] flex items-center justify-center font-serif text-lg font-light">
                {dossier.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-[#1C1614]">{dossier.name}</h3>
                <span className="text-[11px] text-stone-400 font-mono">ID: {String(dossier.id).slice(-8)}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="font-mono">{dossier.phone}</span>
                {dossier.isPhoneVerified && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{dossier.email}</span>
              </div>
              {dossier.shippingAddress && (
                <div className="flex items-start space-x-2 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0 mt-0.5" />
                  <span>
                    {dossier.shippingAddress.street || ''} {dossier.shippingAddress.city ? `${dossier.shippingAddress.city}, ` : ''}{dossier.shippingAddress.state || ''} {dossier.shippingAddress.pincode ? `- ${dossier.shippingAddress.pincode}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* LTV & Orders */}
          <div className="bg-white border border-[#C5A880]/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-serif uppercase tracking-wider text-stone-500">
              Lifetime Value (LTV)
            </span>
            <div className="my-2">
              <div className="text-3xl font-serif text-[#1C1614] font-bold">
                ₹{Number(dossier.totalLtv || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-stone-500 mt-1">Across {dossier.orderCount} total orders</p>
            </div>
            <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100">
              Average Order Value: ₹{dossier.orderCount > 0 ? Math.round(dossier.totalLtv / dossier.orderCount) : 0}
            </div>
          </div>

          {/* 10-Stamp Ritual Progress */}
          <div className="bg-white border border-[#C5A880]/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif uppercase tracking-wider text-stone-500">
                10-Stamp Loyalty Progress
              </span>
              <Gift className="w-4 h-4 text-[#C5A880]" />
            </div>

            <div className="my-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-serif font-semibold text-[#1C1614]">{dossier.stamps} / 10 Stamps</span>
                <span className="text-[#C5A880] font-medium">{dossier.freeTrioUnlocked ? 'FREE TRIO UNLOCKED' : `${10 - dossier.stamps} stamps to Trio`}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#C5A880] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (dossier.stamps / 10) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-stone-500">
              {dossier.freeTrioUnlocked
                ? '⭐ Eligible for Complimentary Signature Botanical Trio box on next dispatch.'
                : 'Each placed order adds 1 stamp to the loyalty card.'}
            </p>
          </div>
        </div>

        {/* Complete Order History */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif text-base text-[#1C1614] font-semibold">
            Complete Order History ({dossier.orders?.length || 0})
          </h3>

          <div className="space-y-3">
            {(dossier.orders || []).map((ord) => (
              <div
                key={ord._id}
                className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-[#1C1614]">#{ord.orderNumber}</span>
                    <span className="text-stone-400">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-[#1C1614]">₹{ord.totalAmount}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-serif uppercase tracking-wider font-semibold bg-stone-200 text-stone-800">
                      {ord.fulfillmentStatus || 'PLACED'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="pt-2 border-t border-stone-200/80 space-y-1">
                  {(ord.items || []).map((itm, i) => (
                    <div key={i} className="flex justify-between text-stone-700">
                      <span>{itm.name || itm.product?.name} × {itm.quantity}</span>
                      <span className="font-mono">₹{itm.price * itm.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
