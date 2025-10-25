/**
 * Chart Data Generation Utility
 * Generates mock chart data based on price trends
 */

/**
 * Generate chart data based on current price and changes
 * @param {number} currentPrice - Current price
 * @param {number} change24h - 24h price change percentage
 * @param {number} change7d - 7d price change percentage
 * @param {string} timeRange - Time range ('24H', '7D', '30D')
 * @returns {Array} Array of chart data points
 */
export const generateChartData = (currentPrice, change24h, change7d, timeRange) => {
  const data = [];
  const hours = timeRange === '24H' ? 24 : timeRange === '7D' ? 168 : 720;
  const interval = timeRange === '24H' ? 1 : timeRange === '7D' ? 4 : 24;
  
  for (let i = 0; i <= hours; i += interval) {
    const randomVariation = (Math.random() - 0.5) * 1000;
    const trendFactor = timeRange === '24H' ? change24h : change7d;
    const trendValue = currentPrice * (1 + (trendFactor / 100) * (i / hours));
    data.push({
      time: i,
      price: Math.max(0, trendValue + randomVariation),
      volume: Math.random() * 1000000000
    });
  }
  return data;
};

/**
 * Generate sparkline data for small charts
 * @param {number} currentValue - Current value
 * @param {number} points - Number of data points
 * @returns {Array} Array of sparkline values
 */
export const generateSparklineData = (currentValue, points = 7) => {
  const data = [];
  const baseValue = currentValue || 0.5;
  
  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.5) * 0.2;
    const value = Math.max(0, Math.min(1, baseValue + variation));
    data.push(value);
  }
  
  return data;
};
