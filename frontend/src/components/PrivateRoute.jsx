import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'https://stock-manager-xa32.onrender.com/context/AuthContext';

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
);

export default function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Spinner />;
  return token ? children : <Navigate to="/login" replace />;
}
