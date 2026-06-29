'use strict';

// Local-only backlog dashboard for the Ralph harness. A standalone pure-Node HTTP server (no npm
// deps, not part of the Next.js site / Vercel build). It reads .harness/TASKS.json + the owner
// overlays + per-task specs and serves a single backlog page on localhost, with owner actions
// (Mark done / Mark failed, single + bulk) that shell out to the harness CLIs.
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
  const reviewed = readJSON(path.join(HARNESS_DIR, 'reviews.json'), {});
  const blockedIds = blockedIdsFromWorklog();
  const computed = computeBacklog(backlog.tasks || [], { humanDone, manualFail, blockedIds, reviewed });
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
  :root {
    --bg:#fbf2dd; --panel:#fffaf0; --panel2:#fdf6e6; --line:#ecdfc4; --txt:#4b3f2c; --dim:#9a8a6c;
    --acc:#c9772e;
    --ready:#3f7d4f; --ready-bg:#e9f3ea; --waiting:#a9781b; --waiting-bg:#f6edd6;
    --needs:#2f6fb0; --needs-bg:#e7f0fb; --blocked:#c0392b; --blocked-bg:#fae9e6; --done:#7a8a6a; --done-bg:#eef0e8;
  }
  * { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--txt);
    font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  header { padding:18px 22px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--bg); z-index:5; }
  h1 { margin:0 0 4px; font-size:18px; } .sub { color:var(--dim); font-size:12px; }
  .counts { margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; }
  .chip { padding:3px 10px; border-radius:999px; font-size:12px; border:1px solid var(--line); background:var(--panel); }
  main { padding:18px 22px; max-width:1040px; margin:0 auto; }
  section { margin-bottom:26px; } section h2 { font-size:13px; text-transform:uppercase; letter-spacing:.07em;
    color:var(--acc); border-bottom:1px solid var(--line); padding-bottom:6px; }
  .bulkbar { display:flex; align-items:center; gap:14px; margin:6px 0 10px; font-size:13px; color:var(--dim); }
  .bulkbar label { display:flex; align-items:center; gap:6px; cursor:pointer; }
  .task { border:1px solid var(--line); background:var(--panel); border-radius:8px; margin:8px 0; box-shadow:0 1px 0 rgba(0,0,0,.02); }
  .row { cursor:pointer; padding:9px 12px; display:flex; align-items:center; gap:10px; }
  .row:hover { background:var(--panel2); border-radius:8px; }
  .caret { color:var(--dim); width:10px; transition:transform .12s; } .task.open .caret { transform:rotate(90deg); }
  .id { font-family:ui-monospace,monospace; color:var(--txt); font-weight:700; }
  .title { flex:1; } input[type=checkbox] { cursor:pointer; accent-color:var(--acc); }
  .pill { font-size:11px; padding:2px 9px; border-radius:999px; border:1px solid var(--line); white-space:nowrap; }
  .p-ready{color:var(--ready);background:var(--ready-bg)} .p-waiting-human{color:var(--waiting);background:var(--waiting-bg)}
  .p-waiting-loop{color:var(--dim);background:var(--panel2)} .p-done{color:var(--done);background:var(--done-bg)}
  .p-needs-human{color:var(--needs);background:var(--needs-bg)} .p-blocked{color:var(--blocked);background:var(--blocked-bg)}
  .p-reviewed{color:var(--ready);background:var(--ready-bg)} .p-unreviewed{color:var(--dim);background:var(--panel2)}
  .p-failed{color:var(--blocked);background:var(--blocked-bg)}
  .filt{cursor:pointer;color:var(--dim);text-decoration:none} .filt.on{color:var(--acc);font-weight:600}
  .mf { color:var(--blocked); font-size:11px; }
  .act { cursor:pointer; font-size:12px; padding:4px 11px; border-radius:6px; border:1px solid var(--line);
    background:var(--panel2); color:var(--txt); white-space:nowrap; } .act:hover { border-color:var(--acc); }
  .act.danger:hover { border-color:var(--blocked); color:var(--blocked); } .act:disabled { opacity:.45; cursor:default; }
  .body { padding:0 12px 12px 32px; display:none; } .task.open .body { display:block; }
  .kv { color:var(--dim); font-size:12px; margin:8px 0; } .kv b { color:var(--txt); font-weight:600; }
  pre { white-space:pre-wrap; background:var(--panel2); border:1px solid var(--line); border-radius:6px; padding:10px;
    font:12px/1.5 ui-monospace,monospace; overflow:auto; color:var(--txt); }
  code { font-family:ui-monospace,monospace; }
</style></head><body>
<header><h1>🗂️ Backlog <span class="sub" id="gen"></span></h1>
  <div class="sub">Local view of <code>.harness/TASKS.json</code>. Actions write the owner overlays + commit (local only).</div>
  <div class="counts" id="counts"></div>
