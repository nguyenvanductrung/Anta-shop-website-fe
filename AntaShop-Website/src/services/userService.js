// Mock User Service với dữ liệu hardcode + localStorage
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'anta_user_profile',
  USER_ORDERS: 'anta_user_orders',
  USER_WISHLIST: 'anta_user_wishlist',
  USER_ADDRESSES: 'anta_user_addresses'
};

// Default hardcoded data
const DEFAULT_PROFILE = {
  fullName: 'Nguyễn Văn A',
  email: 'user@anta.com',
  phone: '0123456789',
  birthday: '1990-01-01',
  gender: 'male'
};

const DEFAULT_ORDERS = [
  {
    id: 'ORD001',
    orderNumber: 'ORD001',
    date: '2024-01-15',
    createdAt: '2024-01-15T10:30:00',
    status: 'Đã giao',
    total: 2990000,
    totalAmount: 2990000,
    items: 2,
    totalItems: 2,
    image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
    products: [
      {
        id: 1,
        name: 'Giày ANTA KT7 - Đen',
        image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
        price: 2990000,
        quantity: 1
      }
    ]
  },
  {
    id: 'ORD002',
    orderNumber: 'ORD002',
    date: '2024-01-20',
    createdAt: '2024-01-20T14:20:00',
    status: 'Đang giao',
    total: 1790000,
    totalAmount: 1790000,
    items: 1,
    totalItems: 1,
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
    products: [
      {
        id: 2,
        name: 'Giày ANTA C202 GT - Xanh',
        image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
        price: 1790000,
        quantity: 1
      }
    ]
  },
  {
    id: 'ORD003',
    orderNumber: 'ORD003',
    date: '2024-01-25',
    createdAt: '2024-01-25T09:15:00',
    status: 'Đang xử lý',
    total: 1049000,
    totalAmount: 1049000,
    items: 2,
    totalItems: 2,
    image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
    products: [
      {
        id: 3,
        name: 'Áo thun ANTA Running - Trắng',
        image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
        price: 599000,
        quantity: 1
      },
      {
        id: 4,
        name: 'Quần short ANTA Training',
        image: 'https://images.pexels.com/photos/7432926/pexels-photo-7432926.jpeg?auto=compress&cs=tinysrgb&w=400',
        price: 450000,
        quantity: 1
      }
    ]
  },
  {
    id: 'ORD004',
    orderNumber: 'ORD004',
    date: '2024-02-01',
    createdAt: '2024-02-01T16:45:00',
    status: 'Đã hủy',
    total: 890000,
    totalAmount: 890000,
    items: 1,
    totalItems: 1,
    image: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=400',
    products: [
      {
        id: 5,
        name: 'Balo ANTA Sport - Đen',
        image: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=400',
        price: 890000,
        quantity: 1
      }
    ]
  }
];

const DEFAULT_WISHLIST = [
  {
    id: 1,
    productId: 101,
    name: 'Giày ANTA KT8 - Trắng',
    image: 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 3290000,
    originalPrice: 3990000,
    inStock: true,
    product: {
      id: 101,
      name: 'Giày ANTA KT8 - Trắng',
      image: 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=400',
      price: 3290000
    }
  },
  {
    id: 2,
    productId: 102,
    name: 'Áo khoác ANTA Wind Breaker',
    image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 1290000,
    originalPrice: 1590000,
    inStock: true,
    product: {
      id: 102,
      name: 'Áo khoác ANTA Wind Breaker',
      image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
      price: 1290000
    }
  },
  {
    id: 3,
    productId: 103,
    name: 'Giày ANTA Running Flash',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 1990000,
    inStock: false,
    product: {
      id: 103,
      name: 'Giày ANTA Running Flash',
      image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
      price: 1990000
    }
  }
];

const DEFAULT_ADDRESSES = [
  {
    id: 1,
    recipientName: 'Nguyễn Văn A',
    phone: '0123456789',
    address: '123 Đường Láng, Đống Đa, Hà Nội',
    isDefault: true
  },
  {
    id: 2,
    recipientName: 'Nguyễn Văn A',
    phone: '0987654321',
    address: '456 Trần Duy Hưng, Cầu Giấy, Hà Nội',
    isDefault: false
  }
];

