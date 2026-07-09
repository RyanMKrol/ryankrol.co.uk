// Shared hermetic visual-check harness for ryankrol.co.uk.
//
// SINGLE source of truth for driving the site in a headless browser against synthetic data. It owns
// the page list (`PAGES`), the interaction flows (`FLOWS`), the synthetic `/api/*` fixtures, the
// `next start` spawn, request interception (API + external images), and server readiness polling.
//
// ⚠️ LIVING ARTIFACT: when the UI surface changes (a page added/removed, an API response shape
// changes, a card renders a new field, a new sort/filter/toggle) update PAGES/FLOWS/fixtures in the
// SAME change — otherwise the check screenshots a stale shape, fails on an intentionally-removed
// thing, or a sort/filter flow silently becomes trivial because the fixtures lost their variety.
//
// Hermetic by design: every `/api/*` call is fulfilled from an in-process fixture and every EXTERNAL
// image is replaced with a placeholder — NO DynamoDB, NO external APIs, NO network. Data + images are
// deterministic; the visual judgment is done by whoever views the PNGs (a human, or the build loop's
// auditor via the Read tool). Catches the bug class lint/tests/build can't: an element present in the
// DOM but never PAINTED (T273 — Markdown review bodies that shipped green yet never rendered). Several
// review fixtures carry real Markdown in their body so a screenshot exposes exactly that.
//
// Fixtures are deliberately VARIED (spread of titles A→Z, ratings, dates, ownership, topics, workout
// types + date ranges) so every sort / filter / search flow visibly changes the page. Keep them varied.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const APP_DIR = resolve(__dirname, '..'); // repo root — the Next app lives here

// A 1×1 light-grey PNG, served for every external image so cards render an image-shaped box.
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// Markdown body (bold + list) — its rendering is the T273 guard. And a plain one to compare.
const MD = 'A **staggering** piece of work.\n\nWhat lands:\n\n- the _craft_\n- the pacing\n- the ending';
const PLAIN = 'A solid, enjoyable one — plain text, no Markdown, for comparison.';
const lastfmMeta = {
  mbid: '11111111-1111-1111-1111-111111111111', url: 'https://www.last.fm/music/x',
  listeners: '482913', playcount: '9381822', tags: ['electronic', 'ambient'], trackCount: 12,
  summary: 'Synthetic Last.fm summary for the hermetic visual check.', releaseDate: '2019-03-01',
  images: [{ '#text': 'https://example.invalid/cover.png', size: 'large' }],
};

