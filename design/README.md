# Handoff: ryankrol.co.uk redesign — "Collection" direction

## Overview
A complete visual redesign of ryankrol.co.uk — a personal life-logging site (media
reviews, vinyl collection, workout tracking, listening habits, GitHub projects). This
package covers **every page, desktop and mobile**, in one cohesive design language
nicknamed **"Collection"**: warm, playful, image-forward, with a persistent nav the old
site lacked.

## About the design files
The files in this bundle are **design references created in HTML** — prototypes that show
the intended look, layout, and behavior. They are **not production code to copy directly**.
The task is to **recreate these designs in the real ryankrol.co.uk codebase** (Next.js +
DynamoDB, per the existing stack) using its established components, data layer, and
conventions. Treat the HTML/inline-styles as an exact spec for spacing, color, and type —
not as files to ship.

All 25 screens live in a single source file: **`Ryan Krol Homepage.dc.html`** (included).
It is a canvas of labelled cards. Each card has an id badge (e.g. `1A`, `2C`, `4B`) that
matches a PNG in **`renders/`**.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and component treatments. Recreate
pixel-faithfully with the codebase's own component library. Cover images shown as colored
gradient tiles are **placeholders** — real cover art drops into those same slots (vinyl
covers, 188/190, already exist in the DB; movie/book/album art needs backfilling from
TMDB / Google Books / Last.fm as the old report noted).

## Renders index
Desktop (1400px design width, shown scaled):
- `renders/1a.png` — **Home** (this is the chosen homepage concept)
- `renders/2a.png` — Movies list · `2b` Vinyl wall · `2c` Exercise dashboard · `2d` Listening
- `renders/3a.png` — Books · `3b` TV · `3c` Albums · `3d` Perfumes · `3e` Projects · `3f` Workouts list · `3g` Workout detail
- `renders/1b.png` — *(alternate homepage concept, "Terminal remastered" — not chosen, kept for reference only)*

Mobile (390px design width):
- `renders/4a.png` Home · `4b` Movies · `4c` Vinyl · `4d` Exercise · `4e` Listening ·
  `4f` Books · `4g` TV · `4h` Albums · `4i` Perfumes · `4j` Projects · `4k` Workouts · `4l` Workout detail

## Design tokens

### Color
| Token | Hex | Use |
|---|---|---|
| bg / paper | `#FBF7EF` | page background |
| ink | `#1A1714` | text, borders (2px), dark cards |
| ink-soft | `#5A544C` | body/secondary text |
| ink-mute | `#8A837A` | captions, meta, monospace labels |
| card | `#FFFFFF` | card surfaces |
| hairline | `#F0EADF` / `#E7E0D4` | dividers, table rows |
| star-gold | `#F4A72C` | rating stars, also albums accent |
| star-empty | `#D8D2C8` | unfilled stars |

Section accent colors (each content type owns one):
| Section | Hex |
|---|---|
| movies | `#FF5C39` (coral) |
| tv | `#4B4DED` (indigo) |
| books | `#159A8C` (teal) |
| albums | `#F4A72C` (marigold) |
| vinyl | `#F25CA2` (pink) |
| workouts | `#1A1714` (ink) |
| listening / perfumes | `#7A5AF8` (grape) |
| projects | `#2FA96B` (green) |

Perfume pip meter: filled `#7A5AF8`, empty `#E1D9F5`.
Warmup set row: bg `#FDF4E3`, text `#B7791F`. Working set row bg `#F4F0E8`.

### Typography
- **Display** — `Bricolage Grotesque`, weights 600/700/800. Page titles 88px, hero 132px,
  card titles 19–24px, big numbers 40–52px. Letter-spacing -0.02 to -0.04em on large sizes.
- **Body / UI** — `Nunito`, weights 500–800. Body 14–18px. Review text is `italic`.
- **Mono / labels** — `Space Mono` (badges, dates like `11·05·26`, small caps labels with
  letter-spacing ~0.06–0.08em). Set data (weight × reps) uses mono.

### Shape & elevation
- Radius: cards 18–20px, pills/buttons 999px, cover tiles 10–12px, stat blocks 14–20px,
  phone frame 34px.
- Borders: `2px solid #1A1714` on white cards, pills, inputs.
- Card shadow (cover tiles): `0 6px 16px rgba(0,0,0,.14)`.

### Spacing
Page gutters 40px desktop / 18px mobile. Card padding 16–22px. Grid gaps 12–20px.

## Screens

### Home (`1a` / `4a`)
Persistent top nav (wordmark + 9 section pills + "now playing" chip). Hero: oversized
`Howdy.`, tagline, right-aligned mono meta. "Life in numbers" — 6 accent-colored stat
blocks (movies 188 / tv 99 / books 53 / albums 48 / vinyl 190 / workouts 368). "The
collection wall" — a 9-col grid of cover tiles. Lower split: "Latest takes" review cards +
right rail (gym mini-dashboard with bar sparkline, vinyl shelf list). Mobile collapses nav
to ☰, stats to a 3-col grid, wall hidden in favor of quick-link rows.

