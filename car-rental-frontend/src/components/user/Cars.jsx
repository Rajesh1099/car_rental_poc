import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../common/Navbar";
import Footer from "../common/Footer";
import { motion } from "framer-motion";
import { FaGasPump, FaCity } from "react-icons/fa";
import { GiGearStickPattern } from "react-icons/gi";
import { MdCategory, MdSort } from "react-icons/md";
import { BiSolidCar } from "react-icons/bi";
import { BsCarFront } from "react-icons/bs";

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const location = useLocation();
  const navigate = useNavigate();
  const [city, setCity] = useState("");

  const [sort, setSort] = useState("");
  const [filter, setFilter] = useState({
    car_type: [],
    engine_type: [],
    transmission_type: [],
    seater: [],
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    const isAdmin = localStorage.getItem("is_admin") === "true";
    if (!token || isAdmin) {
      toast.error("Please login again");
      localStorage.clear();
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true); // ✅ ensures loading spinner
      try {
        const params = new URLSearchParams(location.search);
        const cityParam = params.get("city");
        const startDateParam = params.get("start_date");
        const startTimeParam = params.get("start_time");
        const endDateParam = params.get("end_date");
        const endTimeParam = params.get("end_time");

        setCity(cityParam);

        const res = await axios.get("https://car-rental-backend-mda4.onrender.com/user/cars", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("user_token")}`,
          },
          params: {
            ...(cityParam && { city: cityParam }),
            ...(startDateParam && { start_date: startDateParam }),
            ...(startTimeParam && { start_time: startTimeParam }),
            ...(endDateParam && { end_date: endDateParam }),
            ...(endTimeParam && { end_time: endTimeParam }),
          },
        });

        setCars(res.data);
        setFilteredCars(res.data);
      } catch (err) {
        toast.error(err.response?.data?.detail || "Failed to load cars", {
          id: "car-fetch-error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [location.search]);

  useEffect(() => {
    let temp = [...cars];
    if (filter.car_type.length)
      temp = temp.filter((c) =>
        filter.car_type.includes(c.car_type.toLowerCase())
      );
    if (filter.engine_type.length)
      temp = temp.filter((c) =>
        filter.engine_type.includes(c.engine_type.toLowerCase())
      );
    if (filter.transmission_type.length)
      temp = temp.filter((c) =>
        filter.transmission_type.includes(c.transmission_type.toLowerCase())
      );
    if (filter.seater.length)
      temp = temp.filter((c) => filter.seater.includes(c.seater));

    if (sort === "lowToHigh")
      temp.sort((a, b) => a.price_per_day - b.price_per_day);
    if (sort === "highToLow")
      temp.sort((a, b) => b.price_per_day - a.price_per_day);
    setFilteredCars(temp);
  }, [filter, sort, cars]);

  const handleCheckbox = (cat, val) => {
    setFilter((prev) => {
      const arr = new Set(prev[cat]);
      arr.has(val) ? arr.delete(val) : arr.add(val);
      return { ...prev, [cat]: [...arr] };
    });
  };

  const resetFilters = () => {
    setSort("");
    setFilter({
      car_type: [],
      engine_type: [],
      transmission_type: [],
      seater: [],
    });
  };

  // Dynamic extra hour charge based on base price
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

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center dark:text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />

      <section className="px-4 md:px-8 py-10 space-y-6">
        <h2
          className={`text-3xl font-bold text-center ${
            filteredCars.length
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-500"
          }`}
        >
          {filteredCars.length
            ? `Available Cars${city ? ` in ${city}` : ""}`
            : `No Cars Found${city ? ` in ${city}` : ""}`}
        </h2>

        {/* Filters inside a bordered box */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 space-y-4"
        >
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <MdSort className="text-xl" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="outline-none px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Sort by Price</option>
                <option value="lowToHigh">Low → High</option>
                <option value="highToLow">High → Low</option>
              </select>
            </div>

            <button
              onClick={resetFilters}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                cat: "car_type",
                icon: MdCategory,
                options: ["sedan", "suv", "hatchback"],
              },
              {
                cat: "engine_type",
                icon: FaGasPump,
                options: ["petrol", "diesel", "electric"],
              },
              {
                cat: "transmission_type",
                icon: GiGearStickPattern,
                options: ["manual", "automatic"],
              },
              {
                cat: "seater",
                icon: BsCarFront,
                options: ["2 Seater", "4/5 Seater", "6/7 Seater"],
              },
            ].map(({ cat, icon: Icon, options }) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="text-lg" />
                  <span className="font-semibold capitalize">
                    {cat.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <label key={opt} className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filter[cat].includes(opt)}
                        className="hidden peer"
                        onChange={() => handleCheckbox(cat, opt)}
                      />
                      <span className="peer-checked:bg-blue-600 peer-checked:text-white bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-3 py-1 rounded-full transition">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Note Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-4 py-3 rounded-md shadow-md border-l-4 border-blue-500"
        >
          <p className="text-sm font-medium">
            🛈 Note: All rentals are for{" "}
            <span className="font-semibold">24 hours</span> with{" "}
            <span className="font-semibold">unlimited kilometers</span> (fuel
            not included).
          </p>
        </motion.div>

        {/* Cars Grid */}
        {filteredCars.length === 0 ? (
          <p className="text-center text-lg text-red-600 dark:text-red-400">
            No Cars found for selected Dates/Filters or check back later.
          </p>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredCars.map((car) => (
              <motion.div
                key={car.id}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:shadow-2xl transition-shadow"
              >
                <img
                  src={
                    car.image_url?.trim() || "https://via.placeholder.com/400"
                  }
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-44 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-bold uppercase">{car.brand}</h3>
                  <p className="text-sm font-semibold uppercase">{car.model}</p>

                  {/* License Plate */}
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    License Plate Number:{" "}
                    <span className=" text-black dark:text-white">
                      {car.license_plate}
                    </span>
                  </p>

                  {/* Specs */}
                  <div className="flex justify-between text-sm mt-2">
                    <div className="flex items-center gap-1">
                      <FaGasPump />
                      <span>{car.engine_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GiGearStickPattern />
                      <span>{car.transmission_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCity />
                      <span>{car.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MdCategory />
                      <span className="capitalize">{car.car_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BsCarFront />
                      <span>{car.seater}</span>
                    </div>
                  </div>

                  {/* Year and Price */}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm">Model Year: {car.year}</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{car.price_per_day}/day
                    </span>
                  </div>

                  {/* Hourly info */}
                  <p className="text-xs text-black-500">
                    ~ ₹{Math.round(car.price_per_day / 24)} per hour
                  </p>
                  <p className="text-xs text-yellow-600">
                    Extra ₹{getExtraCharge(car.price_per_day)}/hr after booking
                    time ends!
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(location.search);
                      const formatDate = (input) => {
                        const [yyyy, mm, dd] = input.split("-");
                        return `${dd}-${mm}-${yyyy}`;
                      };

                      const startDateRaw = params.get("start_date");
                      const endDateRaw = params.get("end_date");
                      const startDate = startDateRaw
                        ? formatDate(startDateRaw)
                        : "";
                      const endDate = endDateRaw ? formatDate(endDateRaw) : "";
                      const startTime = params.get("start_time");
                      const endTime = params.get("end_time");

                      navigate("/book-car", {
                        state: {
                          car,
                          startDate,
                          startTime,
                          endDate,
                          endTime,
                        },
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
