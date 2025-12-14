// src/pages/ProductStatsPage.jsx
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23f3f4f6" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888" font-size="20">No Img</text></svg>';

function formatCurrency(v) {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  } catch (e) {
    return v;
  }
}

export default function ProductStatsPage({ topN = 15, maxStockAxis = 1000 }) {
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
              display: true,            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: maxStockAxis,
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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <h3 style={{ margin: 0 }}>Tổng quan sản phẩm</h3>
              <div style={{ color: '#666', fontSize: 19 }}>So sánh tồn kho và số đã bán (Top {topN})</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, color: '#d83434ff' }}>Tổng tồn kho</div>
              <div style={{ fontSize: 20, fontWeight: 700 , color: "#130e0eff" }}>{totalStockSum}</div>
            </div>
          </div>

          <div style={{ height: 420, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
            {loading && <div>Đang tải dữ liệu...</div>}
            {error && <div style={{ color: 'red' }}>Lỗi: {error}</div>}
            {!loading && !error && chartData && (
              <Bar data={chartData.data} options={chartData.options} />
            )}
            {!loading && !error && !chartData && <div>Không có dữ liệu</div>}
          </div>
        </div>

        {/* RIGHT: Featured product */}
        <aside style={{ width: 280 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
            <h4 style={{ marginTop: 0 }}>Sản phẩm nổi bật</h4>
            {featured ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                  <img
                    src={featured.thumbnail || PLACEHOLDER}
                    alt={featured.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = PLACEHOLDER; }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#111' }}>{featured.name}</div>
                  <div style={{ color: '#0EA5A4', fontWeight: 700, marginTop: 8 }}>{featured.price ? formatCurrency(featured.price) : '-'}</div>
                  <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                    Đã bán: <strong style={{ color: '#111' }}>{featured.sales}</strong>
                    <br />
                    Tồn kho: <strong style={{ color: '#111' }}>{featured.totalStock}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#777' }}>Không có sản phẩm để hiển thị.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
