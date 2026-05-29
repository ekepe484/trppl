// frontend/js/app.js
function el(id) { return document.getElementById(id); }

// ── CLOCK ──────────────────────────────────────────────────────────────────────
function updateClock() {
  const n = new Date();
  el('clk').textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2,'0');
}
updateClock();
setInterval(updateClock, 30000);

// ── AUTH GUARD & BOOT ─────────────────────────────────────────────────────────
(async function boot() {
  if (!Auth.getToken()) { window.location.href = '/pages/login.html'; return; }

  const user = await Auth.refreshUser();
  if (!user) return;

  // Route based on verification state
  if (!user.emailVerified && !user.phoneVerified) {
    const method = user.contactMethod || 'email';
    sessionStorage.setItem('otp_contact', method === 'email' ? user.email : user.phone);
    sessionStorage.setItem('otp_method',  method);
    sessionStorage.setItem('otp_purpose', 'register');
    sessionStorage.setItem('otp_masked',  method === 'email' ? user.email : user.phone);
    window.location.href = '/pages/verify-otp.html';
    return;
  }

  // Profile not verified and not in progress — show soft nudge
  if (!user.profileVerified && user.verificationStatus === 'none') {
    showVerifyNudge();
  }

  // Populate nav avatar
  el('navAvatar').textContent = (user.name || user.username || 'A')[0].toUpperCase();

  // Build opposite-sex filtered profile list for discover tab
  buildFilteredProfiles();
  showProfile(0);

  // Load active trppl and notifications
  loadActiveTrppl();
  loadNotifications();

  // Show verified badge if approved
  if (user.profileVerified) showVerifiedBadge();

  // Handle deep link from ?tab= shortcut (PWA shortcuts)
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab) {
    const tabEl = Array.from(document.querySelectorAll('.tab')).find(t => {
      const id = t.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      return id === tab;
    });
    if (tabEl) showTab(tab, tabEl);
  }
})();

function showVerifyNudge() {
  const nudge = document.createElement('div');
  nudge.style.cssText = 'background:#fff7ed;border-bottom:1px solid #fed7aa;padding:10px 16px;display:flex;align-items:center;gap:10px;font-size:13px;color:#92400e;';
  nudge.innerHTML = '<i class="ti ti-shield-check" style="flex-shrink:0;font-size:18px;color:#f97316"></i><span style="flex:1">Verify your identity to get a <strong>verified badge</strong>.</span><a href="/pages/verify-profile.html" style="color:#7c3aed;font-weight:600;text-decoration:none;white-space:nowrap">Verify →</a>';
  document.querySelector('.nav').insertAdjacentElement('afterend', nudge);
}

function showVerifiedBadge() {
  const pinfo = document.querySelector('.pinfo');
  if (pinfo && !el('myVerifiedBadge')) {
    const badge = document.createElement('div');
    badge.id = 'myVerifiedBadge';
    badge.className = 'profile-verified-badge';
    badge.innerHTML = '<i class="ti ti-badge-check"></i> Verified';
    pinfo.insertBefore(badge, pinfo.firstChild);
  }
}

// ── TABS ──────────────────────────────────────────────────────────────────────
function showTab(id, tabEl) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el(id).classList.add('active');
  tabEl.classList.add('active');
}

// ── DISCOVER ──────────────────────────────────────────────────────────────────

const ALL_LOVE_LANGUAGES = [
  'Words of Affirmation',
  'Acts of Service',
  'Receiving Gifts',
  'Quality Time',
  'Physical Touch',
];

