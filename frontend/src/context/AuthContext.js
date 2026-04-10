import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authAPI } from '../utils/api';
import { subscribeUserToPush } from '../utils/pushHelper';

const API = "/api";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // FIX: On mount restore session AND validate token with server
  useEffect(() => {
    const restoreSession = async () => {
      const t = localStorage.getItem('skystay_token');
      const u = localStorage.getItem('skystay_user');
      if (t && u) {
        try {
          // Set token immediately so UI shows logged in
          const parsedUser = JSON.parse(u);
          setToken(t);
          setUser(parsedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;

          // Validate token with server and refresh user data
          const res = await axios.get(`${API}/auth/me`);
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('skystay_user', JSON.stringify(res.data.user));
            // Auto re-subscribe push on session restore
            subscribeUserToPush(res.data.user).catch(() => {});
          }
        } catch (err) {
          // Token expired or invalid — clear session
          localStorage.removeItem('skystay_token');
          localStorage.removeItem('skystay_user');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    const { token: t, user: u } = res.data;
    setToken(t); setUser(u);
    localStorage.setItem('skystay_token', t);
    localStorage.setItem('skystay_user', JSON.stringify(u));
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    // 🔔 Subscribe to push notifications on login
    subscribeUserToPush(u).catch(() => {});
    return u;
  };

  const register = async (name, email, password, phone) => {
    const res = await axios.post(`${API}/auth/register`, { name, email, password, phone });
    const { token: t, user: u } = res.data;
    setToken(t); setUser(u);
    localStorage.setItem('skystay_token', t);
    localStorage.setItem('skystay_user', JSON.stringify(u));
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    // 🔔 Subscribe to push notifications on register
    subscribeUserToPush(u).catch(() => {});
    return u;
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('skystay_token');
    localStorage.removeItem('skystay_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('skystay_user', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      if (res.data.success) {
        updateUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  const markAllNotifsRead = async () => {
    try {
      const res = await authAPI.markAllRead();
      if (res.data.success) updateUser(res.data.user);
    } catch (err) { console.error(err); }
  };

  const markNotifRead = async (id) => {
    try {
      const res = await authAPI.markNotifRead(id);
      if (res.data.success) updateUser(res.data.user);
    } catch (err) { console.error(err); }
  };

  const clearAllNotifs = async () => {
    try {
      const res = await authAPI.clearAllNotifs();
      if (res.data.success) updateUser(res.data.user);
    } catch (err) { console.error(err); }
  };

  const deleteNotif = async (id) => {
    try {
      const res = await authAPI.deleteNotif(id);
      if (res.data.success) updateUser(res.data.user);
    } catch (err) { console.error(err); }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, token, isAdmin: user?.role === 'admin',
      login, register, logout, updateUser, refreshUser,
      markNotifRead, markAllNotifsRead, clearAllNotifs, deleteNotif
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);