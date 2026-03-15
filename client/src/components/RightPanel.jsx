import { TrendingUp, TrendingDown, Minus, AlertTriangle, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { useTimezone } from '../contexts/TimezoneContext';
import { useTheme } from '../contexts/ThemeContext';

function RightPanel({ sentimentStats, highImpactNews, totalNews }) {
  const { formatDateWithTimezone } = useTimezone();
  const theme = useTheme();
  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'Bullish':
        return <TrendingUp className="w-4 h-4" />;
      case 'Bearish':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentStyle = (sentiment) => {
    switch (sentiment) {
      case 'Bullish':
        return { color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', borderColor: '#22c55e' };
      case 'Bearish':
        return { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' };
      default:
        return { color: theme.muted, backgroundColor: theme.border, borderColor: theme.border };
    }
  };

  const getImpactStyle = (level) => {
    switch (level) {
      case 'High':
        return { backgroundColor: '#ef4444', color: '#ffffff' };
      case 'Medium':
        return { backgroundColor: '#eab308', color: '#ffffff' };
      default:
        return { backgroundColor: theme.border, color: theme.muted };
    }
  };

  return (
    <aside className="hidden md:block w-80 border-l overflow-y-auto" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
      <div className="p-4">
        {/* Market Sentiment */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: theme.muted }}>
            <TrendingUp className="w-4 h-4" />
            Market Sentiment
          </h2>
          
          <div className="rounded-lg p-4 border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: theme.muted }}>Total Articles</span>
              <span className="text-2xl font-bold" style={{ color: theme.accent }}>{totalNews}</span>
            </div>

            <div className="space-y-3">
              {/* Bullish */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-terminal-bullish/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-terminal-bullish" />
                  </div>
                  <span className="text-sm" style={{ color: theme.text }}>Bullish</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-terminal-bullish">{sentimentStats.bullish}</div>
                  <div className="text-xs" style={{ color: theme.muted }}>
                    {totalNews > 0 ? Math.round((sentimentStats.bullish / totalNews) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Bearish */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-terminal-bearish/10 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-terminal-bearish" />
                  </div>
                  <span className="text-sm" style={{ color: theme.text }}>Bearish</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-terminal-bearish">{sentimentStats.bearish}</div>
                  <div className="text-xs" style={{ color: theme.muted }}>
                    {totalNews > 0 ? Math.round((sentimentStats.bearish / totalNews) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Neutral */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-terminal-neutral/10 flex items-center justify-center">
                    <Minus className="w-4 h-4 text-terminal-neutral" />
                  </div>
                  <span className="text-sm" style={{ color: theme.text }}>Neutral</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-terminal-neutral">{sentimentStats.neutral}</div>
                  <div className="text-xs" style={{ color: theme.muted }}>
                    {totalNews > 0 ? Math.round((sentimentStats.neutral / totalNews) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Impact Alerts */}
        <div>
          <h2 className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: theme.muted }}>
            <AlertTriangle className="w-4 h-4" />
            High Impact Alerts
          </h2>

          {highImpactNews.length === 0 ? (
            <div className="rounded-lg p-4 border text-center" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <Newspaper className="w-8 h-8 mx-auto mb-2" style={{ color: theme.muted }} />
              <p className="text-sm" style={{ color: theme.muted }}>No high impact news at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {highImpactNews.map((article) => (
                <div
                  key={article.id}
                  className="rounded-lg p-3 border transition-colors cursor-pointer"
                  style={{ backgroundColor: theme.bg, borderColor: theme.danger }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surface}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.bg}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded" style={getImpactStyle(article.impactLevel)}>
                      {article.impactLevel}
                    </span>
                    <span className="text-xs px-2 py-1 rounded border" style={getSentimentStyle(article.sentiment)}>
                      {article.sentiment}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-medium mb-2 line-clamp-2" style={{ color: theme.text }}>{article.title}</h3>
                  
                  <div className="flex items-center justify-between text-xs" style={{ color: theme.muted }}>
                    <span>{article.source}</span>
                    <span>{formatDateWithTimezone(new Date(article.publishedAt), 'HH:mm')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gold Focus Indicator */}
        <div className="mt-6 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-600/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-yellow-500">Gold Focus</span>
          </div>
          <p className="text-xs" style={{ color: theme.muted }}>
            Tracking XAUUSD, precious metals, and macro-economic indicators
          </p>
        </div>
      </div>
    </aside>
  );
}

export default RightPanel;
