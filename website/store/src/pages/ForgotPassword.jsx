import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Header as Headers, Footer } from "../components";
import "./AuthPage.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8082";

  // ----------------------------
  // 📨 Gửi mã OTP 6 số
  const handleSendOtp = async () => {
    setError("");
    setMessage("");
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/auth/forgot-password`, { email });
      setMessage(res.data?.message || "📩 Mã xác nhận đã được gửi đến email của bạn");
    } catch (err) {
      console.error(err);
      setError(err.response?.data || "Không thể gửi mã xác nhận, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------
  // ✅ Xác minh mã và đổi mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const otpClean = otp.replace(/\D/g, "");
    if (otpClean.length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã xác nhận");
      return;
    }

    if (!password || password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);
    try {
      // 1️⃣ Kiểm tra mã OTP
      const verify = await axios.post(`${baseUrl}/api/auth/verify-reset-code`, {
        email,
        code: otpClean,
      });
      if (verify.status !== 200) throw new Error("OTP không hợp lệ");

      // 2️⃣ Reset mật khẩu
      await axios.post(`${baseUrl}/api/auth/reset-password`, {
        email,
        newPassword: password,
      });

      setMessage("✅ Đặt lại mật khẩu thành công! Chuyển hướng sau 2s...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data || "Xác minh thất bại, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Headers />

      <div className="auth-content">
        <div className="container">
          <div className="auth-form-container">
            <div className="auth-form">
              <h1 className="auth-title">QUÊN MẬT KHẨU</h1>

              <div className="auth-switch">
                <span>Đã nhớ mật khẩu? </span>
                <Link to="/login" className="auth-link">
                  Đăng nhập ngay
                </Link>
              </div>

              <form onSubmit={handleResetPassword} style={{ marginTop: "20px" }}>
                {/* Email */}
                <div className="email-group">
                  <div style={{ flex: 1 }}>
                    <label>Email *</label>
                    <input width={"130%"}
                      type="email"
                      placeholder="Nhập địa chỉ email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading || !email}
                  >
                    {isLoading ? "Đang gửi..." : "Gửi mã"}
                  </button>
                </div>

                {/* OTP */}
                <div className="form-group">
                  <label class ="lable">Mã xác nhận *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Nhập 6 chữ số"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    required
                  />
                </div>

                {/* Mật khẩu mới */}
                <div className="form-group password-wrapper">
                  <label>Mật khẩu mới *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ width: "100%", paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="form-group password-wrapper">
                  <label>Xác nhận mật khẩu *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ width: "100%", paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>


                {/* Message */}
                {error && (
                  <div
                    style={{
                      background: "#ffe6e6",
                      color: "#d93025",
                      padding: "10px",
                      borderRadius: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    {error}
                  </div>
                )}
                {message && (
                  <div
                    style={{
                      background: "#e7f9ed",
                      color: "#1b873f",
                      padding: "10px",
                      borderRadius: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    {message}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading}
                  style={{
                    width: "50%",
                    marginTop: "10px",
                    background: "#007bff",
                    color: "#fff",
                    fontWeight: "bold",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    marginLeft: "25%",
                  }}
                >
                  {isLoading ? "Đang xử lý..." : "Xác Nhận"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
