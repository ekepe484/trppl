// frontend/js/games/checkers.js
const Checkers = (() => {
  let board=[], selected=null, turnColor='red', myPcs=12, jPcs=12;

  function newGame() {
    turnColor='red'; myPcs=12; jPcs=12; selected=null;
    document.getElementById('ckMyPcs').textContent=12;
    document.getElementById('ckJPcs').textContent=12;
    document.getElementById('ckResult').innerHTML='';
    document.getElementById('ckTurn').textContent='Your turn (Red)';
    board=Array(8).fill(null).map(()=>Array(8).fill(null));
    for(let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2===1) board[r][c]={color:'black',king:false};
    for(let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2===1) board[r][c]={color:'red',king:false};
    render();
  }

  function render() {
    const b=document.getElementById('ckBoard'); b.innerHTML='';
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const sq=document.createElement('div');
      sq.className='cksq '+((r+c)%2===0?'light':'dark');
      if(selected&&selected[0]===r&&selected[1]===c) sq.classList.add('sel');
      const p=board[r][c];
      if(p){const pc=document.createElement('div');pc.className='ckpiece';pc.style.background=p.color==='red'?'#dc2626':'#222';pc.textContent=p.king?'👑':'';sq.appendChild(pc);}
      sq.addEventListener('click',()=>handleClick(r,c));
      b.appendChild(sq);
    }
  }

  function handleClick(r,c) {
    if(turnColor!=='red') return;
    const p=board[r][c];
    if(!selected){ if(p&&p.color==='red'){selected=[r,c];render();} return; }
    const[sr,sc]=selected;
    if(sr===r&&sc===c){selected=null;render();return;}
    if(p&&p.color==='red'){selected=[r,c];render();return;}
    const dr=r-sr,dc=c-sc;
    if(Math.abs(dr)===1&&Math.abs(dc)===1&&!p&&dr===-1){
      board[r][c]=board[sr][sc]; board[sr][sc]=null;
      if(r===0) board[r][c].king=true;
      Audio.move(); selected=null; turnColor='black';
      document.getElementById('ckTurn').textContent='James is thinking…';
      render(); setTimeout(aiMove,600);
    } else if(Math.abs(dr)===2&&Math.abs(dc)===2){
      const mr=(sr+r)/2,mc=(sc+c)/2,mid=board[mr][mc];
      if(mid&&mid.color==='black'){
        board[r][c]=board[sr][sc]; board[sr][sc]=null; board[mr][mc]=null;
        if(r===0) board[r][c].king=true;
        jPcs--; document.getElementById('ckJPcs').textContent=jPcs; Audio.capture();
        if(jPcs<=0){showGameResult('ckResult',true,'You captured all pieces!','checkers');return;}
        selected=null; turnColor='black';
        document.getElementById('ckTurn').textContent='James is thinking…';
        render(); setTimeout(aiMove,600);
      } else {selected=null;render();}
    } else {selected=null;render();}
  }

  function aiMove() {
    const moves=[];
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const p=board[r][c]; if(!p||p.color!=='black') continue;
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>{
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<8&&nc>=0&&nc<8&&!board[nr][nc]) moves.push({fr:r,fc:c,tr:nr,tc:nc,cap:false});
        const cr=r+2*dr,cc=c+2*dc;
        if(cr>=0&&cr<8&&cc>=0&&cc<8&&board[r+dr]?.[c+dc]?.color==='red'&&!board[cr][cc])
          moves.push({fr:r,fc:c,tr:cr,tc:cc,cap:true,mr:r+dr,mc:c+dc});
      });
    }
    if(!moves.length){showGameResult('ckResult',true,'James has no moves left!','checkers');return;}
    const caps=moves.filter(m=>m.cap);
    const mv=caps.length?caps[0]:moves[Math.floor(Math.random()*moves.length)];
    if(mv.cap){
      board[mv.mr][mv.mc]=null; myPcs--;
      document.getElementById('ckMyPcs').textContent=myPcs; Audio.capture();
      if(myPcs<=0){showGameResult('ckResult',false,'James captured all your pieces!','checkers');return;}
    } else { Audio.move(); }
    board[mv.tr][mv.tc]=board[mv.fr][mv.fc]; board[mv.fr][mv.fc]=null;
    if(mv.tr===7) board[mv.tr][mv.tc].king=true;
    turnColor='red'; document.getElementById('ckTurn').textContent='Your turn (Red)'; render();
  }

  return { newGame };
})();
