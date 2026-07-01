'use strict';

// Pure backlog-derivation logic for the local dashboard. NO file I/O here — keep it hermetically
// testable; server.js reads the files and passes plain objects in. The done/eligibility rules
// MIRROR loop.sh / postflight.sh so the dashboard agrees with what the loop will actually do.

// A task is done if TASKS.json says so OR the human-done overlay marks it (mirrors loop.sh task_done).
function isDone(task, humanDone) {
  if (task.status === 'done') return true;
  const hd = humanDone && humanDone[task.id];
  return !!(hd && hd.done === true);
}

// Derive a display status + flags for ONE task (no cross-task knowledge).
function deriveTask(task, opts = {}) {
  const { humanDone = {}, manualFail = {}, blockedIds = [], reviewed = {} } = opts;
  const done = isDone(task, humanDone);
  const needsHuman = task.gate === 'needs-human';
  const isGate = task.gate === 'gate';
  const manualFailed = !!(manualFail[task.id] && manualFail[task.id].failed === true);
  const isReviewed = !!(reviewed[task.id] && reviewed[task.id].reviewed === true);
  const failed = task.status === 'failed'; // terminal — owner marked it a false success (reconciled)
  const blocked = !done && !failed && blockedIds.includes(task.id);
  let derivedStatus;
  if (failed) derivedStatus = 'failed';
  else if (done) derivedStatus = 'done';
  else if (blocked) derivedStatus = 'blocked';
  else if (needsHuman) derivedStatus = 'needs-human';
  else if (isGate) derivedStatus = 'gate';
  else derivedStatus = 'pending';
  return { ...task, derivedStatus, done, failed, needsHuman, isGate, manualFailed, blocked, reviewed: isReviewed };
}

// Parse the numeric part of a "T123"-style id, for numeric (not lexicographic) sorting.
function numericId(id) {
  const m = /(\d+)/.exec(id || '');
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

// Given all tasks + overlays, return tasks with derived status + an eligibility bucket + unmet deps.
// Buckets: ready | waiting | needsHuman | done (four display buckets — mirrors local-jobs).
//   ready      = not-done, ungated, all deps done (the rule select_task uses)
//   waiting    = has unmet deps AND its dependency closure contains a needs-human/gate/failed
//                blocker that isn't done — i.e. it CANNOT progress until the owner acts. A task
//                whose unmet deps are ALL themselves buildable ("waiting-loop") is noise — the
//                loop will get to its blocker on its own — so it is omitted entirely, not tagged.
//   needsHuman = union of a needs-human/gate task AND a loop-given-up (`failed:blocked`) task —
//                both need the owner's attention; `blocked: true` distinguishes the latter for the UI.
//   done       = union of done tasks AND terminal `status:"failed"` tasks (an owner-marked false
//                success) — sorted not-reviewed first, then by numeric task id.
function computeBacklog(tasks, opts = {}) {
  const { humanDone = {}, manualFail = {}, blockedIds = [], reviewed = {} } = opts;
  const derived = (tasks || []).map((t) => deriveTask(t, { humanDone, manualFail, blockedIds, reviewed }));
  const byId = Object.fromEntries(derived.map((t) => [t.id, t]));
  const doneIds = new Set(derived.filter((t) => t.done).map((t) => t.id));
  // A task that can't progress without the owner: a needs-human/gate task, OR a terminal-failed task
  // (its dependents will never build until the owner fixes it).
  const isHumanBlocker = (t) => !!t && !t.done && (t.gate === 'needs-human' || t.gate === 'gate' || t.failed);

  // Memoized: does this task's unmet-dependency closure contain a human blocker?
  const memo = {};
  function blockedByHuman(id, seen) {
    if (id in memo) return memo[id];
    seen = seen || new Set();
    if (seen.has(id)) return false;
    seen.add(id);
    const t = byId[id];
    let res = false;
    for (const d of (t && t.dependsOn) || []) {
      if (doneIds.has(d)) continue;
      if (isHumanBlocker(byId[d]) || blockedByHuman(d, seen)) {
        res = true;
        break;
      }
    }
    memo[id] = res;
    return res;
  }

  const withBucket = derived.map((t) => {
    const unmetDeps = (t.dependsOn || []).filter((d) => !doneIds.has(d));
    let bucket;
    if (t.done || t.failed) bucket = 'done';
    else if (t.needsHuman || t.isGate || t.blocked) bucket = 'needsHuman';
    else if (unmetDeps.length === 0) bucket = 'ready';
    else bucket = blockedByHuman(t.id) ? 'waiting' : 'waiting-loop';
    return { ...t, bucket, unmetDeps };
  });

  // waiting-loop tasks are noise from the owner's point of view — the loop will build their
  // blocker on its own — so they're excluded from the returned array entirely.
  const result = withBucket.filter((t) => t.bucket !== 'waiting-loop');

  // done bucket sort: not-reviewed items first, then ascending numeric task id (within each group).
  const doneBucket = result.filter((t) => t.bucket === 'done');
  doneBucket.sort((a, b) => {
    if (a.reviewed !== b.reviewed) return a.reviewed ? 1 : -1;
    return numericId(a.id) - numericId(b.id);
  });
  const others = result.filter((t) => t.bucket !== 'done');
  return [...others, ...doneBucket];
}

// Headline counts for the buckets, for a summary line.
function summarize(computed) {
  const counts = { ready: 0, waiting: 0, needsHuman: 0, done: 0 };
  for (const t of computed) counts[t.bucket] = (counts[t.bucket] || 0) + 1;
  return counts;
}

module.exports = { isDone, deriveTask, computeBacklog, summarize };
