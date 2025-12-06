import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts';
import { Layout } from '../components';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart, refreshCart } = useCart();

  console.log('🔍 CartPage received:', { items, itemsLength: items.length, totalItems, totalPrice });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');

  const SHIPPING_METHODS = {
    standard: { name: 'Giao hàng tiêu chuẩn', price: 30000, time: '3-5 ngày' },
    express: { name: 'Giao hàng nhanh', price: 50000, time: '1-2 ngày' },
    free: { name: 'Miễn phí', price: 0, time: '5-7 ngày' }
  };

  const FREE_SHIPPING_THRESHOLD = 999000;

  const VALID_COUPONS = {
    'ANTA2024': { discount: 100000, type: 'fixed', description: 'Giảm 100.000₫' },
    'SALE10': { discount: 10, type: 'percent', description: 'Giảm 10%' },
    'NEWUSER': { discount: 50000, type: 'fixed', description: 'Giảm 50.000₫ cho khách hàng mới' },
    'FREESHIP': { discount: 0, type: 'freeship', description: 'Miễn phí vận chuyển' }
  };
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);
  useEffect(() => {
    if (totalPrice >= FREE_SHIPPING_THRESHOLD) {
      setShippingMethod('free');
    } else if (shippingMethod === 'free' && totalPrice < FREE_SHIPPING_THRESHOLD) {
      setShippingMethod('standard');
    }
  }, [totalPrice, shippingMethod]);

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
        ...VALID_COUPONS[trimmedCode]
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
      return Math.min(appliedCoupon.discount, totalPrice);
    } else if (appliedCoupon.type === 'percent') {
      return Math.floor((totalPrice * appliedCoupon.discount) / 100);
    }
    return 0;
  };

  const calculateShipping = () => {
    if (items.length === 0) return 0;
    if (appliedCoupon?.type === 'freeship' || totalPrice >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return SHIPPING_METHODS[shippingMethod]?.price || 0;
  };

  const discount = calculateDiscount();
  const shipping = calculateShipping();
  const finalTotal = Math.max(0, totalPrice - discount + shipping);

  const getItemKey = (item) => {
    return `${item.id}-${item.size || 'nosize'}-${item.color || 'nocolor'}`;
  };

  const getItemOptions = (item) => {
    const options = {};
    if (item.size) options.size = item.size;
    if (item.color) options.color = item.color;
    return options;
  };

  const handleQuantityChange = (item, newQuantity) => {
    const sanitizedQuantity = parseInt(newQuantity);

    if (isNaN(sanitizedQuantity) || sanitizedQuantity < 1) {
      if (window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        removeFromCart(item.id, getItemOptions(item));
      }
      return;
    }

    if (sanitizedQuantity > 99) {
      alert('Số lượng tối đa là 99');
      return;
    }

    updateQuantity(item.id, sanitizedQuantity, getItemOptions(item));
  };

  const handleQuantityInput = (item, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');

    if (sanitizedValue === '') {
      updateQuantity(item.id, 0, getItemOptions(item));
      return;
    }

    const numValue = parseInt(sanitizedValue);
    if (numValue > 99) {
      updateQuantity(item.id, 99, getItemOptions(item));
      alert('Số lượng tối đa là 99');
    } else {
      updateQuantity(item.id, numValue, getItemOptions(item));
    }
  };

  const handleQuantityBlur = (item) => {
    if (item.quantity < 1) {
      if (window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        removeFromCart(item.id, getItemOptions(item));
      } else {
        updateQuantity(item.id, 1, getItemOptions(item));
      }
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Giỏ hàng của bạn đang trống');
      return;
    }

    const orderData = {
      items,
      coupon: appliedCoupon,
      notes: orderNotes,
      shipping: shippingMethod,
      totals: {
        subtotal: totalPrice,
        discount,
        shipping,
        total: finalTotal
      }
    };

    localStorage.setItem('checkout_data', JSON.stringify(orderData));
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tất cả ${totalItems} sản phẩm khỏi giỏ hàng?`)) {
      clearCart();
      setAppliedCoupon(null);
      setCouponCode('');
      setOrderNotes('');
    }
  };

  return (
    <Layout>
      <div className="cart-page">

        <div className="breadcrumbs">
          <div className="container">
            <Link to="/home" className="breadcrumb-link">Trang chủ</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Giỏ hàng</span>
          </div>
        </div>

        {totalPrice > 0 && totalPrice < FREE_SHIPPING_THRESHOLD && (
          <div className="promo-banner">
            <div className="container">
              <div className="promo-content">
                <span className="promo-icon">🚚</span>
                <span className="promo-text">Mua thêm</span>
                <span className="promo-amount">{(FREE_SHIPPING_THRESHOLD - totalPrice).toLocaleString()}₫</span>
                <span className="promo-text">để được</span>
                <span className="promo-highlight">MIỄN PHÍ VẬN CHUYỂN</span>
              </div>
            </div>
          </div>
        )}

        {totalPrice >= FREE_SHIPPING_THRESHOLD && items.length > 0 && (
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
              <div className="cart-layout">
                <div className="cart-main">
                  <div className="cart-header">
                    <h1>Giỏ hàng của bạn</h1>
                    <span className="cart-count">({totalItems} sản phẩm)</span>
                    <button
                      className="clear-cart-btn"
                      onClick={handleClearCart}
                    >
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
                              src={item.image || 'https://via.placeholder.com/100x100'}
                              alt={item.name}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="item-info">
                            <h3 className="item-name">{item.name}</h3>
                            {item.size && <p className="item-variant">Size: {item.size}</p>}
                            {item.color && <p className="item-variant">Màu: {item.color}</p>}
                            {item.sku && <p className="item-sku">SKU: {item.sku}</p>}
                          </div>
                        </div>

                        <div className="col-price">
                          <div className="item-price">
                            <span className="current-price">{(item.price || 0).toLocaleString()}₫</span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="original-price">{item.originalPrice.toLocaleString()}₫</span>
                            )}
                          </div>
                        </div>

                        <div className="col-quantity">
                          <div className="quantity-controls">
                            <button
                              className="qty-btn decrease"
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              aria-label="Giảm số lượng"
                              type="button"
                            >
                              −
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="qty-input"
                              value={item.quantity}
                              onChange={(e) => handleQuantityInput(item, e.target.value)}
                              onBlur={() => handleQuantityBlur(item)}
                              min="1"
                              max="99"
                              aria-label="Số lượng"
                            />
                            <button
                              className="qty-btn increase"
                              onClick={() => handleQuantityChange(item, item.quantity + 1)}
                              aria-label="Tăng số lượng"
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="col-total">
                          <span className="total-price">
                            {((item.price || 0) * item.quantity).toLocaleString()}₫
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
                      onClick={() => {
                        alert('Giỏ hàng đã được cập nhật');
                      }}
                      type="button"
                    >
                      Cập nhật giỏ hàng
                    </button>
                  </div>
                </div>

                <div className="cart-sidebar">
                  <div className="coupon-section">
                    <h3 className="section-title">Mã giảm giá</h3>

                    {appliedCoupon ? (
                      <div className="applied-coupon">
                        <div className="coupon-info">
                          <span className="coupon-icon">🎟️</span>
                          <div className="coupon-details">
                            <span className="coupon-code">{appliedCoupon.code}</span>
                            <span className="coupon-description">{appliedCoupon.description}</span>
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

                    {couponError && (
                      <p className="coupon-error">{couponError}</p>
                    )}

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

                  {totalPrice < FREE_SHIPPING_THRESHOLD && (
                    <div className="shipping-section">
                      <h3 className="section-title">Phương thức vận chuyển</h3>
                      <div className="shipping-options">
                        {Object.entries(SHIPPING_METHODS).map(([key, method]) => {
                          if (key === 'free') return null;
                          return (
                            <label key={key} className="shipping-option">
                              <input
                                type="radio"
                                name="shipping"
                                value={key}
                                checked={shippingMethod === key}
                                onChange={(e) => setShippingMethod(e.target.value)}
                              />
                              <div className="shipping-info">
                                <span className="shipping-name">{method.name}</span>
                                <span className="shipping-time">({method.time})</span>
                              </div>
                              <span className="shipping-price">
                                {method.price === 0 ? 'Miễn phí' : `${method.price.toLocaleString()}₫`}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="notes-section">
                    <h3 className="section-title">Ghi chú đơn hàng</h3>
                    <textarea
                      className="order-notes"
                      placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows="4"
                      maxLength="500"
                    />
                    <span className="notes-counter">{orderNotes.length}/500</span>
                  </div>

                  <div className="order-summary">
                    <h3 className="section-title">Tổng đơn hàng</h3>

                    <div className="summary-content">
                      <div className="summary-row">
                        <span>Tạm tính ({totalItems} sản phẩm):</span>
                        <span className="summary-value">{totalPrice.toLocaleString()}₫</span>
                      </div>

                      {discount > 0 && (
                        <div className="summary-row discount">
                          <span>Giảm giá:</span>
                          <span className="summary-value discount-value">-{discount.toLocaleString()}₫</span>
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
                        <span className="summary-value total-value">{finalTotal.toLocaleString()}₫</span>
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
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}