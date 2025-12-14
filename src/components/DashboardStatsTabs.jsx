import React, { useState } from 'react';
import ProductStats from './ProductStats';
import RevenueStats from './RevenueStats';
import UserStats from './UserStats';
import './DashboardStatsTabs.css';

const DashboardStatsTabs = () => {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: 'Thống kê sản phẩm', icon: '📦' },
    { id: 'revenue', label: 'Thống kê doanh thu', icon: '💰' },
    { id: 'users', label: 'Thống kê người dùng', icon: '👥' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductStats />;
      case 'revenue':
        return <RevenueStats />;
      case 'users':
        return <UserStats />;
      default:
        return <ProductStats />;
    }
  };

  return (
    <div className="dashboard-stats-tabs">
      <div className="stats-tabs-header">
        <div className="tabs-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stats-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DashboardStatsTabs;
