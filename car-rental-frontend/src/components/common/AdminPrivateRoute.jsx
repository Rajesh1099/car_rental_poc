import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

const AdminPrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isAllowed, setIsAllowed] = useState(null); // null = loading

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const isAdmin = localStorage.getItem("is_admin") === "true";

    if (!token || !isAdmin) {
      handleLogout("Access denied. Admins only.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp && decoded.exp < now) {
        handleLogout("Admin session expired. Please login again.");
      } else {
        setIsAllowed(true);

        // ⏱ Optional: auto logout on token expiry
        const expiresInMs = (decoded.exp - now) * 1000;
        const timer = setTimeout(() => {
          handleLogout("⏱️ Admin session expired. Please login again.");
        }, expiresInMs);

        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error("Admin token decode failed:", err);
      handleLogout("Invalid admin session. Please login again.");
    }
  }, [navigate]);

  const handleLogout = (msg) => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("is_admin");
    toast.error(msg);
    setTimeout(() => navigate("/admin/login", { replace: true }), 1000);
  };

  if (isAllowed === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-red-500 border-dashed rounded-full animate-spin" />
        <span className="ml-4 text-gray-700 dark:text-white">Checking admin access...</span>
      </div>
    );
  }

  return isAllowed ? children : null;
};

export default AdminPrivateRoute;
