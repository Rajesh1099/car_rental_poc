import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";

const parseDateTime = (dateStr, timeStr) => {
  const [dd, mm, yyyy] = dateStr.split("-");
  const [hh, min] = timeStr.split(":");
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
};

const getExtraCharge = (pricePerDay) =>
  pricePerDay > 30000
    ? 2500
    : pricePerDay > 25000
    ? 2100
    : pricePerDay > 20000
    ? 1800
    : pricePerDay > 15000
    ? 1000
    : pricePerDay > 10000
    ? 800
    : pricePerDay > 5000
    ? 400
    : pricePerDay > 3000
    ? 200
    : pricePerDay > 2000
    ? 180
    : pricePerDay > 1500
    ? 150
    : 100;

const CarBooking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const car = state?.car;
  const startDateStr = state?.startDate;
  const startTimeStr = state?.startTime;
  const endDateStr = state?.endDate;
  const endTimeStr = state?.endTime;

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [durationHours, setDurationHours] = useState(0);
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [showModal, setShowModal] = useState(false);

  const [pricing, setPricing] = useState({
    base: 0,
    gst: 0,
    insurance: 200,
    extraCharge: 0,
    delivery: 0,
    discount: 0,
    total: 0,
  });

  const [bookingExists, setBookingExists] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (startDateStr && startTimeStr && endDateStr && endTimeStr) {
      const s = parseDateTime(startDateStr, startTimeStr);
      const e = parseDateTime(endDateStr, endTimeStr);
      if (e > s) {
        setStart(s);
        setEnd(e);
      } else {
        toast.error("End time must be after start time");
      }
    }
  }, [startDateStr, startTimeStr, endDateStr, endTimeStr]);

  // ✅ FIXED useEffect for checking existing booking/payment
  useEffect(() => {
    if (start && end && car) {
      const formatDateToISO = (dateStr) => {
        const [dd, mm, yyyy] = dateStr.split("-");
        return `${yyyy}-${mm}-${dd}`;
      };

      const startISO = formatDateToISO(startDateStr);
      const endISO = formatDateToISO(endDateStr);

      const key = `paid_${car.id}_${startISO}_${startTimeStr}_${endISO}_${endTimeStr}`;
      const paid = localStorage.getItem(key);
      const pending = localStorage.getItem(`pending_${key}`);
      const pendingTime = localStorage.getItem(`pending_time_${key}`);

      if (paid === "true") {
        toast.success("Payment already completed.");
        navigate(`/user/bookings`, { replace: true });
      } else if (pending === "true") {
        const now = Date.now();
        const elapsed = now - Number(pendingTime);

        if (elapsed < 5 * 60 * 1000) {
          // still within 5 minutes
          setBookingExists(true);

          // Optional: refresh UI after 5 mins
          const remainingTime = 5 * 60 * 1000 - elapsed;
          const timeout = setTimeout(() => {
            setBookingExists(false);
            localStorage.removeItem(`pending_${key}`);
            localStorage.removeItem(`pending_time_${key}`);
          }, remainingTime);

          return () => clearTimeout(timeout);
        } else {
          // expired
          localStorage.removeItem(`pending_${key}`);
          localStorage.removeItem(`pending_time_${key}`);
          setBookingExists(false);
        }
      } else {
        setBookingExists(false);
      }
    }
  }, [start, end, car]);

  useEffect(() => {
    if (start && end && car) {
      const ms = end - start;
      const hours = ms / (1000 * 60 * 60);
      const roundedHours = Math.ceil(hours);
      setDurationHours(roundedHours);

      const days = Math.floor(hours / 24);
      const extraHrs = Math.ceil(hours % 24);
      const extraPerHour = getExtraCharge(car.price_per_day);

      let base = car.price_per_day * days;
      const extra = extraHrs > 0 ? extraHrs * extraPerHour : 0;
      base += extra;

      const gst = 0.18 * base;
      const insurance = 800;
      const delivery = homeDelivery ? 500 : 0;

      let discount = 0;
      if (coupon === "CARS10") discount = 0.1 * base;
      else if (coupon === "RAJESH") discount = 0.25 * base;

      const total = Math.round(base + gst + insurance + delivery - discount);

      setPricing({
        base: Math.round(base),
        gst: Math.round(gst),
        insurance,
        delivery,
        extraCharge: extra,
        discount: Math.round(discount),
        total,
      });
    }
  }, [start, end, car, homeDelivery, coupon]);

  const handleBooking = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      toast.error("User not logged in!");
      return navigate("/");
    }

    if (bookingExists) {
      toast.error("Booking already exists. Please make payment.");
      return;
    }

    const formatDateToISO = (dateStr) => {
      const [dd, mm, yyyy] = dateStr.split("-");
      return `${yyyy}-${mm}-${dd}`;
    };

    const payload = {
      car_id: car.id,
      start_date: formatDateToISO(startDateStr),
      start_time: startTimeStr,
      end_date: formatDateToISO(endDateStr),
      end_time: endTimeStr,
      duration_hours: durationHours,
      home_delivery: homeDelivery,
      coupon_code: coupon,
      base_price: pricing.base,
      gst: pricing.gst,
      insurance: pricing.insurance,
      delivery_charge: pricing.delivery,
      discount: pricing.discount,
      total_price: pricing.total,
    };

    try {
      const res = await axios.post(
        "https://car-rental-backend-mda4.onrender.com/user/bookings",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const startISO = formatDateToISO(startDateStr);
      const endISO = formatDateToISO(endDateStr);

      const key = `paid_${car.id}_${startISO}_${startTimeStr}_${endISO}_${endTimeStr}`;
      localStorage.setItem(`pending_${key}`, "true");
      localStorage.setItem(`pending_time_${key}`, Date.now().toString());

      setShowModal(false);
      toast.success("Booking Created. Proceed to Payment");

      const bookingId = res.data.id;

      navigate("/user/payment-page", {
        state: {
          bookingId,
          amount: pricing.total,
          carId: car.id,
          startDate: formatDateToISO(startDateStr),
          startTime: startTimeStr,
          endDate: formatDateToISO(endDateStr),
          endTime: endTimeStr,
        },
      });
    } catch (error) {
      toast.error("Booking failed!");
    }
  };

  if (!car || !start || !end) {
    return (
      <div className="text-center mt-20 text-lg">
        Car or booking details missing
      </div>
    );
  }

  const days = Math.floor(durationHours / 24);
  const hours = durationHours % 24;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen">
      <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />
      <motion.div
        className="max-w-6xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Car Info */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <img
            src={car.image_url}
            alt={car.model}
            className="w-full rounded-lg mb-4"
          />
          <h2 className="text-2xl font-bold">
            {car.brand.toUpperCase()} {car.model.toUpperCase()} ({car.year})
          </h2>
          <p className="mt-2">
            🚗 {car.car_type} | ⚙️ {car.transmission_type}
          </p>
          <p>
            💺 {car.seater} | ⛽ {car.engine_type}
          </p>
          <p>🔖 License Plate: {car.license_plate}</p>
          <p className="text-blue-600 font-semibold mt-2 text-lg">
            ₹{car.price_per_day}/day
          </p>
          <p className="text-sm text-black-500">📍 {car.city}</p>
        </motion.div>

        {/* Booking Summary */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h3 className="text-xl font-semibold">Booking Summary</h3>

          <div className="text-sm space-y-1">
            <p>
              🗓 <b>Start Date:</b> {startDateStr}
            </p>
            <p>
              ⏰ <b>Start Time:</b> {startTimeStr}
            </p>
            <p>
              🗓 <b>End Date:</b> {endDateStr}
            </p>
            <p>
              ⏰ <b>End Time:</b> {endTimeStr}
            </p>
            <p>
              ⌛ <b>Total Duration:</b> {durationHours} hours ({days} day
              {days !== 1 ? "s" : ""}
              {hours > 0 ? ` ${hours} hr` : ""})
            </p>

            {pricing.extraCharge > 0 && (
              <p>
                ➕ <b>Extra Hours:</b> {hours} hour(s) × ₹
                {pricing.extraCharge / hours} = ₹{pricing.extraCharge}
              </p>
            )}
          </div>

          <hr />

          <p>
            🧾 <b>Base Price:</b> ₹{pricing.base} <br />
            <span className="text-sm text-gray-500 dark:text-gray-300">
              (Base Price Breakdown: {days} day{days !== 1 ? "s" : ""} × ₹
              {car.price_per_day}
              {hours > 0
                ? ` + ${hours} hour${hours !== 1 ? "s" : ""} × ₹${(
                    pricing.extraCharge / hours
                  ).toFixed(0)} = ₹${pricing.base}`
                : ` = ₹${pricing.base}`}
              )
            </span>
          </p>

          <p>
            💰 <b>GST (18% of Base Price):</b> ₹{pricing.gst}
          </p>
          <p>
            🛡 <b>Insurance:</b> ₹{pricing.insurance}
          </p>

          {homeDelivery && (
            <p>
              🚚 <b>Home Delivery:</b> ₹{pricing.delivery}
            </p>
          )}

          {pricing.discount > 0 && (
            <p>
              🏷 <b>Coupon Discount:</b> -₹{pricing.discount}
            </p>
          )}

          <label className="block mt-2">
            <input
              type="checkbox"
              checked={homeDelivery}
              onChange={() => setHomeDelivery(!homeDelivery)}
              className="mr-2"
            />
            Home Delivery (₹500)
          </label>

          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="Enter coupon (CARS10)"
            className="w-full mt-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded"
          />

          <hr />
          <p className="text-xl font-bold">Total: ₹{pricing.total}</p>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Confirm Booking
          </button>
        </motion.div>
      </motion.div>

      <Footer />

      {/* Confirm Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-11/12 max-w-md shadow-2xl text-center border dark:border-gray-700"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <motion.h2
                className="text-xl font-extrabold mb-2 text-gray-800 dark:text-white"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Confirm Your Booking
              </motion.h2>

              <motion.p
                className="mb-4 text-gray-600 dark:text-gray-300"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                You're about to pay{" "}
                <b className="text-blue-600 dark:text-blue-400">
                  ₹{pricing.total}
                </b>
              </motion.p>

              <motion.div
                className="flex flex-col md:flex-row gap-3 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full md:w-1/2 py-2 rounded-lg border border-gray-300 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>

                {paymentDone ? (
                  <button
                    disabled
                    className="w-full md:w-1/2 py-2 rounded-lg bg-green-500 text-white font-semibold shadow-md cursor-not-allowed"
                  >
                    Payment already completed
                  </button>
                ) : bookingExists ? (
                  <button
                    disabled
                    className="w-full md:w-1/2 py-2 rounded-lg bg-yellow-500 text-white font-semibold shadow-md cursor-not-allowed"
                  >
                    Cannot Pay Now. Please come back after 5 mins to complete
                    the payment.
                  </button>
                ) : (
                  <button
                    onClick={handleBooking}
                    className="w-full md:w-1/2 py-2 rounded-lg bg-green-600 hover:bg-blue-700 text-white font-semibold shadow-md transition"
                  >
                    Proceed to Checkout
                  </button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarBooking;
