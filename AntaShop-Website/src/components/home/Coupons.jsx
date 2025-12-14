import React from "react";
import "./home.css";

export default function Coupons() {
  const coupons = [
    {
      id: 1,
      code: "WELCOME50",
      discount: "50.000₫",
      condition: "Đơn hàng từ 500.000₫",
      color: "primary"
    },
    {
      id: 2,
      code: "SPORT100",
      discount: "100.000₫",
      condition: "Đơn hàng từ 1.000.000₫",
      color: "success"
    },
    {
      id: 3,
      code: "VIP250",
      discount: "250.000₫",
      condition: "Đơn hàng từ 2.500.000₫",
      color: "premium"
    }
  ];

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      alert(`Đã sao chép mã: ${code}`);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section className="coupons-section">
      <div className="container">
        <div className="coupons-grid">
          {coupons.map((coupon) => (
            <div key={coupon.id} className={`coupon-card ${coupon.color}`}>
              <div className="coupon-discount">{coupon.discount}</div>
              <div className="coupon-code">
                <span>Mã: </span>
                <strong>{coupon.code}</strong>
              </div>
              <div className="coupon-condition">{coupon.condition}</div>
              <button
                className="coupon-copy-btn"
                onClick={() => handleCopy(coupon.code)}
              >
                Sao chép mã
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
