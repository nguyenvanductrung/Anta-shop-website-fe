import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts";
import "./AuthForm.css";
import { authService } from "../services/api";

export default function AuthForm({ type }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    try {
      if (type === "register") {
        const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
        const payload = {
          name: fullName,
          email: formData.email?.trim(),
          password: formData.password,
          phoneNumber: formData.phoneNumber?.trim(),
        };
        const res = await authService.register(payload);
        // authService.register trả res.data (theo api bạn định nghĩa)
        alert(res?.message || "Đăng ký thành công!");
        navigate("/login");
        return;
      }

      // LOGIN
      const res = await authService.login({
        name: formData.name?.trim(),
        password: formData.password,
      });

      const accessToken = res?.accessToken || res?.data?.accessToken;
      const refreshToken = res?.refreshToken || res?.data?.refreshToken; 
      if (!accessToken) {
        alert("Đăng nhập thất bại: server không trả token.");
        return;
      }

      login(accessToken, refreshToken);
      alert("Đăng nhập thành công!");
      navigate("/home");
     } catch (err) {
      if (err.response) {
        alert("Lỗi: " + (err.response.data?.message || JSON.stringify(err.response.data)));
      } else {
        alert("Lỗi kết nối: " + err.message);
      }
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{type === "register" ? "Register" : "Login"}</h2>

        {type === "register" && (
          <>
            <input
              type="text"
              name="firstName"
              placeholder="Họ và tên đệm"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Tên"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phoneNumber"
              placeholder="Số điện thoại"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </>
        )}

        {type === "login" && (
          <input
            type="text"
            name="name"
            placeholder="Email hoặc Tên đăng nhập"
            value={formData.name}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">{type === "register" ? "Sign Up" : "Login"}</button>

        <div style={{ marginTop: 12 }}>
          {type === "register" ? (
            <>
              Already have an account? <Link to="/login">Login</Link>
            </>
          ) : (
            <>
              Don’t have an account? <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </form>
    </div>
  );
}