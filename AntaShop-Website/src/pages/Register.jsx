import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import { Header as Headers, Footer, FloatingButtons } from '../components';
import './AuthPage.css';
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8082";

  // -----------------------------
  // 🧩 Các state chính
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // -----------------------------
  // ✉️ State cho xác thực email
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [otpMessage, setOtpMessage] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  // -----------------------------
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

  // -----------------------------
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Vui lòng nhập tên';
    if (!formData.lastName.trim()) newErrors.lastName = 'Vui lòng nhập họ';
    if (!formData.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\D/g, '')))
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if (formData.password.length < 6)
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!formData.confirmPassword)
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------
  //  Gửi OTP xác thực email (B1)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    setOtpMessage('');

    try {
      const res = await axios.post(`${baseUrl}/api/auth/verify/request`, {
        email: formData.email,
      });
      setOtpMessage(res.data.message || ' Mã OTP đã được gửi tới email của bạn');
      setStep(2); // Chuyển sang bước nhập OTP
      setShowOtpModal(true);
    } catch (err) {
      console.error(err);
      setErrors({ general: err.response?.data?.error || 'Không thể gửi mã OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // ✅ Xác thực OTP (B2)
  // -----------------------------
  // ✅ Xác thực OTP (B2)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const joinedOtp = otp.join("").trim();

    if (joinedOtp.length !== 6 || !/^\d{6}$/.test(joinedOtp)) {
      setErrors({ otp: 'Vui lòng nhập đầy đủ mã OTP (6 số)' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/auth/verify/confirm`, {
        email: formData.email,
        otp: joinedOtp,
      });

      console.log("🔍 Kết quả xác thực OTP:", res.data);

      if (res.data.verified === true) {
        setOtpMessage(' Email đã xác thực! Đang tạo tài khoản...');
        await handleSubmit(); // Gọi hàm đăng ký thật sự
      } else {
        setErrors({ otp: 'Mã OTP không chính xác hoặc đã hết hạn' });
      }
    } catch (err) {
      setErrors({ otp: err.response?.data?.error || 'Xác thực OTP thất bại' });
    } finally {
      setIsLoading(false);
    }
  };


  // -----------------------------
  // 🧾 Đăng ký thật sau khi xác thực OTP
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const fullName = `${formData.lastName} ${formData.firstName}`.trim();
      const payload = {
        name: fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
      };

      console.log('📤 Gửi request tới:', `${baseUrl}/api/auth/register`, payload);
      const response = await axios.post(`${baseUrl}/api/auth/register`, payload);

      setSuccessMessage('🎉 Đăng ký thành công!');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Đăng ký thất bại. Vui lòng thử lại sau.' });
      }
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
          <span className="breadcrumb-current">Đăng ký</span>
        </div>
      </div>

      <div className="auth-content">
        <div className="container">
          <div className="auth-form-container register-container">
            <div className="auth-form register-form-wrapper">
              <div className="auth-header">
                <div className="auth-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                  </svg>
                </div>
                <h1 className="auth-title">Đăng ký tài khoản</h1>
                <p className="auth-subtitle">Tạo tài khoản để trải nghiệm mua sắm tốt hơn</p>
              </div>

              <div className="auth-switch">
                <span>Bạn đã có tài khoản? </span>
                <Link to="/login" className="auth-link">Đăng nhập ngay</Link>
              </div>

              <form onSubmit={handleSendOtp} className="register-form">
                <div className="form-section">
                  <h2 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '25px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Thông tin cá nhân
                  </h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">
                        Họ và tên đệm
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          placeholder="Nguyễn Văn"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                          autoComplete="family-name"
                        />
                      </div>
                      {errors.lastName && (
                        <span className="error-message">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          {errors.lastName}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">
                        Tên
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          placeholder="A"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                          autoComplete="given-name"
                        />
                      </div>
                      {errors.firstName && (
                        <span className="error-message">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          {errors.firstName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      Số điện thoại
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="0987654321"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`form-input ${errors.phone ? 'input-error' : ''}`}
                        autoComplete="tel"
                      />
                    </div>
                    {errors.phone && (
                      <span className="error-message">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {errors.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <h2 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '25px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Thông tin đăng nhập
                  </h2>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      Email
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input ${errors.email ? 'input-error' : ''}`}
                        autoComplete="email"
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
                        placeholder="Tối thiểu 6 ký tự"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input ${errors.password ? 'input-error' : ''}`}
                        autoComplete="new-password"
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

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Xác nhận mật khẩu
                    </label>
                    <div className="input-wrapper password-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showConfirmPassword ? (
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
                    {errors.confirmPassword && (
                      <span className="error-message">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {errors.confirmPassword}
                      </span>
                    )}
                  </div>
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
                      Đang gửi mã OTP...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <polyline points="17 11 19 13 23 9"></polyline>
                      </svg>
                      Gửi mã OTP
                    </>
                  )}
                </button>

              </form>

              <div className="social-login">
                <div className="social-divider">
                  <span>Hoặc đăng ký bằng</span>
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
      {showOtpModal && (
        <div
          className="otp-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="otp-box"
            style={{
              background: '#fff',
              padding: '40px 30px',
              borderRadius: '12px',
              width: '450px', // tăng rộng khung để ô thứ 6 không bị khít
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }}
          >
            <div className="auth-icon" style={{ marginBottom: '10px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <h2 className="auth-title">Xác thực Email</h2>
            <p className="auth-subtitle">
              Mã xác thực đã được gửi đến <strong>{formData.email}</strong><br />
              (Hết hạn trong 2 phút)
            </p>

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
              {/* 6 ô nhập OTP */}
              <div
                style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}
                onPaste={(e) => {
                  // Paste chung: lấy tất cả chữ số, điền vào otp
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                  if (!pasted) return;
                  setOtp((prev) => {
                    const newOtp = [...prev];
                    for (let i = 0; i < 6; i++) {
                      newOtp[i] = pasted[i] || '';
                    }
                    return newOtp;
                  });
                  // focus vào ô tiếp theo sau khi paste
                  const lastIndex = Math.min(pasted.length - 1, 5);
                  const nextIndex = lastIndex + 1 <= 5 ? lastIndex + 1 : 5;
                  const el = document.getElementById(`otp-${nextIndex}`);
                  if (el) el.focus();
                  e.preventDefault();
                }}
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={otp[index]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtp((prev) => {
                        const newOtp = [...prev];
                        newOtp[index] = val;
                        return newOtp;
                      });
                      if (val) {
                        // chuyển focus sang ô tiếp theo
                        const next = document.getElementById(`otp-${index + 1}`);
                        if (next) next.focus();
                      }
                    }}
                    onFocus={(e) => {
                        // 1. Đặt con trỏ ở cuối
                      const len = e.target.value?.length || 0;
                      try {
                        e.target.setSelectionRange(len, len);
                      } catch (err) { }

                      // 2. Đổi màu border
                      e.target.style.borderColor = "#007bff";
                    }}
                    onKeyDown={(e) => {
                      const key = e.key;
                      // backspace: nếu ô hiện tại rỗng -> quay về ô trước và clear
                      if (key === 'Backspace') {
                        if (otp[index]) {
                          // nếu có ký tự thì chỉ xóa ký tự này (onChange xử lý)
                          return;
                        } else {
                          // nếu rỗng -> chuyển về ô trước và xóa ô đó
                          const prevEl = document.getElementById(`otp-${index - 1}`);
                          if (prevEl) {
                            setOtp((prev) => {
                              const newOtp = [...prev];
                              newOtp[index - 1] = '';
                              return newOtp;
                            });
                            prevEl.focus();
                            e.preventDefault();
                          }
                        }
                      }
                      // left / right arrow navigation
                      if (key === 'ArrowLeft') {
                        const prevEl = document.getElementById(`otp-${index - 1}`);
                        if (prevEl) { prevEl.focus(); e.preventDefault(); }
                      } else if (key === 'ArrowRight') {
                        const nextEl = document.getElementById(`otp-${index + 1}`);
                        if (nextEl) { nextEl.focus(); e.preventDefault(); }
                      }
                      // nếu người dùng dán số dài bằng Ctrl+V trong 1 ô (safety) -> sẽ xử lý ở onPaste wrapper
                    }}
                    style={{
                      width: "56px",
                      height: "60px",
                      textAlign: "center",
                      fontSize: "26px",
                      fontWeight: "600",
                      color: "#000",
                      backgroundColor: "#fff",
                      border: "2px solid #d9d9d9",
                      borderRadius: "10px",
                      outline: "none",
                      caretColor: "#000", // hiện con trỏ
                      transition: "all 0.15s ease",
                    }}

                  />
                ))}
              </div>

              {/* Nút xác nhận chính */}
              <button
                type="submit"
                className="auth-submit-btn"
                style={{
                  width: '220px',
                  background: '#007bff',
                  color: '#fff',
                  fontWeight: 'bold',
                  padding: '10px 0',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                XÁC NHẬN & TIẾP TỤC
              </button>
            </form>

            <button
              type="button"
              className="auth-link"
              onClick={() => setShowOtpModal(false)}
              style={{
                display: 'block',
                marginTop: '12px',
                color: '#007bff',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      <Footer />
      <FloatingButtons />
    </div >
  );
}