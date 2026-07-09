/**
 * Loading placeholders for the home page's per-section reveal (T339). Each piece mirrors the
 * real content's DOM shape (grid columns, card rows) so swapping skeleton → real content causes
 * no layout shift. Shimmer comes from the shared `.skeleton-shimmer` utility in globals.css.
 */

export function StatBlockSkeleton() {
  return (
    <div className="collection-stat-block neutral skeleton-stat-block">
      <div className="skeleton-shimmer skeleton-stat-value" />
      <div className="skeleton-shimmer skeleton-stat-label" />
    </div>
  );
}

export function TileGridSkeleton({ count = 18 }) {
  return (
    <div className="home-wall-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="cover-tile-wrap">
          <div className="cover-tile skeleton-shimmer" style={{ aspectRatio: '1 / 1' }} />
        </div>
      ))}
    </div>
  );
}

export function CardRowSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="home-latest-card">
          <div className="home-latest-thumb skeleton-shimmer" />
          <div className="home-latest-body">
            <div className="skeleton-shimmer skeleton-line skeleton-line-title" />
            <div className="skeleton-shimmer skeleton-line skeleton-line-snippet" />
          </div>
        </div>
      ))}
    </>
  );
}

export function GymPanelStatsSkeleton() {
  return (
    <>
      <div className="home-gym-stats">
        <div className="skeleton-shimmer skeleton-line skeleton-gym-stat" />
        <div className="skeleton-shimmer skeleton-line skeleton-gym-stat" />
      </div>
      <div className="skeleton-shimmer skeleton-sparkline" />
    </>
  );
}

export function ListRowSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-shimmer skeleton-line skeleton-list-row" />
      ))}
    </>
  );
}
