// Skeleton layout-shift check for the home page.
//
// Loads `/` ONCE per viewport width with every home `/api/*` fixture artificially delayed, measures
// the document-relative top of each section landmark while the skeletons are still showing, then
// lets the data land and re-measures the SAME landmarks in the SAME page session. Any nonzero
// delta means the skeleton→content swap moved the page (real CLS) — the thing the skeletons exist
// to prevent. Also writes skeleton/loaded screenshots plus a red-overlay pixel diff per width to
// scripts/visual-out/shift/ for eyeballing.
//
// Hermetic like visual-check.mjs: `next start` + fixtures from _visual-harness.mjs, no network.
//
// Run:  node scripts/skeleton-shift-check.mjs
//   Env: VISUAL_CHECK_SKIP_BUILD=1 to reuse .next, VISUAL_CHECK_PORT (default 4798).
// Also checks horizontal overflow: the page must never be wider than the viewport, in either state.
// A too-wide page makes mobile browsers zoom the whole page out (the top half looks "squished"),
// which is what a nowrap title inside a bare `1fr` grid column did at 401px.
//
// Exits 1 if any landmark shifts by more than TOLERANCE_PX, or the page overflows horizontally, at any width.

import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { routeApiWithDelays, startServer, waitForServer, APP_DIR } from './_visual-harness.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'visual-out', 'shift');
const PORT = Number(process.env.VISUAL_CHECK_PORT ?? 4798);
const BASE = `http://localhost:${PORT}`;
const TOLERANCE_PX = 0.5;
const API_DELAY_MS = 2500;

// Every fetch the home page (and header) makes, all delayed so the full-skeleton state is stable.
const HOME_APIS = [
  '/api/reviews/movies', '/api/reviews/tv', '/api/reviews/books', '/api/reviews/albums',
  '/api/vinyl', '/api/workouts/stats', '/api/hot-takes', '/api/top-of-mind',
  '/api/lastfm/now-playing',
];

// Landmarks that exist in BOTH the skeleton and loaded states. Their top must not move.
const LANDMARKS = [
  ['hero', '.home-hero'],
  ['top-of-mind panel', '.home-top-of-mind-panel'],
  ['stats row', '.home-stats'],
  ['stat cell 1', '.home-stats > :nth-child(1)'],
  ['stat cell 6', '.home-stats > :nth-child(6)'],
  ['wall section', '.home-wall'],
  ['wall title', '.home-wall .home-section-title'],
  ['lower section', '.home-lower'],
  ['latest takes col', '.home-latest'],
  ['gym panel', '.home-gym-panel'],
  ['shelf panel', '.home-shelf-panel'],
  ['hot takes panel', '.home-hot-takes-panel'],
  ['footer', 'footer'],
];

const WIDTHS = [390, 768, 900, 1200, 1440, 1710];

function ensureBuild() {
  const haveBuild = existsSync(resolve(APP_DIR, '.next', 'BUILD_ID'));
  if (process.env.VISUAL_CHECK_SKIP_BUILD && haveBuild) { console.log('Reusing existing .next build.'); return; }
  console.log('Building (next build)…');
  const r = spawnSync('npx', ['next', 'build'], { cwd: APP_DIR, stdio: 'inherit', env: { ...process.env } });
  if (r.status !== 0) { console.error('✗ next build failed'); process.exit(1); }
}

/** Document-relative rects (top/height) for each landmark; null when the selector isn't present. */
async function measure(page) {
  return page.evaluate((landmarks) => {
    const out = {};
    for (const [label, sel] of landmarks) {
      const el = document.querySelector(sel);
      if (!el) { out[label] = null; continue; }
      const r = el.getBoundingClientRect();
      out[label] = { top: r.top + window.scrollY, height: r.height };
    }
    out['page height'] = { top: 0, height: document.documentElement.scrollHeight };
    out.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return out;
  }, LANDMARKS);
}

