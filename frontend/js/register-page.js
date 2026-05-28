// register-page.js

(function () {
  let contactMethod = 'email';
  let photoFiles    = [];
  let usernameTimer = null;

  // ── Step navigation ──────────────────────────────────────────────────────
  const TOTAL_STEPS = 4;

  window.regGoStep = function(n) {
    if (n === 2 && !validateStep1()) return;
    if (n === 3 && !validateStep2()) return;
    if (n === 4 && !validateStep3()) return;
    if (n > 1 && n > 2 && !validateStep2()) { /* allow back */ }

    // Allow going back without validation
    const goingBack = n < getCurrentStep();
    if (!goingBack) {
      if (n === 2 && !validateStep1()) return;
      if (n === 3 && !validateStep2()) return;
      if (n === 4 && !validateStep3()) return;
    }

    document.querySelectorAll('.reg-step-content').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');
    document.querySelectorAll('.reg-step').forEach((s, i) => {
      s.classList.remove('active','done');
      if (i + 1 < n) s.classList.add('done');
      if (i + 1 === n) s.classList.add('active');
    });
    for (let i = 1; i < TOTAL_STEPS; i++) {
      const line = document.getElementById('rsLine' + i);
      if (line) line.classList.toggle('done', i < n);
    }
    clearErrors(); window.scrollTo(0, 0);
  };

  function getCurrentStep() {
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const s = document.getElementById('step' + i);
      if (s && s.classList.contains('active')) return i;
    }
    return 1;
  }

  // ── Username availability check ──────────────────────────────────────────
  window.checkUsername = function() {
    clearTimeout(usernameTimer);
    const val = document.getElementById('username').value.trim();
    const st  = document.getElementById('usernameStatus');
    if (val.length < 3) { st.textContent = ''; return; }
    st.textContent = '⏳'; st.style.color = '';
    usernameTimer = setTimeout(async () => {
      try {
        const res  = await fetch('/api/auth/check-username?username=' + encodeURIComponent(val));
        const data = await res.json();
        st.textContent = data.available ? '✅' : '❌ Taken';
        st.style.color = data.available ? '#16a34a' : '#dc2626';
      } catch { st.textContent = ''; }
    }, 500);
  };

  // ── Contact method toggle ────────────────────────────────────────────────
  window.setContact = function(method) {
    contactMethod = method;
    document.getElementById('ctog-email').classList.toggle('active', method === 'email');
    document.getElementById('ctog-phone').classList.toggle('active', method === 'phone');
    document.getElementById('emailFields').hidden = method !== 'email';
    document.getElementById('phoneFields').hidden = method !== 'phone';
  };

  // ── Password visibility ──────────────────────────────────────────────────
  window.togglePw = function(inputId, iconId) {
    const inp = document.getElementById(inputId);
    const ico = document.getElementById(iconId);
    inp.type  = inp.type === 'password' ? 'text' : 'password';
    ico.className = inp.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
  };

  // ── Photo upload ─────────────────────────────────────────────────────────
  window.triggerPhotoUpload = function() { document.getElementById('photoInput').click(); };

  window.addPhotos = function(input) {
    Array.from(input.files).forEach(f => { if (photoFiles.length < 6 && f.type.startsWith('image/')) photoFiles.push(f); });
    renderPhotoGrid(); input.value = '';
  };

  window.removePhoto = function(idx) { photoFiles.splice(idx, 1); renderPhotoGrid(); };

  function renderPhotoGrid() {
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = '';
    photoFiles.forEach((f, i) => {
      const slot = document.createElement('div'); slot.className = 'photo-slot';
      const img  = document.createElement('img'); img.src = URL.createObjectURL(f); img.alt = 'Photo ' + (i+1);
      const btn  = document.createElement('button'); btn.className = 'photo-remove'; btn.innerHTML = '<i class="ti ti-x"></i>'; btn.onclick = () => removePhoto(i);
      slot.appendChild(img); slot.appendChild(btn); grid.appendChild(slot);
    });
    if (photoFiles.length < 6) {
      const add = document.createElement('div'); add.className = 'photo-slot add-slot';
      add.innerHTML = '<i class="ti ti-plus"></i><span>Add photo</span>';
      add.onclick = triggerPhotoUpload; grid.appendChild(add);
    }
  }

  // ── Error helpers ────────────────────────────────────────────────────────
  function setErr(id, msg) {
    const e = document.getElementById('err-' + id);
    if (e) { e.textContent = msg || ''; e.hidden = !msg; }
  }

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; e.hidden = true; });
    const fe = document.getElementById('formError'); fe.hidden = true; fe.textContent = '';
  }

  // ── Validation ───────────────────────────────────────────────────────────
  function validateStep1() {
    clearErrors(); let ok = true;
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const sex      = document.getElementById('sex').value;
    const dob      = document.getElementById('dob').value;
    const height   = document.getElementById('height').value;
    const city     = document.getElementById('city').value.trim();
    const country  = document.getElementById('country').value;

    if (fullName.length < 2)                     { setErr('fullName', 'Enter your full name.'); ok = false; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setErr('username', '3–20 chars, letters/numbers/underscores only.'); ok = false; }
    if (!sex)                                    { setErr('sex', 'Please select your sex.'); ok = false; }
    if (!dob)                                    { setErr('dob', 'Date of birth is required.'); ok = false; }
    else if ((new Date() - new Date(dob)) / (365.25*24*60*60*1000) < 18) { setErr('dob', 'You must be 18 or older.'); ok = false; }
    if (!height)                                 { setErr('height', 'Please select your height.'); ok = false; }
    if (city.length < 2)                         { setErr('city', 'Enter your city.'); ok = false; }
    if (!country)                                { setErr('country', 'Select your country.'); ok = false; }
    return ok;
  }

  function validateStep2() {
    clearErrors(); let ok = true;
    if (!document.getElementById('education').value) { setErr('education', 'Please select your education level.'); ok = false; }
    if (!document.getElementById('drinking').value)  { setErr('drinking', 'Please select your drinking habit.'); ok = false; }
    if (!document.getElementById('smoking').value)   { setErr('smoking', 'Please select.'); ok = false; }
    if (!document.getElementById('haveKids').value)  { setErr('haveKids', 'Please select.'); ok = false; }
    if (!document.getElementById('wantKids').value)  { setErr('wantKids', 'Please select.'); ok = false; }
    if (!document.getElementById('zodiac').value)    { setErr('zodiac', 'Please select your zodiac sign.'); ok = false; }
    if (!document.getElementById('religion').value)  { setErr('religion', 'Please select.'); ok = false; }
    return ok;
  }

  function validateStep3() {
    clearErrors(); let ok = true;
    const password  = document.getElementById('password').value;
    const confirmPw = document.getElementById('confirmPw').value;
    const terms     = document.getElementById('terms').checked;
    if (contactMethod === 'email') {
      const email = document.getElementById('email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email address.'); ok = false; }
    } else {
      const phone = document.getElementById('phone').value.replace(/\s/g,'');
      if (!/^\+?[1-9]\d{6,14}$/.test(phone)) { setErr('phone', 'Enter a valid phone number with country code.'); ok = false; }
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) { setErr('password', 'Min 8 chars with at least one letter and one number.'); ok = false; }
    if (password !== confirmPw) { setErr('confirmPw', 'Passwords do not match.'); ok = false; }
    if (!terms) { setErr('terms', 'You must agree to the terms.'); ok = false; }
    return ok;
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  window.submitRegistration = async function() {
    clearErrors();
    if (photoFiles.length === 0) { setErr('photos', 'Add at least one photo of your face.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName',      document.getElementById('fullName').value.trim());
      formData.append('username',      document.getElementById('username').value.trim());
      formData.append('sex',           document.getElementById('sex').value);
      formData.append('dob',           document.getElementById('dob').value);
      formData.append('height',        document.getElementById('height').value);
      formData.append('city',          document.getElementById('city').value.trim());
      formData.append('country',       document.getElementById('country').value);
      formData.append('education',     document.getElementById('education').value);
      formData.append('drinking',      document.getElementById('drinking').value);
      formData.append('smoking',       document.getElementById('smoking').value);
      formData.append('haveKids',      document.getElementById('haveKids').value);
      formData.append('wantKids',      document.getElementById('wantKids').value);
      formData.append('zodiac',        document.getElementById('zodiac').value);
      formData.append('religion',      document.getElementById('religion').value);
      formData.append('contactMethod', contactMethod);
      formData.append('password',      document.getElementById('password').value);
      if (contactMethod === 'email') formData.append('email', document.getElementById('email').value.trim());
      else                           formData.append('phone', document.getElementById('phone').value.trim());
      photoFiles.forEach(f => formData.append('photos', f));

      const res  = await fetch('/api/auth/register', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          Object.entries(data.fields).forEach(([k, v]) => setErr(k, v));
          const fe = document.getElementById('formError'); fe.textContent = 'Please fix the errors above.'; fe.hidden = false;
        } else {
          const fe = document.getElementById('formError'); fe.textContent = data.error; fe.hidden = false;
        }
        setLoading(false); return;
      }

      const contact = contactMethod === 'email' ? document.getElementById('email').value.trim() : document.getElementById('phone').value.trim();
      sessionStorage.setItem('otp_contact', contact);
      sessionStorage.setItem('otp_method',  contactMethod);
      sessionStorage.setItem('otp_purpose', 'register');
      sessionStorage.setItem('otp_masked',  data.contact || contact);
      window.location.href = '/pages/verify-otp.html';
    } catch (err) {
      const fe = document.getElementById('formError'); fe.textContent = 'Something went wrong. Please try again.'; fe.hidden = false;
      setLoading(false);
    }
  };

  function setLoading(on) {
    document.getElementById('submitBtn').disabled = on;
    document.getElementById('submitLabel').hidden  = on;
    document.getElementById('submitSpinner').hidden = !on;
  }
})();
