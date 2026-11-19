import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Trash2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Layers,
  Calendar,
  Package,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Download,
  Plus,
  SlidersHorizontal,
  FileSpreadsheet,
  Check,
  X,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  Barcode,
  Info
} from 'lucide-react';
import { api } from '../../../lib/api';
import { INITIAL_PRODUCTS } from '../data/mockSeed';
import {
  getStoredProducts,
  getStoredOverrides,
  saveStoredOverrides,
  getStoredCustomLots,
  saveStoredCustomLots,
  syncBatchStockToProduct,
  syncNewBatchLot,
  OVERRIDES_STORAGE_KEY,
  CUSTOM_LOTS_STORAGE_KEY,
} from '../utils/stockSync';

const CATEGORIES = ['All Categories', 'Soaps', 'Lip Care'];

export default function AdminInventoryWatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | EXPIRING_SOON | EXPIRED | SAFE
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('FEFO'); // FEFO | STOCK_DESC | STOCK_ASC | NAME
  const [toastMessage, setToastMessage] = useState('');

  // Modals & Drawers
  const [writeOffModal, setWriteOffModal] = useState(null);
  const [inspectBatch, setInspectBatch] = useState(null);
  const [adjustStockModal, setAdjustStockModal] = useState(null);
  const [adjustUnits, setAdjustUnits] = useState(0);
  const [adjustMfgDate, setAdjustMfgDate] = useState('');
  const [adjustExpDate, setAdjustExpDate] = useState('');
  const [adjustReason, setAdjustReason] = useState('Inventory Restock (Ready to Ship)');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [newBatchModalOpen, setNewBatchModalOpen] = useState(false);

  // New Batch Form
  const [newBatchForm, setNewBatchForm] = useState({
    productId: 'prod_bloom',
    batchNumber: `LOT-CP-2026-${Math.floor(100 + Math.random() * 900)}`,
    mfgDate: new Date().toISOString().split('T')[0],
    expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stockQuantity: 250,
  });

  // Storage keys for persistent overrides & custom lots across refreshes
  const OVERRIDES_STORAGE_KEY = 'love_co_fefo_overrides_v2';
  const CUSTOM_LOTS_STORAGE_KEY = 'love_co_fefo_custom_lots_v2';

  const saveStoredOverride = (batchNumber, patch) => {
    if (typeof window === 'undefined' || !batchNumber) return;
    try {
      const current = getStoredOverrides();
      const updated = {
        ...current,
        [batchNumber]: {
          ...(current[batchNumber] || {}),
          ...patch,
          updatedAt: Date.now(),
        },
      };
      saveStoredOverrides(updated);
    } catch (e) {
      console.warn('Failed to save override', e);
    }
  };

  const saveStoredCustomLot = (newLot) => {
    if (typeof window === 'undefined' || !newLot) return;
    try {
      const current = getStoredCustomLots();
      const existsIndex = current.findIndex((l) => l.batchNumber === newLot.batchNumber);
      let updated;
      if (existsIndex >= 0) {
        updated = [...current];
        updated[existsIndex] = newLot;
      } else {
        updated = [newLot, ...current];
      }
      saveStoredCustomLots(updated);
    } catch (e) {
      console.warn('Failed to save custom lot', e);
    }
  };

  const applyOverridesAndCustomLots = (baseRows) => {
    const overrides = getStoredOverrides();
    const customLots = getStoredCustomLots();

    // Apply overrides to existing baseRows
    const processedBase = baseRows.map((row) => {
      const override = overrides[row.batchNumber];
      if (!override) return row;

      const merged = { ...row, ...override };
      // Ensure write-off state is strictly honored
      if (override.isWrittenOff) {
        merged.stockQuantity = 0;
        merged.status = 'Written Off';
        merged.isWrittenOff = true;
      } else if (override.isWrittenOff === false && merged.status === 'Written Off') {
        const now = Date.now();
        const expTime = new Date(merged.expDate).getTime();
        const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        merged.status = daysLeft <= 0 ? 'Expired' : daysLeft <= 90 ? 'Expiring Soon' : 'Safe';
      }
      return merged;
    });

    // Merge custom lots, also applying any overrides to them
    const processedCustom = customLots.map((lot) => {
      const override = overrides[lot.batchNumber];
      if (!override) return lot;
      const merged = { ...lot, ...override };
      if (override.isWrittenOff) {
        merged.stockQuantity = 0;
        merged.status = 'Written Off';
        merged.isWrittenOff = true;
      }
      return merged;
    });

    // Combine custom lots + base rows avoiding duplicate batchNumbers
    const baseBatchSet = new Set(processedBase.map((r) => r.batchNumber));
    const uniqueCustom = processedCustom.filter((l) => !baseBatchSet.has(l.batchNumber));

    return [...uniqueCustom, ...processedBase];
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const getActiveProducts = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('love_co_admin_products_v1');
        if (stored && stored.trim() && stored !== 'undefined' && stored !== 'null') {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  };

  const buildWatchlistFromSeed = () => {
    const now = Date.now();
    const rows = [];
    const sourceProducts = getActiveProducts();
    sourceProducts.forEach((p) => {
      (p.batches || []).forEach((b) => {
        const expTime = new Date(b.expDate).getTime();
        const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        let status = 'Safe';
        if (daysLeft <= 0) {
          status = 'Expired';
        } else if (daysLeft <= 90) {
          status = 'Expiring Soon';
        }

        const isSoap = p.category?.toLowerCase().includes('soap') || p.title?.toLowerCase().includes('soap');

        rows.push({
          productId: p._id,
          productTitle: p.title || p.name,
          slug: p.slug,
          sku: `SKU-${(p.slug || 'LOT').toUpperCase().slice(0, 8)}`,
          batchNumber: b.batchNumber,
          stockQuantity: b.stockQuantity,
          reservedQuantity: b.reservedQuantity || 0,
          price: p.price || 299,
          costPrice: p.costPrice || 85,
          mfgDate: b.mfgDate,
          expDate: b.expDate,
          daysRemaining: daysLeft,
          status,
          category: isSoap ? 'Soaps' : 'Lip Care',
          activeIngredients: p.activeIngredients || [],
        });
      });
    });

    // Sort by earliest expiring (FEFO order)
    rows.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return rows;
  };

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const res = await api.getD2cWatchlist();
      const currentProducts = getActiveProducts();
      if (res.data?.success && res.data.watchlist && res.data.watchlist.length > 0) {
        // Map backend format to unified structure
        const mapped = res.data.watchlist.map((item) => {
          const matchingProduct = currentProducts.find(
            (p) => p._id === item.productId || p.title === item.productName || p.name === item.productName
          );
          const isSoap =
            (matchingProduct?.category || item.category || '').toLowerCase().includes('soap') ||
            (item.productName || item.productTitle || '').toLowerCase().includes('soap');

          const isWrittenOff = item.isWrittenOff === true || item.status === 'WRITTEN_OFF';

          return {
            productId: item.productId || matchingProduct?._id || 'prod_bloom',
            productTitle: item.productTitle || item.productName || matchingProduct?.title || 'Formulation Lot',
            slug: matchingProduct?.slug || 'love-and-co',
            sku: item.sku || `SKU-${item.batchNumber}`,
            batchNumber: item.batchNumber,
            stockQuantity: isWrittenOff ? 0 : (item.unitsLeft !== undefined ? item.unitsLeft : item.stockQuantity || 0),
            previousStockQuantity: item.previousStockQuantity || 10,
            reservedQuantity: item.reservedQuantity || 0,
            price: matchingProduct?.price || 299,
            costPrice: matchingProduct?.costPrice || 85,
            mfgDate: item.mfgDate,
            expDate: item.expDate,
            daysRemaining: item.daysRemaining,
            isWrittenOff: isWrittenOff,
            status:
              isWrittenOff
                ? 'Written Off'
                : item.status === 'EXPIRING_SOON'
                ? 'Expiring Soon'
                : item.status === 'EXPIRED'
                ? 'Expired'
                : item.status === 'SAFE'
                ? 'Safe'
                : item.status || 'Safe',
            category: isSoap ? 'Soaps' : 'Lip Care',
            activeIngredients: matchingProduct?.activeIngredients || [],
          };
        });
        setWatchlist(applyOverridesAndCustomLots(mapped));
      } else {
        setWatchlist(applyOverridesAndCustomLots(buildWatchlistFromSeed()));
      }
    } catch (err) {
      console.warn('API error, using initial batch watchlist:', err);
      setWatchlist(applyOverridesAndCustomLots(buildWatchlistFromSeed()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();

    const handleSync = () => {
      loadWatchlist();
    };
    window.addEventListener('love_co_products_updated', handleSync);
    window.addEventListener('love_co_inventory_updated', handleSync);
    return () => {
      window.removeEventListener('love_co_products_updated', handleSync);
      window.removeEventListener('love_co_inventory_updated', handleSync);
    };
  }, []);

  // Filtered and Sorted Rows
  const filteredRows = useMemo(() => {
    let rows = watchlist.filter((item) => {
      const isWrittenOff = item.status === 'Written Off' || item.isWrittenOff;
      const matchSearch =
        item.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      let matchStatus = true;
      if (statusFilter === 'EXPIRING_SOON') {
        matchStatus = !isWrittenOff && item.status === 'Expiring Soon';
      } else if (statusFilter === 'EXPIRED') {
        matchStatus = !isWrittenOff && (item.status === 'Expired' || item.daysRemaining <= 0);
      } else if (statusFilter === 'SAFE') {
        matchStatus = !isWrittenOff && item.status === 'Safe' && item.daysRemaining > 90;
      } else if (statusFilter === 'WRITTEN_OFF') {
        matchStatus = isWrittenOff;
      }

      let matchCategory = true;
      if (categoryFilter !== 'All Categories') {
        matchCategory = item.category === categoryFilter;
      }

      return matchSearch && matchStatus && matchCategory;
    });

    // Sorting: Written-off rows ALWAYS sink to the bottom of the list
    return rows.sort((a, b) => {
      const aWrittenOff = a.status === 'Written Off' || a.isWrittenOff;
      const bWrittenOff = b.status === 'Written Off' || b.isWrittenOff;

      // If one is written off, move it to the bottom
      if (aWrittenOff && !bWrittenOff) return 1;
      if (!aWrittenOff && bWrittenOff) return -1;

      // Active lots sort according to selected sort criteria
      if (sortBy === 'FEFO') return a.daysRemaining - b.daysRemaining;
      if (sortBy === 'STOCK_DESC') return b.stockQuantity - a.stockQuantity;
      if (sortBy === 'STOCK_ASC') return a.stockQuantity - b.stockQuantity;
      if (sortBy === 'NAME') return a.productTitle.localeCompare(b.productTitle);
      return 0;
    });
  }, [watchlist, searchTerm, statusFilter, categoryFilter, sortBy]);

  // Handle Write-Off
  const handleConfirmWriteOff = async () => {
    if (!writeOffModal) return;
    const batchNum = writeOffModal.batchNumber;
    const currentItem = watchlist.find((item) => item.batchNumber === batchNum);
    const prevQty = currentItem?.stockQuantity > 0 ? currentItem.stockQuantity : (currentItem?.previousStockQuantity || 10);

    // Sync write-off: updates batch override AND decrements product totalStock across all pages
    syncBatchStockToProduct({
      batchNumber: batchNum,
      productId: writeOffModal.productId,
      newStock: 0,
      isWrittenOff: true,
      previousStockQuantity: prevQty,
    });

    try {
      await api.writeOffBatch({
        productId: writeOffModal.productId,
        batchNumber: batchNum,
      });
    } catch (e) {
      // client simulation fallback
    }

    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.batchNumber === batchNum) {
          return {
            ...item,
            previousStockQuantity: prevQty,
            stockQuantity: 0,
            status: 'Written Off',
            isWrittenOff: true,
          };
        }
        return item;
      })
    );
    showToast(`Batch ${batchNum} written off and synced across inventory.`);
    setWriteOffModal(null);
    if (inspectBatch?.batchNumber === batchNum) {
      setInspectBatch((prev) => prev ? { ...prev, stockQuantity: 0, previousStockQuantity: prevQty, status: 'Written Off', isWrittenOff: true } : null);
    }
  };

  // Handle Undo Write-Off
  const handleUndoWriteOff = async (batch) => {
    const batchNum = batch.batchNumber;
    const restoredQty = batch.previousStockQuantity || 10;
    const now = Date.now();
    const expTime = new Date(batch.expDate).getTime();
    const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
    let restoredStatus = 'Safe';
    if (daysLeft <= 0) restoredStatus = 'Expired';
    else if (daysLeft <= 90) restoredStatus = 'Expiring Soon';

    // Sync restored batch: updates batch override AND restores product totalStock across all pages
    syncBatchStockToProduct({
      batchNumber: batchNum,
      productId: batch.productId,
      newStock: restoredQty,
      isWrittenOff: false,
    });

    try {
      await api.writeOffBatch({
        productId: batch.productId,
        batchNumber: batchNum,
        isUndo: true,
        restoredQuantity: restoredQty,
      });
    } catch (e) {
      // client simulation fallback
    }

    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.batchNumber === batchNum) {
          return {
            ...item,
            stockQuantity: restoredQty,
            status: restoredStatus,
            isWrittenOff: false,
          };
        }
        return item;
      })
    );

    showToast(`Undo write-off: Batch ${batchNum} restored with ${restoredQty} units and synced.`);
    if (inspectBatch?.batchNumber === batchNum) {
      setInspectBatch((prev) => prev ? { ...prev, stockQuantity: restoredQty, status: restoredStatus, isWrittenOff: false } : null);
    }
  };

  // Handle Stock Adjustment
  const handleSaveStockAdjustment = () => {
    if (!adjustStockModal) return;
    const finalQty = Math.max(0, parseInt(adjustUnits, 10) || 0);

    const mfgIso = adjustMfgDate ? new Date(adjustMfgDate).toISOString() : adjustStockModal.mfgDate;
    const expIso = adjustExpDate ? new Date(adjustExpDate).toISOString() : adjustStockModal.expDate;

    // Recalculate days remaining and status based on expiry date
    const now = Date.now();
    const expTime = new Date(expIso).getTime();
    const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
    let newStatus = 'Safe';
    if (daysLeft <= 0) newStatus = 'Expired';
    else if (daysLeft <= 90) newStatus = 'Expiring Soon';

    // Sync adjustment: updates batch override AND synchronizes product totalStock across all pages
    syncBatchStockToProduct({
      batchNumber: adjustStockModal.batchNumber,
      productId: adjustStockModal.productId,
      newStock: finalQty,
      mfgDate: mfgIso,
      expDate: expIso,
      isWrittenOff: adjustStockModal.isWrittenOff || false,
    });

    setWatchlist((prev) =>
      prev.map((item) => {
        if (item.batchNumber === adjustStockModal.batchNumber) {
          return {
            ...item,
            stockQuantity: finalQty,
            mfgDate: mfgIso,
            expDate: expIso,
            daysRemaining: daysLeft,
            status: item.isWrittenOff ? 'Written Off' : newStatus,
          };
        }
        return item;
      })
    );

    const notesTxt = adjustNotes.trim() ? ` (${adjustNotes.trim()})` : '';
    showToast(`Batch ${adjustStockModal.batchNumber} updated & synced: ${finalQty} units. Reason: ${adjustReason}${notesTxt}`);
    setAdjustStockModal(null);
    setAdjustUnits(0);
    setAdjustNotes('');
  };

  // Handle Add New Batch
  const handleCreateNewBatch = () => {
    const activeProducts = getStoredProducts();
    const matchingProduct = activeProducts.find((p) => p._id === newBatchForm.productId) || activeProducts[0];
    const now = Date.now();
    const expTime = new Date(newBatchForm.expDate).getTime();
    const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
    let status = 'Safe';
    if (daysLeft <= 0) status = 'Expired';
    else if (daysLeft <= 90) status = 'Expiring Soon';

    const isSoap = matchingProduct.category === 'Soaps';

    const newEntry = {
      productId: matchingProduct._id,
      productTitle: matchingProduct.title,
      slug: matchingProduct.slug,
      sku: `SKU-${matchingProduct.slug.toUpperCase().slice(0, 8)}`,
      batchNumber: newBatchForm.batchNumber.trim().toUpperCase(),
      stockQuantity: parseInt(newBatchForm.stockQuantity, 10) || 100,
      reservedQuantity: 0,
      price: matchingProduct.price,
      costPrice: matchingProduct.costPrice || 85,
      mfgDate: new Date(newBatchForm.mfgDate).toISOString(),
      expDate: new Date(newBatchForm.expDate).toISOString(),
      daysRemaining: daysLeft,
      status,
      category: isSoap ? 'Soaps' : 'Lip Care',
      activeIngredients: matchingProduct.activeIngredients || [],
    };

    // Sync new lot: saves custom lot AND attaches batch to parent product with increased totalStock
    syncNewBatchLot(newEntry);

    setWatchlist((prev) => [newEntry, ...prev]);
    showToast(`New lot ${newEntry.batchNumber} registered and synced into total product stock.`);
    setNewBatchModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Batch Number',
      'Product Title',
      'Category',
      'SKU',
      'Stock Units',
      'Reserved Units',
      'MFG Date',
      'EXP Date',
      'Days Remaining',
      'Status',
      'Retail Value (INR)',
    ];

    const rows = filteredRows.map((r) => [
      `"${r.batchNumber}"`,
      `"${r.productTitle}"`,
      `"${r.category}"`,
      `"${r.sku}"`,
      r.stockQuantity,
      r.reservedQuantity,
      `"${new Date(r.mfgDate).toISOString().split('T')[0]}"`,
      `"${new Date(r.expDate).toISOString().split('T')[0]}"`,
      r.daysRemaining,
      `"${r.status}"`,
      r.stockQuantity * r.price,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Love_and_Co_FEFO_Watchlist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('FEFO Watchlist manifest exported to CSV.');
  };

  // KPI Calculations
  const isWrittenOffBatch = (i) => i.status === 'Written Off' || i.isWrittenOff;
  const activeBatches = watchlist.filter((i) => !isWrittenOffBatch(i));
  const writtenOffBatches = watchlist.filter((i) => isWrittenOffBatch(i));

  const totalBatches = activeBatches.length;
  const writtenOffCount = writtenOffBatches.length;
  const totalUnits = activeBatches.reduce((acc, i) => acc + (i.stockQuantity || 0), 0);
  const totalRetailValue = activeBatches.reduce((acc, i) => acc + (i.stockQuantity || 0) * (i.price || 299), 0);
  const expiringSoonCount = activeBatches.filter((i) => i.status === 'Expiring Soon').length;
  const expiredCount = activeBatches.filter((i) => i.status === 'Expired' || i.daysRemaining <= 0).length;

  return (
    <>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1614] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E3EE]">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-700" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1614] tracking-tight">
              FEFO Batch List
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time shelf lot maturation radar, earliest-expiry dispatch prioritization, and single-click stock audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition"
            title="Download complete FEFO manifest as CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Manifest</span>
          </button>

          {/* New Batch Lot Modal Trigger */}
          <button
            onClick={() => setNewBatchModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1C1614] hover:bg-[#342721] text-xs font-semibold text-white shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Batch Lot</span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadWatchlist}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition"
            title="Rescan database batches"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Interactive KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Monitored Batches */}
        <div
          onClick={() => {
            setStatusFilter('ALL');
            setCategoryFilter('All Categories');
          }}
          className={`cursor-pointer transition-all border rounded-xl p-4 shadow-2xs hover:shadow-sm ${
            statusFilter === 'ALL' && categoryFilter === 'All Categories'
              ? 'bg-[#FAF9F8] border-[#1C1614] ring-1 ring-[#1C1614]'
              : 'bg-white border-[#E8E3EE]'
          }`}
        >
          <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
            <span>Monitored Batches</span>
            <Layers className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-xl font-serif font-bold text-[#1C1614] mt-1.5">{totalBatches} Lots</div>
          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
            {writtenOffCount > 0 ? `${writtenOffCount} written off • Click to view all` : 'Click to view all active lots'}
          </div>
        </div>

        {/* Total Shelf Units */}
        <div className="bg-white border border-[#E8E3EE] rounded-xl p-4 shadow-2xs">
          <div className="text-gray-500 text-xs font-medium flex items-center justify-between">
            <span>Available Inventory</span>
            <Package className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-serif font-bold text-[#1C1614] mt-1.5">
            {totalUnits.toLocaleString()} units
          </div>
          <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-medium">
            ₹{totalRetailValue.toLocaleString()} active retail value
          </div>
        </div>

        {/* Expiring Soon (<90 Days) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON')}
          className={`cursor-pointer transition-all border rounded-xl p-4 shadow-2xs hover:shadow-sm ${
            statusFilter === 'EXPIRING_SOON'
              ? 'bg-amber-100/80 border-amber-500 ring-1 ring-amber-500'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="text-amber-900 text-xs font-medium flex items-center justify-between">
            <span>Expiring &lt; 90 Days</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-xl font-serif font-bold text-amber-900 mt-1.5">{expiringSoonCount} Lots</div>
          <div className="text-[10px] text-amber-800 font-mono mt-0.5 font-semibold">
            FEFO dispatch priority queue
          </div>
        </div>

        {/* Expired / Quarantine */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
          className={`cursor-pointer transition-all border rounded-xl p-4 shadow-2xs hover:shadow-sm ${
            statusFilter === 'EXPIRED'
              ? 'bg-rose-100/80 border-rose-500 ring-1 ring-rose-500'
              : expiredCount > 0
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-gray-50/80 border-gray-200'
          }`}
        >
          <div className={`${expiredCount > 0 ? 'text-rose-900' : 'text-gray-700'} text-xs font-medium flex items-center justify-between`}>
            <span>Expired / Quarantine</span>
            <AlertCircle className={`w-3.5 h-3.5 ${expiredCount > 0 ? 'text-rose-700' : 'text-gray-400'}`} />
          </div>
          <div className={`text-xl font-serif font-bold mt-1.5 ${expiredCount > 0 ? 'text-rose-900' : 'text-gray-800'}`}>
            {expiredCount} Lots
          </div>
          <div className={`text-[10px] font-mono mt-0.5 font-semibold ${expiredCount > 0 ? 'text-rose-800' : 'text-emerald-700'}`}>
            {expiredCount > 0
              ? 'Requires immediate write-off'
              : writtenOffCount > 0
              ? `${writtenOffCount} written off (quarantined)`
              : 'Zero expired stock'}
          </div>
        </div>
      </div>

      {/* Control Bar: Search + Category + Expiry Status + Sort */}
      <div className="bg-white border border-[#E8E3EE] rounded-xl p-3 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lot code, formulation, or SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-[#1C1614] text-white shadow-2xs font-semibold'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Expiry Segment */}
          <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-2xs font-semibold' : 'text-gray-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRING_SOON')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'EXPIRING_SOON'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs font-semibold'
                  : 'text-gray-500'
              }`}
            >
              &lt; 90d
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'EXPIRED' ? 'bg-red-100 text-red-900 shadow-2xs font-semibold' : 'text-gray-500'
              }`}
            >
              Expired
            </button>
            <button
              onClick={() => setStatusFilter('SAFE')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                statusFilter === 'SAFE' ? 'bg-emerald-100 text-emerald-900 shadow-2xs font-semibold' : 'text-gray-500'
              }`}
            >
              Safe (&gt;90d)
            </button>
            {writtenOffCount > 0 && (
              <button
                onClick={() => setStatusFilter(statusFilter === 'WRITTEN_OFF' ? 'ALL' : 'WRITTEN_OFF')}
                className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                  statusFilter === 'WRITTEN_OFF'
                    ? 'bg-gray-800 text-white shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Written Off ({writtenOffCount})
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 bg-[#FAF9F8] border border-gray-200 rounded-lg text-xs font-mono text-gray-700 focus:outline-none focus:border-[#1C1614]"
            >
              <option value="FEFO">FEFO: Earliest Expiry</option>
              <option value="STOCK_DESC">Units: High to Low</option>
              <option value="STOCK_ASC">Units: Low to High</option>
              <option value="NAME">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified FEFO Batch Table */}
      <div className="bg-white border border-[#E8E3EE] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F8] border-b border-[#E8E3EE] text-gray-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-3">Batch Lot Code</th>
                <th className="py-3 px-3">Available Units</th>
                <th className="py-3 px-3">MFG & Expiry Dates</th>
                <th className="py-3 px-3">Shelf-Life Countdown</th>
                <th className="py-3 px-3">FEFO Dispatch Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3EE]">
              {filteredRows.map((row, idx) => {
                const isExpired = row.daysRemaining <= 0;
                const isExpiringSoon = row.daysRemaining > 0 && row.daysRemaining <= 90;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-50/70 transition-colors ${
                      row.status === 'Written Off' || row.isWrittenOff
                        ? 'bg-gray-50/90 opacity-70 border-l-4 border-l-gray-400'
                        : isExpired
                        ? 'bg-rose-50/20'
                        : isExpiringSoon
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* Product Name & SKU */}
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="font-semibold text-gray-900">{row.productTitle}</div>
                      <div className="text-[10px] font-mono text-gray-500 flex items-center space-x-1.5 mt-0.5">
                        <span className="font-semibold text-gray-700">{row.sku}</span>
                        <span>•</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                            row.category === 'Soaps' ? 'bg-[#E8E3EE] text-[#4A3B32]' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.category}
                        </span>
                      </div>
                    </td>

                    {/* Batch Number */}
                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                        <span>{row.batchNumber}</span>
                        {idx === 0 && !isExpired && (
                          <span
                            title="Earliest expiring active batch: priority for next fulfillment"
                            className="text-[9px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded"
                          >
                            #1 Next Dispatch
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-sans mt-0.5">
                        Category: <span className="font-semibold text-gray-800">{row.category}</span>
                      </div>
                    </td>

                    {/* Units Left */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-gray-900">
                        {row.stockQuantity} units
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {row.reservedQuantity > 0 ? `${row.reservedQuantity} reserved` : '100% unreserved'}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-3 font-mono text-gray-600">
                      <div>
                        EXP:{' '}
                        <strong className="text-gray-900">
                          {new Date(row.expDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        MFG:{' '}
                        {new Date(row.mfgDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Days Remaining Countdown */}
                    <td className="py-3 px-3">
                      {row.status === 'Written Off' || row.isWrittenOff ? (
                        <div className="font-mono text-xs text-gray-400 font-medium italic">
                          Written Off (0 units)
                        </div>
                      ) : (
                        <>
                          <div
                            className={`font-mono font-bold text-xs ${
                              isExpired
                                ? 'text-red-700'
                                : isExpiringSoon
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {row.daysRemaining > 0 ? `${row.daysRemaining} days left` : '0 days (Expired)'}
                          </div>
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(5, (row.daysRemaining / 365) * 100))}%`,
                              }}
                              className={`h-full ${
                                isExpired ? 'bg-red-600' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </>
                      )}
                    </td>

                    {/* Status Tag */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          row.status === 'Written Off'
                            ? 'bg-gray-100 text-gray-600'
                            : isExpired
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isExpiringSoon
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Inspect Drawer Trigger */}
                        <button
                          onClick={() => setInspectBatch(row)}
                          className="px-2 py-1 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          title="View formulation details and batch audit history"
                        >
                          Inspect
                        </button>

                        {/* Adjust Stock */}
                        <button
                          onClick={() => {
                            setAdjustStockModal(row);
                            setAdjustUnits(row.stockQuantity);
                            setAdjustMfgDate(row.mfgDate ? new Date(row.mfgDate).toISOString().split('T')[0] : '');
                            setAdjustExpDate(row.expDate ? new Date(row.expDate).toISOString().split('T')[0] : '');
                            setAdjustReason('Inventory Restock (Ready to Ship)');
                            setAdjustNotes('');
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-[#1C1614] bg-[#FAF9F8] border border-[#E8E3EE] hover:bg-gray-100 rounded-lg transition"
                          title="Quickly adjust batch units and dates"
                        >
                          Adjust
                        </button>

                        {/* Write Off / Undo Write-Off */}
                        {(row.status === 'Written Off' || row.isWrittenOff) ? (
                          <button
                            onClick={() => handleUndoWriteOff(row)}
                            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-2xs transition"
                            title="Undo write-off and restore batch units"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-700" />
                            <span>Undo Write-Off</span>
                          </button>
                        ) : (
                          row.stockQuantity > 0 && (
                            <button
                              onClick={() => setWriteOffModal(row)}
                              className="px-2 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                              title="Quarantine and write off damaged/expired stock"
                            >
                              Write Off
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-xs">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <div>No batch records match the selected search or filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer (Inspect Batch) */}
      {inspectBatch && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
          onClick={() => setInspectBatch(null)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#E8E3EE] flex items-center justify-between bg-[#FAF9F8]">
              <div>
                <div className="text-xs font-mono uppercase text-gray-500 font-semibold tracking-wider">
                  Batch Quality & Maturation Sheet
                </div>
                <div className="font-mono font-bold text-base text-gray-900 mt-0.5">
                  {inspectBatch.batchNumber}
                </div>
              </div>
              <button
                onClick={() => setInspectBatch(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Product Info */}
              <div className="bg-[#FAF9F8] p-4 rounded-xl border border-[#E8E3EE] space-y-2">
                <div className="font-semibold text-gray-900 text-sm">{inspectBatch.productTitle}</div>
                <div className="text-[11px] text-gray-500 font-mono">
                  SKU: {inspectBatch.sku} • Category: {inspectBatch.category}
                </div>
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-semibold text-gray-800">{inspectBatch.category}</span>
                </div>
              </div>

              {/* Shelf-Life Countdown Card */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  inspectBatch.daysRemaining <= 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : inspectBatch.daysRemaining <= 90
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>Shelf-Life Status</span>
                  <span className="font-mono text-sm">
                    {inspectBatch.daysRemaining > 0 ? `${inspectBatch.daysRemaining} Days` : 'Expired'}
                  </span>
                </div>
                <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(5, (inspectBatch.daysRemaining / 365) * 100))}%`,
                    }}
                    className={`h-full ${
                      inspectBatch.daysRemaining <= 0
                        ? 'bg-rose-600'
                        : inspectBatch.daysRemaining <= 90
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono pt-1">
                  <span>MFG: {new Date(inspectBatch.mfgDate).toLocaleDateString()}</span>
                  <span>EXP: {new Date(inspectBatch.expDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Units & Financial Valuation */}
              <div className="space-y-2">
                <div className="font-semibold text-gray-800 text-xs">Inventory Economics</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-gray-500 text-[10px]">Stock Count</div>
                    <div className="font-mono font-bold text-gray-900 text-sm mt-0.5">
                      {inspectBatch.stockQuantity} units
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-gray-500 text-[10px]">Reserved Units</div>
                    <div className="font-mono font-bold text-gray-900 text-sm mt-0.5">
                      {inspectBatch.reservedQuantity} units
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-gray-500 text-[10px]">Retail Valuation</div>
                    <div className="font-mono font-bold text-gray-900 text-sm mt-0.5">
                      ₹{(inspectBatch.stockQuantity * inspectBatch.price).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-gray-500 text-[10px]">Cost Value</div>
                    <div className="font-mono font-bold text-gray-900 text-sm mt-0.5">
                      ₹{(inspectBatch.stockQuantity * inspectBatch.costPrice).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Botanical Ingredients */}
              {inspectBatch.activeIngredients && inspectBatch.activeIngredients.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold text-gray-800 text-xs">Botanical Formulation Actives</div>
                  <div className="space-y-1.5">
                    {inspectBatch.activeIngredients.map((ing, i) => (
                      <div key={i} className="p-2.5 bg-[#FAF9F8] rounded-lg border border-[#E8E3EE]">
                        <div className="font-medium text-gray-900 flex justify-between">
                          <span>{ing.name}</span>
                          <span className="font-mono text-gray-500 text-[10px]">{ing.percentage}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{ing.function}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drawer Actions */}
              <div className="pt-3 border-t border-gray-200 flex space-x-2">
                <button
                  onClick={() => {
                    setAdjustStockModal(inspectBatch);
                    setAdjustUnits(inspectBatch.stockQuantity);
                    setAdjustMfgDate(inspectBatch.mfgDate ? new Date(inspectBatch.mfgDate).toISOString().split('T')[0] : '');
                    setAdjustExpDate(inspectBatch.expDate ? new Date(inspectBatch.expDate).toISOString().split('T')[0] : '');
                    setAdjustReason('Inventory Restock (Ready to Ship)');
                    setAdjustNotes('');
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-xs transition"
                >
                  Adjust Stock Count
                </button>
                {(inspectBatch.status === 'Written Off' || inspectBatch.isWrittenOff) ? (
                  <button
                    onClick={() => handleUndoWriteOff(inspectBatch)}
                    className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Undo Write-Off</span>
                  </button>
                ) : (
                  inspectBatch.stockQuantity > 0 && (
                    <button
                      onClick={() => setWriteOffModal(inspectBatch)}
                      className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium text-xs transition"
                    >
                      Write Off Batch
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustStockModal && (() => {
        const currentQty = adjustStockModal.stockQuantity;

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-gray-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#1C1614]" />
                  <h3 className="text-sm font-semibold text-gray-900">Adjust Shelf Inventory</h3>
                </div>
                <button
                  onClick={() => setAdjustStockModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Batch Info Header */}
              <div className="bg-[#FAF9F8] p-3 rounded-xl border border-[#E8E3EE] flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-gray-500 font-mono">Lot Code</div>
                  <div className="font-mono font-bold text-gray-900">{adjustStockModal.batchNumber}</div>
                  <div className="text-[10px] text-gray-500 truncate max-w-[220px]">{adjustStockModal.productTitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 font-mono">Current Stock</div>
                  <div className="font-mono font-bold text-gray-900 text-sm">{currentQty} units</div>
                  <span className="text-[9px] font-semibold bg-gray-200/80 text-gray-700 px-1.5 py-0.5 rounded">
                    {adjustStockModal.category}
                  </span>
                </div>
              </div>

              {/* Unit Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                    Unit
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Current on Shelf: <strong className="text-gray-700">{currentQty} units</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={adjustUnits}
                  onChange={(e) => setAdjustUnits(e.target.value)}
                  placeholder="Enter unit count"
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-gray-300 focus:outline-none focus:border-[#1C1614] focus:ring-1 focus:ring-[#1C1614]"
                />
              </div>

              {/* Manufacture Date & Expiry Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                    Manufacture Date
                  </label>
                  <input
                    type="date"
                    value={adjustMfgDate}
                    onChange={(e) => setAdjustMfgDate(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={adjustExpDate}
                    onChange={(e) => setAdjustExpDate(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                  />
                </div>
              </div>

              {/* Adjustment Reason Dropdown */}
              <div>
                <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                  Adjustment Reason & Audit Category
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:border-[#1C1614]"
                >
                  <optgroup label="📦 Restocks & Inbound Additions (+)">
                    <option value="Fresh Handcrafted Batch Production">Fresh Handcrafted Batch Production</option>
                    <option value="Inventory Restock (Ready to Ship)">Inventory Restock (Ready to Ship)</option>
                    <option value="Found Stock / Warehouse Recount Surplus">Found Stock / Warehouse Recount Surplus</option>
                    <option value="Returned Order Inspected & Restocked">Returned Order Inspected & Restocked</option>
                    <option value="Cancelled Order Stock Restored">Cancelled Order Stock Restored</option>
                  </optgroup>
                  <optgroup label="🔬 Quality Control & Lab Deductions (-)">
                    <option value="Quality Inspection Assay QC">Quality Inspection Assay QC</option>
                    <option value="Quality Control / Lab Retention Sample">Quality Control / Lab Retention Sample</option>
                    <option value="Microbial & Stability Assay Testing">Microbial & Stability Assay Testing</option>
                    <option value="Damaged or Dented Packaging Quarantine">Damaged or Dented Packaging Quarantine</option>
                    <option value="Texture / Scent / Viscosity Failure (Scrap)">Texture / Scent / Viscosity Failure (Scrap)</option>
                    <option value="Broken Seal / Leaking Unit Removed">Broken Seal / Leaking Unit Removed</option>
                  </optgroup>
                  <optgroup label="⏳ Expiry & Shelf-Life (-)">
                    <option value="Expired / Shelf-Life Depleted">Expired / Shelf-Life Depleted</option>
                    <option value="Near-Expiry Product Liquidation / Donation">Near-Expiry Product Liquidation / Donation</option>
                  </optgroup>
                  <optgroup label="🎁 Marketing, PR & Samples (-)">
                    <option value="Influencer / PR Gifting & Press Sample">Influencer / PR Gifting & Press Sample</option>
                    <option value="Customer Trial / Gift with Purchase (GWP)">Customer Trial / Gift with Purchase (GWP)</option>
                    <option value="Customer Compensation / Replacement Dispatch">Customer Compensation / Replacement Dispatch</option>
                    <option value="Retail Exhibition / Pop-up Store Transfer">Retail Exhibition / Pop-up Store Transfer</option>
                  </optgroup>
                  <optgroup label="📋 Physical Audit & Loss Discrepancies (- / +)">
                    <option value="Physical Shelf Count Audit">Physical Shelf Count Audit</option>
                    <option value="Physical Audit Reconciliation Deficit">Physical Audit Reconciliation Deficit</option>
                    <option value="Lost / Misplaced in Warehouse">Lost / Misplaced in Warehouse</option>
                    <option value="Theft or Transit Discrepancy">Theft or Transit Discrepancy</option>
                    <option value="Other / Custom Operational Reason">Other / Custom Operational Reason</option>
                  </optgroup>
                </select>
              </div>

              {/* Optional Internal Note */}
              <div>
                <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                  Internal Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Verified by Lab Lead Priya, updated expiry dates"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAdjustStockModal(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveStockAdjustment}
                  className="px-4 py-1.5 text-xs bg-[#1C1614] text-white rounded-lg hover:bg-[#342721] font-semibold transition"
                >
                  Save Adjustment
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Batch Lot Modal */}
      {newBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-[#1C1614]" />
                <h3 className="text-sm font-semibold text-gray-900">Register New Formulation Batch</h3>
              </div>
              <button
                onClick={() => setNewBatchModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                  Formulation Product
                </label>
                <select
                  value={newBatchForm.productId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const suffix = pid.replace('prod_', '').slice(0, 3).toUpperCase();
                    setNewBatchForm({
                      ...newBatchForm,
                      productId: pid,
                      batchNumber: `LOT-CP-2026-${suffix}${Math.floor(10 + Math.random() * 90)}`,
                    });
                  }}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                >
                  {getActiveProducts().map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                  Batch Lot Code
                </label>
                <input
                  type="text"
                  value={newBatchForm.batchNumber}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, batchNumber: e.target.value })}
                  placeholder="e.g. LOT-CP-2026-BLM04"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                    MFG Date
                  </label>
                  <input
                    type="date"
                    value={newBatchForm.mfgDate}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, mfgDate: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                    EXP Date
                  </label>
                  <input
                    type="date"
                    value={newBatchForm.expDate}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, expDate: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                    Cured Units Count
                  </label>
                  <input
                    type="number"
                    value={newBatchForm.stockQuantity}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, stockQuantity: e.target.value })}
                    placeholder="250"
                    className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-600 uppercase font-semibold">
                    Category
                  </label>
                  <div className="w-full mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-gray-50 text-gray-800 flex items-center justify-between">
                    <span>{getActiveProducts().find((p) => p._id === newBatchForm.productId)?.category || 'Soaps'}</span>
                    <span className="text-[10px] text-gray-400 font-normal">Auto-assigned</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setNewBatchModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewBatch}
                className="px-4 py-1.5 text-xs bg-[#1C1614] text-white rounded-lg hover:bg-[#342721] font-semibold"
              >
                Register Batch Lot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write-Off Confirmation Dialog */}
      {writeOffModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-gray-900">Quarantine & Write Off Stock</h3>
            </div>
            <div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Are you sure you want to write off{' '}
                <strong className="font-bold text-gray-900">{writeOffModal.stockQuantity} units</strong> of lot{' '}
                <strong className="font-mono text-gray-900">{writeOffModal.batchNumber}</strong> (
                {writeOffModal.productTitle})?
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5">
                This will zero out shelf inventory and flag this batch as quarantined in the audit log.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setWriteOffModal(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWriteOff}
                className="px-4 py-1.5 text-xs bg-rose-700 text-white rounded-lg hover:bg-rose-800 font-semibold"
              >
                Confirm Write-Off
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
