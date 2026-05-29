// frontend/js/profile-page.js
(function () {
  if (!Auth.requireAuth()) return;

  var user = null;
  var newPhotoFiles = [];

  // ── Country dropdown ────────────────────────────────────────────────────
  var COUNTRIES = ['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

  var cSel = document.getElementById('editCountry');
  for (var ci = 0; ci < COUNTRIES.length; ci++) {
    var co = document.createElement('option');
    co.value = COUNTRIES[ci]; co.textContent = COUNTRIES[ci];
    cSel.appendChild(co);
  }

  // Height dropdown
  var hSel = document.getElementById('editHeight');
  for (var cm = 140; cm <= 220; cm++) {
    var ti = Math.round(cm / 2.54);
    var ft = Math.floor(ti / 12);
    var inch = ti % 12;
    var ho = document.createElement('option');
    ho.value = cm + 'cm';
    ho.textContent = ft + 'ft ' + inch + 'in (' + cm + 'cm)';
    hSel.appendChild(ho);
  }

  // ── Display helpers ──────────────────────────────────────────────────────
  var LABELS = {
    education: { 'high-school':'High school','some-college':'Some college','bachelors':"Bachelor's",'masters':"Master's",'phd':'PhD','trade-school':'Trade school','prefer-not-to-say':'Prefer not to say' },
    drinking:  { 'yes':'Yes','socially':'Socially','no':'No' },
    smoking:   { 'yes':'Yes','no':'No' },
    haveKids:  { 'yes':'Yes','no':'No' },
    wantKids:  { 'yes':'Yes','no':'No','open':'Open to it','not-sure':'Not sure' },
    zodiac:    { 'aries':'♈ Aries','taurus':'♉ Taurus','gemini':'♊ Gemini','cancer':'♋ Cancer','leo':'♌ Leo','virgo':'♍ Virgo','libra':'♎ Libra','scorpio':'♏ Scorpio','sagittarius':'♐ Sagittarius','capricorn':'♑ Capricorn','aquarius':'♒ Aquarius','pisces':'♓ Pisces' },
    religion:  { 'christianity':'Christianity','islam':'Islam','hinduism':'Hinduism','judaism':'Judaism','buddhism':'Buddhism','sikhism':'Sikhism','spiritual':'Spiritual','agnostic':'Agnostic','atheist':'Atheist','other':'Other','prefer-not-to-say':'Prefer not to say' },
  };

  function label(category, val) {
    return (LABELS[category] && LABELS[category][val]) || val || '—';
  }

  function calcAge(dob) {
    if (!dob) return '—';
    var age = Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
    return age + ' years old';
  }

  function authHeader() {
    var t = Auth.getToken();
    return t ? { 'Authorization': 'Bearer ' + t } : {};
  }

  // ── Load profile ──────────────────────────────────────────────────────────
  async function loadProfile() {
    try {
      var res  = await fetch('/api/profile/me', { headers: authHeader() });
      var data = await res.json();
      user = data.user;
      Auth.setUser(user);
      renderView();
    } catch (err) {
      showError('Could not load profile. Please try again.');
    }
  }

  function renderView() {
    if (!user) return;

    // Header
    document.getElementById('profileAvatar').textContent = (user.name || user.username || 'A')[0].toUpperCase();
    document.getElementById('profileName').textContent    = user.name || '';
    document.getElementById('profileUsername').textContent = '@' + (user.username || '');

    if (user.profileVerified) {
      document.getElementById('verifiedBadge').hidden = false;
      document.getElementById('pendingBadge').hidden  = true;
    } else if (user.verificationStatus === 'pending' || user.verificationStatus === 'processing') {
      document.getElementById('pendingBadge').hidden  = false;
      document.getElementById('verifiedBadge').hidden = true;
    }

    // Verify button
    var vBtn = document.getElementById('verifyActionBtn');
    if (!user.profileVerified && user.verificationStatus === 'none') {
      vBtn.hidden = false;
    }

    // Photos
    renderPhotosView();

    // Info fields
    document.getElementById('infoAge').textContent       = calcAge(user.dob);
    document.getElementById('infoHeight').textContent    = user.height || '—';
    document.getElementById('infoLocation').textContent  = [user.city, user.country].filter(Boolean).join(', ') || '—';
    document.getElementById('infoEducation').textContent = label('education', user.education);
    document.getElementById('infoDrinking').textContent  = label('drinking',  user.drinking);
    document.getElementById('infoSmoking').textContent   = label('smoking',   user.smoking);
    document.getElementById('infoHaveKids').textContent  = label('haveKids',  user.haveKids);
    document.getElementById('infoWantKids').textContent  = label('wantKids',  user.wantKids);
    document.getElementById('infoZodiac').textContent    = label('zodiac',    user.zodiac);
    document.getElementById('infoReligion').textContent  = label('religion',  user.religion);
  }

  function renderPhotosView() {
    var grid   = document.getElementById('photoGridView');
    var photos = user.photoPaths || [];
    grid.innerHTML = '';
    if (!photos.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:12px;font-size:13px;color:var(--tx3)">No photos yet. Switch to edit mode to add some.</div>';
      return;
    }
    photos.forEach(function (p, i) {
      var slot = document.createElement('div');
      slot.className = 'photo-slot-profile';
      // Photos are stored as file paths on the server — we can't display them directly
      // Show a placeholder with the photo index instead
      slot.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--pl);color:var(--pd);font-size:24px;font-weight:700">' + (i + 1) + '</div>';
      grid.appendChild(slot);
    });
    var countEl = document.createElement('div');
    countEl.style.cssText = 'grid-column:1/-1;font-size:12px;color:var(--tx3);padding:4px 2px';
    countEl.textContent   = photos.length + ' photo' + (photos.length !== 1 ? 's' : '') + ' on your profile';
    grid.appendChild(countEl);
  }

  function renderPhotosEdit() {
    var grid   = document.getElementById('photoGridEdit');
    var photos = user.photoPaths || [];
    grid.innerHTML = '';
    photos.forEach(function (p, i) {
      var slot = document.createElement('div');
      slot.className = 'photo-slot-profile';
      slot.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--pl);color:var(--pd);font-size:24px;font-weight:700">' + (i + 1) + '</div>';
      var del  = document.createElement('button');
      del.className = 'photo-del';
      del.innerHTML = '<i class="ti ti-x"></i>';
      del.setAttribute('data-index', i);
      slot.appendChild(del);
      grid.appendChild(slot);
    });
    // New photos staged for upload
    newPhotoFiles.forEach(function (f, i) {
      var slot = document.createElement('div');
      slot.className = 'photo-slot-profile';
      var img  = document.createElement('img');
      img.src  = URL.createObjectURL(f);
      var del  = document.createElement('button');
      del.className = 'photo-del';
      del.innerHTML = '<i class="ti ti-x"></i>';
      del.setAttribute('data-new-index', i);
      slot.appendChild(img); slot.appendChild(del);
      grid.appendChild(slot);
    });
    if (photos.length + newPhotoFiles.length < 6) {
      var add = document.createElement('div');
      add.className = 'photo-add-slot';
      add.innerHTML = '<i class="ti ti-plus"></i><span>Add photo</span>';
      add.id = 'photoAddBtn';
      grid.appendChild(add);
    }
    // Wire delete buttons
    grid.querySelectorAll('.photo-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx    = btn.getAttribute('data-index');
        var newIdx = btn.getAttribute('data-new-index');
        if (newIdx !== null) {
          newPhotoFiles.splice(parseInt(newIdx), 1);
          renderPhotosEdit();
        } else {
          deletePhoto(parseInt(idx));
        }
      });
    });
    var addBtn = document.getElementById('photoAddBtn');
    if (addBtn) addBtn.addEventListener('click', function () { document.getElementById('photoInputEdit').click(); });
  }

  // ── Populate edit form with current values ───────────────────────────────
  function populateEditForm() {
    document.getElementById('editName').value    = user.name    || '';
    document.getElementById('editCity').value    = user.city    || '';
    document.getElementById('editCountry').value = user.country || '';
    document.getElementById('editHeight').value  = user.height  || '';
    document.getElementById('editEducation').value = user.education || '';
    document.getElementById('editDrinking').value  = user.drinking  || '';
    document.getElementById('editSmoking').value   = user.smoking   || '';
    document.getElementById('editHaveKids').value  = user.haveKids  || '';
    document.getElementById('editWantKids').value  = user.wantKids  || '';
    document.getElementById('editZodiac').value    = user.zodiac    || '';
    document.getElementById('editReligion').value  = user.religion  || '';
    newPhotoFiles = [];
    renderPhotosEdit();
  }

  // ── Mode switching ───────────────────────────────────────────────────────
  function showEdit() {
    document.getElementById('viewMode').style.display = 'none';
    document.getElementById('editMode').style.display = 'block';
    document.getElementById('editToggleBtn').style.display = 'none';
    populateEditForm();
    hideMessages();
  }

  function showView() {
    document.getElementById('editMode').style.display = 'none';
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editToggleBtn').style.display = 'flex';
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function saveProfile() {
    setSaveLoading(true);
    hideMessages();
    try {
      // 1. Upload any new photos first
      if (newPhotoFiles.length > 0) {
        var fd = new FormData();
        newPhotoFiles.forEach(function (f) { fd.append('photos', f); });
        var photoRes  = await fetch('/api/profile/photos', { method: 'POST', headers: authHeader(), body: fd });
        var photoData = await photoRes.json();
        if (!photoRes.ok) throw new Error(photoData.error || 'Photo upload failed');
        user = photoData.user;
        newPhotoFiles = [];
      }

      // 2. Save text fields
      var body = {
        name:      document.getElementById('editName').value.trim(),
        city:      document.getElementById('editCity').value.trim(),
        country:   document.getElementById('editCountry').value,
        height:    document.getElementById('editHeight').value,
        education: document.getElementById('editEducation').value,
        drinking:  document.getElementById('editDrinking').value,
        smoking:   document.getElementById('editSmoking').value,
        haveKids:  document.getElementById('editHaveKids').value,
        wantKids:  document.getElementById('editWantKids').value,
        zodiac:    document.getElementById('editZodiac').value,
        religion:  document.getElementById('editReligion').value,
      };

      var res  = await fetch('/api/profile/update', {
        method:  'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeader()),
        body:    JSON.stringify(body),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      user = data.user;
      Auth.setUser(user);
      renderView();
      showView();
      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  }

  // ── Delete photo ─────────────────────────────────────────────────────────
  async function deletePhoto(idx) {
    try {
      var res  = await fetch('/api/profile/photos/' + idx, { method: 'DELETE', headers: authHeader() });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not remove photo');
      user = data.user;
      Auth.setUser(user);
      renderPhotosEdit();
    } catch (err) {
      showError(err.message);
    }
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  function showSuccess(msg) { var e=document.getElementById('successMsg'); e.textContent=msg; e.hidden=false; document.getElementById('profileError').hidden=true; window.scrollTo(0,0); }
  function showError(msg)   { var e=document.getElementById('profileError'); e.textContent=msg; e.hidden=false; }
  function hideMessages()   { document.getElementById('successMsg').hidden=true; document.getElementById('profileError').hidden=true; }
  function setSaveLoading(on) {
    document.getElementById('saveBtn').disabled    = on;
    document.getElementById('saveLabel').hidden    = on;
    document.getElementById('saveSpinner').hidden  = !on;
  }

  // ── Wire buttons ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('backBtn').addEventListener('click', function () {
      window.location.href = '/';
    });
    document.getElementById('editToggleBtn').addEventListener('click', showEdit);
    document.getElementById('cancelEditBtn').addEventListener('click', function () { showView(); hideMessages(); });
    document.getElementById('saveBtn').addEventListener('click', saveProfile);
    document.getElementById('logoutBtn').addEventListener('click', function () { Auth.logout(); });
    document.getElementById('verifyActionBtn').addEventListener('click', function () {
      window.location.href = '/pages/verify-profile.html';
    });
    document.getElementById('photoInputEdit').addEventListener('change', function () {
      Array.from(this.files).forEach(function (f) {
        var total = (user.photoPaths || []).length + newPhotoFiles.length;
        if (total < 6 && f.type.startsWith('image/')) newPhotoFiles.push(f);
      });
      renderPhotosEdit();
      this.value = '';
    });

    // Load on startup
    loadProfile();
  });

})();
