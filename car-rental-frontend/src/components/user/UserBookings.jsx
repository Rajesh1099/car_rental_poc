import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";

export default function UserBookings() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("user_token");
        const res = await axios.get(
          "http://localhost:8000/user/booking_history",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBookings(res.data);
      } catch (err) {
        console.error("Error fetching bookings", err);
        toast.error("Failed to fetch bookings");
      }
    };
    fetchBookings();
  }, []);

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getDuration = (startDate, startTime, endDate, endTime) => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffInMs = end - start;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const days = Math.floor(diffInHours / 24);
    const hours = Math.round(diffInHours % 24);
    return `${diffInHours} hrs (${days}d ${hours}h)`;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white transition-all duration-300">
      <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6 text-center">📄 My Bookings</h2>

        {bookings.length === 0 ? (
          <p className="text-center text-red-600 dark:text-red-400">
            No bookings found.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col justify-between"
              >
                {/* Car Image + Info */}
                <img
                  src={booking.car?.image_url || "/no-image.jpg"}
                  alt="Car"
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
                <div>
                  <p className="font-semibold text-lg">
                    {booking.car?.brand.toUpperCase()} {booking.car?.model.toUpperCase()}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    License Plate: {booking.car?.license_plate}
                  </p>
                </div>

                {/* Booking Info */}
                <div className="mt-4 text-sm">
                  <p>
                    <strong>From:</strong>{" "}
                    {formatDateTime(booking.start_date, booking.start_time)}
                  </p>
                  <p>
                    <strong>To:</strong>{" "}
                    {formatDateTime(booking.end_date, booking.end_time)}
                  </p>
                  <p>
                    <strong>Total Duration:</strong>{" "}
                    {getDuration(
                      booking.start_date,
                      booking.start_time,
                      booking.end_date,
                      booking.end_time
                    )}
                  </p>
                </div>
                {/* city */}
                <div className="mt-2">
                  <p className="text-sm text-black-600 dark:text-white-400">
                    <strong>City:</strong> {booking.car?.city}
                  </p>
                </div>

                {/* Status */}
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      booking.status.toUpperCase() === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : booking.status.toUpperCase() === "CANCELLED"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* View Button */}
                <button
                  onClick={() => navigate(`/user/bookings/${booking.id}`)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
