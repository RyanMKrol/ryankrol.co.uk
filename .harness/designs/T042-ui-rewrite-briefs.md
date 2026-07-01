# T042 — Full-site UI/IA rewrite: three design briefs

Context for downstream builders (T043–T063): the site today (`src/pages/index.js`,
`src/pages/reviews/movies/index.js`, `src/pages/vinyl/index.js`,
`src/pages/workouts/index.js`) is a fairly conventional personal-site layout — a centered
`.container`, a home page built from a grid of colored link cards
(`.home-grid` / `.home-grid-card`), list pages that render a card per item
(`ReviewCard`, `WorkoutCard`) with a shared `Header` and sort/filter buttons above the
grid, and a vinyl page that groups cards under alphabet-letter headings. All three
variants below reuse the exact same underlying data (reviews, vinyl, workouts/exercises,
listening, projects) — this is an IA/layout/typography rewrite, not a new feature set.

Each variant is a complete, self-consistent system. A builder implementing one variant
should not borrow structural ideas from another variant's section below.

---

## Variant 1: Dense Data-Table Console

**Identity.** A terminal/spreadsheet-inspired console. Every content type is presented
as a dense, scannable table, not a card grid. The whole site behaves like a single
multi-tab data application rather than a set of separate pages.

**Navigation paradigm.** Persistent **left sidebar**, fixed full-height, ~220px wide,
always visible (collapses to icon-only rail under 900px width, never to a hamburger
menu). The sidebar lists every section as a flat vertical list of text rows (`Movies`,
`TV`, `Books`, `Albums`, `Perfumes`, `Vinyl`, `Workouts`, `Exercises`, `Listening`,
`Projects`) with a small row-count badge on the right of each row (e.g. `Movies · 143`).
No top nav bar at all — the header area is a single-line breadcrumb
(`~ / reviews / movies`) plus a persistent search input, both inline at the top of the
main content column, not a separate chrome band. The home page IS the sidebar landing
state: selecting nothing shows a single aggregate table (recent activity across all
types, one row per item, a `type` column identifying which section it came from).

**Information density.** Maximum. Every list is an actual `<table>` (or CSS-grid
styled to look like one) with a fixed-height row (~32–36px), monospace figures, right-
aligned numeric columns (rating, playcount, volume, 1RM), and zebra-striped rows. No
whitespace-heavy card padding anywhere. Columns are sortable by clicking the column
header (replaces the current `SortButtons` component entirely — no separate button
row). Pagination is a compact row-count control at the table foot
(`1–50 of 143  ‹ ›`), not the current spinner+page-number pattern.

**List view.** E.g. movie reviews: one table, one row per movie, columns
`Title | Rating | Reviewed | Excerpt` (excerpt truncated to ~60 chars with ellipsis,
full text only in detail view). Row hover highlights the whole row; clicking anywhere
in the row navigates to detail — no separate "view" link/button per row.

**Detail/form view.** Opens as a **right-hand slide-in panel** (like a spreadsheet
row inspector), not a full page navigation — the table stays visible and scrolled to
the same position on the left at reduced width, the detail/edit form occupies a fixed
~420px panel on the right. Form fields are a plain vertical label:value stack, each
row a single dense line (`Rating  [ ★★★★☆ ]`), no card/box styling around the form.
Closing the panel (Esc or an × in its top-right corner) returns full width to the
table.

**Typography/hierarchy.** One monospace family throughout (keep JetBrains Mono), one
base size for all body/table text (14px), and hierarchy built ENTIRELY from weight and
color, never size — headings are the same font-size as body text but bold + a color
accent, matching a terminal/spreadsheet convention where nothing is ever "big text."
Page titles shrink to the breadcrumb line described above; there is no large `<h1>`
anywhere on the site.

**Shared chrome.** Sidebar (nav) + breadcrumb/search header bar, described above. No
footer — the sidebar's bottom-most fixed row is a compact status line
(`● online · cache: 12m ago`) that replaces any footer content.

---

## Variant 2: Editorial Card Magazine

**Identity.** A glossy editorial/magazine layout — think a print magazine's contents
page and feature-article spreads translated to the web. Optimized for browsing and
visual delight over density.

**Navigation paradigm.** **Top nav bar**, full width, but structured as a magazine
masthead: a large wordmark/site name centered, with the section list as a single row
of small-caps text links directly beneath it (`Movies · TV · Books · Albums ·
Perfumes · Vinyl · Workouts · Listening · Projects`), separated by thin vertical
rules, no icons. This masthead is the only chrome on every page — no sidebar. On
mobile, the section row becomes a horizontally-scrollable single line (not a
hamburger drawer) so the "magazine contents strip" metaphor is preserved at every
width.

