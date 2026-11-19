import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Users,
  Search,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Download,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Gift,
  Calendar,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye,
  Star
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import CustomerDossierSlideOver from '../../../components/admin/CustomerDossierSlideOver';
import { api } from '../../../lib/api';

const CRM_TABS = [
  { id: 'directory', label: '1. Patron Directory' },
  { id: 'segmentation', label: '2. VIP & Segments' },
  { id: 'loyalty', label: '3. Retention & Loyalty' },
];

export default function CustomerIntelligenceCRM() {
  const [activeTab, setActiveTab] = useState('directory');
  const [crmData, setCrmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('spend'); // spend, orders, date

  // Slide-over state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerInitial, setSelectedCustomerInitial] = useState(null);

  const fetchCRM = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomerIntelligence();
      if (res.data?.success) {
        setCrmData(res.data.crm);
      }
    } catch (err) {
      console.warn('Failed to fetch CRM:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRM();
  }, []);

  const openCustomerDossier = (cust) => {
    setSelectedCustomerId(cust.id);
    setSelectedCustomerInitial(cust);
  };

  // Filtered & sorted customers for directory
  const filteredCustomers = useMemo(() => {
    if (!crmData?.customers) return [];
    let list = [...crmData.customers];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((c) => {
        return (
          (c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.state || '').toLowerCase().includes(q)
        );
      });
    }

    if (sortBy === 'spend') {
      list.sort((a, b) => b.totalSpend - a.totalSpend);
    } else if (sortBy === 'orders') {
      list.sort((a, b) => b.ordersCount - a.ordersCount);
    } else if (sortBy === 'date') {
      list.sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate));
    }

    return list;
  }, [crmData, search, sortBy]);

  // Client-Side PDF Export using jsPDF and jspdf-autotable
  const handleExportPdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      // Brand Header
      doc.setFillColor(28, 22, 20); // #1C1614
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(250, 248, 245);
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text('LOVE & CO. BOTANICAL APOTHECARY', 14, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(197, 168, 128); // #C5A880
      doc.text('EXECUTIVE CUSTOMER INTELLIGENCE & LOYALTY DOSSIER', 14, 20);

      doc.setTextColor(28, 22, 20);
      doc.setFontSize(9);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        14,
        34
      );

      const tableData = filteredCustomers.slice(0, 50).map((c) => [
        c.name,
        c.phone,
        c.email,
        c.state || 'Karnataka',
        c.ordersCount,
        `Rs. ${c.totalSpend.toLocaleString('en-IN')}`,
        `${c.stamps}/10 ${c.milestoneUnlocked ? '(Free Trio)' : ''}`,
      ]);

      autoTable(doc, {
        startY: 38,
        head: [['Patron Name', 'Phone', 'Email', 'State', 'Orders', 'Lifetime Spend', 'Loyalty Stamps']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [28, 22, 20],
          textColor: [250, 248, 245],
          fontSize: 8,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          textColor: [28, 22, 20],
        },
        alternateRowStyles: {
          fillColor: [250, 248, 245],
        },
      });

      doc.save(`Love_and_Co_Customer_Dossier_${Date.now()}.pdf`);
    } catch (err) {
      alert('Error generating PDF report: ' + err.message);
    }
  };

  const overview = crmData?.overview || {};

  return (
    <AdminLayout pageTitle="Customers & CRM">
      <Head>
        <title>Customer Intelligence &amp; Loyalty CRM | Love &amp; Co. Flagship</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E6DDD0] pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-serif tracking-widest text-[#C5A880] uppercase">
              <span>Operations Portal</span>
              <span>/</span>
              <span>Customer Intelligence CRM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1C1614] font-normal tracking-wide mt-1">
              Customer Intelligence &amp; Loyalty CRM
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Visual patron directory, 10-stamp ritual trackers, VIP segments &amp; slide-out dossiers.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchCRM}
              className="px-4 py-2 bg-white hover:bg-[#F7F4EF] border border-[#E6DDD0] rounded-xl text-xs font-medium text-stone-700 transition-colors shadow-sm flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Refresh CRM</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 bg-[#1C1614] hover:bg-black text-[#FAF8F5] border border-[#C5A880]/40 rounded-xl text-xs font-serif tracking-wider uppercase transition-all shadow-sm flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* 4 Executive Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500 font-semibold block">
              Total Patrons
            </span>
            <div className="text-2xl sm:text-3xl font-serif text-[#1C1614] font-semibold mt-1">
              {overview.totalCustomers || 0}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Verified customer profiles</p>
          </div>

          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500 font-semibold block">
              Repeat Patrons
            </span>
            <div className="text-2xl sm:text-3xl font-serif text-emerald-800 font-semibold mt-1">
              {overview.repeatCustomers || 0}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Purchased 2 or more times</p>
          </div>

          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500 font-semibold block">
              Repeat Purchase Rate
            </span>
            <div className="text-2xl sm:text-3xl font-serif text-[#1C1614] font-semibold mt-1">
              {overview.repeatPurchaseRate || 0}%
            </div>
            <p className="text-[11px] text-stone-500 mt-1">D2C Benchmark: 22-28%</p>
          </div>

          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500 font-semibold block">
              Active Loyalty Members
            </span>
            <div className="text-2xl sm:text-3xl font-serif text-[#C5A880] font-semibold mt-1">
              {overview.activeLoyaltyMembers || 0}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Collecting 10-stamp rituals</p>
          </div>
        </div>

        {/* 3 Clean Tabs Navigation Bar */}
        <div className="bg-white border border-[#E6DDD0] rounded-2xl p-2 shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 min-w-max">
            {CRM_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-serif tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#1C1614] text-[#FAF8F5] shadow-sm font-medium'
                      : 'text-stone-600 hover:bg-[#F7F4EF] hover:text-[#1C1614]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: PATRON DIRECTORY (WITH VISUAL 10-DOT CARDS & SLIDE-OUT)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            {/* Search & Sort Controls */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patron name, email, phone, city..."
                  className="w-full pl-8 pr-3 py-2 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-xs text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-stone-500 font-serif">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-[#F7F4EF]/60 border border-[#E6DDD0] rounded-xl text-xs text-[#1C1614] focus:outline-none focus:border-[#C5A880]"
                >
                  <option value="spend">Lifetime Spend (Highest)</option>
                  <option value="orders">Total Orders (Highest)</option>
                  <option value="date">Join Date (Newest)</option>
                </select>
              </div>
            </div>

            {/* Visual Customer Cards Grid */}
            {loading ? (
              <div className="py-20 text-center text-xs text-stone-500 bg-white rounded-2xl border border-[#E6DDD0]">
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-[#1C1614] border-t-transparent rounded-full animate-spin" />
                Loading patron dossiers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-[#E6DDD0] text-stone-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-stone-300" />
                <p className="font-serif text-sm">No patrons found matching your search.</p>
                <p className="text-xs text-stone-400">Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomers.map((c) => {
                  const initials = (c.name || 'Patron')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const isVip = c.ordersCount >= 3;
                  const isRepeat = c.ordersCount === 2;
                  const stamps = Math.min(10, c.stamps || c.ordersCount || 0);

                  return (
                    <div
                      key={c.id}
                      onClick={() => openCustomerDossier(c)}
                      className="group bg-white border border-[#E6DDD0] hover:border-[#C5A880] rounded-2xl p-5 shadow-sm transition-all cursor-pointer space-y-4"
                    >
                      {/* Patron Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Initials Avatar */}
                          <div className="w-12 h-12 rounded-2xl bg-[#1C1614] text-[#FAF8F5] border border-[#C5A880]/30 font-serif font-bold text-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#C5A880] group-hover:text-[#1C1614] transition-colors shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-serif font-semibold text-stone-900 text-sm">
                                {c.name}
                              </h3>
                              {/* Verified +91 Phone Badge */}
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                              {c.phone}
                            </p>
                          </div>
                        </div>

                        {/* Tier Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-serif uppercase tracking-wider font-semibold ${
                            isVip
                              ? 'bg-[#C5A880]/20 text-[#8C6D3F] border border-[#C5A880]/40'
                              : isRepeat
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {isVip ? 'VIP Connoisseur' : isRepeat ? 'Repeat Patron' : 'Explorer'}
                        </span>
                      </div>

                      {/* Visual 10-Dot Ritual Stamp Progress Bar */}
                      <div className="space-y-1.5 bg-[#F7F4EF]/70 p-3 rounded-xl border border-[#E6DDD0]/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-serif text-[11px] uppercase tracking-wider text-stone-500 font-semibold flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-[#C5A880]" />
                            <span>10-Stamp Ritual Progress</span>
                          </span>
                          <span className="font-mono font-bold text-[#1C1614]">
                            {stamps}/10
                          </span>
                        </div>

                        {/* 10-Dot Bar */}
                        <div className="grid grid-cols-10 gap-1 pt-1">
                          {Array.from({ length: 10 }, (_, i) => {
                            const dotIndex = i + 1;
                            const isFilled = dotIndex <= stamps;
                            const isTenth = dotIndex === 10;

                            return (
                              <div
                                key={dotIndex}
                                title={isTenth ? '10th Stamp: Free Botanical Trio Box' : `Stamp ${dotIndex}`}
                                className={`h-4 rounded flex items-center justify-center transition-all ${
                                  isFilled
                                    ? isTenth
                                      ? 'bg-[#C5A880] text-[#1C1614]'
                                      : 'bg-[#1C1614]'
                                    : 'bg-stone-200'
                                }`}
                              >
                                {isTenth && isFilled && (
                                  <Gift className="w-2.5 h-2.5 text-[#1C1614]" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Footer: LTV & Slide-Over Trigger */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] font-serif uppercase tracking-widest text-stone-400 font-semibold block">
                            Lifetime Spend (LTV)
                          </span>
                          <span className="text-base font-serif font-bold text-[#1C1614]">
                            ₹{c.totalSpend?.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono ml-2">
                            ({c.ordersCount} orders)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomerDossier(c);
                          }}
                          className="px-3.5 py-1.5 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>Dossier Drawer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: VIP & COHORT SEGMENTATION
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'segmentation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VIP Connoisseurs */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6DDD0]/60 pb-3">
                <div>
                  <h3 className="font-serif text-base text-[#1C1614] font-semibold flex items-center space-x-2">
                    <Star className="w-4 h-4 text-[#C5A880] fill-[#C5A880]" />
                    <span>VIP Connoisseurs (3+ Orders)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">High-LTV repeat advocates of botanical soap rituals.</p>
                </div>
                <span className="text-xs font-mono font-bold bg-[#C5A880]/20 text-[#8C6D3F] px-3 py-1 rounded-lg">
                  {crmData?.segmentation?.vipCount || 0} Patrons
                </span>
              </div>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredCustomers.filter((c) => c.ordersCount >= 3).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openCustomerDossier(c)}
                    className="p-3.5 bg-[#F7F4EF]/60 hover:bg-[#F7F4EF] border border-[#E6DDD0] rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-serif font-medium text-stone-900">{c.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono">{c.phone} • {c.city || 'Bengaluru'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-serif font-bold text-[#1C1614]">₹{c.totalSpend.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] text-stone-400 font-mono">{c.ordersCount} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Repeat Enthusiasts */}
            <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6DDD0]/60 pb-3">
                <div>
                  <h3 className="font-serif text-base text-[#1C1614] font-semibold">Repeat Enthusiasts (2 Orders)</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Second-time buyers primed for loyalty 10-stamp milestone.</p>
                </div>
                <span className="text-xs font-mono font-bold bg-stone-100 text-stone-800 px-3 py-1 rounded-lg">
                  {crmData?.segmentation?.repeatCount || 0} Patrons
                </span>
              </div>
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredCustomers.filter((c) => c.ordersCount === 2).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => openCustomerDossier(c)}
                    className="p-3.5 bg-[#F7F4EF]/60 hover:bg-[#F7F4EF] border border-[#E6DDD0] rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-serif font-medium text-stone-900">{c.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono">{c.phone} • {c.city || 'Bengaluru'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-serif font-bold text-[#1C1614]">₹{c.totalSpend.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] text-stone-400 font-mono">{c.ordersCount} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: RETENTION & 10-STAMP FUNNEL
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'loyalty' && (
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#E6DDD0]/60 pb-3">
              <h3 className="font-serif text-base text-[#1C1614] font-semibold flex items-center space-x-2">
                <Gift className="w-4 h-4 text-[#C5A880]" />
                <span>10-Stamp Loyalty Retention Funnel</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Track patron progression toward unlocking their complimentary <strong>Signature Botanical Trio Gift Box</strong>.
              </p>
            </div>

            <div className="space-y-3.5">
              {(crmData?.stampFunnel || []).map((s) => {
                const total = crmData?.overview?.totalCustomers || 1;
                const pct = Math.round((s.customerCount / total) * 100);
                const isMilestone = s.stamp === 10;

                return (
                  <div key={s.stamp} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-serif ${isMilestone ? 'font-bold text-[#8C6D3F] flex items-center space-x-1.5' : 'text-stone-700'}`}>
                        {isMilestone && <Gift className="w-3.5 h-3.5 text-[#C5A880]" />}
                        <span>{s.label}</span>
                      </span>
                      <span className="font-mono text-stone-600">
                        {s.customerCount} Patrons ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F7F4EF] rounded-full h-3.5 overflow-hidden border border-[#E6DDD0]/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isMilestone ? 'bg-[#C5A880]' : 'bg-[#1C1614]'
                        }`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right-Side Slide-Over Customer Dossier Drawer */}
      <CustomerDossierSlideOver
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => {
          setSelectedCustomerId(null);
          setSelectedCustomerInitial(null);
        }}
        customerId={selectedCustomerId}
        initialCustomer={selectedCustomerInitial}
      />
    </AdminLayout>
  );
}
