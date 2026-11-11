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

  // ---- Bottom tab bar (app only): Home, Stories, Profile, Settings ----
  var SESSION_KEY = 'sb-oadbiabeqavrvtymcvuv-auth-token';

  function isLoggedIn() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      var obj = JSON.parse(raw);
      var s = obj && (obj.currentSession || obj);
      return !!(s && (s.access_token || s.refresh_token));
    } catch (e) { return false; }
  }

  function buildTabBar() {
    if (document.getElementById('app-tabbar')) return true;
    if (!document.body) return false;

    var li = isLoggedIn();
    var file = (location.pathname.split('/').pop() || 'index').toLowerCase().replace(/\.html$/, '');
    var folder = location.pathname.split('/').filter(Boolean)[0] || '';
    var isStories = file === 'stories' || file === 'story' || file === 'readchapter' ||
                    folder === 'story' || folder === 'chapter';

    var tabs = [
      { label: 'Home', icon: '🏠', href: li ? '/home.html' : '/guest.html',
        active: file === 'home' || file === 'guest' },
      { label: 'Stories', icon: '📚', href: '/stories.html', active: isStories },
      { label: 'Profile', icon: '👤', href: li ? '/dashboard.html' : '/index.html',
        active: file === 'dashboard' || file === 'author-dashboard' || (!li && file === 'index') },
      { label: 'Settings', icon: '⚙️', href: '/settings.html', active: file === 'settings' }
    ];

    var bar = document.createElement('nav');
    bar.id = 'app-tabbar';
    tabs.forEach(function (t) {
      var link = document.createElement('a');
      link.href = t.href;
      link.innerHTML = '<span class="ti">' + t.icon + '</span><span>' + t.label + '</span>';
      if (t.active) link.className = 'active';
      link.addEventListener('click', function () { if (window.buzz) window.buzz(); });
      bar.appendChild(link);
    });
    document.body.appendChild(bar);
    return true;
  }

  // ---- Compact header: logo + search icon (search row opens on tap) ----
  function compactHeader() {
    var top = document.querySelector('header.tt-header .tt-top');
    if (!top) return false;
    if (top.querySelector('.app-search-toggle')) return true;
    var form = top.querySelector('.tt-search');
    if (!form) return false;
    var input = form.querySelector('input');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'app-search-toggle';
    btn.setAttribute('aria-label', 'Search');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';
    top.insertBefore(btn, form);
    if (input && input.value) top.classList.add('search-open');
    btn.addEventListener('click', function () {
      top.classList.toggle('search-open');
      if (top.classList.contains('search-open') && input) input.focus();
    });
    return true;
  }

  var tries = 0;
  var timer = setInterval(function () {
    var tabsDone = buildTabBar();
    var headerDone = compactHeader();
    if ((tabsDone && headerDone) || ++tries > 25) clearInterval(timer);
  }, 200);
})();