</header>
<main id="main">Loading…</main>
<script>
const ORDER = [['ready','Ready to build'],['waiting-human','Waiting on a human step'],['needs-human','Needs you'],['failed','Failed (marked a false success)'],['blocked','Blocked'],['done','Done']];
const CHIPS = [['ready','Ready'],['waiting-human','Waiting on you'],['needs-human','Needs you'],['failed','Failed'],['blocked','Blocked'],['waiting-loop','Queued for loop'],['done','Done']];
const PLABEL = {ready:'buildable','waiting-human':'waiting','waiting-loop':'queued','needs-human':'needs human',failed:'failed',blocked:'blocked',done:'done'};
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function post(p,b){return fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());}
window.toggle=function(id){ document.getElementById('task-'+id).classList.toggle('open'); };
window.stop=function(e){ e.stopPropagation(); };
window.markDone=function(e,id){ e.preventDefault(); e.stopPropagation(); if(!confirm('Mark '+id+' done? Writes human-done.json + commits + pushes.'))return;
  post('/api/mark-done',{id}).then(r=>{ if(r.ok){location.reload();}else{alert('Mark done failed:\\n'+(r.error||'unknown'));}}).catch(x=>alert('Error: '+x)); };
window.markFailed=function(e,id){ e.preventDefault(); e.stopPropagation(); var reason=prompt('Mark '+id+' as a false success — what was actually wrong?'); if(!reason)return;
  post('/api/mark-failed',{id,reason:reason}).then(r=>{ if(r.ok){location.reload();}else{alert('Mark failed failed:\\n'+(r.error||'unknown'));}}).catch(x=>alert('Error: '+x)); };
window.updateBulk=function(){
  var d=document.querySelectorAll('.sel-done:checked').length; var bd=document.getElementById('bulkDoneBtn'); if(bd){bd.textContent='Mark '+d+' done'; bd.disabled=d===0;}
  var r=document.querySelectorAll('.sel-rev:checked').length; var br=document.getElementById('bulkRevBtn'); if(br){br.textContent='Mark '+r+' reviewed'; br.disabled=r===0;}
};
window.toggleAllDone=function(cb){ document.querySelectorAll('.sel-done').forEach(c=>{c.checked=cb.checked;}); updateBulk(); };
window.toggleAllRev=function(cb){ document.querySelectorAll('.sel-rev').forEach(c=>{ c.checked = cb.checked && c.dataset.reviewed!=='true'; }); updateBulk(); };
window.markDoneBulk=function(){ var ids=[...document.querySelectorAll('.sel-done:checked')].map(c=>c.dataset.id); if(!ids.length)return;
  if(!confirm('Mark '+ids.length+' task(s) done? Writes human-done.json + commits.'))return;
  post('/api/mark-done-bulk',{ids}).then(r=>{ if(!r.ok){alert('Some failed:\\n'+(r.results||[]).filter(x=>!x.ok).map(x=>x.id+': '+x.error).join('\\n'));} location.reload(); }).catch(x=>alert('Error: '+x)); };
window.markReviewedBulk=function(){ var ids=[...document.querySelectorAll('.sel-rev:checked')].map(c=>c.dataset.id); if(!ids.length)return;
  post('/api/mark-reviewed-bulk',{ids}).then(r=>{ if(!r.ok){alert('Some failed:\\n'+(r.results||[]).filter(x=>!x.ok).map(x=>x.id+': '+x.error).join('\\n'));} location.reload(); }).catch(x=>alert('Error: '+x)); };
window.filterDone=function(mode,el){ document.querySelectorAll('#done-section .task').forEach(t=>{ var rv=t.dataset.reviewed==='true'; t.style.display=(mode==='all'||(mode==='reviewed'&&rv)||(mode==='unreviewed'&&!rv))?'':'none'; });
  document.querySelectorAll('.filt').forEach(b=>b.classList.remove('on')); if(el)el.classList.add('on'); };
