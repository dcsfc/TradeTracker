import { memo } from 'react';
import PropTypes from 'prop-types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { CHART_CONFIG } from '../../constants/config';

/**
 * PriceChart Component
 * Interactive price chart with time range filters
 */
const PriceChart = ({ data, timeRange, setTimeRange, chartData }) => {
  if (!data?.current_price) return null;

  return (
    <div className="mb-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl border border-slate-700 shadow-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Bitcoin Price</h3>
          <div className="flex items-baseline space-x-3">
            <div className="text-5xl font-bold text-slate-100">
              {formatCurrency(data.current_price)}
            </div>
            <div className={`text-2xl font-bold ${data.price_change_24h > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.price_change_24h > 0 ? '+' : ''}{data.price_change_24h?.toFixed(2)}%
            </div>
          </div>
        </div>
        
        {/* Time Range Filters */}
        <div className="flex space-x-2">
          {['24H', '7D', '30D'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                timeRange === range
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      {/* Interactive Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_CONFIG.gradients.price.start} stopOpacity={CHART_CONFIG.gradients.price.startOpacity}/>
                <stop offset="95%" stopColor={CHART_CONFIG.gradients.price.end} stopOpacity={CHART_CONFIG.gradients.price.endOpacity}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.colors.grid} opacity={CHART_CONFIG.gridOpacity} />
            <XAxis 
              dataKey="time" 
              stroke={CHART_CONFIG.colors.text}
              tick={{ fill: CHART_CONFIG.colors.text, fontSize: 12 }}
              tickFormatter={(value) => `${value}h`}
            />
            <YAxis 
              stroke={CHART_CONFIG.colors.text}
              tick={{ fill: CHART_CONFIG.colors.text, fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: CHART_CONFIG.colors.background, 
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '12px'
              }}
              labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
              itemStyle={{ color: CHART_CONFIG.colors.primary }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `${label}h ago`}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={CHART_CONFIG.colors.primary} 
              strokeWidth={CHART_CONFIG.strokeWidth}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

PriceChart.propTypes = {
  data: PropTypes.shape({
    current_price: PropTypes.number,
    price_change_24h: PropTypes.number,
  }),
  timeRange: PropTypes.oneOf(['24H', '7D', '30D']).isRequired,
  setTimeRange: PropTypes.func.isRequired,
  chartData: PropTypes.arrayOf(PropTypes.shape({
    time: PropTypes.number,
    price: PropTypes.number,
    volume: PropTypes.number,
  })).isRequired,
};

export default memo(PriceChart);
