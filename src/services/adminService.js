import * as _productModule from "./admin/productService";
import axios from "axios";

export const adminProductService =
  _productModule.adminProductService || _productModule.default || _productModule;

// ✅ baseURL giống cách bạn làm trước đó
const API_BASE = import.meta.env.VITE_API_URL

const API = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const t =
    localStorage.getItem("anta_admin_token") ||
    localStorage.getItem("anta_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});


const ADMIN_ORDERS_KEY = "anta_admin_orders";
let mockOrders = [];
try {
  const stored = localStorage.getItem(ADMIN_ORDERS_KEY);
  mockOrders = stored ? JSON.parse(stored) : [];
} catch { mockOrders = []; }

const saveAdminOrders = (orders) => {
  try { localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders)); } catch { }
};


// simple mocks for messages/notifications/settings
let mockMessages = [{ id: 1, customer: "Nguyễn Văn A", subject: "Hỏi về sản phẩm", message: "Size 42 còn không?", time: "5 phút trước", date: new Date().toISOString(), read: false, replies: [] }];
let mockNotifications = [{ id: 1, type: "order", icon: "📦", title: "Đơn hàng mới", message: "Bạn có 1 đơn hàng mới cần xử lý", time: "5 phút trước", date: new Date().toISOString(), read: false }];
let mockSettings = { storeName: "ANTA Store", email: "admin@anta.com.vn", phone: "1900 xxxx", address: "Hà Nội, Việt Nam", notifications: { newOrders: true, messages: true, weeklyReport: false } };

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const mapStatusToMock = (status) => {
  if (!status) return status;
  const s = String(status).trim();

  // giữ nguyên nếu đã là mock status
  const lower = s.toLowerCase();
  if (['all', 'needs-shipping', 'sent', 'completed', 'cancelled', 'unpaid', 'return', 'confirmed'].includes(lower)) {
    return lower;
  }

  // map enum BE -> mock status
  const upper = s.toUpperCase();
  if (upper === 'PENDING') return 'needs-shipping';
  if (upper === 'CONFIRMED') return 'confirmed';     // ✅ thêm trạng thái mới trong mock
  if (upper === 'SHIPPED') return 'sent';
  if (upper === 'DELIVERED') return 'completed';
  if (upper === 'CANCELLED' || upper === 'CANCELED') return 'cancelled';

  // payment statuses (nếu có)
  if (upper === 'PENDING_PAYMENT') return 'unpaid';
  if (upper === 'PAID') return 'paid';
  if (upper === 'FAILED') return 'failed';

  return lower;
};
export const adminOrderService = {
  // ✅ GET /api/orders/admin/all
  getOrders: async (filters = {}) => {
    try {
      const params = {};

      // search
      if (filters.search) params.search = String(filters.search).trim();

      // status: ALL thì bỏ param, còn lại gửi đúng enum BE
      if (filters.status && String(filters.status).toUpperCase() !== "ALL") {
        params.status = String(filters.status).toUpperCase();
      }

      // orderNumber nếu có
      if (filters.orderNumber) params.orderNumber = String(filters.orderNumber).trim();

      // userId (nếu admin muốn lọc theo user)
      if (filters.userId != null) params.userId = Number(filters.userId);

      // baseURL đang là "/api" => gọi "/orders" sẽ thành "/api/orders" ✅
      const res = await API.get("/api/orders", { params });

      let list = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      // sort mới nhất lên đầu (hỗ trợ nhiều field)
      list.sort(
        (a, b) =>
          new Date(b.createdAt || b.created_at || b.date || 0) -
          new Date(a.createdAt || a.created_at || a.date || 0)
      );

      return { success: true, data: list };
    } catch (e) {
      // fallback mock nếu API fail
      await delay();
      return { success: true, data: [...mockOrders] };
    }
  },

  // ✅ PUT /api/orders/{id}/status body: { status: "CONFIRMED" }
  updateOrderStatus: async (id, status) => {
    try {
      // baseURL "/api" + "/orders/.." => "/api/orders/.." ✅
      const res = await API.put(`/api/orders/${id}/status`, {
        status: String(status || "").toUpperCase(),
      });
      return { success: true, data: res.data, message: "Cập nhật trạng thái thành công" };
    } catch (e) {
      await delay();
      const idx = mockOrders.findIndex((o) => String(o.id) === String(id));
      if (idx === -1) return { success: false, error: "Không tìm thấy đơn hàng (mock)" };
      mockOrders[idx].status = String(status || "");
      saveAdminOrders(mockOrders);
      return { success: true, data: mockOrders[idx], message: "Cập nhật trạng thái thành công (mock)" };
    }
  },
  cancelOrderAdmin: async (id) => {
    try {
      const res = await API.post(`/api/orders/${id}/cancel-admin`);
      return { success: true, data: res.data, message: res.data?.message || "OK" };
    } catch (e) {
      await delay();
      // mock fallback: chuyển CANCELLED
      const idx = mockOrders.findIndex((o) => String(o.id) === String(id));
      if (idx === -1) return { success: false, error: "Không tìm thấy đơn hàng (mock)" };

      const wasPaid = String(mockOrders[idx].status || "").toUpperCase() === "PAID";
      mockOrders[idx].status = "CANCELLED";
      mockOrders[idx].refundRequested = wasPaid;
      saveAdminOrders(mockOrders);

      return {
        success: true,
        data: { deleted: false, refundRequested: wasPaid, message: wasPaid ? "Đã ghi nhận yêu cầu hoàn lại tiền (mock)" : "Đã hủy đơn (mock)" }
      };
    }
  },

  deleteOrderAdmin: async (id) => {
    try {
      const res = await API.delete(`/api/orders/${id}`);
      return { success: true, data: res.data, message: res.data?.message || "OK" };
    } catch (e) {
      await delay();
      // mock fallback: nếu PAID => refund request, nếu không => xóa
      const idx = mockOrders.findIndex((o) => String(o.id) === String(id));
      if (idx === -1) return { success: false, error: "Không tìm thấy đơn hàng (mock)" };

      const wasPaid = String(mockOrders[idx].status || "").toUpperCase() === "PAID";
      if (wasPaid) {
        mockOrders[idx].status = "CANCELLED";
        mockOrders[idx].refundRequested = true;
      } else {
        mockOrders.splice(idx, 1);
      }
      saveAdminOrders(mockOrders);

      return {
        success: true,
        data: { deleted: !wasPaid, refundRequested: wasPaid, message: wasPaid ? "Chuyển sang yêu cầu hoàn tiền (mock)" : "Đã xóa đơn (mock)" }
      };
    }
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
