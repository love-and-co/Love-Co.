import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Package,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Truck,
  Percent,
  CheckCircle2
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../lib/api';

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Past 7 Days' },
  { id: 'mtd', label: 'Month to Date' },
  { id: 'all', label: 'All Time' },
];

export default function FinancialPnlAnalytics() {
  const [range, setRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [pnlData, setPnlData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(null);

  const fetchAnalytics = async (selectedRange = range) => {
    try {
      setLoading(true);
      const [pnlRes, healthRes] = await Promise.all([
        api.getFinancialPnl({ range: selectedRange }),
        api.getInventoryReplenishment(),
      ]);

      if (pnlRes.data?.success) {
        setPnlData(pnlRes.data.pnl);
      }
      if (healthRes.data?.success) {
        setHealthData(healthRes.data);
      }
    } catch (err) {
      console.warn('Failed to load financial P&L:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  // ─────────────────────────────────────────────────────────────
  // 1. PDF EXPORT 1: Store P&L & Financial Statement
  // ─────────────────────────────────────────────────────────────
  const exportPnlPdf = async () => {
    try {
      setExportingPdf('pnl');
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFillColor(28, 22, 20); // #1C1614
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(250, 248, 245);
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text('LOVE & CO. BOTANICAL FORMULATIONS', 14, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(197, 168, 128);
      doc.text('STATEMENT OF PROFIT & LOSS (P&L) - OPERATIONS ARCHIVE', 14, 20);

      doc.setTextColor(28, 22, 20);
      doc.setFontSize(9);
      doc.text(`Period Range: ${range.toUpperCase()} • Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 34);

      const pnlRows = [
        ['Fulfilled Net Revenue', `Rs. ${pnlData?.fulfilledRevenue?.toLocaleString('en-IN') || 0}`, 'Cash inflows from delivered/prepaid orders'],
        ['Gross Merchandise Value (GMV)', `Rs. ${pnlData?.gmv?.toLocaleString('en-IN') || 0}`, 'Total order volume placed'],
        ['Cost of Goods Sold (COGS)', `Rs. ${pnlData?.cogs?.toLocaleString('en-IN') || 0}`, 'Cold-pressed oils, shea butter, packaging & curing'],
        ['Air Courier Shipping Expenses', `Rs. ${pnlData?.shippingExpenses?.toLocaleString('en-IN') || 0}`, 'Carrier freight fees absorbed / charged'],
        ['Discounts Absorbed', `Rs. ${pnlData?.discountsAbsorbed?.toLocaleString('en-IN') || 0}`, 'Coupons & promotional ritual savings'],
        ['Net Operating Profit', `Rs. ${pnlData?.netProfit?.toLocaleString('en-IN') || 0}`, `Net Contribution Margin: ${pnlData?.netProfitMargin || 0}%`],
      ];

      autoTable(doc, {
        startY: 38,
        head: [['P&L Financial Metric', 'Value (INR)', 'Apothecary Accounting Notes']],
        body: pnlRows,
        theme: 'grid',
        headStyles: { fillColor: [28, 22, 20], textColor: [250, 248, 245], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [28, 22, 20] },
      });

      doc.save(`Love_and_Co_P&L_Statement_${range}_${Date.now()}.pdf`);
    } catch (err) {
      alert('Error generating P&L PDF: ' + err.message);
    } finally {
      setExportingPdf(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. PDF EXPORT 2: COD & Courier Reconciliation (with Signature Boxes)
  // ─────────────────────────────────────────────────────────────
  const exportCodReconciliationPdf = async () => {
    try {
      setExportingPdf('cod');
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFillColor(28, 22, 20);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(250, 248, 245);
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text('LOVE & CO. LOGISTICS DESK', 14, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(197, 168, 128);
      doc.text('DAILY COURIER HANDOVER & COD RECONCILIATION MANIFEST', 14, 20);

      doc.setTextColor(28, 22, 20);
      doc.setFontSize(9);
      doc.text(`Manifest Date: ${new Date().toLocaleDateString('en-IN')} • Hub: Bangalore Indiranagar Central Dispatch`, 14, 34);

      const dummyOrders = [
        ['LCO-889104', 'Delhivery Air', 'AWB-77192019', 'Rohan Sharma (Bangalore)', 'PREPAID (ONLINE)', 'Rs. 760', 'VERIFIED'],
        ['LCO-889108', 'Delhivery Air', 'AWB-77192024', 'Ananya Deshmukh (Mumbai)', 'COD (COLLECT CASH)', 'Rs. 999', 'PENDING HANDOVER'],
        ['LCO-889115', 'BlueDart Express', 'AWB-33910822', 'Vikramaditya (Hyderabad)', 'PREPAID (ONLINE)', 'Rs. 1,450', 'VERIFIED'],
        ['LCO-889122', 'Delhivery Air', 'AWB-77192031', 'Sneha Patel (Ahmedabad)', 'COD (COLLECT CASH)', 'Rs. 380', 'PENDING HANDOVER'],
      ];

      autoTable(doc, {
        startY: 38,
        head: [['Order #', 'Courier', 'Tracking AWB', 'Consignee', 'Payment Mode', 'COD Amount', 'Security Status']],
        body: dummyOrders,
        theme: 'grid',
        headStyles: { fillColor: [28, 22, 20], textColor: [250, 248, 245], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.5 },
      });

      // Dual Sign-off Boxes
      const finalY = doc.lastAutoTable.finalY + 25;
      doc.setDrawColor(197, 168, 128);
      doc.setLineWidth(0.5);

      // Signature Box 1: Warehouse Lead
      doc.rect(14, finalY, 85, 35);
      doc.setFontSize(8);
      doc.setTextColor(28, 22, 20);
      doc.setFont('times', 'bold');
      doc.text('AUTHORIZED WAREHOUSE DISPATCH LEAD', 18, finalY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Signature: ________________________________', 18, finalY + 20);
      doc.text('Name / Employee ID: Dr. Sarah Sen (Lead Chemist)', 18, finalY + 28);

      // Signature Box 2: Courier Representative
      doc.rect(111, finalY, 85, 35);
      doc.setFontSize(8);
      doc.setFont('times', 'bold');
      doc.text('COURIER REPRESENTATIVE HANDOVER', 115, finalY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Signature: ________________________________', 115, finalY + 20);
      doc.text('Courier Partner / Vehicle #: Delhivery Hub Ex.', 115, finalY + 28);

      doc.save(`Love_and_Co_Courier_COD_Reconciliation_${Date.now()}.pdf`);
    } catch (err) {
      alert('Error generating Courier Reconciliation PDF: ' + err.message);
    } finally {
      setExportingPdf(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. PDF EXPORT 3: Customer Directory & Loyalty Report
  // ─────────────────────────────────────────────────────────────
  const exportCustomerLoyaltyPdf = async () => {
    try {
      setExportingPdf('loyalty');
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFillColor(28, 22, 20);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(250, 248, 245);
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text('LOVE & CO. BOTANICAL APOTHECARY', 14, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(197, 168, 128);
      doc.text('PATRON DIRECTORY & 10-STAMP RITUAL LOYALTY REPORT', 14, 20);

      doc.setTextColor(28, 22, 20);
      doc.setFontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 34);

      const crmRes = await api.getCustomerIntelligence();
      const customers = crmRes.data?.crm?.customers || [];

      const rows = customers.slice(0, 50).map((c) => [
        c.name,
        c.phone,
        c.city || 'Bangalore',
        c.ordersCount,
        `Rs. ${c.totalSpend.toLocaleString('en-IN')}`,
        `${c.stamps} / 10 Stamps`,
        c.milestoneUnlocked ? 'FREE TRIO UNLOCKED' : 'In Progress',
      ]);

      autoTable(doc, {
        startY: 38,
        head: [['Patron Name', 'Phone', 'City', 'Orders', 'Spend', 'Stamps', 'Milestone Status']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [28, 22, 20], textColor: [250, 248, 245], fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.5 },
      });

      doc.save(`Love_and_Co_Customer_Loyalty_Report_${Date.now()}.pdf`);
    } catch (err) {
      alert('Error generating Loyalty PDF: ' + err.message);
    } finally {
      setExportingPdf(null);
    }
  };

  return (
    <AdminLayout pageTitle="Analytics & Reports">
      <Head>
        <title>Financial P&amp;L Analytics &amp; Reports | Love &amp; Co. Flagship</title>
      </Head>

      <div className="space-y-8">
        {/* Header & Date Range Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-serif tracking-widest text-[#C5A880] uppercase">
              <span>Operations Portal</span>
              <span>/</span>
              <span>Financial P&amp;L &amp; Executive Reports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1C1614] font-normal tracking-wide mt-1">
              Financial P&amp;L Analytics &amp; PDF Suite
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              COGS breakdown, net operating margins, replenishment forecasting &amp; signed courier reconciliation.
            </p>
          </div>

          {/* Date Presets */}
          <div className="flex items-center space-x-1 bg-white border border-stone-200 rounded-2xl p-1 shadow-sm overflow-x-auto scrollbar-none self-start sm:self-auto">
            {DATE_PRESETS.map((p) => {
              const isActive = range === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setRange(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-serif tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1C1614] text-[#FAF8F5] shadow-sm font-medium'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-[#1C1614]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3 LUXURY PDF REPORT DOWNLOAD CARDS
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* PDF 1 */}
          <div className="bg-white border border-[#C5A880]/30 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A880] font-semibold">
                Executive PDF Report 1
              </span>
              <h3 className="font-serif text-base font-semibold text-[#1C1614] mt-0.5">
                Store P&amp;L &amp; Financial Statement
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Clean printable statement of GMV, fulfilled net revenues, estimated COGS, and operating margins.
              </p>
            </div>
            <button
              onClick={exportPnlPdf}
              disabled={exportingPdf === 'pnl'}
              className="w-full py-2.5 bg-[#1C1614] hover:bg-black text-[#FAF8F5] rounded-xl text-xs font-serif uppercase tracking-wider transition-all flex items-center justify-center space-x-2 border border-[#C5A880]/40"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{exportingPdf === 'pnl' ? 'Generating...' : 'Download P&L PDF'}</span>
            </button>
          </div>

          {/* PDF 2 */}
          <div className="bg-white border border-[#C5A880]/30 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-blue-700 font-semibold">
                Executive PDF Report 2
              </span>
              <h3 className="font-serif text-base font-semibold text-[#1C1614] mt-0.5">
                COD &amp; Courier Reconciliation
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Logistics manifest with dual formal signature boxes for Warehouse Lead and Courier Representative.
              </p>
            </div>
            <button
              onClick={exportCodReconciliationPdf}
              disabled={exportingPdf === 'cod'}
              className="w-full py-2.5 bg-white hover:bg-stone-50 text-[#1C1614] border border-stone-300 rounded-xl text-xs font-serif uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>{exportingPdf === 'cod' ? 'Generating...' : 'Download Courier Manifest'}</span>
            </button>
          </div>

          {/* PDF 3 */}
          <div className="bg-white border border-[#C5A880]/30 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-700 font-semibold">
                Executive PDF Report 3
              </span>
              <h3 className="font-serif text-base font-semibold text-[#1C1614] mt-0.5">
                Customer Directory &amp; Loyalty Report
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Comprehensive patron ledger with LTV spends, 10-stamp card states, and Free Trio milestones.
              </p>
            </div>
            <button
              onClick={exportCustomerLoyaltyPdf}
              disabled={exportingPdf === 'loyalty'}
              className="w-full py-2.5 bg-white hover:bg-stone-50 text-[#1C1614] border border-stone-300 rounded-xl text-xs font-serif uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>{exportingPdf === 'loyalty' ? 'Generating...' : 'Download Loyalty PDF'}</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            FINANCIAL P&L CARDS GRID
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-lg text-[#1C1614] font-medium border-b border-stone-100 pb-3">
            Apothecary Financial Statement ({range.toUpperCase()})
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-stone-50/70 border border-stone-200/80 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-serif tracking-wider text-stone-500">Fulfilled Revenue</span>
              <p className="text-lg font-bold font-serif text-[#1C1614]">
                ₹{Number(pnlData?.fulfilledRevenue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400">Net realized cash</p>
            </div>

            <div className="p-4 bg-stone-50/70 border border-stone-200/80 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-serif tracking-wider text-stone-500">Gross GMV</span>
              <p className="text-lg font-bold font-serif text-stone-700">
                ₹{Number(pnlData?.gmv || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400">Total placed orders</p>
            </div>

            <div className="p-4 bg-stone-50/70 border border-stone-200/80 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-serif tracking-wider text-stone-500">COGS (Botanicals)</span>
              <p className="text-lg font-bold font-serif text-stone-700">
                ₹{Number(pnlData?.cogs || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400">Ingredients &amp; cured lipid matrix</p>
            </div>

            <div className="p-4 bg-stone-50/70 border border-stone-200/80 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-serif tracking-wider text-stone-500">Air Freight Courier</span>
              <p className="text-lg font-bold font-serif text-stone-700">
                ₹{Number(pnlData?.shippingExpenses || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400">Delhivery / BlueDart</p>
            </div>

            <div className="p-4 bg-stone-50/70 border border-stone-200/80 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-serif tracking-wider text-stone-500">Discounts Absorbed</span>
              <p className="text-lg font-bold font-serif text-emerald-700">
                ₹{Number(pnlData?.discountsAbsorbed || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400">Coupons &amp; loyalty perks</p>
            </div>

            <div className="p-4 bg-[#C5A880]/15 border border-[#C5A880]/40 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-serif tracking-wider text-[#1C1614] font-semibold">Net Profit Margin</span>
              <p className="text-lg font-bold font-serif text-[#1C1614]">
                {pnlData?.netProfitMargin || 0}%
              </p>
              <p className="text-[10px] text-stone-700">₹{Number(pnlData?.netProfit || 0).toLocaleString('en-IN')} Net</p>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            INVENTORY HEALTH: LOW-STOCK REPLENISHMENT & SLOW-MOVER WATCH
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Low Stock Replenishment */}
          <div className="bg-white border border-rose-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-base text-rose-900 font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Low-Stock Replenishment Watch</span>
                </h3>
                <p className="text-xs text-stone-500">Formulations approaching cure threshold (&lt; 15 units).</p>
              </div>
              <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg">
                {healthData?.lowStockReplenishment?.length || 0} SKUs
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(healthData?.lowStockReplenishment || []).length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">All formulations adequately stocked.</p>
              ) : (
                (healthData?.lowStockReplenishment || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl text-xs">
                    <div>
                      <p className="font-serif font-medium text-stone-900">{item.name}</p>
                      <p className="text-[10px] text-stone-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-700">{item.stock} left</span>
                      <p className="text-[10px] text-stone-400">Reorder ~{item.recommendedReorder} units</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Slow-Mover Watch */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-base text-stone-900 font-semibold flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>Slow-Mover Watch</span>
                </h3>
                <p className="text-xs text-stone-500">High inventory reserve batches with low velocity.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg">
                {healthData?.slowMovers?.length || 0} SKUs
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(healthData?.slowMovers || []).length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">No stagnant batches identified.</p>
              ) : (
                (healthData?.slowMovers || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl text-xs">
                    <div>
                      <p className="font-serif font-medium text-stone-900">{item.name}</p>
                      <p className="text-[10px] text-stone-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-stone-800">{item.stock} units</span>
                      <p className="text-[10px] text-stone-400">{item.daysInStock || 15} days in cure stock</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
