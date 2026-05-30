// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { FormField, Input } from '../../components/ui/FormField';
import { Spinner } from '../../components/ui/Spinner';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login    = useAuthStore(s => s.login);

  const [mode,     setMode]     = useState('email');
  const [contact,  setContact]  = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!contact || !password) { setError('Please enter your credentials.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.login({ contact, password });
      login(data.token, data.user);
      const u = data.user;
      if (!u.emailVerified && !u.phoneVerified) {
        sessionStorage.setItem('otp_contact', u.contactMethod === 'email' ? u.email : u.phone);
        sessionStorage.setItem('otp_method',  u.contactMethod || 'email');
        sessionStorage.setItem('otp_purpose', 'register');
        navigate('/verify-otp');
      } else if (!u.profileVerified && u.verificationStatus === 'none') {
        navigate('/verify-identity');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell tagline="welcome back">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Sign in</h1>
      <p className="text-sm text-neutral-500 mb-6">Use your email or phone number.</p>

      {/* Contact toggle */}
      <div className="flex gap-2.5 mb-5">
        {['email','phone'].map(m => (
          <button key={m} type="button"
            onClick={() => { setMode(m); setContact(''); }}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition
              ${mode === m ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'border-neutral-200 dark:border-neutral-600 text-neutral-500 bg-neutral-50 dark:bg-neutral-800'}`}>
            <i className={`ti ${m === 'email' ? 'ti-mail' : 'ti-phone'}`} />
            {m === 'email' ? 'Email' : 'Phone'}
          </button>
        ))}
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <FormField icon={mode === 'email' ? 'ti-mail' : 'ti-phone'}>
          <Input
            icon
            type={mode === 'email' ? 'email' : 'tel'}
            placeholder={mode === 'email' ? 'you@example.com' : '+44 7700 900000'}
            autoComplete={mode === 'email' ? 'email' : 'tel'}
            value={contact}
            onChange={e => setContact(e.target.value)}
          />
        </FormField>

        <FormField icon="ti-lock">
          <Input
            icon
            type={showPw ? 'text' : 'password'}
            placeholder="Your password"
            autoComplete="current-password"
            className="pr-12"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 text-neutral-400 text-lg">
            <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
          </button>
        </FormField>

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? <Spinner /> : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500 mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-violet-600 font-semibold hover:underline">Register</Link>
      </p>
    </AuthShell>
  );
}
