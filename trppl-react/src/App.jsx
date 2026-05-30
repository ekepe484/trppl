// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Auth pages
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import VerifyOtpPage      from './pages/auth/VerifyOtpPage';
import VerifyIdentityPage from './pages/auth/VerifyIdentityPage';

// App pages
import MainApp      from './pages/app/MainApp';
import ProfilePage  from './pages/app/ProfilePage';
import BookDatePage from './pages/app/BookDatePage';

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function RequireGuest({ children }) {
  const token = useAuthStore(s => s.token);
  return !token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest-only */}
        <Route path="/login"    element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Auth-required */}
        <Route path="/"                element={<RequireAuth><MainApp /></RequireAuth>} />
        <Route path="/verify-identity" element={<RequireAuth><VerifyIdentityPage /></RequireAuth>} />
        <Route path="/profile"         element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/book-date"       element={<RequireAuth><BookDatePage /></RequireAuth>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
