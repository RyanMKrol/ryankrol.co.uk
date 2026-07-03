export default function Variant5TableRow({ item }) {
  const hasLongevity = typeof item.longevity === 'number';
  const hasProjection = typeof item.projection === 'number';
  const hasSeasons = Array.isArray(item.seasons) && item.seasons.length > 0;
  const hasApplicationSpots =
    Array.isArray(item.applicationSpots) && item.applicationSpots.length > 0;

  return (
    <details className="perfume-v5-row">
      <summary className="perfume-v5-summary">
        <span className="perfume-v5-title">{item.title}</span>
        <span className="perfume-v5-designer">{item.designer || '—'}</span>
        {item.type ? (
          <span className="perfume-v5-type">{item.type}</span>
        ) : (
          <span className="perfume-v5-type perfume-v5-type-empty">—</span>
        )}
        <span className="perfume-v5-rating">{item.rating}/10</span>
        <span className="perfume-v5-cell">{hasLongevity ? `${item.longevity}/8` : '—'}</span>
        <span className="perfume-v5-cell">{hasProjection ? `${item.projection}/4` : '—'}</span>
        <span className="perfume-v5-cell">{hasSeasons ? item.seasons.join(', ') : '—'}</span>
      </summary>

      <div className="perfume-v5-details">
        {item.description && <p className="perfume-v5-description">{item.description}</p>}

        {hasApplicationSpots && (
          <ul className="perfume-v5-application-spots">
            {item.applicationSpots.map(({ spot, sprays }) => (
              <li key={spot}>
                {sprays} {sprays === 1 ? 'spray' : 'sprays'} — {spot}
              </li>
            ))}
          </ul>
        )}

        {item.fragranticaUrl && (
          <a
            href={item.fragranticaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="perfume-v5-fragrantica-link"
          >
            Fragrantica →
          </a>
        )}
      </div>
    </details>
  );
}
