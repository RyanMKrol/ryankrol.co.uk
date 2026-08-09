/**
 * Loading placeholders for the home page's per-section reveal (T339). Each skeleton renders the
 * REAL content's own markup and classes with invisible placeholder text (`.skeleton-text` makes
 * the text transparent while `.skeleton-shimmer` paints the shimmer box it sizes), so the
 * skeleton's height comes from the exact same CSS as the loaded content and the swap causes no
 * layout shift by construction — there are no hand-tuned placeholder heights to drift.
 */

export function StatBlockSkeleton({ label = 'loading' }) {
  return (
    <div className="collection-stat-block skeleton-stat-block" aria-hidden="true">
      <div className="collection-stat-value"><span className="skeleton-shimmer skeleton-text">000</span></div>
      <div className="collection-stat-label"><span className="skeleton-shimmer skeleton-text">{label}</span></div>
    </div>
  );
}

const TILE_TITLES = ['A cover title', 'Longer cover title here', 'Short one', 'A cover title again'];
const TILE_SUBTITLES = ['An artist', 'Somebody else', 'A name'];

export function TileGridSkeleton({ count = 18 }) {
  return (
    <div className="home-wall-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="cover-tile-wrap">
          <div className="cover-tile skeleton-shimmer" style={{ aspectRatio: '1 / 1' }} />
          <div className="cover-tile-caption">
            <p className="cover-tile-title"><span className="skeleton-shimmer skeleton-text">{TILE_TITLES[i % TILE_TITLES.length]}</span></p>
            <p className="cover-tile-subtitle"><span className="skeleton-shimmer skeleton-text">{TILE_SUBTITLES[i % TILE_SUBTITLES.length]}</span></p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardRowSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="home-latest-card" aria-hidden="true">
          <div className="home-latest-thumb skeleton-shimmer" />
          <div className="home-latest-body">
            <h3 className="home-latest-title">
              <span className="home-latest-title-text"><span className="skeleton-shimmer skeleton-text">A recent review title</span></span>
              <span className="stars"><span className="star skeleton-text">★★★★★</span></span>
            </h3>
            <p className="home-latest-snippet home-snippet-skeleton">
              <span className="skeleton-shimmer skeleton-snippet-line" style={{ width: '100%' }} />
              <span className="skeleton-shimmer skeleton-snippet-line" style={{ width: '96%' }} />
              <span className="skeleton-shimmer skeleton-snippet-line" style={{ width: '62%' }} />
            </p>
          </div>
        </div>
      ))}
    </>
  );
}

export function GymPanelStatsSkeleton() {
  // Placeholder values mirror the compact formatting the loaded panel uses (formatCompactNumber),
  // so placeholder and real values are near-identical widths and flex layout matches.
  const stats = [
    { value: '999', unit: null, label: 'sessions' },
    { value: '999k', unit: 'kg', label: 'total volume' },
    { value: '99.9k', unit: 'kg', label: 'best session vol' },
  ];
  return (
    <>
      <div className="home-gym-stats" aria-hidden="true">
        {stats.map(({ value, unit, label }) => (
          <div key={label}>
            <div className="home-gym-stat-value">
              <span className="skeleton-shimmer skeleton-text">
                {value}
                {unit && <span className="home-gym-stat-unit">{unit}</span>}
              </span>
            </div>
            <div className="home-gym-stat-label"><span className="skeleton-shimmer skeleton-text">{label}</span></div>
          </div>
        ))}
      </div>
      <div className="home-sparkline" aria-hidden="true">
        <div className="skeleton-shimmer skeleton-sparkline-fill" />
      </div>
    </>
  );
}

export function TopOfMindSkeleton() {
  return (
    <section className="home-top-of-mind-panel">
      <div className="home-top-of-mind-panel-inner">
        <span className="home-top-of-mind-panel-label">Top of mind</span>
        <div className="home-top-of-mind-body home-top-of-mind-body-clamped home-top-of-mind-body-skeleton">
          <div className="skeleton-shimmer home-top-of-mind-skeleton-line" style={{ width: '95%' }} />
          <div className="skeleton-shimmer home-top-of-mind-skeleton-line" style={{ width: '88%' }} />
          <div className="skeleton-shimmer home-top-of-mind-skeleton-line" style={{ width: '55%' }} />
        </div>
        <div className="home-top-of-mind-toggle-row">
          <div className="skeleton-shimmer home-top-of-mind-toggle-skeleton" />
        </div>
      </div>
    </section>
  );
}

const SHELF_TITLES = ['A record title', 'Another longer record title', 'Short title', 'A record again', 'One more record'];
const SHELF_ARTISTS = ['An artist', 'Somebody', 'A band name', 'Someone else', 'An artist'];

export function ShelfListSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="home-shelf-item" aria-hidden="true">
          <span><span className="skeleton-shimmer skeleton-text">{SHELF_TITLES[i % SHELF_TITLES.length]}</span></span>
          <span><span className="skeleton-shimmer skeleton-text">{SHELF_ARTISTS[i % SHELF_ARTISTS.length]}</span></span>
        </div>
      ))}
    </>
  );
}

export function HotTakesPanelSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="home-hot-takes-item" aria-hidden="true">
          <span className="home-hot-takes-text home-snippet-skeleton">
            <span className="skeleton-shimmer skeleton-snippet-line" style={{ width: '100%' }} />
            <span className="skeleton-shimmer skeleton-snippet-line" style={{ width: i % 2 ? '68%' : '84%' }} />
          </span>
          <span className="home-hot-takes-date"><span className="skeleton-shimmer skeleton-text">99 Aug 2026</span></span>
        </div>
      ))}
      <span className="home-hot-takes-viewall" aria-hidden="true"><span className="skeleton-shimmer skeleton-text skeleton-text-inline">View all →</span></span>
    </>
  );
}
