import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4"
    >
      {/* 🚗 Stylized BoomBoomCars logo */}
      <motion.div
        className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 mb-3"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        BoomBoomCars
      </motion.div>

      <h1 className="text-7xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">
        404
      </h1>

      <h2 className="text-2xl text-gray-700 dark:text-gray-300 mb-4">
        You took a wrong turn on the highway.
      </h2>

      <p className="text-center text-gray-600 dark:text-gray-400 max-w-md mb-6">
        The road you’re trying to take doesn’t exist or might’ve been moved.
        Let’s get you back on track.
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
      >
        🏠 Return to Home
      </motion.button>
    </motion.div>
  );
};

export default NotFound;
