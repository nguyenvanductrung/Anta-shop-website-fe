import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./overlays.css";

export default function SearchDrawer({ open, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      onClose();
      setSearchTerm("");
    }
  };

  if (!open) return null;

  return (
    <div className="overlay-root" onClick={onClose}>
      <div className="drawer top" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSearch} style={{ padding: "24px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              className="search-input"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{ flex: 1, margin: 0 }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                background: "#111111",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#d70010";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#111111";
              }}
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
