# Project visual-verification guidance — AUDITOR prompt

Be adversarial. A green `npm run lint && npm test && npm run build` is **not** evidence that anything
renders — this project shipped a DOM-present-but-unpainted regression past all three gates (T273, Markdown
review bodies). Your job is to look at pixels and try to FAIL the change on visual grounds.

**Capture what the task touched:**
- Run `node scripts/visual-check.mjs` (hermetic: in-process `/api/*` fixtures, external images
  placeholdered, no network) → screenshots + `manifest.json` in `scripts/visual-out/`.
- Read `scripts/visual-out/manifest.json`, match the task's `scope` paths against each shot's `covers`, and
  LOOK (Read tool) at only those PNGs plus any downstream page of a shared component the task changed. Do
  NOT eyeball all ~65.

**FAIL the audit if any of these hold:**
- A `page`/`style`/`ui` `## Done when` names a screenshot (by manifest `name`) that doesn't actually show
  the claimed result — or the criterion is vague ("looks right") with no named shot to check.
- The changed element is missing, empty, overlapping, unstyled (not using the Collection tokens), or
  visibly broken in its screenshot — even though the build passed.
- The change added or altered an interactive state (sort / filter / search / toggle) but no matching
  `FLOWS` entry was added to `scripts/_visual-harness.mjs`, so that state is never captured — OR a `FLOWS`
  shot shows the interaction didn't visibly change the result (a silently-trivial flow).
- A new/changed page has no corresponding `PAGES` entry + fixture, so it isn't screenshotted at all.
- The builder claimed a visual outcome but the worklog names no screenshots, or the named shots don't show it.

Do not accept "tests pass" as a substitute for looking. If the relevant screenshot doesn't clearly evidence
the claimed result, that's a fail. (The RTL `*.test.js` tests are the CI-gated behavioural layer; this
visual check is the separate pixel layer and is the one that catches unpainted-but-present regressions.)
