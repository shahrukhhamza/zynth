import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, ChevronLeft, Sparkles, TrendingUp, Target, User, Camera, ArrowRight, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import ImageCropModal from './ImageCropModal';
import { BrandMark } from './BrandLogo';
import ErrorBar from './ErrorBar';
import { setAuthSession } from '../utils/authStorage';

const EXPERIENCE_OPTIONS = [
  { value: 'beginner',      label: 'Just Starting Out',   desc: 'New to trading, learning the basics' },
  { value: 'intermediate',  label: 'Getting Serious',     desc: '1–3 years, building a system' },
  { value: 'experienced',   label: 'Experienced Trader',  desc: '3–5 years, consistent strategy' },
  { value: 'professional',  label: 'Professional',        desc: '5+ years, full-time trading' },
];

const MARKET_OPTIONS = [
  'Forex', 'Gold / XAU', 'Crypto', 'Stocks', 'Indices', 'CFDs', 'Commodities', 'Options',
];

const GOAL_OPTIONS = [
  'Grow a funded account',
  'Pass a prop firm challenge',
  'Build a long-term portfolio',
  'Improve trade journaling',
  'Understand macro events',
  'Automate my edge',
];

const AVATAR_COLORS = [
  { value: 'emerald', label: 'Emerald', bg: '#CA8A04', ring: '#CA8A04' },
  { value: 'blue',    label: 'Blue',    bg: '#CA8A04', ring: '#CA8A04' },
  { value: 'purple',  label: 'Purple',  bg: '#8b5cf6', ring: '#8b5cf6' },
  { value: 'orange',  label: 'Orange',  bg: '#f97316', ring: '#f97316' },
  { value: 'rose',    label: 'Rose',    bg: '#f43f5e', ring: '#f43f5e' },
  { value: 'amber',   label: 'Amber',   bg: '#f59e0b', ring: '#f59e0b' },
  { value: 'cyan',    label: 'Cyan',    bg: '#06b6d4', ring: '#06b6d4' },
  { value: 'indigo',  label: 'Indigo',  bg: '#CA8A04', ring: '#CA8A04' },
];

const GOLD = '#CA8A04';
const GOLD_BTN = {
  background: 'linear-gradient(180deg,#E0A010,#C98A06)',
  boxShadow: '0 3px 0 #8a5a05, 0 12px 24px -10px rgba(202,138,4,0.7)',
  color: '#1a1203',
};
const GOLD_BTN_CLASS = 'flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold uppercase tracking-[0.06em] transition-all duration-150 hover:translate-y-[1px] active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none';

const TOTAL_STEPS = 4; // actual content steps (0 = welcome, 1-4 = content)

function ProgressBar({ step, theme }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-500"
          style={{
            backgroundColor: i < step
              ? theme.accent
              : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        />
      ))}
    </div>
  );
}

