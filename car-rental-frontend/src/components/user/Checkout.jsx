import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import Cards from "react-credit-cards-2";
import "react-credit-cards-2/dist/es/styles-compiled.css";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [amount, setAmount] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [timer, setTimer] = useState(300);
  const [tab, setTab] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState(null); // ✅ New

  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    focus: "",
  });

  const [upiId, setUpiId] = useState("");
  const [touched, setTouched] = useState({
    number: false,
    name: false,
    expiry: false,
    cvv: false,
    upi: false,
  });

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (state?.bookingId && state?.amount) {
      const isPaid = localStorage.getItem(`paid_${state.bookingId}`);
      if (isPaid) {
        toast("This booking is already paid.");
        navigate(`/user/bookings/${state.bookingId}`, { replace: true });
      } else {
        setAmount(state.amount);
        setBookingId(state.bookingId);
        fetchBookingDetails(state.bookingId); // ✅ Fetch booking info
      }
    } else {
      toast.error("Missing payment info");
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  // ✅ Fetch booking from backend
  const fetchBookingDetails = async (id) => {
    try {
      const token = localStorage.getItem("user_token");
      const res = await axios.get(`https://car-rental-backend-mda4.onrender.com/user/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooking(res.data);

      if (res.data.status === "CANCELLED") {
        toast.error("Booking is cancelled. Payment not allowed.");
        navigate("/", { replace: true });
      }
    } catch (err) {
      toast.error("Failed to fetch booking");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.error("Session expired");
          navigate("/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (success) {
      const handleBack = () => {
        navigate(`/user/bookings/${bookingId}`, { replace: true });
      };
      window.history.pushState(null, null, window.location.pathname);
      window.addEventListener("popstate", handleBack);
      return () => {
        window.removeEventListener("popstate", handleBack);
      };
    }
  }, [success, navigate, bookingId]);

  const formatCardNumber = (val) =>
    val
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim()
      .slice(0, 19);

  const formatExpiry = (val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    return cleaned.length < 3
      ? cleaned
      : `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  };

  const validateCard = () => {
    const { number, name, expiry, cvv } = cardData;
    const [mm, yy] = expiry.split("/");
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const validExpiry =
      /^\d{2}\/\d{2}$/.test(expiry) &&
      parseInt(mm) >= 1 &&
      parseInt(mm) <= 12 &&
      parseInt("20" + yy) >= currentYear &&
      !(parseInt("20" + yy) === currentYear && parseInt(mm) < currentMonth);

    return (
      number.replace(/\s/g, "").length === 16 &&
      name.length >= 3 &&
      validExpiry &&
      /^\d{3}$/.test(cvv)
    );
  };

  const validateUpi = () => /^[\w.-]+@[\w.-]+$/.test(upiId);

  const handlePayment = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) return toast.error("Please login first");

    setProcessing(true);
    try {
      await axios.post(
        "https://car-rental-backend-mda4.onrender.com/user/payments",
        {
          booking_id: bookingId,
          amount,
          payment_gateway_id: tab === "card" ? "MockCard" : "MockUPI",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Payment successful");

      // Optional: store for local verification
      const { carId, startDate, startTime, endDate, endTime } = state;
      const fullKey = `paid_${carId}_${startDate}_${startTime}_${endDate}_${endTime}`;
      localStorage.setItem(fullKey, "true"); // for duplicate prevention
      localStorage.setItem(`paid_${bookingId}`, "true"); // optional

      setSuccess(true);

      // ✅ Navigate using only bookingId — matches backend route
      setTimeout(() => {
        navigate(`/user/bookings/${bookingId}`, { replace: true });
      }, 3000);
    } catch (err) {
      console.error(err);
      toast.error("Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen relative">
      <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />

      {processing && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="loader" />
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-4 right-4 text-sm bg-gray-200 dark:bg-gray-700 text-red-500 px-3 py-1 rounded font-mono">
            ⏳{" "}
            {`${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(
              timer % 60
            ).padStart(2, "0")}`}
          </div>

          {/* ✅ Show booking status */}
          {booking && (
            <div className="text-center mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
              Booking Status:{" "}
              <span
                className={`px-2 py-1 rounded font-bold
        ${
          booking.status === "CONFIRMED"
            ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
            : booking.status === "PENDING"
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100"
            : "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
        }
      `}
              >
                {booking.status}
              </span>
            </div>
          )}

          <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
            Payment of ₹{amount}
          </h2>

          {/* Tabs */}
          <div className="flex justify-center mb-6 space-x-3">
            <button
              className={`px-4 py-2 rounded ${
                tab === "card"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
              }`}
              onClick={() => !processing && setTab("card")}
            >
              💳 Card
            </button>
            <button
              className={`px-4 py-2 rounded ${
                tab === "upi"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
              }`}
              onClick={() => !processing && setTab("upi")}
            >
              🏦 UPI
            </button>
          </div>

          {/* Form */}
          {tab === "card" ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="w-full">
                <Cards
                  number={cardData.number}
                  name={cardData.name}
                  expiry={cardData.expiry.replace("/", "")}
                  cvc={cardData.cvv}
                  focused={cardData.focus}
                />
              </div>

              <div className="space-y-4">
                {/* Card Number */}
                <input
                  type="text"
                  name="number"
                  placeholder="Card Number"
                  value={cardData.number}
                  onChange={(e) => {
                    setCardData({
                      ...cardData,
                      number: formatCardNumber(e.target.value),
                    });
                    setTouched((prev) => ({ ...prev, number: true }));
                  }}
                  onFocus={(e) =>
                    setCardData({ ...cardData, focus: e.target.name })
                  }
                  className="w-full p-3 rounded border dark:bg-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                />
                {touched.number &&
                  cardData.number.replace(/\s/g, "").length !== 16 && (
                    <p className="text-sm text-red-500">Must be 16 digits</p>
                  )}

                {/* Name */}
                <input
                  type="text"
                  name="name"
                  placeholder="Cardholder Name (UPPERCASE)"
                  value={cardData.name}
                  onChange={(e) => {
                    setCardData({
                      ...cardData,
                      name: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z ]/g, ""),
                    });
                    setTouched((prev) => ({ ...prev, name: true }));
                  }}
                  onFocus={(e) =>
                    setCardData({ ...cardData, focus: e.target.name })
                  }
                  className="w-full p-3 rounded border dark:bg-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                />
                {touched.name && cardData.name.length < 3 && (
                  <p className="text-sm text-red-500">
                    Name must be at least 3 letters
                  </p>
                )}

                {/* Expiry and CVV */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      maxLength={5}
                      onChange={(e) => {
                        setCardData({
                          ...cardData,
                          expiry: formatExpiry(e.target.value),
                        });
                        setTouched((prev) => ({ ...prev, expiry: true }));
                      }}
                      onFocus={(e) =>
                        setCardData({ ...cardData, focus: e.target.name })
                      }
                      className="w-full p-3 rounded border dark:bg-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                    />
                    {touched.expiry &&
                      (() => {
                        const [mm, yy] = cardData.expiry.split("/");
                        const valid = /^\d{2}\/\d{2}$/.test(cardData.expiry);
                        const now = new Date();
                        const expMonth = parseInt(mm);
                        const expYear = parseInt("20" + yy);
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth() + 1;

                        if (!valid)
                          return (
                            <p className="text-sm text-red-500">Format MM/YY</p>
                          );
                        if (expMonth < 1 || expMonth > 12)
                          return (
                            <p className="text-sm text-red-500">
                              Invalid month
                            </p>
                          );
                        if (
                          expYear < currentYear ||
                          (expYear === currentYear && expMonth < currentMonth)
                        )
                          return (
                            <p className="text-sm text-red-500">Card expired</p>
                          );
                      })()}
                  </div>

                  <div className="w-1/2">
                    <input
                      type="password"
                      name="cvc"
                      placeholder="CVV"
                      maxLength={3}
                      value={cardData.cvv}
                      onChange={(e) => {
                        setCardData({
                          ...cardData,
                          cvv: e.target.value.replace(/\D/g, ""),
                        });
                        setTouched((prev) => ({ ...prev, cvv: true }));
                      }}
                      onFocus={(e) =>
                        setCardData({ ...cardData, focus: e.target.name })
                      }
                      className="w-full p-3 rounded border dark:bg-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                    />
                    {touched.cvv && cardData.cvv.length !== 3 && (
                      <p className="text-sm text-red-500">
                        CVV must be 3 digits
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="Enter UPI ID (e.g., user@upi)"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setTouched((prev) => ({ ...prev, upi: true }));
                }}
                className="w-full p-3 rounded border dark:bg-gray-700 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
              />
              {touched.upi && upiId && !validateUpi() && (
                <p className="text-sm text-red-500 mt-1">Invalid UPI format</p>
              )}
            </div>
          )}

          {/* Pay Button */}
          <button
            disabled={
              processing || (tab === "card" ? !validateCard() : !validateUpi())
            }
            onClick={handlePayment}
            className={`mt-6 w-full py-3 rounded text-white transition ${
              processing ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {processing ? "Processing..." : "Pay Now"}
          </button>

          {/* Success Check */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center mt-6"
              >
                <motion.div
                  className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1 }}
                    />
                  </motion.svg>
                </motion.div>
                <motion.p
                  className="mt-3 text-green-600 text-lg font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Payment Successful!
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
