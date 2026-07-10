# Perfume card variants — decision

Five variants were built and compared live at `/dev/perfume-variants` against real perfume data
(Variant 1 Stat Block, Variant 2 Editorial, Variant 3 Bottle Shelf, Variant 4 Season & Occasion
Planner, Variant 5 Minimal Table Row).

## Decision

**None of the original five variants won outright.** Instead, a sixth variant (`Variant 6 —
Hybrid`) was created during review, merging the liked parts of Variant 1 and Variant 4:

- Header (title/designer/type badge), rating row, and description notes — from Variant 1.
- "Best for" season chips, the longevity/projection scale bars, and the application-spots
  checklist — from Variant 4.
- The Fragrantica link uses Variant 4's styling (italic `Fragrantica →`), not Variant 1's.
- Final field order: header → description → rating → best-for → scales → checklist →
  Fragrantica link.
- The description is rendered in full, unclamped/untruncated — perfume reviews have no public
  detail page (only a list view + password-gated edit), so the card is the only place the notes
  are readable; truncating would hide them with no way to read the rest.

Variant 5 (table row) was rejected outright and deleted (component + its `perfume-v5-*` CSS)
during review — not a fit for this list.

**Winner: Variant 6 — Hybrid**, implemented in
`src/components/perfumeVariants/Variant6Hybrid.js`. The next task (promote-and-cleanup) should
promote this component to the live `/reviews/perfumes` card and delete the other variant files
(`Variant1StatBlock.js` through `Variant5TableRow.js` — note Variant 5 is already deleted) plus
the `/dev/perfume-variants` preview page.

## Decision — T343/T344 rating position sweep (2026-07-10)

A follow-up sweep (T343 built the comparison, T344 was the human decision) compared 3 variants of
`Variant6Hybrid`'s rating position/size, live at `/dev/perfume-card-variants` against real data:

- **Baseline** — today's exact layout (rating row below the description, normal size).
- **Rating below header** — rating row moved to sit right after the header (title + designer),
  above the description; normal size.
- **Rating next to title** — rating (pips + score) moved inline, directly beside the title on
  the same line, no dedicated row at all.

An earlier fourth candidate — enlarging the rating number in place (`big-rating`) and moving it
into the header at enlarged size (`header-rating`) — was rejected before this round even reached
comparison: the owner felt the pips/score looked too large and asked for both to be dropped
without a side-by-side look. A `best-for-bottom` position variant (seasons moved after the
longevity/projection scales) was rejected on the same pass, unreviewed, in favour of stripping the
comparison down to a rating-position-only decision.

**Winner: Rating next to title.** The owner's own words: "I think that looks pretty good...
let's go with this version." The "rating below header" option left visible whitespace around the
rating row as its own block; putting it inline next to the title removed that dead space entirely
while keeping the same pips + numeric score.

This decision has been landed directly (not deferred to a separate task): `Variant6Hybrid.js` now
renders ONLY the winning layout (no more `variant` prop/switching), the `/dev/perfume-card-variants`
dev page has been deleted, and the losing layouts' code/CSS have been removed.
