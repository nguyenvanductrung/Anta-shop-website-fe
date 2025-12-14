import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await adminService.users.getUsers();
    if (result.success) {
      setUsers(result.data);
      setFilteredUsers(result.data);
    } else {
      alert('Không thể tải danh sách người dùng');
    }
    setLoading(false);
  };

  const handleSearch = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilteredUsers(users);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const result = await adminService.users.updateUserStatus(userId, newStatus);
    
    if (result.success) {
      alert(result.message);
      await loadUsers();
      handleSearch();
    } else {
      alert(result.error || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      const result = await adminService.users.deleteUser(userId);
      if (result.success) {
        alert(result.message);
        await loadUsers();
        handleSearch();
      } else {
        alert(result.error || 'Không thể xóa người dùng');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang tải người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-content">
        <div className="page-header-section">
          <h1 className="page-main-title">Quản Lý Người Dùng</h1>
          <p className="page-subtitle">Quản lý tất cả người dùng và khách hàng</p>
        </div>

        <div className="users-stats-grid">
          <div className="stat-box total-users">
            <div className="stat-box-icon">👥</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{users.length}</div>
              <div className="stat-box-label">Tổng người dùng</div>
            </div>
          </div>
          <div className="stat-box active-users">
            <div className="stat-box-icon">✓</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{users.filter(u => u.status === 'active').length}</div>
              <div className="stat-box-label">Đang hoạt động</div>
            </div>
          </div>
          <div className="stat-box blocked-users">
            <div className="stat-box-icon">🚫</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{users.filter(u => u.status === 'blocked').length}</div>
              <div className="stat-box-label">Đã khóa</div>
            </div>
          </div>
          <div className="stat-box admin-users">
            <div className="stat-box-icon">⭐</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{users.filter(u => u.role === 'admin').length}</div>
              <div className="stat-box-label">Quản trị viên</div>
            </div>
          </div>
        </div>

        <div className="filters-card">
          <div className="filters-grid">
            <div className="filter-input-group">
              <label className="filter-label">Tìm kiếm</label>
              <input
                type="text"
                className="filter-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập tên hoặc email..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Vai trò</label>
              <select
                className="filter-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="admin">Quản trị viên</option>
                <option value="user">Khách hàng</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Trạng thái</label>
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="blocked">Đã khóa</option>
              </select>
            </div>
          </div>

          <div className="filter-actions-row">
            <button className="filter-search-btn" onClick={handleSearch}>
              <span className="btn-icon">🔍</span>
              Tìm kiếm
            </button>
            <button className="filter-reset-btn" onClick={handleReset}>
              <span className="btn-icon">↻</span>
              Đặt lại
            </button>
            <div className="total-results">
              <span className="result-count">{filteredUsers.length}</span> người dùng
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state-container">
            <span className="empty-icon">👥</span>
            <p className="empty-title">Không tìm thấy người dùng</p>
            <p className="empty-description">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
          </div>
        ) : (
          <div className="users-table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-user">Người dùng</th>
                  <th className="col-email">Email</th>
                  <th className="col-role">Vai trò</th>
                  <th className="col-orders">Đơn hàng</th>
                  <th className="col-spent">Đã chi tiêu</th>
                  <th className="col-joined">Ngày tham gia</th>
                  <th className="col-status">Trạng thái</th>
                  <th className="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="user-cell">
                      <div className="user-info-cell">
                        <div className="user-avatar-wrapper">
                          <span className="user-avatar-text">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="user-name-text">{user.username}</span>
                      </div>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td className="role-cell">
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? '⭐ Admin' : '👤 Khách hàng'}
                      </span>
                    </td>
                    <td className="orders-cell">{user.totalOrders}</td>
                    <td className="spent-cell">{user.totalSpent.toLocaleString('vi-VN')} ₫</td>
                    <td className="joined-cell">{formatDate(user.joinedDate)}</td>
                    <td className="status-cell">
                      <span className={`status-indicator ${user.status}`}>
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons-group">
                        <button 
                          className={`action-toggle-btn ${user.status === 'blocked' ? 'unlock' : ''}`}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          disabled={user.role === 'admin'}
                        >
                          {user.status === 'active' ? '🔒' : '🔓'}
                        </button>
                        <button 
                          className="action-delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Xóa"
                          disabled={user.role === 'admin'}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
