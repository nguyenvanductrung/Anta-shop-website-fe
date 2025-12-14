import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function Lookbook() {
  const navigate = useNavigate();

  const lookbookSections = [
    {
      id: 1,
      title: "SPRING COLLECTION 2024",
      subtitle: "Fresh styles for the new season",
      image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Shop Now",
      link: "/new"
    },
    {
      id: 2,
      title: "PERFORMANCE GEAR",
      subtitle: "Engineered for athletes",
      image: "https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Explore",
      link: "/men"
    }
  ];

  return (
    <section className="lookbook-section">
      <div className="container">
        <div className="lookbook-grid">
          {lookbookSections.map((section) => (
            <div
              key={section.id}
              className="lookbook-item"
              onClick={() => navigate(section.link)}
            >
              <div className="lookbook-image-wrapper">
                <img
                  src={section.image}
                  alt={section.title}
                  className="lookbook-image"
                />
                <div className="lookbook-overlay"></div>
              </div>
              <div className="lookbook-content">
                <h3 className="lookbook-title">{section.title}</h3>
                <p className="lookbook-subtitle">{section.subtitle}</p>
                <button className="lookbook-cta">{section.cta}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
