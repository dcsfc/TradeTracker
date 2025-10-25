import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService } from '../services/dashboardService';
import { API_CONFIG } from '../constants/config';

/**
 * Custom hook for dashboard data fetching with advanced optimizations
 * Features: Preloading, caching, optimistic UI, faster timeouts
 */
export const useDashboard = (symbol = 'All', timeFilter = 'Today') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [availableSymbols, setAvailableSymbols] = useState(['All']);
  const abortControllerRef = useRef(null);

  // Load cached data immediately for faster initial render
  const loadCachedData = useCallback(async () => {
    // First try dashboard service cache
    const preloadedData = dashboardService.getCachedStats(symbol, timeFilter);
    if (preloadedData) {
      setData(preloadedData);
      setLoading(false);
      setAvailableSymbols(dashboardService.getAvailableSymbols());
      return true;
    }
    
    // If preload is still in progress, wait for it
    if (dashboardService.isPreloading) {
      try {
        const preloadedData = await dashboardService.waitForPreload();
        if (preloadedData) {
          // Try to get data after preload completes
          const cachedData = dashboardService.getCachedStats(symbol, timeFilter);
          if (cachedData) {
            setData(cachedData);
            setLoading(false);
            setAvailableSymbols(dashboardService.getAvailableSymbols());
            return true;
          }
        }
      } catch (error) {
        console.warn('Dashboard preload service failed:', error);
      }
    }
    
    return false;
  }, [symbol, timeFilter]);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      // Use dashboard service for fetching with caching
      const responseData = await dashboardService.fetchDashboardData(
        symbol, 
        timeFilter, 
        !isRefresh // Use cache unless it's a refresh
      );
      
      setData(responseData);
      setAvailableSymbols(dashboardService.getAvailableSymbols());
      setIsStale(false);
      
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('Error fetching dashboard data:', error);
      
      // Only show error if we don't have cached data
      if (!data) {
        setError('Failed to load dashboard data. Make sure the backend is running.');
        setData({
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
          trades: [],
          mock: true
        });
      } else {
        // If we have cached data, mark it as stale but don't show error
        setIsStale(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [symbol, timeFilter, data]);

  useEffect(() => {
    // Try to load cached data first for instant display
    const hasCachedData = loadCachedData();
    
    // If no cached data, fetch immediately
    if (!hasCachedData) {
      fetchDashboardData();
    }
    
    return () => {
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDashboardData, loadCachedData]);

  // Update data when symbol or timeFilter changes
  useEffect(() => {
    if (data) {
      fetchDashboardData();
    }
  }, [symbol, timeFilter]);

  return {
    data,
    loading,
    error,
    refreshing,
    isStale,
    availableSymbols,
    fetchDashboardData
  };
};

/**
 * Hook for dashboard statistics with caching
 */
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0,
    averageROI: 0,
    averageRR: 0
  });
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback((trades) => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averageROI: 0,
        averageRR: 0
      };
    }

    const totalTrades = trades.length;
    const wins = trades.filter(trade => trade.pnl > 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const validROIs = trades.filter(trade => trade.roi !== null && trade.roi !== undefined);
    const averageROI = validROIs.length > 0 
      ? validROIs.reduce((sum, trade) => sum + trade.roi, 0) / validROIs.length 
      : 0;
    
    const validRRs = trades.filter(trade => trade.rr !== null && trade.rr !== undefined);
    const averageRR = validRRs.length > 0 
      ? validRRs.reduce((sum, trade) => sum + trade.rr, 0) / validRRs.length 
      : 0;

    return {
      totalTrades,
      winRate,
      totalPnL,
      averageROI,
      averageRR
    };
  }, []);

  return {
    stats,
    loading,
    calculateStats,
    setStats
  };
};

/**
 * Hook for dashboard performance monitoring
 */
export const useDashboardPerformance = () => {
  const [performance, setPerformance] = useState({
    loadTime: 0,
    cacheHitRate: 0,
    dataFreshness: 0
  });

  const updatePerformance = useCallback((loadTime, cacheHit, isStale) => {
    setPerformance({
      loadTime,
      cacheHitRate: cacheHit ? 100 : 0,
      dataFreshness: isStale ? 0 : 100
    });
  }, []);

  return {
    performance,
    updatePerformance
  };
};

export default useDashboard;
