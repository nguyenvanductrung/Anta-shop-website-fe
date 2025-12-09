// src/services/api.js
import axios from "axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../constants/index"; 

// --- ORDER (order-service direct calls) ---
export const ORDER_BASE_URL =
  import.meta.env.VITE_ORDER_SERVICE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080";

export const orderApi = axios.create({
  baseURL: ORDER_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// attach token if present
orderApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
  return cfg;
});

// orderService: call order-service endpoints
export const orderService = {
  createOrder: async (payload) => {
    // payload must follow backend CreateOrderRequest shape:
    // { userId, items: [{ productId, variantId, quantity, note? }], shippingAddress?, paymentMethod? }
    try {
      const res = await orderApi.post("/api/orders/create", payload);
      // CreateOrderResponse { orderId, status, payUrl }
      return res.data;
    } catch (err) {
      // throw an Error with message for UI
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Order API error";
      throw new Error(msg);
    }
  },

  getOrder: async (orderId) => {
    try {
      const res = await orderApi.get(`/api/orders/${encodeURIComponent(orderId)}`);
      // OrderResponse
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "getOrder failed";
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

const TOKEN_KEY = STORAGE_KEYS?.TOKEN || "anta_token";

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
  searchProducts: async (q) => {
    const res = await api.get(API_ENDPOINTS.PRODUCTS.SEARCH, { params: { q } });
    return res.data;
  },
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

// direct cart-service fallback
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
      try { localStorage.setItem("anta_user_profile", JSON.stringify(res.data)); } catch {}
      return res.data;
    } catch (err) {
      // fallback: update LS only
      try { localStorage.setItem("anta_user_profile", JSON.stringify(data)); } catch {}
      return data;
    }
  },
  getAddresses: async () => {
    try {
      const res = await api.get("/api/address/allUserAddress");
      // normalize shapes
      const d = res.data;
      if (Array.isArray(d)) return d;
      if (typeof d === "object") {
        // try find an array inside object
        for (const k of Object.keys(d)) {
          if (Array.isArray(d[k])) return d[k];
        }
      }
      return [];
    } catch (err) {
      // fallback to LS/mock
      try {
        const ls = JSON.parse(localStorage.getItem("anta_user_addresses") || "[]");
        return ls;
      } catch { return []; }
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
