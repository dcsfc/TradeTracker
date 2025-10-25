/**
 * Style Helper Functions
 * Centralized style and color utilities
 */

/**
 * Get sentiment-based color scheme
 * @param {string} prediction - Sentiment prediction
 * @param {string} type - Color type ('text', 'bg', 'border')
 * @returns {string} Tailwind class
 */
export const getColorScheme = (prediction, type = 'text') => {
  const colors = {
    bullish: { 
      text: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/30' 
    },
    bearish: { 
      text: 'text-rose-400', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/30' 
    },
    neutral: { 
      text: 'text-slate-400', 
      bg: 'bg-slate-700/50', 
      border: 'border-slate-600/50' 
    },
  };

  const sentiment = prediction?.toLowerCase().includes('bullish') ? 'bullish'
    : prediction?.toLowerCase().includes('bearish') ? 'bearish'
    : 'neutral';

  return colors[sentiment][type];
};

/**
 * Get confidence-based progress bar color
 * @param {number} confidence - Confidence value (0-1)
 * @returns {string} Tailwind color class
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return 'bg-emerald-500';
  if (confidence >= 0.6) return 'bg-blue-500';
  return 'bg-orange-500';
};

/**
 * Get price change color based on value
 * @param {number} change - Price change value
 * @returns {string} Tailwind color class
 */
export const getPriceChangeColor = (change) => {
  if (change > 0) return 'text-emerald-400';
  if (change < 0) return 'text-rose-400';
  return 'text-slate-400';
};

/**
 * Get insight type color scheme
 * @param {string} type - Insight type
 * @returns {string} Tailwind classes
 */
export const getInsightColor = (type) => {
  const colors = {
    bullish: 'border-emerald-500/30 bg-emerald-500/10',
    bearish: 'border-rose-500/30 bg-rose-500/10',
    warning: 'border-orange-500/30 bg-orange-500/10',
    opportunity: 'border-blue-500/30 bg-blue-500/10',
  };
  
  return colors[type] || 'border-slate-500/30 bg-slate-500/10';
};
