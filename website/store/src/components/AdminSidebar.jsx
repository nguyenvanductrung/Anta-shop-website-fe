import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts';
import './AdminSidebar.css';

export default function AdminSidebar({ activeTab, setActiveTab, unreadMessages = 0, unreadNotifications = 0 }) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedAvatar = window.localStorage.getItem('adminAvatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setAvatarUrl(result);
        window.localStorage.setItem('adminAvatar', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: '📊', color: '#3B82F6' },
    { id: 'products', label: 'Sản Phẩm', icon: '🛒', color: '#D70010' },
    { id: 'shipping', label: 'Vận Chuyển', icon: '📦', color: '#F59E0B' },
    { id: 'messages', label: 'Tin Nhắn', icon: '💬', badge: unreadMessages, color: '#1EA75A' },
    { id: 'notifications', label: 'Thông Báo', icon: '🔔', badge: unreadNotifications, color: '#8B5CF6' },
    { id: 'settings', label: 'Cài Đặt', icon: '⚙️', color: '#6B6B6B' },
    { id: 'product-stats', label: 'Dashboard', icon: '📈', color: '#0EA5A4' },

  ];

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon-wrapper">
            <img
              src="https://theme.hstatic.net/1000150581/1001194384/14/logo.png?v=1868"
              alt="Anta Logo"
              className="logo-image"
            />
          </div>
          <div className="logo-text-wrapper">
            <span className="logo-text">ANTA</span>
            <span className="logo-subtitle">ADMIN PANEL</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{ '--item-color': item.color }}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
            {item.badge > 0 && (
              <span className="nav-item-badge">{item.badge}</span>
            )}
            <span className="nav-item-indicator"></span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar" onClick={handleAvatarClick}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="user-avatar-image" />
            ) : (
              <span className="user-avatar-icon">👤</span>
            )}
            <div className="user-status-indicator"></div>
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || 'Admin'}</div>
            <div className="user-role">Quản Trị Viên</div>
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="avatar-file-input"
          onChange={handleAvatarChange}
        />
      </div>
    </div>
  );
}
