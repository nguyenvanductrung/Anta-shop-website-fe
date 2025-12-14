import React, { useState } from 'react';
import './TopBanner.css';

const TopBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="anta-top-banner">
      <div className="banner-content">
        <span className="banner-message">
          🔥 NHẬP MÃ: CAMP50 - GIẢM 10% CHO ĐƠN TỪ 500K | NHẬP MÃ: CAMP100 - GIẢM 100K CHO ĐƠN TỪ 1.599K | MIỄN PHÍ VẬN CHUYỂN
        </span>
      </div>
      <button
        className="banner-close-btn"
        onClick={() => setIsVisible(false)}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
};

export default TopBanner;