// Helper functions to get/set data from localStorage
const getFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Initialize data in localStorage if not exists
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USER_PROFILE)) {
    setToStorage(STORAGE_KEYS.USER_PROFILE, DEFAULT_PROFILE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_ORDERS)) {
    setToStorage(STORAGE_KEYS.USER_ORDERS, DEFAULT_ORDERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_WISHLIST)) {
    setToStorage(STORAGE_KEYS.USER_WISHLIST, DEFAULT_WISHLIST);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_ADDRESSES)) {
    setToStorage(STORAGE_KEYS.USER_ADDRESSES, DEFAULT_ADDRESSES);
  }
};

// Initialize storage on module load
initializeStorage();

// User Profile Service
export const userProfileService = {
  getProfile: async () => {
    await delay();
    return getFromStorage(STORAGE_KEYS.USER_PROFILE, DEFAULT_PROFILE);
  },

  updateProfile: async (profileData) => {
    await delay();
    const currentProfile = getFromStorage(STORAGE_KEYS.USER_PROFILE, DEFAULT_PROFILE);
    const updatedProfile = { ...currentProfile, ...profileData };
    setToStorage(STORAGE_KEYS.USER_PROFILE, updatedProfile);
    return updatedProfile;
  },

  changePassword: async (passwordData) => {
    await delay();
    // Mock validation
    if (passwordData.currentPassword !== 'password123') {
      throw new Error('Mật khẩu hiện tại không đúng');
    }
    if (passwordData.newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    // In a real app, would save the new password
    return { message: 'Đổi mật khẩu thành công' };
  }
};

// Order Service
export const userOrderService = {
  getOrders: async (params = {}) => {
    await delay();
    return getFromStorage(STORAGE_KEYS.USER_ORDERS, DEFAULT_ORDERS);
  },

  getOrder: async (id) => {
    await delay();
    const orders = getFromStorage(STORAGE_KEYS.USER_ORDERS, DEFAULT_ORDERS);
    const order = orders.find(o => o.id === id);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }
    return order;
  },

  cancelOrder: async (id) => {
    await delay();

    // Update user orders
    const orders = getFromStorage(STORAGE_KEYS.USER_ORDERS, DEFAULT_ORDERS);
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // Check if order can be cancelled
    const order = orders[orderIndex];
    const status = order.status.toLowerCase();
    if (status !== 'đang xử lý' && status !== 'processing' && status !== 'chờ xử lý') {
      throw new Error('Đơn hàng này không thể hủy');
    }

    // Update user order status
    orders[orderIndex].status = 'Đã hủy';
    setToStorage(STORAGE_KEYS.USER_ORDERS, orders);

    // Sync with admin orders
    try {
      const ADMIN_ORDERS_KEY = 'anta_admin_orders';
      const adminOrders = JSON.parse(localStorage.getItem(ADMIN_ORDERS_KEY) || '[]');

      // Find matching admin order by orderNumber or id
      const adminOrderIndex = adminOrders.findIndex(ao =>
        ao.orderNumber === (order.orderNumber || order.id) ||
        ao.id === order.id ||
        ao.orderNumber === order.id
      );

      if (adminOrderIndex !== -1) {
        adminOrders[adminOrderIndex].status = 'cancelled';
        // Update product status as well
        if (adminOrders[adminOrderIndex].products) {
          adminOrders[adminOrderIndex].products.forEach(p => {
            p.dueDate = 'Đ�� hủy';
            p.shippingService = 'Đã hủy';
          });
        }
        localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(adminOrders));

        // Trigger storage event for admin dashboard
        window.dispatchEvent(new StorageEvent('storage', {
          key: ADMIN_ORDERS_KEY,
          newValue: JSON.stringify(adminOrders),
          url: window.location.href
        }));
      }
    } catch (error) {
      console.error('Error syncing with admin orders:', error);
      // Don't throw - user order was cancelled successfully
    }

    return { message: 'Hủy đơn hàng thành công' };
  }
};

