const express = require('express');
const axios   = require('axios');
const db      = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();
const AV_KEY = () => process.env.ALPHA_VANTAGE_API_KEY;
const hasKey = () => AV_KEY() && AV_KEY() !== 'demo';

// ── GET /api/stocks/search?q=AAPL ──────────────────────────────
router.get('/search', auth, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  try {
    // Search local DB first
    const [dbResults] = await db.query(
      'SELECT id, symbol, company_name, current_price FROM stocks WHERE symbol LIKE ? OR company_name LIKE ? LIMIT 10',
      [`${q.toUpperCase()}%`, `%${q}%`]
    );

    // Augment with Alpha Vantage symbol search if API key is present
    if (hasKey()) {
      try {
        const { data } = await axios.get('https://www.alphavantage.co/query', {
          params: { function: 'SYMBOL_SEARCH', keywords: q, apikey: AV_KEY() },
          timeout: 5000,
        });
        const matches = (data.bestMatches || []).slice(0, 8);
        const known   = new Set(dbResults.map(s => s.symbol));
        matches.forEach(m => {
          const sym = m['1. symbol'];
          if (!known.has(sym)) {
            dbResults.push({ symbol: sym, company_name: m['2. name'], current_price: null });
            known.add(sym);
          }
        });
      } catch (_) { /* Alpha Vantage unavailable — use DB results */ }
    }

    res.json(dbResults.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/stocks/:symbol/price ──────────────────────────────
router.get('/:symbol/price', auth, async (req, res) => {
  const sym = req.params.symbol.toUpperCase();

  try {
    if (hasKey()) {
      const { data } = await axios.get('https://www.alphavantage.co/query', {
        params: { function: 'GLOBAL_QUOTE', symbol: sym, apikey: AV_KEY() },
        timeout: 6000,
      });
      const q = data['Global Quote'];
      if (q && q['05. price']) {
        const price  = parseFloat(q['05. price']);
        const change = parseFloat(q['09. change']);
        const pct    = q['10. change percent'];
        await db.query(
          'UPDATE stocks SET current_price = ?, last_updated = NOW() WHERE symbol = ?',
          [price, sym]
        );
        return res.json({ symbol: sym, price, change, changePercent: pct });
      }
    }

    // Fallback: cached price in DB
    const [rows] = await db.query(
      'SELECT current_price FROM stocks WHERE symbol = ?',
      [sym]
    );
    if (rows.length) return res.json({ symbol: sym, price: parseFloat(rows[0].current_price) });
    res.status(404).json({ message: 'Price not available' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/stocks/:symbol/history?interval=daily ─────────────
router.get('/:symbol/history', auth, async (req, res) => {
  const sym      = req.params.symbol.toUpperCase();
  const interval = req.query.interval === 'weekly' ? 'weekly' : 'daily';

  try {
    if (hasKey()) {
      const fn  = interval === 'weekly' ? 'TIME_SERIES_WEEKLY' : 'TIME_SERIES_DAILY';
      const key = interval === 'weekly' ? 'Weekly Time Series'  : 'Time Series (Daily)';

      const { data } = await axios.get('https://www.alphavantage.co/query', {
        params: { function: fn, symbol: sym, apikey: AV_KEY() },
        timeout: 10000,
      });

      const series = data[key];
      if (series) {
        const points = Object.entries(series)
          .slice(0, 30)
          .map(([date, v]) => ({
            date,
            open:   parseFloat(v['1. open']),
            high:   parseFloat(v['2. high']),
            low:    parseFloat(v['3. low']),
            close:  parseFloat(v['4. close']),
            volume: parseInt(v['5. volume']),
          }))
          .reverse();
        return res.json(points);
      }
    }

    // Fallback: generate realistic mock history from current price
    const [stocks] = await db.query(
      'SELECT current_price FROM stocks WHERE symbol = ?',
      [sym]
    );
    const base  = stocks.length ? parseFloat(stocks[0].current_price) : 100;
    let   price = base * 0.85;

    const history = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const change = (Math.random() - 0.47) * price * 0.025;
      price = Math.max(1, price + change);
      // Pull last point to match actual current price
      if (i === 29) price = base;
      return { date: d.toISOString().split('T')[0], close: parseFloat(price.toFixed(2)) };
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
