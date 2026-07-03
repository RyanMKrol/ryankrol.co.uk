/**
 * A rounded stat block: a big number with a small label beneath. `accentColor`
 * fills the block solid with that color and white text (e.g. the home page's
 * six accent stat blocks); omit it for the neutral mode — card background with
 * an ink border (e.g. workout detail's date/duration/volume chips). `unit`
 * renders a smaller suffix after the number (e.g. "79" + "kg").
 */
export default function StatBlock({ value, unit, label, accentColor }) {
  const style = accentColor
    ? { backgroundColor: accentColor, borderColor: accentColor, color: '#FFFFFF' }
    : undefined;

  return (
    <div className={`collection-stat-block${accentColor ? ' accent' : ' neutral'}`} style={style}>
      <div className="collection-stat-value">
        {value}
        {unit && <span className="collection-stat-unit">{unit}</span>}
      </div>
      <div className="collection-stat-label">{label}</div>
    </div>
  );
}
