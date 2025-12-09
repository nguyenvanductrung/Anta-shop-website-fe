// src/services/adminService.js
import * as _productModule from "./admin/productService";
import axios from "axios";

export const adminProductService = _productModule.adminProductService || _productModule.default || _productModule;

// Admin orders stored in localStorage for mock behavior
const ADMIN_ORDERS_KEY = "anta_admin_orders";
let mockOrders;
try {
  const stored = localStorage.getItem(ADMIN_ORDERS_KEY);
  mockOrders = stored ? JSON.parse(stored) : [
    {
      id: 1,
      customer: "Nguyễn Văn A",
      orderNumber: "2201223FJAOQ",
      date: "2024-12-25",
      total: 1000000,
      status: "needs-shipping",
      products: [
        {
          id: 1,
          name: "Giày ANTA KT7 - Đen",
          image:
            "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=80",
          price: 600000,
          quantity: 1,
          dueDate: "Trước 28/12/2024",
          shippingService: "J&T",
        },
      ],
    },
  ];
} catch (e) {
  mockOrders = [];
}
const saveAdminOrders = (orders) => {
  try { localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders)); } catch (e) { console.error(e); }
};

// simple mocks for messages/notifications/settings
let mockMessages = [{ id: 1, customer: "Nguyễn Văn A", subject: "Hỏi về sản phẩm", message: "Size 42 còn không?", time: "5 phút trước", date: new Date().toISOString(), read: false, replies: [] }];
let mockNotifications = [{ id: 1, type: "order", icon: "📦", title: "Đơn hàng mới", message: "Bạn có 1 đơn hàng mới cần xử lý", time: "5 phút trước", date: new Date().toISOString(), read: false }];
let mockSettings = { storeName: "ANTA Store", email: "admin@anta.com.vn", phone: "1900 xxxx", address: "Hà Nội, Việt Nam", notifications: { newOrders: true, messages: true, weeklyReport: false } };

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ----------------- Orders -----------------
export const adminOrderService = {
  getOrders: async (filters = {}) => {
    await delay();
    try {
      let list = [...mockOrders];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter((o) => (o.orderNumber || "").toLowerCase().includes(q) || (o.customer || "").toLowerCase().includes(q));
      }
      if (filters.status && filters.status !== "all") {
        list = list.filter((o) => o.status === filters.status);
      }
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      return { success: true, data: list };
    } catch (err) { return { success: false, error: err.message }; }
  },

  getOrder: async (id) => {
    await delay();
    const o = mockOrders.find((x) => String(x.id) === String(id));
    return o ? { success: true, data: o } : { success: false, error: "Không tìm thấy đơn hàng" };
  },

  createOrder: async (orderData) => {
    await delay();
    try {
      const newId = mockOrders.length ? Math.max(...mockOrders.map((o) => o.id)) + 1 : 1;
      const newOrder = {
        id: newId,
        customer: orderData.customer?.fullName || "Khách hàng",
        orderNumber: orderData.orderNumber || `ANT${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString().split("T")[0],
        total: orderData.total || 0,
        status: "needs-shipping",
        products: orderData.items || [],
      };
      mockOrders.unshift(newOrder);
      saveAdminOrders(mockOrders);
      return { success: true, data: newOrder, message: "Đơn hàng tạo thành công (mock)" };
    } catch (err) { return { success: false, error: err.message }; }
  },

  updateOrderStatus: async (id, status) => {
    await delay();
    const idx = mockOrders.findIndex((o) => String(o.id) === String(id));
    if (idx === -1) return { success: false, error: "Không tìm thấy đơn hàng" };
    mockOrders[idx].status = status;
    if (mockOrders[idx].products) {
      mockOrders[idx].products.forEach((p) => {
        if (status === "cancelled") { p.dueDate = "Đã hủy"; p.shippingService = "Đã hủy"; }
        else if (status === "completed") { p.dueDate = "Đã hoàn thành"; p.shippingService = "Đã giao"; }
        else if (status === "sent") { p.dueDate = "Đang giao hàng"; p.shippingService = p.shippingService || "Đang giao"; }
      });
    }
    saveAdminOrders(mockOrders);
    return { success: true, data: mockOrders[idx], message: "Cập nhật trạng thái thành công (mock)" };
  },

  arrangeShipping: async (orderId, shippingData) => {
    await delay();
    const idx = mockOrders.findIndex((o) => String(o.id) === String(orderId));
    if (idx === -1) return { success: false, error: "Không tìm thấy đơn hàng" };
    mockOrders[idx].status = "sent";
    mockOrders[idx].shippingInfo = shippingData;
    if (mockOrders[idx].products) {
      mockOrders[idx].products.forEach((p) => {
        p.dueDate = "Đang giao hàng";
        p.shippingService = shippingData.service || "J&T Express";
      });
    }
    saveAdminOrders(mockOrders);
    return { success: true, data: mockOrders[idx], message: "Sắp xếp giao hàng thành công (mock)" };
  },
};

// ----------------- Messages -----------------
export const adminMessageService = {
  getMessages: async (filters = {}) => { await delay(); let list = [...mockMessages]; if (filters.unreadOnly) list = list.filter(m => !m.read); return { success: true, data: list }; },
  getMessage: async (id) => { await delay(); const m = mockMessages.find(x => String(x.id) === String(id)); return m ? { success: true, data: m } : { success: false, error: "Không tìm thấy tin nhắn" }; },
  markAsRead: async (id) => { await delay(); const idx = mockMessages.findIndex(m => String(m.id) === String(id)); if (idx === -1) return { success: false, error: "Không tìm thấy tin nhắn" }; mockMessages[idx].read = true; return { success: true, data: mockMessages[idx] }; },
  replyToMessage: async (id, replyText) => { await delay(); const idx = mockMessages.findIndex(m => String(m.id) === String(id)); if (idx === -1) return { success: false, error: "Không tìm thấy tin nhắn" }; const reply = { id: mockMessages[idx].replies.length + 1, sender: "admin", message: replyText, time: "Vừa xong" }; mockMessages[idx].replies.push(reply); mockMessages[idx].read = true; return { success: true, data: mockMessages[idx], message: "Gửi phản hồi thành công" }; }
};

// ----------------- Notifications -----------------
export const adminNotificationService = {
  getNotifications: async (filters = {}) => { await delay(); let list = [...mockNotifications]; if (filters.unreadOnly) list = list.filter(n => !n.read); return { success: true, data: list }; },
  markAsRead: async (id) => { await delay(); const idx = mockNotifications.findIndex(n => String(n.id) === String(id)); if (idx === -1) return { success: false, error: "Không tìm thấy thông báo" }; mockNotifications[idx].read = true; return { success: true, data: mockNotifications[idx] }; },
  markAllAsRead: async () => { await delay(); mockNotifications.forEach(n => n.read = true); return { success: true, message: "Đã đánh dấu tất cả thông báo là đã đọc" }; }
};

// ----------------- Stats (dashboard) -----------------
export const adminStatsService = {
  getDashboardStats: async () => {
    await delay();
    try {
      const prodRes = await adminProductService.getProducts();
      const products = prodRes?.success ? prodRes.data : [];
      const stats = {
        totalProducts: products.length,
        totalOrders: mockOrders.length,
        newOrders: mockOrders.filter((o) => o.status === "needs-shipping").length,
        completedOrders: mockOrders.filter((o) => o.status === "completed").length,
        totalRevenue: mockOrders.reduce((s, o) => s + (o.total || 0), 0),
        totalCustomers: new Set(mockOrders.map((o) => o.customer)).size,
        unreadMessages: mockMessages.filter((m) => !m.read).length,
        unreadNotifications: mockNotifications.filter((n) => !n.read).length,
        lowStockProducts: products.filter((p) => (p.totalStock ?? p.quantity ?? p.stock ?? 0) < 20).length,
      };
      return { success: true, data: stats };
    } catch (err) { return { success: false, error: err.message }; }
  },
};

// ----------------- Settings -----------------
export const adminSettingsService = {
  getSettings: async () => { await delay(); return { success: true, data: mockSettings }; },
  updateSettings: async (data) => { await delay(); mockSettings = { ...mockSettings, ...data }; return { success: true, data: mockSettings, message: "Lưu cài đặt thành công (mock)" }; }
};

export default {
  products: adminProductService,
  orders: adminOrderService,
  messages: adminMessageService,
  notifications: adminNotificationService,
  settings: adminSettingsService,
  stats: adminStatsService,
};
