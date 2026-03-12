import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

const api = axios.create({ baseURL: `${API_URL}/api` });

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setUser(r.data.user); localStorage.setItem(USER_KEY, JSON.stringify(r.data.user)); })
      .catch(() => { clearSession(); })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveSession(userData, jwtToken) {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }

  function clearSession() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const register = useCallback(async ({ name, email, password }) => {
    const { data } = await api.post('/auth/register', { name, email, password });
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
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