function pill(t){ return '<span class="pill p-'+t.bucket+'">'+(PLABEL[t.bucket]||t.derivedStatus)+'</span>'; }
function actions(t){
  if (t.bucket === 'needs-human') return '<button class="act" onclick="markDone(event,\\''+t.id+'\\')">✓ Mark done</button>';
  if (t.bucket === 'done') return '<button class="act danger" onclick="markFailed(event,\\''+t.id+'\\')">⚑ Mark failed</button>';
  return '';
}
function task(t){
  var sel='';
  if (t.bucket==='needs-human') sel='<input type="checkbox" class="sel-done" data-id="'+t.id+'" onclick="stop(event)" onchange="updateBulk()">';
  else if (t.bucket==='done') sel='<input type="checkbox" class="sel-rev" data-id="'+t.id+'" data-reviewed="'+(t.reviewed?'true':'false')+'" onclick="stop(event)" onchange="updateBulk()">';
  var rev = t.bucket==='done' ? (t.reviewed?'<span class="pill p-reviewed">reviewed</span>':'<span class="pill p-unreviewed">not reviewed</span>') : '';
  const deps = (t.dependsOn||[]).length ? (t.unmetDeps&&t.unmetDeps.length? 'needs '+t.unmetDeps.join(', ') : 'deps '+t.dependsOn.join(', ')) : 'no deps';
  const facets = t.facets ? (t.facets.layer+'/'+t.facets.workType+(t.facets.risk&&t.facets.risk.length?' · '+t.facets.risk.join(','):'')) : '—';
  return '<div class="task" id="task-'+t.id+'" data-reviewed="'+(t.reviewed?'true':'false')+'">'
    + '<div class="row" onclick="toggle(\\''+t.id+'\\')">'
    + sel + '<span class="caret">▸</span>'
    + '<span class="id">'+esc(t.id)+'</span><span class="title">'+esc(t.title)+'</span>'
    + (t.manualFailed?'<span class="mf">⚑ manual-failed</span>':'')
    + rev + actions(t) + pill(t) + '</div>'
    + '<div class="body">'
    + '<div class="kv"><b>gate</b> '+esc(t.gate||'—')+' &nbsp;·&nbsp; <b>facets</b> '+esc(facets)+' &nbsp;·&nbsp; <b>'+esc(deps)+'</b> &nbsp;·&nbsp; <b>expectsTest</b> '+(t.expectsTest?'yes':'no')+'</div>'
    + '<div class="kv"><b>scope</b> '+esc((t.scope||[]).join('  '))+'</div>'
    + (t.specContent? '<pre>'+esc(t.specContent)+'</pre>' : '<div class="kv">(no spec file)</div>')
    + '</div></div>';
}
fetch('/api/backlog').then(r=>r.json()).then(d=>{
  document.getElementById('gen').textContent = 'as of '+new Date(d.generatedAt).toLocaleString();
  document.getElementById('counts').innerHTML = CHIPS.map(([k,l])=>'<span class="chip">'+l+': '+(d.counts[k]||0)+'</span>').join('');
  const groups = {}; d.tasks.forEach(t=>{ (groups[t.bucket]=groups[t.bucket]||[]).push(t); });
  document.getElementById('main').innerHTML = ORDER.filter(([k])=>groups[k]&&groups[k].length).map(([k,l])=>{
    var rows = groups[k].map(task).join('');
    if (k==='needs-human'){
      var bar='<div class="bulkbar"><label><input type="checkbox" onchange="toggleAllDone(this)"> Select all ('+groups[k].length+')</label>'
        +'<button id="bulkDoneBtn" class="act" disabled onclick="markDoneBulk()">Mark 0 done</button></div>';
      return '<section><h2>'+l+' ('+groups[k].length+')</h2>'+bar+rows+'</section>';
    }
    if (k==='done'){
      var nrev=groups[k].filter(t=>t.reviewed).length, nun=groups[k].length-nrev;
      var bar='<div class="bulkbar"><label><input type="checkbox" onchange="toggleAllRev(this)"> Select all unreviewed ('+nun+')</label>'
        +'<button id="bulkRevBtn" class="act" disabled onclick="markReviewedBulk()">Mark 0 reviewed</button>'
        +'<span style="margin-left:auto">Show: <a class="filt on" onclick="filterDone(\\'all\\',this)">All</a> · <a class="filt" onclick="filterDone(\\'reviewed\\',this)">Reviewed</a> · <a class="filt" onclick="filterDone(\\'unreviewed\\',this)">Not reviewed</a></span></div>';
      return '<section id="done-section"><h2>'+l+' ('+groups[k].length+' · '+nrev+' reviewed · '+nun+' not reviewed)</h2>'+bar+rows+'</section>';
    }
    return '<section><h2>'+l+' ('+groups[k].length+')</h2>'+rows+'</section>';
  }).join('') || '<p class="sub">No tasks.</p>';
}).catch(e=>{ document.getElementById('main').textContent = 'Error loading backlog: '+e; });
</script></body></html>`;

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  const MUTATIONS = ['/api/mark-done', '/api/mark-failed', '/api/mark-done-bulk', '/api/mark-reviewed', '/api/mark-reviewed-bulk'];
  if (req.method === 'POST' && MUTATIONS.includes(url)) {
    if (!isLoopback(req)) return sendJSON(res, 403, { ok: false, error: 'localhost only' });
    const body = await readBody(req);
    // Bulk endpoints: loop the matching script over ids (each its own commit).
    if (url === '/api/mark-done-bulk' || url === '/api/mark-reviewed-bulk') {
      const ids = Array.isArray(body.ids) ? body.ids : [];
      if (!ids.length) return sendJSON(res, 400, { ok: false, error: 'no ids' });
      const script = url === '/api/mark-done-bulk' ? 'mark-done.sh' : 'mark-reviewed.sh';
      const results = [];
      for (const id of ids) results.push({ id, ...(await runScript(script, [id])) });
      return sendJSON(res, 200, { ok: results.every((r) => r.ok), results });
    }
    const id = body && body.id;
    if (!id) return sendJSON(res, 400, { ok: false, error: 'missing id' });
    if (url === '/api/mark-done') return sendJSON(res, 200, await runScript('mark-done.sh', [id]));
    if (url === '/api/mark-reviewed') return sendJSON(res, 200, await runScript('mark-reviewed.sh', [id]));
    // mark-failed: single only, reason required + stored in manual-fail.json.
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