// Profile pool — male and female only, strictly opposite-sex shown
const ALL_PROFILES = [
  // Female profiles — shown to male users only
  { n:'Sophie',  a:27, sex:'female', d:'3 miles · Manchester',  c:94, ll:['Words of Affirmation','Quality Time'],    col:'#7c3aed' },
  { n:'Emma',    a:25, sex:'female', d:'1 mile · Leeds',         c:88, ll:['Acts of Service','Physical Touch'],       col:'#ec4899' },
  { n:'Layla',   a:29, sex:'female', d:'5 miles · Sheffield',    c:81, ll:['Quality Time','Receiving Gifts'],         col:'#0ea5e9' },
  { n:'Zara',    a:26, sex:'female', d:'2 miles · Barnsley',     c:76, ll:['Physical Touch'],                         col:'#16a34a' },
  { n:'Priya',   a:24, sex:'female', d:'4 miles · Bradford',     c:85, ll:['Receiving Gifts','Words of Affirmation'], col:'#f59e0b' },
  { n:'Hannah',  a:28, sex:'female', d:'6 miles · Huddersfield', c:79, ll:['Acts of Service'],                       col:'#8b5cf6' },
  // Male profiles — shown to female users only
  { n:'James',   a:28, sex:'male',   d:'2 miles · Manchester',   c:91, ll:['Quality Time','Acts of Service'],        col:'#0ea5e9' },
  { n:'Marcus',  a:26, sex:'male',   d:'3 miles · Leeds',        c:83, ll:['Physical Touch','Words of Affirmation'], col:'#7c3aed' },
  { n:'Daniel',  a:30, sex:'male',   d:'5 miles · Sheffield',    c:77, ll:['Receiving Gifts','Quality Time'],        col:'#ec4899' },
  { n:'Liam',    a:25, sex:'male',   d:'1 mile · Barnsley',      c:89, ll:['Words of Affirmation'],                  col:'#16a34a' },
  { n:'Tom',     a:27, sex:'male',   d:'4 miles · Bradford',     c:82, ll:['Acts of Service','Physical Touch'],      col:'#f59e0b' },
  { n:'Oliver',  a:29, sex:'male',   d:'7 miles · Halifax',      c:74, ll:['Quality Time'],                          col:'#8b5cf6' },
];

let selectedLL       = '';
let profileIdx       = 0;
let filteredProfiles = [];

function calcCompatibility(profile) {
  const base = profile.c;
  if (!selectedLL) return base;
  if (profile.ll[0] === selectedLL) return Math.min(99, base + 4);
  if (profile.ll.includes(selectedLL)) return Math.min(99, base + 2);
  return base;
}

function buildFilteredProfiles() {
  const userSex = Auth.getUser()?.sex || '';
  // Strictly opposite sex — male users see female profiles and vice versa
  const opposite = userSex === 'male' ? 'female' : userSex === 'female' ? 'male' : null;
  filteredProfiles = ALL_PROFILES
    .filter(p => !opposite || p.sex === opposite)
    .map(p => ({ ...p, c: calcCompatibility(p) }))
    .sort((a, b) => b.c - a.c);
}

function showProfile(idx) {
  if (!filteredProfiles.length) {
    el('pname').textContent    = 'No matches nearby';
    el('pcomp').textContent    = '';
    el('pdist').textContent    = 'Check back soon';
    el('pll').innerHTML        = '';
    el('pav').textContent      = '?';
    el('pav').style.background = '#999';
    return;
  }
  const p = filteredProfiles[idx % filteredProfiles.length];
  el('pav').textContent       = p.n[0];
  el('pav').style.background  = p.col;
  el('pname').textContent     = p.n + ', ' + p.a;
  el('pcomp').textContent     = '❤ ' + p.c + '% compatible';
  el('pdist').textContent     = p.d;
  el('pll').innerHTML = p.ll.map(l =>
    '<span class="llpill' + (l === selectedLL ? ' llpill-match' : '') + '">' +
    (l === selectedLL ? '✨ ' : '') + l + '</span>'
  ).join('');
}

function pickOpt(optEl) {
  optEl.closest('.quiz-opts').querySelectorAll('.qopt').forEach(o => o.classList.remove('sel'));
  optEl.classList.add('sel');
  selectedLL = optEl.dataset.ll || '';
  buildFilteredProfiles();
  showProfile(profileIdx = 0);
}

function matchP() {
  const p = filteredProfiles[profileIdx % filteredProfiles.length];
  if (!p) return;
  alert('Matched with ' + p.n + '! Check your alerts.');
  showTab('notifs', document.querySelectorAll('.tab')[1]);
}

