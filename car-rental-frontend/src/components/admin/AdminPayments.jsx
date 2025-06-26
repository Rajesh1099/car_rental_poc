import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import AdminHeader from "../common/AdminHeader";
import { useNavigate } from "react-router-dom";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchBookingId, setSearchBookingId] = useState("");
  const [filterBookingStatus, setFilterBookingStatus] = useState("All");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data);
    } catch (err) {
      toast.error("❌ Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-600";
      case "CONFIRMED":
        return "bg-green-600";
      case "PENDING":
        return "bg-yellow-500";
      case "CANCELLED":
      case "FAILED":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchEmail = p.user?.email
      ?.toLowerCase()
      .includes(searchEmail.toLowerCase());
    const matchBookingId = p.booking?.id?.toString().includes(searchBookingId);
    const matchBookingStatus =
      filterBookingStatus === "All" ||
      p.booking?.status === filterBookingStatus;
    const matchPaymentStatus =
      filterPaymentStatus === "All" || p.status === filterPaymentStatus;
    return (
      matchEmail && matchBookingId && matchBookingStatus && matchPaymentStatus
    );
  });

  return (
    <div className="admin-payments min-h-screen bg-gray-50">
      <AdminHeader />
      <Toaster />
      <div className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Manage Payments</h2>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Email"
            className="p-2 border rounded w-full sm:w-1/4 text-sm"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by Booking ID"
            className="p-2 border rounded w-full sm:w-1/4 text-sm"
            value={searchBookingId}
            onChange={(e) => setSearchBookingId(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm">Loading payments...</p>
        ) : filteredPayments.length === 0 ? (
          <p className="text-red-500 text-sm">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-black rounded text-sm min-w-[1000px]">
              <thead className="bg-gray-200 text-xs sm:text-sm">
                <tr>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Booking ID
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Amount
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Status
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Gateway ID
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Car
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    License
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Email
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Booking Status
                  </th>
                  <th className="border border-black px-2 py-2 whitespace-nowrap">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-100 text-xs sm:text-sm"
                  >
                    <td className="border border-black px-2 py-1">
                      {payment.booking?.id || "N/A"}
                    </td>
                    <td className="border border-black px-2 py-1">
                      ₹{payment.amount}
                    </td>
                    <td className="border border-black px-2 py-1">
                      <span
                        className={`px-2 py-1 rounded text-white text-[10px] sm:text-xs ${getStatusBadgeColor(
                          payment.status.toUpperCase()
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="border border-black px-2 py-1">
                      {payment.payment_gateway_id}
                    </td>
                    <td className="border border-black px-2 py-1">
                      {payment.car?.brand} {payment.car?.model} (
                      {payment.car?.year})
                    </td>
                    <td className="border border-black px-2 py-1">
                      {payment.car?.license_plate}
                    </td>
                    <td className="border border-black px-2 py-1">
                      {payment.user?.email}
                    </td>

                    {/* ✅ Booking Status Badge */}
                    <td className="border border-black px-2 py-1">
                      <span
                        className={`px-2 py-1 rounded text-white text-[10px] sm:text-xs ${getStatusBadgeColor(
                          payment.booking?.status?.toUpperCase()
                        )}`}
                      >
                        {payment.booking?.status || "N/A"}
                      </span>
                    </td>

                    <td className="border border-black px-2 py-1">
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleString(
                            "en-IN",
                            {
                              timeZone: "Asia/Kolkata",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            }
                          )
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
