import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to dynamically align host (localhost vs 127.0.0.1) and automatically attach JWT token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const curHost = window.location.hostname;
    if (curHost && config.baseURL) {
      if (curHost === '127.0.0.1' && config.baseURL.includes('localhost')) {
        config.baseURL = config.baseURL.replace('localhost', '127.0.0.1');
      } else if (curHost === 'localhost' && config.baseURL.includes('127.0.0.1')) {
        config.baseURL = config.baseURL.replace('127.0.0.1', 'localhost');
      }
    }
    const token = localStorage.getItem('love_co_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor with resilient auto-retry on temporary connection blips
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      (error.message === 'Network Error' || error.code === 'ERR_NETWORK') &&
      config &&
      !config._retry
    ) {
      config._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 600));
      return apiClient(config);
    }
    return Promise.reject(error);
  }
);

// High-performance In-Memory Request Cache (60s TTL) for instant UI response
const memoryCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

const cachedGet = async (url, params = null) => {
  const cacheKey = params ? `${url}?${JSON.stringify(params)}` : url;
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await apiClient.get(url, { params });
  memoryCache.set(cacheKey, { timestamp: now, data: response });
  return response;
};

export const clearApiCache = () => memoryCache.clear();

export const api = {
  // Products (Cached for 0ms navigation latency)
  getProducts: (params) => cachedGet('/products', params),
  getAdminProducts: (params) => apiClient.get('/admin/products', { params }),
  getProductBySlug: (slug) => cachedGet(`/products/${slug}`),
  getBestSellers: () => cachedGet('/products/curated/bestsellers'),
  getConcernsList: () => cachedGet('/products/concerns/list'),
  addProductReview: async (slug, data) => {
    clearApiCache();
    return apiClient.post(`/products/${slug}/reviews`, data);
  },
  updateInventory: async (id, data) => {
    clearApiCache();
    return apiClient.put(`/products/${id}/inventory`, data);
  },
  updateProductStock: async (id, stock) => {
    clearApiCache();
    return apiClient.patch(`/admin/products/${id}/stock`, { stock });
  },
  updateProduct: async (id, data) => {
    clearApiCache();
    return apiClient.put(`/admin/products/${id}`, data);
  },

  // Auth & OTP
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  loginWithGoogle: (data) => apiClient.post('/auth/google', data),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  updateSkinProfile: (data) => apiClient.put('/auth/skin-profile', data),
  addAddress: (data) => apiClient.post('/auth/address', data),
  deleteAddress: (addressId) => apiClient.delete(`/auth/address/${addressId}`),
  sendPhoneOtp: (phone) => apiClient.post('/auth/send-phone-otp', { phone }),
  verifyPhoneOtp: (payload) => apiClient.post('/auth/verify-phone-otp', payload),
  sendOtp: (payload) => {
    const data = typeof payload === 'string' ? { type: 'phone', value: payload, phone: payload } : payload;
    return apiClient.post('/auth/send-otp', data);
  },
  verifyOtp: (payload) => apiClient.post('/auth/verify-otp', payload),

  // Cart & Bundles
  validateBundle: (itemIds, includeGiftPackaging) =>
    apiClient.post('/cart/validate-bundle', { itemIds, includeGiftPackaging }),
  reserveStock: (items, sessionId) =>
    apiClient.post('/cart/reserve-stock', { items, sessionId }),
  releaseStock: (productId, sessionId) =>
    apiClient.post('/cart/release-stock', { productId, sessionId }),

  // Orders & Checkout
  checkout: (payload) => apiClient.post('/orders/checkout', payload),
  getOrderById: (id) =>
    apiClient.get(`/orders/${id}?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }),
  getUserOrders: () => apiClient.get('/orders/customer/history'),

  // Admin Operations
  getAdminOrders: (params) => apiClient.get('/admin/orders', { params }),
  updateAdminOrderStatus: (id, data) => apiClient.put(`/admin/orders/${id}/status`, data),
  shipOrderViaShiprocket: (orderId) => apiClient.post(`/admin/orders/${orderId}/shiprocket/push`),
  pushOrderToShiprocket: (orderId) => apiClient.post(`/admin/orders/${orderId}/shiprocket/push`),
  syncOrderWithShiprocket: (orderId) => apiClient.post(`/admin/orders/${orderId}/shiprocket/sync`),
  refundOrderViaRazorpay: (orderId, data) => apiClient.post(`/admin/orders/${orderId}/refund`, data),
  getStoreSettings: () => apiClient.get('/admin/settings'),
  updateStoreSettings: (data) => apiClient.put('/admin/settings', data),
  getAdminStats: () => apiClient.get('/admin/stats'),
  getDashboardStats: () => apiClient.get('/admin/dashboard-stats'),
  createProduct: (data) => apiClient.post('/admin/products', data),

  // Curing & Batch Lifecycle
  getCuringBatches: () => apiClient.get('/orders/admin/curing-batches'),
  createCuringBatch: (data) => apiClient.post('/orders/admin/curing-batches', data),
  updateBatchQC: (batchId, data) => apiClient.put(`/orders/admin/curing-batches/${batchId}/status`, data),
  holdCuringBatch: (batchCode, data) => apiClient.put(`/orders/admin/curing-batches/${batchCode}/hold`, data),

  // Shipping Labels, GST Invoicing & Audit
  generateCourierLabel: (orderId, data) => apiClient.post(`/orders/admin/orders/${orderId}/generate-shipping-label`, data),
  getGstInvoice: (orderId) => apiClient.get(`/orders/admin/orders/${orderId}/invoice`),
  getAdminAuditLogs: (params) => apiClient.get('/orders/admin/audit-logs', { params }),

  // AI Oversight & Promotions
  getSamAiAnalytics: () => apiClient.get('/orders/admin/ai-analytics'),
  createPromotion: (data) => apiClient.post('/orders/admin/promotions', data),

  // D2C Skincare & Formulation Portal APIs
  getD2cAnalytics: () => apiClient.get('/orders/admin/d2c/analytics'),
  getD2cWatchlist: () => apiClient.get('/orders/admin/d2c/watchlist'),
  writeOffBatch: (data) => apiClient.post('/orders/admin/d2c/write-off', data),
  getQuizRules: () => apiClient.get('/orders/admin/d2c/quiz-rules'),
  saveQuizRule: (data) => apiClient.post('/orders/admin/d2c/quiz-rules', data),
  deleteQuizRule: (id) => apiClient.delete(`/orders/admin/d2c/quiz-rules/${id}`),

  // AI Routine Copilot
  consultSkinRoutine: (payload) => apiClient.post('/ai/consultation/message', payload),
  convertRegimenToCart: (productIds) => apiClient.post('/ai/consultation/regimen-to-cart', { productIds }),
  chatWithSam: (payload) => apiClient.post('/ai/chat', payload),

  // Apothecary Ritual Loyalty & Mystery Coupons
  getLoyaltyStatus: () => apiClient.get('/loyalty/me', { params: { _t: Date.now() } }),
  revealMysteryCoupon: (code) => apiClient.post(`/loyalty/reveal/${code}`),
  validateReward: (payload) => apiClient.post('/loyalty/validate-reward', payload),

  // Customer-Isolated Wishlist
  getWishlist: () => apiClient.get('/wishlist'),
  toggleWishlist: (productId) => apiClient.post('/wishlist/toggle', { productId }),
  removeFromWishlist: (productId) => apiClient.delete(`/wishlist/${productId}`),

  // Flagship Love & Co. Command Center APIs
  getStoreStatus: () => apiClient.get('/admin/store-status'),
  updateStoreStatus: (data) => apiClient.put('/admin/store-status', data),
  getPublicStoreStatus: () => apiClient.get('/products/store-status'),
  getOperationsKpis: () => apiClient.get('/admin/operations/kpis'),
  getOperationsQueue: (params) => apiClient.get('/admin/operations/queue', { params }),
  packOrder: (id) => apiClient.put(`/admin/orders/${id}/pack`),
  dispatchOrder: (id, data) => apiClient.put(`/admin/orders/${id}/dispatch`, data),
  cancelOrder: (id, data) => apiClient.post(`/admin/orders/${id}/cancel`, data),
  toggleProductStock: (id) => apiClient.patch(`/admin/products/${id}/toggle-stock`),
  quickPriceUpdate: (id, data) => apiClient.patch(`/admin/products/${id}/quick-price`, data),
  bulkRestock: (data) => apiClient.post('/admin/inventory/bulk-restock', data),
  deleteProductGuarded: (id) => apiClient.delete(`/admin/products/${id}`),
  getCombos: () => apiClient.get('/admin/combos'),
  createCombo: (data) => apiClient.post('/admin/combos', data),
  updateCombo: (id, data) => apiClient.put(`/admin/combos/${id}`, data),
  deleteCombo: (id) => apiClient.delete(`/admin/combos/${id}`),
  getCustomerIntelligence: () => apiClient.get('/admin/customers'),
  getCustomerDossier: (id) => apiClient.get(`/admin/customers/${id}`),
  getFinancialPnl: (params) => apiClient.get('/admin/analytics/pnl', { params }),
  getInventoryReplenishment: () => apiClient.get('/admin/analytics/replenishment'),
  generateBotanicalCopy: (data) => apiClient.post('/admin/ai/generate-copy', data),
};

export default apiClient;
