// Visual confirmation check for ryankrol.co.uk.
//
// Loads every page (see PAGES in _visual-harness.mjs) in a headless Chromium at a DESKTOP
// viewport against fully-synthetic data, and CAPTURES A SCREENSHOT of each to a gitignored
// dir. The screenshots exist so a human OR an agent (the build loop's builder + auditor)
// can SEE what each page renders and judge whether the work is visually correct.
//
// This catches the bug class structural checks can't: an element present in the DOM but
// never PAINTED — e.g. T273 (Markdown review bodies that passed lint/tests/build but never
// rendered on the live card). It is NOT golden-image diffing: there are NO baseline images
// and NO pixel comparison, so cross-machine rendering drift is irrelevant. It asserts no
// appearance invariants; the visual judgment is done by whoever views the PNGs. It only
// fails on HARD errors (server didn't start, a page failed to load, a wait selector never
// appeared, or a page logged a console error).
//
// Hermetic: starts a production `next start` and serves all `/api/*` from in-process
// fixtures + replaces external images with a placeholder — NO DynamoDB, NO external APIs,
// NO network. LOCAL/loop-only — NOT part of CI (no browser there).
//
// Run:
//   node scripts/visual-check.mjs
// It runs `next build` itself unless VISUAL_CHECK_SKIP_BUILD=1 and a .next build exists.
// Env: VISUAL_CHECK_PORT (default 4799), VISUAL_SETTLE_MS (default 1500, clamped 1000–5000),
//      VISUAL_CHECK_SKIP_BUILD (reuse an existing .next).

import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { PAGES, routeApi, startServer, waitForServer, APP_DIR } from './_visual-harness.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'visual-out');
const PORT = Number(process.env.VISUAL_CHECK_PORT ?? 4799);
const BASE = `http://localhost:${PORT}`;
const VIEWPORT = { width: 1440, height: 900 };
const SETTLE_MS = Math.min(5000, Math.max(1000, Number(process.env.VISUAL_SETTLE_MS ?? 1500)));
const SELECTOR_TIMEOUT_MS = 10000;

/** Build the app (so screenshots reflect the current code) unless told to reuse `.next`. */
function ensureBuild() {
  const haveBuild = existsSync(resolve(APP_DIR, '.next', 'BUILD_ID'));
  if (process.env.VISUAL_CHECK_SKIP_BUILD && haveBuild) {
    console.log('Reusing existing .next build (VISUAL_CHECK_SKIP_BUILD set).');
    return;
  }
  console.log('Building (next build)…');
  const r = spawnSync('npx', ['next', 'build'], { cwd: APP_DIR, stdio: 'inherit', env: { ...process.env } });
  if (r.status !== 0) { console.error('✗ next build failed — cannot screenshot a broken build.'); process.exit(1); }
}

/** Capture one page spec ({ name, path, waitFor? }). Throws only on a hard error. */
async function capture(ctx, spec) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  const file = resolve(OUT_DIR, `${spec.name}.png`);
  try {
    await page.goto(BASE + spec.path, { waitUntil: 'networkidle' });
    for (const sel of spec.waitFor ?? []) {
      await page.waitForSelector(sel, { state: 'visible', timeout: SELECTOR_TIMEOUT_MS });
    }
    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    return { name: spec.name, path: spec.path, file, pass: consoleErrors.length === 0, error: consoleErrors[0] ?? null };
  } catch (e) {
    try { await page.screenshot({ path: file, fullPage: true, animations: 'disabled' }); } catch { /* ignore */ }
    return { name: spec.name, path: spec.path, file, pass: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    await page.close();
  }
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
    console.log('Site up. Launching Chromium…\n');
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    await routeApi(ctx);
    for (const p of PAGES) results.push(await capture(ctx, p));
    await ctx.close();
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`Viewport: ${VIEWPORT.width}×${VIEWPORT.height} (desktop)   settle: ${SETTLE_MS}ms`);
  console.log(`Screenshots written to: ${OUT_DIR}\n`);
  let failed = 0;
  for (const r of results) {
    const tag = r.pass ? '\x1b[32m✓ PASS\x1b[0m' : '\x1b[31m✗ FAIL\x1b[0m';
    console.log(`${tag}  ${r.name.padEnd(20)} ${r.path}`);
    console.log(`        ${r.file}`);
    if (!r.pass) { failed++; console.log(`          ↳ ${r.error}`); }
  }
  console.log('\nThese screenshots are for VISUAL confirmation — open them and check each page renders as');
  console.log('intended (the thing you changed is actually painted/visible; nothing blank, overlapping, or');
  console.log('clipped; Markdown bodies show real bold/lists, not literal ** and -).\n');
  if (failed) {
    console.log(`\x1b[31m✗ ${failed}/${results.length} capture(s) hit a hard error (page load / wait / console error)\x1b[0m`);
    process.exit(1);
  }
  console.log(`\x1b[32m✓ all ${results.length} page(s) captured\x1b[0m`);
}

main().catch((e) => { console.error(e); process.exit(1); });
