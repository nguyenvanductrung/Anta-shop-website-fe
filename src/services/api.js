// src/services/api.js
import axios from "axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../constants/index";


const TOKEN_KEY = STORAGE_KEYS?.TOKEN || "anta_token";
// --- ORDER (order-service direct calls) ---
export const ORDER_BASE_URL =
  import.meta.env.VITE_ORDER_SERVICE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

export const orderApi = axios.create({
  baseURL: ORDER_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

orderApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  }
  return cfg;
})
export const notificationService = {
  sendOrderSuccess: async (payload) => {
    const res = await api.post('/api/notifications/order-success', payload);
    return res.data; // {success, message, requestId}
  }
};
// orderService: call order-service endpoints
// orderService: call order-service endpoints
export const orderService = {
  createOrder: async (payload) => {
    // payload must follow backend CreateOrderRequest shape:
    // { userId, items: [{ productId, variantId, quantity, note? }], shippingAddress?, paymentMethod? }
    try {
      const res = await orderApi.post("/api/orders/create", payload);
      // CreateOrderResponse { id (numeric)?, orderId (string)?, status, payUrl, total, ... }
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Order API error";
      // rethrow so frontend can catch and show message
      throw new Error(msg);
    }
  },

  /**
   * Robust getOrder:
   * 1) try GET /api/orders/{orderId} (works if backend expects numeric id or accepts string)
   * 2) if fails AND orderId is a string (contains non-digits), try GET /api/orders/by-order-number/{orderNumber}
   * 3) if all fail, throw error
   *
   * This prevents 400 when the frontend has an orderNumber like "6-xxxx-uuid".
   */
  getOrder: async (orderId) => {
    const tryPaths = [
      () => orderApi.get(`/api/orders/${encodeURIComponent(orderId)}`), // primary
      () => orderApi.get(`/api/orders/by-order-number/${encodeURIComponent(orderId)}`), // common fallback
      () => orderApi.get(`/api/orders/order-number/${encodeURIComponent(orderId)}`), // alternative fallback
      () => orderApi.get(`/api/orders?orderNumber=${encodeURIComponent(orderId)}`), // query fallback
    ];

    // attempt primary and on failure try fallbacks for string-like orderNumbers
    try {
      const res = await tryPaths[0]();
      return res.data;
    } catch (primaryErr) {
      // if orderId looks like numeric string, rethrow original error
      const looksNumeric = /^-?\d+$/.test(String(orderId));
      if (looksNumeric) {
        const msg = primaryErr?.response?.data?.message || primaryErr?.message || "getOrder failed";
        throw new Error(msg);
      }

      // try fallbacks in order
      for (let i = 1; i < tryPaths.length; i++) {
        try {
          const r = await tryPaths[i]();
          return r.data;
        } catch (e) {
          // continue to next fallback
        }
      }

      // none worked -> build friendly message
      const msg = primaryErr?.response?.data?.message || primaryErr?.message || "getOrder failed";
      throw new Error(msg);
    }
  },

  // get order by its orderNumber explicitly
  getOrderByOrderNumber: async (orderNumber) => {
    try {
      const res = await orderApi.get(`/api/orders/by-order-number/${encodeURIComponent(orderNumber)}`);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "getOrderByOrderNumber failed";
      throw new Error(msg);
    }
  },

  // Update payment status on order-service (best-effort). Backend endpoint may differ; adjust if needed.
  updatePayment: async (orderId, status) => {
    try {
      // Try existing API patterns first (existing code)
      const res = await orderApi.post(`/api/orders/${encodeURIComponent(orderId)}/payment-status/${encodeURIComponent(status)}`);
      return res.data;
    } catch (err) {
      // fallback: try other endpoints used by the backend
      try {
        const res2 = await orderApi.post(`/api/orders/${encodeURIComponent(orderId)}/payment/${encodeURIComponent(status)}`);
        return res2.data;
      } catch (err2) {
        // final fallback: use PUT /{id}/paid when status indicates 'SUCCESS'/'PAID'
        try {
          if (['SUCCESS', 'PAID', 'COMPLETED'].includes((status || '').toString().toUpperCase())) {
            const r3 = await orderApi.put(`/api/orders/${encodeURIComponent(orderId)}/paid`);
            return r3.data;
          }
        } catch (err3) { /* ignore and throw below */ }
        const msg = err2?.response?.data?.message || err2?.message || "updatePayment failed";
        throw new Error(msg);
      }
    }
  },
  markPaid: async (orderId) => {
    try {
      const res = await orderApi.put(`/api/orders/${encodeURIComponent(orderId)}/paid`);
      // some controllers return 204 No Content - just return true
      return res.data ?? true;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'markPaid failed';
      throw new Error(msg);
    }
  },
  getOrders: async (params = {}) => {
    try {
      const res = await orderApi.get('/api/orders', { params });
      const data = res.data;
      // support various shapes: array, { data: [] }, { orders: [] }
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      if (data && Array.isArray(data.orders)) return data.orders;
      // fallback: if object with keys and one of them is an array
      for (const k of Object.keys(data || {})) {
        if (Array.isArray(data[k])) return data[k];
      }
      return [];
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "getOrders failed";
      throw new Error(msg);
    }
  },
  cancelOrder: async (orderId) => {
    try {
      const res = await orderApi.post(`/api/orders/${encodeURIComponent(orderId)}/cancel`);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "cancelOrder failed";
      throw new Error(msg);
    }
  },
};


