import { useState } from 'react';
import { ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useTimezone } from '../contexts/TimezoneContext';
import { useTheme } from '../contexts/ThemeContext';

function NewsCard({ article }) {
  const { formatDateWithTimezone } = useTimezone();
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  
  const getSentimentIcon = () => {
    switch (article.sentiment) {
      case 'Bullish':
        return <TrendingUp className="w-4 h-4" />;
      case 'Bearish':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentStyle = () => {
    switch (article.sentiment) {
      case 'Bullish':
        return { color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.10)', borderColor: 'rgba(59,130,246,0.25)' };
      case 'Bearish':
        return { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.25)' };
      default:
        return { color: theme.muted, backgroundColor: theme.bg, borderColor: theme.border };
    }
  };

  const getImpactStyle = () => {
    switch (article.impactLevel) {
      case 'High':
        return { backgroundColor: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' };
      case 'Medium':
        return { backgroundColor: '#f59e0b15', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' };
      default:
        return { backgroundColor: theme.isDark ? '#ffffff08' : 'rgba(0,0,0,0.07)', color: theme.muted, border: `1px solid ${theme.border}` };
    }
  };

  const handleCardClick = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const cardBg = hovered ? theme.surface2 : theme.surface;
  const cardBorder = theme.border;

  return (
    <article
      className="rounded-lg border transition-all cursor-pointer"
      style={{ backgroundColor: cardBg, borderColor: cardBorder, borderRadius: 10, padding: 16 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      <div>
        {/* Header with badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={getImpactStyle()}>
            {article.impactLevel}
          </span>
          
          <span className="text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold" style={getSentimentStyle()}>
            {getSentimentIcon()}
            {article.sentiment}
          </span>

          <span className="text-xs flex items-center gap-1" style={{ color: theme.muted }}>
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </span>

          <span className="hidden sm:inline text-xs ml-auto" style={{ color: theme.muted }}>{article.source}</span>
        </div>

        {/* Content */}
        <div className="flex gap-4">
          {/* Text Content */}
          <div className="flex-1">
            <h3 className="font-semibold mb-2 line-clamp-2" style={{ fontSize: 15, color: theme.text, lineHeight: 1.45 }}>
              {article.title}
            </h3>
            
            {article.description && (
              <p className="mb-3" style={{ fontSize: 13, color: theme.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {article.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {article.keywords.slice(0, 3).map((keyword, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: theme.bg, color: theme.muted, fontSize: 10 }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              <button
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: theme.accent }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(article.url, '_blank', 'noopener,noreferrer');
                }}
              >
                Read More
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Ticker symbols if available */}
            {article.ticker && article.ticker.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span style={{ fontSize: 10, color: theme.muted }}>Tickers:</span>
                <div className="flex gap-1">
                  {article.ticker.slice(0, 4).map((ticker, index) => (
                    <span
                      key={index}
                      className="font-mono"
                      style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: theme.bg, color: theme.muted }}
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image */}
          {article.imageUrl && (
            <div className="w-20 h-20 md:w-32 md:h-32 flex-shrink-0">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between" style={{ fontSize: 11, color: theme.muted }}>
            <span>By {article.author}</span>
            <span>{formatDateWithTimezone(new Date(article.publishedAt), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default NewsCard;

