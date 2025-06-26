import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post('http://127.0.0.1:8000/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, is_admin, is_verified } = response.data;

      // Check if user is actually an admin
      if (!is_admin) {
        setMessage('Access denied: Not an admin.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Optionally check if admin is verified too
      if (!is_verified) {
        setMessage('Admin email not verified.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      localStorage.setItem('admin_token', access_token);
      localStorage.setItem('is_admin', true);

      setMessage('Login successful!');
      setMessageType('success');

      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 800);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.detail || 'Invalid email or password');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Centered Login Form */}
      <form
        onSubmit={handleLogin}
        className="bg-white w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl p-6 sm:p-8 rounded-xl shadow-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Admin Login
        </h2>

        {message && (
          <div
            className={`mb-4 text-center p-2 rounded font-medium ${
              messageType === 'success'
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-400"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-gray-700">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-400"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
