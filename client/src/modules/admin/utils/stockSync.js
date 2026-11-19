import { INITIAL_PRODUCTS } from '../data/mockSeed';

export const PRODUCTS_STORAGE_KEY = 'love_co_admin_products_v1';
export const OVERRIDES_STORAGE_KEY = 'love_co_fefo_overrides_v2';
export const CUSTOM_LOTS_STORAGE_KEY = 'love_co_fefo_custom_lots_v2';

// 1. Get stored products with fallback to INITIAL_PRODUCTS
export const getStoredProducts = () => {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw && raw.trim() && raw !== 'undefined' && raw !== 'null') {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Initialize if empty
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  } catch (e) {
    console.warn('Error reading stored products', e);
  }
  return INITIAL_PRODUCTS;
};

// 2. Save stored products & broadcast event
export const saveStoredProducts = (products) => {
  if (typeof window === 'undefined' || !Array.isArray(products)) return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('love_co_products_updated', { detail: { products } }));
  } catch (e) {
    console.warn('Error saving stored products', e);
  }
};

// 3. Get FEFO overrides
export const getStoredOverrides = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw && raw.trim() && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

// 4. Save FEFO overrides & broadcast event
export const saveStoredOverrides = (overrides) => {
  if (typeof window === 'undefined' || !overrides) return;
  try {
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent('love_co_inventory_updated', { detail: { overrides } }));
  } catch (e) {
    console.warn('Error saving stored overrides', e);
  }
};

// 5. Get Custom Lots
export const getStoredCustomLots = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_LOTS_STORAGE_KEY);
    return raw && raw.trim() && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// 6. Save Custom Lots
export const saveStoredCustomLots = (lots) => {
  if (typeof window === 'undefined' || !Array.isArray(lots)) return;
  try {
    localStorage.setItem(CUSTOM_LOTS_STORAGE_KEY, JSON.stringify(lots));
    window.dispatchEvent(new CustomEvent('love_co_inventory_updated', { detail: { lots } }));
  } catch (e) {
    console.warn('Error saving custom lots', e);
  }
};

/**
 * Sync when a batch is modified in /admin/inventory:
 * - Updates batch override
 * - Updates product.batches in love_co_admin_products_v1
 * - Recalculates product.totalStock
 * - Broadcasts events so /admin/products, /catalog, /product/[slug] all update
 */
