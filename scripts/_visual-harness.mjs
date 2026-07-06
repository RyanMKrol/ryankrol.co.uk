// Shared hermetic visual-check harness for ryankrol.co.uk.
//
// SINGLE source of truth for driving the site in a headless browser against synthetic
// data. It owns the page list, the synthetic `/api/*` fixtures, the `next start` spawn,
// the request interception (API + external images), and server readiness polling.
//
// ⚠️ LIVING ARTIFACT: when the site's UI surface changes (a page added/removed, an API
// route's response shape changes, a new field a card renders), the PAGES list and/or the
// fixtures below MUST be updated in the SAME change — otherwise the check silently drifts
// from reality (screenshots a stale shape, or fails on an intentionally-removed thing).
//
// Hermetic by design: every `/api/*` call is fulfilled from an in-process fixture and
// every EXTERNAL image (TMDB posters, Google Books covers, Last.fm art) is replaced with
// a local placeholder — so NO DynamoDB, NO Last.fm/GitHub/Hevy/TMDB, NO network at all is
// touched. Data + images are fully deterministic; the visual judgment is done by whoever
// views the PNGs (a human, or the build loop's builder/auditor via the Read tool).
//
// This catches the class of bug that lint/tests/build cannot: an element present in the
// DOM but never PAINTED. The motivating incident is T273 — Markdown review bodies shipped
// with lint/tests/build all green, yet never actually rendered on the live Review card.
// The `movies` fixture below deliberately puts real Markdown (**bold**, a list) in
// `review_text` so a screenshot of /reviews/movies exposes exactly that failure mode.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const APP_DIR = resolve(__dirname, '..'); // repo root — the Next app lives here

// A 1×1 light-grey PNG, served for every external image so cards render an image-shaped
// box (deterministic, zero network) instead of a broken-image icon or a real remote fetch.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// Adversarial strings — long unbroken tokens stress card/line-wrapping without a real API.
const LONG_TITLE = 'A Deliberately Overlong Title That Should Wrap Or Ellipsize Not Overflow The Card 0123456789';

// ── Fixture data ────────────────────────────────────────────────────────────────────
// Realistic shapes per the API route handlers. Ratings: movies/tv/books/albums 0–5,
// perfumes 0–10. Review dates DD-MM-YYYY; workout/exercise dates YYYY-MM-DD.

const lastfmMeta = {
  mbid: '11111111-1111-1111-1111-111111111111',
  url: 'https://www.last.fm/music/x',
  listeners: '482913',
  playcount: '9381822',
  tags: ['electronic', 'ambient', 'idm'],
  trackCount: 12,
  summary: 'A synthetic Last.fm summary used only for the hermetic visual check.',
  releaseDate: '2019-03-01',
  images: [{ '#text': 'https://example.invalid/cover-large.png', size: 'large' }],
};

const movies = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    title: 'Everything Everywhere All At Once',
    rating: 5,
    // T273 guard: real Markdown here — the screenshot must show painted bold + a bullet
    // list, NOT literal ** and - characters.
    review_text: 'A **staggering** achievement.\n\nWhat worked:\n\n- the _editing_\n- the heart\n- the bagel',
    date: '02-07-2026',
    tmdbId: 545611,
    mediaType: 'movie',
    posterPath: '/synthetic-poster.jpg',
    tmdbOverview: 'A synthetic overview for the hermetic visual check.',
    tmdbDate: '2022-03-25',
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    title: LONG_TITLE,
    rating: 3,
    review_text: 'A shorter plain-text review with no Markdown, to compare rendering.',
    date: '15-06-2026',
    tmdbId: 100,
    mediaType: 'movie',
    posterPath: '/synthetic-poster-2.jpg',
    tmdbOverview: null,
    tmdbDate: '2021-01-01',
  },
];

const tv = [
  {
    id: 'b1000000-0000-4000-8000-000000000001',
    title: 'Severance',
    rating: 5,
    review_text: 'Immaculate vibes. The **cold open** alone.',
    date: '20-05-2026',
    tmdbId: 95396,
    mediaType: 'tv',
    posterPath: '/synthetic-tv.jpg',
    tmdbOverview: 'A synthetic overview.',
    tmdbDate: '2022-02-18',
  },
];

