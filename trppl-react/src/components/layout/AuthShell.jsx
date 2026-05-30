// src/components/layout/AuthShell.jsx
import { Logo } from '../ui/Logo';

export function AuthShell({ tagline, children }) {
  return (
    <div className="phone">
      <div className="bg-[#1a1a2e] px-6 pt-7 pb-5 flex flex-col items-center gap-1 flex-shrink-0">
        <Logo size="lg" showTagline={false} />
        {tagline && <p className="text-violet-400 text-xs tracking-widest mt-1">{tagline}</p>}
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-7">
        {children}
      </div>
    </div>
  );
}
