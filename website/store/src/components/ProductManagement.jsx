import React, { useState, useEffect } from 'react';
import AdminAddProduct from './AdminAddProduct';
import { products as adminProductService } from '../services';
import './ProductManagement.css';

export default function ProductManagement({ activeSubTab, setActiveSubTab, onDataChange }) {
  const [filters, setFilters] = useState({
    name: '',
    quantityMin: '',
    quantityMax: '',
    category: '',
    priceMin: '',
    priceMax: ''
  });

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await adminProductService.getProducts();
      if (result?.success) {
        setProducts(result.data || []);
        setFilteredProducts(result.data || []);
      } else {
        alert('Không thể tải danh sách sản phẩm');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await adminProductService.getProducts(filters);
      if (result?.success) {
        setFilteredProducts(result.data || []);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      name: '',
      quantityMin: '',
      quantityMax: '',
      category: '',
      priceMin: '',
      priceMax: ''
    });
    setFilteredProducts(products);
  };

  const renderStars = (rating) => {
    const r = Number.isFinite(rating) ? rating : 0;
    return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '—';
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const placeholderImage = 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400';

  const getProductImage = (product) => {
    if (!product) return placeholderImage;
    return product.thumbnail || product.image || (product.images && product.images[0]) || placeholderImage;
  };

  // prefer totalStock, then quantity, then stock, or compute from variants
  const getProductStock = (product) => {
    if (!product) return 0;
    if (product.totalStock !== undefined && product.totalStock !== null) return product.totalStock;
    if (product.quantity !== undefined && product.quantity !== null) return product.quantity;
    if (product.stock !== undefined && product.stock !== null) return product.stock;
    if (Array.isArray(product.variants) && product.variants.length) {
      return product.variants.reduce((s, v) => s + (Number(v.stock ?? v.quantity ?? 0) || 0), 0);
    }
    return 0;
  };

  const getVariantsCount = (product) => {
    if (!product) return 0;
    if (Array.isArray(product.variants)) return product.variants.length;
    return 0;
  };

  const getVariantsTooltip = (product) => {
    if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return 'Không có variant';
    return product.variants
      .map(v => {
        const parts = [];
        if (v.sku) parts.push(`SKU:${v.sku}`);
        if (v.size !== undefined && v.size !== null && v.size !== '') parts.push(`Size:${v.size}`);
        if (v.color) parts.push(`${v.color}`);
        const stockVal = (v.stock !== undefined && v.stock !== null) ? v.stock : v.quantity ?? '—';
        parts.push(`Stock:${stockVal}`);
        return parts.join(' • ');
      })
      .join('\n');
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        const result = await adminProductService.deleteProduct(productId);
        if (result?.success) {
          alert(result.message || 'Đã xóa');
          await loadProducts();
          if (onDataChange) onDataChange();
        } else {
          alert(result.error || 'Không thể xóa sản phẩm');
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi khi xóa sản phẩm');
      }
    }
  };

  const handleEditProduct = async (productId) => {
    try {
      const result = await adminProductService.getProduct(productId);
      if (result?.success) {
        setEditingProduct(result.data);
        setActiveSubTab('add-product');
      } else {
        alert('Không thể tải thông tin sản phẩm');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải sản phẩm');
    }
  };

  const handleProductSaved = async (savedProduct) => {
    // savedProduct may be returned from service
    setEditingProduct(null);
    setActiveSubTab('my-products');
    await loadProducts();
    if (onDataChange) onDataChange();
  };

  if (activeSubTab === 'add-product') {
    return (
      <AdminAddProduct 
        editingProduct={editingProduct}
        onSaved={handleProductSaved}
        onCancel={() => {
          setEditingProduct(null);
          setActiveSubTab('my-products');
        }}
      />
    );
  }

  if (activeSubTab === 'violations') {
    return (
      <div className="product-management">
        <div className="product-management-content">
          <div className="page-header-section">
            <h1 className="page-main-title">Quản Lý Sản Phẩm</h1>
            <p className="page-subtitle">Vi phạm và cảnh báo</p>
          </div>

          <div className="tabs-section">
            <button 
              className="tab-button"
              onClick={() => setActiveSubTab('my-products')}
            >
              Sản phẩm của tôi
            </button>
            <button 
              className="tab-button"
              onClick={() => {
                setEditingProduct(null);
                setActiveSubTab('add-product');
              }}
            >
              Thêm sản phẩm
            </button>
            <button 
              className="tab-button active"
              onClick={() => setActiveSubTab('violations')}
            >
              Vi phạm
            </button>
          </div>

          <div className="empty-state-container">
            <span className="empty-icon">✓</span>
            <p className="empty-title">Không có vi phạm</p>
            <p className="empty-description">Tất cả sản phẩm đều tuân thủ chính sách của hệ thống</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="product-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="product-management-content">
        <div className="page-header-section">
          <h1 className="page-main-title">Quản Lý Sản Phẩm</h1>
          <p className="page-subtitle">Quản lý tất cả sản phẩm của bạn</p>
        </div>

        <div className="tabs-section">
          <button 
            className={`tab-button ${activeSubTab === 'my-products' ? 'active' : ''}`}
            onClick={() => {
              setEditingProduct(null);
              setActiveSubTab('my-products');
            }}
          >
            Sản phẩm của tôi
          </button>
          <button 
            className="tab-button"
            onClick={() => {
              setEditingProduct(null);
              setActiveSubTab('add-product');
            }}
          >
            Thêm sản phẩm
          </button>
          <button 
            className="tab-button"
            onClick={() => setActiveSubTab('violations')}
          >
            Vi phạm
          </button>
        </div>

        <div className="filters-card">
          <div className="filters-grid">
            <div className="filter-input-group">
              <label className="filter-label">Tên sản phẩm</label>
              <input
                type="text"
                className="filter-input"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Nhập tên sản phẩm..."
              />
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Danh mục</label>
              <input
                type="text"
                className="filter-input"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                placeholder="Nhập danh mục..."
              />
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Số lượng</label>
              <div className="range-filter">
                <input
                  type="number"
                  className="filter-input small"
                  value={filters.quantityMin}
                  onChange={(e) => handleFilterChange('quantityMin', e.target.value)}
                  placeholder="Tối thiểu"
                />
                <span className="range-separator">-</span>
                <input
                  type="number"
                  className="filter-input small"
                  value={filters.quantityMax}
                  onChange={(e) => handleFilterChange('quantityMax', e.target.value)}
                  placeholder="Tối đa"
                />
              </div>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Giá (x1000 VNĐ)</label>
              <div className="range-filter">
                <input
                  type="number"
                  className="filter-input small"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  placeholder="Tối thiểu"
                />
                <span className="range-separator">-</span>
                <input
                  type="number"
                  className="filter-input small"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  placeholder="Tối đa"
                />
              </div>
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
              <span className="result-count">{filteredProducts.length}</span> sản phẩm
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state-container">
            <span className="empty-icon">📦</span>
            <p className="empty-title">Không tìm thấy sản phẩm</p>
            <p className="empty-description">Thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
          </div>
        ) : (
          <div className="products-table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-product">Sản phẩm</th>
                  <th className="col-category">Danh mục</th>
                  <th className="col-price">Giá</th>
                  <th className="col-quantity">Số lượng</th>
                  <th className="col-sales">Đã bán</th>
                  <th className="col-variants">Variants</th>
                  <th className="col-rating">Đánh giá</th>
                  <th className="col-status">Trạng thái</th>
                  <th className="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="table-row">
                    <td className="product-cell">
                      <div className="product-info-cell">
                        <img src={getProductImage(product)} alt={product.name} className="product-thumbnail" />
                        <span className="product-name">{product.name}</span>
                      </div>
                    </td>
                    <td className="category-cell">{product.category}</td>
                    <td className="price-cell">{formatPrice(product.price)} VNĐ</td>
                    <td className="quantity-cell">
                      <span className={product.status === 'low-stock' ? 'low-stock-badge' : ''}>
                        {getProductStock(product)}
                      </span>
                    </td>
                    <td className="sales-cell">{product.sales ?? 0}</td>
                    <td className="variants-cell" title={getVariantsTooltip(product)}>
                      {getVariantsCount(product)}
                    </td>
                    <td className="rating-cell">
                      <span className="star-rating">{renderStars(product.rating)}</span>
                    </td>
                    <td className="status-cell">
                      <span className={`status-indicator ${product.status}`}>
                        {product.status === 'active' ? 'Đang bán' : 'Sắp hết'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons-group">
                        <button 
                          className="action-edit-btn"
                          onClick={() => handleEditProduct(product.id)}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-delete-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Xóa"
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