const books = [
  {
    id: 'c1000000-0000-4000-8000-000000000001',
    title: 'Piranesi',
    author: 'Susanna Clarke',
    rating: 5,
    review_text: 'Quiet and **luminous**. A house of infinite halls.',
    date: '10-04-2026',
    source: 'googlebooks',
    olid: null,
    coverId: null,
    coverUrl: 'https://example.invalid/piranesi.jpg',
    volumeId: 'synthetic-volume-id',
    bookAuthors: ['Susanna Clarke'],
    firstPublishedYear: 2020,
    isbn: ['9781635575637'],
    subjects: ['Fiction', 'Fantasy'],
    pageCount: 245,
    publisher: ['Bloomsbury'],
  },
];

const albums = [
  {
    id: 'd1000000-0000-4000-8000-000000000001',
    title: 'For Ever',
    artist: 'Jungle',
    rating: 4,
    highlights: 'Groove-forward. **Heavy Water** on repeat.',
    date: '01-03-2026',
    thumbnail: 'https://example.invalid/forever.png',
    lastfm: lastfmMeta,
  },
];

const perfumes = [
  {
    id: 'nuee-bleue-armani-parfum',
    title: 'Nuée Bleue',
    designer: 'Armani',
    type: 'Parfum',
    description: 'Iris, ambrette, a cool **powdery** drydown.',
    rating: 8, // 0–10 scale for perfumes
    fragranticaUrl: 'https://www.fragrantica.com/perfume/x.html',
    ownership: 'Sample',
    longevity: 6, // 0–8
    projection: 3, // 1–4
    seasons: ['Spring', 'Summer'],
    applicationSpots: [{ spot: 'wrists', sprays: 2 }, { spot: 'neck', sprays: 1 }],
    date: '28-02-2026',
    editedDate: '28-02-2026',
  },
];

const vinyl = [
  {
    id: 'e1000000-0000-4000-8000-000000000001',
    title: 'In Rainbows',
    artist: 'Radiohead',
    thumbnail: 'https://example.invalid/inrainbows.png',
    lastfm: lastfmMeta,
  },
  {
    id: 'e1000000-0000-4000-8000-000000000002',
    title: 'Blonde',
    artist: 'Frank Ocean',
    thumbnail: '',
    lastfm: lastfmMeta,
  },
];

const hotTakes = [
  { id: 'f1000000-0000-4000-8000-000000000001', text: 'Pineapple belongs on pizza and this is not controversial.', date: '05-07-2026' },
  { id: 'f1000000-0000-4000-8000-000000000002', text: 'The best code review is the one that ships.', date: '01-07-2026' },
  { id: 'f1000000-0000-4000-8000-000000000003', text: 'Monospace everywhere is a lifestyle.', date: '20-06-2026' },
];

const nowPlaying = {
  isPlaying: true,
  track: {
    name: 'Time (You and I)',
    artist: 'Khruangbin',
    album: 'Mordechai',
    albumArt: 'https://example.invalid/mordechai.png',
    lastFmUrl: 'https://www.last.fm/music/x',
    timestamp: 1751800000,
  },
};

const topAlbums = {
  albums: Array.from({ length: 12 }, (_, i) => ({
    name: i === 0 ? 'Mordechai' : `Album ${i + 1}`,
    artist: i === 0 ? 'Khruangbin' : `Artist ${i + 1}`,
    playcount: 300 - i * 17,
    url: 'https://www.last.fm/music/x',
    image: 'https://example.invalid/album.png',
    rank: i + 1,
  })),
  totalPages: 1,
  page: 1,
  total: 12,
  period: '3month',
};

