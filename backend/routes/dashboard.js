const express = require('express');
const db      = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── GET /api/dashboard ────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    // Get portfolio id
    const [portfolios] = await db.query(
      'SELECT id FROM portfolios WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (!portfolios.length) {
      return res.json({
        totalInvested: 0, currentValue: 0,
        profitLoss: 0,    plPercent: 0,
        holdings: [],     valueHistory: [],
      });
    }

    const portfolioId = portfolios[0].id;

    // Holdings with P&L
    const [holdings] = await db.query(
      `SELECT h.quantity,
              h.avg_buy_price,
              s.symbol,
              s.company_name,
              s.current_price,
              (h.quantity * s.current_price)                             AS current_value,
              (h.quantity * h.avg_buy_price)                             AS invested_value,
              (h.quantity * (s.current_price - h.avg_buy_price))        AS profit_loss,
              ((s.current_price - h.avg_buy_price) / h.avg_buy_price * 100) AS pl_percent
       FROM holdings h
       JOIN stocks s ON h.stock_id = s.id
       WHERE h.portfolio_id = ? AND h.quantity > 0`,
      [portfolioId]
    );

    const totalInvested = holdings.reduce((s, h) => s + parseFloat(h.invested_value), 0);
    const currentValue  = holdings.reduce((s, h) => s + parseFloat(h.current_value),  0);
    const profitLoss    = currentValue - totalInvested;
    const plPercent     = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    // Investment activity over time (cumulative invested)
    const [txns] = await db.query(
      `SELECT DATE(timestamp) AS date,
              SUM(CASE WHEN type='BUY'
                    THEN  quantity * price
                    ELSE -quantity * price END) AS daily_delta
       FROM transactions
       WHERE user_id = ?
       GROUP BY DATE(timestamp)
       ORDER BY date ASC`,
      [req.user.id]
    );

    let cumulative = 0;
    const valueHistory = txns.map(t => {
      cumulative += parseFloat(t.daily_delta);
      // Ensure date is always a plain string (mysql2 may return Date objects)
      const dateStr =
        t.date instanceof Date
          ? t.date.toISOString().split('T')[0]
          : String(t.date).split('T')[0];
      return { date: dateStr, value: parseFloat(cumulative.toFixed(2)) };
    });

    res.json({
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      currentValue:  parseFloat(currentValue.toFixed(2)),
      profitLoss:    parseFloat(profitLoss.toFixed(2)),
      plPercent:     parseFloat(plPercent.toFixed(2)),
      holdings,
      valueHistory,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
