//src/pages/CartPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts';
import { Layout } from '../components';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    totalItems,
    totalPrice,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
  } = useCart();

  // ====== LOCAL QUANTITY STATE ======
  const [localQuantities, setLocalQuantities] = useState({});

  useEffect(() => {
    const initial = {};
    items.forEach((item) => {
      initial[item.id] = item.quantity || 1;
    });
    setLocalQuantities(initial);
  }, [items]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');

  const SHIPPING_METHODS = {
    standard: { name: 'Giao hàng tiêu chuẩn', price: 30000, time: '3-5 ngày' },
    express: { name: 'Giao hàng nhanh', price: 50000, time: '1-2 ngày' },
    free: { name: 'Miễn phí', price: 0, time: '5-7 ngày' },
  };

  const FREE_SHIPPING_THRESHOLD = 999000;

  const VALID_COUPONS = {
    ANTA2024: { discount: 100000, type: 'fixed', description: 'Giảm 100.000₫' },
    SALE10: { discount: 10, type: 'percent', description: 'Giảm 10%' },
    NEWUSER: { discount: 50000, type: 'fixed', description: 'Giảm 50.000₫ cho khách hàng mới' },
    FREESHIP: { discount: 0, type: 'freeship', description: 'Miễn phí vận chuyển' },
  };

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // ====== helper lấy quantity local ======
  const getLocalQty = (item) => {
    const val = localQuantities[item.id];
    if (val === '' || val == null) return item.quantity || 1;
    return Number(val);
  };

  // ====== tổng theo local quantity ======
  const localTotalItems = useMemo(
    () => items.reduce((sum, item) => sum + getLocalQty(item), 0),
    [items, localQuantities]
  );

  const localTotalPrice = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + ((item.unitPrice ?? item.price ?? 0) * getLocalQty(item)),
        0
      ),
    [items, localQuantities]
  );

  // auto switch freeship theo localTotalPrice
  useEffect(() => {
    if (localTotalPrice >= FREE_SHIPPING_THRESHOLD) {
      setShippingMethod('free');
    } else if (shippingMethod === 'free' && localTotalPrice < FREE_SHIPPING_THRESHOLD) {
      setShippingMethod('standard');
    }
  }, [localTotalPrice, shippingMethod]);

  // ========== COUPON ==========
  const handleApplyCoupon = () => {
    setCouponError('');
    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    if (VALID_COUPONS[trimmedCode]) {
      setAppliedCoupon({
        code: trimmedCode,
        ...VALID_COUPONS[trimmedCode],
      });
      setCouponError('');
    } else {
      setCouponError('Mã giảm giá không hợp lệ');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.type === 'fixed') {
      return Math.min(appliedCoupon.discount, localTotalPrice);
    } else if (appliedCoupon.type === 'percent') {
      return Math.floor((localTotalPrice * appliedCoupon.discount) / 100);
    }
    return 0;
  };

  const calculateShipping = () => {
    if (items.length === 0) return 0;
    if (appliedCoupon?.type === 'freeship' || localTotalPrice >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return SHIPPING_METHODS[shippingMethod]?.price || 0;
  };

  const discount = calculateDiscount();
  const shipping = calculateShipping();
  const finalTotal = Math.max(0, localTotalPrice - discount + shipping);

  const getItemKey = (item) => {
    return `${item.id}-${item.size || 'nosize'}-${item.color || 'nocolor'}`;
  };

  const getItemOptions = (item) => {
    const options = {};
    if (item.size) options.size = item.size;
    if (item.color) options.color = item.color;
    return options;
  };

  // ====== chỉ chỉnh local state ======
  const handleQuantityChange = (item, newQuantity) => {
    let qty = parseInt(newQuantity, 10);

    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > 99) {
      alert('Số lượng tối đa là 99');
      qty = 99;
    }

    setLocalQuantities((prev) => ({
      ...prev,
      [item.id]: qty,
    }));
  };

  const handleQuantityInput = (item, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');

    if (sanitizedValue === '') {
      setLocalQuantities((prev) => ({
        ...prev,
        [item.id]: '',
      }));
      return;
    }

    let numValue = parseInt(sanitizedValue, 10);
    if (numValue > 99) {
      alert('Số lượng tối đa là 99');
      numValue = 99;
    }

    setLocalQuantities((prev) => ({
      ...prev,
      [item.id]: numValue,
    }));
  };

  const handleQuantityBlur = (item) => {
    const current = localQuantities[item.id];
    if (!current || Number.isNaN(Number(current)) || current < 1) {
      setLocalQuantities((prev) => ({
        ...prev,
        [item.id]: 1,
      }));
    }
  };

  // ====== nút "Cập nhật giỏ hàng" mới gọi API ======
  const handleUpdateCartClick = async () => {
    try {
      const promises = [];

      items.forEach((item) => {
        const newQty = getLocalQty(item);
        if (newQty !== item.quantity) {
          // updateQuantity trong context: (cartItemId, quantity, options)
          promises.push(updateQuantity(item.id, newQty, getItemOptions(item)));
        }
      });

      if (promises.length) {
        await Promise.all(promises);
        await refreshCart();
      }

      alert('Giỏ hàng đã được cập nhật');
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi cập nhật giỏ hàng');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Giỏ hàng của bạn đang trống');
      return;
    }

    // Kiểm tra xem có item nào thiếu variantId / size / color không
    const missing = items.filter(it => {
      const vid = it.variantId ?? null;
      const size = it.size ?? null;
      const color = it.color ?? null;
      // Nếu bạn cho phép chỉ cần variantId thì bỏ size/color check.
      // Ở đây ta yêu cầu cả variantId + size + color (theo yêu cầu của bạn).
      return !(vid && size && color);
    });

    if (missing.length > 0) {
      const names = missing.map(m => m.name || `#${m.productId || m.id}`).join(', ');
      alert(`Không thể tiến hành thanh toán. Một số sản phẩm thiếu thông tin biến thể (size/màu/variant). Vui lòng kiểm tra: ${names}`);
      return;
    }

    const orderData = {
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId ?? null,
        name: item.name,
        quantity: getLocalQty(item),
        price: item.unitPrice ?? item.price ?? 0,
        size: item.size ?? null,
        color: item.color ?? null,
        sku: item.sku ?? null,
        image: item.image ?? item.imageUrl ?? null,
      })),
      coupon: appliedCoupon,
      notes: orderNotes,
      shipping: shippingMethod,
      totals: {
        subtotal: localTotalPrice,
        discount,
        shipping,
        total: finalTotal,
      },
      createdAt: new Date().toISOString()
    };

    // lưu backup để Checkout có thể đọc nếu cần
    try {
      localStorage.setItem('checkout_data', JSON.stringify(orderData));
    } catch (e) {
      console.warn('Could not save checkout_data', e);
    }

    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tất cả ${totalItems} sản phẩm khỏi giỏ hàng?`)) {
      clearCart();
      setAppliedCoupon(null);
      setCouponCode('');
      setOrderNotes('');
      setLocalQuantities({});
    }
  };

  return (
    <Layout>
      <div className="cart-page">
        {/* Breadcrumb */}
        <div className="breadcrumbs">
          <div className="container">
            <Link to="/home" className="breadcrumb-link">
              Trang chủ
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Giỏ hàng</span>
          </div>
        </div>

        {/* Banner freeship */}
        {localTotalPrice > 0 && localTotalPrice < FREE_SHIPPING_THRESHOLD && (
          <div className="promo-banner">
            <div className="container">
              <div className="promo-content">
                <span className="promo-icon">🚚</span>
                <span className="promo-text">Mua thêm</span>
                <span className="promo-amount">
                  {(FREE_SHIPPING_THRESHOLD - localTotalPrice).toLocaleString()}₫
                </span>
                <span className="promo-text">để được</span>
                <span className="promo-highlight">MIỄN PHÍ VẬN CHUYỂN</span>
              </div>
            </div>
          </div>
        )}

        {localTotalPrice >= FREE_SHIPPING_THRESHOLD && items.length > 0 && (
          <div className="promo-banner success">
            <div className="container">
              <div className="promo-content">
                <span className="promo-icon">✓</span>
                <span className="promo-highlight">Chúc mừng!</span>
                <span className="promo-text">Đơn hàng của bạn được FREESHIP</span>
              </div>
            </div>
          </div>
        )}

        <div className="cart-content">
          <div className="container">
            {items.length === 0 ? (
              // ================== GIỎ HÀNG TRỐNG ==================
              <div className="empty-cart">
                <div className="empty-cart-illustration">
                  <div className="cart-basket">
                    <div className="basket-body">
                      <div className="basket-icon">🛒</div>
                    </div>
                    <div className="basket-handle"></div>
                  </div>
                  <div className="floating-shapes">
                    <div className="shape circle"></div>
                    <div className="shape star"></div>
                    <div className="shape plus"></div>
                    <div className="shape circle small"></div>
                  </div>
                </div>

                <div className="empty-cart-message">
                  <h2>Giỏ hàng trống</h2>
                  <p>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!</p>
                </div>

                <button
                  className="shop-now-btn"
                  onClick={() => navigate('/home')}
                >
                  Mua sắm ngay
                </button>
              </div>
            ) : (
              // ================== CÓ SẢN PHẨM ==================
              <div className="cart-layout">
                {/* MAIN LIST */}
                <div className="cart-main">
                  <div className="cart-header">
                    <h1>Giỏ hàng của bạn</h1>
                    <span className="cart-count">({localTotalItems} sản phẩm)</span>
                    <button className="clear-cart-btn" onClick={handleClearCart}>
                      <span className="icon">🗑️</span>
                      <span className="btn-text">Xóa tất cả</span>
                    </button>
                  </div>

                  <div className="cart-items">
                    <div className="cart-table-header">
                      <div className="col-product">Sản phẩm</div>
                      <div className="col-price">Đơn giá</div>
                      <div className="col-quantity">Số lượng</div>
                      <div className="col-total">Thành tiền</div>
                      <div className="col-action"></div>
                    </div>

                    {items.map((item) => (
                      <div key={getItemKey(item)} className="cart-item">
                        <div className="col-product">
                          <div className="item-image">
                            <img
                              src={
                                item.image ||
                                item.imageUrl ||
                                'https://via.placeholder.com/100x100'
                              }
                              alt={item.name}
                              onError={(e) => {
                                e.target.src =
                                  'https://via.placeholder.com/100x100?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="item-info">
                            <h3 className="item-name">{item.name}</h3>
                            {item.size && <p className="item-variant">Size: {item.size}</p>}
                            {item.color && <p className="item-variant">Màu: {item.color}</p>}
                          </div>
                        </div>

                        <div className="col-price">
                          <div className="item-price">
                            <span className="current-price">
                              {((item.unitPrice ?? item.price ?? 0).toLocaleString())}₫
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="original-price">
                                {item.originalPrice.toLocaleString()}₫
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-quantity">
                          <div className="quantity-controls">
                            <button
                              className="qty-btn decrease"
                              onClick={() =>
                                handleQuantityChange(item, getLocalQty(item) - 1)
                              }
                              type="button"
                            >
                              −
                            </button>

                            <input
                              type="text"
                              className="qty-input"
                              style={{ width: '200px' }}
                              value={localQuantities[item.id] ?? item.quantity}
                              onChange={(e) => handleQuantityInput(item, e.target.value)}
                              onBlur={() => handleQuantityBlur(item)}
                            />

                            <button
                              className="qty-btn increase"
                              onClick={() =>
                                handleQuantityChange(item, getLocalQty(item) + 1)
                              }
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="col-total">
                          <span className="total-price">
                            {(((item.unitPrice ?? item.price ?? 0) * getLocalQty(item)).toLocaleString())}₫
                          </span>
                        </div>

                        <div className="col-action">
                          <button
                            className="remove-btn"
                            onClick={() => {
                              if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                                removeFromCart(item.id, getItemOptions(item));
                              }
                            }}
                            aria-label="Xóa sản phẩm"
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-actions-bottom">
                    <button
                      className="continue-shopping-btn"
                      onClick={() => navigate('/home')}
                      type="button"
                    >
                      ← Tiếp tục mua sắm
                    </button>

                    <button
                      className="update-cart-btn"
                      onClick={handleUpdateCartClick}
                      type="button"
                    >
                      Cập nhật giỏ hàng
                    </button>
                  </div>
                </div>

                {/* ============ SIDEBAR: MÃ GIẢM GIÁ + PHÍ SHIP + TỔNG TIỀN ============ */}
                <div className="cart-sidebar">
                  {/* Coupon */}
                  <div className="coupon-section">
                    <h3 className="section-title">Mã giảm giá</h3>

                    {appliedCoupon ? (
                      <div className="applied-coupon">
                        <div className="coupon-info">
                          <span className="coupon-icon">🎟️</span>
                          <div className="coupon-details">
                            <span className="coupon-code">{appliedCoupon.code}</span>
                            <span className="coupon-description">
                              {appliedCoupon.description}
                            </span>
                          </div>
                        </div>
                        <button
                          className="remove-coupon-btn"
                          onClick={handleRemoveCoupon}
                          type="button"
                          aria-label="Xóa mã giảm giá"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="coupon-input-group">
                        <input
                          type="text"
                          className="coupon-input"
                          placeholder="Nhập mã giảm giá"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                        />
                        <button
                          className="apply-coupon-btn"
                          onClick={handleApplyCoupon}
                          type="button"
                        >
                          Áp dụng
                        </button>
                      </div>
                    )}

                    {couponError && <p className="coupon-error">{couponError}</p>}

                    <div className="available-coupons">
                      <p className="available-coupons-title">Mã khả dụng:</p>
                      {Object.entries(VALID_COUPONS).map(([code, data]) => (
                        <button
                          key={code}
                          className="available-coupon-item"
                          onClick={() => {
                            setCouponCode(code);
                            setAppliedCoupon({ code, ...data });
                            setCouponError('');
                          }}
                          type="button"
                        >
                          <span className="coupon-code-tag">{code}</span>
                          <span className="coupon-desc">{data.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Order summary */}
                  <div className="order-summary">
                    <h3 className="section-title">Tổng đơn hàng</h3>

                    <div className="summary-content">
                      <div className="summary-row">
                        <span>Tạm tính ({localTotalItems} sản phẩm):</span>
                        <span className="summary-value">
                          {localTotalPrice.toLocaleString()}₫
                        </span>
                      </div>

                      {discount > 0 && (
                        <div className="summary-row discount">
                          <span>Giảm giá:</span>
                          <span className="summary-value discount-value">
                            -{discount.toLocaleString()}₫
                          </span>
                        </div>
                      )}

                      <div className="summary-row">
                        <span>Phí vận chuyển:</span>
                        <span className="summary-value shipping-value">
                          {shipping === 0 ? (
                            <span className="free-shipping">Miễn phí</span>
                          ) : (
                            `${shipping.toLocaleString()}₫`
                          )}
                        </span>
                      </div>

                      <div className="summary-divider"></div>

                      <div className="summary-row total">
                        <span>Tổng cộng:</span>
                        <span className="summary-value total-value">
                          {finalTotal.toLocaleString()}₫
                        </span>
                      </div>

                      <p className="tax-note">(Đã bao gồm VAT nếu có)</p>
                    </div>

                    <button
                      className="checkout-btn"
                      onClick={handleCheckout}
                      type="button"
                    >
                      Tiến hành thanh toán
                    </button>

                    <div className="payment-methods">
                      <p className="payment-title">Chúng tôi chấp nhận:</p>
                      <div className="payment-icons">
                        <span className="payment-icon visa">VISA</span>
                        <span className="payment-icon mastercard">MC</span>
                        <span className="payment-icon momo">MoMo</span>
                        <span className="payment-icon cod">COD</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* END SIDEBAR */}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
