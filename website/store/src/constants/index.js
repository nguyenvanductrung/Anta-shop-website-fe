//src/constants/index.js
export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ADMIN: '/admin',
  CART: '/cart',
  ACCOUNT: '/account',
  MEGA_SALE: '/collections/san-pham-mega-sale'
};

export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_URL || import.meta.env.VITE_PRODUCT_SERVICE_URL || 'http://localhost:8080',
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh-token'
  },
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: '/api/products/:id',
    SEARCH: '/api/products/search'
  },
  CART: {
    BASE: '/api/cart',
    ADD: '/api/cart/add',        // Gọi gateway → chuyển đến cart-service:8088
    CURRENT: '/api/cart/current',
    REMOVE_ITEM: '/api/cart/item/:itemId',
    CLEAR: '/api/cart/:cartId/clear',
    UPDATE_QUANTITY: '/api/cart/:cartId/items/quantity',
    MERGE: '/api/cart/merge'
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    CHANGE_PASSWORD: '/api/user/change-password',
    ADDRESSES: '/api/user/addresses',
    ADD_ADDRESS: '/api/user/addresses',
    UPDATE_ADDRESS: '/api/user/addresses/:id',
    DELETE_ADDRESS: '/api/user/addresses/:id',
    SET_DEFAULT_ADDRESS: '/api/user/addresses/:id/default'
  },
  ORDERS: {
    LIST: '/api/orders',
    DETAIL: '/api/orders/:id'
  },
  WISHLIST: {
    LIST: '/api/wishlist',
    ADD: '/api/wishlist/add',
    REMOVE: '/api/wishlist/remove/:id'
  },
  ADMIN: {
    PRODUCTS: {
      LIST: '/api/admin/products',
      CREATE: '/api/admin/products',
      UPDATE: '/api/admin/products/:id',
      DELETE: '/api/admin/products/:id',
      DETAIL: '/api/admin/products/:id'
    },
    ORDERS: {
      LIST: '/api/admin/orders',
      UPDATE: '/api/admin/orders/:id',
      DETAIL: '/api/admin/orders/:id',
      UPDATE_STATUS: '/api/admin/orders/:id/status'
    },
    MESSAGES: {
      LIST: '/api/admin/messages',
      DETAIL: '/api/admin/messages/:id',
      SEND: '/api/admin/messages',
      MARK_READ: '/api/admin/messages/:id/read'
    },
    NOTIFICATIONS: {
      LIST: '/api/admin/notifications',
      MARK_READ: '/api/admin/notifications/:id/read',
      MARK_ALL_READ: '/api/admin/notifications/read-all'
    },
    SETTINGS: {
      GET: '/api/admin/settings',
      UPDATE: '/api/admin/settings'
    },
    STATS: {
      DASHBOARD: '/api/admin/stats/dashboard',
      REVENUE_WEEKLY: '/api/dashboard/revenue/weekly'
    }
  }
};

export const STORAGE_KEYS = {
  TOKEN: 'anta_token',
  CART: 'anta_cart',
  USER: 'anta_user',
  USER_ORDERS: 'anta_user_orders',
  ADMIN_ORDERS: 'anta_admin_orders'
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

export const MENU_ITEMS = [
  { id: 1, name: "TRANG CHỦ", link: '/home' },
  { id: 2, name: "🔥 UP TO 50%", link: '/products', highlight: true },
  { id: 3, name: "HÀNG MỚI", link: '/new' },
  { id: 4, name: "ĐỘC QUYỀN ONLINE", link: '/exclusive' },
  // {
  //   id: 5,
  //   name: "NAM",
  //   link: '/men',
  //   hasDropdown: true,
  //   dropdown: [
  //     { title: "GIÀY NAM", items: ["Giày chạy", "Giày bóng rổ", "Giày lifestyle", "Giày đế bằng"] },
  //     { title: "QUẦN ÁO NAM", items: ["Áo thun", "Áo khoác", "Quần short", "Quần dài"] },
  //     { title: "BỘ SƯU TẬP", items: ["PG7 Nam", "Running", "Training", "Basketball"] }
  //   ]
  // },
  // {
  //   id: 6,
  //   name: "NỮ",
  //   link: '/women',
  //   hasDropdown: true,
  //   dropdown: [
  //     { title: "GIÀY NỮ", items: ["Giày chạy", "Giày lifestyle", "Giày thời trang"] },
  //     { title: "QUẦN ÁO NỮ", items: ["Áo thun", "Áo khoác", "Quần short", "Quần dài"] },
  //     { title: "BỘ SƯU TẬP", items: ["PG7 Nữ", "Running", "Training"] }
  //   ]
  // },
  // {
  //   id: 7,
  //   name: "PHỤ KIỆN",
  //   link: '/accessories',
  //   hasDropdown: true,
  //   dropdown: [
  //     { title: "TÚI & BALO", items: ["Balo thể thao", "Túi tote", "Túi đeo chéo"] },
  //     { title: "PHỤ KIỆN KHÁC", items: ["Tất, vớ", "Mũ, nón", "Vợt cầu lông", "Phụ kiện giày"] }
  //   ]
  // },
  // { id: 8, name: "KIDS", link: '/kids' }
];

export const ADMIN_MENU_ITEMS = [
  { id: 'products', label: 'Sản phẩm', icon: '🛒' },
  { id: 'shipping', label: 'Vận chuyển', icon: '📦' },
  { id: 'messages', label: 'Tin nhắn', icon: '💬', badge: 49 },
  { id: 'notifications', label: 'Thông báo', icon: '🔔' },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️' }
];
