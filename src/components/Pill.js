/**
 * A single rounded pill button. `active` fills it — ink background by default,
 * or `accentColor` to fill with a specific section accent instead (e.g. coral
 * for the movies nav pill).
 */
export default function Pill({ children, active, accentColor, onClick }) {
  const style = active && accentColor
    ? { backgroundColor: accentColor, borderColor: accentColor, color: '#FFFFFF' }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`collection-pill${active ? ' active' : ''}`}
      style={style}
    >
      {children}
    </button>
  );
}
