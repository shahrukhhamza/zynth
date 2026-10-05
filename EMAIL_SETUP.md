# Email setup (verification codes and password reset)

Zynth emails a **6-digit code** when someone signs up with email and password, and when they reset their
password. Google sign-in users are unaffected.

- **Sign-up:** the form creates a *pending* sign-up and emails a code. The account is only created once the
  code is entered, so mistyped or fake addresses never become accounts.
- **Reset:** email → 6-digit code → new password.
- Codes expire after 10 minutes, allow 5 wrong attempts, are single-use, and resending is limited to once a
  minute and 5 per hour per address.

## Why it needs setup

Emails can only be sent **from an address you have verified with an email provider**. Sending from an address
or domain you have not verified is rejected (this is why the old password-reset mail never arrived: it was sent
from `support@zynth.com`, which was not a verified sender). Render's free tier also blocks SMTP, so Zynth uses
the providers' HTTPS APIs.

Until a sender is configured, **nothing changes for users**: sign-up keeps creating accounts immediately, and
the password-reset form says email reset is unavailable. Verification switches on by itself once the variables
below are set.

## Option A: Resend (recommended)

Free: 3,000 emails/month (100/day). Good deliverability when the domain is verified.

1. Create an account at <https://resend.com> → **Domains** → **Add domain** → `zynth.codes`.
2. Resend shows DNS records (SPF, DKIM and optionally DMARC). Add them where `zynth.codes` DNS is managed
   (your domain registrar, or Vercel → Domains → DNS records if the domain's nameservers are Vercel's).
   Click **Verify** in Resend (can take a few minutes up to a few hours).
3. **API Keys** → create a key with *Sending access*.
4. On **Render** → your service → **Environment**, add:

   | Variable | Value |
   |---|---|
   | `RESEND_API_KEY` | the key from step 3 |
   | `EMAIL_FROM` | `Zynth <no-reply@zynth.codes>` (any address @ the verified domain) |

5. Save (Render redeploys). Sign up with a real address and check the code arrives.

## Option B: Brevo

Free: 300 emails/day.

1. In Brevo → **Senders, Domains & Dedicated IPs** → authenticate the domain `zynth.codes` (DNS records, like
   above), or at minimum verify a single sender address.
2. **SMTP & API** → create an **API key** (the `xkeysib-…` key, not an SMTP password).
3. On Render set `BREVO_API_KEY` and `EMAIL_FROM` (`Zynth <no-reply@zynth.codes>`, the same address you verified).

If both keys are set, Resend is used.

## Controls

| Variable | Effect |
|---|---|
| `EMAIL_VERIFICATION=auto` (default) | Verification is on only when a provider and `EMAIL_FROM` are configured |
| `EMAIL_VERIFICATION=on` | Always require it (production without a provider returns "temporarily unavailable") |
| `EMAIL_VERIFICATION=off` | Never ask for a code, even if email is configured |

## Testing locally

With `NODE_ENV` not `production` and no provider configured, the server **prints the email to its console** and
the sign-up / reset screens show the code in a small "Development mode" note. Set `EMAIL_VERIFICATION=on` to
try the flow without any email account.

## Troubleshooting

- *"We could not send the verification email"* → the provider rejected the message. Check the Render logs for the
  provider's error: usually the sender domain is not verified yet, or `EMAIL_FROM` does not match it.
- *Emails land in spam* → finish the DKIM/SPF records and add a DMARC record; avoid sending from a free
  `@gmail.com` address.
- Check `https://zynth.codes/api/health` after deploying to confirm the service is up.
