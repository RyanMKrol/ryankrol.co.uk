/**
 * Small filled pill for labels — split-type badges (PUSH/PULL/LEGS), type
 * chips (EDP/EDT), GitHub topic pills.
 *
 * variant: "solid" (filled, white text) | "soft" (tinted background, colored text)
 */
export default function Badge({ children, color, accentColor, variant = 'solid' }) {
  const fill = accentColor || color;
  const style = variant === 'soft'
    ? { backgroundColor: `${fill}1A`, color: fill }
    : { backgroundColor: fill, color: '#FFFFFF' };

  return (
    <span className="collection-badge" style={style}>
      {children}
    </span>
  );
}
