/**
 * Application Configuration Constants
 * Centralized configuration to eliminate magic numbers and improve maintainability
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutes in milliseconds (reduced frequency)
  CACHE_TTL: 300, // 5 minutes in seconds (faster cache refresh)
  TIMEOUT: 30000, // 30 seconds (fallback timeout)
  FAST_TIMEOUT: 8000, // 8 seconds for initial load
};

export const TIME_RANGES = ['24H', '7D', '30D'];

export const CHART_CONFIG = {
  colors: {
    primary: '#10b981',
    grid: '#334155',
    text: '#94a3b8',
    background: '#1e293b',
  },
  gradients: {
    price: {
      start: '#10b981',
      end: '#10b981',
      startOpacity: 0.3,
      endOpacity: 0,
    },
  },
  strokeWidth: 3,
  gridOpacity: 0.3,
};

export const SENTIMENT_TYPES = {
  BULLISH: 'bullish',
  BEARISH: 'bearish',
  NEUTRAL: 'neutral',
};

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0,
};

