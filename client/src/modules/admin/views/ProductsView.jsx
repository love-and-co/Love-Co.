import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Search,
  Plus,
  Filter,
  FlaskConical,
  Package,
  Edit2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Layers,
  ChevronDown,
  X,
  Trash2,
  RefreshCw,
  Eye,
  ShieldCheck,
  Percent,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../../lib/api';
import { INITIAL_PRODUCTS } from '../data/mockSeed';
import {
  PRODUCTS_STORAGE_KEY,
  getStoredProducts,
  saveStoredProducts,
  syncProductStockToBatches,
  getStoredOverrides,
  saveStoredOverrides,
} from '../utils/stockSync';

const ALL_CATEGORIES = [
  'All Categories',
  'Lip Care',
  'Soaps'
];

const ROUTINE_STEPS = ['Cleanse', 'Treat', 'Moisturize', 'Sunscreen'];
const USAGE_TIMES = ['AM', 'PM', 'Both'];
const SKIN_TYPES_LIST = ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'];
const GST_RATES = [0, 5, 12, 18];

export { PRODUCTS_STORAGE_KEY };

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK

  // Load persistent products & listen for real-time inventory/stock sync events
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminProducts({ limit: 100 });
      if (res.data?.products && res.data.products.length > 0) {
        const dbProducts = res.data.products.map((p) => {
          const totalStock = p.stockQty !== undefined ? p.stockQty : (p.stock !== undefined ? p.stock : (p.totalStock || 0));
          return {
            ...p,
            _id: p._id || p.id,
            id: p._id || p.id,
            title: p.title || p.name,
            totalStock,
            stockQty: totalStock,
            stock: totalStock,
          };
        });
        saveStoredProducts(dbProducts);
        setProducts(dbProducts);
        return;
      }
    } catch (err) {
      console.warn('API error, falling back to local dataset:', err);
    } finally {
      setLoading(false);
    }
    setProducts(getStoredProducts());
  };

  useEffect(() => {
    loadProducts();

    const refreshFromStorage = () => {
      setProducts(getStoredProducts());
    };

    window.addEventListener('love_co_products_updated', refreshFromStorage);
    window.addEventListener('love_co_inventory_updated', refreshFromStorage);
    return () => {
      window.removeEventListener('love_co_products_updated', refreshFromStorage);
      window.removeEventListener('love_co_inventory_updated', refreshFromStorage);
    };
  }, []);

  const saveProductsList = (updated) => {
    saveStoredProducts(updated);
    setProducts(updated);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'science' | 'batches'
  const [editingProduct, setEditingProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Quick edit stock modal
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [quickStockVal, setQuickStockVal] = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Form State for Create / Edit
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'Soaps',
    collections: [],
    price: 499,
    discountPrice: 449,
    costPrice: 110,
    gstRate: 18,
    lowStockThreshold: 10,
    isActive: true,
    // Science
    activeIngredients: [{ name: '', percentage: '', function: '' }],
    skinConcerns: ['Acne'],
    skinTypes: ['Oily', 'Sensitive'],
    routineStep: 'Treat',
    usageTime: 'Both',
    contraindications: [],
    phLevel: '5.5 - 6.0',
    // Batches
    batches: [],
  });

  // Batch builder inside modal
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stockQuantity: 100,
  });

  // Temporary contraindication input
  const [contraInput, setContraInput] = useState('');

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const titleMatch = (p.title || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (p.slug || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let categoryMatch = selectedCategory === 'All Categories';
      if (!categoryMatch) {
        const cat = (p.category || '').toLowerCase();
        if (selectedCategory === 'Lip Care') {
          categoryMatch = cat.includes('lip') || cat.includes('balm');
        } else if (selectedCategory === 'Soaps') {
          categoryMatch = cat.includes('soap') || cat.includes('bar');
        } else {
          categoryMatch = p.category === selectedCategory;
        }
      }

      const totalStock = p.totalStock !== undefined ? p.totalStock : (p.stockQty || 0);
      let stockMatch = true;
      if (stockFilter === 'LOW_STOCK') {
        stockMatch = totalStock > 0 && totalStock <= (p.lowStockThreshold || 15);
      } else if (stockFilter === 'OUT_OF_STOCK') {
        stockMatch = totalStock === 0;
      } else if (stockFilter === 'IN_STOCK') {
        stockMatch = totalStock > (p.lowStockThreshold || 15);
      }

      return titleMatch && categoryMatch && stockMatch;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      category: 'Soaps',
      collections: ['Formulations'],
      price: 599,
      discountPrice: 549,
      costPrice: 120,
      gstRate: 18,
      lowStockThreshold: 15,
      isActive: true,
      activeIngredients: [{ name: '', percentage: '', function: '' }],
      skinConcerns: ['Barrier Repair'],
      skinTypes: ['Combination', 'Sensitive'],
      routineStep: 'Treat',
      usageTime: 'Both',
      contraindications: [],
      phLevel: '5.5 - 6.0',
      batches: [
        {
          batchNumber: `BT-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date().toISOString(),
          expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          stockQuantity: 150,
          reservedQuantity: 0,
        },
      ],
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setForm({
      title: p.title || '',
      slug: p.slug || '',
      description: p.description || '',
      category: p.category || 'Serums',
      collections: p.collections || [],
      price: p.price || 499,
      discountPrice: p.discountPrice || p.price || 449,
      costPrice: p.costPrice || 100,
      gstRate: p.gstRate !== undefined ? p.gstRate : 18,
      lowStockThreshold: p.lowStockThreshold || 10,
      isActive: p.isActive !== undefined ? p.isActive : true,
      activeIngredients: p.activeIngredients?.length ? [...p.activeIngredients] : [{ name: '', percentage: '', function: '' }],
      skinConcerns: p.skinConcerns || [],
      skinTypes: p.skinTypes || [],
      routineStep: p.routineStep || 'Treat',
      usageTime: p.usageTime || 'Both',
      contraindications: p.contraindications || [],
      phLevel: p.phLevel || '5.5',
      batches: p.batches ? [...p.batches] : [],
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  // Open edit modal if arrived from Customer View with ?edit=[id/slug]
  useEffect(() => {
    if (!router.isReady) return;
    const { edit } = router.query;
    if (edit && products.length > 0) {
      const match = products.find(
        (p) => p._id === edit || p.slug === edit || p.id === edit || (p.title && p.title.toLowerCase().includes(String(edit).toLowerCase()))
      );
      if (match) {
        openEditModal(match);
      }
    }
  }, [router.isReady, router.query, products]);

  const handleDuplicate = (p) => {
    const duplicated = {
      ...p,
      _id: `prod_${Date.now().toString().slice(-5)}`,
      title: `${p.title} (Copy)`,
      slug: `${p.slug}-copy-${Date.now().toString().slice(-3)}`,
      batches: [
        {
          batchNumber: `BT-DUP-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date().toISOString(),
          expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          stockQuantity: 50,
          reservedQuantity: 0,
        },
      ],
      totalStock: 50,
      stockQty: 50,
    };
    const updated = [duplicated, ...products];
    saveProductsList(updated);
    showToast(`Formulation duplicated: ${duplicated.title}`);
  };

  const handleToggleStatus = (id) => {
    const updated = products.map((p) => {
      if (p._id === id) {
        const nextState = !p.isActive;
        showToast(`Formulation ${p.title} is now ${nextState ? 'Active (Live)' : 'Draft'}`);
        return { ...p, isActive: nextState };
      }
      return p;
    });
    saveProductsList(updated);
  };

  const handleDeleteProduct = (p) => {
    if (!window.confirm(`Are you sure you want to delete formulation "${p.title}"? This change will persist permanently.`)) return;
    const updated = products.filter((item) => item._id !== p._id);
    saveProductsList(updated);
    showToast(`Formulation "${p.title}" removed permanently.`);
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset all formulations to default factory catalog? Any custom formulations will be reverted.')) return;
    saveProductsList(INITIAL_PRODUCTS);
    showToast('Reset catalog back to initial Love & Co. formulations.');
  };

  const handleSaveProduct = async () => {
    if (!form.title.trim()) {
      alert('Product title is required');
      return;
    }

    const calculatedStock = (form.batches || []).reduce((acc, b) => {
      if (b.isWrittenOff) return acc;
      return acc + (Number(b.stockQuantity) || 0);
    }, 0);

    // Sync batches into FEFO overrides so /admin/inventory matches immediately
    const currentOverrides = getStoredOverrides();
    (form.batches || []).forEach((b) => {
      currentOverrides[b.batchNumber] = {
        ...(currentOverrides[b.batchNumber] || {}),
        stockQuantity: Number(b.stockQuantity) || 0,
        mfgDate: b.mfgDate,
        expDate: b.expDate,
        isWrittenOff: Boolean(b.isWrittenOff),
        status: b.isWrittenOff ? 'Written Off' : (currentOverrides[b.batchNumber]?.status || 'Safe'),
        updatedAt: Date.now(),
      };
    });
    saveStoredOverrides(currentOverrides);

    try {
      setLoading(true);
      if (editingProduct) {
        // Persist update to MongoDB
        const id = editingProduct._id || editingProduct.id || editingProduct.slug;
        await api.updateProduct(id, {
          ...form,
          title: form.title,
          name: form.title,
          price: Number(form.price) || 0,
          discountPrice: Number(form.discountPrice) || 0,
          costPrice: Number(form.costPrice) || 0,
          totalStock: calculatedStock,
          stockQty: calculatedStock,
          stock: calculatedStock,
        });
        showToast(`Updated "${form.title}" successfully in database.`);
      } else {
        // Persist create to MongoDB
        await api.createProduct({
          ...form,
          name: form.title,
          title: form.title,
          price: Number(form.price) || 0,
          discountPrice: Number(form.discountPrice) || 0,
          costPrice: Number(form.costPrice) || 0,
          slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          totalStock: calculatedStock,
          stockQty: calculatedStock,
          stock: calculatedStock,
        });
        showToast(`Created formulation "${form.title}" successfully in database.`);
      }
      setIsModalOpen(false);
      await loadProducts();
    } catch (err) {
      console.warn('API error saving product, saving locally:', err);
      if (editingProduct) {
        const updated = products.map((p) =>
          p._id === editingProduct._id
            ? {
                ...p,
                ...form,
                price: Number(form.price) || 0,
                discountPrice: Number(form.discountPrice) || 0,
                costPrice: Number(form.costPrice) || 0,
                totalStock: calculatedStock,
                stockQty: calculatedStock,
                stock: calculatedStock,
              }
            : p
        );
        saveProductsList(updated);
        showToast(`Updated "${form.title}" successfully.`);
      } else {
        const newProd = {
          _id: `prod_${Date.now().toString().slice(-5)}`,
          ...form,
          price: Number(form.price) || 0,
          discountPrice: Number(form.discountPrice) || 0,
          costPrice: Number(form.costPrice) || 0,
          slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          totalStock: calculatedStock,
          stockQty: calculatedStock,
          stock: calculatedStock,
        };
        const updated = [newProd, ...products];
        saveProductsList(updated);
        showToast(`Created formulation "${newProd.title}".`);
      }
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Add / Remove Ingredients
  const handleAddIngredient = () => {
    setForm({
      ...form,
      activeIngredients: [...form.activeIngredients, { name: '', percentage: '', function: '' }],
    });
  };

  const handleIngredientChange = (index, field, val) => {
    const updated = [...form.activeIngredients];
    updated[index] = { ...updated[index], [field]: val };
    setForm({ ...form, activeIngredients: updated });
  };

  const handleRemoveIngredient = (index) => {
    const updated = form.activeIngredients.filter((_, i) => i !== index);
    setForm({ ...form, activeIngredients: updated });
  };

  // Add Batch
  const handleAddNewBatch = () => {
    if (!newBatch.batchNumber.trim()) {
      alert('Batch number is required');
      return;
    }
    const batchToAdd = {
      batchNumber: newBatch.batchNumber.trim(),
      mfgDate: new Date(newBatch.mfgDate).toISOString(),
      expDate: new Date(newBatch.expDate).toISOString(),
      stockQuantity: Number(newBatch.stockQuantity) || 0,
      reservedQuantity: 0,
    };
    setForm({
      ...form,
      batches: [...form.batches, batchToAdd],
    });
    setNewBatch({
      batchNumber: '',
      mfgDate: new Date().toISOString().split('T')[0],
      expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      stockQuantity: 100,
    });
  };

  // Add Contraindication
  const handleAddContra = () => {
    if (contraInput.trim() && !form.contraindications.includes(contraInput.trim())) {
      setForm({
        ...form,
        contraindications: [...form.contraindications, contraInput.trim()],
      });
      setContraInput('');
    }
  };

  const handleRemoveContra = (item) => {
    setForm({
      ...form,
      contraindications: form.contraindications.filter((c) => c !== item),
    });
  };

  // Quick edit stock submit with direct API persistence
  const handleSaveQuickStock = async () => {
    if (!quickStockProduct) return;
    const qty = Math.max(0, Number(quickStockVal) || 0);
    const pId = quickStockProduct._id || quickStockProduct.id || quickStockProduct.slug;

    try {
      setLoading(true);
      // Persist stock adjustment directly to MongoDB
      await api.updateProductStock(pId, qty);
      syncProductStockToBatches({ productId: pId, newTotalStock: qty });
      showToast(`Stock updated & persisted for ${quickStockProduct.title} (${qty} units).`);
      await loadProducts();
    } catch (err) {
      console.warn('API error during stock update, updating locally:', err);
      syncProductStockToBatches({ productId: pId, newTotalStock: qty });
      setProducts(getStoredProducts());
      showToast(`Stock updated locally for ${quickStockProduct.title} (${qty} units).`);
    } finally {
      setLoading(false);
      setQuickStockProduct(null);
    }
  };

  return (
    <>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1614] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & New Formulation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E3EE]">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-[#4A3B32]" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1614] tracking-tight">
              Inventory
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Science-backed cosmetic metadata, active ingredients taxonomy, and FEFO inventory tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetToDefaults}
            title="Restore default products"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-600 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#1C1614] hover:bg-[#342721] text-xs font-medium text-white transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Formulation</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white border border-[#E8E3EE] rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, active or slug..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-[#1C1614] bg-[#FAF9F8] text-gray-700 font-medium"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${stockFilter === 'ALL' ? 'bg-white text-gray-900 shadow-2xs font-semibold' : 'text-gray-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('IN_STOCK')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${stockFilter === 'IN_STOCK' ? 'bg-white text-gray-900 shadow-2xs font-semibold' : 'text-gray-500'}`}
            >
              Safe
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${stockFilter === 'LOW_STOCK' ? 'bg-amber-100 text-amber-900 shadow-2xs font-semibold' : 'text-gray-500'}`}
            >
              Low
            </button>
            <button
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`flex-1 py-1 rounded-md text-[11px] transition ${stockFilter === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-900 shadow-2xs font-semibold' : 'text-gray-500'}`}
            >
              OOS
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E8E3EE] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F8] border-b border-[#E8E3EE] text-gray-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-3">Active Actives & pH</th>
                <th className="py-3 px-3">Category / Step</th>
                <th className="py-3 px-3">Pricing & GST</th>
                <th className="py-3 px-3">FEFO Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3EE]">
              {loading && products.length === 0 ? (
                Array.from({ length: 5 }).map((_, skIdx) => (
                  <tr key={`skel-${skIdx}`} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-3.5 w-40 bg-[#EAE6DF] rounded" />
                      <div className="h-2.5 w-24 bg-[#F7F5F0] rounded mt-1.5" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-28 bg-[#EAE6DF]/70 rounded" />
                      <div className="h-2.5 w-14 bg-[#F7F5F0] rounded mt-1.5" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3 w-20 bg-[#EAE6DF]/70 rounded" />
                      <div className="h-4 w-24 bg-[#E8E3EE]/60 rounded mt-1.5" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-14 bg-[#EAE6DF] rounded" />
                      <div className="h-2.5 w-20 bg-[#F7F5F0] rounded mt-1.5" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-3.5 w-16 bg-[#EAE6DF] rounded" />
                      <div className="h-2.5 w-20 bg-[#F7F5F0] rounded mt-1.5" />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="h-5 w-14 bg-[#E8E3EE]/70 rounded-full" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-6 w-20 bg-[#EAE6DF]/70 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.map((p) => {
                const stock = p.totalStock !== undefined ? p.totalStock : (p.stockQty || 0);
                const isLow = stock <= (p.lowStockThreshold || 15) && stock > 0;
                const isOos = stock === 0;
                const activeBatchCount = (p.batches || []).length;

                return (
                  <tr key={p._id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Formulation Title */}
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="font-semibold text-gray-900">{p.title}</div>
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5 truncate">
                        slug: /{p.slug}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(p.skinConcerns || []).slice(0, 2).map((c, i) => (
                          <span key={i} className="text-[9px] font-mono px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Actives & pH */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {(p.activeIngredients || []).slice(0, 2).map((act, i) => (
                          <div key={i} className="text-[11px] flex items-center space-x-1">
                            <span className="font-semibold text-[#4A3B32]">{act.percentage || ''}</span>
                            <span className="text-gray-700 truncate max-w-[120px]">{act.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 mt-1">
                        pH: {p.phLevel || '5.5'}
                      </div>
                    </td>

                    {/* Category & Step */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-800">{p.category}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-[#E8E3EE] text-[#4A3B32]">
                        {p.routineStep || 'Treat'} • {p.usageTime || 'Both'}
                      </span>
                    </td>

                    {/* Pricing */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">₹{p.price}</div>
                      {p.discountPrice && p.discountPrice < p.price && (
                        <div className="text-[10px] text-emerald-700 font-mono">
                          Sale: ₹{p.discountPrice}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-gray-400">
                        GST: {p.gstRate || 18}% (Cost: ₹{p.costPrice || 0})
                      </div>
                    </td>

                    {/* FEFO Stock */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isOos ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {stock} units
                        </span>
                        <button
                          onClick={() => {
                            setQuickStockProduct(p);
                            setQuickStockVal(stock);
                          }}
                          title="Quick edit stock"
                          className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Animated Amber Low Stock Pill Badge (Module 3) */}
                      {stock <= 10 && stock > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Low Stock</span>
                          </span>
                        </div>
                      )}
                      {stock === 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40">
                            <span>Sold Out</span>
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {activeBatchCount} batch{activeBatchCount !== 1 ? 'es' : ''} in chamber
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleToggleStatus(p._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border transition ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Draft'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Formulation & Batches"
                          className="p-1.5 text-gray-600 hover:text-[#1C1614] hover:bg-gray-100 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p)}
                          title="Duplicate Formulation"
                          className="p-1.5 text-gray-600 hover:text-[#1C1614] hover:bg-gray-100 rounded-lg transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          title="Delete Formulation"
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                    No formulation matched the search and filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Stock Dialog */}
      {quickStockProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-900">Adjust Live Inventory</h3>
              <button onClick={() => setQuickStockProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">{quickStockProduct.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Quickly override total available shelf units.</p>
            </div>
            <div>
              <label className="text-[11px] font-mono text-gray-500 uppercase">Available Units</label>
              <input
                type="number"
                min="0"
                value={quickStockVal}
                onChange={(e) => setQuickStockVal(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 font-mono focus:outline-none focus:border-[#1C1614]"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setQuickStockProduct(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuickStock}
                className="px-4 py-1.5 text-xs bg-[#1C1614] text-white rounded-lg hover:bg-[#342721]"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Tab Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3EE]">
              <div>
                <h2 className="text-sm sm:text-base font-serif font-bold text-[#1C1614]">
                  {editingProduct ? `Edit Formulation: ${editingProduct.title}` : 'New Clinical Formulation'}
                </h2>
                <p className="text-[11px] text-gray-500">Configure regulatory science, pricing, and FEFO batches.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Buttons */}
            <div className="flex border-b border-gray-200 px-6 bg-[#FAF9F8]">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-2.5 px-4 text-xs font-medium border-b-2 transition ${
                  activeTab === 'general'
                    ? 'border-[#1C1614] text-[#1C1614] font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tab 1: General & GST Pricing
              </button>
              <button
                onClick={() => setActiveTab('science')}
                className={`py-2.5 px-4 text-xs font-medium border-b-2 transition ${
                  activeTab === 'science'
                    ? 'border-[#1C1614] text-[#1C1614] font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tab 2: Skincare Science & Taxonomy
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className={`py-2.5 px-4 text-xs font-medium border-b-2 transition ${
                  activeTab === 'batches'
                    ? 'border-[#1C1614] text-[#1C1614] font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tab 3: Batch Inventory Tracker (FEFO)
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* TAB 1: General Info & Pricing */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">
                        Formulation Title *
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. LOVE & Co. BLOOM (Neem & Turmeric Soap)"
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">
                        Product Slug
                      </label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="e.g. love-and-co-bloom-neem-turmeric-soap"
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">
                      Clinical Description
                    </label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="High-strength clinical serum formulated to reduce sebum overproduction..."
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                      >
                        {ALL_CATEGORIES.filter(c => c !== 'All Categories').map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Low Stock Threshold</label>
                      <input
                        type="number"
                        min="1"
                        value={form.lowStockThreshold}
                        onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#1C1614]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Status</label>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id="isActiveCheck"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                          className="rounded text-[#1C1614] focus:ring-[#1C1614]"
                        />
                        <label htmlFor="isActiveCheck" className="text-xs text-gray-700">
                          Active in Storefront
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & GST Card */}
                  <div className="bg-[#FAF9F8] p-4 rounded-xl border border-[#E8E3EE] space-y-3">
                    <div className="text-xs font-semibold text-gray-800 flex items-center space-x-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#4A3B32]" />
                      <span>Financials & GST Rates</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Cost Price (COGS)</label>
                        <input
                          type="number"
                          value={form.costPrice}
                          onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">MRP / Price (₹)</label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Discount Price (₹)</label>
                        <input
                          type="number"
                          value={form.discountPrice}
                          onChange={(e) => setForm({ ...form, discountPrice: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">GST Rate</label>
                        <select
                          value={form.gstRate}
                          onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white"
                        >
                          {GST_RATES.map((rate) => (
                            <option key={rate} value={rate}>{rate}% GST</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 pt-1 font-mono">
                      Tax breakdown on sale (₹{form.discountPrice || form.price}): Base Price ₹
                      {Math.round(((form.discountPrice || form.price) / (1 + form.gstRate / 100)) * 100) / 100} + GST ₹
                      {Math.round(((form.discountPrice || form.price) - (form.discountPrice || form.price) / (1 + form.gstRate / 100)) * 100) / 100} ({form.gstRate}%)
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Skincare Science & Taxonomy */}
              {activeTab === 'science' && (
                <div className="space-y-4">
                  {/* Active Ingredients List Builder */}
                  <div className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-[#FAF9F8]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-800 flex items-center space-x-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
                        <span>Active Ingredients Builder</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="text-[11px] font-medium text-purple-800 hover:text-purple-950 flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Active</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {form.activeIngredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200">
                          <input
                            type="text"
                            placeholder="Ingredient Name (e.g. Neem Leaf Extract)"
                            value={ing.name}
                            onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            placeholder="Pct (e.g. 10.0%)"
                            value={ing.percentage}
                            onChange={(e) => handleIngredientChange(idx, 'percentage', e.target.value)}
                            className="w-24 px-2.5 py-1 text-xs border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            placeholder="Clinical Function (e.g. Sebum Control)"
                            value={ing.function}
                            onChange={(e) => handleIngredientChange(idx, 'function', e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs border border-gray-300 rounded"
                          />
                          {form.activeIngredients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Routine Step, Usage Time, pH */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Routine Step</label>
                      <select
                        value={form.routineStep}
                        onChange={(e) => setForm({ ...form, routineStep: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300"
                      >
                        {ROUTINE_STEPS.map((step) => (
                          <option key={step} value={step}>{step}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Usage Time</label>
                      <select
                        value={form.usageTime}
                        onChange={(e) => setForm({ ...form, usageTime: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300"
                      >
                        {USAGE_TIMES.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-gray-600 uppercase font-semibold">Formulation pH</label>
                      <input
                        type="text"
                        value={form.phLevel}
                        onChange={(e) => setForm({ ...form, phLevel: e.target.value })}
                        placeholder="e.g. 5.5 - 6.0"
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Contraindications Builder */}
                  <div className="border border-gray-200 rounded-xl p-3.5 bg-rose-50/40 space-y-2">
                    <label className="text-xs font-semibold text-rose-900 block">
                      Incompatible Actives & Contraindications
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={contraInput}
                        onChange={(e) => setContraInput(e.target.value)}
                        placeholder="e.g. Pure L-Ascorbic Acid or Retinoids"
                        className="flex-1 px-3 py-1.5 text-xs border border-rose-200 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddContra}
                        className="px-3 py-1.5 text-xs bg-rose-700 text-white rounded-lg hover:bg-rose-800"
                      >
                        Add Warning
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {form.contraindications.map((contra, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white text-rose-800 border border-rose-200 rounded-full text-[10px] font-mono flex items-center space-x-1">
                          <span>{contra}</span>
                          <button type="button" onClick={() => handleRemoveContra(contra)}>
                            <X className="w-3 h-3 text-rose-500 hover:text-rose-700" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Batch Inventory Tracker (FEFO) */}
              {activeTab === 'batches' && (
                <div className="space-y-4">
                  {/* New Batch Creator */}
                  <div className="bg-[#FAF9F8] p-3.5 rounded-xl border border-[#E8E3EE] space-y-3">
                    <div className="text-xs font-semibold text-gray-800 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Add New Manufacturing Batch</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Batch Code *</label>
                        <input
                          type="text"
                          value={newBatch.batchNumber}
                          onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                          placeholder="e.g. BT-NIA-2603"
                          className="w-full mt-1 px-2.5 py-1 text-xs border border-gray-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">MFG Date</label>
                        <input
                          type="date"
                          value={newBatch.mfgDate}
                          onChange={(e) => setNewBatch({ ...newBatch, mfgDate: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 text-xs border border-gray-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">EXP Date</label>
                        <input
                          type="date"
                          value={newBatch.expDate}
                          onChange={(e) => setNewBatch({ ...newBatch, expDate: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1 text-xs border border-gray-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Stock Units</label>
                        <input
                          type="number"
                          value={newBatch.stockQuantity}
                          onChange={(e) => setNewBatch({ ...newBatch, stockQuantity: Number(e.target.value) })}
                          className="w-full mt-1 px-2.5 py-1 text-xs border border-gray-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddNewBatch}
                        className="px-3 py-1 text-xs bg-[#1C1614] text-white rounded hover:bg-[#342721] flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Batch to Chamber</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Batches Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-[11px] font-mono uppercase text-gray-500 font-semibold border-b border-gray-200 flex justify-between">
                      <span>Active Maturing Batches ({form.batches.length})</span>
                      <span>FEFO Priority Queue</span>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      {form.batches.length > 0 ? (
                        [...form.batches]
                          .sort((a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime())
                          .map((b, idx) => {
                            const exp = new Date(b.expDate).getTime();
                            const daysLeft = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
                            const isNearExp = daysLeft > 0 && daysLeft <= 90;

                            return (
                              <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-gray-50">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-bold text-gray-900">{b.batchNumber}</span>
                                    {idx === 0 && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">
                                        FEFO #1 Next To Dispatch
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                    EXP: {new Date(b.expDate).toLocaleDateString()} ({daysLeft} days remaining)
                                  </div>
                                </div>
                                <div className="text-right flex items-center space-x-3">
                                  <div>
                                    <span className="font-mono font-bold text-gray-900 text-xs">
                                      {b.stockQuantity} units
                                    </span>
                                    <div className="text-[10px] text-gray-400">
                                      {b.reservedQuantity || 0} reserved
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setForm({
                                        ...form,
                                        batches: form.batches.filter((_, i) => i !== idx),
                                      });
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                    title="Remove Batch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-500">
                          No batches registered. Add an active batch to populate stock.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E3EE] bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  className="px-5 py-2 text-xs font-medium bg-[#1C1614] text-white rounded-lg hover:bg-[#342721] transition shadow-xs"
                >
                  {editingProduct ? 'Save Formulation Changes' : 'Publish New Formulation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

