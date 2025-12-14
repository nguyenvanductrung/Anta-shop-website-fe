import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header as Headers, Footer } from "../components";
import "./AuthPage.css";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("resetEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      navigate("/forgot-password");
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "Mật khẩu mới là bắt buộc";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      localStorage.removeItem("resetEmail");
      setMessage("Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...");
      
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setErrors({ general: "Đặt lại mật khẩu thất bại. Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'newPassword') {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="auth-page">
      <Headers />
      
      <div className="breadcrumbs">
        <div className="container">
          <span className="breadcrumb-link" onClick={() => navigate('/home')}>Trang chủ</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-link" onClick={() => navigate('/login')}>Đăng nhập</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Đặt lại mật khẩu</span>
        </div>
      </div>

      <div className="auth-content">
        <div className="container">
          <div className="auth-form-container">
            <div className="auth-form">
              <h1 className="auth-title">ĐẶT LẠI MẬT KHẨU</h1>
              
              <div className="auth-switch">
                <span>Đã có tài khoản? </span>
                <Link to="/login" className="auth-link">Đăng nhập ngay</Link>
              </div>

              <form onSubmit={handleSubmit} className="reset-password-form">
                <p className="form-description">
                  Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>
                </p>

                <div className="form-group">
                  <label htmlFor="newPassword">Mật khẩu mới *</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={errors.newPassword ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.newPassword && (
                    <span className="error-message">{errors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={errors.confirmPassword ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <span className="error-message">{errors.confirmPassword}</span>
                  )}
                </div>

                {errors.general && (
                  <div className="error-message general-error">
                    {errors.general}
                  </div>
                )}

                {message && (
                  <div className="success-message">
                    {message}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="auth-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
                </button>

                <div className="form-options">
                  <Link to="/forgot-password" className="back-link">
                    ← Quay lại
                  </Link>
                </div>
              </form>

              <div className="password-requirements">
                <h4>Yêu cầu mật khẩu:</h4>
                <ul>
                  <li className={newPassword.length >= 6 ? 'valid' : ''}>
                    Ít nhất 6 ký tự
                  </li>
                  <li className={newPassword === confirmPassword && newPassword ? 'valid' : ''}>
                    Mật khẩu khớp nhau
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
