import { useState, useEffect } from 'react';
import { preloadService } from '../../services/preloadService';
import { dashboardService } from '../../services/dashboardService';

/**
 * Cache Indicator - Shows cache status in dev mode
 * Professional UX pattern for monitoring cache performance
 */
const CacheIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    aiPrediction: { hits: 0, misses: 0, size: 0 },
    dashboard: { hits: 0, misses: 0, size: 0 }
  });

  // Only show in development mode
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    setIsVisible(isDev);
  }, []);

  // Update cache stats periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      const aiStats = preloadService.getCacheStats();
      const dashboardStats = dashboardService.getCacheStats();
      
      setCacheStats({
        aiPrediction: {
          hits: aiStats.hits || 0,
          misses: aiStats.misses || 0,
          size: aiStats.cacheSize || 0
        },
        dashboard: {
          hits: dashboardStats.hits || 0,
          misses: dashboardStats.misses || 0,
          size: dashboardStats.statsCacheSize || 0
        }
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getHitRate = (hits, misses) => {
    const total = hits + misses;
    return total > 0 ? Math.round((hits / total) * 100) : 0;
  };

  const aiHitRate = getHitRate(cacheStats.aiPrediction.hits, cacheStats.aiPrediction.misses);
  const dashboardHitRate = getHitRate(cacheStats.dashboard.hits, cacheStats.dashboard.misses);

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-200">Cache Status</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>
      
      {/* AI Prediction Cache */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-300">AI Prediction</span>
          <span className={`text-xs font-bold ${
            aiHitRate >= 70 ? 'text-green-400' : 
            aiHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {aiHitRate}%
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>H: {cacheStats.aiPrediction.hits}</span>
          <span>M: {cacheStats.aiPrediction.misses}</span>
          <span>S: {cacheStats.aiPrediction.size}</span>
        </div>
      </div>

      {/* Dashboard Cache */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-300">Dashboard</span>
          <span className={`text-xs font-bold ${
            dashboardHitRate >= 70 ? 'text-green-400' : 
            dashboardHitRate >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {dashboardHitRate}%
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>H: {cacheStats.dashboard.hits}</span>
          <span>M: {cacheStats.dashboard.misses}</span>
          <span>S: {cacheStats.dashboard.size}</span>
        </div>
      </div>

      {/* Performance Legend */}
      <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
        <div className="flex items-center justify-between">
          <span>H: Hits</span>
          <span>M: Misses</span>
          <span>S: Size</span>
        </div>
        <div className="mt-1 text-center">
          {aiHitRate >= 70 && dashboardHitRate >= 70 ? '🟢 Excellent' :
           aiHitRate >= 50 && dashboardHitRate >= 50 ? '🟡 Good' : '🔴 Needs Tuning'}
        </div>
      </div>
    </div>
  );
};

export default CacheIndicator;
