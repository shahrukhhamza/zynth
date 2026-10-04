/**
 * events.js — User activity event store (PostgreSQL)
 *
 * Tracked events:
 *   user_signup          – new account created
 *   trade_added          – journal trade submitted
 *   ai_used              – AI analysis consumed
 *   ai_limit_hit         – user hit AI analysis cap
 *   journal_limit_hit    – user hit journal entry cap
 *   upgrade_modal_opened – upgrade modal shown (client-side)
 *   upgrade_clicked      – user clicked an upgrade CTA (client-side)
 *   subscription_started – plan upgraded (can be set via admin/webhook)
 */

import pool from './pool.js';

// ── Schema init ───────────────────────────────────────────────────────────────

export async function initEventsDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_events (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      event      TEXT    NOT NULL,
      metadata   JSONB   NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Indexes for efficient admin queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ue_user_id    ON user_events (user_id);
    CREATE INDEX IF NOT EXISTS idx_ue_event      ON user_events (event);
    CREATE INDEX IF NOT EXISTS idx_ue_created_at ON user_events (created_at DESC);
  `);

  console.log('✅ Events schema ready');
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * trackEvent — fire-and-forget event insert.
 * Never throws; errors are only logged so callers are never blocked.
 *
 * @param {number|string} userId
 * @param {string}        event     – event name from the list above
 * @param {object}        metadata  – optional extra context
 */
export function trackEvent(userId, event, metadata = {}) {
  if (!userId || !event) return;
  pool.query(
    `INSERT INTO user_events (user_id, event, metadata)
     VALUES ($1, $2, $3)`,
    [Number(userId), event, JSON.stringify(metadata)],
  ).catch(err => console.error('[trackEvent] insert failed:', err.message));
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * getUserEvents — chronological timeline for one user.
 * @param {number} userId
 * @param {number} limit  — default 100
 */
export async function getUserEvents(userId, limit = 100) {
  const { rows } = await pool.query(
    `SELECT id, user_id, event, metadata, created_at
     FROM   user_events
     WHERE  user_id = $1
     ORDER  BY created_at DESC
     LIMIT  $2`,
    [Number(userId), limit],
  );
  return rows;
}

/**
 * getAnalyticsSummary — aggregate counts for the admin analytics view.
 * Returns a single object with conversion-funnel metrics.
 */
export async function getAnalyticsSummary() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE event = 'user_signup')          AS signups,
      COUNT(*) FILTER (WHERE event = 'trade_added')          AS trades_added,
      COUNT(*) FILTER (WHERE event = 'ai_used')              AS ai_used,
      COUNT(*) FILTER (WHERE event = 'ai_limit_hit')         AS ai_limit_hits,
      COUNT(*) FILTER (WHERE event = 'journal_limit_hit')    AS journal_limit_hits,
      COUNT(*) FILTER (WHERE event = 'upgrade_modal_opened') AS modal_opens,
      COUNT(*) FILTER (WHERE event = 'upgrade_clicked')      AS upgrade_clicks,
      COUNT(*) FILTER (WHERE event = 'subscription_started') AS subscriptions,
      COUNT(DISTINCT user_id) FILTER (WHERE event = 'ai_used')              AS ai_unique_users,
      COUNT(DISTINCT user_id) FILTER (WHERE event = 'upgrade_modal_opened') AS modal_unique_users,
      COUNT(DISTINCT user_id) FILTER (WHERE event = 'upgrade_clicked')      AS click_unique_users
    FROM user_events
  `);

  // All counts come back as strings from pg; coerce to numbers
  const r = rows[0] ?? {};
  return Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, Number(v ?? 0)]),
  );
}

/**
 * getAnalyticsEnhanced — full conversion intelligence payload.
 *
 * Returns:
 *   totals      – raw event counts
 *   funnel      – step-to-step conversion percentages
 *   dropoffs    – absolute users lost at each stage
 *   topTriggers – ranked sources that opened the upgrade modal
 *   insights    – auto-generated human-readable bullets
 *
 * Also includes all legacy flat keys so the existing admin route continues
 * to work without structural changes.
 */
