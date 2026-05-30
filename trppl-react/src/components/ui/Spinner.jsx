export function Spinner({ dark = false, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-8 h-8 border-[3px]' : 'w-5 h-5 border-2';
  return dark
    ? <div className={`inline-block rounded-full border-violet-200 border-t-violet-600 ${sz} animate-spin`} />
    : <div className={`inline-block rounded-full border-white/30 border-t-white ${sz} animate-spin`} />;
}
