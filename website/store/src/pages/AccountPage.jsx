import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components';
import { useAuth, useCart, useOrders, useWishlist, useUserData } from '../contexts';
import './AccountPage.css';

export default function AccountPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { addToCart, resetCartAfterLogout } = useCart();

  const { orders, getOrder, getOrdersByStatus, totalOrders, cancelOrder } = useOrders();
  const { wishlist, removeFromWishlist: removeFromWishlistContext, totalWishlistItems } = useWishlist();
  const {
    profile,
    addresses,
    updateProfile,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
  } = useUserData();

  const [activeTab, setActiveTab] = useState(section || 'overview');
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');

  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);

  const [profileData, setProfileData] = useState({
    recipientName: '',
    email: '',
    phone: '',
    birthday: '',
    gender: ''
  });

  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phoneNumber: '',
    detailedAddress: '',
    country: 'Vietnam',
    isDefault: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (section) {
      setActiveTab(section);
    }
  }, [section]);

  useEffect(() => {
    setProfileData(profile);
  }, [profile]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profileData);
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu mới không khớp!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      alert('Cập nhật mật khẩu thành công!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        recipientName: address.recipientName,
        phone: address.phone,
        address: address.address,
        isDefault: address.isDefault
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        recipientName: '',
        phone: '',
        address: '',
        isDefault: false
      });
    }
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({
      recipientName: '',
      phone: '',
      address: '',
      isDefault: false
    });
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, addressForm);
      } else {
        await addAddress(addressForm);
      }
      closeAddressModal();
      alert(editingAddress ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteAddress(id);
      alert('Xóa địa chỉ thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    setLoading(true);
    try {
      await setDefaultAddress(id);
      alert('Đã đặt làm địa chỉ mặc định!');
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (id) => {
    setLoading(true);
    try {
      await removeFromWishlistContext(id);
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetail = async (order) => {
    try {
      const orderDetail = await getOrder(order.id);
      setSelectedOrder(orderDetail);
      setShowOrderDetailModal(true);
    } catch (error) {
      alert('Không thể tải chi tiết đơn hàng: ' + error.message);
    }
  };

  const handleReorder = async (order) => {
    try {
      if (order.products && order.products.length > 0) {
        order.products.forEach(product => {
          addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: product.quantity || 1
          });
        });
        alert('Đã thêm sản phẩm vào giỏ hàng!');
        navigate('/cart');
      } else {
        alert('Không thể tải thông tin sản phẩm');
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleOpenReview = (order) => {
    setReviewOrder(order);
    setReviewForm({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      alert(`Cảm ơn bạn đã đánh giá ${reviewForm.rating} sao cho đơn hàng #${reviewOrder.id}!`);
      setShowReviewModal(false);
      setReviewOrder(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  const handleTrackOrder = (order) => {
    setTrackingOrder(order);
    setShowTrackingModal(true);
  };

  const handleCancelOrder = async (order) => {
    const confirmCancel = window.confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng #${order.id}?\n\nLưu ý: Hành động này không thể hoàn tác.`
    );

    if (!confirmCancel) {
      return;
    }

    setLoading(true);
    try {
      await cancelOrder(order.id);
      alert('Hủy đơn hàng thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra khi hủy đơn hàng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canCancelOrder = (order) => {
    const status = order.status.toLowerCase();
    return status === 'đang xử lý' || status === 'processing' || status === 'chờ xử lý';
  };

  const handleNavigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleLogout = () => {
    logout();               // xoá token, user trên FE
    resetCartAfterLogout(); // chỉ reset state FE, DB giữ nguyên
    navigate('/home');
  };


  const getStatusClass = (status) => {
    switch (status) {
      case 'Đã giao':
      case 'DELIVERED':
        return 'delivered';
      case 'Đang giao':
      case 'SHIPPING':
        return 'shipping';
      case 'Đang xử lý':
      case 'PROCESSING':
        return 'processing';
      case 'Đã hủy':
      case 'CANCELLED':
        return 'cancelled';
      default:
        return '';
    }
  };

  const getFilteredOrders = () => {
    return getOrdersByStatus(orderFilter);
  };

  const getTrackingSteps = (order) => {
    const steps = [
      { label: 'Đã đặt hàng', completed: true },
      { label: 'Đang xử lý', completed: false },
      { label: 'Đang giao', completed: false },
      { label: 'Đã giao', completed: false }
    ];

    const status = order.status.toLowerCase();
    if (status === 'đang xử lý' || status === 'processing') {
      steps[1].completed = true;
    } else if (status === 'đang giao' || status === 'shipping') {
      steps[1].completed = true;
      steps[2].completed = true;
    } else if (status === 'đã giao' || status === 'delivered') {
      steps[1].completed = true;
      steps[2].completed = true;
      steps[3].completed = true;
    }

    return steps;
  };

  if (isLoading || loading) {
    return (
      <div className="loading-container">
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderOverview = () => (
    <div className="overview-content">
      <div className="account-welcome">
        <h1>Tài khoản của tôi</h1>
        <p>Xin chào, <strong>{user?.username}</strong>!</p>
      </div>

      <div className="account-stats">
        <div className="stat-box" onClick={() => setActiveTab('orders')}>
          <div className="stat-number">{totalOrders}</div>
          <div className="stat-text">Đơn hàng</div>
        </div>
        <div className="stat-box" onClick={() => setActiveTab('wishlist')}>
          <div className="stat-number">{totalWishlistItems}</div>
          <div className="stat-text">Yêu thích</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">0</div>
          <div className="stat-text">Điểm thưởng</div>
        </div>
      </div>

      <div className="recent-section">
        <div className="section-title">
          <h3>Đơn hàng gần đây</h3>
          <button className="link-btn" onClick={() => setActiveTab('orders')}>Xem tất cả →</button>
        </div>
        {orders.length > 0 ? (
          <div className="recent-orders">
            {orders.slice(0, 2).map((order) => (
              <div key={order.id} className="recent-order-item" onClick={() => handleViewOrderDetail(order)}>
                <div className="order-thumbnail">
                  <img src={order.image || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300'} alt="Sản phẩm" />
                </div>
                <div className="order-content">
                  <div className="order-row">
                    <span className="order-number">#{order.id}</span>
                    <span className={`status-badge status-${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-meta">
                    <span>{new Date(order.date || order.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span>{order.items || order.totalItems} sản phẩm</span>
                  </div>
                  <div className="order-price">{(order.total || order.totalAmount).toLocaleString()}₫</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Bạn chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrders = () => {
    const filteredOrders = getFilteredOrders();

    return (
      <div className="orders-section">
        <h2>Đơn hàng của tôi</h2>

        <div className="order-tabs">
          <button className={`order-tab ${orderFilter === 'all' ? 'active' : ''}`} onClick={() => setOrderFilter('all')}>Tất cả</button>
          <button className={`order-tab ${orderFilter === 'processing' ? 'active' : ''}`} onClick={() => setOrderFilter('processing')}>Chờ xử lý</button>
          <button className={`order-tab ${orderFilter === 'shipping' ? 'active' : ''}`} onClick={() => setOrderFilter('shipping')}>Đang giao</button>
          <button className={`order-tab ${orderFilter === 'delivered' ? 'active' : ''}`} onClick={() => setOrderFilter('delivered')}>Đã giao</button>
          <button className={`order-tab ${orderFilter === 'cancelled' ? 'active' : ''}`} onClick={() => setOrderFilter('cancelled')}>Đã hủy</button>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="order-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-detail-card">
                <div className="order-card-header">
                  <div className="order-info-top">
                    <span className="order-code">Đơn hàng #{order.id}</span>
                    <span className="order-date-text">{new Date(order.date || order.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <span className={`order-status-tag status-${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-card-body">
                  <div className="order-product-info">
                    <img src={order.image || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300'} alt="Sản phẩm" className="order-img" />
                    <div className="order-details">
                      <div className="order-quantity">{order.items || order.totalItems} sản phẩm</div>
                      <div className="order-amount">Tổng cộng: <strong>{(order.total || order.totalAmount).toLocaleString()}₫</strong></div>
                    </div>
                  </div>
                </div>
                <div className="order-card-footer">
                  <button className="order-action-btn secondary" onClick={() => handleViewOrderDetail(order)}>Xem chi tiết</button>
                  {(order.status === 'Đã giao' || order.status === 'DELIVERED') && (
                    <>
                      <button className="order-action-btn secondary" onClick={() => handleReorder(order)}>Mua lại</button>
                      <button className="order-action-btn primary" onClick={() => handleOpenReview(order)}>Đánh giá</button>
                    </>
                  )}
                  {(order.status === 'Đang giao' || order.status === 'SHIPPING') && (
                    <button className="order-action-btn primary" onClick={() => handleTrackOrder(order)}>Theo dõi đơn hàng</button>
                  )}
                  {canCancelOrder(order) && (
                    <button className="order-action-btn cancel" onClick={() => handleCancelOrder(order)}>Hủy đơn hàng</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Không có đơn hàng nào</p>
          </div>
        )}
      </div>
    );
  };

  const renderWishlist = () => (
    <div className="wishlist-section">
      <h2>Sản phẩm yêu thích</h2>
      {wishlist.length > 0 ? (
        <div className="wishlist-products">
          {wishlist.map((item) => (
            <div key={item.id} className="wishlist-product">
              <button className="remove-item" aria-label="Xóa khỏi yêu thích" onClick={() => handleRemoveFromWishlist(item.id)}>×</button>
              <div className="product-img-wrapper" onClick={() => handleNavigateToProduct(item.productId || item.id)}>
                <img src={item.image || item.product?.image} alt={item.name || item.product?.name} />
                {!item.inStock && (
                  <div className="out-of-stock-label">Hết hàng</div>
                )}
              </div>
              <div className="product-details">
                <h4 className="product-name" onClick={() => handleNavigateToProduct(item.productId || item.id)}>{item.name || item.product?.name}</h4>
                <div className="product-pricing">
                  <span className="price-current">{(item.price || item.product?.price).toLocaleString()}₫</span>
                  {item.originalPrice && (
                    <span className="price-original">{item.originalPrice.toLocaleString()}₫</span>
                  )}
                </div>
                {item.inStock ? (
                  <button className="cart-add-btn" onClick={() => handleNavigateToProduct(item.productId || item.id)}>
                    Xem sản phẩm
                  </button>
                ) : (
                  <button className="notify-stock-btn">Thông báo khi có hàng</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Bạn chưa có sản ph��m yêu thích nào</p>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="profile-section">
      <h2>Thông tin tài khoản</h2>
      <form onSubmit={handleSaveProfile} className="account-form">
        <div className="field-group">
          <label htmlFor="fullName">Họ và tên *</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={profileData.fullName || user?.username || ''}
            onChange={handleProfileChange}
            placeholder="Nhập họ và tên"
            required
          />
        </div>

        <div className="field-row">
          <div className="field-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email || user?.email || ''}
              onChange={handleProfileChange}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input
              type="tel"
              id="phone"
              name="phoneNumber"   // ✅ đổi lại name cho đúng key
              value={profileData.phoneNumber || user?.phoneNumber || ''}
              onChange={handleProfileChange}
              placeholder="0123456789"
            />
          </div>
        </div>
        <div className="button-group">
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
          </button>
          <button type="button" className="cancel-btn" onClick={() => setProfileData(profile)}>Hủy</button>
        </div>
      </form>

      <div className="password-change-section">
        <h3>Thay đổi mật khẩu</h3>
        <form className="password-change-form" onSubmit={handleChangePassword}>
          <div className="field-group">
            <label htmlFor="currentPassword">Mật khẩu hiện tại *</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="newPassword">Mật khẩu mới *</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Nhập mật khẩu mới"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderAddresses = () => (
    <div className="addresses-section">
      <div className="section-title">
        <h2>Sổ địa chỉ</h2>
        <button className="add-new-btn" onClick={() => openAddressModal()}>
          + Thêm địa chỉ mới
        </button>
      </div>

      {addresses.length > 0 ? (
        <div className="address-list">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`address-item ${address.isDefault ? "is-default" : ""}`}
            >
              <div className="address-header-row">
                <div className="address-recipient">
                  <h4>{address.recipientName}</h4>
                  {address.isDefault && <span className="default-tag">Mặc định</span>}
                </div>
              </div>

              <div className="address-content">
                <p className="recipient-phone">{address.phoneNumber}</p>
                <p className="recipient-address">
                  {address.detailedAddress || address.address}
                  {address.country ? `, ${address.country}` : ""}
                </p>
              </div>

              <div className="address-action-buttons">
                <button className="edit-btn" onClick={() => openAddressModal(address)}>
                  Chỉnh sửa
                </button>
                <button className="delete-btn" onClick={() => handleDeleteAddress(address.id)}>
                  Xóa
                </button>
                {!address.isDefault && (
                  <button
                    className="set-default-btn"
                    onClick={() => handleSetDefaultAddress(address.id)}
                  >
                    Đặt làm mặc định
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Bạn chưa có địa chỉ nào</p>
        </div>
      )}
    </div>
  );


  return (
    <Layout>
      <div className="account-page">
        <div className="page-breadcrumb">
          <div className="container">
            <a onClick={() => navigate('/home')} className="breadcrumb-item">Trang chủ</a>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-active">Tài khoản</span>
          </div>
        </div>

        <div className="account-wrapper">
          <div className="container">
            <div className="account-grid">
              <aside className="account-menu">
                <div className="user-profile">
                  <div className="user-avatar-circle">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info-text">
                    <h3 className="user-name">{user?.username}</h3>
                    <p className="user-email">{user?.email}</p>
                  </div>
                </div>

                <nav className="menu-nav">
                  <button
                    className={`menu-link ${activeTab === 'overview' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>Tổng quan</span>
                  </button>
                  <button
                    className={`menu-link ${activeTab === 'orders' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    <span>Đơn hàng</span>
                  </button>
                  <button
                    className={`menu-link ${activeTab === 'wishlist' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('wishlist')}
                  >
                    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>Yêu thích</span>
                  </button>
                  <button
                    className={`menu-link ${activeTab === 'profile' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Thông tin tài khoản</span>
                  </button>
                  <button
                    className={`menu-link ${activeTab === 'addresses' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('addresses')}
                  >
                    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Sổ địa chỉ</span>
                  </button>
                  <button className="menu-link logout-link" onClick={handleLogout}>
                    <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </nav>
              </aside>

              <main className="account-content">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'wishlist' && renderWishlist()}
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'addresses' && renderAddresses()}
              </main>
            </div>
          </div>
        </div>
      </div>

      {showAddressModal && (
        <div className="modal-overlay" onClick={closeAddressModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
              <button className="modal-close" onClick={closeAddressModal}>×</button>
            </div>
            <form onSubmit={handleSaveAddress} className="modal-body">
              <div className="field-group">
                <label htmlFor="recipientName">Họ và tên người nhận *</label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={addressForm.recipientName}
                  onChange={handleAddressFormChange}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="phoneNumber">Số điện thoại *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={addressForm.phoneNumber}
                  onChange={handleAddressFormChange}
                  placeholder="0123456789"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="country">Khu vực *</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={addressForm.country}
                  onChange={handleAddressFormChange}
                  placeholder="Vietnam"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="detailedAddress">Địa chỉ chi tiết *</label>
                <textarea
                  id="detailedAddress"
                  name="detailedAddress"
                  value={addressForm.detailedAddress}
                  onChange={handleAddressFormChange}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  rows="3"
                  required
                />
              </div>

              <div className="field-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressFormChange}
                  />
                  <span>Đặt làm địa chỉ mặc định</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeAddressModal}>Hủy</button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {showOrderDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetailModal(false)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết đơn hàng #{selectedOrder.id}</h3>
              <button className="modal-close" onClick={() => setShowOrderDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-detail-status">
                <span className={`status-badge status-${getStatusClass(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
                <span className="order-detail-date">
                  Ngày đặt: {new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="order-detail-section">
                <h4>Sản phẩm</h4>
                <div className="order-products-list">
                  {selectedOrder.products && selectedOrder.products.map((product, index) => (
                    <div key={index} className="order-product-item">
                      <img src={product.image} alt={product.name} className="product-thumb" />
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-meta">Số lượng: {product.quantity}</div>
                      </div>
                      <div className="product-price">{product.price.toLocaleString()}₫</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-detail-section">
                <h4>Tổng cộng</h4>
                <div className="order-total-amount">
                  {(selectedOrder.total || selectedOrder.totalAmount).toLocaleString()}₫
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && reviewOrder && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đánh giá đơn hàng #{reviewOrder.id}</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitReview} className="modal-body">
              <div className="field-group">
                <label>Đánh giá của bạn</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="reviewComment">Nhận xét</label>
                <textarea
                  id="reviewComment"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                  rows="4"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowReviewModal(false)}>Hủy</button>
                <button type="submit" className="save-btn">Gửi đánh giá</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTrackingModal && trackingOrder && (
        <div className="modal-overlay" onClick={() => setShowTrackingModal(false)}>
          <div className="modal-content tracking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Theo dõi đơn hàng #{trackingOrder.id}</h3>
              <button className="modal-close" onClick={() => setShowTrackingModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="tracking-steps">
                {getTrackingSteps(trackingOrder).map((step, index) => (
                  <div key={index} className={`tracking-step ${step.completed ? 'completed' : ''}`}>
                    <div className="step-marker">
                      {step.completed ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="step-circle"></div>
                      )}
                    </div>
                    <div className="step-content">
                      <div className="step-label">{step.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tracking-info">
                <p><strong>Ngày đặt hàng:</strong> {new Date(trackingOrder.date || trackingOrder.createdAt).toLocaleDateString('vi-VN')}</p>
                <p><strong>Trạng thái:</strong> {trackingOrder.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
