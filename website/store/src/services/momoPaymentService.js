// src/services/momoPaymentService.js
// Unified MoMo payment service for frontend
// - If VITE_MOMO_SIMULATION === 'true' -> use local simulation (your existing logic)
// - Otherwise -> call backend endpoints (payment-service) via api instance

import { api } from "./api";

/**
 * ENV switches:
 * - import.meta.env.VITE_MOMO_SIMULATION === 'true'  -> use local simulation (dev)
 * - otherwise calls backend /api/payments/create and /api/payments/status/:requestId
 *
 * NOTE: If you import momoPaymentService from ../services (index.js), ensure index exports it:
 *   export { momoPaymentService } from './momoPaymentService';
 */

// -------------------- SIMULATION CLASS (adapted from your file) --------------------
class SimulatedMoMoPaymentService {
  constructor() {
    this.pendingPayments = new Map();
    this.completedPayments = new Map();
    this.SIMULATION_CONFIG = {
      qrScanDelay: 3000,
      paymentProcessDelay: 2000,
      successRate: 0.98,
    };
  }

  generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `MOMO${timestamp}${random}`.slice(0, 20);
  }

  createPaymentRequest(orderData) {
    const { total, orderNumber } = orderData;
    const transactionId = this.generateTransactionId();

    const paymentRequest = {
      transactionId,
      orderNumber,
      amount: total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      qrCodeData: this.generateQRCodeData(transactionId, total, orderNumber),
    };

    this.pendingPayments.set(transactionId, paymentRequest);

    return {
      success: true,
      data: paymentRequest,
    };
  }

  generateQRCodeData(transactionId, amount, orderNumber) {
    return {
      transactionId,
      phoneNumber: '0974945488',
      accountName: 'ANTA VIETNAM',
      amount,
      note: `ANTA ${orderNumber}`,
      bankCode: 'MOMO',
      // qrContent shape is simulated; real provider expects specific format
      qrContent: `2|99|0974945488|ANTA VIETNAM|${amount}|ANTA ${orderNumber}|0|0|${amount}`,
      // convenience: a simple visually-scannable payload for QR generation
    };
  }

  simulateQRScan(transactionId, onProgress) {
    return new Promise((resolve) => {
      const payment = this.pendingPayments.get(transactionId);

      if (!payment) {
        resolve({ success: false, error: 'Payment request not found' });
        return;
      }

      if (onProgress) onProgress({ status: 'scanning', message: 'Đang quét mã QR...' });

      setTimeout(() => {
        if (onProgress) onProgress({ status: 'detected', message: 'Đã phát hiện mã QR' });
        setTimeout(() => {
          if (onProgress) onProgress({ status: 'opening_app', message: 'Đang mở ứng dụng MoMo...' });
          resolve({ success: true });
        }, 1000);
      }, this.SIMULATION_CONFIG.qrScanDelay);
    });
  }

  processPayment(transactionId, onProgress) {
    return new Promise((resolve) => {
      const payment = this.pendingPayments.get(transactionId);

      if (!payment) {
        resolve({ success: false, error: 'Payment request not found' });
        return;
      }

      if (onProgress) onProgress({ status: 'processing', message: 'Đang xử lý thanh toán...' });

      setTimeout(() => {
        const isSuccess = Math.random() < this.SIMULATION_CONFIG.successRate;

        if (isSuccess) {
          payment.status = 'completed';
          payment.completedAt = new Date().toISOString();
          payment.momoTransactionId = `MT${Date.now()}`;

          this.completedPayments.set(transactionId, payment);
          this.pendingPayments.delete(transactionId);

          if (onProgress) onProgress({ status: 'success', message: 'Thanh toán thành công!' });

          resolve({
            success: true,
            data: {
              transactionId: payment.transactionId,
              momoTransactionId: payment.momoTransactionId,
              amount: payment.amount,
              completedAt: payment.completedAt,
            },
          });
        } else {
          payment.status = 'failed';
          payment.failedAt = new Date().toISOString();
          payment.errorMessage = 'Số dư không đủ';

          if (onProgress) onProgress({ status: 'failed', message: 'Thanh toán thất bại. Vui lòng thử lại.' });

          resolve({ success: false, error: 'Số dư không đủ hoặc giao dịch bị từ chối' });
        }
      }, this.SIMULATION_CONFIG.paymentProcessDelay);
    });
  }

  async autoProcessPayment(transactionId, onProgress) {
    const scanResult = await this.simulateQRScan(transactionId, onProgress);
    if (!scanResult.success) return scanResult;
    return await this.processPayment(transactionId, onProgress);
  }

  checkPaymentStatus(transactionId) {
    const pending = this.pendingPayments.get(transactionId);
    const completed = this.completedPayments.get(transactionId);

    if (completed) return { success: true, status: 'completed', data: completed };
    if (pending) return { success: true, status: pending.status, data: pending };
    return { success: false, status: 'not_found', error: 'Payment not found' };
  }

  cancelPayment(transactionId) {
    const payment = this.pendingPayments.get(transactionId);
    if (payment) {
      payment.status = 'cancelled';
      payment.cancelledAt = new Date().toISOString();
      this.pendingPayments.delete(transactionId);
      return { success: true, message: 'Payment cancelled' };
    }
    return { success: false, error: 'Payment not found or already completed' };
  }

  getPaymentDetails(transactionId) {
    return this.checkPaymentStatus(transactionId);
  }
}

