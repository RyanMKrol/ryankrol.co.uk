#!/usr/bin/env bash
#
# mark-done-bulk.test.sh — hermetic test proving mark-done.sh / mark-reviewed.sh do their git
# add/commit exactly ONCE per invocation regardless of how many ids they're given, and that
# fail-fast validation aborts a whole batch atomically on any bad id. Runs entirely inside a
# throwaway `mktemp -d` git repo — NEVER touches this checkout's real git history, never pushes
# to a real remote (always NO_PUSH=1).
#
# Usage: bash .harness/mark-done-bulk.test.sh
set -euo pipefail

REAL_HARNESS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILURES=0

fail() { echo "FAIL: $*" >&2; FAILURES=$((FAILURES + 1)); }
pass() { echo "pass: $*"; }

# commit_count <repo> — number of commits reachable from HEAD.
commit_count() { git -C "$1" rev-list --count HEAD 2>/dev/null || echo 0; }

# new_fixture — build a fresh throwaway repo with loop.sh/mark-done.sh/mark-reviewed.sh copied in
# and a minimal TASKS.json (T1/T2 = needs-human, T3 = gate:null, for negative tests). Echoes its path.
new_fixture() {
  local work; work="$(mktemp -d)"
  git -C "$work" init -q -b main
  git -C "$work" config user.email "harness-test@example.com"
  git -C "$work" config user.name "Harness Test"
  mkdir -p "$work/.harness"
  cp "$REAL_HARNESS/loop.sh" "$work/.harness/loop.sh"
  cp "$REAL_HARNESS/mark-done.sh" "$work/.harness/mark-done.sh"
  cp "$REAL_HARNESS/mark-reviewed.sh" "$work/.harness/mark-reviewed.sh"
  chmod +x "$work/.harness/loop.sh" "$work/.harness/mark-done.sh" "$work/.harness/mark-reviewed.sh"
  cat >"$work/.harness/TASKS.json" <<'JSON'
{
  "tasks": [
    { "id": "T1", "status": "pending", "gate": "needs-human", "dependsOn": [] },
    { "id": "T2", "status": "pending", "gate": "needs-human", "dependsOn": [] },
    { "id": "T3", "status": "pending", "gate": null, "dependsOn": [] }
  ]
}
JSON
  git -C "$work" add -A
  git -C "$work" commit -q -m "fixture init"
  echo "$work"
}

cleanup() { [ -n "${WORK:-}" ] && rm -rf "$WORK"; return 0; }
trap cleanup EXIT

# --- Test 1: mark-done.sh with 2 ids → exactly ONE new commit, both ids done ------------------
WORK="$(new_fixture)"
before="$(commit_count "$WORK")"
NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" T1 T2 >/dev/null
after="$(commit_count "$WORK")"
if [ "$((after - before))" -eq 1 ]; then pass "mark-done.sh T1 T2 → exactly 1 new commit"; else fail "mark-done.sh T1 T2 → expected 1 new commit, got $((after - before))"; fi
if git -C "$WORK" show --stat HEAD | grep -q "human-done.json"; then pass "commit touches human-done.json"; else fail "commit does not touch human-done.json"; fi
d1="$(jq -r '.T1.done' "$WORK/.harness/human-done.json")"
d2="$(jq -r '.T2.done' "$WORK/.harness/human-done.json")"
if [ "$d1" = "true" ] && [ "$d2" = "true" ]; then pass "both T1 and T2 marked done:true"; else fail "T1/T2 not both done:true (got T1=$d1 T2=$d2)"; fi
rm -rf "$WORK"

# --- Test 2: mark-reviewed.sh with 2 ids → exactly ONE new commit, both ids reviewed -----------
WORK="$(new_fixture)"
before="$(commit_count "$WORK")"
NO_PUSH=1 bash "$WORK/.harness/mark-reviewed.sh" T1 T2 >/dev/null
after="$(commit_count "$WORK")"
if [ "$((after - before))" -eq 1 ]; then pass "mark-reviewed.sh T1 T2 → exactly 1 new commit"; else fail "mark-reviewed.sh T1 T2 → expected 1 new commit, got $((after - before))"; fi
r1="$(jq -r '.T1.reviewed' "$WORK/.harness/reviews.json")"
r2="$(jq -r '.T2.reviewed' "$WORK/.harness/reviews.json")"
if [ "$r1" = "true" ] && [ "$r2" = "true" ]; then pass "both T1 and T2 marked reviewed:true"; else fail "T1/T2 not both reviewed:true (got T1=$r1 T2=$r2)"; fi
rm -rf "$WORK"

