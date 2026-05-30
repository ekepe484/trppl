// src/pages/auth/VerifyIdentityPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { Spinner } from '../../components/ui/Spinner';
import { verifyApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const SCREENS = { INTRO: 'intro', VIDEO: 'video', PROCESSING: 'processing', RESULT: 'result' };

export default function VerifyIdentityPage() {
  const navigate    = useNavigate();
  const updateUser  = useAuthStore(s => s.updateUser);
  const [screen,    setScreen]    = useState(SCREENS.INTRO);
  const [phrase,    setPhrase]    = useState('');
  const [error,     setError]     = useState('');
  const [isRec,     setIsRec]     = useState(false);
  const [recSecs,   setRecSecs]   = useState(0);
  const [result,    setResult]    = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [cameraOpen,setCameraOpen]= useState(false);
  const [hasPreview,setHasPreview]= useState(false);

  const videoRef    = useRef(null);
  const previewRef  = useRef(null);
  const streamRef   = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const blobRef     = useRef(null);
  const timerRef    = useRef(null);

  async function startVerify() {
    setScreen(SCREENS.VIDEO);
    try {
      const { data } = await verifyApi.phrase();
      setPhrase(data.phrase);
    } catch {
      setPhrase('I am a real person joining Trppl and this is my live face.');
    }
  }

  async function openCamera() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCameraOpen(true);
    } catch {
      setError('Camera or microphone access denied. Both are required.');
    }
  }

  function startRec() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    recorderRef.current = new MediaRecorder(streamRef.current, { mimeType: mime });
    recorderRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorderRef.current.onstop = onStop;
    recorderRef.current.start(100);
    setIsRec(true); setRecSecs(0);
    timerRef.current = setInterval(() => {
      setRecSecs(s => { if (s >= 29) { stopRec(); return s; } return s + 1; });
    }, 1000);
  }

  function stopRec() {
    clearInterval(timerRef.current);
    setIsRec(false);
    if (recorderRef.current?.state !== 'inactive') recorderRef.current.stop();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }

  function onStop() {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    blobRef.current = blob;
    const url = URL.createObjectURL(blob);
    if (previewRef.current) { previewRef.current.src = url; }
    setHasPreview(true); setCameraOpen(false);
  }

  function retake() {
    blobRef.current = null; chunksRef.current = [];
    setHasPreview(false); setCameraOpen(false); setError('');
  }

  async function submit() {
    if (!blobRef.current) { setError('Please record your verification video.'); return; }
    setUploading(true); setUploadPct(0); setError('');
    const prog = setInterval(() => setUploadPct(p => Math.min(p + Math.random() * 15, 88)), 200);
    try {
      const fd = new FormData();
      const typedBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      fd.append('video', typedBlob, 'liveness.webm');
      await verifyApi.submit(fd);
      clearInterval(prog); setUploadPct(100);
      setTimeout(() => { setScreen(SCREENS.PROCESSING); pollStatus(); }, 600);
    } catch (err) {
      clearInterval(prog); setUploading(false); setUploadPct(0);
      setError(err.message || 'Upload failed. Please try again.');
    }
  }

  async function pollStatus() {
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const { data } = await verifyApi.status();
        if (data.verificationStatus === 'approved') {
          clearInterval(poll);
          updateUser({ profileVerified: true, verificationStatus: 'approved' });
          setResult({ status: 'approved', score: data.faceMatchScore });
          setScreen(SCREENS.RESULT);
        } else if (data.verificationStatus === 'rejected') {
          clearInterval(poll);
          setResult({ status: 'rejected' });
          setScreen(SCREENS.RESULT);
        } else if ((data.verificationStatus === 'pending' && attempts > 3) || attempts >= 20) {
          clearInterval(poll);
          setResult({ status: 'pending' });
          setScreen(SCREENS.RESULT);
        }
      } catch {}
    }, 3000);
  }

  useEffect(() => () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  return (
    <AuthShell tagline="identity verification">
      {/* INTRO */}
      {screen === SCREENS.INTRO && (
        <div className="text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Verify your identity</h1>
          <p className="text-sm text-neutral-500 mb-6">Record a short video repeating the phrase shown. Our AI checks your face matches your photos.</p>
          <div className="text-left space-y-3 mb-6">
            {[
              'We show you a short phrase to read aloud',
              'Record yourself saying it (up to 30 seconds)',
              'AI checks your face matches your profile photos',
              'Get your ✅ verified badge on approval',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 pt-1">{step}</p>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={startVerify}>Start verification →</button>
          <p className="mt-4"><a onClick={() => navigate('/')} className="text-violet-600 text-sm font-semibold cursor-pointer">Skip for now</a></p>
        </div>
      )}

      {/* VIDEO */}
      {screen === SCREENS.VIDEO && (
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-3">Read this aloud</h2>

          {/* Phrase */}
          <div className="bg-[#1a1a2e] border-2 border-violet-600 rounded-xl p-4 mb-4 text-center shadow-[0_4px_20px_rgba(124,58,237,.3)]">
            <p className="text-white font-bold text-lg leading-relaxed">"{phrase || 'Loading…'}"</p>
          </div>

          {error && <div className="alert-error mb-3">{error}</div>}

          {/* Camera */}
          <div className="relative bg-[#1a1a2e] rounded-xl overflow-hidden" style={{ aspectRatio: '4/5', maxHeight: '45vh' }}>
            <video ref={videoRef} autoPlay playsInline muted
              className={`w-full h-full object-cover ${cameraOpen ? 'block' : 'hidden'}`}
              style={{ transform: 'scaleX(-1)' }} />
            <video ref={previewRef} controls
              className={`w-full h-full object-cover ${hasPreview ? 'block' : 'hidden'}`} />

            {!cameraOpen && !hasPreview && (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-2">
                <i className="ti ti-camera-off text-4xl" />
                <span className="text-sm">Camera not started</span>
              </div>
            )}

            {/* REC indicator */}
            {isRec && (
              <div className="absolute top-3 left-3 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <div className="rec-dot w-2 h-2 rounded-full bg-white" />
                REC {30 - recSecs}s
              </div>
            )}

            {/* Overlay buttons */}
            {!cameraOpen && !hasPreview && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <button className="btn-primary text-base font-extrabold" onClick={openCamera}>
                  <i className="ti ti-video" /> Open camera
                </button>
              </div>
            )}
            {cameraOpen && !isRec && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <button className="btn-danger text-base font-extrabold shadow-[0_0_0_3px_rgba(220,38,38,.4)]" onClick={startRec}>
                  <i className="ti ti-circle" /> Start recording
                </button>
              </div>
            )}
            {cameraOpen && isRec && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <button className="btn-outline text-base font-extrabold border-white text-white bg-black/40" onClick={stopRec}>
                  <i className="ti ti-player-stop" /> Stop recording
                </button>
              </div>
            )}
            {hasPreview && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex gap-2">
                  <button className="flex-1 py-3.5 rounded-xl font-bold text-white bg-black/50 border border-white/40" onClick={retake}>Retake</button>
                  <button className="flex-[2] btn-primary" onClick={submit} disabled={uploading}>
                    {uploading ? <Spinner /> : 'Submit video'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-3">
              <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
              <p className="text-xs text-neutral-400 text-center mt-1">Uploading… {Math.round(uploadPct)}%</p>
            </div>
          )}

          <p className="text-xs text-neutral-400 flex items-start gap-1.5 mt-3">
            <i className="ti ti-info-circle mt-0.5" />
            Good lighting, look directly at camera, speak clearly.
          </p>
        </div>
      )}

      {/* PROCESSING */}
      {screen === SCREENS.PROCESSING && (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Analysing your video</h2>
          <p className="text-sm text-neutral-500 mb-6">AI is comparing your face to your photos. Usually 10–30 seconds.</p>
          <div className="flex justify-center gap-2">
            {[0, 0.25, 0.5].map(d => <div key={d} className="tv-dot" style={{ animationDelay: `${d}s` }} />)}
          </div>
        </div>
      )}

      {/* RESULT */}
      {screen === SCREENS.RESULT && result && (
        <div className="text-center py-6">
          {result.status === 'approved' && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Identity verified!</h2>
              <p className="text-sm text-neutral-500 mb-2">Your face matched your photos. You now have a verified badge.</p>
              {result.score && <p className="text-xs text-neutral-400 mb-4">Match confidence: <strong>{Math.round(result.score)}%</strong></p>}
              <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-4 py-2 text-sm font-semibold mb-6">
                <i className="ti ti-badge-check" /> Verified
              </div>
              <button className="btn-primary" onClick={() => navigate('/')}>Go to Trppl →</button>
            </>
          )}
          {result.status === 'rejected' && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Verification failed</h2>
              <p className="text-sm text-neutral-500 mb-6">Your video didn't match your photos. Try again with better lighting.</p>
              <button className="btn-primary" onClick={() => { setScreen(SCREENS.VIDEO); setHasPreview(false); setCameraOpen(false); setError(''); }}>Try again</button>
            </>
          )}
          {result.status === 'pending' && (
            <>
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Under review</h2>
              <p className="text-sm text-neutral-500 mb-4">Being reviewed manually. Usually approved within a few hours.</p>
              <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-4 py-2 text-sm font-semibold mb-6">
                <i className="ti ti-clock" /> Pending review
              </div>
              <button className="btn-primary" onClick={() => navigate('/')}>Go to Trppl →</button>
            </>
          )}
        </div>
      )}
    </AuthShell>
  );
}