export const syncBatchStockToProduct = ({
  batchNumber,
  productId,
  newStock,
  isWrittenOff = false,
  mfgDate,
  expDate,
  previousStockQuantity,
}) => {
  if (typeof window === 'undefined' || !batchNumber) return;

  // 1. Update override
  const currentOverrides = getStoredOverrides();
  const existingOverride = currentOverrides[batchNumber] || {};
  const updatedOverride = {
    ...existingOverride,
    stockQuantity: isWrittenOff ? 0 : Math.max(0, parseInt(newStock, 10) || 0),
    isWrittenOff: Boolean(isWrittenOff),
    status: isWrittenOff ? 'Written Off' : (existingOverride.status || 'Safe'),
    updatedAt: Date.now(),
  };

  if (mfgDate) updatedOverride.mfgDate = mfgDate;
  if (expDate) updatedOverride.expDate = expDate;
  if (previousStockQuantity !== undefined) updatedOverride.previousStockQuantity = previousStockQuantity;

  currentOverrides[batchNumber] = updatedOverride;
  saveStoredOverrides(currentOverrides);

  // 2. Update product in love_co_admin_products_v1
  const products = getStoredProducts();
  const updatedProducts = products.map((prod) => {
    // Check if this product owns the batch
    const hasBatch = (prod.batches || []).some((b) => b.batchNumber === batchNumber);
    const matchesId = prod._id === productId || prod.slug === productId || prod.id === productId;

    if (!hasBatch && !matchesId) return prod;

    // Update the specific batch inside prod.batches
    let batchFound = false;
    const updatedBatches = (prod.batches || []).map((b) => {
      if (b.batchNumber === batchNumber) {
        batchFound = true;
        return {
          ...b,
          stockQuantity: isWrittenOff ? 0 : Math.max(0, parseInt(newStock, 10) || 0),
          isWrittenOff: Boolean(isWrittenOff),
          status: isWrittenOff ? 'Written Off' : (b.status || 'Safe'),
          previousStockQuantity: previousStockQuantity !== undefined ? previousStockQuantity : (b.previousStockQuantity || b.stockQuantity),
          ...(mfgDate ? { mfgDate } : {}),
          ...(expDate ? { expDate } : {}),
        };
      }
      return b;
    });

    // If batch wasn't already in prod.batches (e.g. was a custom lot added from inventory)
    if (!batchFound && matchesId) {
      updatedBatches.push({
        batchNumber,
        stockQuantity: isWrittenOff ? 0 : Math.max(0, parseInt(newStock, 10) || 0),
        reservedQuantity: 0,
        isWrittenOff: Boolean(isWrittenOff),
        status: isWrittenOff ? 'Written Off' : 'Safe',
        mfgDate: mfgDate || new Date().toISOString(),
        expDate: expDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Recalculate totalStock as sum of all non-written-off batches
    const newTotalStock = updatedBatches.reduce((sum, b) => {
      if (b.isWrittenOff) return sum;
      return sum + (Number(b.stockQuantity) || 0);
    }, 0);

    return {
      ...prod,
      batches: updatedBatches,
      totalStock: newTotalStock,
      stockQty: newTotalStock,
    };
  });

  saveStoredProducts(updatedProducts);
};

/**
 * Sync when product total stock is changed in /admin/products (e.g. Quick Edit Stock):
 * - Sets product.totalStock = newQty
 * - Distributes the difference across batches or sets primary active batch so batch sum === newQty
 * - Updates batch overrides in love_co_fefo_overrides_v2
 * - Broadcasts events so /admin/inventory updates its rows immediately
 */
export const syncProductStockToBatches = ({ productId, newTotalStock }) => {
  if (typeof window === 'undefined' || !productId) return;
  const targetStock = Math.max(0, parseInt(newTotalStock, 10) || 0);

  const products = getStoredProducts();
  const currentOverrides = getStoredOverrides();

  const updatedProducts = products.map((prod) => {
    if (prod._id !== productId && prod.slug !== productId && prod.id !== productId) {
      return prod;
    }

    const batches = prod.batches ? [...prod.batches] : [];

    if (batches.length === 0) {
      // If no batches exist, create one to hold the stock
      const newBatchCode = `LOT-CP-${Date.now().toString().slice(-4)}`;
      const createdBatch = {
        batchNumber: newBatchCode,
        stockQuantity: targetStock,
        reservedQuantity: 0,
        mfgDate: new Date().toISOString(),
        expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
      batches.push(createdBatch);
      currentOverrides[newBatchCode] = {
        stockQuantity: targetStock,
        updatedAt: Date.now(),
      };
    } else {
      // Find non-written-off batches
      const activeBatches = batches.filter((b) => !b.isWrittenOff);
      if (activeBatches.length > 0) {
        // Adjust the largest or latest active batch to match targetStock
        const otherActiveStock = activeBatches.slice(1).reduce((sum, b) => sum + (Number(b.stockQuantity) || 0), 0);
        const primaryBatchNewQty = Math.max(0, targetStock - otherActiveStock);
        
        activeBatches[0].stockQuantity = primaryBatchNewQty;
        currentOverrides[activeBatches[0].batchNumber] = {
          ...(currentOverrides[activeBatches[0].batchNumber] || {}),
          stockQuantity: primaryBatchNewQty,
          updatedAt: Date.now(),
        };

        // If targetStock is less than other batches, scale remaining
        if (primaryBatchNewQty === 0 && otherActiveStock > targetStock) {
          let remaining = targetStock;
          activeBatches.forEach((b) => {
            if (remaining >= (b.stockQuantity || 0)) {
              remaining -= (b.stockQuantity || 0);
            } else {
              b.stockQuantity = remaining;
              remaining = 0;
            }
            currentOverrides[b.batchNumber] = {
              ...(currentOverrides[b.batchNumber] || {}),
              stockQuantity: b.stockQuantity,
              updatedAt: Date.now(),
            };
          });
        }
      } else {
        // If all batches were written off, un-quarantine or create a new active batch
        const newBatchCode = `LOT-RESTOCK-${Date.now().toString().slice(-4)}`;
        batches.unshift({
          batchNumber: newBatchCode,
          stockQuantity: targetStock,
          reservedQuantity: 0,
          mfgDate: new Date().toISOString(),
          expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
        currentOverrides[newBatchCode] = {
          stockQuantity: targetStock,
          updatedAt: Date.now(),
        };
      }
    }

    return {
      ...prod,
      batches,
      totalStock: targetStock,
      stockQty: targetStock,
    };
  });

  saveStoredOverrides(currentOverrides);
  saveStoredProducts(updatedProducts);
};

/**
 * Sync when a new batch is registered in /admin/inventory:
 * - Adds to custom lots
 * - Adds to product.batches
 * - Recalculates product totalStock
 */
export const syncNewBatchLot = (newLot) => {
  if (typeof window === 'undefined' || !newLot || !newLot.batchNumber) return;

  // 1. Save custom lot
  const customLots = getStoredCustomLots();
  const existsIndex = customLots.findIndex((l) => l.batchNumber === newLot.batchNumber);
  let updatedLots;
  if (existsIndex >= 0) {
    updatedLots = [...customLots];
    updatedLots[existsIndex] = newLot;
  } else {
    updatedLots = [newLot, ...customLots];
  }
  saveStoredCustomLots(updatedLots);

  // 2. Save override for this batch
  const currentOverrides = getStoredOverrides();
  currentOverrides[newLot.batchNumber] = {
    stockQuantity: Number(newLot.stockQuantity) || 0,
    mfgDate: newLot.mfgDate,
    expDate: newLot.expDate,
    status: newLot.status || 'Safe',
    isWrittenOff: false,
    updatedAt: Date.now(),
  };
  saveStoredOverrides(currentOverrides);

  // 3. Attach batch to product in love_co_admin_products_v1 & update product totalStock
  const products = getStoredProducts();
  const updatedProducts = products.map((p) => {
    if (p._id !== newLot.productId && p.slug !== newLot.slug) return p;

    const batches = p.batches ? [...p.batches] : [];
    const bIndex = batches.findIndex((b) => b.batchNumber === newLot.batchNumber);
    const batchData = {
      batchNumber: newLot.batchNumber,
      stockQuantity: Number(newLot.stockQuantity) || 0,
      reservedQuantity: 0,
      mfgDate: newLot.mfgDate,
      expDate: newLot.expDate,
      status: newLot.status || 'Safe',
      isWrittenOff: false,
    };

    if (bIndex >= 0) {
      batches[bIndex] = batchData;
    } else {
      batches.unshift(batchData);
    }

    const newTotalStock = batches.reduce((sum, b) => {
      if (b.isWrittenOff) return sum;
      return sum + (Number(b.stockQuantity) || 0);
    }, 0);

    return {
      ...p,
      batches,
      totalStock: newTotalStock,
      stockQty: newTotalStock,
    };
  });

  saveStoredProducts(updatedProducts);
};

