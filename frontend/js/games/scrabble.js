// frontend/js/games/scrabble.js
const Scrabble = (() => {
  const WORDS=[
    {word:'LOVE',clue:'Strong affection'},{word:'DATE',clue:'A romantic meeting'},
    {word:'KISS',clue:'Lips meeting'},{word:'HEART',clue:'Loves and beats'},
    {word:'MATCH',clue:'A perfect pair'},{word:'SPARK',clue:'Initial chemistry'},
    {word:'CHARM',clue:'Magical appeal'},
  ];
  const VALS={A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};
  const EXTRA=['E','R','S','T','A','N'];
  let round=0,myScore=0,jScore=0,current=null,selected=[];

  function init() {
    round=0; myScore=0; jScore=0;
    document.getElementById('scMyScore').textContent=0;
    document.getElementById('scJScore').textContent=0;
    document.getElementById('scResult').innerHTML='';
    nextWord();
  }

  function nextWord() {
    if(round>=WORDS.length){
      Audio.win();
      showGameResult('scResult',myScore>jScore,'You: '+myScore+' pts — James: '+jScore+' pts','scrabble');
      return;
    }
    current=WORDS[round]; selected=[];
    document.getElementById('scRound').textContent=round+1;
    document.getElementById('scWord').textContent='';
    document.getElementById('scClue').textContent='Clue: '+current.clue;
    document.getElementById('scMsg').textContent='Round '+(round+1)+' of '+WORDS.length+' — spell the word!';
    const letters=[...current.word].concat(EXTRA.slice(0,2)).sort(()=>Math.random()-.5);
    document.getElementById('scTiles').innerHTML=letters.map((l,i)=>
      '<button class="stile" id="st'+i+'" onclick="Scrabble.pickTile(\''+l+'\','+i+')">'+l+'</button>'
    ).join('');
  }

  function pickTile(letter,idx) {
    const tile=document.getElementById('st'+idx);
    if(!tile||tile.classList.contains('used')) return;
    tile.classList.add('used'); selected.push(letter);
    document.getElementById('scWord').textContent=selected.join(''); Audio.move();
  }

  function clear() {
    selected=[];
    document.getElementById('scWord').textContent='';
    document.querySelectorAll('.stile').forEach(t=>t.classList.remove('used'));
  }

  function submit() {
    const word=selected.join('').toUpperCase();
    const correct=word===current.word;
    const pts=[...word].reduce((s,l)=>s+(VALS[l]||1),0);
    if(correct){
      myScore+=pts; document.getElementById('scMyScore').textContent=myScore;
      Audio.win(); document.getElementById('scMsg').textContent='✅ Correct! +'+pts+' points';
    } else {
      Audio.wrong(); document.getElementById('scMsg').textContent='❌ Wrong! The word was '+current.word;
    }
    const jCorrect=Math.random()>.5;
    if(jCorrect){jScore+=pts;document.getElementById('scJScore').textContent=jScore;}
    round++; setTimeout(nextWord,1500);
  }

  return { init, pickTile, clear, submit };
})();
