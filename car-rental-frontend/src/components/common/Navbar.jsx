// src/components/common/Navbar.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";

const Navbar = ({ darkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef();

  // Handle dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Fixed Navbar */}
      <div
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow"
            : "bg-white dark:bg-gray-900"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <h1
            className="text-2xl font-bold cursor-pointer text-black dark:text-white"
            onClick={() => navigate("/home")}
          >
            BoomBoomCars
          </h1>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button onClick={toggleTheme}>
              {darkMode ? (
                <MdOutlineLightMode className="text-2xl text-yellow-400 dark:text-white" />
              ) : (
                <MdOutlineDarkMode className="text-2xl text-gray-800 dark:text-white" />
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                <FaUserCircle className="text-3xl text-gray-800 dark:text-white" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 z-50 bg-white text-black dark:bg-gray-800 dark:text-white shadow-lg rounded-md py-2">
                  <a
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Profile
                  </a>
                  <a
                    href="/user/bookings"
                    className="block px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    My Bookings
                  </a>
                  <button
                    onClick={() => setLogoutModal(true)}
                    className="block w-full text-left px-4 py-2 hover:bg-red-100 dark:hover:bg-red-600 text-red-600 dark:text-red-300"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent overlap with fixed navbar */}
      <div className="h-20" />

      {/* Logout Modal */}
      {logoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Confirm Logout
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to log out?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setLogoutModal(false)}
                className="bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
