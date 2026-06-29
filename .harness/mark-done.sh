#!/usr/bin/env bash
#
# mark-done.sh — mark a `needs-human` task DONE via the owner-owned overlay (.harness/human-done.json),
# or undo it. Portable CLI (no dashboard required); the dashboard's "Mark done" button shells out to it.
#
# The loop READS human-done.json (task_done) to treat the task as done and unblock its dependents — it
# never writes it. This applies ONLY to `gate == "needs-human"` tasks: the loop owns the status of every
# buildable task, so those are never marked done this way.
#
# Usage:
#   .harness/mark-done.sh <TNNN>            # mark a needs-human task done
#   .harness/mark-done.sh --undo <TNNN>     # clear a previous mark-done
#   NO_PUSH=1 .harness/mark-done.sh <TNNN>  # write+commit but don't push (offline)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Reuse the loop's lock + path vars (acquire_lock/release_lock, $ROOT, $MAIN_BRANCH, $BACKLOG,
# $HUMAN_DONE, tj). LOOP_SOURCE_ONLY=1 returns from loop.sh BEFORE it runs the loop or takes the lock.
LOOP_SOURCE_ONLY=1 source "$HERE/loop.sh"

die() { echo "error: $*" >&2; exit 1; }

undo=0
if [ "${1:-}" = "--undo" ]; then undo=1; shift; fi
id="${1:-}"

[ -n "$id" ] || die "usage: mark-done.sh <TNNN>   |   mark-done.sh --undo <TNNN>"
[[ "$id" =~ ^T[0-9]+$ ]] || die "task id must look like T123 (got '$id')"
tj -e --arg id "$id" '.tasks[]|select(.id==$id)' >/dev/null 2>&1 || die "$id is not a task in $BACKLOG"
gate="$(tj -r --arg id "$id" '.tasks[]|select(.id==$id)|.gate // "null"')"
[ "$gate" = "needs-human" ] || die "$id gate is '$gate', not 'needs-human' — only needs-human tasks are completed via the overlay (the loop owns buildable-task status)"

[ -f "$HUMAN_DONE" ] || printf '{}\n' >"$HUMAN_DONE"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
tmp="$HUMAN_DONE.tmp"   # same-dir temp → mv is an atomic rename

if [ "$undo" = 1 ]; then
  jq --arg id "$id" 'del(.[$id])' "$HUMAN_DONE" >"$tmp" && mv "$tmp" "$HUMAN_DONE" || { rm -f "$tmp"; die "failed to update $HUMAN_DONE"; }
  msg="human-done: clear $id [skip ci]"
  echo "cleared human-done for $id"
else
  jq --arg id "$id" --arg at "$ts" '.[$id] = {done:true, at:$at}' "$HUMAN_DONE" >"$tmp" && mv "$tmp" "$HUMAN_DONE" || { rm -f "$tmp"; die "failed to update $HUMAN_DONE"; }
  msg="human-done: $id [skip ci]"
  echo "marked $id done"
fi

# Commit + push the overlay under the loop's lock so we never race its git operations.
rel="${HUMAN_DONE#"$ROOT"/}"
acquire_lock
trap 'release_lock' EXIT INT TERM
git -C "$ROOT" add -- "$rel"
if git -C "$ROOT" diff --cached --quiet -- "$rel"; then
  echo "no change to commit (overlay already in that state)"; exit 0
fi
git -C "$ROOT" commit -q --no-gpg-sign -m "$msg" || die "commit failed"
if [ -n "${NO_PUSH:-}" ]; then echo "committed (NO_PUSH set — not pushed)"; exit 0; fi
ok=0
for _ in 1 2 3; do
  git -C "$ROOT" fetch origin >/dev/null 2>&1 || true
  git -C "$ROOT" rebase "origin/$MAIN_BRANCH" >/dev/null 2>&1 || git -C "$ROOT" rebase --abort >/dev/null 2>&1 || true
  if git -C "$ROOT" push origin "HEAD:$MAIN_BRANCH" >/dev/null 2>&1; then ok=1; break; fi
done
[ "$ok" = 1 ] && echo "committed + pushed to $MAIN_BRANCH" || echo "WARN: committed locally but push failed — push $MAIN_BRANCH manually"
