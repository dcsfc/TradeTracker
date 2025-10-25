import { useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../constants/config';

// Professional SVG Icons
const EditIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const LongIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14l5-5 5 5z"/>
  </svg>
);

const ShortIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 10l5 5 5-5z"/>
  </svg>
);

const TradeList = ({ trades, loading, onTradeUpdate }) => {
  const [sortBy, setSortBy] = useState('time'); // time, pnl, symbol
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [editingTrade, setEditingTrade] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatPnL = (pnl) => {
    const value = parseFloat(pnl);
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };

  const getPnLColor = (pnl) => {
    const value = parseFloat(pnl);
    return value >= 0 ? 'text-trading-green' : 'text-trading-red';
  };

  const sortTrades = (trades) => {
    return [...trades].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'time':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'pnl':
          aValue = parseFloat(a.pnl);
          bValue = parseFloat(b.pnl);
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Edit trade functions
  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setEditForm({
      symbol: trade.symbol,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      positionSize: trade.positionSize || '',
      leverage: trade.leverage || 1,
      positionType: trade.positionType,
      fees: trade.fees || 0
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Calculate new PnL and ROI
      const entryPrice = parseFloat(editForm.entryPrice);
      const exitPrice = parseFloat(editForm.exitPrice);
      const positionSize = parseFloat(editForm.positionSize);
      const leverage = parseFloat(editForm.leverage) || 1;
      const fees = parseFloat(editForm.fees) || 0;
      
      const rawPnL = editForm.positionType === 'Long'
        ? (exitPrice - entryPrice)
        : (entryPrice - exitPrice);
      
      // positionSize is in USDT; convert to quantity for PnL
      const quantity = positionSize / entryPrice;
      const pnl = (rawPnL * quantity * leverage) - fees;
      const amountInvested = positionSize; // already USDT
      const roi = (pnl / amountInvested) * 100;
      const tradeResult = pnl >= 0 ? 'Win' : 'Loss';

      const updatedTrade = {
        ...editingTrade,
        ...editForm,
        pnl: parseFloat(pnl.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        amountInvested: parseFloat(amountInvested.toFixed(2)),
        tradeResult: tradeResult
      };

      // Update trade via API
      await axios.put(`${API_CONFIG.BASE_URL}/api/update_trade/${editingTrade.id}`, updatedTrade);
      
      setEditingTrade(null);
      setEditForm({});
      if (onTradeUpdate) onTradeUpdate();
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  };

  const handleDelete = async (tradeIndex) => {
    try {
      // Use the actual trade id rather than list index
      const tradeId = trades[tradeIndex]?.id;
      if (!tradeId && trades[tradeIndex]) {
        // Attempt fallback: some lists may not include id if built from legacy data
        console.warn('Trade id missing; cannot delete reliably. Skipping.');
        return;
      }
      await axios.delete(`${API_CONFIG.BASE_URL}/api/delete_trade/${tradeId}`);
      setDeleteConfirm(null);
      setDeleteIndex(null);
      if (onTradeUpdate) onTradeUpdate();
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const formatROI = (roi) => {
    if (roi === null || roi === undefined) return '-';
    const value = parseFloat(roi);
    return value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
  };

  const getROIColor = (roi) => {
    if (roi === null || roi === undefined) return 'text-gray-400';
    const value = parseFloat(roi);
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700/50 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-200 mb-3">No trades yet</h3>
        <p className="text-slate-400 text-lg mb-6 max-w-md mx-auto">
          Add your first trade using the sidebar to start tracking your performance.
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Ready to track your first trade</span>
        </div>
      </div>
    );
  }

  const sortedTrades = sortTrades(trades);

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-200 mb-1">
              Today's Trades ({trades.length})
            </h3>
            <div className="text-sm text-slate-400">
              Sorted by {sortBy} {sortOrder === 'asc' ? '↑' : '↓'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">Live Data</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-2xl border border-slate-700/50 shadow-2xl">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-400 transition-all duration-300 group"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center space-x-2">
                  <span>Symbol</span>
                  {getSortIcon('symbol')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-400 transition-all duration-300 group"
                onClick={() => handleSort('pnl')}
              >
                <div className="flex items-center space-x-2">
                  <span>PnL</span>
                  {getSortIcon('pnl')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                ROI
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                RR
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Size
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:text-blue-400 transition-all duration-300 group"
                onClick={() => handleSort('time')}
              >
                <div className="flex items-center space-x-2">
                  <span>Time</span>
                  {getSortIcon('time')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {sortedTrades.map((trade, index) => (
              <tr 
                key={index} 
                className="group hover:bg-gradient-to-r hover:from-slate-800/30 hover:to-slate-700/30 transition-all duration-300 border-b border-slate-700/20"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-sm mr-4 shadow-lg">
                      {trade.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {trade.symbol}
                      </div>
                      <div className="text-xs text-slate-400">{trade.exchange || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-bold ${getPnLColor(trade.pnl)}`}>
                    {formatPnL(trade.pnl)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-bold ${getROIColor(trade.roi)}`}>
                    {formatROI(trade.roi)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                  {trade.rr ? `${trade.rr.toFixed(2)}R` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
                    trade.positionType === 'Long' 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <span className="flex items-center gap-2">
                      {trade.positionType === 'Long' ? <LongIcon /> : <ShortIcon />}
                      {trade.positionType}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                  {trade.positionSize ? `${trade.positionSize} USDT` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {formatTime(trade.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleEdit(trade)}
                      className="group p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-300"
                      title="Edit trade"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm(trade);
                        setDeleteIndex(index);
                      }}
                      className="group p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                      title="Delete trade"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Trade Modal */}
      {editingTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-trading-card rounded-lg border border-trading-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-trading-text mb-4">Edit Trade</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-trading-text mb-1">Symbol</label>
                <input
                  type="text"
                  value={editForm.symbol}
                  onChange={(e) => setEditForm({...editForm, symbol: e.target.value})}
                  className="w-full px-3 py-2 bg-trading-dark border border-trading-border rounded text-trading-text"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-trading-text mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.entryPrice}
                    onChange={(e) => setEditForm({...editForm, entryPrice: e.target.value})}
                    className="w-full px-3 py-2 bg-trading-dark border border-trading-border rounded text-trading-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-trading-text mb-1">Exit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.exitPrice}
                    onChange={(e) => setEditForm({...editForm, exitPrice: e.target.value})}
                    className="w-full px-3 py-2 bg-trading-dark border border-trading-border rounded text-trading-text"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-trading-text mb-1">Position Size</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={editForm.positionSize}
                    onChange={(e) => setEditForm({...editForm, positionSize: e.target.value})}
                    className="w-full px-3 py-2 bg-trading-dark border border-trading-border rounded text-trading-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-trading-text mb-1">Leverage</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={editForm.leverage}
                    onChange={(e) => setEditForm({...editForm, leverage: e.target.value})}
                    className="w-full px-3 py-2 bg-trading-dark border border-trading-border rounded text-trading-text"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-trading-text mb-1">Position Type</label>
                <select
                  value={editForm.positionType}
                  onChange={(e) => setEditForm({...editForm, positionType: e.target.value})}
                  className="w-full px-3 py-2 bg-trading-dark border border-trading-border rounded text-trading-text"
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingTrade(null)}
                  className="px-4 py-2 text-trading-text-secondary hover:text-trading-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-trading-green text-white rounded hover:bg-green-500 transition-colors"
                >
                  Update Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-trading-card rounded-lg border border-trading-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-trading-text mb-4">Delete Trade</h3>
            <p className="text-trading-text-secondary mb-6">
              Are you sure you want to delete this trade? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteIndex(null);
                }}
                className="px-4 py-2 text-trading-text-secondary hover:text-trading-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteIndex)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeList;
