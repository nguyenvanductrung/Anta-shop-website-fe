import React, { useState } from 'react';
import './DiscountCodes.css';

const DiscountCodes = () => {
  const [copiedCode, setCopiedCode] = useState(null);

  const discountCodes = [
    {
      id: 1,
      code: "CAMP50_2",
      discount: "50,000₫",
      condition: "Cho đơn hàng từ 999.000₫"
    },
    {
      id: 2,
      code: "CAMP100_2",
      discount: "100.000₫",
      condition: "Cho đơn hàng từ 1.599.000₫"
    },
    {
      id: 3,
      code: "CAMP250_2",
      discount: "250.000₫",
      condition: "Cho đơn hàng từ 2.999.000₫"
    }
  ];

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="discount-codes">
      <div className="container">
        <div className="discount-codes-grid">
          {discountCodes.map((item) => (
            <div key={item.id} className="discount-card">
              <div className="discount-header">
                <span className="discount-label">NHẬP MÃ:</span>
                <span className="discount-code">{item.code}</span>
              </div>
              
              <div className="discount-info">
                <div className="discount-amount">
                  Giảm {item.discount}
                </div>
                <div className="discount-condition">
                  {item.condition}
                </div>
              </div>
              
              <div className="discount-actions">
                <button 
                  className={`copy-button ${copiedCode === item.code ? 'copied' : ''}`}
                  onClick={() => handleCopyCode(item.code)}
                >
                  {copiedCode === item.code ? 'Đã sao chép!' : 'Sao chép'}
                </button>
                <button className="conditions-button">
                  Điều kiện
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscountCodes;
