// src/pages/auth/VerifyOtpPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Spinner } from '../../components/ui/Spinner';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const login    = useAuthStore(s => s.login);

  const contact = sessionStorage.getItem('otp_contact') || '';
  const method  = sessionStorage.getItem('otp_method')  || 'email';
  const purpose = sessionStorage.getItem('otp_purpose') || 'register';
  const masked  = sessionStorage.getItem('otp_masked')  || contact;

  const [digits,   setDigits]   = useState(['','','','','','']);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [resending,setResending]= useState(false);
  const [secs,     setSecs]     = useState(600);
  const [cooldown, setCooldown] = useState(60);
  const inputRefs = useRef([]);

  // Countdown
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  // Resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const code = digits.join('');

  function handleDigit(idx, val) {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.join('').length === 6 && v) submitCode(next.join(''));
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits]; next[idx - 1] = '';
      setDigits(next);
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    const next = ['','','','','',''];
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    if (pasted.length === 6) submitCode(pasted);
    else inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function submitCode(c = code) {
    if (c.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authApi.verifyOtp({ contact, code: c, purpose });
      if (data.token) login(data.token, data.user);
      setSuccess('✅ Verified! Redirecting…');
      setTimeout(() => navigate(purpose === 'register' ? '/verify-identity' : '/'), 1200);
    } catch (err) {
      setDigits(['','','','','','']);
      setError(err.message || 'Incorrect code. Please try again.');
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    setResending(true); setError('');
    try {
      await authApi.resendOtp({ contact, purpose });
      setSuccess('New code sent!');
      setSecs(600); setCooldown(60);
      setDigits(['','','','','','']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  const m = Math.floor(secs / 60);
  const s = secs % 60;

  return (
    <AuthShell tagline="verify your account">
      <div className="text-center">
        <div className="text-5xl mb-4">{method === 'phone' ? '📱' : '📧'}</div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Enter your code</h1>
        <p className="text-sm text-neutral-500 mb-6">We sent a 6-digit code to <strong>{masked}</strong>. Enter it below.</p>

        {error   && <div className="alert-error mb-4">{error}</div>}
        {success && <div className="alert-success mb-4">{success}</div>}

        {/* OTP inputs */}
        <div className="flex gap-2.5 justify-center mb-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              className={`otp-digit ${d ? 'filled' : ''}`}
              type="number" min="0" max="9"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
            />
          ))}
        </div>

        {secs > 0
          ? <p className="text-xs text-neutral-400 mb-5">Code expires in <span className="text-violet-600 font-semibold">{m}:{String(s).padStart(2,'0')}</span></p>
          : <p className="text-xs text-red-500 mb-5">Code has expired. Request a new one.</p>
        }

        <button className="btn-primary mb-3" onClick={() => submitCode()} disabled={loading || secs === 0}>
          {loading ? <Spinner /> : 'Verify code'}
        </button>

        <button className="btn-outline" onClick={resend} disabled={resending || cooldown > 0}>
          {resending ? <Spinner dark /> : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>

        <p className="text-center text-sm text-neutral-500 mt-5">
          <a onClick={() => navigate('/register')} className="text-violet-600 font-semibold cursor-pointer">← Back to registration</a>
        </p>
      </div>
    </AuthShell>
  );
}
