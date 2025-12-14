// src/pages/SearchPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "../components";
import "./SearchPage.css";
import { productService } from "../services/api";
import { getGroupedCategories } from "../services/categories";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();

  // ✅ dùng categoryId (string) để filter cho chắc
  const [filters, setFilters] = useState({
    categoryIds: [], // ["1","2"]
    price: "",
    size: [],
    color: [],
    brand: [],
  });

  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState("grid");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // categories map + options for sidebar
  const [categoryOptions, setCategoryOptions] = useState([]); // [{id,name,slug,title}]
  const [catById, setCatById] = useState({}); // { "1": {id,name,slug,title} }

  // ---------- helpers ----------
  const safeNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizeText = (v) => (v == null ? "" : String(v).trim());

  const getImage = (p) => {
    return (
      p?.thumbnail ||
      p?.image ||
      p?.imageUrl ||
      (Array.isArray(p?.images) && p.images[0]) ||
      "https://via.placeholder.com/600x600?text=No+Image"
    );
  };

  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

  const getVariantSizes = (p) => {
    const variants = Array.isArray(p?.variants) ? p.variants : [];
    return uniq(
      variants
        .map((v) => v?.attributes?.size ?? v?.size)
        .map((x) => (x == null ? null : String(x).trim()))
    );
  };

  const getVariantColors = (p) => {
    const variants = Array.isArray(p?.variants) ? p.variants : [];
    return uniq(
      variants
        .map((v) => v?.attributes?.color ?? v?.color)
        .map((x) => (x == null ? null : String(x).trim()))
    );
  };

  // resolve categoryId/categoryName/categorySlug
  const resolveCategoryId = (p) => {
    const cid = p?.categoryId ?? p?.category?.id ?? p?.category?.categoryId ?? null;
    return cid == null ? "" : String(cid);
  };

  const resolveCategoryName = (p) => {
    return (
      normalizeText(p?.categoryName) ||
      normalizeText(p?.category?.name) ||
      normalizeText(p?.category) ||
      ""
    );
  };

  const resolveCategorySlug = (p) => {
    // nếu sản phẩm có sẵn slug thì dùng, không thì lookup theo categoryId
    const direct =
      normalizeText(p?.categorySlug).toLowerCase() ||
      normalizeText(p?.category?.slug).toLowerCase() ||
      normalizeText(p?.slug).toLowerCase();

    if (direct) return direct;

    const cid = resolveCategoryId(p);
    const hit = catById?.[cid];
    return hit?.slug ? String(hit.slug).toLowerCase() : "";
  };

  // ---------- load categories (for filter) ----------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const grouped = await getGroupedCategories(); // { men: [...], women: [...] }

        const options = [];
        const byId = {};

        Object.keys(grouped || {}).forEach((title) => {
          const list = Array.isArray(grouped[title]) ? grouped[title] : [];
          list.forEach((c) => {
            const id = c?.id ?? c?.categoryId;
            if (id == null) return;

            const item = {
              id: String(id),
              name: c?.name || `Category ${id}`,
              slug: (c?.slug || "").toString().toLowerCase(),
              title: (c?.title || title || "").toString().toLowerCase(),
            };

            options.push(item);
            byId[item.id] = item;
          });
        });

        if (!mounted) return;
        setCategoryOptions(options);
        setCatById(byId);
      } catch {
        if (!mounted) return;
        setCategoryOptions([]);
        setCatById({});
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------- fetch products by query ----------
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        // searchProducts(q) của bạn đang gọi /api/product/search?q=
        const data = await productService.searchProducts(query);

        const raw = data?.data ?? data;
        const list =
          Array.isArray(raw) ? raw :
          Array.isArray(raw?.data) ? raw.data :
          Array.isArray(raw?.items) ? raw.items :
          Array.isArray(raw?.content) ? raw.content :
          [];

        if (!mounted) return;

        // normalize product for filters
        const normalized = list.map((p) => {
          const cid = resolveCategoryId(p);
          const cname = resolveCategoryName(p);
          const cslug = resolveCategorySlug(p);

          return {
            ...p,
            id: p?.id ?? p?.productId ?? p?.product_id ?? p?._id ?? p?.code ?? p?.sku,
            name: p?.name || p?.productName || "Sản phẩm",
            brand: normalizeText(p?.brand),
            price: safeNumber(p?.price),
            categoryId: cid,
            categoryName: cname,
            categorySlug: cslug,
            sizes: getVariantSizes(p),
            colors: getVariantColors(p),
          };
        });

        setProducts(normalized);
      } catch (e) {
        if (!mounted) return;
        setProducts([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [query, catById]); // catById thay đổi -> resolve slug chuẩn hơn

  // ---------- dynamic filter options from results ----------
  const availableBrands = useMemo(() => {
    return uniq(products.map((p) => p.brand).filter(Boolean)).sort((a, b) => a.localeCompare(b, "vi"));
  }, [products]);

  const availableSizes = useMemo(() => {
    return uniq(products.flatMap((p) => p.sizes || []));
  }, [products]);

  const availableColors = useMemo(() => {
    return uniq(products.flatMap((p) => p.colors || []));
  }, [products]);

  // categories for sidebar: nếu có categories API -> dùng theo API
  // nếu không có -> fallback từ products (categoryId + categoryName)
  const availableCategories = useMemo(() => {
    if (categoryOptions.length > 0) {
      // chỉ show những category thực sự xuất hiện trong kết quả search (đỡ dài)
      const used = new Set(products.map((p) => p.categoryId).filter(Boolean));
      return categoryOptions
        .filter((c) => used.has(c.id))
        .sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
    }

    // fallback
    const map = {};
    products.forEach((p) => {
      if (!p.categoryId) return;
      map[p.categoryId] = map[p.categoryId] || { id: p.categoryId, name: p.categoryName || `Category ${p.categoryId}` };
    });
    return Object.values(map).sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
  }, [products, categoryOptions]);

  // ---------- filters handlers ----------
  const toggleArrayFilter = (key, value) => {
    setFilters((prev) => {
      const arr = Array.isArray(prev[key]) ? prev[key] : [];
      if (arr.includes(value)) return { ...prev, [key]: arr.filter((v) => v !== value) };
      return { ...prev, [key]: [...arr, value] };
    });
  };

  const setSingleFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () => {
    setFilters({
      categoryIds: [],
      price: "",
      size: [],
      color: [],
      brand: [],
    });
  };

  // ---------- local filtering (after BE search) ----------
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      // brand
      if (filters.brand.length > 0) {
        if (!filters.brand.includes(p.brand)) return false;
      }

      // categoryIds
      if (filters.categoryIds.length > 0) {
        if (!p.categoryId || !filters.categoryIds.includes(String(p.categoryId))) return false;
      }

      // price
      if (filters.price) {
        const [min, max] = filters.price.split("-").map(Number);
        const price = safeNumber(p.price);
        if (price < (min || 0)) return false;
        if (max && price > max) return false;
      }

      // size
      if (filters.size.length > 0) {
        const ok = filters.size.some((s) => (p.sizes || []).includes(String(s)));
        if (!ok) return false;
      }

      // color
      if (filters.color.length > 0) {
        const ok = filters.color.some((c) => (p.colors || []).includes(String(c)));
        if (!ok) return false;
      }

      return true;
    });
  }, [products, filters]);

  // ---------- sorting ----------
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    list.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return safeNumber(a?.price) - safeNumber(b?.price);
        case "price-desc":
          return safeNumber(b?.price) - safeNumber(a?.price);
        case "newest": {
          const ta = a?.createdAt ? new Date(a.createdAt).getTime() : safeNumber(a?.id);
          const tb = b?.createdAt ? new Date(b.createdAt).getTime() : safeNumber(b?.id);
          return tb - ta;
        }
        default:
          return 0; // popular giữ nguyên
      }
    });
    return list;
  }, [filteredProducts, sortBy]);

  return (
    <Layout>
      <div className="search-page">
        <div className="breadcrumbs">
          <div className="container">
            <Link to="/home" className="breadcrumb-link">
              Trang chủ
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Tìm kiếm</span>
          </div>
        </div>

        <div className="search-container">
          <div className="search-header">
            <h1>Kết quả tìm kiếm {query && `cho "${query}"`}</h1>
            <p className="result-count">
              {loading ? "Đang tải..." : `${sortedProducts.length} sản phẩm`}
            </p>
          </div>

          <div className="search-layout">
            <aside className="filters-sidebar">
              <div className="filters-header">
                <h3>Bộ lọc</h3>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Xóa tất cả
                </button>
              </div>

              {/* ✅ Danh mục: lấy từ API categories/grouped hoặc fallback từ products */}
              <div className="filter-section">
                <h4 className="filter-title">Danh mục</h4>
                <div className="filter-options">
                  {availableCategories.length === 0 ? (
                    <div style={{ padding: 8, opacity: 0.7 }}>Không có danh mục</div>
                  ) : (
                    availableCategories.map((c) => (
                      <label key={c.id} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filters.categoryIds.includes(String(c.id))}
                          onChange={() => toggleArrayFilter("categoryIds", String(c.id))}
                        />
                        <span>{c.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="filter-section">
                <h4 className="filter-title">Khoảng giá</h4>
                <div className="filter-options">
                  {[
                    { label: "Dưới 500.000₫", value: "0-500000" },
                    { label: "500.000₫ - 1.000.000₫", value: "500000-1000000" },
                    { label: "1.000.000₫ - 2.000.000₫", value: "1000000-2000000" },
                    { label: "Trên 2.000.000₫", value: "2000000-999999999" },
                  ].map((range) => (
                    <label key={range.value} className="filter-radio">
                      <input
                        type="radio"
                        name="price"
                        checked={filters.price === range.value}
                        onChange={() => setSingleFilter("price", range.value)}
                      />
                      <span>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ✅ Size: lấy động từ variants */}
              <div className="filter-section">
                <h4 className="filter-title">Kích thước</h4>
                <div className="filter-options size-grid">
                  {availableSizes.length === 0 ? (
                    <div style={{ padding: 8, opacity: 0.7 }}>Không có size</div>
                  ) : (
                    availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`size-btn ${filters.size.includes(String(size)) ? "active" : ""}`}
                        onClick={() => toggleArrayFilter("size", String(size))}
                      >
                        {size}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ✅ Color: lấy động từ variants */}
              <div className="filter-section">
                <h4 className="filter-title">Màu sắc</h4>
                <div className="filter-options color-grid">
                  {availableColors.length === 0 ? (
                    <div style={{ padding: 8, opacity: 0.7 }}>Không có màu</div>
                  ) : (
                    availableColors.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className={`color-btn ${filters.color.includes(String(name)) ? "active" : ""}`}
                        onClick={() => toggleArrayFilter("color", String(name))}
                        title={name}
                      >
                        {/* nếu CSS đang dùng swatch thì vẫn ok; không có thì vẫn hiện tên */}
                        <span className="color-swatch" />
                        <span style={{ fontSize: 12, marginLeft: 6 }}>{name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ✅ Brand: lấy động từ products */}
              <div className="filter-section">
                <h4 className="filter-title">Thương hiệu</h4>
                <div className="filter-options">
                  {availableBrands.length === 0 ? (
                    <div style={{ padding: 8, opacity: 0.7 }}>Không có thương hiệu</div>
                  ) : (
                    availableBrands.map((brand) => (
                      <label key={brand} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filters.brand.includes(brand)}
                          onChange={() => toggleArrayFilter("brand", brand)}
                        />
                        <span>{brand}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <main className="results-main">
              <div className="results-toolbar">
                <div className="sort-section">
                  <label htmlFor="sort">Sắp xếp:</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="popular">Phổ biến</option>
                    <option value="newest">Mới nhất</option>
                    <option value="price-asc">Giá: Thấp đến cao</option>
                    <option value="price-desc">Giá: Cao đến thấp</option>
                  </select>
                </div>

                <div className="view-toggle">
                  <button
                    type="button"
                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    title="Xem dạng lưới"
                  >
                    ⊞
                  </button>
                  <button
                    type="button"
                    className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title="Xem dạng danh sách"
                  >
                    ☰
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="no-results">
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="no-results">
                  <p>Không tìm thấy sản phẩm</p>
                </div>
              ) : (
                <div className={`products-${viewMode}`}>
                  {sortedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="product-card"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="product-image-wrapper">
                        <img src={getImage(product)} alt={product.name || "Product"} />
                        <button type="button" className="wishlist-btn">
                          ♡
                        </button>
                      </div>

                      <div className="product-details">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-price">
                          <span className="current-price">
                            {safeNumber(product.price).toLocaleString()}₫
                          </span>
                        </div>

                        {viewMode === "list" && (
                          <div className="product-meta">
                            <p className="product-colors">
                              Màu: {(product.colors || []).join(", ") || "—"}
                            </p>
                            <p className="product-sizes">
                              Size: {(product.sizes || []).join(", ") || "—"}
                            </p>
                            <p style={{ opacity: 0.75 }}>
                              Danh mục: {product.categoryName || product.categoryId || "—"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sortedProducts.length > 0 && !loading && (
                <div className="pagination">
                  <button className="page-btn" disabled>
                    Trước
                  </button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">3</button>
                  <button className="page-btn">Sau</button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
