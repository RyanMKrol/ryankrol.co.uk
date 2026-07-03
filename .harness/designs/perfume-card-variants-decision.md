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
