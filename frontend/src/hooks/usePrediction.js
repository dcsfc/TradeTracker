import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../constants/config';
import { preloadService } from '../services/preloadService';

// Cache for storing prediction data
const predictionCache = new Map();
const CACHE_KEY = 'ai_prediction_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for AI prediction data fetching with advanced optimizations
 * Features: Progressive loading, caching, optimistic UI, faster timeouts
 */
export const usePrediction = (useEnhanced = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const abortControllerRef = useRef(null);

  // Load cached data immediately for faster initial render
  const loadCachedData = useCallback(async () => {
    // First try preload service cache
    const preloadedData = preloadService.getCachedData();
    if (preloadedData) {
      setData(preloadedData);
      setLoading(false);
      return true;
    }
    
    // Then try local cache
    const cached = predictionCache.get(CACHE_KEY);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data);
      setLoading(false);
      return true;
    }
    
    // If preload is still in progress, wait for it
    if (preloadService.isPreloading) {
      try {
        const preloadedData = await preloadService.waitForPreload();
        if (preloadedData) {
          setData(preloadedData);
          setLoading(false);
          return true;
        }
      } catch (error) {
        console.warn('Preload service failed:', error);
      }
    }
    
    return false;
  }, []);

  const fetchPrediction = useCallback(async (isRefresh = false) => {
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

      const endpoint = useEnhanced 
        ? `${API_CONFIG.BASE_URL}/api/market-prediction/enhanced`
        : `${API_CONFIG.BASE_URL}/api/market-prediction`;

      // Progressive loading: Try fast timeout first, then fallback
      const fastTimeout = 8000; // 8 seconds for initial load
      const response = await axios.get(endpoint, {
        timeout: isRefresh ? API_CONFIG.TIMEOUT : fastTimeout,
        signal: abortControllerRef.current.signal
      });
      
      const responseData = response.data;
      setData(responseData);
      
      // Cache the successful response
      predictionCache.set(CACHE_KEY, {
        data: responseData,
        timestamp: Date.now()
      });
      
      setIsStale(false);
      
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('Error fetching prediction:', error);
      
      // If enhanced endpoint fails with 404, try legacy endpoint
      if (useEnhanced && error.response?.status === 404) {
        try {
          const response = await axios.get(`${API_CONFIG.BASE_URL}/api/market-prediction`, {
            timeout: API_CONFIG.TIMEOUT,
            signal: abortControllerRef.current.signal
          });
          setData(response.data);
          return;
        } catch (legacyError) {
          console.error('Legacy endpoint also failed:', legacyError);
        }
      }
      
      // Only show error if we don't have cached data
      if (!data) {
        setError('Failed to load AI predictions. Make sure the backend is running.');
        setData({
          summary: "AI market analysis temporarily unavailable. Please try again later.",
          prediction: "Neutral",
          confidence: 0.5,
          sentiment_score: 0,
          articles: [],
          articles_analyzed: 0,
          positive_pct: 33,
          negative_pct: 33,
          neutral_pct: 34,
          top_coins: [],
          mock: true,
          last_updated: new Date().toISOString(),
          current_price: 65000,
          price_change_24h: 2.5,
          price_change_7d: 5.8
        });
      } else {
        // If we have cached data, mark it as stale but don't show error
        setIsStale(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [useEnhanced, data]);

  useEffect(() => {
    // Try to load cached data first for instant display
    const hasCachedData = loadCachedData();
    
    // If no cached data, fetch immediately
    if (!hasCachedData) {
      fetchPrediction();
    }
    
    // Set up auto-refresh with longer interval (30 minutes instead of 15)
    const interval = setInterval(() => {
      fetchPrediction(true);
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => {
      clearInterval(interval);
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPrediction, loadCachedData]);

  return {
    data,
    loading,
    error,
    refreshing,
    isStale,
    fetchPrediction
  };
};
