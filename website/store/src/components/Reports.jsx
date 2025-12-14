import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import './Reports.css';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, selectedYear]);

  const loadReportData = async () => {
    setLoading(true);
    const result = await adminService.reports.getReports({ period: selectedPeriod, year: selectedYear });
    if (result.success) {
      setReportData(result.data);
    } else {
      alert('Không thể tải báo cáo');
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (loading) {
    return (
      <div className="reports">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports">
      <div className="reports-content">
        <div className="page-header-section">
          <div className="header-left">
            <h1 className="page-main-title">Báo Cáo & Thống Kê</h1>
            <p className="page-subtitle">Tổng quan về hoạt động kinh doanh</p>
          </div>
          <div className="header-filters">
            <select
              className="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="week">7 ngày qua</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm này</option>
            </select>
            <select
              className="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card revenue">
            <div className="stat-card-header">
              <div className="stat-icon">💰</div>
              <span className="stat-trend positive">+{reportData.overview.revenueGrowth}%</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-value">{(reportData.overview.totalRevenue / 1000000).toFixed(1)}M</div>
              <div className="stat-label">Doanh thu</div>
            </div>
          </div>

          <div className="overview-stat-card orders">
            <div className="stat-card-header">
              <div className="stat-icon">📦</div>
              <span className="stat-trend positive">+{reportData.overview.ordersGrowth}%</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-value">{formatNumber(reportData.overview.totalOrders)}</div>
              <div className="stat-label">Đơn hàng</div>
            </div>
          </div>

          <div className="overview-stat-card customers">
            <div className="stat-card-header">
              <div className="stat-icon">👥</div>
              <span className="stat-trend positive">+{reportData.overview.customersGrowth}%</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-value">{formatNumber(reportData.overview.totalCustomers)}</div>
              <div className="stat-label">Khách hàng</div>
            </div>
          </div>

          <div className="overview-stat-card average">
            <div className="stat-card-header">
              <div className="stat-icon">📊</div>
              <span className="stat-trend positive">+{reportData.overview.avgOrderGrowth}%</span>
            </div>
            <div className="stat-card-body">
              <div className="stat-value">{(reportData.overview.avgOrderValue / 1000).toFixed(0)}K</div>
              <div className="stat-label">Giá trị TB</div>
            </div>
          </div>
        </div>

        <div className="reports-grid">
          <div className="report-card revenue-chart-card">
            <div className="report-card-header">
              <h2 className="report-card-title">Biểu Đồ Doanh Thu</h2>
              <div className="report-card-legend">
                <span className="legend-item revenue">Doanh thu</span>
                <span className="legend-item profit">Lợi nhuận</span>
              </div>
            </div>
            <div className="chart-container">
              <div className="bar-chart">
                {reportData.revenueChart.map((item, index) => (
                  <div key={index} className="bar-chart-item">
                    <div className="bar-wrapper">
                      <div 
                        className="bar revenue-bar"
                        style={{ height: `${(item.revenue / reportData.revenueChart.reduce((max, i) => Math.max(max, i.revenue), 0)) * 100}%` }}
                        title={formatCurrency(item.revenue)}
                      ></div>
                      <div 
                        className="bar profit-bar"
                        style={{ height: `${(item.profit / reportData.revenueChart.reduce((max, i) => Math.max(max, i.revenue), 0)) * 100}%` }}
                        title={formatCurrency(item.profit)}
                      ></div>
                    </div>
                    <div className="bar-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="report-card category-sales-card">
            <div className="report-card-header">
              <h2 className="report-card-title">Doanh Thu Theo Danh Mục</h2>
            </div>
            <div className="category-list">
              {reportData.categorySales.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </div>
                  <div className="category-stats">
                    <div className="category-revenue">{formatCurrency(category.revenue)}</div>
                    <div className="category-percentage">{category.percentage}%</div>
                  </div>
                  <div className="category-bar-wrapper">
                    <div 
                      className="category-bar"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="reports-grid">
          <div className="report-card top-products-card">
            <div className="report-card-header">
              <h2 className="report-card-title">Sản Phẩm Bán Chạy</h2>
            </div>
            <div className="top-products-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th className="col-rank">#</th>
                    <th className="col-product">Sản phẩm</th>
                    <th className="col-sold">Đã bán</th>
                    <th className="col-revenue">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="rank-cell">
                        <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                      </td>
                      <td className="product-cell">
                        <div className="product-info-mini">
                          <img src={product.image} alt={product.name} className="product-mini-img" />
                          <span className="product-mini-name">{product.name}</span>
                        </div>
                      </td>
                      <td className="sold-cell">{formatNumber(product.sold)}</td>
                      <td className="revenue-cell">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-card customer-stats-card">
            <div className="report-card-header">
              <h2 className="report-card-title">Thống Kê Khách Hàng</h2>
            </div>
            <div className="customer-stats-content">
              <div className="customer-stat-item">
                <div className="customer-stat-icon">🆕</div>
                <div className="customer-stat-info">
                  <div className="customer-stat-value">{formatNumber(reportData.customerStats.newCustomers)}</div>
                  <div className="customer-stat-label">Khách hàng mới</div>
                </div>
              </div>
              <div className="customer-stat-item">
                <div className="customer-stat-icon">🔄</div>
                <div className="customer-stat-info">
                  <div className="customer-stat-value">{formatNumber(reportData.customerStats.returningCustomers)}</div>
                  <div className="customer-stat-label">Khách quay lại</div>
                </div>
              </div>
              <div className="customer-stat-item">
                <div className="customer-stat-icon">⭐</div>
                <div className="customer-stat-info">
                  <div className="customer-stat-value">{reportData.customerStats.retentionRate}%</div>
                  <div className="customer-stat-label">Tỷ lệ giữ chân</div>
                </div>
              </div>
              <div className="customer-stat-item">
                <div className="customer-stat-icon">💎</div>
                <div className="customer-stat-info">
                  <div className="customer-stat-value">{formatCurrency(reportData.customerStats.avgLifetimeValue)}</div>
                  <div className="customer-stat-label">Giá trị trọn đời TB</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="report-card performance-metrics-card">
          <div className="report-card-header">
            <h2 className="report-card-title">Chỉ Số Hiệu Suất</h2>
          </div>
          <div className="metrics-grid">
            {reportData.performanceMetrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-icon-wrapper">
                  <span className="metric-icon">{metric.icon}</span>
                </div>
                <div className="metric-content">
                  <div className="metric-label">{metric.label}</div>
                  <div className="metric-value">{metric.value}</div>
                  <div className={`metric-change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                    <span className="change-icon">{metric.change >= 0 ? '📈' : '📉'}</span>
                    <span className="change-text">{Math.abs(metric.change)}% so với kỳ trước</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
