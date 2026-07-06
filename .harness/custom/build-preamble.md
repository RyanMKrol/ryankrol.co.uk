# Project build guidance — BUILDER prompt preamble

Standing rules for every build in this repo, regardless of the task.

## Never make live external-service calls during a build or its verification

This app talks to several live, quota-limited/paid or side-effecting external services — **TMDB**,
**Google Books**, **Last.fm**, **Hevy**, and **GitHub** (see the env-var table in the root `CLAUDE.md`).
During a build and its verification you must NOT hit any of them live:

- **Verify visually through the hermetic harness.** `node scripts/visual-check.mjs` serves every `/api/*`
  from in-process fixtures with NO DynamoDB and NO network — that is the sanctioned way to exercise
  pages/components. Extend `scripts/_visual-harness.mjs`'s fixtures rather than reaching for the real API.
- **Verify logic through the co-located `*.test.js` (jsdom) tests**, which never touch the network. New
  pure logic in `src/lib` ships with tests (per the root `CLAUDE.md` Definition of Done).
- **Do NOT trigger real side effects during verification:** no real `vercel --prod` deploy (deployment is
  the `on-drained` hook's job, never a build step), and nothing that fires the **Hevy backfill** — recall
  that an uncached `GET /api/workouts` (page 1) or `/api/workouts/stats` kicks off a live Hevy fetch on a
  cache miss. Don't run those against a real key to "check it works."
- **Secrets stay in `process.env`** (managed in Vercel) — never hardcode a key or write one into a tracked
  file to make a call succeed. The repo is public.

If a task genuinely cannot be built or verified without a real external call, **do not make it** — stop and
record `failed:blocked <TASK> needs a live <service> call` for a human, rather than burning quota or
producing an unverifiable build.

## Definition of Done still applies

Run the repo's real gates before claiming done — `npm run lint` (no new errors), `npm test`, `npm run
build` — and update `CLAUDE.md` / `README.md` in the SAME change when you touch pages, API routes/data
flow, the data model, conventions, or config (docs are part of the change, not optional cleanup).
