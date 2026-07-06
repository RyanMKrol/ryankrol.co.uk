# LIMITATIONS.md — trade-offs, bottlenecks & known limitations

The single place to evaluate the design's compromises later **without re-deriving them from the
code**. Per `CLAUDE.md`, every change that introduces or reveals a trade-off, bottleneck, or known
limitation **adds a row here in the same commit**.

Each entry: **what** it is · **why** we chose it · **impact** · **when to revisit**.

---

## Harness

- **Works in-place on `main` — no worktree isolation.**
  *Why:* git revert is a simpler safety net than worktree quarantine for a small single-owner repo.
  *Impact:* an interrupted task can leave the working tree dirty; don't hand-edit or commit to the
  repo while the loop runs. Safety = sequential + lock + local-DoD-before-commit + CI-red-stops +
  one-line `git revert`.
  *Revisit:* if multiple loops/authors ever run concurrently, move to a push-to-branch worktree model.

- **Autonomous `git push` to a public `main`.**
  *Why:* the loop integrates by pushing; there's no human in the loop to click merge.
  *Impact:* a bad/secret-leaking commit could in principle reach GitHub (and Vercel would deploy it).
  *Mitigation / revisit:* the pre-push guard (HARNESS.md §4) halts on any sensitive path (`.env`,
  `.vercel/`, credentials); CI-red stops the loop. Tighten `SENSITIVE_RE` if new sensitive paths appear.

- **CI-green-after-push, stop-on-red (not gate-before-merge).**
  *Why:* CI can only run on pushed commits, and the local DoD mirrors CI, so red is rare.
  *Impact:* `main` can be briefly red — and Vercel may deploy a red commit — until a human reverts.
  *Revisit:* if red happens often, move to a push-to-branch → ff-main gate (and Vercel preview deploys).

- **Definition of Done = lint + unit tests + build; no integration/e2e coverage yet.**
  *Why:* the DoD now runs `npm run lint && npm test && npm run build` — ESLint (flat config,
  `eslint-config-next`) and Jest (via `next/jest`) — both locally (`LOCAL_DOD` in `harness.env`) and
  in `ci.yml`, and the structural gate enforces a test file on any `expectsTest: true` task. What's
  still missing is higher-level coverage: only co-located unit tests exist (mostly pure `src/lib`
  logic) — no component/integration or end-to-end (e.g. Playwright) tests.
  *Impact:* the harness verifies a change lints clean, passes unit tests, and builds — but a
  behavioural regression with no unit coverage (e.g. a broken page interaction) can still pass. The
  sampled blocking **audit** (a fresh independent Claude reviewing the diff) is the main compensating
  control for that gap.
  *Revisit:* add React Testing Library component tests for the review forms / charts and a Playwright
  smoke check, and set `expectsTest` on more tasks. (ESLint + Jest were wired up 2026-06; the earlier
  "build-only" DoD limitation is resolved.)

- **No live external-API calls in verification.**
  *Why:* the site reads Last.fm and writes DynamoDB; hitting those to "verify" touches real data/quota.
  *Impact:* data-layer logic is verified by reading code + build, not a live call — a live-only
  regression could slip past.
  *Revisit:* add an opt-in, read-only smoke test behind a manual flag if data-layer bugs recur.

- **`--dangerously-skip-permissions` removes per-action guardrails.**
  *Why:* a headless loop has no human to answer prompts.
  *Impact:* no per-action confirmation; the pre-push guard, CI gate, and reviewable per-task commits
  are the backstop.

- **The harness pushes its own backlog status commits to `main`.**
  *Why:* `.harness/TASKS.json` is committed and the shell flips `status` to `done` after green CI.
  *Impact:* one extra tiny `[skip ci]` commit per completed task in history (and a Vercel deploy
  trigger, though `[skip ci]` does not skip Vercel — see Project below).
  *Revisit:* squash/clean up if the noise ever bothers you.

- **Task do/doneWhen split across two files (JSON + per-task MD).**
  *Why:* Markdown specs (`.harness/tasks/<TASK>.md`) are far more expressive than a flat JSON string;
  orchestration fields stay in `TASKS.json`.
  *Impact:* a new task is two coupled files — a JSON object with a `spec` path PLUS its MD — and a
  missing/renamed spec leaves the task with an empty body (the loop prompt warns). The two can drift.
  *Revisit:* if drift becomes a problem, add a backlog linter asserting every task has a readable spec
  with both sections.

---

## Project

- **`[skip ci]` skips GitHub Actions but NOT Vercel — every harness status commit triggers a deploy.**
  *Why:* the loop tags its `status=done` bookkeeping commits `[skip ci]` so GitHub Actions doesn't
  re-run on a no-code change. Vercel's git integration does not honour the `[skip ci]` convention, so
  it still builds + deploys those commits.
  *Impact:* a handful of redundant Vercel deploys (one per completed task) of identical site output.
  Harmless (idempotent deploy) but uses build minutes.
  *Revisit:* if deploy minutes matter, add a Vercel `ignoreCommand` (e.g. skip when only `.harness/**`
  changed) or `[skip ci]` handling in a Vercel ignored-build step.

- **CI installs with `npm ci` against the committed `package-lock.json`.**
  *Why:* reproducible installs in Actions.
  *Impact:* a task that changes dependencies must commit BOTH `package.json` and the regenerated
  `package-lock.json` or `npm ci` fails CI. The loop auto-allows the lockfile in scope checks, but the
  builder must actually run `npm install` so the lockfile is updated.
  *Revisit:* n/a — standard npm behaviour, noted so a dependency task doesn't trip CI.
