/**
 * Insights Generation Utility
 * Generates actionable insights from market data
 */

/**
 * Generate actionable insights from market data
 * @param {Object} data - Market data object
 * @returns {Array} Array of insight objects
 */
export const generateActionableInsights = (data) => {
  const insights = [];
  
  if (!data) return insights;
  
  // RSI-based insights
  if (data.technical_signals?.rsi) {
    const rsi = data.technical_signals.rsi;
    if (rsi > 70) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Overbought Territory',
        message: `RSI at ${rsi.toFixed(1)} - Price may face resistance`,
        color: 'border-orange-500/30 bg-orange-500/10'
      });
    } else if (rsi < 30) {
      insights.push({
        type: 'opportunity',
        icon: '💡',
        title: 'Oversold Territory',
        message: `RSI at ${rsi.toFixed(1)} - Potential buying opportunity`,
        color: 'border-blue-500/30 bg-blue-500/10'
      });
    }
  }
  
  // Whale activity insights
  if (data.whale_activity?.sentiment === 'accumulating') {
    insights.push({
      type: 'bullish',
      icon: '🐋',
      title: 'Whale Accumulation Detected',
      message: `${data.whale_activity.transactions} large transactions - Bullish signal`,
      color: 'border-emerald-500/30 bg-emerald-500/10'
    });
  } else if (data.whale_activity?.sentiment === 'distributing') {
    insights.push({
      type: 'bearish',
      icon: '🐋',
      title: 'Whale Distribution Detected',
      message: `${data.whale_activity.transactions} large transactions - Caution advised`,
      color: 'border-rose-500/30 bg-rose-500/10'
    });
  }
  
  // Price momentum insights
  if (data.price_change_24h > 5) {
    insights.push({
      type: 'bullish',
      icon: '📈',
      title: 'Strong Upward Momentum',
      message: `+${data.price_change_24h.toFixed(2)}% in 24h - Consider taking profit`,
      color: 'border-emerald-500/30 bg-emerald-500/10'
    });
  } else if (data.price_change_24h < -5) {
    insights.push({
      type: 'bearish',
      icon: '📉',
      title: 'Sharp Decline',
      message: `${data.price_change_24h.toFixed(2)}% in 24h - Monitor support levels`,
      color: 'border-rose-500/30 bg-rose-500/10'
    });
  }
  
  // Sentiment insights
  if (data.sentiment_score > 0.5) {
    insights.push({
      type: 'bullish',
      icon: '😊',
      title: 'Very Positive Sentiment',
      message: `${data.positive_pct?.toFixed(0)}% positive news - Market optimism high`,
      color: 'border-emerald-500/30 bg-emerald-500/10'
    });
  } else if (data.sentiment_score < -0.5) {
    insights.push({
      type: 'bearish',
      icon: '😰',
      title: 'Negative Sentiment',
      message: `${data.negative_pct?.toFixed(0)}% negative news - Market fear detected`,
      color: 'border-rose-500/30 bg-rose-500/10'
    });
  }
  
  return insights.slice(0, 3); // Show max 3 insights
};

/**
 * Get sentiment-based text color class
 * @param {string} prediction - Sentiment prediction
 * @returns {string} Tailwind color class
 */
export const getSentimentColor = (prediction) => {
  const pred = prediction?.toLowerCase() || '';
  if (pred.includes('bullish')) return 'text-emerald-400';
  if (pred.includes('bearish')) return 'text-rose-400';
  return 'text-slate-400';
};

/**
 * Get sentiment-based background and border classes
 * @param {string} prediction - Sentiment prediction
 * @returns {string} Tailwind classes
 */
export const getSentimentBg = (prediction) => {
  const pred = prediction?.toLowerCase() || '';
  if (pred.includes('bullish')) return 'bg-emerald-500/10 border-emerald-500/30';
  if (pred.includes('bearish')) return 'bg-rose-500/10 border-rose-500/30';
  return 'bg-slate-700/50 border-slate-600/50';
};

/**
 * Get confidence-based color class
 * @param {number} confidence - Confidence value (0-1)
 * @returns {string} Tailwind color class
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.8) return 'bg-emerald-500';
  if (confidence >= 0.6) return 'bg-blue-500';
  return 'bg-orange-500';
};
