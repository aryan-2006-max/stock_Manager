import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const fmt = n => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FILTERS = ['ALL', 'BUY', 'SELL'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('ALL');

  useEffect(() => {
    api.get('/portfolio/transactions')
      .then(res => setTransactions(res.data))
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL'
    ? transactions
    : transactions.filter(t => t.type === filter);

  const filterColor = f =>
    f === 'BUY'  ? 'bg-emerald-600 text-white' :
    f === 'SELL' ? 'bg-red-600 text-white'      :
                   'bg-blue-600 text-white';

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Transaction History</h1>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? filterColor(f)
                  : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Transactions', value: transactions.length, color: 'text-white' },
            { label: 'Total Bought',
              value: fmt(transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + Number(t.total_value), 0)),
              color: 'text-emerald-400' },
            { label: 'Total Sold',
              value: fmt(transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + Number(t.total_value), 0)),
              color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-slate-300 font-medium">No transactions found</p>
            {filter !== 'ALL' && (
              <p className="text-slate-500 text-sm mt-1">
                No {filter} transactions yet
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/40 border-b border-slate-700">
                <tr className="text-slate-400 text-xs uppercase tracking-wide">
                  <th className="py-3 px-4 text-left font-medium">Date & Time</th>
                  <th className="py-3 px-4 text-left font-medium">Type</th>
                  <th className="py-3 px-4 text-left font-medium">Symbol</th>
                  <th className="py-3 px-4 text-left font-medium">Company</th>
                  <th className="py-3 px-4 text-right font-medium">Qty</th>
                  <th className="py-3 px-4 text-right font-medium">Price</th>
                  <th className="py-3 px-4 text-right font-medium">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const ts    = new Date(t.timestamp);
                  const isBuy = t.type === 'BUY';
                  return (
                    <tr key={t.id}
                        className={`text-sm border-b border-slate-700/50 hover:bg-slate-700/20 transition ${
                          i % 2 ? 'bg-slate-900/10' : ''
                        }`}>
                      <td className="py-3 px-4">
                        <span className="text-slate-300">{ts.toLocaleDateString()}</span>
                        <span className="text-slate-500 ml-2 text-xs">{ts.toLocaleTimeString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          isBuy
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-400">{t.symbol}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">{t.company_name}</td>
                      <td className="py-3 px-4 text-right text-white">{Number(t.quantity).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-white">{fmt(t.price)}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        isBuy ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {isBuy ? '−' : '+'}{fmt(t.total_value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
