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
})();