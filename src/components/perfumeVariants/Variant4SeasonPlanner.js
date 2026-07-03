const LONGEVITY_MAX = 8;
const PROJECTION_MAX = 4;

export default function Variant4SeasonPlanner({ item }) {
  const hasSeasons = Array.isArray(item.seasons) && item.seasons.length > 0;
  const hasApplicationSpots =
    Array.isArray(item.applicationSpots) && item.applicationSpots.length > 0;
  const hasLongevity = typeof item.longevity === 'number';
  const hasProjection = typeof item.projection === 'number';

  return (
    <div className="perfume-v4-card">
      {hasSeasons && (
        <div className="perfume-v4-best-for">
          <p className="perfume-v4-best-for-label">Best for</p>
          <div className="perfume-v4-season-chips">
            {item.seasons.map((season) => (
              <span key={season} className="perfume-v4-season-chip">
                {season}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="perfume-v4-scales">
        {hasLongevity && (
          <div className="perfume-v4-scale">
            <p className="perfume-v4-scale-label">Light ↔ All-day</p>
            <div className="perfume-v4-scale-track">
              <div
                className="perfume-v4-scale-fill"
                style={{ width: `${(item.longevity / LONGEVITY_MAX) * 100}%` }}
              />
            </div>
          </div>
        )}

        {hasProjection && (
          <div className="perfume-v4-scale">
            <p className="perfume-v4-scale-label">Skin scent ↔ Room-filling</p>
            <div className="perfume-v4-scale-track">
              <div
                className="perfume-v4-scale-fill"
                style={{ width: `${(item.projection / PROJECTION_MAX) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {hasApplicationSpots && (
        <ul className="perfume-v4-checklist">
          {item.applicationSpots.map(({ spot, sprays }) => (
            <li key={spot} className="perfume-v4-checklist-item">
              {sprays} {sprays === 1 ? 'spray' : 'sprays'} — {spot}
            </li>
          ))}
        </ul>
      )}

      <div className="perfume-v4-header">
        <h3 className="perfume-v4-title">{item.title}</h3>
        {item.designer && <span className="perfume-v4-designer">{item.designer}</span>}
        {item.type && <span className="perfume-v4-type">{item.type}</span>}
        <span className="perfume-v4-rating">{item.rating}/10</span>
      </div>

      {item.fragranticaUrl && (
        <a
          href={item.fragranticaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="perfume-v4-fragrantica-link"
        >
          Fragrantica →
        </a>
      )}
    </div>
  );
}
