import React, { useState, useRef, useEffect } from 'react';
import api from 'https://stock-manager-xa32.onrender.com/api/axios';

export default function AddStockModal({ onClose, onSuccess }) {
  const [form, setForm]               = useState({ symbol: '', company_name: '', quantity: '', price: '' });
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const searchTimeout                 = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSymbolChange = e => {
    const val = e.target.value.toUpperCase();
    setForm(f => ({ ...f, symbol: val }));
    clearTimeout(searchTimeout.current);
    if (val.length < 1) { setResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/stocks/search?q=${val}`);
        setResults(data);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const selectStock = stock => {
    setForm({
      symbol:       stock.symbol,
      company_name: stock.company_name,
      quantity:     '',
      price:        stock.current_price != null ? String(stock.current_price) : '',
    });
    setResults([]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/portfolio/buy', {
        symbol:       form.symbol.toUpperCase(),
        company_name: form.company_name,
        quantity:     parseFloat(form.quantity),
        price:        parseFloat(form.price),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const total = form.quantity && form.price
    ? (parseFloat(form.quantity) * parseFloat(form.price)).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-white">Buy Stock</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Symbol search */}
          <div className="relative">
            <label className="block text-slate-400 text-xs mb-1 uppercase tracking-wide">Stock Symbol</label>
            <input
              type="text"
              value={form.symbol}
              onChange={handleSymbolChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
              placeholder="e.g. AAPL"
              autoFocus
              required
            />
            {/* Dropdown */}
            {(results.length > 0 || searching) && (
              <div className="absolute top-full mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg z-10 overflow-hidden shadow-xl">
                {searching && (
                  <div className="px-4 py-2 text-slate-400 text-sm">Searching…</div>
                )}
                {results.map(s => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => selectStock(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-600 flex justify-between items-center text-sm"
                  >
                    <span>
                      <span className="text-blue-400 font-semibold">{s.symbol}</span>
                      <span className="text-slate-300 ml-2 text-xs">{s.company_name}</span>
                    </span>
                    {s.current_price != null && (
                      <span className="text-slate-400 text-xs">${Number(s.current_price).toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company name */}
          <div>
            <label className="block text-slate-400 text-xs mb-1 uppercase tracking-wide">Company Name</label>
            <input
              type="text"
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
              placeholder="e.g. Apple Inc."
            />
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1 uppercase tracking-wide">Quantity</label>
              <input
                type="number" step="0.0001" min="0.0001"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                placeholder="10"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1 uppercase tracking-wide">Price / Share ($)</label>
              <input
                type="number" step="0.01" min="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                placeholder="175.50"
                required
              />
            </div>
          </div>

          {/* Total cost preview */}
          {total && (
            <div className="bg-slate-700/60 rounded-lg px-4 py-2.5 flex justify-between text-sm">
              <span className="text-slate-400">Total Cost</span>
              <span className="text-white font-semibold">${total}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold"
            >
              {loading ? 'Buying…' : 'Buy Shares'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
