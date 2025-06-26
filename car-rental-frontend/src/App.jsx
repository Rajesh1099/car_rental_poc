import React from "react";
import { Routes, Route } from "react-router-dom";
//import { ToastContainer } from "react-toastify"; // ✅ Toast support
//import "react-toastify/dist/ReactToastify.css";  // ✅ Toast styles
import { Toaster } from "react-hot-toast";

// Admin Components
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import Users from "./components/admin/Users";
import AdminCars from "./components/admin/AdminCars";
import AdminBookings from "./components/admin/AdminBookings";
import AdminPayments from "./components/admin/AdminPayments";

// User Components
import User from "./components/user/User";
import ForgotPassword from "./components/user/ForgotPassword";
import ResetPassword from "./components/user/ResetPassword";
import GoogleSuccess from "./components/user/GoogleSuccess";
import Home from "./components/user/Home";
import Cars from "./components/user/Cars";
import CarBooking from "./components/user/CarBooking";
import Checkout from "./components/user/CheckOut";
import BookingDetails from "./components/user/BookingDetails";
import UserBookings from "./components/user/UserBookings";
import Profile from "./components/user/Profile";

// Route Protection
import AdminPrivateRoute from "./components/common/AdminPrivateRoute";
import AdminPublicRoute from "./components/common/AdminPublicRoute";
import UserPrivateRoute from "./components/common/UserPrivateRoute";
import UserPublicRoute from "./components/common/UserPublicRoute";

// Common Components
import NotFound from "./components/common/NotFound";
import Unauthorized from "./components/common/Unauthorized";

function App() {
  return (
    <>
      {/* ✅ All Routes */}
      <Routes>
        {/* 🔐 Admin Routes */}
        <Route
          path="/admin/login"
          element={
            <AdminPublicRoute>
              <AdminLogin />
            </AdminPublicRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPrivateRoute>
              <AdminLayout />
            </AdminPrivateRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="cars" element={<AdminCars />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
        </Route>

        {/* 👤 User Public Routes */}
        <Route
          path="/"
          element={
            <UserPublicRoute>
              <User />
            </UserPublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <UserPublicRoute>
              <ForgotPassword />
            </UserPublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <UserPublicRoute>
              <ResetPassword />
            </UserPublicRoute>
          }
        />
        <Route
          path="/google/success"
          element={
            <UserPublicRoute>
              <GoogleSuccess />
            </UserPublicRoute>
          }
        />

        {/* 👤 User Private Routes */}
        <Route
          path="/home"
          element={
            <UserPrivateRoute>
              <Home />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/cars"
          element={
            <UserPrivateRoute>
              <Cars />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/book-car"
          element={
            <UserPrivateRoute>
              <CarBooking />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/user/payment-page"
          element={
            <UserPrivateRoute>
              <Checkout />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/user/bookings/:bookingId"
          element={
            <UserPrivateRoute>
              <BookingDetails />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/user/bookings"
          element={
            <UserPrivateRoute>
              <UserBookings />
            </UserPrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <UserPrivateRoute>
              <Profile />
            </UserPrivateRoute>
          }
        />
        {/* ✅ Common Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
