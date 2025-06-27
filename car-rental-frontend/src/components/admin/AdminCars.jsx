import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "../common/Modal";
import AdminHeader from "../common/AdminHeader";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const AdminCars = () => {
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const navigate = useNavigate();

  const [carForm, setCarForm] = useState({
    brand: "",
    model: "",
    engine_type: "",
    transmission_type: "",
    car_type: "",
    seater: "",
    year: "",
    license_plate: "",
    price_per_day: "",
    city: "",
    image_url: "",
  });

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const res = await axios.get("https://car-rental-backend-mda4.onrender.com/admin/cars", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCars(res.data);
    } catch (err) {
      console.error("Error fetching cars:", err);
    }
  };

  const openCreateModal = () => {
    setCarForm({
      brand: "",
      model: "",
      engine_type: "",
      transmission_type: "",
      car_type: "",
      seater: "",
      year: "",
      license_plate: "",
      price_per_day: "",
      city: "",
      image_url: "",
    });
    setCreateModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://car-rental-backend-mda4.onrender.com/admin/cars/create-car",
        carForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Car added successfully", {
        id: "add-car-success",
      });
      setCars((prev) => [...prev, res.data]);
      setCreateModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error adding car", {
        id: "add-car-error",
      });
    }
  };

  const openEditModal = (car) => {
    setSelectedCar(car);
    setCarForm(car); // Pre-fill form
    setEditModalOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `https://car-rental-backend-mda4.onrender.com/admin/cars/${selectedCar.id}/update`,
        carForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Car edited successfully");
      fetchCars();
      setEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error editing car", {
        id: "edit-car-error",
      });
    }
  };

  const confirmDelete = (car) => {
    setSelectedCar(car);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `https://car-rental-backend-mda4.onrender.com/admin/cars/${selectedCar.id}/delete`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { car_license_plate: selectedCar.license_plate },
        }
      );
      toast.success("Car deleted successfully", {
        id: "delete-car-success",
      });
      setCars((prev) => prev.filter((c) => c.id !== selectedCar.id));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error deleting car", {
        id: "delete-car-error",
      });
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleChange = (e) => {
    setCarForm({ ...carForm, [e.target.name]: e.target.value });
  };

  const filteredCars = cars.filter(
    (car) =>
      car.brand.toLowerCase().includes(search.toLowerCase()) ||
      car.model.toLowerCase().includes(search.toLowerCase()) ||
      car.license_plate.toLowerCase().includes(search.toLowerCase())
      || car.city.toLowerCase().includes(search.toLowerCase())
  );

  const cityOptions = [
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
    "Vishakapatnam",
  ];

  const engineOptions = ["Petrol", "Diesel", "Electric"];
  const transmissionOptions = ["Manual", "Automatic"];
  const seaterOptions = ["2 Seater", "4/5 Seater", "6/7 Seater"];
  const carOptions = [
    "HatchBack",
    "SUV",
    "MUV",
    "Sedan",
    "Convertible",
    "Coupe",
  ];

  return (
    <div>
      <AdminHeader />
      <Toaster />
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold">Manage Cars</h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={openCreateModal}
          >
            + Add Car
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by brand, model, city or license plate..."
          className="mb-4 p-2 border rounded w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full border border-black rounded text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-black p-2 text-left">ID</th>
                <th className="border border-black p-2 text-left">Brand</th>
                <th className="border border-black p-2 text-left">Model</th>
                <th className="border border-black p-2 text-left">Engine</th>
                <th className="border border-black p-2 text-left">
                  Transmission
                </th>
                <th className="border border-black p-2 text-left">Car Type</th>
                <th className="border border-black p-2 text-left">Seater</th>
                <th className="border border-black p-2 text-left">Year</th>
                <th className="border border-black p-2 text-left">
                  License Plate
                </th>
                <th className="border border-black p-2 text-left">City</th>
                <th className="border border-black p-2 text-left">Price/Day</th>
                <th className="border border-black p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center text-red-500 py-4">
                    No cars found.
                  </td>
                </tr>
              ) : (
                filteredCars.map((car) => (
                  <tr key={car.id} className="hover:bg-gray-50">
                    <td className="border border-black p-2">{car.id}</td>
                    <td className="border border-black p-2">{car.brand}</td>
                    <td className="border border-black p-2">{car.model}</td>
                    <td className="border border-black p-2">
                      {car.engine_type}
                    </td>
                    <td className="border border-black p-2">
                      {car.transmission_type}
                    </td>
                    <td className="border border-black p-2">{car.car_type}</td>
                    <td className="border border-black p-2">{car.seater}</td>
                    <td className="border border-black p-2">{car.year}</td>
                    <td className="border border-black p-2">
                      {car.license_plate}
                    </td>
                    <td className="border border-black p-2">{car.city}</td>
                    <td className="border border-black p-2">
                      {car.price_per_day}
                    </td>
                    <td className="border border-black p-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                          onClick={() => openEditModal(car)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          onClick={() => confirmDelete(car)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔧 Reuse: Create + Edit Modal Fields */}
      {(createModalOpen || editModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-lg transition-all duration-300">
            <h2 className="text-xl font-bold mb-4">
              {createModalOpen ? "Add New Car" : "Edit Car"}
            </h2>
            <form
              onSubmit={createModalOpen ? handleCreate : handleEdit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                { name: "brand", label: "Brand" },
                { name: "model", label: "Model" },
                { name: "year", label: "Year", type: "number" },
                { name: "license_plate", label: "License Plate" },
                {
                  name: "price_per_day",
                  label: "Price per Day",
                  type: "number",
                },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block mb-1">{field.label}</label>
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={carForm[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder || ""}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                </div>
              ))}

              {/* 🔽 City dropdown */}
              <div>
                <label className="block mb-1">City</label>
                <select
                  name="city"
                  value={carForm.city}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select city</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔽 Engine Type dropdown */}
              <div>
                <label className="block mb-1">Engine Type</label>
                <select
                  name="engine_type"
                  value={carForm.engine_type}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select engine type</option>
                  {engineOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔽 Transmission dropdown */}
              <div>
                <label className="block mb-1">Transmission</label>
                <select
                  name="transmission_type"
                  value={carForm.transmission_type}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select transmission</option>
                  {transmissionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔽 Car Type dropdown */}
              <div>
                <label className="block mb-1">Car Type</label>
                <select
                  name="car_type"
                  value={carForm.car_type}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select car type</option>
                  {carOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔽 Seater Type dropdown */}
              <div>
                <label className="block mb-1">Seater</label>
                <select
                  name="seater"
                  value={carForm.seater}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Select seater type</option>
                  {seaterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🌄 Image URL */}
              <div>
                <label className="block mb-1">
                  Image URL {createModalOpen && "(required)"}
                </label>
                <input
                  type="text"
                  name="image_url"
                  value={carForm.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/car.jpg"
                  className="w-full border px-3 py-2 rounded"
                  required={createModalOpen}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {createModalOpen ? "Add Car" : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setEditModalOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Car"
        message={`Are you sure you want to delete ${selectedCar?.brand} ${selectedCar?.model}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminCars;
