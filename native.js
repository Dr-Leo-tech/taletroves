(function () {
  var C = window.Capacitor;
  var isApp = !!(C && C.isNativePlatform && C.isNativePlatform());
  window.isApp = isApp;

  function plugin(name) { return (C && C.Plugins && C.Plugins[name]) || null; }

  // Share helper: works in the app and falls back on the web
  window.shareStory = function (title, url) {
    var link = url || location.href;
    var S = plugin('Share');
    if (S) return S.share({ title: title, text: 'Read "' + title + '" on TaleTrove', url: link, dialogTitle: 'Share story' });
    if (navigator.share) return navigator.share({ title: title, url: link });
    if (navigator.clipboard) return navigator.clipboard.writeText(link);
  };

  // Service worker (web and app)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  if (!isApp) return;
  document.documentElement.classList.add('is-app');

  // Hide the splash as soon as the page is ready
  var Splash = plugin('SplashScreen');
  function hideSplash() { if (Splash) Splash.hide(); }
  if (document.readyState === 'complete') hideSplash();
  else window.addEventListener('load', function () { requestAnimationFrame(hideSplash); });

  // Android back button: go back, or exit on the first page
  var App = plugin('App');
  if (App) {
    App.addListener('backButton', function (e) {
      if (e && e.canGoBack) history.back(); else App.exitApp();
    });
  }

  // Light vibration on button taps
  var H = plugin('Haptics');
  window.buzz = function () { if (H) H.impact({ style: 'LIGHT' }); };
  document.addEventListener('click', function (e) {
    if (e.target.closest('button, .btn, [role="button"]')) window.buzz();
  }, true);

  // ---- Bottom tab bar (app only) ----
  var TABS = [
    { label: 'Home', icon: '🏠' },
    { label: 'Stories', icon: '📚' },
    { label: 'Profile', icon: '👤' },
    { label: 'About', icon: 'ℹ️' }
  ];

  function fileOf(href) {
    var p = (href || '').split('?')[0].split('#')[0].split('/').pop();
    return p === '' ? 'index.html' : p;
  }

  function buildTabBar() {
    if (document.getElementById('app-tabbar')) return true;
    var all = Array.prototype.slice.call(document.querySelectorAll('header a, nav a'));
    var found = [];
    TABS.forEach(function (t) {
      var a = all.filter(function (x) {
        return x.textContent.trim().toLowerCase() === t.label.toLowerCase();
      })[0];
      if (a) found.push({ tab: t, a: a });
    });
    if (found.length < 2) return false;

    var bar = document.createElement('nav');
    bar.id = 'app-tabbar';
    var here = fileOf(location.pathname);
    found.forEach(function (f) {
      var link = document.createElement('a');
      link.href = f.a.getAttribute('href');
      link.innerHTML = '<span class="ti">' + f.tab.icon + '</span><span>' + f.tab.label + '</span>';
      if (fileOf(link.getAttribute('href')) === here) link.className = 'active';
      link.addEventListener('click', function () { if (window.buzz) window.buzz(); });
      bar.appendChild(link);
      f.a.classList.add('app-hide');
    });
    document.body.appendChild(bar);
    return true;
  }

  var tries = 0;
  var timer = setInterval(function () {
    if (buildTabBar() || ++tries > 25) clearInterval(timer);
  }, 200);
})();
