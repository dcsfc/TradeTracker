import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * TrendingCoins Component
 * Displays top trending cryptocurrencies with progress bars
 */
const TrendingCoins = ({ topCoins }) => {
  const maxMentions = useMemo(() => 
    topCoins && topCoins.length > 0 
      ? Math.max(...topCoins.map(c => c.mentions))
      : 0,
    [topCoins]
  );

  if (!topCoins || topCoins.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 shadow-xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
        <h2 className="text-xl font-bold text-slate-100 mb-6 uppercase tracking-wide">Trending Coins</h2>
        <div className="text-sm text-slate-500 text-center py-12 font-medium">
          No trending data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 shadow-xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
      <h2 className="text-xl font-bold text-slate-100 mb-6 uppercase tracking-wide">Trending Coins</h2>
      <div className="space-y-4">
        {topCoins.slice(0, 5).map((coin, index) => {
          const percentage = maxMentions > 0 ? (coin.mentions / maxMentions) * 100 : 0;
          
          return (
            <div key={index} className="space-y-2 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-base font-bold text-slate-100">{coin.coin}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-200">
                    {coin.mentions}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">mentions</div>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

TrendingCoins.propTypes = {
  topCoins: PropTypes.arrayOf(PropTypes.shape({
    coin: PropTypes.string,
    mentions: PropTypes.number,
  })),
};

export default memo(TrendingCoins);
