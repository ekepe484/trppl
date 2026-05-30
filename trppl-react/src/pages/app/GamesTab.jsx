// src/pages/app/GamesTab.jsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Audio } from '../../lib/audio';

const GAMES = [
  { id: 'trivia',   name: 'Trivia',   icon: '🧠', tag: '10 questions duel', badge: 'bg-violet-100 text-violet-700', label: 'Mind'  },
  { id: 'chess',    name: 'Chess',    icon: '♟',  tag: 'Strategic battle',  badge: 'bg-violet-100 text-violet-700', label: 'Board' },
  { id: 'checkers', name: 'Checkers', icon: '🔴', tag: 'Classic tactics',   badge: 'bg-violet-100 text-violet-700', label: 'Board' },
  { id: 'scrabble', name: 'Scrabble', icon: '🔤', tag: 'Word builder',      badge: 'bg-yellow-100 text-yellow-700', label: 'Word'  },
];

// ── Chess ─────────────────────────────────────────────────────────────────────
const PIECES = {
  white: { king:'♔',queen:'♕',rook:'♖',bishop:'♗',knight:'♘',pawn:'♙' },
  black: { king:'♚',queen:'♛',rook:'♜',bishop:'♝',knight:'♞',pawn:'♟' },
};
function initChessBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  const back = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
  back.forEach((p, c) => { b[0][c]={piece:p,color:'black'}; b[1][c]={piece:'pawn',color:'black'}; b[6][c]={piece:'pawn',color:'white'}; b[7][c]={piece:p,color:'white'}; });
  return b;
}

function ChessGame({ onResult }) {
  const [board, setBoard]   = useState(initChessBoard);
  const [sel, setSel]       = useState(null);
  const [turn, setTurn]     = useState('white');
  const [caps, setCaps]     = useState({ my: 0, j: 0 });
  const [msg, setMsg]       = useState('Your turn (White) — tap a piece');

  function click(r, c) {
    if (turn !== 'white') return;
    const p = board[r][c];
    if (!sel) { if (p?.color === 'white') setSel([r,c]); return; }
    const [sr,sc] = sel;
    if (sr===r && sc===c) { setSel(null); return; }
    if (p?.color === 'white') { setSel([r,c]); return; }
    const nb = board.map(row => [...row]);
    if (p?.color === 'black') {
      if (p.piece === 'king') { onResult(true, caps.my+1, caps.j); return; }
      setCaps(c => ({ ...c, my: c.my+1 })); Audio.capture();
    } else Audio.move();
    nb[r][c] = nb[sr][sc]; nb[sr][sc] = null;
    setSel(null); setBoard(nb); setTurn('black'); setMsg('James is thinking…');
    setTimeout(() => aiMove(nb, caps), 700);
  }

  function aiMove(b, c) {
    const moves = [];
    for (let r=0;r<8;r++) for (let c2=0;c2<8;c2++) {
      const p = b[r][c2]; if (!p || p.color !== 'black') continue;
      [[r+1,c2],[r+1,c2+1],[r+1,c2-1],[r-1,c2],[r,c2+1],[r,c2-1]].forEach(([nr,nc]) => {
        if (nr>=0&&nr<8&&nc>=0&&nc<8&&(!b[nr][nc]||b[nr][nc].color==='white')) moves.push({fr:r,fc:c2,tr:nr,tc:nc,cap:b[nr][nc]});
      });
    }
    if (!moves.length) { onResult(true, c.my, c.j); return; }
    const caps2 = moves.filter(m=>m.cap); const mv = caps2.length ? caps2[Math.floor(Math.random()*caps2.length)] : moves[Math.floor(Math.random()*moves.length)];
    const nb = b.map(row=>[...row]);
    let jCaps = c.j;
    if (mv.cap) { if (mv.cap.piece==='king'){onResult(false,c.my,jCaps+1);return;} jCaps++; Audio.capture(); } else Audio.move();
    nb[mv.tr][mv.tc]=nb[mv.fr][mv.fc]; nb[mv.fr][mv.fc]=null;
    setCaps(cv=>({...cv,j:jCaps})); setBoard(nb); setTurn('white'); setMsg('Your turn (White)');
    if (c.my>=5) onResult(true,c.my,jCaps); else if(jCaps>=5) onResult(false,c.my,jCaps);
  }

  return (
    <>
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-700">
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">You (White)</div><div className="text-2xl font-bold text-neutral-800 dark:text-white">{caps.my}</div></div>
        <div className="text-orange-400 font-bold">VS</div>
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">James (Black)</div><div className="text-2xl font-bold text-neutral-800 dark:text-white">{caps.j}</div></div>
      </div>
      <p className="text-center text-xs text-neutral-400 py-2">{msg}</p>
      <div className="grid grid-cols-8 mx-3.5 rounded-xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-600">
        {board.flatMap((row,r) => row.map((p,c) => (
          <div key={`${r}-${c}`} onClick={() => click(r,c)}
            className={`csq aspect-square flex items-center justify-center text-[clamp(12px,3.5vw,20px)] cursor-pointer select-none
              ${(r+c)%2===0?'light':'dark'} ${sel&&sel[0]===r&&sel[1]===c?'sel':''}`}>
            {p ? PIECES[p.color][p.piece] : ''}
          </div>
        )))}
      </div>
    </>
  );
}

