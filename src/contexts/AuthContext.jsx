// src/contexts/AuthContext.jsx
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
import { createNewSessionId } from "../utils/session";
// Hàm decode JWT
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

  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

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

  const login = (access, refresh, userData) => {
    if (!access) {
      xoaTatCa();
      return;
    }

    luuToken(access, refresh);

    // Ưu tiên lấy user từ response BE
    if (userData) {
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setIsAdmin(userData.role === "ADMIN");
      return;
    }

    // Nếu không có userData thì fallback decode token
    const decoded = decodeJwt(access);
    if (decoded) {
      const userId =
        decoded.id || decoded.userId || decoded.user_id || null;
      const role = String(decoded.role || "USER").toUpperCase();
      const u = {
        id: Number(userId),
        username: decoded.username || decoded.sub || "",
        role,
        email: decoded.email || "",
      };
      setUser(u);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
      setIsAdmin(role === "ADMIN");
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  };

  const logout = () => {
    xoaTatCa();
    createNewSessionId();
    window.dispatchEvent(new CustomEvent("auth:logout"));
};

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

useEffect(() => {
  const loadUser = async () => {
    setIsLoading(true);
    if (accessToken) {
      const decoded = decodeJwt(accessToken);
      if (decoded) {
        const userId =
          decoded.id || decoded.userId || decoded.user_id || null;
        const role = String(decoded.role || "USER").toUpperCase();
        const u = {
          id: Number(userId),
          username: decoded.sub || decoded.username || decoded.name || "",
          role,
          email: decoded.email || "",
          phoneNumber: decoded.phoneNumber || decoded.phone || "",
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

// Hook tiện dụng
export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth phải được dùng trong <AuthProvider>");
  return c;
};