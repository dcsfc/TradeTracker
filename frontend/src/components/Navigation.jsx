import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-trading-card border-b border-trading-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-trading-green to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📈</span>
              </div>
              <span className="text-xl font-bold text-trading-text">Crypto Tracker</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/')
                  ? 'bg-trading-green text-white'
                  : 'text-trading-text-secondary hover:text-trading-text hover:bg-trading-dark'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/add-trade"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/add-trade')
                  ? 'bg-trading-green text-white'
                  : 'text-trading-text-secondary hover:text-trading-text hover:bg-trading-dark'
              }`}
            >
              ➕ Add Trade
            </Link>
            <Link
              to="/ai-prediction"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/ai-prediction')
                  ? 'bg-trading-green text-white'
                  : 'text-trading-text-secondary hover:text-trading-text hover:bg-trading-dark'
              }`}
            >
              🤖 AI Prediction
            </Link>
            <Link
              to="/breakout-strategy"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/breakout-strategy')
                  ? 'bg-trading-green text-white'
                  : 'text-trading-text-secondary hover:text-trading-text hover:bg-trading-dark'
              }`}
            >
              📈 Breakout Strategy
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
