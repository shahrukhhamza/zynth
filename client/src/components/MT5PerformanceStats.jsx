import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  TrendingUp, TrendingDown, BarChart2, DollarSign,
  Award, Target, Repeat, Clock, Wallet, PiggyBank,
  Percent, Activity, X, Save, Settings2,
} from 'lucide-react';

// ── localStorage persistence ──────────────────────────────────────────────
const LS_KEY = 'mt5_account_settings';
function loadAccount() {
  try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r); } catch {}
  return { currentBalance: '', initialDeposit: '' };
}
function saveAccount(d) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

// ── Account Settings Modal ────────────────────────────────────────────────
function AccountModal({ open, onClose, account, onChange }) {
  const theme = useTheme();
  const [local, setLocal] = useState(account);
  const [focused, setFocused] = useState(null);
  useEffect(() => { setLocal(account); }, [account]);
  if (!open) return null;

  const fields = [
    { key: 'initialDeposit', label: 'Initial Deposit', icon: PiggyBank, placeholder: '1000', hint: 'Your starting account balance' },
    { key: 'currentBalance', label: 'Current Balance', icon: Wallet, placeholder: '1050', hint: 'Your current account balance' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
      >
        {/* Header with gradient accent bar */}
        <div style={{ background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.accent}25`, border: `1px solid ${theme.accent}40` }}>
                <Wallet className="w-4 h-4" style={{ color: theme.accent }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Account Settings</h3>
                <p className="text-xs" style={{ color: theme.muted }}>ROI & growth tracking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ color: theme.muted, backgroundColor: theme.surface2 }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="px-5 pt-5 pb-4 space-y-4">
          {fields.map(({ key, label, icon: Icon, placeholder, hint }) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: theme.muted }}>
                <Icon className="w-3 h-3" style={{ color: theme.accent }} />
                {label}
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden transition-all"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${focused === key ? theme.accent + '80' : theme.border}`,
                  boxShadow: focused === key ? `0 0 0 3px ${theme.accent}18` : 'none',
                }}
              >
                <span className="pl-3.5 pr-2 text-sm font-semibold" style={{ color: theme.muted }}>$</span>
                <input
                  type="number"
                  min="0"
                  placeholder={placeholder}
                  value={local[key]}
                  onFocus={() => setFocused(key)}
                  onBlur={() => setFocused(null)}
                  onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))}
                  className="flex-1 py-3 pr-3.5 text-sm bg-transparent outline-none"
                  style={{ color: theme.text }}
                />
              </div>
              <p className="text-xs mt-1.5 ml-1" style={{ color: theme.muted }}>{hint}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: theme.surface2, border: `1px solid ${theme.border}`, color: theme.muted }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onChange(local); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`, color: '#fff', boxShadow: `0 4px 14px ${theme.accent}40` }}
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, color, badge }) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.isDark ? '#111111' : theme.surface,
        border: `1px solid ${theme.isDark ? (hovered ? '#2a2a2a' : '#1e1e1e') : theme.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        transition: 'border-color 0.15s',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: theme.isDark ? '#1a1a1a' : theme.surface2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: 16, height: 16, color }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <p className="truncate" style={{ fontSize: 10, textTransform: 'uppercase', color: theme.isDark ? '#4a4a4a' : theme.muted, letterSpacing: '0.08em', margin: 0 }}>{label}</p>
          {badge && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, backgroundColor: `${color}25`, color, flexShrink: 0 }}>{badge}</span>
          )}
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1, margin: 0 }}>{value ?? '—'}</p>
        {subValue && <p style={{ fontSize: 11, marginTop: 3, color: theme.isDark ? '#4a4a4a' : theme.muted }}>{subValue}</p>}
      </div>
    </div>
  );
}

