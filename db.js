/* TaleTrove shared database setup.
   Load this AFTER the supabase-js CDN script:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="db.js"></script>
   It exposes window.TT = { url, key, client, esc, ensureProfile }. */
window.TT = (function () {
    var url = 'https://oadbiabeqavrvtymcvuv.supabase.co';
    var key = 'sb_publishable_cQvpBFh00y0lujudlGhlJQ_ltN3ltN7';

    // null when the CDN is blocked/unreachable, so pages can show a friendly
    // message instead of dying with a ReferenceError.
    var client = null;
    try {
        if (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function') {
            client = supabase.createClient(url, key);
        }
    } catch (e) {
        console.error('TaleTrove: could not start the database client', e);
    }

    // HTML-escape anything that ends up inside innerHTML.
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* The signup flow inserts a profiles row straight after signUp, but at that
       moment the visitor is not confirmed yet, so Row Level Security can reject
       it. This heals the account later: if no row exists it is created from the
       signup metadata. Never throws - callers always get a profile or null. */
    async function ensureProfile(user) {
        if (!client || !user) return null;
        try {
            var found = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (found.data) return found.data;

            var md = user.user_metadata || {};
            var row = {
                id: user.id,
                username: md.display_name || String(user.email || '').split('@')[0] || 'Reader',
                dob: md.dob || null,
                gender: md.gender || null,
                role: md.role || 'reader'
            };
            var created = await client.from('profiles').insert(row).select().maybeSingle();
            if (created.error) {
                // 23505 = a row already exists (a database trigger won the race)
                if (created.error.code !== '23505') {
                    console.warn('TaleTrove: profile row could not be created:', created.error.message);
                }
                var again = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
                return again.data || null;
            }
            return created.data || null;
        } catch (e) {
            console.warn('TaleTrove: ensureProfile failed', e);
            return null;
        }
    }

    return { url: url, key: key, client: client, esc: esc, ensureProfile: ensureProfile };
})();
