import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children, admin }) => {
  const token = localStorage.getItem(admin ? 'admin_token' : 'user_token');
  if (token) {
    return <Navigate to={admin ? "/admin/dashboard" : "/dashboard"} />;
  }
  return children;
};

export default PublicRoute;
