// src/pages/app/TrpplTab.jsx
import { useNavigate } from 'react-router-dom';

export function TrpplTab({ onGoToGames }) {
  const navigate = useNavigate();
  return (
    <div>
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pt-4 pb-2">Your active Trppl</p>
      <div className="mx-3.5 mb-3.5 rounded-xl border-2 border-orange-400 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 bg-white dark:bg-neutral-800 border-b border-orange-200">
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <i className="ti ti-lock text-[10px]" /> LOCKED
          </span>
          <span className="ml-auto text-xs text-orange-500 font-semibold flex items-center gap-1">
            <i className="ti ti-clock" /> 4d 18h left
          </span>
        </div>
        <div className="flex items-center px-3 py-5 bg-white dark:bg-neutral-800 gap-2">
          {[
            { initial: 'Y', color: '#7c3aed', name: 'You',    role: 'Competitor' },
            { vs: true },
            { initial: 'S', color: '#ec4899', name: 'Sophie', role: 'The prize' },
            { vs: true },
            { initial: 'J', color: '#0ea5e9', name: 'James',  role: 'Competitor' },
          ].map((item, i) => item.vs
            ? <div key={i} className="text-orange-400 text-lg font-bold px-1">⚔</div>
            : (
              <div key={i} className="flex-1 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-1.5"
                  style={{ background: item.color }}>{item.initial}</div>
                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{item.name}</div>
                <div className="text-[10px] text-neutral-400">{item.role}</div>
              </div>
            )
          )}
        </div>
        <div className="px-4 pb-4">
          <button onClick={onGoToGames}
            className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold flex items-center justify-center gap-2 active:scale-[.98] transition">
            <i className="ti ti-chess" /> Start the battle
          </button>
          <a href="/book-date" className="mt-2 w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[.98] transition text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex' }}>
            <i className="ti ti-heart" /> Book the date 💕
          </a>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pb-2">Rules</p>
      <div className="mx-3.5">
        {[
          { icon: 'ti-sword',    text: 'Play a game. Winner gets the date, loser goes to the waiting room.' },
          { icon: 'ti-calendar', text: 'Winner has 5 days to book a date or the waiting-room user can reclaim.' },
          { icon: 'ti-clock',    text: 'Free users wait 7 days. Premium users can exit immediately.' },
          { icon: 'ti-ban',      text: 'No new matches until the Trppl resolves.' },
        ].map((r, i) => (
          <div key={i} className={`flex gap-3 py-3 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-700' : ''}`}>
            <i className={`ti ${r.icon} text-violet-500 text-lg mt-0.5 flex-shrink-0`} />
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
