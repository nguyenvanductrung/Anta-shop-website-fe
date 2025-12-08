// src/pages/ProductListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components";
import { products as productApi } from "../services";
import { useCart } from "../contexts";
import "./ProductListPage.css";

export default function ProductListPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // UI state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid");

  // data state
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [error, setError] = useState(null);

  const placeholder =
    "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600";

  // fetch products
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productApi.getProducts();
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (!mounted) return;

        // Chuẩn hóa một chút để render ổn định
        const norm = list.map((p) => ({
          ...p,
          images: Array.isArray(p.images) ? p.images : [],
          thumbnail: p.thumbnail || (Array.isArray(p.images) ? p.images[0] : null),
          variants: Array.isArray(p.variants) ? p.variants : [],
          price: Number(p.price || 0),
          category: p.category || "",
          name: p.name || p.productName || "Sản phẩm",
        }));
        setAllProducts(norm);
      } catch (e) {
        if (mounted) setError(e?.message || "Lỗi tải sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // ---- helpers ----
  const formatPrice = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      Number(n || 0)
    );

  const displayPrice = (p) => {
    if (p.price && p.price > 0) return Number(p.price);
    const vs = (p.variants || []).map((v) => Number(v?.price || 0)).filter((x) => x > 0);
    return vs.length ? Math.min(...vs) : 0;
  };

  const productSizes = (p) => {
    const set = new Set();
    (p.variants || []).forEach((v) => {
      const s = v?.attributes?.size ?? v?.size;
      if (s !== undefined && s !== null && String(s).trim()) set.add(String(s));
    });
    return Array.from(set);
  };

  // derive all sizes để hiện filter (nếu bạn muốn dùng sau: có thể đẩy ra sidebar)
  const allSizesSet = useMemo(() => {
    const set = new Set();
    allProducts.forEach((p) => productSizes(p).forEach((s) => set.add(s)));
    return set;
  }, [allProducts]);

  // ---- filtering ----
  const filtered = useMemo(() => {
    let list = [...allProducts];

    // category
    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // size
    if (selectedSize !== "all") {
      list = list.filter((p) => productSizes(p).includes(String(selectedSize)));
    }

    // price range
    list = list.filter((p) => {
      const price = displayPrice(p);
      if (priceRange === "under1m") return price < 1_000_000;
      if (priceRange === "1m-2m") return price >= 1_000_000 && price <= 2_000_000;
      if (priceRange === "over2m") return price > 2_000_000;
      return true; // all
    });

    // sorting
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => displayPrice(a) - displayPrice(b));
        break;
      case "price-desc":
        list.sort((a, b) => displayPrice(b) - displayPrice(a));
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name, "vi"));
        break;
      case "newest":
        // nếu backend có createdAt -> ưu tiên; ở đây fallback id desc
        list.sort((a, b) => (b.createdAt || b.id || 0) - (a.createdAt || a.id || 0));
        break;
      default:
        break;
    }

    return list;
  }, [allProducts, selectedCategory, selectedSize, priceRange, sortBy]);

  const handleProductClick = (productId) => navigate(`/product/${productId}`);

  const handleQuickAdd = (e, p) => {
    e.stopPropagation();
    const price = displayPrice(p);
    addToCart({
      id: p.id,
      name: p.name,
      price,
      image: p.thumbnail || p.images?.[0] || placeholder,
      quantity: 1,
    });
    alert("Đã thêm vào giỏ hàng!");
  };

  // ---- render ----
  return (
    <Layout>
      <div className="product-list-page">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <div className="container">
            <span className="breadcrumb-link" onClick={() => navigate("/home")}>
              Trang chủ
            </span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Sản phẩm</span>
          </div>
        </div>

        {/* Header */}
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">Tất Cả Sản Phẩm</h1>
            <p className="page-subtitle">Khám phá bộ sưu tập sản phẩm chính hãng</p>
          </div>
        </div>

        {/* Content */}
        <div className="products-section">
          <div className="container">
            <div className="products-layout">
              {/* Sidebar Filters */}
              <aside className="filters-sidebar">
                <h2 className="sidebar-main-title">Bộ lọc</h2>

                <div className="filter-section">
                  <h3 className="filter-title">Danh Mục</h3>
                  <div className="filter-options">
                    {[
                      ["all", "Tất cả"],
                      ["running", "Giày Chạy"],
                      ["basketball", "Giày Bóng Rổ"],
                      ["lifestyle", "Lifestyle"],
                      ["training", "Training"],
                    ].map(([val, label]) => (
                      <label key={val} className="filter-option">
                        <input
                          type="radio"
                          name="category"
                          value={val}
                          checked={selectedCategory === val}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h3 className="filter-title">Kích Thước</h3>
                  <div className="filter-options">
                    <label className="filter-option">
                      <input
                        type="radio"
                        name="size"
                        value="all"
                        checked={selectedSize === "all"}
                        onChange={(e) => setSelectedSize(e.target.value)}
                      />
                      <span>Tất cả</span>
                    </label>
                    {[...allSizesSet].map((s) => (
                      <label key={s} className="filter-option">
                        <input
                          type="radio"
                          name="size"
                          value={s}
                          checked={selectedSize === String(s)}
                          onChange={(e) => setSelectedSize(e.target.value)}
                        />
                        <span>Size {s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h3 className="filter-title">Giá</h3>
                  <div className="filter-options">
                    {[
                      ["all", "Tất cả"],
                      ["under1m", "Dưới 1.000.000₫"],
                      ["1m-2m", "1.000.000₫ - 2.000.000₫"],
                      ["over2m", "Trên 2.000.000₫"],
                    ].map(([val, label]) => (
                      <label key={val} className="filter-option">
                        <input
                          type="radio"
                          name="price"
                          value={val}
                          checked={priceRange === val}
                          onChange={(e) => setPriceRange(e.target.value)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Main */}
              <div className="products-main">
                <div className="products-toolbar">
                  <div className="toolbar-left">
                    {loading ? (
                      <span className="products-count">Đang tải…</span>
                    ) : error ? (
                      <span className="products-count">Lỗi: {error}</span>
                    ) : (
                      <span className="products-count">{filtered.length} sản phẩm</span>
                    )}
                  </div>

                  <div className="toolbar-right">
                    <div className="view-mode-toggle">
                      <button
                        className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                        onClick={() => setViewMode("grid")}
                        aria-label="Grid view"
                      >
                        ⊞
                      </button>
                      <button
                        className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                        onClick={() => setViewMode("list")}
                        aria-label="List view"
                      >
                        ☰
                      </button>
                    </div>

                    <select
                      className="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="default">Mặc định</option>
                      <option value="price-asc">Giá: Thấp đến cao</option>
                      <option value="price-desc">Giá: Cao đến thấp</option>
                      <option value="name-asc">Tên: A-Z</option>
                      <option value="name-desc">Tên: Z-A</option>
                      <option value="newest">Mới nhất</option>
                    </select>
                  </div>
                </div>

                <div className={`products-grid ${viewMode}`}>
                  {!loading &&
                    !error &&
                    filtered.map((p) => {
                      const price = displayPrice(p);
                      const thumb = p.thumbnail || p.images?.[0] || placeholder;

                      return (
                        <div
                          key={p.id}
                          className="product-card"
                          onClick={() => handleProductClick(p.id)}
                        >
                          <div className="product-image">
                            <img src={thumb} alt={p.name} />
                            {!!p.badge && (
                              <span className={`product-badge ${String(p.badge).toLowerCase()}`}>
                                {p.badge}
                              </span>
                            )}
                            <div className="product-overlay">
                              <button
                                className="quick-view"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/product/${p.id}`);
                                }}
                              >
                                XEM NHANH
                              </button>
                              <button
                                className="add-to-cart"
                                onClick={(e) => handleQuickAdd(e, p)}
                              >
                                THÊM VÀO GIỎ
                              </button>
                            </div>
                          </div>

                          <div className="product-info">
                            <h3 className="product-name">{p.name}</h3>
                            <div className="product-price">
                              <span className="current-price">{formatPrice(price)}</span>
                              {p.originalPrice && Number(p.originalPrice) > price && (
                                <span className="original-price">
                                  {formatPrice(Number(p.originalPrice))}
                                </span>
                              )}
                              {p.originalPrice && Number(p.originalPrice) > price && (
                                <span className="discount">
                                  -
                                  {Math.round(
                                    ((Number(p.originalPrice) - price) /
                                      Number(p.originalPrice)) *
                                      100
                                  )}
                                  %
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Basic pagination placeholder (client-side) */}
                <div className="pagination">
                  <button className="pagination-btn" disabled>
                    ‹
                  </button>
                  <button className="pagination-btn active">1</button>
                  <button className="pagination-btn" disabled>
                    2
                  </button>
                  <button className="pagination-btn" disabled>
                    3
                  </button>
                  <button className="pagination-btn" disabled>
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}