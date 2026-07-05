#!/usr/bin/env node
// consolidate-ideas.mjs — the Stage 3 consolidation pass for /convert-ideas.
//
// Reads every .harness/.pending-tasks/<slug>.json file (one per idea, or per shared-answer-space
// cluster — see .claude/commands/convert-ideas.md), allocates real sequential task ids,
// resolves cross-unit tempId `dependsOn` references, writes .harness/tasks/TNNN.md spec files from
// each task's specDo/specDoneWhen, merges the new tasks into TASKS.json, and removes each converted
// idea's bullet from IDEAS.md.
//
// This is pure data-processing — it does NOT touch git and does NOT take the repo lock itself.
// Run it via consolidate-ideas.sh, which wraps it in loop.sh's shared lock (acquire_lock/
// release_lock) and handles the git add/commit/push. (Split this way because id allocation +
// IDEAS.md bullet removal need the lock, but are much easier to get right in JS than in bash/jq —
// and lock acquisition itself is a one-line bash `source`, no reason to reimplement it here.)
//
// Bullet removal is FUZZY-matched (normalized: backticks stripped, whitespace collapsed), not exact
// string match — a pending file's recorded `ideaBullets` text is a straight paragraph, while the
// actual bullet in IDEAS.md is hand-line-wrapped markdown, so byte-identity is not realistic.
//
// Idempotent: safe to re-run — it only ever processes whatever `.pending-tasks/*.json` files still
// exist on disk, and a bullet that's already gone from IDEAS.md is skipped (not an error). Units
// that were deliberately deferred (owner declined, no pending file written) are correctly invisible
// to this script; their bullet stays untouched.
//
// Usage: node .harness/consolidate-ideas.mjs
// Writes .harness/.pending-tasks/.consolidation-summary.json — the wrapper script reads this to know
// which files to `git add` and to build the commit message, then deletes it once committed.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = execFileSync('git', ['-C', HERE, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

const PENDING_DIR = path.join(REPO, '.harness/.pending-tasks');
const TASKS_PATH = path.join(REPO, '.harness/TASKS.json');
const TASKS_DIR = path.join(REPO, '.harness/tasks');
const IDEAS_PATH = path.join(REPO, '.harness/IDEAS.md');
const SUMMARY_PATH = path.join(PENDING_DIR, '.consolidation-summary.json');

