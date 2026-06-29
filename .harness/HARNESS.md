# HARNESS.md — the autonomous build harness (in-place Ralph loop)

Authoritative design of the autonomous builder for `ryankrol.co.uk`. `CLAUDE.md` is the
coding-conventions rulebook; this file is how the loop *works*. (The harness was ported from the
owner's `local-jobs` project and localized to this repo — a Next.js pages-router JS site on
DynamoDB/Vercel, no daemon/dashboard/TypeScript.)

## 1. What it is

A single **sequential** shell loop (`.harness/loop.sh`) that builds the `.harness/TASKS.json`
backlog **one fully-verified task at a time**, working **directly on `main` in this checkout** —
no git worktree, no per-task branches. The whole harness lives under the hidden `.harness/` folder
to stay separate from project source. `.harness/supervise.sh` re-launches the loop on a cadence so
it spans many token-refresh windows.

### Why in-place (not the worktree variant)
The stock Ralph harness isolates each task in a throwaway worktree off `origin/main`. We
deliberately **don't** here:
- The harness's own private state (`.harness/IDEAS.md`, `perfume-seed-data.tsv`, local `.env.local`)
  lives **untracked** in this checkout; an in-place loop can read it, and keeping one checkout avoids
  worktree-setup overhead for a small solo project.
- The safety model is **git itself**: every task is one commit on `main`; a bad one is a one-line
  `git revert`, and Vercel just redeploys. Simpler, and it keeps the loop working against the real
  repo state.

## 2. One iteration

```
SELECT (shell)  → next not-done task in LOCAL TASKS.json whose dependsOn are all done and which
                  is not a 🚦 gate / 🔒 needs-human / blocked task. None eligible → stop.
WORK   (claude) → one `claude -p` at the policy-chosen tier builds the task COLD in this checkout
                  on main, runs the Definition of Done (§5), and COMMITS (does NOT push).
GATE   (shell)  → pre-push guard (§4) → structural checks + sampled blocking audit (§5) → push main
                  → watch GitHub CI (§3) → green: mark `done`; red: revert + cold retry (escalate).
```

## 3. The CI gate

`REQUIRE_CI=1` (default): after the agent commits and the loop pushes `main`, the loop watches the
GitHub Actions workflow named `CI` for that commit. **Green → task marked done. Red → the loop
stops and alerts**; you revert (`git revert HEAD && git push`) and decide. The agent's *local* DoD
(which mirrors CI) is the primary gate, so red CI should be rare (environment drift). Set
`REQUIRE_CI=0` to merge on local DoD only (no GitHub round-trip).

## 4. The pre-push guard (load-bearing safety)

Because the loop pushes to a **public** repo autonomously and this checkout contains private data,
the loop refuses to push if the pending commits (`origin/main..HEAD`) touch any sensitive path:
`data/`, `.env*`, `chrome-profile/`, `*.pem`/`*.key`/`*.p12`, `service-account*`, or
`credentials.json`. A trip **halts the run** for a human. The agent is instructed to stage files
explicitly (never `git add -A`). (`.harness/TASKS.json` + `.harness/worklog/` are committed on
purpose, so they are not blocked.)

## 5. Definition of Done (must mirror CI exactly)

Run locally before committing; identical to `.github/workflows/ci.yml`:

```sh
npm run lint                          # ESLint (flat config, eslint-config-next) — no errors
npm test                              # Jest unit suite (via next/jest; co-located *.test.js)
npm run build                         # next build must succeed
```

Plus: add unit tests for new behaviour; update docs in lockstep (§ CLAUDE.md); record empirical
observations the task's `verify` field asks for in `.harness/worklog/<TASK>.md`.

**Verify correctness — hermetically; never touch real data or external services.** This repo has no
paid-quota service layer; verification must stay **offline + hermetic**: pure-logic unit tests
(Jest, e.g. `src/lib/*.test.js` with synthetic fixtures) plus `npm run build`. **Never** make a live
DynamoDB write, a password-gated mutation, or a live external-API call (Last.fm / GitHub / Hevy /
TMDB / Open Library) just to "verify" — that touches real data or burns rate limits. If a check
genuinely requires a live external call or real credentials, **don't** do it: record `failed:blocked`
so a human runs it. **Never skip verification** otherwise — an unverified task is not done.

