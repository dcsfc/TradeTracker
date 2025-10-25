import { useState, useEffect } from 'react';
import axios from 'axios';
import TradeList from '../components/TradeList';
import ExportButton from '../components/ExportButton';

// Professional SVG Icons
const MoneyIcon = () => (
  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const ChartIcon = () => (
  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 13h2v6H3v-6zm4-6h2v12H7V7zm4-4h2v16h-2V3zm4 8h2v8h-2v-8z"/>
  </svg>
);

const TargetIcon = () => (
  <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
);

const TrendingDownIcon = () => (
  <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
  </svg>
);

const LongPositionIcon = () => (
  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14l5-5 5 5z"/>
  </svg>
);

const ShortPositionIcon = () => (
  <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 10l5 5 5-5z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    today_pnl: 0,
    total_trades: 0,
    win_rate_long: 0,
    lose_rate_long: 0,
    win_rate_short: 0,
    lose_rate_short: 0,
    win_rate: 0,
    lose_rate: 0,
    wins: 0,
    losses: 0,
    trades: []
  });
  const [selectedSymbol, setSelectedSymbol] = useState('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Available symbols for filter (extracted from trades)
  const [availableSymbols, setAvailableSymbols] = useState(['All']);

  const fetchStats = async (symbol = 'All', timeFilter = 'Today') => {
    try {
      setLoading(true);
      setError('');
      
      // Build URL with both symbol and time filters
      let url = 'http://localhost:8000/api/stats';
      const params = new URLSearchParams();
      
      if (symbol !== 'All') {
        params.append('symbol', symbol);
      }
      
      if (timeFilter === 'All') {
        params.append('all_time', 'true');
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setStats(response.data);
      
      // Update available symbols from all trades
      if (symbol === 'All') {
        const allSymbols = ['All', ...new Set(response.data.trades.map(trade => trade.symbol))];
        setAvailableSymbols(allSymbols);
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load trading data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedSymbol, selectedTimeFilter);
  }, [selectedSymbol, selectedTimeFilter, fetchStats]);

  const formatPnL = (pnl) => {
    const value = parseFloat(pnl);
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };

  const getPnLColor = (pnl) => {
    const value = parseFloat(pnl);
    return value >= 0 ? 'text-trading-green' : 'text-trading-red';
  };

  const getPnLIcon = (pnl) => {
    const value = parseFloat(pnl);
    return value >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return 'text-trading-green';
    if (winRate >= 50) return 'text-yellow-400';
    return 'text-trading-red';
  };

  const getStreakColor = (streak) => {
    if (streak >= 5) return 'text-trading-green';
    if (streak >= 3) return 'text-yellow-400';
    return 'text-trading-text-secondary';
  };

  const getLoseRateColor = (loseRate) => {
    if (loseRate >= 50) return 'text-trading-red';
    if (loseRate >= 30) return 'text-yellow-400';
    return 'text-trading-green';
  };

  // Calculate average ROI from all trades
  const calculateAverageROI = (trades) => {
    if (!trades || trades.length === 0) return 0;
    const validROIs = trades.filter(trade => trade.roi !== null && trade.roi !== undefined);
    if (validROIs.length === 0) return 0;
    const sumROI = validROIs.reduce((sum, trade) => sum + trade.roi, 0);
    return sumROI / validROIs.length;
  };

  // Calculate average Risk-Reward ratio from all trades
  const calculateAverageRR = (trades) => {
    if (!trades || trades.length === 0) return 0;
    const validRRs = trades.filter(trade => trade.rr !== null && trade.rr !== undefined);
    if (validRRs.length === 0) return 0;
    const sumRR = validRRs.reduce((sum, trade) => sum + trade.rr, 0);
    return sumRR / validRRs.length;
  };

  // Get color for ROI (green if >= 0, red if negative)
  const getROIColor = (roi) => {
    return roi >= 0 ? 'text-green-400' : 'text-red-400';
  };


  if (loading && stats.trades.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-700/50 rounded-2xl w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-700/50 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-80 bg-slate-700/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Professional Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-3">
              Trading Dashboard
        </h1>
            <p className="text-slate-400 text-lg">
              Professional trading performance analytics
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <ExportButton trades={stats.trades} stats={stats} />
            <div className="text-right">
              <div className="text-sm text-slate-500">Last Updated</div>
              <div className="text-slate-300 font-medium">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Filters */}
      <div className="mb-10">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
          {/* Time Filter */}
            <div className="flex items-center space-x-4">
              <label htmlFor="time-filter" className="text-sm font-semibold text-slate-300">
              Time Period:
            </label>
            <select
              id="time-filter"
              value={selectedTimeFilter}
              onChange={(e) => setSelectedTimeFilter(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            >
              <option value="Today">Today</option>
              <option value="All">All Time</option>
            </select>
          </div>

          {/* Symbol Filter */}
            <div className="flex items-center space-x-4">
              <label htmlFor="symbol-filter" className="text-sm font-semibold text-slate-300">
                Symbol:
            </label>
            <select
              id="symbol-filter"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            >
              {availableSymbols.map(symbol => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-trading-red">
          {error}
        </div>
      )}

      {/* Performance Section */}
      <div className="mb-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-200 mb-2">Performance Overview</h2>
          <p className="text-slate-400">Real-time trading metrics and analytics</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today PnL Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <MoneyIcon />
              <div className="text-right">
                  <div className="text-sm text-slate-400 font-medium">Today PnL</div>
              </div>
            </div>
            <div className="text-center">
                <div className={`text-2xl font-bold ${getPnLColor(stats.today_pnl)}`}>
                {formatPnL(stats.today_pnl)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Real-time</div>
              </div>
            </div>
          </div>

          {/* Total Trades Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <ChartIcon />
              <div className="text-right">
                  <div className="text-sm text-slate-400 font-medium">Total Trades</div>
              </div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-slate-200">
                {stats.total_trades}
                </div>
                <div className="text-xs text-slate-500 mt-1">All time</div>
              </div>
            </div>
          </div>

          {/* Win/Lose Rate Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <TargetIcon />
              <div className="text-right">
                  <div className="text-sm text-slate-400 font-medium">Win Rate</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-center">
                  <div className="text-xs text-slate-500">Win</div>
                  <div className={`text-lg font-bold ${getWinRateColor(stats.win_rate)}`}>
                  {stats.win_rate.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                  <div className="text-xs text-slate-500">Lose</div>
                  <div className="text-lg font-bold text-red-400">
                  {stats.lose_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wins/Losses Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-cyan-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <CheckIcon />
              <div className="text-right">
                  <div className="text-sm text-slate-400 font-medium">Wins/Losses</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-center">
                  <div className="text-xs text-slate-500">Wins</div>
                  <div className="text-lg font-bold text-green-400">
                  {stats.wins}
                </div>
              </div>
              <div className="text-center">
                  <div className="text-xs text-slate-500">Losses</div>
                  <div className="text-lg font-bold text-red-400">
                  {stats.losses}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Section */}
      <div className="mb-8 mt-2 md:mt-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-200 mb-2">Position Analysis</h2>
          <p className="text-slate-400">Distribution of win/loss by direction</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Long Positions Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <LongPositionIcon />
              <div className="text-right">
                  <div className="text-sm text-slate-400 font-medium">Long Positions</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-200">
                    {stats.trades.filter(trade => trade.positionType === 'Long').length}
                  </div>
                  <div className="text-xs text-slate-500">Total Long</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-center">
                  <div className="text-xs text-slate-500">Win</div>
                  <div className="text-lg font-bold text-green-400">
                  {stats.win_rate_long.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                  <div className="text-xs text-slate-500">Lose</div>
                  <div className="text-lg font-bold text-red-400">
                  {stats.lose_rate_long.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Short Positions Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-red-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <ShortPositionIcon />
              <div className="text-right">
                  <div className="text-sm text-slate-400 font-medium">Short Positions</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-200">
                    {stats.trades.filter(trade => trade.positionType === 'Short').length}
                  </div>
                  <div className="text-xs text-slate-500">Total Short</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-center">
                  <div className="text-xs text-slate-500">Win</div>
                  <div className="text-lg font-bold text-green-400">
                  {stats.win_rate_short.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                  <div className="text-xs text-slate-500">Lose</div>
                  <div className="text-lg font-bold text-red-400">
                  {stats.lose_rate_short.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Professional Footer Metrics */}
      <div className="mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">Avg ROI:</span>
              <span className={`text-lg font-bold ${getROIColor(calculateAverageROI(stats.trades))}`}>
                {calculateAverageROI(stats.trades).toFixed(2)}%
            </span>
          </div>
            <div className="hidden sm:block w-px h-6 bg-slate-600"></div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">Avg RR:</span>
              <span className="text-lg font-bold text-slate-200">
                {calculateAverageRR(stats.trades).toFixed(2)}R
              </span>
          </div>
            <div className="hidden sm:block w-px h-6 bg-slate-600"></div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">Win Rate:</span>
              <span className={`text-lg font-bold ${getWinRateColor(stats.win_rate)}`}>
              {stats.win_rate.toFixed(1)}%
            </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade List */}
      <TradeList trades={stats.trades} loading={loading} onTradeUpdate={() => fetchStats(selectedSymbol, selectedTimeFilter)} />
    </div>
  );
};

export default Dashboard;