function normalize(s) {
  return s.replace(/`/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// ---- 1. Read TASKS.json fresh, compute next id ----
const tasksDoc = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
const existingIds = tasksDoc.tasks.map(t => t.id);
const idNums = existingIds.map(id => parseInt(id.slice(1), 10));
const width = existingIds.length ? existingIds[0].slice(1).length : 3;
let nextNum = Math.max(0, ...idNums) + 1;

function allocId() {
  const id = 'T' + String(nextNum).padStart(width, '0');
  nextNum += 1;
  return id;
}

// ---- 2. Read every pending file, stable order (sorted by filename == agentSlug) ----
fs.mkdirSync(PENDING_DIR, { recursive: true });
const pendingFiles = fs.readdirSync(PENDING_DIR).filter(f => f.endsWith('.json') && f !== '.consolidation-summary.json').sort();
if (pendingFiles.length === 0) {
  console.log('No pending files found — nothing to consolidate.');
  process.exit(0);
}

const units = pendingFiles.map(f => {
  const full = path.join(PENDING_DIR, f);
  return { file: full, fname: f, data: JSON.parse(fs.readFileSync(full, 'utf8')) };
});

const tempIdMap = new Map(); // tempId -> realId
const allocatedTasks = [];   // { realId, tempId, raw, unit }

for (const unit of units) {
  for (const t of (unit.data.tasks || [])) {
    const realId = allocId();
    tempIdMap.set(t.tempId, realId);
    allocatedTasks.push({ realId, tempId: t.tempId, raw: t, unit });
  }
}

console.log(`Allocated ${allocatedTasks.length} task id(s): ${allocatedTasks.map(a => a.realId).join(', ') || '(none)'}`);

// ---- 3. Resolve dependsOn ----
const droppedDeps = [];
for (const a of allocatedTasks) {
  const resolved = [];
  for (const dep of (a.raw.dependsOn || [])) {
    if (/^T\d+$/.test(dep)) {
      const existsOld = existingIds.includes(dep);
      const existsNew = allocatedTasks.some(x => x.realId === dep);
      if (existsOld || existsNew) resolved.push(dep);
      else droppedDeps.push({ realId: a.realId, tempId: a.tempId, dep, reason: 'referenced real id does not exist' });
    } else if (tempIdMap.has(dep)) {
      resolved.push(tempIdMap.get(dep));
    } else {
      droppedDeps.push({ realId: a.realId, tempId: a.tempId, dep, reason: 'tempId has no matching produced task (unit likely produced zero tasks)' });
    }
  }
  a.resolvedDependsOn = resolved;
}

if (droppedDeps.length) {
  console.log(`WARNING: ${droppedDeps.length} dependsOn reference(s) dropped:`);
  for (const d of droppedDeps) console.log(`  ${d.realId} (${d.tempId}) -> "${d.dep}": ${d.reason}`);
}

// ---- 4. Write tasks/TNNN.md spec files ----
fs.mkdirSync(TASKS_DIR, { recursive: true });
for (const a of allocatedTasks) {
  const mdPath = path.join(TASKS_DIR, `${a.realId}.md`);
  const content = `## Do\n\n${a.raw.specDo}\n\n## Done when\n\n${a.raw.specDoneWhen}\n`;
  fs.writeFileSync(mdPath, content, 'utf8');
}

// ---- 5. Build final task objects ----
const newTaskObjects = allocatedTasks.map(a => {
  const t = a.raw;
  const isNeedsHuman = t.gate === 'needs-human';
  const tags = Array.isArray(t.tags) ? [...t.tags] : [];
  if (isNeedsHuman && !tags.includes('needs-human')) tags.push('needs-human');

  const obj = {
    id: a.realId,
    title: t.title,
    status: 'pending',
    dependsOn: a.resolvedDependsOn,
    gate: t.gate ?? null,
    tags,
    scope: Array.isArray(t.scope) ? t.scope : [],
    design: t.design ?? null,
    verify: Array.isArray(t.verify) ? t.verify : [],
    spec: `.harness/tasks/${a.realId}.md`,
  };
  // Only `facets` is carved out for needs-human/gated tasks (they never run through the loop) —
  // `expectsTest` is unconditional per the canonical ralph-loop-add-to-backlog schema, so it's
  // always included here regardless of gate.
  if (!isNeedsHuman) {
    obj.facets = t.facets ?? null;
  }
  obj.expectsTest = !!t.expectsTest;
  return obj;
});

// ---- 5.5. Deploy-task convention enforcement ----
// Per .harness/CLAUDE.md's deploy-task convention: at most one pending "Deploy pending site
// changes to production" task at a time; every new site-touching task's id must be tracked by it.
// This used to be an authoring-time rule each pass had to remember (and already failed silently
// once — the T171/T193/T188 double-deploy-task incident) — this makes it mechanical instead.
const DEPLOY_TITLE = 'Deploy pending site changes to production';

function isSiteTouching(taskObj) {
  const scope = Array.isArray(taskObj.scope) ? taskObj.scope : [];
  return scope.some(s => s !== '.harness' && !s.startsWith('.harness/'));
}

function buildDeploySpec(depIds) {
  return `## Do

**This is the single canonical deploy checkpoint for the backlog.** At any given time there must be
at most ONE task in \`TASKS.json\` with \`status: pending\` and a title matching "Deploy pending site
changes to production" — this is it right now. Vercel's Git integration is disconnected (see root
\`CLAUDE.md\`'s "Deploying" section) — none of this task's dependencies' work goes live no matter how
many commits land on \`main\`. This task makes no code changes; it is a pure operational run
(\`scope: []\`, diff should be empty aside from the worklog).

This task was auto-created by \`/convert-ideas\`'s consolidation pass (\`.harness/consolidate-ideas.mjs\`)
because the sweep that authored it added at least one site-touching task with no existing pending
deploy task to attach to. Its \`dependsOn\` covers every site-touching task from that sweep:
${depIds.join(', ')}.

1. \`git fetch origin && git status\` — confirm the local checkout's \`main\` matches \`origin/main\`
   exactly (no ahead/behind). If it doesn't, \`git pull\` first.
2. \`npm run build\` locally as a final pre-deploy sanity check (CI should already have passed this on
   every commit, but re-confirm before spending a Vercel build).
3. \`vercel whoami\` — confirm the CLI is authenticated. **If this fails (not logged in), STOP and
   record \`failed:blocked\`** with that exact reason — this is a genuine prerequisite this task
   cannot supply itself, a human needs to run \`vercel login\` once. Do not attempt any workaround.
4. Run the deploy non-interactively and capture its output (the production URL is the last line of
   stdout on success):
   \`\`\`sh
   vercel --prod --yes
   \`\`\`
5. Confirm the deployment actually reached a ready state — parse the CLI's own exit code AND
   independently verify by fetching the returned URL:
   \`\`\`sh
   curl -s -o /dev/null -w '%{http_code}' <the-production-url>
   \`\`\`
   must print \`200\`. Note: the raw per-deployment URL may 302-redirect (Vercel's deployment-
   protection/SSO on internal deployment hostnames, not a failure) — if so, verify against the
   aliased production domain (\`https://www.ryankrol.co.uk\`) instead.
6. Objectively confirm the deployed site reflects real changes from this batch — pick a couple of
   fast, unambiguous, server-rendered checks against whatever this sweep's dependency tasks actually
   changed (read their committed code on \`main\` first, then write the checks against it — don't
   guess the exact strings blindly).

## Done when

- \`vercel whoami\` succeeded (or the task correctly stopped with \`failed:blocked\` if it didn't).
- \`vercel --prod --yes\` exited 0 and printed a production URL.
- \`curl -s -o /dev/null -w '%{http_code}' <url-or-www.ryankrol.co.uk>\` printed \`200\`.
- The spot-checks in step 6 found matches against the live production site.
- The exact production URL, the deployment's timestamp, and the spot-check results are recorded in
  this task's worklog.
`;
}

let deployTaskAction = 'none'; // 'none' | 'updated' | 'created'
let deployTaskId = null;

const siteTouchingIds = newTaskObjects.filter(isSiteTouching).map(t => t.id);
if (siteTouchingIds.length > 0) {
  const existingPendingDeploy = tasksDoc.tasks.find(t => t.title === DEPLOY_TITLE && t.status === 'pending');
  if (existingPendingDeploy) {
    const merged = new Set([...(existingPendingDeploy.dependsOn || []), ...siteTouchingIds]);
    existingPendingDeploy.dependsOn = [...merged];
    deployTaskAction = 'updated';
    deployTaskId = existingPendingDeploy.id;
    console.log(`Deploy task: updated existing pending ${deployTaskId}'s dependsOn with ${siteTouchingIds.length} site-touching task(s).`);
  } else {
    const realId = allocId();
    const deployObj = {
      id: realId,
      title: DEPLOY_TITLE,
      status: 'pending',
      dependsOn: siteTouchingIds,
      gate: null,
      tags: ['deploy'],
      scope: [],
      design: null,
      verify: [],
      spec: `.harness/tasks/${realId}.md`,
      expectsTest: false,
      facets: { layer: 'harness', workType: 'config', risk: ['cross-cutting'] },
    };
    newTaskObjects.push(deployObj);
    allocatedTasks.push({
      realId,
      tempId: null,
      raw: { title: DEPLOY_TITLE },
      unit: { data: { agentSlug: 'deploy-task-enforcement' } },
    });
    fs.writeFileSync(path.join(TASKS_DIR, `${realId}.md`), buildDeploySpec(siteTouchingIds), 'utf8');
    deployTaskAction = 'created';
    deployTaskId = realId;
    console.log(`Deploy task: created new pending ${realId}, depending on ${siteTouchingIds.length} site-touching task(s).`);
  }
} else {
  console.log('Deploy task: no site-touching tasks this sweep — no action.');
}

// ---- 6. Merge into TASKS.json ----
tasksDoc.tasks.push(...newTaskObjects);
fs.writeFileSync(TASKS_PATH, JSON.stringify(tasksDoc, null, 2) + '\n', 'utf8');

// ---- 7. Remove converted idea bullets from IDEAS.md (fuzzy match, re-read fresh) ----
let removedBulletCount = 0;
if (fs.existsSync(IDEAS_PATH)) {
  const ideasRaw = fs.readFileSync(IDEAS_PATH, 'utf8');
  const lines = ideasRaw.split('\n');
  const inboxHeaderIdx = lines.findIndex(l => l.trim() === '## Inbox');

  if (inboxHeaderIdx === -1) {
    console.error('WARNING: could not find "## Inbox" header in IDEAS.md — skipping bullet removal');
  } else {
    const bulletSpans = [];
    let i = inboxHeaderIdx + 1;
    while (i < lines.length) {
      if (lines[i].startsWith('- ')) {
        const start = i;
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('- ') && !lines[j].startsWith('## ')) j++;
        bulletSpans.push({ start, end: j, text: lines.slice(start, j).join('\n') });
        i = j;
      } else if (lines[i].startsWith('## ')) {
        break;
      } else {
        i++;
      }
    }
    console.log(`Parsed ${bulletSpans.length} bullet(s) from IDEAS.md inbox.`);

    const allRecordedBullets = [];
    for (const unit of units) {
      for (const b of (unit.data.ideaBullets || [])) allRecordedBullets.push({ text: b, slug: unit.data.agentSlug });
    }

    const normBullets = bulletSpans.map(b => ({ ...b, norm: normalize(b.text) }));
    const matchedSpans = new Set();

    for (const rec of allRecordedBullets) {
      const recNorm = normalize(rec.text);
      let match = normBullets.find(b => b.norm === recNorm);
      if (!match) match = normBullets.find(b => b.norm.slice(0, 200) === recNorm.slice(0, 200));
      if (!match) {
        const recPrefix100 = recNorm.slice(0, 100);
        match = normBullets.find(b => b.norm.includes(recPrefix100) || recNorm.includes(b.norm.slice(0, 100)));
      }
      if (match) {
        matchedSpans.add(match.start);
        console.log(`MATCHED bullet for unit "${rec.slug}": line ${match.start + 1}`);
      } else {
        console.log(`WARNING: no bullet match for unit "${rec.slug}" (starts: "${rec.text.slice(0, 80)}...") — leaving it in IDEAS.md`);
      }
    }

    const spansToRemove = normBullets.filter(b => matchedSpans.has(b.start)).sort((a, b) => b.start - a.start);
    let newLines = [...lines];
    for (const span of spansToRemove) newLines.splice(span.start, span.end - span.start);
    fs.writeFileSync(IDEAS_PATH, newLines.join('\n'), 'utf8');
    removedBulletCount = spansToRemove.length;
    console.log(`Removed ${removedBulletCount} bullet(s) from IDEAS.md.`);
  }
} else {
  console.log('IDEAS.md does not exist — skipping bullet removal (nothing to clean up).');
}

