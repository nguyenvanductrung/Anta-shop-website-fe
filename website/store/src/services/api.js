//src/services/api.js
import axios from "axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../constants/index";

// ------------------- BASE URLs -------------------
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

const PRODUCT_BASE_URL =
  import.meta.env.VITE_PRODUCT_SERVICE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

const TOKEN_KEY = STORAGE_KEYS.TOKEN;

// ------------------- MAIN API (Gateway) -------------------
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ------------------- PRODUCT API (Direct product-service) -------------------
export const productApi = axios.create({
  baseURL: PRODUCT_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

productApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ------------------- AUTH SERVICE -------------------
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
    const payload =
      typeof refreshToken === "string"
        ? { refreshToken }
        : refreshToken || {};

    const res = await api.post(API_ENDPOINTS.AUTH.REFRESH, payload);
    return res.data;
  }
};

// ------------------- PRODUCT SERVICE (User-facing via gateway) -------------------
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

  searchProducts: async (query) => {
    const res = await api.get(API_ENDPOINTS.PRODUCTS.SEARCH, {
      params: { q: query }
    });
    return res.data;
  }
};

// CART
// CART SERVICE - Sửa lại dùng api (không dùng cartApi)
// CART SERVICE - SỬA LẠI HOÀN TOÀN
export const cartService = {
  // Thêm sản phẩm vào giỏ hàng
  addToCart: async (payload) => {
    try {
      console.log('📤 Add to cart payload:', payload);
      const res = await api.post('/api/cart/add', payload);
      console.log('✅ Add to cart response:', res.data);
      return res.data;
    } catch (err) {
      console.error('❌ Add to cart error:', err);
      throw new Error(getErrorMessage(err));
    }
  },

  // Lấy giỏ hàng hiện tại - SỬA LẠI
  getCurrentCart: async (userId, sessionId) => {
    try {
      console.log('🔍 getCurrentCart called with:', { userId, sessionId });

      let params = {};
      if (userId) {
        params.userId = userId;   // Ưu tiên userId
      } else if (sessionId) {
        params.sessionId = sessionId; // fallback sang sessionId
      } else {
        const storedSession = localStorage.getItem('sessionId');
        if (storedSession) {
          params.sessionId = storedSession;
        }
      }

      console.log('📤 Fetching cart with params:', params);

      const res = await api.get(`/api/cart/current`, { params });

      console.log('📦 Cart response status:', res.status);
      console.log('📦 Cart response data:', res.data);

      if (res.status === 204 || !res.data) {
        console.log('🔄 Cart is empty');
        return null;
      }

      return res.data;
    } catch (err) {
      console.error('❌ getCurrentCart error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });

      if (err.response?.status === 204 || err.response?.status === 404) {
        return null;
      }

      throw new Error('Có lỗi xảy ra khi tải giỏ hàng');
    }
  },

  // Xoá 1 item khỏi giỏ hàng
  removeItem: async (itemId) => {
    try {
      console.log('🗑️ Removing item:', itemId);
      await api.delete(`/api/cart/item/${itemId}`);
      return { success: true };
    } catch (err) {
      console.error('❌ Remove item error:', err);
      throw new Error(getErrorMessage(err));
    }
  },

  // Xoá toàn bộ giỏ hàng
  clearCart: async (cartId) => {
    try {
      console.log('🧹 Clearing cart:', cartId);
      await api.delete(`/api/cart/${cartId}/clear`);
      return { success: true };
    } catch (err) {
      console.error('❌ Clear cart error:', err);
      throw new Error(getErrorMessage(err));
    }
  },

  // Cập nhật số lượng - SỬA LẠI (dùng api, không dùng axiosInstance)
  updateQuantity: async (cartId, productId, variantId, newQuantity) => {
    try {
      console.log('🔢 Update quantity:', {
        cartId, productId, variantId, newQuantity
      });

      const params = new URLSearchParams();
      params.append('productId', productId);
      params.append('newQuantity', newQuantity);

      // CHỈ thêm variantId nếu có
      if (variantId !== null && variantId !== undefined) {
        params.append('variantId', variantId);
      }

      console.log('📤 Update params:', params.toString());

      // DÙNG api (đã có interceptor với token)
      const res = await api.put(`/api/cart/${cartId}/items/quantity`, null, {
        params: {
          productId: Number(productId),
          variantId: variantId ?? null,   // sẽ gửi nếu có, bỏ qua nếu null
          newQuantity: Number(newQuantity),
        },
      });

      console.log('✅ Update response:', res.data);
      return res.data;

    } catch (error) {
      console.error('❌ Update quantity error:', error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Merge giỏ hàng
  mergeCart: async (sessionId, userId) => {
    try {
      console.log('🔄 Merging cart:', { sessionId, userId });
      const res = await api.post('/api/cart/merge', null, {
        params: { sessionId, userId }
      });
      return res.data;
    } catch (err) {
      console.error('❌ Merge cart error:', err);
      throw new Error(getErrorMessage(err));
    }
  }
};

// Hàm helper gọi trực tiếp đến cart-service (nếu gateway có vấn đề)
const getCartDirectly = async (userId, sessionId) => {
  try {
    console.log('🔗 Trying direct connection to cart-service...');

    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (sessionId) params.append('sessionId', sessionId);

    // Gọi trực tiếp đến cart-service:8088 (bypass gateway)
    const response = await fetch(`http://localhost:8088/api/cart/current?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Thêm token nếu có
        ...(localStorage.getItem(STORAGE_KEYS.TOKEN) ? {
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        } : {})
      }
    });

    if (response.status === 204 || response.status === 404) {
      return null;
    }

    const data = await response.json();
    console.log('📦 Direct cart response:', data);
    return data;

  } catch (err) {
    console.error('❌ Direct connection also failed:', err);
    return null;
  }
};

// USER (some endpoints may be mocks if BE not ready)
export const userService = {
  getProfile: async () => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null");
    return {
      fullName: user?.username || "",
      email: user?.email || "",
      phone: "",
      birthday: "",
      gender: ""
    };
  },

  updateProfile: async (data) => {
    return data;
  },

  changePassword: async () => {
    return { message: "Đổi mật khẩu thành công (mock)" };
  },

  getAddresses: async () => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null");
    if (!user) return [];

    const res = await api.get(`/api/address/allUserAddress/${user.id}`);
    const d = res.data;

    if (Array.isArray(d)) return d;
    if (typeof d === "object") {
      return Object.values(d).find((v) => Array.isArray(v)) || [];
    }
    return [];
  },

  addAddress: async (data) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null");
    const payload = {
      detailedAddress: data.detailedAddress || data.address,
      country: data.country || "Vietnam",
      phoneNumber: data.phoneNumber || data.phone,
      recipientName: data.recipientName,
      postalCode: data.postalCode || "",
      isDefault: data.isDefault || false
    };

    const res = await api.post(`/api/address/add/${user.id}`, payload);
    return Object.keys(res.data)[0];
  },

  updateAddress: async (id, data) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null");
    const payload = {
      detailedAddress: data.detailedAddress || data.address,
      country: data.country || "Vietnam",
      phoneNumber: data.phoneNumber || data.phone,
      recipientName: data.recipientName,
      postalCode: data.postalCode || "",
      isDefault: data.isDefault || false
    };

    const res = await api.put(`/api/address/update/addressId/${id}/userId/${user.id}`, payload);
    return Object.keys(res.data)[0];
  },

  deleteAddress: async (id) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null");
    const res = await api.delete(`/api/address/delete/addressId/${id}/userId/${user.id}`);
    return res.data;
  },

  setDefaultAddress: async (id) => {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null");
    const res = await api.put(`/api/address/setDefault/${id}/user/${user.id}`);
    return res.data;
  }
};

// ------------------- MOCK ORDER SERVICE -------------------
export const orderService = {
  getOrders: async () => [],
  getOrder: async () => null,
  cancelOrder: async () => ({ message: "Canceled (mock)" })
};

// ------------------- MOCK WISHLIST SERVICE -------------------
export const wishlistService = {
  getWishlist: async () => [],
  addToWishlist: async () => ({ success: true }),
  removeFromWishlist: async () => ({ success: true })
};

export default api;