// ── Reviews ───────────────────────────────────────────────────────────────────────────────────
// Titles intentionally UNSORTED, with a spread of ratings + dates so sort flows visibly reorder.
// Some titles contain "the"/a distinctive word so search flows visibly filter.
const mkScreen = (title, rating, date, over = {}) => ({
  id: `id-${title.replace(/\W+/g, '-').toLowerCase()}`, title, rating, review_text: over.md ? MD : PLAIN,
  date, tmdbId: 100, mediaType: over.mediaType || 'movie', posterPath: '/synthetic.jpg',
  tmdbOverview: 'Synthetic overview.', tmdbDate: '2021-01-01',
});
const movies = [
  mkScreen('Arrival', 5, '02-01-2026', { md: true }),
  mkScreen('The Batman', 3, '18-11-2025'),
  mkScreen('Dune', 4, '25-06-2026', { md: true }),
  mkScreen('Everything Everywhere All At Once', 5, '02-07-2026'),
  mkScreen('The Grand Budapest Hotel', 5, '14-03-2025'),
  mkScreen('Inception', 4, '30-09-2025'),
  mkScreen('Parasite', 5, '21-05-2026'),
  mkScreen('The Social Network', 4, '09-02-2026'),
  mkScreen('Whiplash', 3, '11-12-2025'),
  // Missing tmdbId — needsMovieBackfill(item) is true, so these surface on /reviews/movies/backfill.
  { ...mkScreen('Blade Runner', 5, '01-08-2025'), tmdbId: null },
  { ...mkScreen('Moon', 4, '15-02-2025'), tmdbId: null },
];
// TMDB search results for the backfill flow — more than 3 so the T338 cap-at-3 is visible.
const tmdbSearchResults = [
  { tmdbId: 201, title: 'Blade Runner', date: '1982-06-25', posterPath: '/synthetic.jpg', overview: 'A blade runner must pursue and terminate replicants.', mediaType: 'movie' },
  { tmdbId: 202, title: 'Blade Runner 2049', date: '2017-10-06', posterPath: '/synthetic.jpg', overview: 'A young blade runner discovers a long-buried secret.', mediaType: 'movie' },
  { tmdbId: 203, title: 'Blade Runner: Black Out 2022', date: '2017-08-27', posterPath: '/synthetic.jpg', overview: 'An anime short bridging the two films.', mediaType: 'movie' },
  { tmdbId: 204, title: 'Blade Runner: Black Lotus', date: '2021-11-14', posterPath: '/synthetic.jpg', overview: 'A spin-off anime series.', mediaType: 'movie' },
  { tmdbId: 205, title: 'Blade Runner (workprint)', date: '1982-01-01', posterPath: '/synthetic.jpg', overview: 'An early workprint cut.', mediaType: 'movie' },
];
const tv = [
  mkScreen('Andor', 5, '20-05-2026', { mediaType: 'tv', md: true }),
  mkScreen('Breaking Bad', 5, '01-01-2025', { mediaType: 'tv' }),
  mkScreen('The Bear', 4, '12-06-2026', { mediaType: 'tv' }),
  mkScreen('Fleabag', 5, '03-03-2026', { mediaType: 'tv' }),
  mkScreen('The Leftovers', 4, '28-08-2025', { mediaType: 'tv' }),
  mkScreen('Severance', 5, '15-04-2026', { mediaType: 'tv' }),
  mkScreen('Succession', 4, '07-10-2025', { mediaType: 'tv' }),
  mkScreen('Twin Peaks', 3, '19-11-2025', { mediaType: 'tv' }),
];
const mkBook = (title, author, rating, date, md) => ({
  id: `bk-${title.replace(/\W+/g, '-').toLowerCase()}`, title, author, rating, review_text: md ? MD : PLAIN,
  date, source: 'googlebooks', coverUrl: 'https://example.invalid/cover.jpg', volumeId: 'v1',
  bookAuthors: [author], firstPublishedYear: 2018, isbn: ['9780000000000'], subjects: ['Fiction'],
  pageCount: 300, publisher: ['Synthetic Press'], olid: null, coverId: null,
});
const books = [
  mkBook('Piranesi', 'Susanna Clarke', 5, '10-04-2026', true),
  mkBook('The Overstory', 'Richard Powers', 4, '22-01-2026'),
  mkBook('Anathem', 'Neal Stephenson', 3, '05-09-2025'),
  mkBook('Klara and the Sun', 'Kazuo Ishiguro', 4, '17-06-2026'),
  mkBook('The Left Hand of Darkness', 'Ursula K. Le Guin', 5, '02-02-2025', true),
  mkBook('Project Hail Mary', 'Andy Weir', 4, '30-11-2025'),
  mkBook('Circe', 'Madeline Miller', 5, '14-05-2026'),
  mkBook('Recursion', 'Blake Crouch', 3, '08-08-2025'),
  mkBook('Babel', 'R. F. Kuang', 4, '26-03-2026'),
];
const mkAlbum = (title, artist, rating, date, md) => ({
  id: `al-${title.replace(/\W+/g, '-').toLowerCase()}`, title, artist, rating, highlights: md ? MD : PLAIN,
  date, thumbnail: 'https://example.invalid/album.png', lastfm: lastfmMeta,
});
const albums = [
  mkAlbum('For Ever', 'Jungle', 4, '01-03-2026', true),
  mkAlbum('Blonde', 'Frank Ocean', 5, '12-01-2026'),
  mkAlbum('In Rainbows', 'Radiohead', 5, '20-06-2026'),
  mkAlbum('Currents', 'Tame Impala', 4, '09-09-2025'),
  mkAlbum('Melodrama', 'Lorde', 5, '15-02-2026', true),
  mkAlbum('Channel Orange', 'Frank Ocean', 4, '28-10-2025'),
  mkAlbum('Discovery', 'Daft Punk', 5, '03-05-2026'),
  mkAlbum('An Awesome Wave', 'alt-J', 3, '17-07-2025'),
  mkAlbum('Igor', 'Tyler, the Creator', 4, '24-04-2026'),
];
// Perfumes — ownership MIX (≥2 each of Sample / Travel size / Full bottle) so every filter shows results.
const mkPerfume = (title, designer, rating, ownership, date, over = {}) => ({
  id: `pf-${title.replace(/\W+/g, '-').toLowerCase()}`, title, designer, type: over.type || 'EDP',
  description: over.md ? MD : PLAIN, rating, fragranticaUrl: 'https://www.fragrantica.com/perfume/x.html',
  ownership, longevity: over.longevity ?? 6, projection: over.projection ?? 3,
  seasons: over.seasons || ['Spring', 'Summer'],
  applicationSpots: [{ spot: 'wrists', sprays: 2 }, { spot: 'neck', sprays: 1 }], date, editedDate: date,
});
const perfumes = [
  mkPerfume('Nuée Bleue', 'Armani', 8, 'Sample', '28-02-2026', { type: 'Parfum', md: true }),
  mkPerfume('Aventus', 'Creed', 9, 'Full bottle', '11-01-2026', { longevity: 8, projection: 4 }),
  mkPerfume('Bleu de Chanel', 'Chanel', 7, 'Full bottle', '19-06-2026'),
  mkPerfume('Oud Wood', 'Tom Ford', 8, 'Travel size', '04-04-2026', { seasons: ['Autumn', 'Winter'] }),
  mkPerfume('Layton', 'Parfums de Marly', 6, 'Sample', '22-09-2025'),
  mkPerfume('Sauvage', 'Dior', 5, 'Travel size', '30-11-2025'),
  mkPerfume('Baccarat Rouge 540', 'MFK', 9, 'Sample', '15-05-2026', { longevity: 7 }),
  mkPerfume('Reflection Man', 'Amouage', 7, 'Full bottle', '08-08-2025'),
];
// Vinyl — varied artists spanning letters (surname grouping) for covers/list + search + sort.
const mkVinyl = (title, artist) => ({
  id: `vn-${title.replace(/\W+/g, '-').toLowerCase()}`, title, artist,
  thumbnail: 'https://example.invalid/vinyl.png', lastfm: lastfmMeta,
});
const vinyl = [
  mkVinyl('In Rainbows', 'Radiohead'), mkVinyl('Blonde', 'Frank Ocean'), mkVinyl('Currents', 'Tame Impala'),
  mkVinyl('AM', 'Arctic Monkeys'), mkVinyl('Discovery', 'Daft Punk'), mkVinyl('Igor', 'Tyler, the Creator'),
  mkVinyl('Vespertine', 'Björk'), mkVinyl('Homework', 'Daft Punk'), mkVinyl('Grace', 'Jeff Buckley'),
  mkVinyl('The Money Store', 'Death Grips'),
];
const hotTakes = [
  { id: 'ht1', text: 'Pineapple belongs on pizza and this is not controversial.', date: '05-07-2026' },
  { id: 'ht2', text: 'The best code review is the one that ships.', date: '01-07-2026' },
  { id: 'ht3', text: 'Monospace everywhere is a lifestyle.', date: '20-06-2026' },
  { id: 'ht4', text: 'Tabs vs spaces is settled; stop relitigating it.', date: '02-06-2026' },
  { id: 'ht5', text: 'Every good side project dies at the auth screen.', date: '18-05-2026' },
];
const nowPlaying = {
  isPlaying: true,
  track: { name: 'Time (You and I)', artist: 'Khruangbin', album: 'Mordechai', albumArt: 'https://example.invalid/np.png', lastFmUrl: 'https://www.last.fm/music/x', timestamp: 1751800000 },
};
const topAlbums = {
  albums: Array.from({ length: 12 }, (_, i) => ({ name: i === 0 ? 'Mordechai' : `Album ${i + 1}`, artist: i === 0 ? 'Khruangbin' : `Artist ${i + 1}`, playcount: 300 - i * 17, url: 'https://www.last.fm/music/x', image: 'https://example.invalid/a.png', rank: i + 1 })),
  totalPages: 1, page: 1, total: 12, period: '3month',
};
// GitHub repos — distinct topics (no substring overlap), varied stars/commits/lastPush for sort, some archived.
const mkRepo = (name, description, topics, stars, commitCount, lastPush, archived = false) => ({
  name, fullName: `RyanMKrol/${name}`, description, url: 'https://github.com/x', language: topics[0] === 'python' ? 'Python' : 'JavaScript',
  stars, forks: Math.floor(stars / 2), lastPush, createdAt: '2021-01-01T00:00:00Z', isPrivate: false, topics, archived, commitCount,
});
const githubRepos = {
  repos: [
    mkRepo('ryankrol.co.uk', 'Personal site.', ['nextjs', 'dynamodb', 'vercel'], 6, 812, '2026-07-05T10:00:00Z'),
    mkRepo('local-jobs', 'Job orchestrator.', ['typescript', 'nextjs'], 3, 451, '2026-07-06T09:00:00Z'),
    mkRepo('ratings-plotter', 'Charts for ratings.', ['react', 'charts'], 1, 120, '2022-01-01T00:00:00Z', true),
    mkRepo('huel-picker', 'Flavour picker.', ['react', 'vite'], 2, 88, '2025-03-10T00:00:00Z', true),
    mkRepo('cli-toolkit', 'Small CLI helpers.', ['python', 'cli'], 4, 240, '2026-02-01T00:00:00Z'),
    mkRepo('api-proxy', 'A tiny API proxy.', ['typescript', 'api'], 5, 300, '2026-05-20T00:00:00Z'),
    mkRepo('dotfiles', 'My config.', ['shell'], 0, 610, '2026-01-15T00:00:00Z'),
    mkRepo('scraper', 'Data scraper.', ['python', 'api'], 2, 175, '2025-11-02T00:00:00Z'),
    mkRepo('react-widgets', 'Reusable widgets.', ['react', 'nextjs'], 3, 205, '2026-04-18T00:00:00Z'),
  ],
  total: 9, username: 'RyanMKrol',
};
// Workouts list — types across Push/Pull/Legs AND date ranges (within 3mo / within 1yr / >1yr) so the
// split filter narrows the list and the period filter changes the stats block. (Today ~2026-07-06.)
const wSet = (o = {}) => ({ type: 'working', weight_kg: 60, reps: 10, isWeightPR: false, is1RMPR: false, isVolumePR: false, ...o });
const mkWorkout = (id, type, date, vol) => ({
  id, title: type, start_time: `${date}T08:00:00Z`, end_time: `${date}T09:05:00Z`, totalVolume: vol,
  totalWorkingSets: 18, totalWarmupSets: 5, uniqueExercises: 6, durationMinutes: 65, workoutType: type, workoutDate: date,
  exercises: [{ id: `${id}-e1`, title: 'Chest Press (Machine)', sets: [wSet({ type: 'warmup', weight_kg: 40, reps: 12 }), wSet({ weight_kg: 42.5, reps: 12, isVolumePR: true }), wSet({ weight_kg: 45, reps: 8 })] }],
});
const workoutsList = {
  workouts: [
    mkWorkout('w1', 'Push', '2026-07-05', 8420), mkWorkout('w2', 'Pull', '2026-07-03', 7900),
    mkWorkout('w3', 'Legs', '2026-06-28', 11200), mkWorkout('w4', 'Push', '2026-05-19', 8100),
    mkWorkout('w5', 'Pull', '2026-03-11', 7600), mkWorkout('w6', 'Legs', '2026-01-22', 10800),
    mkWorkout('w7', 'Push', '2025-11-30', 7800), mkWorkout('w8', 'Pull', '2025-08-14', 7400),
    mkWorkout('w9', 'Legs', '2025-04-02', 10200), mkWorkout('w10', 'Push', '2024-12-10', 7200),
  ],
};
const workoutObj = () => workoutsList.workouts[0];
const workoutExercisesDetail = {
  workoutId: 'w1',
  exercises: [
    { id: 'ex-0001', workout_id: 'w1', exercise_name: 'Chest Press (Machine)', exercise_index: 0, exerciseType: 'strength', sets: [wSet({ type: 'warmup', weight_kg: 30, reps: 15 }), wSet({ weight_kg: 42.5, reps: 12, isVolumePR: true }), wSet({ weight_kg: 45, reps: 10 })], heaviestWeight: 45, bestEstimated1RM: 56, bestSetVolume: 510, sessionVolume: 1470, totalDistance: null, totalDuration: null, workout_date: '2026-07-05' },
    { id: 'ex-0002', workout_id: 'w1', exercise_name: 'Iso-Lateral High Row (Machine)', exercise_index: 1, exerciseType: 'strength', sets: [wSet({ type: 'warmup', weight_kg: 35, reps: 15 }), wSet({ weight_kg: 50, reps: 12, isWeightPR: true, is1RMPR: true }), wSet({ weight_kg: 50, reps: 10 })], heaviestWeight: 50, bestEstimated1RM: 66, bestSetVolume: 600, sessionVolume: 1625, totalDistance: null, totalDuration: null, workout_date: '2026-07-05' },
  ],
};
const exerciseHistory = {
  exerciseName: 'Chest Press (Machine)',
  history: Array.from({ length: 8 }, (_, i) => ({
    id: `hist-${i}`, exercise_name: 'Chest Press (Machine)', workout_id: `w${i}`, workout_date: `2026-0${(i % 6) + 1}-10`,
    exerciseType: 'strength', sets: [wSet({ type: 'warmup', weight_kg: 30, reps: 15 }), wSet({ weight_kg: 40 + i * 2, reps: 10 }), wSet({ weight_kg: 40 + i * 2, reps: 8 })],
    heaviestWeight: 40 + i * 2, bestEstimated1RM: 50 + i * 2, bestSetVolume: 400 + i * 20, sessionVolume: 1200 + i * 90,
    totalDistance: null, totalDuration: null, exercise_index: 0,
  })),
};
const workoutStats = {
  totalWorkouts: 142, totalVolume: 982340, averageDuration: 63, workoutTypes: { Push: 48, Pull: 47, Legs: 47 }, bestSessionVolume: 11200,
  monthlyVolume: Array.from({ length: 6 }, (_, i) => ({ month: `2026-0${i + 1}`, label: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]} 2026`, totalVolume: 120000 + i * 8000 })),
};

// ── fixtureFor: map a request pathname → a synthetic response ──────────────────────────────────
export function fixtureFor(pathname) {
  if (pathname === '/api/reviews/movies') return movies;
  if (pathname === '/api/reviews/tv') return tv;
  if (pathname === '/api/reviews/books') return books;
  if (pathname === '/api/reviews/albums') return albums;
  if (pathname === '/api/reviews/perfumes') return perfumes;
  if (pathname === '/api/vinyl') return vinyl;
  if (pathname === '/api/hot-takes') return hotTakes;
  if (pathname === '/api/lastfm/now-playing') return nowPlaying;
  if (pathname === '/api/lastfm/top-albums') return topAlbums;
  if (pathname === '/api/github/repos') return githubRepos;
  if (pathname === '/api/workouts/stats') return workoutStats;
  if (pathname === '/api/workouts') return workoutsList;
  if (/^\/api\/workouts\/[^/]+\/exercises$/.test(pathname)) return workoutExercisesDetail;
  if (/^\/api\/workouts\/[^/]+$/.test(pathname)) return workoutObj();
  if (pathname.startsWith('/api/exercises/history/')) return exerciseHistory;
  if (pathname === '/api/tmdb/search') return tmdbSearchResults;
  console.warn(`[visual-harness] no fixture for ${pathname} — returning []`);
  return [];
}

// ── PAGES: one baseline screenshot per route. `waitFor` doubles as a presence gate. ────────────
const REVIEW_COMMON = ['src/components/ReviewCard.js', 'src/components/StarRating.js', 'src/components/SortButtons.js', 'src/components/SearchInput.js'];
export const PAGES = [
  { name: 'home', path: '/', waitFor: ['.home-wall-tile-link'], description: 'Home — hero, now-playing, collection wall, on-the-shelf + hot-takes rail panels.', covers: ['src/pages/index.js', 'src/components/NowPlaying.js', 'src/components/StatBlock.js', 'src/components/CoverTile.js'] },
  { name: 'listening', path: '/listening', waitFor: ['.listening-row'], description: 'Last.fm top albums (3-month) with playcount bars.', covers: ['src/pages/listening/index.js', 'src/components/CoverTile.js'] },
  { name: 'projects', path: '/projects', waitFor: ['.project-card'], description: 'GitHub repo cards with search + tag-filter pills + sort.', covers: ['src/pages/projects/index.js', 'src/components/Pill.js', 'src/components/Badge.js', 'src/components/Tooltip.js'] },
  { name: 'vinyl', path: '/vinyl', waitFor: ['.vinyl-letter-header'], description: 'Vinyl collection grouped by artist (covers view).', covers: ['src/pages/vinyl/index.js', 'src/components/PillGroup.js', 'src/components/CoverTile.js'] },
  { name: 'hot-takes', path: '/hot-takes', waitFor: ['.hot-takes-item'], description: 'Newest-first bulleted hot-takes list.', covers: ['src/pages/hot-takes/index.js'] },
  { name: 'reviews-movies', path: '/reviews/movies', waitFor: ['.poster-banner-card'], description: 'Movie reviews — poster-banner cards (Markdown bodies render here).', covers: ['src/pages/reviews/movies/index.js', 'src/components/Markdown.js', ...REVIEW_COMMON] },
  { name: 'reviews-tv', path: '/reviews/tv', waitFor: ['.poster-banner-card'], description: 'TV reviews — poster-banner cards.', covers: ['src/pages/reviews/tv/index.js', 'src/components/Markdown.js', ...REVIEW_COMMON] },
  { name: 'reviews-books', path: '/reviews/books', waitFor: ['.spine-cover-card'], description: 'Book reviews — spine-cover cards (Markdown bodies render here).', covers: ['src/pages/reviews/books/index.js', 'src/components/Markdown.js', ...REVIEW_COMMON] },
  { name: 'reviews-albums', path: '/reviews/albums', waitFor: ['.square-cover-card'], description: 'Album reviews — square-cover cards.', covers: ['src/pages/reviews/albums/index.js', ...REVIEW_COMMON] },
  { name: 'reviews-perfumes', path: '/reviews/perfumes', waitFor: ['.perfume-v6-card'], description: 'Perfume shelf — hybrid cards with pip rating, longevity/projection scales, season chips, ownership pill.', covers: ['src/pages/reviews/perfumes/index.js', 'src/components/perfumeVariants/**', 'src/components/PipMeter.js', 'src/components/PerfumeCharacteristics.js'] },
  { name: 'reviews-movies-edit', path: '/reviews/movies/edit', waitFor: ['.review-edit-card'], description: 'Movie reviews edit list — Edit-button header strip should read as one unified box with the card below it (T328).', covers: ['src/pages/reviews/movies/edit.js', 'src/styles/globals.css'] },
  { name: 'reviews-tv-edit', path: '/reviews/tv/edit', waitFor: ['.review-edit-card'], description: 'TV reviews edit list — unified Edit-header/card box (T328).', covers: ['src/pages/reviews/tv/edit.js', 'src/styles/globals.css'] },
  { name: 'reviews-books-edit', path: '/reviews/books/edit', waitFor: ['.review-edit-card'], description: 'Book reviews edit list — unified Edit-header/card box (T328).', covers: ['src/pages/reviews/books/edit.js', 'src/styles/globals.css'] },
  { name: 'reviews-albums-edit', path: '/reviews/albums/edit', waitFor: ['.review-edit-card'], description: 'Album reviews edit list — unified Edit-header/card box (T328).', covers: ['src/pages/reviews/albums/edit.js', 'src/styles/globals.css'] },
  { name: 'reviews-perfumes-edit', path: '/reviews/perfumes/edit', waitFor: ['.review-edit-card'], description: 'Perfume reviews edit list — unified Edit-header/card box (T328).', covers: ['src/pages/reviews/perfumes/edit.js', 'src/styles/globals.css'] },
  { name: 'workouts', path: '/workouts', waitFor: ['.workout-session-card'], description: 'Workout history list + programme stats block (split filter + date-range period filter).', covers: ['src/pages/workouts/index.js', 'src/components/ProgrammeOverviewCharts.js', 'src/components/DateRangeFilter.js', 'src/components/PillGroup.js', 'src/components/Badge.js'] },
  { name: 'workout-detail', path: '/workouts/w1', waitFor: ['.workout-exercise-card'], description: 'Single workout detail — per-exercise set breakdown with PR badges.', covers: ['src/pages/workouts/[id].js', 'src/components/StatBlock.js', 'src/components/Badge.js'] },
  { name: 'exercise', path: '/exercises/Chest%20Press%20(Machine)', waitFor: ['.chart-card canvas'], description: 'Per-exercise stats + progress charts (1RM / volume / max-weight) + recent sessions.', covers: ['src/pages/exercises/[exerciseName].js', 'src/components/ExerciseProgressCharts.js', 'src/components/CardioProgressCharts.js', 'src/components/PillGroup.js', 'src/components/StatBlock.js'] },
  { name: 'reviews-movies-backfill', path: '/reviews/movies/backfill', waitFor: ['.bbl-row'], description: 'Movie metadata backfill — rows awaiting TMDB search results, page-level "Apply all selections" button above the list.', covers: ['src/pages/reviews/movies/backfill.js', 'src/components/BulkBackfillList.js'] },
];

// ── FLOWS: states that only appear after an INTERACTION. capture() runs `actions(page)`. ────────
// Review pages share the sort/search surface → generate their flows from one config (not 35 literals).
const REVIEW_FLOW_PAGES = [
  { type: 'movies', card: '.poster-banner-card', search: 'budapest', extraCovers: ['src/components/Markdown.js'] },
  { type: 'tv', card: '.poster-banner-card', search: 'severance', extraCovers: ['src/components/Markdown.js'] },
  { type: 'books', card: '.spine-cover-card', search: 'piranesi', extraCovers: [] },
  { type: 'albums', card: '.square-cover-card', search: 'rainbows', extraCovers: [] },
  { type: 'perfumes', card: '.perfume-v6-card', search: 'aventus', extraCovers: ['src/components/perfumeVariants/**', 'src/components/PipMeter.js'] },
];
const SORT_FIELDS = ['date', 'title', 'score'];
const reviewCoversFor = (type, extra) => [`src/pages/reviews/${type}/index.js`, ...REVIEW_COMMON, ...extra];
const reviewFlows = REVIEW_FLOW_PAGES.flatMap(({ type, card, search, extraCovers }) => {
  const path = `/reviews/${type}`;
  const covers = reviewCoversFor(type, extraCovers);
  const sortBtn = (f) => `button.filter-button:has-text("${f}")`;
  return [
    { name: `reviews-${type}-search`, path, waitFor: [card], flow: `Type "${search}" into the search box; the list filters to the matching card(s).`, description: `${type} reviews filtered by search to "${search}".`, covers, actions: async (page) => { await page.fill('.collection-search-input input', search); } },
    ...SORT_FIELDS.flatMap((field) => [
      { name: `reviews-${type}-sort-${field}`, path, waitFor: [card], flow: `Click the "${field}" sort button once (default direction).`, description: `${type} reviews sorted by ${field} (default direction).`, covers, actions: async (page) => { await page.click(sortBtn(field)); } },
      { name: `reviews-${type}-sort-${field}-rev`, path, waitFor: [card], flow: `Click the "${field}" sort button twice (reversed direction).`, description: `${type} reviews sorted by ${field}, reversed.`, covers, actions: async (page) => { const b = sortBtn(field); await page.click(b); await page.waitForTimeout(150); await page.click(b); } },
    ]),
  ];
});

const bespokeFlows = [
  // Perfume ownership filters — one per ownership value (fixtures carry ≥2 of each).
  { name: 'perfumes-ownership-sample', path: '/reviews/perfumes', waitFor: ['.perfume-v6-card'], flow: 'Click the "Sample" ownership pill; list narrows to sampled perfumes.', description: 'Perfumes filtered to ownership = Sample.', covers: ['src/pages/reviews/perfumes/index.js', 'src/components/PillGroup.js', 'src/components/perfumeVariants/**'], actions: async (page) => { await page.click('.collection-pill:text-is("Sample")'); } },
  { name: 'perfumes-ownership-travel', path: '/reviews/perfumes', waitFor: ['.perfume-v6-card'], flow: 'Click the "Travel size" ownership pill.', description: 'Perfumes filtered to ownership = Travel size.', covers: ['src/pages/reviews/perfumes/index.js', 'src/components/PillGroup.js', 'src/components/perfumeVariants/**'], actions: async (page) => { await page.click('.collection-pill:text-is("Travel size")'); } },
  { name: 'perfumes-ownership-full', path: '/reviews/perfumes', waitFor: ['.perfume-v6-card'], flow: 'Click the "Full bottle" ownership pill.', description: 'Perfumes filtered to ownership = Full bottle.', covers: ['src/pages/reviews/perfumes/index.js', 'src/components/PillGroup.js', 'src/components/perfumeVariants/**'], actions: async (page) => { await page.click('.collection-pill:text-is("Full bottle")'); } },
  // Vinyl — list view, search, and sort-by-artist is the default (covers view is the baseline PAGES shot).
  { name: 'vinyl-list-view', path: '/vinyl', waitFor: ['.vinyl-letter-header'], flow: 'Click the "list" view pill; the cover grid becomes text rows.', description: 'Vinyl collection in list view.', covers: ['src/pages/vinyl/index.js', 'src/components/PillGroup.js'], actions: async (page) => { await page.click('.collection-pill:text-is("list")'); await page.waitForSelector('.vinyl-list-row', { state: 'visible', timeout: 10000 }); } },
  { name: 'vinyl-search', path: '/vinyl', waitFor: ['.vinyl-letter-header'], flow: 'Search vinyl for "daft"; list narrows to Daft Punk records.', description: 'Vinyl filtered by search to "daft".', covers: ['src/pages/vinyl/index.js', 'src/components/SearchInput.js'], actions: async (page) => { await page.fill('.collection-search-input input', 'daft'); } },
  // Workouts — split filter (each type) + period filter (each range).
  { name: 'workouts-split-push', path: '/workouts', waitFor: ['.workout-session-card'], flow: 'Click the "Push" split pill; list + stats recompute to Push sessions.', description: 'Workouts filtered to the Push split.', covers: ['src/pages/workouts/index.js', 'src/components/PillGroup.js', 'src/components/ProgrammeOverviewCharts.js'], actions: async (page) => { await page.click('.collection-pill:text-is("Push")'); } },
  { name: 'workouts-split-pull', path: '/workouts', waitFor: ['.workout-session-card'], flow: 'Click the "Pull" split pill.', description: 'Workouts filtered to the Pull split.', covers: ['src/pages/workouts/index.js', 'src/components/PillGroup.js', 'src/components/ProgrammeOverviewCharts.js'], actions: async (page) => { await page.click('.collection-pill:text-is("Pull")'); } },
  { name: 'workouts-split-legs', path: '/workouts', waitFor: ['.workout-session-card'], flow: 'Click the "Legs" split pill.', description: 'Workouts filtered to the Legs split.', covers: ['src/pages/workouts/index.js', 'src/components/PillGroup.js', 'src/components/ProgrammeOverviewCharts.js'], actions: async (page) => { await page.click('.collection-pill:text-is("Legs")'); } },
  { name: 'workouts-period-3m', path: '/workouts', waitFor: ['.workout-session-card'], flow: 'Click the "3 months" period button; the stats block recomputes to the last 3 months.', description: 'Workouts programme stats scoped to the last 3 months.', covers: ['src/pages/workouts/index.js', 'src/components/DateRangeFilter.js'], actions: async (page) => { await page.click('button:has-text("3 months")'); } },
  { name: 'workouts-period-1y', path: '/workouts', waitFor: ['.workout-session-card'], flow: 'Click the "1 year" period button.', description: 'Workouts programme stats scoped to the last 1 year.', covers: ['src/pages/workouts/index.js', 'src/components/DateRangeFilter.js'], actions: async (page) => { await page.click('button:has-text("1 year")'); } },
  { name: 'workouts-period-all', path: '/workouts', waitFor: ['.workout-session-card'], flow: 'Click the "All time" period button.', description: 'Workouts programme stats scoped to all time.', covers: ['src/pages/workouts/index.js', 'src/components/DateRangeFilter.js'], actions: async (page) => { await page.click('button:has-text("All time")'); } },
  // Projects — a few tag filters + sort + search.
  { name: 'projects-tag-react', path: '/projects', waitFor: ['.project-card'], flow: 'Click the "react" tag pill; cards narrow to react-tagged repos.', description: 'Projects filtered by the react tag (active pill).', covers: ['src/pages/projects/index.js', 'src/components/Pill.js'], actions: async (page) => { await page.click('.collection-pill:text-is("react")'); } },
  { name: 'projects-tag-nextjs', path: '/projects', waitFor: ['.project-card'], flow: 'Click the "nextjs" tag pill.', description: 'Projects filtered by the nextjs tag.', covers: ['src/pages/projects/index.js', 'src/components/Pill.js'], actions: async (page) => { await page.click('.collection-pill:text-is("nextjs")'); } },
  { name: 'projects-tag-python', path: '/projects', waitFor: ['.project-card'], flow: 'Click the "python" tag pill.', description: 'Projects filtered by the python tag.', covers: ['src/pages/projects/index.js', 'src/components/Pill.js'], actions: async (page) => { await page.click('.collection-pill:text-is("python")'); } },
  { name: 'projects-sort-stars', path: '/projects', waitFor: ['.project-card'], flow: 'Click the "stars" sort button; repos re-order by star count.', description: 'Projects sorted by stars.', covers: ['src/pages/projects/index.js', 'src/components/SortButtons.js'], actions: async (page) => { await page.click('button.filter-button:has-text("stars")'); } },
  { name: 'projects-search', path: '/projects', waitFor: ['.project-card'], flow: 'Search projects for "api"; cards narrow by name/description.', description: 'Projects filtered by search to "api".', covers: ['src/pages/projects/index.js', 'src/components/SearchInput.js'], actions: async (page) => { await page.fill('.collection-search-input input', 'api'); } },
  // Home — the on-the-shelf shuffle.
  { name: 'home-skim-shelf', path: '/', waitFor: ['.home-shelf-item'], flow: 'Click "Skim the shelf"; the random vinyl sample re-rolls.', description: 'Home on-the-shelf panel after a shuffle.', covers: ['src/pages/index.js'], actions: async (page) => { await page.click('button.home-shelf-refresh'); } },
  // Movie backfill — select a TMDB candidate on both awaiting rows, then apply all at once (T338).
  {
    name: 'reviews-movies-backfill-apply-all',
    path: '/reviews/movies/backfill',
    waitFor: ['.bbl-row'],
    flow: 'Select the first TMDB candidate on each row awaiting a match, then click "Apply all selections".',
    description: 'Movie backfill — both rows saved via the page-level "Apply all selections" button (capped at 3 candidates each).',
    covers: ['src/components/BulkBackfillList.js', 'src/pages/reviews/movies/backfill.js'],
    actions: async (page) => {
      const rows = page.locator('.bbl-row');
      const rowCount = await rows.count();
      for (let i = 0; i < rowCount; i += 1) {
        const radio = rows.nth(i).locator('.bbl-candidate-item input[type="radio"]').first();
        await radio.waitFor({ state: 'visible', timeout: 15000 });
        await radio.check();
      }
      await page.click('.bbl-page-actions button:has-text("Apply all selections")');
      await page.waitForSelector('.bbl-row-status:has-text("saved")', { state: 'visible', timeout: 15000 });
    },
  },
  // Header nav pills — click-and-drag fallback scrolling (T317) for pointers without horizontal
  // scroll input. Shrink the viewport first so the pill row overflows even at "desktop" width.
  {
    name: 'header-nav-drag-scroll',
    path: '/',
    waitFor: ['.collection-nav-pills'],
    flow: 'Shrink the viewport so the nav pill row overflows, then mousedown+move+mouseup drag it leftward.',
    description: 'Header nav pill row scrolled via click-and-drag, mid-row.',
    covers: ['src/components/Header.js', 'src/styles/globals.css'],
    actions: async (page) => {
      // Stay above the 768px mobile breakpoint (globals.css:2300) — below it this nav is
      // display:none, replaced by the hamburger `.nav-mobile-menu` — while still narrow enough
      // that the pill row overflows and needs drag-to-scroll.
      await page.setViewportSize({ width: 900, height: 900 });
      const nav = page.locator('.collection-nav-pills');
      await nav.waitFor({ state: 'visible' });
      const box = await nav.boundingBox();
      const startX = box.x + box.width - 40;
      const y = box.y + box.height / 2;
      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(startX - 150, y, { steps: 10 });
      await page.mouse.up();
    },
  },
];

export const FLOWS = [...reviewFlows, ...bespokeFlows];

// ── Request interception ───────────────────────────────────────────────────────────────────────
/** Serve every `/api/*` from a fixture, replace every EXTERNAL image with a placeholder — fully hermetic. */
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
  const server = spawn('npx', ['next', 'start', '-p', String(port)], { cwd: APP_DIR, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', () => {});
  server.stderr.on('data', (d) => process.env.DEBUG && console.error(String(d)));
  return server;
}

/** Poll until the server answers (200 or 404 both mean "up"). */
export async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const res = await fetch(url); if (res.ok || res.status === 404) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`site did not come up at ${url} within ${timeoutMs}ms`);
}
