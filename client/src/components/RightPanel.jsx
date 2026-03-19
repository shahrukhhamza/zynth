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
        return { color: '#10b981', backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.25)' };
      case 'Bearish':
        return { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.25)' };
      default:
        return { color: theme.muted, backgroundColor: theme.bg, borderColor: theme.border };
    }
  };

  const getImpactStyle = (level) => {
    switch (level) {
      case 'High':
        return { backgroundColor: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' };
      case 'Medium':
        return { backgroundColor: '#f59e0b15', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' };
      default:
        return { backgroundColor: theme.isDark ? '#ffffff08' : 'rgba(0,0,0,0.07)', color: theme.muted, border: `1px solid ${theme.border}` };
    }
  };

  return (
    <aside className="hidden md:block w-80 border-l overflow-y-auto" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
      <div className="p-4">
        {/* Market Sentiment */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: theme.muted, letterSpacing: '0.08em' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            Market Sentiment
          </h2>
          
          <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-5">
              <span style={{ fontSize: 11, color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Articles</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{totalNews}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Bullish */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: 13, color: theme.text }}>Bullish</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sentimentStats.bullish}</div>
                  <div style={{ fontSize: 10, color: theme.muted, marginTop: 1 }}>
                    {totalNews > 0 ? Math.round((sentimentStats.bullish / totalNews) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Bearish */}}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDown className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  </div>
                  <span style={{ fontSize: 13, color: theme.text }}>Bearish</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sentimentStats.bearish}</div>
                  <div style={{ fontSize: 10, color: theme.muted, marginTop: 1 }}>
                    {totalNews > 0 ? Math.round((sentimentStats.bearish / totalNews) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Neutral */}}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus className="w-3.5 h-3.5" style={{ color: theme.muted }} />
                  </div>
                  <span style={{ fontSize: 13, color: theme.text }}>Neutral</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: theme.muted, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sentimentStats.neutral}</div>
                  <div style={{ fontSize: 10, color: theme.muted, marginTop: 1 }}>
                    {totalNews > 0 ? Math.round((sentimentStats.neutral / totalNews) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Impact Alerts */}
        <div>
          <h2 className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: theme.muted, letterSpacing: '0.08em' }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            High Impact Alerts
          </h2>

          {highImpactNews.length === 0 ? (
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
              <Newspaper className="w-7 h-7 mx-auto mb-2" style={{ color: theme.muted }} />
              <p style={{ fontSize: 12, color: theme.muted }}>No high impact news at the moment</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {highImpactNews.map((article) => {
                const leftBorder = article.impactLevel === 'High' ? '#ef4444' : article.impactLevel === 'Medium' ? '#f59e0b' : theme.border;
                return (
                  <div
                    key={article.id}
                    className="rounded-lg transition-colors cursor-pointer"
                    style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderLeft: `3px solid ${leftBorder}`, padding: '10px 12px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surface2; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.surface; }}
                    onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 700, ...getImpactStyle(article.impactLevel) }}>
                        {article.impactLevel}
                      </span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 600, border: '1px solid', ...getSentimentStyle(article.sentiment) }}>
                        {article.sentiment}
                      </span>
                    </div>
                    
                    <h3 style={{ fontSize: 12, fontWeight: 600, color: theme.text, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>{article.title}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: theme.muted }}>
                      <span>{article.source}</span>
                      <span>{formatDateWithTimezone(new Date(article.publishedAt), 'HH:mm')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gold Focus Indicator */}
        <div style={{ marginTop: 20, backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderLeft: '3px solid #f59e0b', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>Gold Focus</span>
          </div>
          <p style={{ fontSize: 11, color: theme.muted, lineHeight: 1.5 }}>
            Tracking XAUUSD, precious metals, and macro-economic indicators
          </p>
        </div>
      </div>
    </aside>
  );
}

export default RightPanel;