// -------------------- REAL (backend-backed) SERVICE --------------------
class BackendMoMoPaymentService {
  constructor() {
    this.createEndpoint = "/api/payments/create";
    this.statusEndpoint = (requestId) => `/api/payments/status/${encodeURIComponent(requestId)}`;
  }

  // orderData shape should match backend expectation:
  // { orderId, userId, amount, items, customer, orderNumber, ... }
  async createPaymentRequest(orderData) {
    try {
      const res = await api.post(this.createEndpoint, orderData);
      // backend returns MomoFrontendResponse as described in backend changes
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err?.message || String(err) };
    }
  }

  async getPaymentStatus(requestId) {
    try {
      const res = await api.get(this.statusEndpoint(requestId));
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err?.message || String(err) };
    }
  }

  async autoProcessPayment(requestId, onProgress, opts = { interval: 3000, timeout: 120000 }) {
    const start = Date.now();
    while (Date.now() - start < opts.timeout) {
      if (onProgress) onProgress({ status: "polling" });
      const st = await this.getPaymentStatus(requestId);
      if (st.success && st.data) {
        const s = String(st.data.status || "").toUpperCase();
        if (s === "SUCCESS" || s === "PAID" || s === "COMPLETED") {
          if (onProgress) onProgress({ status: "success", message: "Thanh toán thành công (backend)" });
          return { success: true, data: st.data };
        }
        if (s === "FAILED") {
          if (onProgress) onProgress({ status: "failed", message: "Thanh toán thất bại (backend)" });
          return { success: false, error: "Payment failed" };
        }
      }
      await new Promise(r => setTimeout(r, opts.interval));
    }
    return { success: false, error: "Timeout waiting for payment" };
  }

  // convenience wrappers
  async cancelPayment(requestId) {
    // not implemented on backend by default; you can call a cancel endpoint if exists
    return { success: false, error: "Cancel not supported" };
  }

  getPaymentDetails(requestId) {
    return this.getPaymentStatus(requestId);
  }
}

// -------------------- EXPORT SINGLETON (choose impl by ENV) --------------------
const USE_SIM = String(import.meta.env.VITE_MOMO_SIMULATION || "").toLowerCase() === "true";

export const momoPaymentService = USE_SIM ? new SimulatedMoMoPaymentService() : new BackendMoMoPaymentService();

export default momoPaymentService;
