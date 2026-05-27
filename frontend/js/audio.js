const Audio = (() => {
  let ctx = null;
  function getCtx() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); return ctx; }
  function tone(freq, type, dur, vol=0.3, delay=0) {
    try { const c=getCtx(),o=c.createOscillator(),g=c.createGain(); o.connect(g); g.connect(c.destination); o.type=type; o.frequency.value=freq; const s=c.currentTime+delay; g.gain.setValueAtTime(vol,s); g.gain.exponentialRampToValueAtTime(0.001,s+dur); o.start(s); o.stop(s+dur); } catch(e) {}
  }
  function noise(dur, vol=0.15) {
    try { const c=getCtx(),b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length); const s=c.createBufferSource(); s.buffer=b; const g=c.createGain(); g.gain.value=vol; s.connect(g); g.connect(c.destination); s.start(); } catch(e) {}
  }
  return {
    win()    { [523,659,784,1047].forEach((f,i)=>tone(f,'sine',0.2,0.4,i*0.12)); },
    correct(){ tone(660,'sine',0.15,0.4); tone(880,'sine',0.2,0.3,0.1); },
    wrong()  { tone(220,'sawtooth',0.2,0.3); tone(180,'sawtooth',0.15,0.2,0.1); },
    tick()   { tone(440,'sine',0.05,0.2); },
    move()   { tone(300,'sine',0.06,0.15); },
    capture(){ noise(0.08,0.2); tone(200,'sawtooth',0.1,0.3); },
  };
})();
