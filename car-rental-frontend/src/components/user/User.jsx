//its the login and registration page for the car rental app
// It allows users to login or register using email and password, or via Google OAuth.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { BsSun, BsMoon, BsEye, BsEyeSlash } from "react-icons/bs";
import Typical from "react-typical";

const User = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Dark mode setup
 // 1. On page load: read from localStorage and apply theme
useEffect(() => {
  document.documentElement.classList.toggle("dark", darkMode);
  localStorage.setItem("theme", darkMode ? "dark" : "light");
}, [darkMode]);


  // Google OAuth callback
  useEffect(() => {
    const handleGoogleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        toast.error(`Google login failed: ${error}`,{id:"google-login-failed"});
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      if (code && state) {
        try {
          const storedState = localStorage.getItem("oauth_state");
          if (!storedState || state !== storedState) {
            toast.error("Invalid state parameter",{id:"invalid-state-parameter"});
            return;
          }
          localStorage.removeItem("oauth_state");
          await handleGoogleCallback(code);
        } catch (err) {
          console.error("Google auth error:", err);
          toast.error("Failed to process Google login",{id:"failed-to-process-google-login"});
        } finally {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    };

    handleGoogleAuth();
  }, []);

  const handleGoogleCallback = async (code) => {
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8000/google/callback",
        new URLSearchParams({ code }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const { access_token, is_verified, is_admin } = res.data;

      if (is_admin) return toast.error("Admins can't login here",{id:"admins-cant-login-here"});
      if (!is_verified) return toast.error("Please verify your email",{id:"please-verify-your-email"});

      localStorage.setItem("user_token", access_token);
      localStorage.setItem("is_admin", "false"); // as string
      //toast.success("Google login successful!",{id:"googlelogin-success"});
      navigate("/home");
    } catch (err) {
      console.error("Google login error:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Google login failed";
      toast.error(errorMessage,{id:"error-msgs1"});
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value.trimStart() });
  setErrors({ ...errors, [e.target.name]: "" });
};


  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    const nameRegex = /^[A-Za-z\s\-']+$/;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = "Name should contain only letters";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!emailRegex.test(formData.email))
      newErrors.email = "Must be a valid email";
    if (!passwordRegex.test(formData.password))
      newErrors.password =
        "Password must include uppercase, lowercase, number, special character, min 8 chars";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post(
          "http://localhost:8000/login",
          new URLSearchParams({
            username: formData.email,
            password: formData.password,
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token, is_verified, is_admin } = res.data;

        if (is_admin) return toast.error("Admins can't login here",{id:"no-admins"});
        if (!is_verified) return toast.error("Please verify your email",{id:"verify-email"});

        localStorage.setItem("user_token", access_token);
        localStorage.setItem("is_admin", false);
        toast.success("Login successful!",{id:"login-successful"});
        navigate("/home");
      } else {
        if (!validate()) {
          setLoading(false);
          return;
        }
        await axios.post("http://localhost:8000/register", formData);
        toast.success("Registered Successfully",{id:"registered-successfully"});
        setTimeout(() => {
          toast.success("Please check your inbox/spam to verify your email.",{id:"check-inbox-email"});
          setIsLogin(true);
        }, 3000);
      }
    } catch (err) {
      const message = err.response?.data?.detail || "Something went wrong.";
      toast.error(message,{id:"error2"});
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const state = crypto.randomUUID();
    localStorage.setItem("oauth_state", state);
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8000/google/login?state=${state}`
      );
      window.location.href = res.data.auth_url;
    } catch (error) {
      toast.error("Failed to initiate Google login.",{id:"invalid-g-login"});
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Toaster />
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-full"
        title="Toggle theme"
      >
        {darkMode ? (
          <BsSun size={20} className="text-yellow-400" />
        ) : (
          <BsMoon size={18} className="text-gray-800" />
        )}
      </button>

      <div className="text-2xl md:text-4xl font-bold text-center text-blue-600 dark:text-blue-300 mb-6">
        <Typical
          steps={["Welcome to BoomBoomCars", 2500]}
          loop={Infinity}
          wrapper="span"
        />
      </div>

      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 md:p-12 relative overflow-hidden">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-full w-[200px]">
            <button
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                isLogin
                  ? "bg-white dark:bg-gray-900 text-blue-600 shadow"
                  : "text-gray-500"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                !isLogin
                  ? "bg-white dark:bg-gray-900 text-green-600 shadow"
                  : "text-gray-500"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 dark:text-gray-200">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1 dark:text-gray-200">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm mb-1 dark:text-gray-200">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="Strong password"
                  />
                  <div
                    className="absolute top-9 right-3 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <BsEyeSlash /> : <BsEye />}
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm mb-1 dark:text-gray-200">
                    Confirm Password
                  </label>
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full border px-4 py-2 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="Re-enter password"
                  />
                  <div
                    className="absolute top-9 right-3 cursor-pointer"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <BsEyeSlash /> : <BsEye />}
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {isLogin && (
            <>
              <div>
                <label className="block text-sm mb-1 dark:text-gray-200">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-sm mb-1 dark:text-gray-200">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Your password"
                  required
                />
                <div
                  className="absolute top-9 right-3 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              isLogin ? "bg-blue-600" : "bg-green-600"
            } text-white font-semibold py-3 rounded transition hover:opacity-90 ${
              loading && "opacity-60 cursor-not-allowed"
            }`}
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Registering..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>

        <div className="text-sm text-center mt-4 text-gray-600 dark:text-gray-300">
          {isLogin ? (
            <>
              <p className="mb-1">
                Don’t have an account?{" "}
                <span
                  onClick={() => setIsLogin(false)}
                  className="text-green-600 cursor-pointer hover:underline"
                >
                  Register
                </span>
              </p>
              <p
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </p>
            </>
          ) : (
            <p>
              Already have an account?{" "}
              <span
                onClick={() => setIsLogin(true)}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Login
              </span>
            </p>
          )}
        </div>

        <div className="my-4 border-t dark:border-gray-600" />

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border rounded px-4 py-2 shadow hover:shadow-md transition disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-pulse">Redirecting...</span>
          ) : (
            <>
              <FcGoogle size={20} /> Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default User;