// ── Checkers ──────────────────────────────────────────────────────────────────
function initCheckers() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  for (let r=0;r<3;r++) for (let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={color:'black',king:false};
  for (let r=5;r<8;r++) for (let c=0;c<8;c++) if((r+c)%2===1) b[r][c]={color:'red',king:false};
  return b;
}

function CheckersGame({ onResult }) {
  const [board, setBoard] = useState(initCheckers);
  const [sel, setSel]     = useState(null);
  const [turn, setTurn]   = useState('red');
  const [pcs, setPcs]     = useState({ my:12, j:12 });

  function click(r, c) {
    if (turn!=='red') return;
    const p = board[r][c];
    if (!sel) { if (p?.color==='red') setSel([r,c]); return; }
    const [sr,sc]=sel;
    if (sr===r&&sc===c){setSel(null);return;}
    if (p?.color==='red'){setSel([r,c]);return;}
    const dr=r-sr,dc=c-sc;
    const nb=board.map(row=>[...row]);
    if (Math.abs(dr)===1&&Math.abs(dc)===1&&!p&&dr===-1) {
      nb[r][c]=nb[sr][sc]; nb[sr][sc]=null; if(r===0) nb[r][c].king=true;
      Audio.move(); setSel(null); setBoard(nb); setTurn('black'); setTimeout(()=>ai(nb,pcs),600);
    } else if (Math.abs(dr)===2&&Math.abs(dc)===2) {
      const mr=(sr+r)/2,mc=(sc+c)/2,mid=nb[mr][mc];
      if (mid?.color==='black') {
        nb[r][c]=nb[sr][sc]; nb[sr][sc]=null; nb[mr][mc]=null; if(r===0)nb[r][c].king=true;
        const np={...pcs,j:pcs.j-1}; setPcs(np); Audio.capture();
        if (np.j<=0){onResult(true,np.my,np.j);return;}
        setSel(null); setBoard(nb); setTurn('black'); setTimeout(()=>ai(nb,np),600);
      } else {setSel(null);}
    } else setSel(null);
  }

  function ai(b, p) {
    const moves=[];
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){const pc=b[r][c];if(!pc||pc.color!=='black')continue;[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>{const nr=r+dr,nc=c+dc;if(nr>=0&&nr<8&&nc>=0&&nc<8&&!b[nr][nc])moves.push({fr:r,fc:c,tr:nr,tc:nc});const cr=r+2*dr,cc=c+2*dc;if(cr>=0&&cr<8&&cc>=0&&cc<8&&b[r+dr]?.[c+dc]?.color==='red'&&!b[cr][cc])moves.push({fr:r,fc:c,tr:cr,tc:cc,cap:true,mr:r+dr,mc:c+dc});});}
    if(!moves.length){onResult(true,p.my,p.j);return;}
    const caps=moves.filter(m=>m.cap); const mv=caps.length?caps[0]:moves[Math.floor(Math.random()*moves.length)];
    const nb=b.map(r=>[...r]); let mp={...p};
    if(mv.cap){nb[mv.mr][mv.mc]=null;mp={...mp,my:mp.my-1};Audio.capture();if(mp.my<=0){onResult(false,mp.my,mp.j);return;}}else Audio.move();
    nb[mv.tr][mv.tc]=nb[mv.fr][mv.fc];nb[mv.fr][mv.fc]=null;if(mv.tr===7)nb[mv.tr][mv.tc].king=true;
    setPcs(mp); setBoard(nb); setTurn('red');
  }

  return (
    <>
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-700">
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">You (Red)</div><div className="text-2xl font-bold text-neutral-800 dark:text-white">{pcs.my}</div></div>
        <div className="text-orange-400 font-bold">VS</div>
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">James</div><div className="text-2xl font-bold text-neutral-800 dark:text-white">{pcs.j}</div></div>
      </div>
      <div className="grid grid-cols-8 mx-3.5 mt-2 rounded-xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-600">
        {board.flatMap((row,r) => row.map((p,c) => (
          <div key={`${r}-${c}`} onClick={()=>click(r,c)}
            className={`cksq aspect-square flex items-center justify-center cursor-pointer ${(r+c)%2===0?'light':'dark'} ${sel&&sel[0]===r&&sel[1]===c?'sel':''}`}>
            {p && <div className="w-[75%] h-[75%] rounded-full border-2 border-black/30 flex items-center justify-center text-sm"
              style={{background:p.color==='red'?'#dc2626':'#222'}}>{p.king?'👑':''}</div>}
          </div>
        )))}
      </div>
    </>
  );
}