**The loop adds two gates beyond CI** (see `designs/audit-verification.md`). Before a built task is
pushed, the loop runs cheap **structural checks** (the diff is non-empty; every changed file is within
the task's declared `scope` — a hard blast-radius boundary, matched as an exact path or a directory
prefix so a `dir/**` entry admits anything beneath it; if the task sets
`expectsTest: true`, a test file changed; the `LOCAL_DOD` commands — `lint`/`test`/`build` — pass), then — for
a *sampled* fraction of tasks — a **blocking audit**: a fresh, independent Claude (at
`max(opus-4.8/medium, the builder's tier)`) reads the spec's `## Done when` + the diff and must answer
`PASS`. A structural or audit failure is a failed attempt → cold retry → escalate, exactly like a red
CI; the work is never pushed. Audit sampling per `(layer × work-type)` cell starts at 100% and decays
to a 10% floor as the cell accumulates audit-confirmed successes — so a plausible-but-wrong build at a
cheap tier is caught, the task escalates, and the ledger learns the cell's true difficulty.

**Every attempt is COLD.** The loop `cold_reset`s to a clean `origin/main` before each (re)attempt, so
the builder never sees a prior attempt's worklog or partial work — each outcome measures whether that
tier can do the task in one cold pass. The worklog is written for humans but never read by the
builder. A task that can't be done cold in one pass is mis-sized → split it.

## 6. Model selection (auto-tuned — no per-task models)

Tasks do **not** carry per-task `model`/`effort`/`escalation` — difficulty is **auto-tuned** (see
`designs/difficulty-autotune.md`). The loop rides ONE global tier ladder (`facets.json →
.tiers.ladder`, cheapest→priciest) and a policy (`policy.jq`) picks each task's START tier from its
`(layer × work-type)` facet cell's escalation history (the cheapest tier clearing floor 0.75 with ≥6
samples; else the cold-start floor). After `MAX_ATTEMPTS` soft failures on a tier the loop climbs the
ladder; past the top tier it stops for a human. The ladder is deliberately SHORT (4 tiers:
`sonnet/low → sonnet/medium → sonnet/high → opus/high`), so a doomed task BLOCKS to a human after at
most `4×MAX_ATTEMPTS` attempts rather than burning the most expensive opus-effort tiers — if
`opus/high` can't do it twice, a human glance is cheaper than throwing `opus/max` at it. Every built
task's outcome is captured to `.harness/outcomes.jsonl` (the sole calibration input; forward-only).
The **cold-start floor** is the cheapest tier (`sonnet/low`, set in `harness.env`) — used until a cell
has enough samples.

**Two distinct ledgers.** `outcomes.jsonl` is one TERMINAL row per built task (where it ended up:
final tier, total soft-fails, blocked?) and feeds calibration. `failures.jsonl` is one row per FAILED
ATTEMPT (`{id, ts, kind, rung, attempt, model, effort, detail}`) with the cause — `scope-creep`,
`audit-fail`, `ci-red`, `test-missing`, … — so you can see the FULL escalation history (what failed
at each rung, and whether the causes were all the same), not just the summary. It's diagnostics only
(never read by calibration), buffered per-task in a gitignored scratch file (survives the cold reset
between attempts) and flushed into the committed ledger when the task terminates. Aggregate it with
`jq` to answer "which failure kind drives most escalations across tasks?".
`needs-human` tasks are carved out entirely (no facets, no calibration).

## 7. Usage-limit backoff (pause + cold re-attempt)

When `claude` hits the Claude Code usage/rate limit, the loop detects it in the CLI output, **sleeps
and re-attempts the SAME task COLD** (cold_reset first) — this is *not* a soft failure (no attempt
counted, no escalation); it just keeps every measured pass a clean cold one.
Backoff is exponential from `RL_BACKOFF_MIN` (5 min) capped at `RL_BACKOFF_MAX` (~5 h, the refresh
window). `supervise.sh`'s ~5 h 15 m cadence is the outer backstop.

