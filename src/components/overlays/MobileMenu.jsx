import React from "react";
import "./overlays.css";

export default function MobileMenu({ open, onClose, items = [] }) {
  if (!open) return null;
  return (
    <div className="overlay-root" onClick={onClose}>
      <div className="drawer left" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Menu</h3>
        </div>
        <div className="drawer-body">
          <ul className="mobile-menu-list">
            {items.map((it) => (
              <li key={it.label} className="mobile-menu-item">{it.label}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