export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const PRODUCT_BASE_URL =
  import.meta.env.VITE_PRODUCT_SERVICE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";
export const CLOUD_BASE_URL =
  import.meta.env.VITE_CLOUD_API_URL || import.meta.env.VITE_CLOUD_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";



// ------------------- UTILS -------------------
const getErrorMessage = (err) => {
  if (!err) return "Unknown error";
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data) return JSON.stringify(err.response.data);
  return err.message || String(err);
};

// small delay (for mocks)
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ------------------- AXIOS INSTANCES -------------------
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  return cfg;
});

// product-specific instance (direct calls to product-service if needed)
export const productApi = axios.create({
  baseURL: PRODUCT_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});
productApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  return cfg;
});

// ------------------- AUTH (gateway) -------------------
export const authService = {
  login: async (credentials) => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return res.data;
  },
  register: async (data) => {
    const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return res.data;
  },
  refreshToken: async (refreshToken) => {
    const payload = typeof refreshToken === "string" ? { refreshToken } : refreshToken || {};
    const res = await api.post(API_ENDPOINTS.AUTH.REFRESH, payload);
    return res.data;
  },
};

// ------------------- PRODUCT (user-facing via gateway) -------------------
// inside src/services/api.js -> productService
export const productService = {
  getProducts: async (params = {}) => {
    const res = await api.get(API_ENDPOINTS.PRODUCTS.LIST, { params });
    return res.data;
  },
  getProduct: async (id) => {
    const url = API_ENDPOINTS.PRODUCTS.DETAIL.replace(":id", id);
    const res = await api.get(url);
    return res.data;
  },
  searchProducts: async (q, params = {}) => {
    const res = await api.get("/api/product/search", { params: { q, ...params } });
    return res.data;
  },
  getAllProducts: async (params = {}) => {
    // gọi thẳng product-service (giống admin)
    const res = await productApi.get("/api/product/all", { params });
    return res.data;
  },

  // <-- NEW: getVariants(productId)
  getVariants: async (productId) => {
    try {
      // adjust path if your product-service uses different route
      const res = await productApi.get(`/api/products/${encodeURIComponent(productId)}/variants`);
      // support both array or { data: [] } shapes
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      // fallback: if object contains variants key
      if (data && Array.isArray(data.variants)) return data.variants;
      // else return empty
      return [];
    } catch (err) {
      console.warn('[productService.getVariants] failed', err);
      return [];
    }
  }
};


