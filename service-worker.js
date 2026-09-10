// PLATINUMZ IT Support - Service Worker (PWA)
// Network-first for pages (always fresh online, offline fallback).
// Cache-first for CDN assets (versioned, safe).
// Stale-while-revalidate for same-origin static files.
var CACHE = 'platinumz-pwa-v1';
var CORE = [
  './',
  './index.html',
  './login.html',
  './admin.html',
  './customer.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './maskable-icon-192.png',
  './maskable-icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(CORE).catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(k){ if(k !== CACHE) return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  // Cross-origin (fonts, firebase SDK, chart.js): cache-first with fill
  if(url.origin !== location.origin){
    e.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){
          if(res && res.ok){
            var clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(req, clone); });
          }
          return res;
        });
      })
    );
    return;
  }

  // Same-origin navigation (HTML): network-first, offline fallback
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.ok){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, clone); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Same-origin static: stale-while-revalidate
  e.respondWith(
    caches.match(req).then(function(hit){
      var fresh = fetch(req).then(function(res){
        if(res && res.ok){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, clone); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || fresh;
    })
  );
});