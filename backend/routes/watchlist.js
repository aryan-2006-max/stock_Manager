const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── GET /api/watchlist ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT w.id,
              w.added_at,
              s.symbol,
              s.company_name,
              s.current_price,
              s.last_updated
       FROM watchlist w
       JOIN stocks s ON w.stock_id = s.id
       WHERE w.user_id = ?
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/watchlist ────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { symbol, company_name, price } = req.body;
  if (!symbol) return res.status(400).json({ message: 'symbol is required' });

  try {
    const sym = symbol.toUpperCase();

    // Upsert stock
    let [stocks] = await db.query('SELECT id FROM stocks WHERE symbol = ?', [sym]);
    let stockId;
    if (!stocks.length) {
      const [r] = await db.query(
        'INSERT INTO stocks (symbol, company_name, current_price, last_updated) VALUES (?, ?, ?, NOW())',
        [sym, company_name || sym, price || 0]
      );
      stockId = r.insertId;
    } else {
      stockId = stocks[0].id;
    }

    // Duplicate check
    const [existing] = await db.query(
      'SELECT id FROM watchlist WHERE user_id = ? AND stock_id = ?',
      [req.user.id, stockId]
    );
    if (existing.length) {
      return res.status(400).json({ message: 'Already in watchlist' });
    }

    await db.query(
      'INSERT INTO watchlist (user_id, stock_id, added_at) VALUES (?, ?, NOW())',
      [req.user.id, stockId]
    );
    res.status(201).json({ message: 'Added to watchlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/watchlist/:id ──────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM watchlist WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
