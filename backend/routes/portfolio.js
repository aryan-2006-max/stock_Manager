const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

// Helper: get user's portfolio id
async function getPortfolioId(userId) {
  const [rows] = await db.query(
    'SELECT id FROM portfolios WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows.length ? rows[0].id : null;
}

// ── GET /api/portfolio ── holdings with live P&L
router.get('/', auth, async (req, res) => {
  try {
    const portfolioId = await getPortfolioId(req.user.id);
    if (!portfolioId) return res.json([]);

    const [holdings] = await db.query(
      `SELECT h.id,
              h.quantity,
              h.avg_buy_price,
              s.symbol,
              s.company_name,
              s.current_price,
              (h.quantity * s.current_price)                             AS current_value,
              (h.quantity * (s.current_price - h.avg_buy_price))        AS profit_loss,
              ((s.current_price - h.avg_buy_price) / h.avg_buy_price * 100) AS pl_percent
       FROM holdings h
       JOIN stocks s ON h.stock_id = s.id
       WHERE h.portfolio_id = ? AND h.quantity > 0`,
      [portfolioId]
    );

    res.json(holdings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/portfolio/buy ── buy (or add to) a position
router.post('/buy', auth, async (req, res) => {
  const { symbol, company_name, quantity, price } = req.body;
  if (!symbol || !quantity || !price) {
    return res.status(400).json({ message: 'symbol, quantity and price are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Upsert stock record
    const sym = symbol.toUpperCase();
    let [stocks] = await conn.query('SELECT id FROM stocks WHERE symbol = ?', [sym]);
    let stockId;

    if (!stocks.length) {
      const [r] = await conn.query(
        'INSERT INTO stocks (symbol, company_name, current_price, last_updated) VALUES (?, ?, ?, NOW())',
        [sym, company_name || sym, price]
      );
      stockId = r.insertId;
    } else {
      stockId = stocks[0].id;
      await conn.query(
        'UPDATE stocks SET current_price = ?, company_name = COALESCE(?, company_name), last_updated = NOW() WHERE id = ?',
        [price, company_name || null, stockId]
      );
    }

    const portfolioId = await getPortfolioId(req.user.id);

    // Weighted average on existing holding
    const [existing] = await conn.query(
      'SELECT * FROM holdings WHERE portfolio_id = ? AND stock_id = ?',
      [portfolioId, stockId]
    );

    if (existing.length) {
      const old    = existing[0];
      const newQty = parseFloat(old.quantity) + parseFloat(quantity);
      const newAvg = ((parseFloat(old.quantity) * parseFloat(old.avg_buy_price)) +
                      (parseFloat(quantity)      * parseFloat(price))) / newQty;
      await conn.query(
        'UPDATE holdings SET quantity = ?, avg_buy_price = ? WHERE id = ?',
        [newQty, newAvg.toFixed(4), old.id]
      );
    } else {
      await conn.query(
        'INSERT INTO holdings (portfolio_id, stock_id, quantity, avg_buy_price) VALUES (?, ?, ?, ?)',
        [portfolioId, stockId, quantity, price]
      );
    }

    // Log transaction
    await conn.query(
      'INSERT INTO transactions (user_id, stock_id, type, quantity, price, timestamp) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.user.id, stockId, 'BUY', quantity, price]
    );

    await conn.commit();
    res.json({ message: 'Stock purchased successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ── POST /api/portfolio/sell ── sell from a position
router.post('/sell', auth, async (req, res) => {
  const { symbol, quantity, price } = req.body;
  if (!symbol || !quantity || !price) {
    return res.status(400).json({ message: 'symbol, quantity and price are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [stocks] = await conn.query(
      'SELECT id FROM stocks WHERE symbol = ?',
      [symbol.toUpperCase()]
    );
    if (!stocks.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Stock not found in system' });
    }
    const stockId     = stocks[0].id;
    const portfolioId = await getPortfolioId(req.user.id);

    const [holdings] = await conn.query(
      'SELECT * FROM holdings WHERE portfolio_id = ? AND stock_id = ?',
      [portfolioId, stockId]
    );
    if (!holdings.length || parseFloat(holdings[0].quantity) < parseFloat(quantity)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Insufficient shares to sell' });
    }

    const newQty = parseFloat(holdings[0].quantity) - parseFloat(quantity);
    await conn.query(
      'UPDATE holdings SET quantity = ? WHERE id = ?',
      [newQty.toFixed(4), holdings[0].id]
    );

    // Update cached price
    await conn.query(
      'UPDATE stocks SET current_price = ?, last_updated = NOW() WHERE id = ?',
      [price, stockId]
    );

    await conn.query(
      'INSERT INTO transactions (user_id, stock_id, type, quantity, price, timestamp) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.user.id, stockId, 'SELL', quantity, price]
    );

    await conn.commit();
    res.json({ message: 'Shares sold successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ── GET /api/portfolio/transactions ── full history
router.get('/transactions', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.id,
              t.type,
              t.quantity,
              t.price,
              t.timestamp,
              s.symbol,
              s.company_name,
              (t.quantity * t.price) AS total_value
       FROM transactions t
       JOIN stocks s ON t.stock_id = s.id
       WHERE t.user_id = ?
       ORDER BY t.timestamp DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