export async function getAnalyticsEnhanced() {
  const safePct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

  // ── Single-pass aggregate ────────────────────────────────────────────────
  const [{ rows: [r] }, { rows: triggerRows }] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE event = 'user_signup')          AS signups,
        COUNT(*) FILTER (WHERE event = 'trade_added')          AS trades_added,
        COUNT(*) FILTER (WHERE event = 'ai_used')              AS ai_used,
        COUNT(*) FILTER (WHERE event = 'ai_limit_hit')         AS ai_limit_hits,
        COUNT(*) FILTER (WHERE event = 'journal_limit_hit')    AS journal_limit_hits,
        COUNT(*) FILTER (WHERE event = 'upgrade_modal_opened') AS modal_opens,
        COUNT(*) FILTER (WHERE event = 'upgrade_clicked')      AS upgrade_clicks,
        COUNT(*) FILTER (WHERE event = 'subscription_started') AS subscriptions,
        COUNT(DISTINCT user_id) FILTER (WHERE event = 'ai_used')              AS ai_unique_users,
        COUNT(DISTINCT user_id) FILTER (WHERE event = 'upgrade_modal_opened') AS modal_unique_users,
        COUNT(DISTINCT user_id) FILTER (WHERE event = 'upgrade_clicked')      AS click_unique_users
      FROM user_events
    `),
    pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(metadata->>'source'), ''), 'unknown') AS source,
        COUNT(*)              AS count,
        COUNT(DISTINCT user_id) AS unique_users
      FROM user_events
      WHERE event = 'upgrade_modal_opened'
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `),
  ]);

  const c = Object.fromEntries(
    Object.entries(r ?? {}).map(([k, v]) => [k, Number(v ?? 0)]),
  );

  const topTriggers = triggerRows.map(row => ({
    source:      row.source,
    count:       Number(row.count),
    uniqueUsers: Number(row.unique_users),
  }));

  const totalLimits = c.ai_limit_hits + c.journal_limit_hits;

  // ── Funnel (step-to-step rates) ──────────────────────────────────────────
  const funnel = {
    aiToLimit:        safePct(totalLimits,       c.ai_used),
    limitToModal:     safePct(c.modal_opens,     totalLimits),
    modalToClick:     safePct(c.upgrade_clicks,  c.modal_opens),
    clickToSubscribe: safePct(c.subscriptions,   c.upgrade_clicks),
    signupToConvert:  safePct(c.subscriptions,   c.signups),
  };

  // ── Drop-offs (absolute users lost at each stage) ────────────────────────
  const dropoffs = {
    afterAI:    c.ai_used        - totalLimits,
    afterLimit: totalLimits      - c.modal_opens,
    afterModal: c.modal_opens    - c.upgrade_clicks,
    afterClick: c.upgrade_clicks - c.subscriptions,
  };

  // ── Auto-generated insights ──────────────────────────────────────────────
  const insights = [];
  if (c.ai_used > 0 && funnel.aiToLimit > 0)
    insights.push(`${funnel.aiToLimit}% of AI users hit a usage limit`);
  if (totalLimits > 0 && funnel.limitToModal > 0)
    insights.push(`${funnel.limitToModal}% of users who hit a limit open the upgrade modal`);
  if (c.modal_opens > 0 && funnel.modalToClick > 0)
    insights.push(`${funnel.modalToClick}% of users who see the modal click upgrade`);
  if (c.upgrade_clicks > 0 && funnel.clickToSubscribe > 0)
    insights.push(`${funnel.clickToSubscribe}% of users who click upgrade complete a subscription`);
  if (dropoffs.afterLimit > 0)
    insights.push(`${dropoffs.afterLimit} users hit a limit but never saw the upgrade modal — friction point`);
  if (dropoffs.afterModal > 0)
    insights.push(`${dropoffs.afterModal} users viewed the modal but didn't click upgrade`);
  if (topTriggers.length > 0)
    insights.push(`Top upgrade trigger: "${topTriggers[0].source}" with ${topTriggers[0].count} modal opens`);
  if (funnel.signupToConvert > 0)
    insights.push(`Overall conversion: ${funnel.signupToConvert}% of signups become paying users`);

  return {
    // Structured payload
    totals: {
      signups:          c.signups,
      tradesAdded:      c.trades_added,
      aiUsed:           c.ai_used,
      aiLimitHits:      c.ai_limit_hits,
      journalLimitHits: c.journal_limit_hits,
      totalLimitHits:   totalLimits,
      modalOpens:       c.modal_opens,
      upgradeClicks:    c.upgrade_clicks,
      subscriptions:    c.subscriptions,
      aiUniqueUsers:    c.ai_unique_users,
      modalUniqueUsers: c.modal_unique_users,
      clickUniqueUsers: c.click_unique_users,
    },
    funnel,
    dropoffs,
    topTriggers,
    insights,

    // ── Legacy flat keys (backward compat with existing admin routes) ────────
    ...c,
    conversionRate:   funnel.signupToConvert,
    upgradeClickRate: funnel.modalToClick,
    modalOpenRate:    safePct(c.modal_opens, c.ai_unique_users),
    limitHitRate:     safePct(totalLimits, c.ai_used + c.trades_added),
  };
}

/**
 * getEventsByType — recent events of a specific type (for trend tables).
 * @param {string} event
 * @param {number} limit
 */
export async function getEventsByType(event, limit = 50) {
  const { rows } = await pool.query(
    `SELECT ue.id, ue.user_id, ue.event, ue.metadata, ue.created_at,
            u.name, u.email, u.plan
     FROM   user_events ue
     LEFT   JOIN users u ON u.id = ue.user_id
     WHERE  ue.event = $1
     ORDER  BY ue.created_at DESC
     LIMIT  $2`,
    [event, limit],
  );
  return rows;
}
