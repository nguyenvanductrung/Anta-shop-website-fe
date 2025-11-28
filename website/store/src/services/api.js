// src/services/api.js
import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { getErrorMessage } from '../utils';

// --- Base URLs with robust fallback to env (FE -> gateway)
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (API_ENDPOINTS && API_ENDPOINTS.BASE_URL) ||
  'http://localhost:8080';

const PRODUCT_BASE_URL =
  import.meta.env.VITE_PRODUCT_SERVICE_URL ||
  import.meta.env.VITE_API_URL ||
  (API_ENDPOINTS && API_ENDPOINTS.BASE_URL) ||
  'http://localhost:8080';

// ---------- general api (default baseURL) ----------
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Helper: check if a request config targets refresh endpoint
function isRefreshRequest(config) {
  try {
    if (!config || !config.url) return false;
    // url could be absolute or relative. Just check contains the refresh path.
    const refreshPath = (API_ENDPOINTS && API_ENDPOINTS.AUTH && API_ENDPOINTS.AUTH.REFRESH) || '/api/auth/refresh';
    return String(config.url).includes(refreshPath);
  } catch {
    return false;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do NOT immediately logout on any 401 — let AuthContext try refresh first.
    // Only perform forced logout when the failed request was the refresh endpoint itself.
    try {
      const status = error?.response?.status;
      const config = error?.config;
      if (status === 401 && config && isRefreshRequest(config)) {
        // refresh failed -> clear credentials and notify
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    } catch (e) {
      // ignore helper errors
    }
    return Promise.reject(error);
  }
);

// ---------- productApi: gọi trực tiếp product-service (VITE_PRODUCT_SERVICE_URL) ----------
export const productApi = axios.create({
  baseURL: PRODUCT_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

productApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ----------------- Named service exports (used throughout the FE) -----------------

// AUTH
export const authService = {
  login: async (credentials) => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return res.data;
  },

  // gửi { refreshToken } lên backend (BE phải support)
  refreshToken: async (refreshToken) => {
    try {
      // allow passing either string or an object that already contains token
      const payload =
        typeof refreshToken === 'string' ? { refreshToken } : refreshToken || {};
      const res = await api.post(API_ENDPOINTS.AUTH.REFRESH, payload);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};

// PRODUCT (user-facing)
export const productService = {
  getProducts: async (params = {}) => {
    try {
      const res = await api.get(API_ENDPOINTS.PRODUCTS.LIST, { params });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  getProduct: async (id) => {
    try {
      const res = await api.get(API_ENDPOINTS.PRODUCTS.DETAIL.replace(':id', id));
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  searchProducts: async (query) => {
    try {
      const res = await api.get(API_ENDPOINTS.PRODUCTS.SEARCH, { params: { q: query } });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};

// CART
export const cartService = {
  addToCart: async (productId, quantity = 1) => {
    try {
      const res = await api.post(API_ENDPOINTS.CART.ADD, { productId, quantity });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  removeFromCart: async (productId) => {
    try {
      const res = await api.delete(API_ENDPOINTS.CART.REMOVE, { data: { productId } });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  updateCartItem: async (productId, quantity) => {
    try {
      const res = await api.put(API_ENDPOINTS.CART.UPDATE, { productId, quantity });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};

// USER (some endpoints may be mocks if BE not ready)
export const userService = {
  getProfile: async () => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    return {
      fullName: user?.username || '',
      email: user?.email || '',
      phone: '',
      birthday: '',
      gender: ''
    };
  },

  updateProfile: async (data) => {
    return data;
  },

  changePassword: async (data) => {
    return { message: 'Đổi mật khẩu thành công (mock)' };
  },

  getAddresses: async () => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
      if (!user) return [];
      const res = await api.get(`/api/address/allUserAddress/${user.id}`);
      const d = res.data;
      if (Array.isArray(d)) return d;
      if (typeof d === 'object') {
        const list = Object.values(d).find(v => Array.isArray(v));
        return list || [];
      }
      return [];
    } catch (err) {
      console.error('Error getAddresses', err);
      throw new Error(getErrorMessage(err));
    }
  },

  addAddress: async (addressData) => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
      const payload = {
        detailedAddress: addressData.detailedAddress || addressData.address,
        country: addressData.country || 'Vietnam',
        phoneNumber: addressData.phoneNumber || addressData.phone,
        recipientName: addressData.recipientName,
        postalCode: addressData.postalCode || '',
        isDefault: addressData.isDefault || false
      };
      const res = await api.post(`/api/address/add/${user.id}`, payload);
      return Object.keys(res.data)[0];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  updateAddress: async (id, addressData) => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
      const payload = {
        detailedAddress: addressData.detailedAddress || addressData.address,
        country: addressData.country || 'Vietnam',
        phoneNumber: addressData.phoneNumber || addressData.phone,
        recipientName: addressData.recipientName,
        postalCode: addressData.postalCode || '',
        isDefault: addressData.isDefault || false
      };
      const res = await api.put(`/api/address/update/addressId/${id}/userId/${user.id}`, payload);
      return Object.keys(res.data)[0];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  deleteAddress: async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
      const res = await api.delete(`/api/address/delete/addressId/${id}/userId/${user.id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  setDefaultAddress: async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
      const res = await api.put(`/api/address/setDefault/${id}/user/${user.id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};

// ORDER / WISHLIST
export const orderService = {
  getOrders: async (params = {}) => { return []; },
  getOrder: async (id) => { return null; },
  cancelOrder: async (id) => { return { message: 'Canceled (mock)' }; }
};

export const wishlistService = {
  getWishlist: async () => { return []; },
  addToWishlist: async (productId) => { return { success: true }; },
  removeFromWishlist: async (id) => { return { success: true }; }
};

export default api;
