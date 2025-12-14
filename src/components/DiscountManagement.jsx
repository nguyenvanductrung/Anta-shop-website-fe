import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import './DiscountManagement.css';

export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'fixed',
    discountValue: '',
    minOrder: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    description: ''
  });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    const result = await adminService.discounts.getDiscounts();
    if (result.success) {
      setDiscounts(result.data);
      setFilteredDiscounts(result.data);
    } else {
      alert('Không thể tải danh sách mã giảm giá');
    }
    setLoading(false);
  };

  const handleSearch = () => {
    let filtered = [...discounts];

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    setFilteredDiscounts(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilteredDiscounts(discounts);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'fixed',
      discountValue: '',
      minOrder: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      description: ''
    });
    setEditingDiscount(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      discountType: discount.type,
      discountValue: discount.value,
      minOrder: discount.minOrder,
      maxDiscount: discount.maxDiscount || '',
      startDate: discount.startDate,
      endDate: discount.endDate,
      usageLimit: discount.usageLimit,
      description: discount.description
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.discountValue || !formData.minOrder) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const discountData = {
      code: formData.code.toUpperCase(),
      type: formData.discountType,
      value: parseInt(formData.discountValue),
      minOrder: parseInt(formData.minOrder),
      maxDiscount: formData.maxDiscount ? parseInt(formData.maxDiscount) : null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: parseInt(formData.usageLimit),
      description: formData.description
    };

    let result;
    if (editingDiscount) {
      result = await adminService.discounts.updateDiscount(editingDiscount.id, discountData);
    } else {
      result = await adminService.discounts.createDiscount(discountData);
    }

    if (result.success) {
      alert(result.message);
      await loadDiscounts();
      handleCloseModal();
    } else {
      alert(result.error || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (window.confirm('Bạn có chắc muốn xóa mã giảm giá này?')) {
      const result = await adminService.discounts.deleteDiscount(discountId);
      if (result.success) {
        alert(result.message);
        await loadDiscounts();
        handleSearch();
      } else {
        alert(result.error || 'Không thể xóa mã giảm giá');
      }
    }
  };

  const handleToggleStatus = async (discountId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const result = await adminService.discounts.updateDiscountStatus(discountId, newStatus);
    
    if (result.success) {
      alert(result.message);
      await loadDiscounts();
      handleSearch();
    } else {
      alert(result.error || 'Không thể cập nhật trạng thái');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="discount-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang tải mã giảm giá...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="discount-management">
      <div className="discount-management-content">
        <div className="page-header-section">
          <div className="header-left">
            <h1 className="page-main-title">Quản Lý Mã Giảm Giá</h1>
            <p className="page-subtitle">Tạo và quản lý các mã giảm giá cho khách hàng</p>
          </div>
          <button className="add-discount-btn" onClick={handleOpenAddModal}>
            <span className="btn-icon">➕</span>
            Thêm Mã Giảm Giá
          </button>
        </div>

        <div className="discount-stats-grid">
          <div className="stat-box total-discounts">
            <div className="stat-box-icon">🎟️</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{discounts.length}</div>
              <div className="stat-box-label">Tổng mã</div>
            </div>
          </div>
          <div className="stat-box active-discounts">
            <div className="stat-box-icon">✓</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{discounts.filter(d => d.status === 'active').length}</div>
              <div className="stat-box-label">Đang hoạt động</div>
            </div>
          </div>
          <div className="stat-box used-discounts">
            <div className="stat-box-icon">📊</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{discounts.reduce((sum, d) => sum + d.used, 0)}</div>
              <div className="stat-box-label">Đã sử dụng</div>
            </div>
          </div>
          <div className="stat-box total-saved">
            <div className="stat-box-icon">💰</div>
            <div className="stat-box-content">
              <div className="stat-box-value">{Math.round(discounts.reduce((sum, d) => sum + d.totalSaved, 0) / 1000000)}M</div>
              <div className="stat-box-label">Tổng giảm</div>
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
                placeholder="Nhập mã hoặc mô tả..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
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
                <option value="inactive">Không hoạt động</option>
                <option value="expired">Hết hạn</option>
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
              <span className="result-count">{filteredDiscounts.length}</span> mã giảm giá
            </div>
          </div>
        </div>

        {filteredDiscounts.length === 0 ? (
          <div className="empty-state-container">
            <span className="empty-icon">🎟️</span>
            <p className="empty-title">Không tìm thấy mã giảm giá</p>
            <p className="empty-description">Thử thay đổi bộ lọc hoặc thêm mã giảm giá mới</p>
          </div>
        ) : (
          <div className="discounts-grid">
            {filteredDiscounts.map((discount) => (
              <div key={discount.id} className={`discount-card ${discount.status}`}>
                <div className="discount-card-header">
                  <div className="discount-code-badge">
                    <span className="code-icon">🎟️</span>
                    <span className="code-text">{discount.code}</span>
                  </div>
                  <span className={`discount-status-badge ${discount.status}`}>
                    {discount.status === 'active' ? 'Hoạt động' : 
                     discount.status === 'expired' ? 'Hết hạn' : 'Tạm dừng'}
                  </span>
                </div>

                <div className="discount-card-body">
                  <div className="discount-value-section">
                    <div className="discount-value-label">Giảm giá:</div>
                    <div className="discount-value-amount">
                      {discount.type === 'fixed' 
                        ? `${formatCurrency(discount.value)} ₫`
                        : `${discount.value}%`}
                    </div>
                  </div>

                  <div className="discount-details">
                    <div className="detail-row">
                      <span className="detail-icon">📦</span>
                      <span className="detail-text">Đơn tối thiểu: {formatCurrency(discount.minOrder)} ₫</span>
                    </div>
                    {discount.maxDiscount && (
                      <div className="detail-row">
                        <span className="detail-icon">🔝</span>
                        <span className="detail-text">Giảm tối đa: {formatCurrency(discount.maxDiscount)} ₫</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">
                        {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">👥</span>
                      <span className="detail-text">
                        Đã dùng: {discount.used}/{discount.usageLimit}
                      </span>
                    </div>
                  </div>

                  {discount.description && (
                    <div className="discount-description">
                      {discount.description}
                    </div>
                  )}

                  <div className="discount-stats-row">
                    <div className="stat-item">
                      <div className="stat-item-label">Đã tiết kiệm</div>
                      <div className="stat-item-value">{formatCurrency(discount.totalSaved)} ₫</div>
                    </div>
                  </div>
                </div>

                <div className="discount-card-footer">
                  <button 
                    className="discount-edit-btn"
                    onClick={() => handleEditDiscount(discount)}
                  >
                    <span className="btn-icon">✏️</span>
                    Sửa
                  </button>
                  <button 
                    className={`discount-toggle-btn ${discount.status === 'inactive' ? 'activate' : ''}`}
                    onClick={() => handleToggleStatus(discount.id, discount.status)}
                  >
                    <span className="btn-icon">{discount.status === 'active' ? '⏸' : '▶'}</span>
                    {discount.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
                  </button>
                  <button 
                    className="discount-delete-btn"
                    onClick={() => handleDeleteDiscount(discount.id)}
                  >
                    <span className="btn-icon">🗑️</span>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingDiscount ? 'Chỉnh Sửa Mã Giảm Giá' : 'Thêm Mã Giảm Giá Mới'}
              </h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-input-group">
                  <label className="input-label required">Mã giảm giá</label>
                  <input
                    type="text"
                    className="form-text-input"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="VD: SUMMER2024"
                    required
                  />
                </div>

                <div className="form-input-group">
                  <label className="input-label required">Loại giảm giá</label>
                  <select
                    className="form-select-input"
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    required
                  >
                    <option value="fixed">Giảm cố định (VNĐ)</option>
                    <option value="percent">Giảm phần trăm (%)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-input-group">
                  <label className="input-label required">
                    {formData.discountType === 'fixed' ? 'Số tiền giảm (VNĐ)' : 'Phần trăm giảm (%)'}
                  </label>
                  <input
                    type="number"
                    className="form-text-input"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    placeholder={formData.discountType === 'fixed' ? '50000' : '10'}
                    required
                  />
                </div>

                <div className="form-input-group">
                  <label className="input-label required">Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    className="form-text-input"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({...formData, minOrder: e.target.value})}
                    placeholder="999000"
                    required
                  />
                </div>
              </div>

              {formData.discountType === 'percent' && (
                <div className="form-input-group">
                  <label className="input-label">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    className="form-text-input"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                    placeholder="100000"
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-input-group">
                  <label className="input-label required">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="form-text-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>

                <div className="form-input-group">
                  <label className="input-label required">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="form-text-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-input-group">
                <label className="input-label required">Giới hạn sử dụng</label>
                <input
                  type="number"
                  className="form-text-input"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  placeholder="100"
                  required
                />
              </div>

              <div className="form-input-group">
                <label className="input-label">Mô tả</label>
                <textarea
                  className="form-textarea-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả về mã giảm giá..."
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="modal-cancel-btn" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="modal-submit-btn">
                  {editingDiscount ? 'Cập Nhật' : 'Thêm Mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
