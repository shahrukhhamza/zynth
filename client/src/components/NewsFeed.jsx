import { AlertCircle } from 'lucide-react';
import NewsCard from './NewsCard';
import LoadingSkeleton from './LoadingSkeleton';
import { useTheme } from '../contexts/ThemeContext';

function NewsFeed({ news, loading, error }) {
  const theme = useTheme();

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-lg p-6 flex items-start gap-3 border" style={{ backgroundColor: `${theme.danger}18`, borderColor: theme.danger }}>
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: theme.danger }} />
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.danger }}>Error Loading News</h3>
              <p style={{ color: theme.text }}>{error}</p>
              <p className="text-sm mt-2" style={{ color: theme.muted }}>
                Please ensure your API keys are configured correctly in the .env file.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
        <div className="max-w-5xl mx-auto space-y-4">
          {[...Array(8)].map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1" style={{ color: theme.text }}>Market News</h2>
          <p style={{ fontSize: 12, color: theme.muted }}>
            {news.length} articles · Updated every 30 seconds
          </p>
        </div>

        {news.length === 0 ? (
          <div className="rounded-lg p-8 text-center" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10 }}>
            <p style={{ color: theme.muted }}>No news articles found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default NewsFeed;
