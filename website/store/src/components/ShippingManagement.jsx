import React, { useState, useEffect, useMemo } from 'react';
import adminService from '../services/adminService';
import './ShippingManagement.css';

// ===== helpers =====
// ===== helpers =====
const getOrderId = (o) => o?.id ?? o?.orderId ?? o?._id;

const getOrderNumber = (o) =>
  String(o?.orderNumber ?? o?.order_number ?? o?.orderNo ?? o?.order_no ?? '');

const getCustomerName = (o) =>
  o?.buyerName || o?.recipientName || o?.customerName || o?.customer || o?.userName || '—';

const getEmail = (o) =>
  o?.buyerEmail || o?.buyer_email || o?.email || o?.customerEmail || o?.customer?.email || '—';

const getPhone = (o) =>
  o?.recipientPhone || o?.recipient_phone || o?.phoneNumber || o?.phone || o?.customer?.phone || '—';

const getAddress = (o) =>
  o?.shippingAddress || o?.shipping_address || o?.recipientAddress || o?.address || o?.detailedAddress || '—';

const getOrderTotal = (o) => {
  const v = o?.totalAmount ?? o?.total ?? o?.amount ?? o?.total_amount;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const isPaidRaw = (o) => String(o?.status || '').toUpperCase() === 'PAID';
const isRefundRequested = (o) => Boolean(o?.refundRequested);
const normalizeStatus = (raw) => {
  const s = String(raw || '').toUpperCase();

  // mock cũ
  if (s === 'NEEDS-SHIPPING' || s === 'NEEDS_SHIPPING') return 'PENDING';
  if (s === 'SENT') return 'SHIPPED';
  if (s === 'COMPLETED') return 'DELIVERED';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';

  // ✅ FIX: payment status vẫn cho phép admin xử lý shipping như PENDING
  if (s === 'PENDING_PAYMENT') return 'PENDING';
  if (s === 'PAID') return 'PENDING';

  if (['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'].includes(s)) return s;

  return 'PENDING';
};

const statusMeta = {
  ALL: { label: 'Tất cả', class: '' },
  PENDING: { label: 'Chờ xác nhận', class: 'needs-shipping' },
  CONFIRMED: { label: 'Đã xác nhận', class: 'confirmed' },
  SHIPPED: { label: 'Đang giao', class: 'sent' },
  DELIVERED: { label: 'Đã giao', class: 'completed' },
  CANCELLED: { label: 'Đã hủy', class: 'cancelled' },
  PAID: { label: 'Đã thanh toán', class: 'paid' },
  FAILED: { label: 'Thanh toán lỗi', class: 'failed' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', class: 'unpaid' }
};

const formatCurrency = (amount) => {
  const n = Number(amount || 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
};

const normalizeProduct = (p) => {
  if (!p) return null;

  // ✅ BE: OrderItemResponse fields
  const name = p.productName || p.name || p.title || 'Sản phẩm';
  const image =
    p.imageUrl ||
    p.image ||
    p.thumbnail ||
    'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400';

  const qty = Number(p.quantity ?? p.qty ?? 1) || 1;
  const unitPrice = Number(p.unitPrice ?? p.price ?? 0) || 0;
  const lineTotal = Number(p.lineTotal ?? p.line_total ?? unitPrice * qty) || (unitPrice * qty);

  const size = p.size || p.variantSize || '';
  const color = p.color || p.variantColor || '';

  return { id: p.id ?? p.productId ?? `${name}-${Math.random()}`, name, image, quantity: qty, price: unitPrice, lineTotal, size, color };
};
export default function ShippingManagement({ onDataChange }) {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchOrder, setSearchOrder] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusFilters = useMemo(() => ([
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận' },
    { id: 'CONFIRMED', label: 'Đã xác nhận' },
    { id: 'SHIPPED', label: 'Đang giao' },
    { id: 'DELIVERED', label: 'Đã giao' },
    { id: 'CANCELLED', label: 'Đã hủy' }
  ]), []);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const reload = () => loadOrders();
    const handleStorageChange = (e) => {
      if (e.key === 'anta_admin_orders') reload();
    };

    window.addEventListener('data:orders', reload);
    window.addEventListener('orderCancelled', reload);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('data:orders', reload);
      window.removeEventListener('orderCancelled', reload);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const result = await adminService.orders.getOrders();
    if (result?.success) {
      const data = Array.isArray(result.data) ? result.data : [];
      setOrders(data);
      setFilteredOrders(data);
    } else {
      alert('Không thể tải danh sách đơn hàng');
    }
    setLoading(false);
  };

  const getStatusCounts = () => {
    const counts = { ALL: orders.length };
    for (const f of statusFilters) counts[f.id] = 0;

    orders.forEach((o) => {
      const s = normalizeStatus(o?.status);
      if (counts[s] !== undefined) counts[s]++;
    });

    return statusFilters.map(f => ({ ...f, count: counts[f.id] || 0 }));
  };

  const handleSearch = async () => {
    // Nếu adminService.getOrders có hỗ trợ query/search thì dùng,
    // còn không thì lọc tại FE cũng được (mình làm both: ưu tiên server)
    setLoading(true);

    const payload = {
      search: searchOrder,
      status: selectedStatus === 'ALL' ? undefined : selectedStatus
    };

    const result = await adminService.orders.getOrders(payload);
    if (result?.success && Array.isArray(result.data)) {
      setFilteredOrders(result.data);
      setLoading(false);
      return;
    }

    // fallback: filter client-side
    const q = String(searchOrder || '').trim().toLowerCase();
    const next = orders.filter(o => {
      const okStatus = selectedStatus === 'ALL' ? true : normalizeStatus(o.status) === selectedStatus;
      if (!q) return okStatus;
      const hay = [
        getOrderNumber(o),
        getCustomerName(o),
        getEmail(o),
        getPhone(o)
      ].join(' ').toLowerCase();
      return okStatus && hay.includes(q);
    });
    setFilteredOrders(next);
    setLoading(false);
  };

  const handleReset = () => {
    setSearchOrder('');
    setSelectedStatus('ALL');
    setFilteredOrders(orders);
  };

  const handleStatusChange = async (statusId) => {
    setSelectedStatus(statusId);
    setLoading(true);

    const result = await adminService.orders.getOrders({
      status: statusId === 'ALL' ? undefined : statusId
    });

    if (result?.success && Array.isArray(result.data)) {
      setFilteredOrders(result.data);
      setLoading(false);
      return;
    }

    // fallback client-side
    const next = statusId === 'ALL'
      ? orders
      : orders.filter(o => normalizeStatus(o.status) === statusId);

    setFilteredOrders(next);
    setLoading(false);
  };

  const [updatingId, setUpdatingId] = useState(null);

  const updateStatus = async (orderId, nextStatus) => {
    try {
      setUpdatingId(orderId);
      const result = await adminService.orders.updateOrderStatus(orderId, nextStatus);
      if (result?.success) {
        alert(result.message || 'Cập nhật trạng thái thành công!');
        await loadOrders();
        onDataChange?.();
      } else {
        alert(result?.error || 'Không thể cập nhật trạng thái');
      }
    } finally {
      setUpdatingId(null);
    }
  };
  const cancelOrder = async (order) => {
    const id = getOrderId(order);
    if (!id) return;

    const paid = isPaidRaw(order);
    const ok = window.confirm(
      paid
        ? 'Đơn đã thanh toán. Bạn có chắc muốn hủy và tạo yêu cầu hoàn tiền không?'
        : 'Có chắc hủy đơn hàng không?'
    );
    if (!ok) return;

    setUpdatingId(id);
    try {
      const result = await adminService.orders.cancelOrderAdmin(id);
      if (result?.success) {
        alert(result?.data?.message || result?.message || 'OK');
        await loadOrders();
        onDataChange?.();
      } else {
        alert(result?.error || 'Không thể hủy đơn');
      }
    } finally {
      setUpdatingId(null);
    }
  };


  const deleteOrder = async (order) => {
    const id = getOrderId(order);
    if (!id) return;

    const ok = window.confirm('Có chắc xóa đơn hàng không?');
    if (!ok) return;

    setUpdatingId(id);
    try {
      const result = await adminService.orders.deleteOrderAdmin(id);
      if (result?.success) {
        alert(result?.data?.message || result?.message || 'OK');
        await loadOrders();
        onDataChange?.();
      } else {
        alert(result?.error || 'Không thể xóa đơn');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const renderOrderActionButton = (order) => {
    const id = getOrderId(order);
    if (!id) return null;

    const s = normalizeStatus(order?.status);
    const paid = isPaidRaw(order);
    const refund = isRefundRequested(order);
    const isLoading = updatingId === id;

    const isDelivered = s === 'DELIVERED';

    // ===== Nút chính theo trạng thái shipping =====
    let primaryBtn = null;

    if (s === 'PENDING') {
      primaryBtn = (
        <button className="complete-order-button" disabled={isLoading} onClick={() => updateStatus(id, 'CONFIRMED')}>
          <span className="btn-icon">✓</span>
          {isLoading ? 'Đang cập nhật...' : 'Xác nhận'}
        </button>
      );
    } else if (s === 'CONFIRMED') {
      primaryBtn = (
        <button className="arrange-shipping-button" disabled={isLoading} onClick={() => updateStatus(id, 'SHIPPED')}>
          <span className="btn-icon">📦</span>
          {isLoading ? 'Đang cập nhật...' : 'Sắp xếp giao hàng'}
        </button>
      );
    } else if (s === 'SHIPPED') {
      primaryBtn = (
        <button className="complete-order-button" disabled={isLoading} onClick={() => updateStatus(id, 'DELIVERED')}>
          <span className="btn-icon">🚚</span>
          {isLoading ? 'Đang cập nhật...' : 'Giao thành công'}
        </button>
      );
    } else if (s === 'DELIVERED' || 'SHIPPED') {
      primaryBtn = (
        <button className="complete-order-button is-done" disabled>
          <span className="btn-icon">✅</span>
          Đã giao hàng thành công
        </button>
      );
    }

    // ===== Nút Hủy / Hoàn tiền =====
    // ===== Nút Hủy / Hoàn tiền =====
    let cancelBtn = null;

    // ✅ DELIVERED => vô hiệu hóa hủy
    if (isDelivered) {
      cancelBtn = (
        <button className="cancel-order-button" disabled title="Đơn đã giao, không thể hủy">
          Hủy đơn
        </button>
      );
    } else if (refund) {
      // ✅ CHỈ khi refundRequested=true mới hiện "Yêu cầu hoàn lại tiền"
      cancelBtn = (
        <button className="cancel-order-button is-refund" disabled>
          Yêu cầu hoàn lại tiền
        </button>
      );
    } else if (String(order?.status || '').toUpperCase() === 'CANCELLED') {
      cancelBtn = (
        <button className="cancel-order-button" disabled>
          Đã hủy
        </button>
      );
    } else {
      // ✅ PAID nhưng chưa refundRequested => vẫn cho bấm "Hủy đơn"
      cancelBtn = (
        <button
          className="cancel-order-button"
          disabled={isLoading}
          onClick={() => cancelOrder(order)}
        >
          Hủy đơn
        </button>
      );
    }


    // ===== Nút Xóa =====
    // ✅ PAID/refund => ẩn
    // ✅ DELIVERED => vô hiệu hóa (không ẩn)
    const showDelete = !paid && !refund;

    const deleteBtn = showDelete ? (
      <button
        className="delete-order-button"
        disabled={isLoading || isDelivered}
        title={isDelivered ? 'Đơn đã giao, không thể xóa' : undefined}
        onClick={() => deleteOrder(order)}
      >
        Xóa
      </button>
    ) : null;

    return (
      <div className="order-action-group">
        {primaryBtn}
        {cancelBtn}
        {deleteBtn}
      </div>
    );
  };


  if (loading && orders.length === 0) {
    return (
      <div className="shipping-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shipping-management">
      <div className="shipping-management-content">
        <div className="page-header-section">
          <h1 className="page-main-title">Quản Lý Vận Chuyển</h1>
          <p className="page-subtitle">Quản lý tất cả đơn hàng và vận chuyển</p>
        </div>

        <div className="status-filters-section">
          {getStatusCounts().map((filter) => (
            <button
              key={filter.id}
              className={`status-filter-btn ${selectedStatus === filter.id ? 'active' : ''}`}
              onClick={() => handleStatusChange(filter.id)}
            >
              <span className="filter-label">{filter.label}</span>
              {filter.count > 0 && <span className="filter-count">{filter.count}</span>}
            </button>
          ))}
        </div>

        <div className="search-filters-card">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-order-input"
              placeholder="Nhập mã đơn hàng / tên / email / sđt..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <span className="search-input-icon">🔍</span>
          </div>

          <div className="search-actions-row">
            <button className="search-action-btn primary" onClick={handleSearch}>
              <span className="btn-icon">🔍</span>
              Tìm kiếm
            </button>
            <button className="search-action-btn secondary" onClick={handleReset}>
              <span className="btn-icon">↻</span>
              Đặt lại
            </button>
            <div className="total-orders-info">
              <span className="orders-count">{filteredOrders.length}</span> đơn hàng
            </div>
          </div>
        </div>

        <div className="orders-list-section">
          {filteredOrders.length === 0 ? (
            <div className="empty-orders-state">
              <span className="empty-orders-icon">📦</span>
              <p className="empty-orders-title">Không tìm thấy đơn hàng</p>
              <p className="empty-orders-description">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const status = normalizeStatus(order?.status);
              const badge = statusMeta[status] || statusMeta.PENDING;

              const productsRaw =
                Array.isArray(order?.items) ? order.items :
                  Array.isArray(order?.products) ? order.products :
                    Array.isArray(order?.orderItems) ? order.orderItems :
                      [];

              const products = productsRaw.map(normalizeProduct).filter(Boolean);

              return (
                <div key={getOrderId(order) || getOrderNumber(order)} className="order-card">
                  <div className="order-card-header">
                    <div className="order-info-left">
                      <div className="customer-name-section">
                        <span className="customer-icon">👤</span>
                        <span className="customer-name">{getCustomerName(order)}</span>
                      </div>

                      <div className="order-meta">
                        <span className="order-number-label">Số đơn hàng:</span>
                        <span className="order-number-value">{getOrderNumber(order)}</span>
                        {order?.date && <span className="order-date">• {order.date}</span>}
                      </div>

                      {/* ✅ thêm thông tin người nhận ngay dưới số đơn */}
                      <div className="order-recipient-inline">
                        <div className="recipient-line">
                          <strong>Email:</strong> <span>{getEmail(order)}</span>
                        </div>
                        <div className="recipient-line">
                          <strong>SĐT:</strong> <span>{getPhone(order)}</span>
                        </div>
                        <div className="recipient-line">
                          <strong>Địa chỉ:</strong> <span>{getAddress(order)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-info-right">
                      <div className="order-total-section">
                        <span className="total-label">Tổng cộng:</span>
                        <span className="total-value">{formatCurrency(getOrderTotal(order))}</span>
                      </div>

                      <span className={`order-status-badge ${badge.class}`}>
                        {badge.label}
                      </span>
                      <div className="order-action-wrap">
                        {renderOrderActionButton(order)}
                      </div>
                    </div>
                  </div>

                  {/* ✅ luôn hiển thị danh sách sản phẩm, không cần bấm */}
                  <div className="order-products-list">
                    {products.length > 0 ? (
                      products.map((product, index) => {
                        const qty = product.quantity || 1;
                        const lineTotal =
                          product.lineTotal > 0
                            ? product.lineTotal
                            : (product.price || 0) * qty;

                        return (
                          <div key={`${product.id}-${index}`} className="order-product-row">
                            <div className="product-main-info">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="product-order-thumbnail"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400';
                                }}
                              />
                              <div className="product-order-details">
                                <h4 className="product-order-name">{product.name}</h4>

                                {(product.size || product.color) && (
                                  <p className="product-order-price" style={{ opacity: 0.85 }}>
                                    {product.size && `Size: ${product.size}`}
                                    {product.size && product.color && ' • '}
                                    {product.color && `Màu: ${product.color}`}
                                  </p>
                                )}

                                <p className="product-order-price">
                                  {formatCurrency(product.price)} × {qty}
                                </p>
                              </div>
                            </div>

                            <div className="product-shipping-info">
                              <div className="shipping-status-section">
                                <span className="shipping-status-label">Trạng thái:</span>
                                <span className={`shipping-status-text ${badge.class}`}>
                                  {badge.label}
                                </span>
                              </div>

                              <div className="shipping-service-section">
                                <span className="shipping-service-icon">🚚</span>
                                <span className="shipping-service-name">
                                  {order?.shippingService || order?.carrier || '—'}
                                </span>
                              </div>
                            </div>

                            <div className="product-quantity-section">
                              <span className="quantity-label">SL:</span>
                              <span className="quantity-value">{qty}</span>
                            </div>

                            <div className="product-actions-section">
                              <div style={{ marginTop: 8, fontWeight: 700 }}>
                                {formatCurrency(lineTotal)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="order-product-row">
                        <div className="product-main-info">
                          <div className="product-order-details">
                            <p className="product-order-name">Không có thông tin sản phẩm</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
