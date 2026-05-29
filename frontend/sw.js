const CACHE = 'trppl-v3';
const API_CACHE = 'trppl-api-v3';
const PRECACHE = ['/','/pages/login.html','/pages/register.html','/pages/verify-otp.html','/pages/verify-profile.html','/css/base.css','/css/components.css','/css/games.css','/css/auth.css','/css/register.css','/css/verification.css','/js/app.js','/js/auth.js','/js/audio.js','/js/sw-register.js','/js/verify-otp-page.js','/js/verify-profile-page.js','/js/login-page.js','/js/register-page.js','/js/register-dropdowns.js','/js/profile-page.js','/js/games/chess.js','/js/games/checkers.js','/js/games/scrabble.js','/js/games/trivia.js','/manifest.json','/icons/icon-192x192.png','/icons/icon-512x512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==API_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||!url.protocol.startsWith('http')) return;
  if(url.pathname.startsWith('/api/')) { e.respondWith(networkFirst(e.request,API_CACHE)); return; }
  e.respondWith(cacheFirst(e.request,CACHE));
});
async function cacheFirst(req,name) {
  const cached=await caches.match(req); if(cached) return cached;
  try{const res=await fetch(req);if(res.ok){const c=await caches.open(name);c.put(req,res.clone());}return res;}
  catch{if(req.mode==='navigate'){const c=await caches.match('/');return c||new Response('Offline',{status:503});}return new Response('Offline',{status:503});}
}
async function networkFirst(req,name) {
  try{const res=await fetch(req);if(res.ok){const c=await caches.open(name);c.put(req,res.clone());}return res;}
  catch{const cached=await caches.match(req);return cached||new Response(JSON.stringify({error:'Offline'}),{status:503,headers:{'Content-Type':'application/json'}});}
}
self.addEventListener('push',e=>{if(!e.data)return;const d=e.data.json();e.waitUntil(self.registration.showNotification(d.title||'Trppl',{body:d.body||'',icon:'/icons/icon-192x192.png',badge:'/icons/icon-72x72.png',tag:d.tag||'trppl',data:d.url||'/',vibrate:[200,100,200]}));});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list)if('focus' in c)return c.focus();return clients.openWindow(e.notification.data||'/');}).catch(()=>{}));});
