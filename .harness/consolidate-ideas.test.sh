#!/usr/bin/env bash
#
# consolidate-ideas.test.sh — hermetic test for consolidate-ideas.mjs's deploy-task-convention
# enforcement (T268): every pending-tasks unit with a site-touching task must end up tracked by
# exactly one pending "Deploy pending site changes to production" task. Runs entirely inside a
# throwaway `mktemp -d` git repo — NEVER touches this checkout's real TASKS.json/IDEAS.md, and
# invokes consolidate-ideas.mjs directly (it does no git operations itself — only its shell
# wrapper, consolidate-ideas.sh, does — so no lock/remote setup is needed for this unit test).
#
# Usage: bash .harness/consolidate-ideas.test.sh
set -euo pipefail

REAL_HARNESS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILURES=0

fail() { echo "FAIL: $*" >&2; FAILURES=$((FAILURES + 1)); }
pass() { echo "pass: $*"; }

# new_fixture — throwaway git repo with consolidate-ideas.mjs copied in and a minimal TASKS.json/
# IDEAS.md. Echoes its path. Caller adds its own TASKS.json content + .pending-tasks/*.json files
# before running the script.
new_fixture() {
  local work; work="$(mktemp -d)"
  git -C "$work" init -q -b main
  git -C "$work" config user.email "harness-test@example.com"
  git -C "$work" config user.name "Harness Test"
  mkdir -p "$work/.harness/.pending-tasks" "$work/.harness/tasks"
  cp "$REAL_HARNESS/consolidate-ideas.mjs" "$work/.harness/consolidate-ideas.mjs"
  cat >"$work/.harness/IDEAS.md" <<'MD'
# Ideas inbox

## Inbox
MD
  git -C "$work" add -A
  git -C "$work" commit -q -m "fixture init"
  echo "$work"
}

run_consolidate() { (cd "$1" && node .harness/consolidate-ideas.mjs >/dev/null 2>&1); }

cleanup() { [ -n "${WORK:-}" ] && rm -rf "$WORK"; return 0; }
trap cleanup EXIT

# --- Test (a): site-touching task, NO existing pending deploy task → a new one is created -------
WORK="$(new_fixture)"
cat >"$WORK/.harness/TASKS.json" <<'JSON'
{ "tasks": [] }
JSON
cat >"$WORK/.harness/.pending-tasks/unit-a.json" <<'JSON'
{
  "agentSlug": "unit-a",
  "ideaBullets": ["some idea"],
  "tasks": [
    { "tempId": "unit-a-1", "title": "Do a site thing", "dependsOn": [], "gate": null,
      "tags": [], "facets": {"layer":"ui","workType":"feature","risk":[]},
      "scope": ["src/pages/foo.js"], "design": null, "verify": [], "expectsTest": false,
      "specDo": "do the thing", "specDoneWhen": "thing is done" }
  ],
  "report": "test fixture"
}
JSON
run_consolidate "$WORK"
deployCount="$(jq -r '[.tasks[]|select(.title=="Deploy pending site changes to production")]|length' "$WORK/.harness/TASKS.json")"
if [ "$deployCount" = "1" ]; then pass "(a) exactly one deploy task created"; else fail "(a) expected 1 deploy task, got $deployCount"; fi
deployId="$(jq -r '.tasks[]|select(.title=="Deploy pending site changes to production")|.id' "$WORK/.harness/TASKS.json")"
siteTaskId="$(jq -r '.tasks[]|select(.title=="Do a site thing")|.id' "$WORK/.harness/TASKS.json")"
dependsOk="$(jq -r --arg d "$deployId" --arg s "$siteTaskId" '.tasks[]|select(.id==$d)|.dependsOn|index($s)!=null' "$WORK/.harness/TASKS.json")"
if [ "$dependsOk" = "true" ]; then pass "(a) new deploy task depends on the site-touching task"; else fail "(a) new deploy task's dependsOn missing the site-touching task"; fi
if [ -f "$WORK/.harness/tasks/$deployId.md" ]; then pass "(a) deploy task's spec md was written"; else fail "(a) deploy task's spec md is missing"; fi
deployGate="$(jq -r --arg d "$deployId" '.tasks[]|select(.id==$d)|.gate' "$WORK/.harness/TASKS.json")"
deployScope="$(jq -r --arg d "$deployId" '.tasks[]|select(.id==$d)|.scope|length' "$WORK/.harness/TASKS.json")"
if [ "$deployGate" = "null" ] && [ "$deployScope" = "0" ]; then pass "(a) new deploy task has gate:null and empty scope"; else fail "(a) new deploy task shape wrong (gate=$deployGate scope_len=$deployScope)"; fi
rm -rf "$WORK"

