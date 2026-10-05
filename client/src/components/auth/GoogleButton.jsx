/**
 * GoogleButton — the official "Sign in with Google" button (Google Identity Services `renderButton`).
 *
 * Why not a custom button that calls `google.accounts.id.prompt()`?  That is One Tap, which Google
 * silently suppresses for hours or days after a user dismisses it once (and in many browsers when
 * third-party sign-in is blocked), so the button appears to "randomly stop working". `renderButton`
 * opens the normal Google popup every time.
 *
 * Shown only when VITE_ENABLE_GOOGLE_SIGNIN=true and VITE_GOOGLE_CLIENT_ID is set.
 */
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN === 'true' && !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// `google.accounts.id.initialize` must only run once per page load, so the latest callback lives in a module ref
let initialized = false;
let latestCallback = () => {};

function initOnce() {
  if (initialized) return true;
  if (!window.google?.accounts?.id) return false;
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => latestCallback(response),
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  });
  initialized = true;
  return true;
}

export default function GoogleButton({ onCredential, text = 'continue_with' }) {
  const theme = useTheme();
  const holder = useRef(null);
  const [failed, setFailed] = useState(false);

  latestCallback = (response) => { if (response?.credential) onCredential(response.credential); };

  useEffect(() => {
    if (!GOOGLE_ENABLED) return undefined;
    let cancelled = false;
    let tries = 0;

    const draw = () => {
      if (cancelled || !holder.current) return;
      if (!initOnce()) {
        // the Google script loads async; give up after ~8s (ad-blocker, offline, blocked by network)
        if (++tries > 80) { setFailed(true); return; }
        setTimeout(draw, 100);
        return;
      }
      holder.current.innerHTML = '';
      window.google.accounts.id.renderButton(holder.current, {
        type: 'standard',
        theme: theme.isDark ? 'filled_black' : 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(400, Math.max(240, holder.current.clientWidth || 400)),
      });
    };
    draw();
    return () => { cancelled = true; };
  }, [theme.isDark, text]);

  if (!GOOGLE_ENABLED) return null;
  return (
    <div className="mb-5">
      <div ref={holder} className="relative flex min-h-[44px] w-full justify-center" />
      {failed && (
        <p className="m-0 mt-2 text-center text-[12.5px]" style={{ color: theme.textMuted }}>
          Google sign-in could not load. Check your connection or ad-blocker, or use email instead.
        </p>
      )}
      <div className="mt-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
        <span className="h-px flex-1" style={{ background: theme.border }} />or<span className="h-px flex-1" style={{ background: theme.border }} />
      </div>
    </div>
  );
}
