import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react'; // Optional: Use any icon lib

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Cars', path: '/admin/cars' },
    { name: 'Bookings', path: '/admin/bookings' },
    { name: 'Payments', path: '/admin/payments' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Toggle */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 text-white px-4 py-3">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="focus:outline-none">
          <Menu />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-gray-800 text-white p-4 md:p-6 space-y-4`}
      >
        <h2 className="text-xl font-bold hidden md:block mb-4">BoomBoomCars Admin Panel</h2>
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`block py-2 px-3 rounded hover:bg-gray-700 ${
              location.pathname === link.path ? 'bg-gray-700' : ''
            }`}
            onClick={() => setSidebarOpen(false)} // Close sidebar on mobile
          >
            {link.name}
          </Link>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