// Wishlist Service
export const userWishlistService = {
  getWishlist: async () => {
    await delay();
    return getFromStorage(STORAGE_KEYS.USER_WISHLIST, DEFAULT_WISHLIST);
  },

  addToWishlist: async (productId) => {
    await delay();
    const wishlist = getFromStorage(STORAGE_KEYS.USER_WISHLIST, DEFAULT_WISHLIST);
    const maxId = wishlist.reduce((max, item) => Math.max(max, item.id), 0);
    const newItem = {
      id: maxId + 1,
      productId,
      name: 'Sản phẩm mới',
      image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
      price: 1000000,
      inStock: true,
      product: {
        id: productId,
        name: 'Sản ph���m mới',
        image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
        price: 1000000
      }
    };
    wishlist.push(newItem);
    setToStorage(STORAGE_KEYS.USER_WISHLIST, wishlist);
    return newItem;
  },

  removeFromWishlist: async (id) => {
    await delay();
    const wishlist = getFromStorage(STORAGE_KEYS.USER_WISHLIST, DEFAULT_WISHLIST);
    const filteredWishlist = wishlist.filter(item => item.id !== parseInt(id));
    if (filteredWishlist.length === wishlist.length) {
      throw new Error('Không tìm thấy sản phẩm');
    }
    setToStorage(STORAGE_KEYS.USER_WISHLIST, filteredWishlist);
    return { message: 'Đã xóa khỏi danh sách yêu thích' };
  }
};

// Address Service
export const userAddressService = {
  getAddresses: async () => {
    await delay();
    return getFromStorage(STORAGE_KEYS.USER_ADDRESSES, DEFAULT_ADDRESSES);
  },

  addAddress: async (addressData) => {
    await delay();
    const addresses = getFromStorage(STORAGE_KEYS.USER_ADDRESSES, DEFAULT_ADDRESSES);
    const maxId = addresses.reduce((max, addr) => Math.max(max, addr.id), 0);
    
    // If set as default, remove default from others
    if (addressData.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    const newAddress = {
      id: maxId + 1,
      ...addressData
    };
    
    addresses.push(newAddress);
    setToStorage(STORAGE_KEYS.USER_ADDRESSES, addresses);
    return newAddress;
  },

  updateAddress: async (id, addressData) => {
    await delay();
    const addresses = getFromStorage(STORAGE_KEYS.USER_ADDRESSES, DEFAULT_ADDRESSES);
    const index = addresses.findIndex(addr => addr.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Không tìm thấy địa chỉ');
    }
    
    // If set as default, remove default from others
    if (addressData.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    addresses[index] = { ...addresses[index], ...addressData };
    setToStorage(STORAGE_KEYS.USER_ADDRESSES, addresses);
    return addresses[index];
  },

  deleteAddress: async (id) => {
    await delay();
    const addresses = getFromStorage(STORAGE_KEYS.USER_ADDRESSES, DEFAULT_ADDRESSES);
    const filteredAddresses = addresses.filter(addr => addr.id !== parseInt(id));
    
    if (filteredAddresses.length === addresses.length) {
      throw new Error('Không tìm thấy địa chỉ');
    }
    
    setToStorage(STORAGE_KEYS.USER_ADDRESSES, filteredAddresses);
    return { message: 'Xóa địa chỉ thành công' };
  },

  setDefaultAddress: async (id) => {
    await delay();
    const addresses = getFromStorage(STORAGE_KEYS.USER_ADDRESSES, DEFAULT_ADDRESSES);
    addresses.forEach(addr => {
      addr.isDefault = addr.id === parseInt(id);
    });
    setToStorage(STORAGE_KEYS.USER_ADDRESSES, addresses);
    return { message: 'Đã đặt làm địa chỉ mặc định' };
  }
};

// Export utility function to reset all data to defaults
export const resetUserData = () => {
  setToStorage(STORAGE_KEYS.USER_PROFILE, DEFAULT_PROFILE);
  setToStorage(STORAGE_KEYS.USER_ORDERS, DEFAULT_ORDERS);
  setToStorage(STORAGE_KEYS.USER_WISHLIST, DEFAULT_WISHLIST);
  setToStorage(STORAGE_KEYS.USER_ADDRESSES, DEFAULT_ADDRESSES);
};

export default {
  profile: userProfileService,
  orders: userOrderService,
  wishlist: userWishlistService,
  addresses: userAddressService,
  resetUserData
};
