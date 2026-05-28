// verify-otp-page.js

(function () {
  const contact = sessionStorage.getItem('otp_contact')  || '';
  const method  = sessionStorage.getItem('otp_method')   || 'email';
  const purpose = sessionStorage.getItem('otp_purpose')  || 'register';
  const masked  = sessionStorage.getItem('otp_masked')   || contact;

  // Update UI based on method
  document.getElementById('methodIcon').textContent = method === 'phone' ? '📱' : '📧';
  document.getElementById('otpSub').textContent =
    method === 'phone'
      ? `We sent a 6-digit code to ${masked}. Enter it below to verify your account.`
      : `We sent a 6-digit code to ${masked}. Enter it below to verify your account.`;

  // ── OTP input behaviour ───────────────────────────────────────────────────
  const digits = Array.from({ length: 6 }, (_, i) => document.getElementById('d' + i));

  digits.forEach((inp, i) => {
    inp.addEventListener('input', (e) => {
      // Only keep single digit
      const val = e.target.value.replace(/\D/g, '').slice(-1);
      e.target.value = val;
      if (val) {
        inp.classList.add('filled');
        inp.classList.remove('error');
        if (i < 5) digits[i + 1].focus();
        else autoSubmit();
      } else {
        inp.classList.remove('filled');
      }
    });

    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && i > 0) {
        digits[i - 1].value = '';
        digits[i - 1].classList.remove('filled');
        digits[i - 1].focus();
      }
      // Block non-numeric
      if (!/^\d$/.test(e.key) && !['Backspace','Tab','ArrowLeft','ArrowRight','Delete'].includes(e.key)) {
        e.preventDefault();
      }
    });

    inp.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      pasted.split('').forEach((ch, idx) => {
        if (idx < 6) {
          digits[idx].value = ch;
          digits[idx].classList.add('filled');
        }
      });
      if (pasted.length === 6) autoSubmit();
      else digits[Math.min(pasted.length, 5)].focus();
    });
  });

  digits[0].focus();

  function getCode() { return digits.map(d => d.value).join(''); }

  function setDigitError() { digits.forEach(d => { d.classList.add('error'); d.classList.remove('filled'); }); }
  function clearDigitError() { digits.forEach(d => d.classList.remove('error')); }

  function autoSubmit() {
    const code = getCode();
    if (code.length === 6) verifyCode();
  }

  // ── Countdown timer ───────────────────────────────────────────────────────
  let secs = 10 * 60;
  let resendCooldown = 60;
  const countdownEl = document.getElementById('countdownVal');

  const countdownInt = setInterval(() => {
    secs--;
    if (secs <= 0) {
      clearInterval(countdownInt);
      document.getElementById('countdown').textContent = 'Code has expired. Please request a new one.';
      document.getElementById('verifyBtn').disabled = true;
    } else {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      countdownEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }
  }, 1000);

  // Resend cooldown
  let resendInt = null;
  function startResendCooldown() {
    resendCooldown = 60;
    document.getElementById('resendBtn').disabled = true;
    document.getElementById('resendLabel').textContent = `Resend in ${resendCooldown}s`;
    resendInt = setInterval(() => {
      resendCooldown--;
      document.getElementById('resendLabel').textContent = resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code';
      if (resendCooldown <= 0) {
        clearInterval(resendInt);
        document.getElementById('resendBtn').disabled = false;
      }
    }, 1000);
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  window.verifyCode = async function() {
    const code = getCode();
    if (code.length < 6) {
      showError('Please enter all 6 digits.');
      digits[code.length] && digits[code.length].focus();
      return;
    }

    setLoading('verify', true);
    clearError();

    try {
      const data = await Auth.verifyOtp({ contact, code, purpose });

      clearInterval(countdownInt);
      showSuccess('✅ ' + (data.message || 'Verified! Redirecting…'));

      setTimeout(() => {
        // After registration, go to identity verification
        // After login OTP, go to app
        if (purpose === 'register') {
          window.location.href = '/pages/verify-profile.html';
        } else {
          window.location.href = '/';
        }
      }, 1200);
    } catch (err) {
      setDigitError();
      showError(err.message || 'Incorrect code. Please try again.');
      setLoading('verify', false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────
  window.resendCode = async function() {
    setLoading('resend', true);
    clearError();
    try {
      await Auth.resendOtp({ contact, purpose });
      showSuccess('New code sent! Check your ' + (method === 'phone' ? 'phone' : 'email') + '.');
      secs = 10 * 60; // reset countdown
      startResendCooldown();
      digits.forEach(d => { d.value = ''; d.classList.remove('filled','error'); });
      digits[0].focus();
    } catch (err) {
      showError(err.message || 'Could not resend. Please try again.');
    } finally {
      setLoading('resend', false);
    }
  };

  function showError(msg) {
    const e = document.getElementById('formError');
    e.textContent = msg; e.hidden = false;
    document.getElementById('formSuccess').hidden = true;
  }
  function showSuccess(msg) {
    const e = document.getElementById('formSuccess');
    e.textContent = msg; e.hidden = false;
    document.getElementById('formError').hidden = true;
  }
  function clearError() {
    document.getElementById('formError').hidden = true;
    document.getElementById('formSuccess').hidden = true;
    clearDigitError();
  }
  function setLoading(btn, on) {
    document.getElementById(btn + 'Btn').disabled = on;
    document.getElementById(btn + 'Label').hidden  = on;
    document.getElementById(btn + 'Spinner').hidden = !on;
  }

  startResendCooldown();
})();
