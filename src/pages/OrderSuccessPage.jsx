//src/pages/OrderSuccessPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Layout } from '../components';
import { useOrders } from '../contexts';
import { useToast } from '../components/ToastContainer';
import { STORAGE_KEYS } from '../constants';
import './OrderSuccessPage.css';
import { notificationService } from '../services/api';
import { useAuth, useUserData } from '../contexts';
// ---------- helper functions ----------
const isPaidStatus = (rawOrStatus) => {
  if (!rawOrStatus) return false;
  // rawOrStatus may be string or object
  const v = (typeof rawOrStatus === 'string')
    ? rawOrStatus
    : (rawOrStatus.status || rawOrStatus.paymentStatus || rawOrStatus.resultCode || rawOrStatus.payment_status || rawOrStatus.statusText || rawOrStatus.status_code || rawOrStatus.state || '');
  const s = String(v || '').toUpperCase();
  // accept many synonyms
  if (s === '0') return true; // momo result code 0
  return ['PAID', 'SUCCESS', 'COMPLETED', 'DONE', 'OK'].includes(s);
};

const extractDisplayOrderNumber = (raw) => {
  if (!raw) return '';
  // possible fields
  const cand = [raw.orderNumber, raw.orderId, raw.order_number, raw.id, raw.code, raw.orderNo, raw.order_no];
  for (const c of cand) {
    if (!c && c !== 0) continue;
    const s = String(c);
    // if partnerOrderId like "6-uuid", take numeric prefix
    if (s.includes('-')) {
      const prefix = s.split('-', 1)[0];
      if (/^\d+$/.test(prefix)) return prefix;
    }
    // if purely numeric string -> return
    if (/^\d+$/.test(s)) return s;
    // otherwise return the first non-empty candidate as fallback
    return s;
  }
  return '';
};
const normalizePaymentMethodKey = (m) => {
  if (!m) return 'cod';
  const s = String(m).toLowerCase();
  if (s.includes('momo')) return 'momo';
  if (s.includes('vnpay')) return 'vnpay';
  if (s.includes('zalopay')) return 'zalopay';
  if (s.includes('bank') || s.includes('transfer')) return 'bank';
  if (s.includes('cod') || s.includes('cash')) return 'cod';
  const mClean = s.match(/[a-z0-9]+/);
  return mClean ? mClean[0] : s;
};

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshOrders } = useOrders();
  const { showSuccess } = useToast();
  const [showAnimation, setShowAnimation] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const hasShownToast = useRef(false);
  const { user } = useAuth();
  const { profile } = useUserData();
  const sentOrderMailRef = useRef(false);
  useEffect(() => {
    const summary = location.state?.orderSummary;
    if (summary) {
      const summaryItems = (summary.items || []).map((it) => {
        const qty = Number(it.quantity ?? it.qty ?? it.count ?? 1) || 1;
        const unitPrice = Number(it.unitPrice ?? it.price ?? it.amount ?? 0) || 0;

        // ưu tiên nhiều field ảnh thường gặp
        const img =
          it.image ||
          it.imageUrl ||
          it.thumbnail ||
          it.img ||
          it.productImage ||
          it.product?.image ||
          it.product?.thumbnail ||
          '';

        return {
          ...it,
          quantity: qty,
          unitPrice,
          lineTotal: Number(it.lineTotal ?? it.total ?? (unitPrice * qty)) || (unitPrice * qty),
          image: img,
        };
      });
      setOrderData({
        orderNumber: summary.orderNumber,
        orderDate: summary.orderDate || new Date().toISOString(),
        items: summaryItems,
        subtotal: summary.subtotal || summaryItems.reduce((s, i) => s + (i.lineTotal || 0), 0),
        discount: summary.discount || 0,
        shipping: summary.shipping || 0,
        total: summary.total || Math.max(0, (summary.subtotal || 0) - (summary.discount || 0) + (summary.shipping || 0)),
        customer: summary.customer || {},
        raw: summary.raw || {}
      });
      setPaymentConfirmed(Boolean(location.state?.paymentConfirmed || summary.paymentConfirmed));
      setShowAnimation(true);          // ✅ FIX biến mất
      refreshOrders?.();               // ✅ optional
      if (!hasShownToast.current) {
        showSuccess?.('Đặt hàng thành công!');
        hasShownToast.current = true;
      }

      // skip the rest of normalization
      return;
    }

    // Try to get order data from location state first
    let raw = location.state?.orderData;
    if (!raw) {
      try {
        const userOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_ORDERS) || '[]');
        console.log('DEBUG_ORDER_FROM_STORAGE_LOAD', { STORAGE_KEYS_USER_ORDERS: STORAGE_KEYS.USER_ORDERS, userOrdersCount: userOrders.length });
        if (userOrders.length > 0) {
          raw = userOrders[0] ?? userOrders[userOrders.length - 1];
        }
      } catch (error) {
        console.error('Error loading order from localStorage:', error);
        raw = null;
      }
    }
    // If not in state, try to get the latest order from localStorage
    if (!raw) {
      try {
        const userOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_ORDERS) || '[]');
        if (userOrders.length > 0) {
          // Most recent order: assuming newest at index 0 (or last depending on how you saved)
          raw = userOrders[0] ?? userOrders[userOrders.length - 1];
        }
      } catch (error) {
        console.error('Error loading order from localStorage:', error);
        raw = null;
      }
    }

    if (!raw) {
      // nothing to do
      return;
    }

    // Normalize order object to a stable shape
    try {

      // --- REPLACE normalization block with this ---
      const buildAddressFromRaw = (r) => {
        const parts = [];
        // common single-string fallbacks
        if (r.shippingAddress) parts.push(r.shippingAddress);
        if (r.address) parts.push(r.address);
        if (r.detailedAddress) parts.push(r.detailedAddress);
        if (r.recipientAddress) parts.push(r.recipientAddress);
        // customer nested
        if (r.customer) {
          if (typeof r.customer === 'string') parts.push(r.customer);
          else {
            if (r.customer.address) parts.push(r.customer.address);
            if (r.customer.detailedAddress) parts.push(r.customer.detailedAddress);
            if (r.customer.street) parts.push(r.customer.street);
            if (r.customer.ward) parts.push(r.customer.ward);
            if (r.customer.district) parts.push(r.customer.district);
            if (r.customer.city) parts.push(r.customer.city);
          }
        }
        // separate fields
        if (r.street) parts.push(r.street);
        if (r.ward) parts.push(r.ward);
        if (r.district) parts.push(r.district);
        if (r.city) parts.push(r.city);
        // remove empties and join with comma
        const cleaned = parts.map(p => (p || '').toString().trim()).filter(Boolean);
        return cleaned.join(', ') || '';
      };

      // --- Thay thế toàn bộ getImageUrlFromCandidate + normalizeItem bằng khối này ---
      const rawFiles = Array.isArray(raw?.files) ? raw.files
        : Array.isArray(raw?.fileMetadata) ? raw.fileMetadata
          : Array.isArray(raw?.filesMetadata) ? raw.filesMetadata
            : Array.isArray(raw?.resources) ? raw.resources
              : Array.isArray(raw?.images) ? raw.images
                : [];

      /**
       * getImageUrlFromCandidate: cố gắng resolve nhiều dạng:
       * - absolute http(s), protocol-relative, relative (prefix origin)
       * - object.url/.src/.path/.thumbnail
       * - array -> dùng phần tử đầu
       * - numeric id / publicId -> lookup trong rawFiles
       */
      const getImageUrlFromCandidate = (cand) => {
        if (cand === null || cand === undefined) return '';

        // 1) String
        if (typeof cand === 'string') {
          const s = cand.trim();
          if (!s) return '';
          if (/^https?:\/\//i.test(s)) return s;
          if (/^\/\//.test(s)) return window.location.protocol + s;
          if (/^\//.test(s)) return window.location.origin + s;
          // numeric or publicId string -> lookup
          if (/^\d+$/.test(s) || /^[a-z0-9\-_]+$/i.test(s)) {
            const found = rawFiles.find(f =>
              String(f.id) === s ||
              String(f.fileId) === s ||
              String(f.publicId || f.public_id || '') === s
            );
            if (found) return getImageUrlFromCandidate(found.url || found.src || found.path || found.fileUrl || found.publicUrl || found.public_url);
          }
          return s;
        }

        // 2) Number -> lookup in rawFiles
        if (typeof cand === 'number') {
          const found = rawFiles.find(f => Number(f.id) === cand || Number(f.fileId) === cand);
          if (found) return getImageUrlFromCandidate(found.url || found.src || found.path || found.fileUrl);
          return '';
        }

        // 3) Object -> inspect common fields
        if (typeof cand === 'object') {
          const urlCandidates = [
            cand.url, cand.src, cand.image, cand.path, cand.fileUrl, cand.file_url,
            cand.imageUrl, cand.image_url, cand.thumbnail, cand.thumb, cand.publicUrl, cand.public_url
          ];
          for (const u of urlCandidates) {
            if (u) {
              const resolved = getImageUrlFromCandidate(u);
              if (resolved) return resolved;
            }
          }

          const arrKeys = ['images', 'files', 'media', 'resources', 'pictures', 'fileMetadata'];
          for (const k of arrKeys) {
            if (Array.isArray(cand[k]) && cand[k].length > 0) {
              const maybe = getImageUrlFromCandidate(cand[k][0]);
              if (maybe) return maybe;
            }
          }

          const publicId = cand.publicId || cand.public_id || cand.public;
          if (publicId && !cand.url) {
            const found = rawFiles.find(f => String(f.publicId) === String(publicId) || String(f.public_id) === String(publicId));
            if (found) return getImageUrlFromCandidate(found.url || found.src || found.path);
            return String(publicId);
          }

          if (cand.file && (cand.file.url || cand.file.path)) return getImageUrlFromCandidate(cand.file.url || cand.file.path);
          if (cand.file_metadata && cand.file_metadata.url) return getImageUrlFromCandidate(cand.file_metadata.url);

          const idLike = cand.id || cand.fileId || cand.file_id || cand.productId;
          if (idLike) {
            const found = rawFiles.find(f =>
              String(f.id) === String(idLike) ||
              String(f.fileId) === String(idLike) ||
              String(f.publicId || f.public_id || '') === String(idLike)
            );
            if (found) return getImageUrlFromCandidate(found.url || found.src || found.path || found.fileUrl);
          }
        }

        return '';
      };

      const normalizeItem = (it) => {
        if (!it) return null;

        const name = it.name || it.productName || it.title || it.product_name || (it.product && (it.product.name || it.product.title)) || '';

        let imageCandidate = it.image || it.productImage || it.product_image || it.thumbnail || it.imageUrl || it.img || it.picture || it.picture_url || it.fileUrl || it.file_url || it.mediaUrl || it.media_url;

        if (!imageCandidate && it.product) {
          imageCandidate = it.product.image || it.product.thumbnail || it.product.imageUrl || (Array.isArray(it.product.images) ? it.product.images[0] : null) || it.product.files?.[0];
        }

        if (!imageCandidate && it.variant) {
          imageCandidate = it.variant.image || it.variant.thumbnail || it.variant.images?.[0];
        }

        let resolvedImage = getImageUrlFromCandidate(imageCandidate || it || it.raw || it.product || it.files || it.images);

        if (!resolvedImage) {
          console.info('[OrderSuccessPage] IMAGE NOT RESOLVED for item -> kiểm tra item.raw bên dưới để debug');
          console.debug('[OrderSuccessPage] ITEM_RAW:', it);
        } else {
          console.debug('[OrderSuccessPage] RESOLVED IMAGE', { name, resolvedImage });
        }

        const image = resolvedImage || '';

        const sku = it.sku || it.variantSku || it.code || it.sku_code || (it.variant && it.variant.sku) || '';
        const size = it.size || it.variantSize || (it.attributes && (it.attributes.size || it.attributes.SIZE)) || (it.variant && it.variant.size) || '';
        const color = it.color || it.variantColor || (it.attributes && (it.attributes.color || it.attributes.COLOR)) || (it.variant && it.variant.color) || '';
        const quantity = Number(it.quantity ?? it.qty ?? it.count ?? 1);
        const unitPrice = Number(it.price ?? it.unitPrice ?? it.amount ?? it.unit_price ?? it.raw?.unitPrice ?? 0) || 0;
        const lineTotal = Number(it.lineTotal ?? it.total ?? unitPrice * quantity) || unitPrice * quantity;

        return {
          raw: it,
          productId: it.productId ?? it.product_id ?? it.product?.id ?? null,
          variantId: it.variantId ?? it.variant_id ?? it.variant?.id ?? null,
          name,
          image,
          sku,
          size,
          color,
          quantity,
          unitPrice,
          lineTotal
        };
      };


      // parse items from common shapes
      const itemsRaw = Array.isArray(raw.items) ? raw.items
        : Array.isArray(raw.products) ? raw.products
          : Array.isArray(raw.itemsOrdered) ? raw.itemsOrdered
            : Array.isArray(raw.orderItems) ? raw.orderItems
              : Array.isArray(raw.line_items) ? raw.line_items
                : Array.isArray(raw.order_lines) ? raw.order_lines
                  : (raw.orderItems && Array.isArray(raw.orderItems) ? raw.orderItems : []);

      const normalizedItems = (itemsRaw.map(normalizeItem).filter(Boolean));

      // compute subtotal from items (safer)
      const computedSubtotal = normalizedItems.reduce((s, it) => s + Number(it.lineTotal || (it.unitPrice * it.quantity) || 0), 0);
      const resolveEmail = (obj) => {
        if (!obj) return '';
        // phổ biến tên trường email ở nhiều shape khác nhau
        return obj.email ||
          obj.emailAddress ||
          obj.customerEmail ||
          obj.buyerEmail ||
          obj.payerEmail ||
          obj.payer_email ||
          obj.contact?.email ||
          obj.billing?.email ||
          obj.shipping?.email ||
          obj.customer?.email ||
          obj.user?.email ||
          // MoMo thường trả extraData (string) — thử parse nếu có
          (typeof obj.extraData === 'string' ? (() => {
            try {
              const parsed = JSON.parse(decodeURIComponent(obj.extraData || '') || obj.extraData);
              return parsed?.email || parsed?.buyerEmail || parsed?.payerEmail || '';
            } catch { return ''; }
          })() : '') ||
          '';
      };
      // build normalized order
      const normalized = {
        orderNumber: raw.orderNumber || raw.order_number || raw.orderNo || raw.order_no || '', orderDate: raw.orderDate || raw.date || raw.createdAt || raw.created_at || new Date().toISOString(),
        items: normalizedItems,
        subtotal: Number(raw.subtotal ?? raw.sub_total ?? computedSubtotal) || computedSubtotal,
        discount: Number(raw.discount ?? raw.promoDiscount ?? 0) || 0,
        shipping: Number(raw.shipping ?? raw.shippingFee ?? raw.shipping_cost ?? 0) || 0,
        total: Number(raw.total ?? raw.totalAmount ?? raw.amount ?? (computedSubtotal - (raw.discount || 0) + (raw.shipping || 0))) || Math.max(0, computedSubtotal - Number(raw.discount ?? 0) + Number(raw.shipping ?? 0)),
        promoCode: raw.promoCode ?? raw.promo ?? '',
        paymentMethod: normalizePaymentMethodKey(
          raw.paymentMethod ||
          raw.payment_method ||
          raw.payment ||
          (raw.customer && (raw.customer.paymentMethod || raw.customer.payment_method)) ||
          'cod'
        ), paymentStatus: raw.paymentStatus || raw.payment_status || raw.status || '',
        customer: {
          fullName: (raw.customer && (raw.customer.fullName || raw.customer.name)) || raw.customerName || raw.recipientName || raw.buyerName || 'Khách hàng',
          phone: (raw.customer && (raw.customer.phone || raw.customer.phoneNumber)) || raw.phone || raw.recipientPhone || '',
          email: resolveEmail(raw) || resolveEmail(raw.customer) || resolveEmail(raw.raw) || ''
        },
        raw
      };
      console.log('DEBUG_ORDER_NORMALIZED', {
        normalized,
        rawPreview: raw,
        displayOrderNumber: extractDisplayOrderNumber(normalized) || normalized.orderNumber,
        customerAddress: normalized.customer?.address,
        itemsPreview: normalized.items.map(i => ({ name: i.name, image: i.image, qty: i.quantity }))
      });

      // If subtotal is zero but items available, compute subtotal from items
      if ((!normalized.subtotal || normalized.subtotal === 0) && normalized.items.length > 0) {
        normalized.subtotal = normalized.items.reduce((s, it) => s + (Number(it.price || it.unitPrice || it.amount || 0) * Number(it.quantity || it.qty || 1)), 0);
      }
      // If total is zero compute from subtotal-discount+shipping
      if ((!normalized.total || normalized.total === 0)) {
        normalized.total = Math.max(0, normalized.subtotal - (normalized.discount || 0) + (normalized.shipping || 0));
      }

      setOrderData(normalized);

      // --- store latest order to localStorage for quick AccountPage display (fallback) ---
      try {
        const KEY = STORAGE_KEYS?.USER_ORDERS || 'anta_user_orders';
        const existing = JSON.parse(localStorage.getItem(KEY) || '[]');

        // unique by display order number (or id/orderNumber)
        const newKey = extractDisplayOrderNumber(normalized) || String(normalized.orderNumber || normalized.raw?.id || '');
        const next = [
          normalized,
          ...existing.filter(o => {
            const ok = extractDisplayOrderNumber(o) || String(o?.orderNumber || o?.raw?.id || o?.id || '');
            return ok !== newKey;
          })
        ].slice(0, 50);

        localStorage.setItem(KEY, JSON.stringify(next));
      } catch { }


      // paymentConfirmed: location.state explicit OR raw fields indicating paid
      const autoPaid = Boolean(
        location.state?.paymentConfirmed ||
        raw.paymentConfirmed ||
        isPaidStatus(raw.paymentStatus || raw.status || raw.payment_status) ||
        isPaidStatus(normalized.paymentStatus) ||
        isPaidStatus(raw) // generic check on raw object fields
      );
      setPaymentConfirmed(Boolean(autoPaid));

      refreshOrders?.();

      setShowAnimation(true);
      if (!hasShownToast.current) {
        showSuccess && showSuccess('Đặt hàng thành công!');
        hasShownToast.current = true;
      }
    } catch (err) {
      console.error('Error normalizing order data', err);
    }
  }, [location.state, refreshOrders, showSuccess]);

  useEffect(() => {
    if (!orderData) return;
    if (sentOrderMailRef.current) return;

    const orderNo = extractDisplayOrderNumber(orderData) || orderData.orderNumber || '';
    if (!orderNo) return;

    // ưu tiên email user đang đăng nhập
    let toEmail =
      profile?.email ||
      user?.email ||
      orderData?.customer?.email ||
      '';

    if (!toEmail) {
      try {
        const lsProfile = JSON.parse(localStorage.getItem('anta_user_profile') || 'null');
        toEmail = lsProfile?.email || '';
      } catch { }
    }
    if (!toEmail) return;

    // chống gửi trùng khi refresh
    const lsKey = `anta_sent_order_success_${orderNo}_${toEmail}`;
    if (localStorage.getItem(lsKey) === '1') {
      sentOrderMailRef.current = true;
      return;
    }

    sentOrderMailRef.current = true;

    notificationService.sendOrderSuccess({
      to: toEmail,
      orderNumber: orderNo,
      customerName: user?.username || 'bạn',
      total: Math.round(Number(orderData?.total || 0)),
      idempotencyKey: `order_success:${orderNo}:${toEmail}`,
    }).then(() => {
      try { localStorage.setItem(lsKey, '1'); } catch { }
    }).catch((e) => {
      console.warn('[OrderSuccessPage] sendOrderSuccess failed:', e);
      sentOrderMailRef.current = false;
    });

  }, [orderData, profile?.email, user?.email]);

  if (!orderData) {
    return (
      <Layout>
        <div className="order-success-page">
          <div className="page-container">
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h2>Không tìm thấy thông tin đơn hàng</h2>
              <p>Vui lòng kiểm tra lại hoặc liên hệ với chúng tôi để được hỗ trợ</p>
              <button className="primary-button" onClick={() => navigate('/home')}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const orderNumber = extractDisplayOrderNumber(orderData) || (orderData.orderNumber || orderData.raw?.orderNumber || '');
  const fullPartnerOrderId = (orderData.raw && (orderData.raw.orderId || orderData.raw.partnerOrderId || orderData.raw.order_id)) || null;

  const orderDate = new Date(orderData.orderDate || Date.now()).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const getPaymentMethodName = (method) => {
    const methods = {
      'cod': 'Thanh toán khi nhận hàng (COD)',
      'bank': 'Chuyển khoản ngân hàng',
      'momo': 'Ví điện tử MoMo',
      'vnpay': 'Cổng thanh toán VNPAY',
      'zalopay': 'Ví điện tử ZaloPay'
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'cod': '💵',
      'bank': '🏦',
      'momo': '📱',
      'vnpay': '💳',
      'zalopay': '💳'
    };
    return icons[method] || '💰';
  };
  const getPaidAmount = (order) => {
    if (!order) return 0;
    const candidates = [
      order.paidAmount,
      order.amountPaid,
      order.paymentAmount,
      order.paid,
      order.amount,
      order.total,
      order.raw?.amount,
      order.raw?.paidAmount,
      order.raw?.paymentAmount,
      order.raw?.amountPaid,
      order.raw?.totalAmount,
    ];
    for (const c of candidates) {
      const n = Number(c);
      if (!Number.isNaN(n) && n > 0) return Math.round(n);
    }
    return Math.round(order.total || 0);
  };

  const paymentMethod = normalizePaymentMethodKey(
    orderData.paymentMethod ||
    orderData.raw?.paymentMethod ||
    orderData.raw?.payment_method ||
    orderData.customer?.paymentMethod ||
    orderData.customer?.payment_method ||
    'cod'
  );
  return (
    <Layout>
      <div className="order-success-page">
        <div className="page-container">
          <div className={`success-hero ${showAnimation ? 'animate' : ''}`}>
            <div className="success-icon-wrapper">
              <svg className="success-icon" viewBox="0 0 52 52">
                <circle className="success-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h1 className="success-title">Đặt hàng thành công!</h1>
            <p className="success-subtitle">Cảm ơn bạn đã tin tưởng và mua sắm tại ANTA Việt Nam</p>
            <div className="order-number-display">
              <span className="order-label">Mã đơn hàng:</span>
              <span className="order-value">{orderData.orderNumber || 'N/A'}</span>
            </div>

          </div>

          <div className="order-timeline">
            <div className="timeline-item active">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Đơn hàng đã đặt</h4>
                <p>{orderDate}</p>
              </div>
            </div>
            <div className="timeline-line"></div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Đang xử lý</h4>
                <p>Chuẩn bị hàng</p>
              </div>
            </div>
            <div className="timeline-line"></div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Đang giao hàng</h4>
                <p>Dự kiến</p>
              </div>
            </div>
            <div className="timeline-line"></div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>Đã giao</h4>
                <p>{estimatedDelivery}</p>
              </div>
            </div>
          </div>

          <div className="order-sections">
            <div className="main-content">
              {/* --- PHƯƠNG THỨC THANH TOÁN (dynamic) --- */}
              <div className="info-card">
                <div className="card-header">
                  <h2>Phương thức thanh toán</h2>
                </div>
                <div className="card-body">
                  <div className="payment-display">
                    <span className="payment-icon-large">
                      {getPaymentMethodIcon(paymentMethod)}
                    </span>
                    <div className="payment-details">
                      <h4>{getPaymentMethodName(paymentMethod)}</h4>
                      {paymentMethod === 'cod' ? (
                        <p>Vui lòng chuẩn bị số tiền {(orderData.total || 0).toLocaleString()}₫ khi nhận hàng</p>
                      ) : paymentConfirmed ? (
                        <p className="payment-confirmed">✓ Đã xác nhận thanh toán thành công</p>
                      ) : (
                        <p className="payment-pending">⏳ Đang chờ xác nhận thanh toán</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>



              <div className="info-card">
                <div className="card-header">
                  <h2>CHI TIẾT ĐƠN HÀNG</h2>
                </div>
                <div className="info-card">
                  <div className="card-header">
                    <h2>Thông tin người nhận</h2>
                  </div>
                  <div className="card-body">
                    <div className="recipient-grid">
                      <div><strong>Người nhận:</strong></div><div>{orderData.customer.fullName || '—'}</div>
                      <div><strong>Số điện thoại:</strong></div><div>{orderData.customer.phone || '—'}</div>
                      <div><strong>Địa chỉ:</strong></div><div>{orderData.customer.detailedAddress || orderData.raw?.shippingAddress ||
                        orderData.customer.shippingAddress || orderData.customer.address ||
                        orderData.raw?.address || orderData.raw?.recipientAddress
                        || '—'}</div>
                      <div><strong>Email:</strong></div><div>{orderData.customer.email || orderData.email ||
                        orderData.raw?.email || '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="card-header">
                  <h2>SẢN PHẨM ĐÃ ĐẶT</h2>
                  <span className="item-count">{orderData.items.length} sản phẩm</span>
                </div>
                <div className="card-body">
                  <div className="product-list">
                    {(Array.isArray(orderData.items) ? orderData.items : []).map((item, index) => {
                      const qty = Number(item.quantity ?? 1);
                      const unitPrice = Number(item.unitPrice ?? item.price ?? 0) || 0;
                      const lineTotal = Number(item.lineTotal ?? unitPrice * qty) || unitPrice * qty;
                      return (
                        <div key={index} className="product-item">
                          <div className="product-image-wrapper">
                            <img
                              src={item.image || 'https://via.placeholder.com/100'}
                              alt={item.name}
                              className="product-image"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=No+Image'}
                            />
                            <span className="product-badge">{qty}</span>
                          </div>
                          <div className="product-info">
                            <h4 className="product-name">{item.name}</h4>
                            {(item.size || item.color) && (
                              <p className="product-attrs">
                                {item.size && `Size: ${item.size}`}
                                {item.size && item.color && ' • '}
                                {item.color && `Màu: ${item.color}`}
                              </p>
                            )}
                            <div className="product-pricing">
                              <span className="product-quantity">x{qty}</span>
                              <span className="product-price">{lineTotal.toLocaleString()}₫</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="card-header">
                  <h2>Phương thức thanh toán</h2>
                </div>
                <div className="card-body">
                  <div className="payment-display">
                    <span className="payment-icon-large">
                      {getPaymentMethodIcon(paymentMethod)}
                    </span>
                    <div className="payment-details">
                      <h4>{getPaymentMethodIcon(paymentMethod)}</h4>
                      {paymentMethod === 'cod' ? (
                        <p>Vui lòng chuẩn bị số tiền {orderData.total.toLocaleString()}₫ khi nhận hàng</p>
                      ) : paymentConfirmed ? (
                        <p className="payment-confirmed">✓ Đã xác nhận thanh toán thành công</p>
                      ) : (
                        <p className="payment-pending">⏳ Đang chờ xác nhận thanh toán</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-content">
              <div className="summary-card sticky">
                <div className="card-header">
                  <h2>Tóm tắt đơn hàng</h2>
                </div>
                <div className="card-body">
                  <div className="summary-list">
                    <div className="summary-item">
                      <span className="summary-label">Tạm tính</span>
                      <span className="summary-value">{(orderData.subtotal || 0).toLocaleString()}₫</span>
                    </div>
                    {orderData.discount > 0 && (
                      <div className="summary-item discount-item">
                        <span className="summary-label">
                          Giảm giá {orderData.promoCode && `(${orderData.promoCode})`}
                        </span>
                        <span className="summary-value discount-value">-{orderData.discount.toLocaleString()}₫</span>
                      </div>
                    )}
                    <div className="summary-item">
                      <span className="summary-label">Phí vận chuyển</span>
                      <span className="summary-value">
                        {orderData.shipping === 0 ? (
                          <span className="free-badge">Miễn phí</span>
                        ) : (
                          `${orderData.shipping.toLocaleString()}₫`
                        )}
                      </span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item total-item">
                      <span className="summary-label">Tổng cộng</span>
                      <span className="summary-value total-value">{(orderData.total || 0).toLocaleString()}₫</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="delivery-info-card">
                <div className="delivery-icon">🚚</div>
                <div className="delivery-text">
                  <h4>Giao hàng dự kiến</h4>
                  <p className="delivery-date">{estimatedDelivery}</p>
                  <p className="delivery-note">3-5 ngày làm việc</p>
                </div>
              </div>

              <div className="support-card">
                <h3>Cần hỗ trợ?</h3>
                <div className="support-item">
                  <span className="support-icon">📞</span>
                  <div className="support-details">
                    <span className="support-label">Hotline</span>
                    <a href="tel:0974945488" className="support-link">0363 537 601</a>
                  </div>
                </div>
                <div className="support-item">
                  <span className="support-icon">✉️</span>
                  <div className="support-details">
                    <span className="support-label">Email</span>
                    <a href="mailto:saleonline@anta.com" className="support-link">nguyenbavien.26092005@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="next-steps">
            <h2>Điều gì sẽ xảy ra tiếp theo?</h2>
            <div className="steps-grid">
              <div className="step-box">
                <div className="step-number">1</div>
                <div className="step-icon">📧</div>
                <h3>Xác nhận qua email</h3>
                <p>Chúng tôi đã gửi email xác nhận đơn hàng đến {orderData.customer.email || 'địa chỉ email của bạn'}</p>
              </div>
              <div className="step-box">
                <div className="step-number">2</div>
                <div className="step-icon">📦</div>
                <h3>Chuẩn bị đơn hàng</h3>
                <p>Chúng tôi đang kiểm tra và đóng gói sản phẩm cẩn thận cho bạn</p>
              </div>
              <div className="step-box">
                <div className="step-number">3</div>
                <div className="step-icon">🚚</div>
                <h3>Giao hàng đến bạn</h3>
                <p>Đơn vị vận chuyển sẽ liên hệ và giao hàng trong 3-5 ngày làm việc</p>
              </div>
            </div>
          </div>

          <div className="action-section">
            <button className="secondary-button" onClick={() => navigate('/home')}>
              <span>←</span>
              Tiếp tục mua sắm
            </button>
            <button className="primary-button" onClick={() => navigate('/account/orders')}>
              Theo dõi đơn hàng
              <span>→</span>
            </button>
          </div>

          <div className="trust-badges">
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Chính hãng 100%</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Đổi trả trong 30 ngày</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Bảo hành chính hãng</span>
            </div>
            <div className="badge-item">
              <span className="badge-icon">✓</span>
              <span className="badge-text">Miễn phí giao hàng</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
