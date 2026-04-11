import axios from 'axios';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendPasswordResetEmail(toEmail, resetLink, userName) {
  const displayName = escapeHtml(userName || 'Trader');

  // Validate reset link starts with expected origin
  const clientUrl = process.env.CLIENT_URL || '';
  if (clientUrl && !resetLink.startsWith(clientUrl)) {
    throw new Error('Invalid reset link origin');
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Zynth password</title>
</head>
<body style="margin:0;padding:0;background:#07090f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#10b981;">Zynth</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0b1322;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:40px 40px 36px;">

              <!-- Heading -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;text-align:center;">
                Reset Your Password
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;text-align:center;">
                We received a request to reset your password.
              </p>

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:15px;color:#d1d5db;line-height:1.6;">
                Hi <strong style="color:#f9fafb;">${displayName}</strong>,
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.6;">
                Click the button below to set a new password for your Zynth account. If you didn't request this, you can safely ignore this email — your password will remain unchanged.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 36px;background:#10b981;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry warning -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(234,179,8,0.07);border:1px solid rgba(234,179,8,0.18);border-radius:10px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#fbbf24;text-align:center;">
                      ⚠️ This link expires in <strong>1 hour</strong>. Request a new one if it has expired.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:28px 0 0;font-size:12px;color:#4b5563;text-align:center;line-height:1.6;">
                If the button doesn't work, copy and paste this URL into your browser:<br />
                <a href="${resetLink}" style="color:#10b981;word-break:break-all;">${resetLink}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#374151;">
                © 2026 Zynth. All rights reserved.
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#1f2937;">
                You received this email because a password reset was requested for your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const body = {
    sender:      { name: 'Zynth', email: 'support@zynth.com' },
    to:          [{ email: toEmail }],
    subject:     'Reset your Zynth password',
    htmlContent: html,
  };

  const response = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    body,
    {
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('[Brevo] Email send response:', JSON.stringify(response.data));
  return response.data;
}
