'use strict';

// Local-only backlog dashboard for the Ralph harness. A standalone pure-Node HTTP server (no npm
// deps, not part of the Next.js site / Vercel build). It reads .harness/TASKS.json + the owner
// overlays + per-task specs and serves a single backlog page on localhost, with owner actions
// (Mark done / Mark failed) that shell out to the harness CLIs.
//
//   npm run harness:dashboard        # then open the printed URL
//
// The mutating endpoints are LOCALHOST-ONLY and only mutate via the same scripts you'd run by hand,
// so a click really does write the overlay + commit (this is a LOCAL tool, not the deployed site).

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { computeBacklog, summarize } = require('./lib');

const HERE = __dirname; // .harness/dashboard
const HARNESS_DIR = path.join(HERE, '..'); // .harness
const ROOT = path.join(HERE, '..', '..'); // repo root
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

// Only loopback callers may mutate (defence in depth — the server also binds 127.0.0.1 only).
function isLoopback(req) {
  const a = (req.socket && req.socket.remoteAddress) || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => {
      d += c;
      if (d.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(d || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

// Run one of the harness owner-CLIs (mark-done.sh / mark-failed.sh) and resolve {ok,error}.
function runScript(script, args) {
  return new Promise((resolve) => {
    execFile('bash', [path.join(HARNESS_DIR, script), ...args], { cwd: ROOT, timeout: 60000 }, (err, stdout, stderr) => {
      if (err) resolve({ ok: false, error: (stderr || err.message || '').toString().trim() });
      else resolve({ ok: true, output: (stdout || '').toString().trim() });
    });
  });
}

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
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
  .st-ready{color:#8ce99a} .st-waiting-human{color:#ffd866} .st-waiting-loop{color:#9aa0b4}
  .st-done{color:#6b7280} .st-needs-human{color:#ffa94d} .st-blocked{color:#ff6b6b} .st-gate{color:#ffa94d}
  .mf { color:#ff6b6b; font-size:11px; } .body { padding:0 12px 12px; border-top:1px solid var(--line); }
  .kv { color:var(--dim); font-size:12px; margin:8px 0; } .kv b { color:var(--txt); font-weight:600; }
  pre { white-space:pre-wrap; background:#0b0d13; border:1px solid var(--line); border-radius:6px; padding:10px;
    font:12px/1.5 ui-monospace,monospace; overflow:auto; }
  code { font-family:ui-monospace,monospace; }
  .act { cursor:pointer; font-size:12px; padding:5px 11px; border-radius:6px; border:1px solid var(--line);
    background:#1d2230; color:var(--txt); } .act:hover { border-color:var(--acc); }
  .act.danger:hover { border-color:#ff6b6b; }
</style></head><body>
<header><h1>🗂️ Backlog <span class="sub" id="gen"></span></h1>
  <div class="sub">Local view of <code>.harness/TASKS.json</code>. Actions write the owner overlays + commit (local only).</div>
  <div class="counts" id="counts"></div>
</header>
<main id="main">Loading…</main>
<script>
const ORDER = [['ready','Ready to build'],['waiting-human','Waiting on a human step'],['needs-human','Needs you'],['blocked','Blocked'],['done','Done']];
const CHIPS = [['ready','Ready'],['waiting-human','Waiting on you'],['needs-human','Needs you'],['blocked','Blocked'],['waiting-loop','Queued for loop'],['done','Done']];
const esc = s => String(s==null?'':s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function post(p,b){return fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());}
window.markDone=function(id){ if(!confirm('Mark '+id+' done? Writes human-done.json + commits + pushes.'))return;
  post('/api/mark-done',{id}).then(r=>{ if(r.ok){location.reload();}else{alert('Mark done failed:\\n'+(r.error||'unknown'));}}).catch(e=>alert('Error: '+e)); };
window.markFailed=function(id){ var reason=prompt('Mark '+id+' as a false success — what was actually wrong?'); if(!reason)return;
  post('/api/mark-failed',{id,reason:reason}).then(r=>{ if(r.ok){location.reload();}else{alert('Mark failed failed:\\n'+(r.error||'unknown'));}}).catch(e=>alert('Error: '+e)); };
function task(t){
  const deps = (t.dependsOn||[]).length ? (t.unmetDeps&&t.unmetDeps.length? 'needs '+t.unmetDeps.join(', ') : 'deps '+t.dependsOn.join(', ')) : 'no deps';
  const facets = t.facets ? (t.facets.layer+'/'+t.facets.workType+(t.facets.risk&&t.facets.risk.length?' · '+t.facets.risk.join(','):'')) : '—';
  let actions = '';
  if (t.bucket === 'needs-human') actions = '<button class="act" onclick="markDone(\\''+t.id+'\\')">✓ Mark done</button>';
  else if (t.bucket === 'done') actions = '<button class="act danger" onclick="markFailed(\\''+t.id+'\\')">⚑ Mark failed</button>';
  return '<details class="task"><summary>'
    + '<span class="id">'+esc(t.id)+'</span>'
    + '<span class="title">'+esc(t.title)+'</span>'
    + (t.manualFailed?'<span class="mf">⚑ manual-failed</span>':'')
    + '<span class="pill st-'+t.bucket+'">'+t.derivedStatus+'</span></summary>'
    + '<div class="body">'
    + '<div class="kv"><b>gate</b> '+esc(t.gate||'—')+' &nbsp;·&nbsp; <b>facets</b> '+esc(facets)+' &nbsp;·&nbsp; <b>'+esc(deps)+'</b> &nbsp;·&nbsp; <b>expectsTest</b> '+(t.expectsTest?'yes':'no')+'</div>'
    + '<div class="kv"><b>scope</b> '+esc((t.scope||[]).join('  '))+'</div>'
    + (t.specContent? '<pre>'+esc(t.specContent)+'</pre>' : '<div class="kv">(no spec file)</div>')
    + (actions? '<div class="kv">'+actions+'</div>' : '')
    + '</div></details>';
}
fetch('/api/backlog').then(r=>r.json()).then(d=>{
  document.getElementById('gen').textContent = 'as of '+new Date(d.generatedAt).toLocaleString();
  document.getElementById('counts').innerHTML = CHIPS.map(([k,l])=>'<span class="chip">'+l+': '+(d.counts[k]||0)+'</span>').join('');
  const groups = {}; d.tasks.forEach(t=>{ (groups[t.bucket]=groups[t.bucket]||[]).push(t); });
  document.getElementById('main').innerHTML = ORDER.filter(([k])=>groups[k]&&groups[k].length)
    .map(([k,l])=>'<section><h2>'+l+' ('+groups[k].length+')</h2>'+groups[k].map(task).join('')+'</section>').join('')
    || '<p class="sub">No tasks.</p>';
}).catch(e=>{ document.getElementById('main').textContent = 'Error loading backlog: '+e; });
</script></body></html>`;

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (req.method === 'POST' && (url === '/api/mark-done' || url === '/api/mark-failed')) {
    if (!isLoopback(req)) return sendJSON(res, 403, { ok: false, error: 'localhost only' });
    const body = await readBody(req);
    const id = body && body.id;
    if (!id) return sendJSON(res, 400, { ok: false, error: 'missing id' });
    if (url === '/api/mark-done') return sendJSON(res, 200, await runScript('mark-done.sh', [id]));
    const reason = (body.reason || '').toString().trim();
    if (!reason) return sendJSON(res, 400, { ok: false, error: 'a reason is required' });
    return sendJSON(res, 200, await runScript('mark-failed.sh', [id, reason]));
  }

  if (url === '/api/backlog') return sendJSON(res, 200, buildBacklog());
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(PAGE);
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`\n  🗂️  Harness backlog dashboard → http://localhost:${PORT}\n  (Ctrl-C to stop)\n`);
});
