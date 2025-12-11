//src/pages/OrderSuccessPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Layout } from '../components';
import { useOrders } from '../contexts';
import { useToast } from '../components/ToastContainer';
import { STORAGE_KEYS } from '../constants';
import './OrderSuccessPage.css';
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

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshOrders } = useOrders();
  const { showSuccess } = useToast();
  const [showAnimation, setShowAnimation] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Try to get order data from location state first
    let raw = location.state?.orderData;

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
      const normalized = {
        orderNumber: raw.orderNumber || raw.id || `ANT${Date.now().toString().slice(-8)}`,
        orderDate: raw.orderDate || raw.date || raw.createdAt || new Date().toISOString(),
        items: Array.isArray(raw.items)
          ? raw.items
          : Array.isArray(raw.products)
            ? raw.products
            : Array.isArray(raw.itemsOrdered)
              ? raw.itemsOrdered
              : [],
        subtotal: Number(raw.subtotal ?? raw.total ?? raw.totalAmount ?? 0),
        discount: Number(raw.discount ?? 0),
        shipping: Number(raw.shipping ?? 0),
        total: Number(raw.total ?? raw.totalAmount ?? raw.subtotal ?? 0),
        promoCode: raw.promoCode ?? raw.promo ?? '',

        // 👉 NEW: chuẩn hoá phương thức & trạng thái thanh toán
        paymentMethod:
          raw.paymentMethod ||
          raw.payment_method ||
          raw.payment ||
          (raw.customer && raw.customer.paymentMethod) ||
          'cod',
        paymentStatus:
          raw.paymentStatus ||
          raw.payment_status ||
          raw.status ||
          '',

        customer: {
          fullName:
            (raw.customer && (raw.customer.fullName || raw.customer.name)) ||
            raw.customer ||
            raw.customerName ||
            raw.customer_fullName ||
            'Khách hàng',
          phone:
            (raw.customer && (raw.customer.phone || raw.customer.phoneNumber)) ||
            raw.phone ||
            raw.customerPhone ||
            '',
          email:
            (raw.customer && raw.customer.email) ||
            raw.email ||
            '',
          address:
            (raw.customer && (raw.customer.address || raw.customer.detailedAddress)) ||
            raw.address ||
            raw.shippingAddress ||
            '',
          ward: (raw.customer && raw.customer.ward) || raw.ward || '',
          district: (raw.customer && raw.customer.district) || raw.district || '',
          city: (raw.customer && raw.customer.city) || raw.city || '',
          note: (raw.customer && raw.customer.note) || raw.note || ''
        },

        raw
      };


      // If subtotal is zero but items available, compute subtotal from items
      if ((!normalized.subtotal || normalized.subtotal === 0) && normalized.items.length > 0) {
        normalized.subtotal = normalized.items.reduce((s, it) => s + (Number(it.price || it.unitPrice || it.amount || 0) * Number(it.quantity || it.qty || 1)), 0);
      }
      // If total is zero compute from subtotal-discount+shipping
      if ((!normalized.total || normalized.total === 0)) {
        normalized.total = Math.max(0, normalized.subtotal - (normalized.discount || 0) + (normalized.shipping || 0));
      }

      setOrderData(normalized);

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
  const paymentMethod = orderData.paymentMethod
    || orderData.raw?.paymentMethod
    || orderData.customer?.paymentMethod
    || 'cod';
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
              <span className="order-value">{fullPartnerOrderId || orderData.orderNumber || 'N/A'}</span>
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


              <div className="info-card">
                <div className="card-header">
                  <h2>Sản phẩm đã đặt</h2>
                  <span className="item-count">{orderData.items.length} sản phẩm</span>
                </div>
                <div className="card-body">
                  <div className="product-list">
                    {(Array.isArray(orderData.items) ? orderData.items : []).map((item, index) => {
                      const qty = Number(item.quantity ?? item.qty ?? 1);
                      const unitPrice = Number(item.price ?? item.unitPrice ?? item.amount ?? 0);
                      const total = unitPrice * qty;
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
                              <span className="product-price">{total.toLocaleString()}₫</span>
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
                      {getPaymentMethodIcon(orderData.customer.paymentMethod)}
                    </span>
                    <div className="payment-details">
                      <h4>{getPaymentMethodName(orderData.customer.paymentMethod)}</h4>
                      {orderData.customer.paymentMethod === 'cod' ? (
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
                      <span className="summary-value">{orderData.subtotal.toLocaleString()}₫</span>
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
                      <span className="summary-value total-value">{orderData.total.toLocaleString()}₫</span>
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
                    <a href="tel:0974945488" className="support-link">0974 945 488</a>
                  </div>
                </div>
                <div className="support-item">
                  <span className="support-icon">✉️</span>
                  <div className="support-details">
                    <span className="support-label">Email</span>
                    <a href="mailto:saleonline@anta.com" className="support-link">saleonline@anta.com</a>
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
