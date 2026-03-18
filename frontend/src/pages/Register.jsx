import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Register() {
  const [form,    setForm]    = useState({ username: '', email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        username: form.username,
        email:    form.email,
        password: form.password,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📈</div>
          <h1 className="text-3xl font-bold text-white">StockFolio</h1>
          <p className="text-slate-400 mt-1 text-sm">Smart Portfolio Management</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'username', label: 'Username',         type: 'text',     ph: 'johndoe',         ac: 'username' },
              { key: 'email',    label: 'Email',            type: 'email',    ph: 'you@example.com', ac: 'email' },
              { key: 'password', label: 'Password',         type: 'password', ph: '••••••••',         ac: 'new-password' },
              { key: 'confirm',  label: 'Confirm Password', type: 'password', ph: '••••••••',         ac: 'new-password' },
            ].map(({ key, label, type, ph, ac }) => (
              <div key={key}>
                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={ph}
                  autoComplete={ac}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg mt-2 transition"
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-slate-400 text-center mt-5 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
