#!/usr/bin/env bash
#
# loop-auto-deploy.test.sh — hermetic test for loop.sh's site_touched_since_last_deploy() (the
# T267 auto-deploy-on-empty-backlog fallback). Runs entirely inside a throwaway `mktemp -d` git
# repo — NEVER touches this checkout's real git history or remote, and NEVER invokes `vercel`/
# `curl` (run_auto_deploy() itself is intentionally not exercised here — it makes real network
# calls and belongs to manual/production verification, not a hermetic unit test).
#
# Usage: bash .harness/loop-auto-deploy.test.sh
set -euo pipefail

REAL_HARNESS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILURES=0

fail() { echo "FAIL: $*" >&2; FAILURES=$((FAILURES + 1)); }
pass() { echo "pass: $*"; }

# new_fixture <mode> — build a throwaway repo with loop.sh copied in.
#   mode=none      → TASKS.json has NO deploy task at all.
#   mode=no-diff   → TASKS.json has a done deploy task (T1); HEAD IS its mark-done commit.
#   mode=with-diff → same as no-diff, plus one more commit touching src/ after it.
#   mode=harness-only-diff → same as no-diff, plus one more commit touching ONLY .harness/ after it.
new_fixture() {
  local mode="$1" work
  work="$(mktemp -d)"
  git -C "$work" init -q -b main
  git -C "$work" config user.email "harness-test@example.com"
  git -C "$work" config user.name "Harness Test"
  mkdir -p "$work/.harness" "$work/src" "$work/public"
  cp "$REAL_HARNESS/loop.sh" "$work/.harness/loop.sh"
  chmod +x "$work/.harness/loop.sh"
  echo "v1" >"$work/src/placeholder.txt"

  if [ "$mode" = "none" ]; then
    cat >"$work/.harness/TASKS.json" <<'JSON'
{ "tasks": [] }
JSON
    git -C "$work" add -A
    git -C "$work" commit -q -m "fixture init (no deploy task)"
  else
    cat >"$work/.harness/TASKS.json" <<'JSON'
{
  "tasks": [
    { "id": "T1", "title": "Deploy pending site changes to production", "status": "done", "gate": null, "dependsOn": [] }
  ]
}
JSON
    git -C "$work" add -A
    git -C "$work" commit -q -m "T1: mark done"

    if [ "$mode" = "with-diff" ]; then
      echo "v2" >"$work/src/placeholder.txt"
      git -C "$work" add -A
      git -C "$work" commit -q -m "later change to src"
    elif [ "$mode" = "harness-only-diff" ]; then
      echo "some note" >"$work/.harness/scratch.md"
      git -C "$work" add -A
      git -C "$work" commit -q -m "later change to .harness only"
    fi
  fi
  echo "$work"
}

# check_site_touched <work> — echoes "0" (deploy warranted) or "1" (skip), isolated in a subshell
# so loop.sh's own `set -euo pipefail` (armed by sourcing it) never leaks into this test script's
# control flow. The `if` wrapping is deliberate — see this repo's own incident log on bare
# `cmd; rc=$?` tripping errexit; an `if` condition is the safe form regardless.
check_site_touched() {
  local work="$1"
  (
    cd "$work"
    LOOP_SOURCE_ONLY=1 source .harness/loop.sh
    if site_touched_since_last_deploy >/dev/null 2>&1; then echo 0; else echo 1; fi
  )
}

cleanup() { [ -n "${WORK:-}" ] && rm -rf "$WORK"; return 0; }
trap cleanup EXIT

# --- Test (c): no prior completed deploy task at all → fail OPEN (0, deploy warranted) ---------
WORK="$(new_fixture none)"
rc="$(check_site_touched "$WORK")"
if [ "$rc" = "0" ]; then pass "no prior deploy task → fails open (deploy warranted)"; else fail "no prior deploy task → expected 0 (fail open), got $rc"; fi
rm -rf "$WORK"

# --- Test (a): prior deploy task done, HEAD IS its own commit, no src/public diff → skip (1) ----
WORK="$(new_fixture no-diff)"
rc="$(check_site_touched "$WORK")"
if [ "$rc" = "1" ]; then pass "no src/public diff since last deploy → skip"; else fail "no diff case → expected 1 (skip), got $rc"; fi
rm -rf "$WORK"

# --- Test (b): a real src/ change landed after the last deploy commit → deploy warranted (0) ----
WORK="$(new_fixture with-diff)"
rc="$(check_site_touched "$WORK")"
if [ "$rc" = "0" ]; then pass "src/ changed since last deploy → deploy warranted"; else fail "src diff case → expected 0 (deploy), got $rc"; fi
rm -rf "$WORK"

# --- Bonus: a change ONLY under .harness/ (not src/public) must NOT trigger a deploy -------------
WORK="$(new_fixture harness-only-diff)"
rc="$(check_site_touched "$WORK")"
if [ "$rc" = "1" ]; then pass "harness-only change since last deploy → correctly ignored (skip)"; else fail "harness-only diff case → expected 1 (skip), got $rc"; fi
rm -rf "$WORK"

WORK=""
echo "---"
if [ "$FAILURES" -eq 0 ]; then echo "ALL PASS"; exit 0; else echo "$FAILURES FAILURE(S)"; exit 1; fi
