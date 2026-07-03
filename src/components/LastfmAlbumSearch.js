import { useState } from 'react';

/**
 * Last.fm album search + confirm component for album & vinyl add flows.
 *
 * Props:
 *   titleQuery - current value of the form's title field (drives the search)
 *   onSelect   - called with { title, artist, thumbnail, lastfm } on confirm,
 *                or null when the selection is cleared
 */
export default function LastfmAlbumSearch({ titleQuery = '', onSelect }) {
  const [results, setResults] = useState(null); // null = not yet searched
  const [searching, setSearching] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const search = async () => {
    if (!titleQuery.trim()) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
    setSearching(true);
    setError('');
    setResults(null);
    setSelected(null);
    if (onSelect) onSelect(null);

    try {
      const res = await fetch(`/api/lastfm/album-search?query=${encodeURIComponent(titleQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (result) => {
    setLoadingInfo(true);
    setError('');
    try {
      const url = result.mbid
        ? `/api/lastfm/album-info?mbid=${encodeURIComponent(result.mbid)}`
        : `/api/lastfm/album-info?artist=${encodeURIComponent(result.artist)}&album=${encodeURIComponent(result.title)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch album info');

      const info = data.info;
      setSelected({ ...result, image: info.image || result.image });
      if (onSelect) {
        onSelect({
          title: info.title || result.title,
          artist: info.artist || result.artist,
          thumbnail: info.image || result.image || '',
          lastfm: {
            mbid: info.mbid || '',
            url: info.url || '',
            listeners: info.listeners || 0,
            playcount: info.playcount || 0,
            tags: info.tags || [],
            trackCount: info.trackCount || 0,
            summary: info.summary || '',
            releaseDate: info.releaseDate || '',
            images: info.images || {},
          },
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleClear = () => {
    setSelected(null);
    setResults(null);
    if (onSelect) onSelect(null);
  };

  return (
    <div className="lastfm-search">
      <div className="lastfm-search-row">
        <button
          type="button"
          className="collection-form-button lastfm-search-btn"
          onClick={search}
          disabled={searching || cooldown || loadingInfo || !titleQuery.trim()}
        >
          {searching ? 'Searching…' : 'Search Last.fm'}
        </button>
      </div>

      {error && <p className="collection-form-message collection-form-message-error">{error}</p>}

      {loadingInfo && <p className="lastfm-loading">Loading album info…</p>}

      {selected && !loadingInfo && (
        <div className="lastfm-confirmed">
          {selected.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.image}
              alt={selected.title}
              className="lastfm-confirmed-cover"
              width={40}
              height={40}
            />
          )}
          <span className="lastfm-confirmed-label">✓ Last.fm match selected:</span>
          <strong> {selected.title}</strong>
          {selected.artist && <span className="lastfm-confirmed-artist"> — {selected.artist}</span>}
          <button type="button" className="lastfm-clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}

      {!selected && results !== null && (
        <div className="lastfm-results">
          {results.length === 0 ? (
            <p className="lastfm-no-results">No results found for &ldquo;{titleQuery}&rdquo;.</p>
          ) : (
            results.map((r, i) => (
              <div key={r.mbid || i} className="lastfm-result-item">
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image}
                    alt={r.title}
                    className="lastfm-cover"
                    width={50}
                    height={50}
                  />
                ) : (
                  <div className="lastfm-cover lastfm-cover-placeholder" />
                )}
                <div className="lastfm-result-info">
                  <p className="lastfm-result-title">{r.title}</p>
                  {r.artist && <p className="lastfm-result-artist">{r.artist}</p>}
                </div>
                <button
                  type="button"
                  className="collection-form-button lastfm-select-btn"
                  onClick={() => handleSelect(r)}
                  disabled={loadingInfo}
                >
                  Select
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .lastfm-search {
          margin-bottom: 0;
        }
        .lastfm-search-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .lastfm-search-btn,
        .lastfm-select-btn {
          white-space: nowrap;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
        .lastfm-loading {
          font-size: 0.9rem;
          opacity: 0.7;
          margin: 0.5rem 0 0;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
        .lastfm-confirmed {
          margin-top: 0.6rem;
          padding: 0.5rem 0.75rem;
          border: var(--border-width) solid var(--accent-albums);
          border-radius: var(--radius-stat);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .lastfm-confirmed-cover {
          object-fit: cover;
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .lastfm-confirmed-label {
          color: var(--accent-albums);
          font-weight: 700;
        }
        .lastfm-confirmed-artist {
          opacity: 0.7;
        }
        .lastfm-clear-btn {
          margin-left: auto;
          background: none;
          border: var(--border-width) solid var(--color-ink);
          color: var(--color-ink);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-pill);
          cursor: pointer;
          font-size: 0.8rem;
          font-family: inherit;
        }
        .lastfm-clear-btn:hover {
          border-color: var(--accent-albums);
          color: var(--accent-albums);
        }
        .lastfm-results {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .lastfm-no-results {
          font-size: 0.9rem;
          opacity: 0.7;
          margin: 0;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
        .lastfm-result-item {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          padding: 0.5rem;
          border: var(--border-width) solid var(--color-hairline-strong);
          border-radius: var(--radius-cover);
        }
        .lastfm-cover {
          object-fit: cover;
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .lastfm-cover-placeholder {
          width: 50px;
          height: 50px;
          background: var(--color-hairline);
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .lastfm-result-info {
          flex: 1;
          min-width: 0;
        }
        .lastfm-result-title {
          font-weight: 600;
          font-size: 0.9rem;
          margin: 0 0 0.25rem;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
        .lastfm-result-artist {
          font-size: 0.8rem;
          opacity: 0.8;
          margin: 0;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
      `}</style>
    </div>
  );
}
