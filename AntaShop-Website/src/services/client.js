// src/services/client.js
import axios from "axios";

const BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:8087").replace(/\/+$/, "");
// LƯU Ý: KHÔNG cộng thêm '/api' ở đây!

export const api = axios.create({
  baseURL: BASE,        // <- chỉ là http://localhost:8087 hoặc http://localhost:8080
  timeout: 15000,
  withCredentials: false,
});

// (tuỳ chọn) interceptor log lỗi
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn("API error:", err?.response?.status, err?.config?.url);
    throw err;
  }
);