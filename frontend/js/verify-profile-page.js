// verify-profile-page.js

(function () {
  if (!Auth.requireAuth()) return;

  let videoStream    = null;
  let mediaRecorder  = null;
  let recordedChunks = [];
  let videoBlob      = null;
  let isRecording    = false;
  let recTimer       = null;
  let recSecs        = 0;
  const MAX_SECS     = 30;

  // ── Screen switcher ───────────────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.vscreen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ── Intro → Video ─────────────────────────────────────────────────────────
  window.startVerification = async function() {
    showScreen('screenVideo');
    await loadPhrase();
  };

  async function loadPhrase() {
    document.getElementById('phraseLoading').style.display = 'flex';
    document.getElementById('phraseText').hidden = true;
    try {
      const res  = await fetch('/api/verification/phrase', { headers: authHeader() });
      const data = await res.json();
      document.getElementById('phraseText').textContent = '"' + data.phrase + '"';
      document.getElementById('phraseText').hidden = false;
    } catch {
      document.getElementById('phraseText').textContent = '"I verify that this is me and I am joining Trppl today."';
      document.getElementById('phraseText').hidden = false;
    } finally {
      document.getElementById('phraseLoading').style.display = 'none';
    }
  }

  function authHeader() {
    const t = Auth.getToken();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  window.openCamera = async function() {
    hideError();
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: true,
      });
      const vid = document.getElementById('liveVideo');
      vid.srcObject = videoStream; vid.hidden = false;
      document.getElementById('videoPreview').hidden = true;
      document.getElementById('btnOpenCamera').hidden = true;
      document.getElementById('btnRecord').hidden      = false;
    } catch {
      showError('Camera or microphone access was denied. Both are required for verification.');
    }
  };

  window.toggleRec = function() { isRecording ? stopRec() : startRec(); };

  function startRec() {
    if (!videoStream) return;
    recordedChunks = []; isRecording = true; recSecs = 0;
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
               : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    mediaRecorder = new MediaRecorder(videoStream, { mimeType: mime });
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = onRecStop;
    mediaRecorder.start(100);

    const btn = document.getElementById('recordBtn');
    btn.innerHTML = '<i class="ti ti-player-stop"></i> Stop recording';
    btn.className = 'auth-btn auth-btn-outline';
    document.getElementById('recIndicator').hidden = false;
    document.getElementById('cameraTimer').hidden  = false;

    recTimer = setInterval(() => {
      recSecs++;
      document.getElementById('timerVal').textContent = MAX_SECS - recSecs;
      if (recSecs >= MAX_SECS) stopRec();
    }, 1000);
  }

  function stopRec() {
    if (!isRecording) return;
    isRecording = false;
    clearInterval(recTimer);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    document.getElementById('recIndicator').hidden = true;
    document.getElementById('cameraTimer').hidden  = true;
  }

  function onRecStop() {
    videoBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
    const url  = URL.createObjectURL(videoBlob);
    const prev = document.getElementById('videoPreview');
    prev.src = url; prev.hidden = false;
    document.getElementById('liveVideo').hidden = true;
    document.getElementById('btnRecord').hidden = true;
    document.getElementById('btnRetake').hidden = false;
    if (videoStream) { videoStream.getTracks().forEach(t => t.stop()); videoStream = null; }
  }

  window.retake = function() {
    videoBlob = null;
    document.getElementById('videoPreview').hidden = true;
    document.getElementById('btnRetake').hidden = true;
    document.getElementById('btnOpenCamera').hidden = false;
    document.getElementById('liveVideo').hidden = true;
    document.getElementById('recordBtn').innerHTML = '<i class="ti ti-circle"></i> Start recording';
    document.getElementById('recordBtn').className = 'auth-btn auth-btn-red';
    hideError();
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  window.submitVideo = async function() {
    if (!videoBlob) { showError('Please record your verification video first.'); return; }

    setSubmitLoading(true);
    hideError();

    const formData = new FormData();
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('video', videoBlob, 'liveness.' + ext);

    // Fake upload progress
    const uploadWrap = document.getElementById('uploadWrap');
    const uploadBar  = document.getElementById('uploadBar');
    const uploadLbl  = document.getElementById('uploadLabel');
    uploadWrap.hidden = false;
    let progress = 0;
    const progInt = setInterval(() => {
      progress = Math.min(progress + Math.random() * 15, 88);
      uploadBar.style.width = progress + '%';
      uploadLbl.textContent = 'Uploading… ' + Math.round(progress) + '%';
    }, 200);

    try {
      const res  = await fetch('/api/verification/submit', {
        method:  'POST',
        headers: authHeader(),
        body:    formData,
      });
      clearInterval(progInt);
      uploadBar.style.width = '100%';
      uploadLbl.textContent = 'Upload complete!';

      const data = await res.json();
      if (!res.ok) { showError(data.error || 'Upload failed.'); setSubmitLoading(false); uploadWrap.hidden = true; return; }

      setTimeout(() => {
        showScreen('screenProcessing');
        pollStatus();
      }, 600);
    } catch (err) {
      clearInterval(progInt);
      uploadWrap.hidden = true;
      showError('Upload failed. Check your connection and try again.');
      setSubmitLoading(false);
    }
  };

  // ── Poll status ───────────────────────────────────────────────────────────
  async function pollStatus() {
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res  = await fetch('/api/verification/status', { headers: authHeader() });
        const data = await res.json();

        if (data.verificationStatus === 'approved') {
          clearInterval(poll);
          await Auth.refreshUser();
          showResult('approved', data.faceMatchScore);
        } else if (data.verificationStatus === 'rejected') {
          clearInterval(poll);
          showResult('rejected');
        } else if (data.verificationStatus === 'pending' && attempts > 3) {
          clearInterval(poll);
          showResult('pending');
        }
      } catch { /* keep polling */ }
      if (attempts >= 20) { clearInterval(poll); showResult('pending'); }
    }, 3000);
  }

  function showResult(status, score) {
    showScreen('screenResult');
    const card = document.getElementById('resultCard');
    if (status === 'approved') {
      card.innerHTML = `
        <div style="font-size:60px;margin-bottom:16px">✅</div>
        <h2 class="vcard-title">Identity verified!</h2>
        <p class="vcard-desc">Your face matched your profile photos. You now have a verified badge on your profile.</p>
        ${score ? '<div style="font-size:13px;color:var(--tx3);margin:8px 0 16px">Face match confidence: <strong>' + Math.round(score) + '%</strong></div>' : ''}
        <div class="verify-badge verified"><i class="ti ti-badge-check"></i> Verified</div>
        <a href="/" class="auth-btn" style="display:block;text-decoration:none;margin-top:24px">Go to Trppl →</a>`;
    } else if (status === 'rejected') {
      card.innerHTML = `
        <div style="font-size:60px;margin-bottom:16px">❌</div>
        <h2 class="vcard-title">Verification failed</h2>
        <p class="vcard-desc">Your video didn't match your profile photos. Please try again with a clearer video in good lighting.</p>
        <button class="auth-btn" onclick="retryVerification()" style="margin-top:20px">Try again</button>`;
    } else {
      card.innerHTML = `
        <div style="font-size:60px;margin-bottom:16px">⏳</div>
        <h2 class="vcard-title">Under review</h2>
        <p class="vcard-desc">Your submission is being reviewed manually. You'll be notified once it's approved — usually within a few hours.</p>
        <div class="verify-badge pending"><i class="ti ti-clock"></i> Pending review</div>
        <a href="/" class="auth-btn" style="display:block;text-decoration:none;margin-top:24px">Go to Trppl →</a>`;
    }
  }

  window.retryVerification = function() {
    videoBlob = null; recordedChunks = [];
    document.getElementById('videoPreview').hidden = true;
    document.getElementById('btnRetake').hidden = true;
    document.getElementById('btnOpenCamera').hidden = false;
    document.getElementById('liveVideo').hidden = true;
    document.getElementById('uploadWrap').hidden = true;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitLabel').hidden  = false;
    document.getElementById('submitSpinner').hidden = true;
    showScreen('screenVideo');
  };

  function showError(msg) { const e = document.getElementById('formError'); e.textContent = msg; e.hidden = false; }
  function hideError()    { document.getElementById('formError').hidden = true; }
  function setSubmitLoading(on) {
    document.getElementById('submitBtn').disabled = on;
    document.getElementById('submitLabel').hidden  = on;
    document.getElementById('submitSpinner').hidden = !on;
  }
})();
