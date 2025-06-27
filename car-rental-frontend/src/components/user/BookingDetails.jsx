import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";

export default function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [booking, setBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("user_token");
        if (!token) {
          toast.error("Please login to view booking");
          navigate("/");
          return;
        }

        const res = await axios.get(
          `https://car-rental-backend-mda4.onrender.com/user/bookings/${bookingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const bookingData = res.data;

        if (
          bookingData.status.toUpperCase() !== "CONFIRMED" &&
          bookingData.status.toUpperCase() !== "CANCELLED"
        ) {
          toast.error("Booking is not confirmed or cancelled");
          navigate("/user/bookings");
          return;
        }

        setBooking(bookingData);
      } catch (err) {
        console.error("Booking fetch error:", err);
        toast.error("Booking not found or unauthorized");
        navigate("/user/bookings");
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId, navigate]);

  const getDuration = () => {
    if (!booking) return "";

    const start = new Date(`${booking.start_date}T${booking.start_time}`);
    const end = new Date(`${booking.end_date}T${booking.end_time}`);
    const diffInMs = end - start;
    const diffInHours = diffInMs / (1000 * 60 * 60); // Total hours

    const days = Math.floor(diffInHours / 24);
    const hours = Math.round(diffInHours % 24);

    const dayStr = `${days} day${days !== 1 ? "s" : ""}`;
    const hourStr = `${hours} hr${hours !== 1 ? "s" : ""}`;

    return `${Math.round(diffInHours)} hrs (${dayStr} ${hourStr})`;
  };

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      const token = localStorage.getItem("user_token");
      const res = await axios.put(
        `https://car-rental-backend-mda4.onrender.com/user/bookings/${bookingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBooking(res.data); // Update booking state with cancelled data
      setShowCancelModal(false);
      toast.success("Booking cancelled successfully");
    } catch (err) {
      console.error("Cancel error", err);
      toast.error(err?.response?.data?.detail || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300">
        <Navbar
          darkMode={darkMode}
          toggleTheme={() => setDarkMode(!darkMode)}
        />
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">
            Loading booking details...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const isConfirmed = booking.status?.toUpperCase() === "CONFIRMED";
  const isCancelled = booking.status?.toUpperCase() === "CANCELLED";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300 font-[Inter]">
      <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* ✅ Booking Status + Cancel Button */}
        <div className="relative mt-4 mb-6">
          {/* Cancel Button - Top Right */}
          {isConfirmed && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="absolute top-0 right-0 bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700 transition"
            >
              ❌ Cancel Booking
            </button>
          )}

          {/* Centered Booking Status */}
          <div className="flex flex-col items-center gap-3 text-center">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl ${
                    isConfirmed ? "bg-green-100" : "bg-red-100"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-12 w-12 ${
                      isConfirmed ? "text-green-600" : "text-red-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {isConfirmed ? (
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                      />
                    ) : (
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                      />
                    )}
                  </motion.svg>
                </motion.div>
                <motion.p
                  className={`mt-4 text-xl font-bold ${
                    isConfirmed ? "text-green-600" : "text-red-600"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {isConfirmed ? "Booking Confirmed!" : "Booking Cancelled"}
                </motion.p>
                <p className="font-bold text-black dark:text-white mt-1">
                  Booking ID: #{booking.id}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ✅ Car Details */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-300 mb-4 flex items-center gap-2">
            Car Details
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="w-full">
              <img
                src={booking.car?.image_url || "/no-image.jpg"}
                alt="Car"
                className="w-full h-auto max-h-[400px] object-contain rounded-xl shadow-md border border-gray-300 dark:border-gray-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-200">
              <div>
                <span className="font-semibold">🚘 Brand:</span>
                <p>{booking.car?.brand.toUpperCase()}</p>
              </div>
              <div>
                <span className="font-semibold">📄 Model:</span>
                <p>{booking.car?.model.toUpperCase()}</p>
              </div>
              <div>
                <span className="font-semibold">📅 Year:</span>
                <p>{booking.car?.year}</p>
              </div>
              <div>
                <span className="font-semibold">🔖 License Plate:</span>
                <p>{booking.car?.license_plate.toUpperCase()}</p>
              </div>
              <div>
                <span className="font-semibold">🚦 Type:</span>
                <p>{booking.car?.car_type}</p>
              </div>
              <div>
                <span className="font-semibold">👥 Seater Type:</span>
                <p>{booking.car?.seater}</p>
              </div>
              <div>
                <span className="font-semibold">📍 City:</span>
                <p>{booking.car?.city}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ✅ Booking Info */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-3">
            📅 Booking Info
          </h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>
              <strong>Start:</strong>{" "}
              {formatDateTime(booking.start_date, booking.start_time)}
            </li>
            <li>
              <strong>End:</strong>{" "}
              {formatDateTime(booking.end_date, booking.end_time)}
            </li>
            <li>
              <strong>Duration:</strong> {getDuration()}
            </li>
            <li>
              <strong>Status:</strong>{" "}
              <span
                className={`font-bold ${
                  isConfirmed ? "text-green-600" : "text-red-600"
                }`}
              >
                {booking.status}
              </span>
            </li>
          </ul>
        </section>

        {/* ✅ Payment Info */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-green-500 dark:text-green-300 mb-3">
            💳 Payment Details
          </h3>
          {(booking.payments || []).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No payment records found.
            </p>
          ) : (
            booking.payments.map((p, idx) => (
              <div
                key={idx}
                className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-4"
              >
                <p>
                  <strong>Amount:</strong> ₹{p.amount}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      p.status.toUpperCase() === "SUCCESS"
                        ? "text-green-600"
                        : p.status.toUpperCase() === "CANCELLED"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </p>

                <p>
                  <strong>Gateway:</strong> {p.payment_gateway_id}
                </p>
                <p>
                  <strong>Payment Date/Time :</strong>{" "}
                  {new Date(p.payment_date).toLocaleString("en-GB", {
                    timeZone: "Asia/Kolkata",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
              </div>
            ))
          )}
        </section>
      </div>
      <Footer />
      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Cancel Booking?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-lg border dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                No, Go Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
