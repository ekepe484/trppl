// frontend/js/auth.js
const Auth = (() => {
  const TOKEN_KEY = 'trppl_token';
  const USER_KEY  = 'trppl_user';

  function getToken()    { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t)   { localStorage.setItem(TOKEN_KEY, t); }
  function removeToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
  function getUser()     { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
  function setUser(u)    { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

  async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res  = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function login({ contact, password }) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ contact, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function verifyOtp({ contact, code, purpose }) {
    const data = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ contact, code, purpose }),
    });
    if (data.token) { setToken(data.token); }
    if (data.user)  { setUser(data.user); }
    return data;
  }

  async function resendOtp({ contact, purpose }) {
    return apiFetch('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ contact, purpose }),
    });
  }

  async function me() {
    const data = await apiFetch('/api/auth/me');
    if (data.user) setUser(data.user);
    return data.user;
  }

  async function refreshUser() {
    try {
      return await me();
    } catch (err) {
      if (err.message.includes('expired') || err.message.includes('Invalid token')) {
        removeToken();
        window.location.href = '/pages/login.html';
      }
      return null;
    }
  }

  function logout() {
    removeToken();
    window.location.href = '/pages/login.html';
  }

  function requireAuth() {
    if (!getToken()) { window.location.href = '/pages/login.html'; return false; }
    return true;
  }

  return { getToken, getUser, setUser, login, verifyOtp, resendOtp, me, refreshUser, logout, requireAuth };
})();
