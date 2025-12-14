import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function HomeSlider() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1600",
      badge: "NEW COLLECTION",
      title: "ANTA RUNNING PRO",
      description: "Đột phá giới hạn với công nghệ đệm mới nhất",
      primaryAction: { text: "KHÁM PHÁ NGAY", link: "/new" },
      secondaryAction: { text: "XEM BỘ SƯU TẬP", link: "/products" }
    },
    {
      id: 2,
      image: "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=1600",
      badge: "BASKETBALL ELITE",
      title: "DOMINATE THE COURT",
      description: "Công nghệ A-FLASHFOAM cho lực bật tối ưu",
      primaryAction: { text: "MUA NGAY", link: "/men" },
      secondaryAction: { text: "XEM CHI TIẾT", link: "/products" }
    },
    {
      id: 3,
      image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=1600",
      badge: "LIFESTYLE",
      title: "URBAN COMFORT",
      description: "Phong cách đường phố với sự thoải mái tuyệt đối",
      primaryAction: { text: "KHÁM PHÁ", link: "/women" },
      secondaryAction: { text: "XEM THÊM", link: "/products" }
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="hero-slider-section">
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? "active" : ""} ${
              index === currentSlide - 1 || (currentSlide === 0 && index === slides.length - 1)
                ? "prev"
                : ""
            } ${
              index === currentSlide + 1 || (currentSlide === slides.length - 1 && index === 0)
                ? "next"
                : ""
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="hero-slide-image"
            />
            <div className="hero-slide-overlay"></div>
            <div className="container">
              <div className="hero-slide-content">
                <span className="hero-badge">{slide.badge}</span>
                <h1 className="hero-title">{slide.title}</h1>
                <p className="hero-description">{slide.description}</p>
                <div className="hero-actions">
                  <button
                    className="hero-button primary"
                    onClick={() => navigate(slide.primaryAction.link)}
                  >
                    {slide.primaryAction.text}
                  </button>
                  <button
                    className="hero-button secondary"
                    onClick={() => navigate(slide.secondaryAction.link)}
                  >
                    {slide.secondaryAction.text}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="slider-nav prev-btn" onClick={prevSlide} aria-label="Previous slide">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className="slider-nav next-btn" onClick={nextSlide} aria-label="Next slide">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
