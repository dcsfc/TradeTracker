import { memo } from 'react';

/**
 * Sparkline Component
 * Small inline chart for displaying trends
 */
const Sparkline = ({ data, color = '#10b981' }) => {
  if (!data || data.length === 0) return null;
  
  const width = 100;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

export default memo(Sparkline);
