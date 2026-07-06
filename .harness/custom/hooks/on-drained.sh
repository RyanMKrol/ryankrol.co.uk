#!/usr/bin/env bash
#
# on-drained.sh — fires when the loop finishes with nothing left to build.
#   $1                     "drained" (backlog exhausted) or "idle" (agent had nothing to do)
#   $HARNESS_ROOT          repo root (exported by loop.sh's run_hook)
#   $HARNESS_DIR           the .harness directory
#   $HARNESS_MAIN_BRANCH   main branch name
#
# WHAT IT DOES: deploys the site to production (Vercel) when src/ or public/ changed since the last
# successful deploy, then records the deployed commit in custom/last-deploy.json. This is the SOLE
# deploy mechanism (Vercel's Git integration is disconnected — see root CLAUDE.md "Deploying"), moved
# out of loop.sh into this hook so the loop stays pristine and upgrades cleanly.
#
# CONTRACT: run_hook invokes this on BOTH the drain and idle exits, and it can fire once per loop
# cycle (every supervise re-run while the backlog is done) — so it MUST be cheap + idempotent. It is:
# site_touched_since_last_deploy() gates the (expensive) deploy on an actual src/public diff, so
# repeated drains after a deploy are no-ops. Runs as a child process and is non-fatal — a nonzero
# exit is logged by run_hook and ignored; it can never block or corrupt the loop.
#
# Ported verbatim (behaviour-preserving) from the pre-canonical loop.sh run_auto_deploy() +
# site_touched_since_last_deploy(); the only changes are: derives context from $HARNESS_* instead of
# loop internals, reads/writes the marker at custom/last-deploy.json, and pushes with a plain
# `git push` instead of loop.sh's throttled_push (PUSH_COOLDOWN is off — Vercel Git is disconnected).
set -uo pipefail

ROOT="${HARNESS_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null)}"
HARNESS_DIR="${HARNESS_DIR:-$ROOT/.harness}"
MAIN_BRANCH="${HARNESS_MAIN_BRANCH:-main}"
LAST_DEPLOY="$HARNESS_DIR/custom/last-deploy.json"

hlog() { echo "[on-drained] $*"; }

# site_touched_since_last_deploy — 0 (deploy) / 1 (skip). Fails OPEN (deploy) if the marker is
# missing/unreadable — correct for the first deploy under this mechanism.
site_touched_since_last_deploy() {
  local last_sha
  if [ ! -f "$LAST_DEPLOY" ]; then
    hlog "no $LAST_DEPLOY marker yet — treating as site-touching changed (fail open)."; return 0
  fi
  last_sha="$(jq -r '.sha // empty' "$LAST_DEPLOY" 2>/dev/null || true)"
  if [ -z "$last_sha" ]; then
    hlog "$LAST_DEPLOY has no .sha — treating as site-touching changed (fail open)."; return 0
  fi
  if git -C "$ROOT" diff --quiet "$last_sha" HEAD -- src public 2>/dev/null; then
    hlog "no src/public changes since last deploy ($last_sha) — nothing to deploy."; return 1
  fi
  hlog "src/public changed since last deploy ($last_sha) — deploy warranted."; return 0
}

# run_auto_deploy — vercel --prod + HTTP-200 verification; on success writes/commits/pushes the
# marker. Leaves the marker untouched on failure so the next drain retries against the same diff.
run_auto_deploy() {
  if ! vercel whoami >/dev/null 2>&1; then
    hlog "'vercel whoami' failed (not logged in) — skipping; run 'vercel login' to enable."; return 1
  fi
  local deployed_sha out url code
  deployed_sha="$(git -C "$ROOT" rev-parse HEAD)"
  out="$(vercel --prod --yes 2>&1)" || { hlog "'vercel --prod --yes' failed: $out"; return 1; }
  url="$(printf '%s\n' "$out" | tail -1)"
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
  if [ "$code" != "200" ]; then
    # the raw per-deployment URL can 302 under deployment-protection/SSO — recheck the aliased domain.
    code="$(curl -s -o /dev/null -w '%{http_code}' "https://www.ryankrol.co.uk" 2>/dev/null || true)"
    url="https://www.ryankrol.co.uk"
  fi
  if [ "$code" != "200" ]; then
    hlog "deploy ran but verification returned '$code' (expected 200) for $url."; return 1
  fi
  hlog "SUCCESS — $url returned 200."
  jq -n --arg sha "$deployed_sha" --arg deployedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg url "$url" \
    '{sha: $sha, deployedAt: $deployedAt, url: $url}' >"$LAST_DEPLOY"
  git -C "$ROOT" add "$LAST_DEPLOY" 2>/dev/null || true
  git -C "$ROOT" commit -q -m "auto-deploy: update last-deploy marker to $(git -C "$ROOT" rev-parse --short "$deployed_sha") [skip ci]" 2>/dev/null || true
  git -C "$ROOT" push 2>/dev/null || hlog "WARN: deployed OK but couldn't push the marker — next drain will redeploy until it pushes."
  return 0
}

# Allow the test to source this file (to exercise site_touched_since_last_deploy) without deploying.
(return 0 2>/dev/null) && SOURCED=1 || SOURCED=0
if [ "$SOURCED" -eq 0 ]; then
  reason="${1:-drained}"
  hlog "reason=$reason — checking whether a deploy is warranted."
  if site_touched_since_last_deploy; then
    run_auto_deploy || hlog "deploy did not complete — marker left stale; will retry next drain."
  fi
fi
