/**
 * Small filled pill for labels — split-type badges (PUSH/PULL/LEGS), type
 * chips (EDP/EDT), GitHub topic pills.
 *
 * variant: "solid" (filled, white text) | "soft" (tinted background, colored text)
 * mono: use the Space Mono small-caps treatment (default) — GitHub topic pills
 * use lowercase Nunito instead, so pass mono={false} for those.
 */
export default function Badge({ children, color, accentColor, variant = 'solid', mono = true }) {
  const fill = accentColor || color;
  const style = variant === 'soft'
    ? { backgroundColor: `${fill}1A`, color: fill }
    : { backgroundColor: fill, color: '#FFFFFF' };

  const className = mono ? 'collection-badge' : 'collection-badge collection-badge-plain';

  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
}
