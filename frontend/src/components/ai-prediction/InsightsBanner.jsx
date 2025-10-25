import { memo } from 'react';
import PropTypes from 'prop-types';
import { LightbulbIcon, CloseIcon } from '../../constants/icons';

/**
 * InsightsBanner Component
 * Displays actionable insights with close functionality
 */
const InsightsBanner = ({ insights, showInsights, setShowInsights }) => {
  if (!showInsights || !insights || insights.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <LightbulbIcon className="text-yellow-400" />
          <h2 className="text-lg font-bold text-slate-100">Smart Insights</h2>
        </div>
        <button 
          onClick={() => setShowInsights(false)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-lg border ${insight.color} backdrop-blur-sm transition-all hover:scale-105 cursor-pointer`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{insight.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-slate-100 mb-1">{insight.title}</h3>
                <p className="text-sm text-slate-300">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

InsightsBanner.propTypes = {
  insights: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    icon: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string,
    color: PropTypes.string,
  })),
  showInsights: PropTypes.bool.isRequired,
  setShowInsights: PropTypes.func.isRequired,
};

export default memo(InsightsBanner);
