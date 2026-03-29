const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function safeGet(store, key) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store, key, value) {
  try {
    store.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

function safeRemove(store, key) {
  try {
    store.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export function getAuthToken() {
  return (
    safeGet(sessionStorage, TOKEN_KEY)
    || safeGet(localStorage, TOKEN_KEY)
    || safeGet(localStorage, 'token')
    || null
  );
}

export function getAuthUser() {
  const raw = safeGet(sessionStorage, USER_KEY) || safeGet(localStorage, USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(user, token) {
  if (token) safeSet(sessionStorage, TOKEN_KEY, token);
  if (user) safeSet(sessionStorage, USER_KEY, JSON.stringify(user));

  // Enforce no sensitive auth artifacts in localStorage.
  safeRemove(localStorage, TOKEN_KEY);
  safeRemove(localStorage, USER_KEY);
  safeRemove(localStorage, 'token');
}

export function clearAuthSession() {
  safeRemove(sessionStorage, TOKEN_KEY);
  safeRemove(sessionStorage, USER_KEY);
  safeRemove(localStorage, TOKEN_KEY);
  safeRemove(localStorage, USER_KEY);
  safeRemove(localStorage, 'token');
}

export function migrateLegacyAuthStorage() {
  const legacyToken = safeGet(localStorage, TOKEN_KEY) || safeGet(localStorage, 'token');
  const legacyUser = safeGet(localStorage, USER_KEY);

  if (legacyToken && !safeGet(sessionStorage, TOKEN_KEY)) {
    safeSet(sessionStorage, TOKEN_KEY, legacyToken);
  }

  if (legacyUser && !safeGet(sessionStorage, USER_KEY)) {
    safeSet(sessionStorage, USER_KEY, legacyUser);
  }

  safeRemove(localStorage, TOKEN_KEY);
  safeRemove(localStorage, USER_KEY);
  safeRemove(localStorage, 'token');
}
