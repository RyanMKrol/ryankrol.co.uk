import { gradientForKey } from '../CoverTile';
import PipMeter from '../PipMeter';

const SEASON_CHIPS = {
  Winter: 'W',
  Spring: 'Sp',
  Summer: 'Su',
  Autumn: 'A',
  Day: 'D',
  Night: 'N',
};

export default function Variant3ShelfTile({ item }) {
  const hasSeasons = Array.isArray(item.seasons) && item.seasons.length > 0;

  return (
    <div className="perfume-v3-tile-wrap">
      <div
        className="perfume-v3-tile"
        style={{ background: gradientForKey(item.id || item.title) }}
      >
        {hasSeasons && (
          <div className="perfume-v3-season-chips">
            {item.seasons.map((season) => (
              <span key={season} className="perfume-v3-season-chip">
                {SEASON_CHIPS[season] || season.charAt(0)}
              </span>
            ))}
          </div>
        )}

        <h3 className="perfume-v3-title">{item.title}</h3>

        <div className="perfume-v3-rating">
          <PipMeter value={item.rating} readOnly />
        </div>
      </div>

      <div className="perfume-v3-caption">
        {item.designer && <span className="perfume-v3-designer">{item.designer}</span>}
        {item.type && <span className="perfume-v3-type-badge">{item.type}</span>}
        {item.fragranticaUrl && (
          <a
            href={item.fragranticaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="perfume-v3-fragrantica-link"
          >
            Fragrantica →
          </a>
        )}
      </div>
    </div>
  );
}
