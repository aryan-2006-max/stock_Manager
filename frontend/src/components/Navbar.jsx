import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from 'srv-d6tc556uk2gs738o5ijg/context/AuthContext';

const links = [
  { to: '/',             label: 'Dashboard',    end: true  },
  { to: '/portfolio',    label: 'Portfolio',    end: false },
  { to: '/watchlist',    label: 'Watchlist',    end: false },
  { to: '/transactions', label: 'Transactions', end: false },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <span className="text-white font-bold text-lg flex items-center gap-2">
            📈 <span>StockFolio</span>
          </span>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* User + Logout */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-slate-400 text-sm">👤 {user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-slate-400 hover:text-white p-2"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-3 flex flex-col gap-1 border-t border-slate-700 pt-2">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="text-left px-3 py-2 text-slate-400 hover:text-white text-sm">
              Logout ({user?.username})
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
