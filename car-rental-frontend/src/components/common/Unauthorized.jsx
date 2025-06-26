import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4"
    >
      {/* 🚗 Custom BoomBoomCars-style logo animation */}
      <motion.div
        className="text-6xl font-black text-blue-600 dark:text-blue-400 mb-4 tracking-widest"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
      >
        BoomBoomCars
      </motion.div>

      <h1 className="text-4xl md:text-5xl font-bold text-red-600 dark:text-red-400 mb-3">
        401 - Unauthorized
      </h1>

      <p className="text-center max-w-xl text-gray-700 dark:text-gray-300 text-lg mb-6">
        Uh-oh! Looks like you tried to take a shortcut without a valid ticket. <br />
        Please login to continue your ride with <span className="font-semibold">BoomBoomCars</span>.
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
      >
        🚀 Go to Login
      </motion.button>
    </motion.div>
  );
};

export default Unauthorized;
