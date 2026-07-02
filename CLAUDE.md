# CLAUDE.md — working in this repo

Guidance for Claude when asked to change or extend **ryankrol.co.uk** — a personal
Next.js site (pages router) backed by DynamoDB and deployed on Vercel.

## ⛔ Every session: read first, before any work

At the START of every session in this repo — before planning, answering, or editing
anything — **read these in full so you have current context:**

1. **This file (`CLAUDE.md`)** — architecture, conventions, how to add things.
2. **`README.md`** — what the app is, how to run it, and the DynamoDB table schemas.

These are the source of truth for how the project works between sessions. They are kept
deliberately current (see the rule below), so trust them — but if you find them
contradicting the code, the code wins: fix the docs to match and flag it. Don't assume
you remember the project from a previous session; re-read.

## ✅ Documentation is part of every change (Definition of Done)

**A change to this repo is not "done" until the docs are updated in the same change.**
Keeping `CLAUDE.md` and `README.md` current is not optional cleanup — it is part of the
task. Treat stale docs as a bug.

Update the docs **as you go**, in the same commit as the code, whenever you change any of:

- **Pages / features** — added/removed/renamed a page or section → update the file map +
  "What this project is".
- **API routes or data flow** — new route, changed caching, new external API → update the
  Architecture + API/caching tables.
- **Data model** — new DynamoDB table or changed record shape → update the Data model
  section here AND the schema section in `README.md`.
- **Conventions** — a new rule about how code here should be written → add it below.
- **Config** — new env var → document it in the Environment section + tell the user to add
  it to Vercel.

Before declaring a task complete: does `CLAUDE.md` still describe how to work here, does
`README.md` still describe what the app does + its schemas, and did I add anything that
should appear in the file map or data model? If yes-but-not-reflected, it's **not done**.

## 🔐 Secrets & git hygiene (non-negotiable)

This repo is **public** (`github.com/RyanMKrol/ryankrol.co.uk`). Hard rules:

1. **Never commit credentials.** No AWS keys, API keys, tokens, or the site password in
   any tracked file. All secrets live in env vars read via `process.env` and are managed in
   **Vercel** (`vercel env pull .env.local --environment production` to get them locally).
   `.env*.local` is gitignored — never commit it.
2. **Mutations are password-gated.** Every write endpoint checks `process.env.RYANKROL_SITE_KEY`
   against a `password` field in the request body. Keep new write endpoints gated the same way.

**Key env vars** (managed in Vercel; never hardcode):

| Var | Purpose |
|---|---|
| `RYANKROL_SITE_KEY` | Write-gate password for all mutation routes |
| `LAST_FM_API_KEY` / `LAST_FM_USERNAME` | Last.fm API |
| `HEVY_API_KEY` | Hevy workout API |
| `GITHUB_TOKEN` | GitHub repo listing |
| `TMDB_API_TOKEN` | TMDB v4 Read Access Token (JWT). Used **server-side only** in `/api/tmdb/search` — `Authorization: Bearer` header, never a query param, never sent to the client |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key. Used **server-side only** in `/api/books/search` (`?provider=googlebooks`) as the `key` query param. Without it, Google buckets requests into a shared per-IP anonymous quota that is perpetually exhausted from Vercel's datacenter IPs → 429s in production |

Before any commit: `git status` and confirm no `.env*`, no credentials are staged. The
`.harness/` ideas inbox + seed data are gitignored on purpose — don't commit those either.

## What this project is

A personal website with five content areas, all served from the Next.js **pages router**:

- **Reviews** — `movies`, `tv`, `books`, `albums`: rated 0–5 with written thoughts, stored in
  DynamoDB. Each type has a public list view + a password-gated add/edit/delete flow.
- **Vinyl** — a collection list (title/artist), password-gated add.
- **Workouts / exercises** — workout history + per-exercise progress charts, sourced from the
  **Hevy API** and mirrored into DynamoDB (`Workouts` + `Exercises` tables) with computed
  metrics (volume, estimated 1RM, etc.).
- **Listening** — Last.fm top albums (3-month) + a live "now playing" widget.
- **Projects** — GitHub repos for the owner, fetched live.

There's also a **Matrix terminal theme** easter egg (Konami code ↑↑↓↓←→←→BA) layered over the
default theme via CSS custom properties.

