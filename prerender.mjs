// Pre-renders public stories/chapters into static, crawlable HTML at deploy time.
// Runs on Netlify (see netlify.toml). Never fails the deploy: on any error it
// logs a warning and leaves the site exactly as committed.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = process.env.PRERENDER_SUPABASE_URL || 'https://oadbiabeqavrvtymcvuv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cQvpBFh00y0lujudlGhlJQ_ltN3ltN7'; // public, same key the site already ships
const DEFAULT_SITE = 'https://taletroves.netlify.app';
const SITE = (process.env.SITE_URL || process.env.URL || DEFAULT_SITE).replace(/\/$/, '');
const MIN_WORDS = 150; // thinner pages are noindexed and left out of the sitemap

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const words = (s) => (String(s ?? '').trim().match(/\S+/g) || []).length;
const slug = (s) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'story';
const snippet = (s, n = 155) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
const paras = (s) => String(s ?? '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n      ');

async function fetchAll(table, select, order) {
  const rows = [];
  const page = 500;
  for (let from = 0; ; from += page) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${order}`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Range: `${from}-${from + page - 1}`, 'Range-Unit': 'items' } });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < page) break;
  }
  return rows;
}

const HEAD_COMMON = `<script src="cookie-consent.js"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-2W62NFYZJ3"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-2W62NFYZJ3');
  </script>`;

const FOOTER = `<footer>
      <p>© ${new Date().getFullYear()} TaleTrove. <br><br>
      <a href="about.html">About</a> | <a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms</a> | <a href="contact.html">Contact</a>
      </p>
    </footer>`;

function page({ title, desc, canonicalPath, body, noindex }) {
  const url = `${SITE}/${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <base href="/">
  ${HEAD_COMMON}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(url)}">
  ${noindex ? '<meta name="robots" content="noindex,follow">' : ''}
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="TaleTrove">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(url)}">
  <link rel="stylesheet" href="main.css">
  <style>
    .pr-wrap{max-width:760px;margin:40px auto;padding:24px;background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(0,0,0,.06);line-height:1.8;color:#222}
    .pr-wrap h1{margin-top:0;color:#4b2f8a}
    .pr-meta{color:#666;margin-bottom:20px}
    .pr-meta a,.pr-wrap a{color:#6b46c1}
    .pr-chapters{list-style:none;padding:0;margin:20px 0}
    .pr-chapters li{margin:0 0 10px}
    .pr-chapters a{display:block;padding:14px;background:#f7f4fd;border-radius:10px;text-decoration:none}
    .pr-nav{display:flex;justify-content:space-between;gap:10px;margin-top:30px;flex-wrap:wrap}
    .pr-btn{display:inline-block;padding:10px 18px;border-radius:999px;background:#7b3fd1;color:#fff!important;text-decoration:none}
  </style>
</head>
<body>
  <div class="js-header"></div>
  <main id="main">
    <article class="pr-wrap">
      ${body}
    </article>
  </main>
  <div class="js-footer">
    ${FOOTER}
  </div>
  <script type="module" src="main.js"></script>
</body>
</html>
`;
}

async function main() {
  const stories = await fetchAll('stories', 'id,title,content,author_id,created_at,profiles(username)', 'created_at.desc');
  const chapters = await fetchAll('chapters', 'id,title,content,story_id,created_at', 'created_at.asc');
  console.log(`[prerender] ${stories.length} stories, ${chapters.length} chapters`);

  const byStory = new Map();
  for (const c of chapters) { if (!byStory.has(c.story_id)) byStory.set(c.story_id, []); byStory.get(c.story_id).push(c); }

  mkdirSync(join(ROOT, 'story'), { recursive: true });
  mkdirSync(join(ROOT, 'chapter'), { recursive: true });

  const urls = []; // { loc, lastmod }
  const storyPath = (s) => `story/${slug(s.title)}-${s.id}.html`;
  const chapterPath = (s, c) => `chapter/${slug(s.title)}-${slug(c.title)}-${c.id}.html`;

  for (const s of stories) {
    const chs = byStory.get(s.id) || [];
    const author = s.profiles?.username || 'Unknown Author';
    const wc = words(s.content) + chs.reduce((n, c) => n + words(c.title), 0);
    const indexable = wc >= MIN_WORDS;
    const list = chs.length
      ? `<h2>Chapters</h2>\n      <ol class="pr-chapters">\n${chs.map((c, i) => `        <li><a href="${esc(chapterPath(s, c))}"><strong>Chapter ${i + 1}:</strong> ${esc(c.title)}</a></li>`).join('\n')}\n      </ol>`
      : '<p>No chapters have been published yet.</p>';
    const body = `<h1>${esc(s.title)}</h1>
      <p class="pr-meta">By <a href="author.html?id=${encodeURIComponent(s.author_id)}">${esc(author)}</a> · ${chs.length} chapter${chs.length === 1 ? '' : 's'}</p>
      ${paras(s.content)}
      ${list}
      <p><a class="pr-btn" href="story.html?id=${encodeURIComponent(s.id)}">Like &amp; comment on this story</a></p>`;
    const p = storyPath(s);
    writeFileSync(join(ROOT, p), page({
      title: `${s.title} by ${author} | TaleTrove`, desc: snippet(s.content) || `Read ${s.title} by ${author} on TaleTrove.`,
      canonicalPath: p, body, noindex: !indexable
    }));
    if (indexable) urls.push({ loc: p, lastmod: s.created_at });

    chs.forEach((c, i) => {
      const cwc = words(c.content);
      const prev = chs[i - 1], next = chs[i + 1];
      const nav = `<div class="pr-nav">
        ${prev ? `<a class="pr-btn" href="${esc(chapterPath(s, prev))}">← Previous</a>` : '<span></span>'}
        <a class="pr-btn" href="${esc(p)}">All chapters</a>
        ${next ? `<a class="pr-btn" href="${esc(chapterPath(s, next))}">Next →</a>` : '<span></span>'}
      </div>`;
      const cbody = `<h1>${esc(c.title)}</h1>
      <p class="pr-meta">Chapter ${i + 1} of <a href="${esc(p)}">${esc(s.title)}</a> · By <a href="author.html?id=${encodeURIComponent(s.author_id)}">${esc(author)}</a></p>
      ${paras(c.content)}
      ${nav}
      <p><a href="story.html?id=${encodeURIComponent(s.id)}">Like or comment on this story</a></p>`;
      const cp = chapterPath(s, c);
      writeFileSync(join(ROOT, cp), page({
        title: `${c.title} – ${s.title} | TaleTrove`, desc: snippet(c.content) || `Read ${c.title} from ${s.title} on TaleTrove.`,
        canonicalPath: cp, body: cbody, noindex: cwc < MIN_WORDS
      }));
      if (cwc >= MIN_WORDS) urls.push({ loc: cp, lastmod: c.created_at });
    });
  }

  // Crawlable story list inside stories.html (the page's JS replaces it for visitors)
  const sp = join(ROOT, 'stories.html');
  if (existsSync(sp) && stories.length) {
    const cards = stories.map(s => `<div class="story-card"><div>
        <h2 class="story-title">${esc(s.title)}</h2>
        <p class="story-author">By ${esc(s.profiles?.username || 'Unknown Author')}</p>
        <p class="story-preview">${esc(snippet(s.content, 120))}</p></div>
        <a href="${esc(storyPath(s))}" class="read-btn">Read Full Story →</a></div>`).join('\n');
    let html = readFileSync(sp, 'utf8');
    const re = /(<div id="publicFeed"[^>]*>)[\s\S]*?(<\/div>\s*\n)/;
    if (re.test(html)) writeFileSync(sp, html.replace(re, (_, a, b) => `${a}\n${cards}\n${b}`));
  }

  // Sitemap
  const staticPages = ['', 'about.html', 'home.html', 'stories.html', 'guest.html', 'contact.html', 'privacy.html', 'terms.html'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    staticPages.map(p => `  <url><loc>${SITE}/${p}</loc></url>`).join('\n') + '\n' +
    urls.map(u => `  <url><loc>${esc(SITE + '/' + u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n') +
    `\n</urlset>\n`;
  writeFileSync(join(ROOT, 'sitemap.xml'), xml);
  console.log(`[prerender] sitemap: ${staticPages.length + urls.length} URLs`);
}

// If a custom domain is the primary one, point canonicals/sitemap/robots at it.
function retargetDomain() {
  if (SITE === DEFAULT_SITE) return;
  for (const f of readdirSync(ROOT)) {
    if (!/\.(html|txt)$/.test(f)) continue;
    const p = join(ROOT, f);
    const t = readFileSync(p, 'utf8');
    if (t.includes(DEFAULT_SITE)) writeFileSync(p, t.split(DEFAULT_SITE).join(SITE));
  }
  console.log(`[prerender] domain set to ${SITE}`);
}

try { await main(); retargetDomain(); }
catch (e) { console.warn('[prerender] skipped, site left as committed:', e.message); }