# --- Test 3: single-id call form still behaves identically (compat) ---------------------------
WORK="$(new_fixture)"
NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" T1 >/dev/null
msg="$(git -C "$WORK" log -1 --format=%s)"
if [ "$msg" = "human-done: T1 [skip ci]" ]; then pass "single-id commit message format unchanged"; else fail "single-id commit message changed: got '$msg'"; fi
NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" --undo T1 >/dev/null
msg="$(git -C "$WORK" log -1 --format=%s)"
if [ "$msg" = "human-done: clear T1 [skip ci]" ]; then pass "single-id --undo commit message format unchanged"; else fail "single-id --undo commit message changed: got '$msg'"; fi
rm -rf "$WORK"

# --- Test 4: multi-id --undo ---------------------------------------------------------------
WORK="$(new_fixture)"
NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" T1 T2 >/dev/null
before="$(commit_count "$WORK")"
NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" --undo T1 T2 >/dev/null
after="$(commit_count "$WORK")"
if [ "$((after - before))" -eq 1 ]; then pass "mark-done.sh --undo T1 T2 → exactly 1 new commit"; else fail "--undo T1 T2 → expected 1 new commit, got $((after - before))"; fi
if [ "$(jq -r 'has("T1") or has("T2")' "$WORK/.harness/human-done.json")" = "false" ]; then pass "both T1 and T2 cleared from human-done.json"; else fail "T1/T2 not both cleared"; fi
rm -rf "$WORK"

# --- Test 5: fail-fast/atomic validation — one bad id in a batch aborts the WHOLE call ---------
# 5a: nonexistent task id
WORK="$(new_fixture)"
before="$(commit_count "$WORK")"
if NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" T1 T999 >/dev/null 2>&1; then fail "mark-done.sh T1 T999 (T999 doesn't exist) should have failed but exited 0"; else pass "mark-done.sh T1 T999 correctly rejected"; fi
after="$(commit_count "$WORK")"
if [ "$after" -eq "$before" ]; then pass "no new commit after rejected batch (nonexistent id)"; else fail "a commit was created despite rejected batch"; fi
if [ ! -f "$WORK/.harness/human-done.json" ]; then pass "human-done.json not created after rejected batch"; else fail "human-done.json was created despite rejected batch"; fi
rm -rf "$WORK"

# 5b: valid id + a task that isn't gate:needs-human (T3 is gate:null)
WORK="$(new_fixture)"
before="$(commit_count "$WORK")"
if NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" T1 T3 >/dev/null 2>&1; then fail "mark-done.sh T1 T3 (T3 is gate:null) should have failed but exited 0"; else pass "mark-done.sh T1 T3 correctly rejected (T3 not needs-human)"; fi
after="$(commit_count "$WORK")"
if [ "$after" -eq "$before" ]; then pass "no new commit after rejected batch (non-needs-human id)"; else fail "a commit was created despite rejected batch"; fi
rm -rf "$WORK"

# 5c: same, but overlay already has prior content — assert it's byte-unchanged after a rejected batch
WORK="$(new_fixture)"
NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" T1 >/dev/null
before_hash="$(shasum "$WORK/.harness/human-done.json" | awk '{print $1}')"
before="$(commit_count "$WORK")"
NO_PUSH=1 bash "$WORK/.harness/mark-done.sh" T2 T999 >/dev/null 2>&1 || true
after_hash="$(shasum "$WORK/.harness/human-done.json" | awk '{print $1}')"
after="$(commit_count "$WORK")"
if [ "$before_hash" = "$after_hash" ]; then pass "human-done.json byte-unchanged after rejected batch"; else fail "human-done.json content changed despite rejected batch"; fi
if [ "$after" -eq "$before" ]; then pass "no new commit after rejected batch (existing overlay)"; else fail "a commit was created despite rejected batch"; fi
rm -rf "$WORK"

# --- Test 6: dashboard bulk handler calls runScript exactly once per POST (static check) -------
if grep -c "runScript(" "$REAL_HARNESS/dashboard/server.js" | grep -q . && \
   ! grep -A3 "mark-done-bulk.*mark-reviewed-bulk" "$REAL_HARNESS/dashboard/server.js" | grep -qE "for \(|\.forEach\("; then
  pass "dashboard bulk handler has no per-id loop around runScript"
else
  fail "dashboard bulk handler still loops runScript per id"
fi

WORK=""
echo "---"
if [ "$FAILURES" -eq 0 ]; then echo "ALL PASS"; exit 0; else echo "$FAILURES FAILURE(S)"; exit 1; fi
