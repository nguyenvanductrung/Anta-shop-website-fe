// src/components/admin/RevenueStats.jsx (hoặc chỗ bạn đang để)
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './RevenueStats.css';
import { revenueService } from '../services/api.js'; // ⚠️ chỉnh lại path cho đúng với cấu trúc thư mục của bạn

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function formatCurrency(v) {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(v || 0);
  } catch (e) {
    return v;
  }
}

export default function RevenueStats() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});
  const [totals, setTotals] = useState({
    totalActual: 0,
    totalExpected: 0
  });

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);

        // Gọi BE: /api/dashboard/revenue/weekly
        const weekly = await revenueService.getWeeklyRevenue();
        const data = Array.isArray(weekly) ? weekly : [];

        // labels = tuần: "2025-W50", "2025-W51", ...
        const labels = data.map((item) => item.week);

        const expectedData = data.map(
          (item) => item.expectedRevenue || 0
        );
        const actualData = data.map(
          (item) => item.actualRevenue || 0
        );

        setChartData({
          labels,
          datasets: [
            {
              label: 'Doanh thu dự kiến (từ giỏ hàng)',
              data: expectedData,
              backgroundColor: 'rgba(245, 158, 11, 0.8)',
              borderColor: 'rgba(245, 158, 11, 1)',
              borderWidth: 1,
              borderRadius: 6,
              borderSkipped: false
            },
            {
              label: 'Doanh thu thực tế (đơn hàng hoàn tất)',
              data: actualData,
              backgroundColor: 'rgba(14, 165, 233, 0.8)',
              borderColor: 'rgba(14, 165, 233, 1)',
              borderWidth: 1,
              borderRadius: 6,
              borderSkipped: false
            }
          ]
        });

        setChartOptions({
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text: 'So sánh doanh thu thực tế vs dự kiến theo tuần',
              font: { size: 16, weight: 'bold' },
              padding: { top: 10, bottom: 20 }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${formatCurrency(
                    context.parsed.y
                  )}`;
                }
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: function (value) {
                  // hiển thị dạng 10M, 20M
                  return (value / 1_000_000).toFixed(0) + 'M';
                }
              }
            }
          }
        });

        const totalExpected = expectedData.reduce(
          (sum, v) => sum + v,
          0
        );
        const totalActual = actualData.reduce(
          (sum, v) => sum + v,
          0
        );

        setTotals({
          totalActual,
          totalExpected
        });
      } catch (err) {
        console.error('Load weekly revenue error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  return (
    <div className="revenue-stats-container">
      <div className="stats-header">
        <h2 className="stats-title">Thống kê doanh thu</h2>
        <div className="stats-summary">
          <div className="summary-item">
            <div className="summary-label">
              Tổng doanh thu thực tế (theo tuần)
            </div>
            <div className="summary-value">
              {formatCurrency(totals.totalActual)}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">
              Tổng doanh thu dự kiến (theo tuần)
            </div>
            <div className="summary-value">
              {formatCurrency(totals.totalExpected)}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-content">
        <div className="chart-grid">
          <div className="chart-card full-width">
            <div className="chart-container">
              {loading || !chartData ? (
                <div className="loading-state">
                  Đang tải dữ liệu doanh thu...
                </div>
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
