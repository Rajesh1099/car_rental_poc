import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const GoogleSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    const isAdmin = params.get("is_admin") === "true";

    if (isAdmin) {
      toast.error("Admins are not allowed to login via Google.");
      navigate("/");
      return;
    }

    if (token) {
      localStorage.setItem("user_token", token);
      localStorage.setItem("is_admin", "false");
      toast.success("Google login successful!", { id: "google-success" });

      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } else {
      toast.error("Login failed. Try again.");
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4">
      <Toaster position="top-center" />
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-lg sm:text-xl font-medium">
          Logging you in via Google...
        </span>
      </div>
    </div>
  );
};

export default GoogleSuccess;
