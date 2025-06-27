import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../common/Modal';
import AdminHeader from '../common/AdminHeader';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchUsers(token);
  }, []);

  const fetchUsers = async (token) => {
    try {
      const response = await axios.get('https://car-rental-backend-mda4.onrender.com/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    }
  };

  const confirmDelete = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const { id, email } = selectedUser;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`https://car-rental-backend-mda4.onrender.com/admin/users/${id}?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      toast.success(`User ${selectedUser.name} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user.');
    } finally {
      setModalOpen(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <Toaster position="top-center" />

      <div className="p-4 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Manage Users</h2>

        <input
          type="text"
          placeholder="Search by name or email..."
          className="mb-6 p-2 border rounded w-full text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Vertical Card Layout */}
        {filteredUsers.length > 0 ? (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-md p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm text-gray-600">ID: <span className="font-medium">{user.id}</span></p>
                  <p className="text-sm text-gray-600">Name: <span className="font-medium">{user.name}</span></p>
                  <p className="text-sm text-gray-600">Email: <span className="font-medium">{user.email}</span></p>
                </div>
                <button
                  className="bg-red-500 text-white px-4 py-2 text-sm rounded hover:bg-red-600 w-full sm:w-auto"
                  onClick={() => confirmDelete(user)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-red-500 font-medium mt-8">
            No users found.
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}?`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Users;
