/**
 * Formatter Utility Functions
 * Centralized formatting functions for currency, percentages, and dates
 */

/**
 * Format a number as USD currency
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (!value) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a number as percentage with sign
 * @param {number} value - The value to format
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value) => {
  if (value === undefined || value === null) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Format a timestamp as readable date string
 * @param {string|number} timestamp - The timestamp to format
 * @returns {string} Formatted date string
 */
export const formatLastUpdated = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Unknown';
  }
};

/**
 * Format a large number with K/M/B suffixes
 * @param {number} value - The value to format
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (value) => {
  if (!value) return '0';
  
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  
  return value.toString();
};
