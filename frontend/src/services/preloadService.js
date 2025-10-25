/**
 * Preload Service - Professional Data Preloading
 * Starts loading AI prediction data immediately when the app starts
 * This is what professional applications do for optimal UX
 */

import axios from 'axios';
import { API_CONFIG } from '../constants/config';

class PreloadService {
  constructor() {
    this.cache = new Map();
    this.preloadPromise = null;
    this.isPreloading = false;
  }

  /**
   * Start preloading AI prediction data immediately
   * This runs as soon as the app starts, not when user navigates
   */
  startPreloading() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('🚀 Starting AI prediction preload...');
    
    // Start preloading immediately
    this.preloadPromise = this.preloadAIPrediction();
    
    return this.preloadPromise;
  }

  /**
   * Preload AI prediction data with fast timeout
   */
  async preloadAIPrediction() {
    try {
      const endpoint = `${API_CONFIG.BASE_URL}/api/market-prediction/enhanced`;
      
      const response = await axios.get(endpoint, {
        timeout: API_CONFIG.FAST_TIMEOUT, // 8 seconds
        headers: {
          'X-Preload': 'true' // Signal to backend this is a preload request
        }
      });
      
      // Cache the data
      this.cache.set('ai_prediction', {
        data: response.data,
        timestamp: Date.now(),
        source: 'preload'
      });
      
      console.log('✅ AI prediction preloaded successfully');
      return response.data;
      
    } catch (error) {
      console.warn('⚠️ AI prediction preload failed:', error.message);
      
      // Try fallback endpoint
      try {
        const fallbackResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/market-prediction`, {
          timeout: API_CONFIG.FAST_TIMEOUT
        });
        
        this.cache.set('ai_prediction', {
          data: fallbackResponse.data,
          timestamp: Date.now(),
          source: 'preload_fallback'
        });
        
        console.log('✅ AI prediction preloaded via fallback');
        return fallbackResponse.data;
        
      } catch (fallbackError) {
        console.warn('⚠️ AI prediction preload completely failed');
        return null;
      }
    }
  }

  /**
   * Get cached data if available
   */
  getCachedData() {
    const cached = this.cache.get('ai_prediction');
    if (cached && Date.now() - cached.timestamp < API_CONFIG.CACHE_TTL * 1000) {
      return cached.data;
    }
    return null;
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
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    this.preloadPromise = null;
    this.isPreloading = false;
  }
}

// Export singleton instance
export const preloadService = new PreloadService();

// Auto-start preloading when this module is imported
if (typeof window !== 'undefined') {
  // Only start preloading in browser environment
  preloadService.startPreloading();
}

