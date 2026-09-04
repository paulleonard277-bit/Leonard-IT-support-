// PLATINUMZ IT Support - Service Worker
// Minimal: network-first, non-caching to avoid serving stale content.
var CACHE = 'platinumz-v1';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); })); }));
  return self.clients.claim();
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok && req.url.indexOf('http')===0){
        var clone = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, clone); });
      }
      return res;
    }).catch(function(){ return caches.match(req); })
  );
});