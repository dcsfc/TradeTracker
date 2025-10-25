import { useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../constants/config';

const AddTrade = () => {
  const [formData, setFormData] = useState({
    symbol: '',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    positionSize: '',
    leverage: '1',
    positionType: 'Long',
    fees: '0',
    exchange: 'MEXC',
    baseCurrency: 'USDT',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // MEXC Fee Calculation with USDT base
  const calculateMEXCFees = (entryPrice, exitPrice, positionSizeUSDT, leverage) => {
    // MEXC Spot Trading Fees: 0.2% (0.002) for both maker and taker
    const MEXC_SPOT_FEE_RATE = 0.002;
    
    // Calculate crypto quantity from USDT position size
    const cryptoQuantity = positionSizeUSDT / entryPrice;
    
    // Calculate notional values (in USDT)
    const entryNotional = positionSizeUSDT; // Position size is already in USDT
    const exitNotional = exitPrice * cryptoQuantity;
    
    // Calculate fees for both entry and exit
    const entryFee = entryNotional * MEXC_SPOT_FEE_RATE;
    const exitFee = exitNotional * MEXC_SPOT_FEE_RATE;
    
    // Total fees
    const totalFees = entryFee + exitFee;
    
    return {
      entryFee: parseFloat(entryFee.toFixed(2)),
      exitFee: parseFloat(exitFee.toFixed(2)),
      totalFees: parseFloat(totalFees.toFixed(2))
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.symbol.trim()) {
      setMessage('Symbol is required');
      return;
    }
    
    if (!formData.entryPrice || isNaN(parseFloat(formData.entryPrice))) {
      setMessage('Valid entry price is required');
      return;
    }
    
    if (!formData.exitPrice || isNaN(parseFloat(formData.exitPrice))) {
      setMessage('Valid exit price is required');
      return;
    }
    
    if (!formData.positionSize || isNaN(parseFloat(formData.positionSize)) || parseFloat(formData.positionSize) <= 0) {
      setMessage('Valid position size is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Parse all numeric inputs
      const entryPrice = parseFloat(formData.entryPrice);
      const exitPrice = parseFloat(formData.exitPrice);
      const stopLoss = parseFloat(formData.stopLoss) || 0;
      const takeProfit = parseFloat(formData.takeProfit) || 0;
      const positionSize = parseFloat(formData.positionSize);
      const leverage = parseFloat(formData.leverage) || 1;
      const positionType = formData.positionType;
      
      // Auto-calculate MEXC fees
      const mexcFees = calculateMEXCFees(entryPrice, exitPrice, positionSize, leverage);
      const fees = mexcFees.totalFees;
      
      // Professional PnL calculation with USDT base
      const rawPnL = positionType === 'Long'
        ? (exitPrice - entryPrice)
        : (entryPrice - exitPrice);
      
      // Calculate quantity of crypto based on USDT position size
      const cryptoQuantity = positionSize / entryPrice;
      const pnl = (rawPnL * cryptoQuantity * leverage) - fees;
      
      // Auto-calculate derived values
      const amountInvested = positionSize; // Position size is already in USDT
      const roi = (pnl / amountInvested) * 100;
      const tradeResult = pnl >= 0 ? 'Win' : 'Loss';
      
      // Risk-Reward Ratio calculation (matches TradingView)
      let rr = null;
      if (stopLoss && takeProfit) {
        // Calculate risk and reward as absolute values
        const risk = Math.abs(positionType === 'Long'
          ? (entryPrice - stopLoss)
          : (stopLoss - entryPrice));
        
        const reward = Math.abs(positionType === 'Long'
          ? (takeProfit - entryPrice)
          : (entryPrice - takeProfit));
        
        // RR = Reward / Risk (before fees, like TradingView)
        rr = risk > 0 ? reward / risk : 0;
      }
      
      const tradeData = {
        symbol: formData.symbol.trim().toUpperCase(),
        pnl: parseFloat(pnl.toFixed(2)),
        rr: rr ? parseFloat(rr.toFixed(2)) : null,
        roi: parseFloat(roi.toFixed(2)),
        entryPrice: entryPrice,
        exitPrice: exitPrice,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
        positionSize: positionSize, // Now in USDT
        cryptoQuantity: parseFloat(cryptoQuantity.toFixed(8)), // Actual crypto amount
        leverage: leverage,
        positionType: positionType,
        fees: fees,
        entryFee: mexcFees.entryFee,
        exitFee: mexcFees.exitFee,
        exchange: formData.exchange,
        baseCurrency: formData.baseCurrency,
        amountInvested: parseFloat(amountInvested.toFixed(2)),
        tradeResult: tradeResult
      };

      const response = await axios.post(`${API_CONFIG.BASE_URL}/api/add_trade`, tradeData);
      
      // Clear form
      setFormData({ 
        symbol: '', 
        entryPrice: '', 
        exitPrice: '', 
        stopLoss: '',
        takeProfit: '',
        positionSize: '',
        leverage: '1',
        positionType: 'Long', 
        fees: '0',
        exchange: 'MEXC',
        baseCurrency: 'USDT'
      });
      setMessage('Trade added successfully!');
      
      // Show success message
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error adding trade:', error);
      setMessage('Error adding trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-3">Add New Trade</h1>
            <p className="text-slate-400 text-lg">
              Track your crypto trading performance for {new Date().toLocaleDateString()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="symbol" className="block text-sm font-semibold text-slate-300 mb-3">
                Symbol *
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g., BTC, ETH, SOL"
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                required
              />
            </div>

        <div>
          <label htmlFor="entryPrice" className="block text-sm font-semibold text-slate-300 mb-3">
            Entry Price *
          </label>
          <input
            type="number"
            id="entryPrice"
            name="entryPrice"
            value={formData.entryPrice}
            onChange={handleChange}
            placeholder="e.g., 0.15297 or 45000.50"
            step="0.00001"
            min="0"
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="exitPrice" className="block text-sm font-semibold text-slate-300 mb-3">
            Exit Price *
          </label>
          <input
            type="number"
            id="exitPrice"
            name="exitPrice"
            value={formData.exitPrice}
            onChange={handleChange}
            placeholder="e.g., 0.15297 or 46500.75"
            step="0.00001"
            min="0"
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="positionSize" className="block text-sm font-semibold text-slate-300 mb-3">
            Position Size (USDT) *
          </label>
          <input
            type="number"
            id="positionSize"
            name="positionSize"
            value={formData.positionSize}
            onChange={handleChange}
            placeholder="e.g., 1000 (for $1000 USDT)"
            step="0.01"
            min="0"
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="leverage" className="block text-sm font-semibold text-slate-300 mb-3">
            Leverage
          </label>
          <input
            type="number"
            id="leverage"
            name="leverage"
            value={formData.leverage}
            onChange={handleChange}
            placeholder="e.g., 1 (no leverage)"
            step="0.1"
            min="1"
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
          />
        </div>

        <div>
          <label htmlFor="stopLoss" className="block text-sm font-semibold text-slate-300 mb-3">
            Stop Loss
          </label>
          <input
            type="number"
            id="stopLoss"
            name="stopLoss"
            value={formData.stopLoss}
            onChange={handleChange}
            placeholder="e.g., 0.15297 or 44000.00"
            step="0.00001"
            min="0"
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
          />
          <p className="text-xs text-slate-400 mt-2">
            Used for Risk-Reward calculation (before fees)
          </p>
        </div>

        <div>
          <label htmlFor="takeProfit" className="block text-sm font-semibold text-slate-300 mb-3">
            Take Profit
          </label>
          <input
            type="number"
            id="takeProfit"
            name="takeProfit"
            value={formData.takeProfit}
            onChange={handleChange}
            placeholder="e.g., 0.15297 or 47000.00"
            step="0.00001"
            min="0"
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
          />
          <p className="text-xs text-slate-400 mt-2">
            Used for Risk-Reward calculation (before fees)
          </p>
        </div>

        <div>
          <label htmlFor="fees" className="block text-sm font-semibold text-slate-300 mb-3">
            Fees (Auto-calculated for MEXC)
          </label>
          <input
            type="number"
            id="fees"
            name="fees"
            value={formData.fees}
            onChange={handleChange}
            placeholder="Auto-calculated: 0.2% per trade"
            step="0.01"
            min="0"
            disabled
            className="w-full px-4 py-4 bg-slate-600/50 border border-slate-500/50 rounded-xl text-slate-400 placeholder-slate-500 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-2">
            MEXC fees: 0.2% on entry + 0.2% on exit = 0.4% total
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            Position Type *
          </label>
          <div className="flex space-x-8">
            <label className="flex items-center group cursor-pointer">
              <input
                type="radio"
                name="positionType"
                value="Long"
                checked={formData.positionType === 'Long'}
                onChange={handleChange}
                className="mr-3 text-green-500 focus:ring-green-500 focus:ring-2"
              />
              <span className="text-slate-200 group-hover:text-green-400 transition-colors duration-300">Long</span>
            </label>
            <label className="flex items-center group cursor-pointer">
              <input
                type="radio"
                name="positionType"
                value="Short"
                checked={formData.positionType === 'Short'}
                onChange={handleChange}
                className="mr-3 text-red-500 focus:ring-red-500 focus:ring-2"
              />
              <span className="text-slate-200 group-hover:text-red-400 transition-colors duration-300">Short</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-slate-300 mb-3">
            Trade Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add notes about this trade (strategy, market conditions, etc.)"
            rows="3"
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm resize-none"
          />
        </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Adding Trade...
                </div>
              ) : (
                'Add Trade'
              )}
            </button>

            {message && (
              <div className={`text-sm p-4 rounded-xl font-medium ${
                message.includes('successfully') 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {message}
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};

export default AddTrade;
