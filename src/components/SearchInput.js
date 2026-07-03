/**
 * Bordered pill-shaped search box with a leading glyph. Controlled input.
 */
export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="collection-search-input">
      <span className="collection-search-icon" aria-hidden="true">⌕</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
