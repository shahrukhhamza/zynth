import { useState } from 'react';
import { Brain, FileText, Loader2, AlertTriangle, Sparkles, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { generateReport, listReports } from '../../services/journalApi';

function ScoreBar({ score, max = 10 }) {
  const theme = useTheme();
  const pct = (score / max) * 100;
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.isDark ? '#ffffff1a' : '#e2e8f0' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-8" style={{ color }}>{score}/{max}</span>
    </div>
  );
}

function TradeAiCard({ trade }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  if (!trade.ai_analysis) return null;
  let data;
  try { data = typeof trade.ai_analysis === 'string' ? JSON.parse(trade.ai_analysis) : trade.ai_analysis; } catch { return null; }
  if (!data) return null;

  const gradeColor = data.trade_quality === 'excellent' ? '#22c55e' : data.trade_quality === 'good' ? '#3b82f6' : data.trade_quality === 'average' ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: theme.accent }}>{trade.pair}</span>
              <span className="text-xs px-2 py-0.5 rounded font-bold"
                style={{ backgroundColor: `${gradeColor}22`, color: gradeColor }}>
                {(data.trade_quality || '').toUpperCase()}
              </span>
              <span className="text-xs" style={{ color: theme.muted }}>{trade.created_at?.slice(0,10)}</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{data.coach_message?.slice(0, 70)}{data.coach_message?.length > 70 ? '…' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs" style={{ color: theme.muted }}>Psychology</p>
            <ScoreBar score={data.psychology_score || 0} />
          </div>
          {open ? <ChevronUp className="w-4 h-4" style={{ color: theme.muted }} /> : <ChevronDown className="w-4 h-4" style={{ color: theme.muted }} />}
        </div>
      </button>

      {open && (
        <div className="p-4 border-t space-y-4" style={{ borderColor: theme.border, backgroundColor: `${theme.bg}88` }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: theme.muted }}>EMOTIONAL BIAS</p>
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#f59e0b22', color: '#f59e0b' }}>
                {(data.emotional_bias || 'none').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: theme.muted }}>DISCIPLINE</p>
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: '#3b82f622', color: '#3b82f6' }}>
                {(data.discipline_rating || '').replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {data.key_observations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: theme.muted }}>KEY OBSERVATIONS</p>
              <ul className="space-y-1">
                {data.key_observations.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: theme.text }}>
                    <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#3b82f6' }} />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.improvement_tips?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: theme.muted }}>IMPROVEMENT TIPS</p>
              <ul className="space-y-1">
                {data.improvement_tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: theme.text }}>
                    <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#22c55e' }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.coach_message && (
            <div className="p-3 rounded-lg italic text-sm" style={{ backgroundColor: theme.isDark ? '#a78bfa11' : '#f5f3ff', border: `1px solid ${theme.isDark ? '#a78bfa33' : '#ddd6fe'}`, color: '#7c3aed' }}>
              " {data.coach_message} "
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  let data;
  try { data = typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data; } catch { return null; }
  if (!data) return null;

  const gradeColor = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[data.performance_grade] || '#888';

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
      <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl"
            style={{ backgroundColor: `${gradeColor}22`, color: gradeColor }}>
            {data.performance_grade}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: theme.text }}>{data.title || 'Performance Report'}</p>
            <p className="text-xs" style={{ color: theme.muted }}>{report.created_at?.slice(0,10)} · {report.report_type}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: theme.muted }} /> : <ChevronDown className="w-4 h-4" style={{ color: theme.muted }} />}
      </button>

      {open && (
        <div className="p-4 border-t space-y-4" style={{ borderColor: theme.border, backgroundColor: `${theme.bg}88` }}>
          {data.summary && <p className="text-sm" style={{ color: theme.text }}>{data.summary}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.highlights?.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2 text-green-400 uppercase tracking-wide">Highlights</p>
                {data.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs mb-1.5" style={{ color: theme.text }}>
                    <TrendingUp className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />{h}
                  </div>
                ))}
              </div>
            )}
            {data.concerns?.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2 text-red-400 uppercase tracking-wide">Concerns</p>
                {data.concerns.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs mb-1.5" style={{ color: theme.text }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />{c}
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.psychological_assessment && (
            <div>
              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: theme.muted }}>Psychology</p>
              <p className="text-sm" style={{ color: theme.text }}>{data.psychological_assessment}</p>
            </div>
          )}

          {data.action_items?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: theme.muted }}>Action Items</p>
              <ul className="space-y-1.5">
                {data.action_items.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: theme.text }}>
                    <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.accent }} />{a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.coach_advice && (
            <div className="p-3 rounded-lg italic text-sm" style={{ backgroundColor: theme.isDark ? '#a78bfa11' : '#f5f3ff', border: `1px solid ${theme.isDark ? '#a78bfa33' : '#ddd6fe'}`, color: '#7c3aed' }}>
              " {data.coach_advice} "
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiInsightsPanel({ trades, metrics, onReportGenerated }) {
  const theme = useTheme();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsLoaded, setReportsLoaded] = useState(false);

  const analyzedTrades = (trades || []).filter(t => t.ai_analysis).reverse();

  const loadReports = async () => {
    if (reportsLoaded) return;
    setLoadingReports(true);
    try {
      const data = await listReports();
      setReports(data);
      setReportsLoaded(true);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const r = await generateReport(reportType);
      setReports(prev => [r, ...prev]);
      setReportsLoaded(true);
      if (onReportGenerated) onReportGenerated(r);
    } catch (err) {
      alert('Report generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const btnStyle = {
    backgroundColor: theme.surface,
    color: theme.muted,
    border: `1px solid ${theme.border}`,
    borderRadius: '0.5rem',
    padding: '0.4rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  };
  const activeBtnStyle = { ...btnStyle, backgroundColor: theme.accent, color: '#fff', borderColor: theme.accent };

  return (
    <div className="space-y-6">
      {/* Behavioral summary */}
      {metrics?.behavioral?.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Active Behavioral Alerts</p>
          </div>
          <div className="space-y-2">
            {metrics.behavioral.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg"
                style={{
                  backgroundColor: b.severity === 'danger'
                    ? (theme.isDark ? '#ef444411' : '#fef2f2')
                    : (theme.isDark ? '#f59e0b11' : '#fffbeb'),
                  border: `1px solid ${b.severity === 'danger' ? (theme.isDark ? '#ef444433' : '#fca5a5') : (theme.isDark ? '#f59e0b33' : '#fde68a')}`
                }}>
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: b.severity === 'danger' ? '#ef4444' : '#f59e0b' }} />
                <div>
                  <span className="text-xs font-bold mr-2 uppercase" style={{ color: b.severity === 'danger' ? '#ef4444' : '#f59e0b' }}>
                    {b.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs" style={{ color: theme.muted }}>{b.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Report */}
      <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4" style={{ color: theme.accent }} />
          <p className="text-sm font-semibold" style={{ color: theme.text }}>AI Performance Report</p>
        </div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {['weekly','monthly','custom'].map(t => (
            <button key={t} style={reportType === t ? activeBtnStyle : btnStyle} onClick={() => setReportType(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerateReport} disabled={generating || !metrics?.totalTrades}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
            style={{ backgroundColor: theme.accent, color: '#fff', opacity: (generating || !metrics?.totalTrades) ? 0.5 : 1 }}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
          {!reportsLoaded && (
            <button onClick={loadReports} disabled={loadingReports}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{ ...btnStyle, opacity: loadingReports ? 0.5 : 1 }}>
              {loadingReports ? <Loader2 className="w-4 h-4 animate-spin" /> : 'View Past Reports'}
            </button>
          )}
        </div>
        {!metrics?.totalTrades && (
          <p className="text-xs mt-2" style={{ color: theme.muted }}>Log at least one trade to generate a report.</p>
        )}
      </div>

      {/* Past reports */}
      {reports.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Past Reports</p>
          <div className="space-y-3">
            {reports.map((r, i) => <ReportCard key={r.id || i} report={r} />)}
          </div>
        </div>
      )}

      {/* Per-trade AI analyses */}
      {analyzedTrades.length > 0 ? (
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>
            Trade Analyses <span className="text-xs font-normal" style={{ color: theme.muted }}>({analyzedTrades.length} analyzed)</span>
          </p>
          <div className="space-y-2">
            {analyzedTrades.slice(0, 20).map(t => <TradeAiCard key={t.id} trade={t} />)}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 rounded-xl" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: theme.muted }} />
          <p className="text-sm" style={{ color: theme.muted }}>No AI analyses yet</p>
          <p className="text-xs mt-1" style={{ color: theme.muted }}>Go to Trade History and click the brain icon on any trade.</p>
        </div>
      )}
    </div>
  );
}