export default function MT5PerformanceStats({ analysis }) {
  const theme = useTheme();
  const [account, setAccount] = useState(loadAccount);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAccountChange = (data) => { setAccount(data); saveAccount(data); };

  if (!analysis) return null;

  const {
    total_trades, win_rate, loss_rate, win_count, loss_count,
    profit_factor, avg_risk_reward, total_profit, gross_profit, gross_loss,
    avg_win, avg_loss, best_symbol, worst_symbol,
    total_commission, total_swap, avg_trade_duration, max_consecutive_losses,
  } = analysis;

  const profitColor = total_profit > 0 ? theme.success : total_profit < 0 ? theme.danger : theme.muted;
  const pfDisplay   = profit_factor == null ? '∞' : profit_factor;
  const rrDisplay   = avg_risk_reward == null ? '∞' : avg_risk_reward;

  // Account-relative metrics
  const deposit    = parseFloat(account.initialDeposit) || null;
  const balance    = parseFloat(account.currentBalance) || null;
  const roi        = deposit && total_profit != null ? ((total_profit / deposit) * 100).toFixed(2) : null;
  const growthPct  = deposit && balance ? (((balance - deposit) / deposit) * 100).toFixed(2) : null;
  const expPayoff  = analysis.avg_profit_per_trade != null ? `$${analysis.avg_profit_per_trade?.toFixed(2)} / trade` : null;

  const pfColor = pfDisplay === '∞' ? theme.success
    : pfDisplay >= 1.5 ? theme.success
    : pfDisplay >= 1   ? theme.warning
    : theme.danger;
  const pfBadge = pfDisplay === '∞' ? null
    : pfDisplay >= 2   ? 'ELITE'
    : pfDisplay >= 1.5 ? 'STRONG'
    : null;

  const stats = [
    { icon: BarChart2,  label: 'Total Trades',      value: total_trades,
      subValue: `${win_count ?? 0}W · ${loss_count ?? 0}L · ${(total_trades - (win_count ?? 0) - (loss_count ?? 0))}BE`,
      color: theme.accent },
    { icon: total_profit >= 0 ? TrendingUp : TrendingDown, label: 'Net Profit',
      value: `${total_profit >= 0 ? '+' : ''}$${(total_profit ?? 0).toFixed(2)}`,
      subValue: `Gross +$${gross_profit ?? 0} / -$${gross_loss ?? 0}`, color: profitColor },
    { icon: Percent,    label: 'Win Rate',           value: `${win_rate ?? 0}%`,
      subValue: `Loss rate ${loss_rate ?? 0}%`,
      color: (win_rate ?? 0) >= 50 ? theme.success : theme.danger,
      badge: (win_rate ?? 0) >= 60 ? 'GOOD' : (win_rate ?? 0) < 50 ? 'LOW' : null },
    { icon: Target,     label: 'Profit Factor',      value: pfDisplay,
      subValue: pfDisplay !== '∞' && pfDisplay != null
        ? (pfDisplay >= 2 ? 'Excellent edge' : pfDisplay >= 1.5 ? 'Strong edge' : pfDisplay >= 1 ? 'Breakeven+' : 'Losing strategy')
        : gross_loss === 0 ? 'No losses yet' : '—',
      color: pfColor, badge: pfBadge },
    { icon: Award,      label: 'Avg Risk:Reward',    value: rrDisplay ? `${rrDisplay}:1` : '—',
      subValue: `Avg win $${avg_win ?? 0} · Avg loss $${avg_loss ?? 0}`,
      color: (avg_risk_reward ?? 0) >= 1.5 ? theme.success : theme.warning },
    { icon: Activity,   label: 'Expected Payoff',    value: expPayoff ?? '—',
      subValue: 'Avg P&L per trade',
      color: (analysis.avg_profit_per_trade ?? 0) >= 0 ? theme.success : theme.danger },
    { icon: PiggyBank,  label: 'ROI on Deposit',
      value: roi != null ? `${roi >= 0 ? '+' : ''}${roi}%` : '—',
      subValue: roi != null ? `$${(total_profit >= 0 ? '+' : '')}${(total_profit ?? 0).toFixed(2)} on $${deposit}` : 'Set initial deposit →',
      color: (roi ?? 0) >= 0 ? theme.success : theme.danger },
    { icon: Wallet,     label: 'Account Growth',
      value: growthPct != null ? `${growthPct >= 0 ? '+' : ''}${growthPct}%` : '—',
      subValue: balance && deposit ? `$${deposit.toFixed(0)} → $${balance.toFixed(0)}` : 'Set current balance →',
      color: (growthPct ?? 0) >= 0 ? theme.success : theme.danger },
    { icon: TrendingUp, label: 'Best Pair',          value: best_symbol ?? '—',
      subValue: best_symbol
        ? `$${analysis.symbol_stats?.[best_symbol]?.profit?.toFixed(2)} · ${analysis.symbol_stats?.[best_symbol]?.win_rate}% WR`
        : null,
      color: theme.success },
    { icon: TrendingDown, label: 'Worst Pair',       value: worst_symbol ?? '—',
      subValue: worst_symbol
        ? `$${analysis.symbol_stats?.[worst_symbol]?.profit?.toFixed(2)} · ${analysis.symbol_stats?.[worst_symbol]?.win_rate}% WR`
        : null,
      color: theme.danger },
    { icon: DollarSign, label: 'Fees & Swap',
      value: `$${(Math.abs(total_commission || 0) + Math.abs(total_swap || 0)).toFixed(2)}`,
      subValue: `Comm $${total_commission ?? 0} · Swap $${total_swap ?? 0}`, color: theme.warning },
    { icon: Clock,      label: 'Avg Duration',       value: avg_trade_duration ?? '—',
      subValue: `Max ${max_consecutive_losses ?? 0} consec. losses`, color: theme.muted },
    { icon: Repeat,     label: 'Max Consec. Losses', value: `${max_consecutive_losses ?? 0}`,
      subValue: (max_consecutive_losses ?? 0) >= 5 ? 'Dangerous streak'
                : (max_consecutive_losses ?? 0) >= 3 ? 'Moderate risk' : 'Under control',
      color: (max_consecutive_losses ?? 0) >= 5 ? theme.danger
           : (max_consecutive_losses ?? 0) >= 3 ? theme.warning : theme.success },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.isDark ? '#4a4a4a' : theme.muted }}>Performance Statistics</h3>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Settings2 className="w-3.5 h-3.5" />
          {deposit || balance ? 'Account Settings' : 'Set Balance / Deposit'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>
      <AccountModal open={modalOpen} onClose={() => setModalOpen(false)}
        account={account} onChange={handleAccountChange} />
    </section>
  );
}
