import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import AdminHeader from "../common/AdminHeader";
import { useNavigate } from "react-router-dom";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("https://car-rental-backend-mda4.onrender.com/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
    } catch (err) {
      toast.error("❌ Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowModal(true);
  };

  const confirmCancellation = async () => {
    try {
      await axios.put(
        `https://car-rental-backend-mda4.onrender.com/admin/bookings/${selectedBookingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("✅ Booking cancelled successfully");
      fetchBookings();
    } catch (err) {
      toast.error("❌ Error cancelling booking");
    } finally {
      setShowModal(false);
      setSelectedBookingId(null);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      b.car?.brand?.toLowerCase().includes(search.toLowerCase()) ||
      b.car?.model?.toLowerCase().includes(search.toLowerCase()) ||
      b.car?.license_plate?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <Toaster />
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Manage Bookings</h2>
        </div>

        <input
          type="text"
          placeholder="Search by user, email, brand, model, or reg no..."
          className="mb-4 p-2 border rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p>Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="text-red-500">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
  <table className="w-full border border-black rounded text-sm min-w-[1000px] sm:min-w-full">
    <thead className="bg-gray-200 text-xs sm:text-sm">
      <tr>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Booking ID</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">User</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Car</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Start</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">End</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Status</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Amount</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Payment ID</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Payment Status</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Payment Date</th>
        <th className="border border-black px-1 sm:px-2 py-1 sm:py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredBookings.map((b) => {
        const car = b.car || {};
        const user = b.user || {};
        const payment = b.payments?.[0] || {};

        return (
          <tr key={b.id} className="hover:bg-gray-50 text-xs sm:text-sm">
            <td className="border border-black px-1 sm:px-2 py-1">{b.id}</td>
            <td className="border border-black px-1 sm:px-2 py-1">
              {user.name}
              <br />
              <span className="text-[10px] text-black-500">{user.email}</span>
            </td>
            <td className="border border-black px-1 sm:px-2 py-1">
              {car.brand} {car.model}
              <br />
              <span className="text-[10px] text-black-500">{car.license_plate}</span>
            </td>
            <td className="border border-black px-1 sm:px-2 py-1">
              {new Date(`${b.start_date}T${b.start_time}`).toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </td>
            <td className="border border-black px-1 sm:px-2 py-1">
              {new Date(`${b.end_date}T${b.end_time}`).toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </td>
            <td className="border border-black px-1 sm:px-2 py-1">
              <span
                className={`px-2 py-1 rounded text-white text-[10px] sm:text-xs ${
                  b.status === "Cancelled"
                    ? "bg-red-500"
                    : b.status === "Confirmed"
                    ? "bg-green-600"
                    : "bg-yellow-500"
                }`}
              >
                {b.status}
              </span>
            </td>
            <td className="border border-black px-1 sm:px-2 py-1">₹{payment.amount ?? "N/A"}</td>
            <td className="border border-black px-1 sm:px-2 py-1">{payment.payment_gateway_id ?? "N/A"}</td>
            <td className="border border-black px-1 sm:px-2 py-1">{payment.status ?? "N/A"}</td>
            <td className="border border-black px-1 sm:px-2 py-1">
              {payment.payment_date
                ? new Date(payment.payment_date).toLocaleString("en-IN")
                : "N/A"}
            </td>
            <td className="border border-black px-1 sm:px-2 py-1">
              {b.status !== "Cancelled" ? (
                <button
                  onClick={() => handleCancelClick(b.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                >
                  Cancel
                </button>
              ) : (
                <span className="text-gray-500 text-xs">N/A</span>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

        )}

        {/* Cancel Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-2">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-red-600">Cancel Booking?</h2>
              <p className="mb-4 text-sm">Are you sure you want to cancel this booking?</p>
              <div className="flex justify-end space-x-2 sm:space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={confirmCancellation}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
