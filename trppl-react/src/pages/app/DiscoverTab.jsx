// src/pages/app/DiscoverTab.jsx
import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { LOVE_LANGUAGES, MOCK_PROFILES } from '../../lib/constants';

export function DiscoverTab() {
  const user        = useAuthStore(s => s.user);
  const selectedLL  = useAppStore(s => s.selectedLL);
  const setLL       = useAppStore(s => s.setSelectedLL);
  const profileIdx  = useAppStore(s => s.profileIdx);
  const nextProfile = useAppStore(s => s.nextProfile);

  const filtered = useMemo(() => {
    const sex    = user?.sex;
    const opp    = sex === 'male' ? 'female' : sex === 'female' ? 'male' : null;
    const pool   = opp ? MOCK_PROFILES.filter(p => p.sex === opp) : MOCK_PROFILES;
    return pool.map(p => ({
      ...p,
      compatibility: selectedLL && p.loveLangs[0] === selectedLL
        ? Math.min(99, p.compatibility + 4)
        : selectedLL && p.loveLangs.includes(selectedLL)
        ? Math.min(99, p.compatibility + 2)
        : p.compatibility,
    })).sort((a, b) => b.compatibility - a.compatibility);
  }, [user?.sex, selectedLL]);

  const profile = filtered[profileIdx % (filtered.length || 1)];

  return (
    <div>
      {/* Love language quiz */}
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pt-4 pb-2">Love language quiz</p>
      <div className="card mx-3.5 mb-3.5 p-4">
        <div className="flex gap-1.5 mb-3.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i < 4 ? 'bg-violet-500' : 'bg-neutral-200 dark:bg-neutral-600'}`} />
          ))}
        </div>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-3">Which means the most to you in a relationship?</p>
        <div className="flex flex-col gap-2">
          {LOVE_LANGUAGES.map(ll => (
            <button key={ll.id} onClick={() => setLL(ll.label)}
              className={`w-full text-left px-3.5 py-3 rounded-xl border text-sm transition
                ${selectedLL === ll.label
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200'}`}>
              <span className="font-semibold">{ll.emoji} {ll.label}</span>
              <span className={`block text-xs mt-0.5 ${selectedLL === ll.label ? 'text-violet-200' : 'text-neutral-400'}`}>{ll.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile card */}
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pb-2">Your best match today</p>
      {profile && (
        <div className="card mx-3.5 mb-3.5 overflow-hidden">
          {/* Photo area */}
          <div className="h-64 flex items-center justify-center relative" style={{ background: '#1a1a2e' }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold"
              style={{ background: profile.color }}>
              {profile.name[0]}
            </div>
            <div className="absolute top-3.5 right-3.5 bg-violet-600/90 text-white text-xs px-3 py-1 rounded-full font-semibold">
              ❤ {profile.compatibility}% compatible
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{profile.name}, {profile.age}</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              <i className="ti ti-map-pin" /> {profile.city}, {profile.country}
            </p>

            {/* Love language pills */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {profile.loveLangs.map(ll => (
                <span key={ll} className={`ll-pill ${ll === selectedLL ? 'll-pill-match' : ''}`}>
                  {ll === selectedLL && '✨ '}{ll}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button onClick={nextProfile}
                className="flex-1 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <i className="ti ti-x" /> Pass
              </button>
              <button onClick={() => alert(`Matched with ${profile.name}! Check your alerts.`)}
                className="flex-[2] py-3.5 rounded-xl bg-violet-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <i className="ti ti-heart" /> Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
