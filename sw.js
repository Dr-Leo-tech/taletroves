/* TaleTrove service worker.
   - Navigations: network first, cached copy used as the offline fallback.
   - Same-origin static assets (css/js/fonts/images): stale-while-revalidate.
   - Everything else (Supabase, CDNs, analytics): left to the browser. */
var CACHE = 'taletrove-v2';

self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () { return self.clients.claim(); })
    );
});

function sameOrigin(req) {
    try {
        return new URL(req.url, self.location.origin).origin === self.location.origin;
    } catch (e) {
        return false;
    }
}

function save(req, res) {
    if (res && res.ok && !res.redirected && res.type !== 'opaque') {
        return caches.open(CACHE).then(function (c) { return c.put(req, res.clone()); });
    }
    return null;
}

function cachedCopy(req) {
    return caches.open(CACHE).then(function (c) { return c.match(req); });
}

function networkFirst(req) {
    var network = fetch(req).then(function (res) {
        save(req, res);
        return res;
    });
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 4000, null); });
    return Promise.race([network, timeout]).then(function (res) {
        if (res) return res;
        return cachedCopy(req).then(function (hit) { return hit || network; });
    }).catch(function () {
        return cachedCopy(req).then(function (hit) { return hit || Response.error(); });
    });
}

function staleWhileRevalidate(req) {
    return cachedCopy(req).then(function (hit) {
        var network = fetch(req).then(function (res) {
            save(req, res);
            return res;
        }).catch(function () { return null; });
        return hit || network.then(function (res) { return res || Response.error(); });
    });
}

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET' || !sameOrigin(req)) return;
    if (req.mode === 'navigate') {
        e.respondWith(networkFirst(req));
        return;
    }
    if (['style', 'script', 'font', 'image'].indexOf(req.destination) > -1) {
        e.respondWith(staleWhileRevalidate(req));
    }
});
