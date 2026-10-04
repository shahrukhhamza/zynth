/**
 * End-to-end API regression suite (auth, journal, payments, plan gating, admin, rate limits).
 *
 * Run against a LOCAL server + LOCAL Postgres only. It creates users, flips is_admin / plan
 * columns directly in the database and hammers the auth endpoints, so it refuses to run when
 * DATABASE_URL does not point at localhost.
 *
 *   # terminal 1 (server/): PROMO_ELITE_FREE=false DATABASE_URL=postgresql://user:pass@localhost:5432/zynth JWT_SECRET=x PORT=5000 node server.js
 *   # terminal 2 (server/): DATABASE_URL=postgresql://user:pass@localhost:5432/zynth npm run test:e2e
 *
 * PROMO_ELITE_FREE=false is required: the suite asserts free-tier gating, which the launch promo opens up.
 * Restart the server between runs: the auth limiter keeps its counters in memory.
 */
import pg from 'pg';
const DATABASE_URL = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)(:|\/)/.test(DATABASE_URL)) {
  console.error('Refusing to run: DATABASE_URL must point at a local database (found: ' + (DATABASE_URL ? 'a remote host' : 'nothing') + ').');
  process.exit(2);
}
const B = (process.env.API_BASE || 'http://localhost:5000') + '/api';
const db = new pg.Pool({ connectionString: DATABASE_URL });
let pass = 0, fail = 0; const fails = [];
const ok = (name, cond, extra = '') => { if (cond) pass++; else { fail++; fails.push(name + ' ' + extra); console.log('FAIL:', name, extra); } };
async function req(method, path, { token, body, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = 'Bearer ' + token;
  let b = body;
  if (body && !(body instanceof FormData)) { h['Content-Type'] = 'application/json'; b = JSON.stringify(body); }
  const r = await fetch(B + path, { method, headers: h, body: b });
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, headers: r.headers };
}
const rnd = Math.random().toString(36).slice(2, 8);
const TX = Array.from({length:64},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
const email = `u_${rnd}@test.com`, pw = 'Passw0rd!123';

// ── Public stats (no login)
let ps = await req('GET', '/public-stats'); ok('public-stats is public', ps.status === 200 && typeof ps.json.totalUsers === 'number', ps.text);

// ── Auth
let r = await req('GET', '/health'); ok('health', r.status === 200);
r = await req('GET', '/journal/trades'); ok('unauth journal 401', r.status === 401);
r = await req('POST', '/auth/register', { body: { name: 'T', email, password: pw } }); ok('register no terms 400', r.status === 400, r.status);
r = await req('POST', '/auth/register', { body: { name: 'T', email, password: 'short', terms_accepted: true } }); ok('register short pw 400', r.status === 400);
r = await req('POST', '/auth/register', { body: { name: 'T', email, password: { a: 1 }, terms_accepted: true } }); ok('register object pw 400 (not 500)', r.status === 400, r.status);
r = await req('POST', '/auth/register', { body: { name: 'T', email: 'bad', password: pw, terms_accepted: true } }); ok('register bad email 400', r.status === 400);
r = await req('POST', '/auth/register', { body: { name: 'Tester', email, password: pw, terms_accepted: true } }); ok('register ok 201', r.status === 201, r.text);
const token = r.json?.token, uid = r.json?.user?.id;
r = await req('POST', '/auth/register', { body: { name: 'Tester', email, password: pw, terms_accepted: true } }); ok('register dup 409', r.status === 409);
r = await req('POST', '/auth/login', { body: { email, password: 'wrong' } }); ok('login wrong 401', r.status === 401);
r = await req('POST', '/auth/login', { body: { email, password: pw } }); ok('login ok', r.status === 200 && r.json.token);
r = await req('GET', '/auth/me', { token }); ok('me', r.status === 200 && r.json.user.email === email);
r = await req('GET', '/auth/me', { token: 'garbage' }); ok('me bad token 401', r.status === 401);

// ── update-profile partial wipe
r = await req('PUT', '/auth/update-profile', { token, body: { trading_experience: 'beginner', markets_traded: ['forex'], goals: ['income'], avatar_color: 'blue', name: 'Tester' } });
ok('profile set', r.status === 200 && r.json.user.avatar_color === 'blue');
r = await req('PUT', '/auth/update-profile', { token, body: { name: 'Tester 2' } });
ok('profile partial update keeps fields', r.json?.user?.trading_experience === 'beginner' && r.json?.user?.avatar_color === 'blue', JSON.stringify(r.json?.user));

// ── forgot / reset
r = await req('POST', '/auth/forgot-password', { body: { email } }); ok('forgot 200', r.status === 200, r.text);
const row = (await db.query('select reset_token, reset_token_expires from users where id=$1', [uid])).rows[0];
ok('reset token stored', !!row.reset_token);
r = await req('POST', '/auth/reset-password', { body: { token: row.reset_token, newPassword: 'NewPassw0rd!1' } }); ok('reset ok', r.status === 200, r.text);
r = await req('POST', '/auth/reset-password', { body: { token: row.reset_token, newPassword: 'NewPassw0rd!1' } }); ok('reset token single-use', r.status === 400);
r = await req('POST', '/auth/login', { body: { email, password: 'NewPassw0rd!1' } }); ok('login new pw', r.status === 200);
r = await req('GET', '/auth/me', { token }); ok('old JWT revoked after pw reset', r.status === 401, r.status);
const token2 = (await req('POST', '/auth/login', { body: { email, password: 'NewPassw0rd!1' } })).json.token;

// ── Journal (free)
r = await req('POST', '/journal/trades', { token: token2, body: { pair: 'eurusd', direction: 'BUY', entry_price: '1.1', exit_price: '1.2', outcome: 'loss', profit_loss: '50', strategy: 'x' } });
ok('trade create', r.status === 201, r.text);
const tid = r.json?.data?.id;
ok('loss pnl negative', r.json?.data?.profit_loss === -50);
r = await req('POST', '/journal/trades', { token: token2, body: { pair: 'eurusd', direction: 'buy', entry_price: 'abc' } }); ok('trade NaN price 400 not 500', r.status === 400, r.status);
r = await req('POST', '/journal/trades', { token: token2, body: { pair: 'eurusd', direction: 'sideways' } }); ok('trade bad direction 400', r.status === 400, r.status);
r = await req('GET', '/journal/trades?limit=-5', { token: token2 }); ok('negative limit not 500', r.status === 200, r.status);
r = await req('GET', '/journal/trades/abc', { token: token2 }); ok('trade id NaN 400/404 not 500', [400, 404].includes(r.status), r.status);
r = await req('PUT', '/journal/trades/' + tid, { token: token2, body: { outcome: 'win', profit_loss: '-30', entry_price: 'zzz' } }); ok('update NaN 400 not 500', r.status === 400, r.status);
r = await req('PUT', '/journal/trades/' + tid, { token: token2, body: { outcome: 'win', profit_loss: '-30' } }); ok('update ok', r.status === 200 && r.json.data.profit_loss === 30, r.text);
r = await req('GET', '/journal/stats', { token: token2 }); ok('stats', r.status === 200 && r.json.total === 1, r.text);
// other user isolation
const em2 = `u2_${rnd}@test.com`;
const t3 = (await req('POST', '/auth/register', { body: { name: 'Other', email: em2, password: pw, terms_accepted: true } })).json.token;
r = await req('GET', '/journal/trades/' + tid, { token: t3 }); ok('other user cannot read trade', r.status === 403);
r = await req('PUT', '/journal/trades/' + tid, { token: t3, body: { notes: 'hack' } }); ok('other user cannot edit trade', r.status === 403);
r = await req('DELETE', '/journal/trades/' + tid, { token: t3 }); ok('other user cannot delete trade', r.status === 404);
r = await req('GET', '/journal/analytics', { token: token2 }); ok('analytics pro-gated', r.status === 403);
// free limit: 5 lifetime entries (1 already created above)
for (let i = 0; i < 4; i++) await req('POST', '/journal/trades', { token: token2, body: { pair: 'gbpusd', direction: 'sell' } });
r = await req('POST', '/journal/trades', { token: token2, body: { pair: 'gbpusd', direction: 'sell' } }); ok('free limit hit at 6th', r.status === 403 && r.json.error === 'journal_limit_reached', r.text);
r = await req('DELETE', '/journal/trades/' + tid, { token: token2 }); ok('delete ok', r.status === 200);
r = await req('GET', '/journal/trades/' + tid, { token: token2 }); ok('deleted trade 404', r.status === 404, r.status);
r = await req('PUT', '/journal/trades/' + tid, { token: token2, body: { notes: 'zombie' } }); ok('deleted trade not editable', r.status === 404, r.status);

// ── checklist, levels, events
r = await req('POST', '/checklist', { token: token2, body: { score: 80, answers: { a: 1 }, recommendation: 'green_light' } }); ok('checklist post', r.status === 201, r.text);
r = await req('GET', '/checklist/stats', { token: token2 }); ok('checklist stats', r.status === 200 && r.json.data.totalChecks === 1);
r = await req('POST', '/levels', { token: token2, body: { symbol: 'XAU/USD', type: 'Support', price: 2000 } }); ok('level create', r.status === 201, r.text);
const lid = r.json?.id;
r = await req('GET', '/levels?symbol=XAU/USD', { token: token2 }); ok('levels list', r.json?.levels?.length === 1);
r = await req('DELETE', '/levels/' + lid, { token: t3 }); ok('other user cannot delete level', r.status === 404);
r = await req('DELETE', '/levels/' + lid, { token: token2 }); ok('level delete', r.status === 200);
r = await req('POST', '/events/track', { token: token2, body: { event: 'upgrade_clicked' } }); ok('events track', r.status === 200);
r = await req('POST', '/events/track', { token: token2, body: { event: 'subscription_started' } }); ok('client cannot fake subscription_started', r.status === 400, r.status);

// ── Admin gating
r = await req('GET', '/admin/users', { token: token2 }); ok('admin users 403 for non-admin', r.status === 403);
r = await req('POST', '/calendar/refresh', { token: token2 }); ok('calendar refresh not for regular users', r.status === 403, r.status);
const emA = `admin_${rnd}@test.com`;
await req('POST', '/auth/register', { body: { name: 'Admin', email: emA, password: pw, terms_accepted: true } });
await db.query('update users set is_admin=1 where email=$1', [emA]);
const tA = (await req('POST', '/auth/login', { body: { email: emA, password: pw } })).json.token;
r = await req('GET', '/admin/users', { token: tA }); ok('admin users', r.status === 200 && r.json.users.length >= 3);
r = await req('GET', '/admin/stats', { token: tA }); ok('admin stats', r.status === 200 && r.json.totalUsers >= 3, r.text);
r = await req('GET', '/admin/analytics', { token: tA }); ok('admin analytics', r.status === 200, r.text.slice(0, 200));
r = await req('GET', '/admin/export-emails', { token: tA }); ok('admin export', r.status === 200 && r.text.includes(email));
r = await req('GET', '/admin/user/' + uid + '/events', { token: tA }); ok('admin user events', r.status === 200 && r.json.events.length > 0, r.text.slice(0, 200));

// ── Payments
r = await req('POST', '/payment/crypto', { token: token2, body: { txid: TX, amount: '8.90', plan: 'pro' } }); ok('crypto submit', r.status === 201, r.text);
const pid = r.json?.requestId;
r = await req('POST', '/payment/crypto', { token: token2, body: { txid: 'nothex!', plan: 'pro' } }); ok('crypto bad txid 400', r.status === 400);
r = await req('POST', '/payment/crypto', { token: t3, body: { txid: TX, amount: '8.90', plan: 'pro' } }); ok('duplicate TXID by another user rejected', r.status === 409 || r.status === 400, r.status);
const fd = new FormData(); fd.append('plan', 'pro'); fd.append('amount', '8.90'); fd.append('screenshot', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), 'p.png');
r = await req('POST', '/payment/jazzcash', { token: token2, body: fd }); ok('jazzcash submit', r.status === 201, r.text);
const fd2 = new FormData(); fd2.append('plan', 'pro'); fd2.append('screenshot', new Blob(['<html>'], { type: 'text/html' }), 'p.html');
r = await req('POST', '/payment/jazzcash', { token: token2, body: fd2 }); ok('jazzcash non-image 400', r.status === 400, r.status + r.text);
const fd3 = new FormData(); fd3.append('plan', 'pro'); fd3.append('screenshot', new Blob([Buffer.alloc(6 * 1024 * 1024)], { type: 'image/png' }), 'big.png');
r = await req('POST', '/payment/jazzcash', { token: token2, body: fd3 }); ok('jazzcash oversize 413/400 not 500', [400, 413].includes(r.status), r.status + r.text);
r = await req('GET', '/payment/status/' + uid, { token: token2 }); ok('payment status own', r.status === 200 && r.json.latest);
r = await req('GET', '/payment/status/' + uid, { token: t3 }); ok('payment status other 403', r.status === 403);
r = await req('PUT', `/payments/${pid}/approve`, { token: token2 }); ok('approve non-admin 403', r.status === 403);
r = await req('PUT', `/payments/${pid}/approve`, { token: tA }); ok('approve ok', r.status === 200, r.text);
r = await req('GET', '/auth/me', { token: token2 }); ok('user now pro', r.json?.user?.plan === 'pro', r.text);
r = await req('GET', '/journal/analytics', { token: token2 }); ok('pro can see analytics', r.status === 200, r.text);
await db.query("update users set plan_expires_at = NOW() - interval '1 day' where id=$1", [uid]);
r = await req('GET', '/auth/me', { token: token2 }); ok('expired plan downgraded to free', r.json?.user?.plan === 'free', JSON.stringify(r.json?.user?.plan));
r = await req('GET', '/journal/analytics', { token: token2 }); ok('expired pro loses analytics', r.status === 403, r.status);
r = await req('GET', '/payments/my', { token: token2 }); ok('payments my', r.status === 200 && r.json.requests.length >= 1);

// ── Ban
await db.query('update users set is_banned=1 where id=$1', [uid]).then(() => console.log('is_banned column exists')).catch(e => console.log('NOTE: no is_banned column:', e.message));

// ── Rate limit bypass (random Bearer tokens must not mint fresh buckets)
let blocked = 0;
for (let i = 0; i < 15; i++) {
  const x = await req('POST', '/auth/login', { body: { email: 'nobody@x.com', password: 'x' }, headers: { Authorization: 'Bearer fake' + i } });
  if (x.status === 429) blocked++;
}
ok('login limiter not bypassable via random Bearer', blocked > 0, 'blocked=' + blocked);

// ── Misc endpoints smoke
for (const p of ['/health', '/data/prices/live', '/news?limit=5', '/economic/dashboard', '/calendar?filter=week']) {
  const x = await req('GET', p, { token: tA }); console.log('smoke', p, x.status, x.text.slice(0, 100).replace(/\n/g, ' '));
}
console.log(`\nPASS ${pass} FAIL ${fail}`); fails.forEach(f => console.log(' -', f));
await db.end();
process.exit(fail ? 1 : 0);
