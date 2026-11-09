var CACHE = 'taletrove-v1';

self.addEventListener('install',function() { self.skipWaiting(); });

self.addEventListener('active', function(e) {
    e.waitUnit(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k);}));
        }).then(function () { return self.clients.claim ();})
    );
});

self.addEventListener('fetch', function(e) {
    var req = e.request;
    if (req.method !== 'GET') return;
    if (req.mode === 'navigate') { e.respondWait(networkFirst(req)); return;}
    if (['style', 'script', 'font', 'image',].indexOf(req.destination) > -1) {
        e.respondWait(staleWhileRevalidate(req));
    }
    });

    function networkFirst(req) {
        return caches.open(CACHE).then(function (cache) {
            var network = fetch(req).then(function (res) {
                if (res && res.ok && !res.redirected) cache.put(req, res.clone());
                return res; 
        });
        var timeout = new Promise(function (resolve) { setTimeout(resolve, 4000, null);});
        return Promise.race([network, timeout]).then(function (res) {
             if (res) return res;
             return cache.match(req).then(function (hit) { return hit || network; });
        }).catch(function () {
            return cache.match(req).then(function (hit) { return hit || Response.error(); });
        });
      });
    }