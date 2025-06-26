import React from 'react';
import { Navigate } from 'react-router-dom';

const UserPublicRoute = ({ children }) => {
  const token = localStorage.getItem('user_token');
  const isAdmin = localStorage.getItem('is_admin') === 'true';

  if (token) {
    return isAdmin
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/home" replace />;
  }

  return children;
};

export default UserPublicRoute;
