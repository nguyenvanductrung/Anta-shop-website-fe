import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components";
import { useCart } from "../contexts";
import { getGroupedCategories } from "../services/categories";
import { productService } from "../services/api"; // ✅ dùng đúng service
import "./ProductListPage.css";

const TITLE_LABELS = { men: "Nam", women: "Nữ", accessories: "Phụ kiện", kids: "Kids" };

export default function ProductListPage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { title, slug } = useParams();

  const normTitle = title ? String(title).toLowerCase() : null;
  const normSlug = slug ? String(slug).toLowerCase() : null;

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

  // categories in sidebar
  const [categoryOptions, setCategoryOptions] = useState([["all", "Tất cả"]]);

  // maps để resolve categorySlug từ product.categoryId / categoryName
  const [catById, setCatById] = useState({});     // { [id]: {slug,name,title} }
  const [catByName, setCatByName] = useState({}); // { [lowerName]: {slug,name,title} }

  const placeholder =
    "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=600";

  // sync selectedCategory theo slug URL
  useEffect(() => {
    if (normSlug) setSelectedCategory(normSlug);
    else setSelectedCategory("all");
  }, [normSlug]);

  // load categories grouped + build options + build maps
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const grouped = await getGroupedCategories(); // { men: [{id,name,slug,title?}], women: ... }

        if (!mounted) return;

        // build maps
        const byId = {};
        const byName = {};

        Object.keys(grouped || {}).forEach((k) => {
          const list = Array.isArray(grouped[k]) ? grouped[k] : [];
          list.forEach((c) => {
            const id = c?.id ?? c?.categoryId;
            const slug = (c?.slug ?? "").toString().toLowerCase();
            const name = (c?.name ?? "").toString();
            const title = (c?.title ?? k ?? "").toString().toLowerCase();

            if (id != null) byId[String(id)] = { slug, name, title };
            if (name) byName[name.toLowerCase()] = { slug, name, title };
          });
        });

        setCatById(byId);
        setCatByName(byName);

        // options theo title route (men/women/...)
        const list = normTitle && grouped?.[normTitle] ? grouped[normTitle] : [];
        const opts = [
          ["all", "Tất cả"],
          ...list.map((c) => [String(c.slug).toLowerCase(), c.name]),
        ];
        setCategoryOptions(opts);
      } catch {
        // fallback: vẫn cho hiện "Tất cả"
        setCategoryOptions([["all", "Tất cả"]]);
        setCatById({});
        setCatByName({});
      }
    })();

    return () => {
      mounted = false;
    };
  }, [normTitle]);

  // helper resolve slug/title từ product
  const resolveCategorySlug = (p) => {
    const direct =
      (p?.categorySlug && String(p.categorySlug).toLowerCase()) ||
      (p?.slug && String(p.slug).toLowerCase()) ||
      (p?.category?.slug && String(p.category.slug).toLowerCase()) ||
      "";

    if (direct) return direct;

    const cid = p?.categoryId ?? p?.category?.id ?? null;
    if (cid != null) {
      const hit = catById[String(cid)];
      if (hit?.slug) return hit.slug;
    }

    const cname =
      (p?.categoryName ?? p?.category ?? p?.category?.name ?? "").toString().trim();
    if (cname) {
      const hit = catByName[cname.toLowerCase()];
      if (hit?.slug) return hit.slug;
    }

    return "";
  };

  const resolveTitleGroup = (p) => {
    const direct =
      (p?.title && String(p.title).toLowerCase()) ||
      (p?.groupTitle && String(p.groupTitle).toLowerCase()) ||
      "";

    if (direct) return direct;

    const cid = p?.categoryId ?? p?.category?.id ?? null;
    if (cid != null) {
      const hit = catById[String(cid)];
      if (hit?.title) return hit.title;
    }

    const cname =
      (p?.categoryName ?? p?.category ?? p?.category?.name ?? "").toString().trim();
    if (cname) {
      const hit = catByName[cname.toLowerCase()];
      if (hit?.title) return hit.title;
    }

    return "";
  };

  // fetch products (luôn lấy list và FE tự filter an toàn)
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // ưu tiên endpoint /api/product/all (bạn đã thêm getAllProducts)
        const resp = await productService.getAllProducts({ page: 0, size: 500 });

        const raw = resp?.data ?? resp;
        const list =
          Array.isArray(raw) ? raw :
          Array.isArray(raw?.data) ? raw.data :
          Array.isArray(raw?.items) ? raw.items :
          Array.isArray(raw?.content) ? raw.content :
          Array.isArray(raw?.products) ? raw.products :
          [];

        // normalize + attach categorySlug/title
        const normalized = list.map((p) => {
          const images = Array.isArray(p.images) ? p.images : [];
          const thumbnail = p.thumbnail || p.image || p.imageUrl || images[0] || null;

          const variants = Array.isArray(p.variants) ? p.variants : [];

          const priceNum = Number(p.price ?? 0) || 0;
          const originalNum = Number(p.originalPrice ?? p.listPrice ?? 0) || 0;

          return {
            ...p,
            id: p.id ?? p.productId ?? p.product_id ?? p._id ?? p.code ?? p.sku,
            name: p.name || p.productName || "Sản phẩm",
            images,
            thumbnail,
            variants,
            price: priceNum,
            originalPrice: originalNum,
            categorySlug: resolveCategorySlug(p), // ✅ QUAN TRỌNG
            title: resolveTitleGroup(p),          // ✅ QUAN TRỌNG
          };
        });

        if (!mounted) return;

        // nếu route có title (men/women/...) thì lọc theo title trước
        const byTitle = normTitle
          ? normalized.filter((p) => (p.title || "") === normTitle)
          : normalized;

        // nếu route có slug thì lọc theo categorySlug
        const bySlug = normSlug
          ? byTitle.filter((p) => (p.categorySlug || "") === normSlug)
          : byTitle;

        setAllProducts(bySlug);
      } catch (e) {
        if (mounted) setError(e?.message || "Lỗi tải sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [normTitle, normSlug, catById, catByName]); // cat maps đổi -> resolve slug chuẩn hơn

  // ---- helpers ----
  const formatPrice = (n) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n || 0));

  const displayPrice = (p) => {
    if (Number(p.price) > 0) return Number(p.price);
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

  const allSizesSet = useMemo(() => {
    const set = new Set();
    allProducts.forEach((p) => productSizes(p).forEach((s) => set.add(s)));
    return set;
  }, [allProducts]);

  // ---- filtering FE (category + size + price + sort) ----
  const filtered = useMemo(() => {
    let list = [...allProducts];

    // category filter (trên UI)
    // - luôn filter theo selectedCategory (vì radio đang cho chọn)
    // - nếu selectedCategory là "all" thì bỏ qua
    if (selectedCategory !== "all") {
      list = list.filter((p) => (p.categorySlug || "") === selectedCategory);
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
      return true;
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
        list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
        break;
      case "name-desc":
        list.sort((a, b) => (b.name || "").localeCompare(a.name || "", "vi"));
        break;
      case "newest":
        list.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id || 0);
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id || 0);
          return tb - ta;
        });
        break;
      default:
        break;
    }

    return list;
  }, [allProducts, selectedCategory, selectedSize, priceRange, sortBy]);

  const handleProductClick = (productId) => navigate(`/product/${productId}`);

  const handleQuickAdd = async (e, p) => {
    e.stopPropagation();
    const price = displayPrice(p);

    await addItem({
      id: p.id,
      name: p.name,
      price,
      image: p.thumbnail || p.images?.[0] || placeholder,
      quantity: 1,
      // nếu bạn có variant bắt buộc thì phải bổ sung variantId ở đây
      // variantId: p.variants?.[0]?.id ?? null,
    });

    alert("Đã thêm vào giỏ hàng!");
  };

  const onPickCategory = (val) => {
    setSelectedCategory(val);

    // giữ URL đồng bộ theo title route
    if (normTitle) {
      if (val === "all") navigate(`/shop/${normTitle}`);
      else navigate(`/shop/${normTitle}/${val}`);
    }
  };

  const slugLabel = useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return "Tất cả";
    const found = categoryOptions.find(([v]) => v === selectedCategory);
    return found ? found[1] : selectedCategory;
  }, [selectedCategory, categoryOptions]);

  const pageTitle = selectedCategory !== "all"
    ? `Danh mục: ${slugLabel}`
    : normTitle
      ? `Bộ sưu tập ${TITLE_LABELS[normTitle] || normTitle}`
      : "Tất Cả Sản Phẩm";

  return (
    <Layout>
      <div className="product-list-page">
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">Khám phá bộ sưu tập sản phẩm chính hãng</p>
          </div>
        </div>

        <div className="products-section">
          <div className="container">
            <div className="products-layout">
              <aside className="filters-sidebar">
                <h2 className="sidebar-main-title">Bộ lọc</h2>

                <div className="filter-section">
                  <h3 className="filter-title">Danh Mục</h3>
                  <div className="filter-options">
                    {categoryOptions.map(([val, label]) => (
                      <label key={val} className="filter-option">
                        <input
                          type="radio"
                          name="category"
                          value={val}
                          checked={selectedCategory === val}
                          onChange={() => onPickCategory(val)}
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

                    <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
                  {!loading && !error && filtered.map((p) => {
                    const price = displayPrice(p);
                    const thumb = p.thumbnail || p.images?.[0] || placeholder;

                    return (
                      <div key={p.id} className="product-card" onClick={() => handleProductClick(p.id)}>
                        <div className="product-image">
                          <img src={thumb} alt={p.name} />
                          {!!p.badge && (
                            <span className={`product-badge ${String(p.badge).toLowerCase()}`}>{p.badge}</span>
                          )}
                          <div className="product-overlay">
                            <button
                              className="quick-view"
                              onClick={(e) => { e.stopPropagation(); navigate(`/product/${p.id}`); }}
                            >
                              XEM NHANH
                            </button>
                            <button className="add-to-cart" onClick={(e) => handleQuickAdd(e, p)}>
                              THÊM VÀO GIỎ
                            </button>
                          </div>
                        </div>

                        <div className="product-info">
                          <h3 className="product-name">{p.name}</h3>
                          <div className="product-price">
                            <span className="current-price">{formatPrice(price)}</span>
                            {Number(p.originalPrice) > price && (
                              <>
                                <span className="original-price">{formatPrice(Number(p.originalPrice))}</span>
                                <span className="discount">
                                  -{Math.round(((Number(p.originalPrice) - price) / Number(p.originalPrice)) * 100)}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!loading && !error && filtered.length === 0 && (
                    <div style={{ padding: 16 }}>Không có sản phẩm phù hợp bộ lọc.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
