(() => {
'use strict';
// Reads the public_profiles view (only profiles their owners made public; no private fields).
const SUPABASE = 'https://cabmvqlvuhqqlaavyhan.supabase.co';
const KEY = 'sb_publishable_DmpqrRNWn0X4S9FLjbHI9Q_6PVPgg26';
const el = document.getElementById('prof');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const art = (appId, kind) => (appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/${kind === 'cover' ? 'library_600x900.jpg' : kind === 'hero' ? 'library_hero.jpg' : 'header.jpg'}` : '');
const hrs = sec => Math.round((sec || 0) / 3600).toLocaleString();
const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };
const name = new URLSearchParams(location.search).get('n') || '';

function empty(title, text) {
  el.innerHTML = `<div class="p-empty"><h1>${esc(title)}</h1><p>${esc(text)}</p><a class="btn btn-xl" href="./"><span><b>Discover Primal</b></span></a></div>`;
}
function gameTile(g, i) {
  return `<div class="p-game" style="--i:${i};--h:${hue(g.name)}">${g.appId ? `<img src="${art(g.appId, 'cover')}" alt="" loading="lazy" onerror="this.remove()">` : ''}
    <div class="p-game-in"><b>${esc(g.name)}</b><small>${g.playtime ? hrs(g.playtime) + ' h' : g.hours ? g.hours + ' h' : ''}</small></div></div>`;
}
function wrappedCard(w) {
  return `<div class="p-wr"><div class="p-wr-h"><span>P</span>PRIMAL WRAPPED ${w.year}</div>
    <div class="p-wr-big"><div><b>${(w.hours || 0).toLocaleString()}</b><small>hours</small></div><div><b>${w.games || 0}</b><small>games</small></div><div><b>${w.achievements || 0}</b><small>achievements</small></div></div>
    <ol>${(w.top || []).slice(0, 5).map(t => `<li><b>${esc(t.name)}</b><em>${(t.hours || 0).toLocaleString()} h</em></li>`).join('')}</ol>
    ${w.persona ? `<div class="p-wr-p"><small>Gamer type</small><b>${esc(w.persona.name)}</b><p>${esc(w.persona.why)}</p></div>` : ''}</div>`;
}
async function load() {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) return empty('Find a player', 'Open a Primal player\'s profile link to see their games and Wrapped.');
  let rows = [];
  try {
    const res = await fetch(`${SUPABASE}/rest/v1/public_profiles?username=ilike.${encodeURIComponent(name)}&select=*`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    rows = res.ok ? await res.json() : [];
  } catch {}
  const p = rows[0];
  if (!p) return empty('Profile not found', `${name} hasn't made their profile public, or doesn't exist.`);
  document.title = `${p.username} · Primal`;
  const st = p.stats || {}, a = st.achievements || {};
  const wrapped = Object.values(p.wrapped || {}).sort((x, y) => y.year - x.year);
  const hero = (st.top && st.top[0] && st.top[0].appId) || (st.recent && st.recent[0] && st.recent[0].appId);
  el.innerHTML = `
    <section class="p-hero"><div class="p-hero-bg">${hero ? `<img src="${art(hero, 'hero')}" alt="">` : ''}</div><div class="p-hero-shade"></div>
      <div class="p-id"><span class="p-av" style="--h:${hue(p.username)}">${p.avatar_url ? `<img src="${esc(p.avatar_url)}" alt="">` : esc(p.username[0].toUpperCase())}</span>
        <div><h1>${esc(p.username)}</h1>${p.bio ? `<p>${esc(p.bio)}</p>` : ''}<small>Primal player since ${new Date(p.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</small></div></div></section>
    <section class="p-stats">
      <div><b>${hrs(st.total)}</b><small>hours played</small></div><div><b>${(st.games || 0).toLocaleString()}</b><small>games</small></div>
      <div><b>${(a.unlocked || 0).toLocaleString()}</b><small>achievements</small></div><div><b>${a.perfect || 0}</b><small>perfect games</small></div></section>
    ${st.top && st.top.length ? `<section class="p-sec"><h2>Most played</h2><div class="p-games">${st.top.slice(0, 8).map(gameTile).join('')}</div></section>` : ''}
    ${wrapped.length ? `<section class="p-sec"><h2>Primal Wrapped</h2><div class="p-wraps">${wrapped.map(wrappedCard).join('')}</div></section>` : ''}
    ${st.favorites && st.favorites.length ? `<section class="p-sec"><h2>Favorites</h2><div class="p-games">${st.favorites.slice(0, 8).map(gameTile).join('')}</div></section>` : ''}
    <section class="final"><h2>Play like ${esc(p.username)}.</h2><p>Every game, one launcher. Free for Windows.</p>
      <a class="btn btn-xl dl-link" href="https://github.com/nathanhart06-ops/primal-releases/releases/latest"><svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg><span><b>Download Primal</b><small class="dl-meta">Windows 10 &amp; 11</small></span></a></section>`;
}
load();
})();