function passP() {
  profileIdx = (profileIdx + 1) % (filteredProfiles.length || 1);
  showProfile(profileIdx);
}


// ── GAMES ─────────────────────────────────────────────────────────────────────
const ALL_GAMES = [
  { id:'trivia',   name:'Trivia',   icon:'🧠', tag:'10 questions duel', badge:'gbb', label:'Mind'  },
  { id:'chess',    name:'Chess',    icon:'♟',  tag:'Strategic battle',  badge:'gbb', label:'Board' },
  { id:'checkers', name:'Checkers', icon:'🔴', tag:'Classic tactics',   badge:'gbb', label:'Board' },
  { id:'scrabble', name:'Scrabble', icon:'🔤', tag:'Word builder',      badge:'gbw', label:'Word'  },
];
let currentGame = null, selectedGame = null;

function renderGames() {
  el('ggrid').innerHTML = ALL_GAMES.map(g =>
    '<div class="gcard' + (selectedGame===g.id?' sel':'') + '" onclick="launchGame(\'' + g.id + '\')">' +
    '<div class="gicon">' + g.icon + '</div><div class="gname">' + g.name + '</div>' +
    '<div class="gtag">' + g.tag + '</div>' +
    '<div style="text-align:center"><span class="gbadge ' + g.badge + '">' + g.label + '</span></div></div>'
  ).join('');
}
renderGames();

const GAME_INITS    = { chess:()=>Chess.newGame(), checkers:()=>Checkers.newGame(), scrabble:()=>Scrabble.init(), trivia:()=>Trivia.init() };
const GAME_CLEANUPS = { chess:()=>{}, checkers:()=>{}, scrabble:()=>{}, trivia:()=>Trivia.cleanup() };

function launchGame(id) {
  selectedGame = id; renderGames(); currentGame = id;
  el('gamesList').style.display = 'none';
  document.querySelectorAll('.game-wrap').forEach(w => w.classList.remove('active'));
  el('g-' + id).classList.add('active');
  if (GAME_INITS[id]) GAME_INITS[id]();
}
function exitGame() {
  if (currentGame && GAME_CLEANUPS[currentGame]) GAME_CLEANUPS[currentGame]();
  currentGame = null; selectedGame = null;
  document.querySelectorAll('.game-wrap').forEach(w => w.classList.remove('active'));
  el('gamesList').style.display = 'block'; renderGames();
}
function showGameResult(elId, won, detail, gameId) {
  // Submit result to backend if we have an active trppl
  if (activeTrpplId) {
    var headers = { 'Content-Type': 'application/json' };
    var token = Auth.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    fetch('/api/matches/trppl/' + activeTrpplId + '/game-result', {
      method:  'POST',
      headers: headers,
      body:    JSON.stringify({ gameType: gameId, won: won }),
    }).then(function(r) { return r.json(); })
      .then(function(data) { console.log('[Game] Result saved:', data.message); })
      .catch(function(err) { console.warn('[Game] Could not save result:', err.message); });
  }

  el(elId).innerHTML =
    '<div class="gresult">' +
    '<div class="grtitle">' + (won ? 'You win! 🎉' : 'You lost 😞') + '</div>' +
    '<div class="grsub">' + detail + '</div>' +
    '<div class="grdetail">' + (won
      ? 'James heads to the 7-day waiting room.<br>You have 5 days to book a date.'
      : "You're in the 7-day waiting room.<br>Go Premium to skip the queue.") + '</div>' +
    (won ? '<a href="/pages/book-date.html" class="gbtn gbtn-green" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;margin-bottom:10px;border-radius:var(--rad)"><i class="ti ti-heart"></i> Book the date 💕</a>' : '') +
    '<button class="gbtn gbtn-secondary" onclick="launchGame(\'' + gameId + '\')">Play Again</button></div>';
}

// Active trppl ID (set when user has a real trppl)
var activeTrpplId = null;