/** Red-overlay diff: pixels that differ between the two shots show red on a faded base. */
async function writeDiff(aPath, bPath, outPath) {
  const a = sharp(aPath).ensureAlpha();
  const b = sharp(bPath).ensureAlpha();
  const [am, bm] = await Promise.all([a.metadata(), b.metadata()]);
  const w = Math.min(am.width, bm.width);
  const h = Math.min(am.height, bm.height);
  const [ar, br] = await Promise.all([
    sharp(aPath).extract({ left: 0, top: 0, width: w, height: h }).ensureAlpha().raw().toBuffer(),
    sharp(bPath).extract({ left: 0, top: 0, width: w, height: h }).ensureAlpha().raw().toBuffer(),
  ]);
  const out = Buffer.alloc(w * h * 4);
  let differing = 0;
  for (let i = 0; i < w * h * 4; i += 4) {
    const d = Math.abs(ar[i] - br[i]) + Math.abs(ar[i + 1] - br[i + 1]) + Math.abs(ar[i + 2] - br[i + 2]);
    if (d > 30) {
      differing++;
      out[i] = 255; out[i + 1] = 40; out[i + 2] = 40; out[i + 3] = 255;
    } else {
      out[i] = 255 - Math.round((255 - ar[i]) * 0.25);
      out[i + 1] = 255 - Math.round((255 - ar[i + 1]) * 0.25);
      out[i + 2] = 255 - Math.round((255 - ar[i + 2]) * 0.25);
      out[i + 3] = 255;
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(outPath);
  return { differing, total: w * h, heightMismatch: am.height !== bm.height, aHeight: am.height, bHeight: bm.height };
}

async function checkWidth(browser, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const delays = Object.fromEntries(HOME_APIS.map((p) => [p, API_DELAY_MS]));
  await routeApiWithDelays(page, delays);

  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForSelector('.skeleton-shimmer', { state: 'visible', timeout: 10000 });
  // Wait for webfonts before the skeleton measurement: a font swap between the two measurements
  // would show up as (font-metric) layout shift that isn't the skeleton's fault.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400); // let the skeleton frame settle
  const skeleton = await measure(page);
  const skelShot = resolve(OUT_DIR, `home-${width}-skeleton.png`);
  await page.screenshot({ path: skelShot, fullPage: true, animations: 'disabled' });

  // 'attached', not 'visible' — mobile widths hide .home-wall entirely.
  await page.waitForSelector('.home-wall-tile-link', { state: 'attached', timeout: 15000 });
  await page.waitForFunction(() => document.querySelectorAll('.skeleton-shimmer').length === 0, { timeout: 15000 });
  await page.waitForTimeout(800); // images/fonts settle
  const loaded = await measure(page);
  const loadShot = resolve(OUT_DIR, `home-${width}-loaded.png`);
  await page.screenshot({ path: loadShot, fullPage: true, animations: 'disabled' });
  await ctx.close();

  const diffStats = await writeDiff(skelShot, loadShot, resolve(OUT_DIR, `home-${width}-diff.png`));

  const rows = [];
  let worst = 0;
  for (const label of [...LANDMARKS.map(([l]) => l), 'page height']) {
    const s = skeleton[label];
    const l = loaded[label];
    if (!s || !l) { rows.push({ label, note: !s && !l ? 'absent in both' : `only in ${s ? 'skeleton' : 'loaded'} state` }); continue; }
    const dTop = l.top - s.top;
    const dHeight = l.height - s.height;
    worst = Math.max(worst, Math.abs(dTop));
    rows.push({ label, sTop: s.top, dTop, dHeight });
  }
  const overflowX = Math.max(skeleton.overflowX, loaded.overflowX);
  return { width, rows, worst, overflowX, diffStats };
}

async function main() {
  ensureBuild();
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Starting site (next start -p ${PORT})…`);
  const server = startServer(PORT);
  let browser;
  const results = [];
  try {
    await waitForServer(BASE);
    browser = await chromium.launch();
    for (const width of WIDTHS) {
      console.log(`Measuring ${width}px…`);
      results.push(await checkWidth(browser, width));
    }
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }

  let fail = false;
  for (const r of results) {
    const bad = r.worst > TOLERANCE_PX;
    const overflow = r.overflowX > 0;
    if (bad || overflow) fail = true;
    console.log(`\n── ${r.width}px  ${bad ? '\x1b[31m✗ SHIFT DETECTED\x1b[0m' : '\x1b[32m✓ no shift\x1b[0m'} (worst Δtop ${r.worst.toFixed(2)}px)`);
    console.log(`   ${overflow ? `\x1b[31m✗ page is ${r.overflowX}px wider than the viewport (mobile browsers will zoom out)\x1b[0m` : '\x1b[32m✓ no horizontal overflow\x1b[0m'}`);
    for (const row of r.rows) {
      if (row.note) { console.log(`   ${row.label.padEnd(18)} ${row.note}`); continue; }
      const flag = Math.abs(row.dTop) > TOLERANCE_PX ? ' ◀ MOVED' : '';
      console.log(`   ${row.label.padEnd(18)} top ${String(Math.round(row.sTop)).padStart(5)}  Δtop ${row.dTop >= 0 ? '+' : ''}${row.dTop.toFixed(2)}px  Δheight ${row.dHeight >= 0 ? '+' : ''}${row.dHeight.toFixed(2)}px${flag}`);
    }
    const pct = ((r.diffStats.differing / r.diffStats.total) * 100).toFixed(1);
    console.log(`   pixel diff: ${pct}% differing (content changes expected inside sections)${r.diffStats.heightMismatch ? ` — page height ${r.diffStats.aHeight} → ${r.diffStats.bHeight}` : ''}`);
  }

  writeFileSync(resolve(OUT_DIR, 'shift-results.json'), JSON.stringify(results, null, 2));
  console.log(`\nScreenshots + diffs in ${OUT_DIR}`);
  if (fail) { console.log('\x1b[31m✗ skeleton→content swap moves the page, or the page overflows horizontally\x1b[0m'); process.exit(1); }
  console.log('\x1b[32m✓ all landmarks stable across skeleton→content, and no horizontal overflow, at every width\x1b[0m');
}

main().catch((e) => { console.error(e); process.exit(1); });
