#!/usr/bin/env bash
#
# integrate.sh — refresh the running product so the live site matches `main` after a task
# integrates. loop.sh runs this via INTEGRATE_HOOK (set in harness.env) on each CI-green task,
# from the repo root.
#
# This site is deployed by Vercel, which automatically builds and deploys every push to `main`
# (the loop pushes after green CI). There is therefore NOTHING to rebuild or restart locally —
# the live deploy happens on Vercel's side. This hook is intentionally a no-op; it exists so the
# INTEGRATE_HOOK path is always valid and so there's an obvious place to add a local refresh step
# later if one is ever needed.
set -uo pipefail
echo "[integrate] no-op — Vercel auto-deploys main on push; nothing to refresh locally"
exit 0
