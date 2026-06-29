import { useState } from 'react';
import { tmdbPosterUrl } from '../lib/tmdb';

/**
 * Reusable TMDB search + confirm component.
 *
 * Props:
 *   mediaType  - 'movie' | 'tv'
 *   query      - the search term (driven by the parent's title field)
 *   onSelect   - called with { tmdbId, mediaType, posterPath, overview, date } on confirm,
 *                or with null when the selection is cleared
 */
export default function TmdbSearch({ mediaType, query = '', onSelect }) {
  const [results, setResults] = useState(null); // null = not yet searched
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setResults(null);
    setSelected(null);
    if (onSelect) onSelect(null);

    try {
      const res = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(query.trim())}&type=${mediaType}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (result) => {
    setSelected(result);
    if (onSelect) {
      onSelect({
        tmdbId: result.tmdbId,
        mediaType: result.mediaType,
        posterPath: result.posterPath,
        overview: result.overview,
        date: result.date,
      });
    }
  };

  const handleClear = () => {
    setSelected(null);
    setResults(null);
    if (onSelect) onSelect(null);
  };

  return (
    <div className="tmdb-search">
      <div className="tmdb-search-row">
        <button
          type="button"
          className="form-button tmdb-search-btn"
          onClick={search}
          disabled={searching || !query.trim()}
        >
          {searching ? 'Searching…' : 'Search TMDB'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {selected && (
        <div className="tmdb-confirmed">
          <span className="tmdb-confirmed-label">✓ TMDB match selected:</span>
          <strong> {selected.title}</strong>
          {selected.date && <span className="tmdb-confirmed-date"> ({selected.date.slice(0, 4)})</span>}
          <button type="button" className="tmdb-clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}

      {!selected && results !== null && (
        <div className="tmdb-results">
          {results.length === 0 ? (
            <p className="tmdb-no-results">No results found for &ldquo;{query}&rdquo;.</p>
          ) : (
            results.map((r) => (
              <div key={r.tmdbId} className="tmdb-result-item">
                {tmdbPosterUrl(r.posterPath) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tmdbPosterUrl(r.posterPath)}
                    alt={r.title}
                    className="tmdb-poster"
                    width={60}
                    height={90}
                  />
                ) : (
                  <div className="tmdb-poster tmdb-poster-placeholder" />
                )}
                <div className="tmdb-result-info">
                  <p className="tmdb-result-title">
                    {r.title}
                    {r.date && <span className="tmdb-result-year"> ({r.date.slice(0, 4)})</span>}
                  </p>
                  {r.overview && (
                    <p className="tmdb-result-overview">{r.overview.slice(0, 160)}{r.overview.length > 160 ? '…' : ''}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="form-button tmdb-select-btn"
                  onClick={() => handleSelect(r)}
                >
                  Select
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .tmdb-search {
          margin-bottom: 0;
        }
        .tmdb-search-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .tmdb-search-btn,
        .tmdb-select-btn {
          white-space: nowrap;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
        .tmdb-confirmed {
          margin-top: 0.6rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--color-accent);
          border-radius: 4px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-wrap: wrap;
        }
        .tmdb-confirmed-label {
          color: var(--color-accent);
          font-weight: 600;
        }
        .tmdb-confirmed-date {
          opacity: 0.7;
        }
        .tmdb-clear-btn {
          margin-left: auto;
          background: none;
          border: 1px solid var(--color-text);
          color: var(--color-text);
          padding: 0.2rem 0.6rem;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.8rem;
          font-family: inherit;
        }
        .tmdb-clear-btn:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
        }
        .tmdb-results {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .tmdb-no-results {
          font-size: 0.9rem;
          opacity: 0.7;
          margin: 0;
        }
        .tmdb-result-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          padding: 0.5rem;
          border: 1px solid var(--color-border, #333);
          border-radius: 4px;
        }
        .tmdb-poster {
          object-fit: cover;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .tmdb-poster-placeholder {
          width: 60px;
          height: 90px;
          background: var(--color-border, #333);
          border-radius: 3px;
          flex-shrink: 0;
        }
        .tmdb-result-info {
          flex: 1;
          min-width: 0;
        }
        .tmdb-result-title {
          font-weight: 600;
          font-size: 0.9rem;
          margin: 0 0 0.25rem;
        }
        .tmdb-result-year {
          font-weight: 400;
          opacity: 0.7;
        }
        .tmdb-result-overview {
          font-size: 0.8rem;
          opacity: 0.8;
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
