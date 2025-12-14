import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// ưu tiên import trực tiếp để chắc chắn đúng service
import { productService } from "../services/api";
import "./SearchBar.css";

const MIN_QUERY_LEN = 1;     // bạn muốn g/gi/gia => để 1
const DEBOUNCE_MS = 250;

const normalizeSearchItem = (p) => {
  const image =
    p?.thumbnail ||
    (Array.isArray(p?.images) ? p.images[0] : null) ||
    p?.image ||
    "https://via.placeholder.com/80x80?text=No+Image";

  const price = Number(p?.price) || 0;

  return {
    id: p?.id,
    name: p?.name || "",
    price,
    image,
    raw: p,
  };
};
const pickList = (data) => {
  if (Array.isArray(data)) return data;

  // Spring Page
  if (data && Array.isArray(data.content)) return data.content;

  // wrappers hay gặp
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.products)) return data.products;

  return [];
};

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  // chống “kết quả cũ ghi đè kết quả mới”
  const reqIdRef = useRef(0);

  // cache nhỏ để gõ nhanh đỡ gọi lại
  const cacheRef = useRef(new Map());

  const searchProducts = async (query) => {
    const q = (query || "").trim();

    if (q.length < MIN_QUERY_LEN) {
      setSearchResults([]);
      setShowResults(false);
      setIsLoading(false);
      return;
    }

    // mở dropdown ngay lập tức (để thấy loading)
    setShowResults(true);
    setIsLoading(true);

    const myReqId = ++reqIdRef.current;

    // cache hit
    const cached = cacheRef.current.get(q.toLowerCase());
    if (cached) {
      if (myReqId === reqIdRef.current) {
        setSearchResults(cached);
        setIsLoading(false);
      }
      return;
    }

    try {
      const data = await productService.searchProducts(q);

      // nếu request này đã bị “request mới hơn” thay thế thì bỏ qua
      if (myReqId !== reqIdRef.current) return;

      const list = pickList(data);
      const normalized = list.map(normalizeSearchItem).filter((x) => x?.id);
      cacheRef.current.set(q.toLowerCase(), normalized);
      setSearchResults(normalized);
    } catch (err) {
      if (myReqId !== reqIdRef.current) return;
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      if (myReqId === reqIdRef.current) setIsLoading(false);
    }
  };

  // debounce theo searchTerm
  useEffect(() => {
    const t = setTimeout(() => searchProducts(searchTerm), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setShowResults(false);
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
    setShowResults(false);
    setSearchTerm("");
  };

  const handleFocus = () => {
    if (searchTerm.trim().length >= MIN_QUERY_LEN) setShowResults(true);
  };

  // click ngoài => đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="search-bar-inline" ref={searchRef}>
      <form onSubmit={handleSubmit} className="search-form-inline">
        <div className="search-input-wrapper-inline">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M19 19L13.8 13.8M16 8.5C16 12.6421 12.6421 16 8.5 16C4.35786 16 1 12.6421 1 8.5C1 4.35786 4.35786 1 8.5 1C12.6421 1 16 4.35786 16 8.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // gõ là mở dropdown luôn
              if (e.target.value.trim().length >= MIN_QUERY_LEN) setShowResults(true);
            }}
            onFocus={handleFocus}
            className="search-input-inline"
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setSearchTerm("");
                setSearchResults([]);
                setShowResults(false);
              }}
            >
              ×
            </button>
          )}

          {/* nếu bạn có nút “Tìm kiếm” cạnh input thì để type="submit" */}
          {/* <button type="submit" className="search-submit-btn">Tìm kiếm</button> */}
        </div>
      </form>

      {showResults && (
        <div className="search-dropdown-results">
          {isLoading ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <span>Đang tìm kiếm...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="results-list-inline">
              {searchResults.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="result-item-inline"
                  onClick={() => handleProductClick(product)}
                >
                  <img src={product.image} alt={product.name} />
                  <div className="result-info-inline">
                    <h4>{product.name}</h4>
                    <p className="result-price-inline">
                      {(product.price || 0).toLocaleString()}₫
                    </p>
                  </div>
                </div>
              ))}

              <div className="view-all-results-inline">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                    setShowResults(false);
                  }}
                >
                  Xem tất cả {searchResults.length} sản phẩm
                </button>
              </div>
            </div>
          ) : searchTerm.trim().length >= MIN_QUERY_LEN ? (
            <div className="no-results-inline">
              <p>Không tìm thấy sản phẩm</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
