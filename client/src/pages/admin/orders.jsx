import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import {
  ShoppingCart,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  RotateCcw,
  Printer,
  ChevronRight,
  X,
  ExternalLink,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  Building,
  Tag,
  Gift,
  Eye,
  Box
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import CourierDispatchModal from '../../components/admin/CourierDispatchModal';
import CancellationReasonModal from '../../components/admin/CancellationReasonModal';
import OrderDossierDrawer from '../../components/admin/OrderDossierDrawer';
import { api } from '../../lib/api';

const BOTANICAL_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1607006483224-48612ca3b417?q=80&w=600';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'PLACED', label: 'Placed' },
  { id: 'PACKED', label: 'Packed' },
  { id: 'DISPATCHED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const DATE_PRESETS = [
  { id: 'ALL', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: '7D', label: 'Past 7 Days' },
];

const PAYMENT_PRESETS = [
  { id: 'ALL', label: 'All Payments' },
  { id: 'COD', label: 'Cash on Delivery (COD)' },
  { id: 'ONLINE', label: 'Paid Online / UPI' },
];

export default function OrdersDispatchHub() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [packingOrderId, setPackingOrderId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Drawers
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [dossierOrder, setDossierOrder] = useState(null);
  const [copiedSlipId, setCopiedSlipId] = useState(null);
  const [pushingOrderId, setPushingOrderId] = useState(null);
  const [syncingOrderId, setSyncingOrderId] = useState(null);
  const [copiedAwb, setCopiedAwb] = useState(null);

  const handleCopyAwb = (awb) => {
    if (!awb) return;
    navigator.clipboard?.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2500);
  };

  const handleShiprocketPush = async (ord) => {
    try {
      setPushingOrderId(ord._id);
      const res = await api.pushOrderToShiprocket(ord._id);
      if (res.data?.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === ord._id ? (res.data.order || { ...o, fulfillmentStatus: 'SHIPPED', shippingDetails: { ...o.shippingDetails, awbCode: res.data.awb, courierName: res.data.courierName } }) : o))
        );
      }
    } catch (err) {
      alert('Shiprocket dispatch push error: ' + (err.response?.data?.error || err.message));
    } finally {
      setPushingOrderId(null);
    }
  };

  const handleShiprocketSync = async (ord) => {
    try {
      setSyncingOrderId(ord._id);
      const res = await api.syncOrderWithShiprocket(ord._id);
      if (res.data?.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === ord._id ? (res.data.order || o) : o))
        );
      }
    } catch (err) {
      alert('Shiprocket tracking sync error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncingOrderId(null);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminOrders();
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.warn('Failed fetching orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // One-click quick pack action
  const handleQuickPack = async (ord) => {
    try {
      setPackingOrderId(ord._id);
      const res = await api.packOrder(ord._id);
      if (res.data?.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === ord._id ? { ...o, fulfillmentStatus: 'PACKED' } : o))
        );
      }
    } catch (err) {
      alert('Error updating order to packed: ' + (err.response?.data?.message || err.message));
    } finally {
      setPackingOrderId(null);
    }
  };

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length, PLACED: 0, PACKED: 0, DISPATCHED: 0, DELIVERED: 0, CANCELLED: 0 };
    orders.forEach((ord) => {
      const st = (ord.fulfillmentStatus || ord.shipping?.status || 'PLACED').toUpperCase();
      if (st === 'SHIPPED') counts.DISPATCHED += 1;
      else if (counts[st] !== undefined) counts[st] += 1;
    });
    return counts;
  }, [orders]);

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const past7Start = new Date(todayStart);
    past7Start.setDate(past7Start.getDate() - 7);

    return orders.filter((ord) => {
      // Date filter
      const ordDate = new Date(ord.createdAt);
      if (dateFilter === 'TODAY' && ordDate < todayStart) return false;
      if (dateFilter === 'YESTERDAY' && (ordDate < yesterdayStart || ordDate >= todayStart)) return false;
      if (dateFilter === '7D' && ordDate < past7Start) return false;

      // Payment filter
      const isCod = (ord.payment?.mode || ord.paymentDetails?.provider || '').toUpperCase() === 'COD';
      if (paymentFilter === 'COD' && !isCod) return false;
      if (paymentFilter === 'ONLINE' && isCod) return false;

      // Status filter
      const st = (ord.fulfillmentStatus || ord.shipping?.status || 'PLACED').toUpperCase();
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'DISPATCHED' && st !== 'DISPATCHED' && st !== 'SHIPPED') return false;
        if (statusFilter !== 'DISPATCHED' && st !== statusFilter) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const num = (ord.orderNumber || ord.orderId || '').toLowerCase();
        const name = (ord.customer?.fullName || ord.shippingAddress?.fullName || ord.shippingAddress?.recipientName || '').toLowerCase();
        const phone = (ord.customer?.phone || ord.shippingAddress?.phone || '').toLowerCase();
        const city = (ord.shippingAddress?.city || '').toLowerCase();
        const pincode = (ord.shippingAddress?.pincode || '').toLowerCase();
        if (!num.includes(q) && !name.includes(q) && !phone.includes(q) && !city.includes(q) && !pincode.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, dateFilter, paymentFilter, statusFilter, searchTerm]);

  // 1. WhatsApp Customer Update Trigger
  const handleShareWhatsAppCustomer = (ord) => {
    const addr = ord.shippingAddress || {};
    const rawPhone = addr.phone || ord.customer?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const name = addr.fullName || addr.recipientName || ord.customer?.fullName || 'Valued Patron';

    const itemsSummary = (ord.items || [])
      .map((itm) => `• ${itm.name || itm.product?.name} (${itm.quantity || 1}x)`)
      .join('\n');

    const trackingText = ord.shipping?.trackingNumber
      ? `\n🚚 Courier: ${ord.shipping?.courier || 'Delhivery Air'}\nTracking AWB: ${ord.shipping.trackingNumber}`
      : '\nPackaging in our Bangalore botanical cure atelier. Courier tracking will follow.';

    const message = encodeURIComponent(
      `Hello ${name},\n\n` +
      `Thank you for honoring our cold-process botanical craft at LOVE & CO.\n\n` +
      `📦 Order: #${ord.orderNumber}\n` +
      `Total Amount: ₹${ord.totalAmount}\n\n` +
      `Ritual Formulations:\n${itemsSummary}\n` +
      trackingText + '\n\n' +
      `Warm regards,\nLove & Co. Apothecary Atelier\nBengaluru, India`
    );

    window.open(`https://wa.me/91${cleanPhone}?text=${message}`, '_blank');
  };

  // 2. Warehouse Packing Slip Copy & WhatsApp
  const handleCopyWarehouseSlip = (ord) => {
    const addr = ord.shippingAddress || {};
    const name = addr.fullName || addr.recipientName || 'Valued Patron';
    const isCod = (ord.payment?.mode || ord.paymentDetails?.provider || '').toUpperCase() === 'COD';
    const isTenth = ord.loyaltyRewardApplied || (ord.stampNumber === 10);

    const itemsList = (ord.items || [])
      .map((itm, i) => `${i + 1}. [ ] ${itm.name || itm.product?.name} (Qty: ${itm.quantity || 1})`)
      .join('\n');

    const slip =
      `═══════════════════════════════════════\n` +
      `   LOVE & CO. WAREHOUSE PACKING SLIP   \n` +
      `═══════════════════════════════════════\n` +
      `ORDER: #${ord.orderNumber}\n` +
      `DATE: ${new Date(ord.createdAt).toLocaleDateString('en-IN')}\n` +
      `PAYMENT: ${isCod ? `COD (COLLECT ₹${ord.totalAmount})` : 'PAID ONLINE (DO NOT COLLECT)'}\n` +
      (isTenth ? `\n⭐ ALERT: PACK FREE SIGNATURE BOTANICAL TRIO BOX (10th Order Milestone)\n` : '') +
      `\nITEMS CHECKLIST:\n${itemsList}\n` +
      `\nSHIP TO:\n` +
      `${name}\n` +
      `${addr.street || ''}\n` +
      `${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}\n` +
      `Phone: ${addr.phone || 'N/A'}\n` +
      `═══════════════════════════════════════`;

    navigator.clipboard.writeText(slip);
    setCopiedSlipId(ord._id);
    setTimeout(() => setCopiedSlipId(null), 3000);
  };

  // 3. Print Luxury Thermal / A4 Branded Invoice
  const handlePrintInvoice = (ord) => {
    const addr = ord.shippingAddress || {};
    const name = addr.fullName || addr.recipientName || 'Valued Patron';
    const isCod = (ord.payment?.mode || ord.paymentDetails?.provider || '').toUpperCase() === 'COD';

    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - #${ord.orderNumber} - Love & Co.</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 40px; color: #1C1614; background: #fff; }
          .header { border-bottom: 2px solid #C5A880; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-family: 'Cinzel', serif; font-size: 24px; letter-spacing: 4px; }
          .tagline { font-size: 11px; text-transform: uppercase; color: #78716C; letter-spacing: 1px; margin-top: 4px; }
          .invoice-title { font-family: 'Cinzel', serif; font-size: 18px; text-align: right; }
          .meta { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; }
          .meta-box { width: 45%; }
          .meta-box h4 { font-family: 'Cinzel', serif; text-transform: uppercase; margin-bottom: 6px; font-size: 11px; color: #78716C; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 12px; }
          th { border-bottom: 1px solid #1C1614; text-align: left; padding: 10px 4px; font-family: 'Cinzel', serif; text-transform: uppercase; font-size: 10px; }
          td { border-bottom: 1px solid #E7E5E4; padding: 12px 4px; }
          .totals { margin-top: 25px; width: 300px; margin-left: auto; font-size: 12px; }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .grand-total { border-top: 1px solid #1C1614; padding-top: 8px; margin-top: 8px; font-weight: 600; font-size: 14px; }
          .footer { margin-top: 60px; border-top: 1px solid #E7E5E4; padding-top: 15px; font-size: 11px; color: #78716C; text-align: center; }
          @media print { body { margin: 15mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">LOVE & CO.</div>
            <div class="tagline">Botanical Skincare & Cold-Pressed Soaps</div>
            <div style="font-size: 11px; color: #78716C; margin-top: 6px;">No. 42, Indiranagar, Bengaluru 560038 • GSTIN: 29ABCDE1234F1Z5</div>
          </div>
          <div>
            <div class="invoice-title">Tax Invoice</div>
            <div style="font-size: 12px; margin-top: 4px;">#${ord.orderNumber}</div>
            <div style="font-size: 11px; color: #78716C;">Date: ${new Date(ord.createdAt).toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <div class="meta">
          <div class="meta-box">
            <h4>Billed & Shipped To:</h4>
            <strong>${name}</strong><br/>
            ${addr.street || ''}<br/>
            ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}<br/>
            Phone: ${addr.phone || 'N/A'}<br/>
            Email: ${addr.email || 'N/A'}
          </div>
          <div class="meta-box" style="text-align: right;">
            <h4>Payment & Fulfillment:</h4>
            Payment Method: <strong>${isCod ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay/UPI)'}</strong><br/>
            Fulfillment Status: <strong>${ord.fulfillmentStatus || 'PLACED'}</strong><br/>
            ${ord.shipping?.trackingNumber ? `Courier: ${ord.shipping.courier || 'Delhivery Air'}<br/>AWB: ${ord.shipping.trackingNumber}` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(ord.items || []).map((itm) => `
              <tr>
                <td><strong>${itm.name || itm.product?.name}</strong><br/><span style="color:#78716C; font-size:10px;">${itm.variant || '100g Bar'}</span></td>
                <td style="text-align: center;">${itm.quantity || 1}</td>
                <td style="text-align: right;">₹${itm.price}</td>
                <td style="text-align: right;">₹${itm.price * (itm.quantity || 1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>₹${ord.pricingBreakdown?.subtotal || ord.totalAmount}</span>
          </div>
          ${(ord.pricingBreakdown?.couponDiscount || ord.discountAmount) > 0 ? `
            <div class="totals-row" style="color: #047857;">
              <span>Discount:</span>
              <span>-₹${ord.pricingBreakdown?.couponDiscount || ord.discountAmount}</span>
            </div>
          ` : ''}
          <div class="totals-row">
            <span>Air Courier Shipping:</span>
            <span>${ord.pricingBreakdown?.shippingFee === 0 ? 'FREE' : '₹' + (ord.pricingBreakdown?.shippingFee || 0)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Grand Total:</span>
            <span>₹${ord.totalAmount}</span>
          </div>
        </div>

        <div class="footer">
          Handcrafted in small cold-process batches • Support: loveandcosupport@gmail.com • +91 94406 07778<br/>
          Thank you for embracing botanical purity with Love & Co.
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

  return (
    <AdminLayout pageTitle="Orders & Dispatch Hub">
      <Head>
        <title>Orders &amp; Dispatch Hub | Love &amp; Co. Flagship</title>
      </Head>

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E6DDD0] pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-serif tracking-widest text-[#C5A880] uppercase">
              <span>Operations Portal</span>
              <span>/</span>
              <span>Orders &amp; Dispatch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1C1614] font-normal tracking-wide mt-1">
              Orders &amp; Dispatch Hub
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Visual fulfillment desk: itemized packing manifests, rapid status dispatch, WhatsApp alerts &amp; luxury printable invoices.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-white hover:bg-[#F7F4EF] border border-[#E6DDD0] rounded-xl text-xs font-medium text-stone-700 transition-colors shadow-sm flex items-center space-x-2 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Refresh Desk</span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            1. HORIZONTAL STATUS FILTER TABS BAR
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E6DDD0] rounded-2xl p-2 shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 min-w-max">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              const count = statusCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-serif tracking-wider transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'bg-[#1C1614] text-[#FAF8F5] shadow-sm font-medium'
                      : 'text-stone-600 hover:bg-[#F7F4EF] hover:text-[#1C1614]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      isActive ? 'bg-[#C5A880] text-[#1C1614]' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. SECONDARY MULTI-CRITERIA FILTER BAR
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E6DDD0] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                Deep Search
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Order #, Name, 10-digit Phone, City, Pincode..."
                  className="w-full pl-8 pr-3 py-2 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-xs text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            {/* Date Preset */}
            <div>
              <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <label className="block text-[11px] font-serif uppercase tracking-widest text-stone-500 font-semibold mb-1">
                Payment Method
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
              >
                {PAYMENT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. VISUAL ORDERS & DISPATCH CARDS
        ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500 bg-white rounded-2xl border border-[#E6DDD0]">
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin" />
            Loading orders dispatch desk...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#E6DDD0] text-stone-500 space-y-2">
            <ShoppingCart className="w-10 h-10 mx-auto text-stone-300" />
            <p className="font-serif text-sm">No orders found matching the filter criteria.</p>
            <p className="text-xs text-stone-400">Try adjusting your status tab or search keyword.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const addr = ord.shippingAddress || {};
              const customerName = addr.fullName || addr.recipientName || ord.customer?.fullName || 'Valued Patron';
              const city = addr.city || ord.customer?.city || 'Bengaluru';
              const phone = addr.phone || ord.customer?.phone || 'N/A';
              const isCod = (ord.payment?.mode || ord.paymentDetails?.provider || '').toUpperCase() === 'COD';
              const isTenth = ord.loyaltyRewardApplied || (ord.stampNumber === 10);
              const status = (ord.fulfillmentStatus || ord.shipping?.status || 'PLACED').toUpperCase();
              const items = ord.items || [];
              const isPackingThis = packingOrderId === ord._id;

              return (
                <div
                  key={ord._id}
                  className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm hover:border-[#C5A880] transition-all space-y-5"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E6DDD0]/60 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-base text-[#1C1614]">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* 10th-Order Milestone Gift Badge */}
                      {isTenth && (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#C5A880]/15 text-[#8C6D3F] border border-[#C5A880]/40 rounded-full text-[11px] font-serif font-semibold">
                          <Gift className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>10th Order: Free Botanical Trio</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Payment Pill */}
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase font-semibold ${
                          isCod ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {isCod ? 'COD' : 'PAID ONLINE'}
                      </span>

                      {/* Status Pill */}
                      <span
                        className={`px-3.5 py-1 rounded-full text-[11px] font-serif uppercase tracking-wider font-semibold ${
                          status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'DISPATCHED' || status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : status === 'PACKED'
                            ? 'bg-amber-100 text-amber-800'
                            : status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Card Middle: Visual Stacked Product Imagery & Patron Dossier */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Visual Stacked Product Thumbnails (5 cols) */}
                    <div className="lg:col-span-5 flex items-center space-x-4">
                      {/* Stacked Circular / Rounded Thumbnails */}
                      <div className="flex items-center -space-x-3 overflow-hidden flex-shrink-0">
                        {items.slice(0, 4).map((itm, idx) => {
                          const imgSrc = itm.image || itm.product?.images?.[0]?.url || BOTANICAL_FALLBACK_IMAGE;
                          return (
                            <div
                              key={idx}
                              className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-stone-200 bg-stone-100 flex-shrink-0"
                              title={`${itm.name || itm.product?.name} (${itm.quantity || 1}x)`}
                            >
                              <img
                                src={imgSrc}
                                alt={itm.name || 'Botanical Soap'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = BOTANICAL_FALLBACK_IMAGE;
                                }}
                              />
                            </div>
                          );
                        })}
                        {items.length > 4 && (
                          <div className="w-14 h-14 rounded-2xl bg-[#1C1614] text-[#FAF8F5] border-2 border-white shadow-md flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
                            +{items.length - 4}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-serif font-medium text-stone-900 truncate">
                          {items.map((i) => i.name || i.product?.name).join(', ')}
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                          {items.reduce((acc, i) => acc + (i.quantity || 1), 0)} formulations in parcel
                        </p>
                      </div>
                    </div>

                    {/* Customer Name & City (4 cols) */}
                    <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#E6DDD0]/60 pt-3 lg:pt-0 lg:pl-6 text-xs space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-semibold text-stone-900 text-sm">{customerName}</span>
                        <span className="text-stone-400">•</span>
                        <span className="font-serif text-[#C5A880] font-medium">{city}</span>
                      </div>
                      <p className="text-stone-500 font-mono text-[11px]">{phone}</p>

                      {/* Shiprocket Dispatch Badge & Copyable AWB */}
                      {(ord.shippingDetails?.awbCode || ord.shipping?.awb || ord.shipping?.trackingNumber) && (
                        <div className="mt-2 p-2.5 bg-[#FAF8F5] border border-[#C5A880]/50 rounded-xl space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="font-medium text-stone-800 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-[#C5A880]" />
                              {ord.shippingDetails?.courierName || ord.shipping?.courier || 'Shiprocket Partner'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6DDD0] text-stone-800 font-semibold font-mono">
                              {ord.shippingDetails?.currentCourierStatus || 'AWB Assigned'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="font-mono text-xs font-bold text-[#1C1614] tracking-wide">
                              {ord.shippingDetails?.awbCode || ord.shipping?.awb || ord.shipping?.trackingNumber}
                            </span>
                            <button
                              onClick={() => handleCopyAwb(ord.shippingDetails?.awbCode || ord.shipping?.awb || ord.shipping?.trackingNumber)}
                              className="text-[10px] px-2 py-0.5 bg-white border border-[#C5A880]/60 hover:bg-stone-50 rounded text-stone-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Copy AWB Tracking Code"
                            >
                              {copiedAwb === (ord.shippingDetails?.awbCode || ord.shipping?.awb || ord.shipping?.trackingNumber) ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-stone-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Total ₹ (3 cols) */}
                    <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[#E6DDD0]/60 pt-3 lg:pt-0 lg:pl-6 text-left lg:text-right">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-stone-400 font-semibold block">
                        Grand Total
                      </span>
                      <span className="text-2xl font-serif font-semibold text-[#1C1614] mt-0.5 block">
                        ₹{ord.totalAmount?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {ord.pricingBreakdown?.shippingFee === 0 ? 'Free Courier Delivery' : 'Standard Delivery'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Clean Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E6DDD0]/60">
                    {/* Primary Operations Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* One-Click Pack Action */}
                      {status === 'PLACED' && (
                        <button
                          onClick={() => handleQuickPack(ord)}
                          disabled={isPackingThis}
                          className="px-4 py-2 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          <Package className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>{isPackingThis ? 'Packing...' : 'Pack Order'}</span>
                        </button>
                      )}

                      {/* One-Click Ship via Shiprocket Action */}
                      {(status === 'PLACED' || status === 'PACKED') && (
                        <button
                          onClick={() => handleShiprocketPush(ord)}
                          disabled={pushingOrderId === ord._id}
                          className="px-4 py-2 bg-[#1C1614] hover:bg-[#2c221f] text-[#FAF8F5] border border-[#C5A880] rounded-xl text-xs font-serif uppercase tracking-wider font-semibold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>{pushingOrderId === ord._id ? 'Pushing to Shiprocket...' : 'Ship via Shiprocket'}</span>
                        </button>
                      )}

                      {/* Manual Dispatch Modal Trigger fallback */}
                      {(status === 'PLACED' || status === 'PACKED') && (
                        <button
                          onClick={() => setDispatchOrder(ord)}
                          className="px-3 py-2 bg-[#FAF8F5] hover:bg-[#E6DDD0] text-stone-700 border border-[#E6DDD0] rounded-xl text-xs font-serif uppercase tracking-wider transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                          title="Custom / Manual Courier Dispatch"
                        >
                          <Box className="w-3.5 h-3.5 text-stone-500" />
                          <span>Manual Dispatch</span>
                        </button>
                      )}

                      {/* Shiprocket Refresh Tracking Sync */}
                      {(ord.shippingDetails?.awbCode || ord.shipping?.awb || ord.shipping?.trackingNumber) && (
                        <button
                          onClick={() => handleShiprocketSync(ord)}
                          disabled={syncingOrderId === ord._id}
                          className="px-3.5 py-2 bg-white hover:bg-[#FAF8F5] border border-[#C5A880] text-[#1C1614] rounded-xl text-xs font-serif uppercase tracking-wider font-semibold transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                          title="Fetch live courier scan checkpoints from Shiprocket"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-[#C5A880] ${syncingOrderId === ord._id ? 'animate-spin' : ''}`} />
                          <span>{syncingOrderId === ord._id ? 'Syncing...' : 'Refresh Tracking'}</span>
                        </button>
                      )}

                      {/* One-Click WhatsApp Notification */}
                      <button
                        onClick={() => handleShareWhatsAppCustomer(ord)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Print Luxury Invoice */}
                      <button
                        onClick={() => handlePrintInvoice(ord)}
                        className="px-3.5 py-2 bg-white hover:bg-[#F7F4EF] border border-[#E6DDD0] text-stone-800 rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Invoice</span>
                      </button>

                      {/* Warehouse Slip Copy */}
                      <button
                        onClick={() => handleCopyWarehouseSlip(ord)}
                        className="px-3.5 py-2 bg-[#F7F4EF] hover:bg-[#eee8dc] text-stone-700 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1.5"
                      >
                        {copiedSlipId === ord._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSlipId === ord._id ? 'Copied Slip!' : 'Slip'}</span>
                      </button>
                    </div>

                    {/* Secondary Actions: Details Drawer & Cancel */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setDossierOrder(ord)}
                        className="px-3.5 py-2 bg-white hover:bg-[#F7F4EF] border border-[#E6DDD0] rounded-xl text-xs font-serif text-[#1C1614] transition-colors flex items-center space-x-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Details Drawer</span>
                      </button>

                      {status !== 'CANCELLED' && status !== 'DELIVERED' && (
                        <button
                          onClick={() => setCancelOrder(ord)}
                          className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs transition-colors"
                          title="Cancel order and rollback inventory atomically"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals & Slide-Over Dossier Drawer */}
      <CourierDispatchModal
        isOpen={Boolean(dispatchOrder)}
        onClose={() => setDispatchOrder(null)}
        order={dispatchOrder}
        onDispatched={fetchOrders}
      />

      <CancellationReasonModal
        isOpen={Boolean(cancelOrder)}
        onClose={() => setCancelOrder(null)}
        order={cancelOrder}
        onCancelled={fetchOrders}
      />

      <OrderDossierDrawer
        isOpen={Boolean(dossierOrder)}
        onClose={() => setDossierOrder(null)}
        order={dossierOrder}
      />
    </AdminLayout>
  );
}
