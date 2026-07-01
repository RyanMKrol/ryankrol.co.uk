import { useState } from 'react';
import { bookCoverUrl } from '../lib/openlibrary';

/**
 * Google Books search + confirm component for the book add flow.
 *
 * Props:
 *   title    - the book title from the form (used as search param)
 *   author   - the book author from the form (used as search param)
 *   onSelect - called with book metadata on confirm, or null when cleared
 */
export default function BookSearch({ title = '', author = '', onSelect }) {
  const [results, setResults] = useState(null); // null = not yet searched
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const search = async () => {
    if (!title.trim()) return;
    setSearching(true);
    setError('');
    setResults(null);
    setSelected(null);
    if (onSelect) onSelect(null);

    try {
      const params = new URLSearchParams({ title: title.trim() });
      if (author.trim()) params.set('author', author.trim());
      const res = await fetch(`/api/books/search?${params}`);
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
        source: result.source,
        olid: result.olid,
        coverId: result.coverId,
        coverUrl: result.coverUrl,
        volumeId: result.volumeId,
        bookAuthors: result.authors,
        firstPublishedYear: result.firstPublishedYear,
        isbn: result.isbn,
        subjects: result.subjects,
        pageCount: result.pageCount,
        publisher: result.publisher,
      });
    }
  };

  const handleClear = () => {
    setSelected(null);
    setResults(null);
    if (onSelect) onSelect(null);
  };

  const providerLabel = 'Google Books';

  const getCoverSrc = (r) => {
    if (r.coverUrl) return r.coverUrl;
    if (r.coverId) return bookCoverUrl(r.coverId, 'S');
    return null;
  };

  return (
    <div className="book-search">
      <div className="book-search-row">
        <button
          type="button"
          className="form-button book-search-btn"
          onClick={search}
          disabled={searching || !title.trim()}
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {selected && (
        <div className="book-confirmed">
          <span className="book-confirmed-label">✓ {providerLabel} match selected:</span>
          <strong> {selected.title}</strong>
          {selected.firstPublishedYear && (
            <span className="book-confirmed-year"> ({selected.firstPublishedYear})</span>
          )}
          <button type="button" className="book-clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}

      {!selected && results !== null && (
        <div className="book-results">
          <p className="book-source-label">Results from {providerLabel}</p>
          {results.length === 0 ? (
            <p className="book-no-results">No results found for &ldquo;{title}&rdquo;.</p>
          ) : (
            results.map((r, i) => {
              const coverSrc = getCoverSrc(r);
              return (
                <div key={r.olid ?? r.volumeId ?? i} className="book-result-item">
                  {coverSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverSrc}
                      alt={r.title}
                      className="book-cover"
                      width={40}
                      height={60}
                    />
                  ) : (
                    <div className="book-cover book-cover-placeholder" />
                  )}
                  <div className="book-result-info">
                    <p className="book-result-title">
                      {r.title}
                      {r.firstPublishedYear && (
                        <span className="book-result-year"> ({r.firstPublishedYear})</span>
                      )}
                    </p>
                    {r.authors && r.authors.length > 0 && (
                      <p className="book-result-authors">{r.authors.join(', ')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="form-button book-select-btn"
                    onClick={() => handleSelect(r)}
                  >
                    Select
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      <style jsx>{`
        .book-search {
          margin-bottom: 0;
        }
        .book-search-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .book-search-btn,
        .book-select-btn {
          white-space: nowrap;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
        .book-source-label {
          font-size: 0.8rem;
          opacity: 0.6;
          margin: 0 0 0.4rem;
        }
        .book-confirmed {
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
        .book-confirmed-label {
          color: var(--color-accent);
          font-weight: 600;
        }
        .book-confirmed-year {
          opacity: 0.7;
        }
        .book-clear-btn {
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
        .book-clear-btn:hover {
          border-color: var(--color-accent);
          color: var(--color-accent);
        }
        .book-results {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }
        .book-no-results {
          font-size: 0.9rem;
          opacity: 0.7;
          margin: 0;
        }
        .book-result-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          padding: 0.5rem;
          border: 1px solid var(--color-border, #333);
          border-radius: 4px;
        }
        .book-cover {
          object-fit: cover;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .book-cover-placeholder {
          width: 40px;
          height: 60px;
          background: var(--color-border, #333);
          border-radius: 3px;
          flex-shrink: 0;
        }
        .book-result-info {
          flex: 1;
          min-width: 0;
        }
        .book-result-title {
          font-weight: 600;
          font-size: 0.9rem;
          margin: 0 0 0.25rem;
        }
        .book-result-year {
          font-weight: 400;
          opacity: 0.7;
        }
        .book-result-authors {
          font-size: 0.8rem;
          opacity: 0.8;
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