Keep it **simple**. This is a personal site, not a platform — no new infra (auth providers,
state libraries, ORMs, server frameworks) unless explicitly asked.

## Architecture (how it fits together)

```
Browser (React pages, client-side fetch in useEffect)
   │
   ▼
Next.js API routes (src/pages/api/**)  ── every route wraps its work in ──▶ withApiCache
   │                                                                         (in-memory NodeCache,
   │  reads: scan/query DynamoDB OR call an external API                      4h default TTL)
   │  writes: password-gated, then clearApiCache('api-<type>')
   ▼
src/lib (the data layer)
   ├─ dynamo.js          docClient + paginatedScan + scanTable   ──▶ AWS DynamoDB (us-east-2)
   ├─ apiCache.js        withApiCache / generateCacheKey / clearApiCache
   ├─ tmdb.js            mapTmdbResult / tmdbPosterUrl — pure normalisation for TMDB results
   ├─ googlebooks.js     mapGoogleBooksResult — pure normalisation for Google Books volumes items
   ├─ workoutQueries.js  all workout/exercise DynamoDB reads
   └─ workoutMetrics.js  pure metric math (volume, 1RM) — shared by scripts + backfill
```

- **Pages fetch client-side.** Most pages render then fetch their data from an API route in a
  `useEffect` (no `getServerSideProps`/`getStaticProps` data fetching). So pages build static
  and the API routes are the only DynamoDB/external-API callers.
- **API routes are thin.** They parse params, gate writes on the password, delegate reads to
  `src/lib`, and wrap everything in the cache. Business logic that isn't trivial belongs in
  `src/lib`, not inline in the route.
- **Caching is mandatory + in-memory.** Every read route goes through `withApiCache`. ⚠️ The
  cache is a **per-process NodeCache** — on Vercel each serverless instance has its own. A write's
  `clearApiCache(...)` only busts the instance that served the write; other instances keep stale
  data until TTL. The `/dev/cache` page (+ `POST /api/dev/cache-bust`) exists to flush manually.

## File map

