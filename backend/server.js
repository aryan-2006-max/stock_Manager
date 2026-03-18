require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const stockRoutes     = require('./routes/stocks');
const dashboardRoutes = require('./routes/dashboard');
const watchlistRoutes = require('./routes/watchlist');

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks',    stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
