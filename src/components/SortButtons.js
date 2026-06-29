/**
 * Segmented sort-button row. Each field is mutually exclusive; clicking the active
 * field flips its direction (no off/disabled state). Clicking a different field
 * activates it at its default direction.
 *
 * fields: Array<{ key, label, defaultValue, flippedValue, defaultArrow, flippedArrow }>
 *   key          — unique identifier
 *   label        — button text
 *   defaultValue — sortBy string for the primary direction
 *   flippedValue — sortBy string for the reversed direction
 *   defaultArrow — glyph shown in primary direction (e.g. '↓')
 *   flippedArrow — glyph shown in reversed direction (e.g. '↑')
 *
 * sortBy   — current sortBy value from the page
 * onChange  — called with the new sortBy string
 */
export default function SortButtons({ fields, sortBy, onChange }) {
  function handleClick(field) {
    if (sortBy === field.defaultValue) {
      onChange(field.flippedValue);
    } else if (sortBy === field.flippedValue) {
      onChange(field.defaultValue);
    } else {
      // Different field becoming active — start at its default direction
      onChange(field.defaultValue);
    }
  }

  return (
    <div className="sort-buttons-container">
      <span className="filter-label">Sort by:</span>
      <div className="filter-buttons">
        {fields.map((field) => {
          const isActive = sortBy === field.defaultValue || sortBy === field.flippedValue;
          const arrow = sortBy === field.flippedValue ? field.flippedArrow : field.defaultArrow;

          return (
            <button
              key={field.key}
              onClick={() => handleClick(field)}
              className={`filter-button${isActive ? ' active' : ''}`}
            >
              {field.label}
              {isActive && <span className="sort-arrow">{arrow}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
