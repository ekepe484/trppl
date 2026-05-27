// frontend/js/games/chess.js
const Chess = (() => {
  const PIECES = {
    white:{king:'♔',queen:'♕',rook:'♖',bishop:'♗',knight:'♘',pawn:'♙'},
    black:{king:'♚',queen:'♛',rook:'♜',bishop:'♝',knight:'♞',pawn:'♟'},
  };
  let board=[], selected=null, turn='white', myCapt=0, jCapt=0;

  function newGame() {
    turn='white'; myCapt=0; jCapt=0; selected=null;
    document.getElementById('chMyCapt').textContent=0;
    document.getElementById('chJCapt').textContent=0;
    document.getElementById('chResult').innerHTML='';
    document.getElementById('chTurn').textContent='Your turn (White) — tap a piece to move';
    board=Array(8).fill(null).map(()=>Array(8).fill(null));
    const back=['rook','knight','bishop','queen','king','bishop','knight','rook'];
    back.forEach((p,c)=>{
      board[0][c]={piece:p,color:'black'};
      board[1][c]={piece:'pawn',color:'black'};
      board[6][c]={piece:'pawn',color:'white'};
      board[7][c]={piece:p,color:'white'};
    });
    render();
  }

  function render() {
    const b=document.getElementById('chBoard'); b.innerHTML='';
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const sq=document.createElement('div');
      sq.className='csq '+((r+c)%2===0?'light':'dark');
      if(selected&&selected[0]===r&&selected[1]===c) sq.classList.add('sel');
      const p=board[r][c]; if(p) sq.textContent=PIECES[p.color][p.piece];
      sq.addEventListener('click',()=>handleClick(r,c));
      b.appendChild(sq);
    }
  }

  function handleClick(r,c) {
    if(turn!=='white') return;
    const p=board[r][c];
    if(!selected){ if(p&&p.color==='white'){selected=[r,c];render();} return; }
    const[sr,sc]=selected;
    if(sr===r&&sc===c){selected=null;render();return;}
    if(p&&p.color==='white'){selected=[r,c];render();return;}
    const target=board[r][c];
    if(target&&target.color==='black'){
      if(target.piece==='king'){endGame(true);return;}
      jCapt++; document.getElementById('chJCapt').textContent=jCapt; Audio.capture();
    } else { Audio.move(); }
    board[r][c]=board[sr][sc]; board[sr][sc]=null;
    selected=null; turn='black';
    document.getElementById('chTurn').textContent='James is thinking…';
    render(); setTimeout(aiMove,700);
  }

  function aiMove() {
    const moves=[];
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const p=board[r][c]; if(!p||p.color!=='black') continue;
      [[r+1,c],[r+1,c+1],[r+1,c-1],[r-1,c],[r,c+1],[r,c-1],[r+2,c],[r-2,c],[r,c+2],[r,c-2]].forEach(([nr,nc])=>{
        if(nr>=0&&nr<8&&nc>=0&&nc<8){const t=board[nr][nc];if(!t||t.color==='white')moves.push({fr:r,fc:c,tr:nr,tc:nc,cap:t});}
      });
    }
    if(!moves.length){endGame(true);return;}
    const caps=moves.filter(m=>m.cap);
    const mv=caps.length?caps[Math.floor(Math.random()*caps.length)]:moves[Math.floor(Math.random()*moves.length)];
    if(mv.cap){
      if(mv.cap.piece==='king'){endGame(false);return;}
      myCapt++; document.getElementById('chMyCapt').textContent=myCapt; Audio.capture();
    } else { Audio.move(); }
    board[mv.tr][mv.tc]=board[mv.fr][mv.fc]; board[mv.fr][mv.fc]=null;
    turn='white'; document.getElementById('chTurn').textContent='Your turn (White)'; render();
    if(myCapt>=5) endGame(false); else if(jCapt>=5) endGame(true);
  }

  function endGame(won) {
    Audio.win();
    showGameResult('chResult',won,'Captures — You: '+jCapt+' / James: '+myCapt,'chess');
  }

  return { newGame };
})();