## 8. TASKS.json schema (committed; shell-owned status)

`.harness/TASKS.json` is the backlog and the source of truth for done/not-done + dependency order.
It is **committed** to the repo, but the **shell owns task status**: the loop sets a task's
`status` to `done` (and commits that one-line change with `[skip ci]`) only after CI is green — the
agent must not edit it.

```jsonc
{
  "version": 1,
  "tasks": [
    {
      "id": "T001", "title": "…", "status": "pending",   // pending | done  (SHELL-owned)
      // NOTE: NO `reviewed` field — since T136 it lives in owner-owned .harness/reviews.json
      "dependsOn": [], "gate": null,                      // gate: null | "gate" | "needs-human"
      "facets": { "layer": "ui", "workType": "style", "risk": [] },  // difficulty auto-tuning (OMIT for needs-human); values from .harness/facets.json
      "scope": ["src/…"], "verify": [], "expectsTest": false,  // expectsTest: true → audit's structural gate requires a test in the diff (§5)
      "spec": ".harness/tasks/T001.md"                    // do/doneWhen live in this MD (T131); NO per-task model/effort/escalation
    }
  ]
}
```

`gate:"gate"` = a human reviews the deliverable before dependents run; `gate:"needs-human"` = a
one-time human step (the agent prepares around it and records `failed:blocked`).

**`facets` — difficulty auto-tuning (see `designs/difficulty-autotune.md`).** Each BUILDABLE task
carries `facets: { layer, workType, risk[] }`, chosen from the controlled vocabulary in
`.harness/facets.json`. The loop's policy reads them to pick the task's STARTING tier from escalation
history (the outcomes ledger); until a `(layer × work-type)` cell has ≥ `minN` samples it cold-starts
at the cheapest floor (`sonnet/low`). `needs-human` tasks are CARVED OUT — they get **no** `facets`
and never enter calibration. Facets are normally assigned by the add-to-backlog skill; a buildable
task that's missing them **degrades gracefully** (the policy falls back to the cold-start floor) but
won't benefit from / contribute to calibration until tagged — so prefer authoring through the skill,
or add `facets` by hand.

**`expectsTest` (optional, default false) — the verification contract.** Set `true` on a task whose
correctness should be pinned by a test; the loop's structural gate (§5) then requires a test file to
change in the diff. Make `## Done when` concrete + runnable where possible so the blocking audit (and
you) can verify it objectively. Each ledger row records `verification: "audited" | "ci-only"` so the
calibration can weight audit-confirmed successes (see `designs/audit-verification.md`).

**`do`/`doneWhen` live in a per-task Markdown spec (T131).** Each task's *what to build* and *the
bar for done* are NOT flat strings in TASKS.json — they live in a per-task Markdown file at
`.harness/tasks/TNNN.md` with exactly two sections, `## Do` and `## Done when`, referenced by the
task's `spec` field (a repo-relative path). This is more expressive than a JSON string and renders
cleanly as markdown. TASKS.json keeps **every other field** (the orchestration fields above —
`status`, `dependsOn`, `gate`, `facets`, `scope`, `tags`, `verify`, `design`). The loop's per-task
prompt reads all orchestration fields from JSON and **appends the spec MD's full text**
(`task_spec_rel` + `cat` in `loop.sh prompt()`). To review the backlog without a dashboard, run
`.harness/postflight.sh` (the status board) or read `TASKS.json` + the `tasks/*.md` specs directly.

**Owner-owned overlays.** Pieces of backlog state that the OWNER controls, NOT the loop. Each lives
**entirely outside TASKS.json**, in its own committed file, and **the loop NEVER writes them** (it
only ever writes TASKS.json `status` + the worklog) — so the loop's `jq` status write and any overlay
write touch different files and never conflict. This repo has three: `human-done.json` (read by the
loop — see below), `manual-fail.json` (read by calibration — written by `mark-failed.sh`), and
`reviews.json`.

