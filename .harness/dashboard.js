'use strict';

// Local-only backlog dashboard for the Ralph harness. A standalone pure-Node HTTP server (no npm
// deps, not part of the Next.js site / Vercel build). It reads .harness/TASKS.json + the owner
// overlays + per-task specs and serves a single backlog page on localhost.
//
//   npm run harness:dashboard        # then open the printed URL
//
// Read-only (T024). The interactive Mark done / Mark failed actions are T025.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { computeBacklog, summarize } = require('./dashboard-lib');

const HARNESS_DIR = __dirname;
const ROOT = path.join(HARNESS_DIR, '..');
const PORT = Number(process.env.HARNESS_DASHBOARD_PORT) || 4790;

function readJSON(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function readSpec(specRel) {
  if (!specRel) return '';
  try {
    return fs.readFileSync(path.join(ROOT, specRel), 'utf8');
  } catch {
    return '';
  }
}

// Task ids whose worklog records a failed:blocked marker (the loop gave up; needs a human).
function blockedIdsFromWorklog() {
  const dir = path.join(HARNESS_DIR, 'worklog');
  const ids = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md') || f.startsWith('.')) continue;
      const txt = fs.readFileSync(path.join(dir, f), 'utf8');
      if (/failed:blocked/i.test(txt)) ids.push(f.replace(/\.md$/, ''));
    }
  } catch {
    /* no worklog dir yet */
  }
  return ids;
}

// Re-read everything fresh on each request so the view is always current.
function buildBacklog() {
  const backlog = readJSON(path.join(HARNESS_DIR, 'TASKS.json'), { tasks: [] });
  const humanDone = readJSON(path.join(HARNESS_DIR, 'human-done.json'), {});
  const manualFail = readJSON(path.join(HARNESS_DIR, 'manual-fail.json'), {});
  const blockedIds = blockedIdsFromWorklog();
  const computed = computeBacklog(backlog.tasks || [], { humanDone, manualFail, blockedIds });
  const tasks = computed.map((t) => ({ ...t, specContent: readSpec(t.spec) }));
  return { tasks, counts: summarize(computed), generatedAt: new Date().toISOString() };
}

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Backlog — harness</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --bg:#0f1117; --panel:#171a23; --line:#272b38; --txt:#e6e8ee; --dim:#9aa0b4; --acc:#7aa2ff; }
  * { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--txt);
    font:14px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  header { padding:18px 22px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg); }
  h1 { margin:0 0 6px; font-size:18px; } .sub { color:var(--dim); font-size:12px; }
  .counts { margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; }
  .chip { padding:3px 9px; border-radius:999px; font-size:12px; border:1px solid var(--line); background:var(--panel); }
  main { padding:18px 22px; max-width:1000px; margin:0 auto; }
  section { margin-bottom:26px; } section h2 { font-size:13px; text-transform:uppercase; letter-spacing:.08em;
    color:var(--dim); border-bottom:1px solid var(--line); padding-bottom:6px; }
  .task { border:1px solid var(--line); background:var(--panel); border-radius:8px; margin:8px 0; }
  .task > summary { list-style:none; cursor:pointer; padding:10px 12px; display:flex; align-items:center; gap:10px; }
  .task > summary::-webkit-details-marker { display:none; }
  .id { font-family:ui-monospace,monospace; color:var(--acc); font-weight:600; }
  .title { flex:1; } .pill { font-size:11px; padding:2px 8px; border-radius:999px; border:1px solid var(--line); color:var(--dim); }
  .st-ready{color:#8ce99a} .st-waiting{color:#ffd866}
  .st-done{color:#6b7280} .st-needs-human{color:#ffa94d} .st-blocked{color:#ff6b6b} .st-gate{color:#ffa94d}
  .mf { color:#ff6b6b; font-size:11px; } .body { padding:0 12px 12px; border-top:1px solid var(--line); }
  .kv { color:var(--dim); font-size:12px; margin:8px 0; } .kv b { color:var(--txt); font-weight:600; }
  pre { white-space:pre-wrap; background:#0b0d13; border:1px solid var(--line); border-radius:6px; padding:10px;
    font:12px/1.5 ui-monospace,monospace; overflow:auto; }
  code { font-family:ui-monospace,monospace; }
</style></head><body>
<header><h1>🗂️ Backlog <span class="sub" id="gen"></span></h1>
  <div class="sub">Local view of <code>.harness/TASKS.json</code> — read-only (T024). Refresh to update.</div>
  <div class="counts" id="counts"></div>
</header>
<main id="main">Loading…</main>
<script>
const ORDER = [['ready','Ready to build'],['waiting','Waiting on deps'],['needs-human','Needs you'],['blocked','Blocked'],['done','Done']];
const esc = s => String(s==null?'':s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function task(t){
  const deps = (t.dependsOn||[]).length ? (t.unmetDeps&&t.unmetDeps.length? 'needs '+t.unmetDeps.join(', ') : 'deps '+t.dependsOn.join(', ')) : 'no deps';
  const facets = t.facets ? (t.facets.layer+'/'+t.facets.workType+(t.facets.risk&&t.facets.risk.length?' · '+t.facets.risk.join(','):'')) : '—';
  return '<details class="task"><summary>'
    + '<span class="id">'+esc(t.id)+'</span>'
    + '<span class="title">'+esc(t.title)+'</span>'
    + (t.manualFailed?'<span class="mf">⚑ manual-failed</span>':'')
    + '<span class="pill st-'+t.bucket+'">'+t.derivedStatus+'</span></summary>'
    + '<div class="body">'
    + '<div class="kv"><b>gate</b> '+esc(t.gate||'—')+' &nbsp;·&nbsp; <b>facets</b> '+esc(facets)+' &nbsp;·&nbsp; <b>'+esc(deps)+'</b> &nbsp;·&nbsp; <b>expectsTest</b> '+(t.expectsTest?'yes':'no')+'</div>'
    + '<div class="kv"><b>scope</b> '+esc((t.scope||[]).join('  '))+'</div>'
    + (t.specContent? '<pre>'+esc(t.specContent)+'</pre>' : '<div class="kv">(no spec file)</div>')
    + '</div></details>';
}
fetch('/api/backlog').then(r=>r.json()).then(d=>{
  document.getElementById('gen').textContent = 'as of '+new Date(d.generatedAt).toLocaleString();
  document.getElementById('counts').innerHTML = ORDER.map(([k,l])=>'<span class="chip">'+l+': '+(d.counts[k]||0)+'</span>').join('');
  const groups = {}; ORDER.forEach(([k])=>groups[k]=[]);
  d.tasks.forEach(t=>{ (groups[t.bucket]=groups[t.bucket]||[]).push(t); });
  document.getElementById('main').innerHTML = ORDER.filter(([k])=>groups[k]&&groups[k].length)
    .map(([k,l])=>'<section><h2>'+l+' ('+groups[k].length+')</h2>'+groups[k].map(task).join('')+'</section>').join('');
}).catch(e=>{ document.getElementById('main').textContent = 'Error loading backlog: '+e; });
</script></body></html>`;

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/api/backlog') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(buildBacklog()));
    return;
  }
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`\n  🗂️  Harness backlog dashboard → http://localhost:${PORT}\n  (Ctrl-C to stop)\n`);
});
