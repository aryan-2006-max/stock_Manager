import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899','#ef4444'];

const Spinner = () => (
  <div className="flex items-center justify-center min-h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
);

function StatCard({ title, value, sub, color }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p className="text-slate-400 text-xs uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

const fmt  = n => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct  = n => `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => setData({ totalInvested: 0, currentValue: 0, profitLoss: 0, plPercent: 0, holdings: [], valueHistory: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data)   return null;

  const plColor  = data.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400';
  const holdings = data.holdings || [];

  const allocationData = holdings.map(h => ({
    name:  h.symbol,
    value: parseFloat(Number(h.current_value).toFixed(2)),
  }));

  const plData = holdings.map(h => ({
    name: h.symbol,
    pnl:  parseFloat(Number(h.profit_loss).toFixed(2)),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Invested"  value={fmt(data.totalInvested)} />
        <StatCard title="Current Value"   value={fmt(data.currentValue)}  color="text-blue-400" />
        <StatCard
          title="Profit / Loss"
          value={`${data.profitLoss >= 0 ? '+' : ''}${fmt(data.profitLoss)}`}
          sub={pct(data.plPercent)}
          color={plColor}
        />
        <StatCard title="Positions" value={holdings.length} sub="active holdings" />
      </div>

      {/* ── Portfolio Activity Chart ─────────────────────────── */}
      {data.valueHistory?.length > 0 ? (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
          <h2 className="text-base font-semibold text-white mb-4">Investment Activity Over Time</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.valueHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
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
                width={70}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                formatter={v => [fmt(v), 'Invested']}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 mb-6 text-center">
          <p className="text-slate-500 text-sm">No transaction history yet — buy stocks to see your activity chart.</p>
        </div>
      )}

      {/* ── Pie + Bar Charts ─────────────────────────────────── */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Portfolio Allocation */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-base font-semibold text-white mb-4">Portfolio Allocation</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  dataKey="value"
                  label={({ name, percent }) =>
                    percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                >
                  {allocationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={v => [fmt(v), 'Value']}
                />
                <Legend
                  formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* P&L Bar Chart */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-base font-semibold text-white mb-4">Profit / Loss by Stock</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={plData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                  width={65}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={v => [fmt(v), 'P&L']}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {plData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Holdings Table ───────────────────────────────────── */}
      {holdings.length > 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-base font-semibold text-white">Holdings</h2>
            <Link to="/portfolio" className="text-blue-400 hover:text-blue-300 text-sm">
              Manage →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                  {['Symbol','Company','Qty','Avg Price','Current','Market Value','P&L'].map(h => (
                    <th key={h} className={`py-3 px-4 font-medium ${h === 'P&L' || h === 'Market Value' || h === 'Current' || h === 'Qty' || h === 'Avg Price' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => (
                  <tr key={h.symbol} className={`text-sm border-b border-slate-700/50 ${i % 2 ? 'bg-slate-900/20' : ''}`}>
                    <td className="py-3 px-4 font-bold text-blue-400">{h.symbol}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-[140px] truncate">{h.company_name}</td>
                    <td className="py-3 px-4 text-right text-white">{Number(h.quantity).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-white">{fmt(h.avg_buy_price)}</td>
                    <td className="py-3 px-4 text-right text-white">{fmt(h.current_price)}</td>
                    <td className="py-3 px-4 text-right text-white">{fmt(h.current_value)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${h.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.profit_loss >= 0 ? '+' : ''}{fmt(h.profit_loss)}
                      <div className="text-xs font-normal opacity-80">{pct(h.pl_percent)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-16 border border-slate-700 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-slate-300 text-lg font-medium">No holdings yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">Add stocks to your portfolio to see analytics here</p>
          <Link
            to="/portfolio"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm"
          >
            Go to Portfolio
          </Link>
        </div>
      )}
    </div>
  );
}
