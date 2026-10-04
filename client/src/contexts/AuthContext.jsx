import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  migrateLegacyAuthStorage,
  setAuthSession,
} from '../utils/authStorage';

const AuthContext = createContext(null);

const api = axios.create({ baseURL: `${API_URL}/api` });

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => getAuthUser());
  const [token, setToken]     = useState(() => getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    migrateLegacyAuthStorage();
    setUser(getAuthUser());
    setToken(getAuthToken());
  }, []);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        setUser(r.data.user);
        setAuthSession(r.data.user, token);
      })
      .catch((err) => {
        // Only an explicit auth rejection ends the session. A cold-starting backend, a dropped
        // connection or a 5xx must not silently log the user out.
        const status = err?.response?.status;
        if (status === 401 || status === 403 || status === 404) clearSession();
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveSession(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    setAuthSession(userData, jwtToken);
  }

  function clearSession() {
    setUser(null);
    setToken(null);
    clearAuthSession();
  }

  const register = useCallback(async ({ name, email, password, terms_accepted }) => {
    const { data } = await api.post('/auth/register', { name, email, password, terms_accepted });
    saveSession(data.user, data.token);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.user, data.token);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    saveSession(data.user, data.token);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  /** Call after a successful plan upgrade to refresh user in context + storage. */
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(data.user);
      setAuthSession(data.user, token);
    } catch { /* silent */ }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
