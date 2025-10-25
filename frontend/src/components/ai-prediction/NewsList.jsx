import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ExternalLinkIcon } from '../../constants/icons';

/**
 * NewsList Component
 * Displays recent news articles with external links
 */
const NewsList = ({ articles }) => {
  const displayedArticles = useMemo(() => 
    articles ? articles.slice(0, 5) : [],
    [articles]
  );

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 shadow-xl p-6 backdrop-blur-sm hover:border-slate-700 transition-all">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 uppercase tracking-wide">Recent Headlines</h2>
        <div className="space-y-6">
          {displayedArticles.map((article, index) => (
            <div key={index} className="border-b border-slate-800 pb-6 last:border-b-0 last:pb-0 hover:bg-slate-800/30 p-4 rounded-lg transition-all">
              <h3 className="text-lg font-semibold text-slate-100 mb-3 hover:text-blue-400 transition-colors">
                {article.title}
              </h3>
              {article.summary && (
                <p className="text-slate-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 uppercase tracking-wide">
                  {article.source}
                </span>
                {article.link && article.link !== '#' && (
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-sm text-blue-400 hover:text-blue-300 font-bold transition-colors"
                  >
                    <span>Read more</span>
                    <ExternalLinkIcon />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

NewsList.propTypes = {
  articles: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
    summary: PropTypes.string,
    source: PropTypes.string,
    link: PropTypes.string,
  })),
};

export default memo(NewsList);
