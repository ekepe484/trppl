// src/pages/app/ProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { useAuthStore } from '../../store/authStore';
import { profileApi } from '../../lib/api';
import {
  COUNTRIES, EDUCATION_OPTIONS, DRINKING_OPTIONS, SMOKING_OPTIONS,
  HAVEKIDS_OPTIONS, WANTKIDS_OPTIONS, ZODIAC_OPTIONS, RELIGION_OPTIONS, LABEL_MAPS,
} from '../../lib/constants';

const HEIGHT_OPTIONS = Array.from({ length: 81 }, (_, i) => {
  const cm = 140 + i, ti = Math.round(cm / 2.54), ft = Math.floor(ti/12), inch = ti%12;
  return { value: `${cm}cm`, label: `${ft}ft ${inch}in (${cm}cm)` };
});

function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function ProfilePage() {
  const navigate    = useNavigate();
  const logout      = useAuthStore(s => s.logout);
  const setUser     = useAuthStore(s => s.setUser);
  const storeUser   = useAuthStore(s => s.user);

  const [user,     setLocalUser] = useState(storeUser);
  const [editing,  setEditing]   = useState(false);
  const [saving,   setSaving]    = useState(false);
  const [error,    setError]     = useState('');
  const [success,  setSuccess]   = useState('');
  const [newPhotos,setNewPhotos] = useState([]);
  const photoRef = useRef(null);

  const [fields, setFields] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await profileApi.get();
      setLocalUser(data.user);
      setUser(data.user);
    } catch {}
  }

  function startEdit() {
    setFields({
      name:      user?.name      || '',
      city:      user?.city      || '',
      country:   user?.country   || '',
      height:    user?.height    || '',
      education: user?.education || '',
      drinking:  user?.drinking  || '',
      smoking:   user?.smoking   || '',
      haveKids:  user?.haveKids  || '',
      wantKids:  user?.wantKids  || '',
      zodiac:    user?.zodiac    || '',
      religion:  user?.religion  || '',
    });
    setNewPhotos([]);
    setEditing(true);
    setError(''); setSuccess('');
  }

  async function save() {
    setSaving(true); setError('');
    try {
      if (newPhotos.length > 0) {
        const fd = new FormData();
        newPhotos.forEach(f => fd.append('photos', f));
        const { data } = await profileApi.addPhotos(fd);
        setLocalUser(data.user); setUser(data.user);
        setNewPhotos([]);
      }
      const { data } = await profileApi.update(fields);
      setLocalUser(data.user); setUser(data.user);
      setEditing(false);
      setSuccess('Profile updated!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletePhoto(idx) {
    try {
      const { data } = await profileApi.deletePhoto(idx);
      setLocalUser(data.user); setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  const initial = (user?.name || user?.username || 'A')[0].toUpperCase();
  const age = calcAge(user?.dob);

  const LIFESTYLE = [
    { label: 'Education', key: 'education', icon: 'ti-school'         },
    { label: 'Drinking',  key: 'drinking',  icon: 'ti-glass'          },
    { label: 'Smoking',   key: 'smoking',   icon: 'ti-smoking'        },
    { label: 'Have kids', key: 'haveKids',  icon: 'ti-baby-carriage'  },
    { label: 'Want kids', key: 'wantKids',  icon: 'ti-heart'          },
    { label: 'Zodiac',    key: 'zodiac',    icon: 'ti-star'           },
    { label: 'Religion',  key: 'religion',  icon: 'ti-building-church'},
  ];
  const LS_OPTIONS = { education:EDUCATION_OPTIONS, drinking:DRINKING_OPTIONS, smoking:SMOKING_OPTIONS, haveKids:HAVEKIDS_OPTIONS, wantKids:WANTKIDS_OPTIONS, zodiac:ZODIAC_OPTIONS, religion:RELIGION_OPTIONS };

  return (
    <div className="phone bg-neutral-100 dark:bg-neutral-900">
      {/* Header bar */}
      <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-white flex items-center gap-1.5 text-sm">
          <i className="ti ti-arrow-left" /> Back
        </button>
        <button onClick={editing ? () => { setEditing(false); setError(''); } : startEdit}
          className="border border-white/30 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <i className={`ti ${editing ? 'ti-x' : 'ti-edit'}`} />
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Avatar + name */}
      <div className="bg-[#1a1a2e] px-4 pb-6 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold text-white border-3 border-white">
          {initial}
        </div>
        <div>
          <div className="text-white text-xl font-bold">{user?.name || '…'}</div>
          <div className="text-violet-300 text-sm">@{user?.username || '…'}</div>
          {user?.profileVerified && (
            <div className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs px-2.5 py-0.5 mt-1.5 font-semibold">
              <i className="ti ti-badge-check text-xs" /> Verified
            </div>
          )}
          {!user?.profileVerified && user?.verificationStatus === 'pending' && (
            <div className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-xs px-2.5 py-0.5 mt-1.5 font-semibold">
              <i className="ti ti-clock text-xs" /> Pending review
            </div>
          )}
        </div>
      </div>

      <div className="overflow-y-auto pb-8">
        {success && <div className="alert-success mx-3.5 mt-3">{success}</div>}
        {error   && <div className="alert-error   mx-3.5 mt-3">{error}</div>}

        {/* PHOTOS */}
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pt-4 pb-2">
          Photos {editing && <span className="normal-case font-normal text-neutral-300">(tap × to remove)</span>}
        </p>
        <div className="grid grid-cols-3 gap-2 px-3.5 mb-4">
          {(user?.photoPaths || []).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-2xl font-bold text-violet-600 relative">
              {i + 1}
              {editing && (
                <button onClick={() => deletePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white text-xs flex items-center justify-center">
                  <i className="ti ti-x text-[9px]" />
                </button>
              )}
            </div>
          ))}
          {newPhotos.map((f, i) => (
            <div key={`new-${i}`} className="aspect-square rounded-xl overflow-hidden relative">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setNewPhotos(p => p.filter((_,j)=>j!==i))}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600/90 text-white text-xs flex items-center justify-center">
                <i className="ti ti-x text-[9px]" />
              </button>
            </div>
          ))}
          {editing && (user?.photoPaths || []).length + newPhotos.length < 6 && (
            <button onClick={() => photoRef.current.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:border-violet-400 hover:text-violet-400 transition">
              <i className="ti ti-plus text-xl" />
              <span className="text-xs">Add</span>
            </button>
          )}
          {!(user?.photoPaths || []).length && !newPhotos.length && !editing && (
            <div className="col-span-3 text-sm text-neutral-400 py-2">No photos yet. Edit to add some.</div>
          )}
        </div>
        <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={e => { setNewPhotos(p => [...p, ...Array.from(e.target.files)].slice(0,6)); e.target.value=''; }} />

        {!editing ? (
          <>
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pb-2">About me</p>
            <div className="card mx-3.5 mb-4">
              {[
                { label: 'Age',      value: age ? `${age} years old` : '—',                     icon: 'ti-calendar'  },
                { label: 'Height',   value: user?.height || '—',                                 icon: 'ti-ruler-2'   },
                { label: 'Location', value: [user?.city, user?.country].filter(Boolean).join(', ') || '—', icon: 'ti-map-pin' },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-700' : ''}`}>
                  <span className="text-sm text-neutral-500 flex items-center gap-2"><i className={`ti ${row.icon} text-violet-500`}/>{row.label}</span>
                  <span className="text-sm font-medium text-neutral-800 dark:text-white text-right max-w-[60%]">{row.value}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pb-2">Lifestyle</p>
            <div className="card mx-3.5 mb-4">
              {LIFESTYLE.map((row, i) => (
                <div key={row.key} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-700' : ''}`}>
                  <span className="text-sm text-neutral-500 flex items-center gap-2"><i className={`ti ${row.icon} text-violet-500`}/>{row.label}</span>
                  <span className="text-sm font-medium text-neutral-800 dark:text-white">{LABEL_MAPS[row.key]?.[user?.[row.key]] || '—'}</span>
                </div>
              ))}
            </div>

            {!user?.profileVerified && user?.verificationStatus === 'none' && (
              <div className="mx-3.5 mb-3">
                <button onClick={() => navigate('/verify-identity')} className="btn-primary bg-orange-500">
                  <i className="ti ti-shield-check" /> Verify my identity
                </button>
              </div>
            )}
            <div className="mx-3.5">
              <button onClick={logout} className="btn-outline border-red-400 text-red-500">
                <i className="ti ti-logout" /> Sign out
              </button>
            </div>
          </>
        ) : (
          <div className="px-3.5">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest pb-3">Basic details</p>
            <FormField label="Full name" icon="ti-user"><Input icon value={fields.name} onChange={e=>setFields(f=>({...f,name:e.target.value}))} placeholder="Your full name" /></FormField>
            <FormField label="City" icon="ti-building-community"><Input icon value={fields.city} onChange={e=>setFields(f=>({...f,city:e.target.value}))} placeholder="Your city" /></FormField>
            <FormField label="Country" icon="ti-world">
              <Select icon value={fields.country} onChange={e=>setFields(f=>({...f,country:e.target.value}))}>
                <option value="">Select…</option>
                {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="Height" icon="ti-ruler-2">
              <Select icon value={fields.height} onChange={e=>setFields(f=>({...f,height:e.target.value}))}>
                <option value="">Select…</option>
                {HEIGHT_OPTIONS.map(h=><option key={h.value} value={h.value}>{h.label}</option>)}
              </Select>
            </FormField>

            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest pt-2 pb-3">Lifestyle</p>
            {LIFESTYLE.map(({ label, key, icon }) => (
              <FormField key={key} label={label} icon={icon}>
                <Select icon value={fields[key] || ''} onChange={e=>setFields(f=>({...f,[key]:e.target.value}))}>
                  <option value="">Select…</option>
                  {LS_OPTIONS[key].map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </FormField>
            ))}

            <div className="flex gap-2.5 mt-4 pb-4">
              <button className="btn-outline flex-1" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-success flex-[2]" onClick={save} disabled={saving}>
                {saving ? <Spinner /> : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