### Reviews lists — movies `2a`/`4b`, tv `3b`/`4g`, books `3a`/`4f`, albums `3c`/`4h`
Header: big title + count + avg rating + this-year count; search box; Date/Title/Score
sort pills (Date active by default). Movies/TV = 3-col poster-banner cards (gradient banner
with title, then stars + date + snippet). Books = horizontal cards with spine cover +
author/pages/year metadata. Albums = 2-col cards with square cover + "HIGHLIGHTS" track
line. **Pagination** at the bottom (the old site rendered all 188 at once — introduce
paging/denser grids). Ratings render as 0–5 star glyphs (gold filled / `#D8D2C8` empty).

### Perfumes (`3d` / `4i`)
**Rated 0–10, not 0–5.** Deliberately does NOT use stars. Shows a large numeric score
(e.g. `7.0`) + a **10-dot pip meter** (filled grape / empty lilac). Designer byline +
type chip (EDP/EDT). The page header states the scale rule explicitly so it never reads as
a /5 rating. Collection is new/small — empty "+ your next review" slot included.

### Vinyl (`2b` / `4c`)
The showcase. Header + covers/list toggle + search. Records grouped by artist letter
(section header = big accent letter + hairline + count). Grid of square cover tiles
(7-col desktop / 3-col mobile) with title + artist caption beneath. Covers already exist
in DB for 188/190 records.

### Listening (`2d` / `4e`)
Top-50 albums, last 90 days (Last.fm). Ranked rows: rank number + cover thumb + title/artist
+ horizontal playcount bar (length ∝ plays) + playcount. #1 row is filled with the grape
accent; the rest are white bordered cards.

### Projects (`3e` / `4j`)
GitHub repos as cards: name + star count, description, language dot (GitHub language colors
— TS `#3178C6`, Python `#3572A5`, Shell `#89E051`) + name, "updated Xago", topic tag pills.

### Workouts list (`3f` / `4k`)
Header + All/Push/Pull/Legs filter pills. 2-col session cards: title, split-type badge
(Push=coral, Pull=pink, Legs=indigo), mono date/time/duration, exercise-count + volume
stats. Paginated (368 total).

### Workout detail (`3g` / `4l`)
Back link, title + split badge, a row of stat chips (date/duration/volume/exercises), then
one card per exercise listing each set as a mono row (`51.5kg × 8`). Warmup sets get the
amber treatment; working sets the neutral row.

### Exercise detail (`2c` / `4d`)
The most data-dense screen. Back link + title + time-range pills (3 months / 1 year / all).
5 stat cards (sessions, all-time 1RM, max weight, total volume, 1RM progress %; the 1RM and
progress cards are accent-filled). Charts: a large "Estimated 1RM progress" area chart
(coral line + gradient fill), "Session volume" bar chart (indigo, last bar highlighted
grape), "Max weight progress" area chart (marigold). "Progress insights" dark panel + a
"Recent sessions" table (Date/Split · Volume · Max Wt · Est. 1RM).

## Interactions & behavior
- **Nav**: persistent on every page (new vs. old site). Active section pill is filled with
  that section's accent color. Mobile → ☰ menu.
- **Now-playing chip**: polls Last.fm; shows track or "not listening rn :)" idle state.
- **Sort pills / filter pills**: single-select, active = ink fill.
- **Charts**: the exercise page keeps the existing 3-months/1-year/all-time toggle.
- **Matrix easter egg**: KEEP IT — the Konami code (↑↑↓↓←→←→BA) green code-rain overlay
  stays as a hidden extra (not shown in these static renders).
- Ratings: 0–5 stars for movies/tv/books/albums; 0–10 pip meter for perfumes.

## Responsive behavior
Desktop designs are 1400px wide; mobile designs 390px. Nav collapses to ☰; multi-column
grids collapse to 1–3 columns; stat rows become 2–3 col grids; horizontal review cards
stack. See paired renders (`2a` ↔ `4b`, etc.).

## Assets
No real images in the prototype. Cover art is represented by CSS gradient placeholder tiles.
In production, pull covers from: vinyl/albums → Last.fm; movies/tv → TMDB (`posterPath`);
books → Google Books / Open Library. Language dots use standard GitHub language colors.
Fonts: Bricolage Grotesque, Nunito, Space Mono (all Google Fonts).

## Files
- `Ryan Krol Homepage.dc.html` — the full source prototype (all 25 screens). Inline styles
  are the exact spec.
- `renders/*.png` — one full-page render per screen, named by card id.