| Path | Responsibility |
|---|---|
| `src/pages/_app.js` | Wraps every page in `MatrixLayout`; `useKonamiCode()` toggles matrix mode |
| `src/pages/_document.js` | HTML scaffold; loads Google font; boots matrix class from `sessionStorage` pre-paint |
| `src/pages/index.js` | Home: tagline, `NowPlaying` widget, link grid to all sections |
| `src/pages/listening/index.js` | Last.fm top-50 albums (3-month) with playcount bars |
| `src/pages/projects/index.js` | GitHub repo cards (stars/forks/last-push/topics) |
| `src/pages/vinyl/{index,add}.js` | Vinyl list (grouped by artist surname) + gated add form |
| `src/pages/reviews/<type>/index.js` | Public list view for a review type (sort by date/title/score) |
| `src/pages/reviews/<type>/add.js` | Gated add form → POST add API |
| `src/pages/reviews/<type>/edit.js` | List of reviews with edit links |
| `src/pages/reviews/<type>/edit/[id].js` | Edit detail form → update/delete API (`[id]` = URL-encoded title) |
| `src/pages/workouts/index.js` | Paginated workout list with All/Push/Pull/Legs filter |
| `src/pages/workouts/[id].js` | Single workout detail |
| `src/pages/exercises/[exerciseName].js` | Per-exercise stats + progress charts |
| `src/pages/dev/cache.js` | Cache-management dashboard (auto-auths on localhost) |
| `src/pages/api/reviews/<type>/{index,add,update,delete}.js` | CRUD for each review type |
| `src/pages/api/vinyl/{index,add}.js` | Vinyl read + gated add |
| `src/pages/api/workouts.js`, `workouts/[id].js`, `workouts/[id]/exercises.js`, `workouts/stats.js`, `workouts/backfill.js` | Workout reads + Hevy backfill trigger |
| `src/pages/api/exercises/[workoutId].js`, `exercises/history/[exerciseName].js` | Exercise reads |
| `src/pages/api/github/repos.js` | GitHub repos proxy; rate-limited 20 req/60s per IP via `src/lib/rateLimit.js` |
| `src/pages/api/lastfm/{now-playing,top-albums}.js` | Last.fm proxies; rate-limited 20 req/60s per IP via `src/lib/rateLimit.js` |
| `src/pages/api/lastfm/album-search.js` | Last.fm `album.search` proxy (`?query=`); returns `{ results: [mapAlbumSearchResult, ...] }`; rate-limited 20 req/60s per IP via `src/lib/rateLimit.js` |
| `src/pages/api/lastfm/album-info.js` | Last.fm `album.getInfo` proxy (`?artist=&album=` or `?mbid=`); returns `{ info: mapAlbumInfo }`; rate-limited 20 req/60s per IP via `src/lib/rateLimit.js` |
| `src/pages/api/dev/cache-bust.js` | Cache stats (GET) / flush-all (POST), gated off localhost |
| `src/pages/api/tmdb/search.js` | TMDB search proxy (`?query=&type=movie\|tv`); authenticates with `TMDB_API_TOKEN` server-side; rate-limited 20 req/60s per IP via `src/lib/rateLimit.js` |
| `src/pages/api/books/search.js` | Google Books search proxy (`?title=` required, `?author=` optional); appends `GOOGLE_BOOKS_API_KEY` server-side (falls back to keyless anonymous quota with a warning if unset); rate-limited 20 req/60s per IP via `src/lib/rateLimit.js` |
| `src/lib/lastfm.js` | `mapAlbumSearchResult(raw)` + `mapAlbumInfo(raw)` — pure normalisers for Last.fm album search/info responses |
| `src/lib/openlibrary.js` | `mapBookResult(doc)` normaliser + `bookCoverUrl(coverId, size)` helper |
| `src/lib/googlebooks.js` | `mapGoogleBooksResult(volume)` normaliser — maps Google Books `volumeInfo` to common shape with `source:'googlebooks'`, https `coverUrl`, ISBNs, year from `publishedDate` |
| `src/lib/dynamo.js` | `docClient`, `paginatedScan`, `scanTable` (region hardcoded `us-east-2`) |
| `src/lib/apiCache.js` | `withApiCache`, `generateCacheKey`, `clearApiCache`, `getCacheStats` |
| `src/lib/rateLimit.js` | `checkRateLimit`, `getClientIp` — fixed-window rate limiter; **per-serverless-instance only**, does not coordinate across Vercel instances (same limitation as `apiCache.js`) |
| `src/lib/tmdb.js` | `mapTmdbResult(raw, type)` normaliser + `tmdbPosterUrl(path)` helper |
| `src/lib/constants.js` | `DYNAMO_TABLES` — the single source of table names |
| `src/lib/workoutQueries.js` | All workout/exercise DynamoDB reads |
| `src/lib/workoutMetrics.js` | Pure metric math (`calculateEstimated1RM`, `calculate{Exercise,Workout}Metrics`) |
| `src/lib/workoutBackfill.js` | Background fetch of missing workouts from Hevy → DynamoDB (on cache miss) |
| `src/components/*` | Presentational components (see below) |
| `src/hooks/*` | `useChartTheme`, `useKonamiCode`, `useMatrixActive` |
| `src/styles/globals.css` | CSS custom properties: `:root` default + `html.matrix-active` override |
| `src/scripts/*` | One-shot ops scripts (table creation, data migration, audits) — run via npm |

**Components:** `Header`, `NowPlaying` (Last.fm poll every 60s), `MarqueeText`, `ReviewCard`,
`StarRating`, `WorkoutCard`, `ExerciseProgressCharts` / `CardioProgressCharts` (chart.js),
`MatrixLayout` / `MatrixRain` / `CRTOverlay` (the easter egg). `MatrixLayout` also owns the
global fixed 🎨 appearance trigger + `AppearancePicker` modal (present on every page, incl. home).

## Data model (DynamoDB)

Table names live ONLY in `src/lib/constants.js` (`DYNAMO_TABLES`) — never hardcode a table name.
Full workout/exercise schemas are in `README.md`; summary:

