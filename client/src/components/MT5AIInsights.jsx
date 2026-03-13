import { useTheme } from '../contexts/ThemeContext';
import { Brain, AlertTriangle, CheckCircle2, Lightbulb, Wrench, Zap } from 'lucide-react';

// Trim text to max N words
function trimWords(text, max = 14) {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(' ') + '…';
}

// Trim summary to max N words
function trimSummary(text, max = 30) {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(' ') + '…';
}

function InsightBadge({ label, value, color }) {
  const theme = useTheme();
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {value ? <CheckCircle2 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
      {label}
    </span>
  );
}

function InsightList({ icon: Icon, title, items, color }) {
  const theme = useTheme();
  if (!items || items.length === 0) return null;
  const shown = items.slice(0, 3);
  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>
          {title}
        </span>
      </div>
      <ul className="space-y-1.5">
        {shown.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs leading-snug"
            style={{ color: theme.text }}
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {trimWords(item, 14)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MT5AIInsights({ aiSummary }) {
  const theme = useTheme();

  if (!aiSummary) return null;

  const {
    summary,
    insights,
    strengths,
    warnings,
    recommendations,
    best_asset,
    best_session,
    overtrading_detected,
    consecutive_loss_risk,
    generated_by,
  } = aiSummary;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: theme.muted }}>
          AI PERFORMANCE INSIGHTS
        </h3>
        <div className="flex items-center gap-2">
          {best_asset && (
            <InsightBadge label={`Best: ${best_asset}`} value color={theme.success} />
          )}
          {best_session && (
            <InsightBadge label={`${best_session} session`} value color={theme.accent} />
          )}
          {overtrading_detected && (
            <InsightBadge label="Overtrading" value={false} color={theme.warning} />
          )}
          {consecutive_loss_risk && (
            <InsightBadge label="Loss streak risk" value={false} color={theme.danger} />
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${theme.accent}15`,
              color: theme.muted,
            }}
          >
            {generated_by === 'gemini' ? '✦ Zynth AI' : 'Rule Engine'}
          </span>
        </div>
      </div>

      {/* Summary card */}
      <div
        className="rounded-xl p-3 mb-3"
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderLeft: `3px solid ${theme.accent}`,
        }}
      >
        <div className="flex items-start gap-2.5">
          <Brain className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.accent }} />
          <p className="text-xs leading-relaxed" style={{ color: theme.text }}>
            {trimSummary(summary, 30)}
          </p>
        </div>
      </div>

      {/* Grid of insight lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <InsightList icon={Lightbulb} title="Key Insights" items={insights} color={theme.accent} />
        <InsightList icon={CheckCircle2} title="Strengths" items={strengths} color={theme.success} />
        <InsightList icon={AlertTriangle} title="Warnings" items={warnings} color={theme.warning} />
        <InsightList icon={Wrench} title="Recommendations" items={recommendations} color={theme.danger} />
      </div>
    </section>
  );
}
