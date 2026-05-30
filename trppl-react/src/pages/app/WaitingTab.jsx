// src/pages/app/WaitingTab.jsx
import { useState, useEffect } from 'react';

const OTHERS = [
  { initial: 'M', color: '#7c3aed', name: 'Marcus', lost: 'Lost to: Ella',  days: '5d left' },
  { initial: 'D', color: '#0ea5e9', name: 'Daniel', lost: 'Lost to: Priya', days: '3d left' },
  { initial: 'T', color: '#16a34a', name: 'Tom',    lost: 'Lost to: Hannah',days: '1d left' },
];

export function WaitingTab() {
  const [secs, setSecs] = useState(6*86400 + 23*3600 + 41*60);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600), m = Math.floor((secs % 3600) / 60);

  return (
    <div>
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pt-4 pb-2">Your status</p>
      <div className="mx-3.5 mb-3.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-5 text-center">
        <div className="text-4xl text-red-500 mb-2"><i className="ti ti-clock" /></div>
        <h2 className="text-lg font-bold text-red-800 dark:text-red-300">You're in the waiting room</h2>
        <p className="text-sm text-red-700 dark:text-red-400 mt-1.5">You lost the Trppl game. Sit tight — or go Premium to skip.</p>
        <div className="text-4xl font-bold text-red-600 dark:text-red-400 my-4 font-mono">
          {d}d {h}h {m}m
        </div>
        <p className="text-xs text-red-600 dark:text-red-500 mb-3">until you can match again</p>
        <button className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2 active:scale-[.98] transition">
          <i className="ti ti-crown" /> Go Premium — skip instantly
        </button>
      </div>

      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pb-2">Others waiting</p>
      <div className="card mx-3.5">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">Free users</div>
        {OTHERS.map((o, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < OTHERS.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: o.color }}>{o.initial}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{o.name}</div>
              <div className="text-xs text-neutral-400">{o.lost}</div>
            </div>
            <div className="text-xs text-red-500 font-semibold">{o.days}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
