import { useTheme } from '../contexts/ThemeContext';
import {
  AlertTriangle, CheckCircle2, Activity, Zap,
  TrendingDown, Target, Clock, BarChart2,
} from 'lucide-react';

function BehaviorCard({ icon: Icon, title, value, detail, severity }) {
  const theme = useTheme();
  const colorMap = {
    danger:  theme.danger,
    warning: theme.warning,
    success: theme.success,
    info:    theme.accent,
    neutral: theme.muted,
  };
  const color = colorMap[severity] || theme.muted;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme.muted }}>
            {title}
          </p>
          <p className="text-sm font-bold" style={{ color }}>{value}</p>
          {detail && (
            <p className="text-xs mt-1 leading-snug" style={{ color: theme.muted }}>{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightRow({ items, color, icon: Icon }) {
  const theme = useTheme();
  if (!items?.length) return null;
  return (
    <ul className="space-y-1.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: theme.text }}>
          <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function MT5BehaviorInsights({ behavior, aiSummary }) {
  const theme = useTheme();
  if (!behavior) return null;

  const {
    overtrading_detected,
    max_trades_in_day,
    overtrading_days_count,
    overtrade_threshold,
    revenge_trading_detected,
    revenge_trade_count,
    bad_risk_management,
    bad_risk_trade_count,
    inconsistent_sizing,
    lot_cv_pct,
    lot_increase_after_loss_count,
    session_win_rates,
    best_session,
    post_streak_win_rate,
    losses_after_3_consecutive_pct,
  } = behavior;

  const revenge_detected = revenge_trading_detected;
  const sessionEntries = Object.entries(session_win_rates || {}).sort(([, a], [, b]) => b - a);

  const behaviorCards = [
    {
      icon: BarChart2,
      title: 'Overtrading',
      value: overtrading_detected
        ? `${max_trades_in_day} trades in one day`
        : 'Not detected',
      detail: overtrading_detected
        ? `${overtrading_days_count} day(s) exceeded the ${overtrade_threshold}-trade threshold.`
        : `Max ${max_trades_in_day} trades in a day — within healthy limits.`,
      severity: overtrading_detected ? 'danger' : 'success',
    },
    {
      icon: Zap,
      title: 'Revenge Trading',
      value: revenge_detected
        ? `${revenge_trade_count} incident(s)`
        : 'Not detected',
      detail: revenge_detected
        ? `${revenge_trade_count} trade(s) opened within 10 min of a loss closing.`
        : 'No trades opened immediately after a loss.',
      severity: revenge_detected ? 'danger' : 'success',
    },
    {
      icon: TrendingDown,
      title: 'Risk Management',
      value: bad_risk_management
        ? `${bad_risk_trade_count} large-loss trade(s)`
        : 'Acceptable',
      detail: bad_risk_management
        ? `${bad_risk_trade_count} trade(s) with losses >3× average.`
        : 'No abnormally large individual losses detected.',
      severity: bad_risk_management ? 'warning' : 'success',
    },
    {
      icon: Target,
      title: 'Position Sizing',
      value: inconsistent_sizing
        ? `CoV ${lot_cv_pct}% — Inconsistent`
        : lot_cv_pct != null
          ? `CoV ${lot_cv_pct}% — Consistent`
          : 'N/A',
      detail: inconsistent_sizing
        ? `High variance in lot sizes. Use a fixed risk-per-trade rule.`
        : 'Lot sizing is relatively consistent across trades.',
      severity: inconsistent_sizing ? 'warning' : 'success',
    },
    {
      icon: Activity,
      title: 'Lot After Loss',
      value: lot_increase_after_loss_count > 0
        ? `${lot_increase_after_loss_count} instance(s)`
        : 'Not detected',
      detail: lot_increase_after_loss_count > 0
        ? 'You increased position size after a loss — martingale tendency.'
        : 'Position size is not being increased after losses.',
      severity: lot_increase_after_loss_count > 2 ? 'danger'
              : lot_increase_after_loss_count > 0 ? 'warning'
              : 'success',
    },
    {
      icon: Clock,
      title: 'After 3 Consec. Trades',
      value: losses_after_3_consecutive_pct != null
        ? `${losses_after_3_consecutive_pct}% loss rate`
        : 'N/A',
      detail: losses_after_3_consecutive_pct != null
        ? losses_after_3_consecutive_pct > 50
          ? 'Majority of losses occur after 3 back-to-back trades — fatigue signal.'
          : 'Performance holds up well after consecutive trades.'
        : 'Insufficient data.',
      severity: losses_after_3_consecutive_pct > 60 ? 'danger'
              : losses_after_3_consecutive_pct > 40 ? 'warning'
              : 'success',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Behavior cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: theme.muted }}>
          TRADER BEHAVIOR ANALYSIS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {behaviorCards.map((c) => (
            <BehaviorCard key={c.title} {...c} />
          ))}
        </div>
      </div>

      {/* Session win rates */}
      {sessionEntries.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.muted }}>
            Win Rate by Session
          </h4>
          <div className="space-y-2">
            {sessionEntries.map(([sess, wr]) => (
              <div key={sess} className="flex items-center gap-3">
                <span className="text-sm w-24 shrink-0" style={{ color: theme.text }}>{sess}</span>
                <div
                  className="flex-1 rounded-full h-2 overflow-hidden"
                  style={{ backgroundColor: theme.border }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(wr, 100)}%`,
                      backgroundColor: wr >= 55 ? theme.success : wr >= 45 ? theme.warning : theme.danger,
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right font-semibold"
                  style={{ color: wr >= 55 ? theme.success : wr >= 45 ? theme.warning : theme.danger }}
                >
                  {wr}%
                </span>
              </div>
            ))}
          </div>
          {best_session && (
            <p className="text-xs mt-3" style={{ color: theme.muted }}>
              Best session: <strong style={{ color: theme.accent }}>{best_session}</strong>
              {post_streak_win_rate != null && (
                <> · Win rate after losing streak: <strong>{post_streak_win_rate}%</strong></>
              )}
            </p>
          )}
        </div>
      )}

      {/* AI recommendations */}
      {aiSummary?.recommendations?.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderLeft: `3px solid ${theme.accent}`,
          }}
        >
          <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.muted }}>
            Recommendations
          </h4>
          <InsightRow items={aiSummary.recommendations} color={theme.accent} icon={CheckCircle2} />
        </div>
      )}

      {/* Warnings */}
      {aiSummary?.warnings?.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderLeft: `3px solid ${theme.warning}`,
          }}
        >
          <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.muted }}>
            Warnings
          </h4>
          <InsightRow items={aiSummary.warnings} color={theme.warning} icon={AlertTriangle} />
        </div>
      )}
    </section>
  );
}
