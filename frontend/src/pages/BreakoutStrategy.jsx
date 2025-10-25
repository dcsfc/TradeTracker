import { useState, useEffect } from 'react';

const BreakoutStrategy = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [breakoutSignals, setBreakoutSignals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const timeframes = [
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ];

  const assets = [
    { value: 'BTC', label: 'Bitcoin', symbol: 'BTC' },
    { value: 'ETH', label: 'Ethereum', symbol: 'ETH' },
    { value: 'BNB', label: 'Binance Coin', symbol: 'BNB' },
    { value: 'ADA', label: 'Cardano', symbol: 'ADA' },
    { value: 'SOL', label: 'Solana', symbol: 'SOL' },
  ];

  // Mock breakout signals data
  const mockBreakoutSignals = [
    {
      id: 1,
      asset: 'BTC',
      timeframe: '1h',
      type: 'bullish',
      price: 45230.50,
      resistance: 45100,
      support: 44800,
      volume: 1250000,
      strength: 'strong',
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      asset: 'ETH',
      timeframe: '4h',
      type: 'bearish',
      price: 2850.75,
      resistance: 2900,
      support: 2800,
      volume: 850000,
      strength: 'medium',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      asset: 'SOL',
      timeframe: '1d',
      type: 'bullish',
      price: 98.45,
      resistance: 95,
      support: 92,
      volume: 450000,
      strength: 'strong',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  useEffect(() => {
    // Simulate loading breakout signals
    setIsLoading(true);
    setTimeout(() => {
      setBreakoutSignals(mockBreakoutSignals);
      setIsLoading(false);
    }, 1000);
  }, [selectedTimeframe, selectedAsset]);

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'strong':
        return 'text-green-400 bg-green-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'weak':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeColor = (type) => {
    return type === 'bullish' 
      ? 'text-green-400 bg-green-400/20' 
      : 'text-red-400 bg-red-400/20';
  };

  return (
    <div className="min-h-screen bg-trading-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-trading-text mb-2">
            Breakout Strategy Analysis
          </h1>
          <p className="text-trading-text-secondary">
            Identify and analyze breakout patterns across different timeframes and assets
          </p>
        </div>

        {/* Controls */}
        <div className="bg-trading-card rounded-xl p-6 mb-8 border border-trading-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeframe Selection */}
            <div>
              <label className="block text-sm font-medium text-trading-text mb-3">
                Timeframe
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTimeframe === tf.value
                        ? 'bg-trading-green text-white'
                        : 'bg-trading-dark text-trading-text-secondary hover:bg-trading-border hover:text-trading-text'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-medium text-trading-text mb-3">
                Asset
              </label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full px-4 py-2 bg-trading-dark border border-trading-border rounded-lg text-trading-text focus:outline-none focus:ring-2 focus:ring-trading-green"
              >
                {assets.map((asset) => (
                  <option key={asset.value} value={asset.value}>
                    {asset.label} ({asset.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Breakout Signals */}
        <div className="bg-trading-card rounded-xl border border-trading-border">
          <div className="p-6 border-b border-trading-border">
            <h2 className="text-xl font-semibold text-trading-text">
              Active Breakout Signals
            </h2>
            <p className="text-trading-text-secondary text-sm mt-1">
              Real-time breakout pattern detection
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-trading-green"></div>
              <p className="text-trading-text-secondary mt-4">Analyzing breakout patterns...</p>
            </div>
          ) : (
            <div className="p-6">
              {breakoutSignals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-trading-text mb-2">
                    No Breakout Signals Found
                  </h3>
                  <p className="text-trading-text-secondary">
                    Try adjusting the timeframe or asset selection
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {breakoutSignals.map((signal) => (
                    <div
                      key={signal.id}
                      className="bg-trading-dark rounded-lg p-6 border border-trading-border hover:border-trading-green/30 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold text-trading-text">
                            {signal.asset}
                          </div>
                          <div className="text-sm text-trading-text-secondary">
                            {signal.timeframe}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(signal.type)}`}>
                            {signal.type.toUpperCase()}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStrengthColor(signal.strength)}`}>
                            {signal.strength.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-trading-text">
                            ${signal.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-trading-text-secondary">
                            {new Date(signal.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-trading-card rounded-lg p-4">
                          <div className="text-sm text-trading-text-secondary mb-1">
                            Resistance Level
                          </div>
                          <div className="text-lg font-semibold text-red-400">
                            ${signal.resistance.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-trading-card rounded-lg p-4">
                          <div className="text-sm text-trading-text-secondary mb-1">
                            Support Level
                          </div>
                          <div className="text-lg font-semibold text-green-400">
                            ${signal.support.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-trading-card rounded-lg p-4">
                          <div className="text-sm text-trading-text-secondary mb-1">
                            24h Volume
                          </div>
                          <div className="text-lg font-semibold text-trading-text">
                            ${(signal.volume / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Strategy Information */}
        <div className="mt-8 bg-trading-card rounded-xl p-6 border border-trading-border">
          <h3 className="text-lg font-semibold text-trading-text mb-4">
            Breakout Strategy Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-trading-text mb-2">Bullish Breakout</h4>
              <ul className="text-sm text-trading-text-secondary space-y-1">
                <li>• Price breaks above resistance with high volume</li>
                <li>• Look for confirmation with follow-through</li>
                <li>• Set stop-loss below the breakout level</li>
                <li>• Target next resistance level</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-trading-text mb-2">Bearish Breakout</h4>
              <ul className="text-sm text-trading-text-secondary space-y-1">
                <li>• Price breaks below support with high volume</li>
                <li>• Confirm with increased selling pressure</li>
                <li>• Set stop-loss above the breakdown level</li>
                <li>• Target next support level</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakoutStrategy;
