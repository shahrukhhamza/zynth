/**
 * MetaApi Cloud Service
 * ---------------------
 * Wraps the MetaApi Node.js SDK for:
 *   - Deploying a new cloud MT5 account
 *   - Removing a deployed account
 *   - Registering / de-registering a webhook listener URL
 *
 * Env: METAAPI_TOKEN  (from https://app.metaapi.cloud → API access tokens)
 */

// Lazy-loaded — metaapi.cloud-sdk bundles browser code that references `window`.
// Dynamic import defers evaluation until the first actual API call.
let _MetaApi = null;
async function getMetaApiClass() {
  if (!_MetaApi) {
    const mod = await import('metaapi.cloud-sdk');
    _MetaApi = mod.default ?? mod;
  }
  return _MetaApi;
}

const TOKEN = process.env.METAAPI_TOKEN;

async function getApi() {
  if (!TOKEN) {
    throw new Error(
      'METAAPI_TOKEN is not set. Add it to your Railway environment variables.'
    );
  }
  const MetaApi = await getMetaApiClass();
  return new MetaApi(TOKEN);
}

/**
 * Deploy a new Cloud Account on MetaApi.
 *
 * @param {object} opts
 * @param {string} opts.login      - MT5 account number
 * @param {string} opts.password   - Investor (read-only) password
 * @param {string} opts.server     - Broker server name e.g. "ICMarkets-Demo"
 * @param {'MT5'} opts.platform
 * @param {string} [opts.label]    - Friendly name shown in MetaApi dashboard
 * @returns {Promise<{ accountId: string, state: string }>}
 */
export async function deployAccount({ login, password, server, platform, label }) {
  const api = await getApi();
  const provisioningProfiles = api.metatraderAccountApi;

  const account = await provisioningProfiles.createAccount({
    name:           label ?? `${platform}:${login}@${server}`,
    type:           'cloud',
    login:          String(login),
    password,
    server,
    platform:       platform.toLowerCase(), // MetaApi expects 'mt4' | 'mt5'
    magic:          0,
    quoteStreamingIntervalInSeconds: 2.5,
    tags:           ['zynth'],
  });

  // Wait for the account to reach DEPLOYED state (max 3 min)
  await account.waitDeployed(180000);

  return { accountId: account.id, state: account.state ?? 'DEPLOYED' };
}

/**
 * Remove (undeploy + delete) a cloud account by its MetaApi account ID.
 * Silently succeeds if the account no longer exists.
 */
export async function removeAccount(metaApiAccountId) {
  const api = await getApi();
  try {
    const account = await api.metatraderAccountApi.getAccount(metaApiAccountId);
    if (account) {
      await account.undeploy();
      await account.remove();
    }
  } catch (err) {
    // 404-style errors mean it's already gone — that's fine
    if (!err.message?.includes('not found') && !err.message?.includes('404')) {
      throw err;
    }
  }
}

/**
 * Register a webhook URL on MetaApi so that trade events are POSTed
 * to /api/webhook/metaapi on your Railway backend.
 *
 * MetaApi calls this the "Webhook" or "Synchronization listener" URL
 * depending on SDK version — this uses the Webhooks REST API directly.
 *
 * @param {string} accountId
 * @param {string} webhookUrl  - e.g. "https://your-app.up.railway.app/api/webhook/metaapi"
 */
export async function registerWebhook(accountId, webhookUrl) {
  const api = await getApi();
  const account = await api.metatraderAccountApi.getAccount(accountId);
  // MetaApi >= 25.x exposes account.update({ webhookUrl })
  await account.update({ webhookUrl });
}
