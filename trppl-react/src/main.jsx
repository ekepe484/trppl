import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { useAuthStore } from './store/authStore.js';
import { authApi } from './lib/api.js';

// Validate stored token on every page load
async function validateToken() {
  const { token, logout } = useAuthStore.getState();
  if (!token) return;
  try {
    await authApi.me();
  } catch (err) {
    // Token is expired or invalid — clear it so user sees login page
    logout();
  }
}

validateToken();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