// ── Scrabble ──────────────────────────────────────────────────────────────────
const WORDS=[{word:'LOVE',clue:'Strong affection'},{word:'DATE',clue:'A romantic meeting'},{word:'KISS',clue:'Lips meeting'},{word:'HEART',clue:'Loves and beats'},{word:'MATCH',clue:'A perfect pair'},{word:'SPARK',clue:'Initial chemistry'},{word:'CHARM',clue:'Magical appeal'}];
const VALS={A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};

function ScrabbleGame({ onResult }) {
  const [round, setRound]   = useState(0);
  const [scores, setScores] = useState({my:0,j:0});
  const [selected, setSelected] = useState([]);
  const [msg, setMsg]       = useState('');

  const current = WORDS[round];
  const tiles = useState(() => [...current.word,...'ERSTN'.slice(0,2)].sort(()=>Math.random()-.5))[0];

  function pick(letter, idx) {
    if (selected.some(s=>s.idx===idx)) return;
    setSelected(s => [...s, {letter, idx}]);
    Audio.move();
  }
  const word = selected.map(s=>s.letter).join('');

  function clear() { setSelected([]); }

  function submit() {
    const correct = word === current.word;
    const pts = [...word].reduce((s,l)=>s+(VALS[l]||1),0);
    const jCorrect = Math.random()>.5;
    const newScores = { my: scores.my+(correct?pts:0), j: scores.j+(jCorrect?pts:0) };
    setScores(newScores);
    if (correct) { Audio.win(); setMsg(`✅ Correct! +${pts} pts`); }
    else { Audio.wrong(); setMsg(`❌ Wrong! Answer: ${current.word}`); }
    setTimeout(() => {
      if (round+1>=WORDS.length) onResult(newScores.my>newScores.j, newScores.my, newScores.j);
      else { setRound(r=>r+1); setSelected([]); setMsg(''); }
    }, 1500);
  }

  return (
    <>
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-700">
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">You</div><div className="text-2xl font-bold">{scores.my}</div></div>
        <div className="text-orange-400 font-bold">VS</div>
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">James</div><div className="text-2xl font-bold">{scores.j}</div></div>
      </div>
      <p className="text-center text-xs text-neutral-400 py-2">Round {round+1} of {WORDS.length}</p>
      <div className="mx-3.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="text-3xl font-bold text-center tracking-[8px] min-h-10 text-neutral-800 dark:text-white mb-3">{word}</div>
        <div className="flex gap-2 justify-center flex-wrap mb-3">
          {tiles.map((l,i)=>(
            <button key={i} onClick={()=>pick(l,i)} disabled={selected.some(s=>s.idx===i)}
              className="w-10 h-10 rounded bg-[#f0d9b5] border-2 border-[#c8a26a] font-bold text-lg disabled:opacity-35 active:scale-90 transition">
              {l}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-neutral-500">Clue: {current.clue}</p>
        {msg && <p className="text-center text-sm font-semibold mt-2">{msg}</p>}
      </div>
      <div className="flex gap-2.5 mx-3.5 mt-3">
        <button onClick={clear} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold">Clear</button>
        <button onClick={submit} className="flex-[2] py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold">Submit Word</button>
      </div>
    </>
  );
}

// ── Trivia ────────────────────────────────────────────────────────────────────
const LOCAL_Q = [
  {q:'What is the capital of the United Kingdom?',opts:['Manchester','Edinburgh','London','Cardiff'],a:2,cat:'🗺️ Geography'},
  {q:'Which river flows through London?',opts:['Severn','Avon','Thames','Tyne'],a:2,cat:'🗺️ Geography'},
  {q:'Who wrote the Harry Potter series?',opts:['Roald Dahl','J.K. Rowling','C.S. Lewis','Philip Pullman'],a:1,cat:'📖 Literature'},
  {q:'Which planet is known as the Red Planet?',opts:['Venus','Jupiter','Mars','Saturn'],a:2,cat:'🔭 Science'},
  {q:'What is the largest ocean on Earth?',opts:['Atlantic','Indian','Arctic','Pacific'],a:3,cat:'🗺️ Geography'},
  {q:'Who was the first US President?',opts:['Lincoln','Jefferson','Washington','Adams'],a:2,cat:'📖 History'},
  {q:"Which sport is played at Wimbledon?",opts:['Cricket','Football','Tennis','Golf'],a:2,cat:'🏆 Sports'},
  {q:'What is the chemical symbol for gold?',opts:['Gd','Go','Au','Ag'],a:2,cat:'🔭 Science'},
  {q:'In which year did WWII end?',opts:['1943','1944','1945','1946'],a:2,cat:'📖 History'},
  {q:'How many continents are there?',opts:['5','6','7','8'],a:2,cat:'🗺️ Geography'},
];

function TriviaGame({ onResult }) {
  const [qIdx, setQIdx]     = useState(0);
  const [scores, setScores] = useState({my:0,j:0});
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [timerSecs, setTimerSecs] = useState(15);
  const [timeUp, setTimeUp] = useState(false);

  const q = LOCAL_Q[qIdx];

  function answer(idx) {
    if (answered) return;
    setAnswered(true);
    const correct = idx === q.a;
    const jCorrect = Math.random() > .42;
    const newScores = { my: scores.my+(correct?1:0), j: scores.j+(jCorrect?1:0) };
    setScores(newScores);
    if (correct) Audio.correct(); else Audio.wrong();
    setFeedback({ correct, idx, jCorrect });
    setTimeout(() => {
      if (qIdx+1 >= LOCAL_Q.length) onResult(newScores.my>newScores.j, newScores.my, newScores.j);
      else { setQIdx(i=>i+1); setAnswered(false); setFeedback(null); setTimerSecs(15); setTimeUp(false); }
    }, 2000);
  }

  return (
    <>
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-700">
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">You</div><div className="text-2xl font-bold">{scores.my}</div></div>
        <div className="text-orange-400 font-bold">VS</div>
        <div className="text-center flex-1"><div className="text-xs text-neutral-400">James</div><div className="text-2xl font-bold">{scores.j}</div></div>
      </div>
      <div className="flex justify-between items-center px-4 pt-2.5">
        <span className="text-xs text-neutral-400">Question {qIdx+1} of {LOCAL_Q.length}</span>
        <span className="text-xl font-bold text-red-500 font-mono">{timerSecs}</span>
      </div>
      <div className="h-1.5 mx-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-red-500 rounded-full transition-all"
          style={{ width: `${(timerSecs/15)*100}%` }} />
      </div>
      <span className={`mx-4 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${q.cat.includes('Science')?'bg-blue-100 text-blue-700':q.cat.includes('History')?'bg-amber-100 text-amber-700':'bg-violet-100 text-violet-700'}`}>{q.cat}</span>
      <div className="mx-3.5 my-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <p className="text-base font-semibold text-neutral-800 dark:text-white leading-relaxed">{q.q}</p>
      </div>
      <div className="flex flex-col gap-2.5 mx-3.5">
        {q.opts.map((o,i)=>(
          <button key={i} onClick={()=>answer(i)} disabled={answered}
            className={`w-full py-3.5 px-4 rounded-xl border text-sm text-left flex items-center gap-2.5 transition disabled:pointer-events-none
              ${feedback ? (i===q.a?'bg-green-50 border-green-400 text-green-700':(i===feedback.idx&&!feedback.correct?'bg-red-50 border-red-400 text-red-700':'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'))
              : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 active:scale-[.98]'}`}>
            <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{['A','B','C','D'][i]}</span>
            {o}
          </button>
        ))}
      </div>
      {feedback && (
        <p className="text-center text-xs text-neutral-400 mt-2 pb-2">
          {feedback.jCorrect ? 'James also got it right 😤' : 'James got it wrong 😅'}
        </p>
      )}
    </>
  );
}

// ── Game result ───────────────────────────────────────────────────────────────
function GameResult({ won, detail, gameId, onRetry, onBack }) {
  const navigate = useNavigate();
  return (
    <div className="mx-3.5 my-4 bg-black/85 rounded-xl p-7 text-center">
      <div className="text-3xl font-bold text-white mb-1.5">{won ? 'You win! 🎉' : 'You lost 😞'}</div>
      <div className="text-violet-300 text-sm mb-1.5">{detail}</div>
      <div className="text-neutral-400 text-xs mb-5 leading-relaxed">
        {won ? "James heads to the 7-day waiting room.\nYou have 5 days to book a date." : "You're in the 7-day waiting room.\nGo Premium to skip the queue."}
      </div>
      {won && (
        <button onClick={() => navigate('/book-date')}
          className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 mb-2.5 active:scale-[.98]">
          <i className="ti ti-heart" /> Book the date 💕
        </button>
      )}
      <button onClick={onRetry} className="w-full py-3.5 rounded-xl bg-neutral-700 text-neutral-200 font-semibold text-sm active:scale-[.98]">Play Again</button>
    </div>
  );
}

// ── Main GamesTab ─────────────────────────────────────────────────────────────
export function GamesTab() {
  const [active, setActive]   = useState(null);
  const [result, setResult]   = useState(null);
  const [gameKey, setGameKey] = useState(0);

  function launch(id) { setActive(id); setResult(null); setGameKey(k=>k+1); }
  function back()     { setActive(null); setResult(null); }

  function handleResult(won, myScore, jScore) {
    Audio.win();
    const detail = active === 'chess'    ? `Captures — You: ${myScore} / James: ${jScore}`
                 : active === 'checkers' ? `Pieces left — You: ${myScore} / James: ${jScore}`
                 : active === 'scrabble' ? `You: ${myScore} pts — James: ${jScore} pts`
                 : `You: ${myScore} — James: ${jScore} correct`;
    setResult({ won, detail });
  }

  if (!active) return (
    <div>
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest px-4 pt-4 pb-2">Choose your battle</p>
      <div className="grid grid-cols-2 gap-2.5 px-3.5">
        {GAMES.map(g => (
          <button key={g.id} onClick={() => launch(g.id)}
            className="card p-4 text-center active:scale-95 transition cursor-pointer">
            <div className="text-4xl mb-2">{g.icon}</div>
            <div className="text-sm font-bold text-neutral-800 dark:text-white">{g.name}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{g.tag}</div>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1.5 ${g.badge}`}>{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const titleMap = { trivia: '🧠 Trivia', chess: '♟ Chess', checkers: '🔴 Checkers', scrabble: '🔤 Scrabble' };

  return (
    <div>
      <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="text-white font-semibold text-sm">{titleMap[active]} — vs James</div>
        <button onClick={back} className="border border-white/30 text-white text-xs px-3 py-1.5 rounded-full active:opacity-70">← Back</button>
      </div>

      {result ? (
        <GameResult won={result.won} detail={result.detail} gameId={active}
          onRetry={() => launch(active)} onBack={back} />
      ) : (
        <div key={gameKey}>
          {active === 'chess'    && <ChessGame    onResult={handleResult} />}
          {active === 'checkers' && <CheckersGame onResult={handleResult} />}
          {active === 'scrabble' && <ScrabbleGame onResult={handleResult} />}
          {active === 'trivia'   && <TriviaGame   onResult={handleResult} />}
        </div>
      )}
    </div>
  );
}
