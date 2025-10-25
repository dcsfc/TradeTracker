import { memo } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendUpIcon, 
  TrendDownIcon, 
  BarChartIcon, 
  ChartLineIcon, 
  WhaleIcon 
} from '../../constants/icons';
import { formatCurrency } from '../../utils/formatters';
import { getSentimentColor, getSentimentBg, getConfidenceColor } from '../../utils/insights';
import Sparkline from '../shared/Sparkline';

/**
 * MetricCards Component
 * Grid of 4 key metric cards with sparklines
 */
const MetricCards = ({ data, isEnhanced, setSelectedMetric }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Market Sentiment */}
      <div 
        onClick={() => setSelectedMetric('sentiment')}
        className={`p-6 bg-slate-900/50 rounded-xl border-2 shadow-xl ${getSentimentBg(data.prediction)} backdrop-blur-sm hover:scale-105 transition-all duration-200 cursor-pointer`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Market Sentiment</h3>
          <div className={getSentimentColor(data.prediction)}>
            {data.prediction?.toLowerCase().includes('bullish') && <TrendUpIcon />}
            {data.prediction?.toLowerCase().includes('bearish') && <TrendDownIcon />}
            {(!data.prediction || data.prediction === 'Neutral') && <BarChartIcon />}
          </div>
        </div>
        <div className={`text-3xl font-bold ${getSentimentColor(data.prediction)} mb-2`}>
          {data.prediction || 'Neutral'}
        </div>
        <div className="text-sm text-slate-400 mb-4 font-semibold">
          {Math.round((data.confidence || 0.5) * 100)}% confidence
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-1000 ${getConfidenceColor(data.confidence || 0.5)}`}
            style={{ width: `${(data.confidence || 0.5) * 100}%` }}
          />
        </div>
        <div className="mt-4 opacity-50">
          <Sparkline data={[0.4, 0.45, 0.5, 0.55, 0.6, 0.65, data.confidence || 0.5]} color="#10b981" />
        </div>
      </div>

      {/* Articles Analyzed */}
      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 shadow-xl hover:border-blue-500/50 hover:scale-105 transition-all duration-200 backdrop-blur-sm cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Articles Analyzed</h3>
          <BarChartIcon className="text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-slate-100 mb-2">
          {data.articles_analyzed || 0}
        </div>
        <div className="text-sm text-slate-400 font-medium">News sources processed</div>
        {isEnhanced && data.news_sentiment !== undefined && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-500 font-semibold">News Sentiment</div>
            <div className={`text-xl font-bold ${data.news_sentiment > 0 ? 'text-emerald-400' : data.news_sentiment < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {data.news_sentiment.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Technical Signal */}
      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 shadow-xl hover:border-purple-500/50 hover:scale-105 transition-all duration-200 backdrop-blur-sm cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">
            {isEnhanced ? 'Technical Signal' : 'Sentiment Score'}
          </h3>
          {isEnhanced ? (
            <ChartLineIcon className="text-purple-400" />
          ) : (
            <div className={`w-3 h-3 rounded-full ${data.sentiment_score > 0 ? 'bg-emerald-500' : data.sentiment_score < 0 ? 'bg-rose-500' : 'bg-slate-500'} animate-pulse`}></div>
          )}
        </div>
        
        {isEnhanced && data.technical_signals ? (
          <>
            <div className={`text-3xl font-bold mb-2 capitalize ${
              data.technical_signals.overall === 'bullish' ? 'text-emerald-400' :
              data.technical_signals.overall === 'bearish' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {data.technical_signals.overall || 'Neutral'}
            </div>
            <div className="text-sm text-slate-400 mb-4 font-medium">RSI: {data.technical_signals.rsi?.toFixed(1) || 50}</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Trend:</span>
                <span className="text-slate-200 capitalize font-semibold">{data.technical_signals.trend || 'neutral'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Momentum:</span>
                <span className="text-slate-200 capitalize font-semibold">{data.technical_signals.momentum || 'neutral'}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`text-3xl font-bold mb-2 ${data.sentiment_score > 0 ? 'text-emerald-400' : data.sentiment_score < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {data.sentiment_score ? data.sentiment_score.toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-slate-400 font-medium">Overall market tone</div>
          </>
        )}
      </div>

      {/* Whale Activity */}
      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 shadow-xl hover:border-cyan-500/50 hover:scale-105 transition-all duration-200 backdrop-blur-sm cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">
            {isEnhanced && data.whale_activity ? 'Whale Activity' : 'Top Crypto'}
          </h3>
          {isEnhanced && data.whale_activity ? (
            <WhaleIcon className="text-cyan-400" />
          ) : (
            <div className="text-2xl text-orange-400 font-bold">₿</div>
          )}
        </div>
        
        {isEnhanced && data.whale_activity ? (
          <>
            <div className={`text-3xl font-bold mb-2 capitalize ${
              data.whale_activity.sentiment === 'accumulating' ? 'text-emerald-400' :
              data.whale_activity.sentiment === 'distributing' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {data.whale_activity.sentiment || 'Neutral'}
            </div>
            <div className="text-sm text-slate-400 mb-4 font-medium">
              {data.whale_activity.transactions || 0} transactions
            </div>
            {data.whale_activity.net_flow !== undefined && (
              <div className="text-xs text-slate-300 font-semibold">
                Net flow: {formatCurrency(data.whale_activity.net_flow)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-slate-100 mb-2">
              {data.top_coins?.[0]?.coin || 'BTC'}
            </div>
            <div className="text-sm text-slate-400 font-medium">
              {data.top_coins?.[0]?.mentions || 0} mentions
            </div>
          </>
        )}
      </div>
    </div>
  );
};

MetricCards.propTypes = {
  data: PropTypes.shape({
    prediction: PropTypes.string,
    confidence: PropTypes.number,
    articles_analyzed: PropTypes.number,
    news_sentiment: PropTypes.number,
    technical_signals: PropTypes.shape({
      overall: PropTypes.string,
      rsi: PropTypes.number,
      trend: PropTypes.string,
      momentum: PropTypes.string,
    }),
    whale_activity: PropTypes.shape({
      sentiment: PropTypes.string,
      transactions: PropTypes.number,
      net_flow: PropTypes.number,
    }),
    sentiment_score: PropTypes.number,
    top_coins: PropTypes.array,
  }),
  isEnhanced: PropTypes.bool,
  setSelectedMetric: PropTypes.func,
};

export default memo(MetricCards);
