//src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { AdminSidebar, ProductManagement, ShippingManagement } from '../components';
import adminService from '../services/adminService';
import ProductOverviewChart from '../pages/ProductOverviewChart';

import './AdminPage.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('my-products');
  const { logout, user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [dashboardStats, setDashboardStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        alert('Vui lòng đăng nhập để truy cập trang Admin!');
        navigate('/login');
        return;
      }

      if (!isAdmin) {
        alert('Bạn không có quyền truy cập trang này!');
        navigate('/home');
        return;
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadDashboardData();
    }
  }, [isAuthenticated, isAdmin]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, messagesRes, notificationsRes, settingsRes] = await Promise.all([
        adminService.stats.getDashboardStats(),
        adminService.messages.getMessages(),
        adminService.notifications.getNotifications(),
        adminService.settings.getSettings()
      ]);

      if (statsRes.success) setDashboardStats(statsRes.data);
      if (messagesRes.success) setMessages(messagesRes.data);
      if (notificationsRes.success) setNotifications(notificationsRes.data);
      if (settingsRes.success) setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleMarkMessageAsRead = async (messageId) => {
    const result = await adminService.messages.markAsRead(messageId);
    if (result.success) {
      setMessages(messages.map(m => m.id === messageId ? result.data : m));
    }
  };

  const handleReplyToMessage = async (messageId, replyText) => {
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }

    const result = await adminService.messages.replyToMessage(messageId, replyText);
    if (result.success) {
      setMessages(messages.map(m => m.id === messageId ? result.data : m));
      alert(result.message);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    const result = await adminService.notifications.markAsRead(notificationId);
    if (result.success) {
      setNotifications(notifications.map(n => n.id === notificationId ? result.data : n));
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    const result = await adminService.notifications.markAllAsRead();
    if (result.success) {
      const updatedNotifs = await adminService.notifications.getNotifications();
      if (updatedNotifs.success) {
        setNotifications(updatedNotifs.data);
      }
      alert(result.message);
    }
  };

  const handleSaveSettings = async (newSettings) => {
    const result = await adminService.settings.updateSettings(newSettings);
    if (result.success) {
      setSettings(result.data);
      alert(result.message);
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const renderContent = () => {

    switch (activeTab) {
      case 'product-stats':
        return (
          <div className="admin-content-section">
            <div className="section-header">
              <h1 className="section-title-main">Thống kê sản phẩm</h1>
              <div style={{ marginLeft: 'auto' }}>
                {/* nếu muốn truyền topN từ admin */}
                {/* <button onClick={() => setActiveTab('dashboard')}>Quay lại</button> */}
              </div>
            </div>

            {/* Option A: ProductOverviewChart (horizontal grouped bars + highlight) */}
            <ProductOverviewChart topN={10} useMock={false} />

            {/* Option B: nếu bạn muốn dùng ProductStatsPage thay thế, comment ProductOverviewChart và dùng: */}
            {/* <ProductStatsPage topN={10} /> */}
          </div>
        );
      case 'dashboard':
        return (
          <div className="admin-dashboard">
            <div className="dashboard-header">
              <div className="header-content">
                <div className="welcome-section">
                  <h1 className="dashboard-title">Chào mừng trở lại!</h1>
                  <p className="dashboard-subtitle">
                    <span className="user-greeting">Xin chào, {user?.username || 'Admin'}</span>
                    <span className="time-separator">•</span>
                    <span className="current-date">{formatDate(currentTime)}</span>
                  </p>
                </div>
                <div className="header-actions">
                  <div className="live-time">
                    <span className="time-icon">🕐</span>
                    <span className="time-display">{formatTime(currentTime)}</span>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>
                    <span className="logout-icon">🚪</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card products-stat">
                <div className="stat-card-inner">
                  <div className="stat-icon-wrapper">
                    <div className="stat-icon">📦</div>
                    <div className="stat-glow"></div>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Tổng Sản Phẩm</p>
                    <div className="stat-value-wrapper">
                      <p className="stat-value">{dashboardStats?.totalProducts || 0}</p>
                      <span className="stat-unit">sản phẩm</span>
                    </div>
                    {dashboardStats?.lowStockProducts > 0 && (
                      <div className="stat-change">
                        <span className="change-icon">⚠️</span>
                        <span>{dashboardStats.lowStockProducts} sắp hết hàng</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="stat-chart-mini">
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '100%' }}></div>
                  <div className="chart-bar" style={{ height: '75%' }}></div>
                </div>
              </div>

              <div className="stat-card orders-stat">
                <div className="stat-card-inner">
                  <div className="stat-icon-wrapper">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-glow"></div>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Đơn Hàng Mới</p>
                    <div className="stat-value-wrapper">
                      <p className="stat-value">{dashboardStats?.newOrders || 0}</p>
                      <span className="stat-unit">đơn hàng</span>
                    </div>
                    <div className="stat-change positive">
                      <span className="change-icon">📈</span>
                      <span>Tổng: {dashboardStats?.totalOrders || 0} đơn</span>
                    </div>
                  </div>
                </div>
                <div className="stat-chart-mini">
                  <div className="chart-bar" style={{ height: '50%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                  <div className="chart-bar" style={{ height: '55%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                  <div className="chart-bar" style={{ height: '100%' }}></div>
                </div>
              </div>

              <div className="stat-card revenue-stat">
                <div className="stat-card-inner">
                  <div className="stat-icon-wrapper">
                    <div className="stat-icon">💰</div>
                    <div className="stat-glow"></div>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Doanh Thu</p>
                    <div className="stat-value-wrapper">
                      <p className="stat-value">{(dashboardStats?.totalRevenue / 1000000).toFixed(1)}M</p>
                      <span className="stat-unit">VNĐ</span>
                    </div>
                    <div className="stat-change positive">
                      <span className="change-icon">📈</span>
                      <span>{dashboardStats?.completedOrders || 0} đơn hoàn thành</span>
                    </div>
                  </div>
                </div>
                <div className="stat-chart-mini">
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '65%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '95%' }}></div>
                  <div className="chart-bar" style={{ height: '100%' }}></div>
                </div>
              </div>

              <div className="stat-card customers-stat">
                <div className="stat-card-inner">
                  <div className="stat-icon-wrapper">
                    <div className="stat-icon">👥</div>
                    <div className="stat-glow"></div>
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">Khách Hàng</p>
                    <div className="stat-value-wrapper">
                      <p className="stat-value">{dashboardStats?.totalCustomers || 0}</p>
                      <span className="stat-unit">người</span>
                    </div>
                    <div className="stat-change positive">
                      <span className="change-icon">💬</span>
                      <span>{dashboardStats?.unreadMessages || 0} tin nhắn mới</span>
                    </div>
                  </div>
                </div>
                <div className="stat-chart-mini">
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                  <div className="chart-bar" style={{ height: '85%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                  <div className="chart-bar" style={{ height: '100%' }}></div>
                </div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="section-card orders-section">
                <div className="section-header">
                  <div className="section-title-wrapper">
                    <h2 className="section-title">Đơn Hàng Gần Đây</h2>
                    {dashboardStats?.newOrders > 0 && (
                      <span className="section-badge">{dashboardStats.newOrders} mới</span>
                    )}
                  </div>
                  <button className="view-all-btn" onClick={() => setActiveTab('shipping')}>
                    <span>Xem tất cả</span>
                    <span className="arrow-icon">→</span>
                  </button>
                </div>
                <div className="section-content">
                  <div className="order-status-grid">
                    <div className="order-status-item pending">
                      <div className="status-icon-circle">
                        <span className="status-icon">⏳</span>
                      </div>
                      <div className="status-info">
                        <p className="status-value">{dashboardStats?.newOrders || 0}</p>
                        <p className="status-label">Cần xử lý</p>
                      </div>
                      <div className="status-action">
                        <button className="status-btn" onClick={() => setActiveTab('shipping')}>Xem</button>
                      </div>
                    </div>
                    <div className="order-status-item processing">
                      <div className="status-icon-circle">
                        <span className="status-icon">📦</span>
                      </div>
                      <div className="status-info">
                        <p className="status-value">{dashboardStats?.totalOrders - dashboardStats?.newOrders - dashboardStats?.completedOrders || 0}</p>
                        <p className="status-label">Đang giao</p>
                      </div>
                      <div className="status-action">
                        <button className="status-btn" onClick={() => setActiveTab('shipping')}>Xem</button>
                      </div>
                    </div>
                    <div className="order-status-item completed">
                      <div className="status-icon-circle">
                        <span className="status-icon">✓</span>
                      </div>
                      <div className="status-info">
                        <p className="status-value">{dashboardStats?.completedOrders || 0}</p>
                        <p className="status-label">Hoàn thành</p>
                      </div>
                      <div className="status-action">
                        <button className="status-btn" onClick={() => setActiveTab('shipping')}>Xem</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-card actions-section">
                <div className="section-header">
                  <div className="section-title-wrapper">
                    <h2 className="section-title">Thao Tác Nhanh</h2>
                  </div>
                </div>
                <div className="section-content">
                  <div className="quick-actions-grid">
                    <button className="quick-action-card" onClick={() => {
                      setActiveTab('products');
                      setActiveSubTab('add-product');
                    }}>
                      <div className="action-icon-wrapper add-product">
                        <span className="action-icon">➕</span>
                      </div>
                      <div className="action-info">
                        <p className="action-title">Thêm Sản Phẩm</p>
                        <p className="action-desc">Tạo mới</p>
                      </div>
                      <span className="action-arrow">→</span>
                    </button>

                    <button className="quick-action-card" onClick={() => setActiveTab('products')}>
                      <div className="action-icon-wrapper manage-products">
                        <span className="action-icon">📋</span>
                      </div>
                      <div className="action-info">
                        <p className="action-title">Quản Lý Sản Phẩm</p>
                        <p className="action-desc">{dashboardStats?.totalProducts || 0} sản phẩm</p>
                      </div>
                      <span className="action-arrow">→</span>
                    </button>

                    <button className="quick-action-card" onClick={() => setActiveTab('shipping')}>
                      <div className="action-icon-wrapper shipping">
                        <span className="action-icon">🚚</span>
                      </div>
                      <div className="action-info">
                        <p className="action-title">Vận Chuyển</p>
                        <p className="action-desc">{dashboardStats?.totalOrders || 0} đơn hàng</p>
                      </div>
                      <span className="action-arrow">→</span>
                    </button>

                    <button className="quick-action-card" onClick={() => setActiveTab('messages')}>
                      <div className="action-icon-wrapper messages">
                        <span className="action-icon">💬</span>
                      </div>
                      <div className="action-info">
                        <p className="action-title">Tin Nhắn</p>
                        <p className="action-desc">{dashboardStats?.unreadMessages || 0} mới</p>
                      </div>
                      <span className="action-arrow">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-bottom-grid">
              <div className="section-card activity-section">
                <div className="section-header">
                  <div className="section-title-wrapper">
                    <h2 className="section-title">Tin Nhắn Gần Đây</h2>
                  </div>
                  <button className="view-all-btn" onClick={() => setActiveTab('messages')}>
                    <span>Xem tất cả</span>
                    <span className="arrow-icon">→</span>
                  </button>
                </div>
                <div className="section-content">
                  <div className="activity-timeline">
                    {messages.slice(0, 4).map((message, index) => (
                      <div key={message.id} className="activity-item">
                        <div className={`activity-dot ${index === 0 && !message.read ? 'new' : ''}`}></div>
                        <div className="activity-content">
                          <p className="activity-title">{message.subject}</p>
                          <p className="activity-time">{message.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section-card performance-section">
                <div className="section-header">
                  <div className="section-title-wrapper">
                    <h2 className="section-title">Thống Kê</h2>
                  </div>
                </div>
                <div className="section-content">
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <div className="metric-header">
                        <span className="metric-label">Đơn hàng hoàn thành</span>
                        <span className="metric-percentage">
                          {dashboardStats?.totalOrders > 0
                            ? Math.round((dashboardStats.completedOrders / dashboardStats.totalOrders) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${dashboardStats?.totalOrders > 0
                              ? (dashboardStats.completedOrders / dashboardStats.totalOrders) * 100
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-header">
                        <span className="metric-label">Sản phẩm trong kho</span>
                        <span className="metric-percentage">
                          {dashboardStats?.totalProducts - dashboardStats?.lowStockProducts || 0} OK
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${dashboardStats?.totalProducts > 0
                              ? ((dashboardStats.totalProducts - dashboardStats.lowStockProducts) / dashboardStats.totalProducts) * 100
                              : 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-header">
                        <span className="metric-label">Tin nhắn đã xử lý</span>
                        <span className="metric-percentage">
                          {messages.length > 0
                            ? Math.round((messages.filter(m => m.read).length / messages.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${messages.length > 0
                              ? (messages.filter(m => m.read).length / messages.length) * 100
                              : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <ProductManagement
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            onDataChange={loadDashboardData}
          />
        );

      case 'shipping':
        return <ShippingManagement onDataChange={loadDashboardData} />;

      case 'messages':
        return (
          <div className="admin-content-section">
            <div className="section-header">
              <h1 className="section-title-main">Tin Nhắn</h1>
              <div className="header-actions">
                <span className="unread-count-badge">
                  {messages.filter(m => !m.read).length} chưa đọc
                </span>
              </div>
            </div>
            {messages.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">💬</span>
                <p className="empty-state-text">Không có tin nhắn</p>
                <p className="empty-state-description">Tất cả tin nhắn từ khách hàng sẽ hiển thị tại đây</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((message) => (
                  <div key={message.id} className={`message-item ${!message.read ? 'unread' : ''}`}>
                    <div className="message-header-section">
                      <div className="message-customer-info">
                        <span className="message-avatar">{message.avatar}</span>
                        <div className="message-meta">
                          <h3 className="message-customer-name">{message.customer}</h3>
                          <p className="message-time">{message.time}</p>
                        </div>
                      </div>
                      {!message.read && (
                        <button
                          className="mark-read-btn"
                          onClick={() => handleMarkMessageAsRead(message.id)}
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="message-content-section">
                      <h4 className="message-subject">{message.subject}</h4>
                      <p className="message-text">{message.message}</p>
                    </div>
                    {message.replies && message.replies.length > 0 && (
                      <div className="message-replies-section">
                        <h5 className="replies-title">Phản hồi:</h5>
                        {message.replies.map((reply) => (
                          <div key={reply.id} className="reply-item">
                            <div className="reply-sender">
                              <span className="reply-icon">👤</span>
                              <span className="reply-sender-name">{reply.sender}</span>
                              <span className="reply-time">{reply.time}</span>
                            </div>
                            <p className="reply-message">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="message-actions-section">
                      <input
                        type="text"
                        className="reply-input"
                        placeholder="Nhập phản hồi..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleReplyToMessage(message.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        className="send-reply-btn"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          handleReplyToMessage(message.id, input.value);
                          input.value = '';
                        }}
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="admin-content-section">
            <div className="section-header">
              <h1 className="section-title-main">Thông Báo</h1>
              {notifications.filter(n => !n.read).length > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={handleMarkAllNotificationsAsRead}
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🔔</span>
                <p className="empty-state-text">Không có thông báo</p>
                <p className="empty-state-description">Các thông báo hệ thống sẽ hiển thị tại đây</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="notification-item"
                    onClick={() => !notification.read && handleMarkNotificationAsRead(notification.id)}
                  >
                    <span className={`notification-icon ${!notification.read ? 'new' : ''}`}>
                      {notification.icon}
                    </span>
                    <div className="notification-content">
                      <p className="notification-title">{notification.title}</p>
                      <p className="notification-message">{notification.message}</p>
                      <p className="notification-time">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="admin-content-section">
            <div className="section-header">
              <h1 className="section-title-main">Cài Đặt</h1>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h3 className="settings-section-title">Thông Tin Cửa Hàng</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Tên Cửa Hàng</label>
                    <input
                      type="text"
                      defaultValue={settings?.storeName || 'ANTA Store'}
                      id="storeName"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Liên Hệ</label>
                    <input
                      type="email"
                      defaultValue={settings?.email || 'admin@anta.com.vn'}
                      id="email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số Điện Thoại</label>
                    <input
                      type="tel"
                      defaultValue={settings?.phone || '1900 xxxx'}
                      id="phone"
                    />
                  </div>
                  <div className="form-group">
                    <label>Địa Chỉ</label>
                    <textarea
                      rows="3"
                      defaultValue={settings?.address || 'Hà Nội, Việt Nam'}
                      id="address"
                    ></textarea>
                  </div>
                  <button
                    className="save-settings-btn"
                    onClick={() => {
                      const newSettings = {
                        storeName: document.getElementById('storeName').value,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('phone').value,
                        address: document.getElementById('address').value
                      };
                      handleSaveSettings(newSettings);
                    }}
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-section-title">Cài Đặt Thông Báo</h3>
                <div className="settings-options">
                  <label className="setting-option">
                    <input
                      type="checkbox"
                      defaultChecked={settings?.notifications?.newOrders ?? true}
                      id="newOrders"
                    />
                    <span>Nhận thông báo đơn hàng mới</span>
                  </label>
                  <label className="setting-option">
                    <input
                      type="checkbox"
                      defaultChecked={settings?.notifications?.messages ?? true}
                      id="messages"
                    />
                    <span>Nhận thông báo tin nhắn</span>
                  </label>
                  <label className="setting-option">
                    <input
                      type="checkbox"
                      defaultChecked={settings?.notifications?.weeklyReport ?? false}
                      id="weeklyReport"
                    />
                    <span>Nhận email tổng kết hàng tuần</span>
                  </label>
                </div>
                <button
                  className="save-settings-btn"
                  onClick={() => {
                    const newSettings = {
                      notifications: {
                        newOrders: document.getElementById('newOrders').checked,
                        messages: document.getElementById('messages').checked,
                        weeklyReport: document.getElementById('weeklyReport').checked
                      }
                    };
                    handleSaveSettings(newSettings);
                  }}
                >
                  Lưu Cài Đặt
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="admin-content-section">
            <h1>Dashboard</h1>
          </div>
        );
    }
  };

  return (
    <div className="admin-page">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadMessages={dashboardStats?.unreadMessages || 0}
        unreadNotifications={dashboardStats?.unreadNotifications || 0}
      />
      <div className="admin-main">
        <div className="admin-content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