**Information density.** Deliberately spacious and asymmetric. The home page and
every list page open with one large "featured" item (the most recent review/vinyl
add/workout) rendered as a wide hero card with a big image/placeholder, then the
remaining items drop into a **masonry-style, uneven multi-column grid** (varying
card heights based on how much review text each item has) rather than a uniform
grid — deliberately the opposite of Variant 1's uniform table rows.

**List view.** E.g. movie reviews: hero card for the latest-reviewed movie (large
title, pull-quote-styled excerpt from the review text, rating rendered as a row of
star glyphs at 1.5× normal size), then a masonry grid of the rest, each card showing
title, a 2–3 line excerpt in a serif-like reading typeface, and the rating. Sort
controls are de-emphasized: a single small "Sort: Newest ▾" dropdown in the top-right
of the grid, not a row of buttons.

**Detail/form view.** Full-page "article" layout: a wide single centered column
(~680px, magazine-column width), title rendered large at the top as a headline, rating
displayed as an inline byline-style element under the title (`★★★★☆ — reviewed
12 Mar 2026`), and the review text rendered as flowing article body copy with drop-cap
styling on the first paragraph. The add/edit FORM reuses this same article shell —
form fields are laid into the same centered column with large, minimal-chrome inputs
(underline-only, no boxes) so editing feels like drafting the article itself, not
filling out a form.

**Typography/hierarchy.** Two-family pairing: a bold display/serif face for headlines
and titles (large, e.g. 2.5–4rem for hero/detail titles) paired with a plain sans body
face for everything else — a genuine size AND family contrast, not just a palette
change. Hierarchy is expressed through dramatic size jumps (hero title ≫ card title ≫
body copy) rather than Variant 1's flat-size/weight-only approach.

**Shared chrome.** Masthead nav described above; footer is a wide "colophon" band
(three columns: about/tagline, section links repeated, a small now-playing widget)
styled like a magazine's back-page credits block.

---

## Variant 3: Minimal Linear Feed

**Identity.** A single continuous vertical feed/timeline, closest in spirit to a
chat log or a Unix `less` pager — radically reduces the site to one scrollable
column with no grids, no cards, no tables at all.

**Navigation paradigm.** No persistent nav chrome on content pages at all. A single
slim **top utility bar** (~40px tall) containing only: a home icon/wordmark on the
left and a single `Jump to ▾` dropdown on the right listing all sections — clicking
a section scrolls/navigates but there is no persistent menu, no sidebar, no masthead
row. The home page itself IS effectively every section's feed interleaved
chronologically into one infinite-scroll timeline (reviews, vinyl adds, workouts,
all as timeline entries sorted by date, each entry tagged with a small inline label
identifying its type) — visiting `/reviews/movies` is just that same timeline
pre-filtered to one type, reinforcing that there is only ever one feed, filtered
differently.

**Information density.** Extremely low, strictly linear. Each item is one flat
horizontal-rule-separated block in the timeline: a date on the left in a narrow
fixed-width gutter column (like a changelog), the content to the right of it. No
grid at all, no wrapping columns — every item is full-bleed-width within the
content column and stacks strictly one after another. This is the deliberate third
extreme, between Variant 1's rigid table grid and Variant 2's uneven masonry grid.

**List view.** E.g. movie reviews: the timeline shows one line per movie —
date in the gutter, then `Title — rating (★★★★☆)` inline, with the review excerpt
collapsed by default (a `+` disclosure toggle inline expands it in place, pushing
later entries down, rather than navigating away). There is no separate sort-button
row; instead a single inline text control at the top of the feed
(`sorted by date, newest first — change`) that behaves like a link/toggle, not a
button group.

**Detail/form view.** There is no separate detail page navigation — the "detail" view
IS the expanded-in-place disclosure state described above (clicking a title expands
that single timeline entry inline to show full review text, larger rating display,
and — only when in an authenticated/editing context — the edit form fields appear
inline in that same expanded block, directly below the review text, rather than on a
separate `/edit/[id]` route/page). Add flows follow the same pattern: "add new" is a
single entry pinned to the top of the relevant feed that expands into an inline form
when clicked, then collapses back into a normal read-only timeline entry once saved.

**Typography/hierarchy.** Single sans body face, single size for all timeline text
(no large headings anywhere, including no large page `<h1>` — the "page title" is
just the first line of the utility bar's `Jump to` state). Hierarchy is carried
entirely by the fixed-width date gutter and horizontal rules between entries — visual
structure comes from spacing/alignment rhythm, not from any type-size or type-family
contrast at all. This is the deliberate opposite extreme from Variant 2's
size/family-driven hierarchy and from Variant 1's weight/color-driven hierarchy.

**Shared chrome.** The slim utility bar described above, and nothing else — no
footer; the timeline simply ends with a `— end of feed —` marker line matching the
gutter/rule styling of every other entry.
