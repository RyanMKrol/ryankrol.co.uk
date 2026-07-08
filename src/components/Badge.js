/**
 * Small filled pill for labels — split-type badges (PUSH/PULL/LEGS), type
 * chips (EDP/EDT), GitHub topic pills.
 *
 * variant: "solid" (filled, white text) | "soft" (tinted background, colored text)
 *   | "outline" (white/card background, colored text, hairline border)
 * mono: use the Space Mono small-caps treatment (default) — GitHub topic pills
 * use lowercase Nunito instead, so pass mono={false} for those.
 */
export default function Badge({
  children, color, accentColor, variant = 'solid', mono = true, className = '', tabIndex, ariaLabel,
}) {
  const fill = accentColor || color;
  let style;
  if (variant === 'soft') {
    style = { backgroundColor: `${fill}1A`, color: fill };
  } else if (variant === 'outline') {
    style = { backgroundColor: 'var(--color-card)', color: fill, border: '1px solid var(--color-border-strong)' };
  } else {
    style = { backgroundColor: fill, color: '#FFFFFF' };
  }

  const baseClassName = mono ? 'collection-badge' : 'collection-badge collection-badge-plain';

  return (
    <span className={[baseClassName, className].filter(Boolean).join(' ')} style={style} tabIndex={tabIndex} aria-label={ariaLabel}>
      {children}
    </span>
  );
}

/**
 * Shared medal + axis-label pill for personal-best call-outs (weight/1RM/volume
 * PRs), used by both the workouts list and workout detail pages so the two
 * surfaces can't drift into diverging badge markup. `label` is the visible text;
 * `ariaLabel` carries the same information back out for screen readers once the
 * visible label drops the "PR" suffix (e.g. label="Weight", ariaLabel="weight personal best").
 */
export function PrBadge({ label, ariaLabel }) {
  return (
    <Badge accentColor="var(--accent-workouts)" variant="soft" mono={false} className="pr-badge" tabIndex={0} ariaLabel={ariaLabel}>
      <span aria-hidden="true">🏅</span>
      <span className="pr-badge-label"> {label}</span>
    </Badge>
  );
}
