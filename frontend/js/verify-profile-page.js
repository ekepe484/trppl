// verify-profile-page.js — identity verification page logic

if (!Auth.requireAuth()) { /* redirects */ }

var videoStream    = null;
var mediaRecorder  = null;
var recordedChunks = [];
var videoBlob      = null;
var isRecording    = false;
var recTimer       = null;
var recSecs        = 0;
var MAX_SECS       = 30;

function authHeader() {
  var t = Auth.getToken();
  return t ? { Authorization: 'Bearer ' + t } : {};
}

// ── Screen switcher ────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.vscreen').forEach(function(s) { s.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ── Start verification ─────────────────────────────────────────────────────────
function startVerification() {
  showScreen('screenVideo');
  loadPhrase();
}

function loadPhrase() {
  var loading = document.getElementById('phraseLoading');
  var text    = document.getElementById('phraseText');
  if (loading) loading.style.display = 'flex';
  if (text)    text.hidden = true;
  fetch('/api/verification/phrase', { headers: authHeader() })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (text) { text.textContent = '"' + data.phrase + '"'; text.hidden = false; }
    })
    .catch(function() {
      if (text) { text.textContent = '"I verify that this is me and I am joining Trppl today."'; text.hidden = false; }
    })
    .finally(function() {
      if (loading) loading.style.display = 'none';
    });
}

// ── Open camera ────────────────────────────────────────────────────────────────
function openCamera() {
  hideError();
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
    audio: true,
  })
  .then(function(stream) {
    videoStream = stream;
    var vid = document.getElementById('liveVideo');
    if (vid) { vid.srcObject = stream; vid.hidden = false; }
    var vp  = document.getElementById('videoPreview');    if (vp)  vp.hidden  = true;
    var bo  = document.getElementById('btnOpenCamera');   if (bo)  bo.hidden  = true;
    var br  = document.getElementById('btnRecord');       if (br)  br.hidden  = false;
  })
  .catch(function() {
    showError('Camera or microphone access was denied. Both are required for verification.');
  });
}

// ── Recording ──────────────────────────────────────────────────────────────────
function toggleRec() {
  if (isRecording) { stopRec(); } else { startRec(); }
}

function startRec() {
  if (!videoStream) return;
  recordedChunks = []; isRecording = true; recSecs = 0;
  var mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
           : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
  mediaRecorder = new MediaRecorder(videoStream, { mimeType: mime });
  mediaRecorder.ondataavailable = function(e) { if (e.data.size > 0) recordedChunks.push(e.data); };
  mediaRecorder.onstop = onRecStop;
  mediaRecorder.start(100);

  var btn = document.getElementById('recordBtn');
  if (btn) { btn.innerHTML = '<i class="ti ti-player-stop"></i> Stop recording'; btn.className = 'auth-btn auth-btn-outline'; }
  var ri  = document.getElementById('recIndicator'); if (ri)  ri.hidden  = false;

  recTimer = setInterval(function() {
    recSecs++;
    var tv = document.getElementById('timerVal'); if (tv) tv.textContent = MAX_SECS - recSecs;
    if (recSecs >= MAX_SECS) stopRec();
  }, 1000);
}

function stopRec() {
  if (!isRecording) return;
  isRecording = false;
  clearInterval(recTimer);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  var ri = document.getElementById('recIndicator'); if (ri) ri.hidden = true;
}

function onRecStop() {
  videoBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
  var url  = URL.createObjectURL(videoBlob);
  var prev = document.getElementById('videoPreview');
  if (prev) { prev.src = url; prev.hidden = false; }
  var lv   = document.getElementById('liveVideo');   if (lv)   lv.hidden   = true;
  var br   = document.getElementById('btnRecord');   if (br)   br.hidden   = true;
  var bret = document.getElementById('btnRetake');   if (bret) bret.hidden = false;
  if (videoStream) { videoStream.getTracks().forEach(function(t) { t.stop(); }); videoStream = null; }
}

// ── Retake ─────────────────────────────────────────────────────────────────────
function retake() {
  videoBlob = null; recordedChunks = [];
  var vp  = document.getElementById('videoPreview');  if (vp)   vp.hidden   = true;
  var br  = document.getElementById('btnRetake');     if (br)   br.hidden   = true;
  var bo  = document.getElementById('btnOpenCamera'); if (bo)   bo.hidden   = false;
  var lv  = document.getElementById('liveVideo');     if (lv)   lv.hidden   = true;
  var btn = document.getElementById('recordBtn');
  if (btn) { btn.innerHTML = '<i class="ti ti-circle"></i> Start recording'; btn.className = 'auth-btn auth-btn-red'; }
  hideError();
}

