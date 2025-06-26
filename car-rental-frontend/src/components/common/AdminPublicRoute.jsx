import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminPublicRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token'); // Corrected
  const isAdmin = localStorage.getItem('is_admin') === 'true';

  if (token && isAdmin) return <Navigate to="/admin/dashboard" />;
  return children;
};

export default AdminPublicRoute;
