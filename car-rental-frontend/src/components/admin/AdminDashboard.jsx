import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast'; // ✅ Toast
import AdminHeader from '../common/AdminHeader';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
      toast.error('You must log in as admin'); // ✅ Replace alert
      navigate('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} /> {/* ✅ Toast container */}

      {/* ✅ Admin Header */}
      <AdminHeader />

      {/* ✅ Responsive Content */}
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <div className="bg-white shadow-md rounded-xl p-6 sm:p-8 w-full max-w-md sm:max-w-lg text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome, Admin!</h1>
          <p className="text-gray-600">
            Use the dashboard to manage <strong>cars, bookings, users, and payments</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
