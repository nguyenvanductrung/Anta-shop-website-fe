import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./UserStats.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function UserStats() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeUsers: 0,
  });
  const [error, setError] = useState(null);

  // Năm đang chọn
  const [year, setYear] = useState(new Date().getFullYear());

  // Gọi API BE thật (port 8082)
  const fetchUserStats = async (selectedYear) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `http://localhost:8080/api/user/stats/monthly/full?year=${selectedYear}`,
        {
          headers: {
            "Content-Type": "application/json",
            // Nếu BE có token thì thêm:
            // "Authorization": `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`
          },
        }
      );

      if (!res.ok) throw new Error("Không thể lấy dữ liệu từ API!");

      const data = await res.json(); // [ {year, month, count}, ... ]

      const labels = data.map(
        (item) => `${String(item.month).padStart(2, "0")}/${item.year}`
      );

      const monthlyNewUsers = data.map((item) => item.count);

      // Cộng dồn tổng số người dùng
      let total = 0;
      const cumulativeUsers = monthlyNewUsers.map((c) => (total += c));

      // Tháng hiện tại
      const currentMonthIndex = new Date().getMonth(); // 0-11
      const newUsersThisMonth =
        monthlyNewUsers[currentMonthIndex] ?? monthlyNewUsers[data.length - 1];

      // Chart data
      const chartConfig = {
        labels,
        datasets: [
          {
            label: "Người dùng mới mỗi tháng",
            data: monthlyNewUsers,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
            pointRadius: 6,
          },
        ],
      };

      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: {
            display: true,
            text: `Biểu đồ người dùng theo tháng (${selectedYear})`,
            font: { size: 16, weight: "bold" },
          },
        },
        scales: {
          y: { beginAtZero: true },
        },
      };

      setChartData({ data: chartConfig, options: chartOptions });

      // Thiết lập thống kê
      setStats({
        totalUsers: cumulativeUsers[cumulativeUsers.length - 1] || 0,
        newUsersThisMonth,
        activeUsers: Math.floor(cumulativeUsers[cumulativeUsers.length - 1] * 0.7), // bạn có thể thay bằng API
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi không xác định");
      setLoading(false);
    }
  };

  // Fetch mỗi khi chọn năm
  useEffect(() => {
    fetchUserStats(year);
  }, [year]);

  return (
    <div className="user-stats-container">
      <div className="stats-header">
        <h2 className="stats-title">Thống kê người dùng</h2>

        {/* Bộ lọc chọn năm */}
        <div className="year-filter">
          <label>
            Chọn năm:&nbsp;
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </label>
        </div>

        {/* Summary box */}
        <div className="stats-summary">
          <div className="summary-item">
            <div className="summary-label">Tổng người dùng</div>
            <div className="summary-value">{stats.totalUsers.toLocaleString()}</div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Người mới (tháng này)</div>
            <div className="summary-value">{stats.newUsersThisMonth}</div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Người dùng hoạt động</div>
            <div className="summary-value">{stats.activeUsers.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="chart-section">
        <div className="chart-container">
          {error && <div className="error-state">{error}</div>}
          {loading ? (
            <div className="loading-state">Đang tải dữ liệu...</div>
          ) : chartData ? (
            <Line data={chartData.data} options={chartData.options} />
          ) : (
            <div className="empty-state">Không có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );
}
