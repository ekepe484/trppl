// verify-otp-page.js

var otpContact = sessionStorage.getItem('otp_contact') || '';
var otpMethod  = sessionStorage.getItem('otp_method')  || 'email';
var otpPurpose = sessionStorage.getItem('otp_purpose') || 'register';
var otpMasked  = sessionStorage.getItem('otp_masked')  || otpContact;

// Update header icon and subtitle
var methodIconEl = document.getElementById('methodIcon');
if (methodIconEl) {
  var iconEl = methodIconEl.querySelector('i');
  if (iconEl) iconEl.className = otpMethod === 'phone' ? 'ti ti-phone' : 'ti ti-mail';
  iconEl.style.color = '#a78bfa';
  iconEl.style.fontSize = '52px';
}

var otpSubEl = document.getElementById('otpSub');
if (otpSubEl) otpSubEl.textContent = 'We sent a 6-digit code to ' + otpMasked + '. Enter it below to verify your account.';

// ── OTP digit inputs ───────────────────────────────────────────────────────────
var digits = [0,1,2,3,4,5].map(function(i) { return document.getElementById('d' + i); }).filter(Boolean);

digits.forEach(function(inp, i) {
  inp.addEventListener('input', function(e) {
    var val = e.target.value.replace(/\D/g, '').slice(-1);
    e.target.value = val;
    if (val) {
      inp.classList.add('filled');
      inp.classList.remove('error');
      if (i < 5) digits[i + 1].focus();
      else { if (getCode().length === 6) verifyCode(); }
    } else {
      inp.classList.remove('filled');
    }
  });

  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Backspace' && !inp.value && i > 0) {
      digits[i-1].value = '';
      digits[i-1].classList.remove('filled');
      digits[i-1].focus();
    }
    if (!/^\d$/.test(e.key) && !['Backspace','Tab','ArrowLeft','ArrowRight','Delete'].includes(e.key)) {
      e.preventDefault();
    }
  });

  inp.addEventListener('paste', function(e) {
    e.preventDefault();
    var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'').slice(0,6);
    pasted.split('').forEach(function(ch, idx) {
      if (idx < 6 && digits[idx]) { digits[idx].value = ch; digits[idx].classList.add('filled'); }
    });
    if (pasted.length === 6) verifyCode();
    else if (digits[Math.min(pasted.length, 5)]) digits[Math.min(pasted.length, 5)].focus();
  });
});

if (digits[0]) digits[0].focus();

function getCode() { return digits.map(function(d) { return d.value; }).join(''); }

// ── Countdown ──────────────────────────────────────────────────────────────────
var otpSecs = 10 * 60;
var countdownInt = setInterval(function() {
  otpSecs--;
  var m = Math.floor(otpSecs / 60);
  var s = otpSecs % 60;
  var el = document.getElementById('countdownVal');
  if (el) el.textContent = m + ':' + String(s).padStart(2, '0');
  if (otpSecs <= 0) {
    clearInterval(countdownInt);
    var cdEl = document.getElementById('countdown');
    if (cdEl) cdEl.textContent = 'Code has expired. Request a new one.';
    var vb = document.getElementById('verifyBtn');
    if (vb) vb.disabled = true;
  }
}, 1000);

// Resend cooldown — only starts after user clicks Resend, not on page load
var resendCooldownInt = null;
function startResendCooldown() {
  var resendBtn = document.getElementById('resendBtn');
  var resendLbl = document.getElementById('resendLabel');
  var cooldown  = 60;
  if (resendBtn) resendBtn.disabled = true;
  if (resendLbl) resendLbl.textContent = 'Resend in 60s';
  resendCooldownInt = setInterval(function() {
    cooldown--;
    if (resendLbl) resendLbl.textContent = cooldown > 0 ? 'Resend in ' + cooldown + 's' : 'Resend code';
    if (cooldown <= 0) {
      clearInterval(resendCooldownInt);
      if (resendBtn) resendBtn.disabled = false;
    }
  }, 1000);
}

// ── Verify ─────────────────────────────────────────────────────────────────────
function verifyCode() {
  var code = getCode();
  if (code.length < 6) {
    showError('Please enter all 6 digits.');
    return;
  }
  setLoading('verify', true);
  clearMessages();

  Auth.verifyOtp({ contact: otpContact, code: code, purpose: otpPurpose })
    .then(function(data) {
      clearInterval(countdownInt);
      showSuccess('✅ ' + (data.message || 'Verified! Redirecting…'));
      setTimeout(function() {
        window.location.href = otpPurpose === 'register' ? '/pages/verify-profile.html' : '/';
      }, 1200);
    })
    .catch(function(err) {
      digits.forEach(function(d) { d.classList.add('error'); d.classList.remove('filled'); });
      showError(err.message || 'Incorrect code. Please try again.');
      setLoading('verify', false);
    });
}

// ── Resend ─────────────────────────────────────────────────────────────────────
function resendCode() {
  setLoading('resend', true);
  clearMessages();

  Auth.resendOtp({ contact: otpContact, purpose: otpPurpose })
    .then(function() {
      showSuccess('New code sent! Check your ' + (otpMethod === 'phone' ? 'phone' : 'email') + '.');
      otpSecs = 10 * 60;
      digits.forEach(function(d) { d.value = ''; d.classList.remove('filled','error'); });
      if (digits[0]) digits[0].focus();
      startResendCooldown();
    })
    .catch(function(err) {
      showError(err.message || 'Could not resend. Please try again.');
    })
    .finally(function() {
      setLoading('resend', false);
    });
}

// ── UI helpers ─────────────────────────────────────────────────────────────────
function showError(msg) {
  var e = document.getElementById('formError');
  var s = document.getElementById('formSuccess');
  if (e) { e.textContent = msg; e.hidden = false; }
  if (s) s.hidden = true;
}
function showSuccess(msg) {
  var s = document.getElementById('formSuccess');
  var e = document.getElementById('formError');
  if (s) { s.textContent = msg; s.hidden = false; }
  if (e) e.hidden = true;
}
function clearMessages() {
  var e = document.getElementById('formError');
  var s = document.getElementById('formSuccess');
  if (e) e.hidden = true;
  if (s) s.hidden = true;
  digits.forEach(function(d) { d.classList.remove('error'); });
}
function setLoading(btn, on) {
  var btnEl = document.getElementById(btn + 'Btn');
  var lblEl = document.getElementById(btn + 'Label');
  var spnEl = document.getElementById(btn + 'Spinner');
  if (btnEl) btnEl.disabled = on;
  if (lblEl) lblEl.hidden   = on;
  if (spnEl) spnEl.hidden   = !on;
}

// ── Wire buttons ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var vb = document.getElementById('verifyBtn');
  if (vb) vb.addEventListener('click', verifyCode);

  var rb = document.getElementById('resendBtn');
  if (rb) rb.addEventListener('click', resendCode);
});