# --- Test (b): site-touching task, an EXISTING pending deploy task → gains a dependsOn, no 2nd ---
WORK="$(new_fixture)"
cat >"$WORK/.harness/TASKS.json" <<'JSON'
{
  "tasks": [
    { "id": "T1", "title": "Some earlier task", "status": "done", "gate": null, "dependsOn": [],
      "tags": [], "scope": ["src/pages/bar.js"], "design": null, "verify": [], "expectsTest": false,
      "spec": ".harness/tasks/T1.md", "facets": {"layer":"ui","workType":"feature","risk":[]} },
    { "id": "T2", "title": "Deploy pending site changes to production", "status": "pending",
      "gate": null, "dependsOn": ["T1"], "tags": ["deploy"], "scope": [], "design": null,
      "verify": [], "expectsTest": false, "spec": ".harness/tasks/T2.md" }
  ]
}
JSON
cat >"$WORK/.harness/.pending-tasks/unit-b.json" <<'JSON'
{
  "agentSlug": "unit-b",
  "ideaBullets": ["another idea"],
  "tasks": [
    { "tempId": "unit-b-1", "title": "Do another site thing", "dependsOn": [], "gate": null,
      "tags": [], "facets": {"layer":"ui","workType":"feature","risk":[]},
      "scope": ["src/pages/baz.js"], "design": null, "verify": [], "expectsTest": false,
      "specDo": "do another thing", "specDoneWhen": "thing is done" }
  ],
  "report": "test fixture"
}
JSON
run_consolidate "$WORK"
deployCount="$(jq -r '[.tasks[]|select(.title=="Deploy pending site changes to production")]|length' "$WORK/.harness/TASKS.json")"
if [ "$deployCount" = "1" ]; then pass "(b) still exactly one deploy task (no second one created)"; else fail "(b) expected 1 deploy task, got $deployCount"; fi
newSiteTaskId="$(jq -r '.tasks[]|select(.title=="Do another site thing")|.id' "$WORK/.harness/TASKS.json")"
t2Depends="$(jq -r '.tasks[]|select(.id=="T2")|.dependsOn' "$WORK/.harness/TASKS.json")"
hasOld="$(echo "$t2Depends" | jq 'index("T1")!=null')"
hasNew="$(jq -r --arg s "$newSiteTaskId" '.tasks[]|select(.id=="T2")|.dependsOn|index($s)!=null' "$WORK/.harness/TASKS.json")"
if [ "$hasOld" = "true" ] && [ "$hasNew" = "true" ]; then pass "(b) T2's dependsOn preserved old id AND gained the new site-touching id"; else fail "(b) T2 dependsOn wrong (hasOld=$hasOld hasNew=$hasNew): $t2Depends"; fi
rm -rf "$WORK"

# --- Test (c): task's scope is entirely under .harness/ → no deploy task created at all ----------
WORK="$(new_fixture)"
cat >"$WORK/.harness/TASKS.json" <<'JSON'
{ "tasks": [] }
JSON
cat >"$WORK/.harness/.pending-tasks/unit-c.json" <<'JSON'
{
  "agentSlug": "unit-c",
  "ideaBullets": ["a harness-only idea"],
  "tasks": [
    { "tempId": "unit-c-1", "title": "Do a harness-only thing", "dependsOn": [], "gate": "needs-human",
      "tags": [], "scope": [".harness/some-script.sh"], "design": null, "verify": [], "expectsTest": false,
      "specDo": "do the harness thing", "specDoneWhen": "thing is done" }
  ],
  "report": "test fixture"
}
JSON
run_consolidate "$WORK"
deployCount="$(jq -r '[.tasks[]|select(.title=="Deploy pending site changes to production")]|length' "$WORK/.harness/TASKS.json")"
if [ "$deployCount" = "0" ]; then pass "(c) harness-only scope → no deploy task created"; else fail "(c) expected 0 deploy tasks, got $deployCount"; fi
rm -rf "$WORK"

# --- Bonus: scope:[] (e.g. an operational-only task) also does NOT count as site-touching --------
WORK="$(new_fixture)"
cat >"$WORK/.harness/TASKS.json" <<'JSON'
{ "tasks": [] }
JSON
cat >"$WORK/.harness/.pending-tasks/unit-d.json" <<'JSON'
{
  "agentSlug": "unit-d",
  "ideaBullets": ["an empty-scope idea"],
  "tasks": [
    { "tempId": "unit-d-1", "title": "Purely operational task", "dependsOn": [], "gate": null,
      "tags": [], "facets": {"layer":"harness","workType":"config","risk":[]},
      "scope": [], "design": null, "verify": [], "expectsTest": false,
      "specDo": "do it", "specDoneWhen": "done" }
  ],
  "report": "test fixture"
}
JSON
run_consolidate "$WORK"
deployCount="$(jq -r '[.tasks[]|select(.title=="Deploy pending site changes to production")]|length' "$WORK/.harness/TASKS.json")"
if [ "$deployCount" = "0" ]; then pass "(bonus) scope:[] → no deploy task created"; else fail "(bonus) expected 0 deploy tasks, got $deployCount"; fi
rm -rf "$WORK"

WORK=""
echo "---"
if [ "$FAILURES" -eq 0 ]; then echo "ALL PASS"; exit 0; else echo "$FAILURES FAILURE(S)"; exit 1; fi
