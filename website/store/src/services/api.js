import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { getErrorMessage } from '../utils';

// Create axios instance
const api = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and let AuthContext handle redirect
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      // Dispatch custom event for AuthContext to handle navigation
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// Product services
export const productService = {
  getProducts: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.PRODUCTS.LIST, { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getProduct: async (id) => {
    try {
      const response = await api.get(API_ENDPOINTS.PRODUCTS.DETAIL.replace(':id', id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  searchProducts: async (query) => {
    try {
      const response = await api.get(API_ENDPOINTS.PRODUCTS.SEARCH, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// Cart services
export const cartService = {
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await api.post(API_ENDPOINTS.CART.ADD, {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  removeFromCart: async (productId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.CART.REMOVE, {
        data: { productId }
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  updateCartItem: async (productId, quantity) => {
    try {
      const response = await api.put(API_ENDPOINTS.CART.UPDATE, {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// 🧩 USER SERVICE - REAL BACKEND (MySQL)
export const userService = {
  // Lấy thông tin người dùng (tạm dùng localStorage)
  getProfile: async () => {
    const user = JSON.parse(localStorage.getItem('anta_user'));
    return {
      fullName: user?.username || '',
      email: user?.email || '',
      phone: '',
      birthday: '',
      gender: '',
    };
  },

  updateProfile: async (data) => {
    // Nếu bạn có API cập nhật user thật, có thể thêm sau
    return data;
  },

  changePassword: async (data) => {
    // Nếu backend có API đổi mật khẩu, thêm ở đây
    return { message: 'Đổi mật khẩu thành công (mock)' };
  },

  // ==============================
  // 🏠 ADDRESS API (REAL BACKEND)
  // ==============================

  // ✅ Bản mới — BE trả về List<AddressResponse>
  getAddresses: async () => {
    try {
      const user = JSON.parse(localStorage.getItem('anta_user'));
      const res = await api.get(`/api/address/allUserAddress/${user.id}`);
      const data = res.data;

      // Nếu BE trả về đúng list
      if (Array.isArray(data)) {
        return data;
      }

      // Nếu lỡ có kiểu object thì fallback (đảm bảo an toàn)
      if (typeof data === 'object') {
        const list = Object.values(data).find(v => Array.isArray(v));
        return list || [];
      }

      return [];
    } catch (error) {
      console.error('❌ Error getAddresses:', error);
      throw new Error(error.response?.data || error.message);
    }
  },

  // Thêm địa chỉ mới
  addAddress: async (addressData) => {
    try {
      const user = JSON.parse(localStorage.getItem('anta_user'));
      const payload = {
        detailedAddress: addressData.detailedAddress || addressData.address,
        country: addressData.country || 'Vietnam',
        phoneNumber: addressData.phoneNumber || addressData.phone,
        recipientName: addressData.recipientName,
        postalCode: addressData.postalCode || '',
        isDefault: addressData.isDefault || false,
      };
      const res = await api.post(`/api/address/add/${user.id}`, payload);
      return Object.keys(res.data)[0]; // BE trả về Map<AddressResponse, String>
    } catch (error) {
      console.error('❌ Error addAddress:', error);
      throw new Error(error.response?.data || error.message);
    }
  },

  // Cập nhật địa chỉ
  updateAddress: async (id, addressData) => {
    try {
      const user = JSON.parse(localStorage.getItem('anta_user'));
      const payload = {
        detailedAddress: addressData.detailedAddress || addressData.address,
        country: addressData.country || 'Vietnam',
        phoneNumber: addressData.phoneNumber || addressData.phone,
        recipientName: addressData.recipientName,
        postalCode: addressData.postalCode || '',
        isDefault: addressData.isDefault || false,
      };
      const res = await api.put(
        `/api/address/update/addressId/${id}/userId/${user.id}`,
        payload
      );
      return Object.keys(res.data)[0];
    } catch (error) {
      console.error('❌ Error updateAddress:', error);
      throw new Error(error.response?.data || error.message);
    }
  },

  // Xóa địa chỉ
  deleteAddress: async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('anta_user'));
      const res = await api.delete(
        `/api/address/delete/addressId/${id}/userId/${user.id}`
      );
      return res.data;
    } catch (error) {
      console.error('❌ Error deleteAddress:', error);
      throw new Error(error.response?.data || error.message);
    }
  },

  // ✅ Gọi API thật để đặt địa chỉ mặc định
setDefaultAddress: async (id) => {
  try {
    const user = JSON.parse(localStorage.getItem('anta_user'));
    const res = await api.put(`/api/address/setDefault/${id}/user/${user.id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error setDefaultAddress:', error);
    throw new Error(error.response?.data || error.message);
  }
},
};

// Order services - Using mock data
export const orderService = {
  getOrders: async (params = {}) => {
    try {
      return await mockUserService.orders.getOrders(params);
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi tải đơn hàng');
    }
  },

  getOrder: async (id) => {
    try {
      return await mockUserService.orders.getOrder(id);
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi tải chi tiết đơn hàng');
    }
  },

  cancelOrder: async (id) => {
    try {
      return await mockUserService.orders.cancelOrder(id);
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi hủy đơn hàng');
    }
  },
};

// Wishlist services - Using mock data
export const wishlistService = {
  getWishlist: async () => {
    try {
      return await mockUserService.wishlist.getWishlist();
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi tải danh sách yêu thích');
    }
  },

  addToWishlist: async (productId) => {
    try {
      return await mockUserService.wishlist.addToWishlist(productId);
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi thêm vào danh sách yêu thích');
    }
  },

  removeFromWishlist: async (id) => {
    try {
      return await mockUserService.wishlist.removeFromWishlist(id);
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi xóa khỏi danh sách yêu thích');
    }
  },
};

export default api;