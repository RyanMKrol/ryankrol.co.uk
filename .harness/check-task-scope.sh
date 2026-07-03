#!/usr/bin/env bash
#
# check-task-scope.sh — ADVISORY scan for the "spec asks for an edit the scope doesn't cover" bug
# (first caught in T141 and T147: the "## Do" section instructed removing/editing something in a
# specific file, but that file was never added to the task's `scope` array, so the loop's structural
# scope-gate correctly refused the edit and the builder reported failed:blocked instead of faking
# success). See `.harness/CLAUDE.md`'s "Scope-coverage gaps" section for the full story.
#
# This is a HEURISTIC, NOT a hard gate: it extracts backtick-quoted, repo-path-shaped tokens
# (`src/...`, `.harness/...`, `public/...`) from a task's spec.md and flags any not covered by that
# task's `scope` (exact path or directory-prefix match, same rule the loop's structural gate uses).
# It cannot tell "edit this" from "read this for context" or "do NOT touch this" — every hit is a
# candidate for a HUMAN (or the authoring LLM) to eyeball, not an automatic failure. Expect noise;
# that's fine, the cost of a false positive here is one line of review, the cost of a false negative
# is another failed:blocked loop iteration.
#
# Usage:
#   .harness/check-task-scope.sh            # scan every pending, non-needs-human task
#   .harness/check-task-scope.sh T171        # scan one task
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
TASKS_JSON="$HERE/TASKS.json"

check_one() {
  local id="$1"
  local spec_rel spec_abs scope_json
  spec_rel="$(jq -r --arg id "$id" '.tasks[]|select(.id==$id)|.spec // empty' "$TASKS_JSON")"
  if [ -z "$spec_rel" ]; then
    echo "SKIP $id — task not found in TASKS.json"
    return
  fi
  spec_abs="$ROOT/$spec_rel"
  if [ ! -f "$spec_abs" ]; then
    echo "⚠ $id — spec file missing: $spec_rel"
    return
  fi
  scope_json="$(jq -c --arg id "$id" '.tasks[]|select(.id==$id)|.scope // []' "$TASKS_JSON")"

  local any_missing=0

  # Form 1: full repo-relative paths under src/, .harness/, or public/, ending in a file extension —
  # e.g. `src/pages/_app.js`. Checked by exact match or scope directory-prefix match.
  local full_paths
  full_paths="$(grep -oE '`(src|\.harness|public)/[a-zA-Z0-9_./\[\]-]+\.[a-zA-Z0-9]+`' "$spec_abs" \
    | tr -d '`' | sort -u || true)"
  while IFS= read -r path; do
    [ -z "$path" ] && continue
    local covered
    covered="$(jq -r --arg p "$path" '
      any(.[]; . as $s |
        ($p == $s) or
        ($p | startswith(($s | rtrimstr("/**") | rtrimstr("/*") | rtrimstr("/")) + "/"))
      )' <<<"$scope_json")"
    if [ "$covered" != "true" ]; then
      echo "  ⚠ $id — spec mentions \`$path\`, not covered by scope $scope_json"
      any_missing=1
    fi
  done <<<"$full_paths"

  # Form 2: BARE filenames — e.g. `TmdbSearch.js`, `ReviewCard.js`. This is the form that actually
  # bit T151/T162/T163: specs very often refer to a component by bare filename once it's been
  # introduced with a full path earlier (in this spec or a dependency's), so Form 1 alone misses
  # most real cases. A bare filename is "covered" if ANY scope entry's basename matches it — we
  # can't know the intended directory from the bare name alone, so this errs toward flagging (a
  # same-named file the task doesn't mean will occasionally false-positive; that's an acceptable
  # cost per this script's own documented false-positive tolerance above).
  local bare_names
  bare_names="$(grep -oE '`[A-Za-z0-9_-]+\.(js|jsx|ts|tsx|css|json|md)`' "$spec_abs" \
    | tr -d '`' | sort -u || true)"
  while IFS= read -r name; do
    [ -z "$name" ] && continue
    local covered
    covered="$(jq -r --arg n "$name" '
      any(.[]; (. | split("/") | last) == $n)
    ' <<<"$scope_json")"
    if [ "$covered" != "true" ]; then
      echo "  ⚠ $id — spec mentions \`$name\` (bare filename), no scope entry's basename matches $scope_json"
      any_missing=1
    fi
  done <<<"$bare_names"

  if [ "$any_missing" -eq 0 ]; then
    echo "  ✓ $id — every mentioned path is covered by scope"
  fi
  return 0
}

if [ -n "${1:-}" ]; then
  check_one "$1"
else
  for id in $(jq -r '.tasks[]|select(.status=="pending" and .gate==null)|.id' "$TASKS_JSON"); do
    check_one "$id"
  done
fi
