// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays } from "date-fns";
import { isAfter, setHours, setMinutes, addMinutes } from "date-fns";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";

const cityList = [
  "Ongole",
  "Hyderabad",
  "Bangalore",
  "Kakinada",
  "New Delhi",
  "Mumbai",
  "Kolkata",
  "Chennai",
  "Pune",
  "Jaipur",
  "Vijayawada",
  "Visakhapatnam",
];

const generateTimeSlots = () => {   // Generates time slots in 15-minute intervals for a full day
  // Returns an array of time strings in HH:mm format
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 15) {
      times.push(
        `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
      );
    }
  }
  return times;
};

const categories = [
  {
    name: "SUV",
    img: "https://imgd.aeplcdn.com/664x374/n/cw/ec/135681/xm-exterior-left-front-three-quarter.jpeg?isig=0&q=80",
  },
  {
    name: "Sedan",
    img: "https://imgd.aeplcdn.com/664x374/n/cw/ec/51909/a4-exterior-right-front-three-quarter-2.jpeg?q=80",
  },
  {
    name: "Luxury",
    img: "https://media.assettype.com/evoindia/2022-05/bfe5894f-d29b-48cb-9165-a932ffc91c97/P90462877_highRes_rolls_royce_phantom_.jpg",
  },
  {
    name: "Electric",
    img: "https://images.hindustantimes.com/auto/img/2025/02/28/600x338/Tesla_Model_3_1740737744043_1740737744292.jpeg",
  },
  {
    name: "Hatchback",
    img: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Maruti/Swift/9226/1739945896166/front-left-side-47.jpg",
  },
  {
    name: "Convertible",
    img: "https://stimg.cardekho.com/images/carexteriorimages/630x420/BMW/Z4/10183/1685003672330/front-left-side-47.jpg",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    const isAdmin = localStorage.getItem("is_admin") === "true";
    if (!token || isAdmin) {
      toast.error("Please log in again.");
      localStorage.clear();
      navigate("/", { replace: true });
    } else {
      setChecking(false);
    }

    const params = new URLSearchParams(location.search);
    if (params.get("message") === "email_verified") {
      toast.success("Email verified successfully!");
    }

    const stored = JSON.parse(localStorage.getItem("recent_cities") || "[]");
    setRecentSearches(stored);
  }, [navigate, location.search]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = cityList.filter((city) =>
    city.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;

  const formatTimeHM = (date) =>
    date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }); // e.g., "15:30"

  const handleSearch = () => {
    setErrorMsg(""); // reset before checking

    if (!selectedCity || !startDate || !endDate || !startTime || !endTime) {
      return toast.error("Please fill all fields!");
    }

    const startDateTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      startTime.getHours(),
      startTime.getMinutes()
    );

    const endDateTime = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      endTime.getHours(),
      endTime.getMinutes()
    );

    const now = new Date();

    if (startDateTime.getTime() < now.getTime()) {
      return setErrorMsg("Start date and time cannot be in the past!");
    }

    if (endDateTime <= startDateTime) {
      return setErrorMsg(
        "End date and time must be after start date and time!"
      );
    }

    const diffHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return setErrorMsg("Minimum rental duration is 24 hours!");
    }

    const updatedRecent = [
      selectedCity,
      ...recentSearches.filter((c) => c !== selectedCity),
    ].slice(0, 5);
    localStorage.setItem("recent_cities", JSON.stringify(updatedRecent));
    setRecentSearches(updatedRecent);

    navigate(
      `/cars?city=${selectedCity}&start_date=${formatDate(
        startDate
      )}&start_time=${formatTimeHM(startDateTime)}&end_date=${formatDate(
        endDate
      )}&end_time=${formatTimeHM(endDateTime)}`
    );
  };

  const timeOptions = generateTimeSlots();

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center dark:text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />
      <Toaster position="top-center" />
      <section className="px-6 py-16 flex flex-col items-center overflow-x-hidden transition-all duration-500">
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl font-extrabold text-center mb-10 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-transparent bg-clip-text"
        >
          Drive Your Dream with{" "}
          <span className="text-blue-600">BoomBoomCars</span>
        </motion.h2>

        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6 transition-all duration-300"
        >
          {/* City Search */}
          <div className="relative">
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="🔍 Select a city"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
            />
            <AnimatePresence>
              {showDropdown && (
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow max-h-60 overflow-y-auto"
                >
                  {filteredCities.map((city, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setSelectedCity(city);
                        setSearchText(city);
                        setShowDropdown(false);
                        setStartDate(null);
                        setStartTime(null);
                        setEndDate(null);
                        setEndTime(null);
                        setRecentSearches((prev) =>
                          [city, ...prev.filter((c) => c !== city)].slice(0, 5)
                        );
                      }}
                      className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-600 cursor-pointer transition text-sm"
                    >
                      {city}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Recent:</span>{" "}
              {recentSearches.map((city, idx) => (
                <button
                  key={idx}
                  className="text-blue-600 underline mr-2 hover:text-blue-800"
                  onClick={() => {
                    setSearchText(city);
                    setSelectedCity(city);
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          )}

          {/* Step Info */}
          {!selectedCity && (
            <p className="text-red-500 text-sm">
              📍 Please select a city to begin
            </p>
          )}
          {selectedCity && !startDate && (
            <p className="text-yellow-500 text-sm">
              📅 Now pick your start date
            </p>
          )}
          {startDate && !startTime && (
            <p className="text-yellow-500 text-sm">🕒 Choose your start time</p>
          )}
          {startTime && !endDate && (
            <p className="text-yellow-500 text-sm">📅 Choose your end date</p>
          )}
          {endDate && !endTime && (
            <p className="text-yellow-500 text-sm">
              🕒 Finally, choose your end time
            </p>
          )}

          {/* Date & Time Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <ReactDatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                dateFormat="dd-MM-yyyy"
                minDate={new Date()}
                placeholderText="Select Start Date"
                disabled={!selectedCity}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time
              </label>
              <ReactDatePicker
                selected={startTime}
                onChange={(time) => setStartTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeFormat="HH:mm"
                dateFormat="HH:mm"
                placeholderText="Select Start Time"
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                minTime={
                  startDate &&
                  startDate.toDateString() === new Date().toDateString()
                    ? addMinutes(new Date(), 30)
                    : setHours(setMinutes(new Date(startDate), 0), 0) // 00:00 of selected date
                }
                maxTime={setHours(setMinutes(new Date(startDate), 30), 23)} // 23:30 of selected date
                disabled={!startDate}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <ReactDatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                dateFormat="dd-MM-yyyy"
                minDate={startDate ? addDays(startDate, 1) : new Date()}
                placeholderText="Select End Date"
                disabled={!startTime}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                End Time
              </label>
              <ReactDatePicker
                selected={endTime}
                onChange={(time) => setEndTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30} // show every 30 mins
                timeFormat="HH:mm"
                dateFormat="HH:mm"
                placeholderText="Select End Time"
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={!endDate}
                minTime={
                  startDate &&
                  endDate &&
                  startTime &&
                  format(endDate, "yyyy-MM-dd") ===
                    format(addDays(startDate, 1), "yyyy-MM-dd")
                    ? new Date(
                        0,
                        0,
                        0,
                        startTime.getHours(),
                        startTime.getMinutes()
                      )
                    : new Date(0, 0, 0, 0, 0)
                }
                maxTime={new Date(0, 0, 0, 23, 30)}
                filterTime={(time) => {
                  if (!startTime) return true;
                  const minutes = time.getMinutes();
                  return minutes === startTime.getMinutes();
                }}
              />
            </div>
          </div>

          {/* Search Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            onClick={handleSearch}
            disabled={
              !selectedCity || !startDate || !startTime || !endDate || !endTime
            }
            className={`w-full py-3 rounded-xl font-semibold text-lg transition-all shadow-md ${
              selectedCity && startDate && startTime && endDate && endTime
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            🔍 Search Cars
          </motion.button>
          {errorMsg && (
            <p className="mt-3 text-center text-red-600 dark:text-red-400 text-sm font-medium">
              {errorMsg}
            </p>
          )}
        </motion.div>
      </section>

      {/* Categories */}
      <section className="px-6 py-12">
        <h3 className="text-2xl font-semibold mb-6 text-center">
          Popular Categories
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {categories.map(({ name, img }) => (
            <motion.div
              key={name}
              whileHover={{ scale: 1.03 }}
              className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800"
            >
              <img src={img} alt={name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h4 className="text-lg font-semibold text-center">{name}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Testimonials */}
      <section className="bg-blue-50 dark:bg-gray-800 py-8 px-6">
        <h3 className="text-2xl font-semibold mb-4">Testimonials</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded shadow">
            <p>
              🚗 "Smooth experience. The car was clean and well-maintained!"
            </p>
            <h5 className="mt-2 font-bold">- Ram, Hyderabad</h5>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded shadow">
            <p>🛣️ "Loved the app. Found a car in 2 mins. BoomBoom indeed!"</p>
            <h5 className="mt-2 font-bold">- Ravi, Mumbai</h5>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded shadow">
            <p>🌟 "Affordable and reliable. Best self-drive rental!"</p>
            <h5 className="mt-2 font-bold">- Arjun, Bangalore</h5>
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section className="px-6 py-12 bg-gray-100 dark:bg-gray-900">
        <h3 className="text-2xl font-semibold text-center mb-6">
          Frequently Asked Questions
        </h3>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: "How do I book a car?",
              a: "Select your city, choose a car, pick your dates, and complete payment.",
            },
            {
              q: "Can I cancel my booking?",
              a: "Yes, cancellations are allowed via ‘My Bookings’ with refund policies.",
            },
            {
              q: "Are there any hidden charges?",
              a: "No—pricing is transparent; you'll see all costs upfront.",
            },
            {
              q: "What documents are required?",
              a: "A valid driver's license and ID proof are needed for self-drive.",
            },
            {
              q: "Is insurance included?",
              a: "Standard insurance is included. You may opt for additional coverage.",
            },
          ].map((item, idx) => (
            <details
              key={idx}
              className="bg-white dark:bg-gray-800 p-4 rounded shadow"
            >
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      {/* About Us */}
      <section className="px-6 py-12 bg-blue-100 dark:bg-blue-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">About Us</h3>
          <p className="text-md md:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
            BoomBoomCars is your go-to platform for car rentals across top
            Indian cities. Whether you're planning a weekend getaway, business
            trip, or just need a ride, we provide a seamless, reliable, and
            affordable booking experience. Choose from a wide range of vehicles
            and enjoy the road like never before!
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
