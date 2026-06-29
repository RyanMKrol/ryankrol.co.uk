#!/usr/bin/env bash
#
# mark-reviewed.sh — mark a task REVIEWED (the owner's "I've looked at this completed work" flag) via
# the owner-owned overlay (.harness/reviews.json), or undo it. Portable CLI; the dashboard's
# "Mark reviewed" buttons (single + bulk) shell out to it.
#
# `reviewed` is a PURELY OWNER-FACING annotation — the loop NEVER reads or writes it (unlike
# human-done.json / manual-fail.json, which steer the loop). It only helps you triage which finished
# tasks you've actually checked. Any real task id is accepted.
#
# Usage:
#   .harness/mark-reviewed.sh <TNNN>            # mark reviewed
#   .harness/mark-reviewed.sh --undo <TNNN>     # clear
#   NO_PUSH=1 .harness/mark-reviewed.sh <TNNN>  # write+commit but don't push
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOOP_SOURCE_ONLY=1 source "$HERE/loop.sh"   # reuse acquire_lock/release_lock + $ROOT/$MAIN_BRANCH/$BACKLOG/tj
REVIEWS="$HARNESS_DIR/reviews.json"

die() { echo "error: $*" >&2; exit 1; }

undo=0
if [ "${1:-}" = "--undo" ]; then undo=1; shift; fi
id="${1:-}"

[ -n "$id" ] || die "usage: mark-reviewed.sh <TNNN>   |   mark-reviewed.sh --undo <TNNN>"
[[ "$id" =~ ^T[0-9]+$ ]] || die "task id must look like T123 (got '$id')"
tj -e --arg id "$id" '.tasks[]|select(.id==$id)' >/dev/null 2>&1 || die "$id is not a task in $BACKLOG"

[ -f "$REVIEWS" ] || printf '{}\n' >"$REVIEWS"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
tmp="$REVIEWS.tmp"

if [ "$undo" = 1 ]; then
  jq --arg id "$id" 'del(.[$id])' "$REVIEWS" >"$tmp" && mv "$tmp" "$REVIEWS" || { rm -f "$tmp"; die "failed to update $REVIEWS"; }
  msg="reviewed: clear $id [skip ci]"; echo "cleared reviewed for $id"
else
  jq --arg id "$id" --arg at "$ts" '.[$id] = {reviewed:true, at:$at}' "$REVIEWS" >"$tmp" && mv "$tmp" "$REVIEWS" || { rm -f "$tmp"; die "failed to update $REVIEWS"; }
  msg="reviewed: $id [skip ci]"; echo "marked $id reviewed"
fi

rel="${REVIEWS#"$ROOT"/}"
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
