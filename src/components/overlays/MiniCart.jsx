import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts";
import "./overlays.css";

export default function MiniCart({ open, onClose }) {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity } = useCart();

  if (!open) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/home');
  };

  return (
    <div className="overlay-root" onClick={onClose}>
      <div className="drawer right" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Giỏ hàng ({totalItems})</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-mini-cart">
              <div className="empty-icon">🛒</div>
              <p>Giỏ hàng của bạn đang trống</p>
              <button className="shop-btn" onClick={handleContinueShopping}>
                Mua sắm ngay
              </button>
            </div>
          ) : (
            <div className="mini-cart-items">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="mini-cart-item">
                  <div className="mini-item-image">
                    <img 
                      src={item.image || 'https://via.placeholder.com/80x80'} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                  </div>
                  
                  <div className="mini-item-details">
                    <h4 className="mini-item-name">{item.name}</h4>
                    {item.size && <p className="mini-item-variant">Size: {item.size}</p>}
                    {item.color && <p className="mini-item-variant">Màu: {item.color}</p>}
                    
                    <div className="mini-item-footer">
                      <div className="mini-quantity">
                        <button 
                          className="mini-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, { size: item.size, color: item.color })}
                        >
                          −
                        </button>
                        <span className="mini-qty-value">{item.quantity}</span>
                        <button 
                          className="mini-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, { size: item.size, color: item.color })}
                        >
                          +
                        </button>
                      </div>
                      
                      <span className="mini-item-price">
                        {((item.price || 0) * item.quantity).toLocaleString()}₫
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    className="mini-remove-btn"
                    onClick={() => removeFromCart(item.id, { size: item.size, color: item.color })}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="mini-cart-total">
              <span>Tổng cộng:</span>
              <span className="total-amount">{totalPrice.toLocaleString()}₫</span>
            </div>
            
            <div className="mini-cart-actions">
              <button className="view-cart-btn" onClick={handleCheckout}>
                Xem giỏ hàng
              </button>
              <button className="checkout-btn-mini" onClick={handleCheckout}>
                Thanh toán
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
