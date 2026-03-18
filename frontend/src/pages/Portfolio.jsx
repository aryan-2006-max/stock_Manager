import React, { useState, useEffect, useCallback } from 'react';
import api             from '../api/axios';
import AddStockModal   from '../components/AddStockModal';
import StockChartModal from '../components/StockChartModal';

const fmt = n => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Spinner = () => (
  <div className="flex items-center justify-center min-h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
  </div>
);

export default function Portfolio() {
  const [holdings,   setHoldings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showBuy,    setShowBuy]    = useState(false);
  const [sellTarget, setSellTarget] = useState(null);  // holding to sell
  const [chartStock, setChartStock] = useState(null);  // stock to chart
  const [sellForm,   setSellForm]   = useState({ quantity: '', price: '' });
  const [sellError,  setSellError]  = useState('');
  const [error,      setError]      = useState('');

  const fetchHoldings = useCallback(async () => {
    try {
      const { data } = await api.get('/portfolio');
      setHoldings(data);
    } catch {
      setError('Failed to load holdings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const openSell = h => {
    setSellTarget(h);
    setSellForm({ quantity: '', price: Number(h.current_price).toFixed(2) });
    setSellError('');
  };

  const handleSell = async e => {
    e.preventDefault();
    setSellError('');
    try {
      await api.post('/portfolio/sell', {
        symbol:   sellTarget.symbol,
        quantity: parseFloat(sellForm.quantity),
        price:    parseFloat(sellForm.price),
      });
      setSellTarget(null);
      fetchHoldings();
    } catch (err) {
      setSellError(err.response?.data?.message || 'Sell failed');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
        <button
          onClick={() => setShowBuy(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-1"
        >
          + Buy Stock
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Holdings table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {holdings.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-4">💼</p>
            <p className="text-slate-300 font-medium">Your portfolio is empty</p>
            <p className="text-slate-500 text-sm mt-1 mb-5">Click "Buy Stock" to add your first position</p>
            <button
              onClick={() => setShowBuy(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm"
            >
              + Buy Stock
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/40 border-b border-slate-700">
                <tr className="text-slate-400 text-xs uppercase tracking-wide">
                  {['Symbol','Company','Qty','Avg Price','Current Price','Market Value','P&L','Actions'].map(h => (
                    <th key={h} className={`py-3 px-4 font-medium whitespace-nowrap ${
                      ['Actions','Symbol','Company'].includes(h) ? 'text-left' : 'text-right'
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => (
                  <tr
                    key={h.id}
                    className={`text-sm border-b border-slate-700/50 hover:bg-slate-700/30 transition ${
                      i % 2 ? 'bg-slate-900/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setChartStock(h)}
                        className="font-bold text-blue-400 hover:text-blue-300 hover:underline"
                        title="View price chart"
                      >
                        {h.symbol}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[160px] truncate">{h.company_name}</td>
                    <td className="py-3 px-4 text-right text-white">{Number(h.quantity).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-white">{fmt(h.avg_buy_price)}</td>
                    <td className="py-3 px-4 text-right text-white">{fmt(h.current_price)}</td>
                    <td className="py-3 px-4 text-right text-white">{fmt(h.current_value)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${h.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.profit_loss >= 0 ? '+' : ''}{fmt(h.profit_loss)}
                      <div className="text-xs font-normal opacity-75">
                        {h.profit_loss >= 0 ? '+' : ''}{Number(h.pl_percent).toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setChartStock(h)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1 rounded text-xs"
                          title="View chart"
                        >
                          📈
                        </button>
                        <button
                          onClick={() => openSell(h)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded text-xs font-medium"
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {showBuy && (
        <AddStockModal
          onClose={() => setShowBuy(false)}
          onSuccess={() => { setShowBuy(false); fetchHoldings(); }}
        />
      )}

      {/* Chart Modal */}
      {chartStock && (
        <StockChartModal stock={chartStock} onClose={() => setChartStock(null)} />
      )}

      {/* Sell Modal */}
      {sellTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
             onClick={e => e.target === e.currentTarget && setSellTarget(null)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Sell {sellTarget.symbol}</h3>
              <button onClick={() => setSellTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              You hold <span className="text-white font-medium">{Number(sellTarget.quantity).toLocaleString()} shares</span>
            </p>
            {sellError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">
                {sellError}
              </div>
            )}
            <form onSubmit={handleSell} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">Quantity to Sell</label>
                <input
                  type="number" step="0.0001" min="0.0001"
                  max={Number(sellTarget.quantity)}
                  value={sellForm.quantity}
                  onChange={e => setSellForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                  placeholder="10"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1">Sell Price ($)</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={sellForm.price}
                  onChange={e => setSellForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-blue-500"
                  required
                />
              </div>
              {sellForm.quantity && sellForm.price && (
                <div className="bg-slate-700/60 rounded-lg px-4 py-2 flex justify-between text-sm">
                  <span className="text-slate-400">Proceeds</span>
                  <span className="text-white font-semibold">
                    {fmt(parseFloat(sellForm.quantity) * parseFloat(sellForm.price))}
                  </span>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setSellTarget(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-sm">
                  Sell Shares
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
