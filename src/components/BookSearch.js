import { useState } from 'react';
import { bookCoverUrl } from '../lib/openlibrary';

/**
 * Open Library search + confirm component for the book add flow.
 *
 * Props:
 *   initialQuery - pre-fill the search box (usually the title field value)
 *   onSelect     - called with book metadata on confirm, or null when cleared
 */
export default function BookSearch({ initialQuery = '', onSelect }) {
  const [query, setQuery] = useState(initialQuery);
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
      const res = await fetch(`/api/books/search?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search();
    }
  };

  const handleSelect = (result) => {
    setSelected(result);
    if (onSelect) {
      onSelect({
        olid: result.olid,
        coverId: result.coverId,
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

  return (
    <div className="book-search">
      <div className="book-search-row">
        <input
          type="text"
          className="form-input book-search-input"
          placeholder="Search Open Library for this book…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={searching}
        />
        <button
          type="button"
          className="form-button book-search-btn"
          onClick={search}
          disabled={searching || !query.trim()}
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {selected && (
        <div className="book-confirmed">
          <span className="book-confirmed-label">✓ Open Library match selected:</span>
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
          {results.length === 0 ? (
            <p className="book-no-results">No results found for &ldquo;{query}&rdquo;.</p>
          ) : (
            results.map((r, i) => (
              <div key={r.olid ?? i} className="book-result-item">
                {bookCoverUrl(r.coverId) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bookCoverUrl(r.coverId, 'S')}
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
            ))
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
        }
        .book-search-input {
          flex: 1;
          margin-bottom: 0;
        }
        .book-search-btn,
        .book-select-btn {
          white-space: nowrap;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
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
