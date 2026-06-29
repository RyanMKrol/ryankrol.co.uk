'use strict';

// Pure backlog-derivation logic for the local dashboard. NO file I/O here — keep it hermetically
// testable; dashboard.js reads the files and passes plain objects in. The done/eligibility rules
// MIRROR loop.sh / postflight.sh so the dashboard agrees with what the loop will actually do.

// A task is done if TASKS.json says so OR the human-done overlay marks it (mirrors loop.sh task_done).
function isDone(task, humanDone) {
  if (task.status === 'done') return true;
  const hd = humanDone && humanDone[task.id];
  return !!(hd && hd.done === true);
}

// Derive a display status + flags for ONE task (no cross-task knowledge).
function deriveTask(task, opts = {}) {
  const { humanDone = {}, manualFail = {}, blockedIds = [] } = opts;
  const done = isDone(task, humanDone);
  const needsHuman = task.gate === 'needs-human';
  const isGate = task.gate === 'gate';
  const manualFailed = !!(manualFail[task.id] && manualFail[task.id].failed === true);
  const blocked = !done && blockedIds.includes(task.id);
  let derivedStatus;
  if (done) derivedStatus = 'done';
  else if (blocked) derivedStatus = 'blocked';
  else if (needsHuman) derivedStatus = 'needs-human';
  else if (isGate) derivedStatus = 'gate';
  else derivedStatus = 'pending';
  return { ...task, derivedStatus, done, needsHuman, isGate, manualFailed, blocked };
}

// Given all tasks + overlays, return tasks with derived status + an eligibility bucket + unmet deps.
// Buckets: done | needs-human | blocked | ready | waiting (ready = not-done, ungated, all deps done —
// the same rule select_task uses).
function computeBacklog(tasks, opts = {}) {
  const { humanDone = {}, manualFail = {}, blockedIds = [] } = opts;
  const derived = (tasks || []).map((t) => deriveTask(t, { humanDone, manualFail, blockedIds }));
  const doneIds = new Set(derived.filter((t) => t.done).map((t) => t.id));
  return derived.map((t) => {
    const deps = t.dependsOn || [];
    const unmetDeps = deps.filter((d) => !doneIds.has(d));
    let bucket;
    if (t.done) bucket = 'done';
    else if (t.needsHuman || t.isGate) bucket = 'needs-human';
    else if (t.blocked) bucket = 'blocked';
    else bucket = unmetDeps.length === 0 ? 'ready' : 'waiting';
    return { ...t, bucket, unmetDeps };
  });
}

// Headline counts for the buckets, for a summary line.
function summarize(computed) {
  const counts = { ready: 0, waiting: 0, 'needs-human': 0, blocked: 0, done: 0 };
  for (const t of computed) counts[t.bucket] = (counts[t.bucket] || 0) + 1;
  return counts;
}

module.exports = { isDone, deriveTask, computeBacklog, summarize };
