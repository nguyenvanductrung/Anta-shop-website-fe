import React, { useState, useEffect } from 'react';
import './FloatingButtons.css';

const FloatingButtons = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:1900123456';
  };

  const handleMessengerClick = () => {
    window.open('https://m.me/your-facebook-page', '_blank');
  };

  const handleZaloClick = () => {
    window.open('https://zalo.me/your-zalo-number', '_blank');
  };

  return (
    <div className="floating-buttons-container">
      <div className={`floating-buttons-group ${isExpanded ? 'is-expanded' : ''}`}>
        {isExpanded && (
          <div className="floating-buttons-list">
            <button
              className="floating-button phone-button"
              onClick={handlePhoneClick}
              aria-label="Gọi điện"
              title="Gọi điện: 1900 123 456"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span className="button-label">Hotline</span>
            </button>

            <button
              className="floating-button messenger-button"
              onClick={handleMessengerClick}
              aria-label="Chat Messenger"
              title="Chat qua Messenger"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.145 2 11.25c0 2.9 1.435 5.49 3.68 7.2V22l3.405-1.87c.91.25 1.875.37 2.915.37 5.523 0 10-4.145 10-9.25S17.523 2 12 2zm1.012 12.5l-2.55-2.72-4.98 2.72 5.48-5.815 2.613 2.72 4.917-2.72-5.48 5.815z"/>
              </svg>
              <span className="button-label">Messenger</span>
            </button>

            <button
              className="floating-button zalo-button"
              onClick={handleZaloClick}
              aria-label="Chat Zalo"
              title="Chat qua Zalo"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span className="button-label">Zalo</span>
            </button>
          </div>
        )}

        <button
          className="floating-button-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Đóng menu' : 'Mở menu liên hệ'}
        >
          {isExpanded ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </button>
      </div>

      {showScrollTop && (
        <button
          className="scroll-to-top-button"
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};

export default FloatingButtons;
