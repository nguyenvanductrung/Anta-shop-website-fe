import React, { useEffect, useRef, useState } from "react";
import "./header.css";
import { useNavigate, Link } from "react-router-dom";
import { useCart, useAuth } from "../contexts";
import SearchDrawer from "./overlays/SearchDrawer";
import { ROUTES, MENU_ITEMS } from "../constants";
import { getGroupedCategories } from "../services/categories";

const CANON_TITLES = [
  { key: "men", label: "NAM" },
  { key: "women", label: "NỮ" },
  { key: "accessories", label: "PHỤ KIỆN" },
  { key: "kids", label: "KIDS" },
];

const Header = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // timers để hover mượt
  const openTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // menu tĩnh + động (danh mục)
  const [menuData, setMenuData] = useState(MENU_ITEMS);

  useEffect(() => {
    (async () => {
      let grouped = {};
      try {
        grouped = await getGroupedCategories();
      } catch (e) {
        console.warn("load categories for header failed", e);
      }

      const dynamicGroups = CANON_TITLES.map((t) => ({
        id: `dyn-${t.key}`,
        name: t.label,
        link: `/shop/${t.key}`,
        hasDropdown: true,
        dropdown: [
          {
            title: "Danh mục",
            items: (grouped[t.key] || []).map((c) => ({
              name: c.name,
              link: `/shop/${t.key}/${c.slug}`,
            })),
          },
        ],
      }));

      setMenuData([...MENU_ITEMS, ...dynamicGroups]);
    })();

    return () => {
      window.clearTimeout(openTimeoutRef.current);
      window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handlePushRouter = (link) => {
    if (!link) return;
    navigate(link);
    setIsMobileMenuOpen(false);
  };

  // Hover mượt: delay mở/đóng
  const handleEnter = (itemId) => {
    window.clearTimeout(closeTimeoutRef.current);
    openTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(itemId);
    }, 80);
  };

  const handleLeave = () => {
    window.clearTimeout(openTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 140);
  };

  const handleMobileMenuToggle = () => setIsMobileMenuOpen((v) => !v);
  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
    setIsMobileMenuOpen(false);
  };

  const handleCartClick = () => navigate(ROUTES.CART);
  const handleSearchToggle = () => setIsSearchOpen((v) => !v);

  return (
    <>
      <header className="anta-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={handleMobileMenuToggle}
              aria-label="Menu"
            >
              <span className={`toggle-bar ${isMobileMenuOpen ? "active" : ""}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>

            <Link to={ROUTES.HOME} className="brand-logo">
              <img
                src="https://theme.hstatic.net/1000150581/1001194384/14/logo.png?v=1868"
                alt="Anta Logo"
                className="h-12 w-auto object-contain cursor-pointer"
              />
            </Link>
          </div>

          <nav className="header-navigation">
            <ul className="navigation-list">
              {menuData.map((item) => {
                const isOpen = activeDropdown === item.id && item.hasDropdown;

                return (
                  <li
                    key={item.id}
                    className="navigation-item"
                    onMouseEnter={() => item.hasDropdown && handleEnter(item.id)}
                    onMouseLeave={handleLeave}
                  >
                    <Link to={item.link} className="nav-item-link">
                      <span
                        className={`nav-item-text ${
                          item.highlight ? "text-highlight" : ""
                        }`}
                      >
                        {item.name}
                      </span>

                      {item.hasDropdown && (
                        <svg
                          className="nav-chevron"
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                        >
                          <path
                            d="M1 1L5 5L9 1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </Link>

                    {item.hasDropdown && (
                      <div
                        className={`navigation-dropdown ${isOpen ? "open" : ""}`}
                        onMouseEnter={() => handleEnter(item.id)}
                        onMouseLeave={handleLeave}
                        aria-hidden={!isOpen}
                      >
                        <div className="dropdown-container">
                          {item.dropdown.map((section, index) => (
                            <div key={index} className="dropdown-column">
                              <h4 className="column-title">{section.title}</h4>

                              <ul className="column-items">
                                {section.items.map((subItem, subIndex) => {
                                  const label =
                                    typeof subItem === "string"
                                      ? subItem
                                      : subItem.name;

                                  const toLink =
                                    typeof subItem === "string"
                                      ? item.link
                                      : subItem.link;

                                  return (
                                    <li key={subIndex} className="column-item">
                                      <span onClick={() => handlePushRouter(toLink)}>
                                        {label}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="header-right">
            <button
              className="header-action search-action"
              onClick={handleSearchToggle}
              aria-label="Tìm kiếm"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.9999 19L14.6499 14.65"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              className="header-action user-action"
              onClick={() => {
                if (!isAuthenticated) navigate(ROUTES.LOGIN);
                else if (user?.role === "ADMIN") navigate(ROUTES.ADMIN);
                else navigate("/account");
              }}
              aria-label={isAuthenticated ? "Tài khoản" : "Đăng nhập"}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M16 17V15C16 13.9391 15.5786 12.9217 14.8284 12.1716C14.0783 11.4214 13.0609 11 12 11H6C4.93913 11 3.92172 11.4214 3.17157 12.1716C2.42143 12.9217 2 13.9391 2 15V17M13 5C13 6.65685 11.6569 8 10 8C8.34315 8 7 6.65685 7 5C7 3.34315 8.34315 2 10 2C11.6569 2 13 3.34315 13 5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              className="header-action wishlist-action"
              onClick={() => {
                if (isAuthenticated) navigate("/account/wishlist");
                else navigate(ROUTES.LOGIN);
              }}
              aria-label="Yêu thích"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 17.5L2.5 10C0.833333 8.33333 0.833333 5.5 2.5 3.83333C4.16667 2.16667 7 2.16667 8.66667 3.83333L10 5.16667L11.3333 3.83333C13 2.16667 15.8333 2.16667 17.5 3.83333C19.1667 5.5 19.1667 8.33333 17.5 10L10 17.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="action-count">0</span>
            </button>

            <button
              className="header-action cart-action"
              onClick={handleCartClick}
              aria-label="Giỏ hàng"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M1 1H3.66667L5.73333 12.3933C5.82417 12.8453 6.06973 13.2512 6.42855 13.5422C6.78737 13.8332 7.2362 13.9916 7.7 13.9917H15.4C15.8638 13.9916 16.3126 13.8332 16.6715 13.5422C17.0303 13.2512 17.2758 12.8453 17.3667 12.3933L18.6667 5.66667H4.33333M7.66667 17.6667C7.66667 18.1269 7.29357 18.5 6.83333 18.5C6.3731 18.5 6 18.1269 6 17.6667C6 17.2064 6.3731 16.8333 6.83333 16.8333C7.29357 16.8333 7.66667 17.2064 7.66667 17.6667ZM16.1667 17.6667C16.1667 18.1269 15.7936 18.5 15.3333 18.5C14.8731 18.5 14.5 18.1269 14.5 17.6667C14.5 17.2064 14.8731 16.8333 15.3333 16.8333C15.7936 16.8333 16.1667 17.2064 16.1667 17.6667Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="action-count">{totalItems}</span>
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={handleMobileMenuToggle}>
          <div
            className="mobile-menu-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <h3 className="panel-title">MENU</h3>
              <button
                className="panel-close"
                onClick={handleMobileMenuToggle}
                aria-label="Đóng"
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

            <nav className="panel-navigation">
              {menuData.map((item) => (
                <div key={item.id} className="panel-nav-item">
                  <span
                    className={`panel-nav-text ${
                      item.highlight ? "text-highlight" : ""
                    }`}
                    onClick={() => handlePushRouter(item.link)}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </nav>

            <div className="panel-footer">
              {isAuthenticated ? (
                <div className="auth-section">
                  <p className="auth-greeting">Xin chào, {user.username}</p>
                  <button className="auth-button" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  className="auth-button"
                  onClick={() => handlePushRouter(ROUTES.LOGIN)}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SearchDrawer open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
