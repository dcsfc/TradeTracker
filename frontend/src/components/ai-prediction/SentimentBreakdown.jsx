import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * SentimentBreakdown Component
 * Displays sentiment distribution with progress bars
 */
const SentimentBreakdown = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/20 transition-all">
        <div className="text-3xl font-bold text-emerald-400 mb-2">
          {data.positive_pct ? data.positive_pct.toFixed(0) : 0}%
        </div>
        <div className="text-sm text-emerald-300 font-bold uppercase tracking-wide">Positive</div>
        <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${data.positive_pct || 0}%` }}
          />
        </div>
      </div>
      <div className="text-center p-5 bg-slate-700/30 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-all">
        <div className="text-3xl font-bold text-slate-300 mb-2">
          {data.neutral_pct ? data.neutral_pct.toFixed(0) : 0}%
        </div>
        <div className="text-sm text-slate-400 font-bold uppercase tracking-wide">Neutral</div>
        <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
          <div 
            className="bg-slate-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${data.neutral_pct || 0}%` }}
          />
        </div>
      </div>
      <div className="text-center p-5 bg-rose-500/10 rounded-xl border border-rose-500/30 hover:bg-rose-500/20 transition-all">
        <div className="text-3xl font-bold text-rose-400 mb-2">
          {data.negative_pct ? data.negative_pct.toFixed(0) : 0}%
        </div>
        <div className="text-sm text-rose-300 font-bold uppercase tracking-wide">Negative</div>
        <div className="w-full bg-slate-800 rounded-full h-2 mt-3">
          <div 
            className="bg-rose-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${data.negative_pct || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

SentimentBreakdown.propTypes = {
  data: PropTypes.shape({
    positive_pct: PropTypes.number,
    neutral_pct: PropTypes.number,
    negative_pct: PropTypes.number,
  }),
};

export default memo(SentimentBreakdown);
