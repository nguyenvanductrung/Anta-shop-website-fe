import React from "react";
import "./home.css";

export default function BrandStrip() {
  const brands = [
    { id: 1, name: "ANTA", logo: "https://via.placeholder.com/120x60/D70010/FFFFFF?text=ANTA" },
    { id: 2, name: "NBA", logo: "https://via.placeholder.com/120x60/231F20/FFFFFF?text=NBA" },
    { id: 3, name: "FILA", logo: "https://via.placeholder.com/120x60/1EA75A/FFFFFF?text=FILA" },
    { id: 4, name: "CBA", logo: "https://via.placeholder.com/120x60/6B6B6B/FFFFFF?text=CBA" },
    { id: 5, name: "DESCENTE", logo: "https://via.placeholder.com/120x60/C2000E/FFFFFF?text=DESCENTE" },
    { id: 6, name: "KLAY", logo: "https://via.placeholder.com/120x60/D70010/FFFFFF?text=KLAY" },
  ];

  return (
    <section className="brand-strip">
      <div className="container brand-row">
        {brands.map((brand) => (
          <img key={brand.id} src={brand.logo} alt={brand.name} title={brand.name} />
        ))}
      </div>
    </section>
  );
}
