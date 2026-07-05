# .harness/CLAUDE.md — rules for working *inside* the build harness

Loaded whenever Claude works with files in `.harness/` — notably when adding or editing backlog
tasks in `TASKS.json`. It keeps the harness's own authoring rules *with* the harness, so they travel
with it and surface at the authoring moment. (Repo-wide conventions are in the root `CLAUDE.md`; the
loop's design is in `HARNESS.md` + `designs/`.)

## ⚠️ Never let the autonomous loop modify itself — `.harness/`-scoped tasks are always `needs-human`

**Any task whose `scope` array contains an entry under `.harness/` (the loop's own scripts, the
`/convert-ideas` consolidation pipeline, `TASKS.json`'s own machinery, `facets.json`, etc.) MUST be
authored with `"gate": "needs-human"` — never `null`. No exceptions carved out for a harness change
that looks small or low-risk; the rule is mechanical, based on `scope` alone, not a judgment call
about how risky a given change looks.**

**Why:** the autonomous loop building or modifying the very mechanism that runs it is a uniquely
dangerous kind of self-referential change. A bug in application code gets caught by the loop's own
CI-gating/revert machinery — but a bug introduced INTO that machinery (`loop.sh`, the consolidation
scripts) can silently break the loop's own ability to detect, revert, or recover from that exact bug,
with no external safety net watching the watcher. This isn't a hypothetical concern for this repo —
it's already this project's consistent, unbroken practice: every single harness bug documented in the
"Known-but-deferred issues" log below (the `set -e` landmine, the `wait_ci_green` cancelled-run
conflation, the `mark_done` silent-no-op regression, the `[skip ci]` timeout waste) was found and
fixed by the OWNER in a directed interactive session — never by the autonomous loop building a task
against its own files. This convention just writes down, as a hard rule, what already happens in
practice.

**Mechanically, this is nothing new to build**: `needs-human` tasks are already, by this file's own
"Completing a `needs-human` task interactively" section below, built by the owner directly in
an interactive Claude Code session and hand-marked done — never routed through `loop.sh`. Marking a
harness-scoped task `needs-human` is exactly how you keep it out of the unattended loop's hands; no
new mechanism is needed, just consistent application of the existing one.

Per the schema floor below, a `needs-human` task carries **no** `facets` object — strip it if a task
is reclassified from buildable to `needs-human` (or vice versa, add one back from `facets.json`'s
vocabulary if a harness task is ever legitimately reclassified as buildable because its `scope` no
longer touches `.harness/`).

This does NOT apply to a task that merely *references* a `.harness/` path in its spec prose for
context (e.g. "mirrors the pattern in `.harness/tasks/T193.md`") without that path appearing in its
own `scope` array — the rule is about what the task is authorized to *edit*, not what it reads.

**`gate` is a binary schema — `null` or `"needs-human"`, full stop.** A third value, `"gate"` (meant
to mark "a human reviews the deliverable before dependents run"), previously existed but has been
removed entirely — from the schema, from `loop.sh`/`postflight.sh`'s scheduling and status-board
logic, and from every doc that described it. It never actually behaved differently from
`needs-human` in `select_task()` (both were skipped identically, forever, by the unattended loop —
see `HARNESS.md` §8 for the schema), so it added a distinction without a real mechanism backing it,
and it's gone now. If you find a stray `"gate": "gate"` anywhere (a task authored before this rule,
or a stale doc reference), normalize it: `null` if the task should be buildable by the loop, or
`"needs-human"` if a human genuinely must build it directly (which, per the rule above, is *always*
true for any `.harness/`-scoped task).

## Adding a backlog task → invoke the add-to-backlog skill

To add a task to the backlog, invoke the **`ralph-loop-add-to-backlog`** skill. It is the **single
source of authoring logic**: it assigns the task's **facets** (difficulty auto-tuning), pairs every
chooser task with a review task, runs the **poor-fit / layer-evolution gate**, and writes a
schema-correct task object + its `tasks/TNNN.md` spec. Prefer it over hand-editing `TASKS.json`.

**There must be AT MOST ONE deploy task in `TASKS.json` with `status: pending` at any time, full
stop — never one per idea, sweep, cluster, "body of work", or feature.** (See root `CLAUDE.md`'s
"Deploying" section for why a deploy task needs to exist at all — Vercel's Git integration is
disconnected, so nothing ships automatically anymore.) This was violated once already: a full
Collection-redesign sweep authored `T171` (deploy), then two LATER, entirely separate authoring
passes — an idea-conversion sweep and a perfume-card-variants chooser cluster, run independently —
each independently added their OWN new deploy task (`T193` and `T188`) because each pass reasoned
"my body of work needs its own deploy checkpoint," not noticing the other had just done the same
thing. Result: two pending deploy tasks sitting in the backlog side by side, silently double-booking
a real `vercel --prod` deploy. Caught by the owner, not by any authoring-time check — don't let it
recur.

**The actual rule, mechanically: before authoring ANY new task whose work changes the live site,
check for a pending deploy task first** (`jq -r '.tasks[]|select(.status=="pending" and (.title|test("^Deploy pending site changes to production$")))|.id' .harness/TASKS.json`
— note the exact canonical title, not a fuzzy "contains deploy" check, since a stray title match on
an unrelated task would misfire):
- **A pending one exists** → do NOT author a new deploy task. Add every new site-touching task's id
  to the EXISTING pending deploy task's `dependsOn` (merge, don't replace — union the ids). This
  applies regardless of whether your new tasks are thematically related to whatever's already in that
  `dependsOn` list — one deploy task accumulates dependencies from however many unrelated efforts
  land between deploys, that's the whole point of batching.
