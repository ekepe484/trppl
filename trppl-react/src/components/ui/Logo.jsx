// src/components/ui/Logo.jsx
export function Logo({ size = 'md', showTagline = true, white = true }) {
  const sizes = { sm: { svg: 28, text: 16, gap: 8 }, md: { svg: 36, text: 20, gap: 10 }, lg: { svg: 72, text: 32, gap: 0 } };
  const s = sizes[size] || sizes.md;
  const textColor = white ? '#fff' : '#1a1a2e';
  const tagColor  = white ? '#a78bfa' : '#7c3aed';

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-0">
        <svg width={s.svg} height={Math.round(s.svg * 0.72)} viewBox="0 0 680 280" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="Trppl logo">
          <polygon points="248,228 308,112 368,228" fill="#f472b6"/>
          <polygon points="312,228 372,112 432,228" fill="#38bdf8"/>
          <polygon points="280,228 340,84 400,228" fill="#7c3aed"/>
          <polygon points="315,160 340,104 365,160" fill="#a78bfa" opacity="0.3"/>
          <circle cx="310" cy="178" r="4" fill="#fff" opacity="0.55"/>
          <circle cx="370" cy="178" r="4" fill="#fff" opacity="0.55"/>
        </svg>
        <div style={{ color: textColor, fontSize: s.text, fontWeight: 800, letterSpacing: '0.22em', lineHeight: 1 }}>TRPPL</div>
        {showTagline && <div style={{ color: tagColor, fontSize: 11, letterSpacing: '0.18em', marginTop: 4 }}>match · compete · date</div>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <svg width={s.svg} height={Math.round(s.svg * 0.78)} viewBox="0 0 680 280" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="Trppl">
        <polygon points="248,228 308,112 368,228" fill="#f472b6"/>
        <polygon points="312,228 372,112 432,228" fill="#38bdf8"/>
        <polygon points="280,228 340,84 400,228" fill="#7c3aed"/>
        <circle cx="310" cy="178" r="4" fill="#fff" opacity="0.5"/>
        <circle cx="370" cy="178" r="4" fill="#fff" opacity="0.5"/>
      </svg>
      <div>
        <div style={{ color: textColor, fontSize: s.text, fontWeight: 800, letterSpacing: '0.2em', lineHeight: 1 }}>TRPPL</div>
        {showTagline && <div style={{ color: tagColor, fontSize: 10, letterSpacing: '0.12em' }}>match · compete · date</div>}
      </div>
    </div>
  );
}
