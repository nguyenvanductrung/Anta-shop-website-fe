import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function CategoryShowcase() {
  const navigate = useNavigate();

  const categories = [
    {
      id: 1,
      title: "MEN'S",
      subtitle: "Bộ sưu tập nam",
      image: "https://images.pexels.com/photos/3490360/pexels-photo-3490360.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/men",
      products: "200+"
    },
    {
      id: 2,
      title: "WOMEN'S",
      subtitle: "Bộ sưu tập nữ",
      image: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/women",
      products: "150+"
    },
    {
      id: 3,
      title: "KIDS",
      subtitle: "Bộ sưu tập trẻ em",
      image: "https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/kids",
      products: "80+"
    },
    {
      id: 4,
      title: "ACCESSORIES",
      subtitle: "Phụ kiện thể thao",
      image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600",
      link: "/accessories",
      products: "50+"
    }
  ];

  return (
    <section className="category-showcase-section">
      <div className="container">
        <div className="section-heading">
          <h2 className="section-title-large">MUA SẮM THEO DANH MỤC</h2>
          <p className="section-subtitle">Khám phá bộ sưu tập dành riêng cho bạn</p>
        </div>
        <div className="category-showcase-grid">
          {categories.map((category) => (
            <div
              key={category.id}
              className="category-showcase-card"
              onClick={() => navigate(category.link)}
            >
              <div className="category-showcase-image-wrapper">
                <img
                  src={category.image}
                  alt={category.title}
                  className="category-showcase-image"
                />
                <div className="category-showcase-overlay"></div>
              </div>
              <div className="category-showcase-content">
                <div className="category-showcase-badge">{category.products} Sản phẩm</div>
                <h3 className="category-showcase-title">{category.title}</h3>
                <p className="category-showcase-subtitle">{category.subtitle}</p>
                <button className="category-showcase-button">Xem ngay →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
