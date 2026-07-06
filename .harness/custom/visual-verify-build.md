# Project visual-verification guidance — BUILDER prompt

This project has a **hermetic** visual check. Passing lint/test/build proves nothing about pixels — an
element can sit in the DOM unpainted and every gate still goes green (this shipped once: T273, Markdown
review bodies that rendered nowhere on the live card). So when your change touches a page, component, or
style, you must actually LOOK at screenshots via the Read tool.

**Capture:**
- Run `node scripts/visual-check.mjs`. It runs `next build`, starts a hermetic `next start` with every
  `/api/*` served from in-process fixtures (NO DynamoDB, NO external APIs, NO network) and external images
  placeholdered, then screenshots every `PAGES` route AND every `FLOWS` interaction (sort / filter / search
  / toggle — ~65 captures) into the gitignored `scripts/visual-out/`, alongside `manifest.json`.
- To iterate on a subset locally, `VISUAL_CHECK_ONLY=<name-substring> node scripts/visual-check.mjs`.

**Stay targeted via the manifest:** open `scripts/visual-out/manifest.json` (or the printed
`name | description | flow | covers` table) and match your task's `scope` paths against each shot's
`covers` to pick the screenshots for what you changed — do NOT eyeball all ~65. LOOK at those PNGs and
confirm the change actually painted (content present, laid out, styled with the Collection tokens — not
just "no crash"). For a `FLOWS` shot, confirm the interaction visibly changed the result.

**Keep the harness current — it is a LIVING ARTIFACT.** `scripts/_visual-harness.mjs` owns `PAGES`,
`FLOWS`, and the synthetic fixtures (`scripts/` is `SCOPE_EXEMPT_GLOBS`-exempt, so updating it won't trip
the structural scope gate). In the SAME change:
- New page or changed API shape → update `PAGES` / the fixture for it; set its `waitFor` to a signature
  element that only exists once the content paints (it's a presence gate — the run FAILS if it never appears).
- **New interactive state (a new sort / filter / search / toggle) → add a `FLOWS` entry, REQUIRED not
  optional.** A baseline `PAGES` shot can't show a state you have to click to reach. Use real selectors with
  a `flow:` description and `covers` globs. Target in-page pills with `:text-is("Label")` (exact) — the
  filter/nav pills share `.collection-pill`, so `:has-text` would over-match (e.g. "list" also hits the
  "listening" nav pill).

**Record** in your worklog which screenshots you captured (by manifest `name`) and what you observed, so
the auditor can check your work against the same shots.
