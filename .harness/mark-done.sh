#!/usr/bin/env bash
#
# mark-done.sh — mark one or more `needs-human` tasks DONE via the owner-owned overlay
# (.harness/human-done.json), or undo it. Portable CLI (no dashboard required); the dashboard's
# "Mark done" button(s) shell out to it.
#
# The loop READS human-done.json (task_done) to treat a task as done and unblock its dependents — it
# never writes it. This applies ONLY to `gate == "needs-human"` tasks: the loop owns the status of every
# buildable task, so those are never marked done this way.
#
# Multiple ids in one call perform ONE overlay write and ONE git commit/push, not one per id —
# validation is fail-fast and atomic: if ANY id is invalid, NOTHING is written or committed.
#
# Usage:
#   .harness/mark-done.sh <TNNN> [TNNN...]            # mark one or more needs-human tasks done
#   .harness/mark-done.sh --undo <TNNN> [TNNN...]     # clear previous mark-done(s)
#   NO_PUSH=1 .harness/mark-done.sh <TNNN>            # write+commit but don't push (offline)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Reuse the loop's lock + path vars (acquire_lock/release_lock, $ROOT, $MAIN_BRANCH, $BACKLOG,
# $HUMAN_DONE, tj). LOOP_SOURCE_ONLY=1 returns from loop.sh BEFORE it runs the loop or takes the lock.
LOOP_SOURCE_ONLY=1 source "$HERE/loop.sh"

die() { echo "error: $*" >&2; exit 1; }

undo=0
if [ "${1:-}" = "--undo" ]; then undo=1; shift; fi
ids=("$@")

[ "${#ids[@]}" -gt 0 ] || die "usage: mark-done.sh [--undo] <TNNN> [TNNN...]"

# Fail-fast, atomic validation: check EVERY id before writing anything, so a bad id in a batch
# never partially applies.
for id in "${ids[@]}"; do
  [[ "$id" =~ ^T[0-9]+$ ]] || die "task id must look like T123 (got '$id')"
  tj -e --arg id "$id" '.tasks[]|select(.id==$id)' >/dev/null 2>&1 || die "$id is not a task in $BACKLOG"
  gate="$(tj -r --arg id "$id" '.tasks[]|select(.id==$id)|.gate // "null"')"
  [ "$gate" = "needs-human" ] || die "$id gate is '$gate', not 'needs-human' — only needs-human tasks are completed via the overlay (the loop owns buildable-task status)"
done

[ -f "$HUMAN_DONE" ] || printf '{}\n' >"$HUMAN_DONE"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
tmp="$HUMAN_DONE.tmp"   # same-dir temp → mv is an atomic rename
idsJson="$(printf '%s\n' "${ids[@]}" | jq -R . | jq -s .)"
joined="$(IFS=', '; echo "${ids[*]}")"

if [ "$undo" = 1 ]; then
  jq --argjson ids "$idsJson" 'reduce $ids[] as $id (.; del(.[$id]))' "$HUMAN_DONE" >"$tmp" && mv "$tmp" "$HUMAN_DONE" || { rm -f "$tmp"; die "failed to update $HUMAN_DONE"; }
  msg="human-done: clear $joined [skip ci]"
  for id in "${ids[@]}"; do echo "cleared human-done for $id"; done
else
  jq --argjson ids "$idsJson" --arg at "$ts" 'reduce $ids[] as $id (.; .[$id] = {done:true, at:$at})' "$HUMAN_DONE" >"$tmp" && mv "$tmp" "$HUMAN_DONE" || { rm -f "$tmp"; die "failed to update $HUMAN_DONE"; }
  msg="human-done: $joined [skip ci]"
  for id in "${ids[@]}"; do echo "marked $id done"; done
fi

# Commit + push the overlay under the loop's lock so we never race its git operations. Exactly ONE
# commit + ONE push regardless of how many ids were passed above.
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
