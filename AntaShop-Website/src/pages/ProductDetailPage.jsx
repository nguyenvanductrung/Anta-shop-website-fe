//src/pages/ProductDetailPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components";
import { useCart, useWishlist } from "../contexts";
import { products as productApi } from "../services"; // <-- API thật
import "./ProductDetailPage.css";

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [loading, setLoading] = useState(true);
  const [prod, setProd] = useState(null);
  const [error, setError] = useState(null);

  // gallery + zoom
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // options
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // related
  const [related, setRelated] = useState([]);

  const placeholder =
    "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800";

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productApi.getProduct(id);
        const data =
          res?.data && res?.success ? res.data : Array.isArray(res) ? res[0] : res;
        if (!data) throw new Error("Không tìm thấy sản phẩm");

        if (mounted) {
          setProd({
            ...data,
            images:
              (Array.isArray(data.images) && data.images.length ? data.images : [data.thumbnail]).filter(
                Boolean
              ) || [placeholder],
            thumbnail: data.thumbnail || (Array.isArray(data.images) ? data.images[0] : null),
            rating: data.rating ?? 5,
            reviewCount: data.sales ?? 0,
          });
          // load related (nhẹ nhàng: lấy tất cả rồi lọc cùng category, loại trừ chính nó)
          try {
            const all = await productApi.getProducts();
            const list = Array.isArray(all)
              ? all
              : Array.isArray(all?.data)
                ? all.data
                : [];
            const sameCat = list
              .filter((p) => p.id !== Number(id) && (p.category || "") === (data.category || ""))
              .slice(0, 8);
            mounted && setRelated(sameCat);
          } catch {
            /* ignore related errors */
          }
        }
      } catch (e) {
        if (mounted) setError(e?.message || "Lỗi tải sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // ---- helpers from prod ----
  const variants = useMemo(() => (Array.isArray(prod?.variants) ? prod.variants : []), [prod]);

  const allSizes = useMemo(() => {
    const set = new Set();
    variants.forEach((v) => {
      const s = v?.attributes?.size ?? v?.size;
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [variants]);

  const allColors = useMemo(() => {
    const set = new Set();
    variants.forEach((v) => {
      const c = v?.attributes?.color ?? v?.color;
      if (c) set.add(String(c));
    });
    return Array.from(set);
  }, [variants]);

  // chọn mặc định nếu có
  useEffect(() => {
    if (allColors.length && !selectedColor) setSelectedColor(allColors[0]);
    if (allSizes.length && !selectedSize) setSelectedSize(allSizes[0]);
  }, [allColors, allSizes]); // eslint-disable-line

  // tìm variant khớp lựa chọn
  const activeVariant = useMemo(() => {
    if (!variants.length) return null;
    const byMatch = variants.find((v) => {
      const s = String(v?.attributes?.size ?? v?.size ?? "");
      const c = String(v?.attributes?.color ?? v?.color ?? "");
      return (!allSizes.length || !selectedSize || s === String(selectedSize)) &&
        (!allColors.length || !selectedColor || c === String(selectedColor));
    });
    return byMatch || null;
  }, [variants, selectedSize, selectedColor, allSizes.length, allColors.length]);

  const currentPrice = useMemo(() => {
    if (activeVariant?.price) return Number(activeVariant.price);
    if (prod?.price && Number(prod.price) > 0) return Number(prod.price);
    const vs = variants.map((v) => Number(v?.price || 0)).filter((n) => n > 0);
    return vs.length ? Math.min(...vs) : 0;
  }, [prod, activeVariant, variants]);

  const totalStock = useMemo(() => {
    if (variants.length) {
      return variants.reduce((s, v) => s + Number(v?.stock ?? 0), 0);
    }
    return Number(prod?.totalStock ?? 0);
  }, [prod, variants]);

  const inWishlist = isInWishlist(Number(id));

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      Number(price || 0)
    );

  const discountPercent = useMemo(() => {
    const original = Number(prod?.originalPrice || 0);
    return original > currentPrice && currentPrice > 0
      ? Math.round(((original - currentPrice) / original) * 100)
      : 0;
  }, [prod, currentPrice]);

  // zoom handlers
  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };
  const handleMouseEnter = () => setIsZoomed(true);
  const handleMouseLeave = () => setIsZoomed(false);

  // actions
const handleAddToCartClick = async () => {
  // nếu có variants thì bắt buộc chọn size/color nếu tồn tại tập lựa chọn
  if (variants.length) {
    if (allSizes.length && !selectedSize) return alert("Vui lòng chọn kích thước");
    if (allColors.length && !selectedColor) return alert("Vui lòng chọn màu sắc");
  }

  // --- resolve variantId an toàn ---
  const resolvedVariantId =
    activeVariant?.id ??
    activeVariant?._id ??
    activeVariant?.variantId ??
    activeVariant?.sku ??
    null;

  if (variants.length && !resolvedVariantId) {
    console.warn(
      "Product has variants but resolvedVariantId is null. Using product id as fallback."
    );
  }

  const finalVariantId = resolvedVariantId ?? Number(id);

  await addItem({
    id: Number(id),
    name: prod?.name || "Sản phẩm",
    price: currentPrice,
    image: prod?.images?.[0] || prod?.thumbnail || placeholder,
    size: selectedSize || undefined,
    color: selectedColor || undefined,
    variantId: finalVariantId !== null ? Number(finalVariantId) : null,
    sku: activeVariant?.sku || prod?.sku || (variants.length ? variants[0]?.sku : undefined),
    quantity: Number(quantity), // ✅ truyền quantity trong object, đúng với useCart.addItem
  });

  alert("Đã thêm sản phẩm vào giỏ hàng!");
};


  const handleBuyNow = () => {
    handleAddToCartClick();
    navigate("/cart");
  };

  const handleToggleWishlist = async () => {
    try {
      const pid = Number(id);
      if (isInWishlist(pid)) {
        await removeFromWishlist(pid);
        alert("Đã xóa khỏi yêu thích");
      } else {
        await addToWishlist(pid);
        alert("Đã thêm vào yêu thích");
      }
    } catch (e) {
      alert("Có lỗi xảy ra: " + (e?.message || e));
    }
  };

  // ---- RENDER ----
  if (loading) {
    return (
      <Layout>
        <div className="pdp-page">
          <div className="pdp-main">
            <div className="container" style={{ padding: 32, textAlign: "center" }}>
              Đang tải sản phẩm…
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !prod) {
    return (
      <Layout>
        <div className="pdp-page">
          <div className="pdp-main">
            <div className="container" style={{ padding: 32, textAlign: "center" }}>
              {error || "Không tìm thấy sản phẩm"}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pdp-page">
        {/* breadcrumbs */}
        <div className="pdp-breadcrumbs">
          <div className="container">
            <button className="breadcrumb-link" onClick={() => navigate("/home")}>
              Trang chủ
            </button>
            <span className="breadcrumb-separator">/</span>
            <button className="breadcrumb-link" onClick={() => navigate("/products")}>
              Sản phẩm
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">{prod.name}</span>
          </div>
        </div>

        {/* main */}
        <div className="pdp-main">
          <div className="container">
            <div className="pdp-layout">
              {/* Gallery */}
              <div className="pdp-gallery">
                <div
                  className="gallery-main"
                  ref={imageRef}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={prod.images[selectedImage] || placeholder}
                    alt={prod.name}
                    style={
                      isZoomed
                        ? {
                          transform: "scale(2)",
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                          cursor: "zoom-in",
                        }
                        : {}
                    }
                  />
                  {discountPercent > 0 && (
                    <div className="discount-badge">-{discountPercent}%</div>
                  )}
                </div>
                <div className="gallery-thumbs">
                  {(prod.images || [placeholder]).map((img, idx) => (
                    <button
                      key={idx}
                      className={`thumb-item ${selectedImage === idx ? "active" : ""}`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img src={img || placeholder} alt={`${prod.name} ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="pdp-details">
                <div className="product-header">
                  <span className="brand-label">{prod.brand || "ANTA"}</span>
                  {prod.sku && <span className="sku-label">SKU: {prod.sku}</span>}
                </div>

                <h1 className="product-title">{prod.name}</h1>

                <div className="product-rating">
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= Math.floor(prod.rating ?? 5) ? "filled" : ""}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-text">({prod.reviewCount} đánh giá)</span>
                </div>

                <div className="price-section">
                  <div className="price-main">
                    <span className="current-price">{formatPrice(currentPrice)}</span>
                    {prod.originalPrice && prod.originalPrice > currentPrice && (
                      <>
                        <span className="original-price">
                          {formatPrice(prod.originalPrice)}
                        </span>
                        <span className="discount-label">-{discountPercent}%</span>
                      </>
                    )}
                  </div>
                  <div className="stock-status">
                    {totalStock > 0 ? (
                      <span className="in-stock">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M13.3332 4L5.99984 11.3333L2.6665 8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {totalStock} sản phẩm
                      </span>
                    ) : (
                      <span className="out-of-stock">Hết hàng</span>
                    )}
                  </div>
                </div>

                {prod.description && (
                  <div className="product-description">
                    <p>{prod.description}</p>
                  </div>
                )}

                {/* Options */}
                <div className="product-options">
                  {allColors.length > 0 && (
                    <div className="option-group">
                      <label className="option-label">
                        Màu sắc:
                        {selectedColor && (
                          <span className="selected-value">{String(selectedColor)}</span>
                        )}
                      </label>
                      <div className="color-options">
                        {allColors.map((c) => (
                          <button
                            key={c}
                            className={`color-option ${selectedColor === String(c) ? "selected" : ""
                              }`}
                            onClick={() => setSelectedColor(String(c))}
                            title={String(c)}
                            aria-label={String(c)}
                            style={{ backgroundColor: undefined }}
                          >
                            {selectedColor === String(c) && (
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M13.3332 4L5.99984 11.3333L2.6665 8"
                                  stroke="#000"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{String(c)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {allSizes.length > 0 && (
                    <div className="option-group">
                      <label className="option-label">
                        Kích thước:
                        {selectedSize && (
                          <span className="selected-value">EU {String(selectedSize)}</span>
                        )}
                      </label>
                      <div className="size-options">
                        {allSizes.map((s) => (
                          <button
                            key={s}
                            className={`size-option ${String(selectedSize) === String(s) ? "selected" : ""
                              }`}
                            onClick={() => setSelectedSize(String(s))}
                          >
                            {String(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="option-group">
                    <label className="option-label">Số lượng:</label>
                    <div className="quantity-selector">
                      <button
                        className="qty-btn"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        min="1"
                      />
                      <button
                        className="qty-btn"
                        onClick={() => setQuantity((q) => q + 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn-buy-now" onClick={handleBuyNow}>
                    MUA NGAY
                  </button>
                  <button className="btn-add-cart" onClick={handleAddToCartClick}>
                    THÊM VÀO GIỎ
                  </button>
                  <button
                    className={`btn-wishlist ${inWishlist ? "active" : ""}`}
                    onClick={handleToggleWishlist}
                    aria-label={inWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={inWishlist ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>

                {/* Benefits */}
                <div className="benefits-list">
                  <div className="benefit">
                    <div className="benefit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                      </svg>
                    </div>
                    <div className="benefit-content">
                      <strong>Miễn phí vận chuyển</strong>
                      <span>Đơn hàng từ 999.000₫</span>
                    </div>
                  </div>
                  <div className="benefit">
                    <div className="benefit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                    </div>
                    <div className="benefit-content">
                      <strong>Đổi trả trong 30 ngày</strong>
                      <span>Miễn phí đổi size</span>
                    </div>
                  </div>
                  <div className="benefit">
                    <div className="benefit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div className="benefit-content">
                      <strong>Chính hãng 100%</strong>
                      <span>Cam kết hàng chính hãng</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* end details */}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pdp-tabs">
          <div className="container">
            <div className="tabs-nav">
              <button
                className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
                onClick={() => setActiveTab("description")}
              >
                Mô tả sản phẩm
              </button>
              <button
                className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
                onClick={() => setActiveTab("specifications")}
              >
                Thông số kỹ thuật
              </button>
              <button
                className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                onClick={() => setActiveTab("reviews")}
              >
                Đánh giá ({prod.reviewCount})
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === "description" && (
                <div className="tab-panel">
                  <h3 className="panel-heading">Giới thiệu sản phẩm</h3>
                  <p className="panel-text">{prod.description || "Đang cập nhật..."}</p>
                  {Array.isArray(prod.features) && prod.features.length > 0 && (
                    <>
                      <h4 className="panel-subheading">Đặc điểm nổi bật</h4>
                      <ul className="features-list">
                        {prod.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="tab-panel">
                  <h3 className="panel-heading">Thông số kỹ thuật</h3>
                  <table className="specs-table">
                    <tbody>
                      {Object.entries(
                        prod.specifications || {
                          "Mã sản phẩm": prod.sku || "-",
                          "Danh mục": prod.category || "-",
                          "Thương hiệu": prod.brand || "ANTA",
                          "Tồn kho": String(totalStock),
                        }
                      ).map(([k, v]) => (
                        <tr key={k}>
                          <td className="spec-label">{k}</td>
                          <td className="spec-value">{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="tab-panel">
                  <h3 className="panel-heading">Đánh giá từ khách hàng</h3>
                  <div className="reviews-summary">
                    <div className="summary-score">
                      <span className="score-number">{prod.rating ?? 5}</span>
                      <div className="score-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`star ${star <= Math.floor(prod.rating ?? 5) ? "filled" : ""}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="score-count">{prod.reviewCount} đánh giá</span>
                    </div>
                  </div>
                  <div className="reviews-list">
                    <div className="review-item">
                      <div className="review-header">
                        <strong className="reviewer-name">Nguyễn Văn A</strong>
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="star filled">
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="review-text">
                        Sản phẩm chất lượng, giao hàng nhanh. Rất đáng tiền!
                      </p>
                      <span className="review-time">2 ngày trước</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="pdp-related">
          <div className="container">
            <h2 className="section-title">Sản phẩm liên quan</h2>
            <div className="related-grid">
              {(related || []).map((item) => (
                <div
                  key={item.id}
                  className="related-card"
                  onClick={() => {
                    navigate(`/product/${item.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  <div className="related-image">
                    <img
                      src={
                        item.thumbnail ||
                        (Array.isArray(item.images) && item.images[0]) ||
                        placeholder
                      }
                      alt={item.name}
                    />
                  </div>
                  <div className="related-info">
                    <h3 className="related-name">{item.name}</h3>
                    <div className="related-price">
                      <span>
                        {formatPrice(
                          Number(item.price) ||
                          Math.min(
                            ...((item.variants || [])
                              .map((v) => Number(v?.price || 0))
                              .filter((n) => n > 0)),
                            Infinity
                          ) ||
                          0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {!related.length && <div>Chưa có gợi ý phù hợp.</div>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
