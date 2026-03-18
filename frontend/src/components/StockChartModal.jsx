import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from 'https://stock-manager-xa32.onrender.com/api/axios';

const INTERVAL_OPTS = [
  { value: 'daily',  label: '30D' },
  { value: 'weekly', label: '30W' },
];

export default function StockChartModal({ stock, onClose }) {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [interval, setInterval] = useState('daily');

  useEffect(() => {
    setLoading(true);
    api.get(`/stocks/${stock.symbol}/history?interval=${interval}`)
      .then(res => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [stock.symbol, interval]);

  const prices = history.map(d => d.close);
  const minP   = prices.length ? Math.min(...prices) * 0.985 : 0;
  const maxP   = prices.length ? Math.max(...prices) * 1.015 : 100;
  const trend  = prices.length >= 2 ? prices[prices.length - 1] - prices[0] : 0;
  const color  = trend >= 0 ? '#10b981' : '#ef4444';

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-700 shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-blue-400">{stock.symbol}</h3>
            <p className="text-slate-400 text-sm mt-0.5">{stock.company_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Price + interval selector */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-3xl font-bold text-white">
              ${Number(stock.current_price).toFixed(2)}
            </p>
            {trend !== 0 && (
              <p className={`text-sm mt-0.5 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? '▲' : '▼'} ${Math.abs(trend).toFixed(2)} this period
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {INTERVAL_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setInterval(opt.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  interval === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-slate-500">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#475569"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                tickFormatter={v => `$${v}`}
                domain={[minP, maxP]}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={v => [`$${Number(v).toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#chartGrad)"
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Footer stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            {[
              { label: 'Open',  value: `$${prices[0]?.toFixed(2)}` },
              { label: 'Low',   value: `$${Math.min(...prices).toFixed(2)}` },
              { label: 'High',  value: `$${Math.max(...prices).toFixed(2)}` },
            ].map(s => (
              <div key={s.label} className="bg-slate-700/50 rounded-lg py-2">
                <p className="text-slate-500 text-xs">{s.label}</p>
                <p className="text-white font-semibold text-sm mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
