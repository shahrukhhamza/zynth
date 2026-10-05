/**
 * Transactional email: signup verification codes and password-reset codes.
 *
 * Providers (both plain HTTPS APIs, so they work on hosts that block SMTP, like Render's free tier):
 *   RESEND_API_KEY  → Resend  (recommended; verify your domain in the Resend dashboard)
 *   BREVO_API_KEY   → Brevo   (the sender must be a verified sender/domain in Brevo)
 * EMAIL_FROM is required, e.g.  Zynth <no-reply@zynth.codes>  — it must belong to a verified sender/domain,
 * otherwise the provider rejects the message. Without a provider + EMAIL_FROM, email is "not configured".
 *
 * In development (NODE_ENV !== 'production') an unconfigured server prints the code to the console instead,
 * so the whole flow can be tried locally.
 */
import axios from 'axios';

const isProd = () => process.env.NODE_ENV === 'production';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/** "Zynth <no-reply@zynth.codes>" -> { name, email } */
export function parseFrom(from) {
  const m = String(from || '').match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/);
  if (m) return { name: (m[1] || 'Zynth').trim() || 'Zynth', email: m[2].trim() };
  return { name: 'Zynth', email: String(from || '').trim() };
}

function provider() {
  if (!process.env.EMAIL_FROM) return null;
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.BREVO_API_KEY) return 'brevo';
  return null;
}

/** True when a real provider and a sender are configured. */
export function emailConfigured() {
  return provider() !== null;
}

/**
 * Should new sign-ups be asked for an email code?
 *   EMAIL_VERIFICATION=on   → always (dev falls back to console; production needs a provider)
 *   EMAIL_VERIFICATION=off  → never
 *   unset / auto            → only once email is actually configured, so signup never breaks on an unconfigured host
 */
export function verificationEnabled() {
  const v = String(process.env.EMAIL_VERIFICATION || 'auto').toLowerCase();
  if (v === 'off' || v === 'false' || v === '0') return false;
  if (v === 'on' || v === 'true' || v === '1') return true;
  return emailConfigured();
}

/** Whether a code can be delivered at all right now (a real provider, or the dev console fallback). */
export function canDeliver() {
  return emailConfigured() || !isProd();
}

export function usesConsoleFallback() {
  return !emailConfigured() && !isProd();
}

async function deliver({ to, subject, html, text }) {
  const p = provider();
  if (!p) {
    if (isProd()) throw new Error('Email is not configured (set EMAIL_FROM and RESEND_API_KEY or BREVO_API_KEY).');
    console.log(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] ${text}\n`);
    return { dev: true };
  }
  const from = process.env.EMAIL_FROM;

  if (p === 'resend') {
    const { data } = await axios.post(
      'https://api.resend.com/emails',
      { from, to: [to], subject, html, text },
      { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return data;
  }

  const sender = parseFrom(from);
  const { data } = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    { sender, to: [{ email: to }], subject, htmlContent: html, textContent: text },
    { headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  return data;
}

/* ── Template ────────────────────────────────────────────────────────────── */
function siteUrl() {
  return (process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'https://zynth.codes').replace(/\/+$/, '');
}

function layout({ preheader, title, intro, code, note, footnote }) {
  const logo = `${siteUrl()}/icon-192.png`;
  const digits = String(code).split('').map((d) =>
    `<td style="width:46px;height:58px;background:#fbf6e9;border:1px solid #ecd9a4;border-radius:12px;font:700 30px/58px 'SFMono-Regular',Menlo,Consolas,monospace;color:#1a1203;text-align:center;">${escapeHtml(d)}</td>`
  ).join('<td style="width:8px;"></td>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f2;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:10px;"><img src="${logo}" width="38" height="38" alt="" style="display:block;border-radius:10px;" /></td>
              <td style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#0b0b0f;">Zynth</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #e7e5e0;border-radius:20px;padding:0;overflow:hidden;">
            <div style="height:4px;background:linear-gradient(90deg,#CA8A04,#FBBF24);"></div>
            <div style="padding:36px 36px 32px;">
              <p style="margin:0 0 10px;font-size:22px;font-weight:700;color:#0b0b0f;">${escapeHtml(title)}</p>
              <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:#52525b;">${intro}</p>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 26px;"><tr>${digits}</tr></table>
              <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#52525b;text-align:center;">${note}</p>
              <p style="margin:22px 0 0;padding-top:20px;border-top:1px solid #efede8;font-size:13px;line-height:1.6;color:#8a8a93;">${footnote}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:22px;">
            <p style="margin:0;font-size:12px;color:#8a8a93;">&copy; ${new Date().getFullYear()} Zynth &middot; Intelligence behind every trade</p>
            <p style="margin:6px 0 0;font-size:12px;color:#a1a1aa;">Zynth is an analytics tool, not investment advice.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationCodeEmail(toEmail, userName, code, minutes = 10) {
  const name = escapeHtml(userName || 'there');
  const html = layout({
    preheader: `${code} is your Zynth verification code`,
    title: 'Verify your email',
    intro: `Hi <strong style="color:#0b0b0f;">${name}</strong>, welcome to Zynth. Enter this code to confirm your email and finish creating your account.`,
    code,
    note: `This code expires in <strong>${minutes} minutes</strong>.`,
    footnote: 'If you did not try to create a Zynth account, you can safely ignore this email. No account will be created.',
  });
  const text = `Your Zynth verification code is ${code}. It expires in ${minutes} minutes. If you did not try to create an account, ignore this email.`;
  return deliver({ to: toEmail, subject: `${code} is your Zynth verification code`, html, text });
}

export async function sendPasswordResetCodeEmail(toEmail, userName, code, minutes = 10) {
  const name = escapeHtml(userName || 'there');
  const html = layout({
    preheader: `${code} is your Zynth password reset code`,
    title: 'Reset your password',
    intro: `Hi <strong style="color:#0b0b0f;">${name}</strong>, we received a request to reset your Zynth password. Enter this code to choose a new one.`,
    code,
    note: `This code expires in <strong>${minutes} minutes</strong>.`,
    footnote: 'If you did not request a password reset, you can safely ignore this email. Your password will not change.',
  });
  const text = `Your Zynth password reset code is ${code}. It expires in ${minutes} minutes. If you did not request this, ignore this email.`;
  return deliver({ to: toEmail, subject: `${code} is your Zynth password reset code`, html, text });
}
