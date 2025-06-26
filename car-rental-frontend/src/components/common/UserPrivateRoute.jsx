import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

const UserPrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAllowed, setIsAllowed] = useState(null);
  const logoutTriggered = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    const isAdmin = localStorage.getItem("is_admin") === "true";

    if (!token || isAdmin) {
      // ❌ Token missing or invalid role (user tried to visit manually)
      navigate("/unauthorized", { replace: true });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        // ⏱ Token already expired
        handleLogout("Session timed out. Please log in again.", true);
      } else {
        setIsAllowed(true);

        // ⏳ Schedule auto-logout when token expires
        const expiresInMs = (decoded.exp - now) * 1000;
        const timer = setTimeout(() => {
          handleLogout("⏱️ Session expired. Please log in again.", false);
        }, expiresInMs);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("JWT Decode Error:", error);
      navigate("/unauthorized", { replace: true });
    }
  }, [navigate, location]);

  const handleLogout = (message, show401) => {
    if (logoutTriggered.current) return;
    logoutTriggered.current = true;

    localStorage.removeItem("user_token");
    localStorage.removeItem("is_admin");
    toast.error(message);

    setIsAllowed(null);
    setTimeout(() => {
      if (show401) {
        navigate("/unauthorized", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }, 1000);
  };

  if (isAllowed === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
      </div>
    );
  }

  return isAllowed ? children : null;
};

export default UserPrivateRoute;
