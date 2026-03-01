import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from './Spinner';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Spinner fullPage />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (role && user.role !== role) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = `/${user.role}`;
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

export default PrivateRoute;