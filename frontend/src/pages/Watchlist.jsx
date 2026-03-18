import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/axios';

const fmt = n => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Generate a mock sparkline from a base price (10 points)
function mockSparkline(base) {
  let p = base * 0.96;
  return Array.from({ length: 10 }, (_, i) => {
    const d = (Math.random() - 0.48) * p * 0.02;
    p = Math.max(1, p + d);
    if (i === 9) p = base;
    return { v: parseFloat(p.toFixed(2)) };
  });
}

export default function Watchlist() {
  const [watchlist,  setWatchlist]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [addForm,    setAddForm]    = useState({ symbol: '', company_name: '', price: '' });
  const [addResults, setAddResults] = useState([]);
  const [addError,   setAddError]   = useState('');
  const [buyTarget,  setBuyTarget]  = useState(null);
  const [buyForm,    setBuyForm]    = useState({ quantity: '', price: '' });
  const [buyError,   setBuyError]   = useState('');
  const searchTimer = useRef(null);

  const fetchWatchlist = async () => {
    try {
      const { data } = await api.get('/watchlist');
      setWatchlist(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWatchlist(); }, []);

  // Debounced symbol search
  const handleSymbolInput = e => {
    const val = e.target.value.toUpperCase();
    setAddForm(f => ({ ...f, symbol: val }));
    clearTimeout(searchTimer.current);
    if (!val) { setAddResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/stocks/search?q=${val}`);
        setAddResults(data);
      } catch { /* ignore */ }
    }, 300);
  };

  const selectSearchResult = s => {
    setAddForm({ symbol: s.symbol, company_name: s.company_name, price: s.current_price ?? '' });
    setAddResults([]);
  };

  const handleAdd = async e => {
    e.preventDefault();
    setAddError('');
    try {
      await api.post('/watchlist', addForm);
      setAddForm({ symbol: '', company_name: '', price: '' });
      setShowAdd(false);
      fetchWatchlist();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add');
    }
  };

  const handleRemove = async id => {
    try {
      await api.delete(`/watchlist/${id}`);
      setWatchlist(w => w.filter(x => x.id !== id));
    } catch { /* silent */ }
  };

  const openBuy = item => {
    setBuyTarget(item);
    setBuyForm({ quantity: '', price: Number(item.current_price).toFixed(2) });
    setBuyError('');
  };

  const handleBuy = async e => {
    e.preventDefault();
    setBuyError('');
    try {
      await api.post('/portfolio/buy', {
        symbol:       buyTarget.symbol,
        company_name: buyTarget.company_name,
        quantity:     parseFloat(buyForm.quantity),
        price:        parseFloat(buyForm.price),
      });
      setBuyTarget(null);
    } catch (err) {
      setBuyError(err.response?.data?.message || 'Purchase failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <button
          onClick={() => { setShowAdd(s => !s); setAddError(''); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm"
        >
          + Add Stock
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-6">
          <h3 className="text-base font-semibold text-white mb-4">Add to Watchlist</h3>
          {addError && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">
              {addError}
            </div>
          )}
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
            {/* Symbol */}
            <div className="relative flex-1 min-w-44">
              <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">Symbol</label>
              <input
                type="text"
                value={addForm.symbol}
                onChange={handleSymbolInput}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                placeholder="AAPL"
                required
              />
              {addResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg z-10 overflow-hidden shadow-xl">
                  {addResults.map(s => (
                    <button key={s.symbol} type="button" onClick={() => selectSearchResult(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-600 text-sm flex justify-between">
                      <span>
                        <span className="text-blue-400 font-semibold">{s.symbol}</span>
                        <span className="text-slate-300 ml-2 text-xs">{s.company_name}</span>
                      </span>
                      {s.current_price != null && (
                        <span className="text-slate-400 text-xs">{fmt(s.current_price)}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Company */}
            <div className="flex-1 min-w-44">
              <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">Company</label>
              <input
                type="text"
                value={addForm.company_name}
                onChange={e => setAddForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                placeholder="Apple Inc."
              />
            </div>
            {/* Price */}
            <div className="w-36">
              <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">Price ($)</label>
              <input
                type="number" step="0.01"
                value={addForm.price}
                onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                placeholder="175.50"
              />
            </div>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => { setShowAdd(false); setAddResults([]); }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm">
                Cancel
              </button>
              <button type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm">
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {watchlist.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-16 border border-slate-700 text-center">
          <p className="text-4xl mb-4">👁️</p>
          <p className="text-slate-300 font-medium">Your watchlist is empty</p>
          <p className="text-slate-500 text-sm mt-1">Monitor stocks before adding them to your portfolio</p>
        </div>
      ) : (
        /* Stock cards grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {watchlist.map(item => {
            const spark = mockSparkline(Number(item.current_price) || 100);
            const trend = spark[spark.length - 1].v - spark[0].v;
            const trendColor = trend >= 0 ? 'text-emerald-400' : 'text-red-400';
            const lineColor  = trend >= 0 ? '#10b981' : '#ef4444';

            return (
              <div key={item.id}
                   className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition">

                {/* Card header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-blue-400 font-bold text-lg leading-tight">{item.symbol}</p>
                    <p className="text-slate-400 text-sm truncate max-w-[160px]">{item.company_name}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-500 hover:text-red-400 transition text-sm p-1"
                    title="Remove from watchlist"
                  >
                    ✕
                  </button>
                </div>

                {/* Price + Sparkline */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-white text-2xl font-bold">{fmt(item.current_price)}</p>
                    <p className={`text-xs mt-0.5 font-medium ${trendColor}`}>
                      {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}
                    </p>
                  </div>
                  {/* Mini sparkline */}
                  <div className="w-28 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spark}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={lineColor}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            fontSize: '11px',
                            padding: '4px 8px',
                          }}
                          formatter={v => [fmt(v)]}
                          labelFormatter={() => ''}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Last updated */}
                <p className="text-slate-600 text-xs mb-3">
                  Updated: {item.last_updated
                    ? new Date(item.last_updated).toLocaleDateString()
                    : 'N/A'}
                </p>

                {/* Buy button */}
                <button
                  onClick={() => openBuy(item)}
                  className="w-full bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/30 text-blue-400 hover:text-blue-300 font-medium py-2 rounded-lg text-sm transition"
                >
                  + Add to Portfolio
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy from watchlist modal */}
      {buyTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
             onClick={e => e.target === e.currentTarget && setBuyTarget(null)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Buy {buyTarget.symbol}
              </h3>
              <button onClick={() => setBuyTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-slate-400 text-sm mb-4">{buyTarget.company_name}</p>
            {buyError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">
                {buyError}
              </div>
            )}
            <form onSubmit={handleBuy} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">Quantity</label>
                <input
                  type="number" step="0.0001" min="0.0001"
                  value={buyForm.quantity}
                  onChange={e => setBuyForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                  placeholder="10"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">Price / Share ($)</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={buyForm.price}
                  onChange={e => setBuyForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                  required
                />
              </div>
              {buyForm.quantity && buyForm.price && (
                <div className="bg-slate-700/60 rounded-lg px-4 py-2 flex justify-between text-sm">
                  <span className="text-slate-400">Total</span>
                  <span className="text-white font-semibold">
                    {fmt(parseFloat(buyForm.quantity) * parseFloat(buyForm.price))}
                  </span>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setBuyTarget(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm">
                  Buy Shares
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
