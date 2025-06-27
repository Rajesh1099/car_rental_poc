import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import { useNavigate } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaUserCircle } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";

const Profile = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const validateName = (name) => /^[A-Za-z ]{3,}$/.test(name);
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("user_token");
        if (!token) return navigate("/");

        const res = await axios.get("https://car-rental-backend-mda4.onrender.com/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
        setForm({
          name: res.data.name,
          email: res.data.email,
          password: "",
          confirmPassword: "",
        });
      } catch {
        toast.error("Failed to fetch profile");
        navigate("/");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    const newErrors = { ...errors };

    if (name === "name") {
      newErrors.name = validateName(value)
        ? ""
        : "Min 3 letters, alphabets/spaces only";
    } else if (name === "email") {
      newErrors.email = validateEmail(value)
        ? ""
        : "Must be a valid email address";
    } else if (name === "password") {
      newErrors.password =
        value && !validatePassword(value)
          ? "Min 8 chars, 1 upper, 1 lower, 1 digit, 1 symbol"
          : "";
      newErrors.confirmPassword =
        form.confirmPassword && value !== form.confirmPassword
          ? "Passwords do not match"
          : "";
    } else if (name === "confirmPassword") {
      newErrors.confirmPassword =
        form.password && value !== form.password
          ? "Passwords do not match"
          : "";
    }

    setErrors(newErrors);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const newErrors = {
      name: validateName(form.name) ? "" : "Invalid name",
      email: validateEmail(form.email) ? "" : "Invalid email",
      password:
        form.password && !validatePassword(form.password)
          ? "Weak password"
          : "",
      confirmPassword:
        form.password && form.password !== form.confirmPassword
          ? "Mismatch"
          : "",
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e)) {
      toast.error("Fix validation errors");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("user_token");
      const res = await axios.put(
        "https://car-rental-backend-mda4.onrender.com/user/profile/update",
        {
          name: form.name || undefined,
          email: form.email || undefined,
          password: form.password || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        toast.success(res.data.messages.join(" "), {
          duration: 2000,
        });

        const emailChanged = user.email !== res.data.updated_user.email;
        const passwordChanged = form.password.trim() !== "";

        if (emailChanged || passwordChanged) {
          // Delay slightly to show success toast first, then redirect, then show logout message
          setTimeout(() => {
            localStorage.removeItem("user_token");
            navigate("/");

            // Slight delay after redirect to ensure toast renders on homepage
            setTimeout(() => {
              toast("You have been logged out due to profile change.", {
                icon: "⚠️",
                duration: 3000,
              });
            }, 300); // show logout toast shortly after redirect
          }, 2000); // after success toast
        } else {
          setUser(res.data.updated_user);
          setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
          setIsEditing(false);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        confirmPassword: "",
      });
      setErrors({});
      setIsEditing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300 font-[Inter]">
      <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />
      <Toaster position="top-center" />

      <div className="max-w-xl mx-auto mt-12 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl relative">
        {/* Profile Icon and Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <FaUserCircle className="text-6xl text-blue-600 dark:text-white" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              My Profile
            </h2>
          </div>
          <FiEdit2
            onClick={() => setIsEditing(true)}
            className="text-xl text-blue-500 hover:text-blue-600 cursor-pointer"
            title="Edit Profile"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 rounded border ${
                isEditing
                  ? ""
                  : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
              } dark:bg-gray-700 dark:text-white`}
              required
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-2 rounded border ${
                isEditing
                  ? ""
                  : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
              } dark:bg-gray-700 dark:text-white`}
              required
            />
            <p className="text-xs mt-1 text-yellow-500">
              {user.is_verified ? "✅ Verified" : "⚠️ Not Verified"}
            </p>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full p-2 rounded border pr-10 ${
                  isEditing
                    ? ""
                    : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
                } dark:bg-gray-700 dark:text-white`}
                placeholder="Leave blank to keep current"
              />
              <span
                onClick={() => isEditing && setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 cursor-pointer text-gray-600 dark:text-gray-300"
              >
                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
              </span>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-semibold text-sm mb-1 text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full p-2 rounded border pr-10 ${
                  isEditing
                    ? ""
                    : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
                } dark:bg-gray-700 dark:text-white`}
                placeholder="Re-enter new password"
              />
              <span
                onClick={() => isEditing && setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-2.5 cursor-pointer text-gray-600 dark:text-gray-300"
              >
                {showConfirm ? <AiFillEyeInvisible /> : <AiFillEye />}
              </span>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Buttons */}
          {isEditing && (
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          )}
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
