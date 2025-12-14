import React, { useEffect, useMemo, useState } from "react"; import { useNavigate } from "react-router-dom";
import { Layout, HeroBanner, DiscountCodes, ProductSections } from "../components";
import { HomeSlider, ProductGrid, BrandStrip, Lookbook, BlogTeasers } from "../components/home";
import "./HomePage.css";
import { productService } from "../services/api";
export default function HomePage() {
  const navigate = useNavigate();
  // ================== DATA FROM API ==================
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // helper: parse tiền có thể là "1.259.100₫" hoặc number
  const toNumberPrice = (v) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const s = String(v).replace(/[^\d]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  // helper: format data cho ProductGrid
  const mapToGridItem = (p) => {
    const id = p?.id ?? p?.productId ?? p?.product_id ?? p?._id ?? p?.code ?? p?.sku;

    const priceNum = toNumberPrice(p.price ?? p.unitPrice ?? p.salePrice ?? p.minPrice ?? p.amount);
    const originalNum = toNumberPrice(p.originalPrice ?? p.listPrice ?? p.compareAtPrice ?? p.msrp);

    const image =
      p.image ||
      p.imageUrl ||
      p.thumbnail ||
      p.thumbnailUrl ||
      (Array.isArray(p.images) ? p.images[0] : null) ||
      "https://via.placeholder.com/600x600?text=No+Image";

    let discount = null;
    if (originalNum > 0 && priceNum > 0 && originalNum > priceNum) {
      discount = `${Math.round(((originalNum - priceNum) / originalNum) * 100)}%`;
    }

    const badge = p.badge || (p.isNew ? "NEW" : discount ? "SALE" : "HOT");

    return {
      id,
      name: p.name ?? p.productName ?? "Sản phẩm",
      price: priceNum ? `${priceNum.toLocaleString()}₫` : "0₫",
      originalPrice: originalNum ? `${originalNum.toLocaleString()}₫` : null,
      discount,
      image,
      badge,
      raw: p,
    };
  };


  // helper: random N sản phẩm (không trùng)
  const pickRandom = (arr, n) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  };

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        // ====== GỌI API ======
        // Bạn cần đổi đúng hàm theo productService của bạn.
        // Các tên thường gặp: getAllProducts(), getProducts(), listProducts(), searchProducts()
        let resp = null;

        // gọi đúng 1 hàm và luôn await
        if (productService?.getAllProducts) {
          resp = await productService.getAllProducts();
        } else if (productService?.getProducts) {
          resp = await productService.getProducts();
        } else if (productService?.listProducts) {
          resp = await productService.listProducts();
        } else if (productService?.searchProducts) {
          resp = await productService.searchProducts({ page: 0, size: 100 });
        } else {
          throw new Error("productService không có hàm lấy danh sách sản phẩm");
        }

        // unwrap + normalize nhiều kiểu response
        const raw = resp?.data ?? resp;

        const list =
          (raw?.success === true && Array.isArray(raw?.data)) ? raw.data :
            Array.isArray(raw) ? raw :
              Array.isArray(raw?.items) ? raw.items :
                Array.isArray(raw?.content) ? raw.content :
                  Array.isArray(raw?.products) ? raw.products :
                    Array.isArray(raw?.data) ? raw.data :
                      [];

        setAllProducts(Array.isArray(list) ? list : []);

      } catch (e) {
        console.error("[HomePage] fetchProducts error:", e);
        if (mounted) setAllProducts([]);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    };

    fetchProducts();
    return () => { mounted = false; };
  }, []);

  const featuredProducts = useMemo(() => {
    const mapped = (Array.isArray(allProducts) ? allProducts : [])
      .map(mapToGridItem)
      .filter(x => x?.id != null);
    return pickRandom(mapped, 4);
  }, [allProducts]);

  const newArrivals = useMemo(() => {
    const mapped = (Array.isArray(allProducts) ? allProducts : [])
      .map(mapToGridItem)
      .filter(x => x?.id != null);
    return pickRandom(mapped, 4);
  }, [allProducts]);
  const sportCategories = [
    {
      id: 1,
      title: "RUNNING",
      subtitle: "Chạy bộ chuyên nghiệp",
      image: "https://images.pexels.com/photos/2524739/pexels-photo-2524739.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/men"
    },
    {
      id: 2,
      title: "BASKETBALL",
      subtitle: "Bóng rổ đỉnh cao",
      image: "https://images.pexels.com/photos/1080882/pexels-photo-1080882.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/men"
    },
    {
      id: 3,
      title: "TRAINING",
      subtitle: "Tập luyện hiệu quả",
      image: "https://images.pexels.com/photos/4761666/pexels-photo-4761666.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/men"
    },
    {
      id: 4,
      title: "LIFESTYLE",
      subtitle: "Phong cách sống động",
      image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/men"
    }
  ];

  const collections = [
    {
      id: 1,
      title: "ANTA Men's Collection",
      description: "Bộ sưu tập nam mạnh mẽ",
      products: "200+ Sản phẩm",
      image: "https://images.pexels.com/photos/3490360/pexels-photo-3490360.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/men"
    },
    {
      id: 2,
      title: "ANTA Women's Collection",
      description: "Bộ sưu tập nữ năng động",
      products: "150+ Sản phẩm",
      image: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=800",
      link: "/women"
    }
  ];
  return (
    <Layout>
      <div className="homepage">
        <HomeSlider />

        <DiscountCodes />

        <section className="sport-categories-section">
          <div className="container">
            <div className="section-heading">
              <h2 className="section-title-large">KHÁM PHÁ BỘ SƯU TẬP</h2>
              <p className="section-subtitle">Chọn môn thể thao phù hợp với bạn</p>
            </div>
            <div className="sport-categories-grid">
              {sportCategories.map((category) => (
                <div
                  key={category.id}
                  className="sport-category-card"
                  onClick={() => navigate(category.link)}
                >
                  <div className="sport-category-image-wrapper">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="sport-category-image"
                    />
                    <div className="sport-category-overlay"></div>
                  </div>
                  <div className="sport-category-content">
                    <h3 className="sport-category-title">{category.title}</h3>
                    <p className="sport-category-subtitle">{category.subtitle}</p>
                    <span className="sport-category-arrow">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="featured-products-section">
          <div className="container">
            <div className="section-heading">
              <h2 className="section-title-large">SẢN PHẨM NỔI BẬT</h2>
              <p className="section-subtitle">Những sản phẩm được yêu thích nhất</p>
            </div>
            {loadingProducts ? (
              <div style={{ padding: "12px 0" }}>Đang tải sản phẩm...</div>
            ) : (
              <ProductGrid title="" products={featuredProducts} />
            )}          </div>
        </section>

        <section className="promo-banner-section">
          <div className="container">
            <div className="promo-banner-grid">
              <div className="promo-banner-content">
                <span className="promo-banner-badge">🔥 MEGA SALE</span>
                <h2 className="promo-banner-title">GIẢM GIÁ LÊN ĐẾN 50%</h2>
                <p className="promo-banner-description">
                  Cơ hội vàng sở hữu giày thể thao chính hãng với giá tốt nhất.
                  Khuyến mãi có giới hạn, nhanh tay đặt hàng ngay!
                </p>
                <button className="promo-banner-button" onClick={() => navigate('/products')}>
                  MUA NGAY
                </button>
              </div>
              <div className="promo-banner-image-wrapper">
                <img
                  src="https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Mega Sale"
                  className="promo-banner-image"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="collections-showcase-section">
          <div className="container">
            <div className="collections-showcase-grid">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="collection-showcase-card"
                  onClick={() => navigate(collection.link)}
                >
                  <div className="collection-showcase-image-wrapper">
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="collection-showcase-image"
                    />
                    <div className="collection-showcase-overlay"></div>
                  </div>
                  <div className="collection-showcase-content">
                    <h3 className="collection-showcase-title">{collection.title}</h3>
                    <p className="collection-showcase-description">{collection.description}</p>
                    <span className="collection-showcase-products">{collection.products}</span>
                    <button className="collection-showcase-button">KHÁM PHÁ NGAY</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ProductSections />

        <section className="new-arrivals-section">
          <div className="container">
            <div className="section-heading">
              <h2 className="section-title-large">HÀNG MỚI VỀ</h2>
              <p className="section-subtitle">Cập nhật xu hướng thể thao mới nhất</p>
            </div>
            {loadingProducts ? (
              <div style={{ padding: "12px 0" }}>Đang tải sản phẩm...</div>
            ) : (
              <ProductGrid title="" products={newArrivals} />
            )}          </div>
        </section>

        <section className="brand-story-section">
          <div className="container">
            <div className="brand-story-grid">
              <div className="brand-story-image-wrapper">
                <img
                  src="https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="ANTA Brand Story"
                  className="brand-story-image"
                />
              </div>
              <div className="brand-story-content">
                <span className="brand-story-tag">VỀ ANTA</span>
                <h2 className="brand-story-title">KEEP MOVING</h2>
                <p className="brand-story-description">
                  ANTA - Thương hiệu thể thao hàng đầu Trung Quốc với hơn 30 năm kinh nghiệm.
                  Chúng tôi cam kết mang đến những sản phẩm chất lượng cao, kết hợp công nghệ
                  tiên tiến và thiết kế thời trang, giúp bạn tự tin chinh phục mọi thử thách.
                </p>
                <ul className="brand-story-features">
                  <li className="brand-story-feature">
                    <span className="feature-icon">✓</span>
                    <span className="feature-text">Công nghệ đệm A-FLASHFOAM tiên tiến</span>
                  </li>
                  <li className="brand-story-feature">
                    <span className="feature-icon">✓</span>
                    <span className="feature-text">Chất liệu cao cấp, bền bỉ</span>
                  </li>
                  <li className="brand-story-feature">
                    <span className="feature-icon">✓</span>
                    <span className="feature-text">Thiết kế thời trang, năng động</span>
                  </li>
                </ul>
                <button className="brand-story-button" onClick={() => navigate('/products')}>
                  TÌM HIỂU THÊM
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="brands-partners-section">
          <div className="container">
            <div className="section-heading">
              <h2 className="section-title-large">ĐỐI TÁC THƯƠNG HIỆU</h2>
            </div>
            <BrandStrip />
          </div>
        </section>

        <BlogTeasers />

        <section className="newsletter-signup-section">
          <div className="container">
            <div className="newsletter-signup-wrapper">
              <div className="newsletter-signup-content">
                <div className="newsletter-signup-icon">📧</div>
                <h2 className="newsletter-signup-title">ĐĂNG KÝ NHẬN TIN MỚI NHẤT</h2>
                <p className="newsletter-signup-description">
                  Nhận thông tin về sản phẩm mới, ưu đãi đặc biệt và các chương trình khuyến mãi hấp dẫn
                </p>
                <form className="newsletter-signup-form">
                  <input
                    type="email"
                    placeholder="Nhập địa chỉ email của bạn"
                    className="newsletter-signup-input"
                  />
                  <button type="submit" className="newsletter-signup-button">ĐĂNG KÝ NGAY</button>
                </form>
                <p className="newsletter-signup-note">
                  Bằng việc đăng ký, bạn đồng ý với điều khoản và chính sách bảo mật của chúng tôi
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
