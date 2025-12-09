//src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import { Header as Headers, Footer, FloatingButtons } from '../components';
import { authService } from '../services/api';
import { useCart } from '../contexts';
import './AuthPage.css';
import axios from "axios";
export default function Login() {
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();
  const { refreshCart, mergeGuestToUser } = useCart();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email hoặc tên đăng nhập';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateToken = (userData) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: userData.email || userData.username,
      username: userData.username,
      role: userData.role,
      email: userData.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };

    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(payload));

    return `${base64Header}.${base64Payload}.mock_signature`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // authService.login trả về trực tiếp res.data
      const data = await authService.login({ email: formData.email, password: formData.password });

      // một số backend trả thành { accessToken: ..., refreshToken: ... }
      // một số trả access_token / refresh_token — hỗ trợ cả 2 dạng
      const payload = data && (data.accessToken || data.access_token) ? data
        : data && data.data ? data.data // phòng trường hợp api.login trả res object
          : null;

      if (!payload || !(payload.accessToken || payload.access_token)) {
        throw new Error('Phản hồi không hợp lệ từ server');
      }

      const accessToken = payload.accessToken || payload.access_token;
      const refreshToken = payload.refreshToken || payload.refresh_token;
      const role = payload.role;

      // lưu token qua context (login) và localStorage (login implementation của bạn xử lý)
      login(accessToken, refreshToken);
      
      try {
        await mergeGuestToUser();   // 👈 gọi BE /api/cart/merge
        await refreshCart();        // 👈 load lại giỏ theo userId
      } catch (e) {
        console.error('Merge / refresh cart after login error:', e);
      }
      // cố gắng decode token để lấy role nếu backend chưa trả role trực tiếp
      let userRole = role;
      try {
        const parts = accessToken.split('.');
        if (parts.length > 1) {
          const decoded = JSON.parse(atob(parts[1]));
          if (!userRole && decoded && decoded.role) userRole = decoded.role;
        }
      } catch (err) {
        console.warn('Không decode được token:', err);
      }

      setSuccessMessage('🎉 Đăng nhập thành công!');

      const upperRole = String(userRole || '').toUpperCase();
      if (upperRole.includes('ADMIN')) {
        // chuyển hướng admin
        setTimeout(() => navigate('/admin', { replace: true }), 250);
      } else {
        // user thường
        setTimeout(() => navigate('/home', { replace: true }), 250);
      }
    } catch (error) {
      console.error('Login error:', error);

      // ưu tiên lấy message từ response nếu có
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message;
      setErrors({ general: serverMsg || 'Lỗi đăng nhập. Vui lòng kiểm tra lại thông tin.' });
    } finally {
      setIsLoading(false);
    }
  };


  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    setSuccessMessage(`Đang kết nối với ${provider}...`);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="auth-page">
      <Headers />

      <div className="breadcrumbs">
        <div className="container">
          <Link to="/" className="breadcrumb-link">Trang chủ</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Đăng nhập</span>
        </div>
      </div>

      <div className="auth-content">
        <div className="container">
          <div className="auth-form-container">
            <div className="auth-form">
              <div className="auth-header">
                <div className="auth-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <h1 className="auth-title">Đăng nhập tài khoản</h1>
                <p className="auth-subtitle">Chào mừng bạn quay trở lại!</p>
              </div>

              <div className="auth-switch">
                <span>Bạn chưa có tài khoản? </span>
                <Link to="/register" className="auth-link">Đăng ký ngay</Link>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Email hoặc Tên đăng nhập
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="email"
                      name="email"
                      placeholder="Nhập email hoặc tên đăng nhập"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      autoComplete="username"
                    />
                  </div>
                  {errors.email && (
                    <span className="error-message">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Mật khẩu
                  </label>
                  <div className="input-wrapper password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Nhập mật khẩu của bạn"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="error-message">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      {errors.password}
                    </span>
                  )}
                </div>

                <div className="form-options">
                  <Link to="/forgot-password" className="forgot-password">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Quên mật khẩu?
                  </Link>
                </div>

                {errors.general && (
                  <div className="alert alert-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{errors.general}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="alert alert-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>{successMessage}</span>
                  </div>
                )}


                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                      </svg>
                      Đăng nhập
                    </>
                  )}
                </button>
              </form>

              <div className="social-login">
                <div className="social-divider">
                  <span>Hoặc đăng nhập bằng</span>
                </div>

                <div className="social-buttons">
                  <button
                    className="social-btn google-btn"
                    onClick={() => handleSocialLogin('Google')}
                    type="button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    className="social-btn facebook-btn"
                    onClick={() => handleSocialLogin('Facebook')}
                    type="button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <FloatingButtons />
    </div>
  );
}