import Badge from '../Badge';
import PipMeter from '../PipMeter';
import Markdown from '../Markdown';
import Tooltip from '../Tooltip';
import { formatReviewDate } from '../../lib/dateFormat';
import { PROJECTION_LABELS } from '../PerfumeCharacteristics';

const LONGEVITY_MAX = 8;
const PROJECTION_MAX = 4;

export const PAIRED_APPLICATION_SPOTS = [
  'Wrists',
  'Elbows',
  'Clavicles',
  'Behind ears',
];

export function formatApplicationSpotLine({ spot, sprays }) {
  if (sprays === 1) {
    return PAIRED_APPLICATION_SPOTS.includes(spot)
      ? `1 spray each — ${spot}`
      : `1 spray — ${spot}`;
  }
  return `${sprays} sprays — ${spot}`;
}

export default function Variant6Hybrid({ item }) {
  const hasSeasons = Array.isArray(item.seasons) && item.seasons.length > 0;
  const hasApplicationSpots =
    Array.isArray(item.applicationSpots) && item.applicationSpots.length > 0;
  const hasLongevity = typeof item.longevity === 'number';
  const hasProjection = typeof item.projection === 'number';

  const bestForBlock = hasSeasons && (
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
  );

  const ratingRow = (
    <div className="perfume-v1-rating-row">
      <PipMeter value={item.rating} readOnly />
      <span className="perfume-v1-rating-number">
        {item.rating}/10
      </span>
    </div>
  );

  return (
    <div className="perfume-v6-card">
      <div className="perfume-v1-header">
        <div>
          <div className="perfume-v1-title-row">
            <h3 className="perfume-v1-title">{item.title}</h3>
            {ratingRow}
          </div>
          <p className="perfume-v1-designer">{item.designer}</p>
        </div>
        <div className="perfume-v1-header-badges">
          {item.type && (
            <Tooltip label="What I've got">
              <Badge accentColor="var(--accent-perfumes)">{item.type}</Badge>
            </Tooltip>
          )}
          {item.ownership && (
            <Tooltip label="What I own">
              <Badge accentColor="var(--accent-perfumes)" variant="outline">{item.ownership}</Badge>
            </Tooltip>
          )}
        </div>
      </div>

      {item.description && (
        <div className="perfume-v1-description">
          <Markdown>{item.description}</Markdown>
        </div>
      )}

      {bestForBlock}

      <div className="perfume-v4-scales">
        {hasLongevity && (() => {
          const longevityHours = item.longevity >= LONGEVITY_MAX ? `${LONGEVITY_MAX}+` : item.longevity;
          const longevityLabel = `${longevityHours} ${item.longevity === 1 ? 'hour' : 'hours'}`;
          return (
            <div className="perfume-v4-scale">
              <p className="perfume-v4-scale-heading">Longevity</p>
              <p className="perfume-v4-scale-label">Light ↔ All-day</p>
              <Tooltip label={longevityLabel} className="perfume-v4-scale-tooltip">
                <div className="perfume-v4-scale-track">
                  <div
                    className="perfume-v4-scale-fill"
                    style={{ width: `${(item.longevity / LONGEVITY_MAX) * 100}%` }}
                  />
                </div>
              </Tooltip>
            </div>
          );
        })()}

        {hasProjection && (
          <div className="perfume-v4-scale">
            <p className="perfume-v4-scale-heading">Projection</p>
            <p className="perfume-v4-scale-label">Skin scent ↔ Room-filling</p>
            <Tooltip label={PROJECTION_LABELS[item.projection]} className="perfume-v4-scale-tooltip">
              <div className="perfume-v4-scale-track">
                <div
                  className="perfume-v4-scale-fill"
                  style={{ width: `${(item.projection / PROJECTION_MAX) * 100}%` }}
                />
              </div>
            </Tooltip>
          </div>
        )}
      </div>

      {hasApplicationSpots && (
        <ul className="perfume-v4-checklist">
          {item.applicationSpots.map(({ spot, sprays }) => (
            <li key={spot} className="perfume-v4-checklist-item">
              {formatApplicationSpotLine({ spot, sprays })}
            </li>
          ))}
        </ul>
      )}

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

      {item.date && (
        <p className="perfume-v6-date">Date: {formatReviewDate(item.date)}</p>
      )}
      {item.editedDate && (
        <p className="perfume-v6-date">Updated: {formatReviewDate(item.editedDate)}</p>
      )}
    </div>
  );
}
