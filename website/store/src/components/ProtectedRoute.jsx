import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts";

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && String(user?.role || "").toUpperCase() !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return children;
}
