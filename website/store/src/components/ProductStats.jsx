import React, { useEffect, useState } from 'react';
import adminProductService from '../services/admin/productService';
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
import './ProductStats.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23f3f4f6" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888" font-size="20">No Img</text></svg>';

function formatCurrency(v) {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  } catch (e) {
    return v;
  }
}

export default function ProductStats({ topN = 15, maxStockAxis = 1000 }) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [featured, setFeatured] = useState(null);
  const [totalStockSum, setTotalStockSum] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await adminProductService.getProducts({ page: 1, size: 500 });
        if (!res.success) throw new Error(res.error || 'Không lấy được danh sách sản phẩm');
        const products = res.data || [];

        // Normalize items: ensure numbers
        const items = products.map(p => {
          const price = Number(p.price || 0);
          const sales = Number(p.sales || 0);
          const totalStock = Number(p.totalStock ?? p.quantity ?? 0);
          const thumbnail = (p.thumbnail && String(p.thumbnail)) || (Array.isArray(p.images) && p.images[0]) || null;
          return {
            id: p.id,
            name: p.name || `#${p.id}`,
            price,
            sales,
            totalStock,
            thumbnail
          };
        });

        // choose top by totalStock (or by sales if prefer)
        // We'll pick top by (sales or totalStock) combination to surface interesting products.
        items.sort((a, b) => {
          // prioritize sales first, then stock
          return (b.sales - a.sales) || (b.totalStock - a.totalStock) || b.price - a.price;
        });

        const top = items.slice(0, topN);

        const labels = top.map(t => (t.name.length > 50 ? t.name.slice(0, 47) + '...' : t.name));
        const stockValues = top.map(t => t.totalStock);
        const soldValues = top.map(t => t.sales);

        // compute total stock across all products (use items, not only top)
        const totalStockAll = items.reduce((s, it) => s + (Number(it.totalStock) || 0), 0);

        const data = {
          labels,
          datasets: [
            {
              label: 'Tồn kho',
              data: stockValues,
              backgroundColor: 'rgba(14,165,164,0.9)',
              barThickness: 14
            },
            {
              label: 'Đã bán',
              data: soldValues,
              backgroundColor: 'rgba(34,139,230,0.85)',
              barThickness: 14
            }
          ]
        };

        const options = {
          indexAxis: 'y', // horizontal bars
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.dataset.label || '';
                  const v = context.parsed.x ?? context.parsed;
                  if (label === 'Tồn kho' || label === 'Đã bán') {
                    return `${label}: ${v}`;
                  }
                  return `${label}: ${v}`;
                }
              }
            },
            title: {
              display: true,
              text: 'So sánh tồn kho và số đã bán (Top sản phẩm)',
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: {
                top: 10,
                bottom: 20
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              // Remove max constraint to let chart auto-scale based on data
              ticks: {
                // show thousands with suffix
                callback: function (val) {
                  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                  return val;
                }
              }
            },
            y: {
              ticks: { autoSkip: false }
            }
          }
        };

        if (mounted) {
          setChartData({ data, options });
          setFeatured(top.length ? top[0] : null);
          setTotalStockSum(totalStockAll);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Lỗi khi tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [topN, maxStockAxis]);

  return (
    <div className="product-stats-container">
      <div className="stats-header">
        <h2 className="stats-title">Thống kê sản phẩm</h2>
        <div className="stats-summary">
          <div className="summary-item">
            <div className="summary-label">Tổng tồn kho</div>
            <div className="summary-value">{totalStockSum.toLocaleString()}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Top sản phẩm</div>
            <div className="summary-value">{topN}</div>
          </div>
        </div>
      </div>

      <div className="stats-content">
        <div className="chart-section">
          <div className="chart-container">
            {loading && <div className="loading-state">Đang tải dữ liệu...</div>}
            {error && <div className="error-state">Lỗi: {error}</div>}
            {!loading && !error && chartData && (
              <Bar data={chartData.data} options={chartData.options} />
            )}
            {!loading && !error && !chartData && <div className="no-data-state">Không có dữ liệu</div>}
          </div>
        </div>

        {featured && (
          <div className="featured-product-section">
            <h3 className="section-title">Sản phẩm nổi bật</h3>
            <div className="featured-product-card">
              <div className="product-image">
                <img
                  src={featured.thumbnail || PLACEHOLDER}
                  alt={featured.name}
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
              </div>
              <div className="product-info">
                <h4 className="product-name">{featured.name}</h4>
                <div className="product-price">{featured.price ? formatCurrency(featured.price) : '-'}</div>
                <div className="product-stats">
                  <div className="stat-item">
                    <span className="stat-label">Đã bán:</span>
                    <span className="stat-value sold">{featured.sales}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tồn kho:</span>
                    <span className="stat-value stock">{featured.totalStock}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
