import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts";
import { products as productApi } from "../services"; // <-- dùng API thật
import "./ProductSections.css";

/**
 * Hiển thị sản phẩm ra trang chủ:
 * - Lấy danh sách sản phẩm thực từ backend.
 * - Tự động phân nhóm: Giày (nam/nữ) và Quần áo (áo/quần; nam/nữ) theo category/name.
 * - Giữ nguyên tính năng Yêu thích, Thêm giỏ, nhảy sang trang chi tiết.
 */
const ProductSections = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [favorites, setFavorites] = useState(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // tab states
  const [activeGenderShoes, setActiveGenderShoes] = useState("nam");
  const [activeSportswearTab, setActiveSportswearTab] = useState("ao-nam");

  // data state
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  // -------------------- FETCH --------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await productApi.getProducts();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.content)
          ? res.data.content
          : res?.success && Array.isArray(res?.data)
          ? res.data
          : [];
        if (mounted) setAllProducts(list);
      } catch (err) {
        console.error("Load homepage products error:", err);
        if (mounted) setAllProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // -------------------- HELPERS --------------------
  const placeholder =
    "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400";

  const formatPrice = (price) =>
    price || price === 0
      ? new Intl.NumberFormat("vi-VN").format(Number(price)) + "₫"
      : "—";

  const getThumb = (p) =>
    p?.thumbnail || (Array.isArray(p?.images) && p.images[0]) || placeholder;

  const computeDisplayPrice = (p) => {
    const priceNum = Number(p?.price || 0);
    if (priceNum > 0) return priceNum;
    const vs = Array.isArray(p?.variants) ? p.variants : [];
    const nums = vs.map((v) => Number(v?.price || 0)).filter((n) => n > 0);
    return nums.length ? Math.min(...nums) : 0;
  };

  const isFemale = (p) => {
    const txt = `${p?.name || ""} ${p?.category || ""}`.toLowerCase();
    return /nữ|nu|women|lady|ladies|female/.test(txt);
  };

  const isShoe = (p) => {
    const c = (p?.category || "").toLowerCase();
    const n = (p?.name || "").toLowerCase();
    return /giày|giay|shoe|sneaker|running/.test(c) || /giày|giay|shoe|sneaker/.test(n);
  };

  const isTop = (p) =>
    /(áo|ao|tee|t-shirt|polo|hoodie|khoác|khoac|jacket|tank)/i.test(
      `${p?.category || ""} ${p?.name || ""}`
    );

  const isBottom = (p) =>
    /(quần|quan|short|jogger|legging|pants)/i.test(
      `${p?.category || ""} ${p?.name || ""}`
    );

  const toCard = (p) => ({
    id: p.id,
    name: p.name || "Sản phẩm",
    price: computeDisplayPrice(p),
    originalPrice: null, // không có giá gốc => ẩn badge giảm
    discount: 0,
    image: getThumb(p),
    isOnline: Number(p?.totalStock ?? 0) > 0,
    model: p.sku || (Array.isArray(p?.variants) && p.variants[0]?.sku) || undefined,
  });

  // -------------------- GROUPING --------------------
  const { shoesMen, shoesWomen, topsMen, topsWomen, bottomsMen, bottomsWomen } =
    useMemo(() => {
      const shoesMen = [];
      const shoesWomen = [];
      const topsMen = [];
      const topsWomen = [];
      const bottomsMen = [];
      const bottomsWomen = [];

      allProducts.forEach((p) => {
        if (isShoe(p)) {
          (isFemale(p) ? shoesWomen : shoesMen).push(toCard(p));
        } else if (isTop(p)) {
          (isFemale(p) ? topsWomen : topsMen).push(toCard(p));
        } else if (isBottom(p)) {
          (isFemale(p) ? bottomsWomen : bottomsMen).push(toCard(p));
        }
      });

      // nếu không phân loại được thì rơi vào nhóm “nam” để vẫn hiển thị
      const rest = allProducts.filter((p) => !isShoe(p) && !isTop(p) && !isBottom(p));
      rest.forEach((p) => topsMen.push(toCard(p)));

      // sort nhẹ theo id desc cho đẹp
      const byIdDesc = (a, b) => (b.id ?? 0) - (a.id ?? 0);
      shoesMen.sort(byIdDesc);
      shoesWomen.sort(byIdDesc);
      topsMen.sort(byIdDesc);
      topsWomen.sort(byIdDesc);
      bottomsMen.sort(byIdDesc);
      bottomsWomen.sort(byIdDesc);

      return { shoesMen, shoesWomen, topsMen, topsWomen, bottomsMen, bottomsWomen };
    }, [allProducts]);

  // -------------------- UI ACTIONS --------------------
  const handleSportswearTabChange = (tab) => {
    if (tab === activeSportswearTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSportswearTab(tab);
      setIsTransitioning(false);
    }, 150);
  };

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleAddToCart = (e, card) => {
    e.stopPropagation();
    addToCart({
      id: card.id,
      name: card.name,
      price: card.price,
      image: card.image,
      quantity: 1,
    });

    const note = document.createElement("div");
    note.style.cssText =
      "position:fixed;top:100px;right:20px;background:#1EA75A;color:#fff;padding:12px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:10000;";
    note.textContent = "✓ Đã thêm vào giỏ hàng!";
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 1800);
  };

  const handleProductClick = (id) => navigate(`/product/${id}`);

  const renderCard = (card) => (
    <div
      key={card.id}
      className="product-card"
      onClick={() => handleProductClick(card.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="product-image-container">
        <img src={card.image} alt={card.name} className="product-image" />
        <div className="product-actions">
          <button
            className={`action-button heart-button ${
              favorites.has(card.id) ? "active" : ""
            }`}
            onClick={(e) => toggleFavorite(e, card.id)}
            title={favorites.has(card.id) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <span>{favorites.has(card.id) ? "❤" : "♡"}</span>
          </button>
          <button
            className="action-button cart-button"
            onClick={(e) => handleAddToCart(e, card)}
            title="Thêm vào giỏ hàng"
          >
            <span>🛒</span>
          </button>
        </div>
        {card.isOnline && <div className="online-badge">ONLINE</div>}
      </div>

      <div className="product-info">
        <div className="product-brand">ANTA</div>
        <h3 className="product-name">{card.name}</h3>
        {card.model && <div className="product-model">{card.model}</div>}
        <div className="product-pricing">
          <div className="current-price">{formatPrice(card.price)}</div>
        </div>
      </div>
    </div>
  );

  // -------------------- RENDER --------------------
  if (loading) {
    return (
      <div className="product-sections">
        <div className="view-all-section" style={{ padding: 24, textAlign: "center" }}>
          Đang tải sản phẩm…
        </div>
      </div>
    );
  }

  const shoesData = {
    nam: shoesMen,
    nu: shoesWomen,
  };

  const sportswearMap = {
    "ao-nam": topsMen,
    "ao-nu": topsWomen,
    "quan-nam": bottomsMen,
    "quan-nu": bottomsWomen,
  };

  return (
    <div className="product-sections">
      {/* ===== GIÀY THỂ THAO ===== */}
      <section className="product-section">
        <div className="section-header">
          <button className="section-title-button">GIÀY THỂ THAO</button>
        </div>

        <div className="category-tabs">
          <button
            className={`tab-button ${activeGenderShoes === "nam" ? "active" : ""}`}
            onClick={() => setActiveGenderShoes("nam")}
          >
            Giày nam
          </button>
          <button
            className={`tab-button ${activeGenderShoes === "nu" ? "active" : ""}`}
            onClick={() => setActiveGenderShoes("nu")}
          >
            Giày nữ
          </button>
        </div>

        <div className="products-grid">
          {(shoesData[activeGenderShoes] || []).map(renderCard)}
          {!((shoesData[activeGenderShoes] || []).length) && (
            <div className="view-all-section" style={{ gridColumn: "1 / -1" }}>
              Chưa có sản phẩm phù hợp.
            </div>
          )}
        </div>

        <div className="view-all-section">
          <button className="view-all-button">Xem tất cả &gt;</button>
        </div>
      </section>

      {/* ===== QUẦN ÁO THỂ THAO ===== */}
      <section className="product-section">
        <div className="section-header">
          <button className="section-title-button">QUẦN ÁO THỂ THAO</button>
        </div>

        <div className="category-tabs">
          <button
            className={`tab-button ${activeSportswearTab === "ao-nam" ? "active" : ""}`}
            onClick={() => handleSportswearTabChange("ao-nam")}
          >
            Áo nam
          </button>
          <button
            className={`tab-button ${activeSportswearTab === "ao-nu" ? "active" : ""}`}
            onClick={() => handleSportswearTabChange("ao-nu")}
          >
            Áo nữ
          </button>
          <button
            className={`tab-button ${activeSportswearTab === "quan-nam" ? "active" : ""}`}
            onClick={() => handleSportswearTabChange("quan-nam")}
          >
            Quần nam
          </button>
          <button
            className={`tab-button ${activeSportswearTab === "quan-nu" ? "active" : ""}`}
            onClick={() => handleSportswearTabChange("quan-nu")}
          >
            Quần nữ
          </button>
        </div>

        <div className={`products-grid ${isTransitioning ? "fade-out" : "fade-in"}`}>
          {(sportswearMap[activeSportswearTab] || []).map(renderCard)}
          {!((sportswearMap[activeSportswearTab] || []).length) && (
            <div className="view-all-section" style={{ gridColumn: "1 / -1" }}>
              Chưa có sản phẩm phù hợp.
            </div>
          )}
        </div>

        <div className="view-all-section">
          <button className="view-all-button">Xem tất cả &gt;</button>
        </div>
      </section>
    </div>
  );
};

export default ProductSections;
