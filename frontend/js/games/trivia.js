// frontend/js/games/trivia.js
const Trivia = (() => {
  const FLAGS={GB:'🇬🇧',US:'🇺🇸',CA:'🇨🇦',AU:'🇦🇺',FR:'🇫🇷',DE:'🇩🇪',ES:'🇪🇸',MX:'🇲🇽',BR:'🇧🇷',PT:'🇵🇹',IT:'🇮🇹',NL:'🇳🇱',RU:'🇷🇺',AE:'🇦🇪',IN:'🇮🇳',CN:'🇨🇳',JP:'🇯🇵',KR:'🇰🇷',ID:'🇮🇩',NG:'🇳🇬',ZA:'🇿🇦',KE:'🇰🇪',EG:'🇪🇬',TR:'🇹🇷',PL:'🇵🇱',SE:'🇸🇪',NO:'🇳🇴',DK:'🇩🇰',FI:'🇫🇮',GR:'🇬🇷',AR:'🇦🇷',CO:'🇨🇴',TH:'🇹🇭',SG:'🇸🇬',INTL:'🌍'};

  const LOCAL_BANK={
    GB:[
      {q:'What is the capital city of the United Kingdom?',opts:['Manchester','Edinburgh','London','Cardiff'],a:2,cat:'🗺️ Geography'},
      {q:'Which river flows through London?',opts:['Severn','Avon','Thames','Tyne'],a:2,cat:'🗺️ Geography'},
      {q:'Who wrote the Harry Potter series?',opts:['Roald Dahl','J.K. Rowling','C.S. Lewis','Philip Pullman'],a:1,cat:'📖 Literature'},
      {q:'How many countries make up the United Kingdom?',opts:['2','3','4','5'],a:2,cat:'🗺️ Geography'},
      {q:'Which English city is famous for The Beatles?',opts:['Manchester','Birmingham','Liverpool','Leeds'],a:2,cat:'🎭 Culture'},
      {q:'What year did World War II end?',opts:['1943','1944','1945','1946'],a:2,cat:'📖 History'},
      {q:'Which sport was invented in England?',opts:['Basketball','Football (Soccer)','Baseball','Ice Hockey'],a:1,cat:'🏆 Sports'},
      {q:'What is the UK\'s national dish often considered to be?',opts:['Fish and Chips','Chicken Tikka Masala','Shepherd\'s Pie','Roast Beef'],a:1,cat:'🍽️ Food'},
      {q:'Who is the monarch of the UK as of 2024?',opts:['Queen Elizabeth II','Prince Charles','King William','King Charles III'],a:3,cat:'👑 History'},
      {q:'Which iconic bridge crosses the River Thames in London?',opts:['London Bridge','Waterloo Bridge','Tower Bridge','Westminster Bridge'],a:2,cat:'🏛️ Culture'},
    ],
    US:[
      {q:'What is the capital city of the United States?',opts:['New York','Los Angeles','Chicago','Washington D.C.'],a:3,cat:'🗺️ Geography'},
      {q:'How many stars are on the American flag?',opts:['48','50','52','45'],a:1,cat:'🏛️ History'},
      {q:'Which sport is known as "America\'s pastime"?',opts:['American Football','Basketball','Baseball','Ice Hockey'],a:2,cat:'🏆 Sports'},
      {q:'Who was the first President of the United States?',opts:['Abraham Lincoln','Thomas Jefferson','George Washington','John Adams'],a:2,cat:'📖 History'},
      {q:'Which US state is known as the "Sunshine State"?',opts:['California','Texas','Arizona','Florida'],a:3,cat:'🗺️ Geography'},
      {q:'What year did the United States declare independence?',opts:['1774','1776','1778','1780'],a:1,cat:'📖 History'},
      {q:'Which American city is known as the "City of Angels"?',opts:['New York','Miami','Las Vegas','Los Angeles'],a:3,cat:'🗺️ Geography'},
      {q:'What is the longest river in the United States?',opts:['Colorado River','Missouri River','Mississippi River','Rio Grande'],a:2,cat:'🗺️ Geography'},
      {q:'Which fast food chain originated in the United States?',opts:['KFC','McDonald\'s','Subway','All of the above'],a:3,cat:'🍽️ Food'},
      {q:'How many states does the USA have?',opts:['48','49','50','52'],a:2,cat:'🗺️ Geography'},
    ],
    AU:[
      {q:'What is the capital city of Australia?',opts:['Sydney','Melbourne','Canberra','Brisbane'],a:2,cat:'🗺️ Geography'},
      {q:'What is the largest coral reef system in the world?',opts:['Ningaloo Reef','Great Barrier Reef','Coral Sea Reef','Shark Bay'],a:1,cat:'🌿 Nature'},
      {q:'Which animal is unique to Australia and carries its young in a pouch?',opts:['Wombat','Platypus','Kangaroo','Echidna'],a:2,cat:'🌿 Nature'},
      {q:'What is the famous rock in the Australian Outback called?',opts:['Devils Tower','Ayers Rock (Uluru)','Kata Tjuta','Mount Augustus'],a:1,cat:'🗺️ Geography'},
      {q:'Which Australian city hosted the 2000 Summer Olympics?',opts:['Melbourne','Brisbane','Sydney','Perth'],a:2,cat:'🏆 Sports'},
      {q:'What is the national flower of Australia?',opts:['Eucalyptus','Waratah','Golden Wattle','Banksia'],a:2,cat:'🌿 Nature'},
      {q:'How many states does Australia have?',opts:['5','6','7','8'],a:1,cat:'🗺️ Geography'},
      {q:'What is Vegemite?',opts:['A chocolate spread','A yeast extract spread','A fruit jam','A peanut butter'],a:1,cat:'🍽️ Food'},
      {q:'What sport did Australia invent?',opts:['Cricket','Australian Rules Football','Rugby','Tennis'],a:1,cat:'🏆 Sports'},
      {q:'What is the name of the famous Australian Opera House city?',opts:['Melbourne','Brisbane','Sydney','Perth'],a:2,cat:'🎭 Culture'},
    ],
    INTL:[
      {q:'Which planet is known as the Red Planet?',opts:['Venus','Jupiter','Mars','Saturn'],a:2,cat:'🔭 Science'},
      {q:'What is the largest ocean on Earth?',opts:['Atlantic Ocean','Indian Ocean','Arctic Ocean','Pacific Ocean'],a:3,cat:'🗺️ Geography'},
      {q:'How many continents are there on Earth?',opts:['5','6','7','8'],a:2,cat:'🗺️ Geography'},
      {q:'What is the tallest mountain in the world?',opts:['K2','Mount Kilimanjaro','Mount Everest','Mont Blanc'],a:2,cat:'🗺️ Geography'},
      {q:'In which year did the first moon landing occur?',opts:['1965','1967','1969','1971'],a:2,cat:'📖 History'},
      {q:'What is the chemical symbol for gold?',opts:['Gd','Go','Au','Ag'],a:2,cat:'🔭 Science'},
      {q:'Which sport is played at Wimbledon?',opts:['Cricket','Football','Tennis','Golf'],a:2,cat:'🏆 Sports'},
      {q:'Which language has the most native speakers in the world?',opts:['English','Spanish','Mandarin Chinese','Hindi'],a:2,cat:'🌍 Culture'},
      {q:'What is the speed of light approximately?',opts:['100,000 km/s','200,000 km/s','300,000 km/s','400,000 km/s'],a:2,cat:'🔭 Science'},
      {q:'What is the most widely practiced religion in the world?',opts:['Islam','Hinduism','Buddhism','Christianity'],a:3,cat:'🌍 Culture'},
    ],
  };

  function detectCountry() {
    try {
      const tz=(Intl.DateTimeFormat().resolvedOptions().timeZone||'').toLowerCase();
      const lang=(navigator.language||'en').toLowerCase();
      const tzMap={london:'GB',belfast:'GB',edinburgh:'GB',new_york:'US',chicago:'US',los_angeles:'US',denver:'US',toronto:'CA',vancouver:'CA',sydney:'AU',melbourne:'AU',brisbane:'AU',paris:'FR',berlin:'DE',frankfurt:'DE',madrid:'ES',mexico_city:'MX',sao_paulo:'BR',lisbon:'PT',rome:'IT',amsterdam:'NL',moscow:'RU',dubai:'AE',kolkata:'IN',mumbai:'IN',shanghai:'CN',tokyo:'JP',seoul:'KR',jakarta:'ID',lagos:'NG',johannesburg:'ZA',nairobi:'KE',cairo:'EG',istanbul:'TR',warsaw:'PL',stockholm:'SE',oslo:'NO',copenhagen:'DK',helsinki:'FI',athens:'GR',buenos_aires:'AR',bogota:'CO',bangkok:'TH',singapore:'SG'};
      for(const[k,v]of Object.entries(tzMap)){if(tz.includes(k))return v;}
      const langMap={'en-gb':'GB','en-us':'US','en-ca':'CA','en-au':'AU','fr':'FR','de':'DE','es':'ES','pt-br':'BR','it':'IT','ja':'JP','ko':'KR','zh':'CN','ar':'AE','tr':'TR','pl':'PL','sv':'SE','nl':'NL','ru':'RU'};
      if(langMap[lang])return langMap[lang];
      if(langMap[lang.split('-')[0]])return langMap[lang.split('-')[0]];
    } catch(e){}
    return 'INTL';
  }

  let questions=[], qIdx=0, myScore=0, jScore=0;
  let timerSec=15, timerTimeout=null, answered=false, over=false;

  async function init() {
    myScore=0; jScore=0; qIdx=0; over=false; questions=[];
    document.getElementById('tvMyScore').textContent=0;
    document.getElementById('tvJScore').textContent=0;
    document.getElementById('tvResult').innerHTML='';
    const country=detectCountry();
    const flag=FLAGS[country]||'🌍';
    document.getElementById('triviaNavTitle').textContent=flag+' Trivia — vs James';

    // Show loading state
    document.getElementById('tvQuestion').innerHTML=
      '<div style="text-align:center;padding:16px 0">'+
      '<div style="font-size:28px;margin-bottom:8px">'+flag+'</div>'+
      '<div style="font-size:14px;font-weight:600;color:var(--tx)">Loading '+country+' trivia…</div>'+
      '<div style="display:flex;justify-content:center;gap:6px;margin-top:14px">'+
      '<div class="tv-dot" style="animation-delay:0s"></div>'+
      '<div class="tv-dot" style="animation-delay:.2s"></div>'+
      '<div class="tv-dot" style="animation-delay:.4s"></div></div></div>';
    document.getElementById('tvOptions').innerHTML='';
    document.getElementById('tvCatBadge').textContent='';
    document.getElementById('tvTimer').textContent='';
    document.getElementById('tvTimerBar').style.setProperty('--tv-progress','0%');

    try {
      // Try backend API first (AI-generated questions)
      const token=Auth.getToken();
      const res=await fetch('/api/trivia/questions',{
        method:'POST',
        headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},
        body:JSON.stringify({country}),
      });
      if(res.ok){const data=await res.json();questions=data.questions;}
      else throw new Error('API failed');
    } catch {
      // Fall back to local question bank
      const bank=LOCAL_BANK[country]||LOCAL_BANK.INTL;
      questions=[...bank].sort(()=>Math.random()-.5).slice(0,10);
    }

    if(!questions||questions.length<3){
      questions=[...LOCAL_BANK.INTL].sort(()=>Math.random()-.5).slice(0,10);
    }
    showQuestion();
  }

  function showQuestion() {
    if(qIdx>=questions.length){endGame();return;}
    answered=false;
    const q=questions[qIdx];
    document.getElementById('tvQNum').textContent=qIdx+1;
    document.getElementById('tvCatBadge').textContent=q.cat||'🧠 Trivia';
    document.getElementById('tvQuestion').textContent=q.q;
    document.getElementById('tvFeedback').hidden=true;
    document.getElementById('tvJamesTxt').textContent='';
    document.getElementById('tvOptions').innerHTML=q.opts.map((o,i)=>
      '<button class="tv-option" id="tvOpt'+i+'" onclick="Trivia.answer('+i+')">'+
      '<span class="tv-option-letter">'+['A','B','C','D'][i]+'</span>'+o+'</button>'
    ).join('');
    clearTimeout(timerTimeout);
    timerSec=15; document.getElementById('tvTimer').textContent=15;
    document.getElementById('tvTimerBar').style.setProperty('--tv-progress','100%');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.getElementById('tvTimerBar').style.transition='none';
      document.getElementById('tvTimerBar').style.setProperty('--tv-progress','100%');
      requestAnimationFrame(()=>{
        document.getElementById('tvTimerBar').style.transition='--tv-progress 15s linear';
        document.getElementById('tvTimerBar').style.setProperty('--tv-progress','0%');
      });
    }));
    runTimer();
  }

  function runTimer() {
    timerTimeout=setTimeout(()=>{
      timerSec--; document.getElementById('tvTimer').textContent=timerSec;
      if(timerSec<=3) Audio.tick();
      if(timerSec<=0){if(!answered)answer(-1);}
      else if(!answered) runTimer();
    },1000);
  }

  function answer(idx) {
    if(answered||over) return;
    answered=true; clearTimeout(timerTimeout);
    const q=questions[qIdx], correct=idx===q.a;
    q.opts.forEach((_,i)=>{
      const btn=document.getElementById('tvOpt'+i); if(!btn) return;
      btn.disabled=true;
      if(i===q.a) btn.classList.add('correct');
      else if(i===idx&&!correct) btn.classList.add('wrong');
    });
    const fb=document.getElementById('tvFeedback'); fb.hidden=false; fb.className='tv-feedback';
    if(idx===-1){fb.classList.add('timeout');fb.textContent='⏱ Time\'s up! Answer: '+q.opts[q.a];}
    else if(correct){fb.classList.add('correct');fb.textContent='✅ Correct! +1 point';myScore++;document.getElementById('tvMyScore').textContent=myScore;Audio.correct();}
    else{fb.classList.add('wrong');fb.textContent='❌ Wrong! Answer: '+q.opts[q.a];Audio.wrong();}
    const jCorrect=Math.random()>.42;
    if(jCorrect){jScore++;document.getElementById('tvJScore').textContent=jScore;}
    document.getElementById('tvJamesTxt').textContent=jCorrect?'James also got it right 😤':'James got it wrong 😅';
    qIdx++; setTimeout(showQuestion,2000);
  }

  function endGame() {
    over=true;
    document.getElementById('tvOptions').innerHTML='';
    document.getElementById('tvFeedback').hidden=true;
    document.getElementById('tvJamesTxt').textContent='';
    document.getElementById('tvTimerBar').style.setProperty('--tv-progress','0%');
    Audio.win();
    showGameResult('tvResult',myScore>jScore,'You: '+myScore+' — James: '+jScore+' correct','trivia');
  }

  function cleanup() { clearTimeout(timerTimeout); }

  return { init, answer, cleanup };
})();
