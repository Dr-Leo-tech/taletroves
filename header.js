// TaleTrove header: logo + search on the first row, navigation on the second.
// Guest:     Home | Stories | About | Profile | Login/Signup
// Logged in: Home | Stories | About | Profile | Logout
// Login state is read from the Supabase session stored in localStorage, so this
// file needs no Supabase library and works on every page.
const SUPABASE_URL = 'https://oadbiabeqavrvtymcvuv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cQvpBFh00y0lujudlGhlJQ_ltN3ltN7'; // public key, already shipped with the site
const SESSION_KEY = 'sb-oadbiabeqavrvtymcvuv-auth-token';

function readSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        const s = obj && (obj.currentSession || obj);
        if (!s) return null;
        // An expired access token with no refresh token can never be renewed.
        const expiresAt = Number(s.expires_at) * 1000; // stored in seconds
        if (expiresAt > 0 && expiresAt < Date.now() && !s.refresh_token) return null;
        // A refresh token means the Supabase client can renew an expired access token.
        return (s.access_token || s.refresh_token) ? s : null;
    } catch (e) {
        return null;
    }
}

async function logout() {
    const s = readSession();
    try {
        // Prefer the SDK client already loaded on the page so refresh tokens
        // and any other session storage are cleared too.
        const C = (window.TT && window.TT.client)
            || (window.supabase && typeof window.supabase.createClient === 'function'
                ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
                : null);
        if (C) {
            await C.auth.signOut();
        } else if (s && s.access_token) {
            await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                method: 'POST',
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${s.access_token}` }
            });
        }
    } catch (e) { /* offline or token expired: still clear the local session */ }
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    window.location.replace('index.html');
}

const HEADER_CSS = `
header.tt-header{display:block;padding:10px 0 6px;background:#667eea;color:#fff;font-size:16px}
header.tt-header .tt-inner{width:95%;max-width:1200px;margin:0 auto}
header.tt-header .tt-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
header.tt-header a.logo-wrapper{color:#fff;text-decoration:none;flex:none}
header.tt-header .tt-search{display:flex;align-items:center;gap:6px;flex:0 1 380px;min-width:0;margin:0}
header.tt-header .tt-search input{flex:1;min-width:0;box-sizing:border-box;height:36px;padding:0 14px;border:2px solid rgba(255,255,255,.85);border-radius:999px;background:#fff;color:#222;font:inherit;font-size:14px;outline:none}
header.tt-header .tt-search input:focus{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.35)}
header.tt-header .tt-search select{flex:none;box-sizing:border-box;height:36px;padding:0 8px;border:2px solid rgba(255,255,255,.85);border-radius:999px;background:#fff;color:#444;font:inherit;font-size:13px;font-weight:bold;outline:none;cursor:pointer;width:auto}
header.tt-header .tt-search button{flex:none;width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;border:2px solid #fff;border-radius:50%;background:transparent;color:#fff;cursor:pointer}
header.tt-header .tt-search button:hover{background:rgba(255,255,255,.2)}
header.tt-header .tt-nav{display:flex;flex-wrap:wrap;align-items:center;gap:4px 18px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.35)}
header.tt-header .tt-nav a,header.tt-header .tt-nav button{margin:0;padding:4px 2px;border:0;border-bottom:2px solid transparent;border-radius:0;background:none;color:#fff;font:inherit;font-size:15px;font-weight:bold;text-decoration:none;cursor:pointer;width:auto}
header.tt-header .tt-nav a:hover,header.tt-header .tt-nav button:hover{border-bottom-color:rgba(255,255,255,.7);background:none}
header.tt-header .tt-nav [aria-current="page"]{border-bottom-color:#fff}
header.tt-header .tt-nav .tt-auth{margin-left:auto}
@media (max-width:480px){
  header.tt-header .tt-top{flex-wrap:wrap}
  header.tt-header .tt-search{flex:1 1 100%}
  header.tt-header .tt-nav{gap:4px 14px}
  header.tt-header .tt-nav a,header.tt-header .tt-nav button{font-size:14px}
}`;

export function readerHeader() {
    const headerElement = document.querySelector('.js-header');
    if (!headerElement) return;

    if (!document.getElementById('ttHeaderCss')) {
        const style = document.createElement('style');
        style.id = 'ttHeaderCss';
        style.textContent = HEADER_CSS;
        document.head.appendChild(style);
    }

    const loggedIn = !!readSession();
    const homeHref = loggedIn ? 'home.html' : 'guest.html';
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const folder = location.pathname.split('/').filter(Boolean)[0] || '';
    const isStories = file === 'stories.html' || file === 'story.html' || file === 'readchapter.html' || folder === 'story' || folder === 'chapter';
    const current = (match) => match ? ' aria-current="page"' : '';
    const q = new URLSearchParams(location.search).get('q') || '';
    const by = new URLSearchParams(location.search).get('by') === 'author' ? 'author' : 'title';
    const safeQ = q.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const authLink = loggedIn
        ? `<button type="button" class="tt-auth js-logout">Logout</button>`
        : `<a class="tt-auth" href="index.html"${current(file === 'index.html')}>Login/Signup</a>`;

    headerElement.innerHTML = `
    <header class="tt-header">
      <div class="tt-inner">
        <div class="tt-top">
          <a class="logo-wrapper" href="${homeHref}" aria-label="TaleTrove home">
            <div class="magic-book">
                <div class="book-cover"></div>
                <div class="book-line"></div>
                <div class="sparkle sp-1">✦</div>
                <div class="sparkle sp-2">✦</div>
            </div>
            <span class="logo-text">Tale Trove</span>
          </a>
          <form class="tt-search" role="search" action="stories.html" method="get">
            <select name="by" aria-label="Search by">
              <option value="title"${by === 'title' ? ' selected' : ''}>Title</option>
              <option value="author"${by === 'author' ? ' selected' : ''}>Author</option>
            </select>
            <input type="search" name="q" value="${safeQ}" placeholder="${by === 'author' ? 'Search by author name' : 'Search by story title'}" aria-label="Search stories" autocomplete="off">
            <button type="submit" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
            </button>
          </form>
        </div>
        <nav class="tt-nav" aria-label="Main">
          <a href="${homeHref}"${current(file === 'home.html' || file === 'guest.html')}>Home</a>
          <a href="stories.html"${current(isStories)}>Stories</a>
          <a href="about.html"${current(file === 'about.html')}>About</a>
          <a href="${loggedIn ? 'dashboard.html' : 'index.html'}"${current(file === 'dashboard.html' || file === 'author-dashboard.html')}>Profile</a>
          ${authLink}
        </nav>
      </div>
    </header>
    `;

    const searchForm = headerElement.querySelector('.tt-search');
    searchForm.querySelector('select').addEventListener('change', (e) => {
        searchForm.querySelector('input').placeholder = e.target.value === 'author' ? 'Search by author name' : 'Search by story title';
    });

    const logoutBtn = headerElement.querySelector('.js-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}
