#!/usr/bin/env bash
#
# on-drained.test.sh — hermetic test for custom/hooks/on-drained.sh's
# site_touched_since_last_deploy() (the deploy-on-drain gate; the SOLE deploy mechanism now lives in
# the on-drained lifecycle hook, extracted out of loop.sh so the loop stays pristine). Runs entirely
# inside a throwaway `mktemp -d` git repo — NEVER touches this checkout's real git history or remote,
# and NEVER invokes `vercel`/`curl` (run_auto_deploy() makes real network calls and belongs to
# manual/production verification, not a hermetic unit test).
#
# Usage: bash .harness/custom/on-drained.test.sh
set -euo pipefail

HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/hooks/on-drained.sh"
FAILURES=0
fail() { echo "FAIL: $*" >&2; FAILURES=$((FAILURES + 1)); }
pass() { echo "pass: $*"; }

# new_fixture <mode> — throwaway repo. Baseline is one commit touching src/ ("deployed code");
# custom/last-deploy.json, when present, is written in a SEPARATE follow-up commit recording that
# baseline's sha — exactly how run_auto_deploy() records it for real.
#   mode=none              → no marker (never deployed before).
#   mode=no-diff           → marker present at baseline; HEAD is just the marker commit (.harness/ only).
#   mode=with-diff         → no-diff plus a later commit touching src/.
#   mode=harness-only-diff → no-diff plus a later commit touching ONLY .harness/.
new_fixture() {
  local mode="$1" work sha_a
  work="$(mktemp -d)"
  git -C "$work" init -q -b main
  git -C "$work" config user.email "harness-test@example.com"
  git -C "$work" config user.name "Harness Test"
  mkdir -p "$work/.harness/custom/hooks" "$work/src" "$work/public"
  cp "$HOOK" "$work/.harness/custom/hooks/on-drained.sh"
  echo "v1" >"$work/src/placeholder.txt"
  git -C "$work" add -A
  git -C "$work" commit -q -m "fixture init (deployed code)"
  sha_a="$(git -C "$work" rev-parse HEAD)"

  if [ "$mode" = "none" ]; then echo "$work"; return 0; fi

  cat >"$work/.harness/custom/last-deploy.json" <<JSON
{"sha": "$sha_a", "deployedAt": "2026-01-01T00:00:00Z", "url": "https://example.com"}
JSON
  git -C "$work" add -A
  git -C "$work" commit -q -m "auto-deploy: update last-deploy marker to ${sha_a:0:7} [skip ci]"

  if [ "$mode" = "with-diff" ]; then
    echo "v2" >"$work/src/placeholder.txt"; git -C "$work" add -A; git -C "$work" commit -q -m "later src change"
  elif [ "$mode" = "harness-only-diff" ]; then
    echo "some note" >"$work/.harness/scratch.md"; git -C "$work" add -A; git -C "$work" commit -q -m "later .harness-only change"
  fi
  echo "$work"
}

# check_site_touched <work> — echoes "0" (deploy warranted) or "1" (skip). Sources the hook (which
# self-guards against running the deploy when sourced) in a subshell so its `set -uo pipefail` never
# leaks into this script's control flow. The `if` wrapping is the errexit-safe form (see this repo's
# incident log on bare `cmd; rc=$?` tripping errexit).
check_site_touched() {
  local work="$1"
  (
    cd "$work"
    HARNESS_ROOT="$work" HARNESS_DIR="$work/.harness" HARNESS_MAIN_BRANCH="main" \
      source .harness/custom/hooks/on-drained.sh
    if site_touched_since_last_deploy >/dev/null 2>&1; then echo 0; else echo 1; fi
  )
}

cleanup() { [ -n "${WORK:-}" ] && rm -rf "$WORK"; return 0; }
trap cleanup EXIT

WORK="$(new_fixture none)";              rc="$(check_site_touched "$WORK")"
[ "$rc" = "0" ] && pass "no marker → fails open (deploy warranted)" || fail "no marker → expected 0, got $rc"; rm -rf "$WORK"
WORK="$(new_fixture no-diff)";           rc="$(check_site_touched "$WORK")"
[ "$rc" = "1" ] && pass "no src/public diff → skip" || fail "no-diff → expected 1, got $rc"; rm -rf "$WORK"
WORK="$(new_fixture with-diff)";         rc="$(check_site_touched "$WORK")"
[ "$rc" = "0" ] && pass "src/ changed → deploy warranted" || fail "with-diff → expected 0, got $rc"; rm -rf "$WORK"
WORK="$(new_fixture harness-only-diff)"; rc="$(check_site_touched "$WORK")"
[ "$rc" = "1" ] && pass "harness-only change → ignored (skip)" || fail "harness-only → expected 1, got $rc"; rm -rf "$WORK"

WORK=""
echo "---"
if [ "$FAILURES" -eq 0 ]; then echo "ALL PASS"; exit 0; else echo "$FAILURES FAILURE(S)"; exit 1; fi
