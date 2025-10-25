# 🚀 Crypto Trade Tracker

A modern, minimal crypto trading performance tracker built with FastAPI (Python) and React (Vite + TailwindCSS).

## ✨ Features

- **Daily Trade Tracking**: Only shows today's trades (auto-resets daily)
- **Real-time Statistics**: PnL, win rate, win/loss count, current & highest streaks
- **Coin Filtering**: Filter trades by specific cryptocurrencies (BTC, ETH, SOL, etc.)
- **Beautiful UI**: TradingView-style dark theme with smooth animations
- **JSON Storage**: Simple file-based persistence (no database required)
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Project Structure

```
crypto_tracker/
├── backend/
│   ├── main.py          # FastAPI server
│   ├── data.json        # Trade data storage
│   └── requirements.txt # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navigation.jsx # Top navigation menu
    │   │   └── TradeList.jsx  # Trade history table
    │   ├── pages/
    │   │   ├── Dashboard.jsx   # Stats dashboard page
    │   │   └── AddTrade.jsx   # Add trade page
    │   └── App.jsx
    ├── package.json
    └── tailwind.config.js
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Navigation

- **Dashboard** (`/`) - View today's trading performance and statistics
- **Add Trade** (`/add-trade`) - Add new trades to your portfolio

## 📊 API Endpoints

### POST `/api/add_trade`
Add a new trade to today's records.

**Request Body:**
```json
{
  "symbol": "BTC",
  "pnl": 25.50,
  "rr": 2.0
}
```

**Response:**
```json
{
  "symbol": "BTC",
  "pnl": 25.50,
  "rr": 2.0,
  "date": "2025-10-20"
}
```

### GET `/api/stats?symbol=ETH`
Get today's trading statistics, optionally filtered by symbol.

**Response:**
```json
{
  "total_pnl": 124.50,
  "wins": 5,
  "losses": 3,
  "win_rate": 62.5,
  "highest_streak": 4,
  "current_streak": 2,
  "trades": [...]
}
```

## 🎨 UI Components

### Navigation Menu
- Top navigation bar with logo and menu items
- Links to Dashboard and Add Trade pages
- Active page highlighting

### Dashboard Page
- **Stats Cards**: Total PnL, Win Rate, Highest Streak, Current Streak
- **Coin Filter**: Dropdown to filter by specific cryptocurrencies
- **Trade List**: Sortable table of today's trades

### Add Trade Page
- Dedicated page for adding new trades
- Form validation with real-time feedback
- Auto-navigation to dashboard after successful submission

### Trade List
- Sortable columns (Symbol, PnL, RR, Time)
- Color-coded PnL values (green/red)
- Responsive design

## 🎯 Key Features

### Daily Reset Behavior
- Dashboard only shows today's trades
- Historical data is preserved in JSON file
- Automatic date filtering

### Streak Calculations
- **Current Streak**: Active consecutive wins
- **Highest Streak**: Best streak achieved today
- Real-time updates

### Color Coding
- 🟢 Green: Positive PnL, high win rates, good streaks
- 🔴 Red: Negative PnL, low win rates
- 🟡 Yellow: Medium performance

## 🛠️ Development

### Backend Development
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Production Build
```bash
cd frontend
npm run build
```

## 📱 Responsive Design

- **Desktop**: Full sidebar + dashboard layout
- **Mobile**: Collapsible sidebar, stacked cards
- **Tablet**: Optimized grid layouts

## 🔧 Configuration

### TailwindCSS Customization
Edit `frontend/tailwind.config.js` to modify:
- Color palette
- Font families
- Animations
- Spacing

### API Configuration
Edit `backend/main.py` to modify:
- CORS origins
- Data file location
- Date format

## 📈 Usage Tips

1. **Symbol Format**: Use uppercase (BTC, ETH, SOL)
2. **PnL Values**: Positive = profit, negative = loss
3. **RR Ratio**: Optional risk/reward ratio for risk management
4. **Filtering**: Use coin filter to focus on specific cryptocurrencies
5. **Sorting**: Click column headers in trade list to sort

## 🚨 Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check that port 8000 is available
- Verify all dependencies are installed

### Frontend Issues
- Ensure Node.js 16+ is installed
- Clear browser cache if styles don't load
- Check that port 5173 is available

### API Connection
- Backend must be running on port 8000
- CORS is configured for localhost:5173
- Check browser console for errors

## 🎨 Customization

### Adding New Features
1. **Backend**: Add new endpoints in `main.py`
2. **Frontend**: Create components in `src/components/`
3. **Styling**: Modify Tailwind classes or add custom CSS

### Theme Customization
- Edit `frontend/tailwind.config.js` for colors
- Modify `frontend/src/index.css` for global styles
- Update component classes for different themes

## 📄 License

MIT License - feel free to use and modify for your trading needs!

---

**Happy Trading! 📈🚀**
