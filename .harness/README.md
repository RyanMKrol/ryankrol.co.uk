# .harness — autonomous build harness (Ralph loop)

Self-contained build harness for `ryankrol.co.uk`, kept under a hidden `.harness/` folder so it
stays clearly separate from the project source. It builds a backlog one fully-verified task at a
time, working **directly on `main`** (no worktree), gated on green GitHub CI, pausing and
auto-resuming around Claude usage limits.

Full design: [`HARNESS.md`](./HARNESS.md). Trade-offs: [`LIMITATIONS.md`](./LIMITATIONS.md).
Authoring rules + the ideas→tasks flow: [`CLAUDE.md`](./CLAUDE.md).

## Files

| Path | What |
|---|---|
| `loop.sh` | the loop — selects a task, runs Claude to build it, pushes, gates on CI |
| `supervise.sh` | re-launches `loop.sh` on a ~5h15m cadence (run this in a terminal) |
| `postflight.sh` | zero-token status board → also writes `worklog/STATUS.md` |
| `dashboard/` | local-only backlog web view (`npm run harness:dashboard`); standalone Node (`server.js` + pure `lib.js` + `lib.test.js`), NOT in the Vercel build; has Mark done / Mark failed actions |
| `mark-done.sh` | owner CLI: mark a `needs-human` task done → `human-done.json` (loop reads it; unblocks dependents) |
| `mark-failed.sh` | owner CLI: mark a `done` task a false success → `manual-fail.json` (loop recalibrates + reopens it to rebuild) |
| `mark-reviewed.sh` | owner CLI: mark a task reviewed → `reviews.json` (dashboard-only annotation; the loop ignores it) |
| `human-done.json` / `manual-fail.json` / `reviews.json` | owner-owned overlays: the loop READS human-done + manual-fail (steer it); `reviews.json` is a dashboard-only "I've checked this" flag the loop ignores |
| `harness.env` | config (model, caps, CI gate, rate-limit backoff) |
| `facets.json` | difficulty-autotune vocabulary + the tier ladder |
| `policy.jq` | tier-selection + audit-sampling algorithm |
| `integrate.sh` | post-CI refresh hook (no-op here — Vercel auto-deploys on push) |
| `TASKS.json` | the backlog (committed; the loop owns each task's `status`) |
| `tasks/` | per-task Markdown specs (`<TASK>.md`, sections `## Do` / `## Done when`) |
| `worklog/` | per-task attempt notes (`<TASK>.md`); `.result`/`STATUS.md`/`.claude-out` are gitignored scratch |
| `IDEAS.md` | gitignored private ideas inbox (capture via `/idea`, convert via `/convert-ideas`) |

The CI workflow lives at `.github/workflows/ci.yml` (GitHub requires that location — it's the one
harness piece that can't move under `.harness/`). Its `name:` MUST match `CI_WORKFLOW` in
`harness.env`. The Definition of Done for this repo is **`npm run lint && npm test && npm run build`**
(a Next.js pages-router JavaScript app — ESLint flat config + `eslint-config-next`, Jest via
`next/jest`; no TypeScript typecheck). The structural gate also requires a test file on any task
marked `expectsTest: true`.

## Usage

```sh
DRY_RUN=1 .harness/loop.sh     # print the task it would build next
.harness/loop.sh               # build one task (or as many as fit the quota window)
.harness/supervise.sh          # leave running: re-launches the loop each window
.harness/postflight.sh         # status board (terminal)
npm run harness:dashboard      # local backlog web view → http://localhost:4790
```

Requirements: `jq`, `gh` (authenticated), Node 22.

## The backlog

`TASKS.json` starts **empty**. Fill it via the two-step ideas flow (see `CLAUDE.md`):

1. **Capture** — `/idea <a raw thought, in as much detail as you like>` appends a bullet to the
   private, gitignored `.harness/IDEAS.md` inbox (non-interactive, never derails in-flight work).
2. **Convert** — `/convert-ideas` sweeps the inbox one idea at a time: it excavates each idea with
   you, then shapes it into a schema-correct task (`TASKS.json` entry + `tasks/<TASK>.md` spec) via
   the `ralph-loop-add-to-backlog` skill, and deletes the converted bullet.

Live status is in `TASKS.json` (`status` per task) and the generated `worklog/STATUS.md`.
After a manual Ctrl+C interrupt, run `/loop-recover` before restarting the loop.
