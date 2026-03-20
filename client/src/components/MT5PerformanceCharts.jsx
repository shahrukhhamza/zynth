import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LabelList,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#06b6d4'];

function ChartCard({ title, children }) {
  const theme = useTheme();
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.muted }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function BarProfitLabel({ x, y, width, height, value }) {
  if (value == null) return null;
  const label = `$${Math.abs(value) >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(1)}`;
  const isNeg = value < 0;
  return (
    <text
      x={x + width / 2}
      y={isNeg ? y + height + 14 : y - 6}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill={isNeg ? '#ef4444' : '#22c55e'}
    >{label}</text>
  );
}

function HBarProfitLabel({ x, y, width, height, value }) {
  if (value == null) return null;
  const label = `$${Math.abs(value) >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(1)}`;
  const isNeg = value < 0;
  return (
    <text
      x={isNeg ? x - 5 : x + width + 5}
      y={y + height / 2}
      textAnchor={isNeg ? 'end' : 'start'}
      dominantBaseline="middle"
      fontSize={10}
      fontWeight={700}
      fill={isNeg ? '#ef4444' : '#22c55e'}
    >{label}</text>
  );
}

function CustomTooltip({ active, payload, label, prefix = '$', theme }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        color: theme.text,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      <p className="font-semibold mb-1" style={{ color: theme.text }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.value >= 0 ? '#22c55e' : '#ef4444' }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function MT5PerformanceCharts({ analysis, trades }) {
  const theme = useTheme();

  // Monthly profit/loss bar data
  const monthlyData = useMemo(() => {
    if (!analysis?.monthly_profit) return [];
    return Object.entries(analysis.monthly_profit)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, profit]) => ({ month, profit, fill: profit >= 0 ? theme.success : theme.danger }));
  }, [analysis, theme]);

  // Symbol breakdown bar data
  const symbolData = useMemo(() => {
    if (!analysis?.symbol_stats) return [];
    return Object.entries(analysis.symbol_stats)
      .sort(([, a], [, b]) => b.profit - a.profit)
      .slice(0, 10)
      .map(([sym, s]) => ({
        symbol: sym,
        profit: s.profit,
        win_rate: s.win_rate,
        trades: s.total_trades,
      }));
  }, [analysis]);

  // Session pie data
  const sessionData = useMemo(() => {
    if (!analysis?.session_profit) return [];
    return Object.entries(analysis.session_profit)
      .filter(([, v]) => v > 0)
      .map(([session, profit]) => ({ session, profit }));
  }, [analysis]);

  // Equity curve — cumulative profit over trades (chronological)
  const equityCurve = useMemo(() => {
    if (!trades?.length) return [];
    const sorted = [...trades].sort((a, b) =>
      new Date(a.close_time) - new Date(b.close_time)
    );
    let cum = 0;
    return sorted.map((t, i) => {
      cum += t.profit;
      return { trade: i + 1, equity: Math.round(cum * 100) / 100 };
    });
  }, [trades]);

  if (!analysis) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold mb-3" style={{ color: theme.muted }}>
        PERFORMANCE CHARTS
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Equity Curve */}
        {equityCurve.length > 0 && (
          <ChartCard title="Equity Curve">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis
                  dataKey="trade"
                  tick={{ fill: theme.muted, fontSize: 10 }}
                  label={{ value: 'Trade #', position: 'insideBottom', offset: -2, fill: theme.muted, fontSize: 10 }}
                />
                <YAxis tick={{ fill: theme.muted, fontSize: 10 }} />
                <Tooltip
                  content={<CustomTooltip prefix="$" theme={theme} />}
                  cursor={{ stroke: theme.border, strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke={theme.accent}
                  dot={false}
                  strokeWidth={2}
                  name="Cum. Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Monthly P&L */}
        {monthlyData.length > 0 && (
          <ChartCard title="Monthly Profit / Loss">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 28, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis dataKey="month" tick={{ fill: theme.muted, fontSize: 9 }} />
                <YAxis tick={{ fill: theme.muted, fontSize: 10 }} />
                <Tooltip
                  content={<CustomTooltip prefix="$" theme={theme} />}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="profit" name="P&L" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="profit" content={<BarProfitLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Symbol P&L */}
        {symbolData.length > 0 && (
          <ChartCard title="Profit by Symbol (Top 10)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={symbolData} layout="vertical" margin={{ top: 4, right: 70, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                <XAxis type="number" tick={{ fill: theme.muted, fontSize: 10 }} />
                <YAxis
                  dataKey="symbol"
                  type="category"
                  tick={{ fill: theme.muted, fontSize: 10 }}
                  width={72}
                />
                <Tooltip
                  content={<CustomTooltip prefix="$" theme={theme} />}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="profit" name="Profit" radius={[0, 4, 4, 0]}>
                  {symbolData.map((entry, i) => (
                    <Cell key={i} fill={entry.profit >= 0 ? theme.success : theme.danger} />
                  ))}
                  <LabelList dataKey="profit" content={<HBarProfitLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Session profit pie */}
        {sessionData.length > 0 && (
          <ChartCard title="Profit by Session">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sessionData}
                  dataKey="profit"
                  nameKey="session"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ session, percent }) => `${session} ${(percent * 100).toFixed(0)}%`}
                >
                  {sessionData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`$${v.toFixed(2)}`, 'Profit']}
                  contentStyle={{
                    backgroundColor: theme.surface,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontSize: 12,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: theme.text }}
                  labelStyle={{ color: theme.text }}
                />
                <Legend
                  formatter={(v) => <span style={{ color: theme.muted, fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </section>
  );
}