const githubRepos = {
  repos: [
    { name: 'ryankrol.co.uk', fullName: 'RyanMKrol/ryankrol.co.uk', description: 'Personal site.', url: 'https://github.com/x', language: 'JavaScript', stars: 4, forks: 1, lastPush: '2026-07-05T10:00:00Z', createdAt: '2021-01-01T00:00:00Z', isPrivate: false, topics: ['nextjs', 'dynamodb', 'vercel'], archived: false, commitCount: 812 },
    { name: 'local-jobs', fullName: 'RyanMKrol/local-jobs', description: null, url: 'https://github.com/x', language: 'TypeScript', stars: 2, forks: 0, lastPush: '2026-07-06T09:00:00Z', createdAt: '2025-06-01T00:00:00Z', isPrivate: false, topics: ['typescript', 'nextjs'], archived: false, commitCount: 451 },
    { name: 'RatingsPlotter-Site', fullName: 'RyanMKrol/RatingsPlotter-Site', description: 'Archived project.', url: 'https://github.com/x', language: 'JavaScript', stars: 0, forks: 0, lastPush: '2022-01-01T00:00:00Z', createdAt: '2020-01-01T00:00:00Z', isPrivate: false, topics: ['react'], archived: true, commitCount: 120 },
  ],
  total: 3,
  username: 'RyanMKrol',
};

// Workout/exercise fixtures (dynamic-route pages use the fixed ids in PAGES below).
const workoutSet = (over = {}) => ({ type: 'working', weight_kg: 60, reps: 10, isWeightPR: false, is1RMPR: false, isVolumePR: false, ...over });
const workoutExercise = (over = {}) => ({
  id: 'ex-0001', title: 'Chest Press (Machine)',
  sets: [workoutSet({ type: 'warmup', weight_kg: 40, reps: 12 }), workoutSet({ weight_kg: 42.5, reps: 12, isVolumePR: true }), workoutSet({ weight_kg: 45, reps: 8 })],
  ...over,
});
const workoutObj = (over = {}) => ({
  id: 'w1', title: 'Push', start_time: '2026-07-05T08:00:00Z', end_time: '2026-07-05T09:05:00Z',
  totalVolume: 8420, totalWorkingSets: 18, totalWarmupSets: 5, uniqueExercises: 6, durationMinutes: 65,
  workoutType: 'Push', workoutDate: '2026-07-05',
  exercises: [workoutExercise(), workoutExercise({ id: 'ex-0002', title: 'Iso-Lateral High Row (Machine)', sets: [workoutSet({ weight_kg: 50, reps: 12, isWeightPR: true, is1RMPR: true })] })],
  ...over,
});

const workoutsList = { workouts: [workoutObj(), workoutObj({ id: 'w2', title: 'Pull', workoutType: 'Pull', workoutDate: '2026-07-03', start_time: '2026-07-03T08:00:00Z', end_time: '2026-07-03T09:00:00Z' })] };

const workoutExercisesDetail = {
  workoutId: 'w1',
  exercises: [
    {
      id: 'ex-0001', workout_id: 'w1', exercise_name: 'Chest Press (Machine)', exercise_index: 0, exerciseType: 'strength',
      sets: [workoutSet({ type: 'warmup', weight_kg: 30, reps: 15 }), workoutSet({ weight_kg: 42.5, reps: 12, isVolumePR: true }), workoutSet({ weight_kg: 45, reps: 10 })],
      heaviestWeight: 45, bestEstimated1RM: 56, bestSetVolume: 510, sessionVolume: 1470, totalDistance: null, totalDuration: null, workout_date: '2026-07-05',
    },
    {
      id: 'ex-0002', workout_id: 'w1', exercise_name: 'Iso-Lateral High Row (Machine)', exercise_index: 1, exerciseType: 'strength',
      sets: [workoutSet({ type: 'warmup', weight_kg: 35, reps: 15 }), workoutSet({ weight_kg: 50, reps: 12, isWeightPR: true, is1RMPR: true }), workoutSet({ weight_kg: 50, reps: 10 })],
      heaviestWeight: 50, bestEstimated1RM: 66, bestSetVolume: 600, sessionVolume: 1625, totalDistance: null, totalDuration: null, workout_date: '2026-07-05',
    },
  ],
};

