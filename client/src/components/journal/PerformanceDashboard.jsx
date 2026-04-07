import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Award, Activity } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const CHART_COLORS = ['#CA8A04','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#6366f1','#f97316'];

function StatCard({ label, value, sub, color, icon: Icon }) {
  const theme = useTheme();
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>{label}</p>
        {Icon && <Icon className="w-4 h-4" style={{ color: color || theme.muted }} />}
      </div>
      <p className="text-2xl font-bold" style={{ color: color || theme.text }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: theme.muted }}>{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, theme }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 shadow-xl text-xs" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
      ))}
    </div>
  );
};

export default function PerformanceDashboard({ metrics }) {
  const theme = useTheme();
  const warningColor = theme.warning;

  if (!metrics || metrics.totalTrades === 0) {
    return (
      <div className="text-center py-16" style={{ color: theme.muted }}>
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg mb-2">No performance data yet</p>
        <p className="text-sm">Log some trades to see your analytics here.</p>
      </div>
    );
  }

  const outcomeData = [
    { name: 'Wins', value: metrics.wins, color: '#22c55e' },
    { name: 'Losses', value: metrics.losses, color: '#ef4444' },
    { name: 'Breakeven', value: metrics.breakevens, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const emotionData = Object.entries(metrics.emotionMap || {}).map(([em, v]) => ({
    emotion: em, count: typeof v === 'object' ? (v.total || 0) : v
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Trades" value={metrics.totalTrades} icon={Activity} />
        <StatCard label="Win Rate" value={`${metrics.winRate}%`}
          color={metrics.winRate >= 50 ? '#22c55e' : '#ef4444'} icon={TrendingUp} />
        <StatCard label="Net P&L" value={`${metrics.netPnl >= 0 ? '+' : ''}${metrics.netPnl}`}
          color={metrics.netPnl >= 0 ? '#22c55e' : '#ef4444'} icon={metrics.netPnl >= 0 ? TrendingUp : TrendingDown} />
        <StatCard label="Profit Factor" value={metrics.profitFactor}
          color={parseFloat(metrics.profitFactor) >= 1.5 ? '#22c55e' : parseFloat(metrics.profitFactor) >= 1 ? '#f59e0b' : '#ef4444'}
          icon={Target} />
        <StatCard label="Avg Win" value={`+${metrics.avgWin}`} color="#22c55e" />
        <StatCard label="Avg Loss" value={`-${metrics.avgLoss}`} color="#ef4444" />
        <StatCard label="Risk/Reward" value={`1:${metrics.riskRewardRatio}`}
          color={parseFloat(metrics.riskRewardRatio) >= 1.5 ? '#22c55e' : '#f59e0b'} />
        <StatCard label="Expectancy" value={metrics.expectancy}
          color={parseFloat(metrics.expectancy) > 0 ? '#22c55e' : '#ef4444'}
          sub="per trade avg" />
      </div>

      {/* Equity Curve */}
      {metrics.equityCurve?.length > 1 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Equity Curve</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics.equityCurve}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#CA8A04" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#CA8A04" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${theme.border}44`} />
              <XAxis dataKey="date" tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip theme={theme} />} />
              <Area type="monotone" dataKey="equity" name="Equity" stroke="#CA8A04" fill="url(#eqGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Outcome Pie + Pair Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Outcome Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={11}>
                {outcomeData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Trades']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {metrics.pairStats?.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>P&L by Pair</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metrics.pairStats.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.border}44`} />
                <XAxis dataKey="pair" tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Bar dataKey="pnl" name="P&L" radius={[3,3,0,0]}>
                  {metrics.pairStats.slice(0, 8).map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Strategy + Emotion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.stratStats?.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Strategy Performance</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metrics.stratStats.slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.border}44`} />
                <XAxis type="number" tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="strategy" tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Bar dataKey="winRate" name="Win Rate %" radius={[0,3,3,0]} fill="#CA8A04" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {emotionData.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <p className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Emotion Frequency</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.border}44`} />
                <XAxis dataKey="emotion" tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: theme.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Bar dataKey="count" name="Trades" radius={[3,3,0,0]}>
                  {emotionData.map((d, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Behavioral Flags */}
      {metrics.behavioral?.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: warningColor }} />
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Behavioral Flags</p>
          </div>
          <div className="space-y-2">
            {metrics.behavioral.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  backgroundColor: b.severity === 'danger'
                    ? (theme.isDark ? '#ef444411' : '#fef2f2')
                    : (theme.isDark ? '#f59e0b11' : '#fff7ed'),
                  border: `1px solid ${b.severity === 'danger' ? (theme.isDark ? '#ef444433' : '#fca5a5') : (theme.isDark ? '#f59e0b33' : '#fde68a')}`
                }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: b.severity === 'danger' ? '#ef4444' : warningColor }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: b.severity === 'danger' ? '#ef4444' : warningColor }}>
                    {b.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{b.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pair breakdown table */}
      {metrics.pairStats?.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
          <div className="px-4 py-3" style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Pair Breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: `${theme.surface}88` }}>
                <tr>
                  {['Pair','Trades','Wins','Losses','Win Rate','Net P&L'].map(h => (
                    <th key={h} style={{ color: theme.muted, fontSize: '0.7rem', padding: '0.5rem 1rem', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.pairStats.map((p, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${theme.isDark ? theme.border + '44' : theme.border}` }}>
                    <td style={{ padding: '0.5rem 1rem', fontWeight: 700, color: theme.accent, fontSize: '0.8rem' }}>{p.pair}</td>
                    <td style={{ padding: '0.5rem 1rem', color: theme.text, fontSize: '0.8rem' }}>{p.total}</td>
                    <td style={{ padding: '0.5rem 1rem', color: '#22c55e', fontSize: '0.8rem' }}>{p.wins}</td>
                    <td style={{ padding: '0.5rem 1rem', color: '#ef4444', fontSize: '0.8rem' }}>{p.losses}</td>
                    <td style={{ padding: '0.5rem 1rem', color: parseFloat(p.winRate) >= 50 ? '#22c55e' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>{p.winRate}%</td>
                    <td style={{ padding: '0.5rem 1rem', color: p.pnl >= 0 ? '#22c55e' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                      {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
