// src/pages/auth/RegisterPage.jsx
import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthShell } from '../../components/layout/AuthShell';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { Spinner } from '../../components/ui/Spinner';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
  COUNTRIES, EDUCATION_OPTIONS, DRINKING_OPTIONS, SMOKING_OPTIONS,
  HAVEKIDS_OPTIONS, WANTKIDS_OPTIONS, ZODIAC_OPTIONS, RELIGION_OPTIONS,
} from '../../lib/constants';

const STEPS = ['Profile', 'Lifestyle', 'Contact', 'Photos'];

const HEIGHT_OPTIONS = Array.from({ length: 81 }, (_, i) => {
  const cm  = 140 + i;
  const ti  = Math.round(cm / 2.54);
  const ft  = Math.floor(ti / 12);
  const inch = ti % 12;
  return { value: `${cm}cm`, label: `${ft}ft ${inch}in (${cm}cm)` };
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore(s => s.login);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [usernameStatus, setUsernameStatus] = useState('');
  const usernameTimer = useRef(null);
  const photoInputRef = useRef(null);
  const [contactMethod, setContactMethod] = useState('email');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [fields, setFields] = useState({
    fullName:'', username:'', sex:'', dob:'', height:'', city:'', country:'',
    education:'', drinking:'', smoking:'', haveKids:'', wantKids:'', zodiac:'', religion:'',
    email:'', phone:'', password:'', confirmPw:'', terms: false,
  });

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));
  const err = (k, msg) => setErrors(e => ({ ...e, [k]: msg }));
  const clearErr = (k) => setErrors(e => { const n = { ...e }; delete n[k]; return n; });

  // Username check
  const checkUsername = useCallback((val) => {
    clearTimeout(usernameTimer.current);
    if (val.length < 3) { setUsernameStatus(''); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const { data } = await authApi.checkUsername(val);
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus(''); }
    }, 500);
  }, []);

  // Validate step
  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!fields.fullName.trim() || fields.fullName.trim().length < 2) errs.fullName = 'Enter your full name.';
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(fields.username)) errs.username = '3–20 chars, letters/numbers/underscores.';
      if (usernameStatus === 'taken') errs.username = 'Username already taken.';
      if (!fields.sex) errs.sex = 'Please select your sex.';
      if (!fields.dob) errs.dob = 'Required.';
      else if ((new Date() - new Date(fields.dob)) / (365.25*24*60*60*1000) < 18) errs.dob = 'You must be 18 or older.';
      if (!fields.height) errs.height = 'Please select your height.';
      if (!fields.city.trim() || fields.city.trim().length < 2) errs.city = 'Enter your city.';
      if (!fields.country) errs.country = 'Select your country.';
    }
    if (s === 1) {
      if (!fields.education) errs.education = 'Required.';
      if (!fields.drinking)  errs.drinking  = 'Required.';
      if (!fields.smoking)   errs.smoking   = 'Required.';
      if (!fields.haveKids)  errs.haveKids  = 'Required.';
      if (!fields.wantKids)  errs.wantKids  = 'Required.';
      if (!fields.zodiac)    errs.zodiac    = 'Required.';
      if (!fields.religion)  errs.religion  = 'Required.';
    }
    if (s === 2) {
      if (contactMethod === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = 'Enter a valid email.';
      } else {
        if (!/^\+?[1-9]\d{6,14}$/.test(fields.phone.replace(/\s/g,''))) errs.phone = 'Enter a valid phone with country code.';
      }
      if (fields.password.length < 8 || !/[a-zA-Z]/.test(fields.password) || !/\d/.test(fields.password)) {
        errs.password = 'Min 8 chars with letters and numbers.';
      }
      if (fields.password !== fields.confirmPw) errs.confirmPw = 'Passwords do not match.';
      if (!fields.terms) errs.terms = 'You must agree to the terms.';
    }
    if (s === 3 && photos.length === 0) errs.photos = 'Add at least one face photo.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (validateStep(step)) setStep(s => s + 1);
  }
  function goBack() { setStep(s => s - 1); setFormError(''); }

  // Photo handling
  function addPhotos(files) {
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    setPhotos(p => [...p, ...newFiles].slice(0, 6));
  }
  function removePhoto(idx) { setPhotos(p => p.filter((_, i) => i !== idx)); }

  // Submit
  async function handleSubmit() {
    if (!validateStep(3)) return;
    setLoading(true); setFormError('');
    try {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        if (k === 'terms' || k === 'confirmPw') return;
        if (k === 'phone' && contactMethod !== 'phone') return;
        if (k === 'email' && contactMethod !== 'email') return;
        fd.append(k, v);
      });
      fd.append('contactMethod', contactMethod);
      photos.forEach(f => fd.append('photos', f));

      const { data } = await authApi.register(fd);
      const contact = contactMethod === 'email' ? fields.email : fields.phone;
      sessionStorage.setItem('otp_contact', contact);
      sessionStorage.setItem('otp_method',  contactMethod);
      sessionStorage.setItem('otp_purpose', 'register');
      sessionStorage.setItem('otp_masked',  data.contact || contact);
      navigate('/verify-otp');
    } catch (err) {
      if (err.response?.data?.fields) {
        setErrors(err.response.data.fields);
        setFormError('Please fix the errors above.');
      } else {
        setFormError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell tagline="create your account">
      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition
                ${i < step  ? 'bg-green-500 border-green-500 text-white'
                : i === step ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 text-neutral-400'}`}>
                {i < step ? <i className="ti ti-check text-xs" /> : i + 1}
              </div>
              <span className={`text-[9px] font-medium ${i === step ? 'text-violet-600' : i < step ? 'text-green-600' : 'text-neutral-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition ${i < step ? 'bg-green-400' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
            )}
          </div>
        ))}
      </div>

      {formError && <div className="alert-error mb-4">{formError}</div>}

      {/* Step 0: Profile */}
      {step === 0 && (
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Your profile</h1>
          <p className="text-sm text-neutral-500 mb-5">Tell us the basics.</p>

          <FormField label="Full name" error={errors.fullName} icon="ti-user">
            <Input icon placeholder="Your full name" autoComplete="name" value={fields.fullName}
              onChange={e => { set('fullName', e.target.value); clearErr('fullName'); }} />
          </FormField>

          <FormField label="Username" error={errors.username} hint="3–20 chars, letters/numbers/underscores." icon="ti-at">
            <Input icon placeholder="e.g. alex_trppl" autoComplete="username" value={fields.username}
              className="pr-10"
              onChange={e => { set('username', e.target.value); clearErr('username'); checkUsername(e.target.value); }} />
            <span className="absolute right-3 text-sm">
              {usernameStatus === 'checking'  && <span className="text-neutral-400">⏳</span>}
              {usernameStatus === 'available' && <span className="text-green-500">✅</span>}
              {usernameStatus === 'taken'     && <span className="text-red-500">❌</span>}
            </span>
          </FormField>

          <FormField label="Sex" error={errors.sex} icon="ti-gender-bigender">
            <Select icon value={fields.sex} onChange={e => { set('sex', e.target.value); clearErr('sex'); }}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </FormField>

          <FormField label="Date of birth" error={errors.dob} icon="ti-calendar">
            <Input icon type="date" value={fields.dob} onChange={e => { set('dob', e.target.value); clearErr('dob'); }} />
          </FormField>

          <FormField label="Height" error={errors.height} icon="ti-ruler-2">
            <Select icon value={fields.height} onChange={e => { set('height', e.target.value); clearErr('height'); }}>
              <option value="">Select your height…</option>
              {HEIGHT_OPTIONS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </Select>
          </FormField>

          <FormField label="City" error={errors.city} icon="ti-building-community">
            <Input icon placeholder="Your city" autoComplete="address-level2" value={fields.city}
              onChange={e => { set('city', e.target.value); clearErr('city'); }} />
          </FormField>

          <FormField label="Country" error={errors.country} icon="ti-world">
            <Select icon value={fields.country} onChange={e => { set('country', e.target.value); clearErr('country'); }}>
              <option value="">Select your country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormField>

          <button className="btn-primary mt-2" onClick={goNext}>Continue →</button>
          <p className="text-center text-sm text-neutral-500 mt-4">
            Already have an account? <Link to="/login" className="text-violet-600 font-semibold">Sign in</Link>
          </p>
        </div>
      )}

      {/* Step 1: Lifestyle */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Your lifestyle</h1>
          <p className="text-sm text-neutral-500 mb-5">Help others find out if you're compatible.</p>

          {[
            { label: 'Education', key: 'education', icon: 'ti-school',         options: EDUCATION_OPTIONS },
            { label: 'Drinking',  key: 'drinking',  icon: 'ti-glass',          options: DRINKING_OPTIONS  },
            { label: 'Smoking',   key: 'smoking',   icon: 'ti-smoking',        options: SMOKING_OPTIONS   },
            { label: 'Have kids', key: 'haveKids',  icon: 'ti-baby-carriage',  options: HAVEKIDS_OPTIONS  },
            { label: 'Want kids', key: 'wantKids',  icon: 'ti-heart',          options: WANTKIDS_OPTIONS  },
            { label: 'Zodiac sign',key:'zodiac',    icon: 'ti-star',           options: ZODIAC_OPTIONS    },
            { label: 'Religion',  key: 'religion',  icon: 'ti-building-church',options: RELIGION_OPTIONS  },
          ].map(({ label, key, icon, options }) => (
            <FormField key={key} label={label} error={errors[key]} icon={icon}>
              <Select icon value={fields[key]} onChange={e => { set(key, e.target.value); clearErr(key); }}>
                <option value="">Select…</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
          ))}

          <div className="flex gap-2.5 mt-2">
            <button className="btn-outline flex-1" onClick={goBack}>← Back</button>
            <button className="btn-primary flex-[2]" onClick={goNext}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 2: Contact & password */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">How to reach you?</h1>
          <p className="text-sm text-neutral-500 mb-5">Choose how you'll receive your verification code.</p>

          <div className="flex gap-2.5 mb-5">
            {['email','phone'].map(m => (
              <button key={m} type="button" onClick={() => setContactMethod(m)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition
                  ${contactMethod === m ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'border-neutral-200 dark:border-neutral-600 text-neutral-500 bg-neutral-50 dark:bg-neutral-800'}`}>
                <i className={`ti ${m === 'email' ? 'ti-mail' : 'ti-phone'}`} />
                {m === 'email' ? 'Email' : 'Phone'}
              </button>
            ))}
          </div>

          {contactMethod === 'email' ? (
            <FormField label="Email address" error={errors.email} icon="ti-mail">
              <Input icon type="email" placeholder="you@example.com" autoComplete="email" value={fields.email}
                onChange={e => { set('email', e.target.value); clearErr('email'); }} />
            </FormField>
          ) : (
            <FormField label="Phone number" error={errors.phone} hint="Include country code e.g. +44" icon="ti-phone">
              <Input icon type="tel" placeholder="+44 7700 900000" autoComplete="tel" value={fields.phone}
                onChange={e => { set('phone', e.target.value); clearErr('phone'); }} />
            </FormField>
          )}

          <FormField label="Password" error={errors.password} icon="ti-lock">
            <Input icon type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, letters + numbers"
              autoComplete="new-password" className="pr-12" value={fields.password}
              onChange={e => { set('password', e.target.value); clearErr('password'); }} />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 text-neutral-400 text-lg">
              <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
            </button>
          </FormField>

          <FormField label="Confirm password" error={errors.confirmPw} icon="ti-lock">
            <Input icon type={showPw2 ? 'text' : 'password'} placeholder="Repeat your password"
              autoComplete="new-password" className="pr-12" value={fields.confirmPw}
              onChange={e => { set('confirmPw', e.target.value); clearErr('confirmPw'); }} />
            <button type="button" onClick={() => setShowPw2(v => !v)} className="absolute right-3 text-neutral-400 text-lg">
              <i className={`ti ${showPw2 ? 'ti-eye-off' : 'ti-eye'}`} />
            </button>
          </FormField>

          <label className="flex items-start gap-2.5 text-sm text-neutral-500 mb-5 cursor-pointer">
            <input type="checkbox" checked={fields.terms} onChange={e => { set('terms', e.target.checked); clearErr('terms'); }}
              className="mt-0.5 w-4 h-4 accent-violet-600 flex-shrink-0" />
            <span>I agree to the <a href="#" className="text-violet-600 font-semibold">Terms of Service</a> and <a href="#" className="text-violet-600 font-semibold">Privacy Policy</a></span>
          </label>
          {errors.terms && <p className="text-xs text-red-500 -mt-4 mb-4">{errors.terms}</p>}

          <div className="flex gap-2.5">
            <button className="btn-outline flex-1" onClick={goBack}>← Back</button>
            <button className="btn-primary flex-[2]" onClick={goNext}>Continue →</button>
          </div>
        </div>
      )}

      {/* Step 3: Photos */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Add your photos</h1>
          <p className="text-sm text-neutral-500 mb-5">At least 1 clear face photo required. Max 6.</p>

          <div className="grid grid-cols-3 gap-2.5 mb-3">
            {photos.map((f, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden relative bg-neutral-100 dark:bg-neutral-700">
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                  <i className="ti ti-x" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button onClick={() => photoInputRef.current.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:border-violet-400 hover:text-violet-400 transition">
                <i className="ti ti-plus text-2xl" />
                <span className="text-xs font-medium">Add photo</span>
              </button>
            )}
          </div>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />

          <p className="text-xs text-neutral-400 flex items-start gap-1.5 mb-2">
            <i className="ti ti-info-circle mt-0.5" />
            Use clear, well-lit face photos. These are used for identity verification.
          </p>
          {errors.photos && <p className="text-xs text-red-500 mb-3">{errors.photos}</p>}

          <div className="flex gap-2.5 mt-4">
            <button className="btn-outline flex-1" onClick={goBack}>← Back</button>
            <button className="btn-primary flex-[2]" onClick={handleSubmit} disabled={loading}>
              {loading ? <Spinner /> : 'Create account'}
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
