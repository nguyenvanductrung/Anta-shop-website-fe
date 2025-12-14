// src/services/momoPaymentService.js
// Unified MoMo payment service for frontend (improved for pending_payment handling)
import { api } from "./api";

/**
 * ENV switches:
 * - import.meta.env.VITE_MOMO_SIMULATION === 'true'  -> use local simulation (dev)
 * - otherwise calls backend endpoints (payment-service) via api instance
 */

// -------------------- SIMULATION CLASS (unchanged, minor cosmetic) --------------------
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

  async createPaymentRequest(orderData) {
    try {
      // Validate amount presence early — backend expects amount or total
      const providedAmount = orderData?.amount ?? orderData?.total ?? null;
      // If you prefer FE may allow backend to use orderId to compute amount,
      // you can comment this check out. But it's safer to ensure a numeric amount.
      if (providedAmount == null || Number.isNaN(Number(providedAmount))) {
        // Don't throw — return structured error so FE can show details
        return { success: false, error: 'Missing or invalid amount. Provide numeric "amount" or "total".', raw: orderData };
      }

      const res = await api.post(this.createEndpoint, orderData);
      // axios usually returns { data: ... }
      const rawResp = res && res.data ? res.data : res;

      const normalized = this._normalizeCreateResp(rawResp);

      // Logging for debug: include raw response when no useful field found
      if (!normalized.payUrl && !normalized.requestId) {
        console.warn('[momo] createPaymentRequest: no payUrl/requestId found', { normalized, rawResp });
      }

      // If payUrl exists, return (FE can redirect immediately)
      if (normalized.payUrl) {
        return {
          success: true,
          data: {
            payUrl: normalized.payUrl,
            requestId: normalized.requestId,
            orderId: normalized.orderId,
            raw: normalized.raw
          }
        };
      }

      // If requestId present (polling mode) -> FE can poll
      if (normalized.requestId) {
        return {
          success: true,
          data: {
            requestId: normalized.requestId,
            orderId: normalized.orderId,
            raw: normalized.raw
          }
        };
      }

      // fallback: if backend returned an object with payment info under .data
      if (rawResp && (rawResp.payUrl || rawResp.requestId || rawResp.transactionId)) {
        return { success: true, data: { ...rawResp } };
      }

      // else return a failure but include raw payload to help debugging
      return { success: false, error: 'Unexpected create-payment response shape', raw: normalized.raw || rawResp };
    } catch (err) {
      const payload = err?.response?.data || err?.message || String(err);
      console.error('[momo] createPaymentRequest error', payload);
      // Return structured error so FE can surface backend message
      return { success: false, error: payload, rawError: err?.response?.data ?? null };
    }
  }


  generateQRCodeData(transactionId, amount, orderNumber) {
    return {
      transactionId,
      phoneNumber: '0974945488',
      accountName: 'ANTA VIETNAM',
      amount,
      note: `ANTA ${orderNumber}`,
      bankCode: 'MOMO',
      qrContent: `2|99|0974945488|ANTA VIETNAM|${amount}|ANTA ${orderNumber}|0|0|${amount}`,
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

// -------------------- REAL (backend-backed) SERVICE (IMPROVED) --------------------
class BackendMoMoPaymentService {
  constructor() {
    this.createEndpoint = "/api/payments/create";
    this.statusEndpoint = (requestId) => `/api/payments/status/${encodeURIComponent(requestId)}`;
    this.orderEndpoint = (orderId) => `/api/orders/${encodeURIComponent(orderId)}`;
    // polling defaults
    this.DEFAULT_INTERVAL = 3000;
    this.DEFAULT_TIMEOUT = 120000;
  }

  // helper to normalize backend response shape
  _normalizeCreateResp(raw) {
    // raw may be:
    // - CreateMomoResponse: { requestId, orderId, payUrl, resultCode, message, ... }
    // - MomoFrontendResponse: { requestId, transactionId, amount, payUrl, ... }
    // - existing wrappers: { data: {...} } (if proxied)
    const obj = raw && raw.data ? raw.data : raw;
    if (!obj) return {};

    const payUrl = obj.payUrl || obj.data?.payUrl || obj.paymentUrl || obj.url || null;
    const requestId = obj.requestId || obj.transactionId || obj.request_id || (obj.data && (obj.data.requestId || obj.data.transactionId)) || null;
    const orderId = obj.orderId || obj.partnerOrderId || obj.data?.orderId || null;
    const resultCode = obj.resultCode ?? obj.result_code ?? null;
    const message = obj.message || obj.msg || obj.data?.message || null;

    return { raw: obj, payUrl, requestId, orderId, resultCode, message };
  }

  async createPaymentRequest(orderData) {
    try {
      const res = await api.post(this.createEndpoint, orderData);
      const normalized = this._normalizeCreateResp(res.data ?? res);

      // If payUrl exists, return immediately (FE can redirect)
      if (normalized.payUrl) {
        return { success: true, data: { payUrl: normalized.payUrl, requestId: normalized.requestId, orderId: normalized.orderId, raw: normalized.raw } };
      }

      // if requestId present, return it so FE can poll
      if (normalized.requestId) {
        return { success: true, data: { requestId: normalized.requestId, orderId: normalized.orderId, raw: normalized.raw } };
      }

      // fallback: return full raw response
      return { success: true, data: { raw: normalized.raw } };
    } catch (err) {
      const payload = err?.response?.data || err?.message || String(err);
      console.error('[momo] createPaymentRequest error', payload);
      return { success: false, error: payload };
    }
  }

  async getPaymentStatus(requestId) {
    try {
      const res = await api.get(this.statusEndpoint(requestId));
      // res.data expected { status: 'PENDING'|'SUCCESS'|'FAILED', paymentId, orderId, ...}
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data || err?.message || String(err) };
    }
  }

  // poll with optional fallback to check order endpoint
  async autoProcessPayment(requestId, orderId = null, onProgress = null, opts = {}) {
    const interval = opts.interval || this.DEFAULT_INTERVAL;
    const timeout = opts.timeout || this.DEFAULT_TIMEOUT;
    const start = Date.now();
    let attempt = 0;

    while (Date.now() - start < timeout) {
      attempt++;
      if (onProgress) onProgress({ status: 'polling', attempt });

      let st;
      try {
        st = await this.getPaymentStatus(requestId);
      } catch (e) {
        st = { success: false, error: e };
      }

      if (st.success && st.data) {
        const statusRaw = (st.data.status || st.data.result || st.data.resultCode || st.data.paymentStatus || '').toString().toUpperCase();
        // accept many synonyms
        if (['SUCCESS', 'PAID', 'COMPLETED', '0'].includes(statusRaw) || (st.data.resultCode !== undefined && Number(st.data.resultCode) === 0)) {
          if (onProgress) onProgress({ status: 'success', data: st.data });
          return { success: true, source: 'payment', data: st.data };
        }
        if (['FAILED', 'CANCELLED', 'ERROR'].includes(statusRaw) || (st.data.resultCode !== undefined && Number(st.data.resultCode) !== 0 && !['PENDING', '0'].includes(statusRaw))) {
          if (onProgress) onProgress({ status: 'failed', data: st.data });
          return { success: false, source: 'payment', data: st.data };
        }
        // otherwise still pending — continue
      }

      // fallback: if orderId known, check order endpoint (order service may be updated by payment-service)
      if (orderId) {
        try {
          if (onProgress) onProgress({ status: 'checking_order', orderId });
          const od = await api.get(this.orderEndpoint(orderId));
          const order = od.data;
          const orderStatus = (order && order.status) ? order.status.toString().toUpperCase() : null;
          if (['PAID', 'COMPLETED'].includes(orderStatus)) {
            if (onProgress) onProgress({ status: 'order_paid', order });
            return { success: true, source: 'order', data: order };
          }
          if (['FAILED', 'CANCELLED'].includes(orderStatus)) {
            if (onProgress) onProgress({ status: 'order_failed', order });
            return { success: false, source: 'order', data: order };
          }
        } catch (e) {
          // ignore — maybe order endpoint not reachable from FE (gateway)
        }
      }

      // sleep then retry
      await new Promise(r => setTimeout(r, interval));
    }

    // timed out — return pending result
    if (onProgress) onProgress({ status: 'timeout' });
    return { success: false, error: 'timeout waiting for payment' };
  }

  // convenience wrapper: create then wait for final status
  async createAndWaitForPayment(orderData, onProgress = null, opts = {}) {
    onProgress && onProgress({ status: 'creating' });
    const createRes = await this.createPaymentRequest(orderData);
    if (!createRes.success) {
      onProgress && onProgress({ status: 'create_failed', error: createRes.error });
      return createRes;
    }
    const data = createRes.data || {};
    // If payUrl present — FE can redirect or show QR immediately
    if (data.payUrl) {
      onProgress && onProgress({ status: 'payurl', payUrl: data.payUrl });
      // return immediately but still you may want to poll by requestId if available
      if (data.requestId) {
        // optionally wait in background
        return { success: true, data: { payUrl: data.payUrl, requestId: data.requestId, orderId: data.orderId } };
      }
      return { success: true, data: { payUrl: data.payUrl, orderId: data.orderId } };
    }

    // If requestId present — poll backend
    if (data.requestId) {
      onProgress && onProgress({ status: 'polling_start', requestId: data.requestId });
      const pollRes = await this.autoProcessPayment(data.requestId, data.orderId || orderData.orderId, onProgress, opts);
      // If pollRes indicates success or failure — return it
      return pollRes;
    }

    // else, unknown shape — return raw
    return { success: true, data: data.raw || createRes.data };
  }

  async cancelPayment(requestId) {
    // not implemented in backend by default — but FE can call custom endpoint if exists
    try {
      // try generic endpoint if exists
      const res = await api.post(`/api/payments/cancel/${encodeURIComponent(requestId)}`);
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: 'Cancel not supported' };
    }
  }

  getPaymentDetails(requestId) {
    return this.getPaymentStatus(requestId);
  }
}

// -------------------- EXPORT SINGLETON (choose impl by ENV) --------------------
const USE_SIM = String(import.meta.env.VITE_MOMO_SIMULATION || "").toLowerCase() === "true";

export const momoPaymentService = USE_SIM ? new SimulatedMoMoPaymentService() : new BackendMoMoPaymentService();

export default momoPaymentService;
