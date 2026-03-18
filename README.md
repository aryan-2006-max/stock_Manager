# 📈 StockFolio — Smart Stock Portfolio Management System

A full-stack web application for tracking stock portfolios with real-time analytics.

## Tech Stack

- **Frontend:** React 18, Tailwind CSS (CDN), Recharts
- **Backend:** Node.js + Express.js
- **Database:** MySQL 8
- **Auth:** JWT + bcryptjs

## Features

- Register & Login with JWT authentication
- Buy / Sell stocks with weighted-average cost tracking
- Dashboard with 3 analytics charts:
  - Area chart — investment activity over time
  - Pie chart — portfolio allocation by stock
  - Bar chart — profit / loss per stock (green = gain, red = loss)
- Watchlist page with mini sparkline charts per stock card
- Click any symbol in Portfolio to open a 30-day / 30-week price chart
- Transaction history with BUY / SELL / ALL filter and summary strip
- Sell validation — prevents selling more than available shares
- Optional live prices via Alpha Vantage API (falls back to DB-cached prices)
- 15 pre-seeded stocks (AAPL, NVDA, MSFT, TSLA, …)

## Project Structure

```
stock-portfolio/
├── database/
│   └── schema.sql            ← Run this first
├── backend/
│   ├── routes/
│   │   ├── auth.js           ← register / login
│   │   ├── portfolio.js      ← buy, sell, holdings, transactions
│   │   ├── stocks.js         ← search, price, history
│   │   ├── dashboard.js      ← summary + chart data
│   │   └── watchlist.js      ← CRUD watchlist
│   ├── middleware/auth.js     ← JWT guard
│   ├── server.js
│   └── db.js                 ← mysql2 pool
└── frontend/
    └── src/
        ├── pages/            ← Login, Register, Dashboard, Portfolio, Watchlist, Transactions
        ├── components/       ← Navbar, AddStockModal, StockChartModal, PrivateRoute
        ├── context/          ← AuthContext (JWT + localStorage)
        └── api/axios.js      ← Axios instance with auth interceptor
```

## Setup

### Prerequisites

- Node.js v16+
- MySQL 8.0+
- (Optional) Free Alpha Vantage API key: https://www.alphavantage.co/support/#api-key

---

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

---

### 2. Backend

```bash
cd backend
npm install

# Copy env template and fill in your values
copy .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stock_portfolio
JWT_SECRET=change_this_to_a_long_random_string
ALPHA_VANTAGE_API_KEY=demo
```

Start the server:

```bash
npm run dev
```

Server runs at **http://localhost:5000**

---

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

App opens at **http://localhost:3000**

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ✗ | Register new user |
| POST | /api/auth/login | ✗ | Login → JWT |
| GET | /api/dashboard | ✓ | Summary + chart data |
| GET | /api/portfolio | ✓ | Holdings with P&L |
| POST | /api/portfolio/buy | ✓ | Buy stock |
| POST | /api/portfolio/sell | ✓ | Sell stock |
| GET | /api/portfolio/transactions | ✓ | Transaction history |
| GET | /api/stocks/search?q= | ✓ | Symbol search |
| GET | /api/stocks/:symbol/price | ✓ | Current price |
| GET | /api/stocks/:symbol/history | ✓ | 30-day price history |
| GET | /api/watchlist | ✓ | Get watchlist |
| POST | /api/watchlist | ✓ | Add to watchlist |
| DELETE | /api/watchlist/:id | ✓ | Remove from watchlist |