| Table | Key(s) | Notes |
|---|---|---|
| `MovieRatingsV3` | `title` | `{ title, rating(0–5), review_text, date 'DD-MM-YYYY' }` |
| `TelevisionRatingsV3` | `title` | same shape as movies |
| `BookRatingsV3` | `title` + `author` | adds `author`; `review_text` comes from form field `overview`; optional search fields: `source` (`'openlibrary'`\|`'googlebooks'`), `coverUrl` (Google Books full URL), `volumeId` (Google Books), `olid`/`coverId` (Open Library), `bookAuthors`, `firstPublishedYear`, `isbn`, `subjects`, `pageCount`, `publisher` |
| `AlbumRatingsV2` | `title` + `artist` | `{ title, artist, rating, highlights, date, thumbnail (Last.fm cover URL or ''), lastfm? { mbid, url, listeners, playcount, tags, trackCount, summary, releaseDate, images } }` |
| `VinylCollection` | `title` + `artist` | `{ title, artist, thumbnail (Last.fm cover URL or ''), lastfm? { mbid, url, listeners, playcount, tags, trackCount, summary, releaseDate, images } }` |
| `Workouts` | `id` | GSI `start_time-index`; computed metrics (volume, type, duration) |
| `Exercises` | `exercise_id` | GSIs `workout_id-index`, `exercise_name-workout_date-index` |

**Review field quirks to know:** the form field is `gist` for movies/tv, `overview` for books,
`highlights` for albums — all map to the stored review text. Ratings are **0–5** (migrated down
from a legacy 0–10 scale). Dates are stored `DD-MM-YYYY` (`toLocaleDateString('en-GB')`).

## Recipe: how to add a review type (the common request)

The reviews are an almost mechanical pattern. To add a new type (e.g. `perfumes`):

1. **Table:** add it to `DYNAMO_TABLES` in `src/lib/constants.js`, and create the DynamoDB table
   (pick the partition key — `title`, or a composite like `title`+`brand` if titles aren't
   unique). Mirror the `src/scripts/createWorkoutTables.js` style if scripting it.
2. **API routes** under `src/pages/api/reviews/<type>/`:
   - `index.js` — `GET`; `withApiCache(generateCacheKey('<type>'), () => scanTable(DYNAMO_TABLES.X))`.
   - `add.js` — `POST`; gate on `RYANKROL_SITE_KEY`, `PutCommand`, set `date` via
     `new Date().toLocaleDateString('en-GB').replace(/\//g,'-')`, then `clearApiCache('api-<type>')`.
   - `update.js` — gate; `GetCommand` to preserve the original `date`, `DeleteCommand` the old
     item if the key changed, then `PutCommand`; `clearApiCache('api-<type>')`. (Albums instead
     use `UpdateCommand` in place — either is fine; match whichever key model you chose.)
   - `delete.js` — gate; `DeleteCommand` by key; `clearApiCache('api-<type>')`.
3. **Pages** under `src/pages/reviews/<type>/`: `index.js` (fetch + sort + `ReviewCard` grid),
   `add.js` (form → add API), `edit.js` (list with edit links), `edit/[id].js` (detail form →
   update/delete; `[id]` is the URL-encoded title).
4. **Link it** from the home grid in `src/pages/index.js`.
5. **Tests + docs:** add tests for any new pure logic, and update this file's data model + file
   map and `README.md`'s schema section in the same commit.

## Conventions

- **JavaScript, Next.js pages router.** No TypeScript. Match the existing style (functional
  components, hooks). React 19 / Next 15.
- **All DynamoDB access goes through `src/lib`.** Use `docClient` + `paginatedScan`/`scanTable`
  from `dynamo.js`; never construct a client inline. Table names come from `constants.js`.
- **Every read API route uses `withApiCache`.** Build the key with `generateCacheKey(endpoint,
  params)` → `api-<endpoint>[-k:v...]`. Don't cache by hand or skip the wrapper.
- **Every write clears its cache.** After a successful mutation call `clearApiCache('api-<type>')`
  (exact key, or an `'api-<type>*'` wildcard for parameterised keys). Keep the cleared key in sync
  with the read key — a mismatch silently leaves stale data (see Gotchas).
- **Writes are password-gated** on `RYANKROL_SITE_KEY`. Non-GET methods that don't gate are a bug.
- **Theming is CSS-custom-property driven.** Colours/fonts come from `:root` in `globals.css`,
  overridden by `html.matrix-active`. **Charts must read theme via `useChartTheme()`** — never
  hardcode colours in a chart component; the hook reads the CSS vars and re-reads on theme change.