- **None is pending** (the most recent one already flipped to `status: done` — meaning it actually
  ran `vercel --prod` and shipped) → author a fresh one now, generically titled exactly **"Deploy
  pending site changes to production"** (not "Deploy `<feature>` to production" — the whole point of
  the generic title is that it's the one stable thing to `jq`-match against later; see `T193`'s
  current title for the corrected template, and its spec for the full worked example: `scope: []`,
  `"gate": null`, real `facets`, depends on every site-touching task since the last deploy).
  `vercel --prod` + checking its own exit code + a `curl` HTTP-200/content-marker check is entirely
  something the loop's own builder can do unattended (same as T083's autonomous production DynamoDB
  backfill) — never `needs-human`.

A pure-docs/harness-only task sequence (nothing under `src/`/`public/`) never needs to touch this at
all — it doesn't add to the deploy task's `dependsOn` and doesn't trigger creating one.
`layer`/`workType` won't map cleanly onto any existing `facets.json` value for the deploy task itself
(no code diff at all) — that's expected, pick the closest per the poor-fit protocol below and log it
to `facet-misfits.jsonl` rather than inventing a value.

**Belt-and-suspenders fallback: `.harness/loop.sh` also auto-deploys directly.** When the main loop's
`select_task()` finds nothing eligible left to build, it now calls `site_touched_since_last_deploy()`
(diffs `src`/`public` against the highest-numbered `done` "Deploy pending site changes to production"
task's own `mark done` commit, resolved from git history — not a new state file) and, if real site
files changed since then, runs `run_auto_deploy()` (the same `vercel --prod` + exit-code + `curl`
verification procedure `T193`'s spec already established) before exiting. This is explicitly a
**fallback, not a replacement** for the dedicated-task authoring convention above — it only catches
the case where that authoring-time step gets missed (the exact failure mode T171/T193/T188 hit), and
it fails open (treats "no prior deploy task found" or "can't resolve its commit" as "yes, deploy")
rather than silently skipping a first-ever or unresolvable case. Keep authoring pending deploy tasks
as before; this is a safety net sitting underneath that habit, not a substitute for it.

**Also enforced mechanically at authoring time: `/convert-ideas`'s consolidation pass.**
`.harness/consolidate-ideas.mjs` now checks, for every sweep, whether any of the tasks it's about to
merge into `TASKS.json` are "site-touching" (their `scope` has an entry not under `.harness/`). If
so, it automatically either adds their ids to the existing pending deploy task's `dependsOn`, or —
if none is pending — allocates a brand-new one itself (same shape as `T193`/`T216`/`T238`) and writes
its spec file, no separate authoring step required. This closes the exact gap that used to depend on
a human/agent remembering the rule above during every sweep (the actual root cause behind
T171/T193/T188). It is deliberately redundant with the `loop.sh`-level fallback just above — one
enforces at authoring time for `/convert-ideas` sweeps specifically, the other catches anything that
slips through any path (including tasks added directly via `ralph-loop-add-to-backlog`, outside
`/convert-ideas` entirely) — both exist, neither replaces the other.

## Ideas inbox & the two-step flow (ideas → tasks)

Tasks are NOT authored directly from a raw thought. A backlog task carries a high planning bar
(spec MD with `## Do`/`## Done when`, `scope`, `dependsOn`, `facets`, `verify`), so a half-formed
idea dumped straight in — especially several at once — produces rushed, low-quality specs. We split
capture from planning into **two deliberate steps**, with **ideas as a first-class harness concept**.

### Step 1 — capture: the ideas inbox (`.harness/IDEAS.md`)

A **gitignored**, zero-ceremony scratchpad: a single `## Inbox` list, one bullet per idea, as detailed
as needed (the full idea + any helpful context), no schema and no planning. It is the low-friction
place to dump a thought so it isn't lost and isn't interrupting in-flight work — capture is
**non-interactive** (it enriches from what's already known, never by asking) precisely so it doesn't
derail whatever Claude is mid-task on. Capture two ways:
- **`/idea <the idea, in as much detail as you like>`** — appends a bullet to the Inbox.
- Or just **hand-edit** `.harness/IDEAS.md`, or tell Claude "add an idea: …".

It is **gitignored on purpose** (like `data/` folders): raw, unfleshed ideas — which may reference
private jobs — stay local and never hit the public repo. The *mechanism* travels with the harness via
this committed doc; each project grows its own private inbox. This is distinct from the committed
`TASKS.json` backlog — the inbox is transient working state, the backlog is the durable record.

### Step 2 — convert: parallel per-idea agents + one locked consolidation pass (`/convert-ideas`)

Conversion is its OWN process — it **leans on `ralph-loop-add-to-backlog` but is NOT the bare skill**.
`/convert-ideas` sweeps the **whole inbox** in one invocation, converting ideas **in parallel, not one
at a time**: every idea (or tightly-related cluster of ideas — see the skill for the grouping rule)
gets its own agent that owns explore → interview → shape end-to-end, and every independent unit
launches together in one wave — there is no serial queue and no artificial batch-size cap. What used
to make this unsafe to parallelize (every agent racing the shared repo lock to allocate a task id and
commit directly) is now avoided by construction: each per-idea agent writes ONLY to its own
uniquely-named scratch file under `.harness/.pending-tasks/` (no shared resource touched at all during
interview/shaping), and a **single consolidation pass** — `.harness/consolidate-ideas.sh` /
`.mjs`, run once after every agent reports back — allocates every task id, resolves cross-idea
`dependsOn` links, writes `TASKS.json` + spec files, commits, pushes, and cleans up `IDEAS.md` — all in
one locked step instead of one per idea. Full mechanics (the pending-file schema, the consolidation
script, the recovery check for an interrupted prior sweep) live in the skill itself,
`.claude/commands/convert-ideas.md` — this section is just the model summary.

**Agents can't ask the owner directly.** `AskUserQuestion` is main-thread/interactive-only, so a
background per-unit agent can't block on a live prompt itself. A genuine open question is relayed
THROUGH the coordinator: the agent writes it durably to `.harness/.pending-questions/<slug>.json` (so
it survives even if the coordinating session ends before relaying it — don't rely on conversation
memory alone for anything that must survive an interruption), the coordinator batches every open
question across every unit into `AskUserQuestion` calls to the owner, then resumes each blocked unit
via `SendMessage` with its answers — possibly more than one round, if an answer opens a new question.
An agent that can make a confident, low-risk judgment call instead of blocking should just do that
(documented in its `report`) rather than manufacturing a question.

Other key points, in brief (full detail in the skill):
- **De-dup pass (before launching any agents).** Scan the full inbox for ideas that are the same or
  substantially overlap (semantic similarity, not exact-text match) and surface suspected duplicate
  groups to the owner to merge or drop — do NOT auto-merge.
- **Grouping by shared answer-space, not just `dependsOn`.** Cluster ideas onto the SAME agent when
  answering one idea's interview question would plausibly change what you'd ask/how you'd shape
  another; a hard dependency with no shared answer-space still gets separate agents in the same wave
  (a tempId scheme resolves the real link at consolidation time).
- **Shape → write to a scratch file, not `TASKS.json` directly.** Once an agent is satisfied, it writes
  its decided task(s) (title, scope, facets, spec content, everything except a real id) to its own
  `.harness/.pending-tasks/<slug>.json` and stops. No lock, no git, no `IDEAS.md` edit at this stage.
- **Consolidate once, at the end.** After every launched agent reports back,
  `.harness/consolidate-ideas.sh` (a permanent, tested script — see `.harness/consolidate-ideas.mjs`
  for the id-allocation/spec-write/merge logic) reads all pending files, allocates ids, resolves
  temp-id `dependsOn` references, writes `tasks/TNNN.md` specs, updates `TASKS.json`, commits +
  pushes, removes every converted idea's bullet from `.harness/IDEAS.md` (by FUZZY text match —
  normalized/reflowed comparison, re-read fresh under the lock, since a pending file's recorded
  bullet text won't byte-match the hand-wrapped markdown), and deletes the consumed pending files.
  This runs under `loop.sh`'s own shared lock (`LOOP_SOURCE_ONLY=1 source loop.sh` — the same pattern
  `mark-done.sh`/`mark-failed.sh` use), not a standalone lock file — this repo has no separate daemon
  process that would need to coordinate on the mutex from outside `loop.sh`, so it exits immediately
  (no queueing) if the loop is currently running. This is the ONLY step that ever touches the repo
  lock in a sweep.
- **Recovery check, before anything else.** A sweep starts by checking for leftover
  `.harness/.pending-tasks/*.json` files (fully-shaped units never consolidated — consolidate those
  first) AND leftover `.harness/.pending-questions/*.json` files (units blocked on an owner answer
  that never arrived — relay their recorded questions, then launch a fresh agent per unit to finish,
  seeded with what's on disk) from a prior interrupted run, before touching the current inbox; and
  for `IDEAS.md` bullets that plausibly already became a task in a recent commit (confirm with the
  owner rather than re-interviewing from scratch).
- **Delete on convert.** As each idea's task lands (or resolves to "no action needed"), its bullet is
  removed from `.harness/IDEAS.md` — during the consolidation pass, never earlier. The resulting
  `TASKS.json` task (+ its spec MD) is the record; the inbox stays a clean, transient surface. (No
  "converted" archive — the inbox is gitignored, so there'd be no history of it anyway.)

**Worked example.** Inbox bullet: *"The workouts page could show each exercise's best-ever lift."* →
a per-unit agent explores (a badge or a small chart? is the best-1RM already on the exercise record —
it is, `bestEstimated1RM` — or does `/api/exercises/...` need a new field? what's the itch — seeing
PRs at a glance?), settles what it can itself, shapes a `page`/`feature` task scoped to
`src/pages/exercises/[exerciseName].js` (+ any `api` task if a new field is needed) with a real
`## Done when`, and writes it to its own `.harness/.pending-tasks/best-ever-lift.json`. Once every
launched agent has reported back, the consolidation pass lands the real task(s) and deletes the
bullet from `IDEAS.md`.

> Distribution: the `/idea`, `/convert-ideas`, `/pre-loop-checkin`, and `/loop-recover` commands are
> project-local (`.claude/commands/`). They were ported into this repo alongside the rest of the
> harness.

## The floor (holds even on a direct edit)

If the skill isn't available and you edit `TASKS.json` directly, the non-negotiable invariant is:
**every BUILDABLE task MUST carry `facets: { layer, workType, risk[] }`**, with values chosen ONLY
from `facets.json`'s controlled vocabulary (use the task's `scope` paths to pick the `layer`).
`needs-human` (gated) tasks are **carved out** — they get NO facets. A buildable task missing facets
gets no auto-tuning and the loop **pre-flight WARNs** about it. Background:
`designs/difficulty-autotune.md`.

## Marking a task FAILED (owner correction of a false success)

When the owner judges a `done` task to have actually failed, that is recorded in the owner-owned
`.harness/manual-fail.json` overlay — **never** by hand-editing it, and never by the loop. Use the
`/mark-task-failed` command or `.harness/mark-failed.sh <TNNN> "<reason>"` (the dashboard's "Mark
failed" button writes the same file). The loop READS this overlay to correct calibration — a false
success is re-counted as a failure for difficulty tuning and dropped from its cell's audited-success
count, so that `(layer × workType)` cell is built with a stronger model and audited more often. At
pre-flight the loop ALSO reconciles it → `TASKS.json` `status=failed` (`reconcile_overlays`) — a
terminal status the loop skips; it does NOT re-open/rebuild the task (the re-do is a separate
follow-up). The loop still never WRITES the overlay file. Full design: `designs/manual-fail-signal.md`.

## Completing a `needs-human` task interactively — NEVER route it through the loop afterward

When the owner has you build a `needs-human` task directly in an interactive session
(not via `.harness/loop.sh`), **that interactive work IS the completion mechanism.** The whole point
of that gate value is "the owner wants this done by directing a Claude session, not by the
unattended loop" — so once you've built and verified it, close it out yourself; do NOT afterward run
`.harness/loop.sh <TNNN>` to "make it official" or get it through CI-gating. The loop exists to
*build* tasks cold from `origin/main`, not to bless work that's already there — forcing it at an
already-complete task at best wastes a model call reproducing a worklog-only commit, and at worst
(any `expectsTest:true` task) escalates forever: see the dated incident below for exactly how this
goes wrong and why "just force-run it to close it out" is never the right move.

Once you've actually verified the work against every `## Done when` criterion yourself (run the DoD
commands, don't take a prior claim on faith):
1. Write (or update) `.harness/worklog/TNNN.md` documenting what you built/verified and how.
2. Hand-edit `TASKS.json` to set that task's `status` to `"done"`. This is the ONE sanctioned
   exception to "the loop is the sole writer of status" — that rule exists to stop a *builder agent*
   from skipping verification and faking success, not to block the owner's own directed session from
   recording a real, DoD-verified completion. Do NOT fabricate an `outcomes.jsonl` calibration row —
   this wasn't built via the loop's escalation ladder, so there's no real rung/model data to record
   (mirrors how the `needs-human` `human-done.json` → `reconcile_overlays` path never writes one
   either).
3. Commit both files together (`git commit -m "TNNN: mark done [skip ci]"`, matching the loop's own
   `mark_done()` message convention) and push.

⚠️ **Also watch for `LOOP_AUTORESET=1`** (set in `harness.env`): if you DO ever run `loop.sh` with a
dirty working tree — even by accident — it silently `git stash`es everything first rather than
refusing, including work-in-progress that has nothing to do with whatever task you forced. If that
happens, check `git stash list` immediately afterward and restore the right entry by timestamp
(`git stash pop stash@{N}`) — don't guess, and don't let it sit lost in the stash.

## `scope` is the rigour dial — pick its granularity deliberately

A task's `scope` is a **hard boundary**: the loop's `structural_checks` fails any attempt whose diff
touches a file outside it (test files + the task's own worklog are always allowed). It is NOT a
"these files must change" checklist — "did it actually do the work" is the **audit + CI's** job
(`expectsTest: true` is the one cheap positive signal, forcing a test into the diff). `scope`'s only
job is **blast-radius containment**, and its *granularity* is how you express the intended rigour:

- **Greenfield / "this whole area is the blast radius" → scope a DIRECTORY glob**, e.g.
  `src/pages/reviews/perfumes/**` or `src/components/**`. Anything the builder creates *inside that
  tree* — including a proactive new util/helper file it decides it needs — is in-scope and NOT
  punished. Use this for a new review type, a new component area, etc.
- **Surgical / shared / dangerous → pin EXACT files**, e.g. `src/lib/dynamo.js`,
  `src/lib/apiCache.js`. A new sibling in a shared `src/lib` dir then trips scope-creep on purpose, so
  a stronger model (escalation) or a human looks at a high-blast-radius change.

The matcher understands an entry as an **exact path** OR a **directory prefix** — a trailing `/**`,
`/*`, or `/` is stripped to the bare directory, so a file anywhere beneath it counts. (Next.js
bracket routes like `src/pages/exercises/[exerciseName].js` are matched literally — the brackets are
NOT glob character-classes here.) Rule of thumb: if the task legitimately can't predict every file
(it may refactor or add helpers), scope the **directory**; if it must stay surgical, list the files.

**Always-allowed regardless of scope:** the task's own worklog, **test files** (`*.test.*`/`*.spec.*`/
`tests/…`), and **lockfiles** (`package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`). You therefore do
NOT need to list a lockfile in `scope` — when a task changes dependencies, scoping just `package.json`
is enough; the `npm install`-rewritten `package-lock.json` is auto-allowed (a real dep change still
requires editing `package.json`, which IS scope-checked, so the lockfile can't smuggle anything in).
This auto-exemption was added after a task scoped to `package.json` failed scope-creep on its sibling
`package-lock.json` (T220).

### Scope-coverage gaps — the spec asks for an edit the `scope` array doesn't cover

**A recurring authoring bug, not a one-off:** a task's `## Do` section explicitly instructs
creating/editing/removing something in a specific file, but that file was never added to the task's
`scope` array. The loop's structural scope-gate then correctly refuses the edit (this is the gate
working as designed — see the guardrail above), and the builder reports `failed:blocked` instead of
faking success. First caught in **T141** (spec said to remove a hook call from `_app.js`; `_app.js`
wasn't in scope) and **T147** (spec said to remove markup from `index.js`; `index.js` wasn't in
scope), then found again in **T151, T162, T163, T166, T167, T168, T169, T122** during a full-backlog
audit — nine more instances in one sitting, all the same root cause: the file was named in prose
(often by **bare filename**, e.g. `` `ReviewCard.js` `` rather than the full `` `src/components/
ReviewCard.js` `` — this is the form that's easy to miss when writing `scope`, since the full path
was usually only spelled out once, earlier in the spec or in a dependency's spec) but never
transcribed into the JSON `scope` field, which is authored separately.

**Prevention — run `.harness/check-task-scope.sh` before finalizing any new task(s):**
```sh
.harness/check-task-scope.sh          # scan every pending, non-needs-human task
.harness/check-task-scope.sh T171     # scan one task
```
It's a heuristic advisory scan (extracts backtick-quoted, file-shaped tokens from the spec —
both full paths and bare filenames — and flags any not covered by `scope`, exact match or
directory-prefix), **not a hard gate**: it cannot tell "edit this" from "read this for context" or
"do NOT touch this", so expect some false-positive noise (a file mentioned only as a read-only
reference will still get flagged) — that's an intentional tradeoff, a false positive costs one line
of review, a false negative costs another `failed:blocked` loop iteration. Run it as the last step of
the add-to-backlog skill's own "validate before finishing" pass whenever you add or edit tasks, and
reconcile every real hit (add the file to `scope`, per the granularity rules above) before
considering the backlog done. When a task's own spec text is uncertain whether it'll need to touch an
unpredictable file (e.g. "add a new API route if genuinely necessary"), prefer **constraining the
spec** to rule the uncertain edit out entirely (tell it to stop and report `failed:blocked` naming
what it needed, rather than silently going out-of-scope) over guessing a scope entry you can't be
sure is right — see T149's fix for a worked example.

**Fixing the scope gap on a still-pending task is NOT enough by itself — you must also clear its
stale `failed:blocked` marker, or `select_task()` will keep skipping it forever.** `loop.sh`'s
`task_blocked()` (used by `select_task`'s selection loop) doesn't check task status or re-evaluate
anything — it just greps the task's own `.harness/worklog/<id>.md` for the literal string
`failed:blocked` or `needs-human` ANYWHERE in the file, with no expiry and no re-check once the
underlying problem is fixed. Discovered when a `/pre-loop-checkin` looked clean (dependencies all
satisfied, no needs-human blockers) but the loop still reported "nothing eligible" — three tasks
(`T078`, `T122`, `T147`) had old blocked-attempt worklogs still carrying that phrase, and `T147`
transitively blocked most of the rest of the backlog via `dependsOn`, even though its scope gap had
already been fixed. **After fixing a scope/spec bug for a task that's still `pending`** (not built
interactively — that case is covered by the section above), also rewrite that task's worklog to
remove the trigger phrase (state plainly what was wrong and that it's fixed — see `T147`/`T122`'s
worklogs for the pattern) so the task is retryable again. Do NOT just delete the worklog file even
though it's disposable-in-spirit — `.harness/worklog/*.md` is git-tracked, not gitignored scratch, so
blanking it away loses real history; rewrite it instead. (Separately: if a task's worklog describes
real, verified work but still carries a stale blocked marker — e.g. from a `ci-indeterminate` result
followed by a string of `empty-diff` retries that could never succeed because the work was already
done — that's the interrupt-orphan pattern in "Known-but-deferred issues" below, not a scope gap;
verify the code is genuinely on `origin/main` and passes the DoD before marking it `done` by hand, and
correct/prune any bogus `failures.jsonl`/`outcomes.jsonl` rows the futile retries left behind so they
don't skew that `(layer, workType)` cell's calibration — see `T108`'s recovery for a worked example.)

## Bumping the base model (preserve calibration — migrate the ledger in lockstep)

When a new model ships and you switch the harness to it, the difficulty calibration in
`outcomes.jsonl`/`failures.jsonl` must be **migrated in lockstep**, or it is silently lost.
`policy.jq` maps each historic row's `(model, effort)` to a ladder **index** via `tidx`, and
**drops any row whose tuple isn't on the current ladder** (`select($s >= 0 and $f >= 0)`). So if you
change the ladder in `facets.json` but leave the ledger referencing the old id, every historic row
becomes `tidx = -1` → dropped → every `(layer × workType)` cell cold-starts from the floor again.

Procedure (done for `claude-sonnet-4-6 → claude-sonnet-5`, 2026-07-01, 27 `outcomes.jsonl` rows + 7
`failures.jsonl` rows migrated):
1. **Pin the FULL id.** Model IDs are a **dateless pinned snapshot** (not an evergreen alias) — so
   `claude-sonnet-5` is the correct thing to pin (no `-YYYYMMDD`). Confirm the exact id from
   Anthropic's models doc; do not guess.
2. **Config:** update the `MODEL` default in `harness.env` + `loop.sh`, and the sonnet tiers in the
   `facets.json` `.tiers.ladder`. Leave the Opus ceiling + `policy.auditorModel` unless bumping those too.
3. **Migrate the ledger 1:1:** `sed 's/<oldid>/<newid>/g'` over `outcomes.jsonl` + `failures.jsonl`
   (and the gitignored `worklog/.failures.buf` so a pending flush stays consistent). Because the new
   model takes the SAME ladder positions, this preserves every cell's learned difficulty exactly.
   Leave worklog narrative (`*.md`) alone — it's historical record, not policy-consumed.
4. **Verify calibration is unchanged:** recompute each cell's `(model, effort)` row counts from the
   OLD ledger and the NEW (post-sed) ledger and confirm they match exactly, and that `git diff --stat`
   on the ledger files shows only content changes, never a line-count delta (a corrupted sed would
   show up as fewer/garbled lines).

## Known-but-deferred issues (review if they recur)

A running log of harness pathologies we've **seen at least once** and **consciously chose not to fix
yet** — usually because they're rare or only triggered by manual intervention. If you (Claude) hit
one again while working in or evaluating the harness, **flag it to the owner** with a pointer here
rather than silently working around it; a second occurrence is the signal to actually fix it. Add a
dated bullet when you defer something new.

- **2026-06-26 — A manual loop interrupt (Ctrl+C) can orphan a task whose work already merged.**
  *Symptom:* a task's code is on `main` and CI-green, but its `status` is still `pending` (the
  interrupt landed between the push and `mark_done`). The loop then re-selects it, the cold rebuild
  finds the feature already present so it produces only a worklog-only `[skip ci]` commit, and
  `wait_ci_green` never sees a CI run for that SHA → it times out (~`CI_TIMEOUT`s) and treats "no run
  appeared" the SAME as "CI failed" → revert + retry, **forever** (a `…build summary` → `Revert …`
  cycle, climbing the ladder until it falsely BLOCKS a task that's actually done). Two root causes:
  (a) an interrupt can leave a merged task in `pending`; (b) `wait_ci_green` returning *indeterminate*
  (no run / `[skip ci]`) is conflated with *red*. *Manual recovery (what we did):* stop the loop,
  confirm the work is on `main` + green, mark the task `done`, drop the bogus `ci-red` rows from the
  failure buffer, and add a clean `outcomes.jsonl` success row. *Why deferred:* only triggered by a
  manual Ctrl+C mid-task; not worth the complexity yet. *If it recurs:* consider (1) `wait_ci_green`
  treating indeterminate ≠ red, and (2) the loop detecting "this task's work is already on `main` →
  just `mark_done`" instead of rebuilding.
- **2026-06-26 — ROOT CAUSE FOUND + FIXED: `mark_done`/`block_task` silently failed to commit
  `status=done` whenever `failures.jsonl` didn't exist.** The interrupt above was a *red herring* — the
  real reason tasks orphaned was a regression in the T-`failures.jsonl` change (commit `2226eb1`):
  `mark_done` did `git add "$BACKLOG" "$WORKLOG" "$OUTCOMES" "$FAILURES"`, but `.harness/failures.jsonl`
  almost never exists (failures are rare). `git add` fails **atomically** on a missing pathspec —
  staging **nothing** — so `git commit … || true` hit "no changes added to commit" and silently no-op'd.
  The `status=done` therefore lived ONLY as an uncommitted working-tree edit, which the next task's
  `cold_reset` wiped → **every** completed task since `2226eb1` orphaned (T214–T218), not just on
  interrupts (a clean run would orphan them too; the interrupt just made it visible — and the loop log's
  opening `no changes added to commit` line was the smoking gun). *Fix:* stage the always-present files
  first, then add `$FAILURES` only `if [ -f "$FAILURES" ]` (both `mark_done` and `block_task`). Verified
  in a scratch repo: the `mark done` commit now persists with `failures.jsonl` absent. **Do not recombine
  those `git add`s.** The interrupt-window race + `wait_ci_green`-indeterminate items above remain the
  only genuinely-deferred parts.
- **2026-07-01 — FOUND + FIXED (via cross-reference with the `local-jobs` sibling harness):
  `run_claude`'s internal `set -e` toggling could kill `loop.sh` outright on a usage-limit hit.**
  *Symptom (never yet observed here, caught proactively):* `run_claude()` does `set +e` then `set -e`
  internally before `return`ing its status code (0 ok / 10 rate-limited / other = fail). Because
  `set -e` is a GLOBAL shell option, re-enabling it inside the callee re-arms `errexit` for the
  *caller* — and both call sites used the vulnerable `set +e; run_claude ...; rc=$?; set -e` form
  (a bare statement, not part of an AND-OR list), so a `return 10` (or any nonzero) could trip
  `errexit` and kill the whole loop before `rc` was ever captured, before the backoff handler ever
  ran. *Fix:* both call sites (builder + auditor) now use `rc=0; set +e; run_claude ... || rc=$?;
  set -e` — the `||` form keeps the statement in an AND-OR list, which `set -e` never aborts on,
  regardless of what the callee does to the option internally. *Verified* with an isolated scratch
  repro (same shape, not the real loop): the old `; rc=$?` form killed the calling shell before its
  `echo` ran; the new `|| rc=$?` form survived and captured `rc=10` correctly.
- **2026-07-01 — FOUND + FIXED (also via `local-jobs`): `wait_ci_green` conflated a
  cancelled/skipped CI run with a genuinely failed one, risking a revert of good work.**
  *Symptom:* once a CI run was found, `gh run watch "$runid" --exit-status` returns nonzero for
  BOTH a real failure AND a cancelled/skipped/stale run (e.g. a run superseded by a newer push,
  cancelled by GitHub's own concurrency group) — both fell through to `return 1` (red), so the
  loop could revert an already-integrated, actually-good commit just because its CI run got
  cancelled rather than failing. *Fix:* `wait_ci_green` now ignores `watch`'s own exit status,
  re-queries the run's real `status`/`conclusion` via `gh run view`, and classifies
  `success`→green, `failure|timed_out|startup_failure|action_required`→red, anything else
  (`cancelled|skipped|stale|neutral`/unknown)→**indeterminate**. The caller now branches three
  ways instead of two: green integrates as before, red still reverts + retries as before, but
  indeterminate leaves the commit on `main` untouched and soft-retries via a new `ci-indeterminate`
  failure kind — never reverting on an inconclusive result. *Caught while porting this fix:* an
  earlier draft of the caller rewrite used a bare `wait_ci_green; ci_rc=$?` — the SAME `set -e`
  landmine as the entry above, just at a different call site (this function has no internal
  `set -e` toggling, but a bare failing statement still trips `errexit` regardless). Corrected to
  `wait_ci_green || ci_rc=$?` before landing.
- **2026-07-02 — Force-running `.harness/loop.sh TNNN` to "close out" a task already built
  interactively caused a real failure loop + nearly lost unrelated uncommitted work.** *Symptom:*
  T106 (`gate:"gate"`) was built, verified, committed, and pushed directly in an interactive
  session — then, to get its `TASKS.json` status flipped from `pending` to `done` "the proper way,"
  the loop was force-run against it (`.harness/loop.sh T106`). Two things went wrong at once: (1)
  `LOOP_AUTORESET=1` found the working tree dirty (unrelated owner work-in-progress on 3 files) and
  silently `git stash`ed it before resetting to `origin/main` — invisible unless you go looking; (2)
  every iteration correctly found the code already on `main`, verified it, and made a worklog-only
  commit — but the structural gate's `expectsTest:true` check has no carve-out for "the code was
  already there, only a worklog changed," so it failed the SAME way every time and kept escalating
  the model tier (low → medium → high) for 5 iterations before being manually killed. *Why this
  happened:* a misunderstanding that `gate`/`needs-human` tasks built by hand still need to go
  through the loop/CI-gate machinery to be "officially" done — they don't; see the new section above
  this log. *Recovery:* killed the stray processes (`pkill -9 -f "loop.sh TNNN"`), confirmed the
  real commit was untouched on `origin/main` (structural-check failures discard the LOCAL attempt
  before push, so nothing bad reached the remote), popped the correct stash back
  (`git stash pop stash@{0}`, identified by timestamp — did NOT touch an older, unrelated stash
  sitting at `stash@{1}`), and hand-completed the task per the new section above instead. *Why
  deferred:* the actual fix (the structural check tolerating a worklog-only commit when the task's
  scope is independently confirmed unchanged-since-a-passing-DoD-run) hasn't been designed yet, and
  the higher-leverage fix — "never force the loop at an already-done task" — is now written down
  above where it'll actually be read before this repeats. *If it recurs anyway:* kill the stray
  `loop.sh`/`claude` processes immediately (don't wait for it to self-resolve — it won't, it'll climb
  every rung), then check `git stash list` before assuming the working tree is what you left it.
- **2026-07-03 — FOUND + FIXED: `wait_ci_green` was called unconditionally even when the just-pushed
  commit's OWN message was tagged `[skip ci]`, guaranteeing a `CI_TIMEOUT` (1200s) wasted wait every
  single time.** *Symptom:* `T171` (a `scope: []` operational deploy task — its diff is worklog-only)
  built successfully, was independently audited PASS, and pushed a commit whose message the builder
  itself tagged `[skip ci]` (a reasonable choice for a no-code-diff commit). GitHub never creates a
  workflow run for a `[skip ci]`-tagged commit — confirmed via `gh run list`, zero runs for that SHA
  — so `wait_ci_green` sat in its 30s poll loop for the full 1200s, returned indeterminate (correctly
  did NOT revert — that fix from 2026-07-01 held), and soft-retried: cold-rebuilt the same
  already-complete task, redeployed to production again (harmless, deploying is idempotent, but
  wasteful — a real `vercel --prod` and real model cost every ~20-25 min), and would have repeated
  indefinitely. Caught live by the owner watching `supervise.sh` output and cross-checking GitHub
  directly (no CI run existed for the SHA it claimed to be waiting on). *Fix:* the main loop body now
  checks `git log -1 --format=%s` for `[skip ci]` BEFORE calling `wait_ci_green` at all — if present,
  skip straight to `mark_done` (same path as `REQUIRE_CI=0`), logging why. This is a general fix, not
  scoped to `T171` specifically: any future task whose build commit ends up `[skip ci]`-tagged (a
  worklog-only diff is the common case, but not the only possible one) is covered. *Recovery for the
  in-flight orphan:* owner stopped the loop (confirmed via `ps`/lock check before touching anything),
  the live deployment was independently re-verified (curl 200 + both Collection-redesign HTML
  markers + `vercel ls --prod` showing two successful READY deployments matching the two build
  attempts), `T171` marked `done` by hand with one accurate `outcomes.jsonl` row (no bogus
  `failures.jsonl` rows existed yet for it — the timeout hadn't fired before the loop was stopped, so
  there was nothing to clean up, unlike the `T108` recovery earlier this session).
