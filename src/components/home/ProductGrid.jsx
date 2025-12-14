import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts";
import "./home.css";

export default function ProductGrid({ title, products = [] }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleQuickView = (e, product) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();

    const parsePrice = (price) => {
      if (typeof price === 'number') return price;
      if (typeof price === 'string') {
        const numericValue = parseFloat(price.replace(/[^\d]/g, ''));
        return isNaN(numericValue) ? 0 : numericValue;
      }
      return 0;
    };

    const cartItem = {
      id: product.id,
      name: product.name,
      price: parsePrice(product.price),
      originalPrice: product.originalPrice ? parsePrice(product.originalPrice) : null,
      image: product.image,
      quantity: 1,
      size: product.sizes ? product.sizes[0] : null,
      color: product.colors ? product.colors[0]?.value || 'default' : null
    };

    addToCart(cartItem);

    // Show confirmation
    const btn = e.currentTarget;
    const originalText = btn.textContent;
    btn.textContent = '✓ ĐÃ THÊM';
    btn.style.background = 'var(--color-success)';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1500);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  return (
    <>
      <section className="section-products">
        <div className="container">
          {title && (
            <div className="section-header">
              <h2 className="section-title">{title}</h2>
            </div>
          )}
          <div className="products-grid">
            {products.map((p) => (
              <div 
                key={p.id} 
                className="product-card"
                onClick={() => handleProductClick(p.id)}
              >
                <div className="product-image">
                  <img src={p.image} alt={p.name} />
                  {p.badge && <span className={`product-badge ${p.badge.toLowerCase()}`}>{p.badge}</span>}
                  <div className="product-overlay">
                    <button 
                      className="quick-view"
                      onClick={(e) => handleQuickView(e, p)}
                      type="button"
                    >
                      XEM NHANH
                    </button>
                    <button 
                      className="add-to-cart"
                      onClick={(e) => handleAddToCart(e, p)}
                      type="button"
                    >
                      THÊM VÀO GIỎ
                    </button>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{p.name}</h3>
                  <div className="product-price">
                    <span className="current-price">{p.price}</span>
                    {p.originalPrice && <span className="original-price">{p.originalPrice}</span>}
                    {p.discount && <span className="discount">-{p.discount}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="quick-view-modal" onClick={closeQuickView}>
          <div className="quick-view-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeQuickView} type="button">×</button>
            
            <div className="quick-view-layout">
              <div className="quick-view-image">
                <img src={quickViewProduct.image} alt={quickViewProduct.name} />
              </div>
              
              <div className="quick-view-details">
                <h2>{quickViewProduct.name}</h2>
                
                <div className="quick-view-price">
                  <span className="current-price">{quickViewProduct.price}</span>
                  {quickViewProduct.originalPrice && (
                    <>
                      <span className="original-price">{quickViewProduct.originalPrice}</span>
                      <span className="discount-badge">-{quickViewProduct.discount}</span>
                    </>
                  )}
                </div>
                
                <p className="quick-view-description">
                  {quickViewProduct.description || 'Sản phẩm chất lượng cao từ ANTA Việt Nam'}
                </p>
                
                <div className="quick-view-actions">
                  <button 
                    className="btn-view-detail"
                    onClick={() => navigate(`/product/${quickViewProduct.id}`)}
                    type="button"
                  >
                    Xem Chi Tiết
                  </button>
                  <button 
                    className="btn-add-to-cart"
                    onClick={(e) => {
                      handleAddToCart(e, quickViewProduct);
                      setTimeout(closeQuickView, 1500);
                    }}
                    type="button"
                  >
                    Thêm Vào Giỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
