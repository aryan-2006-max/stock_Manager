import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute   from './components/PrivateRoute';
import Navbar         from './components/Navbar';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import Portfolio      from './pages/Portfolio';
import Watchlist      from './pages/Watchlist';
import Transactions   from './pages/Transactions';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={
            <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
          } />
          <Route path="/portfolio" element={
            <PrivateRoute><Layout><Portfolio /></Layout></PrivateRoute>
          } />
          <Route path="/watchlist" element={
            <PrivateRoute><Layout><Watchlist /></Layout></PrivateRoute>
          } />
          <Route path="/transactions" element={
            <PrivateRoute><Layout><Transactions /></Layout></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