function SelectCard({ label, desc, selected, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-px"
      style={{
        backgroundColor: selected ? 'rgba(202,138,4,0.1)' : theme.surface,
        borderColor: selected ? GOLD : theme.border,
        boxShadow: selected ? '0 0 0 3px rgba(202,138,4,0.14)' : 'none',
        color: theme.text,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
          style={{ borderColor: selected ? GOLD : theme.border }}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {desc && <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{desc}</p>}
        </div>
      </div>
    </button>
  );
}

function MultiChip({ label, selected, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-200 flex items-center gap-1.5 hover:-translate-y-px"
      style={{
        backgroundColor: selected ? 'rgba(202,138,4,0.12)' : theme.surface,
        borderColor: selected ? GOLD : theme.border,
        color: selected ? (theme.isDark ? '#FBBF24' : '#8a5a05') : theme.textMuted,
      }}
    >
      {selected && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
      {label}
    </button>
  );
}

export default function OnboardingFlow({ onComplete, onSkip }) {
  const theme = useTheme();
  const { user, token, refreshUser } = useAuth();

  const [step, setStep] = useState(0); // 0 = welcome screen
  const [experience, setExperience] = useState('');
  const [markets, setMarkets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color ?? 'emerald');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const firstName = (user?.name ?? 'Trader').split(' ')[0];

  function handleSkip() {
    localStorage.setItem('zynth_onboarding_skipped', 'true');
    onSkip?.();
  }

  function toggleMarket(m) {
    setMarkets(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function toggleGoal(g) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Max 10MB allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setCropSrc(ev.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  function handleCropConfirm(croppedBase64) {
    setCropSrc(null);
    setAvatarPreview(croppedBase64);
    setPendingAvatarBase64(croppedBase64);
  }

  function canAdvance() {
    if (step === 0) return true;
    if (step === 1) return !!experience;
    if (step === 2) return markets.length > 0;
    if (step === 3) return goals.length > 0;
    if (step === 4) return displayName.trim().length >= 2;
    return false;
  }

  async function submitProfile({ skipPhoto = false } = {}) {
    setSubmitting(true);
    setError('');
    try {
      const body = {
        trading_experience: experience || null,
        markets_traded: markets,
        goals,
        avatar_color: avatarColor,
        name: displayName.trim() || user?.name,
      };
      if (!skipPhoto && pendingAvatarBase64) {
        body.avatar_base64 = pendingAvatarBase64;
      }
      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Update failed');
      }
      const { user: updatedUser, token: newToken } = await res.json();
      setAuthSession(updatedUser, newToken);
      localStorage.setItem('zynth_onboarding_done', 'true');
      localStorage.removeItem('zynth_onboarding_skipped');
      await refreshUser();
      onComplete?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedColor = AVATAR_COLORS.find(c => c.value === avatarColor);
  const initials = (displayName || user?.name || 'U').slice(0, 2).toUpperCase();
  const stepIcons = [null, TrendingUp, Target, Sparkles, User];
  const StepIcon = step >= 1 ? (stepIcons[step] ?? User) : null;

  return (
    <>
    {cropSrc && (
      <ImageCropModal
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: theme.isDark ? 'rgba(5,5,8,0.78)' : 'rgba(20,16,8,0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full flex flex-col overflow-hidden"
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 24,
          maxWidth: 540,
          boxShadow: '0 32px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(202,138,4,0.06)',
        }}
      >
        {/* Top bar: logo left · step counter center · skip right */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          {/* Logo + brand */}
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-display text-[15px] font-bold tracking-tight" style={{ color: theme.text }}>Zynth</span>
          </div>
          {/* Step counter */}
          <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
            {step >= 1 ? `Step ${step} of ${TOTAL_STEPS}` : ''}
          </span>
          {/* Global skip */}
          <button
            onClick={handleSkip}
            className="text-xs transition-colors"
            style={{ color: theme.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
            onMouseLeave={e => (e.currentTarget.style.color = theme.textMuted)}
          >
            Skip setup →
          </button>
        </div>

        {/* Thin emerald progress bar below header */}
        <div style={{ height: 3, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${step >= 1 ? (step / TOTAL_STEPS) * 100 : 0}%`,
              background: 'linear-gradient(90deg,#CA8A04,#FBBF24)',
            }}
          />
        </div>

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div className="px-6 py-10 text-center">
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{ background: 'rgba(202,138,4,0.12)', borderColor: 'rgba(202,138,4,0.3)', boxShadow: '0 0 40px rgba(202,138,4,0.2)' }}
            >
              <Sparkles size={28} style={{ color: GOLD }} />
            </div>
            <h2 className="font-display text-[28px] font-bold tracking-tight mb-2" style={{ color: theme.text }}>
              Welcome to Zynth, {firstName}!
            </h2>
            <p className="text-sm mb-8" style={{ color: theme.textMuted }}>
              Four quick questions so we can tailor your journal. It takes about a minute.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStep(1)}
                className={GOLD_BTN_CLASS}
                style={GOLD_BTN}
              >
                Let's go
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all"
                style={{ borderColor: theme.border, color: theme.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = theme.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Steps 1–4 ── */}
        {step >= 1 && (
          <>
            {/* Step header */}
            <div className="px-6 pt-5 pb-2">
              {StepIcon && (
                <div
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3"
                  style={{ backgroundColor: 'rgba(202,138,4,0.12)', color: GOLD }}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
              )}
              {step === 1 && (
                <>
                  <h2 className="font-display text-[22px] font-bold tracking-tight mb-1" style={{ color: theme.text }}>What describes you best?</h2>
                  <p className="text-sm" style={{ color: theme.textMuted }}>We'll tailor your experience to your level.</p>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="font-display text-[22px] font-bold tracking-tight mb-1" style={{ color: theme.text }}>Which markets do you trade?</h2>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Select all that apply.</p>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="font-display text-[22px] font-bold tracking-tight mb-1" style={{ color: theme.text }}>What are your main goals?</h2>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Pick your top priorities.</p>
                </>
              )}
              {step === 4 && (
                <>
                  <h2 className="font-display text-[22px] font-bold tracking-tight mb-1" style={{ color: theme.text }}>Personalize your profile</h2>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Set a display name, upload a photo, and choose a color.</p>
                </>
              )}
            </div>

            {/* Step body */}
            <div className="px-6 pb-2 overflow-y-auto" style={{ maxHeight: '42vh' }}>

              {step === 1 && (
                <div className="space-y-2">
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <SelectCard
                      key={opt.value}
                      label={opt.label}
                      desc={opt.desc}
                      selected={experience === opt.value}
                      onClick={() => setExperience(opt.value)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-wrap gap-2">
                  {MARKET_OPTIONS.map(m => (
                    <MultiChip
                      key={m}
                      label={m}
                      selected={markets.includes(m)}
                      onClick={() => toggleMarket(m)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map(g => (
                    <MultiChip
                      key={g}
                      label={g}
                      selected={goals.includes(g)}
                      onClick={() => toggleGoal(g)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  {/* Avatar with camera overlay */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden"
                        style={{ backgroundColor: selectedColor?.bg ?? GOLD }}
                      >
                        {avatarPreview
                          ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        style={{ backgroundColor: GOLD, color: '#1a1203' }}
                        title="Upload photo"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: theme.text }}>{displayName || 'Your Name'}</p>
                      <p className="text-xs mb-1" style={{ color: theme.textMuted }}>{user?.email}</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs transition-colors"
                        style={{ color: theme.isDark ? '#FBBF24' : '#A16207' }}
                      >
                        {avatarPreview ? 'Change photo' : 'Upload photo (optional)'}
                      </button>
                    </div>
                  </div>

                  {/* Name input */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.textMuted }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      maxLength={40}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none transition-colors"
                      style={{
                        backgroundColor: theme.surface2,
                        borderColor: theme.border,
                        color: theme.text,
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={e => (e.currentTarget.style.borderColor = theme.border)}
                    />
                  </div>

                  {/* Color picker */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: theme.textMuted }}>
                      Avatar Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_COLORS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setAvatarColor(c.value)}
                          className="w-8 h-8 rounded-full transition-all duration-200"
                          style={{
                            backgroundColor: c.bg,
                            boxShadow: avatarColor === c.value
                              ? `0 0 0 3px ${theme.surface}, 0 0 0 5px ${c.ring}`
                              : 'none',
                            transform: avatarColor === c.value ? 'scale(1.15)' : 'scale(1)',
                          }}
                          title={c.label}
                          aria-label={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t" style={{ borderColor: theme.border }}>
              {error && <ErrorBar message={error} className="mb-3" />}
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <div className="flex-1" />
                {step < TOTAL_STEPS ? (
                  <button
                    onClick={() => canAdvance() && setStep(s => s + 1)}
                    disabled={!canAdvance()}
                    className={GOLD_BTN_CLASS}
                    style={GOLD_BTN}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => submitProfile()}
                    disabled={!canAdvance() || submitting}
                    className={GOLD_BTN_CLASS}
                    style={GOLD_BTN}
                  >
                    {submitting ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" opacity="0.75" />
                      </svg>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {submitting ? 'Saving…' : "Let's go"}
                  </button>
                )}
              </div>

              {/* Skip links */}
              <div className="text-center mt-2.5">
                {step < TOTAL_STEPS && (
                  <button
                    onClick={handleSkip}
                    className="text-xs transition-colors"
                    style={{ color: theme.textMuted }}
                    onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = theme.textMuted)}
                  >
                    I'll do this later
                  </button>
                )}
                {step === TOTAL_STEPS && (
                  <button
                    onClick={() => submitProfile({ skipPhoto: true })}
                    disabled={submitting}
                    className="text-xs transition-colors disabled:opacity-50"
                    style={{ color: theme.textMuted }}
                    onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = theme.textMuted)}
                  >
                    Skip for now
                  </button>
                )}
              </div>
              <p className="text-center text-xs mt-1.5" style={{ color: theme.textMuted }}>
                Step {step} of {TOTAL_STEPS}
              </p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
    </>
  );
}


