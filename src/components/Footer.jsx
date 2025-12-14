import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubscribeStatus('error');
      setTimeout(() => setSubscribeStatus(''), 3000);
      return;
    }
    
    setSubscribeStatus('success');
    setEmail('');
    setTimeout(() => setSubscribeStatus(''), 3000);
  };

  return (
    <footer className="anta-footer">
      <div className="footer-wrapper">
        <div className="footer-grid">
          <div className="footer-section company-info">
            <h3 className="section-heading">CÔNG TY TNHH ANTA SPORTS VIỆT NAM</h3>
            <div className="info-content">
              <div className="info-item">
                <span className="info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                <span className="info-text">Nhà phố thương mại SH08-22 & SH08-23, Số 07-09, Đường số 7, Phường An Khánh, Thành phố Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="info-item">
                <span className="info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </span>
                <a href="tel:0974945488" className="info-text info-link">Số điện thoại: 0974945488</a>
              </div>
              <div className="info-item">
                <span className="info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <a href="mailto:antavnonline@anta.com" className="info-text info-link">Email: antavnonline@anta.com</a>
              </div>
            </div>
            <div className="copyright-text">
              © {new Date().getFullYear()} Bản quyền thuộc về <Link to="/" className="footer-brand-link">Anta Việt Nam</Link> | Cung cấp bởi <span className="footer-powered">Haravan</span>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="section-heading">CHÍNH SÁCH</h3>
            <ul className="section-links">
              <li className="link-item">
                <Link to="/policies/shipping" className="link-text">
                  <span className="link-arrow">›</span>
                  Chính sách vận chuyển
                </Link>
              </li>
              <li className="link-item">
                <Link to="/policies/returns" className="link-text">
                  <span className="link-arrow">›</span>
                  Chính sách đổi trả hàng
                </Link>
              </li>
              <li className="link-item">
                <Link to="/policies/privacy" className="link-text">
                  <span className="link-arrow">›</span>
                  Chính sách bảo mật
                </Link>
              </li>
              <li className="link-item">
                <Link to="/policies/inspection" className="link-text">
                  <span className="link-arrow">›</span>
                  Chính sách kiểm hàng
                </Link>
              </li>
              <li className="link-item">
                <Link to="/policies/obligations" className="link-text">
                  <span className="link-arrow">›</span>
                  Nghĩa vụ giao dịch
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="section-heading">HỖ TRỢ KHÁCH HÀNG</h3>
            <ul className="section-links">
              <li className="link-item">
                <Link to="/about" className="link-text">
                  <span className="link-arrow">›</span>
                  Giới thiệu
                </Link>
              </li>
              <li className="link-item">
                <Link to="/terms" className="link-text">
                  <span className="link-arrow">›</span>
                  Quy định chung
                </Link>
              </li>
              <li className="link-item">
                <Link to="/stores" className="link-text">
                  <span className="link-arrow">›</span>
                  Hệ thống cửa hàng
                </Link>
              </li>
              <li className="link-item">
                <Link to="/order-tracking" className="link-text">
                  <span className="link-arrow">›</span>
                  Kiểm tra đơn hàng
                </Link>
              </li>
              <li className="link-item">
                <Link to="/kids" className="link-text">
                  <span className="link-arrow">›</span>
                  ANTA Kids
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="section-heading">ĐĂNG KÝ NHẬN TIN</h3>
            <p className="newsletter-description">Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt</p>
            <form className="newsletter-box" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                className="newsletter-input" 
                placeholder="Nhập địa chỉ email" 
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-button">Đăng ký</button>
            </form>
            {subscribeStatus === 'success' && (
              <div className="subscribe-message success-message">Đăng ký thành công!</div>
            )}
            {subscribeStatus === 'error' && (
              <div className="subscribe-message error-message">Vui lòng nhập email hợp lệ</div>
            )}
            
            <h4 className="social-heading">KẾT NỐI VỚI CHÚNG TÔI</h4>
            <div className="social-icons">
              <a href="https://www.facebook.com/antavietnam" target="_blank" rel="noopener noreferrer" className="social-link facebook-link" title="Facebook" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/@antavietnam" target="_blank" rel="noopener noreferrer" className="social-link youtube-link" title="YouTube" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@antavietnam" target="_blank" rel="noopener noreferrer" className="social-link tiktok-link" title="TikTok" aria-label="TikTok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/antavietnam" target="_blank" rel="noopener noreferrer" className="social-link instagram-link" title="Instagram" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="certification-bar">
            <a href="http://online.gov.vn/Home/WebDetails/99631" target="_blank" rel="noopener noreferrer" className="cert-badge" title="Đã thông báo Bộ Công Thương">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</span>
            </a>
            <div className="payment-methods">
              <span className="payment-label">Phương thức thanh toán:</span>
              <div className="payment-logos">
                <div className="payment-item" title="VISA">
                  <svg width="40" height="14" viewBox="0 0 48 16" fill="none">
                    <rect width="48" height="16" rx="3" fill="#1A1F71"/>
                    <text x="24" y="12" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">VISA</text>
                  </svg>
                </div>
                <div className="payment-item" title="Mastercard">
                  <svg width="40" height="14" viewBox="0 0 48 16" fill="none">
                    <rect width="48" height="16" rx="3" fill="#EB001B"/>
                    <text x="24" y="12" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">Master</text>
                  </svg>
                </div>
                <div className="payment-item" title="MoMo">
                  <svg width="40" height="14" viewBox="0 0 48 16" fill="none">
                    <rect width="48" height="16" rx="3" fill="#A50064"/>
                    <text x="24" y="12" fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">MoMo</text>
                  </svg>
                </div>
                <div className="payment-item" title="ZaloPay">
                  <svg width="40" height="14" viewBox="0 0 48 16" fill="none">
                    <rect width="48" height="16" rx="3" fill="#0068FF"/>
                    <text x="24" y="12" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">ZaloPay</text>
                  </svg>
                </div>
                <div className="payment-item" title="Thanh toán khi nhận hàng">
                  <svg width="40" height="14" viewBox="0 0 48 16" fill="none">
                    <rect width="48" height="16" rx="3" fill="#22C55E"/>
                    <text x="24" y="12" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">COD</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="legal-info">
          <p className="legal-text">
            Công ty TNHH Anta Sports Việt Nam, Số CN ĐKDN: 0318507641 - Ngày cấp: 12/06/2024 - Nơi cấp: Sở kế hoạch và đầu tư thành phố Hồ Chí Minh - Phòng đăng ký kinh doanh
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
