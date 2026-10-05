# Hosting Zynth for free: Supabase + Render

**What goes where**

| Part | Host | Why |
|---|---|---|
| Postgres database (500 MB free) | **Supabase** | Managed Postgres, nothing to run yourself |
| File storage: avatars, journal screenshots, payment proofs (1 GB free) | **Supabase Storage** | A free web host has no persistent disk |
| Express API + the built React app | **Render** (free web service) | Supabase cannot run a long-lived Node server (it only runs short serverless functions). Zynth needs WebSockets, scheduled jobs and in-memory caches, so it needs a real Node host. `render.yaml` is already prepared. |

The frontend is served by the same Express server, so there is one URL and no CORS setup.

---

## 1. Create the Supabase project (5 min)

1. https://supabase.com → **New project**. Pick the region nearest your users and set a **database password** (save it).
2. Wait for it to finish provisioning, then click **Connect** (top bar) and copy the **Session pooler** connection string:

   ```
   postgresql://postgres.<project-ref>:<YOUR-PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

   > Use the **pooler** string, not the "Direct connection" one. The direct host (`db.<ref>.supabase.co`) is
   > IPv6-only and fails on Render and most hosts. Replace `[YOUR-PASSWORD]` with the real password
   > (URL-encode special characters such as `@` → `%40`).
3. **Project Settings → API**: copy the **Project URL** (`https://<ref>.supabase.co`) and the **`service_role` key**.
   The service-role key is a secret: it bypasses all security rules. Only ever put it in server environment
   variables, never in the frontend or in git.

You do **not** need to create tables or buckets. On first start Zynth creates every table, turns on Row Level
Security (so Supabase's public API can never read your users table), and creates the buckets
`zynth-media` (public) and `zynth-private` (payment proofs, admin-only).

## 2. Deploy to Render (10 min)

1. Push the repo to GitHub.
2. https://render.com → **New → Blueprint** → pick the repo. Render reads `render.yaml`.
3. Fill in the environment variables it asks for:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Session pooler string from step 1 |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` key |
   | `CLIENT_URL` | your Render URL, e.g. `https://zynth-app.onrender.com` (set after the first deploy, then redeploy) |
   | `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` | same Google OAuth client id (also add your Render URL under *Authorized JavaScript origins* in Google Cloud Console) |
   | `GEMINI_API_KEY`, `FINNHUB_API_KEY`, `POLYGON_API_KEY`, `TWELVE_DATA_API_KEY`, `FRED_API_KEY`, `BLS_API_KEY`, `BEA_API_KEY` | your existing keys |

   `JWT_SECRET` is generated for you. Optional: `PROMO_ELITE_FREE=false` ends the launch promo, and
   `PROMO_ELITE_LIMIT=100` sets how many early users get free Elite.
4. Deploy. In the logs you should see `✅ PostgreSQL connected`, the schema lines, and two
   `✅ Supabase Storage bucket created` lines.
5. Check `https://<your-app>.onrender.com/api/health` → `"storage":"supabase"` and
   `/api/health/db` → `{"status":"ok","dbLatencyMs":…}`.

## 3. Keep it awake (important on the free tier)

- **Render free services sleep after 15 min without traffic** and take ~30–60 s to wake. While asleep the
  scheduled economic-data jobs don't run either.
- **Supabase free projects pause after 7 days without activity.**

One free monitor fixes both: create an [UptimeRobot](https://uptimerobot.com) (or cron-job.org) HTTP monitor for
`https://<your-app>.onrender.com/api/health/db` every **5 minutes**. That request wakes Render and runs a
`SELECT 1` against Supabase.

## 4. Limits to know about

- Database: 500 MB. Screenshots and proofs live in Storage (1 GB), not in the database, so the DB stays small.
- Free Render: 512 MB RAM, ~750 instance-hours per month (enough for one always-on service).
- Emails: sign-up verification codes and password reset need a verified sender. Follow `EMAIL_SETUP.md` (Resend or Brevo); until then sign-up works without verification.

## 5. Moving existing data (optional)

If your old Railway database is still reachable, copy it across (requires the `pg_dump` / `psql` tools):

```bash
pg_dump --no-owner --no-privileges "<old railway DATABASE_URL>" > zynth.sql
psql "<supabase session-pooler URL>" < zynth.sql
```

If it is not reachable, Zynth simply starts fresh on Supabase. Note that the free-Elite promo then counts
signups from zero.

## 6. Running locally against Supabase

Put the same `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`. Be aware that
local development will then read and write the **real** database. Create a second free Supabase project for
development if you want to keep them separate.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `ENETUNREACH` or timeouts to `db.<ref>.supabase.co` | You used the Direct connection. Switch to the **Session pooler** string. |
| `password authentication failed` | Wrong password or un-encoded special characters in the URL. |
| `too many clients` / `MaxClientsInSessionMode` | Lower `DB_POOL_MAX` (default 8) or switch to the Transaction pooler (port 6543). |
| Uploads fall back to local disk (lost on restart) | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing; `/api/health` shows `"storage":"local"`. |
| First page load takes ~40 s | Render woke from sleep; see section 3. |
