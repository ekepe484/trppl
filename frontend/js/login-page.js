// login-page.js

(function () {
  if (Auth.getToken()) window.location.href = '/';

  let loginMode = 'email';

  window.setMode = function(mode) {
    loginMode = mode;
    document.getElementById('ltog-email').classList.toggle('active', mode === 'email');
    document.getElementById('ltog-phone').classList.toggle('active', mode === 'phone');
    const inp  = document.getElementById('contact');
    const lbl  = document.getElementById('contactLabel');
    const icon = document.getElementById('contactIcon');
    if (mode === 'email') {
      inp.type = 'email'; inp.placeholder = 'you@example.com'; inp.autocomplete = 'email';
      lbl.textContent = 'Email address'; icon.className = 'ti ti-mail field-icon';
    } else {
      inp.type = 'tel'; inp.placeholder = '+44 7700 900000'; inp.autocomplete = 'tel';
      lbl.textContent = 'Phone number'; icon.className = 'ti ti-phone field-icon';
    }
    inp.value = '';
  };

  window.togglePw = function() {
    const inp = document.getElementById('password');
    const ico = document.getElementById('pwIcon');
    inp.type  = inp.type === 'password' ? 'text' : 'password';
    ico.className = inp.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
  };

  window.doLogin = async function() {
    const contact  = document.getElementById('contact').value.trim();
    const password = document.getElementById('password').value;
    const fe = document.getElementById('formError');
    fe.hidden = true;

    if (!contact || !password) { fe.textContent = 'Please enter your credentials.'; fe.hidden = false; return; }

    setLoading(true);
    try {
      const data = await Auth.login({ contact, password });

      // Route based on verification state
      if (!data.user.emailVerified && !data.user.phoneVerified) {
        const method = data.user.contactMethod || 'email';
        sessionStorage.setItem('otp_contact', method === 'email' ? data.user.email : data.user.phone);
        sessionStorage.setItem('otp_method',  method);
        sessionStorage.setItem('otp_purpose', 'register');
        sessionStorage.setItem('otp_masked',  method === 'email' ? data.user.email : data.user.phone);
        window.location.href = '/pages/verify-otp.html';
        return;
      }
      if (!data.user.profileVerified && data.user.verificationStatus !== 'processing' && data.user.verificationStatus !== 'pending') {
        window.location.href = '/pages/verify-profile.html';
        return;
      }
      window.location.href = '/';
    } catch (err) {
      fe.textContent = err.message || 'Invalid credentials.'; fe.hidden = false;
      setLoading(false);
    }
  };

  function setLoading(on) {
    document.getElementById('loginBtn').disabled = on;
    document.getElementById('loginLabel').hidden  = on;
    document.getElementById('loginSpinner').hidden = !on;
  }

  // Allow Enter key
  document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
})();

// ── Wire up buttons ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  var btn;

  btn = document.getElementById('ltog-email');
  if (btn) btn.addEventListener('click', function () { setMode('email'); });

  btn = document.getElementById('ltog-phone');
  if (btn) btn.addEventListener('click', function () { setMode('phone'); });

  btn = document.getElementById('btn-pw-toggle');
  if (btn) btn.addEventListener('click', function () { togglePw(); });

  btn = document.getElementById('loginBtn');
  if (btn) btn.addEventListener('click', function () { doLogin(); });

  // Allow Enter key to submit
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
});
