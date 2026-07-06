// Visual confirmation check for ryankrol.co.uk.
//
// Loads every page (PAGES) AND every interaction flow (FLOWS) from _visual-harness.mjs in a headless
// Chromium at a DESKTOP viewport against fully-synthetic data, and CAPTURES A SCREENSHOT of each to a
// gitignored dir + writes a manifest.json describing them. The screenshots exist so a human OR an
// agent (the build loop's builder + auditor) can SEE what each state renders and judge whether the
// work is visually correct.
//
// This catches the bug class structural checks can't: an element present in the DOM but never PAINTED
// (T273 — Markdown review bodies that passed lint/tests/build but never rendered on the live card). It
// is NOT golden-image diffing (no baselines, no pixel compare); it asserts no appearance invariants —
// the visual judgment is done by whoever views the PNGs. It fails only on HARD errors (server didn't
// start, a page failed to load, a `waitFor` selector never appeared — the presence gate — or a page
// logged a console error).
//
// Hermetic: `next start` + all `/api/*` from in-process fixtures + external images placeholdered — NO
// DynamoDB, NO external APIs, NO network. LOCAL/loop-only — NOT part of CI (no browser there).
//
// Run:  node scripts/visual-check.mjs
//   Builds via `next build` unless VISUAL_CHECK_SKIP_BUILD=1 and a .next build exists.
//   Env: VISUAL_CHECK_PORT (default 4799), VISUAL_SETTLE_MS (default 1500, clamped 1000–5000),
//        VISUAL_CHECK_SKIP_BUILD (reuse .next), VISUAL_CHECK_ONLY=<substring> (only capture matching names).

import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { PAGES, FLOWS, routeApi, startServer, waitForServer, APP_DIR } from './_visual-harness.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'visual-out');
const PORT = Number(process.env.VISUAL_CHECK_PORT ?? 4799);
const BASE = `http://localhost:${PORT}`;
const VIEWPORT = { width: 1440, height: 900 };
const SETTLE_MS = Math.min(5000, Math.max(1000, Number(process.env.VISUAL_SETTLE_MS ?? 1500)));
const SELECTOR_TIMEOUT_MS = 10000;
const ONLY = process.env.VISUAL_CHECK_ONLY || '';

/** Build the app (so screenshots reflect current code) unless told to reuse `.next`. */
function ensureBuild() {
  const haveBuild = existsSync(resolve(APP_DIR, '.next', 'BUILD_ID'));
  if (process.env.VISUAL_CHECK_SKIP_BUILD && haveBuild) { console.log('Reusing existing .next build (VISUAL_CHECK_SKIP_BUILD set).'); return; }
  console.log('Building (next build)…');
  const r = spawnSync('npx', ['next', 'build'], { cwd: APP_DIR, stdio: 'inherit', env: { ...process.env } });
  if (r.status !== 0) { console.error('✗ next build failed — cannot screenshot a broken build.'); process.exit(1); }
}

/**
 * Capture one spec ({ name, path, waitFor?, actions?, description?, flow?, covers? }). For a flow,
 * `actions(page)` drives the page into the state to capture after the wait+settle, then it re-settles.
 * Returns a result row (carrying the manifest fields); throws only on a hard error.
 */
async function capture(ctx, spec) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  const file = resolve(OUT_DIR, `${spec.name}.png`);
  const meta = { name: spec.name, path: spec.path, file, description: spec.description ?? '', flow: spec.flow ?? '', covers: spec.covers ?? [] };
  try {
    await page.goto(BASE + spec.path, { waitUntil: 'networkidle' });
    for (const sel of spec.waitFor ?? []) await page.waitForSelector(sel, { state: 'visible', timeout: SELECTOR_TIMEOUT_MS });
    await page.waitForTimeout(SETTLE_MS);
    if (spec.actions) { await spec.actions(page); await page.waitForTimeout(SETTLE_MS); }
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    return { ...meta, pass: consoleErrors.length === 0, error: consoleErrors[0] ?? null };
  } catch (e) {
    try { await page.screenshot({ path: file, fullPage: true, animations: 'disabled' }); } catch { /* ignore */ }
    return { ...meta, pass: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    await page.close();
  }
}

async function main() {
  ensureBuild();
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  let specs = [...PAGES, ...FLOWS];
  if (ONLY) { specs = specs.filter((s) => s.name.includes(ONLY)); console.log(`VISUAL_CHECK_ONLY="${ONLY}" → ${specs.length} matching capture(s).`); }

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
    for (const s of specs) results.push(await capture(ctx, s));
    await ctx.close();
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }

  // ── Manifest (machine-readable, alongside the PNGs) ─────────────────────────
  const manifest = results.map((r) => ({ name: r.name, path: r.path, description: r.description, flow: r.flow, covers: r.covers, file: r.file }));
  writeFileSync(resolve(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // ── Report ──────────────────────────────────────────────────────────────────
  console.log(`\nViewport: ${VIEWPORT.width}×${VIEWPORT.height} (desktop)   settle: ${SETTLE_MS}ms`);
  console.log(`Screenshots + manifest.json written to: ${OUT_DIR}\n`);
  let failed = 0;
  for (const r of results) {
    console.log(`${r.pass ? '\x1b[32m✓ PASS\x1b[0m' : '\x1b[31m✗ FAIL\x1b[0m'}  ${r.name}`);
    if (!r.pass) { failed++; console.log(`          ↳ ${r.error}`); }
  }

  // ── Manifest table (so the agent running the hook can map name → meaning and pick relevant shots) ──
  console.log('\n─── MANIFEST (match your task\'s scope against `covers`, then LOOK at those PNGs) ───');
  for (const m of manifest) {
    console.log(`• ${m.name}\n    ${m.flow ? `flow: ${m.flow}\n    ` : ''}${m.description}\n    covers: ${m.covers.join(', ')}`);
  }
  console.log('\nThese screenshots are for VISUAL confirmation — open the ones relevant to your change and');
  console.log('check it actually paints (nothing blank/overlapping/clipped; Markdown shows real bold/lists;');
  console.log('a sort/filter/search flow visibly changed the result).\n');

  if (failed) { console.log(`\x1b[31m✗ ${failed}/${results.length} capture(s) hit a hard error (load / waitFor presence gate / console error)\x1b[0m`); process.exit(1); }
  console.log(`\x1b[32m✓ all ${results.length} capture(s) succeeded\x1b[0m`);
}

main().catch((e) => { console.error(e); process.exit(1); });
