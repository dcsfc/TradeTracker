/**
 * Dashboard Service - Professional Data Preloading
 * Preloads dashboard data immediately when the app starts
 * Similar to preloadService for AI Prediction
 */

import axios from 'axios';
import { API_CONFIG } from '../constants/config';

class DashboardService {
  constructor() {
    this.cache = new Map();
    this.preloadPromise = null;
    this.isPreloading = false;
    this.statsCache = new Map();
  }

  /**
   * Start preloading dashboard data immediately
   * This runs as soon as the app starts, not when user navigates
   */
  startPreloading() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('🚀 Starting dashboard data preload...');
    
    // Start preloading immediately
    this.preloadPromise = this.preloadDashboardData();
    
    return this.preloadPromise;
  }

  /**
   * Preload dashboard stats data with fast timeout
   */
  async preloadDashboardData() {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      
      // Preload multiple dashboard endpoints in parallel
      const endpoints = [
        { url: `${baseUrl}/api/stats`, key: 'stats_all' },
        { url: `${baseUrl}/api/stats?symbol=BTC`, key: 'stats_btc' },
        { url: `${baseUrl}/api/stats?symbol=ETH`, key: 'stats_eth' },
        { url: `${baseUrl}/api/stats?all_time=true`, key: 'stats_all_time' }
      ];

      const promises = endpoints.map(async ({ url, key }) => {
        try {
          const response = await axios.get(url, {
            timeout: API_CONFIG.FAST_TIMEOUT, // 8 seconds
            headers: {
              'X-Preload': 'true' // Signal to backend this is a preload request
            }
          });
          
          // Cache the data
          this.statsCache.set(key, {
            data: response.data,
            timestamp: Date.now(),
            source: 'preload'
          });
          
          console.log(`✅ Dashboard ${key} preloaded successfully`);
          return { key, success: true };
        } catch (error) {
          console.warn(`⚠️ Dashboard ${key} preload failed:`, error.message);
          return { key, success: false, error: error.message };
        }
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      
      console.log(`✅ Dashboard preload completed: ${successful}/${endpoints.length} successful`);
      return results;
      
    } catch (error) {
      console.warn('⚠️ Dashboard preload failed:', error.message);
      return null;
    }
  }

  /**
   * Get cached dashboard data if available
   */
  getCachedStats(symbol = 'All', timeFilter = 'Today') {
    let cacheKey = 'stats_all';
    
    if (symbol !== 'All') {
      cacheKey = `stats_${symbol.toLowerCase()}`;
    } else if (timeFilter === 'All') {
      cacheKey = 'stats_all_time';
    }
    
    const cached = this.statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < API_CONFIG.CACHE_TTL * 1000) {
      return cached.data;
    }
    return null;
  }

  /**
   * Get cached data for any key
   */
  getCachedData(key) {
    const cached = this.statsCache.get(key);
    if (cached && Date.now() - cached.timestamp < API_CONFIG.CACHE_TTL * 1000) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache new data
   */
  setCachedData(key, data, ttl = API_CONFIG.CACHE_TTL) {
    this.statsCache.set(key, {
      data,
      timestamp: Date.now(),
      source: 'manual'
    });
  }

  /**
   * Check if preload is complete
   */
  isPreloadComplete() {
    return this.preloadPromise && this.preloadPromise.then;
  }

  /**
   * Wait for preload to complete
   */
  async waitForPreload() {
    if (this.preloadPromise) {
      return await this.preloadPromise;
    }
    return null;
  }

  /**
   * Fetch dashboard data with caching
   */
  async fetchDashboardData(symbol = 'All', timeFilter = 'Today', useCache = true) {
    // Check cache first if enabled
    if (useCache) {
      const cached = this.getCachedStats(symbol, timeFilter);
      if (cached) {
        console.log('🎯 Dashboard cache HIT');
        return cached;
      }
    }

    console.log('🔄 Dashboard cache MISS - fetching fresh data');
    
    try {
      // Build URL with filters
      let url = `${API_CONFIG.BASE_URL}/api/stats`;
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

      const response = await axios.get(url, {
        timeout: API_CONFIG.FAST_TIMEOUT
      });

      const data = response.data;
      
      // Cache the response
      const cacheKey = symbol !== 'All' ? `stats_${symbol.toLowerCase()}` : 
                      timeFilter === 'All' ? 'stats_all_time' : 'stats_all';
      this.setCachedData(cacheKey, data);
      
      return data;
      
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      throw error;
    }
  }

  /**
   * Get available symbols from cached data
   */
  getAvailableSymbols() {
    const cached = this.getCachedData('stats_all');
    if (cached && cached.trades) {
      const symbols = new Set(cached.trades.map(trade => trade.symbol));
      return ['All', ...Array.from(symbols)];
    }
    return ['All'];
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    this.statsCache.clear();
    this.preloadPromise = null;
    this.isPreloading = false;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      statsCacheSize: this.statsCache.size,
      isPreloading: this.isPreloading,
      preloadComplete: this.isPreloadComplete(),
      cacheKeys: Array.from(this.statsCache.keys())
    };
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// Auto-start preloading when this module is imported
if (typeof window !== 'undefined') {
  // Only start preloading in browser environment
  dashboardService.startPreloading();
}