// Load active trppl on boot
async function loadActiveTrppl() {
  var token = Auth.getToken();
  if (!token) return;
  try {
    var res  = await fetch('/api/matches/trppl', { headers: { Authorization: 'Bearer ' + token } });
    var data = await res.json();
    var user = Auth.getUser();
    var active = (data.trppls || []).find(function(t) {
      return (t.comp1_user_id === user.id || t.comp2_user_id === user.id) && t.status !== 'completed';
    });
    if (active) activeTrpplId = active.id;
  } catch (e) { /* non-critical */ }
}

// Wiring
function scClear()   { Scrabble.clear(); }
function scSubmit()  { Scrabble.submit(); }
function chNewGame() { Chess.newGame(); }
function ckNewGame() { Checkers.newGame(); }

// ── WAITING COUNTDOWN ─────────────────────────────────────────────────────────
let waitSecs = 6*86400 + 23*3600 + 41*60;
setInterval(() => {
  if (waitSecs <= 0) return; waitSecs--;
  const d=Math.floor(waitSecs/86400), h=Math.floor((waitSecs%86400)/3600), m=Math.floor((waitSecs%3600)/60);
  el('wClock').textContent = d + 'd ' + h + 'h ' + m + 'm';
}, 1000);

// ── SERVICE WORKER ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner();
          });
        });
      })
      .catch(err => console.warn('[SW]', err));
  });
}

function showUpdateBanner() {
  const b = document.createElement('div');
  b.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;background:#7c3aed;color:#fff;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.3);font-size:14px;font-family:-apple-system,sans-serif;';
  b.innerHTML = '<span style="flex:1">🔺 New version of Trppl available.</span><button onclick="window.location.reload()" style="background:#fff;color:#7c3aed;border:none;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:13px">Update</button>';
  document.body.appendChild(b);
}

// ── PWA INSTALL ───────────────────────────────────────────────────────────────
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  if (!localStorage.getItem('pwa_dismissed')) showInstallBanner();
});
function showInstallBanner() {
  const b = document.createElement('div');
  b.id = 'installBanner';
  b.style.cssText = 'background:#1a1a2e;color:#fff;padding:10px 16px;display:flex;align-items:center;gap:10px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.1);';
  b.innerHTML = '<span style="font-size:18px">🔺</span><span style="flex:1">Add Trppl to your home screen</span><button id="installBtn" style="background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-weight:600;cursor:pointer;font-size:12px">Install</button><button onclick="dismissInstall()" style="background:transparent;color:#aaa;border:none;font-size:20px;cursor:pointer;padding:0 4px">×</button>';
  document.querySelector('.phone').insertBefore(b, document.querySelector('.phone').firstChild);
  document.getElementById('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') b.remove();
    deferredPrompt = null;
  });
}
function dismissInstall() { localStorage.setItem('pwa_dismissed','1'); const b=el('installBanner'); if(b) b.remove(); }

// ── Wire all buttons via addEventListener (CSP-safe, no onclick attrs) ─────────
document.addEventListener('DOMContentLoaded', function () {
  // Nav avatar → profile page
  var avatarBtn = document.getElementById('navAvatar');
  if (avatarBtn) avatarBtn.addEventListener('click', function () {
    window.location.href = '/pages/profile.html';
  });
    { id: 'tab-discover',  tab: 'discover'  },
    { id: 'tab-notifs',    tab: 'notifs'    },
    { id: 'tab-trppl',     tab: 'trppl'     },
    { id: 'tab-games',     tab: 'games'     },
    { id: 'tab-waiting',   tab: 'waiting'   },
  ];
  tabs.forEach(function (t) {
    var btn = document.getElementById(t.id);
    if (btn) btn.addEventListener('click', function () { showTab(t.tab, btn); });
  });

  // Discover
  document.querySelectorAll('[class-pick-opt]').forEach(function (btn) {
    btn.addEventListener('click', function () { pickOpt(btn); });
  });
  var passBtn  = document.getElementById('btn-pass');
  var matchBtn = document.getElementById('btn-match');
  if (passBtn)  passBtn.addEventListener('click',  passP);
  if (matchBtn) matchBtn.addEventListener('click', matchP);

  // Start battle button in Trppl tab
  var battleBtn = document.getElementById('btn-start-battle');
  if (battleBtn) battleBtn.addEventListener('click', function () {
    var gamesTab = document.getElementById('tab-games');
    if (gamesTab) showTab('games', gamesTab);
  });

  // Game back buttons
  ['gback-chess','gback-checkers','gback-scrabble','gback-trivia'].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', exitGame);
  });

  // Game action buttons
  var b;
  b = document.getElementById('btn-ch-new');   if (b) b.addEventListener('click', chNewGame);
  b = document.getElementById('btn-ck-new');   if (b) b.addEventListener('click', ckNewGame);
  b = document.getElementById('btn-sc-clear'); if (b) b.addEventListener('click', scClear);
  b = document.getElementById('btn-sc-submit');if (b) b.addEventListener('click', scSubmit);
});

