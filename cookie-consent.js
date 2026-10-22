/* TaleTrove cookie consent. Must load BEFORE the Google tag so analytics/ad
   storage stays denied until the visitor chooses. */
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };

  var KEY = 'tt_cookie_consent'; // "granted" | "denied"
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}

  function apply(state) {
    gtag('consent', 'update', {
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state
    });
  }

  gtag('consent', 'default', {
    analytics_storage: saved === 'granted' ? 'granted' : 'denied',
    ad_storage: saved === 'granted' ? 'granted' : 'denied',
    ad_user_data: saved === 'granted' ? 'granted' : 'denied',
    ad_personalization: saved === 'granted' ? 'granted' : 'denied',
    wait_for_update: 500
  });

  function choose(state) {
    try { localStorage.setItem(KEY, state); } catch (e) {}
    apply(state);
    var b = document.getElementById('ttCookieBanner');
    if (b) b.remove();
  }

  function show() {
    if (document.getElementById('ttCookieBanner')) return;
    var b = document.createElement('div');
    b.id = 'ttCookieBanner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie consent');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;max-width:560px;margin:0 auto;background:#1f2430;color:#fff;padding:16px 18px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3);font:14px/1.5 "Segoe UI",Arial,sans-serif;';
    b.innerHTML =
      '<p style="margin:0 0 12px">We use cookies for analytics and, in future, to show ads. You can accept or decline. ' +
      'See our <a href="privacy.html" style="color:#c9b8ea">Privacy Policy</a>.</p>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '<button type="button" id="ttCookieNo" style="padding:8px 16px;border-radius:999px;border:1px solid #c9b8ea;background:transparent;color:#fff;cursor:pointer;font:inherit">Decline</button>' +
      '<button type="button" id="ttCookieYes" style="padding:8px 16px;border-radius:999px;border:none;background:#7b3fd1;color:#fff;cursor:pointer;font:inherit">Accept</button>' +
      '</div>';
    document.body.appendChild(b);
    document.getElementById('ttCookieYes').onclick = function () { choose('granted'); };
    document.getElementById('ttCookieNo').onclick = function () { choose('denied'); };
  }

  // Lets the privacy page reopen the banner: <a href="#" onclick="ttCookieSettings();return false">
  window.ttCookieSettings = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    show();
  };

  if (saved !== 'granted' && saved !== 'denied') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
    else show();
  }
})();
