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
        return { color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', borderColor: '#22c55e' };
      case 'Bearish':
        return { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' };
      default:
        return { color: theme.muted, backgroundColor: `${theme.border}`, borderColor: theme.border };
    }
  };

  const getImpactStyle = () => {
    switch (article.impactLevel) {
      case 'High':
        return { backgroundColor: '#ef4444', color: '#ffffff' };
      case 'Medium':
        return { backgroundColor: '#eab308', color: '#ffffff' };
      default:
        return { backgroundColor: theme.border, color: theme.muted };
    }
  };

  const handleCardClick = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const cardBorderColor = hovered
    ? theme.accent
    : article.impactLevel === 'High'
      ? theme.danger
      : theme.border;

  return (
    <article
      className="rounded-lg border transition-all cursor-pointer group"
      style={{ backgroundColor: theme.surface, borderColor: cardBorderColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header with badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs px-2 py-1 rounded font-medium" style={getImpactStyle()}>
            {article.impactLevel}
          </span>
          
          <span className="text-xs px-2 py-1 rounded border flex items-center gap-1" style={getSentimentStyle()}>
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
            <h3 className="text-lg font-semibold mb-2 transition-colors line-clamp-2" style={{ color: hovered ? theme.accent : theme.text }}>
              {article.title}
            </h3>
            
            {article.description && (
              <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.muted }}>
                {article.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {article.keywords.slice(0, 3).map((keyword, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: theme.bg, color: theme.muted }}
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
                <span className="text-xs" style={{ color: theme.muted }}>Tickers:</span>
                <div className="flex gap-1">
                  {article.ticker.slice(0, 4).map((ticker, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded font-mono"
                      style={{ backgroundColor: `${theme.accent}1a`, color: theme.accent }}
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
        <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: theme.border, color: theme.muted }}>
          <div className="flex items-center justify-between">
            <span>By {article.author}</span>
            <span>{formatDateWithTimezone(new Date(article.publishedAt), 'MMM dd, yyyy HH:mm')}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default NewsCard;
