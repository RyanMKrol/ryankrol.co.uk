#!/usr/bin/env bash
#
# consolidate-ideas.sh — Stage 3 of /convert-ideas: the ONE locked consolidation pass.
#
# Runs consolidate-ideas.mjs (id allocation, dependsOn resolution, tasks/TNNN.md spec files,
# TASKS.json merge, IDEAS.md bullet removal) under loop.sh's shared lock, then commits + pushes the
# result and cleans up the consumed .harness/.pending-tasks/*.json scratch files. This is the ONLY
# step in the whole ideas->tasks flow that touches the repo lock or git — every per-idea agent in
# Stage 2 writes to its own pending file with zero shared-resource contention, so there's nothing to
# serialize until this single pass runs, once, after every launched unit has reported back.
#
# Reuses loop.sh's own acquire_lock/release_lock (same pattern as mark-done.sh/mark-failed.sh/
# mark-reviewed.sh) rather than a standalone lock file — this repo has no separate daemon process
# that would need to coordinate on the mutex from outside loop.sh, so a second lock mechanism would
# be dead weight. One consequence: unlike a wait/retry lock, loop.sh's acquire_lock EXITS
# IMMEDIATELY if another loop instance already holds it (see loop.sh's own comment on why this repo
# keeps a single lock owner) — don't run this while `.harness/loop.sh`/`supervise.sh` is running.
#
# ⚠️ Run this via `bash .harness/consolidate-ideas.sh` (not `source` it, not run it under zsh) —
# loop.sh derives its paths from ${BASH_SOURCE[0]}, which only resolves correctly when the script
# is actually executed by bash.
#
# Usage:
#   .harness/consolidate-ideas.sh              # consolidate + commit + push
#   NO_PUSH=1 .harness/consolidate-ideas.sh     # consolidate + commit but don't push (offline)
#
# Safe to re-run: it only ever processes whatever .pending-tasks/*.json files still exist on disk
# (a straggler unit that reports back after a prior consolidation just gets picked up next run).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE/.."

# Reuse the loop's lock + path vars (acquire_lock/release_lock, $ROOT, $MAIN_BRANCH).
# LOOP_SOURCE_ONLY=1 returns from loop.sh BEFORE it runs the loop or takes the lock.
LOOP_SOURCE_ONLY=1 source "$HERE/loop.sh"

acquire_lock
trap 'release_lock' EXIT INT TERM

# --- everything below runs while holding the lock ---

node .harness/consolidate-ideas.mjs

SUMMARY=.harness/.pending-tasks/.consolidation-summary.json
if [ ! -f "$SUMMARY" ]; then
  echo "no pending files were consolidated — nothing to commit"
  exit 0
fi

jq empty .harness/TASKS.json

NEW_MD_FILES=$(jq -r '.allocatedTasks[].realId' "$SUMMARY" | sed 's#^#.harness/tasks/#; s#$#.md#')
git add .harness/TASKS.json
for f in $NEW_MD_FILES; do
  git add "$f"
done

echo "--- staged ---"
git status --short

if git diff --cached --quiet; then
  echo "no changes staged (already up to date) — cleaning up pending files anyway"
else
  MSG="$(jq -r '.suggestedCommitMessage' "$SUMMARY")"
  git commit --no-gpg-sign -m "$MSG"

  if [ -z "${NO_PUSH:-}" ]; then
    ok=0
    for _ in 1 2 3; do
      git fetch origin >/dev/null 2>&1 || true
      git rebase "origin/$MAIN_BRANCH" >/dev/null 2>&1 || git rebase --abort >/dev/null 2>&1 || true
      if git push origin "HEAD:$MAIN_BRANCH" >/dev/null 2>&1; then ok=1; break; fi
    done
    [ "$ok" = 1 ] && echo "committed + pushed to $MAIN_BRANCH" || echo "WARN: committed locally but push failed — push $MAIN_BRANCH manually"
  else
    echo "NO_PUSH set — committed locally only"
  fi
fi

echo "--- cleaning up consumed pending files ---"
for f in $(jq -r '.pendingFilesConsumed[]' "$SUMMARY"); do
  rm -f ".harness/.pending-tasks/$f"
done
rm -f "$SUMMARY"

release_lock
echo "--- DONE ---"