- **Respect `prefers-reduced-motion`.** The Matrix rain stops after one frame and CSS flicker is
  disabled under it — keep any new animation guarded the same way.
- **Be generous with `console.log` in API routes / lib.** The codebase logs cache hits/misses and
  DynamoDB timings with emoji prefixes — match that; it's the visibility story on Vercel.
- **Date charts use a chart.js `time` scale.** All charts with a date x-axis use `type: 'time'`
  (via `chartjs-adapter-date-fns`) with `{x: <ms-timestamp>, y: <value>}` data points — never
  category labels. Use `toTimeSeries(rows, getDate, getValue)` from `src/lib/chartTime.js` to map
  rows, and spread `timeScaleOptions` into the `scales.x` block. Exception: aggregated bar charts
  (e.g. frequency-by-month with string labels) stay as category scale.
- **Search-trigger buttons enforce a 2s client-side cooldown.** `TmdbSearch.js`, `BookSearch.js`,
  and `LastfmAlbumSearch.js` each set a `cooldown` state true on click and clear it after 2s via
  `setTimeout`, factored into the button's `disabled` alongside `searching` — this is on top of,
  not instead of, the backend per-route rate limit (`src/lib/rateLimit.js`); keep both layers when
  touching these components.

## Definition of Done & checks

Run before declaring done, and keep them green:

- **`npm run lint`** — ESLint (flat config, `eslint-config-next` / core-web-vitals) must report
  **no errors**. A handful of `react-hooks/exhaustive-deps` *warnings* are tolerated (they don't
  fail the gate); don't introduce new errors. `npm run lint:fix` auto-fixes what it can.
- **`npm test`** — the Jest suite (via `next/jest`; jsdom env). **New logic ships with tests** —
  especially pure functions in `src/lib`. Tests are co-located as `*.test.js`.
- **`npm run build`** — `next build` must succeed.
- **Docs updated** in the same commit (the rule above).
- Vercel auto-deploys `main` on push, so `main` must always be build-green.

**ESLint setup:** flat config in `eslint.config.mjs` extends `next/core-web-vitals`, ignores build
artefacts, and adds a jest-globals override for `*.test.js`. `npm run lint` runs the `eslint` CLI
directly (not the deprecated `next lint`).

**Known gaps (flag, don't silently work around):**
- **`react-hooks/exhaustive-deps` warnings** remain in a couple of pages (`dev/cache`,
  `workouts/index`) — pre-existing intentional-looking effect deps, left as warnings rather than
  changing behaviour. Worth revisiting, not urgent.
- **No component/integration tests yet** — only pure-logic unit tests. Adding React Testing
  Library coverage for the review forms / charts is a good next step (the deps are installed).

## Gotchas

- **Workout pagination scans the whole table then slices in memory.** `getWorkoutsPaginated`
  (`workoutQueries.js`) `paginatedScan`s ALL workouts, sorts, and `.slice()`s the page — there's
  no DynamoDB-native paging, and the Push/Pull/Legs filter is applied client-side to the current
  page only. (This is the root of the known pagination bug.)
- **Cache is per serverless instance** (see Architecture) — a write only busts the instance that
  served it. Use `/dev/cache` to flush everywhere if you need an immediate global refresh.
- **Workout backfill fires on cache miss.** `GET /api/workouts` (page 1) and `GET /api/workouts/stats`
  trigger an async Hevy backfill on a cache miss — first uncached hit can lag while it fetches.
- **DynamoDB region is hardcoded** `us-east-2` in `dynamo.js`.
- **Matrix mode** persists in `sessionStorage('matrix-active')` and is re-applied pre-paint in
  `_document.js`; it toggles the `matrix-active` class on `<html>`.

## Autonomous build harness (Ralph loop)

This repo has the `.harness/` autonomous builder (see `.harness/HARNESS.md`). When you are invoked
by the loop, obey `.harness/CLAUDE.md` in addition to everything above. Key points: you work
directly on `main`, build ONE task, commit, and stop (the loop handles push + CI); never hand-edit
a task's `status` in `.harness/TASKS.json`; add backlog tasks via the `ralph-loop-add-to-backlog`
skill. The `.harness/IDEAS.md` inbox + `perfume-seed-data.tsv` are gitignored and private.