- **`.harness/reviews.json`** — `id → { "reviewed": bool, "at": <ISO-8601> }`. **Inert in this repo:**
  it's the "reviewed" flag the upstream dashboard's Backlog page writes via `POST
  /api/backlog/:id/reviewed`; this repo has no dashboard, so nothing writes it and the loop ignores it.
  Kept only so the file set matches upstream.
- **`.harness/human-done.json`** (T208) — `id → { "done": true, "at": <ISO-8601> }`. Marks a
  `needs-human` task complete WITHOUT touching TASKS.json `status` (the loop owns status; a gated task
  is never built so the loop never flips it). **`task_done()` in `loop.sh` reads this overlay** — a
  task counts as done if TASKS.json says `status=="done"` OR this file has `<id>.done==true` — so a
  needs-human completion recorded here unblocks the task's dependents.
  - In the **full dashboard** deployment this is set via `POST /api/backlog/:id/done` (needs-human
    tasks ONLY — 400 otherwise; atomic write+commit+push; `GET /api/backlog` overlays `done=true` and
    derives `reviewed=true`).
  - In **this repo there is no dashboard**, so the operator records a completion directly after doing
    the real-world step — e.g.
    `jq --arg id T0NN --arg at "$(date -u +%FT%TZ)" '.[$id]={done:true,at:$at}' .harness/human-done.json | sponge`
    (or any editor) — then commits it. This is an OWNER action outside a loop run, distinct from the
    under-loop builder, which must never hand-edit status or either overlay.

The one overlay writer in this repo, `mark-failed.sh`, commits+pushes under the **SAME mkdir lock
loop.sh uses** (`acquire_lock` — the `<git-common-dir>/<basename(repo-root)>-loop.lock` dir with
stale-pid-reclaim), by sourcing `loop.sh` with `LOOP_SOURCE_ONLY=1`, so it can never race the loop's
git ops. The push is **best-effort** (non-fatal warning on failure; the local commit is the
durability guarantee). The under-loop builder must NOT hand-edit TASKS.json `status` or any overlay —
those are owner actions (an operator editing `human-done.json`, or running `mark-failed.sh`).

### Backlog authoring: a new task = JSON object + spec MD (T131)

Authoring a NEW backlog task is now **two coupled files**: (1) a JSON object in `TASKS.json` with a
`spec` field (`.harness/tasks/TNNN.md`) and the orchestration fields — but **no** `do`/`doneWhen`;
(2) the matching `.harness/tasks/TNNN.md` with `## Do` and `## Done when` sections. A task whose
`spec` file is missing renders with no body and feeds the loop a warning, so always create both in
the same backlog edit.

### Backlog authoring: pair chooser tasks with review tasks (T129)

Whenever you add a task that builds **multiple options for the owner to pick between** (toggleable
styles, strategy variants, etc.), you MUST also add a paired `"gate":"needs-human"` review task
that: (1) `dependsOn` the chooser, (2) has the owner record their choice, and (3) gates a
follow-up that hardcodes the winner and removes the toggle/unused variants. Authoring the chooser
without the review task is a backlog error. (See CLAUDE.md "Autonomous build harness" for wording +
examples: T099/T113/T116 choosers → T126/T127/T128 review tasks.)

## 9. Result protocol

The agent's final action writes one line to `.harness/worklog/.result`: `done <T>` /
`failed:soft <T> …` / `failed:blocked <T> …` / `waiting <T> …` / `idle`. The loop acts on it (§2).

## 10. Running it

```sh
DRY_RUN=1 .harness/loop.sh     # print the task it would build next
.harness/loop.sh               # build one task (or as many as fit the window)
.harness/supervise.sh          # leave running: re-launches the loop each ~5h15m window
.harness/postflight.sh         # zero-token status board (also written to .harness/worklog/STATUS.md)
```

Requirements: `jq`, `gh` (authenticated), Node 22. One loop at a time (a lock in `.git` enforces it).

## 11. Limitations
See [`LIMITATIONS.md`](./LIMITATIONS.md) §Harness.
