import React from 'react';
import './HeroBanner.css';

const HeroBanner = () => {
  return (
    <div className="hero-banner">
      <div className="hero-content">
        {/* Left side content */}
        <div className="hero-left">
          <div className="hero-logo">
            <span className="anta-logo">ANTA</span>
          </div>
          
          <div className="hero-text">
            <h1 className="hero-title">Keep Moving Keep Earning</h1>
            
            <div className="promo-banner">
              <span className="promo-text">Ưu đãi thành viên</span>
            </div>
            
            <div className="discount-text">
              CHỈ CÒN NỬA GIÁ
            </div>
            
            <div className="date-range">
              16.10 - 26.10
            </div>
            
            <button className="cta-button">
              SĂN NGAY
            </button>
            
            <div className="disclaimer">
              *Số lượng quà tặng có hạn
            </div>
          </div>
        </div>

        {/* Right side promotional cards */}
        <div className="hero-right">
          <div className="promo-cards">
            {/* Top card - Voucher */}
            <div className="promo-card voucher-card">
              <div className="card-header">
                <span className="card-title">Voucher độc quyền</span>
              </div>
              <div className="card-amount">150K</div>
              <div className="card-description">
                Dành cho khách hàng thân thiết
              </div>
            </div>

            {/* Bottom card - Gift */}
            <div className="promo-card gift-card">
              <div className="card-header">
                <span className="card-title">Tặng ngay</span>
              </div>
              <div className="gift-image">
                <div className="socks-image">
                  <div className="sock-pair"></div>
                </div>
              </div>
              <div className="gift-description">
                1 đôi tất thể thao ANTA
              </div>
              <div className="gift-condition">
                Áp dụng cho hóa đơn từ 999k
              </div>
            </div>
          </div>
        </div>

        {/* Athletes running across */}
        <div className="athletes">
          <div className="athlete athlete-woman">
            <div className="runner-figure woman"></div>
          </div>
          <div className="athlete athlete-man">
            <div className="runner-figure man"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
