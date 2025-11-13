import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts";
import "./AuthForm.css";

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
    e.preventDefault();
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8082";

    try {
      let url, payload;

      if (type === "register") {
        url = `${baseUrl}/api/auth/register`;
        const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
        payload = {
          name: fullName,
          email: formData.email?.trim(),
          password: formData.password,
          phoneNumber: formData.phoneNumber?.trim(),
        };

        const res = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
        alert(res.data?.message || "Đăng ký thành công!");
        navigate("/login");
      } else {
        url = `${baseUrl}/api/auth/login`;
        payload = {
          name: formData.name?.trim(),
          password: formData.password,
        };

        const res = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });

        const accessToken = res.data?.accessToken;
        const refreshToken = res.data?.refreshToken;

        if (!accessToken) {
          alert("Đăng nhập thất bại: server không trả token.");
          return;
        }

        login(accessToken, refreshToken);
        alert("Đăng nhập thành công!");
        navigate("/home");
      }
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
