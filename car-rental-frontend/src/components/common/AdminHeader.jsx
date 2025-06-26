// src/components/common/AdminHeader.jsx
import React, { useState } from 'react';
import Modal from './Modal'; // ✅ Import Modal component
import { useNavigate } from 'react-router-dom'; // ✅ Import useNavigate for navigation

const AdminHeader = () => {

  const navigate = useNavigate(); // ✅ Initialize useNavigate
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    setLogoutModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login', { replace: true }); // ✅ Smooth navigation without full reload
  };

  return (
    <div className="w-full flex justify-end items-center p-4  text-white relative">
      {/* ✅ Logout button aligned to top-right */}
      <button
        onClick={confirmLogout}
        className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>

      {/* ✅ Modal confirmation */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={handleLogout}
      />
    </div>
  );
};

export default AdminHeader;
