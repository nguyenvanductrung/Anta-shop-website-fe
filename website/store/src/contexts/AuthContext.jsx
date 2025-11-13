import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { STORAGE_KEYS } from "../constants";
import { authService } from "../services/api";
import api from "../services/api";

// -------------------------
// 🔍 Hàm decode JWT
// -------------------------
function decodeJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// -------------------------
// 🧩 Context
// -------------------------
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  });

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(STORAGE_KEYS.TOKEN)
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------
  // ⚙️ Gắn token vào axios
  // -------------------------
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  // -------------------------
  // 💾 Lưu token vào localStorage
  // -------------------------
  const luuToken = (access, refresh) => {
    if (access) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, access);
      setAccessToken(access);
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
    }
    if (refresh) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      setRefreshToken(refresh);
    }
  };

  // -------------------------
  // ❌ Xóa toàn bộ khi logout
  // -------------------------
  const xoaTatCa = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAdmin(false);
    delete api.defaults.headers.common["Authorization"];
  };

  // -------------------------
  // 🔐 LOGIN
  // -------------------------
  const login = (access, refresh) => {
    if (!access) {
      xoaTatCa();
      return;
    }

    luuToken(access, refresh);

    const decoded = decodeJwt(access);
    if (decoded) {
      // ⚠️ Giả định token có chứa id hoặc userId
      const userId =
        decoded.id ||
        decoded.userId ||
        decoded.user_id ||
        decoded.sub ||
        null;

      const role = String(decoded.role || decoded.roles || "USER").toUpperCase();
      const u = {
        id: Number(userId),
        username: decoded.sub || decoded.username || decoded.name || "",
        role,
        email: decoded.email || "",
        phoneNumber: decoded.phoneNumber || decoded.phone || "", // 👈 thêm dòng này
      };

      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
      } catch (e) {
        console.warn("Không lưu được thông tin user vào localStorage", e);
      }

      setUser(u);
      setIsAdmin(role === "ADMIN");
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  };

  // -------------------------
  // 🚪 LOGOUT
  // -------------------------
  const logout = () => {
    xoaTatCa();
    window.dispatchEvent(new CustomEvent("auth:logout"));
  };

  // -------------------------
  // 🔁 Làm mới token
  // -------------------------
  const thuLamMoiToken = useCallback(async () => {
    const storedRefresh =
      refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!storedRefresh) return false;

    try {
      const res = await authService.refreshToken(storedRefresh);
      const newAccess =
        res?.accessToken ||
        res?.data?.accessToken ||
        res?.token ||
        res?.access_token;
      if (newAccess) {
        luuToken(newAccess, storedRefresh);
        return true;
      }
      return false;
    } catch {
      xoaTatCa();
      return false;
    }
  }, [refreshToken]);

  // -------------------------
  // 🧱 Interceptor tự refresh token
  // -------------------------
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (r) => r,
      async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          const ok = await thuLamMoiToken();
          if (ok) {
            original.headers["Authorization"] = `Bearer ${localStorage.getItem(
              STORAGE_KEYS.TOKEN
            )}`;
            return api(original);
          }
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [thuLamMoiToken]);

  // -------------------------
  // ♻️ F5 giữ đăng nhập
  // -------------------------
  // ♻️ F5 giữ đăng nhập
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      if (accessToken) {
        const decoded = decodeJwt(accessToken);
        if (decoded) {
          const userId =
            decoded.id ||
            decoded.userId ||
            decoded.user_id ||
            decoded.sub ||
            null;

          const role = String(decoded.role || decoded.roles || "USER").toUpperCase();
          const u = {
            id: Number(userId),
            username: decoded.sub || decoded.username || decoded.name || "",
            role,
            email: decoded.email || "",
            phoneNumber: decoded.phoneNumber || decoded.phone || "", // ✅ Thêm dòng này
          };

          setUser(u);
          setIsAdmin(role === "ADMIN");
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
        } else {
          await thuLamMoiToken();
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [accessToken, thuLamMoiToken]);


  // -------------------------
  // 📦 Provider
  // -------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!accessToken,
        isAdmin,
        isLoading,
        login,
        logout,
        tryRefresh: thuLamMoiToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// -------------------------
// 📦 Hook tiện dụng
// -------------------------
export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth phải được dùng trong <AuthProvider>");
  return c;
};