const exerciseHistory = {
  exerciseName: 'Chest Press (Machine)',
  history: Array.from({ length: 8 }, (_, i) => ({
    id: `hist-${i}`, exercise_name: 'Chest Press (Machine)', workout_id: `w${i}`, workout_date: `2026-0${(i % 6) + 1}-10`,
    exerciseType: 'strength',
    sets: [workoutSet({ type: 'warmup', weight_kg: 30, reps: 15 }), workoutSet({ weight_kg: 40 + i * 2, reps: 10 }), workoutSet({ weight_kg: 40 + i * 2, reps: 8 })],
    heaviestWeight: 40 + i * 2, bestEstimated1RM: 50 + i * 2, bestSetVolume: 400 + i * 20,
    sessionVolume: 1200 + i * 90, // drives the Session-volume chart + total/avg stats (the page reads h.sessionVolume, not the sets)
    totalDistance: null, totalDuration: null, exercise_index: 0,
  })),
};

const workoutStats = {
  totalWorkouts: 142, totalVolume: 982340, averageDuration: 63,
  workoutTypes: { Push: 48, Pull: 47, Legs: 47 }, bestSessionVolume: 11200,
  monthlyVolume: Array.from({ length: 6 }, (_, i) => ({ month: `2026-0${i + 1}`, label: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]} 2026`, totalVolume: 120000 + i * 8000 })),
};

// ── fixtureFor: map a request pathname → a synthetic response ──────────────────────────
export function fixtureFor(pathname) {
  // Reviews (arrays)
  if (pathname === '/api/reviews/movies') return movies;
  if (pathname === '/api/reviews/tv') return tv;
  if (pathname === '/api/reviews/books') return books;
  if (pathname === '/api/reviews/albums') return albums;
  if (pathname === '/api/reviews/perfumes') return perfumes;
  // Collections / misc
  if (pathname === '/api/vinyl') return vinyl;
  if (pathname === '/api/hot-takes') return hotTakes;
  if (pathname === '/api/lastfm/now-playing') return nowPlaying;
  if (pathname === '/api/lastfm/top-albums') return topAlbums;
  if (pathname === '/api/github/repos') return githubRepos;
  // Workouts / exercises
  if (pathname === '/api/workouts/stats') return workoutStats;
  if (pathname === '/api/workouts') return workoutsList;
  if (/^\/api\/workouts\/[^/]+\/exercises$/.test(pathname)) return workoutExercisesDetail;
  if (/^\/api\/workouts\/[^/]+$/.test(pathname)) return workoutObj();
  if (pathname.startsWith('/api/exercises/history/')) return exerciseHistory;
  // Unknown route → empty-but-valid. Log so a missing fixture is visible, not silent.
  console.warn(`[visual-harness] no fixture for ${pathname} — returning []`);
  return [];
}

// ── PAGES: the screenshot surface. waitFor selectors are optional. ─────────────────────
export const PAGES = [
  { name: 'home', path: '/' },
  { name: 'listening', path: '/listening' },
  { name: 'projects', path: '/projects' },
  { name: 'vinyl', path: '/vinyl' },
  { name: 'hot-takes', path: '/hot-takes' },
  { name: 'reviews-movies', path: '/reviews/movies' },
  { name: 'reviews-tv', path: '/reviews/tv' },
  { name: 'reviews-books', path: '/reviews/books' },
  { name: 'reviews-albums', path: '/reviews/albums' },
  { name: 'reviews-perfumes', path: '/reviews/perfumes' },
  { name: 'workouts', path: '/workouts' },
  { name: 'workout-detail', path: '/workouts/w1' },
  { name: 'exercise', path: '/exercises/Chest%20Press%20(Machine)' },
];

// ── Request interception ───────────────────────────────────────────────────────────────
/**
 * Serve every `/api/*` call from a fixture, and replace every EXTERNAL image with a local
 * placeholder — so the run is fully hermetic. App assets (HTML/CSS/JS/fonts on localhost)
 * pass through to the real `next start`.
 */
export async function routeApi(ctx) {
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.startsWith('/api/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureFor(url.pathname)) });
    }
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!isLocal && req.resourceType() === 'image') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PLACEHOLDER_PNG });
    }
    return route.continue();
  });
}

/** Spawn a production `next start` on the given port. Caller must `server.kill('SIGTERM')`. */
export function startServer(port) {
  const server = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: APP_DIR, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', (d) => process.env.DEBUG && console.error(String(d)));
  return server;
}

/** Poll until the server answers (200 or 404 both mean "up"). */
export async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`site did not come up at ${url} within ${timeoutMs}ms`);
}