// ── Notifications ─────────────────────────────────────────────────────────────
async function loadNotifications() {
  var token = Auth.getToken();
  if (!token) return;
  try {
    var res  = await fetch('/api/notifications', { headers: { Authorization: 'Bearer ' + token } });
    var data = await res.json();
    var unread = data.unreadCount || 0;

    // Update tab badge
    var notifTab = document.getElementById('tab-notifs');
    if (notifTab) {
      var badge = notifTab.querySelector('.notif-badge');
      if (!badge && unread > 0) {
        badge = document.createElement('span');
        badge.className = 'notif-badge';
        badge.style.cssText = 'position:absolute;top:4px;right:50%;transform:translateX(200%);background:#dc2626;color:#fff;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:1';
        notifTab.style.position = 'relative';
        notifTab.appendChild(badge);
      }
      if (badge) {
        badge.textContent = unread > 9 ? '9+' : unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
      }
    }

    // Render real notifications in the alerts tab
    if (data.notifications && data.notifications.length) {
      renderNotifications(data.notifications);
    }
  } catch (e) { /* non-critical */ }
}

function renderNotifications(notifications) {
  var card = document.querySelector('#notifs .card');
  if (!card) return;

  var icons = {
    match:          { cls: 'nim', icon: 'ti-sparkles' },
    trppl:          { cls: 'nio', icon: 'ti-sword'    },
    win:            { cls: 'nig', icon: 'ti-trophy'   },
    loss:           { cls: 'niw', icon: 'ti-clock'    },
    date_request:   { cls: 'nim', icon: 'ti-heart'    },
    date_accepted:  { cls: 'nig', icon: 'ti-check'    },
    date_declined:  { cls: 'niw', icon: 'ti-x'        },
    date_cancelled: { cls: 'niw', icon: 'ti-ban'      },
    date_completed: { cls: 'nig', icon: 'ti-star'     },
    date_incoming:  { cls: 'nim', icon: 'ti-calendar' },
  };

  card.innerHTML = notifications.slice(0, 20).map(function(n) {
    var ico = icons[n.type] || { cls: 'nim', icon: 'ti-bell' };
    var time = timeAgo(new Date(n.created_at));
    var unreadStyle = n.read ? '' : 'background:var(--pl);';
    return '<div class="notif" style="' + unreadStyle + '">' +
      '<div class="nic ' + ico.cls + '"><i class="ti ' + ico.icon + '"></i></div>' +
      '<div>' +
      '<div class="ntitle">' + n.title + '</div>' +
      '<div class="nbody">' + n.body + '</div>' +
      '<div class="ntime">' + time + '</div>' +
      '</div></div>';
  }).join('');
}

function timeAgo(date) {
  var secs = Math.floor((new Date() - date) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return Math.floor(secs / 60) + ' min ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
}

// Mark all read when opening notifications tab
var origShowTab = showTab;
window.showTab = function(id, tabEl) {
  origShowTab(id, tabEl);
  if (id === 'notifs') {
    var token = Auth.getToken();
    if (token) fetch('/api/notifications/read', { method: 'PUT', headers: { Authorization: 'Bearer ' + token } });
    var badge = document.querySelector('.notif-badge');
    if (badge) badge.style.display = 'none';
  }
};

// Poll for new notifications every 60 seconds
setInterval(loadNotifications, 60000);