// ------------------- CART (gateway) -------------------
export const cartService = {
  addToCart: async (payload) => {
    try {
      const res = await api.post("/api/cart/add", payload);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },
  getCurrentCart: async (userId, sessionId) => {
    try {
      const params = {};
      if (userId) params.userId = userId;
      else if (sessionId) params.sessionId = sessionId;
      else {
        const stored = localStorage.getItem("sessionId");
        if (stored) params.sessionId = stored;
      }
      const res = await api.get("/api/cart/current", { params });
      if (res.status === 204 || res.status === 404 || !res.data) return null;
      return res.data;
    } catch (err) {
      // nếu gateway fail, thử gọi trực tiếp cart-service (fallback)
      if (err.config?.url?.includes("/api/cart/current")) {
        try {
          const direct = await getCartDirectly(userId, sessionId);
          return direct;
        } catch (e) { /* ignore */ }
      }
      throw new Error("Có lỗi khi tải giỏ hàng: " + getErrorMessage(err));
    }
  },
  removeItem: async (itemId) => {
    try {
      await api.delete(`/api/cart/item/${itemId}`);
      return { success: true };
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },
  clearCart: async (cartId) => {
    try {
      await api.delete(`/api/cart/${cartId}/clear`);
      return { success: true };
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },
  updateQuantity: async (cartId, productId, variantId, newQuantity) => {
    try {
      const res = await api.put(`/api/cart/${cartId}/items/quantity`, null, {
        params: { productId: Number(productId), variantId: variantId ?? null, newQuantity: Number(newQuantity) },
      });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },
  mergeCart: async (sessionId, userId) => {
    try {
      const res = await api.post("/api/cart/merge", null, { params: { sessionId, userId } });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },
};

// <<<<<<< HEAD
// ------------------- REVENUE / DASHBOARD SERVICE -------------------
export const revenueService = {
  getWeeklyRevenue: async () => {
    try {
      const res = await api.get(API_ENDPOINTS.ADMIN.STATS.REVENUE_WEEKLY);
      return res.data;
    } catch (err) {
      console.error('Revenue API error:', err);
      // Fallback mock data
      return [
        { week: "2025-W49", expectedRevenue: 2500000, actualRevenue: 1800000 },
        { week: "2025-W50", expectedRevenue: 3200000, actualRevenue: 2100000 },
        { week: "2025-W51", expectedRevenue: 2800000, actualRevenue: 2300000 },
        { week: "2025-W52", expectedRevenue: 3500000, actualRevenue: 1900000 }
      ];
    }
  }
};

// Hàm helper gọi trực tiếp đến cart-service (nếu gateway có vấn đề)
// =======
// // direct cart-service fallback
// >>>>>>> b075c3cb814577d00cb6b4f9f60454207d26063b
const getCartDirectly = async (userId, sessionId) => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (sessionId) params.append("sessionId", sessionId);
    const url = `http://localhost:8088/api/cart/current?${params.toString()}`; // adjust port if needed
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.status === 204 || res.status === 404) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("[getCartDirectly] failed", err);
    return null;
  }
};

// ------------------- USER (mix gateway + mocks) -------------------
// if backend not ready, these endpoints act as wrapper / passthrough
export const userService = {
  getProfile: async () => {
    // try localStorage first (fast)
    const fromLS = JSON.parse(localStorage.getItem("anta_user_profile") || "null");
    if (fromLS) return fromLS;
    // fallback to gateway
    try {
      const res = await api.get("/api/user/profile");
      return res.data;
    } catch (err) {
      // fallback to minimal mock
      return { fullName: "", email: "", phone: "" };
    }
  },
  updateProfile: async (data) => {
    try {
      const res = await api.put("/api/user/profile", data);
      // update LS for cross-page auto-fill
      try { localStorage.setItem("anta_user_profile", JSON.stringify(res.data)); } catch { }
      return res.data;
    } catch (err) {
      // fallback: update LS only
      try { localStorage.setItem("anta_user_profile", JSON.stringify(data)); } catch { }
      return data;
    }
  },
  getAddresses: async () => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS?.USER || "null") || "null");
      // nếu không có user trên FE thì fallback ngay sang localStorage mock
      if (!user || !user.id) {
        const ls = JSON.parse(localStorage.getItem("anta_user_addresses") || "[]");
        return ls;
      }

      // gọi đúng endpoint có userId path param
      const res = await api.get(`/api/address/allUserAddress/${user.id}`);
      const d = res.data;
      // normalise shapes (array or object.wrappedArray)
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.data)) return d.data;
      for (const k of Object.keys(d || {})) {
        if (Array.isArray(d[k])) return d[k];
      }
      return [];
    } catch (err) {
      // fallback to LS/mock if gateway/identity unreachable
      try {
        const ls = JSON.parse(localStorage.getItem("anta_user_addresses") || "[]");
        return ls;
      } catch {
        return [];
      }
    }
  },
  addAddress: async (payload) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS?.USER || "null") || "null");
    if (!user) throw new Error("User not found");
    const body = {
      detailedAddress: payload.detailedAddress || payload.address,
      country: payload.country || "Vietnam",
      phoneNumber: payload.phoneNumber || payload.phone,
      recipientName: payload.recipientName,
      postalCode: payload.postalCode || "",
      isDefault: !!payload.isDefault,
    };
    const res = await api.post(`/api/address/add/${user.id}`, body);
    return res.data;
  },
  updateAddress: async (id, payload) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS?.USER || "null") || "null");
    const body = {
      detailedAddress: payload.detailedAddress || payload.address,
      country: payload.country || "Vietnam",
      phoneNumber: payload.phoneNumber || payload.phone,
      recipientName: payload.recipientName,
      postalCode: payload.postalCode || "",
      isDefault: !!payload.isDefault,
    };
    const res = await api.put(`/api/address/update/addressId/${id}/userId/${user.id}`, body);
    return res.data;
  },
  deleteAddress: async (id) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS?.USER || "null") || "null");
    const res = await api.delete(`/api/address/delete/addressId/${id}/userId/${user.id}`);
    return res.data;
  },
  setDefaultAddress: async (id) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS?.USER || "null") || "null");
    const res = await api.put(`/api/address/setDefault/${id}/user/${user.id}`);
    return res.data;
  },
};

// ------------------- MOCKS (simple) -------------------
export const wishlistService = {
  getWishlist: async () => { await delay(); return []; },
  addToWishlist: async () => ({ success: true }),
  removeFromWishlist: async () => ({ success: true }),
};

export default api;
