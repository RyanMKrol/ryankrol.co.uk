import Badge from '../Badge';
import PipMeter from '../PipMeter';

export default function Variant1StatBlock({ item }) {
  const hasLongevity = item.longevity !== undefined && item.longevity !== null;
  const hasProjection = item.projection !== undefined && item.projection !== null;
  const hasSeasons = Array.isArray(item.seasons) && item.seasons.length > 0;
  const hasApplicationSpots = Array.isArray(item.applicationSpots) && item.applicationSpots.length > 0;

  return (
    <div className="perfume-v1-card">
      <div className="perfume-v1-header">
        <div>
          <h3 className="perfume-v1-title">{item.title}</h3>
          <p className="perfume-v1-designer">{item.designer}</p>
        </div>
        {item.type && (
          <Badge accentColor="var(--accent-perfumes)">{item.type}</Badge>
        )}
      </div>

      <div className="perfume-v1-rating-row">
        <PipMeter value={item.rating} readOnly />
        <span className="perfume-v1-rating-number">{item.rating}/10</span>
      </div>

      {(hasLongevity || hasProjection || hasSeasons || hasApplicationSpots) && (
        <div className="perfume-v1-stats">
          {hasLongevity && (
            <div className="perfume-v1-stat-row">
              <span>Longevity: {item.longevity}/8</span>
            </div>
          )}
          {hasProjection && (
            <div className="perfume-v1-stat-row">
              <span>Projection: {item.projection}/4</span>
            </div>
          )}
          {hasSeasons && (
            <div className="perfume-v1-stat-row perfume-v1-seasons">
              {item.seasons.map((season) => (
                <span key={season} className="perfume-v1-season-chip">
                  {season}
                </span>
              ))}
            </div>
          )}
          {hasApplicationSpots && (
            <div className="perfume-v1-stat-row">
              <span>
                {item.applicationSpots
                  .map((spot) => `${spot.sprays}× ${spot.spot}`)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {item.description && (
        <p className="perfume-v1-description">{item.description}</p>
      )}

      {item.fragranticaUrl && (
        <a
          href={item.fragranticaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="perfume-v1-fragrantica-link"
        >
          View on Fragrantica
        </a>
      )}
    </div>
  );
}