// ── Submit ─────────────────────────────────────────────────────────────────────
function submitVideo() {
  if (!videoBlob) { showError('Please record your verification video first.'); return; }
  setSubmitLoading(true);
  hideError();

  var formData = new FormData();
  var ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
  formData.append('video', videoBlob, 'liveness.' + ext);

  var uploadWrap = document.getElementById('uploadWrap');
  var uploadBar  = document.getElementById('uploadBar');
  var uploadLbl  = document.getElementById('uploadLabel');
  if (uploadWrap) uploadWrap.hidden = false;
  var progress = 0;
  var progInt = setInterval(function() {
    progress = Math.min(progress + Math.random() * 15, 88);
    if (uploadBar) uploadBar.style.width = progress + '%';
    if (uploadLbl) uploadLbl.textContent = 'Uploading… ' + Math.round(progress) + '%';
  }, 200);

  fetch('/api/verification/submit', { method: 'POST', headers: authHeader(), body: formData })
    .then(function(res) {
      clearInterval(progInt);
      if (uploadBar) uploadBar.style.width = '100%';
      if (uploadLbl) uploadLbl.textContent = 'Upload complete!';
      return res.json().then(function(data) { return { ok: res.ok, data: data }; });
    })
    .then(function(result) {
      if (!result.ok) { showError(result.data.error || 'Upload failed.'); setSubmitLoading(false); if (uploadWrap) uploadWrap.hidden = true; return; }
      setTimeout(function() { showScreen('screenProcessing'); pollStatus(); }, 600);
    })
    .catch(function() {
      clearInterval(progInt);
      if (uploadWrap) uploadWrap.hidden = true;
      showError('Upload failed. Check your connection and try again.');
      setSubmitLoading(false);
    });
}

// ── Poll status ────────────────────────────────────────────────────────────────
function pollStatus() {
  var attempts = 0;
  var poll = setInterval(function() {
    attempts++;
    fetch('/api/verification/status', { headers: authHeader() })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.verificationStatus === 'approved') {
          clearInterval(poll);
          Auth.refreshUser().then(function() { showResult('approved', data.faceMatchScore); });
        } else if (data.verificationStatus === 'rejected') {
          clearInterval(poll); showResult('rejected');
        } else if (data.verificationStatus === 'pending' && attempts > 3) {
          clearInterval(poll); showResult('pending');
        }
      })
      .catch(function() { /* keep polling */ });
    if (attempts >= 20) { clearInterval(poll); showResult('pending'); }
  }, 3000);
}

function showResult(status, score) {
  showScreen('screenResult');
  var card = document.getElementById('resultCard');
  if (!card) return;
  if (status === 'approved') {
    card.innerHTML = '<div style="font-size:60px;margin-bottom:16px">✅</div><h2 class="vcard-title">Identity verified!</h2><p class="vcard-desc">Your face matched your profile photos. You now have a verified badge.</p>' + (score ? '<div style="font-size:13px;color:var(--tx3);margin:8px 0 16px">Face match confidence: <strong>' + Math.round(score) + '%</strong></div>' : '') + '<div class="verify-badge verified"><i class="ti ti-badge-check"></i> Verified</div><a href="/" class="auth-btn" style="display:block;text-decoration:none;margin-top:24px">Go to Trppl →</a>';
  } else if (status === 'rejected') {
    card.innerHTML = '<div style="font-size:60px;margin-bottom:16px">❌</div><h2 class="vcard-title">Verification failed</h2><p class="vcard-desc">Your video did not match your profile photos. Please try again with a clearer video in good lighting.</p><button class="auth-btn" id="retryBtn" style="margin-top:20px">Try again</button>';
    var rb = document.getElementById('retryBtn');
    if (rb) rb.addEventListener('click', retryVerification);
  } else {
    card.innerHTML = '<div style="font-size:60px;margin-bottom:16px">⏳</div><h2 class="vcard-title">Under review</h2><p class="vcard-desc">Your submission is being reviewed. You\'ll be notified once approved — usually within a few hours.</p><div class="verify-badge pending"><i class="ti ti-clock"></i> Pending review</div><a href="/" class="auth-btn" style="display:block;text-decoration:none;margin-top:24px">Go to Trppl →</a>';
  }
}

function retryVerification() {
  videoBlob = null; recordedChunks = [];
  var vp  = document.getElementById('videoPreview');  if (vp)  vp.hidden  = true;
  var br  = document.getElementById('btnRetake');     if (br)  br.hidden  = true;
  var bo  = document.getElementById('btnOpenCamera'); if (bo)  bo.hidden  = false;
  var lv  = document.getElementById('liveVideo');     if (lv)  lv.hidden  = true;
  var uw  = document.getElementById('uploadWrap');    if (uw)  uw.hidden  = true;
  var sb  = document.getElementById('submitBtn');     if (sb)  sb.disabled = false;
  var sl  = document.getElementById('submitLabel');   if (sl)  sl.hidden  = false;
  var ss  = document.getElementById('submitSpinner'); if (ss)  ss.hidden  = true;
  showScreen('screenVideo');
}

// ── UI helpers ─────────────────────────────────────────────────────────────────
function showError(msg)    { var e = document.getElementById('formError');   if (e) { e.textContent = msg; e.hidden = false; } }
function hideError()       { var e = document.getElementById('formError');   if (e) e.hidden = true; }
function setSubmitLoading(on) {
  var sb = document.getElementById('submitBtn');     if (sb) sb.disabled   = on;
  var sl = document.getElementById('submitLabel');   if (sl) sl.hidden     = on;
  var ss = document.getElementById('submitSpinner'); if (ss) ss.hidden     = !on;
}

// ── Wire all buttons after DOM ready ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var b;
  b = document.getElementById('btn-start-verify'); if (b) b.addEventListener('click', startVerification);
  b = document.getElementById('btn-open-camera');  if (b) b.addEventListener('click', openCamera);
  b = document.getElementById('recordBtn');        if (b) b.addEventListener('click', toggleRec);
  b = document.getElementById('btn-retake');       if (b) b.addEventListener('click', retake);
  b = document.getElementById('submitBtn');        if (b) b.addEventListener('click', submitVideo);
});
