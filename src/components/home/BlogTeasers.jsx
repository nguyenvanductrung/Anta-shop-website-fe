import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function BlogTeasers() {
  const navigate = useNavigate();

  const blogs = [
    {
      id: 1,
      title: "5 Lợi Ích Của Việc Chạy Bộ Mỗi Ngày",
      excerpt: "Khám phá những lợi ích tuyệt vời mà việc chạy bộ đều đặn mang lại cho sức khỏe và tinh thần của bạn.",
      image: "https://images.pexels.com/photos/2524739/pexels-photo-2524739.jpeg?auto=compress&cs=tinysrgb&w=600",
      date: "15/03/2024",
      category: "Health & Fitness"
    },
    {
      id: 2,
      title: "Cách Chọn Giày Chạy Bộ Phù Hợp",
      excerpt: "Hướng dẫn chi tiết giúp bạn lựa chọn đôi giày chạy bộ hoàn hảo cho từng loại bàn chân và phong cách chạy.",
      image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600",
      date: "12/03/2024",
      category: "Product Guide"
    },
    {
      id: 3,
      title: "Xu Hướng Thể Thao 2024",
      excerpt: "Cập nhật những xu hướng thời trang thể thao mới nhất và phong cách athleisure đang được ưa chuộng.",
      image: "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=600",
      date: "10/03/2024",
      category: "Trends"
    }
  ];

  return (
    <section className="blog-teasers-section">
      <div className="container">
        <div className="section-heading">
          <h2 className="section-title-large">TIN TỨC & BÀI VIẾT</h2>
          <p className="section-subtitle">Cập nhật kiến thức và xu hướng thể thao mới nhất</p>
        </div>
        <div className="blog-grid">
          {blogs.map((blog) => (
            <article key={blog.id} className="blog-card" onClick={() => navigate(`/blog/${blog.id}`)}>
              <div className="blog-image-wrapper">
                <img src={blog.image} alt={blog.title} className="blog-image" />
                <span className="blog-category">{blog.category}</span>
              </div>
              <div className="blog-content">
                <div className="blog-date">{blog.date}</div>
                <h3 className="blog-title">{blog.title}</h3>
                <p className="blog-excerpt">{blog.excerpt}</p>
                <button className="blog-read-more">Đọc tiếp →</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