// ---- 8. Write summary for the shell wrapper ----
const idList = allocatedTasks.map(a => a.realId);
const first = idList[0];
const last = idList[idList.length - 1];
const idRange = idList.length === 0 ? '' : idList.length === 1 ? first : `${first}-${last}`;
const unitSlugs = [...new Set(units.map(u => u.data.agentSlug))];
const deployLine = deployTaskAction === 'created' ? `\n\nAlso created ${deployTaskId} (deploy checkpoint) for ${siteTouchingIds.length} site-touching task(s).`
  : deployTaskAction === 'updated' ? `\n\nAlso added ${siteTouchingIds.length} site-touching task(s) to ${deployTaskId}'s (deploy checkpoint) dependsOn.`
  : '';
const suggestedCommitMessage = idList.length
  ? `backlog: add ${idRange} from idea conversion sweep\n\nConverted ${unitSlugs.length} idea unit(s): ${unitSlugs.join(', ')}.${deployLine}\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
  : '';

const summary = {
  allocatedTasks: allocatedTasks.map(a => ({ realId: a.realId, tempId: a.tempId, unit: a.unit.data.agentSlug, title: a.raw.title })),
  droppedDeps,
  removedBulletCount,
  deployTask: { action: deployTaskAction, id: deployTaskId, siteTouchingTaskIds: siteTouchingIds },
  pendingFilesConsumed: pendingFiles,
  suggestedCommitMessage,
};
fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
console.log('\n--- SUMMARY ---');
console.log(JSON.stringify(summary, null, 2));
